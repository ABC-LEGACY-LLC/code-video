"""SOCH3 MOSLASH (11-o'tish, 2-urinish). Massa (qutb qobig'i ro/ri, 20 gradus qadam)
har tasvirda misolning yorug' soch niqobiga moslanadi; tishlar, siyoh, soya --
bizning qoidamiz (yuz.mjs sochPoly3), moslash ularni HISOBGA olib massani tanlaydi.

Model tasviri = shu tasvirning SOCHSIZ toza renderi (server, Chromium) + sochPoly3
ko'pburchaklari (serverdan, bitta geometriya kodi) 4x da chizilib 540 ga
kichraytirilgan -> taqqos quvuri (LANCZOS 320x180, L, spec_niqob 'soch').
Misol niqobi xuddi shu spec_niqob bilan. Maqsad: 1-IoU + 0.5*|qosh farqi| +
silliqlik. Qidiruv: har radius bo'yicha qadamli izlash (mahalliy: har radius
faqat o'z burchagi atrofini o'zgartiradi).

Keyin HAQIQIY render o'lchanadi (taqqos siluet), model emas.
python3 test/soch3-fit.py [1-11] [--qayta]"""
import sys, os, json, time
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import loyiha, tasvir, siluet
from soch_srv import Server

W = '/home/claude/work/personaj'
TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p11/fit3'
os.makedirs(TMP, exist_ok=True)
loy = loyiha.Loyiha(W + '/taqqos.json')
SP = next(s for s in loy.siluetlar if s['nom'] == 'soch')
BOX = SP['quti']
URUG = loy.langar['urug']
CHIQ = W + '/soch3-fit.json'
# tishlar O'LCHANGAN (misol 1,3,6,9,11-tasvir, niqob chetining silliq qobiqdan qoldig'i, nurlar
# 1 gradus; R ~38 px): o'ng tashqi davr median ~14 px, chuqurlik ~7.7 px; yaqin past ~8 / 3.4;
# peshona ichki ~8 / 3.2. Bosh birligida: 0.37/0.20, 0.21/0.09, 0.21/0.085.
ASL = {'th0': -40, 'dth': 12, 'tO': [-40, 70, 0.37, 0.20], 'tO2': [150, 296, 0.21, 0.09],
       'tI': [10, 170, 0.21, 0.085], 'soyaA': [20, 130], 'soyaH': 0.0, 'siyohK': 0.45, 'urug': 9151}
NJ = 29   # -40..296: yaqin ko'z (bosh markazi) ostidagi yonoq ustiga ham soch tushishi mumkin -- 7..10 da '(' massasi
VAQT = bool(os.environ.get('VAQT'))          # 1 -> oldingi tasvirga bog'lash (ketma-ket moslash)
QW = float(os.environ.get('QW', '1.0'))     # qosh va yonoq zonalari vazni
# soya faqat YAQIN ko'z ustida: qosh qutisining bosh burchagi +-30 (o'lchangan: 1..9 da 79..98,
# 10..11 da 40..43). [20,130] da soya ikki ko'z ustini qoplab, yaqin ko'zni uzoq ko'z bilan bitta
# qorong'i komponentaga ulagan edi (langar zondi 10.4 px; misolda komponenta ixcham).
SOYA_A = {1: [53, 113], 2: [53, 113], 3: [53, 113], 4: [59, 119], 5: [59, 119], 6: [66, 126], 7: [68, 128],
          8: [57, 117], 9: [49, 109], 10: [13, 73], 11: [10, 70]}
SOYA_MAX = 0.30   # misolda ko'z ustidagi qorong'i soch ~5..9 px (L jadvali, 1-tasvir 34..42 qatorlar), R ~38 px
SIGMA = 2.0      # massa miqyosi: niqoblar sigma 2 px Gauss bilan yoyilib, 0.5 da kesiladi -- tutam uchlari emas, MASSA solishtiriladi
TH = [ASL['th0'] + j * ASL['dth'] for j in range(NJ)]
S4 = 4


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


