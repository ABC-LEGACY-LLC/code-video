"""Delivery files (pass 12, the hood -- shots 2 and 3):
  before-now-12.gif  -- SAMPLE | BEFORE (pass 11) | NOW (pass 12), 22 drawings, 60 ms
  before-now-12.png  -- chosen drawings (12, 14, 17, 20, 22): all three sides, with the SAMPLE's
                         lining band (orange) and wedge (blue) outlines on top -- measured with the
                         same code (test/hood.py), and beside them the 'in-place IoU' on that drawing

BEFORE = ff-11/ : the NOW panel of the before-now-11.gif delivered in pass 11 is from this render.
The IoUs go through the frame-full GIF path (ff-11t and ff-12t), exactly the same code as in measure12.py."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import image
import hood as KP

W = (PERSONAJ_DIR)
M = sorted(glob.glob((SAMPLE_DIR + '/k??.png')))
E = sorted(glob.glob(W + '/ff-11/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
assert len(M) == len(E) == len(B) == 22
assert KP.calibrate()


def typeface(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16, F14 = typeface(16), typeface(14)

# 1) GIF
PW, PH, P, H = 480, 270, 10, 34
frames = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    ims = [Image.open(M[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(E[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(B[k]).convert('RGB').resize((PW, PH), Image.LANCZOS)]
    label = ["SAMPLE (only the technique is measured)", "BEFORE - pass 11", "NOW - pass 12 (hood)"]
    for j, (im, lb) in enumerate(zip(ims, label)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    frames.append(c)
frames[0].save(W + '/before-now-12.gif', save_all=True, append_images=frames[1:], duration=60, loop=0)
print('before-now-12.gif', frames[0].size, len(frames))


# 2) chosen drawings + the sample's band/wedge outlines and the in-place IoU (GIF path, the same as measure12)
def inPlace(Lm, Lt, name):
    mm = KP.measure(Lm)[name]['msk']
    D = ndimage.binary_dilation(mm, iterations=4)
    c = ((ndimage.median_filter(Lt, 3) >= 33) & (ndimage.median_filter(Lt, 3) <= 65)) if name == 'band' else \
        ((ndimage.median_filter(Lt, 5) >= 6.5) & (ndimage.median_filter(Lt, 5) <= 12))
    b = c & D
    return mm, (mm & b).sum() / max(1, (mm | b).sum())


def edge(m):
    return m & ~ndimage.binary_erosion(m)


Z = 2
QX = (40, 0, 260, 180)                     # crop at 320
TW, TH = (QX[2] - QX[0]) * Z, (QX[3] - QX[1]) * Z
tan = (12, 14, 17, 20, 22)
out = Image.new('RGB', (3 * TW + 4 * P, len(tan) * (TH + H) + P), (12, 12, 18))
d = ImageDraw.Draw(out)
for r, k in enumerate(tan):
    Lm = image.load(M[k - 1], (320, 180))
    y0 = r * (TH + H)
    for j, (src, gt, lb) in enumerate(((M[k - 1], None, 'SAMPLE'), (E[k - 1], W + '/ff-11t/%02d.png' % (k - 1), "BEFORE pass 11"),
                                        (B[k - 1], W + '/ff-12t/%02d.png' % (k - 1), "NOW pass 12"))):
        im = Image.open(src).convert('RGB').resize((320, 180), Image.LANCZOS)
        a = np.asarray(im).astype(float) / 255
        a = np.clip(255 * np.power(a, 0.6), 0, 255).astype(np.uint8)          # dark frame: gamma for viewing
        mt, it = (None, None) if gt is None else inPlace(Lm, image.load(gt, (320, 180)), 'band')
        mp, ip = (None, None) if gt is None else inPlace(Lm, image.load(gt, (320, 180)), 'wedge')
        if mt is None:
            mt = KP.measure(Lm)['band']['msk']; mp = KP.measure(Lm)['wedge']['msk']
        a[edge(mt)] = (255, 150, 30); a[edge(mp)] = (70, 150, 255)
        t = Image.fromarray(a).crop(QX).resize((TW, TH), Image.NEAREST)
        x = P + j * (TW + P)
        out.paste(t, (x, y0 + H))
        txt = '%s %d' % (lb, k) + ('' if gt is None else '   band %.2f  wedge %.2f' % (it, ip))
        d.text((x, y0 + 10), txt, font=F14, fill=(205, 205, 220))
out.save(W + '/before-now-12.png')
print('before-now-12.png', out.size)
