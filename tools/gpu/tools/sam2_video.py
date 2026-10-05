"""sam2_video.py -- Code-Video shared tool: propagates SAM 2 prompts (points / boxes / masks) across a project's frames.
  python sam2_video.py --project <Projects\\name> [--model tiny|small|base_plus|large]   (Projects\\<name>\\run.bat calls this)
Project folder: frames\\*.png (sorted by name), prompts.json, prompts.npz, marks.json (optional) -- format in Code-Video\\README.md.
Each shot is its own video (cuts break propagation). Two passes: A -- prompts of the FIRST marked frame of each shot only
(the other marked frames are the check: never shown), B -- all prompts (production). Propagation forward and backward from the
prompted frames. Output: output\\masks_A.npz, masks_B.npz (object -> bool [N, H, W], conf_<object> [N] -- largest logit per frame;
hair = head minus face, derived when both exist), sheet_B_<object>.png, log.txt.
Environment: Code-Video\\env (CV_ENV env var; run.bat sets it) -- checkpoint from env\\ckpt; only output\\ is written in the project."""
import os, sys, json, time, pathlib, contextlib, urllib.request, shutil
import numpy as np
from PIL import Image, ImageDraw
import torch

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
HERE = pathlib.Path(arg('--project', '.')).resolve()                    # project folder
ENV = pathlib.Path(os.environ.get('CV_ENV') or pathlib.Path(__file__).resolve().parent.parent / 'env')   # shared environment (ckpt lives there)
OUT = HERE / 'output'; OUT.mkdir(exist_ok=True)
log = open(OUT / 'log.txt', 'w', encoding='utf-8')


def P(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); log.write(s + '\n'); log.flush()


FRAMES = sorted((HERE / 'frames').glob('*.png'))
N = len(FRAMES); W, H = Image.open(FRAMES[0]).size
PJ = json.load(open(HERE / 'prompts.json', encoding='utf-8')); PN = np.load(HERE / 'prompts.npz')
SHOT = {k: v for k, v in PJ['shot'].items()}
MARKS = json.load(open(HERE / 'marks.json', encoding='utf-8')) if (HERE / 'marks.json').exists() else {}; MARK = PJ.get('mark', {})
# ---- frames: PNG -> JPEG q100 no subsampling, one folder per shot, local index 0.. (SAM 2's loader reads a JPEG folder)
for s, fr in SHOT.items():
    d = HERE / 'frames_jpg' / s; d.mkdir(parents=True, exist_ok=True)
    for j, i in enumerate(fr):
        p = d / ('%05d.jpg' % j)
        if not p.exists(): Image.open(FRAMES[i]).convert('RGB').save(p, quality=100, subsampling=0)
P('project', HERE.name, 'frames', N, '%dx%d' % (W, H), 'shots', {s: len(v) for s, v in SHOT.items()})
OBJ = sorted({o for s in PJ['prompt'].values() for o in s})          # objects -- from prompts.json

# ---- model
model = arg('--model')
dev = 'cuda' if torch.cuda.is_available() else 'cpu'
vram = torch.cuda.get_device_properties(0).total_memory / 2 ** 30 if dev == 'cuda' else 0.0
if dev == 'cuda': P('GPU:', torch.cuda.get_device_name(0), '%.1f GB' % vram)
else: P("no GPU (torch.cuda.is_available() = False): running on CPU, slower")
model = model or ('large' if vram >= 8 else 'small')
CK = {'tiny': ('sam2.1_hiera_tiny.pt', 'configs/sam2.1/sam2.1_hiera_t.yaml'), 'small': ('sam2.1_hiera_small.pt', 'configs/sam2.1/sam2.1_hiera_s.yaml'),
      'base_plus': ('sam2.1_hiera_base_plus.pt', 'configs/sam2.1/sam2.1_hiera_b+.yaml'), 'large': ('sam2.1_hiera_large.pt', 'configs/sam2.1/sam2.1_hiera_l.yaml')}
ckname, cfg = CK[model]
ckpt = ENV / 'ckpt' / ckname
if not ckpt.exists():
    old = pathlib.Path.home() / 'Documents' / 'tungi-sam2' / 'ckpt' / ckname                    # old location (if not moved yet)
    if old.exists(): ckpt = old
    else: ckpt.parent.mkdir(parents=True, exist_ok=True); P('downloading', ckname); urllib.request.urlretrieve('https://dl.fbaipublicfiles.com/segment_anything_2/092824/' + ckname, ckpt)
