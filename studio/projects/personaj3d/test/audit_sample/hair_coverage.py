"""HAIR COVERAGE MAP (pass 6) -- WHAT the sample's bright mass (hair) lands on in ours, and the other way round.
The same code on both sides: 320x180 LANCZOS, L, the composition mask (L>=90, stars/snow removed by top-hat, 2x2
opening). Every pixel of ours is known EXACTLY from the role render (skin / hair / hairInner / hood / cloak / background).
  A. a bright pixel of the sample -> in ours: bright (agree) | hair but dark (shadow) | inner cap | skin (NO hair) |
     hood (the hood pass -- left for later) | other.
  B. a bright pixel of ours that is not bright in the sample -> excess mass (where).
  C. Zones (shot 1, relative to the sample's eye centre; per frame): near side (left of the eye), forehead
     (above the eye), far side (right of the eye, higher up) -- bright share sample / ours.
python3 test/audit_sample/hair_coverage.py OURS_FOLDER ROLE_FOLDER [sheet.png]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '../../../personaj'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from composition import mask

ROLE = {'skin': (255, 0, 0), 'neck': (55, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 55, 0), 'hood': (0, 0, 255),
       'hoodLining': (0, 255, 255), 'hoodInner': (0, 0, 55), 'cloak': (255, 0, 255), 'cloakInner': (55, 0, 55), 'background': (0, 0, 0)}
NAME = list(ROLE); RR = np.array([ROLE[k] for k in NAME], float)
GROUP = {'skin': 'skin', 'neck': 'skin', 'hair': 'hair', 'hairInner': 'hairInner', 'hood': 'hood', 'hoodLining': 'hood', 'hoodInner': 'hood',
         'cloak': 'cloak', 'cloakInner': 'cloak', 'background': 'background'}
EYE = {**{k: (99.35, 48.7) for k in range(1, 7)}, 7: (100.15, 47.9), 8: (101.15, 47.1), 9: (102.65, 46.8), 10: (109.55, 52.0), 11: (114.25, 53.9)}
# zones relative to the eye centre (dx0, dy0, dx1, dy1) -- shot 1
ZONES = {'near_side': (-34, -12, -6, 30), 'forehead': (-6, -30, 14, -6), 'far_side': (14, -34, 44, -2)}
SHOT = {'1-shot': range(1, 12), '2-shot': (12, 13), '3-shot': range(14, 23)}

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

def role320(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    d = ((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1)
    return np.array([GROUP[NAME[i]] for i in range(len(NAME))])[d.argmin(-1)]

def image(k, ours, role):
    Lm = L320((SAMPLE_DIR + '/k%02d.png') % k); Lb = L320('%s/%03d.png' % (ours, k - 1))
    return mask(Lm), mask(Lb), role320('%s/%03d.png' % (role, k - 1)), Lm, Lb

def count(ours, role):
    out = {}
    for s, ks in SHOT.items():
        A = {}; B = {}; nM = nB = nAgree = 0; zones = {m: [0, 0, 0] for m in ZONES}
        for k in ks:
            nm, nb, r, Lm, Lb = image(k, ours, role)
            nM += nm.sum(); nB += nb.sum(); nAgree += (nm & nb).sum()
            for g in ('skin', 'hair', 'hairInner', 'hood', 'cloak', 'background'):
                sel = nm & ~nb & (r == g)
                A[g] = A.get(g, 0) + int(sel.sum())
                selB = nb & ~nm & (r == g)
                B[g] = B.get(g, 0) + int(selB.sum())
            if s == '1-shot':
                x0, y0 = EYE[k]
                for m, (a, b, c, d) in ZONES.items():
                    ys, xs = slice(int(y0 + b), int(y0 + d)), slice(int(x0 + a), int(x0 + c))
                    zones[m][0] += float(nm[ys, xs].mean()); zones[m][1] += float(nb[ys, xs].mean()); zones[m][2] += 1
        e = {'sample_bright': int(nM), 'ours_bright': int(nB), 'agree': int(nAgree),
             'sample_bright_ours': {g: round(float(v) / max(1, nM) * 100, 1) for g, v in A.items() if v},
             'ours_excess': {g: round(float(v) / max(1, nB) * 100, 1) for g, v in B.items() if v}}
        if s == '1-shot': e['regions'] = {m: (round(v[0] / v[2], 3), round(v[1] / v[2], 3)) for m, v in zones.items()}
        out[s] = e
    return out

def sheet(ours, role, out):
    """per shot: the sample's bright frequency (magenta), ours (green), overlaid (grey = agree); the zones in shot 1"""
    rows = []
    for s, ks in SHOT.items():
        fm = np.zeros((180, 320)); fb = np.zeros((180, 320)); skin = np.zeros((180, 320)); hood = np.zeros((180, 320))
        for k in ks:
            nm, nb, r, Lm, Lb = image(k, ours, role)
            fm += nm; fb += nb; skin += (r == 'skin'); hood += (r == 'hood')
        n = len(ks); fm /= n; fb /= n; skin /= n; hood /= n
        img = np.zeros((180, 320, 3))
        img[..., 0] = fm; img[..., 1] = fb; img[..., 2] = fm
        img = np.maximum(img, np.stack([skin * 0.25, skin * 0.10, skin * 0.10], -1))      # skin (ours) -- dim red
        img = np.maximum(img, np.stack([hood * 0.0, hood * 0.0, hood * 0.35], -1))        # hood (ours) -- dim blue
        im = Image.fromarray((img * 255).clip(0, 255).astype(np.uint8)).resize((640, 360), Image.NEAREST)
        if s == '1-shot':
            from PIL import ImageDraw
            d = ImageDraw.Draw(im); x0, y0 = EYE[1]
            for m, (a, b, c, e) in ZONES.items(): d.rectangle([2 * (x0 + a), 2 * (y0 + b), 2 * (x0 + c), 2 * (y0 + e)], outline=(255, 255, 0))
        rows.append(im)
    W = Image.new('RGB', (640, 360 * len(rows)))
    for i, r in enumerate(rows): W.paste(r, (0, 360 * i))
    W.save(out)

if __name__ == '__main__':
    ours, role = sys.argv[1], sys.argv[2]
    o = count(ours, role)
    for s, e in o.items():
        print('==', s, ' sample bright %d px, ours %d, agree %d (%.0f%% of the sample)' % (e['sample_bright'], e['ours_bright'], e['agree'], 100 * e['agree'] / max(1, e['sample_bright'])))
        print('   sample bright, ours NOT bright -- what ours has there (% of the sample bright):', e['sample_bright_ours'])
        print('   ours bright, sample NOT bright -- what ours has there (% of our bright):', e['ours_excess'])
        if 'regions' in e: print('   zone bright share (sample, ours):', e['regions'])
    if len(sys.argv) > 3: sheet(ours, role, sys.argv[3])
    json.dump(o, open(ours.rstrip('/') + '_coverage.json', 'w'), indent=1)
