"""Tune the tremor (BOIL_AMP) and the sway (SWAY) to fit the sample's boil ladder."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
import subprocess, os, sys, glob, itertools, numpy as np, warnings
warnings.filterwarnings('ignore')
sys.path.insert(0,(PERSONAJ_DIR + '/test'))
from boil import load_frames, shifts, figure_mask
GOAL={'1':{'h1':0.80,'q1':1.32,'q2':2.31},'3':{'h1':0.90,'q1':1.74,'q2':2.06}}
def ladder(F,m):
    r={}
    for g in (1,2):
        q=[];h=[]
        for i in range(len(F)-g):
            s=shifts(F[i],F[i+g],m)
            if len(s)<4: continue
            med=np.median(s,0); q.append(np.median(np.hypot(*(s-med).T))); h.append(np.hypot(*med))
        r['h%d'%g]=np.median(h); r['q%d'%g]=np.median(q)
    return r
def attempt(env):
    e={**os.environ,**{k:str(v) for k,v in env.items()}}
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=(PERSONAJ_DIR),env=e,check=True,capture_output=True)
    ours=sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png'))); out={}
    for k,ix in (('1',range(0,11)),('3',range(13,22))):
        F=load_frames([ours[i] for i in ix]); out[k]=ladder(F,figure_mask(F))
    return out
def error(o): return sum(abs(o[k][m]-GOAL[k][m])/GOAL[k][m] for k in GOAL for m in ('q1','q2'))/4
optimum=None
for q,c in itertools.product(*[[float(x) for x in a.split(',')] for a in sys.argv[1:3]]):
    o=attempt({'BOIL_AMP':q,'SWAY':c}); e=error(o)
    print("BOIL_AMP=%.1f SWAY=%.3f | shot 1 q %.2f/%.2f h %.2f | shot 3 q %.2f/%.2f h %.2f | error %.3f"%(q,c,o['1']['q1'],o['1']['q2'],o['1']['h1'],o['3']['q1'],o['3']['q2'],o['3']['h1'],e),flush=True)
    if optimum is None or e<optimum[0]: optimum=(e,q,c)
print("SAMPLE          | shot 1 q 1.32/2.31 h 0.80 | shot 3 q 1.74/2.06 h 0.90")
print("CLOSEST: BOIL_AMP=%.1f SWAY=%.3f  error %.3f"%(optimum[1],optimum[2],optimum[0]))
