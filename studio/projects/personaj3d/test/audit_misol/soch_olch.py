"""SOCH O'LCHOVI (6-o'tish) -- misol va bizda BIR XIL KOD (320x180 LANCZOS, L, median 3). Soch -- yuzni qanday
ramkalaydi (qoplash), texnika sifatida; chizma bizniki.
  M1 yorug' massa (kompozitsiya niqobi, personaj/test/kompozitsiya.py): maydon %, markaz, chegara (1..99 persentil).
  M2 yaqin ko'z ORTIDAGI ochiq teri (1-shot): ko'z markazi qatoridan +7..+21 px pastdagi har 2-qatorda ko'z x idan
     chapga yurib, teri (L 48..78) qayerda tugaydi (keyin 2 piksel teri emas) -- eni (px). Ko'z markazlari misolniki
     (4-o'tish moslash nishonlari; bizniki ular ustida +-1 px).
  M3 peshona ochiqligi (1-shot): yaqin ko'z ustidan (ko'z markazi -7 px dan) tepaga har ustunda (x -4..+10) teri
     yugurishi (px) -- misolda qosh chizig'idan tepasi soch.
  M4 profil ko'zi ustidagi soch (2-shot): ko'z qutisida (130..147, 73..83) yorug' soch (L>=85) ulushi.
python3 test/audit_misol/soch_olch.py [biz_papka ...]"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj/test')
from kompozitsiya import niqob

def L320(p, med=True):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    a = np.asarray(im, float)
    return ndimage.median_filter(a, 3) if med else a

KOZ = {**{k: (99.35, 48.7) for k in range(1, 7)}, 7: (100.15, 47.9), 8: (101.15, 47.1), 9: (102.65, 46.8), 10: (109.55, 52.0), 11: (114.25, 53.9)}
teri = lambda v: 48 <= v <= 78

def m2(m, k):
    x0, y0 = KOZ[k]; r = []
    for dy in range(7, 23, 2):
        y = int(round(y0 + dy)); x = int(round(x0)); last = None
        while x > 20:
            if teri(m[y, x]): last = x
            elif last is not None and not teri(m[y, x - 1]): break
            x -= 1
        r.append(None if last is None else round(x0 - last, 1))
    return r

def m3(m, k):
    x0, y0 = KOZ[k]; r = []
    for dx in range(-4, 11, 2):
        x = int(round(x0 + dx)); y = int(round(y0 - 7)); n = 0
        while y > 2 and (teri(m[y, x]) or teri(m[y - 1, x])): n += 1; y -= 1
        r.append(n)
    return r

def olch(f):
    out = {}
    for k in range(1, 23):
        Lr = L320(f(k), med=False); m = ndimage.median_filter(Lr, 3)
        n = niqob(Lr); ys, xs = np.nonzero(n)
        e = {'massa': dict(a=round(n.mean() * 100, 2), cx=round(xs.mean(), 1) if len(xs) else None, cy=round(ys.mean(), 1) if len(xs) else None,
                           x0=int(np.percentile(xs, 1)) if len(xs) else None, x1=int(np.percentile(xs, 99)) if len(xs) else None,
                           y0=int(np.percentile(ys, 1)) if len(xs) else None, y1=int(np.percentile(ys, 99)) if len(xs) else None)}
        if k <= 11: e['koz_orti'] = m2(m, k); e['peshona'] = m3(m, k)
        if k in (12, 13): e['profil_koz_soch'] = round(float((m[73:84, 130:148] >= 85).mean()), 3)
        out[k] = e
    return out

def med(v): v = [t for t in v if t is not None]; return round(float(np.median(v)), 1) if v else None

if __name__ == '__main__':
    papkalar = sys.argv[1:] or ['kadrlar-misol/anime-sahna5']
    natija = {'misol': olch(lambda k: '/home/claude/work/maqsad/k%02d.png' % k)}
    for p in papkalar: natija[p] = olch(lambda k, p=p: '%s/%03d.png' % (p, k - 1))
    for nom, o in natija.items():
        print('==', nom)
        for s, (a, b) in (('1-shot', (1, 11)), ('2-shot', (12, 13)), ('3-shot', (14, 22))):
            M = [o[k]['massa'] for k in range(a, b + 1)]
            print('  %s yorug\' massa: maydon %.2f%%  markaz (%.0f, %.0f)  x %s..%s  y %s..%s' % (s, np.mean([t['a'] for t in M]), np.mean([t['cx'] for t in M if t['cx']]), np.mean([t['cy'] for t in M if t['cy']]),
                  med([t['x0'] for t in M]), med([t['x1'] for t in M]), med([t['y0'] for t in M]), med([t['y1'] for t in M])))
        print('  ko\'z orti teri (1-9, mediana har tasvir):', [med(o[k]['koz_orti']) for k in range(1, 10)])
        print('  peshona teri (1-9, mediana):', [med(o[k]['peshona']) for k in range(1, 10)])
        print('  profil ko\'zi ustida soch ulushi (12, 13):', o[12]['profil_koz_soch'], o[13]['profil_koz_soch'])
    json.dump(natija, open('test/audit_misol/soch_olch.json', 'w'), indent=1)
