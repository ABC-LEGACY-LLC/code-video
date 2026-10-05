"""TASVIRLARARO FARQ va RITM.

farq(a,b) = |nz(a) - nz(b)| ning o'rtachasi; nz -- kadrni o'z o'rtacha va std siga
normallash (yorqinlik/kontrast farqi ritmga aralashmasin). 'tashla' -- eng katta
o'zgargan pikselning shu ulushi tashlanadi (mahalliy portlash tendensiyani yashirmasin).

OGOHLANTIRISH (9-o'tish): tendensiya = birinchi va oxirgi JUFT nisbati -- ikki
nuqtali statistika. Juftlarning hammasini (MAE) ham chiqaring: bitta juft o'zgarsa
tendensiya yomonlashib, umumiy moslik yaxshilangan bo'lishi mumkin (1-kadr: MAE
0.043 -> 0.029, tendensiya esa +17.7% -> +7.7% bo'lgan edi).

xarita: farqni chap/o'ng ulushlarga bo'lib ham beradi -- figura va fon (qor)
o'zgarishi alohida ko'rinsin."""
import numpy as np
from PIL import Image, ImageDraw
from . import tasvir


def nz(a):
    return (a - a.mean()) / (a.std() or 1.0)


def farq(a, b, tashla=0.0):
    d = np.abs(nz(a) - nz(b)).ravel()
    if tashla > 0:
        k = int(len(d) * (1 - tashla))
        d = np.partition(d, k)[:k]
    return float(d.mean())


def juftlar(loy, tomon, kadrlar, tashla=0.0):
    F = [tasvir.ol(loy.fayl(tomon, k), loy.olcham) for k in kadrlar]
    return [farq(F[i], F[i + 1], tashla) for i in range(len(F) - 1)]


def kesishlar(loy, tomon, chegara=1.6):
    v = np.array(juftlar(loy, tomon, list(range(1, loy.n + 1))))
    m = float(np.median(v))
    return [i + 2 for i, x in enumerate(v) if x > m * chegara], v, m


def ritm(loy, kadrlar):
    q = []
    for t in ('misol', 'biz'):
        sp, v, m = kesishlar(loy, t)
        kat = max(v[i - 2] for i in sp) / m if sp else 0
        q.append('%-6s kesishlar %s (mediana %.3f, eng katta %.2fx)' % (t.upper(), sp, m, kat))
    for tashla, lb in ((0.0, 'butun'), (0.10, '10% tashlangan')):
        dm, db = juftlar(loy, 'misol', kadrlar, tashla), juftlar(loy, 'biz', kadrlar, tashla)
        tm, tb = (dm[-1] / dm[0] - 1) * 100, (db[-1] / db[0] - 1) * 100
        mae = float(np.mean(np.abs(np.array(dm) - np.array(db))))
        q.append('%-15s tendensiya misol %+6.1f%%  biz %+6.1f%%   juftlar MAE %.4f' % (lb, tm, tb, mae))
        if tashla == 0.0:
            q.append('   juftlar misol: ' + ' '.join('%.3f' % x for x in dm))
            q.append('   juftlar biz  : ' + ' '.join('%.3f' % x for x in db))
    return '\n'.join(q)


def xarita(loy, juftlar_ro, chiq, ulush=0.4, olcham=(480, 270)):
    tiles = []
    for (i, j) in juftlar_ro:
        for t in ('misol', 'biz'):
            a = tasvir.ol(loy.fayl(t, i), loy.olcham)
            b = tasvir.ol(loy.fayl(t, j), loy.olcham)
            d = np.abs(nz(a) - nz(b))
            im = Image.fromarray(np.clip(d * 90, 0, 255).astype(np.uint8)).convert('RGB').resize(olcham, Image.NEAREST)
            dr = ImageDraw.Draw(im)
            w = d.shape[1]
            dr.text((4, 4), '%s %d-%d  o\'rtacha %.3f' % (t.upper(), i, j, d.mean()), fill=(255, 220, 80))
            dr.text((4, 20), 'chap%d%% %.3f  o\'ng %.3f' % (ulush * 100, d[:, :int(w * ulush)].mean(), d[:, int(w * ulush):].mean()), fill=(120, 255, 160))
            tiles.append(im)
    s = Image.new('RGB', (olcham[0] * 2 + 6, (olcham[1] + 6) * len(juftlar_ro)))
    for k, t in enumerate(tiles):
        s.paste(t, ((k % 2) * (olcham[0] + 6), (k // 2) * (olcham[1] + 6)))
    s.save(chiq)
    return s
