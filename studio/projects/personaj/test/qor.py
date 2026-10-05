"""QOR O'LCHOVI -- misolga ham bizga ham AYNAN bir xil kod, 320x180 da.

Zarra = fondan yorug' MAYDA nuqta. Fonning o'zi (pastdagi binafsha tuman)
zarra hisoblanmasligi uchun top-hat ishlatiladi: L - median(L, 9x9). Shunda
katta silliq yorug'lik ayiriladi, faqat mayda cho'qqilar qoladi.

  zichlik_profili : o'ng 28% ustunlarda (hamma kadrda ochiq osmon) qator
                    bo'yicha zarra zichligi, 6 bandga bo'lingan
  tuman_profili   : o'sha ustunlarda fonning (zarrasiz) yorqinligi, 6 band
  olcham          : bog'langan bo'laklar o'lchami ulushlari
"""
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
OL=(320,180)
def yukla(p): return [np.asarray(Image.open(f).convert("L").resize(OL,Image.LANCZOS),dtype=float)
                      for f in sorted(glob.glob(p))]
def zarra(L, chek=28):
    th=L-ndimage.median_filter(L,size=9)
    return th>chek
def olch(F):
    X0=int(320*0.72)
    Z=np.mean([zarra(f)[:,X0:] for f in F],0)          # qator x ustun, o'rtacha
    T=np.mean([ndimage.median_filter(f,size=15)[:,X0:] for f in F],0)
    band=np.array_split(np.arange(180),6)
    zp=np.array([Z[b].mean()*100 for b in band])
    tp=np.array([T[b].mean() for b in band])
    sz=[]
    for f in F:
        lab,n=ndimage.label(zarra(f))
        if n: sz+=list(ndimage.sum(np.ones_like(f),lab,range(1,n+1)))
    sz=np.array(sz)
    ol={"1-3":(sz<=3).mean()*100,"4-12":((sz>3)&(sz<=12)).mean()*100,"13+":(sz>12).mean()*100}
    butun=np.mean([zarra(f).mean() for f in F])*100
    return zp,tp,ol,butun
def chop(nom,r):
    zp,tp,ol,b=r
    print(f"--- {nom} ---")
    print("  zarra zichligi %  (tepadan pastga):", " ".join(f"{v:5.2f}" for v in zp),
          f"  past/tepa {zp[-1]/max(zp[0],1e-3):.2f}x")
    print("  fon yorqinligi    (tepadan pastga):", " ".join(f"{v:5.1f}" for v in tp),
          f"  past-tepa {tp[-1]-tp[0]:+.1f}")
    print("  bo'lak o'lchami: " + "  ".join(f"{k} px {v:4.1f}%" for k,v in ol.items()),
          f"   butun kadrda zarra {b:.2f}%")
if __name__=="__main__":
    M=yukla('/home/claude/work/maqsad/k??.png'); B=yukla('/home/claude/work/personaj/ff/??.png')
    chop("MISOL",olch(M)); chop("BIZ",olch(B))
    # BUZILGAN HOLAT: bir tekis sochilgan nuqtalar -- profil tekis chiqishi SHART
    rng=np.random.default_rng(3); U=[]
    for _ in range(10):
        f=np.full((180,320),8.0); ys=rng.integers(0,180,900); xs=rng.integers(0,320,900); f[ys,xs]=200; U.append(f)
    zp,_,_,_=olch(U)
    print(f"\n  buzilgan holat (bir tekis): past/tepa {zp[-1]/zp[0]:.2f}x  [1 ga yaqin bo'lishi shart] {'OK' if abs(zp[-1]/zp[0]-1)<0.25 else 'YIQILDI'}")
    G=[]
    for _ in range(10):
        f=np.full((180,320),8.0); ys=(np.sqrt(rng.random(900))*179).astype(int); xs=rng.integers(0,320,900); f[ys,xs]=200; G.append(f)
    zp,_,_,_=olch(G)
    print(f"  buzilgan holat (pastga zichlashgan): past/tepa {zp[-1]/zp[0]:.2f}x  [1 dan katta bo'lishi shart] {'OK' if zp[-1]/zp[0]>2 else 'YIQILDI'}")
