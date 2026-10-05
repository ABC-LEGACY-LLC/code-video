"""VISIBLE FACE MASK (pass 11, item 2, PRIVATE -- taken from the sample): per-frame bits for the fit (320x180, uint8, base64):
  1 -- the sample's visible skin F (part_measure.face_mask: skin + rim, hair removed, holes filled);
  2 -- inside the face box, neither F nor hair (hood inside, shadow, background) -- our skin must not show here.
Why: in the first fit of item 2 (pose11) the shot-3 hood key covered 30% of the sample's face (before: 6%) -- nothing in the
target (face points, head IoU, figure) saw the hood edge pass over the face. Layer measurement: test/parts/layer.py.
python3 test/parts/human/face_view.py  ->  private/test/parts/human/face_view_11.json"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, os, json, base64
import numpy as np
from scipy import ndimage
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q
out = {}
for k in range(1, 23):
    L = Q.L320((SAMPLE_DIR + '/k%02d.png') % k); g, p = Q.params(k); F = Q.face_mask(L, p)
    if F is None: continue
    x0, y0, x1, y1 = p['box']; box = np.zeros_like(F); box[y0:y1, x0:x1] = True
    hair = ndimage.binary_opening(L >= 85, structure=np.ones((3, 3)))
    m = F.astype(np.uint8) | ((box & ~F & ~hair).astype(np.uint8) << 1)
    out[k - 1] = base64.b64encode(m.astype(np.uint8).tobytes()).decode()
json.dump({'note': 'PRIVATE: from the sample. bit1 = visible skin of the sample, bit2 = inside the box, neither skin nor hair', 'm': out},
          open(os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'private', 'test', 'parts', 'human'), 'face_view_11.json'), 'w'))
print(len(out), 'frame')
