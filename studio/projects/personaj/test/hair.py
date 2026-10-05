"""HAIR MEASUREMENTS -- without a threshold (the old "skin share" failed because of its choice of threshold).

 contrast : the L>40 pixels in the head box are split into 2 groups (k-means);
            bright group centre / dark group centre. No tone threshold.
 strands  : the count of local brightness peaks along the fringe rows
            (sigma 1 smoothing, peak prominence >= 10). A solid cap has
            almost no peaks.
The boxes are at 320x180: for the sample taken from the map, for ours computed from the
exact centre and R on the pose sheet."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.cluster.vq import kmeans2
from scipy.signal import find_peaks
def L_(p): return np.asarray(Image.open(p).convert('L').resize((320,180),Image.LANCZOS),dtype=float)
def contrast(L,box):
    # particles are removed (the same detector as in snow.py): otherwise
    # the snow in the box artificially raises the bright group
    x0,y0,x1,y1=box; v=L[y0:y1,x0:x1]
    zr=(v-ndimage.median_filter(v,size=9))>28
    v=v[(v>40)&~zr].reshape(-1,1)
    if len(v)<50: return None
    C,_=kmeans2(v,2,seed=3,minit='++'); C=np.sort(C.ravel())
    return float(C[1]/C[0])
def strands(L,x0,x1,rows):
    n=[]
    for y in rows:
        r=ndimage.gaussian_filter1d(L[y,x0:x1],1.0)
        p,_=find_peaks(r,prominence=10); n.append(len(p))
    return float(np.median(n))
if __name__=="__main__":
    import glob
    M=[L_(f) for f in sorted(glob.glob((SAMPLE_DIR + '/k??.png')))[:11]]
    B=[L_(f) for f in sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png')))[:11]]
    s=320/540; cx,cy,R=178*s,112*s,108*s
    bb=(int(cx-1.25*R),max(0,int(cy-1.25*R)),int(cx+1.15*R),int(cy+0.35*R))
    fr_b=range(int(cy-0.55*R),int(cy-0.05*R),3); fx_b=(int(cx-1.1*R),int(cx+1.1*R))
    print("ours: head box",bb," fringe rows",list(fr_b))
    km=np.median([contrast(L,(50,0,170,115)) for L in M]); kb=np.median([contrast(L,bb) for L in B])
    tm=np.median([strands(L,55,160,range(24,37,3)) for L in M]); tb=np.median([strands(L,*fx_b,fr_b) for L in B])
    print("               sample    ours")
    print("  contrast     %5.2f  %5.2f"%(km,kb))
    print("  strands     %5.1f  %5.1f"%(tm,tb))
    # BROKEN CASES
    U=np.full((180,320),70.0)+np.random.default_rng(1).normal(0,2,(180,320))
    print("\n  broken:   one flat tone        contrast %.2f [near 1]  %s"%(contrast(U,(50,0,170,115)),'OK' if contrast(U,(50,0,170,115))<1.15 else 'FAILED'))
    Q=np.full((180,320),20.0); Q[0:40,55:160]=105
    print("  broken:   solid cap            strands %.1f [<=1]  %s"%(strands(Q,55,160,range(24,37,3)),'OK' if strands(Q,55,160,range(24,37,3))<=1 else 'FAILED'))
    T=np.full((180,320),60.0)
    for i in range(6): T[0:40,60+i*16:68+i*16]=110
    print("  good:     6 separate strands   strands %.1f [~6]  %s"%(strands(T,55,160,range(24,37,3)),'OK' if abs(strands(T,55,160,range(24,37,3))-6)<=1 else 'FAILED'))

def tips(L, xs, ystart, hb, ytop=0):
    """THE LOWER EDGE OF THE FRINGE, seen FROM THE FACE SIDE.
    Attempt 1 (top to bottom, "the end of the first hair run") FAILED:
    it stopped in the dark gaps between strands inside the hair and in the snow at the box
    edge, and gave 9 tips for our frame with its flat edge (sample 4).
    Now: from a row inside the face (ystart) going UP, in the face's own
    columns (xs) -- the first hair met (2 rows in a row) = the edge.
    Particles are removed with a top-hat. Threshold: the midpoint of this head's k-means centres."""
    hx0,hy0,hx1,hy1=hb; v=L[hy0:hy1,hx0:hx1]
    zr=(v-ndimage.median_filter(v,size=9))>28; v=v[(v>40)&~zr].reshape(-1,1)
    C,_=kmeans2(v,2,seed=3,minit='++'); t=np.sort(C.ravel()).mean()
    Z=(L-ndimage.median_filter(L,size=9))>28
    ys=[]
    for x in xs:
        y=ystart
        while y>ytop+1 and not ((L[y,x]>=t and not Z[y,x]) and (L[y-1,x]>=t and not Z[y-1,x])): y-=1
        ys.append(y if y>ytop+1 else np.nan)
    ys=np.array(ys,float); ok=~np.isnan(ys)
    if ok.sum()<5: return None
    ys=np.interp(np.arange(len(ys)),np.where(ok)[0],ys[ok])
    s=ndimage.gaussian_filter1d(ys,0.8)
    p,_=find_peaks(s,prominence=3)
    return len(p), float(np.std(s-ndimage.gaussian_filter1d(s,6))), ys
