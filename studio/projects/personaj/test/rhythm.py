"""RHYTHM MEASUREMENT -- applied in EXACTLY the same way to the sample and to our frames.
Every image is brought to 320x180: the tone and difference measurements depend on size."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, glob, numpy as np
from PIL import Image
SZ=(320,180)

def load_result(specimen):
    fl=sorted(glob.glob(specimen))
    if not fl: sys.exit(f"not found: {specimen}")
    return [np.asarray(Image.open(f).convert("L").resize(SZ,Image.LANCZOS),dtype=np.float64) for f in fl]

def nz(a): return (a-a.mean())/a.std()
def diff(x,y,drop=0.0):
    d=np.abs(nz(x)-nz(y)).ravel()
    if drop>0:
        k=int(len(d)*(1-drop)); d=np.partition(d,k)[:k]
    return d.mean()

def trend(F,idx,drop=0.0):
    v=[diff(F[i],F[i+1],drop) for i in idx]
    return v[0], v[-1], (v[-1]/v[0]-1)*100

def cuts(F, threshold=1.6):
    d=np.array([diff(F[i],F[i+1]) for i in range(len(F)-1)])
    m=np.median(d)
    return [i+1 for i,v in enumerate(d) if v>m*threshold], d, m

def report(F, name, k1, k2):
    """k1 = indices of shot 1, k2 = indices of shot 3 (the start of each pair)"""
    sp,d,m=cuts(F)
    print(f"--- {name} ({len(F)} images) ---")
    print(f"  cuts               {sp}   (median diff {m:.3f})")
    if sp:
        print(f"  cut size           {max(d[i-1] for i in sp)/m:.2f}x median")
    for drop,lbl in ((0.0,'whole frame'),(0.10,'largest 10% dropped')):
        a,b,p=trend(F,k1,drop); print(f"  shot 1  {lbl:<26} {a:.3f} -> {b:.3f}  {p:+6.1f}%")
        a,b,p=trend(F,k2,drop); print(f"  shot 3  {lbl:<26} {a:.3f} -> {b:.3f}  {p:+6.1f}%")
    y=[f.mean() for f in F]
    print(f"  brightness shot 1  {np.mean(y[0:11]):.2f}")
    print(f"  brightness shot 3  {y[13]:.2f} -> {y[21]:.2f}  ({(y[21]/y[13]-1)*100:+.1f}%)")
    print(f"  shot ratio         shot 3/shot 1 brightness {np.mean(y[13:22])/np.mean(y[0:11]):.3f}")
    return d,m

if __name__=='__main__':
    K1,K2=range(0,10), range(13,21)
    M=load_result((SAMPLE_DIR + '/k??.png'))
    B=load_result((PERSONAJ_DIR + '/ff/??.png'))
    dm,mm=report(M,'SAMPLE',K1,K2); print()
    db,mb=report(B,'OURS',K1,K2)
    print("\n--- BROKEN CASES OF THE MEASUREMENT ---")
    for name,F in (('SAMPLE',M),('OURS',B)):
        sp,_,_=cuts(F[13:22])
        print(f"  {name}: shot 3 only (no cut) -> peaks {sp}  [must be empty]  {'OK' if not sp else 'FAILED'}")
    # UNIFORM motion: we shift one image by 2 px each time.
    # The trend measurement MUST come out near 0 here -- otherwise it is
    # measuring something other than the motion.
    trial=[np.roll(M[5],2*k,axis=1) for k in range(9)]
    sp,_,_=cuts(trial)
    print(f"  uniform motion -> peaks {sp}  [empty]  {'OK' if not sp else 'FAILED'}")
    a,b,p=trend(trial,range(0,7))
    print(f"  trend of the uniform motion {p:+.1f}%  [near 0]  {'OK' if abs(p)<3 else 'FAILED'}")
    # ACCELERATING motion: step 1,2,3... px. The trend must come out positive.
    pos=np.cumsum(np.arange(1,10)); fast=[np.roll(M[5],int(v),axis=1) for v in pos]
    a,b,p=trend(fast,range(0,7))
    print(f"  deliberately accelerated motion {p:+.1f}%  [must be positive]  {'OK' if p>5 else 'FAILED'}")
