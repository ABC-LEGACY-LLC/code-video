"""TON SINFLARI, MASSA IoU (12-o'tish, 2- va 3-kadr kapyushoni). Misoldan o'lchangan darajalar
(320x180, L; misolning 17-tasvir L jadvali: tashqi sirt 19, astar 43..48, ichi 7..9, yuz ~59,
soch ~100, osmon 2..6):
  tashqi 12..32 (median 5), astar 36..<52 (median 3), ichi 6.5..<12 (median 5),
  yuz 52..70 (median 3), soch > 85 (median 3)
Ikkala tomonda bir xil kod: har sinf niqobi sigma 2 px Gauss bilan yoyilib 0.5 da kesiladi
(massa miqyosi -- zarralar va ingichka chiziqlar emas) va faqat figura qutisida (ROI: osmon
qor zarralariga to'la). Avval test/kap3-fit.py ichida edi (u modul eskirdi -- 12-o'tish).
python3 test/ton_sinf.py --kalibr"""
import sys
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import loyiha, tasvir

W = '/home/claude/work/personaj'
ROI = {'2': (0, 0, 175, 170), '3': (40, 0, 215, 168)}
SIGMA = 2.0
SINF = ('tashqi', 'astar', 'ichi', 'yuz', 'soch')
VAZN = {'tashqi': 1.0, 'astar': 1.0, 'ichi': 1.0, 'yuz': 0.7, 'soch': 0.4}


def sinflar(L):
    m3 = ndimage.median_filter(L, 3); m5 = ndimage.median_filter(L, 5)
    return {'tashqi': (m5 >= 12) & (m5 <= 32), 'astar': (m3 >= 36) & (m3 < 52), 'ichi': (m5 >= 6.5) & (m5 < 12),
            'yuz': (m3 >= 52) & (m3 <= 70), 'soch': m3 > 85}


def massa(m):
    return ndimage.gaussian_filter(m.astype(float), SIGMA) > 0.5


def iou(a, b, q):
    x0, y0, x1, y1 = q
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 1.0


def kadr_guruh(k):
    return '2' if k <= 13 else '3'


class Misol:
    def __init__(self, k, loy=None):
        loy = loy or loyiha.Loyiha(W + '/taqqos.json')
        self.k = k; self.q = ROI[kadr_guruh(k)]
        L = tasvir.ol(loy.fayl('misol', k), loy.olcham)
        self.m = {c: massa(v) for c, v in sinflar(L).items()}

    def baho(self, L, vazn=VAZN):
        s = sinflar(L)
        r = {c: iou(massa(s[c]), self.m[c], self.q) for c in vazn}
        return sum(vazn[c] * (1 - r[c]) for c in vazn) / sum(vazn.values()), r


def kalibr():
    """sintetik: har sinfdan bittadan to'rtburchak. O'zi bilan IoU 1; bitta sinf 6 px surilsa
    faqat o'sha sinf tushadi (kutilgan 40x40 kvadrat uchun (34*40)/(46*40) = 0.74 atrofida);
    ton sinf chegarasidan oshirilsa (astar 45 -> 55) astar yo'qoladi, yuz qo'shiladi."""
    def yasa(dx=0, astar=45.0):
        L = np.full((180, 320), 3.0)
        L[20:140, 40:200] = 19                  # tashqi
        L[40:80, 60 + dx:100 + dx] = astar      # astar
        L[40:80, 120:160] = 8                   # ichi
        L[90:130, 60:100] = 60                  # yuz
        L[90:130, 120:160] = 100                # soch
        return L
    q = (0, 0, 320, 180)
    A = {c: massa(v) for c, v in sinflar(yasa()).items()}
    B = {c: massa(v) for c, v in sinflar(yasa(dx=6)).items()}
    C = {c: massa(v) for c, v in sinflar(yasa(astar=55)).items()}
    o1 = all(abs(iou(A[c], A[c], q) - 1) < 1e-9 for c in SINF)
    ib = {c: iou(A[c], B[c], q) for c in SINF}
    o2 = abs(ib['astar'] - 34 / 46) < 0.04 and all(ib[c] > 0.95 for c in ('ichi', 'yuz', 'soch'))
    ic = {c: iou(A[c], C[c], q) for c in ('astar', 'yuz')}
    o3 = ic['astar'] < 0.05 and ic['yuz'] < 0.7
    print('kalibr ton_sinf  o\'zi bilan IoU 1  %s' % ('PROVEN' if o1 else 'UNPROVEN'))
    print('kalibr ton_sinf  astar +6 px -> IoU %.3f (kutilgan %.3f), boshqalar %s  %s' % (
        ib['astar'], 34 / 46, ' '.join('%s %.2f' % (c, ib[c]) for c in ('tashqi', 'ichi', 'yuz', 'soch')), 'PROVEN' if o2 else 'UNPROVEN'))
    print('kalibr ton_sinf  astar L 45 -> 55: astar IoU %.2f, yuz IoU %.2f (yuz sinfiga o\'tdi)  %s' % (ic['astar'], ic['yuz'], 'PROVEN' if o3 else 'UNPROVEN'))
    return o1 and o2 and o3


if __name__ == '__main__':
    sys.exit(0 if kalibr() else 1)
