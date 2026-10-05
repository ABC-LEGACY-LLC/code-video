"""Score SAM 2 run 4 and run 5 against Alonur's marks (hair points, jaw, chin) and the target bits (8 skin, 1 head)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
import json, base64, numpy as np
from scipy import ndimage
P = (P3D_DIR + '/private/test/parts/human/')
B = json.load(open(P + 'marks_alonur_1.json'))['marks']
Q = json.load(open(P + 'part_target_12.json'))['m']
def bits(i): return np.frombuffer(base64.b64decode(Q[str(i)]), np.uint8).reshape(180, 320)
IDX = {'R03': 2, 'R10': 9, 'R12': 11, 'R13': 12, 'R14': 13, 'R17': 16, 'R20': 19, 'R22': 21}
R4 = np.load(P + 'sam2_masks_B.npz'); R5 = np.load(P3D_DIR + '/private/sam2/output/masks_B.npz')
def inside(m, pts): return np.mean([m[min(179, int(round(y))), min(319, int(round(x)))] for x, y in pts])
def threshold_distance(m, pts):
    """for each point: the distance to the mask boundary, + inside, - outside"""
    din = ndimage.distance_transform_edt(m); dout = ndimage.distance_transform_edt(~m)
    r = []
    for x, y in pts:
        yi, xi = min(179, int(round(y))), min(319, int(round(x)))
        r.append(din[yi, xi] if m[yi, xi] else -dout[yi, xi])
    return np.array(r)
print('%-4s %3s | %-28s | %-28s | %s' % ('tag', 'k', 'FACE: jaw+chin distance (med/min/max), hair point inside %', 'HAIR: hair point inside %, jaw inside %, skin px %', 'hair px'))
for tag, i in IDX.items():
    m = B[tag]; jaw = list(m['jaw']['pts']) + [[m['chin']['x'], m['chin']['y']]]; hair = m['hair']['pts']
    bt = bits(i); skin = (bt & 8) > 0; head = (bt & 1) > 0
    row = ['%-4s %3d' % (tag, i + 1)]
    for nm, R in (('y4', R4), ('y5', R5)):
        f = R['face'][i]; h = R['hair'][i]
        d = threshold_distance(f, jaw)
        row.append('%s face: jaw %+5.1f/%+5.1f/%+5.1f hairN %3.0f%% | hair: hairN %3.0f%% jawN %3.0f%% skin %4.1f%% px %4d' % (
            nm, np.median(d), d.min(), d.max(), 100 * inside(f, hair), 100 * inside(h, hair), 100 * inside(h, jaw), 100 * (h & skin).sum() / max(1, h.sum()), h.sum()))
    print('\n   '.join(row))
