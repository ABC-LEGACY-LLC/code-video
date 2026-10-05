"""LINE BOIL -- is every image redrawn?

In the figure area (where there is no snow -- from the figure map, 5 px inward), for
each 16x16 block the best shift between two consecutive images is found
(upscaled 2x, 0.5 px step, +-3 px).
  MOTION   = the MEDIAN of the block shifts (everything moves together)
  BOIL     = the median size of the deviation from that median (each block on its own)
  codec noise gives no consistent shift -- there the best shift is ~0.
Only blocks with structure (enough gradient energy) are taken."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from figure import cover_map
def load_frames(fl): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in fl]
def shifts(a,b,msk,S=12,Q=6,floor=4.0):
    A=ndimage.zoom(a,2,order=3); Bz=ndimage.zoom(b,2,order=3); M=ndimage.zoom(msk.astype(float),2,order=0)>0.5
    G=np.hypot(ndimage.sobel(A,0),ndimage.sobel(A,1))
    out=[]
    for y in range(Q,A.shape[0]-2*S-Q,2*S):
        for x in range(Q,A.shape[1]-2*S-Q,2*S):
            if M[y:y+2*S,x:x+2*S].mean()<0.9: continue
            blk=A[y:y+2*S,x:x+2*S]
            if G[y:y+2*S,x:x+2*S].mean()<floor*8: continue
            best=(1e9,0,0)
            for dy in range(-Q,Q+1):
                for dx in range(-Q,Q+1):
                    e=np.abs(Bz[y+dy:y+dy+2*S,x+dx:x+dx+2*S]-blk).mean()
                    if e<best[0]: best=(e,dx,dy)
            out.append((best[1]/2,best[2]/2))
    return np.array(out)
def measure(F,msk):
    each,boilAmp,nb=[],[],[]
    for a,b in zip(F[:-1],F[1:]):
        s=shifts(a,b,msk)
        if len(s)<4: continue
        med=np.median(s,0); r=np.hypot(*(s-med).T)
        each.append(np.hypot(*med)); boilAmp.append(np.median(r)); nb.append(len(s))
    return np.median(each), np.median(boilAmp), int(np.median(nb))
def figure_mask(F):
    """the figure map (3 px inward) + the bright area of the head (dilated by 3 px).
    In attempt 1 it was the map alone (5 px inward) -- the blocks with structure
    (hair, face) were left outside, and only 5 blocks were found in the sample."""
    sys.path.insert(0,(PERSONAJ_DIR + '/test'))
    from composition import mask
    m,_=cover_map(F); M=ndimage.binary_erosion(np.kron(m,np.ones((10,10))).astype(bool),iterations=3)
    Y=ndimage.binary_dilation(np.mean([mask(L) for L in F],0)>0.5,iterations=3)
    return M|Y
if __name__=="__main__":
    sample=sorted(glob.glob((SAMPLE_DIR + '/k??.png'))); ours=sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png')))
    Mf=load_frames(sample[0:11]); mm=figure_mask(Mf)
    # CALIBRATION
    base=Mf[0]
    rig=[np.roll(base,k,axis=1) for k in range(6)]
    h,q,n=measure(rig,mm); print("broken case -- rigid shift 1 px/image: motion %.2f  boil %.2f  [boil ~0]  %s"%(h,q,'OK' if q<0.2 else 'FAILED'))
    rng=np.random.default_rng(2); yy,xx=np.mgrid[0:180,0:320].astype(float)
    def wobble(A):
        out=[]
        for k in range(6):
            ph=rng.random(6)*6.283; w=2*np.pi/40
            dx=A*(np.sin(w*xx*0.8+w*yy*0.6+ph[0])+np.sin(-w*xx*0.5+w*yy*0.9+ph[1]))/1.41
            dy=A*(np.sin(w*xx*0.7-w*yy*0.7+ph[2])+np.sin(w*xx*0.3+w*yy*1.0+ph[3]))/1.41
            out.append(ndimage.map_coordinates(base,[yy+dy,xx+dx],order=3,mode='nearest'))
        return out
    for A in (0.5,1.0):
        h,q,n=measure(wobble(A),mm); print("synthetic boil amplitude %.1f px: measured boil %.2f"%(A,q))
    print()
    for name,F in (("SAMPLE shot 1",Mf),("SAMPLE shot 3",load_frames(sample[13:22])),("OURS shot 1",load_frames(ours[0:11])),("OURS shot 3",load_frames(ours[13:22]))):
        h,q,n=measure(F,figure_mask(F)); print("%-14s motion %.2f px   boil %.2f px   (%d blocks)"%(name,h,q,n))
