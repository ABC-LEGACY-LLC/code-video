"""SOCH QOPLASHI (10-o'tish, soch moslash uchun): misolning ko'rinadigan yuzi (test/qism/qism_olch.py yuz_niqob -- teri + rim,
soch chiqarilgan) ustida bizning rol renderimizda soch ulushi (soch + ichki soch), berilgan kadrlarda. test/qism/qatlam.py
bilan bir xil ta'rif. python3 test/qism/qoplash.py ROL_PAPKA 1,5,9,10,12,13,16,20   (papka: %03d.png 0-asosli)"""
import sys, json
import numpy as np
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q
_F = {}
def F(k):
    if k not in _F: g, p = Q.params(k); _F[k] = Q.yuz_niqob(Q.L320('/home/claude/work/maqsad/k%02d.png' % k), p)
    return _F[k]
def qoplash(papka, ks):
    out = {}
    for k in ks:
        r = Q.rol_niqob('%s/%03d.png' % (papka, k - 1)); f = F(k)
        out[k] = float((f & np.isin(r, ['soch', 'sochIch'])).sum() / f.sum())
    return out
if __name__ == '__main__':
    print(json.dumps(qoplash(sys.argv[1], [int(v) for v in sys.argv[2].split(',')])))
