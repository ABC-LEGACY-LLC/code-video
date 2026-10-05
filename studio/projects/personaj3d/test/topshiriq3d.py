"""Topshiriq GIF (3D, anime style): MISOL | OLDIN (2D, 12-o'tish, topshirilgan render) | HOZIR (3D, three.js).
22 tasvir, har biri 60 ms (misol vaqti), cheksiz takror. Panellar 480x270, LANCZOS; yozuvlar tepada.
OLDIN = personaj/ff/ -- oldin-hozir-12.gif ning HOZIR paneli shu renderdan (GIF dan 19 s oldin yozilgan).
HOZIR = kadrlar-misol/anime/ -- node render.mjs --film misol22 --style anime --kadrlar 0-21."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

import argparse
R = '/home/claude/work/personaj3d'
_a = argparse.ArgumentParser()
_a.add_argument('--oldin', default='/home/claude/work/personaj/ff'); _a.add_argument('--oldin_yozuv', default="OLDIN - 2D, 12-o'tish")
_a.add_argument('--hozir', default=R + '/kadrlar-misol/anime'); _a.add_argument('--hozir_yozuv', default='HOZIR - 3D (three.js, anime)')
_a.add_argument('--chiq', default=R + '/chiqish/oldin-hozir-3d.gif')
A = _a.parse_args()
M = sorted(glob.glob('/home/claude/work/maqsad/k??.png'))
E = sorted(glob.glob(A.oldin + '/*.png'))
B = sorted(glob.glob(A.hozir + '/???.png'))
assert len(M) == len(E) == len(B) == 22, (len(M), len(E), len(B))


def shrift(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16 = shrift(16)
PW, PH, P, H = 480, 270, 10, 34
yozuv = ["MISOL (faqat texnika o'lchanadi)", A.oldin_yozuv, A.hozir_yozuv]
kadrlar = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    for j, src in enumerate((M[k], E[k], B[k])):
        x = P + j * (PW + P)
        c.paste(Image.open(src).convert('RGB').resize((PW, PH), Image.LANCZOS), (x, H))
        d.text((x, 9), yozuv[j], font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    kadrlar.append(c)
chiq = A.chiq
kadrlar[0].save(chiq, save_all=True, append_images=kadrlar[1:], duration=60, loop=0)
print(chiq, kadrlar[0].size, len(kadrlar), os.path.getsize(chiq))
