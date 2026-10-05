"""OCCLUSION MAP -- the figure standing BEHIND the particles (snow, rain, dust).

A dark cloak cannot be told from a dark sky by brightness (both are L~20), but it can be
by the particles: something stands in front of a block where a particle is never seen.
The history of four attempts (all written down, because each one recurs in other
projects too):
  1) every bright point = a particle -> IoU 0.65: hair strands and the eye's glint are
     points too. A particle MOVES: a pixel lit in more than half of the images is
     steady -- the figure itself.
  2) a strict "no particle" -> 0.71: a block on the edge is partly open. Now the COVERED
     SHARE: the particles in the block / the open-sky particles of the same row (75th percentile).
  3) -> 0.72: in sparse rows, lone "figure" blocks in the sky. The figure is ONE
     connected mass: the largest part, its holes filled.
  4) -> 0.82..0.87 (against the exact mask).
Parameters in the config: block (px), threshold (top-hat), median (px)."""
import numpy as np
from scipy import ndimage
from . import image


def particles(L, threshold=28, median=9):
    return (L - ndimage.median_filter(L, size=median)) > threshold


def figure_map(F, block=10, threshold=28, median=9):
    H, W = F[0].shape
    gy, gx = H // block, W // block
    bl = lambda M: M[:gy * block, :gx * block].reshape(gy, block, gx, block).mean(axis=(1, 3))
    Z = np.array([particles(L, threshold, median) for L in F])
    steady = Z.mean(0) > 0.5
    z = np.mean([bl((m & ~steady).astype(float)) for m in Z], 0)
    ref = np.maximum(np.percentile(z, 75, axis=1, keepdims=True), 1e-4)
    m = np.clip(1 - z / ref, 0, 1) > 0.5
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sz))))
    return m


def iou(a, b):
    return float((a & b).sum() / max(1, (a | b).sum()))


def compare(prj, frames, **kw):
    Fs = [image.load(prj.file('sample', k), prj.size) for k in frames]
    Fo = [image.load(prj.file('ours', k), prj.size) for k in frames]
    ms, mo = figure_map(Fs, **kw), figure_map(Fo, **kw)
    return ms, mo, iou(ms, mo)


def draw(m):
    return '\n'.join('   ' + ''.join('#' if v else '.' for v in r) for r in m)
