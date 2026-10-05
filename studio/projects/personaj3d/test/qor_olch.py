"""QOR ZICHLIGI VA O'LCHAMI -- ikkala tomon bir xil kod: 320x180 LANCZOS, L; zarra = top-hat (L - median9) > 28
(taqqos/yopilish.zarra bilan bir xil); komponentlar: soni, maydon taqsimoti (px), eng katta 99-persentil.
Faqat o'ng 55% (fon qori; personaj chap tomonda)."""
import sys, glob, numpy as np
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos.yopilish import zarra
from scipy import ndimage
from PIL import Image
def yuk(p): return [np.asarray(Image.open(f).convert('L').resize((320, 180), Image.LANCZOS), dtype=float) for f in sorted(glob.glob(p))]
def olch(L):
    m = zarra(L)[:, 144:]
    lab, n = ndimage.label(m)
    s = ndimage.sum(m, lab, range(1, n + 1)) if n else np.array([0])
    pk = ndimage.maximum(L[:, 144:], lab, range(1, n + 1)) if n else np.array([0])
    return n, np.median(s), np.percentile(s, 99), s.max(), np.median(pk)
for p in ['/home/claude/work/maqsad/k??.png'] + sys.argv[1:]:
    r = np.array([olch(L) for L in yuk(p)])
    print('%-60s soni %.0f (%.0f..%.0f)  maydon median %.1f  p99 %.1f  max %.0f  cho\'qqi L %.0f' % (
        p[-60:], r[:, 0].mean(), r[:, 0].min(), r[:, 0].max(), r[:, 1].mean(), r[:, 2].mean(), r[:, 3].max(), r[:, 4].mean()))

# choraklar: zarra soni (o'ng 55%, 4 gorizontal tasma) va fon L (median-9)
def choraklar(F):
    rows, bg = [], []
    for L in F:
        m = zarra(L)[:, 144:]
        lab, n = ndimage.label(m)
        cy = np.array(ndimage.center_of_mass(m, lab, range(1, n + 1)))[:, 0] if n else np.array([])
        rows.append([((cy >= a) & (cy < b)).sum() for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
        Lm = ndimage.median_filter(L, 9)
        bg.append([np.median(Lm[a:b, 144:]) for a, b in [(0, 45), (45, 90), (90, 135), (135, 180)]])
    return np.array(rows).mean(0), np.array(bg).mean(0)
for p in ['/home/claude/work/maqsad/k??.png'] + sys.argv[1:]:
    r, b = choraklar(yuk(p))
    print('%-40s zarra choraklari %s  fon L %s' % (p[-40:], np.round(r).astype(int), np.round(b, 1)))
