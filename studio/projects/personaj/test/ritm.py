"""RITM O'LCHOVI -- misolga ham, bizning kadrga ham AYNAN bir xil qo'llanadi.
Hamma tasvir 320x180 ga keltiriladi: ton va farq o'lchovlari o'lchamga bog'liq."""
import sys, glob, numpy as np
from PIL import Image
OL=(320,180)

def yukla(namuna):
    fl=sorted(glob.glob(namuna))
    if not fl: sys.exit(f"topilmadi: {namuna}")
    return [np.asarray(Image.open(f).convert("L").resize(OL,Image.LANCZOS),dtype=np.float64) for f in fl]

def nz(a): return (a-a.mean())/a.std()
def farq(x,y,tashla=0.0):
    d=np.abs(nz(x)-nz(y)).ravel()
    if tashla>0:
        k=int(len(d)*(1-tashla)); d=np.partition(d,k)[:k]
    return d.mean()

def tendensiya(F,idx,tashla=0.0):
    v=[farq(F[i],F[i+1],tashla) for i in idx]
    return v[0], v[-1], (v[-1]/v[0]-1)*100

def kesishlar(F, chegara=1.6):
    d=np.array([farq(F[i],F[i+1]) for i in range(len(F)-1)])
    m=np.median(d)
    return [i+1 for i,v in enumerate(d) if v>m*chegara], d, m

def hisobot(F, nom, k1, k2):
    """k1 = 1-kadr indekslari, k2 = 3-kadr indekslari (juftlik boshlanishi)"""
    sp,d,m=kesishlar(F)
    print(f"--- {nom} ({len(F)} tasvir) ---")
    print(f"  kesishlar          {sp}   (mediana farq {m:.3f})")
    if sp:
        print(f"  kesish kattaligi   {max(d[i-1] for i in sp)/m:.2f}x mediana")
    for tashla,lbl in ((0.0,'butun kadr'),(0.10,'eng katta 10% tashlangan')):
        a,b,p=tendensiya(F,k1,tashla); print(f"  1-kadr  {lbl:<26} {a:.3f} -> {b:.3f}  {p:+6.1f}%")
        a,b,p=tendensiya(F,k2,tashla); print(f"  3-kadr  {lbl:<26} {a:.3f} -> {b:.3f}  {p:+6.1f}%")
    y=[f.mean() for f in F]
    print(f"  yorqinlik 1-kadr   {np.mean(y[0:11]):.2f}")
    print(f"  yorqinlik 3-kadr   {y[13]:.2f} -> {y[21]:.2f}  ({(y[21]/y[13]-1)*100:+.1f}%)")
    print(f"  kadrlar nisbati    3-kadr/1-kadr yorqinlik {np.mean(y[13:22])/np.mean(y[0:11]):.3f}")
    return d,m

if __name__=='__main__':
    K1,K2=range(0,10), range(13,21)
    M=yukla('/home/claude/work/maqsad/k??.png')
    B=yukla('/home/claude/work/personaj/ff/??.png')
    dm,mm=hisobot(M,'MISOL',K1,K2); print()
    db,mb=hisobot(B,'BIZNIKI',K1,K2)
    print("\n--- O'LCHOVNING BUZILGAN HOLATLARI ---")
    for nom,F in (('MISOL',M),('BIZNIKI',B)):
        sp,_,_=kesishlar(F[13:22])
        print(f"  {nom}: faqat 3-kadr (kesishsiz) -> cho'qqi {sp}  [bo'sh bo'lishi kerak]  {'OK' if not sp else 'YIQILDI'}")
    # BIR TEKIS harakat: bitta tasvirni har safar 2 px ga suramiz.
    # Tendensiya o'lchovi bunda 0 ga yaqin chiqishi SHART -- aks holda u
    # harakatni emas, boshqa narsani o'lchayotgan bo'ladi.
    tek=[np.roll(M[5],2*k,axis=1) for k in range(9)]
    sp,_,_=kesishlar(tek)
    print(f"  bir tekis harakat -> cho'qqi {sp}  [bo'sh]  {'OK' if not sp else 'YIQILDI'}")
    a,b,p=tendensiya(tek,range(0,7))
    print(f"  bir tekis harakatning tendensiyasi {p:+.1f}%  [0 ga yaqin]  {'OK' if abs(p)<3 else 'YIQILDI'}")
    # TEZLASHAYOTGAN harakat: qadam 1,2,3... px. Musbat tendensiya chiqishi shart.
    pos=np.cumsum(np.arange(1,10)); tez=[np.roll(M[5],int(v),axis=1) for v in pos]
    a,b,p=tendensiya(tez,range(0,7))
    print(f"  ataylab tezlashtirilgan harakat {p:+.1f}%  [musbat bo'lishi shart]  {'OK' if p>5 else 'YIQILDI'}")
