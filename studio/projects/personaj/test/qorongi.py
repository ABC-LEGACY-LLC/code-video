"""PLASH/KAPYUSHON QORONG'I ULUSHI (L<18) -- figura xaritasi ichida, bosh
(yorug' niqob, 4 px kengaytirilgan) va qor zarralari chiqarilgan holda, har
tasvir o'rtachasi. 9-o'tishda qayta yozildi: 7-o'tishdagi skript saqlanmagan
edi, shuning uchun bu raqamlar kartadagi eski 18.6/26.3/27.6 bilan bevosita
solishtirilmaydi -- ikkala tomon SHU kod bilan o'lchanadi."""
import sys,glob; sys.path.insert(0,'/home/claude/work/personaj/test')
import numpy as np
from scipy import ndimage
from figura import xarita, yuk
from kompozitsiya import niqob
def ulush(fl):
    F=yuk(fl); m,_=xarita(F); M=np.kron(m,np.ones((10,10))).astype(bool); v=[]
    for L in F:
        sel=M&~ndimage.binary_dilation(niqob(L),iterations=4)&~((L-ndimage.median_filter(L,9))>28)
        v.append((L[sel]<18).mean()*100)
    return np.mean(v)
if __name__=='__main__':
    mis=sorted(glob.glob('/home/claude/work/maqsad/k??.png')); biz=sorted(glob.glob('/home/claude/work/personaj/ff/??.png'))
    for nom,a,b in (('1-kadr',0,11),('2-kadr',11,13),('3-kadr',13,22)):
        print("%s qorong'i (L<18) ulushi: misol %.1f%%  biz %.1f%%"%(nom,ulush(mis[a:b]),ulush(biz[a:b])))
