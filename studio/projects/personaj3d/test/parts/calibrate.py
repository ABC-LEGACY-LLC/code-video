"""PART TOOL CALIBRATION (pass 10): in our render the EXACT position of every part is known (from 3D, test/parts/points.mjs) --
does the very code that is applied to the sample (test/parts/part_measure.py) find that part in our render? Per part: in how many
frames it is visible (in the role render the point's pixel is skin and the surface faces the camera), in how many it was found,
found - exact difference (mean dx, dy and the largest |diff|). A constant offset (e.g. the dark blob's centre sits high because of
the lash line) is the same on both sides -- it cancels in the comparison; a large, varying difference -- the tool found something
else (to be fixed).
python3 test/parts/calibrate.py TAG   (test/parts/ours_TAG.json, frames-sample/anime-TAG, frames-sample/role-TAG)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q

R = (P3D_DIR)
TAG = sys.argv[1] if len(sys.argv) > 1 else 'world9b'
EXACT = json.load(open('%s/test/parts/ours_%s.json' % (R, TAG)))
MATCH = {'eye_near': 'eye_near', 'eye_far': 'eye_far', 'brow_near': 'brow_near_mid', 'brow_far': 'brow_far_mid',
       'mouth': 'mouth', 'lip': 'lip_shadow', 'nose_tip': 'nose_tip', 'chin_tip': 'chin_tip'}
ROLE = {'skin': (255, 0, 0), 'neck': (128, 0, 0), 'hair': (0, 255, 0), 'hairInner': (0, 128, 0), 'hood': (0, 0, 255), 'hoodLining': (0, 255, 255),
       'hoodInner': (0, 0, 128), 'cloak': (255, 0, 255), 'cloakInner': (128, 0, 128), 'background': (0, 0, 0)}
def role(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    name = list(ROLE); RR = np.array([ROLE[n] for n in name], float)
    return np.array(name)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]

def main():
    det = Q.folder_measure('%s/frames-sample/anime-%s' % (R, TAG))
    result = {}
    for q, qa in MATCH.items():
        line = []
        for k in range(1, 23):
            a = EXACT[str(k - 1)].get(qa)
            if a is None: continue
            rr = role('%s/frames-sample/role-%s/%03d.png' % (R, TAG, k - 1))
            x, y = int(round(a[0])), int(round(a[1]))
            around = rr[max(0, y - 1):y + 2, max(0, x - 1):x + 2]
            if q in ('nose_tip', 'chin_tip'):        # silhouette points: skin around them and no hair/hood
                visible = bool((around == 'skin').sum() >= 1 and not np.isin(around, ['hair', 'hairInner', 'hood', 'hoodLining', 'hoodInner', 'cloak']).any())
            else:
                visible = bool((around == 'skin').sum() >= 5 and a[3])
            d = det[k].get(q)
            dd = None if d is None else ([d['x'], d['y']] if isinstance(d, dict) else d)
            line.append((k, visible, dd, a[:2]))
        view = [s for s in line if s[1]]; top = [s for s in view if s[2] is not None]
        err = np.array([[s[2][0] - s[3][0], s[2][1] - s[3][1]] for s in top]) if top else np.zeros((0, 2))
        falsePos = [s for s in line if not s[1] and s[2] is not None]          # not visible, but the tool found something
        result[q] = {'visible': len(view), 'found': len(top), 'dx': round(float(err[:, 0].mean()), 2) if len(err) else None,
                     'dy': round(float(err[:, 1].mean()), 2) if len(err) else None, 'max': round(float(np.abs(err).max()), 2) if len(err) else None,
                     'frame': {s[0]: [s[1], s[2], [round(s[3][0], 2), round(s[3][1], 2)]] for s in line}, 'false_frame': [s[0] for s in falsePos]}
        print('%-11s visible %2d, found %2d | mean diff (%s, %s) | largest |diff| %s | found in frames where not visible: %s' % (
            q, len(view), len(top), result[q]['dx'], result[q]['dy'], result[q]['max'], falsePos and [s[0] for s in falsePos]))
        for s in top:
            e = (s[2][0] - s[3][0], s[2][1] - s[3][1])
            if max(abs(e[0]), abs(e[1])) > 3: print('     k%02d found %s exact %s diff (%.1f, %.1f)' % (s[0], s[2], [round(v, 1) for v in s[3]], *e))
    json.dump(result, open('%s/test/parts/calibrate_%s.json' % (R, TAG), 'w'))

main()
