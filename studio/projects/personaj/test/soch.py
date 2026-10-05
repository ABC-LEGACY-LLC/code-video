"""SOCH O'LCHOVLARI -- chegarasiz (eski "teri ulushi" chegara tanlovi tufayli yiqilgan edi).

 kontrast : bosh qutisidagi L>40 piksellar 2 guruhga (k-means) bo'linadi;
            yorug' guruh markazi / qorong'i guruh markazi. Ton chegarasi yo'q.
 tutamlar : fringe qatorlari bo'ylab yorqinlikning mahalliy cho'qqilari soni
            (sigma 1 silliqlash, cho'qqi balandligi >= 10). Yaxlit qalpoqda
            cho'qqi deyarli bo'lmaydi.
Qutilar 320x180 da: misol uchun xaritadan, biz uchun poza varaqasidagi aniq
markaz va R dan hisoblanadi."""
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.cluster.vq import kmeans2
from scipy.signal import find_peaks
def L_(p): return np.asarray(Image.open(p).convert('L').resize((320,180),Image.LANCZOS),dtype=float)
def kontrast(L,box):
    # zarralar chiqarib tashlanadi (qor.py dagi o'sha detektor): aks holda
    # qutidagi qor yorug' guruhni sun'iy ko'taradi
    x0,y0,x1,y1=box; v=L[y0:y1,x0:x1]
    zr=(v-ndimage.median_filter(v,size=9))>28
    v=v[(v>40)&~zr].reshape(-1,1)
    if len(v)<50: return None
    C,_=kmeans2(v,2,seed=3,minit='++'); C=np.sort(C.ravel())
    return float(C[1]/C[0])
def tutamlar(L,x0,x1,rows):
    n=[]
    for y in rows:
        r=ndimage.gaussian_filter1d(L[y,x0:x1],1.0)
        p,_=find_peaks(r,prominence=10); n.append(len(p))
    return float(np.median(n))
if __name__=="__main__":
    import glob
    M=[L_(f) for f in sorted(glob.glob('/home/claude/work/maqsad/k??.png'))[:11]]
    B=[L_(f) for f in sorted(glob.glob('/home/claude/work/personaj/ff/??.png'))[:11]]
    s=320/540; cx,cy,R=178*s,112*s,108*s
    bb=(int(cx-1.25*R),max(0,int(cy-1.25*R)),int(cx+1.15*R),int(cy+0.35*R))
    fr_b=range(int(cy-0.55*R),int(cy-0.05*R),3); fx_b=(int(cx-1.1*R),int(cx+1.1*R))
    print("biz: bosh qutisi",bb," fringe qatorlari",list(fr_b))
    km=np.median([kontrast(L,(50,0,170,115)) for L in M]); kb=np.median([kontrast(L,bb) for L in B])
    tm=np.median([tutamlar(L,55,160,range(24,37,3)) for L in M]); tb=np.median([tutamlar(L,*fx_b,fr_b) for L in B])
    print("               misol    biz")
    print("  kontrast     %5.2f  %5.2f"%(km,kb))
    print("  tutamlar     %5.1f  %5.1f"%(tm,tb))
    # BUZILGAN HOLATLAR
    U=np.full((180,320),70.0)+np.random.default_rng(1).normal(0,2,(180,320))
    print("\n  buzilgan: bir xil ton          kontrast %.2f [1 ga yaqin]  %s"%(kontrast(U,(50,0,170,115)),'OK' if kontrast(U,(50,0,170,115))<1.15 else 'YIQILDI'))
    Q=np.full((180,320),20.0); Q[0:40,55:160]=105
    print("  buzilgan: yaxlit qalpoq        tutamlar %.1f [<=1]  %s"%(tutamlar(Q,55,160,range(24,37,3)),'OK' if tutamlar(Q,55,160,range(24,37,3))<=1 else 'YIQILDI'))
    T=np.full((180,320),60.0)
    for i in range(6): T[0:40,60+i*16:68+i*16]=110
    print("  yaxshi:   6 ta ajratilgan tutam tutamlar %.1f [~6]  %s"%(tutamlar(T,55,160,range(24,37,3)),'OK' if abs(tutamlar(T,55,160,range(24,37,3))-6)<=1 else 'YIQILDI'))

def uchlar(L, xs, ybosh, hb, ytepa=0):
    """FRINGE PASTKI CHETI, YUZ TOMONIDAN ko'rilgan.
    1-urinish (tepadan pastga, "birinchi soch yugurishining oxiri") YIQILDI:
    soch ichidagi qorong'i tutam oralig'ida va quti chetidagi qorda to'xtadi,
    tekis chetli bizning kadrga 9 uch berdi (misol 4).
    Endi: yuzning ichidagi qatordan (ybosh) YUQORIGA qarab, yuzning o'z
    ustunlarida (xs) -- birinchi uchragan soch (ketma-ket 2 qator) = chet.
    Zarralar top-hat bilan chiqariladi. Chegara: shu boshning k-means markazlari o'rtasi."""
    hx0,hy0,hx1,hy1=hb; v=L[hy0:hy1,hx0:hx1]
    zr=(v-ndimage.median_filter(v,size=9))>28; v=v[(v>40)&~zr].reshape(-1,1)
    C,_=kmeans2(v,2,seed=3,minit='++'); t=np.sort(C.ravel()).mean()
    Z=(L-ndimage.median_filter(L,size=9))>28
    ys=[]
    for x in xs:
        y=ybosh
        while y>ytepa+1 and not ((L[y,x]>=t and not Z[y,x]) and (L[y-1,x]>=t and not Z[y-1,x])): y-=1
        ys.append(y if y>ytepa+1 else np.nan)
    ys=np.array(ys,float); ok=~np.isnan(ys)
    if ok.sum()<5: return None
    ys=np.interp(np.arange(len(ys)),np.where(ok)[0],ys[ok])
    s=ndimage.gaussian_filter1d(ys,0.8)
    p,_=find_peaks(s,prominence=3)
    return len(p), float(np.std(s-ndimage.gaussian_filter1d(s,6))), ys
