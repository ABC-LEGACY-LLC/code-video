"""JUMP (audit of pass 7): the difference energy of neighbouring frames -- the same as compare.diff (each frame normalised
to its own mean and std, |a-b|), 320x180 LANCZOS L; the left 40 % (x < 128: head, face, hair, torso -- seen on the map) and
the whole frame. Sample: 9->10 0.201, 10->11 0.189, 12->13 0.025 (held). Calibration (sample k01): against itself 0.0000;
a 20x20 block +60 on the left -> left 0.050, right 0.023; the same on the right -> left 0.014, right 0.039 (it leaks
through the whole-frame normalisation -- a snow change lands a little on the left too, the same on both sides); a rigid
2 px shift -> 0.134 / 0.523.
python3 test/audit_sample/jump.py FOLDER [FOLDER2 ...]   (FOLDER: %03d.png, 0-based; 'sample' -- the target k%02d.png)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../../tools/compare'))  # tools/compare
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, (COMPARE_DIR))
from compare.diff import nz

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

def file(d, k): return (SAMPLE_DIR + '/k%02d.png') % k if d == 'sample' else '%s/%03d.png' % (d, k - 1)

def cover_map(d, i, j): return np.abs(nz(L(file(d, i))) - nz(L(file(d, j))))

def pairs(d, JU=None):
    JU = JU or [(i, i + 1) for i in range(1, 22)]
    return {(i, j): float(cover_map(d, i, j)[:, :128].mean()) for i, j in JU}

if __name__ == '__main__':
    for d in sys.argv[1:]:
        e = pairs(d)
        print('%-26s ' % d.rstrip('/').split('/')[-1][:26] + ' '.join('%d-%d %.3f' % (i, j, v) for (i, j), v in e.items()))
