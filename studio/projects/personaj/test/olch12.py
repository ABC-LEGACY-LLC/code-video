"""12-o'tish (kapyushon): render + o'lchovlar (bir buyruq). film.mjs -> ff/ -> ff-12t (kadr-toliq
GIF yo'li, 480x270). OLDIN = ff-11t (11-o'tishda topshirilgan, xuddi shu yo'l). Ikkala tomon bir
xil kod: kapyushon asboblari (test/kapyushon.py), ton sinflari massa IoU (test/ton_sinf.py),
yopilish, ritm, zondlar (1-kadr o'zgarmaganini tekshirish).
python3 test/olch12.py [--renderlama]"""
import sys, os, glob, io, subprocess, json, importlib.util
import numpy as np
from PIL import Image

W = '/home/claude/work/personaj'
T = '/home/claude/work/mono/taqqos'
S = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p12'
sys.path.insert(0, T); sys.path.insert(0, W + '/test')
if '--renderlama' not in sys.argv:
    subprocess.run('node film.mjs >/dev/null && rm -rf ff && node kor3.mjs >/dev/null', shell=True, cwd=W, check=True)
    fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in sorted(glob.glob(W + '/ff/??.png'))]
    buf = io.BytesIO(); fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
    g = Image.open(io.BytesIO(buf.getvalue()))
    os.makedirs(W + '/ff-12t', exist_ok=True)
    for i in range(len(fr)):
        g.seek(i); g.convert('RGB').save('%s/ff-12t/%02d.png' % (W, i))
from taqqos import tasvir
import kapyushon as KP
import ton_sinf as F
assert F.kalibr() and KP.kalibr()

dup = subprocess.run("grep -o ' id=\"[^\"]*\"' film.html | sort | uniq -d | wc -l", shell=True, cwd=W, capture_output=True, text=True).stdout.strip()
print('takror id:', dup)
M = '/home/claude/work/maqsad/k%02d.png'
P = {'oldin': W + '/ff-11t/%02d.png', 'hozir': W + '/ff-12t/%02d.png'}
L = {t: {k: tasvir.ol((P[t] % (k - 1)) if t != 'misol' else (M % k), (320, 180)) for k in range(12, 23)} for t in ('misol', 'oldin', 'hozir')}

print('\n== kapyushon asboblari (2- va 3-kadr): maydon / markaz')
O = {t: {k: KP.olch(L[t][k]) for k in range(12, 23)} for t in L}
for nom in ('tasma', 'pona'):
    for t in ('misol', 'oldin', 'hozir'):
        v = [O[t][k][nom] for k in range(12, 23)]
        print('  %-5s %-5s maydon %s' % (nom, t, ' '.join('%4d' % (x['maydon'] if x else 0) for x in v)))
for t in ('misol', 'oldin', 'hozir'):
    print('  tasma qalinlik %-5s %s' % (t, ' '.join('%4.1f' % (O[t][k]['tasma']['qalinlik'] if O[t][k]['tasma'] else 0) for k in range(12, 23))))
for t in ('misol', 'oldin', 'hozir'):
    print('  cho\'qqi        %-5s %s' % (t, ' '.join('(%d,%d)' % O[t][k]['massa']['chuqqi'] for k in range(12, 23))))

print('\n== tasma va pona MISOLDAGI JOYIDA (misol qismi 4 px kengaytirilgan soha ichida, ikkala tomonda bir xil')
print('   sinf chegarasi): IoU. Yuqoridagi asboblar bizning yorug\' soch massamizga bog\'langan -- bizda eng katta')
print('   yorug\' qism yuz chapidagi uzun tutamlar (x 130..170), quti tasmani ko\'rmaydi (15..18-tasvir)')
from scipy import ndimage as _nd
for nom in ('tasma', 'pona'):
    for t in ('oldin', 'hozir'):
        r = []
        for k in range(12, 23):
            mm = O['misol'][k][nom]['niq']
            D = _nd.binary_dilation(mm, iterations=4)
            Lt = L[t][k]
            c = ((_nd.median_filter(Lt, 3) >= 33) & (_nd.median_filter(Lt, 3) <= 65)) if nom == 'tasma' else ((_nd.median_filter(Lt, 5) >= 6.5) & (_nd.median_filter(Lt, 5) <= 12))
            b = c & D
            r.append((mm & b).sum() / max(1, (mm | b).sum()))
        print('  %-5s %-5s IoU %s  o\'rtacha 12-13 %.2f | 14-22 %.2f' % (nom, t, ' '.join('%.2f' % v for v in r), np.mean(r[:2]), np.mean(r[2:])))

