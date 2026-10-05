"""PROBES -- named measurements in every frame, in THE SAME place on the sample and on ours.

The place is tied to the ANCHOR: the anchor (for example the dark component of the near eye)
is measured on the SAMPLE in every frame; the geometry of a probe with "relative": true is
computed from that anchor point and applied to both sides in exactly that place.
So even when the head moves, the probe measures the same point of the face, and the
difference shows our shape error, not a placement error (the anchor's own difference
shows placement).

Probe kinds (values in pixels of the working size):
  component  a connected dark/light area from a seed: x y (centre), w h, n
             {"polarity":"dark"|"light","threshold":36,"seed":[dx,dy],"box":[x0,y0,x1,y1]}
             "brightest"/"darkest": true -- instead of the seed, the brightest/darkest point in the box
             "box" may be a dict: {"10":[...],"11":[...]} -- each frame its own box
  edge       the first crossing along a line: t (distance), x y
             {"start":[dx,dy],"direction":[ux,uy],"length":30,"condition":"<45"|">75"}
  area       the median L in the box (v) and the median colour (r g b)   {"box":[...],"colour":true}
  count      the number of pixels in an L range in the box (n)            {"box":[...],"L":[30,55]}
  tip        the dark mask (median filter), the extreme point of its part connected to the
             seed point: x y   {"box":[...],"condition":"<26","median":5,"seed":[x,y],"extreme":"right"}
Every probe: "relative" (to the anchor), "frames" ("6-11"), "tol" (the flag threshold)."""
import numpy as np
from scipy import ndimage
from . import image
from .project import parse_range

HELP = __doc__


def _box(q, H, W):
    x0, y0, x1, y1 = [int(round(v)) for v in q]
    return max(0, x0), max(0, y0), min(W, x1), min(H, y1)


def component(L, box, threshold, polarity='dark', seed=None, extreme=None):
    H, W = L.shape
    x0, y0, x1, y1 = _box(box, H, W)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return None
    sub = L[y0:y1, x0:x1]
    m = np.zeros_like(L, bool)
    m[y0:y1, x0:x1] = (sub < threshold) if polarity == 'dark' else (sub > threshold)
    lab, n = ndimage.label(m)
    if n == 0:
        return None
    if extreme or seed is None:
        # the darkest (or brightest) mask pixel in the box
        v = np.where(m[y0:y1, x0:x1], sub, np.inf if polarity == 'dark' else -np.inf)
        iy, ix = np.unravel_index(np.argmin(v) if polarity == 'dark' else np.argmax(v), v.shape)
        py, px = y0 + iy, x0 + ix
    else:
        sx, sy = int(round(seed[0])), int(round(seed[1]))
        a, b = max(0, sy - 4), max(0, sx - 4)
        win = L[a:sy + 5, b:sx + 5]
        wm = m[a:sy + 5, b:sx + 5]
        if not wm.any():
            return None
        v = np.where(wm, win, np.inf if polarity == 'dark' else -np.inf)
        iy, ix = np.unravel_index(np.argmin(v) if polarity == 'dark' else np.argmax(v), v.shape)
        py, px = a + iy, b + ix
    c = lab[py, px]
    if c == 0:
        return None
    ys, xs = np.nonzero(lab == c)
    return {'x': float(xs.mean()), 'y': float(ys.mean()), 'w': float(xs.max() - xs.min() + 1),
            'h': float(ys.max() - ys.min() + 1), 'n': float(len(xs))}


def edge(L, start, direction, length, condition, step=0.25):
    op, t = condition[0], float(condition[1:])
    u = np.asarray(direction, float)
    u = u / (np.hypot(*u) or 1)
    s = np.arange(0, length + 1e-9, step)
    xs, ys = start[0] + u[0] * s, start[1] + u[1] * s
    v = ndimage.map_coordinates(L, [ys, xs], order=1, mode='nearest')
    c = (v < t) if op == '<' else (v > t)
    if not c.any():
        return None
    i = int(np.argmax(c))
    if i == 0:
        d = 0.0
    else:                                   # linear interpolation (within a pixel)
        a, b = v[i - 1], v[i]
        f = (a - t) / (a - b) if a != b else 0.0
        d = s[i - 1] + f * step
    return {'t': float(d), 'x': float(start[0] + u[0] * d), 'y': float(start[1] + u[1] * d)}


