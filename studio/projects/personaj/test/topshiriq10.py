"""Topshiriq fayllari (10-o'tish):
  oldin-hozir-10.gif  -- MISOL | OLDIN (9-o'tish) | HOZIR (10-o'tish), 22 tasvir, 60 ms
  oldin-hozir-10.png  -- tanlangan tasvirlar: uchala tomon + siluet ustma-ustligi (IoU bilan)

OLDIN = ff-9t/ : 9-o'tishda TOPSHIRILGAN kadr-toliq.gif ning o'z tasvirlari (480x270 GIF).
Eski manbalarni qayta render qilish emas -- qayta render keyin o'zgargan fayllarni ham
oladi (ff-9 da 10-o'tishning bosh joylashuvi bor edi: LANGAR.x 2.11, topshirilganda 1.01).
HOZIR ham siluet o'lchovi uchun xuddi shu GIF yo'lidan o'tkaziladi (ff-10t/): ikkala
tomonda bir xil kod. Siluet -- taqqos.siluet.niqob, sozlamadagi tana_ong bilan."""
import sys, glob, os, io, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import tasvir, siluet

W = '/home/claude/work/personaj'
M = sorted(glob.glob('/home/claude/work/maqsad/k??.png'))
E = sorted(glob.glob(W + '/ff-9t/??.png'))
B = sorted(glob.glob(W + '/ff/??.png'))
assert len(M) == len(E) == len(B) == 22, (len(M), len(E), len(B))
SP = next(s for s in json.load(open(W + '/taqqos.json'))['siluetlar'] if s['nom'] == 'tana_ong')


def shrift(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


F16, F14 = shrift(16), shrift(14)

# 1) HOZIR -> 9-o'tish GIF i bilan bir xil yo'l (topshiriq.py: 480x270 LANCZOS, PIL GIF)
fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in B]
buf = io.BytesIO()
fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
os.makedirs(W + '/ff-10t', exist_ok=True)
g = Image.open(io.BytesIO(buf.getvalue()))
for i in range(22):
    g.seek(i)
    g.convert('RGB').save(W + '/ff-10t/%02d.png' % i)
T = sorted(glob.glob(W + '/ff-10t/??.png'))

# 2) GIF: misol | oldin | hozir
PW, PH, P, H = 480, 270, 10, 34
kadrlar = []
for k in range(22):
    c = Image.new('RGB', (3 * PW + 4 * P, PH + H + P), (12, 12, 18))
    d = ImageDraw.Draw(c)
    ims = [Image.open(M[k]).convert('RGB').resize((PW, PH), Image.LANCZOS),
           Image.open(E[k]).convert('RGB'),
           Image.open(B[k]).convert('RGB').resize((PW, PH), Image.LANCZOS)]
    yozuv = ["MISOL (faqat texnika o'lchanadi)", "OLDIN - 9-o'tish (topshirilgan)", "HOZIR - 10-o'tish"]
    for j, (im, lb) in enumerate(zip(ims, yozuv)):
        x = P + j * (PW + P)
        c.paste(im, (x, H))
        d.text((x, 9), lb, font=F16, fill=(205, 205, 220))
    d.text((3 * PW + 3 * P - 52, 9), '%2d/22' % (k + 1), font=F16, fill=(255, 220, 120))
    kadrlar.append(c)
kadrlar[0].save(W + '/oldin-hozir-10.gif', save_all=True, append_images=kadrlar[1:], duration=60, loop=0)
print('oldin-hozir-10.gif', kadrlar[0].size, len(kadrlar))

# 3) siluet: ikkala tomon bir xil kod, bir xil GIF yo'li
def niq(p):
    return siluet.niqob(tasvir.ol(p, (320, 180)), SP['shart'], SP['median'], SP['bog'])


iou = {'oldin': [], 'hozir': []}
N = {}
for k in range(1, 12):
    mm = niq(M[k - 1])
    for t, L in (('oldin', E), ('hozir', T)):
        mb = niq(L[k - 1])
        r = siluet.solishtir(mm, mb, SP['quti'], SP['yon'])
        iou[t].append(r['iou'])
        N[(t, k)] = (mm, mb)
print('IoU oldin', ' '.join('%.2f' % v for v in iou['oldin']), ' o\'rtacha %.3f' % np.mean(iou['oldin']))
print('IoU hozir', ' '.join('%.2f' % v for v in iou['hozir']), ' o\'rtacha %.3f' % np.mean(iou['hozir']))

