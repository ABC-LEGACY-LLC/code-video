"""SOCH YORUG' MASSASI IoU (9-o'tish, 2b): misol va bizning yorug' massa niqoblari (personaj/test/kompozitsiya.niqob:
L>=90, top-hat bilan yulduz/qor chiqarilgan, 2x2 ochish) -- IKKALA TOMONDA BIR XIL KOD, 320x180 LANCZOS -- bosh qutisi
ichida har kadrda: IoU, misol massasi, biz massasi, mos. Qutilar: 1-shot (30, 0, 190, 130), 2-shot (80, 0, 230, 140),
3-shot (120, 20, 260, 170). Bitta dam shakli sochni moslashda (test/fit_soch9.mjs) ikki yo'nalishni ham ko'radi:
yetishmagan massa (misolda bor, bizda yo'q) va ortiqcha massa (2-shotda yuz oldiga tushgan tutam).
python3 test/audit_misol/soch_iou.py PAPKA [kadrlar: 1-13]   (PAPKA: %03d.png 0-asosli)"""
import sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/work/personaj/test')
from kompozitsiya import niqob

QUTI = lambda k: (30, 0, 190, 130) if k <= 11 else (80, 0, 230, 140) if k <= 13 else (120, 20, 260, 170)

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

_M = {}
def misol(k):
    if k not in _M: _M[k] = niqob(L320('/home/claude/work/maqsad/k%02d.png' % k))
    return _M[k]

def olch(papka, ks):
    out = {}
    for k in ks:
        x0, y0, x1, y1 = QUTI(k)
        a = misol(k)[y0:y1, x0:x1]; b = niqob(L320('%s/%03d.png' % (papka, k - 1)))[y0:y1, x0:x1]
        out[k] = {'iou': float((a & b).sum() / max(1, (a | b).sum())), 'misol': int(a.sum()), 'biz': int(b.sum()), 'mos': int((a & b).sum())}
    return out

if __name__ == '__main__':
    k0, k1 = map(int, (sys.argv[2] if len(sys.argv) > 2 else '1-13').split('-'))
    print(json.dumps(olch(sys.argv[1], range(k0, k1 + 1))))