def area(L, rgb, box):
    H, W = L.shape
    x0, y0, x1, y1 = _box(box, H, W)
    if x1 <= x0 or y1 <= y0:
        return None
    o = {'v': float(np.median(L[y0:y1, x0:x1]))}
    if rgb is not None:
        m = np.median(rgb[y0:y1, x0:x1].reshape(-1, 3), 0)
        o.update({'r': float(m[0]), 'g': float(m[1]), 'b': float(m[2])})
    return o


def count(L, box, L_range):
    H, W = L.shape
    x0, y0, x1, y1 = _box(box, H, W)
    s = L[y0:y1, x0:x1]
    return {'n': float(((s >= L_range[0]) & (s <= L_range[1])).sum())}


def tip(L, box, condition, seed, extreme='right', median=5):
    op, t = condition[0], float(condition[1:])
    Lm = ndimage.median_filter(L, median) if median > 1 else L
    m = (Lm < t) if op == '<' else (Lm > t)
    lab, n = ndimage.label(m)
    c = lab[int(seed[1]), int(seed[0])]
    if c == 0:
        return None
    f = ndimage.binary_fill_holes(lab == c)
    H, W = L.shape
    x0, y0, x1, y1 = _box(box, H, W)
    sub = f[y0:y1, x0:x1]
    ys, xs = np.nonzero(sub)
    if len(xs) == 0:
        return None
    if extreme == 'right':
        k = xs == xs.max()
    elif extreme == 'left':
        k = xs == xs.min()
    elif extreme == 'bottom':
        k = ys == ys.max()
    else:
        k = ys == ys.min()
    return {'x': float(xs[k].mean() + x0), 'y': float(ys[k].mean() + y0)}


# ---------------------------------------------------------------- anchor
def _seed(spec, k):
    u = spec.get('seed')
    if isinstance(u, list):
        return u
    if not u:
        return None
    ks = sorted(int(a) for a in u)
    if str(k) in u:
        return u[str(k)]
    a = max([x for x in ks if x < k], default=None)
    b = min([x for x in ks if x > k], default=None)
    if a is None:
        return u[str(b)]
    if b is None:
        return u[str(a)]
    t = (k - a) / (b - a)
    return [u[str(a)][i] + (u[str(b)][i] - u[str(a)][i]) * t for i in (0, 1)]


def anchor(prj, side, k):
    s = prj.anchor
    if not s:
        return (0.0, 0.0), None
    L = image.load(prj.file(side, k), prj.size)
    r = component(L, s['box'], s['threshold'], s.get('polarity', 'dark'), _seed(s, k))
    return ((r['x'], r['y']) if r else None), r


# ---------------------------------------------------------------- one probe
def _shift(q, a):
    return [q[0] + a[0], q[1] + a[1], q[2] + a[0], q[3] + a[1]]


def measure(prj, z, side, k, A):
    """z -- the probe spec; A -- the SAMPLE's anchor point in this frame (for relative probes)"""
    L = image.load(prj.file(side, k), prj.size)
    a = A if z.get('relative') else (0.0, 0.0)
    kind = z['kind']
    if isinstance(z.get('box'), dict):            # each frame its own box
        q = z['box'].get(str(k))
        if q is None:
            return None
        z = dict(z, box=q)
    if kind == 'component':
        sd = [z['seed'][0] + a[0], z['seed'][1] + a[1]] if 'seed' in z else None
        return component(L, _shift(z['box'], a), z['threshold'], z.get('polarity', 'dark'), sd,
                         extreme=z.get('brightest') or z.get('darkest'))
    if kind == 'edge':
        return edge(L, [z['start'][0] + a[0], z['start'][1] + a[1]], z['direction'], z['length'], z['condition'])
    if kind == 'area':
        rgb = image.load(prj.file(side, k), prj.size, 'RGB') if z.get('colour') else None
        return area(L, rgb, _shift(z['box'], a))
    if kind == 'count':
        return count(L, _shift(z['box'], a), z['L'])
    if kind == 'tip':
        return tip(L, _shift(z['box'], a), z['condition'], z['seed'], z.get('extreme', 'right'), z.get('median', 5))
    raise ValueError('unknown probe kind: ' + kind)


