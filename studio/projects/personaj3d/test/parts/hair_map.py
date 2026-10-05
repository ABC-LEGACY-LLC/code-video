"""HAIR MAP (pass 12, structure): at every point of the head surface (the hair layer, test/surface_projection.mjs), what the
sample and we show -- hair / skin / other (hood, inner, background) -- over several frames together. To measure where to put
the hair in 3D: where the sample shows hair at a surface point and we show skin -- hair is missing. PRIVATE (sample masks).
  python3 test/parts/hair_map.py TAG [OUT.png]      (ours: frames-part/role-hair-TAG -- without the hood)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/parts')); sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import part_measure as Q, head_mask as BN
R = (P3D_DIR + '/')
TAG = sys.argv[1] if len(sys.argv) > 1 else 'pose11c'
S = json.load(open(R + 'private/test/parts/surface_projection.json'))
AZ, YS = S['az'], S['y']
def sample(k):
    L = Q.L320((SAMPLE_DIR + '/k%02d.png') % k); g, p = Q.params(k); F = Q.face_mask(L, p)
    Bm = BN.mask(BN.L320((SAMPLE_DIR + '/k%02d.png') % k), k)
    c = np.zeros((180, 320), np.uint8); c[Bm & ~F] = 1; c[F] = 2           # 1 hair, 2 skin, 0 other
    return c
def ours(k):
    r = Q.role_mask(R + 'frames-part/role-hair-%s/%03d.png' % (TAG, k - 1))
    c = np.zeros((180, 320), np.uint8); c[np.isin(r, ['hair', 'hairInner'])] = 1; c[r == 'skin'] = 2
    return c
H, W = len(YS), len(AZ)
tally = {n: np.zeros((H, W, 3)) for n in ('sample', 'ours')}
for ks, G in S['frame'].items():
    k = int(ks); G = np.array(G)
    for name, c in (('sample', sample(k)), ('ours', ours(k))):
        for i in range(H):
            for j in range(W):
                x, y, v = G[i, j]
                if v < 0.2 or not (0 <= x < 320 and 0 <= y < 180): continue
                tally[name][i, j, c[int(y), int(x)]] += 1
def colour(C):
    n = C.sum(-1); o = np.zeros((H, W, 3))
    frac = C / np.maximum(n, 1)[..., None]
    o += frac[..., 1:2] * np.array([250, 250, 250]) + frac[..., 2:3] * np.array([235, 140, 140]) + frac[..., 0:1] * np.array([50, 70, 170])
    o[n == 0] = [0, 0, 0]
    return o
Z = 8
A, B = colour(tally['sample']), colour(tally['ours'])
im = Image.fromarray(np.concatenate([A, np.full((H, 2, 3), 255), B], 1).astype(np.uint8)).resize(((2 * W + 2) * Z, H * Z), Image.NEAREST)
d = ImageDraw.Draw(im); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
for side, x0 in (('SAMPLE', 0), ('OURS (no hood)', (W + 2) * Z)):
    d.text((x0 + 4, 2), side, fill=(255, 255, 0), font=f)
    for a in (-150, -90, 0, 90, 150):
        j = AZ.index(a); d.line([(x0 + j * Z + Z // 2, 14), (x0 + j * Z + Z // 2, H * Z)], fill=(255, 255, 0)); d.text((x0 + j * Z + 2, H * Z - 14), str(a), fill=(255, 255, 0), font=f)
    for yv in (1.0, 0.0, -0.5, -1.0):
        i = min(range(H), key=lambda t: abs(YS[t] - yv)); d.text((x0 + 2, i * Z), 'y%+.1f' % yv, fill=(0, 255, 255), font=f)
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/hair_map.png'
im.save(out)
# summary: what we show at the points where the sample shows hair (>=50 %)
m, b = tally['sample'], tally['ours']
mh = (m[..., 1] / np.maximum(m.sum(-1), 1) >= 0.5) & (m.sum(-1) > 0)
bn = b.sum(-1) > 0
bf = b / np.maximum(b.sum(-1), 1)[..., None]
sel = mh & bn
print('sample hair points %d: ours hair %.0f%%, skin %.0f%%, other %.0f%%' % (sel.sum(), 100 * bf[sel, 1].mean(), 100 * bf[sel, 2].mean(), 100 * bf[sel, 0].mean()))
ms = (m[..., 2] / np.maximum(m.sum(-1), 1) >= 0.5) & (m.sum(-1) > 0) & bn
print('sample skin points %d: ours hair %.0f%%, skin %.0f%%' % (ms.sum(), 100 * bf[ms, 1].mean(), 100 * bf[ms, 2].mean()))
np.save(out.replace('.png', '.npy'), np.stack([m, b]))
