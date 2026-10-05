"""DIFFERENCE BETWEEN IMAGES and RHYTHM.

diff(a,b) = the mean of |nz(a) - nz(b)|; nz -- the frame normalised by its own mean and std
(so a brightness/contrast difference does not leak into the rhythm). 'drop' -- this share of
the most changed pixels is dropped (so a local burst does not hide the trend).

WARNING (pass 9): trend = the ratio of the first and the last PAIR -- a two-point
statistic. Print all the pairs (MAE) as well: when a single pair changes, the trend can get
worse while the overall match got better (shot 1: MAE 0.043 -> 0.029, while the trend went
+17.7% -> +7.7%).

diffmap: also splits the difference into left/right shares -- so that the figure and the
background (snow) changes show separately."""
import numpy as np
from PIL import Image, ImageDraw
from . import image


def nz(a):
    return (a - a.mean()) / (a.std() or 1.0)


def diff(a, b, drop=0.0):
    d = np.abs(nz(a) - nz(b)).ravel()
    if drop > 0:
        k = int(len(d) * (1 - drop))
        d = np.partition(d, k)[:k]
    return float(d.mean())


def pairs(prj, side, frames, drop=0.0):
    F = [image.load(prj.file(side, k), prj.size) for k in frames]
    return [diff(F[i], F[i + 1], drop) for i in range(len(F) - 1)]


def cuts(prj, side, threshold=1.6):
    v = np.array(pairs(prj, side, list(range(1, prj.n + 1))))
    m = float(np.median(v))
    return [i + 2 for i, x in enumerate(v) if x > m * threshold], v, m


def rhythm(prj, frames):
    q = []
    for t in ('sample', 'ours'):
        sp, v, m = cuts(prj, t)
        big = max(v[i - 2] for i in sp) / m if sp else 0
        q.append('%-6s cuts %s (median %.3f, largest %.2fx)' % (t.upper(), sp, m, big))
    for drop, lb in ((0.0, 'whole'), (0.10, '10% dropped')):
        ds, do = pairs(prj, 'sample', frames, drop), pairs(prj, 'ours', frames, drop)
        ts, to = (ds[-1] / ds[0] - 1) * 100, (do[-1] / do[0] - 1) * 100
        mae = float(np.mean(np.abs(np.array(ds) - np.array(do))))
        q.append('%-15s trend sample %+6.1f%%  ours %+6.1f%%   pairs MAE %.4f' % (lb, ts, to, mae))
        if drop == 0.0:
            q.append('   pairs sample: ' + ' '.join('%.3f' % x for x in ds))
            q.append('   pairs ours  : ' + ' '.join('%.3f' % x for x in do))
    return '\n'.join(q)


def diffmap(prj, frame_pairs, out, share=0.4, size=(480, 270)):
    tiles = []
    for (i, j) in frame_pairs:
        for t in ('sample', 'ours'):
            a = image.load(prj.file(t, i), prj.size)
            b = image.load(prj.file(t, j), prj.size)
            d = np.abs(nz(a) - nz(b))
            im = Image.fromarray(np.clip(d * 90, 0, 255).astype(np.uint8)).convert('RGB').resize(size, Image.NEAREST)
            dr = ImageDraw.Draw(im)
            w = d.shape[1]
            dr.text((4, 4), '%s %d-%d  mean %.3f' % (t.upper(), i, j, d.mean()), fill=(255, 220, 80))
            dr.text((4, 20), 'left%d%% %.3f  right %.3f' % (share * 100, d[:, :int(w * share)].mean(), d[:, int(w * share):].mean()), fill=(120, 255, 160))
            tiles.append(im)
    s = Image.new('RGB', (size[0] * 2 + 6, (size[1] + 6) * len(frame_pairs)))
    for k, t in enumerate(tiles):
        s.paste(t, ((k % 2) * (size[0] + 6), (k // 2) * (size[1] + 6)))
    s.save(out)
    return s
