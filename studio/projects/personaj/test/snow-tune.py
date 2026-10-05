"""Tuning the snow knobs: renders, measures with test/snow.py, compares with the sample."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import subprocess, sys, os, itertools, numpy as np
sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from snow import load_result, measure
M=measure(load_result((SAMPLE_DIR + '/k??.png')))
def error(r):
    zp,tp,ol,b=r
    e1=np.abs(zp-M[0]).mean()/M[0].mean()                      # density profile
    e2=sum(abs(ol[k]-M[2][k]) for k in ol)/100                   # size distribution
    return e1+e2, e1, e2
def attempt(env):
    e={**os.environ,**{k:str(v) for k,v in env.items()}}
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),env=e,check=True,capture_output=True)
    return measure(load_result((PERSONAJ_DIR + '/ff/??.png')))
optimum=None
grid=[dict(zip(['SNOW_N','SNOW_R','SNOW_A'],v)) for v in itertools.product(*[[float(x) for x in a.split(',')] for a in sys.argv[1:4]])]
for g in grid:
    r=attempt(g); E,e1,e2=error(r)
    print("N=%.2f R=%.2f A=%.2f | density %s | size %4.1f/%4.1f/%4.1f | error %.3f (profile %.3f, size %.3f)"%(
        g['SNOW_N'],g['SNOW_R'],g['SNOW_A']," ".join("%5.2f"%v for v in r[0]),*r[2].values(),E,e1,e2),flush=True)
    if optimum is None or E<optimum[0]: optimum=(E,g)
print("\nCLOSEST:",optimum[1],"error %.3f"%optimum[0])
print("SAMPLE      density", " ".join("%5.2f"%v for v in M[0]), "| size %4.1f/%4.1f/%4.1f"%tuple(M[2].values()))
