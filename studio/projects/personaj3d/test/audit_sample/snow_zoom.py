"""SNOW FIELD: particle count / size per shot and the motion field -- measuring a change that looks like a "camera zoom"
(pass 8; the user: "after 10 a bigger-smaller shift that looks like a camera zoom"). The same code on both sides:
320x180 LANCZOS, L; particle = top-hat (L - median9) > 28 (compare.occlusion.particles), only the BACKGROUND box -- per
shot, right of the character (sample and ours, head + hair + hood): shot 1 x >= 170, shot 2 x >= 200, shot 3 x >= 245
(checked on a sheet; the first version, x >= 144, counted our hair as "big particles" in shots 2 and 3: p99 15 / 32).
Particle count -- per 10 000 px.
  A. Per frame: particle count, area p90 / p99, peak L.
  C. Continuity across a cut: 10->11 (within a shot), 11->12 and 13->14 (cuts) -- the phase-correlation peak r.
  B. Per pair (within a shot): the right part is split into 3x3 cells, in each cell the phase correlation of the particle
     top-hat images -> (dx, dy); an affine field over the cell centres dx = a + b x + c y, dy = d + e x + f y:
     shift (a, d) at the middle of the cell centres, DIVERGENCE b + f (1/frame; for a zoom s ~ 2 (s - 1)), rotation e - c.
Calibration (--calibrate): sample k05 against itself (0), shifted by 2 px (+2, 0; div 0), enlarged 1.02 times about the
centre (div ~ +0.04) and 0.98 (div ~ -0.04) -- the result is printed below.
python3 test/audit_sample/snow_zoom.py [--calibrate] FOLDER...   (FOLDER: %03d.png, 0-based; 'sample' -- the target k%02d.png)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../../tools/compare'))  # tools/compare
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
import cv2
sys.path.insert(0, (COMPARE_DIR))
from compare.occlusion import particles

SHOT = {'1': list(range(1, 12)), '2': [12, 13], '3': list(range(14, 23))}
BOX_X = {'1': 170, '2': 200, '3': 245}
def x0k(k): return BOX_X['1' if k <= 11 else '2' if k <= 13 else '3']

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, dtype=float)

def file(d, k): return (SAMPLE_DIR + '/k%02d.png') % k if d == 'sample' else '%s/%03d.png' % (d, k - 1)

def tophat(a):
    t = a - ndimage.median_filter(a, 9)
    return np.clip(t, 0, None) * particles(a)       # particle pixels only (the rest 0)

def stats(a, X0):
    m = particles(a)[:, X0:]
    lab, n = ndimage.label(m)
    if not n: return 0, 0, 0, 0
    s = ndimage.sum(m, lab, range(1, n + 1)); pk = ndimage.maximum(a[:, X0:], lab, range(1, n + 1))
    return n * 1e4 / m.size, float(np.percentile(s, 90)), float(np.percentile(s, 99)), float(np.median(pk))

def area(a, b, X0=144):
    """the a -> b motion field: 3x3 cells, a phase correlation in each; an affine fit."""
    ta, tb = tophat(a)[:, X0:].astype(np.float32), tophat(b)[:, X0:].astype(np.float32)
    H, W = ta.shape; P, Q, V = [], [], []
    for i in range(3):
        for j in range(3):
            y0, y1, x0, x1 = i * H // 3, (i + 1) * H // 3, j * W // 3, (j + 1) * W // 3
            ca, cb = ta[y0:y1, x0:x1], tb[y0:y1, x0:x1]
            if ca.sum() < 50 or cb.sum() < 50: continue
            win = cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_32F)
            (dx, dy), r = cv2.phaseCorrelate(ca, cb, win)
            if r < 0.05: continue
            P.append([1.0, (x0 + x1) / 2 - W / 2, (y0 + y1) / 2 - H / 2]); Q.append(dx); V.append(dy)
    if len(P) < 5: return None
    P = np.array(P); cx = np.linalg.lstsq(P, np.array(Q), rcond=None)[0]; cy = np.linalg.lstsq(P, np.array(V), rcond=None)[0]
    return dict(dx=cx[0], dy=cy[0], div=cx[1] + cy[2], rot=cy[1] - cx[2], n=len(P))

def cut(d, i, j, X0=200):
    """the snow-field shift between neighbouring frames (across a cut too) and the correlation peak r: in the sample the
    layer is continuous (r ~0.7 both within a shot and across a cut), with redrawn snow r ~0.0-0.1"""
    ta, tb = tophat(L(file(d, i)))[:, X0:].astype(np.float32), tophat(L(file(d, j)))[:, X0:].astype(np.float32)
    win = cv2.createHanningWindow((ta.shape[1], ta.shape[0]), cv2.CV_32F)
    (dx, dy), r = cv2.phaseCorrelate(ta, tb, win)
    return dx, dy, r

def calibrate():
    a = L(file('sample', 5)); H, W = a.shape
    def zoom(s):
        M = cv2.getRotationMatrix2D((144 + (W - 144) / 2, H / 2), 0, s)
        return cv2.warpAffine(a.astype(np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(float)
    sh = np.roll(a, 2, axis=1)
    for name, b, expected in (('itself', a,'dx 0, div 0'), ('+2 px', sh, 'dx +2, div 0'), ('zoom 1.02', zoom(1.02), 'div ~+0.04'), ('zoom 0.98', zoom(0.98), 'div ~-0.04')):
        m = area(a, b)
        print('CALIBRATION %-10s dx %+.2f dy %+.2f div %+.4f rot %+.4f (cells %d)   expected: %s'% (name, m['dx'], m['dy'], m['div'], m['rot'], m['n'], expected))

def measure(d):
    F = {k: L(file(d, k)) for k in range(1, 23)}
    st = {k: stats(F[k], x0k(k)) for k in F}
    out = {}
    for s, ks in SHOT.items():
        mv = [area(F[k], F[k + 1], BOX_X[s]) for k in ks[:-1]]; mv = [m for m in mv if m]
        out[s] = dict(count=np.mean([st[k][0] for k in ks]), p90=np.mean([st[k][1] for k in ks]), p99=np.mean([st[k][2] for k in ks]),
                      pk=np.mean([st[k][3] for k in ks]), dx=np.median([m['dx'] for m in mv]) if mv else np.nan,
                      dy=np.median([m['dy'] for m in mv]) if mv else np.nan, div=np.median([m['div'] for m in mv]) if mv else np.nan,
                      divs=[m['div'] for m in mv])
    return out, st

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--calibrate' in args: calibrate(); args = [x for x in args if x != '--calibrate']
    for d in args:
        o, st = measure(d)
        print('==', d.rstrip('/').split('/')[-1])
        for s, e in o.items():
            print('  shot %s: particles /10k px %5.0f  area p90 %.1f p99 %.1f  peak L %.0f | shift (%.2f, %.2f) px/frame  divergence %+.4f  [%s]'
                  % (s, e['count'], e['p90'], e['p99'], e['pk'], e['dx'], e['dy'], e['div'], ' '.join('%+.3f' % v for v in e['divs'])))
        print('  continuity across cuts (x >= 200, top-hat phase correlation): ' +'  '.join('%d->%d (%.1f, %.1f) r %.2f' % (i, j, *cut(d, i, j)) for i, j in ((10, 11), (11, 12), (13, 14))))
        print('  per frame count/10k: ' + ' '.join('%d' % st[k][0] for k in range(1, 23)))
        print('  per frame p99:  ' +' '.join('%.0f' % st[k][2] for k in range(1, 23)))
