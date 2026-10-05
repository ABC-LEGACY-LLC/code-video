"""12-o'tish: KAMERA VA KAPYUSHON varag'i. Har kadr: sxema (tepadan / yondan) | misol
(o'lchangan belgilar) | biz (kapyushon farqlari). Sxemadagi joylashuv -- o'qish, uning
dalillari misol panelida raqam bilan (test/kamera.py, test/fokus.py, L jadvallari)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W = '/home/claude/work/personaj'
OUT = '/home/claude/work/personaj/kamera-kapyushon.png'
F = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', n)
FB = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', n)
PW, PH = 560, 315          # 320x180 * 1.75
SX = PW / 320
SW = 330
SAR, KOK, QIZ, YASH, OQ, KUL = (255, 214, 102), (110, 210, 255), (255, 110, 120), (120, 235, 140), (235, 235, 245), (150, 150, 170)


def gam(p, k):
    a = np.asarray(Image.open(p % k).convert('RGB').resize((PW, PH), Image.LANCZOS)).astype(float)
    return Image.fromarray(np.clip(255 * np.power(a / 255, 0.6), 0, 255).astype('uint8'))


def strelka(d, a, b, rang, w=3, uch=12):
    d.line([a, b], fill=rang, width=w)
    ax, ay = a; bx, by = b; v = np.array([bx - ax, by - ay], float); v /= np.linalg.norm(v) + 1e-9
    n = np.array([-v[1], v[0]])
    p1 = np.array(b) - v * uch + n * uch * 0.5; p2 = np.array(b) - v * uch - n * uch * 0.5
    d.polygon([tuple(b), tuple(p1), tuple(p2)], fill=rang)


def yozuv(d, xy, t, rang=OQ, f=None, fon=(10, 10, 20)):
    f = f or F(15)
    x, y = xy; bb = d.textbbox((x, y), t, font=f)
    d.rectangle((bb[0] - 3, bb[1] - 2, bb[2] + 3, bb[3] + 2), fill=fon)
    d.text((x, y), t, font=f, fill=rang)


def P(x, y):                                 # 320 koordinatasidan panelga
    return (x * SX, y * SX)


def kamera_belgi(d, c, yon, rang=SAR):
    """kichik kamera: to'rtburchak + ob'ektiv, yon -- qaragan yo'nalish (birlik vektor)"""
    x, y = c; v = np.array(yon, float); v /= np.linalg.norm(v); n = np.array([-v[1], v[0]])
    k = [np.array(c) + a * v * 14 + b * n * 9 for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    d.polygon([tuple(p) for p in k], fill=rang)
    t = [np.array(c) + v * 14 + n * 4, np.array(c) + v * 24 + n * 9, np.array(c) + v * 24 - n * 9, np.array(c) + v * 14 - n * 4]
    d.polygon([tuple(p) for p in t], fill=rang)


def sxema(kadr, tepa_kam, tepa_yon, yon_kam_h, bosh_egilish, yozuv_t):
    im = Image.new('RGB', (SW, PH), (14, 14, 26)); d = ImageDraw.Draw(im)
    # tepadan
    d.text((10, 6), 'TEPADAN', font=FB(14), fill=KUL)
    c = (165, 95); r = 26
    d.ellipse((c[0] - r - 12, c[1] - r - 6, c[0] + r - 2, c[1] + r + 6), fill=(40, 42, 80))       # kapyushon orqa
    d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), fill=(170, 160, 150))                       # bosh
    d.polygon([(c[0] + r - 2, c[1] - 7), (c[0] + r + 12, c[1]), (c[0] + r - 2, c[1] + 7)], fill=(170, 160, 150))   # burun
    strelka(d, (c[0] + 45, c[1]), (c[0] + 95, c[1]), KUL, 2, 9); d.text((c[0] + 50, c[1] + 6), 'qarashi', font=F(12), fill=KUL)
    d.text((c[0] - 150, c[1] - r - 8), 'personaj chapi', font=F(12), fill=KUL); d.text((c[0] - 150, c[1] + r - 4), "personaj o'ngi", font=F(12), fill=KUL)
    kp = (c[0] + tepa_kam[0], c[1] + tepa_kam[1]); kamera_belgi(d, kp, tepa_yon)
    # yondan
    d.text((10, 172), 'YONDAN (balandlik)', font=FB(14), fill=KUL)
    g = 292; d.line([(10, g), (SW - 10, g)], fill=(60, 60, 90), width=2)
    hb = (170, 212)
    d.ellipse((hb[0] - 20, hb[1] - 20, hb[0] + 20, hb[1] + 20), fill=(170, 160, 150))
    a = np.radians(bosh_egilish); nx, ny = np.cos(a), np.sin(a)
    strelka(d, (hb[0] + 22 * nx, hb[1] + 22 * ny), (hb[0] + 52 * nx, hb[1] + 52 * ny), KUL, 2, 8)
    d.line([(hb[0] - 2, hb[1] + 20), (hb[0] - 8, g)], fill=(120, 110, 110), width=6)
    kc = (60, yon_kam_h); v = np.array([hb[0] - kc[0], hb[1] - kc[1]], float)
    kamera_belgi(d, kc, v); d.line([kc, hb], fill=(255, 214, 102, 120), width=1)
    y0 = 300
    return im


def misol_panel(k, belgilar):
    im = gam('/home/claude/work/maqsad/k%02d.png', k); d = ImageDraw.Draw(im)
    for b in belgilar:
        b(d)
    return im


def biz_panel(k, belgilar):
    im = gam(W + '/ff-11/%02d.png', k - 1); d = ImageDraw.Draw(im)
    for b in belgilar:
        b(d)
    return im


