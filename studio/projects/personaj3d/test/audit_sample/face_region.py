"""FACE REGION (the part where the skin shows) -- the same code on the sample and on ours: per frame the face-region mask,
its area, its centre, the angle of the head axis (the mask's principal axis, degrees, from vertical), its lowest and
rightmost points.
Sample: L median-3 within [50, 68], the region connected to the seed point (face skin L 57..60; hair 90+, hood 15..25,
background beside the face 40..46). Ours: the role mask (skin, red) -- exact; plus the same L method (to check the tool).
python3 test/audit_sample/face_region.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SEED = {**{k: (112, 75) for k in range(1, 10)}, 10: (122, 80), 11: (126, 82), 12: (150, 95), 13: (150, 95),
        **{k: None for k in range(14, 23)}}


def L320(p):
    return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), float)


def region_L(L, seed, lo=50, hi=68):
    m = ndimage.median_filter(L, 3)
    b = (m >= lo) & (m <= hi)
    lab, n = ndimage.label(b)
    if seed is None:
        return None
    c = lab[seed[1], seed[0]]
    if c == 0:
        return None
    return ndimage.binary_fill_holes(lab == c)


def feature(m):
    ys, xs = np.nonzero(m)
    if len(xs) < 20:
        return None
    cx, cy = xs.mean(), ys.mean()
    C = np.cov(np.vstack([xs - cx, ys - cy]))
    w, v = np.linalg.eigh(C)
    ax = v[:, 1]                                  # principal axis
    angle = np.degrees(np.arctan2(ax[0], ax[1]))  # degrees from vertical (down), + -> the bottom leans right
    if angle > 90: angle -= 180
    if angle < -90: angle += 180
    return dict(n=int(len(xs)), cx=round(cx, 1), cy=round(cy, 1), x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()),
                angle=round(float(angle), 1), stretching=round(float(np.sqrt(w[1] / max(w[0], 1e-6))), 2))


if __name__ == '__main__':
    ours_dir = sys.argv[1] if len(sys.argv) > 1 else 'frames-clean-4'
    role_dir = sys.argv[2] if len(sys.argv) > 2 else 'frames-sample/role-face4'
    out = {}
    for k in range(1, 23):
        Lm = L320((SAMPLE_DIR + '/k%02d.png') % k)
        mm = region_L(Lm, SEED[k])
        a = np.asarray(Image.open('%s/%03d.png' % (role_dir, k - 1)).convert('RGB').resize((320, 180), Image.NEAREST), int)
        mb = (a[:, :, 0] > 180) & (a[:, :, 1] < 80) & (a[:, :, 2] < 80)
        out[k] = {'sample': feature(mm) if mm is not None else None, 'ours_role': feature(mb)}
        print(k, 'sample', out[k]['sample'], '\n   ours', out[k]['ours_role'])
    json.dump(out, open('private/test/audit_sample/face_region.json', 'w'), indent=1)
