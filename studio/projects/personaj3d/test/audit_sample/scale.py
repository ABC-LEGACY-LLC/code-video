"""SCALE OF THE FIGURE REGION (pass 8) -- between neighbouring frames, an affine fit of the left 45 % (x < 144: hood, head,
hair, cloak) (OpenCV ECC, MOTION_AFFINE) -> scale s = sqrt(det A). "Camera zoom" -- the frame content growing/
shrinking: in the sample, within a shot, all pairs are 0.985..1.008. Both sides: 320x180 LANCZOS L, median 5 (fewer snow
particles). Calibration (--calibrate): sample k05 against itself 1.0000, 1.02 times about the centre -> 1.0203, 0.98 -> 0.9799.
Warning: in shot 3 the left part is an almost flat hood -- ECC is unstable there (in pass 7 it gave 1.44 at 15->16).
python3 test/audit_sample/scale.py [--calibrate] FOLDER...   (FOLDER: %03d.png, 0-based; 'sample')"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, dtype=float), 5).astype(np.float32)

def file(d, k): return (SAMPLE_DIR + '/k%02d.png') % k if d == 'sample' else '%s/%03d.png' % (d, k - 1)

def ecc(a, b, box=(0, 0, 144, 180)):
    x0, y0, x1, y1 = box
    W = np.eye(2, 3, dtype=np.float32)
    try:
        cc, W = cv2.findTransformECC(a[y0:y1, x0:x1], b[y0:y1, x0:x1], W, cv2.MOTION_AFFINE,
                                     (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    except cv2.error:
        return None
    return float(np.sqrt(abs(np.linalg.det(W[:, :2]))))

def pairs(d):
    out = {}
    for k in range(1, 22):
        if k in (11, 13): continue                   # cuts
        out[(k, k + 1)] = ecc(L(file(d, k)), L(file(d, k + 1)))
    return out

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--calibrate' in args:
        a = L(file('sample', 5)); H, Wd = a.shape
        for s in (1.0, 1.02, 0.98):
            M = cv2.getRotationMatrix2D((70, 60), 0, s); b = cv2.warpAffine(a, M, (Wd, H), borderMode=cv2.BORDER_REFLECT)
            print('CALIBRATION zoom %.2f -> s %.4f' % (s, ecc(a, b)))
        args = [x for x in args if x != '--calibrate']
    for d in args:
        j = pairs(d)
        print('%-22s ' % d.rstrip('/').split('/')[-1][:22] + ' '.join('%d-%d %.3f' % (i, k, v) if v else '%d-%d -' % (i, k) for (i, k), v in j.items()))
