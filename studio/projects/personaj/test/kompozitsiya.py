"""KOMPOZITSIYA -- mutlaq o'lchov (nisbat emas: kesish nisbati bazaga bog'liq
bo'lib, kichik turtkini ham kesish deb o'tkazib yuborgan edi).
Yorug' personaj niqobi = L>=90 va zarra emas (top-hat). Pastdagi tuman L<=57,
shuning uchun kirmaydi. Har tasvirda: markaz (x,y kadr ulushida), maydon %.
Kesish kuchi = 1-kadr oxiri va 3-kadr boshi niqoblarining IoU si (1 = bir xil joy)."""
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
def yuk(p): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in sorted(glob.glob(p))]
def niqob(L):
    z=(L-ndimage.median_filter(L,size=9))>28
    m=(L>=90)&~z
    return ndimage.binary_opening(m,np.ones((2,2)))
def olch(L):
    m=niqob(L); ys,xs=np.nonzero(m)
    if len(xs)<20: return None
    return xs.mean()/320, ys.mean()/180, m.mean()*100
def iou(a,b):
    a,b=niqob(a),niqob(b); return (a&b).sum()/max(1,(a|b).sum())
def hisobot(F,nom):
    r=[olch(L) for L in F]
    k1=[v for v in r[0:11] if v]; k3=[v for v in r[13:22] if v]
    m1=np.mean(k1,0); m3=np.mean(k3,0)
    print("--- %s ---"%nom)
    print("  1-kadr markaz (%.2f, %.2f) maydon %.1f%%"%tuple(m1))
    print("  3-kadr markaz (%.2f, %.2f) maydon %.1f%%   3-kadr ichida y: %.2f -> %.2f"%(*m3, r[13][1], r[21][1]))
    print("  markaz siljishi 1->3: %.2f kadr eni"%np.hypot(m3[0]-m1[0],(m3[1]-m1[1])*180/320))
    print("  IoU(11, 14) = %.2f   [1 = bir xil joy]"%iou(F[10],F[13]))
if __name__=="__main__":
    hisobot(yuk('/home/claude/work/maqsad/k??.png'),"MISOL")
    hisobot(yuk('/home/claude/work/personaj/ff/??.png'),"BIZ")
    M=yuk('/home/claude/work/maqsad/k??.png')
    print("\n  buzilgan holat: tasvir o'zi bilan IoU %.2f [1.00]"%iou(M[10],M[10]))
