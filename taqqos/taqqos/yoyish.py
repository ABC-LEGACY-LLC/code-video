"""SUB'EKT FAZOSIGA YOYISH (unwarp).

Har kadrning transformi (markaz cx cy, masshtab R, rol gradus, x siqish sx --
hammasi ISHCHI o'lchamda) qaytariladi va misol ham biz ham bir xil to'rga
(sub'ekt birligida, masalan bosh radiusida) namuna olinadi. Shunda shakllar
pozadan mustaqil solishtiriladi: "soch chap cheti x=-0.40 da" degan gap har
kadrda bir xil ma'noda.

Transform fayli (JSON): {"1": {"cx":..,"cy":..,"R":..,"rol":..,"sx":..}, ...}
Model o'z transformini chiqaradi (masalan personaj/taqqos-transform.mjs).

Rol belgisi: ekran = markaz + Rot(-rol) * (x*sx*R, y*R), y pastga -- SVG dagi
bosh qurilmasi bilan bir xil (egilish -12 -> ko'z chizig'i o'ngga pastlaydi)."""
import json
import numpy as np
from scipy.ndimage import map_coordinates, median_filter
from PIL import Image, ImageDraw
from . import tasvir


def transformlar(yol):
    with open(yol) as f:
        return {int(k): v for k, v in json.load(f).items()}


def tor(T, x=(-1.6, 1.8), y=(-1.5, 2.1), qadam=0.02):
    t = np.deg2rad(-T['rol'])
    co, si = np.cos(t), np.sin(t)
    xs = np.arange(x[0], x[1] + 1e-9, qadam)
    ys = np.arange(y[0], y[1] + 1e-9, qadam)
    X, Y = np.meshgrid(xs * T['R'] * T.get('sx', 1.0), ys * T['R'])
    return T['cx'] + X * co - Y * si, T['cy'] + X * si + Y * co, xs, ys


def namuna(L, T, **kw):
    gx, gy, xs, ys = tor(T, **kw)
    return map_coordinates(L, [gy, gx], order=1, mode='constant', cval=0), xs, ys


def jadval(loy, k, T, xr, yr, tomon='misol', median=3):
    L = tasvir.ol(loy.fayl(tomon, k), loy.olcham)
    if median > 1:
        L = median_filter(L, median)
    xs = np.arange(xr[0], xr[1] + 1e-9, xr[2])
    ys = np.arange(yr[0], yr[1] + 1e-9, yr[2])
    q = ['%s %d sub\'ekt fazosi L' % (tomon, k), '      ' + ''.join('%6.2f' % x for x in xs)]
    for y in ys:
        row = []
        for x in xs:
            gx, gy, _, _ = tor(T, (x, x), (y, y), 1.0)
            row.append(map_coordinates(L, [gy.ravel(), gx.ravel()], order=1)[0])
        q.append('%6.2f' % y + ''.join('%6d' % v for v in row))
    return '\n'.join(q)


def varaq(loy, k, T, chiq, zoom=3, yorqin=1.35):
    outs = []
    for t in ('misol', 'biz'):
        a = tasvir.ol(loy.fayl(t, k), loy.olcham, 'RGB')
        ch = []
        for c in range(3):
            v, xs, ys = namuna(a[:, :, c], T)
            ch.append(v)
        img = np.clip(np.stack(ch, -1) * yorqin, 0, 255).astype(np.uint8)
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
        d.text((6, im.size[1] - 16), '%s %d (sub\'ekt fazosi)' % (t.upper(), k), fill=(255, 255, 255))
        outs.append(im)
    s = Image.new('RGB', (outs[0].size[0] * 2 + 8, outs[0].size[1]))
    s.paste(outs[0], (0, 0)); s.paste(outs[1], (outs[0].size[0] + 8, 0))
    s.save(chiq)
    return s
