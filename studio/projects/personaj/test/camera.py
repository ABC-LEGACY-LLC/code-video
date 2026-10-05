"""CAMERA AND PHYSICS (pass 12, hood). From which side and from what height the sample
was filmed -- by measurement. The same code on both sides (the sample and ours).
  1) snow motion in each shot: the votes of the particle (top-hat > 28) shifts between k
     and k+1 (|d| <= 12 px) -- the histogram peak = the main motion; two classes by
     size: small (1..3 px, far) and large (>= 6 px, near, bokeh).
  2) the figure (occlusion map, each shot group) -- coverage, top-left corner, the
     top-right-most point.
python3 test/camera.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR))
from compare import project, image, occlusion

W = (PERSONAJ_DIR)
prj = project.Project(W + '/compare.json')
G = prj.groups if hasattr(prj, 'groups') else json.load(open(W + '/compare.json'))['groups']


def particles(L):
    m = occlusion.particles(L)
    lab, n = ndimage.label(m)
    if not n:
        return np.zeros((0, 2)), np.zeros(0)
    c = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))
    s = ndimage.sum(m, lab, range(1, n + 1))
    return c[:, ::-1], s        # (x, y), area


def sound(A, B, R=12):
    """A, B: (x,y) points; the histogram of the shifts of all pairs, the peak and its share"""
    if len(A) == 0 or len(B) == 0:
        return None
    d = (B[None, :, :] - A[:, None, :]).reshape(-1, 2)
    d = d[(np.abs(d) <= R).all(1)]
    H, _, _ = np.histogram2d(d[:, 0], d[:, 1], bins=2 * R + 1, range=[[-R - .5, R + .5], [-R - .5, R + .5]])
    Hs = ndimage.uniform_filter(H, 3)
    i, j = np.unravel_index(np.argmax(Hs), Hs.shape)
    # centre of mass around the peak (subpixel)
    w = H[max(0, i - 1):i + 2, max(0, j - 1):j + 2]
    xs = np.arange(max(0, i - 1), max(0, i - 1) + w.shape[0]) - R
    ys = np.arange(max(0, j - 1), max(0, j - 1) + w.shape[1]) - R
    dx = float((w.sum(1) * xs).sum() / max(w.sum(), 1)); dy = float((w.sum(0) * ys).sum() / max(w.sum(), 1))
    background = np.median(Hs)
    return dx, dy, float(Hs[i, j] / max(background, 1e-6))


def snow(side, k0, k1):
    rows = []
    for k in range(k0, k1):
        La = image.load(prj.file(side, k), prj.size); Lb = image.load(prj.file(side, k + 1), prj.size)
        A, sa = particles(La); B, sb = particles(Lb)
        r = {}
        for name, fa, fb in (('small', sa <= 3, sb <= 3), ('large', sa >= 6, sb >= 6)):
            r[name] = sound(A[fa], B[fb], R=12 if name == 'small' else 16)
        rows.append((k, r, len(A)))
    return rows


if __name__ == '__main__':
    for side in ('sample', 'ours'):
        print('=== %s: snow motion (dx, dy px/image; peak/background)' % side)
        for name, (a, b) in G.items():
            rows = snow(side, a, b)
            for classify in ('small', 'large'):
                v = [r[classify] for _, r, _ in rows if r[classify]]
                if not v:
                    continue
                dx = np.median([t[0] for t in v]); dy = np.median([t[1] for t in v]); q = np.median([t[2] for t in v])
                print('  %s %-6s median (%+.1f, %+.1f)  peak/background %.1f   each pair: %s' % (
                    name, classify, dx, dy, q, ' '.join('(%+.0f,%+.0f)' % (t[0], t[1]) for t in v)))


def layer(side, k0, k1, bands=6):
    """snow density and particle size by height (outside the figure: the right 45%)"""
    Z = []; S = []
    for k in range(k0, k1 + 1):
        L = image.load(prj.file(side, k), prj.size)
        m = occlusion.particles(L)[:, 176:]
        lab, n = ndimage.label(m)
        if n:
            s = ndimage.sum(m, lab, range(1, n + 1)); c = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))
            Z.append(c[:, 0]); S.append(s)
    y = np.concatenate(Z); s = np.concatenate(S); h = prj.size[1] / bands
    out = []
    for b in range(bands):
        f = (y >= b * h) & (y < (b + 1) * h)
        out.append((f.sum() / (k1 - k0 + 1) / (h * 144) * 1000, float(np.mean(s[f])) if f.any() else 0))
    return out


def hair_direction(side, k, box):
    """direction of the hair fibres: the structure tensor inside the bright (L>85) area; the
    angle from the horizontal (0 = lying to the right, 90 = vertical)"""
    L = image.load(prj.file(side, k), prj.size)
    x0, y0, x1, y1 = box
    G = ndimage.gaussian_filter(L, 1.0); gy, gx = np.gradient(G)
    m = np.zeros_like(L, bool); m[y0:y1, x0:x1] = True; m &= ndimage.median_filter(L, 3) > 85
    Jxx = ndimage.gaussian_filter(gx * gx, 2)[m].sum(); Jyy = ndimage.gaussian_filter(gy * gy, 2)[m].sum(); Jxy = ndimage.gaussian_filter(gx * gy, 2)[m].sum()
    th = 0.5 * np.degrees(np.arctan2(2 * Jxy, Jxx - Jyy))      # gradient direction
    fibre = (th + 90) % 180                                      # the fibre is perpendicular to the gradient
    coherence = np.hypot(Jxx - Jyy, 2 * Jxy) / (Jxx + Jyy)
    return (180 - fibre) % 180, coherence                             # image y points down -> mathematical angle


if __name__ == '__main__' and '--layer' in sys.argv:
    for side in ('sample', 'ours'):
        print('=== %s: snow density (particles/image per 1000 px2) and mean particle area, 6 bands from top to bottom (right 45%%)' % side)
        for name, (a, b) in G.items():
            q = layer(side, a, b)
            print('  %s  density %s   area %s' % (name, ' '.join('%5.1f' % z for z, _ in q), ' '.join('%4.1f' % s for _, s in q)))
