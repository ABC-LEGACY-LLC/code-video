"""SILHOUETTE PROFILE -- the figure's dark mask row by row (or column by column).

A probe measures one point; the SHAPE of a silhouette differs at many points
(the arm short, the shoulder wide, no hollow at the neck). Here both sides go through the
same code: a median filter (removes particles -- snow, dust), a condition (L<26), the
component connected to the SEED point (a dark thing cut off from the body does not
count), holes filled. Then, in every row of the box, the extreme x of the mask
(edge "right"/"left"), or in every column the extreme y (edge "bottom"/"top").

The output, per frame: IoU (in the box), the area difference (%), the edge difference by
rows (ours - sample) -- the mean |diff|, with the ranges of the rows that differ most.
When a row is empty on one side and present on the other -- "only in sample"/"only in ours"
(for example the rows our arm tip does not reach).

In the config: "silhouettes": [{"name":..,"box":[x0,y0,x1,y1],"seed":[x,y],
"condition":"<26","median":5,"edge":"right","frames":"1-11"}]

For a light mass (for example hair, pass 11): "condition":">85", "median":3 (a thin
strand disappears at median 5), "fill":false (the hole between strands is a real gap, it is
not filled), "min_area":60 (instead of the seed: EVERY component whose area in the box is
>= 60 px -- hair may come in several pieces, while a snow particle is small),
"values":true (the median and p90 of L inside the mask).
--consecutive: consecutive images of one side are compared (k and k+1) -- how much the
edge of the hair moves in the held images (the same code on both sides)."""
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from . import image
from .project import parse_range


