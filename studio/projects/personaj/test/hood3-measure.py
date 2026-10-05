"""HOOD KEYS ON SCREEN (pass 12, shots 2 and 3) -- MEASURED from the sample, 320x180 L.
How it differs from hood3-brim.py of pass 12 step 1 (stale): the brim is NO longer a straight line (peak -> temple).
That line ran OVER the lining band in the sample -- in ours the band was left as a 'horn' in the
sky. Now the brim = the TOP EDGE of the lining band (measured in every column), and the lower
edge of the band is measured too. The keys are stored on screen (540x304): the hood is a separate
cloth on the shoulders, its place is measured as the sample's staging (where it stands); the head
is placed inside it (the head trace is separate -- traces.json).

  band   -- the lining under the brim (33..65, median 3, a box above the hair mass, the largest
            part; test/hood.py): top and low edge at 7 column keys (the x range split
            evenly), left end C (top of the leftmost column), right end E (the rightmost column)
  wedge  -- the inside of the hood (6.5..12, median 5, test/hood.py): tip A, right side R1-R2
            (a vertical edge or one sharp tip), lower tip B -- lines on the edges, intersections
            (the median eats sharp tips -- wedge_key)
  side   -- the brim below the wedge: on rows B.y+10 and B.y+30, the first head pixel to the
            right of B.x-30 (L >= 36, median 3)
  top_right -- the rightmost point of the outer mass at the top of the frame (rows 0..3): the
            hood line crosses the top of the frame here
  angle  -- the top-right-most point (largest x - y) of the part of the outer mass (12..32,
            median 7) ABOVE E: the top-right corner of the hood. The dense snow lower down
            (L 15..30) merges into the mass -- hence only above E.y.
Smoothed by [1,2,1]/4 within a shot (shot 2 has 2 drawings -- their mean).
python3 test/hood3-measure.py [--calibrate]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import image
import hood as KP

W = (PERSONAJ_DIR)
M = (SAMPLE_DIR + '/k%02d.png')
NK = 7
FRAME = {'2': [12, 13], '3': list(range(14, 23))}
SX, SY = 540 / 320, 304 / 180


def _poly_mask(v, shape, med):
    """polygon -> area share drawn at 4x > 0.5 -> median (the same as in the measurement)"""
    from PIL import Image, ImageDraw
    H, W_ = shape
    im = Image.new('L', (W_ * 4, H * 4), 0)
    ImageDraw.Draw(im).polygon([(x * 4 + 2, y * 4 + 2) for x, y in v], fill=255)
    f = np.asarray(im.resize((W_, H), Image.BOX)).astype(float) / 255 > 0.5
    return ndimage.median_filter(f.astype(np.uint8), med) > 0


def _fit(ys, xs):
    """x = a*y + b (least squares) -- the edges are measured row by row"""
    a, b = np.polyfit(np.asarray(ys, float), np.asarray(xs, float), 1)
    return a, b


def wedge_key(pm, angle_px=4, circle=4):
    """wedge: A (the tip, at the top), R1 and R2 (right side: late in shot 3 the right edge is VERTICAL --
    hair/lining cut it; at 14..16 a sharp tip, R1 = R2), B (the lower tip). The left edge is straight from A to B.
    Median 5 eats sharp tips (in the synthetic case the tip moves 5 px down) and keeps straight edges:
    the tips are NOT TAKEN from the mask. In each row, the left and right extremes of the mask (pixel
    centre +-0.5 -- the edge lies on the pixel boundary); a straight line x = a*y + b on the left edge and on
    the upper-right and lower-right edges (angle_px rows away from the tips; fewer on a short edge); the
    tips -- the intersections."""
    ys = np.unique(np.nonzero(pm)[0])
    xl = np.array([np.nonzero(pm[y])[0].min() for y in ys]) - 0.5
    xr = np.array([np.nonzero(pm[y])[0].max() for y in ys]) + 0.5
    xm = xr.max()
    right = ys[xr >= xm - 1]
    vertical = (right.max() - right.min()) >= 10
    yA, yB = float(ys.min()) - 0.5, float(ys.max()) + 0.5
    yR1, yR2 = float(right.min()), float(right.max())

    def pick(y0, y1):
        m = max(1.0, min(angle_px, (y1 - y0 - 3) / 2))
        return (ys > y0 + m) & (ys < y1 - m)
    fL = fU = fD = None
    for _ in range(circle):
        s_l, s_u, s_d = pick(yA, yB), pick(yA, yR1), pick(yR2, yB)
        if s_l.sum() >= 3: fL = _fit(ys[s_l], xl[s_l])
        if s_u.sum() >= 3: fU = _fit(ys[s_u], xr[s_u])
        if s_d.sum() >= 3: fD = _fit(ys[s_d], xr[s_d])
        if fL is not None and fU is not None:
            yA = (fU[1] - fL[1]) / (fL[0] - fU[0])
        if fL is not None and fD is not None:
            yB = (fD[1] - fL[1]) / (fL[0] - fD[0])
        if vertical:
            if fU is not None and abs(fU[0]) > 1e-6: yR1 = (xm - fU[1]) / fU[0]
            if fD is not None and abs(fD[0]) > 1e-6: yR2 = (xm - fD[1]) / fD[0]
        elif fU is not None and fD is not None:
            yR1 = yR2 = (fD[1] - fU[1]) / (fU[0] - fD[0])
    # a tip whose edge line was not found (short edge) -- from the mask itself (what the median ate stays lost)
    linef = lambda f, y, v: f[0] * y + f[1] if f is not None else v
    A = [linef(fL, yA, xl[0] + 0.5), yA]
    B = [linef(fL, yB, xl[-1] + 0.5), yB]
    R1 = [linef(fU, yR1, xm), yR1]
    R2 = [linef(fD, yR2, xm), yR2]
    return [[float(round(v, 2)) for v in p] for p in (A, R1, R2, B)]


def key_list(L):
    o = KP.measure(L)
    s, ta, po, ma = o['hair'], o['band'], o['wedge'], o['mass']
    r = {}
    m = ta['msk']; ys, xs = np.nonzero(m)
    x0, x1 = int(xs.min()), int(xs.max())
    kx = np.linspace(x0, x1, NK)
    top, low = [], []
    for x in kx:
        # 3 columns around the key column (median) -- a single column is noisy
        c = [int(round(x)) + d for d in (-1, 0, 1) if x0 <= int(round(x)) + d <= x1 and (xs == int(round(x)) + d).any()]
        top.append([float(x), float(np.median([ys[xs == cc].min() for cc in c]))])
        low.append([float(x), float(np.median([ys[xs == cc].max() for cc in c]))])
    r['top'], r['low'] = top, low
    pm = po['msk']
    r['A'], r['R1'], r['R2'], r['B'] = wedge_key(pm)
    head = ndimage.median_filter(L, 3) >= 36
    side = []
    for dy in (10, 30):
        y = int(min(170, r['B'][1] + dy)); xl = int(r['B'][0] - 30)
        row = head[y, xl:xl + 80]
        if row.any():
            side.append([float(xl + int(np.argmax(row))), float(y)])
    r['side'] = side
    ys_, xs_ = np.nonzero(ma['msk'][:4]); r['top_right'] = [float(xs_.max()) + 0.5, 0.0] if len(xs_) else [0.0, 0.0]
    mm = ma['msk'].copy(); mm[int(r['top'][-1][1]):, :] = False
    yy, xx = np.nonzero(mm); j = int(np.argmax(xx - yy)); r['angle'] = [float(xx[j]), float(yy[j])]
    r['_band_area'] = int(m.sum()); r['_wedge_area'] = int(pm.sum())
    return r


def calibrate():
    """synthetic: outer L 19 (the mass), a hair L 100 box, the lining band -- its top edge a known
    straight line, its thickness known; wedge -- a known triangle (sharp right tip) and a quadrilateral
    with a VERTICAL right edge."""
    rng = np.random.default_rng(4)
    from matplotlib.path import Path
    TIP = [[135, 60], [158, 82], [158, 82], [140, 106]]
    VERTICAL = [[135, 60], [160, 80], [160, 96], [142, 106]]

    def make(dx=0, dy=0, qal=12, wedge=TIP):
        L = np.full((180, 320), 3.0)
        L[rng.random((180, 320)) < 0.02] = 200
        L[0:180, 0:230] = 19
        L[90 + dy:130 + dy, 160 + dx:215 + dx] = 100            # hair
        L[130 + dy:170 + dy, 150 + dx:200 + dx] = 60            # face
        yy, xx = np.mgrid[0:180, 0:320]
        top_edge = 80 + dy - (xx - 160 - dx) * 0.3                   # band top edge: 80 at x 160, 63.5 at x 215
        bandMask = (xx >= 160 + dx) & (xx <= 215 + dx) & (yy >= top_edge) & (yy < top_edge + qal)
        L[bandMask] = 45
        P = Path(np.array([p for i, p in enumerate(wedge) if i != 2 or wedge[2] != wedge[1]]) + [dx, dy])
        ins = P.contains_points(np.c_[xx.ravel(), yy.ravel()]).reshape(L.shape)
        L[ins] = 8
        L[112 + dy:175, 0:125 + dx] = 19
        return L

    a = key_list(make()); b = key_list(make(dx=4, dy=3)); c = key_list(make(qal=6)); t = key_list(make(wedge=VERTICAL))
    # top edge: at key x the expected y = 80 - (x-160)*0.3 (+-1: pixel boundary)
    e1 = max(abs(y - (80 - (x - 160) * 0.3)) for x, y in a['top'])
    q_a = np.mean([p[1] - t_[1] for t_, p in zip(a['top'], a['low'])]); q_c = np.mean([p[1] - t_[1] for t_, p in zip(c['top'], c['low'])])
    r1 = e1 <= 1.0 and abs(q_a - 11) <= 1.0 and abs(q_c - 5) <= 1.0
    d = [np.subtract(b[n], a[n]) for n in ('A', 'R1', 'R2', 'B')]
    r2 = all(abs(v[0] - 4) <= 0.6 and abs(v[1] - 3) <= 0.6 for v in d)
    xa = max(max(abs(np.subtract(a[n], TIP[j]))) for j, n in enumerate(('A', 'R1', 'R2', 'B')))
    xt = max(max(abs(np.subtract(t[n], VERTICAL[j]))) for j, n in enumerate(('A', 'R1', 'R2', 'B')))
    r3 = xa <= 1.5 and xt <= 1.5
    print('calibrate hood3/band  top edge error %.2f px (<=1), thickness 12 -> %.1f, 6 -> %.1f (pixels: 11, 5)  %s' % (e1, q_a, q_c, 'PROVEN' if r1 else 'UNPROVEN'))
    print('calibrate hood3/wedge   shifted (+4,+3) -> %s  %s' % (' '.join('(%+.1f,%+.1f)' % tuple(v) for v in d), 'PROVEN' if r2 else 'UNPROVEN'))
    print('calibrate hood3/wedge   triangle %s  largest error %.2f px' % (' '.join('(%.1f,%.1f)' % tuple(a[n]) for n in ('A', 'R1', 'R2', 'B')), xa))
    print('calibrate hood3/wedge   vertical right edge %s  largest error %.2f px  %s' % (' '.join('(%.1f,%.1f)' % tuple(t[n]) for n in ('A', 'R1', 'R2', 'B')), xt, 'PROVEN' if r3 else 'UNPROVEN'))
    return r1 and r2 and r3


def silh(v):
    v = np.array(v, float)
    if len(v) < 3:
        return np.repeat(v.mean(0, keepdims=True), len(v), 0) if len(v) == 2 else v
    p = np.concatenate([v[:1], v, v[-1:]])
    return (p[:-2] + 2 * p[1:-1] + p[2:]) / 4


def main():
    ok = calibrate()
    if '--calibrate' in sys.argv:
        sys.exit(0 if ok else 1)
    assert ok
    R = {}
    for g, ks in FRAME.items():
        K = {k: key_list(image.load(M % k, (320, 180))) for k in ks}
        for k in ks:
            r = K[k]
            print('frame %2d  band %4d px  top %s  low %s | wedge %4d px A %s R1 %s R2 %s B %s | side %s | angle %s' % (
                k, r['_band_area'], ' '.join('%.0f' % t[1] for t in r['top']), ' '.join('%.0f' % t[1] for t in r['low']),
                r['_wedge_area'], r['A'], r['R1'], r['R2'], r['B'], r['side'], r['angle']))
        name = ['top', 'low', 'A', 'R1', 'R2', 'B', 'side', 'angle', 'top_right']
        S = {n: silh([K[k][n] for k in ks]) for n in name}
        for i, k in enumerate(ks):
            e = {n: (np.array(S[n][i]) * [SX, SY]).round(1).tolist() for n in name}
            R[str(k)] = e
    json.dump(R, open(W + '/hood3-screen.json', 'w'), indent=1)
    print('->', W + '/hood3-screen.json')


if __name__ == '__main__':
    main()