print('\n== ton sinflari, massa IoU (misolga nisbatan, ROI), o\'rtacha 12-13 | 14-22')
for t in ('oldin', 'hozir'):
    R = {c: {} for c in F.SINF}
    for k in range(12, 23):
        mis = F.Misol(k); s = F.sinflar(L[t][k])
        for c in F.SINF:
            R[c][k] = F.iou(F.massa(s[c]), mis.m[c], mis.q)
    print('  %-5s ' % t + '  '.join('%s %.2f|%.2f' % (c, np.mean([R[c][k] for k in (12, 13)]), np.mean([R[c][k] for k in range(14, 23)])) for c in F.SINF))
    print('        har tasvir J: %s' % ' '.join('%.2f' % (sum(F.VAZN[c] * (1 - R[c][k]) for c in F.SINF) / sum(F.VAZN.values())) for k in range(12, 23)))

print('\n== yorug\' soha izi (test/kompozitsiya.py niqob: L>=90, zarra emas), 12..22: markaz (x,y) va maydon %')
from kompozitsiya import niqob
for t in ('misol', 'oldin', 'hozir'):
    r = []
    for k in range(12, 23):
        m = niqob(L[t][k]); ys, xs = np.nonzero(m)
        r.append('(%3.0f,%3.0f)%4.2f' % (xs.mean(), ys.mean(), m.mean() * 100) if len(xs) > 20 else '   -   ')
    print('  %-5s %s' % (t, ' '.join(r)))
for t in ('oldin', 'hozir'):
    d = []
    for k in range(12, 23):
        a, b = niqob(L['misol'][k]), niqob(L[t][k])
        ya, xa = np.nonzero(a); yb, xb = np.nonzero(b)
        d.append(np.hypot(xb.mean() - xa.mean(), yb.mean() - ya.mean()))
    print('  %-5s markaz farqi (px): %s  o\'rtacha %.1f' % (t, ' '.join('%4.1f' % v for v in d), np.mean(d)))

tf = S + '/taqqos-t12.json'
cfg = json.load(open(W + '/taqqos.json')); cfg['biz'] = W + '/ff-12t/%02d.png'; cfg['eski'] = W + '/ff-11t/%02d.png'
json.dump(cfg, open(tf, 'w'), ensure_ascii=False)
q = lambda c: subprocess.run('python3 -m taqqos ' + c, shell=True, cwd=T, capture_output=True, text=True).stdout
print('\n== yopilish, ritm, zondlar')
for g_ in ('1-11', '12-13', '14-22'):
    print('  yopilish %s: %s' % (g_, q('yopilish %s --kadrlar %s' % (tf, g_)).strip().split('\n')[-1]))
print('\n'.join(l for l in q('ritm %s --kadrlar 1-22' % tf).split('\n') if 'kesish' in l or 'tendensiya' in l))
print('\n'.join(l for l in q('ritm %s --kadrlar 14-22' % tf).split('\n') if 'tendensiya' in l))
z = q('zond %s --kadrlar 1-11' % tf)
keys = ('LANGAR.x', 'LANGAR.y', 'uzoq_koz.x', 'uzoq_koz.y', 'ogiz.x', 'tasma.n%')
print(' '.join('%s=%s' % (l.split()[0], l.split()[-1]) for l in z.split('\n') if l.split() and l.split()[0] in keys))
# 1-kadr o'zgarmagani: XOM render (ff/ va 11-o'tish ff-11/) -- GIF yo'lida palitra butun klip
# uchun bitta bo'lgani sababli 2-3-kadr o'zgarsa 1-kadr piksellari ham dither bilan siljiydi
if os.path.isdir(W + '/ff-11'):
    d = [np.abs(np.asarray(Image.open(W + '/ff/%02d.png' % i).convert('RGB')).astype(int) - np.asarray(Image.open(W + '/ff-11/%02d.png' % i).convert('RGB')).astype(int)) for i in range(11)]
    print("1-kadr (1..11) XOM render 11-o'tish bilan: eng katta |farq| %d, o'rtacha %.4f (Chromium +-1 shovqini)" % (max(x.max() for x in d), np.mean([x.mean() for x in d])))
