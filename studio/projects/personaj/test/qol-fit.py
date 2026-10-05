"""1-KADR: TANA CHETI VA QO'L -- misol niqobiga kadrma-kadr moslash (10-o'tish).

taqqos/siluet (L<20, median 5, tanaga ulangan) ko'rsatdi: IoU 0.70, va farq
tizimli -- (1) iyak ostidan qo'lgacha misolda tana cheti TIK (x~131, 1..6),
bizniki diagonal (113 -> 140); (2) qo'l ostida qo'ltiq botig'i (x~125); (3)
1..4 da qo'l ostidan osmon ko'rinadigan tirqish (y~158..166); (4) qo'l --
qalin bilak + yuqori-o'ngga panja, bizniki torayuvchi tig'; (5) qo'l ichi L 8,
bizniki 16.

Bu skript chizmani KUZATMAYDI, bizning ikki modelimizni o'lchovga moslaydi:
  TANA  -- har qatorda tananing o'ng cheti: chapdan boshlangan qorong'i
           yugurishning oxiri (6 px gacha uzilish tana ichidagi yorug' tasma
           deb o'tkaziladi), 3 qatorlik median, har 3 px da kalit;
  QO'L  -- bizning "til" modelimiz (asos B, yarim eni hB, uch T, tepa chet
           boshqaruvi U, past chet boshqaruvi D; ikki kvadratik egri), tana
           qoplamagan qoldiqqa IoU bo'yicha moslanadi (yumshoq niqob, Nelder-Mead).
Natija: qol-fit.json -> varaq.mjs (PLASH_PAST, QOL)."""
import sys, json
import numpy as np
from scipy import ndimage, optimize
from PIL import Image, ImageDraw
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import loyiha, tasvir, siluet

W = '/home/claude/work/personaj'
loy = loyiha.Loyiha(W + '/taqqos.json')
BOG, SH, MED = (126, 150), '<20', 5
Y0, Y1, X0 = 112, 180, 120              # tana kalitlari qatorlari; yugurish boshi
UZ = 6                                   # tana ichidagi yorug' tasma (<=6 px) ko'prik bilan o'tiladi
QX0, QY0, QX1, QY1 = 108, 108, 200, 180  # moslash qutisi
S = 4                                    # supersampling


def tana_cheti(m):
    e = np.full(180, np.nan)
    for y in range(Y0, Y1):
        r = m[y]
        x = X0
        if not r[x]:
            nz = np.nonzero(r[X0:X0 + 14])[0]
            if not len(nz):
                continue
            x = X0 + nz[0]
        while x < 320:
            if r[x]:
                x += 1
                continue
            g = np.nonzero(r[x:x + UZ + 1])[0]      # UZ px gacha uzilish
            if len(g) and g[0] <= UZ:
                x += g[0]
                continue
            break
        e[y] = x
    s = e.copy()
    for y in range(Y0 + 1, Y1 - 1):
        v = e[y - 1:y + 2]
        if not np.isnan(v).any():
            s[y] = np.median(v)
    return s


def bez(p0, c, p1, n=20):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t ** 2 * p1


def qol_nuqtalar(B, hB, T, U, D):
    B, T, U, D = map(np.asarray, (B, T, U, D))
    d = T - B
    l = np.hypot(*d) or 1.0
    n = np.array([-d[1] / l, d[0] / l])
    P0, P1 = B - n * hB, B + n * hB
    Bk = np.array([B[0] - 8.0, B[1]])
    return np.vstack([bez(P0, U, T), bez(T, D, P1), bez(P1, Bk, P0)])


def rast(pts):
    w, h = (QX1 - QX0) * S, (QY1 - QY0) * S
    im = Image.new('L', (w, h), 0)
    ImageDraw.Draw(im).polygon([((x - QX0) * S, (y - QY0) * S) for x, y in pts], fill=255)
    a = np.asarray(im, float).reshape(QY1 - QY0, S, QX1 - QX0, S).mean(axis=(1, 3)) / 255.0
    return a


def kalitlar(e):
    k = [[y, round(float(e[y]), 1)] for y in range(Y0, Y1, 3) if not np.isnan(e[y])]
    if k[-1][0] != Y1 - 1 and not np.isnan(e[Y1 - 1]):
        k.append([Y1 - 1, round(float(e[Y1 - 1]), 1)])
    return k


