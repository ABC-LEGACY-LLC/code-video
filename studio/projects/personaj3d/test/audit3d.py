"""AUDIT (3D, sample22) -- every frame, three sides with the same code: SAMPLE, BEFORE (2D pass 12, the delivered
render personaj/ff), NOW (3D anime, frames-sample/anime). All at 320x180 LANCZOS, L.

 A  role tones (3D only): EXACT role masks from frames-sample/role (nearest colour at 960x540, then
    area share >0.5 at 320x180, 1 px erosion -- so edges and contours do not leak in); the L median of each role in the anime render.
    Sample values -- from pass 12's L table of the sample's frame 17 (the note in tone_class.py).
 B  figure (hood+cloak+head) -- occlusion map (compare.occlusion.figure_map, the blocks where a particle was never
    seen) for each shot; IoU with the sample. In 3D there is also an exact mask -- it checks the tool on our own material.
 C  held 1..6: energy of the normalised difference (compare.diff.nz) in the left 40% and the right 60%.
 D  motion inside the figure (median-5 L, each pair, inside the shot's figure mask) -- the character, not the snow.
 E  cuts: bright mass (composition.mask) and figure area ratio 11->12, 13->14.
 F  tone class mass (tone_class): IoU with the sample -- outer, lining, inner, face, hair."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import occlusion
from compare.diff import nz
from composition import mask as bright_mask
import tone_class as TS

R = (P3D_DIR)
import argparse
_a = argparse.ArgumentParser()
_a.add_argument('--now', default=R + '/frames-sample/anime'); _a.add_argument('--role', default=R + '/frames-sample/role')
_a.add_argument('--before', default=(PERSONAJ_DIR + '/ff')); _a.add_argument('--out', default=R + '/private/test/audit3d')
ARG = _a.parse_args()
PATH = {'sample': sorted(glob.glob((SAMPLE_DIR + '/k??.png'))),
       'before': sorted(glob.glob(ARG.before + '/*.png')),
       'now': sorted(glob.glob(ARG.now + '/???.png'))}
ROLE = sorted(glob.glob(ARG.role + '/???.png'))
assert all(len(v) == 22 for v in PATH.values()) and len(ROLE) == 22
SHOT = {'1': range(0, 11), '2': range(11, 13), '3': range(13, 22)}


def L(p):
    return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), dtype=float)


F = {t: [L(p) for p in v] for t, v in PATH.items()}

# --- A: role masks ---
lin = lambda c: 0 if c == 0 else round(255 * ((c / 255 + 0.055) / 1.055) ** 2.4) if c < 255 else 255
ROLES = {'skin': (255, 0, 0), 'neck': (128, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 128, 0),
          'hoodOuter': (0, 0, 255), 'hoodLining': (0, 255, 255), 'hoodInner': (0, 0, 128),
          'cloak': (255, 0, 255), 'cloakInner': (128, 0, 128), 'background': (0, 0, 0)}
NAME = list(ROLES); COLOUR = np.array([[lin(c) for c in ROLES[n]] for n in NAME], float)


def role_mask(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=float)
    d = ((a[:, :, None, :] - COLOUR[None, None]) ** 2).sum(-1)
    k = d.argmin(-1)
    out = {}
    for i, n in enumerate(NAME):
        m = (k == i).astype(np.float32)
        s = np.asarray(Image.fromarray(m * 255).resize((320, 180), Image.BOX), dtype=float) / 255 > 0.5
        out[n] = s
    return out


RN = [role_mask(p) for p in ROLE]
A = {}
for n in NAME:
    if n == 'background':
        continue
    vals, area = [], []
    for k in range(22):
        m = ndimage.binary_erosion(RN[k][n])
        area.append(RN[k][n].mean() * 100)
        if m.sum() >= 8:
            vals.append(np.median(F['now'][k][m]))
    A[n] = {'L': float(np.median(vals)) if vals else None, 'L_min': float(min(vals)) if vals else None,
            'L_max': float(max(vals)) if vals else None, 'area_%': float(np.mean(area)), 'images': len(vals)}
bg_masks = [ndimage.binary_erosion(RN[k]['background'], iterations=3) for k in range(22)]
A['sky_top'] = {'L': float(np.median([np.median(ndimage.median_filter(F['now'][k], 9)[:45][bg_masks[k][:45]]) for k in range(22)]))}

# --- B: figure (occlusion map) ---
B = {}
figure3d = {s: np.mean([~RN[k]['background'] for k in ks], 0) > 0.5 for s, ks in SHOT.items()}
for s, ks in SHOT.items():
    if len(ks) < 3:
        continue
    X = {t: occlusion.figure_map([F[t][k] for k in ks]) for t in F}
    yb = lambda m: m.reshape(18, 10, 32, 10).mean(axis=(1, 3)) > 0.5      # exact mask -> 10 px blocks
    B[s] = {'IoU_before': occlusion.iou(X['sample'], X['before']), 'IoU_now': occlusion.iou(X['sample'], X['now']),
            'area_sample': float(X['sample'].mean()), 'area_before': float(X['before'].mean()), 'area_now': float(X['now'].mean()),
            'tool_3d_exact_IoU': occlusion.iou(X['now'], yb(figure3d[s])),
            'IoU_now_exact': occlusion.iou(X['sample'], yb(figure3d[s])), 'area_now_exact': float(yb(figure3d[s]).mean()),
            'sample_x': X['sample'].tolist(), 'now_x': X['now'].tolist(), 'before_x': X['before'].tolist()}

# --- C: held 1..6 ---
C = {}
for t in F:
    r = []
    for k in range(5):
        d = np.abs(nz(F[t][k]) - nz(F[t][k + 1]))
        r.append((float(d[:, :128].mean()), float(d[:, 128:].mean())))
    C[t] = r

# --- D: motion inside the figure ---
D = {}
for t in F:
    M5 = [ndimage.median_filter(f, 5) for f in F[t]]
    r = []
    for k in range(21):
        s = next(s for s, ks in SHOT.items() if k in ks)
        s2 = next(s for s, ks in SHOT.items() if k + 1 in ks)
        if s != s2:
            r.append(None); continue
        m = B[s]['sample_x'] if s in B else None
        m = np.kron(np.array(B[s][t + '_x']), np.ones((10, 10))).astype(bool) if s in B else np.ones((180, 320), bool)
        r.append(float(np.abs(M5[k + 1] - M5[k])[m].mean()))
    D[t] = r

# --- E: cuts ---
E = {}
for t in F:
    ya = [bright_mask(f).mean() for f in F[t]]
    E[t] = {'bright_11_12': float(np.sqrt(ya[11] / ya[10])), 'bright_13_14': float(np.sqrt(ya[13] / ya[12]))}

# --- F: tone classes ---
Fr = {}
for t in ('before', 'now'):
    r = []
    for k in range(1, 23):
        mi = TS.Sample(k)
        _, iou = mi.score(F[t][k - 1])
        r.append(iou)
    Fr[t] = {c: float(np.mean([x[c] for x in r])) for c in TS.CLASSES}
    Fr[t + '_shot'] = {s: {c: float(np.mean([r[k][c] for k in ks])) for c in TS.CLASSES} for s, ks in SHOT.items()}
# class areas (inside the figure box), each side
Fm = {}
for t in F:
    q = {c: [] for c in TS.CLASSES}
    for k in range(22):
        x0, y0, x1, y1 = TS.ROI[TS.frame_group(k + 1)]
        s = TS.classes(F[t][k])
        for c in TS.CLASSES:
            q[c].append(float(TS.mass(s[c])[y0:y1, x0:x1].mean() * 100))
    Fm[t] = {c: float(np.mean(v)) for c, v in q.items()}

result = {'A_role_tone': A, 'B_figure': {s: {k: v for k, v in b.items() if not k.endswith('_x')} for s, b in B.items()},
          'C_held': C, 'D_figure_motion': D, 'E_cut': E, 'F_tone_class_IoU': Fr, 'F_class_area_%': Fm}
json.dump(result, open(ARG.out + '.json', 'w'), indent=1)
np.save(ARG.out + '_figure.npy', np.array([[B[s][t + '_x'] for t in ('sample', 'before', 'now')] for s in ('1', '3')]))

print('A  3D role tones (anime, L median; sample pass 12: outer 19, lining 43..48, inner 7..9, face ~59, hair ~100, sky 2..6)')
for n, v in A.items():
    print('   %-10s L %s  (%s..%s)  area %s' % (n, v['L'], v.get('L_min'), v.get('L_max'), '%.1f%%' % v['area_%'] if 'area_%' in v else ''))
print('B  figure (occlusion map) IoU with the sample')
for s, v in result['B_figure'].items():
    print('   shot %s  before %.2f  now(map) %.2f  now(exact mask) %.2f   area sample %.2f before %.2f now(exact) %.2f' % (
        s, v['IoU_before'], v['IoU_now'], v['IoU_now_exact'], v['area_sample'], v['area_before'], v['area_now_exact']))
print('C  held 1..6, pairs: left 40% / right 60% energy')
for t, r in C.items():
    print('   %-6s %s' % (t, '  '.join('%.3f/%.3f' % x for x in r)))
print('D  motion inside the figure (median-5 L, pair)')
for t, r in D.items():
    print('   %-6s %s' % (t, ' '.join('  -  ' if x is None else '%5.2f' % x for x in r)))
print('E  bright mass scale at the cut (sqrt of the area ratio)')
for t, v in E.items():
    print('   %-6s 11->12 %.2fx   13->14 %.2fx' % (t, v['bright_11_12'], v['bright_13_14']))
print('F  tone class mass, IoU with the sample (mean of 22 frames)')
for t in ('before', 'now'):
    print('   %-6s %s' % (t, '  '.join('%s %.2f' % (c, Fr[t][c]) for c in TS.CLASSES)))
print('   class area % (inside the figure box)')
for t in F:
    print('   %-6s %s' % (t, '  '.join('%s %.1f' % (c, Fm[t][c]) for c in TS.CLASSES)))
