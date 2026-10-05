"""CHIZIQ QAYNASHI -- har tasvir qayta chizilganmi?

Figura sohasida (qor yo'q joy -- figura xaritasidan, 5 px ichkariga) har
16x16 blok uchun ketma-ket ikki tasvir orasidagi eng yaxshi siljish topiladi
(2x kattalashtirib, 0.5 px qadam, +-3 px).
  HARAKAT  = bloklar siljishining MEDIANASI (hammasi birga suriladi)
  QAYNASH  = medianadan chetlanishning mediana kattaligi (har blok o'zicha)
  kodek shovqini izchil siljish bermaydi -- u yerda eng yaxshi siljish ~0.
Faqat tuzilishi bor bloklar (gradient energiyasi yetarli) olinadi."""
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0,'/home/claude/work/personaj/test')
from figura import xarita
def yuk(fl): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in fl]
def siljishlar(a,b,mask,S=12,Q=6,chek=4.0):
    A=ndimage.zoom(a,2,order=3); Bz=ndimage.zoom(b,2,order=3); M=ndimage.zoom(mask.astype(float),2,order=0)>0.5
    G=np.hypot(ndimage.sobel(A,0),ndimage.sobel(A,1))
    out=[]
    for y in range(Q,A.shape[0]-2*S-Q,2*S):
        for x in range(Q,A.shape[1]-2*S-Q,2*S):
            if M[y:y+2*S,x:x+2*S].mean()<0.9: continue
            blk=A[y:y+2*S,x:x+2*S]
            if G[y:y+2*S,x:x+2*S].mean()<chek*8: continue
            best=(1e9,0,0)
            for dy in range(-Q,Q+1):
                for dx in range(-Q,Q+1):
                    e=np.abs(Bz[y+dy:y+dy+2*S,x+dx:x+dx+2*S]-blk).mean()
                    if e<best[0]: best=(e,dx,dy)
            out.append((best[1]/2,best[2]/2))
    return np.array(out)
def olch(F,mask):
    har,qay,nb=[],[],[]
    for a,b in zip(F[:-1],F[1:]):
        s=siljishlar(a,b,mask)
        if len(s)<4: continue
        med=np.median(s,0); r=np.hypot(*(s-med).T)
        har.append(np.hypot(*med)); qay.append(np.median(r)); nb.append(len(s))
    return np.median(har), np.median(qay), int(np.median(nb))
def figura_niqobi(F):
    """figura xaritasi (3 px ichkariga) + boshning yorug' sohasi (3 px kengaytirilgan).
    1-urinishda faqat xarita (5 px ichkari) edi -- tuzilishi bor bloklar
    (soch, yuz) chetda qolib, misolda 5 ta blok topildi."""
    sys.path.insert(0,'/home/claude/work/personaj/test')
    from kompozitsiya import niqob
    m,_=xarita(F); M=ndimage.binary_erosion(np.kron(m,np.ones((10,10))).astype(bool),iterations=3)
    Y=ndimage.binary_dilation(np.mean([niqob(L) for L in F],0)>0.5,iterations=3)
    return M|Y
if __name__=="__main__":
    mis=sorted(glob.glob('/home/claude/work/maqsad/k??.png')); biz=sorted(glob.glob('/home/claude/work/personaj/ff/??.png'))
    Mf=yuk(mis[0:11]); mm=figura_niqobi(Mf)
    # KALIBRLASH
    base=Mf[0]
    rig=[np.roll(base,k,axis=1) for k in range(6)]
    h,q,n=olch(rig,mm); print("buzilgan holat -- qattiq siljish 1 px/tasvir: harakat %.2f  qaynash %.2f  [qaynash ~0]  %s"%(h,q,'OK' if q<0.2 else 'YIQILDI'))
    rng=np.random.default_rng(2); yy,xx=np.mgrid[0:180,0:320].astype(float)
    def tebran(A):
        out=[]
        for k in range(6):
            ph=rng.random(6)*6.283; w=2*np.pi/40
            dx=A*(np.sin(w*xx*0.8+w*yy*0.6+ph[0])+np.sin(-w*xx*0.5+w*yy*0.9+ph[1]))/1.41
            dy=A*(np.sin(w*xx*0.7-w*yy*0.7+ph[2])+np.sin(w*xx*0.3+w*yy*1.0+ph[3]))/1.41
            out.append(ndimage.map_coordinates(base,[yy+dy,xx+dx],order=3,mode='nearest'))
        return out
    for A in (0.5,1.0):
        h,q,n=olch(tebran(A),mm); print("sun'iy qaynash amplitudasi %.1f px: o'lchangan qaynash %.2f"%(A,q))
    print()
    for nom,F in (("MISOL 1-kadr",Mf),("MISOL 3-kadr",yuk(mis[13:22])),("BIZ 1-kadr",yuk(biz[0:11])),("BIZ 3-kadr",yuk(biz[13:22]))):
        h,q,n=olch(F,figura_niqobi(F)); print("%-14s harakat %.2f px   qaynash %.2f px   (%d blok)"%(nom,h,q,n))
