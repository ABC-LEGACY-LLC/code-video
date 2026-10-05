"""SAKRASH (7-o'tish auditi): qo'shni tasvirlar farq energiyasi -- taqqos.farq bilan bir xil (har tasvir o'z o'rtacha va
std siga normallangan, |a-b|), 320x180 LANCZOS L; chap 40 % (x < 128: bosh, yuz, soch, gavda -- xaritada ko'rilgan) va
butun kadr. Misol: 9->10 0.201, 10->11 0.189, 12->13 0.025 (ushlangan). Kalibr (misol k01): o'zi bilan 0.0000; chapda
20x20 blok +60 -> chap 0.050, o'ng 0.023; o'ngda xuddi shunday -> chap 0.014, o'ng 0.039 (butun kadr normallanishi
orqali sizib o'tadi -- qor o'zgarishi chapga ham oz tushadi, ikkala tomonda bir xil); qattiq 2 px siljish -> 0.134 / 0.523.
python3 test/audit_misol/sakrash.py PAPKA [PAPKA2 ...]   (PAPKA: %03d.png 0-asosli; 'misol' -- maqsad k%02d.png)"""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos.farq import nz

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, float)

def fayl(d, k): return '/home/claude/work/maqsad/k%02d.png' % k if d == 'misol' else '%s/%03d.png' % (d, k - 1)

def xarita(d, i, j): return np.abs(nz(L(fayl(d, i))) - nz(L(fayl(d, j))))

def juftlar(d, JU=None):
    JU = JU or [(i, i + 1) for i in range(1, 22)]
    return {(i, j): float(xarita(d, i, j)[:, :128].mean()) for i, j in JU}

if __name__ == '__main__':
    for d in sys.argv[1:]:
        e = juftlar(d)
        print('%-26s ' % d.rstrip('/').split('/')[-1][:26] + ' '.join('%d-%d %.3f' % (i, j, v) for (i, j), v in e.items()))
