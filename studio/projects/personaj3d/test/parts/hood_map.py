"""HOOD MAP (pass 12, structure): for every point of the shell `off` outside the head surface (at hair thickness;
test/surface_projection.mjs), which part of the sample it falls on -- the visible head (face+hair, bit 1), the inside of the hood
(dark, bit 2), the hood/cloak outside (figure, but neither 1 nor 2), background -- over several frames together (with each
frame's pose and camera). In head space: where it is under the hood (where the hood's brim crosses the head), where it is
lit -- from the three views together. PRIVATE (sample masks, private/test/parts/human/part_target_12.json).
  python3 test/parts/hood_map.py SURFACE.json OUT.png [OURS_ROLE_DIR]   (OURS: role renders %03d.png, 320x180 -- ours onto
  the same grid too: skin/neck/hair -> head, hoodInner/cloakInner (and the AO dark) -> inner, hood/cloak -> outer, black -> background)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
R = (P3D_DIR + '/')
S = json.load(open(sys.argv[1])); AZ, YS = S['az'], S['y']
M = json.load(open(R + 'private/test/parts/human/part_target_12.json'))['m']
H, W = len(YS), len(AZ)
OURS = sys.argv[3] if len(sys.argv) > 3 else None
def ours_class(k):                         # role render -> 1 head, 2 inner, 4 figure (the same meaning as the sample bits)
    a = np.asarray(Image.open(OURS + '/%03d.png' % (k - 1)).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fig = (r + g + b) > 30
    head = ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))
    inner = (b > 30) & (b < 90) & (g < 30) & ((r < 30) | ((r > 30) & (r < 90)))
    return (head * 1 | inner * 2 | fig * 4).astype(np.uint8)
C = np.zeros((H, W, 4))                 # 0 head, 1 inner, 2 hood (rest of the figure), 3 background
per = {}; CB = np.zeros((H, W, 4)); perB = {}
for ks, G in S['frame'].items():
    k = int(ks); G = np.array(G); m = np.frombuffer(base64.b64decode(M[str(k - 1)]), np.uint8).reshape(180, 320)
    mb = ours_class(k) if OURS else None
    CkB = np.zeros((H, W, 4))
    Ck = np.zeros((H, W, 4))
    for i in range(H):
        for j in range(W):
            x, y, v = G[i, j]
            if v < 0.2 or not (0 <= x < 320 and 0 <= y < 180): continue
            b = m[int(y), int(x)]
            c = 0 if b & 1 else 1 if b & 2 else 2 if b & 4 else 3
            Ck[i, j, c] += 1
            if mb is not None:
                b = mb[int(y), int(x)]; CkB[i, j, 0 if b & 1 else 1 if b & 2 else 2 if b & 4 else 3] += 1
    C += Ck; per[k] = Ck; CB += CkB; perB[k] = CkB
COLOUR = np.array([[250, 235, 120], [0, 220, 230], [40, 60, 200], [0, 0, 0]], float)
def colour(C):
    n = C.sum(-1); f = C / np.maximum(n, 1)[..., None]
    o = f @ COLOUR; o[n == 0] = [60, 60, 60]
    return o
Z = 7
panels = [('TOTAL', C)] + [('k%02d' % k, per[k]) for k in sorted(per)]
if OURS: panels = [('SAMPLE total', C), ('OURS total', CB)] + sum([[('sample k%02d' % k, per[k]), ('ours k%02d' % k, perB[k])] for k in sorted(per)], [])
cols = 5 if not OURS else 6; rows = (len(panels) + cols - 1) // cols
im = Image.new('RGB', (cols * (W * Z + 6), rows * (H * Z + 20)), (20, 20, 20)); d = ImageDraw.Draw(im)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
for n, (name, Cp) in enumerate(panels):
    x0, y0 = (n % cols) * (W * Z + 6), (n // cols) * (H * Z + 20)
    im.paste(Image.fromarray(colour(Cp).astype(np.uint8)).resize((W * Z, H * Z), Image.NEAREST), (x0, y0 + 16))
    d.text((x0 + 2, y0 + 1), name, fill=(255, 255, 0), font=f)
    for a in (-150, -90, -45, 0, 45, 90, 150):
        j = AZ.index(a); d.line([(x0 + j * Z + Z // 2, y0 + 16), (x0 + j * Z + Z // 2, y0 + 16 + H * Z)], fill=(120, 120, 0)); d.text((x0 + j * Z + 2, y0 + 16 + H * Z - 13), str(a), fill=(255, 255, 0), font=f)
    for yv in (1.0, 0.5, 0.0, -0.5, -1.0):
        i = min(range(H), key=lambda t: abs(YS[t] - yv)); d.line([(x0, y0 + 16 + i * Z + Z // 2), (x0 + W * Z, y0 + 16 + i * Z + Z // 2)], fill=(0, 90, 90)); d.text((x0 + 2, y0 + 16 + i * Z), 'y%+.1f' % yv, fill=(0, 255, 255), font=f)
im.save(sys.argv[2]); print(sys.argv[2], im.size)
np.save(sys.argv[2].replace('.png', '.npy'), C)
if OURS:                                   # agreement: per frame, is the class the same at the visible points (head / inner / outer / background)
    for k in sorted(per):
        A, B = per[k], perB[k]; v = (A.sum(-1) > 0) & (B.sum(-1) > 0)
        a, b = A.argmax(-1), B.argmax(-1)
        s = {n: (int(((a == c) & v).sum()), int(((b == c) & v).sum()), int(((a == c) & (b == c) & v).sum())) for c, n in enumerate(['head', 'inner', 'outer', 'background'])}
        print('k%02d' % k, 'agree %.3f' % ((a == b)[v].mean()), ' '.join('%s s%d o%d both%d' % (n, *t) for n, t in s.items()))
