"""11-o'tish: render + asosiy o'lchovlar (bir buyruq). film.mjs -> ff/ (oddiy render) ->
ff-11t (kadr-toliq GIF yo'li) -> taqqos: soch massasi, ketma-ket (ushlangan), qosh,
yopilish, ritm, zondlar. Taqqoslash uchun 10-o'tish ff-10t bilan xuddi shu yo'l.
python3 test/olch11.py [--renderlama]"""
import sys, os, glob, io, subprocess, json
import numpy as np
from PIL import Image

W = '/home/claude/work/personaj'
S = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p11'
T = '/home/claude/work/mono/taqqos'
if '--renderlama' not in sys.argv:
    subprocess.run('node film.mjs >/dev/null && rm -rf ff && node kor3.mjs >/dev/null', shell=True, cwd=W, check=True)
    fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in sorted(glob.glob(W + '/ff/??.png'))]
    buf = io.BytesIO(); fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
    g = Image.open(io.BytesIO(buf.getvalue()))
    os.makedirs(W + '/ff-11t', exist_ok=True)
    for i in range(len(fr)):
        g.seek(i); g.convert('RGB').save('%s/ff-11t/%02d.png' % (W, i))
dup = subprocess.run("grep -o ' id=\"[^\"]*\"' film.html | sort | uniq -d | wc -l", shell=True, cwd=W, capture_output=True, text=True).stdout.strip()
print('takror id:', dup)
f = S + '/taqqos-t11.json'
q = lambda c: subprocess.run('python3 -m taqqos ' + c, shell=True, cwd=T, capture_output=True, text=True).stdout
for sp in ('soch', 'soch_osti', 'soch_ong', 'soch_yaqin_ichki', 'tana_ong'):
    print(sp + ':', q('siluet %s --nom %s --kadrlar 1-11' % (f, sp)).strip().split('\n')[-1])
k = q('siluet %s --nom soch --kadrlar 1-11 --ketma' % f).strip().split('\n')
print('\n'.join(k[1:8]))
print(q('yopilish %s --kadrlar 1-11' % f).strip().split('\n')[-1])
print('\n'.join(l for l in q('ritm %s --kadrlar 1-11' % f).split('\n') if 'butun' in l or 'juftlar' in l))
# qosh zonalari va yonoq (moslashdagi funksiyalar) -- HAQIQIY render ustida, GIF yo'lidan:
# qaynash moslashdan keyin qo'shilganda ular faqat jurnalda "aniq" edi (METOD 13)
sys.path.insert(0, T); sys.path.insert(0, W + '/test')
import importlib.util
from taqqos import tasvir as _tv
_sp = importlib.util.spec_from_file_location('fit3', W + '/test/soch3-fit.py'); F3 = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(F3)
for pap in ('ff-10t', 'ff-11t'):
    qz = []
    for k in range(1, 12):
        Lm = _tv.ol(F3.loy.fayl('misol', k), F3.loy.olcham); Lb = _tv.ol('%s/%s/%02d.png' % (W, pap, k - 1), F3.loy.olcham)
        qz.append((F3.qosh(Lb, k) - F3.qosh(Lm, k), F3.qosh2(Lb, k) - F3.qosh2(Lm, k), F3.yuz(Lb, k) - F3.yuz(Lm, k)))
    qz = np.array(qz)
    print('%s qosh zonalari (biz - misol) A: %s' % (pap, ' '.join('%+.2f' % v for v in qz[:, 0])))
    print('%s                             B: %s' % (pap, ' '.join('%+.2f' % v for v in qz[:, 1])))
    print('%s                         yonoq: %s' % (pap, ' '.join('%+.2f' % v for v in qz[:, 2])))
    print("%s o'rtacha |farq| A %.3f  B %.3f  yonoq %.3f" % ((pap,) + tuple(np.abs(qz).mean(0))))
z = q('zond %s --kadrlar 1-11' % f)
keys = ('LANGAR.x', 'LANGAR.y', 'uzoq_koz.x', 'uzoq_koz.y', 'ogiz.x', 'tasma.n%', 'yosh_yonoq.x', 'yosh_jag.y', 'soch_chap_y34.t', 'soch_ong_y24.t')
print(' '.join('%s=%s' % (l.split()[0], l.split()[-1]) for l in z.split('\n') if l.split() and l.split()[0] in keys))
open(S + '/zond-oxirgi.txt', 'w').write(z)
