"""Delivery GIF (3D, anime style): SAMPLE | BEFORE (2D, pass 12, the delivered render) | NOW (3D, three.js).
22 frames, 60 ms each (the sample's timing), looping forever. Panels 480x270, LANCZOS; labels on top.
BEFORE = personaj/ff/ -- the NOW panel of before-now-12.gif comes from this render (written 19 s before the GIF).
NOW = frames-sample/anime/ -- node render.mjs --film sample22 --style anime --frames 0-21."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

import argparse
R = (P3D_DIR)
_a = argparse.ArgumentParser()
_a.add_argument('--before', default=(PERSONAJ_DIR + '/ff')); _a.add_argument('--before_label', default="BEFORE - 2D, pass 12")
_a.add_argument('--now', default=R + '/frames-sample/anime'); _a.add_argument('--now_label', default='NOW - 3D (three.js, anime)')
_a.add_argument('--out', default=R + '/out/before-now-3d.gif')
A = _a.parse_args()
M = sorted(glob.glob((SAMPLE_DIR + '/k??.png')))
E = sorted(glob.glob(A.before + '/*.png'))
B = sorted(glob.glob(A.now + '/???.png'))
assert len(M) == len(E) == len(B) == 22, (len(M), len(E), len(B))


def typeface(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16 = typeface(16)
PW, PH, P, H = 480, 270, 10, 34
label = ["SAMPLE (only the technique is measured)", A.before_label, A.now_label]
frames = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    for j, src in enumerate((M[k], E[k], B[k])):
        x = P + j * (PW + P)
        c.paste(Image.open(src).convert('RGB').resize((PW, PH), Image.LANCZOS), (x, H))
        d.text((x, 9), label[j], font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    frames.append(c)
out = A.out
frames[0].save(out, save_all=True, append_images=frames[1:], duration=60, loop=0)
print(out, frames[0].size, len(frames), os.path.getsize(out))
