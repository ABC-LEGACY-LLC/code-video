# Junction sharpness on the outline AS DRAWN, split by what meets the neck:
#   skull/neck (the nape and behind the ears: should flow, a corner here is the "bump on the neck")
#   face/neck  (under the jaw and chin: a clear corner here is the chin reading as a chin)
# usage: python3 outlinemetric2.py <maskDir> <outline.json>
import sys, json, numpy as np, cv2
from headmetrics import turning
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
outs = json.load(open(O))
res = {'skull': [], 'face': []}
where = {'skull': [], 'face': []}
for i in range(96):
    A = np.asarray(Image.open(f'{D}/A{i:03d}.png').convert('RGB')).astype(int)
    B = np.asarray(Image.open(f'{D}/B{i:03d}.png').convert('RGB')).astype(int)
    neck = A[..., 1] >= 128
    face, skull = B[..., 0] >= 128, B[..., 1] >= 128
    p = np.array(outs[i], float)
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(np.r_[p, p[:1]], axis=0).T))]
    s = np.arange(0, d[-1], 1.0)
    p = np.stack([np.interp(s, d, np.r_[p[:, 0], p[0, 0]]), np.interp(s, d, np.r_[p[:, 1], p[0, 1]])], 1)
    t = turning(p)
    conc = t if (t > 0).sum() < (t < 0).sum() else -t
    k = np.ones((9, 9), np.uint8)
    nk = cv2.dilate((neck & ~skull & ~face).astype(np.uint8), k)
    js = cv2.dilate((skull & ~face & ~neck).astype(np.uint8), k) & nk
    jf = cv2.dilate((face & ~skull & ~neck).astype(np.uint8), k) & nk
    xi = np.clip(p[:, 0].round().astype(int), 0, 1279); yi = np.clip(p[:, 1].round().astype(int), 0, 719)
    for name, m in (('skull', js), ('face', jf)):
        J = m[yi, xi] > 0
        v = float(conc[J].max()) if J.any() else 0.0
        res[name].append(max(v, 0)); where[name].append([int(c) for c in p[J][np.argmax(conc[J])].round()] if J.any() else None)
for name in ('skull', 'face'):
    v = np.array(res[name])
    print(f'{name}/neck concave turn: median {np.median(v):5.1f}  p90 {np.percentile(v, 90):5.1f}  max {v.max():5.1f} (f{int(v.argmax()):02d} at {where[name][int(v.argmax())]})')
    print('   every 8th frame:', [round(float(x), 1) for x in v[::8]])
