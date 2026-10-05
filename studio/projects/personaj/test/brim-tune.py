"""Shot 3: on every drawing, fit the brim stretch to the sample's lit hair area."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import subprocess, os, sys, glob, json, numpy as np
sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from composition import load_frames, mask
from scipy import ndimage
F_Q=(PERSONAJ_DIR + '/brim.json')
def st(L):
    z=(L-ndimage.median_filter(L,size=9))>28
    return mask(L).mean()*100, (((L>=55)&(L<90))&~z)[:, :200].mean()*100
M=[st(L) for L in load_frames((SAMPLE_DIR + '/k??.png'))[13:22]]
env={**os.environ, **{k:v for k,v in (a.split('=') for a in sys.argv[2:])}}
Q=json.load(open(F_Q)) if os.path.exists(F_Q) else [0.0]*9
for it in range(int(sys.argv[1])+1):
    json.dump([round(q,3) for q in Q],open(F_Q,'w'))
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),env=env,check=True,capture_output=True)
    B=[st(L) for L in load_frames((PERSONAJ_DIR + '/ff/??.png'))[13:22]]
    d=[M[i][0]-B[i][0] for i in range(9)]
    print("round %d: lit hair  sample %s\n          ours   %s   | face-tone mean sample %.1f ours %.1f"%(
        it," ".join("%.2f"%m[0] for m in M)," ".join("%.2f"%b[0] for b in B),np.mean([m[1] for m in M]),np.mean([b[1] for b in B])),flush=True)
    Q=[float(np.clip(Q[i]-0.35*d[i],-1.2,1.3)) for i in range(9)]   # too little hair: pull the brim back
