"""CALIBRATION -- every measurement proves that it tells its good case from its BROKEN
case. If it cannot, it is UNPROVEN, and a number that comes out of it is not a measurement.

All synthetic: images whose answer is known in advance are made (no network and no sample
file needed). The same as the repository's rule: a check that passes but holds
nothing -- the worst check."""
import numpy as np
from scipy import ndimage
from . import probe, motion, diff, occlusion, unwarp

H, W = 180, 320


def _disk(cx, cy, r=4.0, bg=60.0, fg=10.0):
    y, x = np.mgrid[0:H, 0:W]
    L = np.full((H, W), bg)
    L[(x - cx) ** 2 + (y - cy) ** 2 <= r * r] = fg
    return L


def c_component():
    a = probe.component(_disk(100.0, 50.0), [80, 30, 120, 70], 36, 'dark', [100, 50])
    b = probe.component(_disk(103.0, 52.0), [80, 30, 120, 70], 36, 'dark', [100, 50])
    empty = probe.component(np.full((H, W), 60.0), [80, 30, 120, 70], 36, 'dark', [100, 50])
    ok = a and b and abs(a['x'] - 100) < 0.05 and abs((b['x'] - a['x']) - 3) < 0.05 and abs((b['y'] - a['y']) - 2) < 0.05 and empty is None
    return ok, 'centre (%.2f,%.2f); shifted +3,+2 -> diff (%.2f,%.2f); empty image -> %s' % (
        a['x'], a['y'], b['x'] - a['x'], b['y'] - a['y'], empty)


def c_edge():
    L = np.full((H, W), 60.0); L[:, 151:] = 20.0          # the edge between 150/151
    L2 = np.full((H, W), 60.0); L2[:, 153:] = 20.0
    a = probe.edge(L, [140, 90], [1, 0], 30, '<45')
    b = probe.edge(L2, [140, 90], [1, 0], 30, '<45')
    none = probe.edge(np.full((H, W), 60.0), [140, 90], [1, 0], 30, '<45')
    ok = a and b and abs(a['x'] - 150.4) < 0.4 and abs((b['x'] - a['x']) - 2) < 0.1 and none is None
    return ok, 'edge x=%.2f; shifted 2 px -> diff %.2f; no edge -> %s' % (a['x'], b['x'] - a['x'], none)


def c_tip():
    L = np.full((H, W), 60.0); L[100:180, 0:140] = 10; L[140:150, 139:171] = 10
    L2 = L.copy(); L2[140:150, 161:171] = 60
    a = probe.tip(L, [130, 120, 200, 180], '<26', [60, 170], 'right', 1)
    b = probe.tip(L2, [130, 120, 200, 180], '<26', [60, 170], 'right', 1)
    ok = a and b and abs(a['x'] - 170) < 0.6 and abs(b['x'] - 160) < 0.6
    return ok, 'tip x=%.1f (170 expected); shortened -> %.1f (160)' % (a['x'], b['x'])


def c_count_area():
    L = np.full((H, W), 60.0); L[60:70, 130:140] = 44
    n = probe.count(L, [120, 50, 150, 80], [30, 55])['n']
    v = probe.area(L, None, [120, 50, 150, 80])['v']
    ok = n == 100 and v == 60
    return ok, 'count %d (100 expected), median %.0f (60)' % (n, v)


def c_motion():
    rng = np.random.default_rng(3)
    base = ndimage.gaussian_filter(rng.random((H, W)) * 255, 1.5)
    m = np.zeros((H, W), bool); m[20:160, 20:300] = True
    r = motion.pair(base, np.roll(base, 1, axis=1), m)
    # boil: every block shifts on its own
    b2 = base.copy()
    for y in range(20, 160, 12):
        for x in range(20, 300, 12):
            dx, dy = rng.integers(-2, 3), rng.integers(-2, 3)
            b2[y:y + 12, x:x + 12] = np.roll(np.roll(base, dy, 0), dx, 1)[y:y + 12, x:x + 12]
    q = motion.pair(base, b2, m)
    ok = r and abs(r['dx'] - 1) < 0.01 and r['boil'] < 0.3 and q and q['boil'] > 1.0
    return ok, 'rigid 1 px: motion %.2f boil %.2f; random block by block: boil %.2f' % (
        r['motion'], r['boil'], q['boil'])


