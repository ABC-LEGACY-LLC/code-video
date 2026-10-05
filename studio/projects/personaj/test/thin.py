"""THIN BRIGHT LINE measurement (pass 11). The hair mask (L>85, median 3) does not see arcs that
are 1..2 px thin at 320 with L ~75 -- they were visible only to the eye (an arc under the far eye,
like the rim of glasses). This measurement counts them: white top-hat, L - opening(L, 5x5) > 10
(pixels thinner than 5 px and brighter than their surroundings by 10) in the CHEEK box -- from
the near-eye seed (x-8..x+45, y+6..y+25). The eyes are outside the box: otherwise the skin between
two dark lines was counted as "thin bright" too (attempt 1, from y-3: sample 2258,
pass 10 2079 -- mostly around the eye). The same code on both sides; calibration: flat background
0, a 1 px line is counted, an 8 px band is not.
python3 test/thin.py dir1 [dir2 ...]   (dir -- 00..21.png; 'sample' -- the target)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR))
from compare import project, image

W = (PERSONAJ_DIR)
prj = project.Project(W + '/compare.json')
SEED = prj.anchor['seed']


def tophat(L):
    return L - ndimage.grey_opening(L, size=(5, 5))


SP = next(s for s in prj.silhouettes if s['name'] == 'hair')


def date(L, k):
    """OUTSIDE the hair mass (its own mask dilated by 3 px): otherwise the thin bright paths
    between strands and the hair between ink lines were counted too (attempt 2:
    sample 1491 -- mostly strands)"""
    from compare import silhouette
    x, y = SEED[str(k)]
    hair = ndimage.binary_dilation(silhouette.spec_mask(L, SP, None), iterations=3)
    t = (tophat(L) > 10) & ~hair
    return int(t[y + 6:y + 25, x - 8:x + 45].sum())


def calibrate():
    L = np.full((60, 80), 60.0)
    ok0 = int((tophat(L) > 10).sum()) == 0
    L1 = L.copy(); L1[30, 10:70] = 80
    ok1 = int((tophat(L1) > 10).sum()) == 60
    L2 = L.copy(); L2[26:34, 10:70] = 80
    ok2 = int((tophat(L2) > 10).sum()) == 0
    print('calibrate: flat 0 %s, 1 px line 60 %s, 8 px band 0 %s' % (ok0, ok1, ok2))
    return ok0 and ok1 and ok2


if __name__ == '__main__':
    assert calibrate()
    for subdir in sys.argv[1:]:
        v = []
        for k in range(1, 12):
            f = prj.file('sample', k) if subdir == 'sample' else '%s/%02d.png' % (subdir, k - 1)
            v.append(date(image.load(f, prj.size), k))
        print('%-10s %s  total %d' % (subdir.split('/')[-1], ' '.join('%3d' % a for a in v), sum(v)))
