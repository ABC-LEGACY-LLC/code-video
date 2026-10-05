"""QISMLAR VARAG'I (10-o'tish): har shotda misol / biz yalang'och (soch, kapyushon, plashsiz) / biz kiyingan -- har qism alohida.
Misolda asbob topgan qismlar -- to'ldirilgan nuqta, bizniki (3D dan aniq) -- to'ldirilgan, misolniki bizning panelda bo'sh doira.
Jag' osti izi: misol -- to'q sariq, biz (yalang'och siluet) -- ko'k. Jadval: har qism, har shot -- biz - misol (px, 320x180).
python3 test/qism/qism_varaq.py TEG   -> chiqish/qismlar-audit-10.png"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q

R = '/home/claude/work/personaj3d'
TEG = sys.argv[1] if len(sys.argv) > 1 else 'dunyo9b'
OLDIN = sys.argv[2] if len(sys.argv) > 2 else None          # jadvalda: oldin -> hozir
CHIQ = sys.argv[3] if len(sys.argv) > 3 else R + '/chiqish/qismlar-audit-10.png'
T = json.load(open('%s/test/qism/taqqos_%s.json' % (R, TEG)))
TO = json.load(open('%s/test/qism/taqqos_%s.json' % (R, OLDIN))) if OLDIN else None
ANIQ = json.load(open('%s/test/qism/biz_%s.json' % (R, TEG)))
def shrift(n, q=False): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if q else ''), n)
F11, F13, F15, F18 = shrift(11), shrift(13), shrift(15, True), shrift(18, True)
OQ = (225, 225, 235); SAR = (255, 214, 60); FON = (12, 12, 18)
RANG = {'koz': (0, 255, 255), 'qosh': (255, 255, 0), 'burun': (0, 255, 0), 'ogiz': (255, 0, 255), 'lab': (255, 150, 255), 'iyak': (255, 50, 50)}
NOM = {'koz': "ko'z", 'qosh': 'qosh', 'burun': 'burun uchi', 'ogiz': "og'iz", 'lab': 'lab soyasi', 'iyak': 'iyak (daha)'}
AN = {'koz_yaqin': 'koz_yaqin', 'koz_uzoq': 'koz_uzoq', 'qosh_yaqin': 'qosh_yaqin_orta', 'qosh_uzoq': 'qosh_uzoq_orta', 'ogiz': 'ogiz', 'lab': 'lab_soyasi'}
KADR = [(5, (70, 20, 150, 120)), (10, (80, 22, 160, 122)), (12, (112, 50, 182, 125)), (16, (118, 88, 198, 172)), (20, (118, 88, 198, 172))]
SC = 5

def rasm(p, bx):
    a = Q.L320(p) if not isinstance(p, np.ndarray) else p
    b = np.clip((a / 255) ** 0.6 * 255, 0, 255).astype(np.uint8)
    t = Image.fromarray(b).convert('RGB').crop(bx); return t.resize((t.width * SC, t.height * SC), Image.NEAREST)

def panel(k, bx, tur):
    src = {'misol': '/home/claude/work/maqsad/k%02d.png' % k, 'yalang': '%s/kadrlar-qism/anime-yalang-%s/%03d.png' % (R, TEG, k - 1),
           'kiyingan': '%s/kadrlar-misol/anime-%s/%03d.png' % (R, TEG, k - 1)}[tur]
    t = rasm(src, bx); d = ImageDraw.Draw(t)
    P = lambda x, y: ((x - bx[0] + 0.5) * SC, (y - bx[1] + 0.5) * SC)
    o = T[str(k)]
    # jag' osti izlari
    if 'jag' in o:
        xs = sorted(o['jag']['misol'], key=int)
        d.line([P(int(x), o['jag']['misol'][x]) for x in xs], fill=(255, 150, 0), width=2)
        if tur != 'misol': d.line([P(int(x), o['jag']['biz'][x]) for x in xs], fill=(60, 140, 255), width=2)
    def nuqta(x, y, rang, bosh=False, r=4):
        X, Y = P(x, y)
        if bosh: d.ellipse([X - r - 1, Y - r - 1, X + r + 1, Y + r + 1], outline=rang, width=2)
        else: d.ellipse([X - r, Y - r, X + r, Y + r], fill=rang, outline=(0, 0, 0))
    for q, v in o.items():
        if q in ('jag', 'kontur'): continue
        c = RANG[q.split('_')[0]]
        if tur == 'misol': nuqta(*v['misol'], c)
        else:
            nuqta(*v['misol'], c, bosh=True)
            nuqta(*v['biz'], c)
    if tur != 'misol':                                        # misolda ko'rinmaydigan qismlarimiz ham (kichik)
        A = ANIQ[str(k - 1)]
        for q, qa in list(AN.items()) + [('iyak_uchi', 'iyak_uchi'), ('burun_uchi', 'burun_uchi')]:
            if q in o or qa not in A: continue
            nuqta(A[qa][0], A[qa][1], RANG[q.split('_')[0]], r=2)
    d.text((4, 3), {'misol': 'MISOL k%02d' % k, 'yalang': "BIZ YALANG'OCH (soch, kapyushon, plashsiz)", 'kiyingan': 'BIZ KIYINGAN'}[tur], font=F13, fill=SAR)
    return t

def jag_grafik(W, H):
    g = Image.new('RGB', (W, H), FON); d = ImageDraw.Draw(g)
    d.text((10, 6), "JAG' OSTI (daha) -- har ustunda pastki chegara y, px: misol (to'q sariq) va biz yalang'och (ko'k); pastga -- katta y", font=F15, fill=SAR)
    bl = [(5, "1-shot k05 (3/4)"), (12, "2-shot k12 (profil)"), (16, "3-shot k16 (egilgan)"), (20, "3-shot k20")]
    w = (W - 40) // len(bl)
    for i, (k, nm) in enumerate(bl):
        j = T[str(k)]['jag']; xs = sorted(j['misol'], key=int); x0 = 20 + i * w
        ys = [j['misol'][x] for x in xs] + [j['biz'][x] for x in xs]; ya, yb = min(ys) - 3, max(ys) + 3
        X = lambda x: x0 + 30 + (w - 60) * (int(x) - int(xs[0])) / max(1, int(xs[-1]) - int(xs[0])); Y = lambda y: 40 + (H - 80) * (y - ya) / (yb - ya)
        d.rectangle([x0 + 30, 40, x0 + w - 30, H - 40], outline=(50, 50, 65))
        for yy in range(int(ya), int(yb) + 1):
            if yy % 5 == 0: d.text((x0 + 2, Y(yy) - 6), str(yy), font=F11, fill=(150, 150, 165)); d.line([(x0 + 30, Y(yy)), (x0 + w - 30, Y(yy))], fill=(35, 35, 48))
        d.line([(X(x), Y(j['misol'][x])) for x in xs], fill=(255, 150, 0), width=3)
        d.line([(X(x), Y(j['biz'][x])) for x in xs], fill=(60, 140, 255), width=3)
        for x in xs[::max(1, len(xs) // 5)]: d.text((X(x) - 8, H - 36), x, font=F11, fill=(150, 150, 165))
        f = [j['biz'][x] - j['misol'][x] for x in xs]
        d.text((x0 + 34, H - 20), '%s: farq %+d..%+d px' % (nm, min(f), max(f)), font=F13, fill=OQ)
    return g

def jadval(W):
    sh = {1: range(1, 12), 2: (12, 13), 3: range(14, 23)}
    qs = [('koz_yaqin', "yaqin ko'z"), ('koz_uzoq', "uzoq ko'z"), ('qosh_yaqin', 'yaqin qosh'), ('burun_uchi', 'burun uchi'), ('ogiz', "og'iz"),
          ('lab', 'lab soyasi'), ('iyak_uchi', 'iyak uchi (daha)')]
    satr = []
    def nuq(TT, q, s):
        v = [TT[str(k)][q] for k in sh[s] if q in TT[str(k)]]
        if not v: return None
        f = np.array([e['farq'] for e in v]); return f[:, 0].mean(), f[:, 1].mean(), len(v), sum('ostida' in e['manba'] for e in v)
    for q, nm in qs:
        r = [nm]
        for s in (1, 2, 3):
            a = nuq(T, q, s)
            if a is None: r.append('misolda ko\'rinmaydi'); continue
            if TO is not None and nuq(TO, q, s): b = nuq(TO, q, s); r.append('%+.1f, %+.1f -> %+.1f, %+.1f  (%d)' % (b[0], b[1], a[0], a[1], a[2]))
            else: r.append('%+.1f, %+.1f  (%d kadr%s)' % (a[0], a[1], a[2], ', bizda %d tasi soch ostida' % a[3] if a[3] else ''))
        satr.append(r)
    def jg(TT, s):
        f = np.concatenate([list(TT[str(k)]['jag']['farq'].values()) for k in sh[s] if 'jag' in TT[str(k)]]); return np.abs(f).mean(), f.min(), f.max()
    r = ["jag' osti |o'rtacha| (min..max)"]
    for s in (1, 2, 3):
        a = jg(T, s)
        if TO is not None: b = jg(TO, s); r.append('%.1f (%+d..%+d) -> %.1f (%+d..%+d)' % (b[0], b[1], b[2], a[0], a[1], a[2]))
        else: r.append('%.1f (%+d..%+d)' % a)
    satr.append(r)
    g = Image.new('RGB', (W, 56 + 20 * (len(satr) + 1)), FON); d = ImageDraw.Draw(g)
    d.text((10, 6), "QISM BO'YICHA FARQ: biz - misol (x, y px, 320x180; y > 0 -- bizniki pastroq)" + ("  --  %s -> %s" % (OLDIN, TEG) if TO is not None else ''), font=F15, fill=SAR)
    d.text((10, 26), "bizda: ko'z, og'iz, lab -- kiyingan render (ikkalasida bir xil qoida); iyak, burun, jag' -- yalang'och siluet (bir xil skan); qosh -- 3D nuqta (bizniki ko'pincha soch ostida)", font=F11, fill=OQ)
    xs = [10, 220, 620, 960]
    for i, h in enumerate(('qism', '1-shot (3/4, 11 kadr)', '2-shot (profil, 2 kadr)', '3-shot (egilgan, 9 kadr)')): d.text((xs[i], 46), h, font=F13, fill=SAR)
    for j, r in enumerate(satr):
        for i, v in enumerate(r): d.text((xs[i], 66 + 20 * j), v, font=F13, fill=OQ)
    return g

def qatlam(W):
    Qd = json.load(open('%s/test/qism/qatlam_%s.json' % (R, TEG)))
    sh = {1: range(1, 12), 2: (12, 13), 3: range(14, 23)}
    QAT = ["yalang'och", '+ soch', "+ kapyushon (to'liq)"]
    g = Image.new('RGB', (W, 40 + 20 * 11), FON); d = ImageDraw.Draw(g)
    d.text((10, 6), "QATLAMLAR: misolning ko'rinadigan yuzi (teri + rim, soch chiqarilgan) ustida bizda nima bor -- yalang'och -> + soch -> + kapyushon", font=F15, fill=SAR)
    y = 32
    for s in (1, 2, 3):
        ks = [str(k) for k in sh[s]]
        d.text((10, y), '%d-shot (misol yuzi o\'rtacha %d px)' % (s, np.mean([Qd[k]['yuz_px'] for k in ks])), font=F13, fill=SAR); y += 19
        for nm in QAT:
            v = {c: 100 * np.mean([Qd[k][nm][c] for k in ks]) for c in ('teri', 'soch', 'kap', 'ortiqcha')}
            d.text((30, y), '%-22s' % nm, font=F13, fill=OQ)
            d.text((260, y), 'misol yuzida bizda: teri %3.0f %%   soch %3.0f %%   kapyushon/plash %3.0f %%' % (v['teri'], v['soch'], v['kap']), font=F13, fill=OQ)
            d.text((830, y), 'bizning ko\'rinadigan terimiz misol yuzidan tashqarida: %3.0f %%' % v['ortiqcha'], font=F13, fill=OQ); y += 19
        y += 2
    return g

def main():
    parts = []
    W = max(3 * (80 * SC + 8) + 20, 1290)
    bosh = Image.new('RGB', (W, 70), FON); d = ImageDraw.Draw(bosh)
    d.text((10, 8), "10-O'TISH: QISMLAR ALOHIDA -- ko'z, qosh, burun, og'iz, iyak (daha), jag', soch, kapyushon", font=F18, fill=(255, 235, 200))
    d.text((10, 36), "Misolda har qism asbob bilan topilgan (tekshiruv varaqlarida ko'rib chiqilgan); bizda -- 3D dan aniq nuqtalar va soch/kapyushonsiz siluet. Bo'sh doira -- misolning o'sha qismi.", font=F13, fill=OQ)
    parts.append(bosh)
    for k, bx in KADR:
        ts = [panel(k, bx, t) for t in ('misol', 'yalang', 'kiyingan')]
        row = Image.new('RGB', (W, max(t.height for t in ts) + 8), FON); x = 10
        for t in ts: row.paste(t, (x, 4)); x += t.width + 8
        parts.append(row)
    parts.append(jag_grafik(W, 260)); parts.append(jadval(W)); parts.append(qatlam(W))
    Wd = Image.new('RGB', (W, sum(p.height for p in parts)), FON); y = 0
    for p in parts: Wd.paste(p, (0, y)); y += p.height
    Wd.save(CHIQ); print(CHIQ, Wd.size)

main()
