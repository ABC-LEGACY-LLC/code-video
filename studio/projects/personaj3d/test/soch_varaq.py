"""SOCH AUDITI VARAG'I (6-o'tish): har shot -- MISOL | OLDIN (5-o'tish, topshirilgan GIF paneli) | HOZIR (6-o'tish, GIF
yo'lidan) | yorug' soch xaritasi OLDIN | xaritasi HOZIR. Xarita (bir xil kod, test/audit_misol/soch_qoplash.py): magenta --
faqat misol sochi yorug', yashil -- faqat bizniki, oq -- ikkalasi; xira qizil -- bizning teri, xira ko'k -- bizning
kapyushon (rol renderidan aniq). Raqamlar: soch_olch.py, soch_qoplash.py (toza render). python3 test/soch_varaq.py"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import soch_qoplash as SQ
from kompozitsiya import niqob

R = '/home/claude/work/personaj3d'
def shrift(n, qalin=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else ''), n)
F13, F16, F20 = shrift(13), shrift(16, True), shrift(20, True)
PW, PH = 400, 225
OQ = (225, 225, 235); SAR = (255, 214, 60)

def xarita(toza, rol, ks):
    fm = np.zeros((180, 320)); fb = np.zeros((180, 320)); ter = np.zeros((180, 320)); kap = np.zeros((180, 320))
    for k in ks:
        fm += niqob(SQ.L320('/home/claude/work/maqsad/k%02d.png' % k)); fb += niqob(SQ.L320('%s/%03d.png' % (toza, k - 1)))
        r = SQ.rol320('%s/%03d.png' % (rol, k - 1)); ter += r == 'teri'; kap += r == 'kap'
    n = len(ks); fm /= n; fb /= n; ter /= n; kap /= n
    img = np.stack([fm, fb, fm], -1)
    img = np.maximum(img, np.stack([ter * 0.25, ter * 0.10, ter * 0.10], -1))
    img = np.maximum(img, np.stack([kap * 0.0, kap * 0.0, kap * 0.35], -1))
    return Image.fromarray((img * 255).clip(0, 255).astype(np.uint8)).resize((PW, PH), Image.NEAREST)

SHOT = [
  dict(nom="1-SHOT (1..11) -- 3/4, pastdan, bosh ~17 gr tepaga", k=1, ks=range(1, 12), matn=[
    "Misolning yorug' sochi bizning yorug' sochimiz bilan ustma-ust: 1 % -> 49 % (qolgani bizda: teri 17 %, soya 14 %, fon 17 %).",
    "Yaqin ko'z ORTIDA ochiq teri 28..33 -> 6..9 px (misol 1..9); peshona teri (ko'z ustida) 15..23.5 -> 2.5..5.5 px (misol 1..4.5).",
    "Yorug' massa 1.51 % (58, 35) -> 5.48 % (84, 28); misol 3.01 % (104, 40) -- markaz yuzga 26 px yaqinlashdi, maydon katta.",
    "'Yonga qaraydi' taassuroti ketdi: yaqin tutamlar ko'z ortidan, jag' ORTIGA osiladi (1-shot 10-11 da ham yonoq ustiga tushmaydi)."]),
  dict(nom="2-SHOT (12-13) -- profil, bosh tekis", k=12, ks=(12, 13), matn=[
    "Ustma-ust: 0 % -> 28 %. Profil ko'zi ustida soch 0.44 -> 0.00 (misol 0). Yorug' massa 0.15 % -> 1.88 % (misol 4.29 %).",
    "Misolning yorug' sochi bizning KAPYUSHON ostida 49 % -> 14 %: soch cho'qqisi endi kapyushondan OLDINDA (misoldagidek).",
    "Soch shakli: tojdan ~1 birlik yuqoriga, peshonadan ~1 birlik oldinga taralgan yelpig'ich (misol qatorlaridan, bosh fazosida);",
    "shamol orqadan -- misolda qor o'ngga-tepaga siljiydi; bizning shamol ham shu tomonga (fizika og'irlik + shamol egilishi)."]),
  dict(nom="3-SHOT (14-22) -- pastdan, bosh ~39 gr egilgan", k=20, ks=range(14, 23), matn=[
    "Ustma-ust: 0 % -> 43 %: misolning yorug' sochi (yuz OLDIDA osilgan peshona sochi) endi bizda ham shu joyda.",
    "OCHIQ: yorug' massa 3.13 % -> 9.60 %, misol 1.74 % -- soch cho'qqisi kapyushondan chiqib yoritilgan; misolda toj",
    "kapyushon ostida/soyasida. Kapyushon gumbazi bu shotda oldinga sirg'antirildi (kapSirg; 11.1 -> 9.6 %), to'liq yechim --",
    "kapyushon o'tishida (kapyushon qirrasi/teshigi uch shotda misolning qorong'i massasiga moslanadi)."]),
]

def main():
    P = 8; TW = 5 * PW + 6 * P
    rows = []
    for sh in SHOT:
        k = sh['k']
        h = 30 + PH + 22 + 18 * len(sh['matn']) + 14
        c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
        d.text((P, 6), sh['nom'], font=F16, fill=SAR)
        pan = [('MISOL k%02d' % k, Image.open('/home/claude/work/maqsad/k%02d.png' % k)),
               ("OLDIN (5-o'tish)", Image.open('%s/kadrlar-misol/topshirilgan5/%03d.png' % (R, k - 1))),
               ("HOZIR (6-o'tish)", Image.open('%s/kadrlar-misol/topshirilgan6/%03d.png' % (R, k - 1))),
               ("yorug' soch: OLDIN", xarita(R + '/kadrlar-toza-5', R + '/kadrlar-misol/rol-sahna5', sh['ks'])),
               ("yorug' soch: HOZIR", xarita(R + '/kadrlar-toza-6', R + '/kadrlar-misol/rol-soch6', sh['ks']))]
        for j, (t, im) in enumerate(pan):
            x = P + j * (PW + P)
            c.paste(im.convert('RGB').resize((PW, PH), Image.LANCZOS), (x, 30))
            d.text((x + 4, 33), t, font=F13, fill=OQ)
        y = 30 + PH + 10
        for s in sh['matn']:
            d.text((P, y), s, font=F13, fill=OQ); y += 18
        rows.append(c)
    bosh = Image.new('RGB', (TW, 76), (12, 12, 18)); d = ImageDraw.Draw(bosh)
    d.text((P, 8), "6-O'TISH: SOCH -- misolning yorug' soch massasi qayerda, bizniki qayerda (ikkala tomonda bir xil kod)", font=F20, fill=(255, 235, 200))
    d.text((P, 38), "Xarita: magenta -- faqat misol sochi yorug', yashil -- faqat bizniki, oq -- ikkalasi; xira qizil -- bizning teri, xira ko'k -- bizning kapyushon.",
           font=F13, fill=OQ)
    d.text((P, 56), "Rasm -- misolniki faqat texnika (massa, qoplash) uchun; soch chizmasi va shakli bizniki, misol massasiga moslangan.", font=F13, fill=OQ)
    W = Image.new('RGB', (TW, 76 + sum(r.height for r in rows)), (12, 12, 18)); W.paste(bosh, (0, 0)); y = 76
    for r in rows: W.paste(r, (0, y)); y += r.height
    W.save(R + '/chiqish/soch-audit-6.png'); print(R + '/chiqish/soch-audit-6.png', W.size)

main()