SOYA_HEX = '#1a1b36'
TON, SOYA, SIYOH = rgb('#5b608e'), rgb(SOYA_HEX), rgb('#2a2c52')


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


def massa(m):
    from scipy import ndimage
    return ndimage.gaussian_filter(m.astype(float), SIGMA) > 0.5


def qosh(L, k):
    x, y = URUG[str(k)]
    return float((L[y - 13:y - 8, x - 5:x + 8] < 45).mean())


def yuz(L, k):
    """ko'z ostidagi yonoq (urug'dan x-4..+20, y+4..+18): qorong'i (L<45) ulushi. 2-moslashda
    shu zona yo'q edi va soya tasmasi (soyaH 1.0 R gacha) butun yuzni L 60 dan 30 ga tushirdi --
    faqat yorug' soch niqobi va ikki qosh zonasi uni jazolamasdi; langar zondi ko'rsatdi."""
    x, y = URUG[str(k)]
    return float((L[y + 4:y + 18, x - 4:x + 20] < 45).mean())


def qosh2(L, k):
    """ko'zdan 4..8 px tepada: misolda qorong'i soch va ko'z orasida teri bor (L<45 ulushi 0.28..0.43);
    1-moslash bu zonani bilmagani uchun soyani ko'zgacha tushirdi va langar zondi ko'z bilan
    soyani bitta komponenta deb o'qidi"""
    x, y = URUG[str(k)]
    return float((L[y - 8:y - 3, x - 5:x + 8] < 45).mean())


