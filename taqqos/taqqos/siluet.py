"""SILUET PROFILI -- figuraning qorong'i niqobi qatorma-qator (yoki ustunma-ustun).

Zond bitta nuqtani o'lchaydi; siluetning SHAKLI esa ko'p nuqtada farq qiladi
(qo'l qisqa, yelka keng, bo'yin chuqurchasi yo'q). Bu yerda ikkala tomonda bir
xil kod: median filtr (zarralarni -- qor, chang -- o'chiradi), shart (L<26),
BOG' nuqtasiga ulangan komponenta (tanadan uzilgan qorong'i narsa hisobga
kirmaydi), teshiklari to'ldiriladi. So'ng qutidagi har qatorda niqobning chekka
x i (yon "ong"/"chap") yoki har ustunda chekka y (yon "past"/"tepa").

Chiqish har kadrda: IoU (qutida), maydon farqi (%), qatorlar bo'yicha chekka
farqi (biz - misol) -- o'rtacha |farq|, eng katta farqli qatorlar oralig'i bilan.
Qator bir tomonda bo'sh, ikkinchisida bor bo'lsa -- "faqat misolda"/"faqat bizda"
(masalan qo'l uchi biznikida yetib bormagan qatorlar).

Sozlamada: "siluetlar": [{"nom":..,"quti":[x0,y0,x1,y1],"bog":[x,y],
"shart":"<26","median":5,"yon":"ong","kadrlar":"1-11"}]"""
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from . import tasvir
from .loyiha import oraliq


def niqob(L, shart='<26', median=5, bog=None):
    op, t = shart[0], float(shart[1:])
    Lm = ndimage.median_filter(L, median) if median > 1 else L
    m = (Lm < t) if op == '<' else (Lm > t)
    if bog is None:
        return m
    lab, n = ndimage.label(m)
    bx, by = int(round(bog[0])), int(round(bog[1]))
    c = lab[by, bx]
    if c == 0:
        # bog' nuqtasining o'zi zarra/dog' ustida bo'lishi mumkin: 9x9 oynadagi
        # eng katta komponenta olinadi (tana -- oynadagi eng katta qorong'i soha)
        w = lab[max(0, by - 4):by + 5, max(0, bx - 4):bx + 5]
        v = w[w > 0]
        if not len(v):
            return np.zeros_like(m)
        c = np.bincount(v).argmax()
    return ndimage.binary_fill_holes(lab == c)


def profil(m, quti, yon='ong'):
    """qutidagi har qator (ong/chap) yoki ustun (past/tepa) uchun chekka koordinata; yo'q -> nan"""
    x0, y0, x1, y1 = [int(v) for v in quti]
    s = m[y0:y1, x0:x1]
    if yon in ('ong', 'chap'):
        o = np.full(y1 - y0, np.nan)
        for i, r in enumerate(s):
            xs = np.nonzero(r)[0]
            if len(xs):
                o[i] = x0 + (xs.max() + 1 if yon == 'ong' else xs.min())
        return np.arange(y0, y1), o
    o = np.full(x1 - x0, np.nan)
    for i, c in enumerate(s.T):
        ys = np.nonzero(c)[0]
        if len(ys):
            o[i] = y0 + (ys.max() + 1 if yon == 'past' else ys.min())
    return np.arange(x0, x1), o


def solishtir(mm, mb, quti, yon='ong'):
    x0, y0, x1, y1 = [int(v) for v in quti]
    a, b = mm[y0:y1, x0:x1], mb[y0:y1, x0:x1]
    iou = float((a & b).sum() / max(1, (a | b).sum()))
    maydon = float((b.sum() - a.sum()) / max(1, a.sum()) * 100)
    o, pm = profil(mm, quti, yon)
    _, pb = profil(mb, quti, yon)
    d = pb - pm
    ikki = ~np.isnan(pm) & ~np.isnan(pb)
    return {'iou': iou, 'maydon': maydon, 'o': o, 'misol': pm, 'biz': pb, 'farq': d,
            'ortacha': float(np.nanmean(np.abs(d[ikki]))) if ikki.any() else float('nan'),
            'faqat_misol': o[~np.isnan(pm) & np.isnan(pb)].tolist(),
            'faqat_biz': o[np.isnan(pm) & ~np.isnan(pb)].tolist()}


def _oraliqlar(o, d, chegara):
    """|farq| > chegara bo'lgan ketma-ket qatorlar: [(bosh, oxir, o'rtacha farq)]"""
    q, bosh = [], None
    for i in range(len(o) + 1):
        ok = i < len(o) and not np.isnan(d[i]) and abs(d[i]) > chegara
        if ok and bosh is None:
            bosh = i
        if not ok and bosh is not None:
            q.append((int(o[bosh]), int(o[i - 1]), float(np.mean(d[bosh:i]))))
            bosh = None
    return q


