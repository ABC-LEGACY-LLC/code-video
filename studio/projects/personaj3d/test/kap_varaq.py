"""KAPYUSHON AUDITI VARAG'I (7-o'tish): har shot -- MISOL | OLDIN (6-o'tish, topshirilgan GIF paneli) | HOZIR (7-o'tish,
GIF yo'lidan) | ko'rinadigan bosh xaritasi OLDIN | HOZIR; sakrash (9->10, 10->11 farq xaritasi); figura bloklari.
Sariq kontur -- misolning ko'rinadigan boshi (test/audit_misol/bosh_niqob.py), yashil -- bizniki (rol renderidan).
Xarita: magenta -- faqat misolda bosh, yashil -- faqat bizda, oq -- ikkalasida. Raqamlar shu yerda hisoblanadi
(kap_olch.py, sakrash.py -- ikkala tomonda bir xil kod). python3 test/kap_varaq.py"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import kap_olch as KO
import sakrash as SK

R = '/home/claude/work/personaj3d'
OLDIN_A, HOZIR_A = R + '/kadrlar-misol/topshirilgan6', R + '/kadrlar-misol/topshirilgan7'
OLDIN_R, HOZIR_R = R + '/kadrlar-misol/rol-soch6', R + '/kadrlar-misol/rol-kap7'
def shrift(n, qalin=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else ''), n)
F13, F16, F20 = shrift(13), shrift(16, True), shrift(20, True)
PW, PH, P = 400, 225, 8
OQ = (225, 225, 235); SAR = (255, 214, 60)

def kontur(m): return m & ~ndimage.binary_erosion(m)
def panel(src, f, konturlar):
    im = Image.open(src).convert('RGB').resize((PW, PH), Image.LANCZOS); a = np.asarray(im).copy()
    for m, rang in konturlar:
        k = np.asarray(Image.fromarray(kontur(m).astype(np.uint8) * 255).resize((PW, PH), Image.NEAREST)) > 0
        a[k] = rang
    return Image.fromarray(a)
def xarita(f, rold):
    mr = KO.misol(f); mb = KO.bosh(KO.rol('%s/%03d.png' % (rold, f)), f)
    a = np.zeros((180, 320, 3), np.uint8); a[mr & ~mb] = (255, 0, 255); a[mb & ~mr] = (0, 230, 0); a[mr & mb] = (215, 215, 215)
    return Image.fromarray(a).resize((PW, PH), Image.NEAREST)
def farq(d, i, j):
    e = SK.xarita(d, i, j)
    return Image.fromarray(np.clip(e * 90, 0, 255).astype(np.uint8)).convert('RGB').resize((PW, PH), Image.NEAREST), float(e[:, :128].mean())

def main():
    o0, o1 = KO.olch(OLDIN_R), KO.olch(HOZIR_R)
    j0, j1, jm = SK.juftlar(OLDIN_A), SK.juftlar(HOZIR_A), SK.juftlar('misol')
    TW = 5 * PW + 6 * P; rows = []
    SH = [('1-SHOT (1..11) -- 3/4, pastdan', 9, '1-shot'), ('2-SHOT (12-13) -- profil', 11, '2-shot'), ('3-SHOT (14-22) -- bosh 39 gr egilgan', 17, '3-shot')]
    IZOH = {'1-shot': "Misolda kapyushon qirrasi yaqin soch massasining orqasida: bosh orqasi, qopqoq va bo'yin yopiq.",
            '2-shot': "Misolda katta soch massasi kapyushon OLDIDA; yuz va jag' bizda kichikroq (yuz o'tishida) -- IoU shu bilan cheklangan.",
            '3-shot': "Misolda bosh kapyushon ICHIGA egiladi: faqat pastki yuz va old tutamlar ko'rinadi, toj va orqa soyada."}
    for nom, f, s in SH:
        e0, e1 = o0['shot'][s], o1['shot'][s]
        matn = ["Ko'rinadigan bosh IoU (shot o'rtachasi) %.3f -> %.3f;  biz/misol maydoni %.2f -> %.2f" % (e0['iou'], e1['iou'], e0['nisbat'], e1['nisbat'])
                + ("   figura (silueta) %.3f -> %.3f" % (e0['figura'], e1['figura']) if 'figura' in e0 else ''),
                IZOH[s]]
        h = 30 + PH + 12 + 18 * len(matn) + 10
        c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
        d.text((P, 6), nom + '  -- tasvir %d' % (f + 1), font=F16, fill=SAR)
        mr = KO.misol(f)
        mb0 = KO.bosh(KO.rol('%s/%03d.png' % (OLDIN_R, f)), f); mb1 = KO.bosh(KO.rol('%s/%03d.png' % (HOZIR_R, f)), f)
        pan = [('MISOL k%02d' % (f + 1), panel('/home/claude/work/maqsad/k%02d.png' % (f + 1), f, [(mr, (255, 220, 0))])),
               ("OLDIN (6-o'tish) IoU %.2f" % o0['tasvir'][f]['iou'], panel('%s/%03d.png' % (OLDIN_A, f), f, [(mr, (255, 220, 0)), (mb0, (60, 255, 60))])),
               ("HOZIR (7-o'tish) IoU %.2f" % o1['tasvir'][f]['iou'], panel('%s/%03d.png' % (HOZIR_A, f), f, [(mr, (255, 220, 0)), (mb1, (60, 255, 60))])),
               ('bosh xaritasi: OLDIN', xarita(f, OLDIN_R)), ('bosh xaritasi: HOZIR', xarita(f, HOZIR_R))]
        for j, (t, im) in enumerate(pan):
            x = P + j * (PW + P); c.paste(im, (x, 30)); d.text((x + 4, 33), t, font=F13, fill=OQ)
        y = 30 + PH + 10
        for t in matn: d.text((P, y), t, font=F13, fill=OQ); y += 18
        rows.append(c)
    # sakrash qatori
    h = 30 + PH + 12 + 18 * 2 + 10
    c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
    d.text((P, 6), "SAKRASH: 9 -> 10 -> 11 farq xaritasi (oq -- o'zgargan joy; chap 40 % energiyasi)", font=F16, fill=SAR)
    pan = []
    for t, dd, i, j in (('MISOL', 'misol', 9, 10), ('OLDIN', OLDIN_A, 9, 10), ('HOZIR', HOZIR_A, 9, 10), ('OLDIN', OLDIN_A, 10, 11), ('HOZIR', HOZIR_A, 10, 11)):
        im, en = farq(dd, i, j); pan.append(('%s %d->%d  %.3f' % (t, i, j, en), im))
    for j, (t, im) in enumerate(pan):
        x = P + j * (PW + P); c.paste(im, (x, 30)); d.text((x + 4, 33), t, font=F13, fill=SAR)
    y = 30 + PH + 10
    for t in ("Chap 40 %% energiyasi: 9->10 misol %.3f, OLDIN %.3f, HOZIR %.3f;  10->11 misol %.3f, OLDIN %.3f, HOZIR %.3f;  12->13 (ushlangan) misol %.3f, OLDIN %.3f, HOZIR %.3f"
              % (jm[(9, 10)], j0[(9, 10)], j1[(9, 10)], jm[(10, 11)], j0[(10, 11)], j1[(10, 11)], jm[(12, 13)], j0[(12, 13)], j1[(12, 13)]),
              "Bosh orqasi endi kapyushon ostida -- 10-tasvirdagi burilish/og'ish bosh siluetini emas, yuz va sochni o'zgartiradi (qolgani: yuz va soch o'tishlari)."):
        d.text((P, y), t, font=F13, fill=OQ); y += 18
    rows.append(c)
    bosh = Image.new('RGB', (TW, 76), (12, 12, 18)); d = ImageDraw.Draw(bosh)
    d.text((P, 8), "7-O'TISH: KAPYUSHON -- ko'rinadigan bosh (yuz + soch) har shotda misoldagi joyda va o'lchamda (ikkala tomonda bir xil kod)", font=F20, fill=(255, 235, 200))
    d.text((P, 38), "Sariq -- misolning ko'rinadigan boshi, yashil -- bizniki (rol renderidan aniq). Xarita: magenta -- faqat misolda, yashil -- faqat bizda, oq -- ikkalasida.", font=F13, fill=OQ)
    d.text((P, 56), "Rasm -- misolniki faqat texnika (massa, qoplash) uchun; kapyushon bizning parametrik sirtimiz, shot bo'yicha misol massasiga moslangan.", font=F13, fill=OQ)
    W = Image.new('RGB', (TW, 76 + sum(r.height for r in rows)), (12, 12, 18)); W.paste(bosh, (0, 0)); y = 76
    for r in rows: W.paste(r, (0, y)); y += r.height
    W.save(R + '/chiqish/kapyushon-audit-7.png'); print(R + '/chiqish/kapyushon-audit-7.png', W.size)

main()
