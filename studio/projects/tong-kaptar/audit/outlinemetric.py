# Junction sharpness on the outline AS DRAWN: sharpest concave turn (deg over +-5 px of arc)
# where the head meets the neck (head-only and neck-only pixels both within 4 px), per frame.
# usage: python3 outlinemetric.py <maskDir> <outline.json>
import sys, json, numpy as np, cv2
from headmetrics import turning
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
outs = json.load(open(O))
vals = []
for i in range(96):
    A = np.asarray(Image.open(f'{D}/A{i:03d}.png').convert('RGB')).astype(int)
    head, neck = A[..., 0] >= 128, A[..., 1] >= 128
    p = np.array(outs[i], float)
    # resample at 1 px
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(np.r_[p, p[:1]], axis=0).T))]
    s = np.arange(0, d[-1], 1.0)
    p = np.stack([np.interp(s, d, np.r_[p[:, 0], p[0, 0]]), np.interp(s, d, np.r_[p[:, 1], p[0, 1]])], 1)
    t = turning(p)
    k = np.ones((9, 9), np.uint8)
    hn = cv2.dilate((head & ~neck).astype(np.uint8), k) & cv2.dilate((neck & ~head).astype(np.uint8), k)
    xi = np.clip(p[:, 0].round().astype(int), 0, 1279); yi = np.clip(p[:, 1].round().astype(int), 0, 719)
    J = hn[yi, xi] > 0
    # sign: this curve's orientation may differ from OpenCV's; take concave as the sign that is
    # rare on a mostly-convex outline
    conc = t if (t > 0).sum() < (t < 0).sum() else -t
    vals.append(float(conc[J].max()) if J.any() else 0.0)
vals = np.array(vals)
print('junction concave turn on the drawn outline: median %.1f  p90 %.1f  max %.1f (f%02d)' % (np.median(vals), np.percentile(vals, 90), vals.max(), int(vals.argmax())))
print('per 8 frames:', [round(v, 1) for v in vals[::8]])
