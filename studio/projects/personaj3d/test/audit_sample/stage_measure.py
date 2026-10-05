"""STAGE MEASUREMENT (pass 5) -- THE SAME CODE on the sample and on ours (320x180 LANCZOS, L, median 3):
  shot 2 (k12 / 011): the face's FRONT CONTOUR -- on each row (y 70..110, step 2 px), walking right from the seed inside the
     face, the last pixel with L>=45 (then 2 pixels L<38): in the sample skin 59 -> dark line 20..30; in ours skin/rim -> sky;
  shot 3 (k20..22 / 019..021): the right edge of the lit skin of the lower face (y 144..156; skin 57..60, the shadow right of
     it 37..45 -- threshold L>=50, then 2 pixels L<44) and the eyelid line (the centre of the darkest 5x2 window in the box
     y 106..118; with the box top at 100 it found the inside of the hood (L 7) in the sample).
python3 test/audit_sample/stage_measure.py [ours_folder]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, float), 3)

def contour(m, y, x0, x1=200, high=45, low=38):
    x = x0
    end = None
    while x < x1 - 2:
        if m[y, x] >= high: end = x
        if end is not None and m[y, x + 1] < low and m[y, x + 2] < low: break
        x += 1
    return end

def eye(m, box):
    x0, y0, x1, y1 = box
    best = None
    for y in range(y0, y1 - 1):
        for x in range(x0, x1 - 4):
            v = m[y:y + 2, x:x + 5].mean()
            if best is None or v < best[0]: best = (v, x + 2.0, y + 0.5)
    return [round(best[1], 1), round(best[2], 1), round(best[0], 1)]

ours = sys.argv[1] if len(sys.argv) > 1 else 'frames-clean-5'
out = {}
for name, k in (('sample', None), ('ours', ours)):
    f = (lambda n: (SAMPLE_DIR + '/k%02d.png') % n) if k is None else (lambda n, d=k: '%s/%03d.png' % (d, n - 1))
    m2 = L320(f(12))
    q2 = {y: contour(m2, y, 145) for y in range(70, 112, 2)}
    s3 = {}
    for n in (20, 21, 22):
        m3 = L320(f(n))
        s3[n] = {'contour': {y: contour(m3, y, 150, high=50, low=44) for y in range(144, 158, 2)}, 'eye': eye(m3, (142, 106, 172, 118))}
    out[name] = {'2shot_contour': q2, '3shot': s3}
print('shot 2 front contour (y: sample / ours / diff):')
for y in range(70, 112, 2):
    a, b = out['sample']['2shot_contour'][y], out['ours']['2shot_contour'][y]
    print('  %3d  %s  %s  %s' % (y, a, b, (b - a) if a is not None and b is not None else '-'))
for n in (20, 21, 22):
    a, b = out['sample']['3shot'][n], out['ours']['3shot'][n]
    print('shot 3 k%d eye sample %s ours %s |contour y144..156 sample %s ours %s' % (n, a['eye'], b['eye'], list(a['contour'].values()), list(b['contour'].values())))
json.dump(out, open('private/test/audit_sample/stage_measure_%s.json' % ours.replace('/', '_'), 'w'), indent=1)
