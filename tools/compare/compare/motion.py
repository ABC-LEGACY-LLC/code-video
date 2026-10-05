"""MOTION and BOIL -- pair-by-pair block shift.

Inside the area, for every 12x12 block (zoomed 2x, 0.5 px step, +-3 px) the best shift
in the next image is found.
  motion = the MEDIAN of the block shifts (everything moves together) -- a vector
  boil   = the median size of the deviation from that median (each block on its own)
Blocks without structure (low gradient) are dropped: on a flat cloak matching is noise.

An important finding (shot 1): in the sample, images 1..6 are a HELD drawing -- motion is
0.00 px in every pair. Measure the held part and the moving part SEPARATELY; the median of
the whole frame mixes them and hides both.

WARNING (pass 10): the median does not see motion in a MINORITY. In those held images
1..6 the sample's hair STRANDS move in every image (in the difference map the left 40%
energy is 0.07..0.10, ours 0.01..0.02), yet the median says 0.00. A median of 0 means "the
rigid parts are held", not "nothing moves": check with diff.diffmap."""
import numpy as np
from scipy import ndimage
from . import image


def shifts(a, b, mask, S=12, Q=6, floor=4.0):
    A = ndimage.zoom(a, 2, order=3)
    B = ndimage.zoom(b, 2, order=3)
    M = ndimage.zoom(mask.astype(float), 2, order=0) > 0.5
    G = np.hypot(ndimage.sobel(A, 0), ndimage.sobel(A, 1))
    out = []
    for y in range(Q, A.shape[0] - 2 * S - Q, 2 * S):
        for x in range(Q, A.shape[1] - 2 * S - Q, 2 * S):
            if M[y:y + 2 * S, x:x + 2 * S].mean() < 0.9:
                continue
            blk = A[y:y + 2 * S, x:x + 2 * S]
            if G[y:y + 2 * S, x:x + 2 * S].mean() < floor * 8:
                continue
            best = (1e9, 0, 0)
            for dy in range(-Q, Q + 1):
                for dx in range(-Q, Q + 1):
                    e = np.abs(B[y + dy:y + dy + 2 * S, x + dx:x + dx + 2 * S] - blk).mean()
                    if e < best[0]:
                        best = (e, dx, dy)
            out.append((best[1] / 2, best[2] / 2))
    return np.array(out)


def pair(a, b, mask):
    s = shifts(a, b, mask)
    if len(s) < 3:
        return None
    med = np.median(s, 0)
    return {'dx': float(med[0]), 'dy': float(med[1]), 'motion': float(np.hypot(*med)),
            'boil': float(np.median(np.hypot(*(s - med).T))), 'blocks': int(len(s))}


def box_mask(size, boxes):
    W, H = size
    m = np.zeros((H, W), bool)
    for q in boxes:
        x0, y0, x1, y1 = [int(v) for v in q]
        m[max(0, y0):y1, max(0, x0):x1] = True
    return m


def consecutive(prj, side, frames, mask):
    F = [image.load(prj.file(side, k), prj.size) for k in frames]
    return [pair(F[i], F[i + 1], mask) for i in range(len(F) - 1)]


def table(prj, frames, mask, sides=('sample', 'ours')):
    R = {t: consecutive(prj, t, frames, mask) for t in sides}
    q = ['pair     ' + ''.join('%-30s' % t.upper() for t in sides)]
    for i in range(len(frames) - 1):
        s = '%2d-%-4d  ' % (frames[i], frames[i + 1])
        for t in sides:
            r = R[t][i]
            s += '%-30s' % ('(%+.1f,%+.1f) m%.2f b%.2f n%d' % (r['dx'], r['dy'], r['motion'], r['boil'], r['blocks']) if r else '--')
        q.append(s)
    # the vector difference (does the head area make the same motion?)
    if len(sides) == 2:
        fs = []
        for a, b in zip(R[sides[0]], R[sides[1]]):
            if a and b:
                fs.append(np.hypot(a['dx'] - b['dx'], a['dy'] - b['dy']))
        if fs:
            q.append('motion vector difference: mean %.2f px/pair' % np.mean(fs))
    return '\n'.join(q), R
