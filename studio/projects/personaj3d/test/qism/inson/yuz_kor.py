"""KO'RINADIGAN YUZ NIQOBI (11-o'tish, 2-ish, MAXFIY -- misoldan olingan): moslash uchun har kadr bitlari (320x180, uint8, base64):
  1 -- misolning ko'rinadigan terisi F (qism_olch.yuz_niqob: teri + rim, soch chiqarilgan, teshiklar to'ldirilgan);
  2 -- yuz qutisi ichida F ham, soch ham emas (kapyushon ichi, soya, fon) -- bizning teri bu yerda ko'rinmasligi kerak.
Nima uchun: 2-ish birinchi moslashida (poza11) 3-shot kapyushon kaliti misol yuzining 30% ini yopdi (oldin 6%) -- maqsadda
(yuz nuqtalari, bosh IoU, figura) kapyushon cheti yuz ustidan o'tishini hech narsa ko'rmasdi. Qatlam o'lchovi: test/qism/qatlam.py.
python3 test/qism/inson/yuz_kor.py  ->  test/qism/inson/yuz_kor_11.json"""
import sys, os, json, base64
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q
out = {}
for k in range(1, 23):
    L = Q.L320('/home/claude/work/maqsad/k%02d.png' % k); g, p = Q.params(k); F = Q.yuz_niqob(L, p)
    if F is None: continue
    x0, y0, x1, y1 = p['quti']; box = np.zeros_like(F); box[y0:y1, x0:x1] = True
    soch = ndimage.binary_opening(L >= 85, structure=np.ones((3, 3)))
    m = F.astype(np.uint8) | ((box & ~F & ~soch).astype(np.uint8) << 1)
    out[k - 1] = base64.b64encode(m.astype(np.uint8).tobytes()).decode()
json.dump({'izoh': 'MAXFIY: misoldan. bit1 = misol ko\'rinadigan terisi, bit2 = quti ichida teri ham soch ham emas', 'm': out},
          open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'yuz_kor_11.json'), 'w'))
print(len(out), 'kadr')