PRIMARY = {'component': ('x', 'y'), 'edge': ('t',), 'area': ('v',), 'count': ('n',), 'tip': ('x', 'y')}


def run(prj, frames, sides=('sample', 'ours')):
    """Measures every probe in every frame on both sides.
    Returns: {'anchor': {k: {...}}, 'probes': {name: {k: {'sample':{..},'ours':{..}}}}}"""
    result = {'anchor': {}, 'probes': {}}
    A = {}
    for k in frames:
        am, rm = anchor(prj, 'sample', k)
        A[k] = am
        e = {'sample': rm}
        for t in sides[1:]:
            _, e[t] = anchor(prj, t, k)
        result['anchor'][k] = e
    for z in prj.probes:
        allowed = set(parse_range(z['frames'])) if 'frames' in z else None
        d = {}
        for k in frames:
            if allowed is not None and k not in allowed:
                continue
            if z.get('relative') and A[k] is None:
                continue
            d[k] = {t: measure(prj, z, t, k, A[k]) for t in sides}
        result['probes'][z['name']] = d
    return result


def table(prj, result, frames, side='ours'):
    """A text table: for every probe value the (side - sample) difference, one column per frame.
    Flag (*) -- |difference| > tol. At the end the probes are ranked by mean |difference|."""
    lines = []
    head = '%-22s' % 'probe.value' + ''.join('%7d' % k for k in frames) + '   mean|d|'
    lines.append(head)
    ranking = []
    # anchor
    for q in ('x', 'y'):
        cells, fs = [], []
        for k in frames:
            e = result['anchor'].get(k, {})
            m, b = e.get('sample'), e.get(side)
            if m and b:
                f = b[q] - m[q]; fs.append(abs(f)); cells.append('%+7.1f' % f)
            else:
                cells.append('      -')
        mf = np.mean(fs) if fs else float('nan')
        lines.append('%-22s' % ('ANCHOR.' + q) + ''.join(cells) + '   %6.2f' % mf)
    for z in prj.probes:
        d = result['probes'].get(z['name'], {})
        tol = z.get('tol', 1.5)
        for q in PRIMARY[z['kind']]:
            cells, fs = [], []
            for k in frames:
                e = d.get(k)
                if not e or not e.get('sample') or not e.get(side):
                    cells.append('      -' if e is None else '  none')
                    continue
                m, b = e['sample'][q], e[side][q]
                if z['kind'] == 'count':
                    f = (b - m) / max(m, 1.0) * 100            # percent
                    flag = abs(f) > z.get('tol', 25)
                else:
                    f = b - m
                    flag = abs(f) > tol
                fs.append(abs(f))
                cells.append(('%+6.1f' % f) + ('*' if flag else ' '))
            mf = np.mean(fs) if fs else float('nan')
            label = z['name'] + '.' + q + ('%' if z['kind'] == 'count' else '')
            lines.append('%-22s' % label[:22] + ''.join(cells) + '   %6.2f' % mf)
            if fs:
                ranking.append((mf / (z.get('tol', 25) if z['kind'] == 'count' else tol), label, mf))
    lines.append('')
    lines.append('LARGEST DIFFERENCES (relative to tol):')
    for r, label, mf in sorted(ranking, reverse=True)[:12]:
        lines.append('  %-26s mean |diff| %6.2f   (%.1fx tol)' % (label, mf, r))
    return '\n'.join(lines)
