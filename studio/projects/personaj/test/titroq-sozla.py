"""SOCH TITROG'I (11-o'tish). Ushlangan 1..6-tasvirda misolning soch niqobi har juftda
o'zgaradi (ketma-ket IoU 0.61..0.72). Massa moslashi vaqt bo'yicha bog'langach (farq
xaritasidagi katta dog'lar yo'qoldi) bizniki 0.77..0.88 -- kam qimirlaydi. Tish uchlari
titrog'i fl (R birligida, har tasvirda o'z fazasi, flT = tasvir raqami) shu juftlar
IoU sining o'rtachasi misolnikiga teng bo'lguncha tanlanadi. Ikkala tomonda bir xil kod:
taqqos.siluet.ketma_massiv ('soch' spec'i). Render -- soch-server (toza).
python3 test/titroq-sozla.py [--yoz]"""
import sys, os, json
import numpy as np
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import loyiha, tasvir, siluet
from soch_srv import Server

W = '/home/claude/work/personaj'
TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p11/titroq'
os.makedirs(TMP, exist_ok=True)
loy = loyiha.Loyiha(W + '/taqqos.json')
SP = next(s for s in loy.siluetlar if s['nom'] == 'soch')
S3 = json.load(open(W + '/soch3-fit.json'))
T = json.load(open(W + '/tasma-fit.json')) if os.path.exists(W + '/tasma-fit.json') else {}
K = [1, 2, 3, 4, 5, 6]


def juftlar(Ls):
    return [r['iou'] for r in siluet.ketma_massiv(Ls, SP)]


mis = juftlar([tasvir.ol(loy.fayl('misol', k), loy.olcham) for k in K])
print('misol juftlar IoU', ' '.join('%.2f' % v for v in mis), " o'rtacha %.3f" % np.mean(mis))
sv = Server()
try:
    natija = {}
    for fl in (0.04, 0.05, 0.06, 0.07):      # endi: qaynash amplitudasi qay (R), fl=0 (0..0.04: 0.853 0.835 0.806 0.777 0.748)
        Ls = []
        for k in K:
            p = dict(S3[str(k)]); p['fl'] = 0; p['qay'] = fl; p['flT'] = k
            yol = '%s/t%02d.png' % (TMP, k)
            sv.render(k - 1, {'__soch3': p, '__tasma': T.get(str(k))}, yol); tasvir.kesh_tozala()
            Ls.append(tasvir.ol(yol, loy.olcham))
        b = juftlar(Ls)
        natija[fl] = np.mean(b)
        print('qay %.2f: juftlar IoU %s  o\'rtacha %.3f' % (fl, ' '.join('%.2f' % v for v in b), np.mean(b)), flush=True)
finally:
    sv.yop()
fl = min(natija, key=lambda f: abs(natija[f] - np.mean(mis)))
print('tanlandi qay =', fl)
if '--yoz' in sys.argv:
    for k in range(1, 12):
        S3[str(k)]['fl'] = 0; S3[str(k)]['qay'] = fl; S3[str(k)]['flT'] = k
    json.dump(S3, open(W + '/soch3-fit.json', 'w'), indent=1)
    print('soch3-fit.json ga yozildi')
