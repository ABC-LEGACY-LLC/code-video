# Pass 1b per-frame scan: whole-frame diff, subject-restricted diff, centroid/bbox, state probes.
import json, sys, numpy as np
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else 'scan0'
N = 96
def lum(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=np.float32)
    return 0.2126*a[...,0] + 0.7152*a[...,1] + 0.0722*a[...,2]
def alpha(p):
    return np.asarray(Image.open(p).convert('RGBA'))[..., 3] > 24
pr = json.load(open(f'{D}/probes.json'))
rows = []; prevL = None; prevB = None; prevH = None
for i in range(N):
    L = lum(f'{D}/full/f{i:03d}.png'); B = alpha(f'{D}/boy/f{i:03d}.png'); Hm = alpha(f'{D}/hero/f{i:03d}.png')
    Fl = alpha(f'{D}/flag/f{i:03d}.png')
    r = {'i': i}
    if prevL is not None:
        d = np.abs(L - prevL)
        r['diff'] = d.mean()
        u = B | prevB; r['inkDiff'] = d[u].mean() if u.any() else 0
        # boy-only change: pixels where the boy silhouette itself changed
        r['boyXor'] = (B ^ prevB).sum()
        uf = Fl | prevFl; r['flagDiff'] = d[uf].mean() if uf.any() else 0
        # background (not boy, not hero, not flag)
        bg = ~(u | Hm | prevH | uf); r['bgDiff'] = d[bg].mean()
    ys, xs = np.nonzero(B)
    r['boyInk'] = B.mean(); r['boyC'] = (xs.mean(), ys.mean()); r['boyBox'] = (xs.min(), ys.min(), xs.max(), ys.max())
    if Hm.any():
        ys, xs = np.nonzero(Hm); r['heroC'] = (xs.mean(), ys.mean()); r['heroBox'] = (xs.min(), ys.min(), xs.max(), ys.max()); r['heroArea'] = int(Hm.sum())
    rows.append(r); prevL, prevB, prevH, prevFl = L, B, Hm, Fl
json.dump([{k: (list(map(float, v)) if isinstance(v, tuple) else float(v)) for k, v in r.items()} for r in rows], open(f'{D}/metrics.json', 'w'))
print(' i    t     tc   diff  inkDiff boyXor  bgDiff flagD  boyC(x,y)      heroC(x,y)    heroArea  held  dip   lean   head   sh    open   LW(x,y)        RW(x,y)        headAng hem')
for r, p in zip(rows, pr):
    P = p['P']; h = p['hero']
    hc = r.get('heroC', (float('nan'),) * 2)
    print(f"{r['i']:2d} {p['t']:5.3f} {p['tc']:5.3f} {r.get('diff', 0):6.3f} {r.get('inkDiff', 0):7.3f} {int(r.get('boyXor', 0)):6d} {r.get('bgDiff', 0):6.3f} {r.get('flagDiff',0):5.2f} "
          f"({r['boyC'][0]:6.1f},{r['boyC'][1]:6.1f}) ({hc[0]:6.1f},{hc[1]:6.1f}) {r.get('heroArea', 0):6d}  {'H' if h['held'] else 'F'}  "
          f"{P['dip']:5.1f} {P['lean']:6.3f} {P['head']:6.3f} {P['sh']:5.1f} {P['open']:5.2f} ({p['LW']['x']:6.1f},{p['LW']['y']:6.1f}) ({p['RW']['x']:6.1f},{p['RW']['y']:6.1f}) {p['headAng']:6.3f} {p['hem']:5.2f}")
