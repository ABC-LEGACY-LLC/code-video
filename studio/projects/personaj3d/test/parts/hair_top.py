"""HAIR TOP (pass 12, item 1): in every column, the top row of the visible head (face+hair) -- the sample (part_target_12 bit 1,
PRIVATE) and ours (role render: skin/neck/hair, not the AO dark). A column cut by the top of the frame (y=0 in the sample) is marked separately.
  python3 test/parts/hair_top.py ROLE_DIR [frames 2,5,9,11,12]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json, base64, numpy as np
from PIL import Image
R = (P3D_DIR + '/')
M = json.load(open(R + 'private/test/parts/human/part_target_12.json'))['m']
D = sys.argv[1]; KS = [int(k) for k in (sys.argv[2] if len(sys.argv) > 2 else '2,5,9,11,12').split(',')]
def ours(k):
    a = np.asarray(Image.open('%s/%03d.png' % (D, k)).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))
for k in KS:
    m = (np.frombuffer(base64.b64decode(M[str(k)]), np.uint8).reshape(180, 320) & 1) > 0; o = ours(k)
    cols = [x for x in range(320) if m[:, x].any() or o[:, x].any()]
    x0, x1 = min(cols), max(cols)
    top = lambda A, x: int(np.argmax(A[:, x])) if A[:, x].any() else None
    row = []
    for x in range(x0, x1 + 1, 4):
        tm, tb = top(m, x), top(o, x)
        row.append('%d:%s/%s' % (x, '-' if tm is None else tm, '-' if tb is None else tb))
    # head area in the top 60 rows, and IoU
    mm, oo = m[:60], o[:60]; I = (mm & oo).sum(); U = (mm | oo).sum()
    print('k%02d top-60 sample %d px, ours %d px, IoU %.3f; sample columns at y=0 %d' % (k + 1, mm.sum(), oo.sum(), I / max(U, 1), m[0].sum()))
    print('   x:sample/ours top row ->', ' '.join(row))
