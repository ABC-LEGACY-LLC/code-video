"""SHOT 1: BODY EDGE AND HAND -- a frame-by-frame fit to the sample mask (pass 10).

compare/silhouette (L<20, median 5, connected to the body) showed: IoU 0.70, and the difference
is systematic -- (1) from under the chin down to the hand the sample's body edge is VERTICAL
(x~131, 1..6), ours is diagonal (113 -> 140); (2) under the hand, an armpit dent (x~125); (3)
in 1..4, a gap under the hand where the sky shows through (y~158..166); (4) the hand --
a thick forearm + a palm toward the upper right, ours a tapering blade; (5) inside the hand L 8,
ours 16.

This script does NOT TRACE the drawing, it fits our two models to the measurement:
  BODY  -- in each row the right edge of the body: the end of the dark run that starts
           from the left (a break of up to 6 px is passed over as a bright band inside
           the body), a 3-row median, a key every 3 px;
  HAND  -- our "tongue" model (base B, half-width hB, tip T, top-edge
           control U, bottom-edge control D; two quadratic curves), fitted by IoU to the
           remainder the body does not cover (soft mask, Nelder-Mead).
Result: hand-fit.json -> sheet.mjs (CLOAK_LOW, HAND)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json
import numpy as np
from scipy import ndimage, optimize
from PIL import Image, ImageDraw
sys.path.insert(0, (COMPARE_DIR))
from compare import project, image, silhouette

W = (PERSONAJ_DIR)
prj = project.Project(W + '/compare.json')
SEED, SH, MED = (126, 150), '<20', 5
Y0, Y1, X0 = 112, 180, 120              # rows of the body keys; start of the run
UZ = 6                                   # a bright band inside the body (<=6 px) is bridged over
QX0, QY0, QX1, QY1 = 108, 108, 200, 180  # fit box
S = 4                                    # supersampling


def body_edge(m):
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
            g = np.nonzero(r[x:x + UZ + 1])[0]      # a break of up to UZ px
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


def hand_points(B, hB, T, U, D):
    B, T, U, D = map(np.asarray, (B, T, U, D))
    d = T - B
    l = np.hypot(*d) or 1.0
    n = np.array([-d[1] / l, d[0] / l])
    P0, P1 = B - n * hB, B + n * hB
    Bk = np.array([B[0] - 8.0, B[1]])
    return np.vstack([bez(P0, U, T), bez(T, D, P1), bez(P1, Bk, P0)])


def rasterize(pts):
    w, h = (QX1 - QX0) * S, (QY1 - QY0) * S
    im = Image.new('L', (w, h), 0)
    ImageDraw.Draw(im).polygon([((x - QX0) * S, (y - QY0) * S) for x, y in pts], fill=255)
    a = np.asarray(im, float).reshape(QY1 - QY0, S, QX1 - QX0, S).mean(axis=(1, 3)) / 255.0
    return a


def key_list(e):
    k = [[y, round(float(e[y]), 1)] for y in range(Y0, Y1, 3) if not np.isnan(e[y])]
    if k[-1][0] != Y1 - 1 and not np.isnan(e[Y1 - 1]):
        k.append([Y1 - 1, round(float(e[Y1 - 1]), 1)])
    return k


def key_edge(keys):
    """as in the drawing (the film.mjs cloak): linear between the keys"""
    e = np.full(180, np.nan)
    ys = np.array([k[0] for k in keys], float)
    xs = np.array([k[1] for k in keys], float)
    r = np.arange(int(ys[0]), 180)
    e[r] = np.interp(r, ys, xs)
    return e


def body_mask(e):
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


def penalty(p, e):
    """so that the model comes out the same in the SVG too: the edges do not cross (the top-edge
    control lies above the bottom-edge one along the normal), the tip is inside the frame, the
    base sticks to the body, the width is reasonable"""
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


def fit(Mt, e, starts, rng):
    """starts: [[tongue, ...], ...] -- each candidate is made of one or more tongues"""
    tn = body_mask(e)
    tgt = Mt[QY0:QY1, QX0:QX1].astype(float)
    bo = lambda p: [p[j:j + 9] for j in range(0, len(p), 9)]
    def iou(p):
        a = tn.copy()
        for t in bo(p):
            a = np.maximum(a, rasterize(hand_points(**p2q(t))))
        # THE SAME CODE ON BOTH SIDES: the sample mask went through median 5 -- the model
        # goes through it too (otherwise the thin tip shrinks in the filter, the fit puts it at
        # the sample's already shrunk tip and the drawn hand comes out 4..13 px short)
        a = ndimage.median_filter(a, MED)
        return np.minimum(a, tgt).sum() / max(1.0, np.maximum(a, tgt).sum())
    f = lambda p: 1 - iou(p) + sum(penalty(t, e) for t in bo(p))
    def run(p):
        return list(optimize.minimize(f, p, method='Nelder-Mead',
                                      options={'xatol': 0.05, 'fatol': 1e-6, 'maxiter': 2500 * len(p) // 9}).x)
    candidate = [run(sum((q2p(t) for t in b), [])) for b in starts]
    best = min(candidate, key=f)
    sig = np.array([4, 4, 1.5, 4, 4, 6, 6, 6, 6] * (len(best) // 9))
    for _ in range(8):                       # restart from random shifts: get out of a local minimum
        p = np.array(best) + rng.normal(0, 1, len(best)) * sig
        c = run(list(p))
        if f(c) < f(best):
            best = c
    j = sum(penalty(t, e) for t in bo(best))
    return [p2q(t) for t in bo(best)], iou(best), iou(sum((q2p(t) for t in starts[0]), [])), j


def old_hand(q):
    """the previous HAND (B,C,T,hB,hC) -> the new one (U,D)"""
    B, C, T = map(np.asarray, (q['B'], q['C'], q['T']))
    d = T - B
    l = np.hypot(*d)
    n1 = np.array([-d[1] / l, d[0] / l])
    return dict(B=list(B), hB=q['hB'], T=list(T), U=list(C - n1 * q['hC'] * 1.15), D=list(C + n1 * q['hC'] * 1.15))


OLD = [dict(B=[140, 148], hB=9, C=[158, 141], hC=5, T=[175, 133])] * 6 + [
    dict(B=[138, 153], hB=8, C=[158, 153], hC=5, T=[172, 152]),
    dict(B=[140, 155], hB=8, C=[163, 157], hC=5, T=[173, 162]),
    dict(B=[142, 160], hB=8, C=[168, 160], hC=4.5, T=[170, 171]),
    dict(B=[142, 160], hB=8, C=[167, 163], hC=4.5, T=[166, 173]),
    dict(B=[142, 162], hB=8, C=[165, 166], hC=4, T=[160, 175])]

# an extra start for the hook frames (by eye from the sample mask: a sickle bending down
# from the end of the forearm -- the base at the forearm's end, the tip at the sickle's lower end)
HOOK = {7: dict(B=[140, 158], hB=6, T=[172, 153], U=[160, 146], D=[160, 164]),
         8: dict(B=[145, 151], hB=4, T=[150, 170], U=[172, 158], D=[158, 158]),
         9: dict(B=[150, 150], hB=4, T=[152, 175], U=[185, 163], D=[170, 163]),
         10: dict(B=[148, 157], hB=4, T=[150, 177], U=[185, 165], D=[168, 165]),
         11: dict(B=[140, 172], hB=3, T=[158, 176], U=[152, 166], D=[150, 180])}

# 8..11: a separate SICKLE under the forearm (in the sample: a pointed shape coming out below
# the body and bending up and to the right, with background between it and the forearm) -- a
# second tongue. The start points are by eye from the 4x sheet; the fit gives the values.
SICKLE = {8: dict(B=[135, 170], hB=3.5, T=[168, 160], U=[155, 163], D=[155, 175]),
        9: dict(B=[138, 174], hB=4, T=[176, 160], U=[160, 166], D=[162, 178]),
        10: dict(B=[140, 175], hB=4, T=[176, 163], U=[158, 167], D=[160, 178]),
        11: dict(B=[142, 176], hB=3, T=[178, 170], U=[160, 170], D=[160, 179])}

if __name__ == '__main__':
    result = {'CLOAK_LOW': [], 'HAND': [], 'iou': []}
    rng = np.random.default_rng(1)
    for k in range(1, 12):
        Mt = silhouette.mask(image.load(prj.file('sample', k), prj.size), SH, MED, SEED)
        keys = key_list(body_edge(Mt))
        e = key_edge(keys)
        q0 = old_hand(OLD[k - 1])
        head = [[q0]] + ([[HOOK[k]]] if k in HOOK else [])
        if k in SICKLE:
            head = [b + [SICKLE[k]] for b in head]
        qs, iou, iou0, j = fit(Mt, e, head, rng)
        q = [{a: ([round(v * 2) / 2 for v in b] if isinstance(b, list) else round(b * 2) / 2) for a, b in t.items()} for t in qs]
        result['CLOAK_LOW'].append(keys)
        result['HAND'].append(q)
        result['iou'].append([round(iou0, 3), round(iou, 3)])
        print('frame %2d  IoU (in the box, union of the models) old hand %.3f -> fitted %.3f  penalty %.3f  %s' % (k, iou0, iou, j, q), flush=True)
    json.dump(result, open(W + '/hand-fit.json', 'w'), indent=1)
