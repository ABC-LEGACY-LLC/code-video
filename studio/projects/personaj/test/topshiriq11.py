"""Topshiriq fayllari (11-o'tish, soch):
  oldin-hozir-11.gif  -- MISOL | OLDIN (10-o'tish) | HOZIR (11-o'tish), 22 tasvir, 60 ms
  oldin-hozir-11.png  -- tanlangan tasvirlar: uchala tomon + SOCH niqobi ustma-ustligi (IoU bilan)

OLDIN = ff-10/ : 10-o'tishda topshirilgan oldin-hozir-10.gif ning HOZIR paneli aynan shu
renderdan yasalgan (film.html bayt-bayt bir xil ekani tekshirilgan). GIF da ikkala panel
bir kadrda, bir xil yo'ldan. Niqob o'lchovi uchun ikkalasi ham kadr-toliq GIF yo'lidan:
ff-10t va ff-11t (ikkala tomonda bir xil kod). Niqob -- taqqos 'soch' spec'i."""
import sys, glob, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import tasvir, siluet

W = '/home/claude/work/personaj'
M = sorted(glob.glob('/home/claude/work/maqsad/k??.png'))
E = sorted(glob.glob(W + '/ff-10/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
Et = sorted(glob.glob(W + '/ff-10t/??.png'))
Bt = sorted(glob.glob(W + '/ff-11t/??.png'))
assert len(M) == len(E) == len(B) == len(Et) == len(Bt) == 22
SP = next(s for s in json.load(open(W + '/taqqos.json'))['siluetlar'] if s['nom'] == 'soch')
BOX = SP['quti']


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
    yozuv = ["MISOL (faqat texnika o'lchanadi)", "OLDIN - 10-o'tish", "HOZIR - 11-o'tish (soch)"]
    for j, (im, lb) in enumerate(zip(ims, yozuv)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    kadrlar.append(c)
kadrlar[0].save(W + '/oldin-hozir-11.gif', save_all=True, append_images=kadrlar[1:], duration=60, loop=0)
print('oldin-hozir-11.gif', kadrlar[0].size, len(kadrlar))


# 2) soch niqoblari: ikkala tomon bir xil kod, bir xil GIF yo'li
def niq(p):
    return siluet.spec_niqob(tasvir.ol(p, (320, 180)), SP, None)


def iou(a, b):
    x0, y0, x1, y1 = BOX
    a, b = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
    return float((a & b).sum() / max(1, (a | b).sum()))


N, iu = {}, {'oldin': [], 'hozir': []}
for k in range(1, 12):
    mm = niq(M[k - 1])
    for t, L in (('oldin', Et), ('hozir', Bt)):
        mb = niq(L[k - 1])
        iu[t].append(iou(mm, mb))
        N[(t, k)] = (mm, mb)
print('soch IoU oldin', ' '.join('%.2f' % v for v in iu['oldin']), " o'rtacha %.3f" % np.mean(iu['oldin']))
print('soch IoU hozir', ' '.join('%.2f' % v for v in iu['hozir']), " o'rtacha %.3f" % np.mean(iu['hozir']))

# 3) varaq
KES = (40, 0, 190, 130)
S2 = 390
SW, SH = S2, int(S2 * (KES[3] - KES[1]) / (KES[2] - KES[0]))


def rasm320(p):
    return Image.open(p).convert('RGB').resize((320, 180), Image.LANCZOS)


def yorqin(im, k=1.6):
    return Image.fromarray(np.clip(np.asarray(im).astype(float) * k, 0, 255).astype(np.uint8))


def ustma(t, k):
    mm, mb = N[(t, k)]
    x0, y0, x1, y1 = BOX
    fon = np.asarray(rasm320(M[k - 1]).convert('L')).astype(float) * 0.35
    o = np.stack([fon] * 3, -1)
    q = np.zeros_like(mm)
    q[y0:y1, x0:x1] = True
    o[mm & mb & q] = (170, 170, 180)
    o[mm & ~mb & q] = (255, 40, 220)
    o[~mm & mb & q] = (40, 235, 90)
    im = Image.fromarray(o.astype(np.uint8))
    ImageDraw.Draw(im).rectangle((x0, y0, x1 - 1, y1 - 1), outline=(255, 220, 120))
    return im


qatorlar = [1, 4, 7, 10]
PAN, HD, TEP, PAST = 5, 26, 64, 40
w = PAN * SW + (PAN + 1) * P
h = TEP + len(qatorlar) * (SH + HD + P) + PAST
v = Image.new('RGB', (w, h), (12, 12, 18))
d = ImageDraw.Draw(v)
d.text((P, 10), "11-o'tish (soch): oldin / hozir.  Rasmlar: yorqinlik x1.6, uchalasiga bir xil.  "
       "Soch niqobi (L>85, median 3): kulrang = ikkalasida, magenta = faqat misolda, yashil = faqat bizda.",
       font=F14, fill=(205, 205, 220))
d.text((P, 32), "OLDIN = 10-o'tish renderi (topshirilgan GIF shu renderdan); niqob uchun ikkalasi ham bir xil GIF "
       "yo'lidan o'tkazilgan.", font=F14, fill=(160, 160, 180))
y = TEP
for k in qatorlar:
    pan = [(yorqin(rasm320(M[k - 1]).crop(KES)), 'MISOL %d' % k),
           (yorqin(rasm320(E[k - 1]).crop(KES)), "OLDIN %d (10-o'tish)" % k),
           (yorqin(rasm320(B[k - 1]).crop(KES)), "HOZIR %d (11-o'tish)" % k),
           (ustma('oldin', k).crop(KES), 'SOCH OLDIN %d: IoU %.2f' % (k, iu['oldin'][k - 1])),
           (ustma('hozir', k).crop(KES), 'SOCH HOZIR %d: IoU %.2f' % (k, iu['hozir'][k - 1]))]
    for j, (im, lb) in enumerate(pan):
        x = P + j * (SW + P)
        v.paste(im.resize((SW, SH), Image.LANCZOS), (x, y + HD))
        d.text((x, y + 4), lb, font=F16, fill=(255, 220, 120))
    y += SH + HD + P
d.text((P, y + 6), "soch niqobi IoU, 1..11 o'rtacha: oldin %.3f -> hozir %.3f  (eng yomoni: %.2f -> %.2f)" % (
    np.mean(iu['oldin']), np.mean(iu['hozir']), min(iu['oldin']), min(iu['hozir'])), font=F16, fill=(205, 205, 220))
v.save(W + '/oldin-hozir-11.png')
print('oldin-hozir-11.png', v.size)
