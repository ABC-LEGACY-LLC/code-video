"""KAPYUSHON KALITLARI EKRANDA (12-o'tish, 2- va 3-kadr) -- misoldan O'LCHANADI, 320x180 L.
12-o'tish 1-qadamidagi kap3-qirra.py dan (eskirgan) farqi: qirra endi to'g'ri chiziq (cho'qqi -> chakka) EMAS.
U chiziq misoldagi astar tasmaning USTIDAN o'tardi -- tasma bizda osmonda 'shox' bo'lib
qoldi. Endi qirra = astar tasmaning TEPA CHETI (har ustunda o'lchangan), tasmaning pastki
cheti ham o'lchanadi. Kalitlar ekranda (540x304) saqlanadi: kapyushon -- yelkadagi alohida
mato, uning joyi misolning sahnalashtirishi (qayerda turadi) sifatida o'lchanadi; bosh
uning ichiga joylanadi (bosh izi alohida -- izlar.json).

  tasma  -- qirra osti astar (33..65, median 3, soch massasi tepasidagi quti, eng katta
            qism; test/kapyushon.py): 7 ustun kalitida tepa va past chet (x oralig'i teng
            bo'lingan), chap uchi C (eng chap ustunning tepasi), o'ng uchi E (eng o'ng ustun)
  pona   -- kapyushon ichi (6.5..12, median 5, test/kapyushon.py): uchi A, o'ng tomoni R1-R2
            (tik chet yoki bitta o'tkir uch), past uchi B -- chetlarga chiziq, kesishmalar
            (median o'tkir uchlarni yeydi -- pona_kalit)
  yon    -- pona ostidan qirra: B.y+10 va B.y+30 qatorlarda, B.x-30 dan o'ngga birinchi
            bosh pikseli (L >= 36, median 3)
  tepa_ong-- tashqi massaning kadr tepasidagi (0..3 qator) eng o'ng nuqtasi: kapyushon
            chizig'i kadr tepasini shu yerda kesadi
  burchak-- tashqi massaning (12..32, median 7) E dan YUQORIDAGI qismidagi eng yuqori-o'ng
            nuqtasi (x - y eng katta): kapyushonning o'ng-tepa burchagi. Pastdagi zich qor
            (L 15..30) massaga qo'shilib ketadi -- shuning uchun faqat E.y dan yuqori.
Kadr ichida [1,2,1]/4 silliqlanadi (2-kadrda 2 tasvir -- o'rtacha).
python3 test/kap3-olch.py [--kalibr]"""
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import tasvir
import kapyushon as KP

W = '/home/claude/work/personaj'
M = '/home/claude/work/maqsad/k%02d.png'
NK = 7
KADR = {'2': [12, 13], '3': list(range(14, 23))}
SX, SY = 540 / 320, 304 / 180


def _poli_niq(v, shape, med):
    """ko'pburchak -> 4x da chizilgan maydon ulushi > 0.5 -> median (o'lchovdagi bilan bir xil)"""
    from PIL import Image, ImageDraw
    H, W_ = shape
    im = Image.new('L', (W_ * 4, H * 4), 0)
    ImageDraw.Draw(im).polygon([(x * 4 + 2, y * 4 + 2) for x, y in v], fill=255)
    f = np.asarray(im.resize((W_, H), Image.BOX)).astype(float) / 255 > 0.5
    return ndimage.median_filter(f.astype(np.uint8), med) > 0


def _fit(ys, xs):
    """x = a*y + b (eng kichik kvadrat) -- chetlar qator bo'yicha o'lchanadi"""
    a, b = np.polyfit(np.asarray(ys, float), np.asarray(xs, float), 1)
    return a, b


