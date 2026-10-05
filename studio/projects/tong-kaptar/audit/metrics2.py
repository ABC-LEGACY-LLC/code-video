# Pass 1b per-frame scan for the rebuild: whole-frame diff, boy-restricted diff, centroids, probes.
import json, sys, numpy as np
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else 'scan1'
N = 96
lum = lambda p: (lambda a: 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])(np.asarray(Image.open(p).convert('RGB'), dtype=np.float32))
alpha = lambda p, th=24: np.asarray(Image.open(p).convert('RGBA'))[..., 3] > th
pr = json.load(open(f'{D}/probes.json'))
rows = []; prev = None
for i in range(N):
    L = lum(f'{D}/full/f{i:03d}.png'); B = alpha(f'{D}/boy/f{i:03d}.png'); Hm = alpha(f'{D}/hero/f{i:03d}.png')
    r = {'i': i}
    if prev is not None:
        pL, pB, pH = prev
        d = np.abs(L - pL); u = B | pB
        r['diff'] = float(d.mean()); r['inkDiff'] = float(d[u].mean()); r['boyXor'] = int((B ^ pB).sum())
        bg = ~(u | Hm | pH); r['bgDiff'] = float(d[bg].mean())
    ys, xs = np.nonzero(B); r['boyC'] = (float(xs.mean()), float(ys.mean())); r['boyBox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    if Hm.any():
        ys, xs = np.nonzero(Hm); r['heroC'] = (float(xs.mean()), float(ys.mean())); r['heroArea'] = int(Hm.sum()); r['heroBox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    rows.append(r); prev = (L, B, Hm)
json.dump(rows, open(f'{D}/metrics.json', 'w'))
print(' i  tc     diff  inkDiff boyXor bgDiff  boyC(x,y)      heroC(x,y)   heroA  LW(x,y)      RW(x,y)      head(x,y)    fwdL fwdR  hero speed')
for r, p in zip(rows, pr):
    hc = r.get('heroC', (float('nan'),) * 2)
    print(f"{r['i']:2d} {p['tc']:5.3f} {r.get('diff', 0):6.3f} {r.get('inkDiff', 0):7.2f} {r.get('boyXor', 0):6d} {r.get('bgDiff', 0):6.3f} ({r['boyC'][0]:6.1f},{r['boyC'][1]:6.1f}) ({hc[0]:6.1f},{hc[1]:6.1f}) {r.get('heroArea', 0):6d} "
          f"({p['LW']['x']:5.0f},{p['LW']['y']:5.0f}) ({p['RW']['x']:5.0f},{p['RW']['y']:5.0f}) ({p['head']['x']:5.0f},{p['head']['y']:5.0f})  {int(p['fwdL'])}    {int(p['fwdR'])}  {p.get('heroSpeed', 0):5.1f}")
