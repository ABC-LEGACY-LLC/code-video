"""TON O'LCHOVI (tez) -- 3D anime render va aniq rol niqoblari (rol style) bilan har rolning L mediani, 320x180 LANCZOS,
L; niqob 960x540 da eng yaqin rang -> 320x180 maydon ulushi > 0.5 -> 1 px eroziya (chet, kontur tushmasin).
Osmon: fon niqobi (3 px eroziya) ichida median-9 L, to'rt gorizontal tasma. Misol maqsadlari (12-o'tish, misolning
17-tasvir L jadvali; fon -- o'ng 55 %, audit 1): kapyushon tashqi 19, astar 43..48, ichi 7..9, yuz ~59, soch ~100,
fon tasmalari 6 / 17 / 34 / 51.
python3 test/ton_olch.py ANIME_DIR ROL_DIR"""
import sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

lin = lambda c: 0 if c == 0 else (255 if c == 255 else round(255 * ((c / 255 + 0.055) / 1.055) ** 2.4))
ROLLAR = {'teri': (255, 0, 0), 'boyin': (128, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 128, 0),
          'kapTashqi': (0, 0, 255), 'kapAstar': (0, 255, 255), 'kapIch': (0, 0, 128),
          'plash': (255, 0, 255), 'plashIch': (128, 0, 128), 'fon': (0, 0, 0)}
NOM = list(ROLLAR); RANG = np.array([[lin(c) for c in ROLLAR[n]] for n in NOM], float)
MAQSAD = {'kapTashqi': 19, 'kapAstar': 45.5, 'kapIch': 8, 'teri': 59, 'soch': 100}


def niqoblar(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=float)
    k = ((a[:, :, None, :] - RANG[None, None]) ** 2).sum(-1).argmin(-1)
    return {n: np.asarray(Image.fromarray(((k == i) * 255).astype(np.uint8)).resize((320, 180), Image.BOX), float) / 255 > 0.5
            for i, n in enumerate(NOM)}


def olch(anime, rol, kadrlar=None):
    A = sorted(glob.glob(anime + '/???.png')); Rr = sorted(glob.glob(rol + '/???.png'))
    ks = kadrlar or range(len(A))
    v = {n: [] for n in NOM}; fon = []
    for k in ks:
        L = np.asarray(Image.open(A[k]).convert('L').resize((320, 180), Image.LANCZOS), float)
        N = niqoblar(Rr[k])
        for n in NOM:
            if n == 'fon':
                continue
            m = ndimage.binary_erosion(N[n])
            if m.sum() >= 8:
                v[n].append(np.median(L[m]))
        m = ndimage.binary_erosion(N['fon'], iterations=3); Lm = ndimage.median_filter(L, 9)
        fon.append([np.median(Lm[a:b][m[a:b]]) if m[a:b].sum() > 20 else np.nan for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
    out = {n: float(np.median(x)) for n, x in v.items() if x}
    out['fon'] = [float(x) for x in np.nanmean(np.array(fon), 0)]
    return out


if __name__ == '__main__':
    r = olch(sys.argv[1], sys.argv[2])
    for n, x in r.items():
        if n == 'fon':
            print('  fon tasmalari   %s   (misol 6 / 17 / 34 / 51)' % ' / '.join('%.1f' % t for t in x))
        else:
            print('  %-10s L %6.1f   %s' % (n, x, ('maqsad %s' % MAQSAD[n]) if n in MAQSAD else ''))
