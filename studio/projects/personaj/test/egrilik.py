"""KONTUR EGRILIGI PROFILI.

Kartadagi "ko'zda ko'rilgan" birinchi band: profil chegarasida O'YIQLAR
bo'lishi shart -- burun ildizi, burun tagi, iyak oldi. O'yiqsiz chiziq yuz
emas, tuxum.  Bu o'lchov aynan shuni sanaydi.

Nega bu tilt- va o'lcham-bog'liq emas: konturni yoy uzunligi bo'yicha teng
qadamlarga bo'lamiz va BURILISH BURCHAGINING o'zgarishini o'lchaymiz.
Burchakning o'zgarishi shaklning aylanishiga bog'liq emas, chunki hamma
burchakka bir xil doimiy qo'shiladi va u ayirmada yo'qoladi.  Masshtab esa
qadamni yoy uzunligining ULUSHI qilib olish bilan yo'qoladi.
"""
import numpy as np

def kontur(mask, n=256):
    """Eng katta bog'langan sohaning chegarasi, n ta teng qadamga bo'lingan."""
    from scipy import ndimage
    lab,k=ndimage.label(mask)
    if k==0: return None
    mask = lab==(1+np.argmax(ndimage.sum(mask,lab,range(1,k+1))))
    chet = mask & ~ndimage.binary_erosion(mask)
    ys,xs=np.nonzero(chet)
    if len(xs)<n: return None
    cx,cy=xs.mean(),ys.mean()
    # burchak bo'yicha tartiblash: yuz siluetida bu ishonchli, chunki shakl
    # markazga nisbatan yulduzsimon (har burchakda bitta chegara nuqtasi)
    a=np.arctan2(ys-cy,xs-cx); o=np.argsort(a)
    xs,ys,a=xs[o],ys[o],a[o]
    # har burchak qutisidan eng uzoq nuqta -- ichki shovqinni tashlaydi
    qut=np.linspace(-np.pi,np.pi,n+1); rr=np.full(n,np.nan)
    r=np.hypot(xs-cx,ys-cy)
    for i in range(n):
        m=(a>=qut[i])&(a<qut[i+1])
        if m.any(): rr[i]=r[m].max()
    bosh=np.isnan(rr)
    # Bo'sh qutilar: 10% gacha bo'lsa qo'shnilaridan to'ldiriladi, undan
    # ko'p bo'lsa shakl juda kichik -- o'lchov ishlamaydi, None qaytadi.
    if bosh.mean()>0.10: return None
    if bosh.any():
        idx=np.arange(n)
        rr[bosh]=np.interp(idx[bosh], idx[~bosh], rr[~bosh], period=n)
    mid=(qut[:-1]+qut[1:])/2
    return np.stack([cx+rr*np.cos(mid), cy+rr*np.sin(mid)],1)

def profil(P, tekis=5):
    """Har nuqtadagi burilish burchagining o'zgarishi (egrilik)."""
    d=np.roll(P,-tekis,0)-np.roll(P,tekis,0)
    t=np.arctan2(d[:,1],d[:,0])
    k=np.diff(np.unwrap(np.concatenate([t,t[:1]])))
    return k

def oyiqlar(k, chegara=2.2):
    """O'yiq = egrilikning MANFIY tomonga keskin chiqishi (ichkariga botish).
    Chegara -- o'rtacha absolyut egrilikning necha barobari."""
    s=np.abs(k).mean()
    ich = k < -chegara*s
    # qo'shni piksellarni bitta o'yiq deb sanash
    n=0; oldin=False
    for v in np.concatenate([ich,ich[:1]]):
        if v and not oldin: n+=1
        oldin=v
    return n, float(np.abs(k[ich]).sum()/ (np.abs(k).sum()+1e-9))

