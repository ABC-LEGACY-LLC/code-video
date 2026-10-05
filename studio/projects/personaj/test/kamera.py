"""KAMERA VA FIZIKA (12-o'tish, kapyushon). Misolni qaysi tomondan, qaysi balandlikdan
olingani -- o'lchov bilan. Ikkala tomonda bir xil kod (misol va biz).
  1) qor harakati har kadrda: zarralar (top-hat > 28) k va k+1 orasidagi siljishlar
     ovozi (|d| <= 12 px) -- gistogramma cho'qqisi = asosiy harakat; kattaligi bo'yicha
     ikki sinf: mayda (1..3 px, uzoq) va katta (>= 6 px, yaqin, bokeh).
  2) figura (yopilish xaritasi, har kadr guruhi) -- qamrov, chap-tepa burchak, eng
     yuqori-o'ng nuqta.
python3 test/kamera.py"""
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import loyiha, tasvir, yopilish

W = '/home/claude/work/personaj'
loy = loyiha.Loyiha(W + '/taqqos.json')
G = loy.guruhlar if hasattr(loy, 'guruhlar') else json.load(open(W + '/taqqos.json'))['guruhlar']


def zarralar(L):
    m = yopilish.zarra(L)
    lab, n = ndimage.label(m)
    if not n:
        return np.zeros((0, 2)), np.zeros(0)
    c = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))
    s = ndimage.sum(m, lab, range(1, n + 1))
    return c[:, ::-1], s        # (x, y), maydon


def ovoz(A, B, R=12):
    """A, B: (x,y) nuqtalar; hamma juftlar siljishi gistogrammasi, cho'qqi va uning ulushi"""
    if len(A) == 0 or len(B) == 0:
        return None
    d = (B[None, :, :] - A[:, None, :]).reshape(-1, 2)
    d = d[(np.abs(d) <= R).all(1)]
    H, _, _ = np.histogram2d(d[:, 0], d[:, 1], bins=2 * R + 1, range=[[-R - .5, R + .5], [-R - .5, R + .5]])
    Hs = ndimage.uniform_filter(H, 3)
    i, j = np.unravel_index(np.argmax(Hs), Hs.shape)
    # cho'qqi atrofida og'irlik markazi (subpiksel)
    w = H[max(0, i - 1):i + 2, max(0, j - 1):j + 2]
    xs = np.arange(max(0, i - 1), max(0, i - 1) + w.shape[0]) - R
    ys = np.arange(max(0, j - 1), max(0, j - 1) + w.shape[1]) - R
    dx = float((w.sum(1) * xs).sum() / max(w.sum(), 1)); dy = float((w.sum(0) * ys).sum() / max(w.sum(), 1))
    fon = np.median(Hs)
    return dx, dy, float(Hs[i, j] / max(fon, 1e-6))


def qor(tomon, k0, k1):
    rows = []
    for k in range(k0, k1):
        La = tasvir.ol(loy.fayl(tomon, k), loy.olcham); Lb = tasvir.ol(loy.fayl(tomon, k + 1), loy.olcham)
        A, sa = zarralar(La); B, sb = zarralar(Lb)
        r = {}
        for nom, fa, fb in (('mayda', sa <= 3, sb <= 3), ('katta', sa >= 6, sb >= 6)):
            r[nom] = ovoz(A[fa], B[fb], R=12 if nom == 'mayda' else 16)
        rows.append((k, r, len(A)))
    return rows


if __name__ == '__main__':
    for tomon in ('misol', 'biz'):
        print('=== %s: qor harakati (dx, dy px/tasvir; cho\'qqi/fon)' % tomon)
        for nom, (a, b) in G.items():
            rows = qor(tomon, a, b)
            for sinf in ('mayda', 'katta'):
                v = [r[sinf] for _, r, _ in rows if r[sinf]]
                if not v:
                    continue
                dx = np.median([t[0] for t in v]); dy = np.median([t[1] for t in v]); q = np.median([t[2] for t in v])
                print('  %s %-6s median (%+.1f, %+.1f)  cho\'qqi/fon %.1f   har juft: %s' % (
                    nom, sinf, dx, dy, q, ' '.join('(%+.0f,%+.0f)' % (t[0], t[1]) for t in v)))


def qatlam(tomon, k0, k1, bantlar=6):
    """qor zichligi va zarra o'lchami balandlik bo'yicha (figuradan tashqarida: o'ng 45%)"""
    Z = []; S = []
    for k in range(k0, k1 + 1):
        L = tasvir.ol(loy.fayl(tomon, k), loy.olcham)
        m = yopilish.zarra(L)[:, 176:]
        lab, n = ndimage.label(m)
        if n:
            s = ndimage.sum(m, lab, range(1, n + 1)); c = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))
            Z.append(c[:, 0]); S.append(s)
    y = np.concatenate(Z); s = np.concatenate(S); h = loy.olcham[1] / bantlar
    out = []
    for b in range(bantlar):
        f = (y >= b * h) & (y < (b + 1) * h)
        out.append((f.sum() / (k1 - k0 + 1) / (h * 144) * 1000, float(np.mean(s[f])) if f.any() else 0))
    return out


def soch_yonalish(tomon, k, quti):
    """soch tolalari yo'nalishi: yorug' (L>85) soha ichida struktura tenzori; burchak
    gorizontaldan (0 = o'ngga yotiq, 90 = tik)"""
    L = tasvir.ol(loy.fayl(tomon, k), loy.olcham)
    x0, y0, x1, y1 = quti
    G = ndimage.gaussian_filter(L, 1.0); gy, gx = np.gradient(G)
    m = np.zeros_like(L, bool); m[y0:y1, x0:x1] = True; m &= ndimage.median_filter(L, 3) > 85
    Jxx = ndimage.gaussian_filter(gx * gx, 2)[m].sum(); Jyy = ndimage.gaussian_filter(gy * gy, 2)[m].sum(); Jxy = ndimage.gaussian_filter(gx * gy, 2)[m].sum()
    th = 0.5 * np.degrees(np.arctan2(2 * Jxy, Jxx - Jyy))      # gradient yo'nalishi
    tola = (th + 90) % 180                                      # tola gradientga tik
    kohe = np.hypot(Jxx - Jyy, 2 * Jxy) / (Jxx + Jyy)
    return (180 - tola) % 180, kohe                             # rasm y pastga -> matematik burchak


if __name__ == '__main__' and '--qatlam' in sys.argv:
    for tomon in ('misol', 'biz'):
        print('=== %s: qor zichligi (1000 px2 ga zarra/tasvir) va o\'rtacha zarra maydoni, tepadan pastga 6 bant (o\'ng 45%%)' % tomon)
        for nom, (a, b) in G.items():
            q = qatlam(tomon, a, b)
            print('  %s  zichlik %s   maydon %s' % (nom, ' '.join('%5.1f' % z for z, _ in q), ' '.join('%4.1f' % s for _, s in q)))
