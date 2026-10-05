"""Topshiriq fayllari (9-o'tish): yuz-5x.png (4 panel: misol, biz, ikkalasi
L35-120 cho'zilgan), oldin-keyin.png (misol | 8-o'tish | 9-o'tish),
yonma-yon.gif, kadr-toliq.gif, yonma-yon-kadrlar.png."""
import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw
W='/home/claude/work/personaj'; M=sorted(glob.glob('/home/claude/work/maqsad/k??.png')); B=sorted(glob.glob(W+'/ff/??.png'))
ESKI=sys.argv[1] if len(sys.argv)>1 else None
def ol(p):
    im=Image.open(p).convert('RGB'); return im if im.size==(320,180) else im.resize((320,180),Image.LANCZOS)
def chozil(im):
    a=np.asarray(im).astype(float); a=np.clip((a-35)/(120-35)*255,0,255); return Image.fromarray(a.astype(np.uint8))
def panel(im,box,z): return im.crop(box).resize(((box[2]-box[0])*z,(box[3]-box[1])*z),Image.LANCZOS)
# 1) yuz-5x: 1 va 11-tasvir
qator=[(0,(72,22,140,112)),(10,(84,28,152,118))]; z=5
pw=(68)*z; ph=(90)*z; hdr=20
s=Image.new('RGB',(pw*4+18,(ph+hdr)*2+6),(0,0,0)); d=ImageDraw.Draw(s)
for r,(i,box) in enumerate(qator):
    y=r*(ph+hdr+6)
    ims=[ol(M[i]),ol(B[i])]
    for c,(im,lb) in enumerate([(ims[0],'MISOL %d'%(i+1)),(ims[1],'BIZ %d (9-o\'tish)'%(i+1)),(chozil(ims[0]),'MISOL %d (L35-120 cho\'zilgan)'%(i+1)),(chozil(ims[1]),'BIZ %d (cho\'zilgan)'%(i+1))]):
        s.paste(panel(im,box,z),(c*(pw+6),y+hdr)); d.text((c*(pw+6)+4,y+4),lb,fill=(255,220,120))
s.save(W+'/yuz-5x.png'); print('yuz-5x.png',s.size)
# 2) oldin-keyin
if ESKI:
    E=sorted(glob.glob(ESKI+'/??.png')); z=4
    kad=[(0,(66,16,152,122)),(5,(66,16,152,122)),(10,(78,24,164,130))]
    pw=86*z; ph=106*z
    s=Image.new('RGB',(pw*3+12,(ph+hdr)*len(kad)+6*len(kad)),(0,0,0)); d=ImageDraw.Draw(s)
    for r,(i,box) in enumerate(kad):
        y=r*(ph+hdr+6)
        for c,(p,lb) in enumerate([(M[i],'MISOL %d'%(i+1)),(E[i],'OLDIN (8-o\'tish) %d'%(i+1)),(B[i],'HOZIR (9-o\'tish) %d'%(i+1))]):
            s.paste(panel(ol(p),box,z),(c*(pw+6),y+hdr)); d.text((c*(pw+6)+4,y+4),lb,fill=(255,220,120))
    s.save(W+'/oldin-keyin.png'); print('oldin-keyin.png',s.size)
# 3) GIFlar (60 ms, cheksiz)
fr=[]
for m,b in zip(M,B):
    c=Image.new('RGB',(990,316),(12,12,18)); dd=ImageDraw.Draw(c)
    c.paste(Image.open(m).convert('RGB').resize((480,270),Image.LANCZOS),(10,36)); c.paste(Image.open(b).convert('RGB').resize((480,270),Image.LANCZOS),(500,36))
    dd.text((10,12),'MISOL (faqat texnika o\'lchanadi)',fill=(180,180,200)); dd.text((500,12),'BIZ -- 9-o\'tish',fill=(180,180,200)); fr.append(c)
fr[0].save(W+'/yonma-yon.gif',save_all=True,append_images=fr[1:],duration=60,loop=0); print('yonma-yon.gif',len(fr))
fr=[Image.open(b).convert('RGB').resize((480,270),Image.LANCZOS) for b in B]
fr[0].save(W+'/kadr-toliq.gif',save_all=True,append_images=fr[1:],duration=60,loop=0); print('kadr-toliq.gif',len(fr))
os.system('python3 %s/test/yonma.py 0,5,10,16 %s/yonma-yon-kadrlar.png >/dev/null'%(W,W)); print('yonma-yon-kadrlar.png')
