"""KAPYUSHON XARITASI (12-o'tish, tuzilish): bosh sirtidan off tashqaridagi qobiq (soch qalinligida; test/sirt_proyeksiya.mjs)
har nuqtasi misolning qaysi qismiga tushadi -- ko'rinadigan bosh (yuz+soch, bit 1), kapyushon ichi (qorong'i, bit 2),
kapyushon/plash tashqi (figura, lekin 1 va 2 emas), fon -- bir necha kadrdan birga (kadr pozasi va kamerasi bilan). Bosh
fazosida: qayer kapyushon ostida (kapyushon qirrasi boshning qayeridan o'tadi), qayer yorug' -- uch ko'rinishdan birga.
MAXFIY (misol niqoblari, test/qism/inson/qism_nishon_12.json).
  python3 test/qism/kap_xarita.py SIRT.json CHIQ.png [BIZ_ROL_DIR]   (BIZ: rol renderlari %03d.png, 320x180 -- bizniki ham
  shu to'rga: teri/bo'yin/soch -> bosh, kapIch/plashIch (va AO qorong'isi) -> ich, kap/plash -> tashqi, qora -> fon)"""
import sys, json, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
R = '/home/claude/work/personaj3d/'
S = json.load(open(sys.argv[1])); AZ, YS = S['az'], S['y']
M = json.load(open(R + 'test/qism/inson/qism_nishon_12.json'))['m']
H, W = len(YS), len(AZ)
BIZ = sys.argv[3] if len(sys.argv) > 3 else None
def biz_sinf(k):                         # rol renderi -> 1 bosh, 2 ich, 4 figura (misol bitlari bilan bir xil ma'no)
    a = np.asarray(Image.open(BIZ + '/%03d.png' % (k - 1)).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fig = (r + g + b) > 30
    bosh = ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))
    ich = (b > 30) & (b < 90) & (g < 30) & ((r < 30) | ((r > 30) & (r < 90)))
    return (bosh * 1 | ich * 2 | fig * 4).astype(np.uint8)
C = np.zeros((H, W, 4))                 # 0 bosh, 1 ich, 2 kap (figura boshqa), 3 fon
per = {}; CB = np.zeros((H, W, 4)); perB = {}
for ks, G in S['kadr'].items():
    k = int(ks); G = np.array(G); m = np.frombuffer(base64.b64decode(M[str(k - 1)]), np.uint8).reshape(180, 320)
    mb = biz_sinf(k) if BIZ else None
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
RANG = np.array([[250, 235, 120], [0, 220, 230], [40, 60, 200], [0, 0, 0]], float)
def rang(C):
    n = C.sum(-1); f = C / np.maximum(n, 1)[..., None]
    o = f @ RANG; o[n == 0] = [60, 60, 60]
    return o
Z = 7
panels = [('JAMI', C)] + [('k%02d' % k, per[k]) for k in sorted(per)]
if BIZ: panels = [('MISOL jami', C), ('BIZ jami', CB)] + sum([[('misol k%02d' % k, per[k]), ('biz k%02d' % k, perB[k])] for k in sorted(per)], [])
cols = 5 if not BIZ else 6; rows = (len(panels) + cols - 1) // cols
im = Image.new('RGB', (cols * (W * Z + 6), rows * (H * Z + 20)), (20, 20, 20)); d = ImageDraw.Draw(im)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
for n, (nom, Cp) in enumerate(panels):
    x0, y0 = (n % cols) * (W * Z + 6), (n // cols) * (H * Z + 20)
    im.paste(Image.fromarray(rang(Cp).astype(np.uint8)).resize((W * Z, H * Z), Image.NEAREST), (x0, y0 + 16))
    d.text((x0 + 2, y0 + 1), nom, fill=(255, 255, 0), font=f)
    for a in (-150, -90, -45, 0, 45, 90, 150):
        j = AZ.index(a); d.line([(x0 + j * Z + Z // 2, y0 + 16), (x0 + j * Z + Z // 2, y0 + 16 + H * Z)], fill=(120, 120, 0)); d.text((x0 + j * Z + 2, y0 + 16 + H * Z - 13), str(a), fill=(255, 255, 0), font=f)
    for yv in (1.0, 0.5, 0.0, -0.5, -1.0):
        i = min(range(H), key=lambda t: abs(YS[t] - yv)); d.line([(x0, y0 + 16 + i * Z + Z // 2), (x0 + W * Z, y0 + 16 + i * Z + Z // 2)], fill=(0, 90, 90)); d.text((x0 + 2, y0 + 16 + i * Z), 'y%+.1f' % yv, fill=(0, 255, 255), font=f)
im.save(sys.argv[2]); print(sys.argv[2], im.size)
np.save(sys.argv[2].replace('.png', '.npy'), C)
if BIZ:                                   # kelishuv: har kadr, ko'rinadigan nuqtalarda sinf bir xilmi (bosh / ich / tashqi / fon)
    for k in sorted(per):
        A, B = per[k], perB[k]; v = (A.sum(-1) > 0) & (B.sum(-1) > 0)
        a, b = A.argmax(-1), B.argmax(-1)
        s = {n: (int(((a == c) & v).sum()), int(((b == c) & v).sum()), int(((a == c) & (b == c) & v).sum())) for c, n in enumerate(['bosh', 'ich', 'tashqi', 'fon'])}
        print('k%02d' % k, 'kelishuv %.3f' % ((a == b)[v].mean()), ' '.join('%s m%d b%d ikkala%d' % (n, *t) for n, t in s.items()))
