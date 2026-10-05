"""Delivery files (pass 10):
  before-now-10.gif  -- SAMPLE | BEFORE (pass 9) | NOW (pass 10), 22 drawings, 60 ms
  before-now-10.png  -- chosen drawings: all three sides + silhouette overlap (with IoU)

BEFORE = ff-9t/ : the very frames of the frame-full.gif DELIVERED in pass 9 (480x270 GIF).
Not a re-render of the old sources -- a re-render would also pick up files changed later
(ff-9 had the head placement of pass 10: ANCHOR.x 2.11, 1.01 when delivered).
NOW also goes through the same GIF path for the silhouette measurement (ff-10t/): the same
code on both sides. Silhouette -- tools/compare silhouette.mask, with body_right from the config."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, glob, os, io, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (COMPARE_DIR))
from compare import image, silhouette

W = (PERSONAJ_DIR)
M = sorted(glob.glob((SAMPLE_DIR + '/k??.png')))
E = sorted(glob.glob(W + '/ff-9t/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
assert len(M) == len(E) == len(B) == 22, (len(M), len(E), len(B))
SP = next(s for s in json.load(open(W + '/compare.json'))['silhouettes'] if s['name'] == 'body_right')


def typeface(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16, F14 = typeface(16), typeface(14)

# 1) NOW -> the same path as the pass 9 GIF (delivery.py: 480x270 LANCZOS, PIL GIF)
fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in B]
buf = io.BytesIO()
fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
os.makedirs(W + '/ff-10t', exist_ok=True)
g = Image.open(io.BytesIO(buf.getvalue()))
for i in range(22):
    g.seek(i)
    g.convert('RGB').save(W + '/ff-10t/%02d.png' % i)
T = sorted(glob.glob(W + '/ff-10t/??.png'))

# 2) GIF: sample | before | now
PW, PH, P, H = 480, 270, 10, 34
frames = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    ims = [Image.open(M[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(E[k]).convert('RGB'),
           Image.open(B[k]).convert('RGB').resize((PW, PH), Image.LANCZOS)]
    label = ["SAMPLE (only the technique is measured)", "BEFORE - pass 9 (delivered)", "NOW - pass 10"]
    for j, (im, lb) in enumerate(zip(ims, label)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    frames.append(c)
frames[0].save(W + '/before-now-10.gif', save_all=True, append_images=frames[1:], duration=60, loop=0)
print('before-now-10.gif', frames[0].size, len(frames))

# 3) silhouette: the same code on both sides, the same GIF path
def msk(p):
    return silhouette.mask(image.load(p, (320, 180)), SP['condition'], SP['median'], SP['seed'])


iou = {'before': [], 'now': []}
N = {}
for k in range(1, 12):
    mm = msk(M[k - 1])
    for t, L in (('before', E), ('now', T)):
        mb = msk(L[k - 1])
        r = silhouette.compare(mm, mb, SP['box'], SP['edge'])
        iou[t].append(r['iou'])
        N[(t, k)] = (mm, mb)
print('IoU before', ' '.join('%.2f' % v for v in iou['before']), ' mean %.3f' % np.mean(iou['before']))
print('IoU now', ' '.join('%.2f' % v for v in iou['now']), ' mean %.3f' % np.mean(iou['now']))

# 4) sheet
CUT = (50, 5, 225, 180)          # figure: head + body + arm
FACE = (66, 20, 154, 108)         # face, 4x
S2 = 350


def picture320(p):
    return Image.open(p).convert('RGB').resize((320, 180), Image.LANCZOS)


def brightness(im, k=2.0):
    a = np.asarray(im).astype(float) * k
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def stretch(im, a=35, b=120):
    x = np.asarray(im).astype(float)
    return Image.fromarray(np.clip((x - a) / (b - a) * 255, 0, 255).astype(np.uint8))


def overlay(t, k):
    mm, mb = N[(t, k)]
    x0, y0, x1, y1 = SP['box']
    background = np.asarray(picture320(M[k - 1]).convert('L')).astype(float) * 0.35
    o = np.stack([background] * 3, -1)
    q = np.zeros_like(mm)
    q[y0:y1, x0:x1] = True
    two, fm, fb = mm & mb & q, mm & ~mb & q, ~mm & mb & q
    o[two] = (170, 170, 180)
    o[fm] = (255, 40, 220)
    o[fb] = (40, 235, 90)
    im = Image.fromarray(o.astype(np.uint8))
    ImageDraw.Draw(im).rectangle((x0, y0, x1 - 1, y1 - 1), outline=(255, 220, 120))
    return im


rows = [3, 9, 11]
PAN = 5
HD = 26
TOP = 64
LOW = 44
w = PAN * S2 + (PAN + 1) * P
h = TOP + len(rows) * (S2 + HD + P) + (S2 + HD + P) + LOW
v = Image.new('RGB', (w, h), (12, 12, 18))
d = ImageDraw.Draw(v)
d.text((P, 10), "Pass 10: before / now.  Pictures: brightness x2, the same for all three.  "
       "Silhouette (body_right, L<20, median 5): grey = in both, magenta = only in the sample, "
       "green = only in ours; yellow = the measurement box.", font=F14, fill=(205, 205, 220))
d.text((P, 32), "BEFORE = the GIF delivered in pass 9; NOW was put through the same GIF path "
       "for the silhouette (the same code on both sides).", font=F14, fill=(160, 160, 180))
y = TOP
for k in rows:
    pan = [(brightness(picture320(M[k - 1]).crop(CUT)), 'SAMPLE %d' % k),
           (brightness(picture320(E[k - 1]).crop(CUT)), "BEFORE %d (pass 9)" % k),
           (brightness(picture320(B[k - 1]).crop(CUT)), "NOW %d (pass 10)" % k),
           (overlay('before', k).crop(CUT), 'SILHOUETTE BEFORE %d: IoU %.2f' % (k, iou['before'][k - 1])),
           (overlay('now', k).crop(CUT), 'SILHOUETTE NOW %d: IoU %.2f' % (k, iou['now'][k - 1]))]
    for j, (im, lb) in enumerate(pan):
        x = P + j * (S2 + P)
        v.paste(im.resize((S2, S2), Image.LANCZOS), (x, y + HD))
        d.text((x, y + 4), lb, font=F16, fill=(255, 220, 120))
    y += S2 + HD + P
k = 6
for j, (L, lb) in enumerate(((M, 'SAMPLE'), (E, 'BEFORE'), (B, 'NOW'))):
    x = P + j * (S2 + P)
    v.paste(stretch(picture320(L[k - 1])).crop(FACE).resize((S2, S2), Image.LANCZOS), (x, y + HD))
    d.text((x, y + 4), "%s %d - face 4x, L 35..120 stretched" % (lb, k), font=F14, fill=(255, 220, 120))
y += S2 + HD + P
d.text((P, y + 6), "body_right IoU, 1..11 mean: before %.3f -> now %.3f  (worst: %.2f -> %.2f)" % (
    np.mean(iou['before']), np.mean(iou['now']), min(iou['before']), min(iou['now'])),
    font=F16, fill=(205, 205, 220))
v.save(W + '/before-now-10.png')
print('before-now-10.png', v.size)
