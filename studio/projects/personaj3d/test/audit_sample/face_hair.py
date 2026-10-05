"""HAIR OVER THE FACE (pass 9, 2b): what we have over the sample's face skin (L 45..82, median 3, the component connected
to the seed, inside the face box) -- from the role render (hair / skin / hood ...): in shot 2 one hair shape dropped a strand
in front of the face (the bright-mass IoU did not notice it). The same size 320x180 on both sides.
python3 test/audit_sample/face_hair.py ROLE [ROLE2 ...] | --json ROLE"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
BOX = {12: (118, 45, 172, 118), 13: (118, 45, 172, 118), 5: (90, 35, 140, 100)}
SEED = {12: (150, 95), 13: (150, 95), 5: (115, 70)}
ROLE = {'skin': (255, 0, 0), 'neck': (128, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 128, 0), 'hood': (0, 0, 255), 'hoodLining': (0, 255, 255), 'hoodInner': (0, 0, 128), 'cloak': (255, 0, 255), 'background': (0, 0, 0)}
def face(k):
    im = Image.open((SAMPLE_DIR + '/k%02d.png') % k).convert('L')
    L = ndimage.median_filter(np.asarray(im, float), 3); x0, y0, x1, y1 = BOX[k]
    m = np.zeros_like(L, bool); m[y0:y1, x0:x1] = (L[y0:y1, x0:x1] >= 45) & (L[y0:y1, x0:x1] <= 82)
    lab, _ = ndimage.label(m); c = lab[SEED[k][1], SEED[k][0]]
    return ndimage.binary_fill_holes(lab == c) if c else m
def role(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    name = list(ROLE); RR = np.array([ROLE[n] for n in name], float)
    return np.array(name)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]
def coverage(d, ks=(12, 13, 5)):
    """what we have over the sample's face skin: {k: {'hair', 'skin', 'hood'}} -- fractions (0..1); fit_hair9b.mjs reads this too"""
    o = {}
    for k in ks:
        m = face(k); r = role('%s/%03d.png' % (d, k - 1)); n = m.sum()
        o[k] = {'n': int(n), 'hair': float((m & (r == 'hair')).sum() / n), 'hairInner': float((m & (r == 'hairInner')).sum() / n), 'skin': float((m & (r == 'skin')).sum() / n),
                'hood': float((m & np.isin(r, ['hood', 'hoodLining', 'hoodInner'])).sum() / n)}
    return o
if __name__ == '__main__':
    if sys.argv[1] == '--json':
        import json; print(json.dumps(coverage(sys.argv[2])))
    else:
        for d in sys.argv[1:]:
            q = coverage(d)
            print(d.split('/')[-1], ' | '.join('k%d face %d px: hair %.0f%% skin %.0f%% hood %.0f%%' % (k, v['n'], 100 * v['hair'], 100 * v['skin'], 100 * v['hood']) for k, v in q.items()))
