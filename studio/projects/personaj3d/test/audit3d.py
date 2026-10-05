"""AUDIT (3D, misol22) -- har tasvir, uch tomon bir xil kod bilan: MISOL, OLDIN (2D 12-o'tish, topshirilgan
render personaj/ff), HOZIR (3D anime, kadrlar-misol/anime). Hammasi 320x180 LANCZOS, L.

 A  rol tonlari (faqat 3D): kadrlar-misol/rol dan ANIQ rol niqoblari (960x540 da eng yaqin rang, keyin
    320x180 ga maydon ulushi >0.5, 1 px eroziya -- chet va kontur tushmasin); anime renderda har rol L mediani.
    Misol qiymatlari -- 12-o'tishda misolning 17-tasvir L jadvalidan (ton_sinf.py izohi).
 B  figura (kapyushon+plash+bosh) -- yopilish xaritasi (taqqos.yopilish.xarita, zarra hech ko'rinmagan
    bloklar) har shot uchun; misol bilan IoU. 3D da aniq niqob ham bor -- asbobni o'z materialimizda tekshiradi.
 C  ushlangan 1..6: normallangan farq (taqqos.farq.nz) chap 40% va o'ng 60% energiyasi.
 D  figura ichidagi harakat (median-5 L, har juft, shot figura niqobi ichida) -- qor emas, personaj.
 E  kesishlar: yorug' massa (kompozitsiya.niqob) va figura maydoni nisbati 11->12, 13->14.
 F  ton sinflari massasi (ton_sinf): misol bilan IoU -- tashqi, astar, ichi, yuz, soch."""
import sys, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import yopilish
from taqqos.farq import nz
from kompozitsiya import niqob as yorug_niqob
import ton_sinf as TS

R = '/home/claude/work/personaj3d'
import argparse
_a = argparse.ArgumentParser()
_a.add_argument('--hozir', default=R + '/kadrlar-misol/anime'); _a.add_argument('--rol', default=R + '/kadrlar-misol/rol')
_a.add_argument('--oldin', default='/home/claude/work/personaj/ff'); _a.add_argument('--chiq', default=R + '/test/audit3d')
ARG = _a.parse_args()
YOL = {'misol': sorted(glob.glob('/home/claude/work/maqsad/k??.png')),
       'oldin': sorted(glob.glob(ARG.oldin + '/*.png')),
       'hozir': sorted(glob.glob(ARG.hozir + '/???.png'))}
ROL = sorted(glob.glob(ARG.rol + '/???.png'))
assert all(len(v) == 22 for v in YOL.values()) and len(ROL) == 22
SHOT = {'1': range(0, 11), '2': range(11, 13), '3': range(13, 22)}


def L(p):
    return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), dtype=float)


F = {t: [L(p) for p in v] for t, v in YOL.items()}

# --- A: rol niqoblari ---
lin = lambda c: 0 if c == 0 else round(255 * ((c / 255 + 0.055) / 1.055) ** 2.4) if c < 255 else 255
ROLLAR = {'teri': (255, 0, 0), 'boyin': (128, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 128, 0),
          'kapTashqi': (0, 0, 255), 'kapAstar': (0, 255, 255), 'kapIch': (0, 0, 128),
          'plash': (255, 0, 255), 'plashIch': (128, 0, 128), 'fon': (0, 0, 0)}
NOM = list(ROLLAR); RANG = np.array([[lin(c) for c in ROLLAR[n]] for n in NOM], float)


def rol_niqob(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=float)
    d = ((a[:, :, None, :] - RANG[None, None]) ** 2).sum(-1)
    k = d.argmin(-1)
    out = {}
    for i, n in enumerate(NOM):
        m = (k == i).astype(np.float32)
        s = np.asarray(Image.fromarray(m * 255).resize((320, 180), Image.BOX), dtype=float) / 255 > 0.5
        out[n] = s
    return out


RN = [rol_niqob(p) for p in ROL]
A = {}
for n in NOM:
    if n == 'fon':
        continue
    vals, maydon = [], []
    for k in range(22):
        m = ndimage.binary_erosion(RN[k][n])
        maydon.append(RN[k][n].mean() * 100)
        if m.sum() >= 8:
            vals.append(np.median(F['hozir'][k][m]))
    A[n] = {'L': float(np.median(vals)) if vals else None, 'L_min': float(min(vals)) if vals else None,
            'L_max': float(max(vals)) if vals else None, 'maydon_%': float(np.mean(maydon)), 'tasvirlar': len(vals)}
fonm = [ndimage.binary_erosion(RN[k]['fon'], iterations=3) for k in range(22)]
A['osmon_tepa'] = {'L': float(np.median([np.median(ndimage.median_filter(F['hozir'][k], 9)[:45][fonm[k][:45]]) for k in range(22)]))}

# --- B: figura (yopilish xaritasi) ---
B = {}
figura3d = {s: np.mean([~RN[k]['fon'] for k in ks], 0) > 0.5 for s, ks in SHOT.items()}
for s, ks in SHOT.items():
    if len(ks) < 3:
        continue
    X = {t: yopilish.xarita([F[t][k] for k in ks]) for t in F}
    yb = lambda m: m.reshape(18, 10, 32, 10).mean(axis=(1, 3)) > 0.5      # aniq niqob -> 10 px bloklar
    B[s] = {'IoU_oldin': yopilish.iou(X['misol'], X['oldin']), 'IoU_hozir': yopilish.iou(X['misol'], X['hozir']),
            'maydon_misol': float(X['misol'].mean()), 'maydon_oldin': float(X['oldin'].mean()), 'maydon_hozir': float(X['hozir'].mean()),
            'asbob_3d_aniq_IoU': yopilish.iou(X['hozir'], yb(figura3d[s])),
            'IoU_hozir_aniq': yopilish.iou(X['misol'], yb(figura3d[s])), 'maydon_hozir_aniq': float(yb(figura3d[s]).mean()),
            'misol_x': X['misol'].tolist(), 'hozir_x': X['hozir'].tolist(), 'oldin_x': X['oldin'].tolist()}

