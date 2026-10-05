"""HARAKAT va QAYNASH -- juftma-juft blok siljishi.

Soha ichida har 12x12 blok (2x kattalashtirib, 0.5 px qadam, +-3 px) uchun keyingi
tasvirdagi eng yaxshi siljish topiladi.
  harakat = bloklar siljishining MEDIANASI (hammasi birga suriladi) -- vektor
  qaynash = medianadan chetlanishning mediana kattaligi (har blok o'zicha)
Tuzilishsiz (gradient past) bloklar tashlanadi: yassi plashda moslash shovqin.

Muhim topilma (1-kadr): misolda 1..6-tasvirlar USHLANGAN rasm -- harakat har juftda
0.00 px. Ushlangan va harakatli qismni ALOHIDA o'lchang; butun kadr medianasi
ularni aralashtirib, ikkalasini ham yashiradi.

OGOHLANTIRISH (10-o'tish): median OZCHILIKdagi harakatni ko'rmaydi. O'sha
ushlangan 1..6 da misolning SOCH tutamlari har tasvirda qimirlaydi (farq
xaritasida chap 40% energiyasi 0.07..0.10, bizda 0.01..0.02), median esa 0.00
deydi. Median 0 -- "qattiq qismlar ushlangan" degani, "hech narsa qimirlamaydi"
emas: farq.xarita bilan tekshiring."""
import numpy as np
from scipy import ndimage
from . import tasvir


def siljishlar(a, b, niqob, S=12, Q=6, chek=4.0):
    A = ndimage.zoom(a, 2, order=3)
    B = ndimage.zoom(b, 2, order=3)
    M = ndimage.zoom(niqob.astype(float), 2, order=0) > 0.5
    G = np.hypot(ndimage.sobel(A, 0), ndimage.sobel(A, 1))
    out = []
    for y in range(Q, A.shape[0] - 2 * S - Q, 2 * S):
        for x in range(Q, A.shape[1] - 2 * S - Q, 2 * S):
            if M[y:y + 2 * S, x:x + 2 * S].mean() < 0.9:
                continue
            blk = A[y:y + 2 * S, x:x + 2 * S]
            if G[y:y + 2 * S, x:x + 2 * S].mean() < chek * 8:
                continue
            best = (1e9, 0, 0)
            for dy in range(-Q, Q + 1):
                for dx in range(-Q, Q + 1):
                    e = np.abs(B[y + dy:y + dy + 2 * S, x + dx:x + dx + 2 * S] - blk).mean()
                    if e < best[0]:
                        best = (e, dx, dy)
            out.append((best[1] / 2, best[2] / 2))
    return np.array(out)


def juft(a, b, niqob):
    s = siljishlar(a, b, niqob)
    if len(s) < 3:
        return None
    med = np.median(s, 0)
    return {'dx': float(med[0]), 'dy': float(med[1]), 'harakat': float(np.hypot(*med)),
            'qaynash': float(np.median(np.hypot(*(s - med).T))), 'bloklar': int(len(s))}


def quti_niqob(olcham, qutilar):
    W, H = olcham
    m = np.zeros((H, W), bool)
    for q in qutilar:
        x0, y0, x1, y1 = [int(v) for v in q]
        m[max(0, y0):y1, max(0, x0):x1] = True
    return m


def ketma_ket(loy, tomon, kadrlar, niqob):
    F = [tasvir.ol(loy.fayl(tomon, k), loy.olcham) for k in kadrlar]
    return [juft(F[i], F[i + 1], niqob) for i in range(len(F) - 1)]


def jadval(loy, kadrlar, niqob, tomonlar=('misol', 'biz')):
    R = {t: ketma_ket(loy, t, kadrlar, niqob) for t in tomonlar}
    q = ['juft     ' + ''.join('%-30s' % t.upper() for t in tomonlar)]
    for i in range(len(kadrlar) - 1):
        s = '%2d-%-4d  ' % (kadrlar[i], kadrlar[i + 1])
        for t in tomonlar:
            r = R[t][i]
            s += '%-30s' % ('(%+.1f,%+.1f) h%.2f q%.2f n%d' % (r['dx'], r['dy'], r['harakat'], r['qaynash'], r['bloklar']) if r else '--')
        q.append(s)
    # vektor farqi (bosh sohasi bir xil harakat qiladimi?)
    if len(tomonlar) == 2:
        fs = []
        for a, b in zip(R[tomonlar[0]], R[tomonlar[1]]):
            if a and b:
                fs.append(np.hypot(a['dx'] - b['dx'], a['dy'] - b['dy']))
        if fs:
            q.append('harakat vektori farqi: o\'rtacha %.2f px/juft' % np.mean(fs))
    return '\n'.join(q), R
