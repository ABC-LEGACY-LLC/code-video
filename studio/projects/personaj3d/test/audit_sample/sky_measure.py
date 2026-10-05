"""SKY (BACKGROUND) PROFILE (pass 9, 2e) -- the same code on both sides: 320x180 LANCZOS, L, median 9 (snow particles
drop out), inside the background box (right of the character: shot 1 x >= 170, shot 2 x >= 200, shot 3 x >= 245 -- the
boxes in snow_zoom.py) the median L in every band of 20 rows. In the sample the background is THE SAME in all three shots
(a 2D background plate); the world sky darkens when the camera looks up -- how much is measured here.
python3 test/audit_sample/sky_measure.py FOLDER [FOLDER2 ...]   ('sample' -- the target)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

BOX_X = {'1': 170, '2': 200, '3': 245}
FRAME = {'1': [2, 5, 9], '2': [12, 13], '3': [16, 19, 22]}

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 9)

def file(d, k): return (SAMPLE_DIR + '/k%02d.png') % k if d == 'sample' else '%s/%03d.png' % (d, k - 1)

def profile(d):
    out = {}
    for s, ks in FRAME.items():
        P = np.mean([[np.median(L(file(d, k))[y:y + 20, BOX_X[s]:]) for y in range(0, 180, 20)] for k in ks], 0)
        out[s] = [round(float(v), 1) for v in P]
    return out

if __name__ == '__main__':
    for d in sys.argv[1:]:
        o = profile(d)
        print('== %s' % d.rstrip('/').split('/')[-1])
        for s, v in o.items(): print('  shot %s background L (top to bottom, 20 rows): %s' % (s, ' '.join('%5.1f' % t for t in v)))