class Model:
    def __init__(self, sv, k):
        self.sv, self.k, self.n = sv, k, 0
        yol = '%s/fon%02d.png' % (TMP, k)
        sv.render(k - 1, {'__soch3': {'yoq': 1}}, yol)
        self.fon = Image.open(yol).convert('RGB')
        self.fon4 = self.fon.resize((540 * S4, 304 * S4), Image.NEAREST)
        # soya ko'zlar OSTIDA (portret2 tartibi). Model: soya ko'pburchagi ichida -- "soya rangli
        # qatlam + undan keyingi hamma narsa" renderi (__soyaTest, soya bilan bir joyda, bir xil
        # klip). Avval ko'z piksellari fondan qaytarilardi (fon va ko'zsiz fon farqi > 0):
        # ko'z ustidagi xira qovoq chizig'i ham qaytib, soya ichida yorug' chiziq qolardi --
        # qosh zonasi model 0.62, render 0.78 (1-tasvir); moslash qoshni ortiqcha qoraytirgan.
        yolS = '%s/fonS%02d.png' % (TMP, k)
        sv.render(k - 1, {'__soch3': {'yoq': 1}, '__soyaTest': SOYA_HEX}, yolS)
        self.fonS4 = Image.open(yolS).convert('RGB').resize((540 * S4, 304 * S4), Image.NEAREST)
        Lm = tasvir.ol(loy.fayl('misol', k), loy.olcham)
        self.tm = siluet.spec_niqob(Lm, SP, None)
        self.tmm = massa(self.tm)
        self.tq = qosh(Lm, k)
        self.tq2 = qosh2(Lm, k)
        self.ty = yuz(Lm, k)
        g = sv.geo(k - 1, dict(ASL, ro=[1.0] * NJ, ri=[0.9] * NJ))
        self.o = np.array(g['o']); self.ex = np.array(g['ex']) - self.o; self.ey = np.array(g['ey']) - self.o

    def tasvir(self, prm):
        g = self.sv.geo(self.k - 1, prm)
        im = self.fon4.copy(); d = ImageDraw.Draw(im)
        sc = lambda v: [(x * S4, y * S4) for x, y in v]
        if g['soya']:
            ns = Image.new('L', im.size, 0)
            ImageDraw.Draw(ns).polygon(sc(g['soya']), fill=255)
            im.paste(self.fonS4, (0, 0), ns)
            d = ImageDraw.Draw(im)
        for pl in g['lit']:          # ingichka joylar tashlangach -- bir necha ko'pburchak
            d.polygon(sc(pl), fill=TON)
        w = max(1, int(round(g['inkW'] * S4)))
        kl = prm.get('minQal')       # siyoh soch ichiga kliplanadi (soch3 dagi clipPath bilan bir xil)
        if kl:
            niq = Image.new('L', im.size, 0); dn = ImageDraw.Draw(niq)
            for pl in g['lit']:
                dn.polygon(sc(pl), fill=255)
            ust = im.copy(); d = ImageDraw.Draw(ust)
        for a, b in g['ink']:
            d.line(sc([a, b]), fill=tuple(int(0.8 * c + 0.2 * t) for c, t in zip(SIYOH, TON)), width=w)
        if kl:
            im.paste(ust, (0, 0), niq)
        im = im.resize((540, 304), Image.BOX)
        L = np.asarray(im.resize(tuple(loy.olcham), Image.LANCZOS).convert('L')).astype(np.float64)
        return L

    oldingi = None      # oldingi tasvirning moslangan ro/ri si (vaqt bo'yicha bog'lash)
    lam_t = 0.0

    def __call__(self, prm, tafsil=False):
        self.n += 1
        L = self.tasvir(prm)
        m = siluet.spec_niqob(L, SP, None)
        um = iou(massa(m), self.tmm, BOX); q = qosh(L, self.k); q2 = qosh2(L, self.k); yz = yuz(L, self.k)
        ro, ri = np.array(prm['ro']), np.array(prm['ri'])
        silliq = float(np.sum(np.diff(ro, 2) ** 2) + np.sum(np.diff(ri, 2) ** 2))
        j = (1 - um) + QW * abs(q - self.tq) + QW * abs(q2 - self.tq2) + QW * abs(yz - self.ty) + 0.01 * silliq
        if self.oldingi is not None and self.lam_t > 0:
            # VAQT: mustaqil moslashlarda ushlangan tasvirlarda soch BO'LAK-BO'LAK almashardi (farq
            # xaritasida katta dog'lar); misolda esa tutam chetlari ingichka qimirlaydi. Oldingi
            # tasvirdan farq jarimalanadi: massa faqat misol haqiqatan o'zgargan joyda o'zgaradi.
            po, pi = self.oldingi
            j += self.lam_t * float(np.sum((ro - po) ** 2) + np.sum((ri - pi) ** 2))
        if tafsil:
            return {'J': j, 'iou': iou(m, self.tm, BOX), 'iou_massa': um, 'qosh': q, 'qosh_misol': self.tq, 'qosh2': q2, 'qosh2_misol': self.tq2, 'yuz': yz, 'yuz_misol': self.ty}
        return j

    def boshlangich(self):
        """misol niqobidan nurlar: har burchak sektorida eng tashqi va eng ichki soch nuqtasi (R birligida)"""
        s = 320 / 540.0
        ro, ri = [], []
        for th in TH:
            outs, ins = [], []
            for dt in (-4, -2, 0, 2, 4):
                a = np.radians(th + dt)
                hits = []
                for r in np.arange(0.0, 2.3, 0.01):
                    p = (self.o + self.ex * r * np.cos(a) - self.ey * r * np.sin(a)) * s
                    x, y = int(round(p[0])), int(round(p[1]))
                    if BOX[0] <= x < BOX[2] and BOX[1] <= y < BOX[3] and self.tm[y, x]:
                        hits.append(r)
                if hits:
                    outs.append(max(hits)); ins.append(min(hits))
            if outs:
                ro.append(float(np.median(outs))); ri.append(float(np.median(ins)))
            else:
                ro.append(0.8); ri.append(0.8)
        return ro, ri


def izla(m, prm, j0, qadamlar=(0.08, 0.04, 0.02), aylana=3):
    best = j0
    for q in qadamlar:
        for _ in range(aylana):
            yax = False
            for key in ('ro', 'ri'):
                for j in range(NJ):
                    for sgn in (1, -1):
                        v = list(prm[key]); v[j] = max(0.0, v[j] + sgn * q)
                        t = dict(prm); t[key] = v
                        if key == 'ri':
                            t['ri'][j] = min(t['ri'][j], t['ro'][j])
                        f = m(t)
                        if f < best - 1e-5:
                            best, prm, yax = f, t, True
                            break
            for sgn in (1, -1):
                t = dict(prm); t['soyaH'] = min(SOYA_MAX, max(0.0, prm['soyaH'] + sgn * q))
                f = m(t)
                if f < best - 1e-5:
                    best, prm, yax = f, t, True
                    break
            if not yax:
                break
    return prm, best


