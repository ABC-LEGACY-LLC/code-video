"""FIGURA XARITASI -- qor yopilgan joy.
Qor hamma narsaning ORTIDA yog'adi. Shuning uchun bir kadr davomida qor HECH
QACHON ko'rinmagan blokda oldida nimadir bor: plash, kapyushon yoki bosh.
Qorong'i plashni qorong'i osmondan yorqinlik bilan ajratib bo'lmaydi (ikkalasi
L~20), lekin qor bilan ajratsa bo'ladi.
  - 320x180, 10x10 px bloklar (32x18)
  - zarra = top-hat > 28 (qor.py dagi o'sha detektor)
  - figura bloki = kadr bo'yicha o'rtacha zarra ulushi < 0.4%
Soch uchlari ham top-hat da "zarra" bo'lib qolishi mumkin -- shuning uchun
bosh hududi alohida (kompozitsiya.py yorug' niqobi) o'lchanadi; bu xarita
asosan PLASH va KAPYUSHON uchun."""
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
B=10; GX,GY=32,18
def yuk(fl): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in fl]
def zarra(L): return (L-ndimage.median_filter(L,size=9))>28
def bloklar(M):
    return M.reshape(GY,B,GX,B).mean(axis=(1,3))
def xarita(F, chek=0.010):
    """1-urinish (har qanday yorug' nuqta = qor) YIQILDI: IoU 0.65 -- soch tolalari
    va ko'z yaltirog'i ham top-hat da nuqta, ular boshni "osmon" qilib qo'ydi.
    Farq HARAKATDA: qor har tasvirda ~3 px suriladi, soch va ko'z joyida turadi.
    Shuning uchun faqat HARAKATLANAYOTGAN nuqtalar qor: kadrning yarmidan ko'p
    tasvirida yonib turgan piksel -- turg'un, ya'ni figuraning o'zi."""
    Z=np.array([zarra(L) for L in F])
    turgun=Z.mean(0)>0.5
    z=np.mean([bloklar((m&~turgun).astype(float)) for m in Z],0)
    # 2-urinish (qat'iy "qor yo'q") ham YIQILDI: IoU 0.71 -- figura chetidagi
    # blok qisman ochiq, ochiq qismiga qor tushadi, xarita uni osmon deydi.
    # Endi QOPLANGAN ULUSH baholanadi: blokdagi qor / shu qatordagi ochiq
    # osmonning qori (qatorning 75-foizili). Aniq niqob bilan bir xil qoida:
    # ulush > 0.5 -> figura.
    ref=np.maximum(np.percentile(z,75,axis=1,keepdims=True),1e-4)
    qop=np.clip(1-z/ref,0,1)
    # 3-urinish ham YIQILDI (0.72): tepa qatorlarda qor siyrak (~3%), 11 tasvirda
    # ba'zi ochiq bloklarga tasodifan kam qor tushadi -> osmonda yakka "figura"
    # bloklari. Haqiqiy figura BITTA bog'langan massa va ichida teshik yo'q:
    # eng katta bog'langan qism olinadi, teshiklari to'ldiriladi.
    m=qop>0.5
    lab,n=ndimage.label(m,structure=np.ones((3,3)))
    if n:
        sz=ndimage.sum(m,lab,range(1,n+1)); m=lab==(1+int(np.argmax(sz)))
        m=ndimage.binary_fill_holes(m)
    return m, z
def aniq_niqob(zs_fayllar):
    """Bizning ANIQ figuramiz: zarrasiz kadrda fon gradientidan farq qilgan piksel.
    Fon har qatorda gorizontal bir xil (CSS gradient) -- o'ng chekka ustundan olinadi."""
    out=[]
    for f in zs_fayllar:
        L=np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float)
        bg=np.median(L[:,312:318],axis=1,keepdims=True)
        out.append(bloklar((np.abs(L-bg)>4).astype(float))>0.5)
    return np.mean(out,0)>0.5
def chiz(m, nom):
    print(nom); [print("   "+"".join("#" if v else "." for v in r)) for r in m]
def iou(a,b): return (a&b).sum()/max(1,(a|b).sum())
if __name__=="__main__":
    mis=sorted(glob.glob('/home/claude/work/maqsad/k??.png'))
    biz=sorted(glob.glob('/home/claude/work/personaj/ff/??.png'))
    bzs=sorted(glob.glob('/home/claude/work/personaj/ff-zs/??.png'))
    # KALIBRLASH: bizning 1-kadr, xarita vs aniq niqob
    xb,_=xarita(yuk(biz[0:11])); an=aniq_niqob(bzs[0:11])
    print("KALIBRLASH (bizning 1-kadr): xarita va aniq niqob IoU = %.2f   [>=0.80 bo'lishi shart]  %s"%(iou(xb,an),'OK' if iou(xb,an)>=0.8 else 'YIQILDI'))
    print("   xarita qamrovi %.1f%%, aniq niqob %.1f%%"%(xb.mean()*100,an.mean()*100))
    # BUZILGAN HOLAT: figurasiz ketma-ketlik -- xarita bo'sh bo'lishi shart
    rng=np.random.default_rng(5); U=[]
    for _ in range(11):
        f=np.full((180,320),10.0); ys=rng.integers(0,180,2400); xs=rng.integers(0,320,2400); f[ys,xs]=190; U.append(f)
    zb,_=xarita(U); print("BUZILGAN HOLAT (figurasiz qor): figura bloklari %.1f%%  [~0]  %s"%(zb.mean()*100,'OK' if zb.mean()<0.02 else 'YIQILDI'))
    xm,_=xarita(yuk(mis[0:11]))
    print("\n1-KADR:  misol qamrovi %.1f%%   biz %.1f%%   IoU %.2f"%(xm.mean()*100,xb.mean()*100,iou(xm,xb)))
    chiz(xm,"misol"); chiz(xb,"biz")
    if len(sys.argv)>1 and sys.argv[1]=='3':
        xm3,_=xarita(yuk(mis[13:22])); xb3,_=xarita(yuk(biz[13:22]))
        print("\n3-KADR:  misol qamrovi %.1f%%   biz %.1f%%   IoU %.2f"%(xm3.mean()*100,xb3.mean()*100,iou(xm3,xb3)))
        chiz(xm3,"misol"); chiz(xb3,"biz")
