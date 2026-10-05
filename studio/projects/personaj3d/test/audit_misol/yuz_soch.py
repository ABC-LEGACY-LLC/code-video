"""YUZ USTIDAGI SOCH (9-o'tish, 2b): misolning yuz terisi (L 45..82, median 3, urug'dan bog'langan komponent, yuz qutisida)
ustida bizda nima -- rol renderidan (soch / teri / kapyushon ...): 2-shotda bitta soch shakli yuz oldiga tutam tushirardi
(yorug' massa IoU buni sezmasdi). Ikkala tomonda bir xil o'lcham 320x180. python3 test/audit_misol/yuz_soch.py ROL [ROL2 ...]
| --json ROL"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
QUTI = {12: (118, 45, 172, 118), 13: (118, 45, 172, 118), 5: (90, 35, 140, 100)}
URUG = {12: (150, 95), 13: (150, 95), 5: (115, 70)}
ROL = {'teri': (255, 0, 0), 'boyin': (128, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 128, 0), 'kap': (0, 0, 255), 'kapAstar': (0, 255, 255), 'kapIch': (0, 0, 128), 'plash': (255, 0, 255), 'fon': (0, 0, 0)}
def yuz(k):
    im = Image.open('/home/claude/work/maqsad/k%02d.png' % k).convert('L')
    L = ndimage.median_filter(np.asarray(im, float), 3); x0, y0, x1, y1 = QUTI[k]
    m = np.zeros_like(L, bool); m[y0:y1, x0:x1] = (L[y0:y1, x0:x1] >= 45) & (L[y0:y1, x0:x1] <= 82)
    lab, _ = ndimage.label(m); c = lab[URUG[k][1], URUG[k][0]]
    return ndimage.binary_fill_holes(lab == c) if c else m
def rol(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    nom = list(ROL); RR = np.array([ROL[n] for n in nom], float)
    return np.array(nom)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]
def qoplash(d, ks=(12, 13, 5)):
    """misol yuz terisi ustida bizda: {k: {'soch', 'teri', 'kap'}} -- ulushlar (0..1); fit_soch9b.mjs ham shuni o'qiydi"""
    o = {}
    for k in ks:
        m = yuz(k); r = rol('%s/%03d.png' % (d, k - 1)); n = m.sum()
        o[k] = {'n': int(n), 'soch': float((m & (r == 'soch')).sum() / n), 'sochIch': float((m & (r == 'sochIch')).sum() / n), 'teri': float((m & (r == 'teri')).sum() / n),
                'kap': float((m & np.isin(r, ['kap', 'kapAstar', 'kapIch'])).sum() / n)}
    return o
if __name__ == '__main__':
    if sys.argv[1] == '--json':
        import json; print(json.dumps(qoplash(sys.argv[2])))
    else:
        for d in sys.argv[1:]:
            q = qoplash(d)
            print(d.split('/')[-1], ' | '.join('k%d yuz %d px: soch %.0f%% teri %.0f%% kap %.0f%%' % (k, v['n'], 100 * v['soch'], 100 * v['teri'], 100 * v['kap']) for k, v in q.items()))
