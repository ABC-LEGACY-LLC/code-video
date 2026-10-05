"""Side-by-side sheet: the sample and ours, chosen drawings. For checking by eye."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob
from PIL import Image, ImageDraw
idx=[int(x) for x in (sys.argv[1] if len(sys.argv)>1 else "0,10,15").split(',')]
out=sys.argv[2] if len(sys.argv)>2 else (PERSONAJ_DIR + '/side_by_side-side-frames.png')
SZ=(480,270)
M=sorted(glob.glob((SAMPLE_DIR + '/k??.png'))); B=sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png')))
P=8; c=Image.new('RGB',(SZ[0]*2+P*3,(SZ[1]+P+18)*len(idx)+P),(12,12,18)); d=ImageDraw.Draw(c)
for r,i in enumerate(idx):
    y=P+r*(SZ[1]+P+18)
    d.text((P,y),"SAMPLE %d/22"%(i+1),fill=(180,180,200)); d.text((P*2+SZ[0],y),"OURS %d/22"%(i+1),fill=(180,180,200))
    c.paste(Image.open(M[i]).convert('RGB').resize(SZ,Image.LANCZOS),(P,y+16))
    c.paste(Image.open(B[i]).convert('RGB').resize(SZ,Image.LANCZOS),(P*2+SZ[0],y+16))
c.save(out); print(out)