def kalit_chet(keys):
    """chizmadagi (film.mjs plash) kabi: kalitlar orasi chiziqli"""
    e = np.full(180, np.nan)
    ys = np.array([k[0] for k in keys], float)
    xs = np.array([k[1] for k in keys], float)
    r = np.arange(int(ys[0]), 180)
    e[r] = np.interp(r, ys, xs)
    return e


def tana_niqob(e):
    t = np.zeros((QY1 - QY0, QX1 - QX0))
    xs = np.arange(QX0, QX1)
    for y in range(QY0, QY1):
        if Y0 <= y < Y1 and not np.isnan(e[y]):
            t[y - QY0] = (xs + 0.5 < e[y]).astype(float)
    return t


def p2q(p):
    return dict(B=[p[0], p[1]], hB=abs(p[2]), T=[p[3], p[4]], U=[p[5], p[6]], D=[p[7], p[8]])


def q2p(q):
    return [q['B'][0], q['B'][1], q['hB'], q['T'][0], q['T'][1], q['U'][0], q['U'][1], q['D'][0], q['D'][1]]


def jarima(p, e):
    """model SVG da ham xuddi shunday chiqishi uchun: chetlar kesishmaydi (tepa chet
    boshqaruvi past chetnikidan normal bo'yicha yuqorida), uch kadr ichida, asos
    tanaga yopishgan, eni oqilona"""
    q = p2q(p)
    B, T, U, D = map(np.asarray, (q['B'], q['T'], q['U'], q['D']))
    d = T - B
    l = np.hypot(*d) or 1.0
    n = np.array([-d[1] / l, d[0] / l])
    j = 0.0
    s = float((U - D) @ (-n))
    if s < 1.0:
        j += 0.02 * (1.0 - s)
    j += 0.02 * max(0.0, T[1] - 179) + 0.02 * max(0.0, B[1] - 179)
    ey = e[int(np.clip(round(B[1]), Y0, Y1 - 1))]
    if not np.isnan(ey):
        j += 0.02 * max(0.0, B[0] - (ey + 3))
    j += 0.02 * max(0.0, 2.5 - q['hB']) + 0.02 * max(0.0, q['hB'] - 11)
    return j


