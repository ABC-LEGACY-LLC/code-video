"""KAMERA AUDITI VARAG'I (8-o'tish): "10 dan keyin kamera zoom ga o'xshab katta-kichik" -- kesishlar atrofidagi tasvirlar
(10..14) MISOL | OLDIN (7-o'tish, topshirilgan GIF) | HOZIR (8-o'tish, GIF yo'lidan); har tasvir ko'rinadigan bosh maydoni
(chiziqlar), shot figura maydoni, qor zichligi va kesishda qor uzluksizligi. Raqamlar shu yerda hisoblanadi
(kap_olch.py, qor_zoom.py -- ikkala tomonda bir xil kod). python3 test/kamera_varaq.py"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import kap_olch as KO
import qor_zoom as QZ
import masshtab as MS

R = '/home/claude/work/personaj3d'
A7, A8 = R + '/kadrlar-misol/topshirilgan7', R + '/kadrlar-misol/topshirilgan8'
R7, R8 = R + '/kadrlar-misol/rol-kap7', R + '/kadrlar-misol/rol-kamera8'
def shrift(n, qalin=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else ''), n)
F13, F16, F20 = shrift(13), shrift(16, True), shrift(20, True)
OQ = (225, 225, 235); SAR = (255, 214, 60); FON = (12, 12, 18)
RANG = {'misol': (255, 120, 220), 'OLDIN (7)': (150, 150, 170), 'HOZIR (8)': (90, 230, 120)}
PW, PH, P = 320, 180, 8
KS = [10, 11, 12, 13, 14]

def lift(im):
    a = np.asarray(im.convert('RGB').resize((PW, PH), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def main():
    o7, o8 = KO.olch(R7), KO.olch(R8)
    q = {nom: QZ.olch(d)[0] for nom, d in (('misol', 'misol'), ('OLDIN (7)', A7), ('HOZIR (8)', A8))}
    kes = {nom: [QZ.kesish(d, i, j) for i, j in ((11, 12), (13, 14))] for nom, d in (('misol', 'misol'), ('OLDIN (7)', A7), ('HOZIR (8)', A8))}
    TW = 5 * PW + 6 * P + 150
    # 1. tasvirlar
    rows = []
    for nom, f in (('MISOL', lambda k: '/home/claude/work/maqsad/k%02d.png' % k), ("OLDIN (7-o'tish)", lambda k: '%s/%03d.png' % (A7, k - 1)),
                   ("HOZIR (8-o'tish)", lambda k: '%s/%03d.png' % (A8, k - 1))):
        c = Image.new('RGB', (TW, PH + 6), FON); d = ImageDraw.Draw(c)
        d.text((P, PH // 2 - 8), nom, font=F16, fill=SAR)
        for j, k in enumerate(KS):
            x = 150 + P + j * (PW + P); c.paste(lift(Image.open(f(k))), (x, 3)); d.text((x + 4, 6), 'k%02d%s' % (k, ' (kesish)' if k in (12, 14) else ''), font=F13, fill=OQ)
        rows.append(c)
    # 2. chiziqlar: ko'rinadigan bosh maydoni har tasvir
    GW, GH = TW - 2 * P, 260
    g = Image.new('RGB', (TW, GH + 40), FON); d = ImageDraw.Draw(g)
    d.text((P, 4), "Ko'rinadigan bosh maydoni (px, 320x180) har tasvirda -- misol / OLDIN (7) / HOZIR (8); tik chiziq -- kesish", font=F16, fill=SAR)
    x0, y0, x1, y1 = 70, 30, TW - 30, GH + 20
    ser = {'misol': [o8['tasvir'][f]['misol'] for f in range(22)], 'OLDIN (7)': [o7['tasvir'][f]['biz'] for f in range(22)], 'HOZIR (8)': [o8['tasvir'][f]['biz'] for f in range(22)]}
    vmin, vmax = 3000, 8000
    X = lambda i: x0 + (x1 - x0) * i / 21; Y = lambda v: y1 - (y1 - y0) * (v - vmin) / (vmax - vmin)
    for v in range(3000, 8001, 1000):
        d.line([(x0, Y(v)), (x1, Y(v))], fill=(40, 40, 55)); d.text((8, Y(v) - 7), '%d' % v, font=F13, fill=(150, 150, 165))
    for i in range(22): d.text((X(i) - 6, y1 + 3), '%d' % (i + 1), font=F13, fill=(150, 150, 165))
    for kx in (10.5, 12.5): d.line([(X(kx), y0), (X(kx), y1)], fill=(110, 90, 40), width=2)
    for nom, v in ser.items():
        pts = [(X(i), Y(v[i])) for i in range(22)]
        for s0, s1 in ((0, 11), (11, 13), (13, 22)):
            if s1 - s0 > 1: d.line(pts[s0:s1], fill=RANG[nom], width=3)
            for pnt in pts[s0:s1]: d.ellipse([pnt[0] - 3, pnt[1] - 3, pnt[0] + 3, pnt[1] + 3], fill=RANG[nom])
    lx = x1 - 190
    for j, nom in enumerate(ser):
        d.line([(lx, y0 + 10 + 18 * j), (lx + 26, y0 + 10 + 18 * j)], fill=RANG[nom], width=3); d.text((lx + 32, y0 + 3 + 18 * j), nom, font=F13, fill=OQ)
    # 3. matn
    s7, s8 = o7['shot'], o8['shot']
    ms = {nom: [MS.ecc(MS.L(MS.fayl(d, i)), MS.L(MS.fayl(d, i + 1))) for i in (9, 10)] for nom, d in (('misol', 'misol'), ('OLDIN (7)', A7), ('HOZIR (8)', A8))}
    matn = [
        "1-SHOT 9 -> 10 -> 11 (\"10 dan keyin\"): figura mintaqasi masshtabi (chap 45 %%, ECC, masshtab.py): misol %.3f / %.3f;  OLDIN %.3f / %.3f (kichrayardi);  HOZIR %.3f / %.3f"
        % (ms['misol'][0], ms['misol'][1], ms['OLDIN (7)'][0], ms['OLDIN (7)'][1], ms['HOZIR (8)'][0], ms['HOZIR (8)'][1]),
        "   sabab: bosh burilganda kapyushon unga 0.35 ulushda ergashib, qirrasi bosh orqasini yopib borardi (ko'rinadigan bosh 11-tasvirda 6094 px, misol 7031);",
        "   endi kapyushon shot ichidagi aylanishga 0.2 ulushda ergashadi (kfIch -- o'lchangan optimum, bosh IoU 0.802 -> 0.809; 11-tasvirda 6862 px).",
        "Figura maydoni (kapyushon + bosh + plash, yopilish xaritasi) shot 1 / 2 / 3: misol %.3f / %.3f / %.3f;  OLDIN %.3f / %.3f / %.3f;  HOZIR %.3f / %.3f / %.3f"
        % (s8['1-shot']['figura_maydon_misol'], s8['2-shot']['figura_maydon_misol'], s8['3-shot']['figura_maydon_misol'],
           s7['1-shot']['figura_maydon'], s7['2-shot']['figura_maydon'], s7['3-shot']['figura_maydon'],
           s8['1-shot']['figura_maydon'], s8['2-shot']['figura_maydon'], s8['3-shot']['figura_maydon']),
        "   misolda 1 -> 2 -> 3 shotda figura o'sadi; OLDIN da 2-shotda KICHRAYARDI (kamera uzoqlashgandek), 3-shotda keskin kattalashardi.",
        "2-shot: ko'rinadigan bosh IoU %.3f -> %.3f, biz/misol maydoni %.2f -> %.2f, figura IoU %.3f -> %.3f  (kamera d 12.88 -> 10.32, test/fit_kamera8.mjs)"
        % (s7['2-shot']['iou'], s8['2-shot']['iou'], s7['2-shot']['nisbat'], s8['2-shot']['nisbat'], s7['2-shot']['figura'], s8['2-shot']['figura']),
        "Qor zichligi (zarra / 10k px, fon qutisida) shot 1 / 2 / 3: misol %.0f / %.0f / %.0f;  OLDIN %.0f / %.0f / %.0f;  HOZIR %.0f / %.0f / %.0f"
        % tuple([q['misol'][s]['soni'] for s in '123'] + [q['OLDIN (7)'][s]['soni'] for s in '123'] + [q['HOZIR (8)'][s]['soni'] for s in '123']),
        "Kesishda qor uzluksizligi (11->12, 13->14; fazaviy korrelyatsiya cho'qqisi r): misol %.2f / %.2f;  OLDIN %.2f / %.2f;  HOZIR %.2f / %.2f"
        % (kes['misol'][0][2], kes['misol'][1][2], kes['OLDIN (7)'][0][2], kes['OLDIN (7)'][1][2], kes['HOZIR (8)'][0][2], kes['HOZIR (8)'][1][2]),
        "   misolda qor BITTA 2D qatlam -- kesishda davom etadi; bizda har shot kamerasi qorni qayta chizardi (2-shotda zarra +51 %). Endi qor 1-shot kamerasi",
        "   fazosida, har shotga o'xshashlik bilan ko'chiriladi (chuqurlik d_shot/d_1 ga cho'zilgan -- zarra bosh oldida/ortida qolishi saqlanadi).",
        "Ochiq: 2-shotda yuz shu masshtabda misolnikidan ~1.25 barobar katta (old kontur 96-112 qatorlarda 10-16 px o'ngda) -- misolda profil yuzi boshiga",
        "   nisbatan kichik chizilgan; yuz o'tishida. Qor ko'rinishi misoldan farq qiladi (zichlik 195 vs 271, zarra p90 4.0 vs 7.3 px, tezlik 1.5 vs 2.6 px/kadr).",
    ]
    t = Image.new('RGB', (TW, 18 * len(matn) + 16), FON); d = ImageDraw.Draw(t)
    for i, s in enumerate(matn): d.text((P, 8 + 18 * i), s, font=F13, fill=OQ)
    bosh = Image.new('RGB', (TW, 60), FON); d = ImageDraw.Draw(bosh)
    d.text((P, 8), "8-O'TISH: KAMERA MASSHTABI va QOR QATLAMI -- kesishda 'kamera zoom' yo'q (ikkala tomonda bir xil kod)", font=F20, fill=(255, 235, 200))
    d.text((P, 36), "Rasm -- misolniki faqat texnika (masshtab, qatlam, massa) uchun; personaj va chizma bizniki.", font=F13, fill=OQ)
    parts = [bosh] + rows + [g, t]
    W = Image.new('RGB', (TW, sum(p.height for p in parts)), FON); y = 0
    for p in parts: W.paste(p, (0, y)); y += p.height
    W.save(R + '/chiqish/kamera-audit-8.png'); print(R + '/chiqish/kamera-audit-8.png', W.size)

main()
