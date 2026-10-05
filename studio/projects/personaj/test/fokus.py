"""FOKUS (12-o'tish): chet kengligi -- qaysi qism fokusda, qaysi biri emas. Chegara
median 7x7 da ikki darajaning o'rtasidan (skimage find_contours) olinadi; har 2 px da
normal bo'yicha asl L profili (bilinear, -8..+8 px, 0.25 qadam); profillar MEDIANASI
(qor zarralari yo'qoladi) erf ga moslanadi: L = a + b*erf(s/(sigma*sqrt2)). sigma --
chet yoyilishi (320 da, px). Kalibr: keskin pog'ona sigma ~0.5 (LANCZOS o'lchami),
Gauss 2 px bilan yoyilgan pog'ona sigma ~2.1.
python3 test/fokus.py"""
import sys, json
import numpy as np
from scipy import ndimage, optimize, special
from skimage import measure
from PIL import Image
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import tasvir

M = '/home/claude/work/maqsad/k%02d.png'


def chet(L, quti, a_quti, b_quti, qadam=2, R=8):
    x0, y0, x1, y1 = quti
    Lm = ndimage.median_filter(L, 7)
    la = float(np.median(Lm[a_quti[1]:a_quti[3], a_quti[0]:a_quti[2]]))
    lb = float(np.median(Lm[b_quti[1]:b_quti[3], b_quti[0]:b_quti[2]]))
    cs = measure.find_contours(Lm[y0:y1, x0:x1], (la + lb) / 2)
    if not cs:
        return None
    c = max(cs, key=len)
    G = ndimage.gaussian_filter(L, 2.0); gy, gx = np.gradient(G)
    s = np.arange(-R, R + 1e-6, 0.25); P = []
    for r, q in c[::qadam * 2]:
        y, x = r + y0, q + x0
        nx, ny = ndimage.map_coordinates(gx, [[y], [x]], order=1)[0], ndimage.map_coordinates(gy, [[y], [x]], order=1)[0]
        n = np.hypot(nx, ny)
        if n < 1e-6:
            continue
        nx, ny = nx / n, ny / n
        P.append(ndimage.map_coordinates(L, [y + s * ny, x + s * nx], order=1, mode='nearest'))
    if len(P) < 5:
        return None
    p = np.median(np.array(P), 0)
    f = lambda t, a, b, sg, t0: a + b * special.erf((t - t0) / (abs(sg) * np.sqrt(2)))
    try:
        (a, b, sg, t0), _ = optimize.curve_fit(f, s, p, p0=[p.mean(), (p[-1] - p[0]) / 2, 1.0, 0.0], maxfev=20000)
    except Exception:
        return None
    return abs(sg), 2 * abs(b), len(P), la, lb


def kalibr():
    L = np.zeros((60, 60)) + 10.0; L[:, 30:] = 40.0
    im = Image.fromarray(np.uint8(L)).resize((180, 180), Image.NEAREST).resize((60, 60), Image.LANCZOS)
    A = np.asarray(im).astype(float)
    B = ndimage.gaussian_filter(L, 2.0)
    ra = chet(A, (5, 5, 55, 55), (5, 5, 20, 55), (40, 5, 55, 55)); rb = chet(B, (5, 5, 55, 55), (5, 5, 20, 55), (40, 5, 55, 55))
    print('kalibr: keskin pog\'ona sigma %.2f, Gauss 2 px pog\'ona sigma %.2f' % (ra[0], rb[0]))
    return ra[0] < 1.0 and 1.7 < rb[0] < 2.5


# (kadr, nom, chegara qutisi, A daraja qutisi, B daraja qutisi) -- 320 da; qutilar setka
# varaqlaridan (k01, k12, k17) o'qilgan
CHETLAR = [
    (17, "kapyushon orqa-tepa cheti / osmon", (25, 0, 110, 100), (80, 10, 110, 40), (0, 0, 22, 30)),
    (17, "soch tolasi / kapyushon astari", (150, 70, 205, 100), (165, 88, 200, 98), (160, 64, 195, 72)),
    (17, "astar tasmasi / old qirra (tepa)", (145, 45, 210, 78), (160, 64, 195, 72), (150, 48, 185, 56)),
    (12, "kapyushon orqa-chap cheti / osmon", (0, 0, 60, 60), (30, 20, 60, 50), (0, 0, 8, 20)),
    (12, "yuz old cheti / qor", (140, 90, 185, 140), (125, 100, 140, 120), (170, 95, 185, 110)),
    (12, "soch / kapyushon (tepa-chap)", (110, 0, 150, 60), (140, 10, 150, 30), (112, 20, 122, 40)),
    (1, "soch / osmon (tepa-o'ng)", (120, 0, 165, 60), (125, 15, 135, 30), (150, 0, 165, 12)),
    (1, "yuz / plash (jag' osti)", (85, 100, 135, 125), (95, 90, 120, 100), (95, 115, 115, 125)),
    (1, "plash burmasi (chap-past)", (0, 115, 70, 170), (10, 125, 25, 135), (30, 150, 45, 160)),
]

if __name__ == '__main__':
    assert kalibr()
    for k, nom, q, a, b in CHETLAR:
        L = tasvir.ol(M % k, (320, 180))
        r = chet(L, q, a, b)
        if r is None:
            print('  %2d  %-40s  --' % (k, nom)); continue
        sg, kon, n, la, lb = r
        print('  %2d  %-40s sigma %.2f px  (10-90%% %.1f px)  kontrast %.0f  (%d profil; darajalar %.0f / %.0f)' % (k, nom, sg, 2.563 * sg, kon, n, la, lb))
