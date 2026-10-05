"""PART MEASUREMENT (pass 10) -- THE SAME CODE on the sample and on ours: on every frame, each part of the face separately.
The user: "tell apart which is the hair, which is the nose, eye, brow, mouth, chin; do not measure the head down to the mouth
and leave the chin out; on our own model take the hair and the hood off and measure one by one, then put them back and measure".

Image: 320x180 (LANCZOS), L, median 3. Parts:
  EDGES (scan -- the rim lines stay on the face side):
    contour -- in every row, from inside the face (x0) to the right: the last pixel with L >= 45, until 2 pixels in a row have L < low
               (shot 1: the far cheek contour; shot 2: the profile -- forehead, nose, lip, chin; shot 3: right edge of the lower face)
    jaw     -- in every column, from inside the face (y0) downwards: the same way (under the jaw / under the chin)
    chin tip -- of the contour and jaw points, the outermost one along the shot's direction (shot 1 down-right, shot 2
               down-forward, shot 3 down-left); nose tip -- the rightmost point within the range of contour rows.
  BLOBS: dark components (8-connectivity) INSIDE the face's filled mask (face -- (L >= 47) & ~hair,
    hair = 3x3 opening of (L >= 85) -- the thin rim disappears), in the shot's box: eye (largest), brow (largest),
    mouth and lip shadow (darkest). Centre -- weighted by darkness; the edges are written out too.
The boxes are in the sample's cameras (our camera is fitted to the same place) -- the same for both sides. Not found -- None.
From the check sheets (test/parts/check_sheet.py): the jaw scan starts BELOW the lip shadow (in shot 1 at x 126 it
stopped on the lip shadow and gave 89); shot 2 jaw columns 146..160 (at x < 146 the sample's jaw line merges with the
neck -- the scan ran down the neck to 134); in shot 3 the mouth is not used (out of several small dark marks on the lower
face -- nostril, lip corner, hair shadow -- the rule picks a different one on every frame: x 144..162).
Calibration: the same code on our render -- against exact points from 3D (test/parts/calibrate.py).
python3 test/parts/part_measure.py FOLDER [--first 0] [--out F.json]   (sample: 'personaj3d/private/sample/k%02d.png')"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 3)

# frame groups (sample frame number, 1-based): seed, box, contour/jaw scans, chin direction, nose rows, part boxes
P = {
    'a': {'frame': range(1, 10), 'seed': (112, 78), 'box': (60, 15, 150, 125), 'chin': (0.45, 0.89),
          'contour': (40, 108, 108, 44), 'jaw': (84, 130, 96), 'low': 50,
          'eye_near': (84, 36, 106, 58), 'eye_far': (112, 42, 130, 58), 'brow_near': (90, 30, 110, 40), 'brow_far': (108, 32, 128, 43),
          'mouth': (110, 78, 130, 90), 'lip': (114, 88, 130, 97)},
    'b': {'frame': (10,), 'seed': (118, 80), 'box': (70, 20, 160, 125), 'chin': (0.45, 0.89),
          'contour': (40, 108, 118, 44), 'jaw': (96, 138, 100), 'low': 50, 'nose': (52, 76),
          'eye_near': (95, 42, 118, 60), 'eye_far': (118, 42, 136, 62), 'brow_near': (95, 30, 120, 44), 'brow_far': (118, 30, 140, 46),
          'mouth': (122, 80, 142, 90), 'lip': (125, 90, 142, 100)},
    'c': {'frame': (11,), 'seed': (120, 80), 'box': (70, 20, 160, 125), 'chin': (0.45, 0.89),
          'contour': (42, 112, 120, 44), 'jaw': (98, 142, 102), 'low': 50, 'nose': (54, 80),
          'eye_near': (100, 44, 124, 62), 'eye_far': (122, 44, 142, 64), 'brow_near': (100, 32, 124, 46), 'brow_far': (122, 32, 144, 48),
          'mouth': (126, 82, 146, 92), 'lip': (128, 92, 146, 102)},
    'd': {'frame': (12, 13), 'seed': (146, 96), 'box': (110, 50, 178, 125), 'chin': (0.71, 0.71),
          'contour': (60, 116, 140, 38), 'jaw': (146, 160, 100), 'low': 40, 'nose': (80, 97),
          'eye_near': (126, 70, 162, 90), 'brow_near': (126, 56, 165, 72), 'mouth': (148, 94, 166, 110)},
    'e': {'frame': range(14, 23), 'seed': (163, 130), 'box': (125, 95, 200, 170), 'chin': (-0.35, 0.94),
          'contour': (138, 158, 150, 44), 'jaw': (132, 168, 140), 'low': 44,
          'eye_near': (145, 100, 170, 118), 'eye_far': (166, 108, 188, 130)},
}
def params(k):
    for g, p in P.items():
        if k in p['frame']: return g, p
    raise KeyError(k)

def scan(L, x, y, dx, dy, low, n=60, high=45):
    """from (x, y) in direction (dx, dy): the last pixel with L >= high, until 2 pixels in a row have L < low"""
    if not (0 <= x < 318 and 0 <= y < 178) or L[y, x] < high: return None      # the start must be inside the face
    end = None
    for i in range(n):
        xi, yi = x + dx * i, y + dy * i
        if not (0 <= xi < 318 and 0 <= yi < 178): break
        if L[yi, xi] >= high: end = (xi, yi)
        if end is not None and L[yi + dy, xi + dx] < low and L[yi + 2 * dy, xi + 2 * dx] < low: break
    return end

def face_mask(L, p):
    x0, y0, x1, y1 = p['box']
    hair = ndimage.binary_opening(L >= 85, structure=np.ones((3, 3)))
    Y = (L >= 47) & ~hair
    Q = np.zeros_like(Y); Q[y0:y1, x0:x1] = True; Y &= Q
    lab, _ = ndimage.label(Y)
    sx, sy = p['seed']; c = lab[sy, sx]
    if not c:
        ys, xs = np.nonzero(lab[max(0, sy - 6):sy + 7, max(0, sx - 6):sx + 7])
        if len(xs): j = np.argmin((xs - 6) ** 2 + (ys - 6) ** 2); c = lab[max(0, sy - 6) + ys[j], max(0, sx - 6) + xs[j]]
    if not c: return None
    return ndimage.binary_fill_holes(lab == c)

def pieces(L, box, threshold, optimum='large'):
    """dark blobs inside the box: large masses touching the box edge (hood, background, hair shadow) are dropped;
    the largest (eye, brow) or the darkest (mouth, lip shadow) -- centre weighted by darkness"""
    x0, y0, x1, y1 = box
    D = np.zeros(L.shape, bool); D[y0:y1, x0:x1] = L[y0:y1, x0:x1] < threshold
    lab, n = ndimage.label(D, structure=np.ones((3, 3)))
    best = None
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(xs) < 2: continue
        if (xs.min() == x0 or xs.max() == x1 - 1 or ys.min() == y0 or ys.max() == y1 - 1) and len(xs) > 12: continue
        w = (threshold - L[ys, xs]).clip(0.5)
        o = {'x': round(float((xs * w).sum() / w.sum()), 2), 'y': round(float((ys * w).sum() / w.sum()), 2), 'n': int(len(xs)),
             'left': int(xs.min()), 'right': int(xs.max()), 'top': int(ys.min()), 'low': int(ys.max()), 'L': float(L[ys, xs].min())}
        key = o['n'] if optimum == 'large' else -o['L'] + 0.01 * o['n']
        if best is None or key > best[0]: best = (key, o)
    return best[1] if best else None

def measure(L, k):
    g, p = params(k)
    o = {'group': g}
    ya, yb, x0, low = p['contour']
    cont = {}
    for y in range(ya, yb + 1):
        r = scan(L, x0, y, 1, 0, low)
        if r: cont[y] = r[0]
    o['contour'] = cont
    xa, xb, y0 = p['jaw']
    jaw = {}
    for x in range(xa, xb + 1):
        r = scan(L, x, y0, 0, 1, p['low'])
        if r: jaw[x] = r[1]
    o['jaw'] = jaw
    pts = [(x, y) for x, y in jaw.items()] or [(x, y) for y, x in cont.items()]   # chin -- the end of the under-jaw trace along the shot's direction
    if pts:
        dx, dy = p['chin']; s = np.array([x * dx + y * dy for x, y in pts]); m = s.max()
        sel = [pts[i] for i in np.nonzero(s >= m - 1.0)[0]]
        o['chin_tip'] = [round(float(np.mean([a for a, b in sel])), 2), round(float(np.mean([b for a, b in sel])), 2)]
    if 'nose' in p:
        a, b = p['nose']; oc = {y: x for y, x in cont.items() if a <= y <= b}
        if oc:
            m = max(oc.values()); yy = [y for y, x in oc.items() if x == m]
            o['nose_tip'] = [float(m), round(float(np.mean(yy)), 2)]
    F = face_mask(L, p)
    if F is not None and F.sum() >= 30:
        ys, xs = np.nonzero(F); o['face_area'] = int(F.sum()); o['face_box'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    for q in ('eye_near', 'eye_far', 'brow_near', 'brow_far', 'mouth', 'lip'):
        if q in p:
            v = pieces(L, p[q], threshold=(50 if q in ('mouth', 'lip') else 48 if q.startswith('brow') else 25),
                      optimum=('dark' if q in ('mouth', 'lip') else 'large'))
            o[q] = v if v is not None and valid(q, v, g) else None
    return o

def valid(q, v, g):
    """shape condition (from the check sheets): brow -- a horizontal band (width >= 8 px, width >= 1.8 x height; a hair edge is vertical);
    eye -- at least 4 px, in shot 3 the closed lash line is horizontal (width >= 2 x height); mouth/lip -- horizontal (width >= height)"""
    en, hgt = v['right'] - v['left'] + 1, v['low'] - v['top'] + 1
    if q.startswith('brow'): return en >= 8 and en >= 1.8 * hgt
    if q.startswith('eye'): return v['n'] >= 4 and (g != 'e' or en >= 2 * hgt) and (g != 'a' or q != 'eye_far' or hgt <= 1.6 * en)
    return en >= hgt

ROLE = {'skin': (255, 0, 0), 'neck': (128, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 128, 0), 'hood': (0, 0, 255), 'hoodLining': (0, 255, 255),
       'hoodInner': (0, 0, 128), 'cloak': (255, 0, 255), 'cloakInner': (128, 0, 128), 'background': (0, 0, 0)}
TONE = {'skin': 58, 'neck': 12, 'hair': 100, 'hairInner': 30, 'hood': 20, 'hoodLining': 40, 'hoodInner': 10, 'cloak': 20, 'cloakInner': 10, 'background': 12}
def role_mask(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    name = list(ROLE); RR = np.array([ROLE[n] for n in name], float)
    return np.array(name)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]
def role_L(p):
    """artificial lightness from the role render: skin 58 (the sample's skin 57..61), hair 100, the rest dark -- the edge scan runs
    on this (in the bare render -- the head's own silhouette: the neck too is 'not face', the under-jaw line ends there)"""
    r = role_mask(p); L = np.zeros(r.shape)
    for n, v in TONE.items(): L[r == n] = v
    return L

def folder_measure(folder, first=0):
    f = (lambda k: folder % k) if '%' in folder else (lambda k: '%s/%03d.png' % (folder, k - 1 + first))
    return {k: measure(L320(f(k)), k) for k in range(1, 23)}

if __name__ == '__main__':
    folder = sys.argv[1]
    first = int(sys.argv[sys.argv.index('--first') + 1]) if '--first' in sys.argv else 0
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    r = folder_measure(folder, first)
    if out: json.dump(r, open(out, 'w'))
    for k, o in r.items():
        f = lambda v: '-' if v is None else '(%.1f, %.1f)' % (v['x'], v['y']) if isinstance(v, dict) else '(%.1f, %.1f)' % tuple(v)
        print('k%02d %s | eye %s %s | brow %s %s | nose %s | mouth %s lip %s | chin %s' % (k, o.get('group'),
              f(o.get('eye_near')), f(o.get('eye_far')), f(o.get('brow_near')), f(o.get('brow_far')), f(o.get('nose_tip')),
              f(o.get('mouth')), f(o.get('lip')), f(o.get('chin_tip'))))
