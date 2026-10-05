"""GAZE -- the eye's state and the pupil's position, the same code on the sample and on ours. Near eye: the anchor component
(L<50, probe box 82..124 x 36..60, the largest), inside it the centre of the darkest 25 % of pixels -> the relative position
inside the eye box (0 top .. 1 bottom; 0 outer(left) .. 1 inner(right)); eye height/width (open ~10/11 px, closed ~3/11).
python3 test/audit_sample/gaze.py [ours_folder]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p): return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), float)

def eye(L, box=(82, 36, 124, 60), threshold=50):
    x0, y0, x1, y1 = box
    m = L[y0:y1, x0:x1] < threshold
    lab, n = ndimage.label(m)
    if n == 0: return None
    s = ndimage.sum(m, lab, range(1, n + 1)); i = int(np.argmax(s)) + 1
    ys, xs = np.nonzero(lab == i)
    v = L[y0:y1, x0:x1][ys, xs]; q = v <= np.percentile(v, 25)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx, cy = xs[q].mean(), ys[q].mean()
    return dict(box=[int(bx0 + x0), int(by0 + y0), int(bx1 + x0), int(by1 + y0)], width=int(bx1 - bx0 + 1), height=int(by1 - by0 + 1),
                pupil=[round(float(cx + x0), 1), round(float(cy + y0), 1)],
                relative_y=round(float((cy - by0) / max(1, by1 - by0)), 2), relative_x=round(float((cx - bx0) / max(1, bx1 - bx0)), 2))

if __name__ == '__main__':
    ours = sys.argv[1] if len(sys.argv) > 1 else 'frames-clean-4'
    out = {}
    for k in range(1, 12):
        a = eye(L320((SAMPLE_DIR + '/k%02d.png') % k)); b = eye(L320('%s/%03d.png' % (ours, k - 1)))
        out[k] = {'sample': a, 'ours': b}
        print('%2d sample %s\n   ours   %s' % (k, a, b))
    json.dump(out, open('private/test/audit_sample/gaze.json', 'w'), indent=1)
