"""SOCH TEPASI (12-o'tish, 1-ish): har ustunda ko'rinadigan boshning (yuz+soch) eng yuqori qatori -- misol (qism_nishon_12 bit 1,
MAXFIY) va biz (rol renderi: teri/bo'yin/soch, AO qorong'isi emas). Kadr tepasida kesilgan ustun (misolda y=0) alohida belgilanadi.
  python3 test/qism/soch_tepa.py ROL_DIR [kadrlar 2,5,9,11,12]"""
import sys, json, base64, numpy as np
from PIL import Image
R = '/home/claude/work/personaj3d/'
M = json.load(open(R + 'test/qism/inson/qism_nishon_12.json'))['m']
D = sys.argv[1]; KS = [int(k) for k in (sys.argv[2] if len(sys.argv) > 2 else '2,5,9,11,12').split(',')]
def biz(k):
    a = np.asarray(Image.open('%s/%03d.png' % (D, k)).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))
for k in KS:
    m = (np.frombuffer(base64.b64decode(M[str(k)]), np.uint8).reshape(180, 320) & 1) > 0; o = biz(k)
    cols = [x for x in range(320) if m[:, x].any() or o[:, x].any()]
    x0, x1 = min(cols), max(cols)
    top = lambda A, x: int(np.argmax(A[:, x])) if A[:, x].any() else None
    qator = []
    for x in range(x0, x1 + 1, 4):
        tm, tb = top(m, x), top(o, x)
        qator.append('%d:%s/%s' % (x, '-' if tm is None else tm, '-' if tb is None else tb))
    # tepa 60 qatordagi bosh maydoni va IoU
    mm, oo = m[:60], o[:60]; I = (mm & oo).sum(); U = (mm | oo).sum()
    print('k%02d tepa-60 misol %d px, biz %d px, IoU %.3f; misol y=0 da ustunlar %d' % (k + 1, mm.sum(), oo.sum(), I / max(U, 1), m[0].sum()))
    print('   x:misol/biz eng yuqori qator ->', ' '.join(qator))
