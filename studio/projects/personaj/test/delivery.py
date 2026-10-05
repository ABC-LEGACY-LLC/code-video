"""Delivery files (pass 9): face-5x.png (4 panels: the sample, ours, and both
stretched L35-120), before-after.png (sample | pass 8 | pass 9),
side_by_side-side.gif, frame-full.gif, side_by_side-side-frames.png."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw
W=(PERSONAJ_DIR); M=sorted(glob.glob((SAMPLE_DIR + '/k??.png'))); B=sorted(glob.glob(W+'/ff/??.png'))
OLD=sys.argv[1] if len(sys.argv)>1 else None
def ol(p):
    im=Image.open(p).convert('RGB'); return im if im.size==(320,180) else im.resize((320,180),Image.LANCZOS)
def stretch(im):
    a=np.asarray(im).astype(float); a=np.clip((a-35)/(120-35)*255,0,255); return Image.fromarray(a.astype(np.uint8))
def panel(im,box,z): return im.crop(box).resize(((box[2]-box[0])*z,(box[3]-box[1])*z),Image.LANCZOS)
# 1) face-5x: images 1 and 11
row=[(0,(72,22,140,112)),(10,(84,28,152,118))]; z=5
pw=(68)*z; ph=(90)*z; hdr=20
s=Image.new('RGB',(pw*4+18,(ph+hdr)*2+6),(0,0,0)); d=ImageDraw.Draw(s)
for r,(i,box) in enumerate(row):
    y=r*(ph+hdr+6)
    ims=[ol(M[i]),ol(B[i])]
    for c,(im,lb) in enumerate([(ims[0],'SAMPLE %d'%(i+1)),(ims[1],'OURS %d (pass 9)'%(i+1)),(stretch(ims[0]),'SAMPLE %d (L35-120 stretched)'%(i+1)),(stretch(ims[1]),'OURS %d (stretched)'%(i+1))]):
        s.paste(panel(im,box,z),(c*(pw+6),y+hdr)); d.text((c*(pw+6)+4,y+4),lb,fill=(255,220,120))
s.save(W+'/face-5x.png'); print('face-5x.png',s.size)
# 2) before-after
if OLD:
    E=sorted(glob.glob(OLD+'/??.png')); z=4
    frameList=[(0,(66,16,152,122)),(5,(66,16,152,122)),(10,(78,24,164,130))]
    pw=86*z; ph=106*z
    s=Image.new('RGB',(pw*3+12,(ph+hdr)*len(frameList)+6*len(frameList)),(0,0,0)); d=ImageDraw.Draw(s)
    for r,(i,box) in enumerate(frameList):
        y=r*(ph+hdr+6)
        for c,(p,lb) in enumerate([(M[i],'SAMPLE %d'%(i+1)),(E[i],'BEFORE (pass 8) %d'%(i+1)),(B[i],'NOW (pass 9) %d'%(i+1))]):
            s.paste(panel(ol(p),box,z),(c*(pw+6),y+hdr)); d.text((c*(pw+6)+4,y+4),lb,fill=(255,220,120))
    s.save(W+'/before-after.png'); print('before-after.png',s.size)
# 3) GIFs (60 ms, looping forever)
fr=[]
for m,b in zip(M,B):
    c=Image.new('RGB',(990,316),(12,12,18)); dd=ImageDraw.Draw(c)
    c.paste(Image.open(m).convert('RGB').resize((480,270),Image.LANCZOS),(10,36)); c.paste(Image.open(b).convert('RGB').resize((480,270),Image.LANCZOS),(500,36))
    dd.text((10,12),'SAMPLE (only the technique is measured)',fill=(180,180,200)); dd.text((500,12),'OURS -- pass 9',fill=(180,180,200)); fr.append(c)
fr[0].save(W+'/side_by_side-side.gif',save_all=True,append_images=fr[1:],duration=60,loop=0); print('side_by_side-side.gif',len(fr))
fr=[Image.open(b).convert('RGB').resize((480,270),Image.LANCZOS) for b in B]
fr[0].save(W+'/frame-full.gif',save_all=True,append_images=fr[1:],duration=60,loop=0); print('frame-full.gif',len(fr))
os.system('python3 %s/test/side_by_side.py 0,5,10,16 %s/side_by_side-side-frames.png >/dev/null'%(W,W)); print('side_by_side-side-frames.png')
