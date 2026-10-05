"""SHEETS FOR CHECKING BY EYE. A number can pass while the eye disagrees
(Goodhart) -- so after every measurement a sheet is looked at.

  frame_sheet  a column per frame: sample / ours [/ before] [/ overlay]; when the box is
               tied to the anchor, the crop stays on the face even when the face moves
  overlay      magenta = light only in the sample, green = light only in ours,
               grey = a match. With the placement right it shows the SHAPE difference.
  grid         a gridded zoom (with pixel coordinates), sample | ours
  gif          a side-by-side GIF"""
import numpy as np
from PIL import Image, ImageDraw
from . import image, probe

YELLOW = (255, 220, 120)


def stretch(a, low=35, high=120):
    return np.clip((np.asarray(a, float) - low) / (high - low) * 255, 0, 255)


def overlay(Ls, Lo, levels=None):
    if levels:
        Ls, Lo = stretch(Ls, *levels), stretch(Lo, *levels)
    rgb = np.stack([Ls, Lo, Ls], -1)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def _crop(im, box, zoom):
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    W, H = im.size
    pad = Image.new('RGB', (x1 - x0, y1 - y0), (0, 0, 0))
    src = im.crop((max(0, x0), max(0, y0), min(W, x1), min(H, y1)))
    pad.paste(src, (max(0, x0) - x0, max(0, y0) - y0))
    return pad.resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.LANCZOS)


def frame_sheet(prj, frames, box, zoom=4, rows=('sample', 'ours'), anchored=False,
                levels=None, columns=6, out=None, title=None):
    """rows may also hold 'overlay' (the sample and ours laid over each other)."""
    pw = (box[2] - box[0]) * zoom
    ph = (box[3] - box[1]) * zoom
    hdr = 16
    nq = len(rows)
    block_h = nq * (ph + hdr) + 8
    nc = min(columns, len(frames))
    nr = (len(frames) + nc - 1) // nc
    top = 22 if title else 0
    s = Image.new('RGB', (nc * (pw + 6), top + nr * block_h), (0, 0, 0))
    d = ImageDraw.Draw(s)
    if title:
        d.text((6, 4), title, fill=(200, 200, 220))
    for j, k in enumerate(frames):
        q = list(box)
        if anchored:
            A, _ = probe.anchor(prj, 'sample', k)
            if A is not None:
                q = [box[0] + A[0], box[1] + A[1], box[2] + A[0], box[3] + A[1]]
        cx, cy = (j % nc) * (pw + 6), top + (j // nc) * block_h
        for r, t in enumerate(rows):
            y = cy + r * (ph + hdr)
            if t == 'overlay':
                Ls = image.load(prj.file('sample', k), prj.size)
                Lo = image.load(prj.file('ours', k), prj.size)
                im = overlay(Ls, Lo, levels or (20, 130))
                name = 'OVERLAY %d (magenta=sample, green=ours)' % k
            else:
                if not prj.has(t):
                    continue
                im = image.picture(prj.file(t, k), prj.size)
                if levels:
                    im = Image.fromarray(stretch(np.asarray(im), *levels).astype(np.uint8))
                name = {'sample': 'SAMPLE', 'ours': 'OURS', 'before': 'BEFORE'}.get(t, t.upper()) + ' %d' % k
            s.paste(_crop(im, q, zoom), (cx, y + hdr))
            d.text((cx + 3, y + 2), name, fill=YELLOW)
    if out:
        s.save(out)
    return s


def grid(prj, k, box, zoom=8, contrast=1.0, out=None, sides=('sample', 'ours')):
    from PIL import ImageEnhance
    x0, y0, x1, y1 = box
    outs = []
    for t in sides:
        im = image.picture(prj.file(t, k), prj.size).crop(box)
        if contrast != 1.0:
            im = ImageEnhance.Brightness(ImageEnhance.Contrast(im).enhance(contrast)).enhance(1.3)
        im = im.resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
        d = ImageDraw.Draw(im)
        for gx in range((x0 // 10 + 1) * 10, x1, 10):
            X = (gx - x0) * zoom
            d.line([(X, 0), (X, im.size[1])], fill=(255, 200, 0) if gx % 50 == 0 else (120, 100, 0))
            d.text((X + 2, 2), str(gx), fill=YELLOW)
        for gy in range((y0 // 10 + 1) * 10, y1, 10):
            Y = (gy - y0) * zoom
            d.line([(0, Y), (im.size[0], Y)], fill=(255, 200, 0) if gy % 50 == 0 else (120, 100, 0))
            d.text((2, Y + 2), str(gy), fill=YELLOW)
        d.text((im.size[0] - 70, im.size[1] - 14), '%s %d' % (t.upper(), k), fill=(255, 255, 255))
        outs.append(im)
    W = sum(o.size[0] for o in outs) + 8 * (len(outs) - 1)
    s = Image.new('RGB', (W, outs[0].size[1]))
    x = 0
    for o in outs:
        s.paste(o, (x, 0)); x += o.size[0] + 8
    if out:
        s.save(out)
    return s


def gif(prj, out, frames=None, size=(480, 270), ms=60, labels=('SAMPLE', 'OURS')):
    frames = frames or list(range(1, prj.n + 1))
    fr = []
    for k in frames:
        c = Image.new('RGB', (size[0] * 2 + 30, size[1] + 46), (12, 12, 18))
        d = ImageDraw.Draw(c)
        c.paste(Image.open(prj.file('sample', k)).convert('RGB').resize(size, Image.LANCZOS), (10, 36))
        c.paste(Image.open(prj.file('ours', k)).convert('RGB').resize(size, Image.LANCZOS), (20 + size[0], 36))
        d.text((10, 12), labels[0], fill=(180, 180, 200)); d.text((20 + size[0], 12), labels[1], fill=(180, 180, 200))
        fr.append(c)
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=ms, loop=0)
    return len(fr)