def yugur(loy, spec, kadrlar=None):
    K = kadrlar or (oraliq(spec['kadrlar']) if 'kadrlar' in spec else list(range(1, loy.n + 1)))
    bog = spec['bog']
    r = {}
    for k in K:
        b = bog.get(str(k), bog.get('*')) if isinstance(bog, dict) else bog
        M = {}
        for t in ('misol', 'biz'):
            L = tasvir.ol(loy.fayl(t, k), loy.olcham)
            M[t] = niqob(L, spec.get('shart', '<26'), spec.get('median', 5), b)
        r[k] = solishtir(M['misol'], M['biz'], spec['quti'], spec.get('yon', 'ong'))
        r[k]['_m'] = M
    return r


def jadval(spec, r, chegara=2.0):
    yon = spec.get('yon', 'ong')
    q = ['SILUET %s  quti %s  yon %s  (farq = biz - misol, px; + -> biznikida %s)' % (
        spec.get('nom', ''), spec['quti'], yon,
        {'ong': "o'ngroqda", 'chap': "o'ngroqda", 'past': 'pastroqda', 'tepa': 'pastroqda'}[yon])]
    q.append('%5s %6s %8s %8s  %s' % ('kadr', 'IoU', 'maydon%', "o'rt|f|", '|farq|>%.0f px oraliqlar (bosh..oxir: o\'rtacha farq)' % chegara))
    for k, e in r.items():
        ora = _oraliqlar(e['o'], e['farq'], chegara)
        s = ', '.join('%d..%d:%+.1f' % a for a in ora)
        if e['faqat_misol']:
            s += '  | faqat misolda %d..%d' % (min(e['faqat_misol']), max(e['faqat_misol']))
        if e['faqat_biz']:
            s += '  | faqat bizda %d..%d' % (min(e['faqat_biz']), max(e['faqat_biz']))
        q.append('%5d %6.2f %+8.1f %8.2f  %s' % (k, e['iou'], e['maydon'], e['ortacha'], s))
    ious = [e['iou'] for e in r.values()]
    q.append('o\'rtacha IoU %.3f, eng yomoni %.3f (kadr %d)' % (
        np.mean(ious), min(ious), list(r)[int(np.argmin(ious))]))
    return '\n'.join(q)


def qator_jadval(r, kadr, qadam=2):
    e = r[kadr]
    q = ['kadr %d: qator  misol  biz  farq' % kadr]
    for i in range(0, len(e['o']), qadam):
        m, b = e['misol'][i], e['biz'][i]
        q.append('  %5d  %6s %6s %6s' % (e['o'][i], '-' if np.isnan(m) else '%.0f' % m,
                                         '-' if np.isnan(b) else '%.0f' % b,
                                         '' if np.isnan(m) or np.isnan(b) else '%+.0f' % (b - m)))
    return '\n'.join(q)


def varaq(loy, spec, r, chiq, zoom=3, ustun=6):
    x0, y0, x1, y1 = [int(v) for v in spec['quti']]
    tiles = []
    for k, e in r.items():
        L = tasvir.ol(loy.fayl('misol', k), loy.olcham)[y0:y1, x0:x1]
        base = np.clip(L * 0.55, 0, 255).astype(np.uint8)
        rgb = np.stack([base] * 3, -1)
        for t, c in (('misol', (255, 60, 255)), ('biz', (60, 255, 60))):
            m = e['_m'][t][y0:y1, x0:x1]
            ch = m & ~ndimage.binary_erosion(m)
            rgb[ch] = c
        chm =(e['_m']['misol'][y0:y1, x0:x1] & ~ndimage.binary_erosion(e['_m']['misol'][y0:y1, x0:x1])) & \
              (e['_m']['biz'][y0:y1, x0:x1] & ~ndimage.binary_erosion(e['_m']['biz'][y0:y1, x0:x1]))
        rgb[chm] = (255, 255, 255)
        im = Image.fromarray(rgb).resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
        d = ImageDraw.Draw(im)
        d.text((3, 2), '%d  IoU %.2f' % (k, e['iou']), fill=(255, 230, 120))
        tiles.append(im)
    w, h = tiles[0].size
    n = len(tiles)
    rows = (n + ustun - 1) // ustun
    s = Image.new('RGB', (min(n, ustun) * (w + 4), rows * (h + 4) + 14), (0, 0, 0))
    ImageDraw.Draw(s).text((3, 1), 'SILUET %s: magenta=misol, yashil=biz, oq=mos' % spec.get('nom', ''), fill=(255, 255, 255))
    for i, t in enumerate(tiles):
        s.paste(t, ((i % ustun) * (w + 4), 14 + (i // ustun) * (h + 4)))
    s.save(chiq)
    return s