# --- C: ushlangan 1..6 ---
C = {}
for t in F:
    r = []
    for k in range(5):
        d = np.abs(nz(F[t][k]) - nz(F[t][k + 1]))
        r.append((float(d[:, :128].mean()), float(d[:, 128:].mean())))
    C[t] = r

# --- D: figura ichidagi harakat ---
D = {}
for t in F:
    M5 = [ndimage.median_filter(f, 5) for f in F[t]]
    r = []
    for k in range(21):
        s = next(s for s, ks in SHOT.items() if k in ks)
        s2 = next(s for s, ks in SHOT.items() if k + 1 in ks)
        if s != s2:
            r.append(None); continue
        m = B[s]['misol_x'] if s in B else None
        m = np.kron(np.array(B[s][t + '_x']), np.ones((10, 10))).astype(bool) if s in B else np.ones((180, 320), bool)
        r.append(float(np.abs(M5[k + 1] - M5[k])[m].mean()))
    D[t] = r

# --- E: kesishlar ---
E = {}
for t in F:
    ya = [yorug_niqob(f).mean() for f in F[t]]
    E[t] = {'yorug_11_12': float(np.sqrt(ya[11] / ya[10])), 'yorug_13_14': float(np.sqrt(ya[13] / ya[12]))}

# --- F: ton sinflari ---
Fr = {}
for t in ('oldin', 'hozir'):
    r = []
    for k in range(1, 23):
        mi = TS.Misol(k)
        _, iou = mi.baho(F[t][k - 1])
        r.append(iou)
    Fr[t] = {c: float(np.mean([x[c] for x in r])) for c in TS.SINF}
    Fr[t + '_shot'] = {s: {c: float(np.mean([r[k][c] for k in ks])) for c in TS.SINF} for s, ks in SHOT.items()}
# sinf maydonlari (figura qutisi ichida), har tomon
Fm = {}
for t in F:
    q = {c: [] for c in TS.SINF}
    for k in range(22):
        x0, y0, x1, y1 = TS.ROI[TS.kadr_guruh(k + 1)]
        s = TS.sinflar(F[t][k])
        for c in TS.SINF:
            q[c].append(float(TS.massa(s[c])[y0:y1, x0:x1].mean() * 100))
    Fm[t] = {c: float(np.mean(v)) for c, v in q.items()}

natija = {'A_rol_ton': A, 'B_figura': {s: {k: v for k, v in b.items() if not k.endswith('_x')} for s, b in B.items()},
          'C_ushlangan': C, 'D_figura_harakat': D, 'E_kesish': E, 'F_ton_sinf_IoU': Fr, 'F_sinf_maydon_%': Fm}
json.dump(natija, open(ARG.chiq + '.json', 'w'), indent=1)
np.save(ARG.chiq + '_figura.npy', np.array([[B[s][t + '_x'] for t in ('misol', 'oldin', 'hozir')] for s in ('1', '3')]))

print('A  3D rol tonlari (anime, L mediani; misol 12-o\'tish: tashqi 19, astar 43..48, ichi 7..9, yuz ~59, soch ~100, osmon 2..6)')
for n, v in A.items():
    print('   %-10s L %s  (%s..%s)  maydon %s' % (n, v['L'], v.get('L_min'), v.get('L_max'), '%.1f%%' % v['maydon_%'] if 'maydon_%' in v else ''))
print('B  figura (yopilish xaritasi) misol bilan IoU')
for s, v in natija['B_figura'].items():
    print('   shot %s  oldin %.2f  hozir(xarita) %.2f  hozir(aniq niqob) %.2f   maydon misol %.2f oldin %.2f hozir(aniq) %.2f' % (
        s, v['IoU_oldin'], v['IoU_hozir'], v['IoU_hozir_aniq'], v['maydon_misol'], v['maydon_oldin'], v['maydon_hozir_aniq']))
print('C  ushlangan 1..6, juftlar: chap 40% / o\'ng 60% energiya')
for t, r in C.items():
    print('   %-6s %s' % (t, '  '.join('%.3f/%.3f' % x for x in r)))
print('D  figura ichidagi harakat (median-5 L, juft)')
for t, r in D.items():
    print('   %-6s %s' % (t, ' '.join('  -  ' if x is None else '%5.2f' % x for x in r)))
print('E  kesishda yorug\' massa miqyosi (sqrt maydon nisbati)')
for t, v in E.items():
    print('   %-6s 11->12 %.2fx   13->14 %.2fx' % (t, v['yorug_11_12'], v['yorug_13_14']))
print('F  ton sinf massasi, misol bilan IoU (o\'rtacha 22 tasvir)')
for t in ('oldin', 'hozir'):
    print('   %-6s %s' % (t, '  '.join('%s %.2f' % (c, Fr[t][c]) for c in TS.SINF)))
print('   sinf maydoni % (figura qutisida)')
for t in F:
    print('   %-6s %s' % (t, '  '.join('%s %.1f' % (c, Fm[t][c]) for c in TS.SINF)))
