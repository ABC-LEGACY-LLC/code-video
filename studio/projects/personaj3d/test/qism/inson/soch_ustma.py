"""Soch ustma-ust: misol bit16 (SAM soch) vs biz rol yashili; bit32 (SAM yuz) kulrang -- hisobga olinmaydi.
python3 soch_ustma.py CHIQ.png 2,9,11,13,19 ROLDIR"""
import sys, json, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
R='/home/claude/work/personaj3d/'
M=json.load(open(R+'test/qism/inson/qism_nishon_12.json'))['m']
out=sys.argv[1]; KS=[int(k) for k in sys.argv[2].split(',')]; D=sys.argv[3]; S=2
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
w,h=320*S,180*S
Wd=Image.new('RGB',(3*(w+4),len(KS)*(h+18)),(20,20,20)); d=ImageDraw.Draw(Wd)
tot=[0,0]
for i,k in enumerate(KS):
    ref=np.asarray(Image.open('/home/claude/work/maqsad/k%02d.png'%(k+1)).convert('RGB').resize((320,180),Image.LANCZOS),float)
    L=ref.mean(-1); lo,hi=np.percentile(L,0.5),np.percentile(L,99.8); ref=(np.clip((ref-lo)/(hi-lo),0,1)**0.6*255).astype(np.uint8)
    m=np.frombuffer(base64.b64decode(M[str(k)]),np.uint8).reshape(180,320)
    a=np.asarray(Image.open('%s/%03d.png'%(D,k)).convert('RGB')).astype(int); r,g,b=a[...,0],a[...,1],a[...,2]
    hb=(g>30)&(r<30)&(b<30); hm=(m&16)>0; yz=(m&32)>0
    y0=i*(h+18)
    Wd.paste(Image.fromarray(ref).resize((w,h),Image.LANCZOS),(0,y0+16)); d.text((4,y0+2),'misol k%02d'%(k+1),fill=(255,255,0),font=f)
    Wd.paste(Image.fromarray(a.astype(np.uint8)).resize((w,h),Image.NEAREST),(w+4,y0+16)); d.text((w+8,y0+2),'biz rol',fill=(255,255,0),font=f)
    o=(ref*0.35).astype(np.uint8).copy()
    o[hm&hb]=(240,200,40); o[hm&~hb]=(230,40,40); o[~hm&hb]=(40,220,60); o[yz]=(110,110,110)
    I=(hm&hb&~yz).sum(); U=((hm|hb)&~yz).sum(); tot[0]+=I; tot[1]+=U
    Wd.paste(Image.fromarray(o).resize((w,h),Image.NEAREST),(2*(w+4),y0+16))
    d.text((2*(w+4)+4,y0+2),'soch IoU %.3f  sariq ikkalasi, qizil faqat misol (SAM), yashil faqat biz; kulrang SAM yuz (hisobsiz)'%(I/max(U,1)),fill=(255,255,0),font=f)
Wd.save(out); print(out, Wd.size, 'jami IoU %.3f'%(tot[0]/tot[1]))
