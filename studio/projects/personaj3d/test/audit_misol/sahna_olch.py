"""SAHNA O'LCHOVI (5-o'tish) -- misol va bizda BIR XIL KOD (320x180 LANCZOS, L, median 3):
  2-shot (k12 / 011): yuz OLD KONTURI -- har qatorda (y 70..110, 2 px) yuz ichidagi urug'dan o'ngga yurib, oxirgi L>=45
     piksel (keyin 2 piksel L<38): misolda teri 59 -> qorong'i chiziq 20..30; bizda teri/rim -> osmon;
  3-shot (k20..22 / 019..021): pastki yuz yorug' terisi o'ng cheti (y 144..156; teri 57..60, o'ngidagi soya 37..45 --
     chegara L>=50, keyin 2 piksel L<44) va ko'z qovog'i chizig'i (y 106..118 qutisidagi eng qorong'i 5x2 oyna markazi;
     quti tepasi 100 bo'lganda misolda kapyushon ichi (L 7) topilardi).
python3 test/audit_misol/sahna_olch.py [biz_papka]"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 3)

def kontur(m, y, x0, x1=200, yuq=45, past=38):
    x = x0
    oxir = None
    while x < x1 - 2:
        if m[y, x] >= yuq: oxir = x
        if oxir is not None and m[y, x + 1] < past and m[y, x + 2] < past: break
        x += 1
    return oxir

def koz(m, quti):
    x0, y0, x1, y1 = quti
    best = None
    for y in range(y0, y1 - 1):
        for x in range(x0, x1 - 4):
            v = m[y:y + 2, x:x + 5].mean()
            if best is None or v < best[0]: best = (v, x + 2.0, y + 0.5)
    return [round(best[1], 1), round(best[2], 1), round(best[0], 1)]

biz = sys.argv[1] if len(sys.argv) > 1 else 'kadrlar-toza-5'
out = {}
for nom, k in (('misol', None), ('biz', biz)):
    f = (lambda n: '/home/claude/work/maqsad/k%02d.png' % n) if k is None else (lambda n, d=k: '%s/%03d.png' % (d, n - 1))
    m2 = L320(f(12))
    q2 = {y: kontur(m2, y, 145) for y in range(70, 112, 2)}
    s3 = {}
    for n in (20, 21, 22):
        m3 = L320(f(n))
        s3[n] = {'kontur': {y: kontur(m3, y, 150, yuq=50, past=44) for y in range(144, 158, 2)}, 'koz': koz(m3, (142, 106, 172, 118))}
    out[nom] = {'2shot_kontur': q2, '3shot': s3}
print('2-shot old kontur (y: misol / biz / farq):')
for y in range(70, 112, 2):
    a, b = out['misol']['2shot_kontur'][y], out['biz']['2shot_kontur'][y]
    print('  %3d  %s  %s  %s' % (y, a, b, (b - a) if a is not None and b is not None else '-'))
for n in (20, 21, 22):
    a, b = out['misol']['3shot'][n], out['biz']['3shot'][n]
    print('3-shot k%d ko\'z misol %s biz %s | kontur y144..156 misol %s biz %s' % (n, a['koz'], b['koz'], list(a['kontur'].values()), list(b['kontur'].values())))
json.dump(out, open('test/audit_misol/sahna_olch_%s.json' % biz.replace('/', '_'), 'w'), indent=1)
