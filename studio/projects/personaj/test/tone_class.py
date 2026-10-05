"""TONE CLASSES, MASS IoU (pass 12, the hood of shots 2 and 3). Levels measured from the sample
(320x180, L; the sample's L table for drawing 17: outer surface 19, lining 43..48, inside 7..9,
face ~59, hair ~100, sky 2..6):
  outer 12..32 (median 5), lining 36..<52 (median 3), inner 6.5..<12 (median 5),
  face 52..70 (median 3), hair > 85 (median 3)
The same code on both sides: each class mask is spread by a Gaussian with sigma 2 px and cut at 0.5
(the mass scale -- not particles and thin lines), and only inside the figure box (ROI: the sky is
full of snow particles). It used to live in test/hood3-fit.py (that module went stale -- pass 12).
python3 test/tone_class.py --calibrate"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys
import numpy as np
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR))
from compare import project, image

W = (PERSONAJ_DIR)
ROI = {'2': (0, 0, 175, 170), '3': (40, 0, 215, 168)}
SIGMA = 2.0
CLASSES = ('outer', 'lining', 'inner', 'face', 'hair')
WEIGHT = {'outer': 1.0, 'lining': 1.0, 'inner': 1.0, 'face': 0.7, 'hair': 0.4}


def classes(L):
    m3 = ndimage.median_filter(L, 3); m5 = ndimage.median_filter(L, 5)
    return {'outer': (m5 >= 12) & (m5 <= 32), 'lining': (m3 >= 36) & (m3 < 52), 'inner': (m5 >= 6.5) & (m5 < 12),
            'face': (m3 >= 52) & (m3 <= 70), 'hair': m3 > 85}


def mass(m):
    return ndimage.gaussian_filter(m.astype(float), SIGMA) > 0.5


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 1.0


def frame_group(k):
    return '2' if k <= 13 else '3'


class Sample:
    def __init__(self, k, prj=None):
        prj = prj or project.Project(W + '/compare.json')
        self.k = k; self.q = ROI[frame_group(k)]
        L = image.load(prj.file('sample', k), prj.size)
        self.m = {c: mass(v) for c, v in classes(L).items()}

    def score(self, L, weight=WEIGHT):
        s = classes(L)
        r = {c: iou(mass(s[c]), self.m[c], self.q) for c in weight}
        return sum(weight[c] * (1 - r[c]) for c in weight) / sum(weight.values()), r


def calibrate():
    """synthetic: one rectangle per class. IoU 1 with itself; when one class is moved 6 px
    only that class drops (expected about (34*40)/(46*40) = 0.74 for a 40x40 square);
    when pushed past a tone class boundary (lining 45 -> 55) the lining is gone and the face grows."""
    def make(dx=0, lining=45.0):
        L = np.full((180, 320), 3.0)
        L[20:140, 40:200] = 19                  # outer
        L[40:80, 60 + dx:100 + dx] = lining      # lining
        L[40:80, 120:160] = 8                   # inner
        L[90:130, 60:100] = 60                  # face
        L[90:130, 120:160] = 100                # hair
        return L
    q = (0, 0, 320, 180)
    A = {c: mass(v) for c, v in classes(make()).items()}
    B = {c: mass(v) for c, v in classes(make(dx=6)).items()}
    C = {c: mass(v) for c, v in classes(make(lining=55)).items()}
    o1 = all(abs(iou(A[c], A[c], q) - 1) < 1e-9 for c in CLASSES)
    ib = {c: iou(A[c], B[c], q) for c in CLASSES}
    o2 = abs(ib['lining'] - 34 / 46) < 0.04 and all(ib[c] > 0.95 for c in ('inner', 'face', 'hair'))
    ic = {c: iou(A[c], C[c], q) for c in ('lining', 'face')}
    o3 = ic['lining'] < 0.05 and ic['face'] < 0.7
    print('calibrate tone_class  self IoU 1  %s' % ('PROVEN' if o1 else 'UNPROVEN'))
    print('calibrate tone_class  lining +6 px -> IoU %.3f (expected %.3f), others %s  %s' % (
        ib['lining'], 34 / 46, ' '.join('%s %.2f' % (c, ib[c]) for c in ('outer', 'inner', 'face', 'hair')), 'PROVEN' if o2 else 'UNPROVEN'))
    print('calibrate tone_class  lining L 45 -> 55: lining IoU %.2f, face IoU %.2f (moved to the face class)  %s' % (ic['lining'], ic['face'], 'PROVEN' if o3 else 'UNPROVEN'))
    return o1 and o2 and o3


if __name__ == '__main__':
    sys.exit(0 if calibrate() else 1)
