"""FOCUS (pass 12): edge width -- which part is in focus and which is not. The edge is
taken halfway between two levels on a 7x7 median (skimage find_contours); every 2 px, the
original L profile along the normal (bilinear, -8..+8 px, 0.25 step); the MEDIAN of the
profiles (the snow particles vanish) is fitted to erf: L = a + b*erf(s/(sigma*sqrt2)). sigma --
the edge spread (at 320, px). Calibration: a sharp step gives sigma ~0.5 (the LANCZOS resize),
a step spread by a 2 px Gaussian gives sigma ~2.1.
python3 test/focus.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json
import numpy as np
from scipy import ndimage, optimize, special
from skimage import measure
from PIL import Image
sys.path.insert(0, (COMPARE_DIR))
from compare import image

M = (SAMPLE_DIR + '/k%02d.png')


def edge(L, box, a_box, b_box, step=2, R=8):
    x0, y0, x1, y1 = box
    Lm = ndimage.median_filter(L, 7)
    la = float(np.median(Lm[a_box[1]:a_box[3], a_box[0]:a_box[2]]))
    lb = float(np.median(Lm[b_box[1]:b_box[3], b_box[0]:b_box[2]]))
    cs = measure.find_contours(Lm[y0:y1, x0:x1], (la + lb) / 2)
    if not cs:
        return None
    c = max(cs, key=len)
    G = ndimage.gaussian_filter(L, 2.0); gy, gx = np.gradient(G)
    s = np.arange(-R, R + 1e-6, 0.25); P = []
    for r, q in c[::step * 2]:
        y, x = r + y0, q + x0
        nx, ny = ndimage.map_coordinates(gx, [[y], [x]], order=1)[0], ndimage.map_coordinates(gy, [[y], [x]], order=1)[0]
        n = np.hypot(nx, ny)
        if n < 1e-6:
            continue
        nx, ny = nx / n, ny / n
        P.append(ndimage.map_coordinates(L, [y + s * ny, x + s * nx], order=1, mode='nearest'))
    if len(P) < 5:
        return None
    p = np.median(np.array(P), 0)
    f = lambda t, a, b, sg, t0: a + b * special.erf((t - t0) / (abs(sg) * np.sqrt(2)))
    try:
        (a, b, sg, t0), _ = optimize.curve_fit(f, s, p, p0=[p.mean(), (p[-1] - p[0]) / 2, 1.0, 0.0], maxfev=20000)
    except Exception:
        return None
    return abs(sg), 2 * abs(b), len(P), la, lb


def calibrate():
    L = np.zeros((60, 60)) + 10.0; L[:, 30:] = 40.0
    im = Image.fromarray(np.uint8(L)).resize((180, 180), Image.NEAREST).resize((60, 60), Image.LANCZOS)
    A = np.asarray(im).astype(float)
    B = ndimage.gaussian_filter(L, 2.0)
    ra = edge(A, (5, 5, 55, 55), (5, 5, 20, 55), (40, 5, 55, 55)); rb = edge(B, (5, 5, 55, 55), (5, 5, 20, 55), (40, 5, 55, 55))
    print('calibrate: sharp step sigma %.2f, Gauss 2 px step sigma %.2f' % (ra[0], rb[0]))
    return ra[0] < 1.0 and 1.7 < rb[0] < 2.5


# (frame, name, edge box, level A box, level B box) -- at 320; the boxes were read from
# the grid sheets (k01, k12, k17)
EDGES = [
    (17, "hood back-top edge / sky", (25, 0, 110, 100), (80, 10, 110, 40), (0, 0, 22, 30)),
    (17, "hair fibre / hood lining", (150, 70, 205, 100), (165, 88, 200, 98), (160, 64, 195, 72)),
    (17, "lining band / front brim (top)", (145, 45, 210, 78), (160, 64, 195, 72), (150, 48, 185, 56)),
    (12, "hood back-left edge / sky", (0, 0, 60, 60), (30, 20, 60, 50), (0, 0, 8, 20)),
    (12, "face front edge / snow", (140, 90, 185, 140), (125, 100, 140, 120), (170, 95, 185, 110)),
    (12, "hair / hood (top-left)", (110, 0, 150, 60), (140, 10, 150, 30), (112, 20, 122, 40)),
    (1, "hair / sky (top-right)", (120, 0, 165, 60), (125, 15, 135, 30), (150, 0, 165, 12)),
    (1, "face / cloak (under the jaw)", (85, 100, 135, 125), (95, 90, 120, 100), (95, 115, 115, 125)),
    (1, "cloak fold (lower left)", (0, 115, 70, 170), (10, 125, 25, 135), (30, 150, 45, 160)),
]

if __name__ == '__main__':
    assert calibrate()
    for k, name, q, a, b in EDGES:
        L = image.load(M % k, (320, 180))
        r = edge(L, q, a, b)
        if r is None:
            print('  %2d  %-40s  --' % (k, name)); continue
        sg, cont, n, la, lb = r
        print('  %2d  %-40s sigma %.2f px  (10-90%% %.1f px)  contrast %.0f  (%d profiles; levels %.0f / %.0f)' % (k, name, sg, 2.563 * sg, cont, n, la, lb))
