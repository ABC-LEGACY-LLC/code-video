"""SNOW MEASUREMENT -- EXACTLY the same code for the sample and for ours, at 320x180.

Particle = a SMALL point brighter than the background. So that the background itself (the
violet haze at the bottom) does not count as particles, a top-hat is used: L - median(L, 9x9).
That subtracts the large smooth light and leaves only the small peaks.

  density profile : particle density per row in the right 28% of the columns (open sky
                    in every frame), split into 6 bands
  haze profile    : the (particle-free) background brightness in those columns, 6 bands
  size            : shares of the sizes of connected blobs
"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
SZ=(320,180)
def load_result(p): return [np.asarray(Image.open(f).convert("L").resize(SZ,Image.LANCZOS),dtype=float)
                      for f in sorted(glob.glob(p))]
def particle(L, floor=28):
    th=L-ndimage.median_filter(L,size=9)
    return th>floor
def measure(F):
    X0=int(320*0.72)
    Z=np.mean([particle(f)[:,X0:] for f in F],0)          # row x column, mean
    T=np.mean([ndimage.median_filter(f,size=15)[:,X0:] for f in F],0)
    band=np.array_split(np.arange(180),6)
    zp=np.array([Z[b].mean()*100 for b in band])
    tp=np.array([T[b].mean() for b in band])
    sz=[]
    for f in F:
        lab,n=ndimage.label(particle(f))
        if n: sz+=list(ndimage.sum(np.ones_like(f),lab,range(1,n+1)))
    sz=np.array(sz)
    ol={"1-3":(sz<=3).mean()*100,"4-12":((sz>3)&(sz<=12)).mean()*100,"13+":(sz>12).mean()*100}
    whole=np.mean([particle(f).mean() for f in F])*100
    return zp,tp,ol,whole
def chop(name,r):
    zp,tp,ol,b=r
    print(f"--- {name} ---")
    print("  particle density %  (top to bottom):", " ".join(f"{v:5.2f}" for v in zp),
          f"  bottom/top {zp[-1]/max(zp[0],1e-3):.2f}x")
    print("  background brightness    (top to bottom):", " ".join(f"{v:5.1f}" for v in tp),
          f"  bottom-top {tp[-1]-tp[0]:+.1f}")
    print("  blob size: " + "  ".join(f"{k} px {v:4.1f}%" for k,v in ol.items()),
          f"   particles over the whole frame {b:.2f}%")
if __name__=="__main__":
    M=load_result((SAMPLE_DIR + '/k??.png')); B=load_result((PERSONAJ_DIR + '/ff/??.png'))
    chop("SAMPLE",measure(M)); chop("OURS",measure(B))
    # BROKEN CASE: evenly scattered points -- the profile MUST come out flat
    rng=np.random.default_rng(3); U=[]
    for _ in range(10):
        f=np.full((180,320),8.0); ys=rng.integers(0,180,900); xs=rng.integers(0,320,900); f[ys,xs]=200; U.append(f)
    zp,_,_,_=measure(U)
    print(f"\n  broken case (uniform): bottom/top {zp[-1]/zp[0]:.2f}x  [must be near 1] {'OK' if abs(zp[-1]/zp[0]-1)<0.25 else 'FAILED'}")
    G=[]
    for _ in range(10):
        f=np.full((180,320),8.0); ys=(np.sqrt(rng.random(900))*179).astype(int); xs=rng.integers(0,320,900); f[ys,xs]=200; G.append(f)
    zp,_,_,_=measure(G)
    print(f"  broken case (denser toward the bottom): bottom/top {zp[-1]/zp[0]:.2f}x  [must be above 1] {'OK' if zp[-1]/zp[0]>2 else 'FAILED'}")
