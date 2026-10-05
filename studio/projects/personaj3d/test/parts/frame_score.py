"""Whole-frame class IoUs from the role render (sample bits are PRIVATE: bit1 head, bit2 inner, bit16 SAM hair / bit32 SAM face not counted), per shot -- pass 13, item 6. python3 test/parts/frame_score.py role-structure13f role-structureN"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json, base64, numpy as np
from PIL import Image
R=(P3D_DIR + '/')
M=json.load(open(R+'private/test/parts/human/part_target_12.json'))['m']
SH={1:range(0,11),2:range(11,13),3:range(13,22)}
def classify(a):
    r,g,b=a[...,0],a[...,1],a[...,2]; c=np.full(r.shape,3)
    c[(r+g+b)>30]=2; c[(b>30)&(b<90)&(g<30)&((r<30)|(r<90))]=1; c[((r>30)&(g<30)&(b<30))|((g>30)&(r<30)&(b<30))]=0
    return c,(g>30)&(r<30)&(b<30)
for D in sys.argv[1:]:
    out=[]
    for s,ks in SH.items():
        I=np.zeros(3);U=np.zeros(3);It=0;Ut=0;sI=0;sU=0;yS=0;yN=0
        for k in ks:
            m=np.frombuffer(base64.b64decode(M[str(k)]),np.uint8).reshape(180,320)
            cm=np.where(m&1,0,np.where(m&2,1,np.where(m&4,2,3)))
            a=np.asarray(Image.open(R+'frames-sample/%s/%03d.png'%(D,k)).convert('RGB')).astype(int); cb,hb=classify(a)
            for c in (0,1): I[c]+=((cm==c)&(cb==c)).sum(); U[c]+=((cm==c)|(cb==c)).sum()
            It+=((cm[:60]==0)&(cb[:60]==0)).sum(); Ut+=((cm[:60]==0)|(cb[:60]==0)).sum()
            hm=(m&16)>0; yz=(m&32)>0
            sI+=(hm&hb&~yz).sum(); sU+=((hm|hb)&~yz).sum(); yN+=yz.sum(); yS+=(hb&yz&~hm).sum()
        out.append('%d: headF %.3f top %s innerF %.3f hair %.3f hairFace %.3f'%(s,I[0]/U[0],'%.3f'%(It/Ut) if s<3 else '--',I[1]/U[1],sI/sU,yS/yN))
    print('%-14s'%D,' | '.join(out))