P('ckpt', ckpt)
P('model', model, 'device', dev, 'torch', torch.__version__)
from sam2.build_sam import build_sam2_video_predictor
pred = build_sam2_video_predictor(cfg, str(ckpt), device=dev)
if dev == 'cuda' and torch.cuda.get_device_capability(0)[0] >= 8: ac = lambda: torch.autocast('cuda', dtype=torch.bfloat16)
else: ac = contextlib.nullcontext
offload = dev == 'cpu' or vram < 8


def run_pass(name, first_only):
    t0 = time.time()
    masks = {o: np.zeros((N, H, W), bool) for o in OBJ}; conf = {o: np.full(N, np.nan, np.float32) for o in OBJ}
    with ac():
        for s, fr in SHOT.items():
            st = pred.init_state(video_path=str(HERE / 'frames_jpg' / s), offload_video_to_cpu=offload, offload_state_to_cpu=offload)
            pr = PJ['prompt'].get(s, {}); used = []
            for oid, o in enumerate(OBJ, start=1):
                lst = pr.get(o, [])
                if first_only and lst: lst = [min(lst, key=lambda q: q['frame'])]
                for q in lst:
                    j = fr.index(q['frame']); used.append((o, q['frame']))
                    if 'mask' in q: pred.add_new_mask(st, j, oid, torch.from_numpy(np.ascontiguousarray(PN[q['mask']])))
                    else:
                        kw = dict(points=np.array(q['points'], np.float32), labels=np.array(q['labels'], np.int32))
                        if 'box' in q: kw['box'] = np.array(q['box'], np.float32)
                        pred.add_new_points_or_box(st, j, oid, **kw)
            P('  %s prompts:' % s, used)
            # forward from the first prompted frame, then BACKWARD (frames before it stayed empty in the first run)
            for rev in (False, True):
                for j, oids, logits in pred.propagate_in_video(st, reverse=rev):
                    for k, oid in enumerate(oids):
                        lg = logits[k, 0].float().cpu().numpy(); o = OBJ[oid - 1]
                        masks[o][fr[j]] = lg > 0; conf[o][fr[j]] = lg.max()
            try: pred.reset_state(st)
            except Exception: pass
    if 'head' in masks and 'face' in masks: masks['hair'] = masks['head'] & ~masks['face']; conf['hair'] = np.minimum(conf['head'], conf['face'])   # derived
    P('pass %s: %.0f s' % (name, time.time() - t0))
    for o in masks: P('  %-9s px per frame:' % o, [int(masks[o][i].sum()) for i in range(N)])
    np.savez_compressed(OUT / f'masks_{name}.npz', **masks, **{'conf_' + o: conf[o] for o in masks}, frames=np.arange(N))
    return masks


try:
    mA = run_pass('A', True)
    mB = run_pass('B', False)
except Exception:
    import traceback; P('!! error\n' + traceback.format_exc()); sys.exit(1)

# ---- contact sheets (pass B): all frames, mask tinted, human marks in yellow
S = max(1, round(960 / W))
PAL = [(255, 255, 120), (200, 80, 255), (255, 80, 80), (80, 160, 255), (80, 220, 80), (255, 160, 40), (80, 220, 220), (255, 120, 200)]
SHEET = list(mB); COL = {o: PAL[k % len(PAL)] for k, o in enumerate(SHEET)}
BY = {v: k for k, v in MARK.items() if k in MARKS}
for o in SHEET:
    tiles = []
    for i in range(N):
        im = np.array(Image.open(FRAMES[i]).convert('RGB')).astype(float)
        im = np.clip((im / 255) ** 0.6 * 255, 0, 255); m = mB[o][i]
        im[m] = im[m] * 0.45 + np.array(COL[o]) * 0.55
        t = Image.fromarray(im.astype(np.uint8)).resize((W * S, H * S), Image.NEAREST); d = ImageDraw.Draw(t)
        if i in BY:
            b = MARKS[BY[i]]
            for q, v in b.items():
                if isinstance(v, dict) and 'x' in v: d.ellipse([v['x'] * S - 3, v['y'] * S - 3, v['x'] * S + 3, v['y'] * S + 3], outline=(255, 255, 0))
                elif isinstance(v, dict) and 'pts' in v:
                    for x, y in v['pts']: d.ellipse([x * S - 2, y * S - 2, x * S + 2, y * S + 2], outline=(255, 255, 0))
        d.text((6, 6), '%s %s' % (o, FRAMES[i].stem), fill=(255, 255, 255)); tiles.append(t)
    cols = 4; rows = (N + cols - 1) // cols; sheet = Image.new('RGB', (cols * W * S, rows * H * S), (255, 255, 255))
    for j, t in enumerate(tiles): sheet.paste(t, ((j % cols) * W * S, (j // cols) * H * S))
    sheet.save(OUT / f'sheet_B_{o}.png')
P('done:', sorted(p.name for p in OUT.iterdir()))
