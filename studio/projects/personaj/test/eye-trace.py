"""SHOT 1: the near eye TRACE (pass 9). The centre of the eye's dark component (L<36,
from the near-eye seed) is measured with the SAME code on the sample and on ours;
the difference is added to the head position (traces.json, 0..10). The earlier anchors
were read by eye from a 5x grid (test/face-place.mjs) -- in images 8..10 a 3..6 px error."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import subprocess, json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import label
M=(SAMPLE_DIR + '/k%02d.png'); B=(PERSONAJ_DIR + '/ff/%02d.png')
F=(PERSONAJ_DIR + '/traces.json')
def centre(a, seed, thr=36, box=(82,124,36,60)):
    x0,x1,y0,y1=box
    m=np.zeros_like(a,bool); m[y0:y1,x0:x1]=a[y0:y1,x0:x1]<thr
    lab,n=label(m); sx,sy=seed
    win=a[sy-4:sy+5, sx-4:sx+5]; iy,ix=np.unravel_index(win.argmin(),win.shape)
    c=lab[sy-4+iy, sx-4+ix]
    if c==0: return None
    ys,xs=np.where(lab==c); return np.array([xs.mean(), ys.mean()])
L=lambda p: np.asarray(Image.open(p).convert('L').resize((320,180),Image.LANCZOS) if Image.open(p).size!=(320,180) else Image.open(p).convert('L')).astype(int)
seed={0:(97,47),1:(97,47),2:(97,47),3:(96,47),4:(96,47),5:(95,47),6:(97,46),7:(99,45),8:(101,45),9:(107,52),10:(111,54)}
T={i:centre(L(M%(i+1)),seed[i]) for i in seed}
print('sample:',' '.join('%d:(%.1f,%.1f)'%(i+1,*T[i]) for i in T))
import os
# the measurement must be CLEAN: our tremor and hair sway change the eye component
# in every image -- the loop had "corrected" this noise by moving the head
# (in the held images 1..6 the head jumped 1.8..2.6 px, in the sample 0.2..0.5).
ENV={**os.environ,'BOIL_AMP':'0','SWAY':'0','NO_PARTICLES':'1'}
for it in range(int(sys.argv[1]) if len(sys.argv)>1 else 3):
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),check=True,capture_output=True,env=ENV)
    IZ=json.load(open(F)); md=0; s=[]
    for i in seed:
        b=centre(L(B%i),tuple(int(v) for v in T[i].round()))
        if b is None: s.append('%d:-'%(i+1)); continue
        d=T[i]-b; md=max(md,np.hypot(*d)); s.append('%d:%+.1f,%+.1f'%(i+1,*d))
        IZ[i]=[round(IZ[i][0]+d[0]*540/320*0.85,2), round(IZ[i][1]+d[1]*540/320*0.85,2)]
    json.dump(IZ,open(F,'w')); print('round',it,'diff',' '.join(s),' max %.2f'%md, flush=True)
# the held part (1..6): in the sample the eye moves slowly and EVENLY (97.6 -> 95.4) --
# our trace should be a straight line too (a linear fit), without jumps
IZ=json.load(open(F)); t=np.arange(6)
for k in (0,1):
    a,b=np.polyfit(t,[IZ[i][k] for i in range(6)],1)
    for i in range(6): IZ[i][k]=round(float(a*i+b),2)
json.dump(IZ,open(F,'w')); print('1..6 trace made linear:', [IZ[i] for i in range(6)])
subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),check=True,capture_output=True)
