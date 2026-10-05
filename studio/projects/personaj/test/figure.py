"""FIGURE MAP -- where the snow is covered.
The snow falls BEHIND everything. So a block where the snow is NEVER seen
during a shot has something in front of it: the cloak, the hood or the head.
The dark cloak cannot be told from the dark sky by brightness (both are
L~20), but it can by the snow.
  - 320x180, 10x10 px blocks (32x18)
  - particle = top-hat > 28 (the same detector as in snow.py)
  - figure block = mean particle share over the shot < 0.4%
Hair tips can also remain a "particle" in the top-hat -- so the head region
is measured separately (the composition.py bright mask); this map is
mainly for the CLOAK and the HOOD."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
B=10; GX,GY=32,18
def load_frames(fl): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in fl]
def particle(L): return (L-ndimage.median_filter(L,size=9))>28
def blocks(M):
    return M.reshape(GY,B,GX,B).mean(axis=(1,3))
def cover_map(F, floor=0.010):
    """Attempt 1 (any bright point = snow) FAILED: IoU 0.65 -- hair strands
    and the eye glint are points in the top-hat too, they turned the head into "sky".
    The difference is in MOTION: snow moves ~3 px each drawing, hair and eye stay put.
    So only MOVING points are snow: a pixel lit in more than half of the shot's
    drawings is steady, i.e. the figure itself."""
    Z=np.array([particle(L) for L in F])
    steady=Z.mean(0)>0.5
    z=np.mean([blocks((m&~steady).astype(float)) for m in Z],0)
    # Attempt 2 (strictly "no snow") FAILED too: IoU 0.71 -- a block at the figure's
    # edge is partly open, snow falls on its open part, the map calls it sky.
    # Now the COVERED SHARE is scored: the snow in the block / the snow of the open
    # sky in the same row (the row's 75th percentile). The same rule as the exact mask:
    # share > 0.5 -> figure.
    ref=np.maximum(np.percentile(z,75,axis=1,keepdims=True),1e-4)
    cov=np.clip(1-z/ref,0,1)
    # Attempt 3 FAILED too (0.72): in the top rows the snow is sparse (~3%), over 11 drawings
    # some open blocks get little snow by chance -> lone "figure" blocks in the
    # sky. The real figure is ONE connected mass with no holes inside:
    # the largest connected part is taken and its holes are filled.
    m=cov>0.5
    lab,n=ndimage.label(m,structure=np.ones((3,3)))
    if n:
        sz=ndimage.sum(m,lab,range(1,n+1)); m=lab==(1+int(np.argmax(sz)))
        m=ndimage.binary_fill_holes(m)
    return m, z
def exact_mask(zs_files):
    """Our EXACT figure: a pixel that differs from the background gradient in a frame with no particles.
    The background is the same across each row (CSS gradient) -- taken from a column at the right edge."""
    out=[]
    for f in zs_files:
        L=np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float)
        bg=np.median(L[:,312:318],axis=1,keepdims=True)
        out.append(blocks((np.abs(L-bg)>4).astype(float))>0.5)
    return np.mean(out,0)>0.5
def draw(m, name):
    print(name); [print("   "+"".join("#" if v else "." for v in r)) for r in m]
def iou(a,b): return (a&b).sum()/max(1,(a|b).sum())
if __name__=="__main__":
    sample=sorted(glob.glob((SAMPLE_DIR + '/k??.png')))
    ours=sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png')))
    ours_clean=sorted(glob.glob((PERSONAJ_DIR + '/ff-zs/??.png')))
    # CALIBRATION: our shot 1, map vs exact mask
    xb,_=cover_map(load_frames(ours[0:11])); an=exact_mask(ours_clean[0:11])
    print("CALIBRATION (our shot 1): map and exact mask IoU = %.2f   [must be >=0.80]  %s"%(iou(xb,an),'OK' if iou(xb,an)>=0.8 else 'FAILED'))
    print("   map coverage %.1f%%, exact mask %.1f%%"%(xb.mean()*100,an.mean()*100))
    # BROKEN CASE: a sequence with no figure -- the map must be empty
    rng=np.random.default_rng(5); U=[]
    for _ in range(11):
        f=np.full((180,320),10.0); ys=rng.integers(0,180,2400); xs=rng.integers(0,320,2400); f[ys,xs]=190; U.append(f)
    zb,_=cover_map(U); print("BROKEN CASE (snow with no figure): figure blocks %.1f%%  [~0]  %s"%(zb.mean()*100,'OK' if zb.mean()<0.02 else 'FAILED'))
    xm,_=cover_map(load_frames(sample[0:11]))
    print("\nSHOT 1:  sample coverage %.1f%%   ours %.1f%%   IoU %.2f"%(xm.mean()*100,xb.mean()*100,iou(xm,xb)))
    draw(xm,"sample"); draw(xb,"ours")
    if len(sys.argv)>1 and sys.argv[1]=='3':
        xm3,_=cover_map(load_frames(sample[13:22])); xb3,_=cover_map(load_frames(ours[13:22]))
        print("\nSHOT 3:  sample coverage %.1f%%   ours %.1f%%   IoU %.2f"%(xm3.mean()*100,xb3.mean()*100,iou(xm3,xb3)))
        draw(xm3,"sample"); draw(xb3,"ours")