def pona_kalit(pm, burchak_px=4, aylana=4):
    """pona: A (uch, yuqorida), R1 va R2 (o'ng tomon: 3-kadr oxirida o'ng cheti TIK -- soch/astar
    uni kesadi; 14..16 da o'tkir uch, R1 = R2), B (past uch). Chap cheti A dan B gacha to'g'ri.
    Median 5 o'tkir uchlarni yeydi (sintetikda uch 5 px pastga), to'g'ri chetlarni saqlaydi:
    uchlar niqobdan OLINMAYDI. Har qatorda niqobning chap va o'ng chekkasi (piksel markazi
    +-0.5 -- chet piksel chegarasida); chap chet, o'ng-yuqori va o'ng-past chetlarga (uchlardan
    burchak_px qator uzoqda; qisqa chetda kamroq) x = a*y + b to'g'ri chizig'i; uchlar --
    kesishmalar."""
    ys = np.unique(np.nonzero(pm)[0])
    xl = np.array([np.nonzero(pm[y])[0].min() for y in ys]) - 0.5
    xr = np.array([np.nonzero(pm[y])[0].max() for y in ys]) + 0.5
    xm = xr.max()
    ong = ys[xr >= xm - 1]
    tik = (ong.max() - ong.min()) >= 10
    yA, yB = float(ys.min()) - 0.5, float(ys.max()) + 0.5
    yR1, yR2 = float(ong.min()), float(ong.max())

    def tanla(y0, y1):
        m = max(1.0, min(burchak_px, (y1 - y0 - 3) / 2))
        return (ys > y0 + m) & (ys < y1 - m)
    fL = fU = fD = None
    for _ in range(aylana):
        s_l, s_u, s_d = tanla(yA, yB), tanla(yA, yR1), tanla(yR2, yB)
        if s_l.sum() >= 3: fL = _fit(ys[s_l], xl[s_l])
        if s_u.sum() >= 3: fU = _fit(ys[s_u], xr[s_u])
        if s_d.sum() >= 3: fD = _fit(ys[s_d], xr[s_d])
        if fL is not None and fU is not None:
            yA = (fU[1] - fL[1]) / (fL[0] - fU[0])
        if fL is not None and fD is not None:
            yB = (fD[1] - fL[1]) / (fL[0] - fD[0])
        if tik:
            if fU is not None and abs(fU[0]) > 1e-6: yR1 = (xm - fU[1]) / fU[0]
            if fD is not None and abs(fD[0]) > 1e-6: yR2 = (xm - fD[1]) / fD[0]
        elif fU is not None and fD is not None:
            yR1 = yR2 = (fD[1] - fU[1]) / (fU[0] - fD[0])
    # chet chizig'i topilmagan uch (qisqa chet) -- niqobning o'zidan (median yegani qoladi)
    xat = lambda f, y, v: f[0] * y + f[1] if f is not None else v
    A = [xat(fL, yA, xl[0] + 0.5), yA]
    B = [xat(fL, yB, xl[-1] + 0.5), yB]
    R1 = [xat(fU, yR1, xm), yR1]
    R2 = [xat(fD, yR2, xm), yR2]
    return [[float(round(v, 2)) for v in p] for p in (A, R1, R2, B)]


def kalitlar(L):
    o = KP.olch(L)
    s, ta, po, ma = o['soch'], o['tasma'], o['pona'], o['massa']
    r = {}
    m = ta['niq']; ys, xs = np.nonzero(m)
    x0, x1 = int(xs.min()), int(xs.max())
    kx = np.linspace(x0, x1, NK)
    tepa, past = [], []
    for x in kx:
        # kalit ustuni atrofida 3 ustun (median) -- bitta ustunning shovqini
        c = [int(round(x)) + d for d in (-1, 0, 1) if x0 <= int(round(x)) + d <= x1 and (xs == int(round(x)) + d).any()]
        tepa.append([float(x), float(np.median([ys[xs == cc].min() for cc in c]))])
        past.append([float(x), float(np.median([ys[xs == cc].max() for cc in c]))])
    r['tepa'], r['past'] = tepa, past
    pm = po['niq']
    r['A'], r['R1'], r['R2'], r['B'] = pona_kalit(pm)
    bosh = ndimage.median_filter(L, 3) >= 36
    yon = []
    for dy in (10, 30):
        y = int(min(170, r['B'][1] + dy)); xl = int(r['B'][0] - 30)
        row = bosh[y, xl:xl + 80]
        if row.any():
            yon.append([float(xl + int(np.argmax(row))), float(y)])
    r['yon'] = yon
    ys_, xs_ = np.nonzero(ma['niq'][:4]); r['tepa_ong'] = [float(xs_.max()) + 0.5, 0.0] if len(xs_) else [0.0, 0.0]
    mm = ma['niq'].copy(); mm[int(r['tepa'][-1][1]):, :] = False
    yy, xx = np.nonzero(mm); j = int(np.argmax(xx - yy)); r['burchak'] = [float(xx[j]), float(yy[j])]
    r['_tasma_maydon'] = int(m.sum()); r['_pona_maydon'] = int(pm.sum())
    return r


