"""HAIR BRIGHT-MASS IoU (pass 9, 2b): the bright-mass masks of the sample and of ours (personaj/test/composition.mask:
L>=90, stars/snow removed with a top-hat, 2x2 opening) -- THE SAME CODE ON BOTH SIDES, 320x180 LANCZOS -- inside the head
box, per frame: IoU, sample mass, our mass, agreement. Boxes: shot 1 (30, 0, 190, 130), shot 2 (80, 0, 230, 140),
shot 3 (120, 20, 260, 170). In this one form the hair fit (test/fit_hair9.mjs) sees both directions:
missing mass (in the sample, not in ours) and excess mass (the strand that fell in front of the face in shot 2).
python3 test/audit_sample/hair_iou.py FOLDER [frames: 1-13]   (FOLDER: %03d.png, 0-based)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '../../../personaj'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from composition import mask

BOX = lambda k: (30, 0, 190, 130) if k <= 11 else (80, 0, 230, 140) if k <= 13 else (120, 20, 260, 170)

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

_M = {}
def sample(k):
    if k not in _M: _M[k] = mask(L320((SAMPLE_DIR + '/k%02d.png') % k))
    return _M[k]

def measure(folder, ks):
    out = {}
    for k in ks:
        x0, y0, x1, y1 = BOX(k)
        a = sample(k)[y0:y1, x0:x1]; b = mask(L320('%s/%03d.png' % (folder, k - 1)))[y0:y1, x0:x1]
        out[k] = {'iou': float((a & b).sum() / max(1, (a | b).sum())), 'sample': int(a.sum()), 'ours': int(b.sum()), 'agree': int((a & b).sum())}
    return out

if __name__ == '__main__':
    k0, k1 = map(int, (sys.argv[2] if len(sys.argv) > 2 else '1-13').split('-'))
    print(json.dumps(measure(sys.argv[1], range(k0, k1 + 1))))
