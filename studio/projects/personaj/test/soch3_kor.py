"""soch3 moslash natijasini ko'rish: misol niqobi (magenta) va biz (yashil), massa (sigma 2) chizig'i bilan"""
import sys, json, numpy as np
sys.path.insert(0,'/home/claude/work/mono/taqqos'); sys.path.insert(0,'/home/claude/work/personaj/test')
from taqqos import loyiha, tasvir, siluet
from soch_srv import Server
from PIL import Image, ImageDraw
from scipy import ndimage
W='/home/claude/work/personaj'
loy=loyiha.Loyiha(W+'/taqqos.json'); sp=next(s for s in loy.siluetlar if s['nom']=='soch')
def massa(m): return ndimage.gaussian_filter(m.astype(float),2.0)>0.5
def kor(kadrlar, fayl, chiq, tmp):
    prm=json.load(open(fayl)); sv=Server()
    box=(40,0,190,130); z=3; w=(box[2]-box[0])*z; h=(box[3]-box[1])*z
    c=Image.new('RGB',(2*w+10,len(kadrlar)*(h+18)),(0,0,0)); d=ImageDraw.Draw(c)
    for r,k in enumerate(kadrlar):
        yol='%s/kor%02d.png'%(tmp,k); sv.render(k-1,{'__soch3':prm[str(k)]},yol); tasvir.kesh_tozala()
        Lm=tasvir.ol(loy.fayl('misol',k),loy.olcham); Lb=tasvir.ol(yol,loy.olcham)
        mm=siluet.spec_niqob(Lm,sp,None); mb=siluet.spec_niqob(Lb,sp,None)
        for j,(L,ms) in enumerate(((Lm,[(massa(mm),(255,60,255))]),(Lb,[(massa(mm),(255,60,255)),(massa(mb),(60,255,60))]))):
            a=np.clip(L/200*255,0,255).astype(np.uint8); rgb=np.stack([a]*3,-1)
            for m,col in ms:
                e=m&~ndimage.binary_erosion(m); rgb[e]=col
            c.paste(Image.fromarray(rgb).crop(box).resize((w,h),Image.NEAREST),(j*(w+10),r*(h+18)+16))
        x0,y0,x1,y1=sp['quti']; iu=lambda a,b:(a&b)[y0:y1,x0:x1].sum()/max(1,(a|b)[y0:y1,x0:x1].sum())
        d.text((4,r*(h+18)+2),'%d: IoU %.3f, massa IoU %.3f'%(k,iu(mm,mb),iu(massa(mm),massa(mb))),fill=(255,220,120))
    sv.yop(); c.save(chiq)
if __name__=='__main__':
    kor([int(v) for v in sys.argv[1].split(',')], sys.argv[2], sys.argv[3], sys.argv[4])
