"""TONE MEASUREMENT (fast) -- the L median of each role, from the 3D anime render and the exact role masks (role style), 320x180 LANCZOS,
L; mask: nearest colour at 960x540 -> area share > 0.5 at 320x180 -> 1 px erosion (so edges and contours do not leak in).
Sky: median-9 L inside the background mask (3 px erosion), four horizontal bands. Sample targets (pass 12, the sample's
frame 17 L table; background -- the right 55 %, audit 1): hood outer 19, lining 43..48, inner 7..9, face ~59, hair ~100,
background bands 6 / 17 / 34 / 51.
python3 test/tone_measure.py ANIME_DIR ROLE_DIR"""
import sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

lin = lambda c: 0 if c == 0 else (255 if c == 255 else round(255 * ((c / 255 + 0.055) / 1.055) ** 2.4))
ROLES = {'skin': (255, 0, 0), 'neck': (128, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 128, 0),
          'hoodOuter': (0, 0, 255), 'hoodLining': (0, 255, 255), 'hoodInner': (0, 0, 128),
          'cloak': (255, 0, 255), 'cloakInner': (128, 0, 128), 'background': (0, 0, 0)}
NAME = list(ROLES); COLOUR = np.array([[lin(c) for c in ROLES[n]] for n in NAME], float)
GOAL = {'hoodOuter': 19, 'hoodLining': 45.5, 'hoodInner': 8, 'skin': 59, 'hair': 100}


def masks(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=float)
    k = ((a[:, :, None, :] - COLOUR[None, None]) ** 2).sum(-1).argmin(-1)
    return {n: np.asarray(Image.fromarray(((k == i) * 255).astype(np.uint8)).resize((320, 180), Image.BOX), float) / 255 > 0.5
            for i, n in enumerate(NAME)}


def measure(anime, role, frames=None):
    A = sorted(glob.glob(anime + '/???.png')); Rr = sorted(glob.glob(role + '/???.png'))
    ks = frames or range(len(A))
    v = {n: [] for n in NAME}; background = []
    for k in ks:
        L = np.asarray(Image.open(A[k]).convert('L').resize((320, 180), Image.LANCZOS), float)
        N = masks(Rr[k])
        for n in NAME:
            if n == 'background':
                continue
            m = ndimage.binary_erosion(N[n])
            if m.sum() >= 8:
                v[n].append(np.median(L[m]))
        m = ndimage.binary_erosion(N['background'], iterations=3); Lm = ndimage.median_filter(L, 9)
        background.append([np.median(Lm[a:b][m[a:b]]) if m[a:b].sum() > 20 else np.nan for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
    out = {n: float(np.median(x)) for n, x in v.items() if x}
    out['background'] = [float(x) for x in np.nanmean(np.array(background), 0)]
    return out


if __name__ == '__main__':
    r = measure(sys.argv[1], sys.argv[2])
    for n, x in r.items():
        if n == 'background':
            print('  background bands   %s   (sample 6 / 17 / 34 / 51)' %' / '.join('%.1f' % t for t in x))
        else:
            print('  %-10s L %6.1f   %s' % (n, x, ('target %s' % GOAL[n]) if n in GOAL else ''))