def shamol(d):
    strelka(d, P(262, 16), P(262 + 2.9 * 14, 16 - 1.1 * 14), KOK, 3)
    yozuv(d, P(192, 24), 'zarra, px/tasvir:', KOK, F(13))
    yozuv(d, P(192, 33), 'yaqin +2.9,-1.1  uzoq +1.0,-0.4', KOK, F(13))


def ogirlik(d, x=300, y=60):
    strelka(d, P(x, y), P(x, y + 30), YASH, 3); yozuv(d, P(x - 42, y + 33), "og'irlik", YASH, F(13))


def quti(d, q, rang, t, joy=None, f=13):
    x0, y0, x1, y1 = q
    d.rectangle((P(x0, y0), P(x1, y1)), outline=rang, width=2)
    if t:
        yozuv(d, joy or P(x0, y1 + 2), t, rang, F(f))


rows = []
# 1-kadr
rows.append((
    sxema(1, (48, 44), (-1, -1), 262, -35, ''),
    misol_panel(1, [shamol, lambda d: ogirlik(d, 300, 60),
                    lambda d: quti(d, (95, 0, 160, 60), SAR, 'soch 134..142 gr: shamolda pastga-o\'ngga', P(96, 62)),
                    lambda d: quti(d, (50, 55, 80, 100), QIZ, 'astar cheti "(" -- kapyushon boshning ORQASIDA', P(2, 102)),
                    lambda d: yozuv(d, P(4, 150), "qor zichligi pastga 3x -- uch kadrda bir xil", OQ, F(13))]),
    biz_panel(1, [lambda d: quti(d, (0, 0, 60, 180), QIZ, 'kapyushon tik ustun, burmalar yo\'q', P(2, 4))]),
    "1-KADR (1..11): kamera O'NG-OLDDA (ikki ko'z), pastroqda (qiyalik 3-kadrdagidek -- qor zichligi bir xil); personaj o'ngga-tepaga qaraydi. Kapyushon boshning uzoq tomonida."))
# 2-kadr
rows.append((
    sxema(12, (0, 62), (0, -1), 240, 15, ''),
    misol_panel(12, [shamol,
                     lambda d: quti(d, (80, 40, 112, 100), QIZ, 'ichki pona L 8..10 (tashqi sirt L 19..21)', P(10, 102)),
                     lambda d: quti(d, (110, 0, 195, 70), SAR, 'soch kapyushon OLDIDA', P(150, 72))]),
    biz_panel(12, [lambda d: quti(d, (125, 0, 215, 120), QIZ, "halqa boshni o'rab oladi -- dubulg'a", P(2, 4))]),
    "2-KADR (12..13): kamera O'NGDA (profil), yaqin; bosh sal egilgan. Qirra yuzning ORQASIDAN o'tadi, profil ochiq; qirra boshni tepadan o'ramaydi."))
# 3-kadr
rows.append((
    sxema(17, (0, 62), (0, -1), 262, 50, ''),
    misol_panel(17, [shamol, lambda d: ogirlik(d, 250, 110),
                     lambda d: quti(d, (160, 52, 210, 80), SAR, 'qirra OSTI yorug\' L 43..48', P(62, 44)),
                     lambda d: quti(d, (138, 62, 162, 104), QIZ, 'ichki pona L 7..9', P(60, 106)),
                     lambda d: quti(d, (155, 78, 225, 125), YASH, 'soch osilgan 72..99 gr', P(170, 127)),
                     lambda d: yozuv(d, P(4, 150), "bosh 8 px/tasvir x4 tushadi; yorug' soch -67%", OQ, F(13))]),
    biz_panel(17, [lambda d: quti(d, (130, 60, 240, 180), QIZ, "bosh tik, ko'z ochiq, o'ngga qaraydi", P(2, 4)),
                   lambda d: yozuv(d, P(2, 22), "qirra osti tasma va ichki pona yo'q; cho'qqi dumaloq", QIZ, F(13))]),
    "3-KADR (14..22): kamera O'NGDA, PASTDA; bosh egiladi (yuz pastga-o'ngga). Qirra osti (yorug') va kapyushon ichi (qorong'i) ko'rinadi -- yondan-pastdan qaralganda shunday."))

HD, PAD, TX = 30, 10, 44
Wt = SW + 2 * PW + 4 * PAD
Ht = 70 + len(rows) * (HD + PH + TX + PAD)
v = Image.new('RGB', (Wt, Ht), (8, 8, 16)); d = ImageDraw.Draw(v)
d.text((PAD, 10), "12-o'tish: kamera qayerda, qaysi tomondan -- va kapyushon fizikasi", font=FB(20), fill=SAR)
d.text((PAD, 38), "Misol va biz (11-o'tish renderi), yorqinlik gamma 0.6 bilan ko'tarilgan. Raqamlar 320x180 da. Sxema -- o'qish; dalil -- misol panelidagi raqamlar.", font=F(14), fill=KUL)
y = 70
for sx, m, b, t in rows:
    d.text((PAD, y + 6), 'SXEMA', font=FB(15), fill=KUL); d.text((PAD * 2 + SW, y + 6), 'MISOL', font=FB(15), fill=SAR); d.text((PAD * 3 + SW + PW, y + 6), "BIZ (11-o'tish)", font=FB(15), fill=SAR)
    y += HD
    v.paste(sx, (PAD, y)); v.paste(m, (PAD * 2 + SW, y)); v.paste(b, (PAD * 3 + SW + PW, y))
    y += PH + 6
    d.text((PAD, y), t, font=F(15), fill=OQ)
    y += TX - 6 + PAD
v.save(OUT); print(OUT, v.size)
