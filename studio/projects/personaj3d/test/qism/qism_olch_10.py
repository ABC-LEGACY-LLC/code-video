"""QISM O'LCHOVI (10-o'tish) -- misolda va bizda BIR XIL KOD: har kadrda yuzning har qismi alohida.
Foydalanuvchi: "qaysi biri soch, qaysi biri burun, ko'z, qosh, og'iz, daha -- ajratib ol; boshni og'izgacha o'lchab
dahani qoldirma; o'z modelimizda soch va kapyushonni olib turib birma-bir o'lcha, keyin qo'yib o'lcha".

Tasvir: 320x180 (LANCZOS), L, median 3. Qismlar:
  CHETLAR (skan -- rim chiziqlari yuz tomonida qoladi):
    kontur  -- har qatorda yuz ichidan (x0) o'ngga: oxirgi L >= 45 piksel, ketma-ket 2 piksel L < past bo'lguncha
               (1-shot: uzoq yonoq konturi; 2-shot: profil -- peshona, burun, lab, iyak; 3-shot: pastki yuz o'ng cheti)
    jag'    -- har ustunda yuz ichidan (y0) pastga: xuddi shunday (jag' osti / iyak osti)
    iyak uchi -- kontur va jag' nuqtalaridan shot yo'nalishi bo'yicha eng chetkisi (1-shot pastga-o'ngga, 2-shot
               pastga-oldinga, 3-shot pastga-chapga); burun uchi -- kontur qatorlari oralig'idagi eng o'ng nuqta.
  BO'LAKLAR: qorong'i komponentlar (8-bog'lanish) yuzning to'ldirilgan niqobi ICHIDA (yuz -- (L >= 47) & ~soch,
    soch = (L >= 85) ning 3x3 ochilishi -- ingichka rim yo'qoladi), shot qutisida: ko'z (eng katta), qosh (eng katta),
    og'iz va lab soyasi (eng qorong'i). Markaz -- qorong'ilik og'irligi bilan; chetlari ham yoziladi.
Qutilar misolning kameralarida (bizning kamera shu joyga moslangan) -- ikkala tomonga bir xil. Topilmasa -- None.
Tekshiruv varaqlari (test/qism/tekshir_varaq.py) bo'yicha: jag' skani lab soyasidan PASTDAN boshlanadi (1-shot x 126 da
lab soyasida to'xtab 89 berardi); 2-shot jag' ustunlari 146..160 (x < 146 da misolning jag' chizig'i bo'yinga qo'shilib
ketadi -- skan bo'yin bo'ylab 134 gacha tushardi); 3-shotda og'iz ishlatilmaydi (pastki yuzdagi bir nechta kichik qorong'i
belgidan -- burun teshigi, lab burchagi, soch soyasi -- qoida har kadrda boshqasini tanlaydi: x 144..162).
Kalibr: xuddi shu kod bizning renderimizda -- 3D dan aniq nuqtalar bilan (test/qism/kalibr.py).
python3 test/qism/qism_olch.py PAPKA [--boshi 0] [--chiq F.json]   (misol: '/home/claude/work/maqsad/k%02d.png')"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 3)

# kadr guruhlari (misol kadr raqami 1-asosli): urug', quti, kontur/jag' skanlari, iyak yo'nalishi, burun qatorlari, qism qutilari
P = {
    'a': {'kadr': range(1, 10), 'urug': (112, 78), 'quti': (60, 15, 150, 125), 'iyak': (0.45, 0.89),
          'kontur': (40, 108, 108, 44), 'jag': (84, 130, 96), 'past': 50,
          'koz_yaqin': (84, 36, 106, 58), 'koz_uzoq': (112, 42, 130, 58), 'qosh_yaqin': (90, 30, 110, 40), 'qosh_uzoq': (108, 32, 128, 43),
          'ogiz': (110, 78, 130, 90), 'lab': (114, 88, 130, 97)},
    'b': {'kadr': (10,), 'urug': (118, 80), 'quti': (70, 20, 160, 125), 'iyak': (0.45, 0.89),
          'kontur': (40, 108, 118, 44), 'jag': (96, 138, 100), 'past': 50, 'burun': (52, 76),
          'koz_yaqin': (95, 42, 118, 60), 'koz_uzoq': (118, 42, 136, 62), 'qosh_yaqin': (95, 30, 120, 44), 'qosh_uzoq': (118, 30, 140, 46),
          'ogiz': (122, 80, 142, 90), 'lab': (125, 90, 142, 100)},
    'c': {'kadr': (11,), 'urug': (120, 80), 'quti': (70, 20, 160, 125), 'iyak': (0.45, 0.89),
          'kontur': (42, 112, 120, 44), 'jag': (98, 142, 102), 'past': 50, 'burun': (54, 80),
          'koz_yaqin': (100, 44, 124, 62), 'koz_uzoq': (122, 44, 142, 64), 'qosh_yaqin': (100, 32, 124, 46), 'qosh_uzoq': (122, 32, 144, 48),
          'ogiz': (126, 82, 146, 92), 'lab': (128, 92, 146, 102)},
    'd': {'kadr': (12, 13), 'urug': (146, 96), 'quti': (110, 50, 178, 125), 'iyak': (0.71, 0.71),
          'kontur': (60, 116, 140, 38), 'jag': (146, 160, 100), 'past': 40, 'burun': (80, 97),
          'koz_yaqin': (126, 70, 162, 90), 'qosh_yaqin': (126, 56, 165, 72), 'ogiz': (148, 94, 166, 110)},
    'e': {'kadr': range(14, 23), 'urug': (163, 130), 'quti': (125, 95, 200, 170), 'iyak': (-0.35, 0.94),
          'kontur': (138, 158, 150, 44), 'jag': (132, 168, 140), 'past': 44,
          'koz_yaqin': (145, 100, 170, 118), 'koz_uzoq': (166, 108, 188, 130)},
}
def params(k):
    for g, p in P.items():
        if k in p['kadr']: return g, p
    raise KeyError(k)

def skan(L, x, y, dx, dy, past, n=60, yuq=45):
    """(x, y) dan (dx, dy) yo'nalishda: oxirgi L >= yuq piksel, ketma-ket 2 piksel L < past bo'lguncha"""
    if not (0 <= x < 318 and 0 <= y < 178) or L[y, x] < yuq: return None      # boshlanish yuz ichida bo'lishi shart
    oxir = None
    for i in range(n):
        xi, yi = x + dx * i, y + dy * i
        if not (0 <= xi < 318 and 0 <= yi < 178): break
        if L[yi, xi] >= yuq: oxir = (xi, yi)
        if oxir is not None and L[yi + dy, xi + dx] < past and L[yi + 2 * dy, xi + 2 * dx] < past: break
    return oxir

def yuz_niqob(L, p):
    x0, y0, x1, y1 = p['quti']
    soch = ndimage.binary_opening(L >= 85, structure=np.ones((3, 3)))
    Y = (L >= 47) & ~soch
    Q = np.zeros_like(Y); Q[y0:y1, x0:x1] = True; Y &= Q
    lab, _ = ndimage.label(Y)
    sx, sy = p['urug']; c = lab[sy, sx]
    if not c:
        ys, xs = np.nonzero(lab[max(0, sy - 6):sy + 7, max(0, sx - 6):sx + 7])
        if len(xs): j = np.argmin((xs - 6) ** 2 + (ys - 6) ** 2); c = lab[max(0, sy - 6) + ys[j], max(0, sx - 6) + xs[j]]
    if not c: return None
    return ndimage.binary_fill_holes(lab == c)

def bolak(L, quti, chegara, eng='katta'):
    """quti ichidagi qorong'i bo'laklar: quti chetiga tegadigan katta massalar (kapyushon, fon, soch soyasi) tashlanadi;
    eng katta (ko'z, qosh) yoki eng qorong'i (og'iz, lab soyasi) -- markaz qorong'ilik og'irligi bilan"""
    x0, y0, x1, y1 = quti
    D = np.zeros(L.shape, bool); D[y0:y1, x0:x1] = L[y0:y1, x0:x1] < chegara
    lab, n = ndimage.label(D, structure=np.ones((3, 3)))
    best = None
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(xs) < 2: continue
        if (xs.min() == x0 or xs.max() == x1 - 1 or ys.min() == y0 or ys.max() == y1 - 1) and len(xs) > 12: continue
        w = (chegara - L[ys, xs]).clip(0.5)
        o = {'x': round(float((xs * w).sum() / w.sum()), 2), 'y': round(float((ys * w).sum() / w.sum()), 2), 'n': int(len(xs)),
             'chap': int(xs.min()), 'ong': int(xs.max()), 'tepa': int(ys.min()), 'past': int(ys.max()), 'L': float(L[ys, xs].min())}
        key = o['n'] if eng == 'katta' else -o['L'] + 0.01 * o['n']
        if best is None or key > best[0]: best = (key, o)
    return best[1] if best else None

def olch(L, k):
    g, p = params(k)
    o = {'guruh': g}
    ya, yb, x0, past = p['kontur']
    kon = {}
    for y in range(ya, yb + 1):
        r = skan(L, x0, y, 1, 0, past)
        if r: kon[y] = r[0]
    o['kontur'] = kon
    xa, xb, y0 = p['jag']
    jag = {}
    for x in range(xa, xb + 1):
        r = skan(L, x, y0, 0, 1, p['past'])
        if r: jag[x] = r[1]
    o['jag'] = jag
    pts = [(x, y) for x, y in jag.items()] or [(x, y) for y, x in kon.items()]   # iyak -- jag' osti izining shot yo'nalishidagi uchi
    if pts:
        dx, dy = p['iyak']; s = np.array([x * dx + y * dy for x, y in pts]); m = s.max()
        sel = [pts[i] for i in np.nonzero(s >= m - 1.0)[0]]
        o['iyak_uchi'] = [round(float(np.mean([a for a, b in sel])), 2), round(float(np.mean([b for a, b in sel])), 2)]
    if 'burun' in p:
        a, b = p['burun']; oc = {y: x for y, x in kon.items() if a <= y <= b}
        if oc:
            m = max(oc.values()); yy = [y for y, x in oc.items() if x == m]
            o['burun_uchi'] = [float(m), round(float(np.mean(yy)), 2)]
    F = yuz_niqob(L, p)
    if F is not None and F.sum() >= 30:
        ys, xs = np.nonzero(F); o['yuz_maydon'] = int(F.sum()); o['yuz_quti'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    for q in ('koz_yaqin', 'koz_uzoq', 'qosh_yaqin', 'qosh_uzoq', 'ogiz', 'lab'):
        if q in p:
            v = bolak(L, p[q], chegara=(50 if q in ('ogiz', 'lab') else 48 if q.startswith('qosh') else 25),
                      eng=('qorongi' if q in ('ogiz', 'lab') else 'katta'))
            o[q] = v if v is not None and yaroqli(q, v, g) else None
    return o

def yaroqli(q, v, g):
    """shakl sharti (tekshiruv varaqlaridan): qosh -- yotiq tasma (en >= 8 px, en >= 1.8 x bo'y; soch cheti tik bo'ladi);
    ko'z -- kamida 4 px, 3-shotda yumuq kiprik chizig'i yotiq (en >= 2 x bo'y); og'iz/lab -- yotiq (en >= bo'y)"""
    en, boy = v['ong'] - v['chap'] + 1, v['past'] - v['tepa'] + 1
    if q.startswith('qosh'): return en >= 8 and en >= 1.8 * boy
    if q.startswith('koz'): return v['n'] >= 4 and (g != 'e' or en >= 2 * boy) and (g != 'a' or q != 'koz_uzoq' or boy <= 1.6 * en)
    return en >= boy

ROL = {'teri': (255, 0, 0), 'boyin': (128, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 128, 0), 'kap': (0, 0, 255), 'kapAstar': (0, 255, 255),
       'kapIch': (0, 0, 128), 'plash': (255, 0, 255), 'plashIch': (128, 0, 128), 'fon': (0, 0, 0)}
TON = {'teri': 58, 'boyin': 12, 'soch': 100, 'sochIch': 30, 'kap': 20, 'kapAstar': 40, 'kapIch': 10, 'plash': 20, 'plashIch': 10, 'fon': 12}
def rol_niqob(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    nom = list(ROL); RR = np.array([ROL[n] for n in nom], float)
    return np.array(nom)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]
def rol_L(p):
    """rol renderidan sun'iy yorug'lik: teri 58 (misol terisi 57..61), soch 100, qolgani qorong'i -- chetlar skani shu bilan
    (yalang'och renderda -- boshning o'z siluetasi: bo'yin ham 'yuz emas', jag' osti shu yerda tugaydi)"""
    r = rol_niqob(p); L = np.zeros(r.shape)
    for n, v in TON.items(): L[r == n] = v
    return L

def papka_olch(papka, boshi=0):
    f = (lambda k: papka % k) if '%' in papka else (lambda k: '%s/%03d.png' % (papka, k - 1 + boshi))
    return {k: olch(L320(f(k)), k) for k in range(1, 23)}

if __name__ == '__main__':
    papka = sys.argv[1]
    boshi = int(sys.argv[sys.argv.index('--boshi') + 1]) if '--boshi' in sys.argv else 0
    chiq = sys.argv[sys.argv.index('--chiq') + 1] if '--chiq' in sys.argv else None
    r = papka_olch(papka, boshi)
    if chiq: json.dump(r, open(chiq, 'w'))
    for k, o in r.items():
        f = lambda v: '-' if v is None else '(%.1f, %.1f)' % (v['x'], v['y']) if isinstance(v, dict) else '(%.1f, %.1f)' % tuple(v)
        print('k%02d %s | koz %s %s | qosh %s %s | burun %s | ogiz %s lab %s | iyak %s' % (k, o.get('guruh'),
              f(o.get('koz_yaqin')), f(o.get('koz_uzoq')), f(o.get('qosh_yaqin')), f(o.get('qosh_uzoq')), f(o.get('burun_uchi')),
              f(o.get('ogiz')), f(o.get('lab')), f(o.get('iyak_uchi'))))
