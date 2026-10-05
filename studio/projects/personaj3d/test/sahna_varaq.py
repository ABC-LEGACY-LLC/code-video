"""SAHNA AUDITI VARAG'I (5-o'tish): har shot -- misol (o'lchangan nuqtalar sariq), sxema (kamera tepadan va yondan, bosh
egilishi), OLDIN (4-o'tish topshirilgan GIF paneli), HOZIR (5-o'tish). Sariq belgilar HAMMA panelda misolning o'rni --
bizning yuz shu joyga tushadimi, ko'z bilan ko'riladi. Raqamlar: test/sahna2_fit.mjs, sahna3_fit.mjs, sahna_oldin_hozir.mjs,
audit_misol/sahna_olch.py. python3 test/sahna_varaq.py"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

R = '/home/claude/work/personaj3d'
def shrift(n, qalin=False):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else '')
    return ImageFont.truetype(p, n)
F12, F14, F16, F20 = shrift(12), shrift(14), shrift(16, True), shrift(20, True)
def ochiq(im, g=0.62, m=1.3):
    a = np.asarray(im.convert('RGB')).astype(float) / 255
    return Image.fromarray((np.clip(a ** g * m, 0, 1) * 255).astype('uint8'))
PW, PH = 480, 270
S = PW / 320
SARIQ = (255, 214, 60)

SHOTLAR = [
  dict(nom="1-SHOT  (1..11-tasvir, 0.66 s)", k=1,
       belgi=[('+', 99.4, 48.7), ('+', 120.3, 49.3), ('+', 125.5, 84.5), ('+', 130.5, 60), ('.', 125.7, 91.0)] +
             [('.', x, y) for y, x in [(66.6, 130.3), (76.6, 131.7), (98.6, 129.6)]] + [('.', x, y) for x, y in [(104.8, 107.6), (116.8, 109.7), (124.8, 109.8)]],
       kam=dict(az=55, el=-8), eg=-0.30, eg_old=-0.30,
       matn=["NIMA QILADI: qorda turib yig'laydi. 1-6 -- bitta rasm (yuz 0.1 px gacha bir xil), faqat soch va ko'z yoshi",
             "  qimirlaydi; 6-9 yosh yonoqdan jag'ga oqadi, jag'da tomchi osiladi; 10-11 ko'zini yumib boshini profilga buradi, tomchi tushadi.",
             "QAYERGA QARAYDI: oldinga-o'ngga, sal TEPAGA -- bosh ~17 gr ko'tarilgan; ko'z ochiq, qorachiq boshga nisbatan to'g'ri.",
             "KAMERA: uning O'NG-OLDIDA (az 55), sal PASTDA (el -8), 7 birlik.  Dalil: 5 yuz nuqtasi + old kontur + jag' osti, RMS 0.6 px.",
             "  Bir ko'rinish faqat nisbiy burchakni beradi: el -8/-20/-30 -> bosh +17/+8/0 gr tepaga, lekin yonga 3/13/21 gr og'ishi kerak.",
             "BIZDA: sahna to'g'ri edi, o'zgarmadi. 'Yonga qaraydi' taassuroti SOCHDAN: ko'z orqasida ochiq teri 28-31 px (misol 8-12 px)."]),
  dict(nom="2-SHOT  (12-13-tasvir, 0.12 s)", k=12,
       belgi=[('.', x, y) for y, x in [(70,157),(72,159),(74,158.5),(76,157),(78,156),(80,155),(82,155),(84,156),(86,159.5),(88,161.5),(90,164.5),(92,165.5),(94,164.5),(96,163),(98,163),(100,162.5),(102,161),(104,161),(106,160.5),(108,159.5),(110,159.5)]] +
             [('.', x, y) for x, y in [(146, 114), (150, 113.5), (154, 113)]] + [('-', 133, 77.5, 144, 80)],
       kam=dict(az=84, el=-5), eg=-0.08, eg_old=-0.10, kam_old=dict(az=84, el=-4),
       matn=["NIMA QILADI: ko'zi yumuq, qimirlamaydi -- klipdagi eng tinch juftlik (12->13 farq 0.257).",
             "QAYERGA QARAYDI: oldinga (profil), bosh TEKIS (~5 gr tepaga); 'pastga' taassuroti -- yumuq ko'z chizig'i oldinga 17 gr pastga og'gan.",
             "KAMERA: O'NG YONIDA (profil, az 84), yuz balandligida (el -5), uzoqroq (12.9 birlik; yuz 1-shotdagining 0.55 hajmi).",
             "  Dalil: old kontur 21 qator + iyak osti, RMS 1.33 px. Misolda ko'z bizning 3/4 o'rnimizdan 17.5 px ORQADA -- anime profil ko'zi.",
             "OLDIN: egilish -0.10 + profilda pastki yuz oldinga surilgan -> old kontur RMS 9.9 px (maks 19.5), yuz ~20 gr TEPAGA og'gan edi.",
             "HOZIR: surish olib tashlandi, ko'z chizmasi bosh yon tomoniga ko'chadi -> kontur renderda +-2 px (RMS 1.1), ko'z -0.9/-0.1 px."]),
  dict(nom="3-SHOT  (14-22-tasvir, 0.54 s)", k=22,
       belgi=[('-', 152, 111, 159, 113)] + [('.', x, y) for y, x in [(144, 167), (146, 161), (148, 158), (150, 157), (152, 153), (154, 153), (156, 151)]] + [('.', x, y) for x, y in [(146, 158), (150, 158)]],
       kam=dict(az=55, el=-30), eg=0.68, eg_old=0.30, kam_old=dict(az=80, el=-5),
       matn=["NIMA QILADI: boshini kapyushon ichiga EGADI. 14 -- harakatdagi oraliq rasm; 15->18 ko'z atigi 5.5 px pastga tushadi,",
             "  keyin joyida (bosh 15 da allaqachon egilgan); boshning tepasi kapyushon soyasiga kiradi (yorug' soch 2.8 -> 1.0 %).",
             "QAYERGA QARAYDI: PASTGA -- bosh ~39 gr egilgan, ko'z yarim ochiq, yaltirog'i kiprik chizig'idan 2-3 px pastda.",
             "KAMERA: O'NG-OLDDA (az 55, 1-shot tomoni), PASTDA (el -30), yaqin (7.1).  Dalil: ko'z + iyak 7 qator + jag' osti, RMS 0.88 px,",
             "  bosh burilmagan (0.03), og'magan (-0.05). OLDIN: kamera yonda (az 80, el -5), bosh 9-17 gr -- profilda tik, 'yonga qaraydi';",
             "  renderda ko'z va iyak misol joyida YO'Q edi. HOZIR: ko'z izi 15-22 da +-1-2 px, iyak cheti +-1-3 px (renderda o'lchangan)."]),
]

def belgilar(d, sh):
    for b in sh['belgi']:
        if b[0] == '+':
            x, y = b[1] * S, b[2] * S; d.line([(x - 5, y), (x + 5, y)], fill=SARIQ, width=2); d.line([(x, y - 5), (x, y + 5)], fill=SARIQ, width=2)
        elif b[0] == '.':
            x, y = b[1] * S, b[2] * S; d.ellipse([x - 1.6, y - 1.6, x + 1.6, y + 1.6], fill=SARIQ)
        else:
            d.line([(b[1] * S, b[2] * S), (b[3] * S, b[4] * S)], fill=SARIQ, width=3)

def sxema(w, h, sh):
    im = Image.new('RGB', (w, h), (20, 20, 30)); d = ImageDraw.Draw(im)
    # TEPADAN: bosh markazda, u +x (o'ngga) qaraydi, o'ng tomoni pastda
    cx, cy, r = w // 2, 72, 22
    d.text((8, 4), "TEPADAN", font=F12, fill=(180, 180, 200))
    d.text((cx + 34, cy - 7), "qarashi ->", font=F12, fill=(150, 150, 170)); d.text((cx - 18, cy + 30), "o'ng yoni", font=F12, fill=(150, 150, 170))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(200, 190, 185), width=2); d.polygon([(cx + r, cy - 5), (cx + r + 9, cy), (cx + r, cy + 5)], fill=(200, 190, 185))
    def kamT(k, rang, en=2):
        a = math.radians(k['az']); x, y = cx + 58 * math.cos(a), cy + 58 * math.sin(a)
        d.line([(x, y), (cx + 28 * math.cos(a), cy + 28 * math.sin(a))], fill=rang, width=en); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=rang)
    if sh.get('kam_old'): kamT(sh['kam_old'], (230, 120, 60), 1)
    kamT(sh['kam'], (90, 230, 120))
    # YONDAN: balandlik; bosh o'ngga qaraydi, egilish (+ pastga)
    cy2 = 205
    d.text((8, 132), "YONDAN", font=F12, fill=(180, 180, 200))
    d.line([(20, cy2), (w - 20, cy2)], fill=(60, 60, 80))
    d.ellipse([cx - r, cy2 - r, cx + r, cy2 + r], outline=(200, 190, 185), width=2)
    def qarash(eg, rang, en):                                  # yuz yo'nalishi: egilish + -- pastga (ekranda y pastga)
        d.line([(cx, cy2), (cx + 48 * math.cos(eg), cy2 + 48 * math.sin(eg))], fill=rang, width=en)
    qarash(sh['eg_old'], (230, 120, 60), 2); qarash(sh['eg'], (90, 230, 120), 3)
    def kamY(k, rang, en=2):
        e = math.radians(k['el']); x, y = cx + 62 * math.cos(e), cy2 - 62 * math.sin(e)
        d.line([(x, y), (cx + 26 * math.cos(e), cy2 - 26 * math.sin(e))], fill=rang, width=en); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=rang)
    if sh.get('kam_old'): kamY(sh['kam_old'], (230, 120, 60), 1)
    kamY(sh['kam'], (90, 230, 120))
    d.text((8, h - 36), "yashil -- misol / HOZIR", font=F12, fill=(90, 230, 120))
    d.text((8, h - 20), "to'q sariq -- OLDIN", font=F12, fill=(230, 120, 60))
    return im

SW = 300; W = 3 * PW + SW + 5 * 10; TX = 6 * 19 + 10; RH = PH + 30 + TX
H = 70 + 3 * RH + 150
c = Image.new('RGB', (W, H), (12, 12, 18)); d = ImageDraw.Draw(c)
d.text((10, 10), "5-O'TISH: SAHNA AUDITI -- misol nima qiladi, qayerga qaraydi, kamera qayerda (har shot o'lchangan)", font=F20, fill=(245, 230, 190))
d.text((10, 40), "Sariq belgilar -- misoldan o'lchangan nuqtalar (hamma panelda misol o'rni). Rasm -- misolniki faqat texnika uchun; personaj bizniki.", font=F14, fill=(190, 190, 205))
y = 70
for sh in SHOTLAR:
    k = sh['k']
    d.text((10, y), sh['nom'], font=F16, fill=(255, 220, 120))
    x = 10; yy = y + 26
    for j, (p, t) in enumerate([('/home/claude/work/maqsad/k%02d.png' % k, 'MISOL k%02d' % k), (None, 'SXEMA'),
                                (R + '/kadrlar-misol/anime-topshirilgan4/%03d.png' % (k - 1), "OLDIN (4-o'tish)"), (R + '/kadrlar-misol/anime-sahna5/%03d.png' % (k - 1), "HOZIR (5-o'tish)")]):
        if p is None:
            c.paste(sxema(SW, PH, sh), (x, yy)); x += SW + 10; continue
        im = ochiq(Image.open(p).resize((PW, PH), Image.LANCZOS))
        dd = ImageDraw.Draw(im); belgilar(dd, sh); dd.text((6, 4), t, font=F14, fill=(255, 255, 255))
        c.paste(im, (x, yy)); x += PW + 10
    ty = yy + PH + 6
    for s in sh['matn']:
        d.text((14, ty), s, font=F14, fill=(215, 215, 225)); ty += 19
    y += RH
d.text((10, y + 4), "SAHNADAN TASHQARI -- hali farq (keyingi ish):", font=F16, fill=(255, 220, 120))
qolgan = ["SOCH: boshning yon tomonini yopmaydi (1-shot ko'z orqasida ochiq teri 28-31 px, misol 8-12) -- yuz 'burilgan' ko'rinadi; profilda peshona",
          "  tutamlari yuz ustiga osiladi; misolda soch katta tikanli massa (2-shot yorug' maydon 4.3 %, bizda 0.2 %).",
          "KAPYUSHON: 2-shotda bosh ustida baland; 3-shotda boshning tepasini soyaga olmaydi (yorug' maydon misol 1.0 %, bizda 3.5 %) -- oxirida qilamiz.",
          "FON: misolning foni 2D qatlam (zichlik gradienti va qor harakati uch shotda bir xil) -- bizda fon 'tepasi' kameraga bog'landi: 3-shotda kamera",
          "  30 gr pastdan qaraganda ham fon 1-shotdagidek (qor maydoni kadr pastida)."]
ty = y + 30
for s in qolgan:
    d.text((14, ty), s, font=F14, fill=(215, 215, 225)); ty += 19
c.save(R + '/chiqish/sahna-audit-5.png'); print(c.size)
