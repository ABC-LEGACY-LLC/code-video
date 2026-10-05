"""SOCH QOPLASH XARITASI (6-o'tish) -- misolning yorug' massasi (soch) bizda NIMAGA tushadi, va aksincha.
Ikkala tomonda bir xil kod: 320x180 LANCZOS, L, kompozitsiya niqobi (L>=90, top-hat yulduz/qor chiqarilgan, 2x2
ochish). Bizning har pikselimiz rol renderidan ANIQ ma'lum (teri / soch / sochIch / kapyushon / plash / fon).
  A. misol yorug' pikseli -> bizda: yorug' (mos) | soch lekin qorong'i (soya) | ichki qopqoq | teri (soch YO'Q) |
     kapyushon (kapyushon o'tishi -- keyinga qoldirilgan) | boshqa.
  B. bizning yorug' pikselimiz, misolda yorug' emas -> ortiqcha massa (qayerda).
  C. Mintaqalar (1-shot, misolning ko'z markaziga nisbatan; har tasvir): yaqin yon (ko'zdan chapda), peshona
     (ko'z ustida), uzoq yon (ko'zdan o'ngda, tepada) -- yorug' ulush misol / biz.
python3 test/audit_misol/soch_qoplash.py BIZ_PAPKA ROL_PAPKA [varaq.png]"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj/test')
from kompozitsiya import niqob

ROL = {'teri': (255, 0, 0), 'boyin': (55, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 55, 0), 'kap': (0, 0, 255),
       'kapAstar': (0, 255, 255), 'kapIch': (0, 0, 55), 'plash': (255, 0, 255), 'plashIch': (55, 0, 55), 'fon': (0, 0, 0)}
NOM = list(ROL); RR = np.array([ROL[k] for k in NOM], float)
GURUH = {'teri': 'teri', 'boyin': 'teri', 'soch': 'soch', 'sochIch': 'sochIch', 'kap': 'kap', 'kapAstar': 'kap', 'kapIch': 'kap',
         'plash': 'plash', 'plashIch': 'plash', 'fon': 'fon'}
KOZ = {**{k: (99.35, 48.7) for k in range(1, 7)}, 7: (100.15, 47.9), 8: (101.15, 47.1), 9: (102.65, 46.8), 10: (109.55, 52.0), 11: (114.25, 53.9)}
# mintaqalar ko'z markaziga nisbatan (dx0, dy0, dx1, dy1) -- 1-shot
MINT = {'yaqin_yon': (-34, -12, -6, 30), 'peshona': (-6, -30, 14, -6), 'uzoq_yon': (14, -34, 44, -2)}
SHOT = {'1-shot': range(1, 12), '2-shot': (12, 13), '3-shot': range(14, 23)}

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

def rol320(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    d = ((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1)
    return np.array([GURUH[NOM[i]] for i in range(len(NOM))])[d.argmin(-1)]

def tasvir(k, biz, rol):
    Lm = L320('/home/claude/work/maqsad/k%02d.png' % k); Lb = L320('%s/%03d.png' % (biz, k - 1))
    return niqob(Lm), niqob(Lb), rol320('%s/%03d.png' % (rol, k - 1)), Lm, Lb

def hisob(biz, rol):
    out = {}
    for s, ks in SHOT.items():
        A = {}; B = {}; nM = nB = nMos = 0; mint = {m: [0, 0, 0] for m in MINT}
        for k in ks:
            nm, nb, r, Lm, Lb = tasvir(k, biz, rol)
            nM += nm.sum(); nB += nb.sum(); nMos += (nm & nb).sum()
            for g in ('teri', 'soch', 'sochIch', 'kap', 'plash', 'fon'):
                sel = nm & ~nb & (r == g)
                A[g] = A.get(g, 0) + int(sel.sum())
                selB = nb & ~nm & (r == g)
                B[g] = B.get(g, 0) + int(selB.sum())
            if s == '1-shot':
                x0, y0 = KOZ[k]
                for m, (a, b, c, d) in MINT.items():
                    ys, xs = slice(int(y0 + b), int(y0 + d)), slice(int(x0 + a), int(x0 + c))
                    mint[m][0] += float(nm[ys, xs].mean()); mint[m][1] += float(nb[ys, xs].mean()); mint[m][2] += 1
        e = {'misol_yorug': int(nM), 'biz_yorug': int(nB), 'mos': int(nMos),
             'misol_yorug_bizda': {g: round(float(v) / max(1, nM) * 100, 1) for g, v in A.items() if v},
             'biz_ortiqcha': {g: round(float(v) / max(1, nB) * 100, 1) for g, v in B.items() if v}}
        if s == '1-shot': e['mintaqa'] = {m: (round(v[0] / v[2], 3), round(v[1] / v[2], 3)) for m, v in mint.items()}
        out[s] = e
    return out

def varaq(biz, rol, chiq):
    """har shot: misol yorug' chastotasi (magenta), bizniki (yashil), ustma-ust (kulrang = mos); 1-shotda mintaqalar"""
    rows = []
    for s, ks in SHOT.items():
        fm = np.zeros((180, 320)); fb = np.zeros((180, 320)); ter = np.zeros((180, 320)); kap = np.zeros((180, 320))
        for k in ks:
            nm, nb, r, Lm, Lb = tasvir(k, biz, rol)
            fm += nm; fb += nb; ter += (r == 'teri'); kap += (r == 'kap')
        n = len(ks); fm /= n; fb /= n; ter /= n; kap /= n
        img = np.zeros((180, 320, 3))
        img[..., 0] = fm; img[..., 1] = fb; img[..., 2] = fm
        img = np.maximum(img, np.stack([ter * 0.25, ter * 0.10, ter * 0.10], -1))      # teri (biz) -- xira qizil
        img = np.maximum(img, np.stack([kap * 0.0, kap * 0.0, kap * 0.35], -1))        # kapyushon (biz) -- xira ko'k
        im = Image.fromarray((img * 255).clip(0, 255).astype(np.uint8)).resize((640, 360), Image.NEAREST)
        if s == '1-shot':
            from PIL import ImageDraw
            d = ImageDraw.Draw(im); x0, y0 = KOZ[1]
            for m, (a, b, c, e) in MINT.items(): d.rectangle([2 * (x0 + a), 2 * (y0 + b), 2 * (x0 + c), 2 * (y0 + e)], outline=(255, 255, 0))
        rows.append(im)
    W = Image.new('RGB', (640, 360 * len(rows)))
    for i, r in enumerate(rows): W.paste(r, (0, 360 * i))
    W.save(chiq)

if __name__ == '__main__':
    biz, rol = sys.argv[1], sys.argv[2]
    o = hisob(biz, rol)
    for s, e in o.items():
        print('==', s, ' misol yorug\' %d px, biz %d, mos %d (misolning %.0f%%)' % (e['misol_yorug'], e['biz_yorug'], e['mos'], 100 * e['mos'] / max(1, e['misol_yorug'])))
        print('   misol yorug\', bizda yorug\' EMAS -- bizda nima (misol yorug\'ining %):', e['misol_yorug_bizda'])
        print('   biz yorug\', misolda yorug\' EMAS -- bizda nima (bizning yorug\'ning %):', e['biz_ortiqcha'])
        if 'mintaqa' in e: print('   mintaqa yorug\' ulushi (misol, biz):', e['mintaqa'])
    if len(sys.argv) > 3: varaq(biz, rol, sys.argv[3])
    json.dump(o, open(biz.rstrip('/') + '_qoplash.json', 'w'), indent=1)
