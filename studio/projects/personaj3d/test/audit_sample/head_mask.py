"""VISIBLE HEAD MASK (pass 7, hood) -- face + hair, THE SAME code on the sample and on ours (320x180 LANCZOS):
L >= 40 after a median 5 (in the sample face 58-60, shadowed hair 45+, hood 19-21, lining 43-48, sky 4-18 at med3);
opening with an r=3 disk (cuts the thin bridges to the snow field), the component connected to the face seed, 4 steps of
geodesic reconstruction (edges inside L>=40), holes filled. In shot 3 the dense snow field under the chin touches the
face widely -- allowed box: x <= 218, y <= 162 and not (x > 185, y > 135) (the sample's contour at y 144..156 lies at
x 151..165; bright hair x <= 216) -- checked on a sheet. Hood fit: this mask of the sample <-> our role mask (skin+hair+
cap+neck, visible); score -- this same code on both anime renders.
python3 test/audit_sample/head_mask.py [ours_folder]  -- area and IoU per frame"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, numpy as np
from PIL import Image
from scipy import ndimage
SEED = {**{k: (112, 70) for k in range(1, 12)}, 12: (150, 95), 13: (150, 95), **{k: (160, 130) for k in range(14, 23)}}
_yy, _xx = np.mgrid[0:180, 0:320]
ALLOWED3 = (_xx <= 218) & (_yy <= 162) & ~((_xx > 185) & (_yy > 135))
DISK3 = np.hypot(*np.mgrid[-3:4, -3:4]) <= 3
def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)
def mask(L, k, thr=40):
    m = ndimage.median_filter(L, 5) >= thr
    if k >= 14: m &= ALLOWED3
    mo = ndimage.binary_opening(m, DISK3)
    lab, n = ndimage.label(mo); x, y = SEED[k]; c = lab[y, x]
    if c == 0:
        w = lab[y - 6:y + 7, x - 6:x + 7]; ids, cnt = np.unique(w[w > 0], return_counts=True); c = ids[np.argmax(cnt)] if len(ids) else 0
    if not c: return np.zeros_like(m)
    s = lab == c
    for _ in range(4): s = ndimage.binary_dilation(s) & m
    return ndimage.binary_fill_holes(s)
def sample(k): return mask(L320((SAMPLE_DIR + '/k%02d.png') % k), k)
def iou(a, b): return (a & b).sum() / max(1, (a | b).sum())
if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else None
    for k in range(1, 23):
        a = sample(k); s = 'k%02d sample %5d' % (k, a.sum())
        if d:
            b = mask(L320('%s/%03d.png' % (d, k - 1)), k); s += '  ours %5d  IoU %.3f' % (b.sum(), iou(a, b))
        print(s)
