"""1-KADR: yaqin ko'z IZI (9-o'tish). Ko'zning qorong'i komponentasi (L<36,
yaqin ko'z urug'idan) markazi misolda va bizda BIR XIL kod bilan o'lchanadi;
farq bosh joyiga (izlar.json, 0..10) qo'shiladi. Avvalgi langarlar 5x to'rdan
ko'z bilan o'qilgan edi (test/yuz-joy.mjs) -- 8..10-tasvirda 3..6 px xato."""
import subprocess, json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import label
M='/home/claude/work/maqsad/k%02d.png'; B='/home/claude/work/personaj/ff/%02d.png'
F='/home/claude/work/personaj/izlar.json'
def markaz(a, seed, thr=36, box=(82,124,36,60)):
    x0,x1,y0,y1=box
    m=np.zeros_like(a,bool); m[y0:y1,x0:x1]=a[y0:y1,x0:x1]<thr
    lab,n=label(m); sx,sy=seed
    win=a[sy-4:sy+5, sx-4:sx+5]; iy,ix=np.unravel_index(win.argmin(),win.shape)
    c=lab[sy-4+iy, sx-4+ix]
    if c==0: return None
    ys,xs=np.where(lab==c); return np.array([xs.mean(), ys.mean()])
L=lambda p: np.asarray(Image.open(p).convert('L').resize((320,180),Image.LANCZOS) if Image.open(p).size!=(320,180) else Image.open(p).convert('L')).astype(int)
urug={0:(97,47),1:(97,47),2:(97,47),3:(96,47),4:(96,47),5:(95,47),6:(97,46),7:(99,45),8:(101,45),9:(107,52),10:(111,54)}
T={i:markaz(L(M%(i+1)),urug[i]) for i in urug}
print('misol:',' '.join('%d:(%.1f,%.1f)'%(i+1,*T[i]) for i in T))
import os
# o'lchov TOZA bo'lsin: bizning titroq va soch chayqalishi ko'z komponentasini
# har tasvirda o'zgartiradi -- halqa bu shovqinni boshni surib "tuzatgan" edi
# (ushlangan 1..6-tasvirlarda bosh 1.8..2.6 px sakradi, misolda 0.2..0.5).
ENV={**os.environ,'QAY':'0','CHAYQ':'0','ZARRASIZ':'1'}
for it in range(int(sys.argv[1]) if len(sys.argv)>1 else 3):
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',check=True,capture_output=True,env=ENV)
    IZ=json.load(open(F)); md=0; s=[]
    for i in urug:
        b=markaz(L(B%i),tuple(int(v) for v in T[i].round()))
        if b is None: s.append('%d:-'%(i+1)); continue
        d=T[i]-b; md=max(md,np.hypot(*d)); s.append('%d:%+.1f,%+.1f'%(i+1,*d))
        IZ[i]=[round(IZ[i][0]+d[0]*540/320*0.85,2), round(IZ[i][1]+d[1]*540/320*0.85,2)]
    json.dump(IZ,open(F,'w')); print('aylana',it,'farq',' '.join(s),' max %.2f'%md, flush=True)
# ushlangan qism (1..6): misolda ko'z sekin, TEKIS siljiydi (97.6 -> 95.4) --
# bizning iz ham to'g'ri chiziq bo'lsin (chiziqli moslash), sakrashsiz
IZ=json.load(open(F)); t=np.arange(6)
for k in (0,1):
    a,b=np.polyfit(t,[IZ[i][k] for i in range(6)],1)
    for i in range(6): IZ[i][k]=round(float(a*i+b),2)
json.dump(IZ,open(F,'w')); print('1..6 iz chiziqli:', [IZ[i] for i in range(6)])
subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd='/home/claude/work/personaj',check=True,capture_output=True)
