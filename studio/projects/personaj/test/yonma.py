"""Yonma-yon varaq: misol va biz, tanlangan tasvirlar. Ko'z bilan tekshirish uchun."""
import sys, glob
from PIL import Image, ImageDraw
idx=[int(x) for x in (sys.argv[1] if len(sys.argv)>1 else "0,10,15").split(',')]
out=sys.argv[2] if len(sys.argv)>2 else '/home/claude/work/personaj/yonma-yon-kadrlar.png'
OL=(480,270)
M=sorted(glob.glob('/home/claude/work/maqsad/k??.png')); B=sorted(glob.glob('/home/claude/work/personaj/ff/??.png'))
P=8; c=Image.new('RGB',(OL[0]*2+P*3,(OL[1]+P+18)*len(idx)+P),(12,12,18)); d=ImageDraw.Draw(c)
for r,i in enumerate(idx):
    y=P+r*(OL[1]+P+18)
    d.text((P,y),"MISOL %d/22"%(i+1),fill=(180,180,200)); d.text((P*2+OL[0],y),"BIZ %d/22"%(i+1),fill=(180,180,200))
    c.paste(Image.open(M[i]).convert('RGB').resize(OL,Image.LANCZOS),(P,y+16))
    c.paste(Image.open(B[i]).convert('RGB').resize(OL,Image.LANCZOS),(P*2+OL[0],y+16))
c.save(out); print(out)
