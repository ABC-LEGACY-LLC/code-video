"""HAIR FITTING (pass 11). The group parameters of hair2 (sweep, forehead,
near side) are fitted on every drawing to the sample's LIT HAIR MASK -- at the
level of masses, not strand by strand (where the strands sit is our seeded rule).

The same code on both sides: the mask is tools/compare silhouette.spec_mask (the 'hair' spec:
L>85, median 3, no fill, min_area 60) -- the sample frame and our render both
go through image.load (LANCZOS 320x180, then L). Render -- test/hair-server.mjs
(the same frameSVG as film.mjs, no tremor, no particles).

Objective: 1 - IoU (in the hair box) + the difference in the dark share of the brow region.
AFTER the fit the real render is measured (tools/compare silhouette), not the model.

python3 test/hair-fit.py [frames, e.g. 1-11] [--restarts]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, json, time
import numpy as np
from scipy.optimize import minimize
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import project, image, silhouette
from hair_srv import Server

W = (PERSONAJ_DIR)
TMP = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p11-fit')
os.makedirs(TMP, exist_ok=True)
prj = project.Project(W + '/compare.json')
SP = next(s for s in prj.silhouettes if s['name'] == 'hair')
BOX = SP['box']
SEED = prj.anchor['seed']
OUT = W + '/hair-fit.json'


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


def brow(L, k):
    """the region 9..13 px above the near-eye seed: the share of L<45 (the same place on both sides)"""
    x, y = SEED[str(k)]
    s = L[y - 13:y - 8, x - 5:x + 8]
    return float((s < 45).mean())


SAMPLE = {}
def sample(k):
    if k not in SAMPLE:
        L = image.load(prj.file('sample', k), prj.size)
        SAMPLE[k] = (silhouette.spec_mask(L, SP, None), brow(L, k))
    return SAMPLE[k]


# groups: (name, [(param, low, high)])
GROUP = [
    ('sweep', [('volume', 0.95, 1.40), ('sTheta', -70, 5), ('sL', 0.4, 2.2), ('sW', 0.12, 0.70),
                 ('sA0', 5, 90), ('sA1', 100, 175), ('sB', -0.15, 0.35)]),
    ('forehead', [('pDrop', -0.45, 0.45), ('pDx', -0.10, 0.80), ('pW', 0.08, 0.45), ('pShadowL', 0.0, 0.40),
                 ('pEye', -0.10, 0.35), ('pA0', 20, 90), ('pA1', 80, 150)]),
    ('near', [('yX', -0.95, 0.10), ('yY', 0.6, 2.0), ('yW', 0.08, 0.60), ('yBulge', -0.20, 0.45),
               ('yDx', -0.20, 0.25), ('yDy', -0.20, 0.30), ('yA0', 100, 175)]),
]


class Score:
    def __init__(self, sv, k):
        self.sv, self.k, self.n = sv, k, 0
        self.tm, self.tq = sample(k)

    def __call__(self, prm, detail=False):
        self.n += 1
        fpath = '%s/k%02d.png' % (TMP, self.k)
        self.sv.render(self.k - 1, {'__hairP': prm}, fpath)
        image.clear_cache()
        L = image.load(fpath, prj.size)
        m = silhouette.spec_mask(L, SP, None)
        u = iou(m, self.tm, BOX)
        q = brow(L, self.k)
        j = (1 - u) + 0.5 * abs(q - self.tq)
        if detail:
            return {'J': j, 'iou': u, 'brow': q, 'brow_sample': self.tq,
                    'area': int(m[BOX[1]:BOX[3], BOX[0]:BOX[2]].sum()), 'area_sample': int(self.tm[BOX[1]:BOX[3], BOX[0]:BOX[2]].sum())}
        return j


def fit_group(b, prm, spec, maxev=160):
    name = [p for p, _, _ in spec]
    lo = np.array([a for _, a, _ in spec]); hi = np.array([c for _, _, c in spec])
    x0 = np.array([prm[p] for p in name], float)
    sc = hi - lo
    def f(z):
        x = lo + np.clip(z, 0, 1) * sc
        pen = float(np.sum(np.clip(-z, 0, None) + np.clip(z - 1, 0, None))) * 2
        q = dict(prm); q.update({p: float(v) for p, v in zip(name, x)})
        return b(q) + pen
    z0 = (x0 - lo) / sc
    r = minimize(f, z0, method='Nelder-Mead', options={'maxfev': maxev, 'xatol': 0.004, 'fatol': 0.0008,
                                                         'initial_simplex': np.vstack([z0] + [z0 + np.eye(len(z0))[i] * 0.12 for i in range(len(z0))])})
    x = lo + np.clip(r.x, 0, 1) * sc
    q = dict(prm); q.update({p: round(float(v), 4) for p, v in zip(name, x)})
    return q, r.fun


def main():
    frameList = prj.group(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else list(range(1, 12))
    result = json.load(open(OUT)) if os.path.exists(OUT) and '--restarts' not in sys.argv else {}
    sv = Server()
    try:
        previous = None
        for k in frameList:
            t = time.time()
            prm = dict(result.get(str(k)) or previous or {})
            from_orig = json.load(open(W + '/test/hair-orig.json')) if os.path.exists(W + '/test/hair-orig.json') else {}
            for p, v in from_orig.items():
                prm.setdefault(p, v)
            b = Score(sv, k)
            j0 = b(prm)
            for circle in range(2):
                for name, spec in GROUP:
                    prm, j = fit_group(b, prm, spec)
            d = b(prm, detail=True)
            result[str(k)] = prm
            json.dump(result, open(OUT, 'w'), indent=1)
            previous = prm
            print('frame %2d: J %.3f -> %.3f  IoU %.3f  brow %.2f (sample %.2f)  area %d (sample %d)  %d scorings, %.0f s' % (
                k, j0, d['J'], d['iou'], d['brow'], d['brow_sample'], d['area'], d['area_sample'], b.n, time.time() - t), flush=True)
    finally:
        sv.close()


if __name__ == '__main__':
    main()