# 4) varaq
KES = (50, 5, 225, 180)          # figura: bosh + tana + qo'l
YUZ = (66, 20, 154, 108)         # yuz, 4x
S2 = 350


def rasm320(p):
    return Image.open(p).convert('RGB').resize((320, 180), Image.LANCZOS)


def yorqin(im, k=2.0):
    a = np.asarray(im).astype(float) * k
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def chozil(im, a=35, b=120):
    x = np.asarray(im).astype(float)
    return Image.fromarray(np.clip((x - a) / (b - a) * 255, 0, 255).astype(np.uint8))


def ustma(t, k):
    mm, mb = N[(t, k)]
    x0, y0, x1, y1 = SP['quti']
    fon = np.asarray(rasm320(M[k - 1]).convert('L')).astype(float) * 0.35
    o = np.stack([fon] * 3, -1)
    q = np.zeros_like(mm)
    q[y0:y1, x0:x1] = True
    ikki, fm, fb = mm & mb & q, mm & ~mb & q, ~mm & mb & q
    o[ikki] = (170, 170, 180)
    o[fm] = (255, 40, 220)
    o[fb] = (40, 235, 90)
    im = Image.fromarray(o.astype(np.uint8))
    ImageDraw.Draw(im).rectangle((x0, y0, x1 - 1, y1 - 1), outline=(255, 220, 120))
    return im


qatorlar = [3, 9, 11]
PAN = 5
HD = 26
TEP = 64
PAST = 44
w = PAN * S2 + (PAN + 1) * P
h = TEP + len(qatorlar) * (S2 + HD + P) + (S2 + HD + P) + PAST
v = Image.new('RGB', (w, h), (12, 12, 18))
d = ImageDraw.Draw(v)
d.text((P, 10), "10-o'tish: oldin / hozir.  Rasmlar: yorqinlik x2, uchalasiga bir xil.  "
       "Siluet (tana_ong, L<20, median 5): kulrang = ikkalasida, magenta = faqat misolda, "
       "yashil = faqat bizda; sariq = o'lchov qutisi.", font=F14, fill=(205, 205, 220))
d.text((P, 32), "OLDIN = 9-o'tishda topshirilgan GIF; HOZIR siluet uchun xuddi shu GIF yo'lidan "
       "o'tkazilgan (ikkala tomonda bir xil kod).", font=F14, fill=(160, 160, 180))
y = TEP
for k in qatorlar:
    pan = [(yorqin(rasm320(M[k - 1]).crop(KES)), 'MISOL %d' % k),
           (yorqin(rasm320(E[k - 1]).crop(KES)), "OLDIN %d (9-o'tish)" % k),
           (yorqin(rasm320(B[k - 1]).crop(KES)), "HOZIR %d (10-o'tish)" % k),
           (ustma('oldin', k).crop(KES), 'SILUET OLDIN %d: IoU %.2f' % (k, iou['oldin'][k - 1])),
           (ustma('hozir', k).crop(KES), 'SILUET HOZIR %d: IoU %.2f' % (k, iou['hozir'][k - 1]))]
    for j, (im, lb) in enumerate(pan):
        x = P + j * (S2 + P)
        v.paste(im.resize((S2, S2), Image.LANCZOS), (x, y + HD))
        d.text((x, y + 4), lb, font=F16, fill=(255, 220, 120))
    y += S2 + HD + P
k = 6
for j, (L, lb) in enumerate(((M, 'MISOL'), (E, 'OLDIN'), (B, 'HOZIR'))):
    x = P + j * (S2 + P)
    v.paste(chozil(rasm320(L[k - 1])).crop(YUZ).resize((S2, S2), Image.LANCZOS), (x, y + HD))
    d.text((x, y + 4), "%s %d - yuz 4x, L 35..120 cho'zilgan" % (lb, k), font=F14, fill=(255, 220, 120))
y += S2 + HD + P
d.text((P, y + 6), "tana_ong IoU, 1..11 o'rtacha: oldin %.3f -> hozir %.3f  (eng yomoni: %.2f -> %.2f)" % (
    np.mean(iou['oldin']), np.mean(iou['hozir']), min(iou['oldin']), min(iou['hozir'])),
    font=F16, fill=(205, 205, 220))
v.save(W + '/oldin-hozir-10.png')
print('oldin-hozir-10.png', v.size)
