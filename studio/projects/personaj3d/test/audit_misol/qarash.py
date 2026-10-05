"""QARASH -- ko'z holati va qorachiq o'rni, misol va bizda bir xil kod. Yaqin ko'z: langar komponenti (L<50, zond qutisi
82..124 x 36..60, eng katta), uning ichida eng qorong'i 25 % piksellar markazi -> ko'z qutisi ichidagi nisbiy o'rin
(0 tepa .. 1 past; 0 tashqi(chap) .. 1 ichki(o'ng)); ko'z balandligi/eni (ochiq ~10/11 px, yumuq ~3/11).
python3 test/audit_misol/qarash.py [biz_papka]"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def L320(p): return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), float)

def koz(L, quti=(82, 36, 124, 60), chegara=50):
    x0, y0, x1, y1 = quti
    m = L[y0:y1, x0:x1] < chegara
    lab, n = ndimage.label(m)
    if n == 0: return None
    s = ndimage.sum(m, lab, range(1, n + 1)); i = int(np.argmax(s)) + 1
    ys, xs = np.nonzero(lab == i)
    v = L[y0:y1, x0:x1][ys, xs]; q = v <= np.percentile(v, 25)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx, cy = xs[q].mean(), ys[q].mean()
    return dict(quti=[int(bx0 + x0), int(by0 + y0), int(bx1 + x0), int(by1 + y0)], eni=int(bx1 - bx0 + 1), boyi=int(by1 - by0 + 1),
                qorachiq=[round(float(cx + x0), 1), round(float(cy + y0), 1)],
                nisbiy_y=round(float((cy - by0) / max(1, by1 - by0)), 2), nisbiy_x=round(float((cx - bx0) / max(1, bx1 - bx0)), 2))

if __name__ == '__main__':
    biz = sys.argv[1] if len(sys.argv) > 1 else 'kadrlar-toza-4'
    out = {}
    for k in range(1, 12):
        a = koz(L320('/home/claude/work/maqsad/k%02d.png' % k)); b = koz(L320('%s/%03d.png' % (biz, k - 1)))
        out[k] = {'misol': a, 'biz': b}
        print('%2d misol %s\n   biz   %s' % (k, a, b))
    json.dump(out, open('test/audit_misol/qarash.json', 'w'), indent=1)