def olch(mask):
    P=kontur(mask)
    if P is None: return None
    k=profil(P)
    n,ulush=oyiqlar(k)
    return {"oyiq":n, "oyiq_ulushi":round(ulush,4), "egrilik_tarqoqligi":round(float(k.std()/ (np.abs(k).mean()+1e-9)),3)}


# ===========================================================================
# YAKUNIY O'LCHOV: DARVOZA + NOSIMMETRIKLIK
#
# Ikki urinish YIQILDI, uchinchisi o'tdi. Yozib qo'yaman, chunki nimaning
# ishlamasligi ham natija:
#
#  1) O'YIQ SONI -- yiqildi. Burilishda 4 dan 2 ga tushdi, va TEBRANMA tuxum
#     ham 4 berdi. Ya'ni u tuzilishni emas, g'adir-budirlikni sanaydi.
#  2) EGRILIK TARQOQLIGI -- yiqildi. Silliqlashni oshirsak ajratish yomonlashdi:
#     t=28 da tebranma tuxum (0.960) asl profildan (0.648) YUQORI chiqdi.
#  3) NOSIMMETRIKLIK + DARVOZA -- o'tdi. Yuz profili old-orqa nosimmetrik;
#     tuxum esa emas. Lekin kuchli tebranma tuxum nosimmetriklikda asldan
#     oshib ketadi (0.345 > 0.226), shuning uchun undan oldin DARVOZA turadi:
#     yuqori chastotali energiya. Chizilgan siluet silliq, tebranma emas.
#
#     Kuchli tebranma  -> darvozada to'siladi (0.0817 > 0.0114)
#     Yengil tebranma  -> darvozadan o'tadi, lekin nosimmetriklikda tushadi
#                         (0.063 << 0.226)
#     Tuxum, doira     -> nosimmetriklikda tushadi (0.002, 0.004)
#
# CHEKLOV: deyarli doira shakllarda darvoza ma'nosiz (radius o'zgarishi nolga
# yaqin, nisbat shovqinni shovqinga bo'ladi). Bunday shakl nosimmetriklikda
# baribir tushadi, shuning uchun darvoza yolg'iz ishlatilmaydi.
# ===========================================================================

def yuqori_chastota(mask, n=256, chek=12):
    P=kontur(mask,n)
    if P is None: return None
    C=P-P.mean(0); r=np.hypot(C[:,0],C[:,1])
    F=np.abs(np.fft.rfft(r-r.mean()))**2
    return float(F[chek:].sum()/F.sum())

def nosimmetriklik(mask, n=256, bolak=64):
    """PCA bosh o'qiga nisbatan old-orqa farq. Burilish va masshtabdan mustaqil."""
    P=kontur(mask,n)
    if P is None: return None
    C=P-P.mean(0)
    _,_,vt=np.linalg.svd(C,full_matrices=False)
    A=C@vt.T
    t=np.linspace(A[:,0].min(),A[:,0].max(),bolak)
    ch,on=[],[]
    for i in range(bolak-1):
        m=(A[:,0]>=t[i])&(A[:,0]<t[i+1])
        if not m.any(): continue
        v=A[m,1]; ch.append(-v.min()); on.append(v.max())
    ch,on=np.array(ch),np.array(on)
    return float(np.abs(ch-on).mean()/((ch+on).mean()/2))

DARVOZA_CHEGARA = 0.0114   # chizmalarning eng yomonining 2.5x i

def profil_olchovi(mask):
    """Yagona kirish nuqtasi. Darvozadan o'tmasa -- o'lchov BERILMAYDI."""
    g=yuqori_chastota(mask)
    if g is None: return {"holat":"kontur topilmadi"}
    if g>DARVOZA_CHEGARA:
        return {"holat":"DARVOZADA TO'SILDI", "yuqori_chastota":round(g,4),
                "sabab":"kontur tebranma -- bu chizma emas, shovqin"}
    return {"holat":"o'lchandi", "yuqori_chastota":round(g,4),
            "nosimmetriklik":round(nosimmetriklik(mask),4)}
