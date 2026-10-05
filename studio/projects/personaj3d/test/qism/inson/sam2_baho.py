"""SAM 2 yurish-4 va yurish-5 ni Alonur belgilariga (soch nuqtalari, jag', iyak) va nishon bitlariga (8 teri, 1 bosh) qarshi baholash."""
import json, base64, numpy as np
from scipy import ndimage
P = '/home/claude/work/personaj3d/test/qism/inson/'
B = json.load(open(P + 'belgilar_alonur_1.json'))['marks']
Q = json.load(open(P + 'qism_nishon_12.json'))['m']
def bits(i): return np.frombuffer(base64.b64decode(Q[str(i)]), np.uint8).reshape(180, 320)
IDX = {'R03': 2, 'R10': 9, 'R12': 11, 'R13': 12, 'R14': 13, 'R17': 16, 'R20': 19, 'R22': 21}
R4 = np.load(P + 'sam2_masks_B.npz'); R5 = np.load('/mnt/user-data/uploads/Code-Video/Projects/personaj3d-sam2/output/masks_B.npz')
def ichida(m, pts): return np.mean([m[min(179, int(round(y))), min(319, int(round(x)))] for x, y in pts])
def chegara_masofa(m, pts):
    """har nuqta uchun: niqob chegarasigacha masofa, + ichida, - tashqarida"""
    din = ndimage.distance_transform_edt(m); dout = ndimage.distance_transform_edt(~m)
    r = []
    for x, y in pts:
        yi, xi = min(179, int(round(y))), min(319, int(round(x)))
        r.append(din[yi, xi] if m[yi, xi] else -dout[yi, xi])
    return np.array(r)
print('%-4s %3s | %-28s | %-28s | %s' % ('teg', 'k', 'YUZ: jag+iyak masofa (med/min/max), soch nuqta ichida %', 'SOCH: soch nuqta ichida %, jag ichida %, teri px %', 'soch px'))
for teg, i in IDX.items():
    m = B[teg]; jag = list(m['jag']['pts']) + [[m['iyak']['x'], m['iyak']['y']]]; soch = m['soch']['pts']
    bt = bits(i); teri = (bt & 8) > 0; bosh = (bt & 1) > 0
    row = ['%-4s %3d' % (teg, i + 1)]
    for nm, R in (('y4', R4), ('y5', R5)):
        f = R['face'][i]; h = R['hair'][i]
        d = chegara_masofa(f, jag)
        row.append('%s yuz: jag %+5.1f/%+5.1f/%+5.1f sochN %3.0f%% | soch: sochN %3.0f%% jagN %3.0f%% teri %4.1f%% px %4d' % (
            nm, np.median(d), d.min(), d.max(), 100 * ichida(f, soch), 100 * ichida(h, soch), 100 * ichida(h, jag), 100 * (h & teri).sum() / max(1, h.sum()), h.sum()))
    print('\n   '.join(row))
