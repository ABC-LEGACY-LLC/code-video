"""Load a frame brought to the working size.

BOTH sides are brought to the same size (LANCZOS): tone, edge and difference measurements
depend on size -- comparing a frame drawn at 540 directly with a sample at 320 breaks
line thickness, the peak of a bright line, particle size.
L = PIL 'L' (0.299R+0.587G+0.114B), taken from RGB AFTER the resize."""
import numpy as np
from PIL import Image

_cache = {}


def load(path, size, mode='L'):
    k = (path, tuple(size), mode)
    if k in _cache:
        return _cache[k]
    im = Image.open(path).convert('RGB')
    if im.size != tuple(size):
        im = im.resize(tuple(size), Image.LANCZOS)
    a = np.asarray(im.convert('L') if mode == 'L' else im).astype(np.float64)
    _cache[k] = a
    return a


def picture(path, size):
    im = Image.open(path).convert('RGB')
    return im if im.size == tuple(size) else im.resize(tuple(size), Image.LANCZOS)


def clear_cache():
    _cache.clear()
