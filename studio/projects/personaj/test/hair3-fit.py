"""HAIR3 FITTING (pass 11, attempt 2). The mass (a polar shell ro/ri, 20 degree step)
is fitted on every drawing to the sample's lit hair mask; teeth, ink, shadow --
our rule (face.mjs hairPoly3), the fit TAKES them into account when choosing the mass.

Model image = a clean HAIRLESS render of this drawing (server, Chromium) + the hairPoly3
polygons (from the server, one geometry code) drawn at 4x and shrunk
to 540 -> the tools/compare pipeline (LANCZOS 320x180, L, spec_mask 'hair').
The sample mask with the same spec_mask. Objective: 1-IoU + 0.5*|brow difference| +
smoothness. Search: a stepwise search over each radius (local: each radius
changes only the area around its own angle).

Then the REAL render is measured (tools/compare silhouette), not the model.
python3 test/hair3-fit.py [1-11] [--restarts]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, json, time
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import project, image, silhouette
from hair_srv import Server

W = (PERSONAJ_DIR)
TMP = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p11-fit3')
os.makedirs(TMP, exist_ok=True)
prj = project.Project(W + '/compare.json')
SP = next(s for s in prj.silhouettes if s['name'] == 'hair')
BOX = SP['box']
SEED = prj.anchor['seed']
OUT = W + '/hair3-fit.json'
# the teeth were MEASURED (sample drawings 1,3,6,9,11, the residue of the mask edge against a smooth shell, rays
# 1 degree apart; R ~38 px): right outer period median ~14 px, depth ~7.7 px; near lower ~8 / 3.4;
# forehead inner ~8 / 3.2. In head units: 0.37/0.20, 0.21/0.09, 0.21/0.085.
ORIG = {'th0': -40, 'dth': 12, 'tO': [-40, 70, 0.37, 0.20], 'tO2': [150, 296, 0.21, 0.09],
       'tI': [10, 170, 0.21, 0.085], 'shadowA': [20, 130], 'shadowH': 0.0, 'inkK': 0.45, 'seed': 9151}
NJ = 29   # -40..296: hair can also fall over the cheek below the near eye (head centre) -- the '(' mass at 7..10
TIME = bool(os.environ.get('TIME'))          # 1 -> tie to the previous drawing (sequential fitting)
QW = float(os.environ.get('QW', '1.0'))     # weight of the brow and cheek zones
# shadow only above the NEAR eye: the head angle of the brow box +-30 (measured: 79..98 at 1..9,
# 40..43 at 10..11). At [20,130] the shadow covered the tops of both eyes and had joined the near eye
# and the far eye into one dark component (anchor probe 10.4 px; in the sample the component is compact).
SHADOW_A = {1: [53, 113], 2: [53, 113], 3: [53, 113], 4: [59, 119], 5: [59, 119], 6: [66, 126], 7: [68, 128],
          8: [57, 117], 9: [49, 109], 10: [13, 73], 11: [10, 70]}
SHADOW_MAX = 0.30   # in the sample the dark hair above the eye is ~5..9 px (L table, drawing 1 rows 34..42), R ~38 px
SIGMA = 2.0      # mass scale: masks are spread by a Gaussian with sigma 2 px and cut at 0.5 -- MASSES are compared, not strand tips
TH = [ORIG['th0'] + j * ORIG['dth'] for j in range(NJ)]
S4 = 4


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


SHADOW_HEX = '#1a1b36'
TONE, SHADOW, INK = rgb('#5b608e'), rgb(SHADOW_HEX), rgb('#2a2c52')


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


def mass(m):
    from scipy import ndimage
    return ndimage.gaussian_filter(m.astype(float), SIGMA) > 0.5


def brow(L, k):
    x, y = SEED[str(k)]
    return float((L[y - 13:y - 8, x - 5:x + 8] < 45).mean())


def face(L, k):
    """the cheek below the eye (x-4..+20, y+4..+18 from the seed): the dark (L<45) share. Fit 2
    had no such zone and the shadow band (shadowH up to 1.0 R) dropped the whole face from L 60 to 30 --
    the lit hair mask and the two brow zones alone did not penalize it; the anchor probe showed it."""
    x, y = SEED[str(k)]
    return float((L[y + 4:y + 18, x - 4:x + 20] < 45).mean())


def brow2(L, k):
    """4..8 px above the eye: in the sample there is skin between the dark hair and the eye (L<45 share 0.28..0.43);
    fit 1 did not know this zone, so it brought the shadow down to the eye and the anchor probe read the eye
    and the shadow as one component"""
    x, y = SEED[str(k)]
    return float((L[y - 8:y - 3, x - 5:x + 8] < 45).mean())


class Model:
    def __init__(self, sv, k):
        self.sv, self.k, self.n = sv, k, 0
        fpath = '%s/background%02d.png' % (TMP, k)
        sv.render(k - 1, {'__hair3': {'absent': 1}}, fpath)
        self.background = Image.open(fpath).convert('RGB')
        self.background4 = self.background.resize((540 * S4, 304 * S4), Image.NEAREST)
        # the shadow is UNDER the eyes (the portrait2 order). Model: inside the shadow polygon -- a render of
        # "the shadow-coloured layer + everything after it" (__shadowTest, at the same place as the shadow,
        # the same clip). Before, the eye pixels were brought back from the background (background minus
        # eyeless background > 0): the faint eyelid line above the eye came back too and left a bright line
        # inside the shadow -- brow zone model 0.62, render 0.78 (drawing 1); the fit darkened the brow too much.
        pathS = '%s/backgroundS%02d.png' % (TMP, k)
        sv.render(k - 1, {'__hair3': {'absent': 1}, '__shadowTest': SHADOW_HEX}, pathS)
        self.backgroundS4 = Image.open(pathS).convert('RGB').resize((540 * S4, 304 * S4), Image.NEAREST)
        Lm = image.load(prj.file('sample', k), prj.size)
        self.tm = silhouette.spec_mask(Lm, SP, None)
        self.tmm = mass(self.tm)
        self.tq = brow(Lm, k)
        self.tq2 = brow2(Lm, k)
        self.ty = face(Lm, k)
        g = sv.geo(k - 1, dict(ORIG, ro=[1.0] * NJ, ri=[0.9] * NJ))
        self.o = np.array(g['o']); self.ex = np.array(g['ex']) - self.o; self.ey = np.array(g['ey']) - self.o

    def image(self, prm):
        g = self.sv.geo(self.k - 1, prm)
        im = self.background4.copy(); d = ImageDraw.Draw(im)
        sc = lambda v: [(x * S4, y * S4) for x, y in v]
        if g['shadow']:
            ns = Image.new('L', im.size, 0)
            ImageDraw.Draw(ns).polygon(sc(g['shadow']), fill=255)
            im.paste(self.backgroundS4, (0, 0), ns)
            d = ImageDraw.Draw(im)
        for pl in g['lit']:          # thin parts dropped -- several polygons
            d.polygon(sc(pl), fill=TONE)
        w = max(1, int(round(g['inkW'] * S4)))
        kl = prm.get('minThick')       # the ink is clipped inside the hair (the same as the clipPath in hair3)
        if kl:
            msk = Image.new('L', im.size, 0); dn = ImageDraw.Draw(msk)
            for pl in g['lit']:
                dn.polygon(sc(pl), fill=255)
            over = im.copy(); d = ImageDraw.Draw(over)
        for a, b in g['ink']:
            d.line(sc([a, b]), fill=tuple(int(0.8 * c + 0.2 * t) for c, t in zip(INK, TONE)), width=w)
        if kl:
            im.paste(over, (0, 0), msk)
        im = im.resize((540, 304), Image.BOX)
        L = np.asarray(im.resize(tuple(prj.size), Image.LANCZOS).convert('L')).astype(np.float64)
        return L

    previous = None      # the fitted ro/ri of the previous drawing (tying over time)
    lam_t = 0.0

    def __call__(self, prm, detail=False):
        self.n += 1
        L = self.image(prm)
        m = silhouette.spec_mask(L, SP, None)
        um = iou(mass(m), self.tmm, BOX); q = brow(L, self.k); q2 = brow2(L, self.k); yz = face(L, self.k)
        ro, ri = np.array(prm['ro']), np.array(prm['ri'])
        smooth = float(np.sum(np.diff(ro, 2) ** 2) + np.sum(np.diff(ri, 2) ** 2))
        j = (1 - um) + QW * abs(q - self.tq) + QW * abs(q2 - self.tq2) + QW * abs(yz - self.ty) + 0.01 * smooth
        if self.previous is not None and self.lam_t > 0:
            # TIME: with independent fits the hair on held drawings swapped PIECE BY PIECE (large blobs in
            # the difference map); in the sample only the strand edges move, thinly. The difference from
            # the previous drawing is penalized: the mass changes only where the sample really changed.
            po, pi = self.previous
            j += self.lam_t * float(np.sum((ro - po) ** 2) + np.sum((ri - pi) ** 2))
        if detail:
            return {'J': j, 'iou': iou(m, self.tm, BOX), 'iou_mass': um, 'brow': q, 'brow_sample': self.tq, 'brow2': q2, 'brow2_sample': self.tq2, 'face': yz, 'face_sample': self.ty}
        return j

    def initial(self):
        """rays from the sample mask: in each angle sector the outermost and innermost hair point (in units of R)"""
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


def search(m, prm, j0, steps=(0.08, 0.04, 0.02), circle=3):
    best = j0
    for q in steps:
        for _ in range(circle):
            improved = False
            for key in ('ro', 'ri'):
                for j in range(NJ):
                    for sgn in (1, -1):
                        v = list(prm[key]); v[j] = max(0.0, v[j] + sgn * q)
                        t = dict(prm); t[key] = v
                        if key == 'ri':
                            t['ri'][j] = min(t['ri'][j], t['ro'][j])
                        f = m(t)
                        if f < best - 1e-5:
                            best, prm, improved = f, t, True
                            break
            for sgn in (1, -1):
                t = dict(prm); t['shadowH'] = min(SHADOW_MAX, max(0.0, prm['shadowH'] + sgn * q))
                f = m(t)
                if f < best - 1e-5:
                    best, prm, improved = f, t, True
                    break
            if not improved:
                break
    return prm, best


def cma_fit(m, prm, sigma0=0.05, maxev=3000):
    import cma
    x0 = np.array(list(prm['ro']) + list(prm['ri']) + [prm.get('shadowH', 0.0)], float)
    def f(x):
        x = np.maximum(x, 0.0)
        t = dict(prm); t['ro'] = list(x[:NJ]); t['ri'] = list(np.minimum(x[NJ:2 * NJ], x[:NJ])); t['shadowH'] = float(min(x[-1], SHADOW_MAX))
        return m(t)
    es = cma.CMAEvolutionStrategy(x0, sigma0, {'maxfevals': maxev, 'verbose': -9, 'seed': 7, 'bounds': [0.0, 2.4]})
    es.optimize(f)
    x = np.maximum(es.result.xbest, 0.0)
    t = dict(prm); t['ro'] = list(x[:NJ]); t['ri'] = list(np.minimum(x[NJ:2 * NJ], x[:NJ])); t['shadowH'] = float(min(x[-1], SHADOW_MAX))
    return t, es.result.fbest


def main():
    frameList = prj.group(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else list(range(1, 12))
    result = json.load(open(OUT)) if os.path.exists(OUT) and '--restarts' not in sys.argv else {}
    sv = Server()
    try:
        for k in frameList:
            t = time.time()
            m = Model(sv, k)
            if str(k) in result:
                prm = dict(result[str(k)]); prm.update({kk: ORIG[kk] for kk in ('tO', 'tO2', 'tI', 'inkK', 'seed')})
                prm['shadowA'] = SHADOW_A[k]
                for kk in ('ro', 'ri'):          # 26 -> 29 angles: the new ones have no thickness
                    while len(prm[kk]) < NJ:
                        prm[kk] = list(prm[kk]) + [0.3]
                if os.environ.get('SHADOW0'):
                    prm['shadowH'] = float(os.environ['SHADOW0'])
            else:
                ro, ri = m.initial()
                prm = dict(ORIG, ro=[round(v, 3) for v in ro], ri=[round(v, 3) for v in ri], shadowA=SHADOW_A[k])
            if TIME and str(k - 1) in result and k - 1 in frameList:
                m.previous = (np.array(result[str(k - 1)]['ro']), np.array(result[str(k - 1)]['ri']))
                m.lam_t = 0.5 if k <= 6 else 0.2
                prm = dict(prm); prm['ro'] = list(0.5 * np.array(prm['ro']) + 0.5 * m.previous[0]); prm['ri'] = list(0.5 * np.array(prm['ri']) + 0.5 * m.previous[1])
            j0 = m(prm)
            prm, j = cma_fit(m, prm)
            prm, j = search(m, prm, j, steps=(0.02, 0.01), circle=2)
            d = m(prm, detail=True)
            prm['ro'] = [round(v, 3) for v in prm['ro']]; prm['ri'] = [round(v, 3) for v in prm['ri']]
            prm['shadowH'] = round(prm['shadowH'], 3)
            result[str(k)] = prm
            json.dump(result, open(OUT, 'w'), indent=1)
            print('frame %2d: J %.3f -> %.3f  model IoU %.3f (mass %.3f)  brow %.2f/%.2f (sample %.2f/%.2f)  cheek %.2f (%.2f)  shadowH %.2f  %d scorings, %.0f s' % (
                k, j0, d['J'], d['iou'], d['iou_mass'], d['brow'], d['brow2'], d['brow_sample'], d['brow2_sample'], d['face'], d['face_sample'], prm['shadowH'], m.n, time.time() - t), flush=True)
    finally:
        sv.close()


if __name__ == '__main__':
    main()
