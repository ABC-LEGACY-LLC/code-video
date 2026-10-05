"""HAIR MEASUREMENT (pass 6) -- THE SAME CODE on the sample and on ours (320x180 LANCZOS, L, median 3). Hair -- how it
frames the face (coverage), as technique; the drawing is our own.
  M1 bright mass (the composition mask, personaj/test/composition.py): area %, centre, extent (1..99 percentile).
  M2 open skin BEHIND the near eye (shot 1): on every 2nd row from +7..+21 px below the eye-centre row, walking left
     from the eye's x, where the skin (L 48..78) ends (then 2 pixels that are not skin) -- its width (px). The eye centres
     are the sample's (the fit targets of pass 4; ours sit on them within +-1 px).
  M3 forehead openness (shot 1): from above the near eye (from the eye centre -7 px) upward, in every column (x -4..+10),
     the skin run (px) -- in the sample everything above the brow line is hair.
  M4 hair over the profile eye (shot 2): the share of bright hair (L>=85) in the eye box (130..147, 73..83).
python3 test/audit_sample/hair_measure.py [ours_folder ...]"""
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

def L320(p, med=True):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    a = np.asarray(im, float)
    return ndimage.median_filter(a, 3) if med else a

EYE = {**{k: (99.35, 48.7) for k in range(1, 7)}, 7: (100.15, 47.9), 8: (101.15, 47.1), 9: (102.65, 46.8), 10: (109.55, 52.0), 11: (114.25, 53.9)}
skin = lambda v: 48 <= v <= 78

def m2(m, k):
    x0, y0 = EYE[k]; r = []
    for dy in range(7, 23, 2):
        y = int(round(y0 + dy)); x = int(round(x0)); last = None
        while x > 20:
            if skin(m[y, x]): last = x
            elif last is not None and not skin(m[y, x - 1]): break
            x -= 1
        r.append(None if last is None else round(x0 - last, 1))
    return r

def m3(m, k):
    x0, y0 = EYE[k]; r = []
    for dx in range(-4, 11, 2):
        x = int(round(x0 + dx)); y = int(round(y0 - 7)); n = 0
        while y > 2 and (skin(m[y, x]) or skin(m[y - 1, x])): n += 1; y -= 1
        r.append(n)
    return r

def measure(f):
    out = {}
    for k in range(1, 23):
        Lr = L320(f(k), med=False); m = ndimage.median_filter(Lr, 3)
        n = mask(Lr); ys, xs = np.nonzero(n)
        e = {'mass': dict(a=round(n.mean() * 100, 2), cx=round(xs.mean(), 1) if len(xs) else None, cy=round(ys.mean(), 1) if len(xs) else None,
                           x0=int(np.percentile(xs, 1)) if len(xs) else None, x1=int(np.percentile(xs, 99)) if len(xs) else None,
                           y0=int(np.percentile(ys, 1)) if len(xs) else None, y1=int(np.percentile(ys, 99)) if len(xs) else None)}
        if k <= 11: e['behind_eye'] = m2(m, k); e['forehead'] = m3(m, k)
        if k in (12, 13): e['profile_eye_hair'] = round(float((m[73:84, 130:148] >= 85).mean()), 3)
        out[k] = e
    return out

def med(v): v = [t for t in v if t is not None]; return round(float(np.median(v)), 1) if v else None

if __name__ == '__main__':
    folders = sys.argv[1:] or ['frames-sample/anime-stage5']
    result = {'sample': measure(lambda k: (SAMPLE_DIR + '/k%02d.png') % k)}
    for p in folders: result[p] = measure(lambda k, p=p: '%s/%03d.png' % (p, k - 1))
    for name, o in result.items():
        print('==', name)
        for s, (a, b) in (('1-shot', (1, 11)), ('2-shot', (12, 13)), ('3-shot', (14, 22))):
            M = [o[k]['mass'] for k in range(a, b + 1)]
            print('  %s bright mass: area %.2f%%  centre (%.0f, %.0f)  x %s..%s  y %s..%s' % (s, np.mean([t['a'] for t in M]), np.mean([t['cx'] for t in M if t['cx']]), np.mean([t['cy'] for t in M if t['cy']]),
                  med([t['x0'] for t in M]), med([t['x1'] for t in M]), med([t['y0'] for t in M]), med([t['y1'] for t in M])))
        print('  skin behind the eye (1-9, median per frame):', [med(o[k]['behind_eye']) for k in range(1, 10)])
        print('  forehead skin (1-9, median):', [med(o[k]['forehead']) for k in range(1, 10)])
        print('  hair share over the profile eye (12, 13):', o[12]['profile_eye_hair'], o[13]['profile_eye_hair'])
    json.dump(result, open('private/test/audit_sample/hair_measure.json', 'w'), indent=1)
