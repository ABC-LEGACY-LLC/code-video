"""Topshiriq fayllari (12-o'tish, kapyushon -- 2- va 3-kadr):
  oldin-hozir-12.gif  -- MISOL | OLDIN (11-o'tish) | HOZIR (12-o'tish), 22 tasvir, 60 ms
  oldin-hozir-12.png  -- tanlangan tasvirlar (12, 14, 17, 20, 22): uchala tomon, ustida MISOLNING
                         astar tasmasi (to'q sariq) va pona (ko'k) chegaralari -- bir xil kod bilan
                         o'lchangan (test/kapyushon.py), yonida shu tasvirdagi 'joyida IoU'

OLDIN = ff-11/ : 11-o'tishda topshirilgan oldin-hozir-11.gif ning HOZIR paneli shu renderdan.
IoU lar kadr-toliq GIF yo'lidan (ff-11t va ff-12t), olch12.py dagi bilan aynan bir xil kod."""
import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import tasvir
import kapyushon as KP

W = '/home/claude/work/personaj'
M = sorted(glob.glob('/home/claude/work/maqsad/k??.png'))
E = sorted(glob.glob(W + '/ff-11/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
assert len(M) == len(E) == len(B) == 22
assert KP.kalibr()


def shrift(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16, F14 = shrift(16), shrift(14)

# 1) GIF
PW, PH, P, H = 480, 270, 10, 34
kadrlar = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    ims = [Image.open(M[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(E[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(B[k]).convert('RGB').resize((PW, PH), Image.LANCZOS)]
    yozuv = ["MISOL (faqat texnika o'lchanadi)", "OLDIN - 11-o'tish", "HOZIR - 12-o'tish (kapyushon)"]
    for j, (im, lb) in enumerate(zip(ims, yozuv)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    kadrlar.append(c)
kadrlar[0].save(W + '/oldin-hozir-12.gif', save_all=True, append_images=kadrlar[1:], duration=60, loop=0)
print('oldin-hozir-12.gif', kadrlar[0].size, len(kadrlar))


# 2) tanlangan tasvirlar + misol tasma/pona chegaralari va joyida IoU (GIF yo'li, olch12 bilan bir xil)
def joyida(Lm, Lt, nom):
    mm = KP.olch(Lm)[nom]['niq']
    D = ndimage.binary_dilation(mm, iterations=4)
    c = ((ndimage.median_filter(Lt, 3) >= 33) & (ndimage.median_filter(Lt, 3) <= 65)) if nom == 'tasma' else \
        ((ndimage.median_filter(Lt, 5) >= 6.5) & (ndimage.median_filter(Lt, 5) <= 12))
    b = c & D
    return mm, (mm & b).sum() / max(1, (mm | b).sum())


def chet(m):
    return m & ~ndimage.binary_erosion(m)


Z = 2
QX = (40, 0, 260, 180)                     # 320 da kesma
TW, TH = (QX[2] - QX[0]) * Z, (QX[3] - QX[1]) * Z
tan = (12, 14, 17, 20, 22)
out = Image.new('RGB', (3 * TW + 4 * P, len(tan) * (TH + H) + P), (12, 12, 18))
d = ImageDraw.Draw(out)
for r, k in enumerate(tan):
    Lm = tasvir.ol(M[k - 1], (320, 180))
    y0 = r * (TH + H)
    for j, (src, gt, lb) in enumerate(((M[k - 1], None, 'MISOL'), (E[k - 1], W + '/ff-11t/%02d.png' % (k - 1), "OLDIN 11-o'tish"),
                                        (B[k - 1], W + '/ff-12t/%02d.png' % (k - 1), "HOZIR 12-o'tish"))):
        im = Image.open(src).convert('RGB').resize((320, 180), Image.LANCZOS)
        a = np.asarray(im).astype(float) / 255
        a = np.clip(255 * np.power(a, 0.6), 0, 255).astype(np.uint8)          # qorong'i kadr: ko'rish uchun gamma
        mt, it = (None, None) if gt is None else joyida(Lm, tasvir.ol(gt, (320, 180)), 'tasma')
        mp, ip = (None, None) if gt is None else joyida(Lm, tasvir.ol(gt, (320, 180)), 'pona')
        if mt is None:
            mt = KP.olch(Lm)['tasma']['niq']; mp = KP.olch(Lm)['pona']['niq']
        a[chet(mt)] = (255, 150, 30); a[chet(mp)] = (70, 150, 255)
        t = Image.fromarray(a).crop(QX).resize((TW, TH), Image.NEAREST)
        x = P + j * (TW + P)
        out.paste(t, (x, y0 + H))
        txt = '%s %d' % (lb, k) + ('' if gt is None else '   tasma %.2f  pona %.2f' % (it, ip))
        d.text((x, y0 + 10), txt, font=F14, fill=(205, 205, 220))
out.save(W + '/oldin-hozir-12.png')
print('oldin-hozir-12.png', out.size)
