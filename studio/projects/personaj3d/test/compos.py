"""COMPOSITION (3D) -- the same code as for the sample: the bright character mask (hair + face) is mask() in
personaj/test/composition.py (L>=90, top-hat so a snow particle is not counted, 2x2 opening). For each frame: centre
(as a share of the frame), bounds (1st and 99th percentile, robust to leftover particles), area %. Both sides 320x180 LANCZOS, then L."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from composition import mask
from PIL import Image

def load_frames(p):
    return [np.asarray(Image.open(f).convert('L').resize((320, 180), Image.LANCZOS), dtype=float) for f in sorted(glob.glob(p))]

def measure(L):
    m = mask(L); ys, xs = np.nonzero(m)
    if len(xs) < 20: return None
    return dict(cx=xs.mean() / 320, cy=ys.mean() / 180, x0=np.percentile(xs, 1) / 320, x1=np.percentile(xs, 99) / 320,
                y0=np.percentile(ys, 1) / 180, y1=np.percentile(ys, 99) / 180, a=m.mean() * 100)

SHOT = [(0, 11), (11, 13), (13, 22)]

def table(F, name):
    r = [measure(L) for L in F]
    print('--- %s ---' % name)
    for k, v in enumerate(r):
        print('  %2d ' % (k + 1) + ('-' if v is None else 'c(%.2f,%.2f) x %.2f-%.2f y %.2f-%.2f a %.1f%%' % (v['cx'], v['cy'], v['x0'], v['x1'], v['y0'], v['y1'], v['a'])))
    return r

def shotList(r):
    o = []
    for a, b in SHOT:
        v = [x for x in r[a:b] if x]
        o.append({k: float(np.mean([x[k] for x in v])) for k in v[0]} if v else None)
    return o

if __name__ == '__main__':
    M = table(load_frames((SAMPLE_DIR + '/k??.png')), 'SAMPLE')
    for p in sys.argv[1:]:
        B = table(load_frames(p), p)
        for i, (m, b) in enumerate(zip(shotList(M), shotList(B))):
            print('  shot %d: sample c(%.2f,%.2f) a %.1f | ours c(%.2f,%.2f) a %.1f | diff dx %+.2f dy %+.2f a x%.2f' % (
                i + 1, m['cx'], m['cy'], m['a'], b['cx'], b['cy'], b['a'], b['cx'] - m['cx'], b['cy'] - m['cy'], b['a'] / m['a']))
