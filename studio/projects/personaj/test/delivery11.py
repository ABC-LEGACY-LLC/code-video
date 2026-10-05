"""Delivery files (pass 11, hair):
  before-now-11.gif  -- SAMPLE | BEFORE (pass 10) | NOW (pass 11), 22 images, 60 ms
  before-now-11.png  -- selected images: all three sides + the overlap of the HAIR masks (with IoU)

BEFORE = ff-10/ : the NOW panel of before-now-10.gif delivered in pass 10 was made from exactly
this render (checked that film.html is byte-for-byte the same). In the GIF both panels are
in one frame, through the same path. For the mask measurement both go through the full-frame
GIF path: ff-10t and ff-11t (the same code on both sides). Mask -- the tools/compare 'hair' spec."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (COMPARE_DIR))
from compare import image, silhouette

W = (PERSONAJ_DIR)
M = sorted(glob.glob((SAMPLE_DIR + '/k??.png')))
E = sorted(glob.glob(W + '/ff-10/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
Et = sorted(glob.glob(W + '/ff-10t/??.png'))
Bt = sorted(glob.glob(W + '/ff-11t/??.png'))
assert len(M) == len(E) == len(B) == len(Et) == len(Bt) == 22
SP = next(s for s in json.load(open(W + '/compare.json'))['silhouettes'] if s['name'] == 'hair')
BOX = SP['box']


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
    label = ["SAMPLE (only the technique is measured)", "BEFORE - pass 10", "NOW - pass 11 (hair)"]
    for j, (im, lb) in enumerate(zip(ims, label)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    frames.append(c)
frames[0].save(W + '/before-now-11.gif', save_all=True, append_images=frames[1:], duration=60, loop=0)
print('before-now-11.gif', frames[0].size, len(frames))


# 2) hair masks: the same code on both sides, the same GIF path
def msk(p):
    return silhouette.spec_mask(image.load(p, (320, 180)), SP, None)


def iou(a, b):
    x0, y0, x1, y1 = BOX
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


N, iu = {}, {'before': [], 'now': []}
for k in range(1, 12):
    mm = msk(M[k - 1])
    for t, L in (('before', Et), ('now', Bt)):
        mb = msk(L[k - 1])
        iu[t].append(iou(mm, mb))
        N[(t, k)] = (mm, mb)
print('hair IoU before', ' '.join('%.2f' % v for v in iu['before']), " mean %.3f" % np.mean(iu['before']))
print('hair IoU now', ' '.join('%.2f' % v for v in iu['now']), " mean %.3f" % np.mean(iu['now']))

# 3) sheet
CUT = (40, 0, 190, 130)
S2 = 390
SW, SH = S2, int(S2 * (CUT[3] - CUT[1]) / (CUT[2] - CUT[0]))


def picture320(p):
    return Image.open(p).convert('RGB').resize((320, 180), Image.LANCZOS)


def brightness(im, k=1.6):
    return Image.fromarray(np.clip(np.asarray(im).astype(float) * k, 0, 255).astype(np.uint8))


def overlay(t, k):
    mm, mb = N[(t, k)]
    x0, y0, x1, y1 = BOX
    background = np.asarray(picture320(M[k - 1]).convert('L')).astype(float) * 0.35
    o = np.stack([background] * 3, -1)
    q = np.zeros_like(mm)
    q[y0:y1, x0:x1] = True
    o[mm & mb & q] = (170, 170, 180)
    o[mm & ~mb & q] = (255, 40, 220)
    o[~mm & mb & q] = (40, 235, 90)
    im = Image.fromarray(o.astype(np.uint8))
    ImageDraw.Draw(im).rectangle((x0, y0, x1 - 1, y1 - 1), outline=(255, 220, 120))
    return im


rows = [1, 4, 7, 10]
PAN, HD, TOP, LOW = 5, 26, 64, 40
w = PAN * SW + (PAN + 1) * P
h = TOP + len(rows) * (SH + HD + P) + LOW
v = Image.new('RGB', (w, h), (12, 12, 18))
d = ImageDraw.Draw(v)
d.text((P, 10), "pass 11 (hair): before / now.  Pictures: brightness x1.6, the same for all three.  "
       "Hair mask (L>85, median 3): grey = in both, magenta = only in the sample, green = only in ours.",
       font=F14, fill=(205, 205, 220))
d.text((P, 32), "BEFORE = the pass 10 render (the delivered GIF is from this render); for the mask both went through "
       "the same GIF path.", font=F14, fill=(160, 160, 180))
y = TOP
for k in rows:
    pan = [(brightness(picture320(M[k - 1]).crop(CUT)), 'SAMPLE %d' % k),
           (brightness(picture320(E[k - 1]).crop(CUT)), "BEFORE %d (pass 10)" % k),
           (brightness(picture320(B[k - 1]).crop(CUT)), "NOW %d (pass 11)" % k),
           (overlay('before', k).crop(CUT), 'HAIR BEFORE %d: IoU %.2f' % (k, iu['before'][k - 1])),
           (overlay('now', k).crop(CUT), 'HAIR NOW %d: IoU %.2f' % (k, iu['now'][k - 1]))]
    for j, (im, lb) in enumerate(pan):
        x = P + j * (SW + P)
        v.paste(im.resize((SW, SH), Image.LANCZOS), (x, y + HD))
        d.text((x, y + 4), lb, font=F16, fill=(255, 220, 120))
    y += SH + HD + P
d.text((P, y + 6), "hair mask IoU, mean over 1..11: before %.3f -> now %.3f  (worst: %.2f -> %.2f)" % (
    np.mean(iu['before']), np.mean(iu['now']), min(iu['before']), min(iu['now'])), font=F16, fill=(205, 205, 220))
v.save(W + '/before-now-11.png')
print('before-now-11.png', v.size)
