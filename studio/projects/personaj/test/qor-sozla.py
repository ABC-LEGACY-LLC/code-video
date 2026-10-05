"""Qor tugmalarini sozlash: chizadi, test/qor.py bilan o'lchaydi, misolga solishtiradi."""
import subprocess, sys, os, itertools, numpy as np
sys.path.insert(0,'/home/claude/work/personaj/test')
from qor import yukla, olch
M=olch(yukla('/home/claude/work/maqsad/k??.png'))
def xato(r):
    zp,tp,ol,b=r
    e1=np.abs(zp-M[0]).mean()/M[0].mean()                      # zichlik profili
    e2=sum(abs(ol[k]-M[2][k]) for k in ol)/100                   # o'lcham taqsimoti
    return e1+e2, e1, e2
def sina(env):
    e={**os.environ,**{k:str(v) for k,v in env.items()}}
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',env=e,check=True,capture_output=True)
    return olch(yukla('/home/claude/work/personaj/ff/??.png'))
eng=None
grid=[dict(zip(['QOR_N','QOR_R','QOR_A'],v)) for v in itertools.product(*[[float(x) for x in a.split(',')] for a in sys.argv[1:4]])]
for g in grid:
    r=sina(g); E,e1,e2=xato(r)
    print("N=%.2f R=%.2f A=%.2f | zich %s | o'lcham %4.1f/%4.1f/%4.1f | xato %.3f (profil %.3f, o'lcham %.3f)"%(
        g['QOR_N'],g['QOR_R'],g['QOR_A']," ".join("%5.2f"%v for v in r[0]),*r[2].values(),E,e1,e2),flush=True)
    if eng is None or E<eng[0]: eng=(E,g)
print("\nENG YAQIN:",eng[1],"xato %.3f"%eng[0])
print("MISOL      zich", " ".join("%5.2f"%v for v in M[0]), "| o'lcham %4.1f/%4.1f/%4.1f"%tuple(M[2].values()))
