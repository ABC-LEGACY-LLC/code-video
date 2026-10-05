"""OSMON (FON) PROFILI (9-o'tish, 2e) -- ikkala tomonda bir xil kod: 320x180 LANCZOS, L, median 9 (qor zarralari
chiqadi), fon qutisida (personajdan o'ngda: 1-shot x >= 170, 2-shot x >= 200, 3-shot x >= 245 -- qor_zoom.py dagi qutilar)
har 20 qatorlik tasmada median L. Misolda fon uch shotda BIR XIL (2D fon plitasi); dunyo osmoni kamera tepaga
qaraganda qorayadi -- qancha, shu yerda o'lchanadi.
python3 test/audit_misol/osmon_olch.py PAPKA [PAPKA2 ...]   ('misol' -- maqsad)"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

QUTI_X = {'1': 170, '2': 200, '3': 245}
KADR = {'1': [2, 5, 9], '2': [12, 13], '3': [16, 19, 22]}

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 9)

def fayl(d, k): return '/home/claude/work/maqsad/k%02d.png' % k if d == 'misol' else '%s/%03d.png' % (d, k - 1)

def profil(d):
    out = {}
    for s, ks in KADR.items():
        P = np.mean([[np.median(L(fayl(d, k))[y:y + 20, QUTI_X[s]:]) for y in range(0, 180, 20)] for k in ks], 0)
        out[s] = [round(float(v), 1) for v in P]
    return out

if __name__ == '__main__':
    for d in sys.argv[1:]:
        o = profil(d)
        print('== %s' % d.rstrip('/').split('/')[-1])
        for s, v in o.items(): print('  %s-shot fon L (tepadan pastga, 20 qator): %s' % (s, ' '.join('%5.1f' % t for t in v)))
