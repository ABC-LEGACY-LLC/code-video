"""SOCH XARITASI (12-o'tish, tuzilish): bosh sirtidagi (soch qatlami, test/sirt_proyeksiya.mjs) har nuqtada misol va biz
nima ko'rsatadi -- soch / teri / boshqa (kapyushon, ich, fon) -- bir necha kadrdan birga. Sochni 3D da qayerga qo'yishni
o'lchash uchun: misolda soch ko'rinadigan sirt nuqtasida bizda teri bo'lsa -- soch yetishmaydi. MAXFIY (misol niqoblari).
  python3 test/qism/soch_xarita.py TEG [CHIQ.png]      (biz: kadrlar-qism/rol-soch-TEG -- kapyushonsiz)"""
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism'); sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import qism_olch as Q, bosh_niqob as BN
R = '/home/claude/work/personaj3d/'
TEG = sys.argv[1] if len(sys.argv) > 1 else 'poza11c'
S = json.load(open(R + 'test/qism/sirt_proyeksiya.json'))
AZ, YS = S['az'], S['y']
def misol(k):
    L = Q.L320('/home/claude/work/maqsad/k%02d.png' % k); g, p = Q.params(k); F = Q.yuz_niqob(L, p)
    Bm = BN.niqob(BN.L320('/home/claude/work/maqsad/k%02d.png' % k), k)
    c = np.zeros((180, 320), np.uint8); c[Bm & ~F] = 1; c[F] = 2           # 1 soch, 2 teri, 0 boshqa
    return c
def biz(k):
    r = Q.rol_niqob(R + 'kadrlar-qism/rol-soch-%s/%03d.png' % (TEG, k - 1))
    c = np.zeros((180, 320), np.uint8); c[np.isin(r, ['soch', 'sochIch'])] = 1; c[r == 'teri'] = 2
    return c
H, W = len(YS), len(AZ)
say = {n: np.zeros((H, W, 3)) for n in ('misol', 'biz')}
for ks, G in S['kadr'].items():
    k = int(ks); G = np.array(G)
    for nom, c in (('misol', misol(k)), ('biz', biz(k))):
        for i in range(H):
            for j in range(W):
                x, y, v = G[i, j]
                if v < 0.2 or not (0 <= x < 320 and 0 <= y < 180): continue
                say[nom][i, j, c[int(y), int(x)]] += 1
def rang(C):
    n = C.sum(-1); o = np.zeros((H, W, 3))
    frac = C / np.maximum(n, 1)[..., None]
    o += frac[..., 1:2] * np.array([250, 250, 250]) + frac[..., 2:3] * np.array([235, 140, 140]) + frac[..., 0:1] * np.array([50, 70, 170])
    o[n == 0] = [0, 0, 0]
    return o
Z = 8
A, B = rang(say['misol']), rang(say['biz'])
im = Image.fromarray(np.concatenate([A, np.full((H, 2, 3), 255), B], 1).astype(np.uint8)).resize(((2 * W + 2) * Z, H * Z), Image.NEAREST)
d = ImageDraw.Draw(im); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
for side, x0 in (('MISOL', 0), ('BIZ (kapyushonsiz)', (W + 2) * Z)):
    d.text((x0 + 4, 2), side, fill=(255, 255, 0), font=f)
    for a in (-150, -90, 0, 90, 150):
        j = AZ.index(a); d.line([(x0 + j * Z + Z // 2, 14), (x0 + j * Z + Z // 2, H * Z)], fill=(255, 255, 0)); d.text((x0 + j * Z + 2, H * Z - 14), str(a), fill=(255, 255, 0), font=f)
    for yv in (1.0, 0.0, -0.5, -1.0):
        i = min(range(H), key=lambda t: abs(YS[t] - yv)); d.text((x0 + 2, i * Z), 'y%+.1f' % yv, fill=(0, 255, 255), font=f)
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/soch_xarita.png'
im.save(out)
# yig'indi: misolda soch ko'rinadigan (>=50 %) nuqtalarda bizda nima
m, b = say['misol'], say['biz']
mh = (m[..., 1] / np.maximum(m.sum(-1), 1) >= 0.5) & (m.sum(-1) > 0)
bn = b.sum(-1) > 0
bf = b / np.maximum(b.sum(-1), 1)[..., None]
sel = mh & bn
print('misolda soch nuqtalari %d: bizda soch %.0f%%, teri %.0f%%, boshqa %.0f%%' % (sel.sum(), 100 * bf[sel, 1].mean(), 100 * bf[sel, 2].mean(), 100 * bf[sel, 0].mean()))
ms = (m[..., 2] / np.maximum(m.sum(-1), 1) >= 0.5) & (m.sum(-1) > 0) & bn
print('misolda teri nuqtalari %d: bizda soch %.0f%%, teri %.0f%%' % (ms.sum(), 100 * bf[ms, 1].mean(), 100 * bf[ms, 2].mean()))
np.save(out.replace('.png', '.npy'), np.stack([m, b]))
