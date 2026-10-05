"""Titroq (QAY) va chayqalish (CHAYQ) ni misolning qaynash narvoniga moslab sozlash."""
import subprocess, os, sys, glob, itertools, numpy as np, warnings
warnings.filterwarnings('ignore')
sys.path.insert(0,'/home/claude/work/personaj/test')
from qaynash import yuk, siljishlar, figura_niqobi
MAQ={'1':{'h1':0.80,'q1':1.32,'q2':2.31},'3':{'h1':0.90,'q1':1.74,'q2':2.06}}
def narvon(F,m):
    r={}
    for g in (1,2):
        q=[];h=[]
        for i in range(len(F)-g):
            s=siljishlar(F[i],F[i+g],m)
            if len(s)<4: continue
            med=np.median(s,0); q.append(np.median(np.hypot(*(s-med).T))); h.append(np.hypot(*med))
        r['h%d'%g]=np.median(h); r['q%d'%g]=np.median(q)
    return r
def sina(env):
    e={**os.environ,**{k:str(v) for k,v in env.items()}}
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',env=e,check=True,capture_output=True)
    biz=sorted(glob.glob('/home/claude/work/personaj/ff/??.png')); out={}
    for k,ix in (('1',range(0,11)),('3',range(13,22))):
        F=yuk([biz[i] for i in ix]); out[k]=narvon(F,figura_niqobi(F))
    return out
def xato(o): return sum(abs(o[k][m]-MAQ[k][m])/MAQ[k][m] for k in MAQ for m in ('q1','q2'))/4
eng=None
for q,c in itertools.product(*[[float(x) for x in a.split(',')] for a in sys.argv[1:3]]):
    o=sina({'QAY':q,'CHAYQ':c}); e=xato(o)
    print("QAY=%.1f CHAYQ=%.3f | 1-kadr q %.2f/%.2f h %.2f | 3-kadr q %.2f/%.2f h %.2f | xato %.3f"%(q,c,o['1']['q1'],o['1']['q2'],o['1']['h1'],o['3']['q1'],o['3']['q2'],o['3']['h1'],e),flush=True)
    if eng is None or e<eng[0]: eng=(e,q,c)
print("MISOL          | 1-kadr q 1.32/2.31 h 0.80 | 3-kadr q 1.74/2.06 h 0.90")
print("ENG YAQIN: QAY=%.1f CHAYQ=%.3f  xato %.3f"%(eng[1],eng[2],eng[0]))
