"""1-KADR BOSH IZI -- QATTIQ nishonlar bo'yicha (9-o'tish, taqqos zondlari).

Avvalgi iz (test/koz-iz.py) yaqin ko'zning qorong'i komponentasiga bog'langan edi.
taqqos zond jadvali ko'rsatdi: misolda 1..6-tasvirda uzoq chet x=130.3, iyak oldi
129.6, jag' osti y=109.7 -- o'ndan bir pikselgacha BIR XIL (rasm ushlangan), faqat
ko'z komponentasi 97.6 -> 95.4 suriladi (soch tutami ko'zdan siljiydi, ko'z yoshi
yig'iladi). Ko'zga bog'langan iz boshni shu shakl o'zgarishiga ergashtirib, 2..4 px
surgan edi. Endi: dx = uzoq chet va iyak oldi farqlari medianasi, dy = jag' osti
farqlari medianasi; o'lchov toza (titroqsiz, chayqalishsiz, qorsiz); 1..6 bir xil."""
import subprocess, json, os, sys
import numpy as np
sys.path.insert(0,'/home/claude/work/mono/taqqos')
from taqqos import loyiha, zond, tasvir
W='/home/claude/work/personaj'; F=W+'/izlar.json'
loy=loyiha.Loyiha(W+'/taqqos.json')
ENV={**os.environ,'QAY':'0','CHAYQ':'0','ZARRASIZ':'1'}
DX=('uzoq_chet_y20','uzoq_chet_y30','iyak_oldi_y52'); DY=('jag_osti_x8','jag_osti_x20','jag_osti_x28')
K=list(range(1,12))
def olch():
    tasvir.kesh_tozala(); n=zond.yugur(loy,K); o={}
    for k in K:
        dx=[n['zond'][z][k]['misol']['x']-n['zond'][z][k]['biz']['x'] for z in DX if n['zond'][z].get(k) and n['zond'][z][k]['misol'] and n['zond'][z][k]['biz']]
        dy=[n['zond'][z][k]['misol']['y']-n['zond'][z][k]['biz']['y'] for z in DY if n['zond'][z].get(k) and n['zond'][z][k]['misol'] and n['zond'][z][k]['biz']]
        o[k]=(float(np.median(dx)) if dx else 0.0, float(np.median(dy)) if dy else 0.0)
    return o
for it in range(int(sys.argv[1]) if len(sys.argv)>1 else 3):
    subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd=W,check=True,capture_output=True,env=ENV)
    d=olch(); IZ=json.load(open(F))
    for k in K:
        IZ[k-1]=[round(IZ[k-1][0]+d[k][0]*540/320*0.85,2), round(IZ[k-1][1]+d[k][1]*540/320*0.85,2)]
    # 1..6 ushlangan: bitta joy (o'rtachasi)
    m=[float(np.mean([IZ[i][c] for i in range(6)])) for c in (0,1)]
    for i in range(6): IZ[i]=[round(m[0],2),round(m[1],2)]
    json.dump(IZ,open(F,'w'))
    print('aylana',it,' '.join('%d:%+.1f,%+.1f'%(k,*d[k]) for k in K),' max %.2f'%max(np.hypot(*d[k]) for k in K),flush=True)
subprocess.run('node film.mjs && rm -rf ff && node kor3.mjs',shell=True,cwd=W,check=True,capture_output=True)
d=olch(); print('YAKUN (titroq bilan):',' '.join('%d:%+.1f,%+.1f'%(k,*d[k]) for k in K))
