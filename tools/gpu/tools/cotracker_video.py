"""cotracker_video.py -- Code-Video shared tool: CoTracker3 (Meta, offline model) tracks query points through a project's
frames, job by job.
  python cotracker_video.py --project <project folder> [job names...]          (the project's run_ct.bat calls this)
Project folder (only output\\ct\\ is written there):
  ct_jobs.json    [{"name": "ref_A", "zip": "a.zip|b.zip" (or "dir": "frames"), "prefix": "", "first": 0, "last": 63,
                    "queries": "<key in ct_queries.npz>"}, ...] -- frame i is <prefix>f<iii>.png inside the zip(s) / folder,
                    iii = i (or i - first when a prefix is given: calibration sequences are numbered from 0)
  ct_queries.npz  per job: <key> float32 [N, 3] = (absolute frame, x, y) in the frames' own pixels
Output: output\\ct\\<job>.npz with tracks [T, N, 2] (pixels), vis [T, N] (bool), queries [N, 3], first (the job's first
frame); output\\ct\\log.txt. A job whose npz exists is skipped (delete it to re-run), unless jobs are named on the command line.
Environment: Code-Video\\env (CV_ENV env var; the run_ct.bat sets it): venv with torch, ct_repo\\ (CoTracker3 code) and
ckpt\\scaled_offline.pth (its weights) -- both installed by env\\setup_env.bat (bootstrap.py); nothing is downloaded here.
GPU memory: queries go in chunks (CT_CHUNK, default 512); a chunk that runs out of memory is retried in halves."""
import os, sys, json, time, zipfile, pathlib, traceback
import numpy as np
from PIL import Image

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
HERE = pathlib.Path(arg('--project', '.')).resolve()
ENV = pathlib.Path(os.environ.get('CV_ENV') or pathlib.Path(__file__).resolve().parent.parent / 'env')
ONLY = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] != '--project']
OUT = HERE / 'output' / 'ct'; OUT.mkdir(parents=True, exist_ok=True)
log = open(OUT / 'log.txt', 'a', encoding='utf-8')


def P(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); log.write(s + '\n'); log.flush()


def frames(job):
    """the job's frames as uint8 [T, H, W, 3], from its zip(s) or folder"""
    names = [job.get('prefix', '') + 'f%03d.png' % (i if not job.get('prefix') else i - job['first']) for i in range(job['first'], job['last'] + 1)]
    out = []
    if 'dir' in job:
        d = HERE / job['dir']
        for n in names: out.append(np.array(Image.open(d / n).convert('RGB')))
    else:
        zips = [zipfile.ZipFile(HERE / z) for z in job['zip'].split('|')]
        have = [set(z.namelist()) for z in zips]
        for n in names:
            for z, h in zip(zips, have):
                if n in h: out.append(np.array(Image.open(z.open(n)).convert('RGB'))); break
            else: raise FileNotFoundError('%s (job %s)' % (n, job['name']))
    return np.stack(out, 0)


def main():
    P('=== %s  project %s  env %s' % (time.strftime('%Y-%m-%d %H:%M:%S'), HERE, ENV))
    repo, ck = ENV / 'ct_repo', ENV / 'ckpt' / 'scaled_offline.pth'
    if not (repo / 'cotracker' / 'predictor.py').exists() or not ck.exists():
        P('!! CoTracker3 is not installed in %s (need ct_repo\\cotracker and ckpt\\scaled_offline.pth). Run env\\setup_env.bat.' % ENV)
        sys.exit(2)
    jobs = json.load(open(HERE / 'ct_jobs.json', encoding='utf-8')); Q = np.load(HERE / 'ct_queries.npz')
    todo = [j for j in jobs if j['name'] in ONLY] if ONLY else [j for j in jobs if not (OUT / (j['name'] + '.npz')).exists()]
    for j in jobs:
        if j not in todo and not ONLY: P('skip (done)', j['name'])
    if not todo: P('nothing to do:', sorted(p.name for p in OUT.glob('*.npz'))); return
    if os.environ.get('CT_DRYRUN'):                      # check the inputs only: frames and queries of every job, no model
        for j in todo:
            V = frames(j); q = Q[j['queries']]
            P('dry %-10s frames %d %s  queries %d  query frames %s' % (j['name'], len(V), V.shape[1:3], len(q), sorted(set(int(x) for x in q[:, 0]))))
        return
    import torch
    sys.path.insert(0, str(repo))
    from cotracker.predictor import CoTrackerPredictor
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    P('device', dev, torch.cuda.get_device_name(0) if dev == 'cuda' else '(no GPU: slow)', 'torch', torch.__version__)
    pred = CoTrackerPredictor(checkpoint=str(ck), offline=True, window_len=60).to(dev)
    CHUNK = int(os.environ.get('CT_CHUNK', '512'))
    for job in todo:
        t0 = time.time()
        V = frames(job); T = len(V)
        q = Q[job['queries']].astype(np.float32).copy(); N = len(q)
        qr = q.copy(); qr[:, 0] -= job['first']                        # frame index inside the job
        video = torch.from_numpy(V).permute(0, 3, 1, 2)[None].float().to(dev)
        tracks = np.zeros((T, N, 2), np.float32); vis = np.zeros((T, N), bool)
        for a in range(0, N, CHUNK):
            qt = torch.from_numpy(qr[a:a + CHUNK])[None].to(dev)
            try:
                with torch.no_grad(): tr, vi = pred(video, queries=qt, backward_tracking=True)
            except torch.cuda.OutOfMemoryError:
                torch.cuda.empty_cache(); P('  out of GPU memory: the chunk again in halves')
                half = qt.shape[1] // 2; parts = []
                for b in (qt[:, :half], qt[:, half:]):
                    with torch.no_grad(): parts.append(pred(video, queries=b, backward_tracking=True))
                tr = torch.cat([p[0] for p in parts], 2); vi = torch.cat([p[1] for p in parts], 2)
            tracks[:, a:a + CHUNK] = tr[0].float().cpu().numpy(); vis[:, a:a + CHUNK] = vi[0].cpu().numpy()
            P('  %s points %d-%d of %d' % (job['name'], a, min(N, a + CHUNK), N))
        np.savez_compressed(OUT / (job['name'] + '.npz'), tracks=tracks, vis=vis, queries=q, first=job['first'])
        P('%s: %d frames, %d points, %.0f s' % (job['name'], T, N, time.time() - t0))
        del video
        if dev == 'cuda': torch.cuda.empty_cache()
    P('done:', sorted(p.name for p in OUT.glob('*.npz')))


try:
    main()
except SystemExit:
    raise
except Exception:
    P('!! ERROR'); P(traceback.format_exc()); sys.exit(1)
