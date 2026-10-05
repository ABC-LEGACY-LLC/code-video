"""KAMERA SINOVI VARAG'I va GIF (9-o'tish, 1-qadam): poza va vaqt ushlangan, faqat kamera yuradi (test/kamera_sinov9.mjs).
Chap / tepa -- joriy model (yamoqlar bilan), o'ng / past -- o'sha model, kameraga va shotga bog'liq qiymatlar 0-tasvirda
muzlatilgan (?yamoq=0 -- qattiq 3D holat). Raqamlar JSON dan (obyekt fazosidagi siljish, 320x180 px).
python3 test/sinov9_varaq.py [OLDIN_TEG HOZIR_TEG]   (standart: oldin qattiq -> chiqish/kamera-sinov-9.{png,gif})"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

R = '/home/claude/work/personaj3d'
A, B = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ('oldin', 'qattiq')
NOM = {'oldin': "HOZIRGI MODEL (8-o'tish, yamoqlar bilan)", 'qattiq': "QATTIQ 3D (o'sha model, yamoqlar muzlatilgan)",
       'hozir': "HOZIR (9-o'tish: bitta 3D dunyo)"}
IKKI = A == 'oldin' and B == 'hozir'          # natija varag'i: OLDIN (8-o'tish) -> HOZIR (9-o'tish)
if IKKI: NOM['oldin'] = "OLDIN (8-o'tish, yamoqlar bilan)"
QISQA = {'oldin': 'OLDIN', 'hozir': 'HOZIR', 'qattiq': 'QATTIQ'}
CHIQ = sys.argv[3] if len(sys.argv) > 3 else R + '/chiqish/kamera-sinov-9'
def shrift(n, qalin=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if qalin else ''), n)
F12, F13, F15, F18 = shrift(12), shrift(13), shrift(15, True), shrift(18, True)
OQ = (225, 225, 235); SAR = (255, 214, 60); FON = (12, 12, 18); QIZ = (255, 80, 80)
QISMLAR = [('koz', "yaqin ko'z", (255, 120, 220), 'med'), ('kapyushon', 'kapyushon', (90, 160, 255), 'max'), ('soch', 'soch', (120, 230, 120), 'max'),
           ('teri', 'bosh sirti', (255, 170, 90), 'max'), ('qor', 'qor', (200, 200, 255), 'med')]

def yukla(film, teg):
    return json.load(open('%s/test/sinov9_%s_%s.json' % (R, film, teg)))['natija']

def lift(p, w, h):
    a = np.asarray(Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def qiymat(e, c, s):
    v = e['qism'][c]['nisbiy']; return v.get(s, 0.0) if v else 0.0

def sakrash(e):
    return [c for c, _, _, _ in QISMLAR if e['qism'][c]['qadam'] and e['qism'][c]['qadam'].get('max', 0) > 20 and c != 'qor']

def gif():
    kadrlar, vaqt = [], []
    PW, PH = 480, 270
    for film in ('kamYol', 'orbita'):
        ra, rb = yukla(film, A), yukla(film, B)
        for i, (ea, eb) in enumerate(zip(ra, rb)):
            c = Image.new('RGB', (2 * PW + 12, PH + (84 if IKKI else 64)), FON); d = ImageDraw.Draw(c)
            for j, (t, e) in enumerate(((A, ea), (B, eb))):
                c.paste(lift('%s/kadrlar-sinov9/%s-%s/%03d.png' % (R, film, t, i), PW, PH), (j * (PW + 12), 44))
                d.text((j * (PW + 12) + 4, 26), NOM.get(t, t), font=F12, fill=SAR)
            k = ea['kamera']
            d.text((4, 4), ("KAMERA YO'LI 1 -> 2 -> 3 shot" if film == 'kamYol' else 'ORBITA bosh atrofida') + '   az %.1f  el %.1f  d %.2f  fov %.1f   (poza va vaqt ushlangan)' % (k['az'], k['el'], k['d'], k['fov']), font=F13, fill=OQ)
            sk = sakrash(ea)
            for q, (t, e) in enumerate(((A, ea), (B, eb)) if IKKI else ((A, ea),)):
                y = PH + 47 + 19 * q; x = 4
                if IKKI: tt = QISQA.get(t, t) + ':'; d.text((x, y), tt, font=F13, fill=SAR); x += d.textlength(tt, font=F13) + 10
                for cc, nom, rang, s in QISMLAR:
                    tt = '%s %.0f px' % (nom, qiymat(e, cc, s)); d.text((x, y), tt, font=F13, fill=rang); x += d.textlength(tt, font=F13) + 14
                tt = "fon tepasi %.0f gr" % e['tepa']['ogish']; d.text((x, y), tt, font=F13, fill=OQ); x += d.textlength(tt, font=F13) + 14
                s2 = sakrash(e)
                if s2: d.text((x, y), 'SAKRASH: ' + ', '.join(n for cc, n, _, _ in QISMLAR if cc in s2), font=F13, fill=QIZ)
            kadrlar.append(c)
            kalit = film == 'kamYol' and i in (0, 24, 48)
            vaqt.append(900 if sk or kalit else 110)
    pal = [f.quantize(colors=192, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in kadrlar]
    pal[0].save(CHIQ + '.gif', save_all=True, append_images=pal[1:], duration=vaqt, loop=0, optimize=True)
    print(CHIQ + '.gif', len(kadrlar))

def chiziq(d, x0, y0, x1, y1, ser, xs, vmax, xlab, belgi=()):
    X = lambda v: x0 + (x1 - x0) * (v - xs[0]) / (xs[-1] - xs[0]); Y = lambda v: y1 - (y1 - y0) * min(v, vmax) / vmax
    for v in np.linspace(0, vmax, 5):
        d.line([(x0, Y(v)), (x1, Y(v))], fill=(40, 40, 55)); d.text((x0 - 34, Y(v) - 7), '%.0f' % v, font=F12, fill=(150, 150, 165))
    for bx, bt in belgi:
        d.line([(X(bx), y0), (X(bx), y1)], fill=(110, 90, 40), width=2); d.text((X(bx) + 3, y0), bt, font=F12, fill=(200, 170, 90))
    for nom, rang, v in ser:
        d.line([(X(a), Y(b)) for a, b in zip(xs, v)], fill=rang, width=3)
    d.text((x1 - 170, y1 + 4), xlab, font=F12, fill=(150, 150, 165))

def varaq():
    TW = 1500
    parts = []
    bosh = Image.new('RGB', (TW, 76), FON); d = ImageDraw.Draw(bosh)
    d.text((10, 8), ("9-O'TISH NATIJASI: KAMERA SINOVI -- OLDIN (8-o'tish) -> HOZIR (bitta 3D dunyo); poza va vaqt ushlangan, faqat kamera yuradi" if IKKI else
                     "9-O'TISH, 1-QADAM: KAMERA SINOVI -- poza va vaqt ushlangan, faqat kamera yuradi"), font=F18, fill=(255, 235, 200))
    d.text((10, 36), "3D izchil dunyoda obyekt fazosida hech narsa o'zgarmaydi. Har chiziq -- qism qattiq 3D jism bo'lganda turishi kerak bo'lgan joydan qancha uzoqda (px, 320x180).", font=F13, fill=OQ)
    d.text((10, 55), "Kalibr: yamoqlar muzlatilganda hamma qism 0.0000 px (ikkala yo'lda); sun'iy +0.1 birlik siljish mustaqil kamera modelining o'zi (0.000 %) -- PROVEN.", font=F13, fill=OQ)
    parts.append(bosh)
    for film, xlab, belgi in (('kamYol', "qadam (1-shot -> 2-shot -> 3-shot kamerasi)", ((0, 'K1'), (12.5, 'kalit almashadi'), (24, 'K2'), (36.5, 'kalit almashadi'), (48, 'K3'))),
                              ('orbita', 'azimut, gr (1-shot pozasi; kamera bosh atrofida)', ((55, '1-shot'), (84, '2-shot'), (90, ''),))):
        ra = yukla(film, A)
        xs = [e['n'] for e in ra] if film == 'kamYol' else [e['kamera']['az'] for e in ra]
        oy = 20 if IKKI else 0
        g = Image.new('RGB', (TW, 300 + oy), FON); d = ImageDraw.Draw(g)
        d.text((10, 6), ("KAMERA YO'LI: misol kameralari orasida uzluksiz" if film == 'kamYol' else 'ORBITA: bosh atrofida 360 gr') + ' -- ' + NOM.get(A, A), font=F15, fill=SAR)
        if IKKI:
            rb = yukla(film, B); mb = max(max((e['qism'][c]['nisbiy'] or {}).get('max', 0) for c in e['qism']) for e in rb)
            tb = max(e['tepa']['ogish'] for e in rb)
            tt = "HOZIR (9-o'tish): barcha %d qism, %d nuqtada eng katta siljish %.2f px, fon tepasi %.0f gr -- chiziqlar nolda" % (len(rb[0]['qism']), len(rb), mb, tb)
            d.text((10, 28), tt, font=F13, fill=(120, 230, 140))
        vmax = 160 if film == 'kamYol' else 120
        ser = [(nom, rang, [qiymat(e, c, s) for e in ra]) for c, nom, rang, s in QISMLAR]
        chiziq(d, 60, 34 + oy, TW - 260, 270 + oy, ser, xs, vmax, xlab, belgi)
        for j, (nom, rang, _) in enumerate(ser):
            s = [s for c, n, r, s in QISMLAR if n == nom][0]
            d.line([(TW - 240, 44 + oy + 20 * j), (TW - 214, 44 + oy + 20 * j)], fill=rang, width=3); d.text((TW - 208, 37 + oy + 20 * j), '%s (%s)' % (nom, 'mediana' if s == 'med' else 'eng katta'), font=F12, fill=OQ)
        d.text((TW - 240, 44 + oy + 20 * len(ser)), 'fon tepasi (gr): ' + ' '.join('%.0f' % e['tepa']['ogish'] for e in ra[::6]), font=F12, fill=OQ)
        parts.append(g)
    # kadrlar: kamYol kalit va sakrash atrofi
    KS = [0, 12, 13, 24, 36, 37, 48]; PW, PH = 208, 117
    for t in (A, B):
        c = Image.new('RGB', (TW, PH + 26), FON); d = ImageDraw.Draw(c)
        d.text((10, 4), NOM.get(t, t), font=F13, fill=SAR)
        for j, k in enumerate(KS):
            c.paste(lift('%s/kadrlar-sinov9/kamYol-%s/%03d.png' % (R, t, k), PW, PH), (10 + j * (PW + 6), 22)); d.text((14 + j * (PW + 6), 24), '%d' % k, font=F12, fill=OQ)
        parts.append(c)
    ra, ro = yukla('kamYol', A), yukla('orbita', A)
    e24, e48, e13, e37 = ra[24], ra[48], ra[13], ra[37]
    q = lambda e, c, s='max': e['qism'][c]['qadam'].get(s, 0)
    matn = [
        "Sakrashlar (bitta qadamda, kamera atigi ~1.2 gr siljiganda): kapyushon %.0f / %.0f px (eng katta), keyin %.0f / %.0f px mediana -- shot bo'yicha alohida moslangan uch xil kapyushon;"
        % (q(e13, 'kapyushon'), q(e37, 'kapyushon'), qiymat(e13, 'kapyushon', 'med'), qiymat(e37, 'kapyushon', 'med')),
        "   yaqin ko'z %.0f / %.0f px (ko'z kartasi: 1-shotda 3/4 o'rni, 2-shotda profil o'rni -- sirt bo'ylab 0.6 birlik); bosh sirti %.1f px (pastki yuz surishi 0.3 -> 0)."
        % (q(e13, 'koz'), q(e37, 'koz'), q(e13, 'teri')),
        "Sirg'anish (har qadamda): soch -- kamera boshga nisbatan 70..84 gr oralig'ida tutamlar 3/4 shakldan profil shakliga aralashadi, qadamda %.0f px gacha (yo'lda), orbitada eng katta %.0f px;"
        % (max(e['qism']['soch']['qadam']['max'] for e in ra[1:]), max(qiymat(e, 'soch', 'max') for e in ro)),
        "   orbitada yaqin ko'z yuz bo'ylab %.0f px gacha suriladi (profilVazn: 46..84 gr), kapyushon va bosh sirti o'zgarmaydi (bitta shot qiymati)." % max(qiymat(e, 'koz', 'med') for e in ro),
        "Qor kameraga yopishgan: yo'l oxirida %.0f px (mediana) -- kamera qayoqqa borsa qatlam ham o'sha yoqqa; orbitada %.0f px gacha (dunyo qori paralaks qilardi). Fon tepasi 3-shot kamerasida %.0f gr og'gan."
        % (qiymat(e48, 'qor', 'med'), max(qiymat(e, 'qor', 'med') for e in ro), e48['tepa']['ogish']),
        "Bo'yin, plash, ichki soch -- 0.00 px (3D izchil). Yamoqlar muzlatilgan model (pastki qator) hamma qismda 0 -- lekin misol kameralarida misolga mos emas: bu 2-qadam ishi",
        "   (bitta 3D model uch shotga BIRGALIKDA moslanadi; shot/ko'rinish/kadrga bog'liq shakl qiymatlari olib tashlanadi, har qadam uch shotda va shu sinovda o'lchanadi).",
    ]
    if IKKI:
        matn = ['OLDIN: ' + matn[0]] + matn[1:5]
        rh = {f: yukla(f, B) for f in ('kamYol', 'orbita')}
        mx = lambda r, c, k: max((e['qism'][c][k] or {}).get('max', 0) for e in r)
        py = json.load(open('%s/test/sinov9_pozaYol_%s.json' % (R, B)))['natija']
        matn += [
            "HOZIR (9-o'tish): kamera yo'lida %.2f px, orbitada %.2f px -- hamma qism (bosh sirti, ichki soch, soch, bo'yin, kapyushon, plash, yaqin ko'z, qor), fon tepasi 0 gr: qattiq 3D holat bilan bir xil."
            % (max(mx(rh['kamYol'], c, 'nisbiy') for c in rh['kamYol'][0]['qism']), max(mx(rh['orbita'], c, 'nisbiy') for c in rh['orbita'][0]['qism'])),
            "   Shotga faqat kamera tegishli: kapyushon -- pozaga bog'liq rig (3 kalit poza, kechikish bilan), soch/ko'z/yuz -- bitta shakl, osmon -- dunyo gradienti, qor -- barcha kameralarni o'rab olgan hajm.",
            "POZA YO'LI (kamera 1-shotda turadi, poza 1-shot -> 2-shot -> 3-shot 6-kadr uzluksiz o'zgaradi): qadamda eng katta siljish kapyushon %.0f px (2- va 3-kalit orasida), soch %.1f, bosh sirti %.1f, ko'z %.1f px --"
            % (mx(py, 'kapyushon', 'qadam'), mx(py, 'soch', 'qadam'), mx(py, 'teri', 'qadam'), mx(py, 'koz', 'qadam')),
            "   poza o'zgarsa shakl ham uzluksiz o'zgaradi, sakrash yo'q (kamera sinovi faqat kamerani tekshiradi; poza rigi shu yo'lda tekshirildi).",
        ]
    t = Image.new('RGB', (TW, 20 * len(matn) + 16), FON); d = ImageDraw.Draw(t)
    for i, s in enumerate(matn): d.text((10, 8 + 20 * i), s, font=F13, fill=OQ)
    parts.append(t)
    W = Image.new('RGB', (TW, sum(p.height for p in parts)), FON); y = 0
    for p in parts: W.paste(p, (0, y)); y += p.height
    W.save(CHIQ + '.png'); print(CHIQ + '.png', W.size)

varaq()
gif()
