# Head/neck construction metrics from the flat masks (see headmask_*.js):
#   junction  = sharpest concave corner (deg) on the head+neck outline where head meets neck
#   faceOut   = face area outside the skull silhouette (px) and how far it reaches (px)
#   bareSkull = skin (not hair) on the skull/occiput region (px): the "bald" reading
# usage: python3 headmetrics.py <maskDir> [test]
import sys, math, json
import numpy as np, cv2
from PIL import Image

def contour(mask):
    cs, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)[:, 0, :].astype(float)
    # resample at 1 px of arc
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(np.r_[c, c[:1]], axis=0).T))]
    s = np.arange(0, d[-1], 1.0)
    x = np.interp(s, d, np.r_[c[:, 0], c[0, 0]]); y = np.interp(s, d, np.r_[c[:, 1], c[0, 1]])
    return np.stack([x, y], 1)

def smooth(p, sig=1.5):
    k = np.exp(-0.5 * (np.arange(-int(3 * sig), int(3 * sig) + 1) / sig) ** 2); k /= k.sum()
    n = len(p); r = len(k) // 2
    q = np.r_[p[-r:], p, p[:r]]
    return np.stack([np.convolve(q[:, 0], k, 'valid'), np.convolve(q[:, 1], k, 'valid')], 1)

def turning(p, w=5):
    # signed turning angle (deg) over +-w px of arc, on the contour lightly smoothed (sigma 1.5 px)
    # to take out pixel stair-steps. OpenCV external contours run so that POSITIVE = CONCAVE,
    # negative = convex (calibrated on the test shapes below)
    p = smooth(p)
    a = np.roll(p, w, 0); b = np.roll(p, -w, 0)
    d1 = p - a; d2 = b - p
    ang = np.degrees(np.arctan2(d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0], (d1 * d2).sum(1)))
    return ang

def calibrate():
    H = 300
    def mk(draw):
        m = np.zeros((H, H), np.uint8); draw(m); return m > 0
    circ = mk(lambda m: cv2.circle(m, (150, 150), 40, 1, -1))
    sq = mk(lambda m: cv2.rectangle(m, (100, 100), (200, 200), 1, -1))
    def snow(m):
        cv2.circle(m, (150, 120), 50, 1, -1); cv2.rectangle(m, (125, 150), (175, 260), 1, -1)
    sn = mk(snow)
    for name, m in [('circle r40', circ), ('square', sq), ('head r50 on neck w50', sn)]:
        t = turning(contour(m))
        print(f'  {name:24s} max convex {-t.min():6.1f}  max concave {t.max():6.1f}')
    # expected: circle ~14/0, square ~90/0, snowman concave ~ the angle the circle meets the neck at
    print('  (snowman: circle x=25 at y=120+43.3 -> tangent 30 deg from vertical: expect ~60 concave)')

def run(D):
    rows = []
    for i in range(96):
        A = np.asarray(Image.open(f'{D}/A{i:03d}.png').convert('RGB')).astype(int)
        B = np.asarray(Image.open(f'{D}/B{i:03d}.png').convert('RGB')).astype(int)
        head, neck, hair = A[..., 0] >= 128, A[..., 1] >= 128, A[..., 2] >= 128
        face, skull = B[..., 0] >= 128, B[..., 1] >= 128
        U = head | neck
        p = contour(U); t = turning(p)
        # junction points: both head-only and neck-only pixels within 4 px
        k = np.ones((9, 9), np.uint8)
        hn = cv2.dilate((head & ~neck).astype(np.uint8), k) & cv2.dilate((neck & ~head).astype(np.uint8), k)
        xi = np.clip(p[:, 0].round().astype(int), 0, 1279); yi = np.clip(p[:, 1].round().astype(int), 0, 719)
        J = hn[yi, xi] > 0
        jc = float(t[J].max()) if J.any() else 0.0
        jxy = [int(v) for v in p[J][np.argmax(t[J])].round()] if J.any() else None
        out = face & ~cv2.dilate(skull.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        dist = cv2.distanceTransform((~skull).astype(np.uint8), cv2.DIST_L2, 3)
        reach = float(dist[out].max()) if out.any() else 0.0
        bare = int((skull & ~hair).sum())
        rows.append({'i': i, 'junction': round(max(jc, 0), 1), 'at': jxy, 'faceOut': int(out.sum()), 'reach': round(reach, 1), 'bareSkull': bare})
    return rows

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[2] == 'test':
        calibrate()
    rows = run(sys.argv[1])
    json.dump(rows, open(f'{sys.argv[1]}/metrics.json', 'w'))
    for r in rows[::4] + [rows[95]]:
        print(f"f{r['i']:02d} junction concave {r['junction']:5.1f} deg at {r['at']}  faceOut {r['faceOut']:5d} px reach {r['reach']:5.1f} px  bare skin on skull {r['bareSkull']:5d} px")
    js = [r['junction'] for r in rows]
    print('junction concave corner: median %.1f  max %.1f (f%02d)' % (np.median(js), max(js), int(np.argmax(js))))
    print('face reach beyond skull: median %.1f  max %.1f' % (np.median([r['reach'] for r in rows]), max(r['reach'] for r in rows)))
    print('bare skin on skull: median %d  max %d' % (np.median([r['bareSkull'] for r in rows]), max(r['bareSkull'] for r in rows)))
