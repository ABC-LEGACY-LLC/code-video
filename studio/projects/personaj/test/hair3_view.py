"""view the hair3 fit result: the sample mask (magenta) and ours (green), with the outline of the mass (sigma 2)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json, numpy as np
sys.path.insert(0,(COMPARE_DIR)); sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from compare import project, image, silhouette
from hair_srv import Server
from PIL import Image, ImageDraw
from scipy import ndimage
W=(PERSONAJ_DIR)
prj=project.Project(W+'/compare.json'); sp=next(s for s in prj.silhouettes if s['name']=='hair')
def mass(m): return ndimage.gaussian_filter(m.astype(float),2.0)>0.5
def view(frames, file, out, tmp):
    prm=json.load(open(file)); sv=Server()
    box=(40,0,190,130); z=3; w=(box[2]-box[0])*z; h=(box[3]-box[1])*z
    c=Image.new('RGB',(2*w+10,len(frames)*(h+18)),(0,0,0)); d=ImageDraw.Draw(c)
    for r,k in enumerate(frames):
        fpath='%s/view%02d.png'%(tmp,k); sv.render(k-1,{'__hair3':prm[str(k)]},fpath); image.clear_cache()
        Lm=image.load(prj.file('sample',k),prj.size); Lb=image.load(fpath,prj.size)
        mm=silhouette.spec_mask(Lm,sp,None); mb=silhouette.spec_mask(Lb,sp,None)
        for j,(L,ms) in enumerate(((Lm,[(mass(mm),(255,60,255))]),(Lb,[(mass(mm),(255,60,255)),(mass(mb),(60,255,60))]))):
            a=np.clip(L/200*255,0,255).astype(np.uint8); rgb=np.stack([a]*3,-1)
            for m,col in ms:
                e=m&~ndimage.binary_erosion(m); rgb[e]=col
            c.paste(Image.fromarray(rgb).crop(box).resize((w,h),Image.NEAREST),(j*(w+10),r*(h+18)+16))
        x0,y0,x1,y1=sp['box']; iu=lambda a,b:(a&b)[y0:y1,x0:x1].sum()/max(1,(a|b)[y0:y1,x0:x1].sum())
        d.text((4,r*(h+18)+2),'%d: IoU %.3f, mass IoU %.3f'%(k,iu(mm,mb),iu(mass(mm),mass(mb))),fill=(255,220,120))
    sv.close(); c.save(out)
if __name__=='__main__':
    view([int(v) for v in sys.argv[1].split(',')], sys.argv[2], sys.argv[3], sys.argv[4])
