"""Fitting the head trace to the sample's: a feedback loop."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import subprocess, os, sys, glob, json, numpy as np
sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from composition import load_frames, mask
F_TRACES=(PERSONAJ_DIR + '/traces.json')
def iz(F):
    o=[]
    for L in F:
        yy,xx=np.nonzero(mask(L)); o.append((xx.mean(),yy.mean()) if len(xx)>20 else (np.nan,np.nan))
    return np.array(o)
M=iz(load_frames((SAMPLE_DIR + '/k??.png')))
env={**os.environ, **{k:v for k,v in (a.split('=') for a in sys.argv[2:])}}
IZ=json.load(open(F_TRACES)) if os.path.exists(F_TRACES) else [[0,0]]*22
for it in range(int(sys.argv[1])):
    json.dump(IZ,open(F_TRACES,'w'))
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),env=env,check=True,capture_output=True)
    B=iz(load_frames((PERSONAJ_DIR + '/ff/??.png')))
    d=(M-B)
    print("round %d: mean diff %.2f px, largest %.2f px (at 320)"%(it,np.nanmean(np.hypot(*d.T)),np.nanmax(np.hypot(*d.T))),flush=True)
    d=np.nan_to_num(d)*540/320*0.8                     # 0.8 -- so as not to overshoot
    # pass 6: the images before TRACE_FROM (environment) do not change -- shot 1 is now
    # placed by the FACE trace (test/face-place.mjs), not by the hair centre.
    FROM=int(os.environ.get('TRACE_FROM','0'))
    IZ=[[round(IZ[i][0]+(d[i][0] if i>=FROM else 0),2),round(IZ[i][1]+(d[i][1] if i>=FROM else 0),2)] for i in range(22)]
json.dump(IZ,open(F_TRACES,'w'))
subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),env=env,check=True,capture_output=True)
B=iz(load_frames((PERSONAJ_DIR + '/ff/??.png'))); d=M-B
print("FINAL: mean diff %.2f px, largest %.2f px"%(np.nanmean(np.hypot(*d.T)),np.nanmax(np.hypot(*d.T))))