def kalibr():
    """sintetik: tashqi L 19 (massa), soch L 100 qutisi, astar tasma -- tepa cheti ma'lum
    to'g'ri chiziq, qalinligi ma'lum; pona -- ma'lum uchburchak (o'tkir o'ng uch) va o'ng
    cheti TIK to'rtburchak."""
    rng = np.random.default_rng(4)
    from matplotlib.path import Path
    UCH = [[135, 60], [158, 82], [158, 82], [140, 106]]
    TIK = [[135, 60], [160, 80], [160, 96], [142, 106]]

    def yasa(dx=0, dy=0, qal=12, pona=UCH):
        L = np.full((180, 320), 3.0)
        L[rng.random((180, 320)) < 0.02] = 200
        L[0:180, 0:230] = 19
        L[90 + dy:130 + dy, 160 + dx:215 + dx] = 100            # soch
        L[130 + dy:170 + dy, 150 + dx:200 + dx] = 60            # yuz
        yy, xx = np.mgrid[0:180, 0:320]
        tep = 80 + dy - (xx - 160 - dx) * 0.3                   # tasma tepa cheti: x 160 da 80, x 215 da 63.5
        ban = (xx >= 160 + dx) & (xx <= 215 + dx) & (yy >= tep) & (yy < tep + qal)
        L[ban] = 45
        P = Path(np.array([p for i, p in enumerate(pona) if i != 2 or pona[2] != pona[1]]) + [dx, dy])
        ins = P.contains_points(np.c_[xx.ravel(), yy.ravel()]).reshape(L.shape)
        L[ins] = 8
        L[112 + dy:175, 0:125 + dx] = 19
        return L

    a = kalitlar(yasa()); b = kalitlar(yasa(dx=4, dy=3)); c = kalitlar(yasa(qal=6)); t = kalitlar(yasa(pona=TIK))
    # tepa chet: kalit x da kutilgan y = 80 - (x-160)*0.3 (+-1: piksel chegarasi)
    e1 = max(abs(y - (80 - (x - 160) * 0.3)) for x, y in a['tepa'])
    q_a = np.mean([p[1] - t_[1] for t_, p in zip(a['tepa'], a['past'])]); q_c = np.mean([p[1] - t_[1] for t_, p in zip(c['tepa'], c['past'])])
    r1 = e1 <= 1.0 and abs(q_a - 11) <= 1.0 and abs(q_c - 5) <= 1.0
    d = [np.subtract(b[n], a[n]) for n in ('A', 'R1', 'R2', 'B')]
    r2 = all(abs(v[0] - 4) <= 0.6 and abs(v[1] - 3) <= 0.6 for v in d)
    xa = max(max(abs(np.subtract(a[n], UCH[j]))) for j, n in enumerate(('A', 'R1', 'R2', 'B')))
    xt = max(max(abs(np.subtract(t[n], TIK[j]))) for j, n in enumerate(('A', 'R1', 'R2', 'B')))
    r3 = xa <= 1.5 and xt <= 1.5
    print('kalibr kap3/tasma  tepa chet xato %.2f px (<=1), qalinlik 12 -> %.1f, 6 -> %.1f (piksel: 11, 5)  %s' % (e1, q_a, q_c, 'PROVEN' if r1 else 'UNPROVEN'))
    print('kalibr kap3/pona   (+4,+3) surilgan -> %s  %s' % (' '.join('(%+.1f,%+.1f)' % tuple(v) for v in d), 'PROVEN' if r2 else 'UNPROVEN'))
    print('kalibr kap3/pona   uchburchak %s  eng katta xato %.2f px' % (' '.join('(%.1f,%.1f)' % tuple(a[n]) for n in ('A', 'R1', 'R2', 'B')), xa))
    print('kalibr kap3/pona   tik o\'ng chet %s  eng katta xato %.2f px  %s' % (' '.join('(%.1f,%.1f)' % tuple(t[n]) for n in ('A', 'R1', 'R2', 'B')), xt, 'PROVEN' if r3 else 'UNPROVEN'))
    return r1 and r2 and r3


def sil(v):
    v = np.array(v, float)
    if len(v) < 3:
        return np.repeat(v.mean(0, keepdims=True), len(v), 0) if len(v) == 2 else v
    p = np.concatenate([v[:1], v, v[-1:]])
    return (p[:-2] + 2 * p[1:-1] + p[2:]) / 4


def main():
    ok = kalibr()
    if '--kalibr' in sys.argv:
        sys.exit(0 if ok else 1)
    assert ok
    R = {}
    for g, ks in KADR.items():
        K = {k: kalitlar(tasvir.ol(M % k, (320, 180))) for k in ks}
        for k in ks:
            r = K[k]
            print('tasvir %2d  tasma %4d px  tepa %s  past %s | pona %4d px A %s R1 %s R2 %s B %s | yon %s | burchak %s' % (
                k, r['_tasma_maydon'], ' '.join('%.0f' % t[1] for t in r['tepa']), ' '.join('%.0f' % t[1] for t in r['past']),
                r['_pona_maydon'], r['A'], r['R1'], r['R2'], r['B'], r['yon'], r['burchak']))
        nom = ['tepa', 'past', 'A', 'R1', 'R2', 'B', 'yon', 'burchak', 'tepa_ong']
        S = {n: sil([K[k][n] for k in ks]) for n in nom}
        for i, k in enumerate(ks):
            e = {n: (np.array(S[n][i]) * [SX, SY]).round(1).tolist() for n in nom}
            R[str(k)] = e
    json.dump(R, open(W + '/kap3-ekran.json', 'w'), indent=1)
    print('->', W + '/kap3-ekran.json')


if __name__ == '__main__':
    main()