def cma_moslash(m, prm, sigma0=0.05, maxev=3000):
    import cma
    x0 = np.array(list(prm['ro']) + list(prm['ri']) + [prm.get('soyaH', 0.0)], float)
    def f(x):
        x = np.maximum(x, 0.0)
        t = dict(prm); t['ro'] = list(x[:NJ]); t['ri'] = list(np.minimum(x[NJ:2 * NJ], x[:NJ])); t['soyaH'] = float(min(x[-1], SOYA_MAX))
        return m(t)
    es = cma.CMAEvolutionStrategy(x0, sigma0, {'maxfevals': maxev, 'verbose': -9, 'seed': 7, 'bounds': [0.0, 2.4]})
    es.optimize(f)
    x = np.maximum(es.result.xbest, 0.0)
    t = dict(prm); t['ro'] = list(x[:NJ]); t['ri'] = list(np.minimum(x[NJ:2 * NJ], x[:NJ])); t['soyaH'] = float(min(x[-1], SOYA_MAX))
    return t, es.result.fbest


def main():
    kad = loy.guruh(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else list(range(1, 12))
    natija = json.load(open(CHIQ)) if os.path.exists(CHIQ) and '--qayta' not in sys.argv else {}
    sv = Server()
    try:
        for k in kad:
            t = time.time()
            m = Model(sv, k)
            if str(k) in natija:
                prm = dict(natija[str(k)]); prm.update({kk: ASL[kk] for kk in ('tO', 'tO2', 'tI', 'siyohK', 'urug')})
                prm['soyaA'] = SOYA_A[k]
                for kk in ('ro', 'ri'):          # 26 -> 29 burchak: yangilari qalinliksiz
                    while len(prm[kk]) < NJ:
                        prm[kk] = list(prm[kk]) + [0.3]
                if os.environ.get('SOYA0'):
                    prm['soyaH'] = float(os.environ['SOYA0'])
            else:
                ro, ri = m.boshlangich()
                prm = dict(ASL, ro=[round(v, 3) for v in ro], ri=[round(v, 3) for v in ri], soyaA=SOYA_A[k])
            if VAQT and str(k - 1) in natija and k - 1 in kad:
                m.oldingi = (np.array(natija[str(k - 1)]['ro']), np.array(natija[str(k - 1)]['ri']))
                m.lam_t = 0.5 if k <= 6 else 0.2
                prm = dict(prm); prm['ro'] = list(0.5 * np.array(prm['ro']) + 0.5 * m.oldingi[0]); prm['ri'] = list(0.5 * np.array(prm['ri']) + 0.5 * m.oldingi[1])
            j0 = m(prm)
            prm, j = cma_moslash(m, prm)
            prm, j = izla(m, prm, j, qadamlar=(0.02, 0.01), aylana=2)
            d = m(prm, tafsil=True)
            prm['ro'] = [round(v, 3) for v in prm['ro']]; prm['ri'] = [round(v, 3) for v in prm['ri']]
            prm['soyaH'] = round(prm['soyaH'], 3)
            natija[str(k)] = prm
            json.dump(natija, open(CHIQ, 'w'), indent=1)
            print('tasvir %2d: J %.3f -> %.3f  model IoU %.3f (massa %.3f)  qosh %.2f/%.2f (misol %.2f/%.2f)  yonoq %.2f (%.2f)  soyaH %.2f  %d baho, %.0f s' % (
                k, j0, d['J'], d['iou'], d['iou_massa'], d['qosh'], d['qosh2'], d['qosh_misol'], d['qosh2_misol'], d['yuz'], d['yuz_misol'], prm['soyaH'], m.n, time.time() - t), flush=True)
    finally:
        sv.yop()


if __name__ == '__main__':
    main()
