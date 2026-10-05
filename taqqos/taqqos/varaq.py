"""KO'Z BILAN TEKSHIRISH VARAQALARI. Raqam o'tib ko'z rozi bo'lmasligi mumkin
(Goodhart) -- shuning uchun har o'lchovdan keyin varaqa qaraladi.

  kadr_varaq  har kadr uchun ustun: misol / biz [/ eski] [/ ustma-ust]; quti
              langarga bog'lansa, yuz qimirlasa ham kesma yuz ustida qoladi
  ustma       magenta = faqat misolda yorug', yashil = faqat bizda yorug',
              kulrang = mos. Joylashuv to'g'ri bo'lganda SHAKL farqini ko'rsatadi.
  setka       to'rli kattalashtirish (piksel koordinatalari bilan), misol | biz
  gif         yonma-yon GIF"""
import numpy as np
from PIL import Image, ImageDraw
from . import tasvir, zond

SARIQ = (255, 220, 120)


def chozish(a, past=35, yuqori=120):
    return np.clip((np.asarray(a, float) - past) / (yuqori - past) * 255, 0, 255)


def ustma(Lm, Lb, cho=None):
    if cho:
        Lm, Lb = chozish(Lm, *cho), chozish(Lb, *cho)
    rgb = np.stack([Lm, Lb, Lm], -1)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def _kes(im, quti, zoom):
    x0, y0, x1, y1 = [int(round(v)) for v in quti]
    W, H = im.size
    pad = Image.new('RGB', (x1 - x0, y1 - y0), (0, 0, 0))
    src = im.crop((max(0, x0), max(0, y0), min(W, x1), min(H, y1)))
    pad.paste(src, (max(0, x0) - x0, max(0, y0) - y0))
    return pad.resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.LANCZOS)


def kadr_varaq(loy, kadrlar, quti, zoom=4, qatorlar=('misol', 'biz'), langarli=False,
               cho=None, ustunlar=6, chiq=None, sarlavha=None):
    """qatorlar ichida 'ustma' ham bo'lishi mumkin (misol+biz ustma-ust)."""
    pw = (quti[2] - quti[0]) * zoom
    ph = (quti[3] - quti[1]) * zoom
    hdr = 16
    nq = len(qatorlar)
    blok_h = nq * (ph + hdr) + 8
    nc = min(ustunlar, len(kadrlar))
    nr = (len(kadrlar) + nc - 1) // nc
    top = 22 if sarlavha else 0
    s = Image.new('RGB', (nc * (pw + 6), top + nr * blok_h), (0, 0, 0))
    d = ImageDraw.Draw(s)
    if sarlavha:
        d.text((6, 4), sarlavha, fill=(200, 200, 220))
    for j, k in enumerate(kadrlar):
        q = list(quti)
        if langarli:
            A, _ = zond.langar(loy, 'misol', k)
            if A is not None:
                q = [quti[0] + A[0], quti[1] + A[1], quti[2] + A[0], quti[3] + A[1]]
        cx, cy = (j % nc) * (pw + 6), top + (j // nc) * blok_h
        for r, t in enumerate(qatorlar):
            y = cy + r * (ph + hdr)
            if t == 'ustma':
                Lm = tasvir.ol(loy.fayl('misol', k), loy.olcham)
                Lb = tasvir.ol(loy.fayl('biz', k), loy.olcham)
                im = ustma(Lm, Lb, cho or (20, 130))
                nom = 'USTMA %d (magenta=misol, yashil=biz)' % k
            else:
                if not loy.bor(t):
                    continue
                im = tasvir.rasm(loy.fayl(t, k), loy.olcham)
                if cho:
                    im = Image.fromarray(chozish(np.asarray(im), *cho).astype(np.uint8))
                nom = {'misol': 'MISOL', 'biz': 'BIZ', 'eski': 'ESKI'}.get(t, t.upper()) + ' %d' % k
            s.paste(_kes(im, q, zoom), (cx, y + hdr))
            d.text((cx + 3, y + 2), nom, fill=SARIQ)
    if chiq:
        s.save(chiq)
    return s


def setka(loy, k, quti, zoom=8, kontrast=1.0, chiq=None, tomonlar=('misol', 'biz')):
    from PIL import ImageEnhance
    x0, y0, x1, y1 = quti
    out = []
    for t in tomonlar:
        im = tasvir.rasm(loy.fayl(t, k), loy.olcham).crop(quti)
        if kontrast != 1.0:
            im = ImageEnhance.Brightness(ImageEnhance.Contrast(im).enhance(kontrast)).enhance(1.3)
        im = im.resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
        d = ImageDraw.Draw(im)
        for gx in range((x0 // 10 + 1) * 10, x1, 10):
            X = (gx - x0) * zoom
            d.line([(X, 0), (X, im.size[1])], fill=(255, 200, 0) if gx % 50 == 0 else (120, 100, 0))
            d.text((X + 2, 2), str(gx), fill=SARIQ)
        for gy in range((y0 // 10 + 1) * 10, y1, 10):
            Y = (gy - y0) * zoom
            d.line([(0, Y), (im.size[0], Y)], fill=(255, 200, 0) if gy % 50 == 0 else (120, 100, 0))
            d.text((2, Y + 2), str(gy), fill=SARIQ)
        d.text((im.size[0] - 70, im.size[1] - 14), '%s %d' % (t.upper(), k), fill=(255, 255, 255))
        out.append(im)
    W = sum(o.size[0] for o in out) + 8 * (len(out) - 1)
    s = Image.new('RGB', (W, out[0].size[1]))
    x = 0
    for o in out:
        s.paste(o, (x, 0)); x += o.size[0] + 8
    if chiq:
        s.save(chiq)
    return s


def gif(loy, chiq, kadrlar=None, olcham=(480, 270), ms=60, izoh=('MISOL', 'BIZ')):
    kadrlar = kadrlar or list(range(1, loy.n + 1))
    fr = []
    for k in kadrlar:
        c = Image.new('RGB', (olcham[0] * 2 + 30, olcham[1] + 46), (12, 12, 18))
        d = ImageDraw.Draw(c)
        c.paste(Image.open(loy.fayl('misol', k)).convert('RGB').resize(olcham, Image.LANCZOS), (10, 36))
        c.paste(Image.open(loy.fayl('biz', k)).convert('RGB').resize(olcham, Image.LANCZOS), (20 + olcham[0], 36))
        d.text((10, 12), izoh[0], fill=(180, 180, 200)); d.text((20 + olcham[0], 12), izoh[1], fill=(180, 180, 200))
        fr.append(c)
    fr[0].save(chiq, save_all=True, append_images=fr[1:], duration=ms, loop=0)
    return len(fr)
