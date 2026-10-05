"""COMPOSITION -- an absolute measurement (not a ratio: the cut ratio depended on the
baseline and had let even a small nudge pass as a cut).
Bright character mask = L>=90 and not a particle (top-hat). The fog below is L<=57,
so it does not get in. In each image: centre (x,y as a share of the frame), area %.
Cut strength = IoU of the masks at the end of shot 1 and the start of shot 3 (1 = the same place)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
def load_frames(p): return [np.asarray(Image.open(f).convert('L').resize((320,180),Image.LANCZOS),dtype=float) for f in sorted(glob.glob(p))]
def mask(L):
    z=(L-ndimage.median_filter(L,size=9))>28
    m=(L>=90)&~z
    return ndimage.binary_opening(m,np.ones((2,2)))
def measure(L):
    m=mask(L); ys,xs=np.nonzero(m)
    if len(xs)<20: return None
    return xs.mean()/320, ys.mean()/180, m.mean()*100
def iou(a,b):
    a,b=mask(a),mask(b); return (a&b).sum()/max(1,(a|b).sum())
def report(F,name):
    r=[measure(L) for L in F]
    k1=[v for v in r[0:11] if v]; k3=[v for v in r[13:22] if v]
    m1=np.mean(k1,0); m3=np.mean(k3,0)
    print("--- %s ---"%name)
    print("  shot 1 centre (%.2f, %.2f) area %.1f%%"%tuple(m1))
    print("  shot 3 centre (%.2f, %.2f) area %.1f%%   y within shot 3: %.2f -> %.2f"%(*m3, r[13][1], r[21][1]))
    print("  centre shift 1->3: %.2f frame width"%np.hypot(m3[0]-m1[0],(m3[1]-m1[1])*180/320))
    print("  IoU(11, 14) = %.2f   [1 = the same place]"%iou(F[10],F[13]))
if __name__=="__main__":
    report(load_frames((SAMPLE_DIR + '/k??.png')),"SAMPLE")
    report(load_frames((PERSONAJ_DIR + '/ff/??.png')),"OURS")
    M=load_frames((SAMPLE_DIR + '/k??.png'))
    print("\n  broken case: an image with itself, IoU %.2f [1.00]"%iou(M[10],M[10]))
