"""SNOW DENSITY AND SIZE -- the same code on both sides: 320x180 LANCZOS, L; particle = top-hat (L - median9) > 28
(the same as compare.occlusion.particles); components: count, area distribution (px), largest, 99th percentile.
Only the right 55% (background snow; the character is on the left)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, numpy as np
sys.path.insert(0, (COMPARE_DIR))
from compare.occlusion import particles
from scipy import ndimage
from PIL import Image
def load_frames(p): return [np.asarray(Image.open(f).convert('L').resize((320, 180), Image.LANCZOS), dtype=float) for f in sorted(glob.glob(p))]
def measure(L):
    m = particles(L)[:, 144:]
    lab, n = ndimage.label(m)
    s = ndimage.sum(m, lab, range(1, n + 1)) if n else np.array([0])
    pk = ndimage.maximum(L[:, 144:], lab, range(1, n + 1)) if n else np.array([0])
    return n, np.median(s), np.percentile(s, 99), s.max(), np.median(pk)
for p in [(SAMPLE_DIR + '/k??.png')] + sys.argv[1:]:
    r = np.array([measure(L) for L in load_frames(p)])
    print('%-60s count %.0f (%.0f..%.0f)  area median %.1f  p99 %.1f  max %.0f  peak L %.0f' % (
        p[-60:], r[:, 0].mean(), r[:, 0].min(), r[:, 0].max(), r[:, 1].mean(), r[:, 2].mean(), r[:, 3].max(), r[:, 4].mean()))

# quarters: particle count (right 55%, 4 horizontal bands) and background L (median-9)
def quarters(F):
    rows, bg = [], []
    for L in F:
        m = particles(L)[:, 144:]
        lab, n = ndimage.label(m)
        cy = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))[:, 0] if n else np.array([])
        rows.append([((cy >= a) & (cy < b)).sum() for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
        Lm = ndimage.median_filter(L, 9)
        bg.append([np.median(Lm[a:b, 144:]) for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
    return np.array(rows).mean(0), np.array(bg).mean(0)
for p in [(SAMPLE_DIR + '/k??.png')] + sys.argv[1:]:
    r, b = quarters(load_frames(p))
    print('%-40s particles per quarter %s  background L %s' % (p[-40:], np.round(r).astype(int), np.round(b, 1)))
