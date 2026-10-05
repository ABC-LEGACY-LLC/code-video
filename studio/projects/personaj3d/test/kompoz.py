"""KOMPOZITSIYA (3D) -- misol bilan bir xil kod: yorug' personaj niqobi (soch + yuz) personaj/test/kompozitsiya.py
dagi niqob() (L>=90, top-hat bilan qor zarrasi emas, 2x2 ochish). Har tasvir: markaz (kadr ulushida), chegaralar
(1- va 99-persentil, zarra qoldig'iga chidamli), maydon %. Ikkala tomon 320x180 LANCZOS, keyin L."""
import sys, glob, numpy as np
sys.path.insert(0, '/home/claude/work/personaj/test')
from kompozitsiya import niqob
from PIL import Image

def yuk(p):
    return [np.asarray(Image.open(f).convert('L').resize((320, 180), Image.LANCZOS), dtype=float) for f in sorted(glob.glob(p))]

def olch(L):
    m = niqob(L); ys, xs = np.nonzero(m)
    if len(xs) < 20: return None
    return dict(cx=xs.mean() / 320, cy=ys.mean() / 180, x0=np.percentile(xs, 1) / 320, x1=np.percentile(xs, 99) / 320,
                y0=np.percentile(ys, 1) / 180, y1=np.percentile(ys, 99) / 180, a=m.mean() * 100)

SHOT = [(0, 11), (11, 13), (13, 22)]

def jadval(F, nom):
    r = [olch(L) for L in F]
    print('--- %s ---' % nom)
    for k, v in enumerate(r):
        print('  %2d ' % (k + 1) + ('-' if v is None else 'c(%.2f,%.2f) x %.2f-%.2f y %.2f-%.2f a %.1f%%' % (v['cx'], v['cy'], v['x0'], v['x1'], v['y0'], v['y1'], v['a'])))
    return r

def shotlar(r):
    o = []
    for a, b in SHOT:
        v = [x for x in r[a:b] if x]
        o.append({k: float(np.mean([x[k] for x in v])) for k in v[0]} if v else None)
    return o

if __name__ == '__main__':
    M = jadval(yuk('/home/claude/work/maqsad/k??.png'), 'MISOL')
    for p in sys.argv[1:]:
        B = jadval(yuk(p), p)
        for i, (m, b) in enumerate(zip(shotlar(M), shotlar(B))):
            print('  shot %d: misol c(%.2f,%.2f) a %.1f | biz c(%.2f,%.2f) a %.1f | farq dx %+.2f dy %+.2f a x%.2f' % (
                i + 1, m['cx'], m['cy'], m['a'], b['cx'], b['cy'], b['a'], b['cx'] - m['cx'], b['cy'] - m['cy'], b['a'] / m['a']))