def c_rhythm():
    rng = np.random.default_rng(5)
    base = ndimage.gaussian_filter(rng.random((H, W + 200)) * 255, 2)
    even = [base[:, i * 3:i * 3 + W] for i in range(11)]
    pos = np.cumsum([0] + [2 + i * 0.6 for i in range(10)]).astype(int)
    fast = [base[:, p:p + W] for p in pos]
    d1 = [diff.diff(even[i], even[i + 1]) for i in range(10)]
    d2 = [diff.diff(fast[i], fast[i + 1]) for i in range(10)]
    t1, t2 = (d1[-1] / d1[0] - 1) * 100, (d2[-1] / d2[0] - 1) * 100
    ok = abs(t1) < 3 and t2 > 20
    return ok, 'uniform motion trend %+.1f%% (0 expected); accelerating %+.1f%% (positive)' % (t1, t2)


def c_occlusion():
    rng = np.random.default_rng(7)
    def snow(fig):
        F = []
        for _ in range(11):
            f = np.full((H, W), 12.0)
            ys, xs = rng.integers(0, H, 2600), rng.integers(0, W, 2600)
            f[ys, xs] = 190
            if fig:
                f[40:180, 0:120] = 18
            F.append(f)
        return F
    empty = occlusion.figure_map(snow(False))
    m = occlusion.figure_map(snow(True))
    truth = np.zeros_like(m); truth[4:18, 0:12] = True
    i = occlusion.iou(m, truth)
    ok = empty.mean() < 0.02 and i > 0.8
    return ok, 'no figure: figure blocks %.1f%%; with the figure IoU %.2f' % (empty.mean() * 100, i)


def c_unwarp():
    y, x = np.mgrid[0:H, 0:W]
    T = {'cx': 160.0, 'cy': 90.0, 'R': 40.0, 'roll': -12.0, 'sx': 1.0}
    t = np.deg2rad(-T['roll']); co, si = np.cos(t), np.sin(t)
    # a mark in subject space: the rectangle x 0..0.8, y -0.4..0.4 -> to the screen
    # (on a small rectangle of 0.4 units the share of edge cells held the IoU at 0.90
    # -- that was not the measurement but a limit of the test itself)
    dx, dy = x - T['cx'], y - T['cy']
    u = (dx * co + dy * si) / T['R']; v = (-dx * si + dy * co) / T['R']
    L = np.where((u > 0.0) & (u < 0.8) & (v > -0.4) & (v < 0.4), 200.0, 20.0)
    s, xs, ys = unwarp.resample(L, T)
    X, Y = np.meshgrid(xs, ys)
    truth = (X > 0.0) & (X < 0.8) & (Y > -0.4) & (Y < 0.4)
    i1 = occlusion.iou(s > 110, truth)
    T2 = dict(T, roll=-2.0)
    s2, _, _ = unwarp.resample(L, T2)
    i2 = occlusion.iou(s2 > 110, truth)
    ok = i1 > 0.9 and i2 < i1 - 0.1
    return ok, 'correct transform IoU %.2f; roll off by 10 degrees -> %.2f' % (i1, i2)


def c_overlay():
    from . import sheet
    a = _disk(100, 50); b = _disk(103, 50)
    s = np.asarray(sheet.overlay(a, a)).astype(int)
    t = np.asarray(sheet.overlay(a, b)).astype(int)
    ok = np.abs(s[:, :, 0] - s[:, :, 1]).max() == 0 and np.abs(t[:, :, 0] - t[:, :, 1]).max() >= 40   # the largest difference possible in the synthetic image is 50
    return ok, 'identical -> colour difference %d (0); shifted 3 px -> %d' % (
        np.abs(s[:, :, 0] - s[:, :, 1]).max(), np.abs(t[:, :, 0] - t[:, :, 1]).max())


def c_silhouette():
    from . import silhouette
    # a body (bottom left) + an arm out of it (y 140..150, x 139..170), snow particles over it
    rng = np.random.default_rng(11)
    def img(length):
        L = np.full((H, W), 60.0); L[100:180, 0:140] = 12; L[140:150, 139:139 + length] = 12
        ys, xs = rng.integers(0, H, 900), rng.integers(0, W, 900)
        L[ys, xs] = 200                       # particles: median 5 must remove them
        return L
    a = silhouette.mask(img(31), '<26', 5, [60, 170])
    b = silhouette.mask(img(21), '<26', 5, [60, 170])
    cut = silhouette.mask(np.where(np.arange(W)[None, :] > 200, 12.0, 60.0) * np.ones((H, 1)), '<26', 5, [60, 170])
    s0 = silhouette.compare(a, a, [120, 120, 200, 170], 'right')
    s1 = silhouette.compare(a, b, [120, 120, 200, 170], 'right')
    arm = s1['diff'][(s1['pos'] >= 142) & (s1['pos'] < 148)]            # the inner rows of the arm
    ok = (s0['iou'] == 1.0 and s0['mean'] == 0 and abs(np.median(arm) + 10) < 0.6
          and s1['iou'] < 0.95 and not cut.any())
    return ok, 'with itself IoU %.2f diff %.1f; arm 10 px short -> %+.1f px on the arm rows, IoU %.2f; seed cut off -> empty %s' % (
        s0['iou'], s0['mean'], np.median(arm), s1['iou'], not cut.any())


