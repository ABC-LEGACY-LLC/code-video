"""STRUCTURE MEASUREMENT (pass 12) -- on role renders (320x180, %03d.png, 0..21), with THE SAME definitions as the page score in
test/fit_hood_structure.mjs (window.hoodStructureScore): for every point of the head-shell grid (private/test/parts/surface_projection_02.json,
9 frames), which class it is on the sample and on ours (0 head -- skin/neck/hair; 1 inner -- inside of the hood/cloak and the AO/shadow
dark; 2 outer -- the rest of the figure; 3 background); per shot, class IoU and agreement; figure -- 32x18 blocks, soft IoU
(private/test/sample_figure8.json). PRIVATE target.
  python3 test/parts/structure_measure.py [SURFACE.json] ROLE_DIR [ROLE_DIR2 ...]   (SURFACE -- another shell, e.g. surface_projection_055.json)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json, base64, numpy as np
from PIL import Image
R = (P3D_DIR + '/')
S = json.load(open(R + (sys.argv[1] if sys.argv[1].endswith('.json') else 'private/test/parts/surface_projection_02.json')))
M = json.load(open(R + 'private/test/parts/human/part_target_12.json'))['m']
FIG = json.load(open(R + 'private/test/sample_figure8.json')); FIGT = {1: np.array(FIG['shot1']), 2: np.array(FIG['shot2']), 3: np.array(FIG['shot3'])}
SHOT = lambda f: 1 if f <= 10 else 2 if f <= 12 else 3
GR = {}
for ks, G in S['frame'].items():
    f = int(ks) - 1; m = np.frombuffer(base64.b64decode(M[str(f)]), np.uint8).reshape(180, 320)
    px, c = [], []
    for row in G:
        for x, y, v in row:
            if v < 0.2 or not (0 <= x < 320 and 0 <= y < 180): continue
            j = int(y) * 320 + int(x); b = m.flat[j]; px.append(j); c.append(0 if b & 1 else 1 if b & 2 else 2 if b & 4 else 3)
    GR[f] = (np.array(px), np.array(c))
def classify(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    o = np.full(r.shape, 3)
    o[(r + g + b) > 30] = 2
    o[(b > 30) & (b < 90) & (g < 30) & (r < 90)] = 1
    o[((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))] = 0
    return o
def iou(C, k):
    d = C[k].sum() + C[:, k].sum() - C[k, k]
    return C[k, k] / d if d else 1.0
def measure(D):
    out = {}
    for s in (1, 2, 3):
        fs = [f for f in GR if SHOT(f) == s]; C = np.zeros((4, 4)); B = np.zeros((18, 32))
        for f in fs:
            a = np.asarray(Image.open('%s/%03d.png' % (D, f)).convert('RGB')); cl = classify(a).ravel()
            px, cm = GR[f]; np.add.at(C, (cm, cl[px]), 1)
            fig = ((a.astype(int).sum(-1)) > 30).astype(float)
            B += fig.reshape(18, 10, 32, 10).mean((1, 3)) / len(fs)
        T = FIGT[s]
        out[s] = dict(agree=np.trace(C) / C.sum(), head=iou(C, 0), inner=iou(C, 1), outer=iou(C, 2), fig=np.minimum(B, T).sum() / np.maximum(B, T).sum())
    return out
if __name__ == '__main__':
    for D in [a for a in sys.argv[1:] if not a.endswith('.json')]:
        o = measure(D)
        print(D.split('/')[-1].ljust(22), ' | '.join('%d: agree %.3f head %.3f inner %.3f outer %.3f fig %.3f' % (s, o[s]['agree'], o[s]['head'], o[s]['inner'], o[s]['outer'], o[s]['fig']) for s in (1, 2, 3)))