def moslash(Mt, e, boshlar, rng):
    """boshlar: [[til, ...], ...] -- har nomzod bir yoki bir necha tildan"""
    tn = tana_niqob(e)
    tgt = Mt[QY0:QY1, QX0:QX1].astype(float)
    bo = lambda p: [p[j:j + 9] for j in range(0, len(p), 9)]
    def iou(p):
        a = tn.copy()
        for t in bo(p):
            a = np.maximum(a, rast(qol_nuqtalar(**p2q(t))))
        # IKKALA TOMONDA BIR XIL KOD: misol niqobi median 5 dan o'tgan -- model
        # ham o'tadi (aks holda ingichka uch filtrda qisqaradi, moslash uni misolning
        # allaqachon qisqargan uchiga qo'yadi va chizilgan qo'l 4..13 px kalta chiqadi)
        a = ndimage.median_filter(a, MED)
        return np.minimum(a, tgt).sum() / max(1.0, np.maximum(a, tgt).sum())
    f = lambda p: 1 - iou(p) + sum(jarima(t, e) for t in bo(p))
    def yur(p):
        return list(optimize.minimize(f, p, method='Nelder-Mead',
                                      options={'xatol': 0.05, 'fatol': 1e-6, 'maxiter': 2500 * len(p) // 9}).x)
    nomzod = [yur(sum((q2p(t) for t in b), [])) for b in boshlar]
    best = min(nomzod, key=f)
    sig = np.array([4, 4, 1.5, 4, 4, 6, 6, 6, 6] * (len(best) // 9))
    for _ in range(8):                       # tasodifiy siljitib qayta: mahalliy chuqurdan chiqish
        p = np.array(best) + rng.normal(0, 1, len(best)) * sig
        c = yur(list(p))
        if f(c) < f(best):
            best = c
    j = sum(jarima(t, e) for t in bo(best))
    return [p2q(t) for t in bo(best)], iou(best), iou(sum((q2p(t) for t in boshlar[0]), [])), j


def eski_qol(q):
    """oldingi QOL (B,C,T,hB,hC) -> yangi (U,D)"""
    B, C, T = map(np.asarray, (q['B'], q['C'], q['T']))
    d = T - B
    l = np.hypot(*d)
    n1 = np.array([-d[1] / l, d[0] / l])
    return dict(B=list(B), hB=q['hB'], T=list(T), U=list(C - n1 * q['hC'] * 1.15), D=list(C + n1 * q['hC'] * 1.15))


ESKI = [dict(B=[140, 148], hB=9, C=[158, 141], hC=5, T=[175, 133])] * 6 + [
    dict(B=[138, 153], hB=8, C=[158, 153], hC=5, T=[172, 152]),
    dict(B=[140, 155], hB=8, C=[163, 157], hC=5, T=[173, 162]),
    dict(B=[142, 160], hB=8, C=[168, 160], hC=4.5, T=[170, 171]),
    dict(B=[142, 160], hB=8, C=[167, 163], hC=4.5, T=[166, 173]),
    dict(B=[142, 162], hB=8, C=[165, 166], hC=4, T=[160, 175])]

# ilmoq kadrlari uchun qo'shimcha boshlanish (misol niqobidan ko'z bilan: bilak
# uchidan pastga egilgan o'roq -- asos bilak uchida, uch o'roqning past uchida)
ILMOQ = {7: dict(B=[140, 158], hB=6, T=[172, 153], U=[160, 146], D=[160, 164]),
         8: dict(B=[145, 151], hB=4, T=[150, 170], U=[172, 158], D=[158, 158]),
         9: dict(B=[150, 150], hB=4, T=[152, 175], U=[185, 163], D=[170, 163]),
         10: dict(B=[148, 157], hB=4, T=[150, 177], U=[185, 165], D=[168, 165]),
         11: dict(B=[140, 172], hB=3, T=[158, 176], U=[152, 166], D=[150, 180])}

# 8..11: bilak ostida alohida O'ROQ (misolda: tanadan pastda chiqib, o'ngga-yuqoriga
# egilgan uchli shakl, bilak bilan orasida fon) -- ikkinchi til. Boshlanish nuqtalari
# 4x varaqdan ko'z bilan; qiymatni moslash beradi.
OROQ = {8: dict(B=[135, 170], hB=3.5, T=[168, 160], U=[155, 163], D=[155, 175]),
        9: dict(B=[138, 174], hB=4, T=[176, 160], U=[160, 166], D=[162, 178]),
        10: dict(B=[140, 175], hB=4, T=[176, 163], U=[158, 167], D=[160, 178]),
        11: dict(B=[142, 176], hB=3, T=[178, 170], U=[160, 170], D=[160, 179])}

if __name__ == '__main__':
    natija = {'PLASH_PAST': [], 'QOL': [], 'iou': []}
    rng = np.random.default_rng(1)
    for k in range(1, 12):
        Mt = siluet.niqob(tasvir.ol(loy.fayl('misol', k), loy.olcham), SH, MED, BOG)
        keys = kalitlar(tana_cheti(Mt))
        e = kalit_chet(keys)
        q0 = eski_qol(ESKI[k - 1])
        bosh = [[q0]] + ([[ILMOQ[k]]] if k in ILMOQ else [])
        if k in OROQ:
            bosh = [b + [OROQ[k]] for b in bosh]
        qs, iou, iou0, j = moslash(Mt, e, bosh, rng)
        q = [{a: ([round(v * 2) / 2 for v in b] if isinstance(b, list) else round(b * 2) / 2) for a, b in t.items()} for t in qs]
        natija['PLASH_PAST'].append(keys)
        natija['QOL'].append(q)
        natija['iou'].append([round(iou0, 3), round(iou, 3)])
        print('kadr %2d  IoU (qutida, model birlashmasi) eski qo\'l %.3f -> moslangan %.3f  jarima %.3f  %s' % (k, iou0, iou, j, q), flush=True)
    json.dump(natija, open(W + '/qol-fit.json', 'w'), indent=1)
