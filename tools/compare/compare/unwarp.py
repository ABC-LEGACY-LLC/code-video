"""UNWARP INTO THE SUBJECT'S SPACE.

Each frame's transform (centre cx cy, scale R, roll in degrees, x squeeze sx -- all at the
WORKING size) is undone, and the sample and ours are both resampled onto the same grid
(in subject units, for example head radii). Then shapes are compared independently of the
pose: "the left edge of the hair is at x=-0.40" means the same thing in every frame.

The transform file (JSON): {"1": {"cx":..,"cy":..,"R":..,"roll":..,"sx":..}, ...}
The model writes its own transform (for example a small script in the work, from its own rig).

Roll sign: screen = centre + Rot(-roll) * (x*sx*R, y*R), y down -- the same as the head rig
in the SVG (tilt -12 -> the eye line drops to the right)."""
import json
import numpy as np
from scipy.ndimage import map_coordinates, median_filter
from PIL import Image, ImageDraw
from . import image


def transforms(path):
    with open(path) as f:
        return {int(k): v for k, v in json.load(f).items()}


def grid(T, x=(-1.6, 1.8), y=(-1.5, 2.1), step=0.02):
    t = np.deg2rad(-T['roll'])
    co, si = np.cos(t), np.sin(t)
    xs = np.arange(x[0], x[1] + 1e-9, step)
    ys = np.arange(y[0], y[1] + 1e-9, step)
    X, Y = np.meshgrid(xs * T['R'] * T.get('sx', 1.0), ys * T['R'])
    return T['cx'] + X * co - Y * si, T['cy'] + X * si + Y * co, xs, ys


def resample(L, T, **kw):
    gx, gy, xs, ys = grid(T, **kw)
    return map_coordinates(L, [gy, gx], order=1, mode='constant', cval=0), xs, ys


def table(prj, k, T, xr, yr, side='sample', median=3):
    L = image.load(prj.file(side, k), prj.size)
    if median > 1:
        L = median_filter(L, median)
    xs = np.arange(xr[0], xr[1] + 1e-9, xr[2])
    ys = np.arange(yr[0], yr[1] + 1e-9, yr[2])
    q = ['%s %d subject space L' % (side, k), '      ' + ''.join('%6.2f' % x for x in xs)]
    for y in ys:
        row = []
        for x in xs:
            gx, gy, _, _ = grid(T, (x, x), (y, y), 1.0)
            row.append(map_coordinates(L, [gy.ravel(), gx.ravel()], order=1)[0])
        q.append('%6.2f' % y + ''.join('%6d' % v for v in row))
    return '\n'.join(q)


def sheet(prj, k, T, out, zoom=3, gain=1.35):
    outs = []
    for t in ('sample', 'ours'):
        a = image.load(prj.file(t, k), prj.size, 'RGB')
        ch = []
        for c in range(3):
            v, xs, ys = resample(a[:, :, c], T)
            ch.append(v)
        img = np.clip(np.stack(ch, -1) * gain, 0, 255).astype(np.uint8)
        im = Image.fromarray(img).resize((img.shape[1] * zoom, img.shape[0] * zoom), Image.NEAREST)
        d = ImageDraw.Draw(im)
        x0, y0, st = xs[0], ys[0], xs[1] - xs[0]
        for v in np.arange(-1.5, 1.81, 0.5):
            X = (v - x0) / st * zoom
            d.line([(X, 0), (X, im.size[1])], fill=(255, 200, 0) if abs(v) < 1e-6 else (120, 100, 0))
            d.text((X + 2, 2), '%.1f' % v, fill=(255, 220, 80))
        for v in np.arange(-1.5, 2.11, 0.5):
            Y = (v - y0) / st * zoom
            d.line([(0, Y), (im.size[0], Y)], fill=(255, 200, 0) if abs(v) < 1e-6 else (120, 100, 0))
            d.text((2, Y + 2), '%.1f' % v, fill=(255, 220, 80))
        d.text((6, im.size[1] - 16), '%s %d (subject space)' % (t.upper(), k), fill=(255, 255, 255))
        outs.append(im)
    s = Image.new('RGB', (outs[0].size[0] * 2 + 8, outs[0].size[1]))
    s.paste(outs[0], (0, 0)); s.paste(outs[1], (outs[0].size[0] + 8, 0))
    s.save(out)
    return s
