"""YUZ SOHASI (terisi ko'ringan qism) -- misol va bizda bir xil kod: har tasvirda yuz sohasi niqobi, maydoni, markazi,
bosh o'qining burchagi (niqobning asosiy o'qi, gradus, tikdan), eng pastki va eng o'ng nuqtalari.
Misol: L median-3 [50, 68] oralig'ida, urug' nuqtadan bog'langan soha (yuz terisi L 57..60; soch 90+, kapyushon 15..25,
fon yuzning yonida 40..46). Biz: rol niqobi (teri, qizil) -- aniq; plyus o'sha L usuli (asbobni tekshirish uchun).
python3 test/audit_misol/yuz_soha.py"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

URUG = {**{k: (112, 75) for k in range(1, 10)}, 10: (122, 80), 11: (126, 82), 12: (150, 95), 13: (150, 95),
        **{k: None for k in range(14, 23)}}


def L320(p):
    return np.asarray(Image.open(p).convert('L').resize((320, 180), Image.LANCZOS), float)


def soha_L(L, urug, lo=50, hi=68):
    m = ndimage.median_filter(L, 3)
    b = (m >= lo) & (m <= hi)
    lab, n = ndimage.label(b)
    if urug is None:
        return None
    c = lab[urug[1], urug[0]]
    if c == 0:
        return None
    return ndimage.binary_fill_holes(lab == c)


def xususiyat(m):
    ys, xs = np.nonzero(m)
    if len(xs) < 20:
        return None
    cx, cy = xs.mean(), ys.mean()
    C = np.cov(np.vstack([xs - cx, ys - cy]))
    w, v = np.linalg.eigh(C)
    ax = v[:, 1]                                  # asosiy o'q
    burchak = np.degrees(np.arctan2(ax[0], ax[1]))  # tikdan (pastga) gradus, + -> pasti o'ngga
    if burchak > 90: burchak -= 180
    if burchak < -90: burchak += 180
    return dict(n=int(len(xs)), cx=round(cx, 1), cy=round(cy, 1), x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()),
                burchak=round(float(burchak), 1), cho_zilish=round(float(np.sqrt(w[1] / max(w[0], 1e-6))), 2))


if __name__ == '__main__':
    biz_dir = sys.argv[1] if len(sys.argv) > 1 else 'kadrlar-toza-4'
    rol_dir = sys.argv[2] if len(sys.argv) > 2 else 'kadrlar-misol/rol-yuz4'
    out = {}
    for k in range(1, 23):
        Lm = L320('/home/claude/work/maqsad/k%02d.png' % k)
        mm = soha_L(Lm, URUG[k])
        a = np.asarray(Image.open('%s/%03d.png' % (rol_dir, k - 1)).convert('RGB').resize((320, 180), Image.NEAREST), int)
        mb = (a[:, :, 0] > 180) & (a[:, :, 1] < 80) & (a[:, :, 2] < 80)
        out[k] = {'misol': xususiyat(mm) if mm is not None else None, 'biz_rol': xususiyat(mb)}
        print(k, 'misol', out[k]['misol'], '\n   biz', out[k]['biz_rol'])
    json.dump(out, open('test/audit_misol/yuz_soha.json', 'w'), indent=1)
