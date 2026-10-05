"""Bosh izini misolnikiga moslash: fikr-mulohaza halqasi."""
import subprocess, os, sys, glob, json, numpy as np
sys.path.insert(0,'/home/claude/work/personaj/test')
from kompozitsiya import yuk, niqob
F_IZ='/home/claude/work/personaj/izlar.json'
def iz(F):
    o=[]
    for L in F:
        yy,xx=np.nonzero(niqob(L)); o.append((xx.mean(),yy.mean()) if len(xx)>20 else (np.nan,np.nan))
    return np.array(o)
M=iz(yuk('/home/claude/work/maqsad/k??.png'))
env={**os.environ, **{k:v for k,v in (a.split('=') for a in sys.argv[2:])}}
IZ=json.load(open(F_IZ)) if os.path.exists(F_IZ) else [[0,0]]*22
for it in range(int(sys.argv[1])):
    json.dump(IZ,open(F_IZ,'w'))
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',env=env,check=True,capture_output=True)
    B=iz(yuk('/home/claude/work/personaj/ff/??.png'))
    d=(M-B)
    print("aylana %d: o'rtacha farq %.2f px, eng katta %.2f px (320 da)"%(it,np.nanmean(np.hypot(*d.T)),np.nanmax(np.hypot(*d.T))),flush=True)
    d=np.nan_to_num(d)*540/320*0.8                     # 0.8 -- oshib ketmaslik uchun
    # 6-o'tish: IZ_DAN (muhit) dan oldingi tasvirlar o'zgarmaydi -- 1-kadr endi
    # YUZ izi bo'yicha joylanadi (test/yuz-joy.mjs), soch markazi bo'yicha emas.
    DAN=int(os.environ.get('IZ_DAN','0'))
    IZ=[[round(IZ[i][0]+(d[i][0] if i>=DAN else 0),2),round(IZ[i][1]+(d[i][1] if i>=DAN else 0),2)] for i in range(22)]
json.dump(IZ,open(F_IZ,'w'))
subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',env=env,check=True,capture_output=True)
B=iz(yuk('/home/claude/work/personaj/ff/??.png')); d=M-B
print("YAKUN: o'rtacha farq %.2f px, eng katta %.2f px"%(np.nanmean(np.hypot(*d.T)),np.nanmax(np.hypot(*d.T))))
