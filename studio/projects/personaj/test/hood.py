"""HOOD TOOLS (pass 12, shots 2 and 3). The same code on both sides, 320x180 L.
Anchor -- the BRIGHT HAIR mass (L>85, median 3, x<230, the largest part): the camera does not
move within the shot, while the head sinks inside the hood -- the boxes are tied to this mass.

  hair   -- the bright hair mass: area, centre, box
  band   -- UNDER the brim (the lining) -- 33 <= L <= 65 (median 3), in a box above the hair mass
            (x: hair x0-10 .. x1+10, y: hair y0-30 .. y0+12); the largest part: area,
            centre, thickness (area / width)
  wedge  -- INSIDE the hood -- 6.5 <= L <= 12 (median 5), to the left of the hair mass
            (x: hair x0-45 .. hair centre, y: hair y0-25 .. y1+10); the largest part
  mass   -- the outer surface of the hood -- 12 <= L <= 32 (median 7), in the left 3/4 of the
            frame, the largest connected part; top-right peak = the point with the largest (x - y)

In the sample (shot 3, the L table of image 17): outer surface L 19, lining band L 43..48, inner
wedge L 7..9, hair L ~100, sky L 2..6 (with particles). The thresholds lie between these levels.
python3 test/hood.py [--calibrate] [--frames 12-22] [--side sample,ours]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR))
from compare import project, image

W = (PERSONAJ_DIR)


def _largest(m):
    lab, n = ndimage.label(m)
    if not n:
        return None
    s = ndimage.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(s)))


def hair(L):
    m = ndimage.median_filter(L, 3) > 85
    m[:, 230:] = False
    k = _largest(m)
    if k is None:
        return None
    ys, xs = np.nonzero(k)
    return {'area': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()),
            'box': (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1), 'msk': k}


def _in_box(m, q):
    x0, y0, x1, y1 = [int(round(v)) for v in q]
    o = np.zeros_like(m); H, W_ = m.shape
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W_, x1), min(H, y1)
    o[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return o


def band(L, s):
    if s is None:
        return None
    x0, y0, x1, y1 = s['box']
    m = (ndimage.median_filter(L, 3) >= 33) & (ndimage.median_filter(L, 3) <= 65)
    m = _in_box(m, (x0 - 10, y0 - 30, x1 + 10, y0 + 12))
    k = _largest(m)
    if k is None:
        return {'area': 0, 'x': None, 'y': None, 'thickness': 0.0}
    ys, xs = np.nonzero(k)
    en = xs.max() - xs.min() + 1
    return {'area': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()), 'thickness': float(k.sum() / en), 'msk': k}


def wedge(L, s):
    if s is None:
        return None
    x0, y0, x1, y1 = s['box']
    Lm = ndimage.median_filter(L, 5)
    m = (Lm >= 6.5) & (Lm <= 12)
    m = _in_box(m, (x0 - 45, y0 - 25, s['x'], y1 + 10))
    k = _largest(m)
    if k is None:
        return {'area': 0, 'x': None, 'y': None}
    ys, xs = np.nonzero(k)
    return {'area': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()), 'msk': k}


def mass(L):
    Lm = ndimage.median_filter(L, 7)
    m = (Lm >= 12) & (Lm <= 32)
    m[:, 240:] = False
    k = _largest(m)
    if k is None:
        return None
    ys, xs = np.nonzero(k)
    i = int(np.argmax(xs - ys))
    return {'area': int(k.sum()), 'peak': (int(xs[i]), int(ys[i])), 'msk': k}


def measure(L):
    s = hair(L)
    return {'hair': s, 'band': band(L, s), 'wedge': wedge(L, s), 'mass': mass(L)}


def calibrate():
    """a synthetic hood: sky L 3 (with particles), outer surface L 19, wedge L 8 (a known
    triangle), lining band L 45 (of known thickness), hair L 100, face L 60"""
    rng = np.random.default_rng(3)

    def make(qal=10, wedge_d=(0, 0), has_band=True, has_wedge=True):
        L = np.full((180, 320), 3.0)
        z = rng.random((180, 320)) < 0.02; L[z] = 200                   # particles
        L[0:180, 0:200] = 19                                            # outer surface
        L[70:130, 150:215] = 100                                        # hair mass (x 150..214, y 70..129)
        L[130:170, 150:200] = 60                                        # face
        if has_band:
            L[70 - qal:70, 150:215] = 45                                # lining: above the hair
        if has_wedge:
            yy, xx = np.mgrid[0:180, 0:320]
            dx, dy = wedge_d
            tri = (xx >= 125 + dx) & (xx < 150 + dx) & (yy >= 80 + dy) & (yy < 125 + dy) & ((xx - 125 - dx) > (yy - 80 - dy) * 0.4)
            L[tri] = 8
        return L

    ok = True
    a = measure(make()); b = measure(make(qal=5)); c = measure(make(wedge_d=(4, 3))); d = measure(make(has_band=False, has_wedge=False))
    r1 = abs(a['band']['thickness'] - 10) < 1.0 and abs(b['band']['thickness'] - 5) < 1.0
    r2 = abs(c['wedge']['x'] - a['wedge']['x'] - 4) < 0.6 and abs(c['wedge']['y'] - a['wedge']['y'] - 3) < 0.6
    r3 = d['band']['area'] == 0 and d['wedge']['area'] == 0
    # median 3 removes the corner pixels of the rectangle (4/9 in a 3x3) -- area +-0.5%
    r4 = abs(a['hair']['area'] - 65 * 60) <= 0.005 * 65 * 60 and abs(a['hair']['x'] - 182) < 0.05
    print('calibrate hood/band  thickness 10 -> %.2f, 5 -> %.2f  %s' % (a['band']['thickness'], b['band']['thickness'], 'PROVEN' if r1 else 'UNPROVEN'))
    print('calibrate hood/wedge   shifted +4,+3 -> %+.2f,%+.2f  %s' % (c['wedge']['x'] - a['wedge']['x'], c['wedge']['y'] - a['wedge']['y'], 'PROVEN' if r2 else 'UNPROVEN'))
    print('calibrate hood/none   no band and no wedge -> area %d, %d  %s' % (d['band']['area'], d['wedge']['area'], 'PROVEN' if r3 else 'UNPROVEN'))
    print('calibrate hood/hair   area %d (3900), x %.2f (182)  %s' % (a['hair']['area'], a['hair']['x'], 'PROVEN' if r4 else 'UNPROVEN'))
    return r1 and r2 and r3 and r4


def table(prj, frames, sides=('sample', 'ours')):
    R = {}
    for t in sides:
        R[t] = {k: measure(image.load(prj.file(t, k), prj.size)) for k in frames}
    f = lambda v, fmt='%5.0f': (fmt % v) if v is not None else '    -'
    print(' image | hair area, centre        | band area thick, centre      | wedge area, centre        | mass area, peak')
    for k in frames:
        for t in sides:
            o = R[t][k]; s, ta, p, m = o['hair'], o['band'], o['wedge'], o['mass']
            print('  %2d %-5s| %5d (%5.1f,%5.1f)        | %5d %4.1f (%s,%s)          | %5d (%s,%s)            | %5d %s' % (
                k, t[:5], s['area'] if s else 0, s['x'] if s else 0, s['y'] if s else 0,
                ta['area'] if ta else 0, ta['thickness'] if ta else 0, f(ta and ta['x'], '%5.1f'), f(ta and ta['y'], '%5.1f'),
                p['area'] if p else 0, f(p and p['x'], '%5.1f'), f(p and p['y'], '%5.1f'),
                m['area'] if m else 0, m['peak'] if m else '-'))
    return R


if __name__ == '__main__':
    ok = calibrate()
    if '--calibrate' in sys.argv:
        sys.exit(0 if ok else 1)
    assert ok
    prj = project.Project(W + '/compare.json')
    a = sys.argv[sys.argv.index('--frames') + 1] if '--frames' in sys.argv else '12-22'
    k0, k1 = [int(v) for v in a.split('-')]
    tl = sys.argv[sys.argv.index('--side') + 1].split(',') if '--side' in sys.argv else ['sample', 'ours']
    table(prj, list(range(k0, k1 + 1)), tl)
