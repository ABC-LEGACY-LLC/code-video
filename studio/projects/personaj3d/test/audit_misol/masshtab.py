"""FIGURA MINTAQASI MASSHTABI (8-o'tish) -- qo'shni tasvirlar orasida chap 45 % (x < 144: kapyushon, bosh, soch, plash) ning
affin moslashi (OpenCV ECC, MOTION_AFFINE) -> masshtab s = sqrt(det A). "Kamera zoom" -- kadr mazmunining kattalashishi/
kichrayishi: misolda shot ichida hamma juftlar 0.985..1.008. Ikkala tomon: 320x180 LANCZOS L, median 5 (qor zarralari
kamayadi). Kalibr (--kalibr): misol k05 ni o'zi bilan 1.0000, markazdan 1.02 marta -> 1.0203, 0.98 -> 0.9799.
Ogohlantirish: 3-shotda chap qism deyarli bir tekis kapyushon -- ECC bu yerda beqaror (7-o'tishda 15->16 da 1.44 bergan).
python3 test/audit_misol/masshtab.py [--kalibr] PAPKA...   (PAPKA: %03d.png 0-asosli; 'misol')"""
import sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return ndimage.median_filter(np.asarray(im, dtype=float), 5).astype(np.float32)

def fayl(d, k): return '/home/claude/work/maqsad/k%02d.png' % k if d == 'misol' else '%s/%03d.png' % (d, k - 1)

def ecc(a, b, quti=(0, 0, 144, 180)):
    x0, y0, x1, y1 = quti
    W = np.eye(2, 3, dtype=np.float32)
    try:
        cc, W = cv2.findTransformECC(a[y0:y1, x0:x1], b[y0:y1, x0:x1], W, cv2.MOTION_AFFINE,
                                     (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    except cv2.error:
        return None
    return float(np.sqrt(abs(np.linalg.det(W[:, :2]))))

def juftlar(d):
    out = {}
    for k in range(1, 22):
        if k in (11, 13): continue                   # kesishlar
        out[(k, k + 1)] = ecc(L(fayl(d, k)), L(fayl(d, k + 1)))
    return out

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--kalibr' in args:
        a = L(fayl('misol', 5)); H, Wd = a.shape
        for s in (1.0, 1.02, 0.98):
            M = cv2.getRotationMatrix2D((70, 60), 0, s); b = cv2.warpAffine(a, M, (Wd, H), borderMode=cv2.BORDER_REFLECT)
            print('KALIBR zoom %.2f -> s %.4f' % (s, ecc(a, b)))
        args = [x for x in args if x != '--kalibr']
    for d in args:
        j = juftlar(d)
        print('%-22s ' % d.rstrip('/').split('/')[-1][:22] + ' '.join('%d-%d %.3f' % (i, k, v) if v else '%d-%d -' % (i, k) for (i, k), v in j.items()))
