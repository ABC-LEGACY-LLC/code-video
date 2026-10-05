"""QATLAMLAR (10-o'tish): foydalanuvchi -- "o'z modelimizda soch va kapyushonni olib turib birma-bir o'lcha, keyin qo'yib
o'lcha". Misolning KO'RINADIGAN YUZI (test/qism/qism_olch.py yuz_niqob: teri + rim, soch chiqarilgan, teshiklar to'ldirilgan)
ustida bizda nima bor -- uch qatlamda: yalang'och (faqat bosh), + soch, + kapyushon va plash (to'liq). Har kadr, rol renderi
(320x180 NEAREST): misol yuzining necha foizi bizda teri / soch / kapyushon / boshqa; va bizning ko'rinadigan terimizning
misol yuzidan tashqaridagi qismi (ortiqcha, misol yuzi maydoniga nisbatan). python3 test/qism/qatlam.py TEG"""
import sys, json
import numpy as np
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q
R = '/home/claude/work/personaj3d'
TEG = sys.argv[1] if len(sys.argv) > 1 else 'dunyo9b'
QAT = [("yalang'och", 'kadrlar-qism/rol-yalang-%s'), ('+ soch', 'kadrlar-qism/rol-soch-%s'), ('+ kapyushon (to\'liq)', 'kadrlar-misol/rol-%s')]
def shot(k): return 1 if k <= 11 else 2 if k <= 13 else 3
out = {}
for k in range(1, 23):
    L = Q.L320('/home/claude/work/maqsad/k%02d.png' % k); g, p = Q.params(k); F = Q.yuz_niqob(L, p)
    x0, y0, x1, y1 = p['quti']; B = np.zeros_like(F); B[y0:y1, x0:x1] = True
    n = F.sum(); o = {'yuz_px': int(n)}
    for nm, pap in QAT:
        r = Q.rol_niqob('%s/%s/%03d.png' % (R, pap % TEG, k - 1))
        teri = (r == 'teri') & B
        o[nm] = {'teri': float((F & (r == 'teri')).sum() / n), 'soch': float((F & np.isin(r, ['soch', 'sochIch'])).sum() / n),
                 'kap': float((F & np.isin(r, ['kap', 'kapAstar', 'kapIch', 'plash', 'plashIch'])).sum() / n),
                 'ortiqcha': float((teri & ~F).sum() / n)}
    out[k] = o
json.dump(out, open('%s/test/qism/qatlam_%s.json' % (R, TEG), 'w'))
for s in (1, 2, 3):
    ks = [k for k in out if shot(k) == s]
    print('== %d-shot: misol yuzi o\'rtacha %d px' % (s, np.mean([out[k]['yuz_px'] for k in ks])))
    for nm, _ in QAT:
        v = {c: np.mean([out[k][nm][c] for k in ks]) for c in ('teri', 'soch', 'kap', 'ortiqcha')}
        print('   %-22s misol yuzida bizda: teri %4.0f%%  soch %4.0f%%  kapyushon/plash %4.0f%% | bizning teri misol yuzidan tashqarida %4.0f%%' % (nm, 100 * v['teri'], 100 * v['soch'], 100 * v['kap'], 100 * v['ortiqcha']))
