"""9-O'TISH VARAG'I: BITTA 3D DUNYO -- kamera sinovi va uch shot birgalikda (bir xil kod, test/olch9.py natijalari).
Kadrlar: MISOL | OLDIN (8-o'tish, topshirilgan GIF kadrlari) | HOZIR (9-o'tish). Jadval: kamera sinovidagi eng katta
qattiq-bo'lmagan siljish (px, 320x180) har qism; uch shot o'lchovlari; qoldiqlar.
python3 test/dunyo_varaq9.py TEG   (test/olch9_8.json va test/olch9_TEG.json; kadrlar-misol/anime-TEG)"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import osmon_olch as OS

R = '/home/claude/work/personaj3d'
TEG = sys.argv[1]
def shrift(n, qalin=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else ''), n)
F12, F13, F15, F18 = shrift(12), shrift(13), shrift(15, True), shrift(18, True)
OQ = (225, 225, 235); SAR = (255, 214, 60); FON = (12, 12, 18); YASHIL = (120, 230, 140); QIZ = (255, 110, 110)
A, B = json.load(open(R + '/test/olch9_8.json')), json.load(open(R + '/test/olch9_%s.json' % TEG))
KS = [5, 10, 11, 12, 13, 16, 21]; PW, PH = 240, 135

def lift(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((PW, PH), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def main():
    TW = 150 + len(KS) * (PW + 6) + 10
    parts = []
    bosh = Image.new('RGB', (TW, 64), FON); d = ImageDraw.Draw(bosh)
    d.text((10, 8), "9-O'TISH: BITTA 3D DUNYO -- shotga faqat kamera tegishli (yamoqlar olib tashlandi)", font=F18, fill=(255, 235, 200))
    d.text((10, 38), "Rasm -- misolniki faqat texnika (sahna, massa, vaqt) uchun; personaj va chizma bizniki. Raqamlar: ikkala tomonda bir xil kod.", font=F13, fill=OQ)
    parts.append(bosh)
    for nom, f in (('MISOL', lambda k: '/home/claude/work/maqsad/k%02d.png' % k), ("OLDIN (8-o'tish)", lambda k: '%s/kadrlar-misol/topshirilgan8/%03d.png' % (R, k - 1)),
                   ("HOZIR (9-o'tish)", lambda k: '%s/kadrlar-misol/anime-%s/%03d.png' % (R, TEG, k - 1))):
        c = Image.new('RGB', (TW, PH + 8), FON); d = ImageDraw.Draw(c)
        d.text((10, PH // 2 - 8), nom, font=F15, fill=SAR)
        for j, k in enumerate(KS):
            x = 150 + j * (PW + 6); c.paste(lift(f(k)), (x, 4)); d.text((x + 4, 6), 'k%02d' % k, font=F12, fill=OQ)
        parts.append(c)
    # kamera sinovi jadvali
    q = ['teri', 'koz', 'soch', 'kapyushon', 'qor']; nomq = {'teri': 'bosh sirti', 'koz': "yaqin ko'z", 'soch': 'soch', 'kapyushon': 'kapyushon', 'qor': 'qor'}
    t = Image.new('RGB', (TW, 150), FON); d = ImageDraw.Draw(t)
    d.text((10, 6), "KAMERA SINOVI (poza va vaqt ushlangan, faqat kamera yuradi) -- qattiq 3D joyidan eng katta siljish, px (320x180): OLDIN -> HOZIR", font=F15, fill=SAR)
    y = 30
    for film, nomf in (('kamYol', "kamera yo'li 1->2->3 shot"), ('orbita', 'orbita 360 gr')):
        s = '%-26s' % nomf
        x = 10; d.text((x, y), nomf, font=F13, fill=OQ); x = 230
        for c in q:
            a, b = A['kamera'][film][c]['nisbiy_max'], B['kamera'][film][c]['nisbiy_max']
            txt = '%s %.0f -> %.0f' % (nomq[c], a, b); d.text((x, y), txt, font=F13, fill=YASHIL if b < 0.5 else QIZ); x += d.textlength(txt, font=F13) + 22
        txt = 'fon tepasi %.0f -> %.0f gr' % (A['kamera'][film]['tepa'], B['kamera'][film]['tepa']); d.text((x, y), txt, font=F13, fill=YASHIL if B['kamera'][film]['tepa'] < 0.5 else QIZ)
        y += 22
    d.text((10, y + 6), "Kalibr: yamoqlar muzlatilganda hamma qism 0.0000 px; sun'iy +0.1 birlik siljish -- mustaqil kamera modelining o'zi (0.000 %).", font=F13, fill=OQ)
    parts.append(t)
    # uch shot jadvali
    ha, hb = A['hozir'], B['hozir']
    osm = OS.profil('misol'); oa = OS.profil(R + '/kadrlar-misol/topshirilgan8'); ob = OS.profil(R + '/kadrlar-misol/anime-' + TEG)
    fark = lambda o: [np.mean(np.abs(np.array(o[s]) - np.array(osm[s]))) for s in '123']
    fa, fb = fark(oa), fark(ob)
    satr = [
        ("ko'rinadigan bosh IoU, shot 1 / 2 / 3", ' / '.join('%.2f' % ha['bosh'][s]['iou'] for s in ha['bosh']), ' / '.join('%.2f' % hb['bosh'][s]['iou'] for s in hb['bosh']), '1'),
        ("figura (massa) IoU, shot 1 / 2 / 3", ' / '.join('%.2f' % ha['bosh'][s]['figura'] for s in ha['bosh']), ' / '.join('%.2f' % hb['bosh'][s]['figura'] for s in hb['bosh']), '1'),
        ("figura maydoni, shot 1 / 2 / 3", ' / '.join('%.3f' % ha['bosh'][s]['figura_maydon'] for s in ha['bosh']), ' / '.join('%.3f' % hb['bosh'][s]['figura_maydon'] for s in hb['bosh']), '0.431 / 0.509 / 0.578'),
        ("2-shot old kontur |farq|, px", '%.1f' % ha['shot2_kontur']['ort_abs'], '%.1f' % hb['shot2_kontur']['ort_abs'], '0'),
        ("3-shot iyak konturi |farq|, px", '%.1f' % ha['shot3']['kontur_ort_abs'], '%.1f' % hb['shot3']['kontur_ort_abs'], '0'),
        ("1-shot masshtab 9->10 / 10->11 (ECC)", '%.3f / %.3f' % tuple(ha['masshtab']), '%.3f / %.3f' % tuple(hb['masshtab']), '0.995 / 0.985'),
        ("qor zichligi shot 1 / 2 / 3 (/10k px)", ' / '.join('%d' % v['soni'] for v in ha['qor'].values()), ' / '.join('%d' % v['soni'] for v in hb['qor'].values()), '271 / 273 / 272'),
        ("qor kesishda uzluksiz r 11->12 / 13->14", '%.2f / %.2f' % tuple(ha['qor_kesish']), '%.2f / %.2f' % tuple(hb['qor_kesish']), '0.71 / 0.69'),
        ("fon profili |farq| L, shot 1 / 2 / 3", ' / '.join('%.1f' % v for v in fa), ' / '.join('%.1f' % v for v in fb), '0'),
    ]
    z = B['zond']; za = A['zond']
    for kk in ('uzoq_koz.x', 'uzoq_koz.y', 'ogiz.x', 'uzoq_chet_y20.t', 'uzoq_chet_y30.t', 'iyak_oldi_y52.t', 'yosh_yonoq.x'):
        satr.append(('1-shot zond %s (o\'rtacha |farq|)' % kk, '%.2f' % za[kk]['ort'], '%.2f' % z[kk]['ort'], '0'))
    T = Image.new('RGB', (TW, 30 + 19 * (len(satr) + 1)), FON); d = ImageDraw.Draw(T)
    d.text((10, 6), "UCH SHOT BIRGALIKDA (rol / toza / anime render, bir xil kod)", font=F15, fill=SAR)
    xs = [10, 400, 620, 840]
    for i, h in enumerate(("o'lchov", "OLDIN (8-o'tish)", "HOZIR (9-o'tish)", 'misol')): d.text((xs[i], 28), h, font=F13, fill=SAR)
    for j, (a, b, c, m) in enumerate(satr):
        for i, v in enumerate((a, b, c, m)): d.text((xs[i], 47 + 19 * j), v, font=F12, fill=OQ)
    parts.append(T)
    qol = json.load(open(R + '/test/dunyo9_qoldiq.json')) if __import__('os').path.exists(R + '/test/dunyo9_qoldiq.json') else []
    if qol:
        Q = Image.new('RGB', (TW, 30 + 19 * len(qol)), FON); d = ImageDraw.Draw(Q)
        d.text((10, 6), "QOLDIQLAR (bitta 3D dunyo misolni shu joylarda takrorlay olmaydi -- o'lchangan, yashirilmagan)", font=F15, fill=SAR)
        for j, s in enumerate(qol): d.text((10, 30 + 19 * j), s, font=F12, fill=OQ)
        parts.append(Q)
    Wd = Image.new('RGB', (TW, sum(p.height for p in parts)), FON); y = 0
    for p in parts: Wd.paste(p, (0, y)); y += p.height
    Wd.save(R + '/chiqish/dunyo-audit-9.png'); print(R + '/chiqish/dunyo-audit-9.png', Wd.size)

main()
