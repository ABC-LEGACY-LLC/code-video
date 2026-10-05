"""SOCH MOSLASH (11-o'tish). soch2 ning guruh parametrlari (supurma, peshona,
yaqin yon) har tasvirda misolning YORUG' SOCH NIQOBIGA moslanadi -- massalar
darajasida, tutamma-tutam emas (tutamlar joylashuvi bizning urug'li qoidamiz).

Ikkala tomonda bir xil kod: niqob taqqos.siluet.spec_niqob ('soch' spec'i:
L>85, median 3, toldir yo'q, min_maydon 60) -- misol kadri ham, bizning render
ham tasvir.ol orqali (LANCZOS 320x180, keyin L). Render -- test/soch-server.mjs
(film.mjs bilan bir xil kadrSVG, titroqsiz, zarrasiz).

Maqsad funksiyasi: 1 - IoU (soch qutisida) + qosh sohasi qorong'i ulushi farqi.
Moslashdan KEYIN haqiqiy render o'lchanadi (taqqos siluet), model emas.

python3 test/soch-fit.py [kadrlar, masalan 1-11] [--qayta]"""
import sys, os, json, time
import numpy as np
from scipy.optimize import minimize
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import loyiha, tasvir, siluet
from soch_srv import Server

W = '/home/claude/work/personaj'
TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p11/fit'
os.makedirs(TMP, exist_ok=True)
loy = loyiha.Loyiha(W + '/taqqos.json')
SP = next(s for s in loy.siluetlar if s['nom'] == 'soch')
BOX = SP['quti']
URUG = loy.langar['urug']
CHIQ = W + '/soch-fit.json'


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


def qosh(L, k):
    """yaqin ko'z urug'idan 9..13 px tepadagi soha: L<45 ulushi (ikkala tomonda bir xil joy)"""
    x, y = URUG[str(k)]
    s = L[y - 13:y - 8, x - 5:x + 8]
    return float((s < 45).mean())


MISOL = {}
def misol(k):
    if k not in MISOL:
        L = tasvir.ol(loy.fayl('misol', k), loy.olcham)
        MISOL[k] = (siluet.spec_niqob(L, SP, None), qosh(L, k))
    return MISOL[k]


# guruhlar: (nom, [(param, past, yuqori)])
GURUH = [
    ('supurma', [('hajm', 0.95, 1.40), ('sTheta', -70, 5), ('sL', 0.4, 2.2), ('sW', 0.12, 0.70),
                 ('sA0', 5, 90), ('sA1', 100, 175), ('sB', -0.15, 0.35)]),
    ('peshona', [('pDrop', -0.45, 0.45), ('pDx', -0.10, 0.80), ('pW', 0.08, 0.45), ('pSoyaL', 0.0, 0.40),
                 ('pKoz', -0.10, 0.35), ('pA0', 20, 90), ('pA1', 80, 150)]),
    ('yaqin', [('yX', -0.95, 0.10), ('yY', 0.6, 2.0), ('yW', 0.08, 0.60), ('yBulge', -0.20, 0.45),
               ('yDx', -0.20, 0.25), ('yDy', -0.20, 0.30), ('yA0', 100, 175)]),
]


class Baho:
    def __init__(self, sv, k):
        self.sv, self.k, self.n = sv, k, 0
        self.tm, self.tq = misol(k)

    def __call__(self, prm, tafsil=False):
        self.n += 1
        yol = '%s/k%02d.png' % (TMP, self.k)
        self.sv.render(self.k - 1, {'__sochP': prm}, yol)
        tasvir.kesh_tozala()
        L = tasvir.ol(yol, loy.olcham)
        m = siluet.spec_niqob(L, SP, None)
        u = iou(m, self.tm, BOX)
        q = qosh(L, self.k)
        j = (1 - u) + 0.5 * abs(q - self.tq)
        if tafsil:
            return {'J': j, 'iou': u, 'qosh': q, 'qosh_misol': self.tq,
                    'maydon': int(m[BOX[1]:BOX[3], BOX[0]:BOX[2]].sum()), 'maydon_misol': int(self.tm[BOX[1]:BOX[3], BOX[0]:BOX[2]].sum())}
        return j


def moslash_guruh(b, prm, spec, maxev=160):
    nom = [p for p, _, _ in spec]
    lo = np.array([a for _, a, _ in spec]); hi = np.array([c for _, _, c in spec])
    x0 = np.array([prm[p] for p in nom], float)
    sc = hi - lo
    def f(z):
        x = lo + np.clip(z, 0, 1) * sc
        pen = float(np.sum(np.clip(-z, 0, None) + np.clip(z - 1, 0, None))) * 2
        q = dict(prm); q.update({p: float(v) for p, v in zip(nom, x)})
        return b(q) + pen
    z0 = (x0 - lo) / sc
    r = minimize(f, z0, method='Nelder-Mead', options={'maxfev': maxev, 'xatol': 0.004, 'fatol': 0.0008,
                                                         'initial_simplex': np.vstack([z0] + [z0 + np.eye(len(z0))[i] * 0.12 for i in range(len(z0))])})
    x = lo + np.clip(r.x, 0, 1) * sc
    q = dict(prm); q.update({p: round(float(v), 4) for p, v in zip(nom, x)})
    return q, r.fun


def main():
    kad = loy.guruh(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else list(range(1, 12))
    natija = json.load(open(CHIQ)) if os.path.exists(CHIQ) and '--qayta' not in sys.argv else {}
    sv = Server()
    try:
        oldingi = None
        for k in kad:
            t = time.time()
            prm = dict(natija.get(str(k)) or oldingi or {})
            from_asl = json.load(open(W + '/test/soch-asl.json')) if os.path.exists(W + '/test/soch-asl.json') else {}
            for p, v in from_asl.items():
                prm.setdefault(p, v)
            b = Baho(sv, k)
            j0 = b(prm)
            for aylana in range(2):
                for nom, spec in GURUH:
                    prm, j = moslash_guruh(b, prm, spec)
            d = b(prm, tafsil=True)
            natija[str(k)] = prm
            json.dump(natija, open(CHIQ, 'w'), indent=1)
            oldingi = prm
            print('tasvir %2d: J %.3f -> %.3f  IoU %.3f  qosh %.2f (misol %.2f)  maydon %d (misol %d)  %d baho, %.0f s' % (
                k, j0, d['J'], d['iou'], d['qosh'], d['qosh_misol'], d['maydon'], d['maydon_misol'], b.n, time.time() - t), flush=True)
    finally:
        sv.yop()


if __name__ == '__main__':
    main()
