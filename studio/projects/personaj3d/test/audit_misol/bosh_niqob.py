"""KO'RINADIGAN BOSH NIQOBI (7-o'tish, kapyushon) -- yuz + soch, misol va bizda BIR XIL kod (320x180 LANCZOS):
median 5 dan keyin L >= 40 (misolda yuz 58-60, soya soch 45+, kapyushon 19-21, astar 43-48, osmon med3 da 4-18);
r=3 disk bilan ochish (qor maydoniga ingichka ko'priklarni uzadi), yuz urug'iga ulangan komponent, 4 qadam geodezik
tiklash (chetlar L>=40 ichida), teshiklar to'ldirilgan. 3-shotda iyak ostidagi zich qor maydoni yuzga keng tegadi --
ruxsat qutisi: x <= 218, y <= 162 va (x > 185, y > 135) emas (misol konturi y 144..156 da x 151..165; yorug' soch
x <= 216) -- varaqda tekshirilgan. Kapyushon moslashi: misolning shu niqobi <-> bizning rol niqobi (teri+soch+qopqoq+
bo'yin, ko'rinadigan); baho -- ikkala anime renderida shu kod.
python3 test/audit_misol/bosh_niqob.py [biz_papka]  -- har tasvir maydoni va IoU"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
URUG = {**{k: (112, 70) for k in range(1, 12)}, 12: (150, 95), 13: (150, 95), **{k: (160, 130) for k in range(14, 23)}}
_yy, _xx = np.mgrid[0:180, 0:320]
RUXSAT3 = (_xx <= 218) & (_yy <= 162) & ~((_xx > 185) & (_yy > 135))
DISK3 = np.hypot(*np.mgrid[-3:4, -3:4]) <= 3
def L320(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)
def niqob(L, k, thr=40):
    m = ndimage.median_filter(L, 5) >= thr
    if k >= 14: m &= RUXSAT3
    mo = ndimage.binary_opening(m, DISK3)
    lab, n = ndimage.label(mo); x, y = URUG[k]; c = lab[y, x]
    if c == 0:
        w = lab[y - 6:y + 7, x - 6:x + 7]; ids, cnt = np.unique(w[w > 0], return_counts=True); c = ids[np.argmax(cnt)] if len(ids) else 0
    if not c: return np.zeros_like(m)
    s = lab == c
    for _ in range(4): s = ndimage.binary_dilation(s) & m
    return ndimage.binary_fill_holes(s)
def misol(k): return niqob(L320('/home/claude/work/maqsad/k%02d.png' % k), k)
def iou(a, b): return (a & b).sum() / max(1, (a | b).sum())
if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else None
    for k in range(1, 23):
        a = misol(k); s = 'k%02d misol %5d' % (k, a.sum())
        if d:
            b = niqob(L320('%s/%03d.png' % (d, k - 1)), k); s += '  biz %5d  IoU %.3f' % (b.sum(), iou(a, b))
        print(s)