def mask(L, condition='<26', median=5, seed=None, fill=True, min_area=None, box=None):
    op, t = condition[0], float(condition[1:])
    Lm = ndimage.median_filter(L, median) if median > 1 else L
    m = (Lm < t) if op == '<' else (Lm > t)
    if min_area is not None:
        # instead of the seed: every component whose area in the box is >= min_area
        if box is not None:
            x0, y0, x1, y1 = [int(v) for v in box]
            q = np.zeros_like(m)
            q[max(0, y0):y1, max(0, x0):x1] = True
            m = m & q
        lab, n = ndimage.label(m)
        if n == 0:
            return m
        s = ndimage.sum(m, lab, index=np.arange(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = s >= min_area
        o = keep[lab]
        return ndimage.binary_fill_holes(o) if fill else o
    if seed is None:
        return m
    lab, n = ndimage.label(m)
    bx, by = int(round(seed[0])), int(round(seed[1]))
    c = lab[by, bx]
    if c == 0:
        # the seed point itself may sit on a particle/spot: the largest component in the
        # 9x9 window is taken (the body -- the largest dark area in the window)
        w = lab[max(0, by - 4):by + 5, max(0, bx - 4):bx + 5]
        v = w[w > 0]
        if not len(v):
            return np.zeros_like(m)
        c = np.bincount(v).argmax()
    return ndimage.binary_fill_holes(lab == c) if fill else (lab == c)


def spec_mask(L, spec, seed):
    """the mask by a silhouette spec of the config -- run and consecutive go the same way"""
    ma = spec.get('min_area')
    return mask(L, spec.get('condition', '<26'), spec.get('median', 5), seed, spec.get('fill', True),
                ma, spec['box'] if ma is not None else None)


def values(L, m, box):
    """L inside the mask (in the box): the median and the 90th percentile; an empty mask -> (nan, nan)"""
    x0, y0, x1, y1 = [int(v) for v in box]
    v = L[y0:y1, x0:x1][m[y0:y1, x0:x1]]
    if not len(v):
        return float('nan'), float('nan')
    return float(np.median(v)), float(np.percentile(v, 90))


def profile(m, box, edge='right'):
    """the edge coordinate for every row (right/left) or column (bottom/top) of the box; none -> nan"""
    x0, y0, x1, y1 = [int(v) for v in box]
    s = m[y0:y1, x0:x1]
    if edge in ('right', 'left'):
        o = np.full(y1 - y0, np.nan)
        for i, r in enumerate(s):
            xs = np.nonzero(r)[0]
            if len(xs):
                o[i] = x0 + (xs.max() + 1 if edge == 'right' else xs.min())
        return np.arange(y0, y1), o
    o = np.full(x1 - x0, np.nan)
    for i, c in enumerate(s.T):
        ys = np.nonzero(c)[0]
        if len(ys):
            o[i] = y0 + (ys.max() + 1 if edge == 'bottom' else ys.min())
    return np.arange(x0, x1), o


def compare(ms, mo, box, edge='right'):
    x0, y0, x1, y1 = [int(v) for v in box]
    a, b = ms[y0:y1, x0:x1], mo[y0:y1, x0:x1]
    iou = float((a & b).sum() / max(1, (a | b).sum()))
    area = float((b.sum() - a.sum()) / max(1, a.sum()) * 100)
    o, ps = profile(ms, box, edge)
    _, po = profile(mo, box, edge)
    d = po - ps
    both = ~np.isnan(ps) & ~np.isnan(po)
    return {'iou': iou, 'area': area, 'pos': o, 'sample': ps, 'ours': po, 'diff': d,
            'mean': float(np.nanmean(np.abs(d[both]))) if both.any() else float('nan'),
            'only_sample': o[~np.isnan(ps) & np.isnan(po)].tolist(),
            'only_ours': o[np.isnan(ps) & ~np.isnan(po)].tolist()}


def _runs(o, d, threshold):
    """consecutive rows with |diff| > threshold: [(first, last, mean diff)]"""
    q, first = [], None
    for i in range(len(o) + 1):
        ok = i < len(o) and not np.isnan(d[i]) and abs(d[i]) > threshold
        if ok and first is None:
            first = i
        if not ok and first is not None:
            q.append((int(o[first]), int(o[i - 1]), float(np.mean(d[first:i]))))
            first = None
    return q


def _seed(spec, k):
    seed = spec.get('seed')
    return seed.get(str(k), seed.get('*')) if isinstance(seed, dict) else seed


def run(prj, spec, frames=None):
    K = frames or (parse_range(spec['frames']) if 'frames' in spec else list(range(1, prj.n + 1)))
    r = {}
    for k in K:
        b = _seed(spec, k)
        M, Q = {}, {}
        for t in ('sample', 'ours'):
            L = image.load(prj.file(t, k), prj.size)
            M[t] = spec_mask(L, spec, b)
            if spec.get('values'):
                Q[t] = values(L, M[t], spec['box'])
        r[k] = compare(M['sample'], M['ours'], spec['box'], spec.get('edge', 'right'))
        r[k]['_m'] = M
        if Q:
            r[k]['values'] = Q
    return r


def consecutive_arrays(Ls, spec, seeds=None):
    """consecutive images of one side (L arrays): for every pair (i, i+1) the IoU between
    the masks, the area change and the mean |shift| of the edge (px)"""
    ms = [spec_mask(L, spec, (seeds[i] if seeds else None)) for i, L in enumerate(Ls)]
    return [compare(ms[i], ms[i + 1], spec['box'], spec.get('edge', 'right')) for i in range(len(ms) - 1)]


def consecutive(prj, spec, frames=None):
    K = frames or (parse_range(spec['frames']) if 'frames' in spec else list(range(1, prj.n + 1)))
    o = {}
    for t in ('sample', 'ours'):
        Ls = [image.load(prj.file(t, k), prj.size) for k in K]
        o[t] = consecutive_arrays(Ls, spec, [_seed(spec, k) for k in K])
    return K, o


def consecutive_table(spec, K, o):
    q = ['CONSECUTIVE %s (edge %s): how much the mask changes within a pair -- IoU, area %%, edge mean |shift| px' % (
        spec.get('name', ''), spec.get('edge', 'right'))]
    q.append('%7s   %6s %8s %7s   %6s %8s %7s' % ('pair', 'sample', 'area', '|shf|', 'ours', 'area', '|shf|'))
    for i in range(len(K) - 1):
        a, b = o['sample'][i], o['ours'][i]
        q.append('%3d-%-3d   %6.2f %+8.1f %7.2f   %6.2f %+8.1f %7.2f' % (
            K[i], K[i + 1], a['iou'], a['area'], a['mean'], b['iou'], b['area'], b['mean']))
    return '\n'.join(q)


def _row_ranges(v):
    """[0,1,2,5,6,9] -> '0..2,5..6,9' (so that broken rows do not show as one min..max)"""
    v = sorted(int(x) for x in v)
    q, first = [], v[0]
    for i in range(1, len(v) + 1):
        if i == len(v) or v[i] != v[i - 1] + 1:
            q.append('%d' % first if first == v[i - 1] else '%d..%d' % (first, v[i - 1]))
            if i < len(v):
                first = v[i]
    return ','.join(q)


def table(spec, r, threshold=2.0):
    edge = spec.get('edge', 'right')
    q = ['SILHOUETTE %s  box %s  edge %s  (diff = ours - sample, px; + -> ours is %s)' % (
        spec.get('name', ''), spec['box'], edge,
        {'right': 'further right', 'left': 'further right', 'bottom': 'lower', 'top': 'lower'}[edge])]
    q.append('%5s %6s %8s %8s  %s' % ('frame', 'IoU', 'area%', 'mean|d|', '|diff|>%.0f px runs (first..last: mean diff)' % threshold))
    for k, e in r.items():
        runs = _runs(e['pos'], e['diff'], threshold)
        s = ', '.join('%d..%d:%+.1f' % a for a in runs)
        if e['only_sample']:
            s += '  | only in sample ' + _row_ranges(e['only_sample'])
        if e['only_ours']:
            s += '  | only in ours ' + _row_ranges(e['only_ours'])
        if 'values' in e:
            (sm, sp), (om, op) = e['values']['sample'], e['values']['ours']
            s = 'L med/p90 sample %.0f/%.0f ours %.0f/%.0f  ' % (sm, sp, om, op) + s
        q.append('%5d %6.2f %+8.1f %8.2f  %s' % (k, e['iou'], e['area'], e['mean'], s))
    ious = [e['iou'] for e in r.values()]
    q.append('mean IoU %.3f, worst %.3f (frame %d)' % (
        np.mean(ious), min(ious), list(r)[int(np.argmin(ious))]))
    return '\n'.join(q)


def row_table(r, frame, step=2):
    e = r[frame]
    q = ['frame %d: row  sample  ours  diff' % frame]
    for i in range(0, len(e['pos']), step):
        m, b = e['sample'][i], e['ours'][i]
        q.append('  %5d  %6s %6s %6s' % (e['pos'][i], '-' if np.isnan(m) else '%.0f' % m,
                                         '-' if np.isnan(b) else '%.0f' % b,
                                         '' if np.isnan(m) or np.isnan(b) else '%+.0f' % (b - m)))
    return '\n'.join(q)


def sheet(prj, spec, r, out, zoom=3, columns=6):
    x0, y0, x1, y1 = [int(v) for v in spec['box']]
    tiles = []
    for k, e in r.items():
        L = image.load(prj.file('sample', k), prj.size)[y0:y1, x0:x1]
        base = np.clip(L * 0.55, 0, 255).astype(np.uint8)
        rgb = np.stack([base] * 3, -1)
        for t, c in (('sample', (255, 60, 255)), ('ours', (60, 255, 60))):
            m = e['_m'][t][y0:y1, x0:x1]
            ch = m & ~ndimage.binary_erosion(m)
            rgb[ch] = c
        chm =(e['_m']['sample'][y0:y1, x0:x1] & ~ndimage.binary_erosion(e['_m']['sample'][y0:y1, x0:x1])) & \
              (e['_m']['ours'][y0:y1, x0:x1] & ~ndimage.binary_erosion(e['_m']['ours'][y0:y1, x0:x1]))
        rgb[chm] = (255, 255, 255)
        im = Image.fromarray(rgb).resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
        d = ImageDraw.Draw(im)
        d.text((3, 2), '%d  IoU %.2f' % (k, e['iou']), fill=(255, 230, 120))
        tiles.append(im)
    w, h = tiles[0].size
    n = len(tiles)
    rows = (n + columns - 1) // columns
    s = Image.new('RGB', (min(n, columns) * (w + 4), rows * (h + 4) + 14), (0, 0, 0))
    ImageDraw.Draw(s).text((3, 1), 'SILHOUETTE %s: magenta=sample, green=ours, white=match' % spec.get('name', ''), fill=(255, 255, 255))
    for i, t in enumerate(tiles):
        s.paste(t, ((i % columns) * (w + 4), 14 + (i // columns) * (h + 4)))
    s.save(out)
    return s
