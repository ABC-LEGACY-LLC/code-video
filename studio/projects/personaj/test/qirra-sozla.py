"""3-kadr: har tasvirda qirra cho'zilishini misolning yorug' soch maydoniga moslash."""
import subprocess, os, sys, glob, json, numpy as np
sys.path.insert(0,'/home/claude/work/personaj/test')
from kompozitsiya import yuk, niqob
from scipy import ndimage
F_Q='/home/claude/work/personaj/qirra.json'
def st(L):
    z=(L-ndimage.median_filter(L,size=9))>28
    return niqob(L).mean()*100, (((L>=55)&(L<90))&~z)[:, :200].mean()*100
M=[st(L) for L in yuk('/home/claude/work/maqsad/k??.png')[13:22]]
env={**os.environ, **{k:v for k,v in (a.split('=') for a in sys.argv[2:])}}
Q=json.load(open(F_Q)) if os.path.exists(F_Q) else [0.0]*9
for it in range(int(sys.argv[1])+1):
    json.dump([round(q,3) for q in Q],open(F_Q,'w'))
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',env=env,check=True,capture_output=True)
    B=[st(L) for L in yuk('/home/claude/work/personaj/ff/??.png')[13:22]]
    d=[M[i][0]-B[i][0] for i in range(9)]
    print("aylana %d: yorug' soch  misol %s\n          biz   %s   | yuz-ton o'rtacha misol %.1f biz %.1f"%(
        it," ".join("%.2f"%m[0] for m in M)," ".join("%.2f"%b[0] for b in B),np.mean([m[1] for m in M]),np.mean([b[1] for b in B])),flush=True)
    Q=[float(np.clip(Q[i]-0.35*d[i],-1.2,1.3)) for i in range(9)]   # soch kam bo'lsa qirrani orqaga tortish