def _hair_image(length=40, dx=0, rng=None):
    """synthetic 'hair': a light mass (L 105) on a dark background (L 30), two strands,
    a dark hole inside the mass, 1 px particles and one large 4x4 particle"""
    rng = rng or np.random.default_rng(5)
    L = np.full((H, W), 30.0)
    L[20:60, 100:200] = 105
    L[60:60 + length, 110 + dx:118 + dx] = 105
    L[60:100, 150:158] = 105
    L[30:40, 140:150] = 30
    ys, xs = rng.integers(0, H, 400), rng.integers(0, W, 400)
    L[ys, xs] = 200
    L[150:154, 20:24] = 200
    return L


def c_silhouette_light():
    from . import silhouette
    q = [95, 15, 205, 110]
    n = lambda L, fill=False: silhouette.mask(L, '>85', 3, None, fill, 60, q)
    a, b, c = n(_hair_image(40)), n(_hair_image(34)), n(_hair_image(40, 2))
    t = n(_hair_image(40), True)
    sp = silhouette.compare(a, b, q, 'bottom')
    col = sp['diff'][(sp['pos'] >= 111) & (sp['pos'] < 117)]               # the columns of strand 1
    sc = silhouette.compare(a, c, [95, 62, 205, 98], 'left')
    lft = sc['diff'][(sc['pos'] >= 64) & (sc['pos'] < 96)]                # the rows of strand 1
    particle, hole, filled = a[150:154, 20:24].any(), a[32:38, 142:148].any(), t[32:38, 142:148].all()
    ok = abs(np.median(col) + 6) < 0.6 and abs(np.median(lft) - 2) < 0.6 and not particle and not hole and filled
    return ok, ('strand 6 px short -> "bottom" %+.1f px; strand 2 px to the right -> "left" %+.1f px; '
                'large particle in the mask %s; hole open %s (fill: closed %s)') % (
        np.median(col), np.median(lft), particle, not hole, filled)


def c_consecutive():
    from . import silhouette
    spec = {'box': [95, 62, 205, 98], 'condition': '>85', 'median': 3, 'fill': False, 'min_area': 60, 'edge': 'left'}
    A, B = _hair_image(40), _hair_image(40, 2)
    r = silhouette.consecutive_arrays([A, A, B], spec)
    ok = r[0]['mean'] == 0 and r[0]['iou'] == 1.0 and abs(r[1]['mean'] - 2) < 0.3 and r[1]['iou'] < 1
    return ok, 'identical pair -> |shift| %.2f, IoU %.2f; strand shifted 2 px -> %.2f px, IoU %.2f' % (
        r[0]['mean'], r[0]['iou'], r[1]['mean'], r[1]['iou'])


def c_values():
    from . import silhouette
    L = np.full((H, W), 30.0)
    L[20:70, 100:200] = 100
    L[20:30, 100:200] = 120                                              # 20% brighter
    m = silhouette.mask(L, '>85', 1, None, False, 60, [0, 0, W, H])
    med, p90 = silhouette.values(L, m, [0, 0, W, H])
    L2 = L.copy(); L2[20:70, 100:200] += 10
    med2, _ = silhouette.values(L2, silhouette.mask(L2, '>85', 1, None, False, 60, [0, 0, W, H]), [0, 0, W, H])
    ok = med == 100 and p90 == 120 and med2 == 110
    return ok, 'inside the mask median %.0f (100), p90 %.0f (120); everything +10 -> median %.0f (110)' % (med, p90, med2)


TESTS = [('probe/component', c_component), ('probe/edge', c_edge), ('probe/tip', c_tip),
         ('probe/count+area', c_count_area), ('motion/boil', c_motion), ('diff/rhythm', c_rhythm),
         ('occlusion/map', c_occlusion), ('unwarp', c_unwarp), ('sheet/overlay', c_overlay),
         ('silhouette/profile', c_silhouette), ('silhouette/light', c_silhouette_light),
         ('silhouette/consecutive', c_consecutive), ('silhouette/values', c_values)]


def run_all():
    q, failed = [], 0
    for name, f in TESTS:
        try:
            ok, note = f()
        except Exception as e:
            ok, note = False, 'ERROR: %r' % e
        failed += (not ok)
        q.append('%-9s %-22s %s' % ('PROVEN' if ok else 'UNPROVEN', name, note))
    q.append('')
    q.append('all proven' if failed == 0 else '%d measurement(s) UNPROVEN -- do not trust their numbers' % failed)
    return '\n'.join(q), failed
