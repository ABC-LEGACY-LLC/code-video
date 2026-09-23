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
"shart":"<26","median":5,"yon":"ong","kadrlar":"1-11"}]

Yorug' massa uchun (masalan soch, 11-o'tish): "shart":">85", "median":3 (ingichka
tutam median 5 da yo'qoladi), "toldir":false (tutamlar orasidagi teshik -- haqiqiy
bo'shliq, to'ldirilmaydi), "min_maydon":60 (bog' o'rniga: qutidagi maydoni >= 60 px
bo'lgan HAMMA komponenta -- soch bir necha bo'lak bo'lishi mumkin, qor zarrasi
esa kichik), "qiymat":true (niqob ichidagi L median va p90).
--ketma: bir tomonda ketma-ket tasvirlar solishtiriladi (k va k+1) -- ushlangan
tasvirlarda sochning cheti qancha qimirlaydi (ikkala tomonda bir xil kod)."""
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from . import tasvir
from .loyiha import oraliq


def niqob(L, shart='<26', median=5, bog=None, toldir=True, min_maydon=None, quti=None):
    op, t = shart[0], float(shart[1:])
    Lm = ndimage.median_filter(L, median) if median > 1 else L
    m = (Lm < t) if op == '<' else (Lm > t)
    if min_maydon is not None:
        # bog' o'rniga: qutidagi maydoni >= min_maydon bo'lgan hamma komponenta
        if quti is not None:
            x0, y0, x1, y1 = [int(v) for v in quti]
            q = np.zeros_like(m)
            q[max(0, y0):y1, max(0, x0):x1] = True
            m = m & q
        lab, n = ndimage.label(m)
        if n == 0:
            return m
        s = ndimage.sum(m, lab, index=np.arange(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = s >= min_maydon
        o = keep[lab]
        return ndimage.binary_fill_holes(o) if toldir else o
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
    return ndimage.binary_fill_holes(lab == c) if toldir else (lab == c)


def spec_niqob(L, spec, bog):
    """sozlamadagi siluet spec'i bo'yicha niqob -- yugur va ketma bir xil yo'ldan o'tadi"""
    mm = spec.get('min_maydon')
    return niqob(L, spec.get('shart', '<26'), spec.get('median', 5), bog, spec.get('toldir', True),
                 mm, spec['quti'] if mm is not None else None)


def qiymat(L, m, quti):
    """niqob ichidagi (qutida) L: median va 90-persentil; niqob bo'sh -> (nan, nan)"""
    x0, y0, x1, y1 = [int(v) for v in quti]
    v = L[y0:y1, x0:x1][m[y0:y1, x0:x1]]
    if not len(v):
        return float('nan'), float('nan')
    return float(np.median(v)), float(np.percentile(v, 90))


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


def _bog(spec, k):
    bog = spec.get('bog')
    return bog.get(str(k), bog.get('*')) if isinstance(bog, dict) else bog


def yugur(loy, spec, kadrlar=None):
    K = kadrlar or (oraliq(spec['kadrlar']) if 'kadrlar' in spec else list(range(1, loy.n + 1)))
    r = {}
    for k in K:
        b = _bog(spec, k)
        M, Q = {}, {}
        for t in ('misol', 'biz'):
            L = tasvir.ol(loy.fayl(t, k), loy.olcham)
            M[t] = spec_niqob(L, spec, b)
            if spec.get('qiymat'):
                Q[t] = qiymat(L, M[t], spec['quti'])
        r[k] = solishtir(M['misol'], M['biz'], spec['quti'], spec.get('yon', 'ong'))
        r[k]['_m'] = M
        if Q:
            r[k]['qiymat'] = Q
    return r


def ketma_massiv(Ls, spec, boglar=None):
    """bir tomonning ketma-ket tasvirlari (L massivlari): har juft (i, i+1) uchun
    niqoblar orasidagi IoU, maydon o'zgarishi va chekkaning o'rtacha |siljishi| (px)"""
    ms = [spec_niqob(L, spec, (boglar[i] if boglar else None)) for i, L in enumerate(Ls)]
    return [solishtir(ms[i], ms[i + 1], spec['quti'], spec.get('yon', 'ong')) for i in range(len(ms) - 1)]


def ketma(loy, spec, kadrlar=None):
    K = kadrlar or (oraliq(spec['kadrlar']) if 'kadrlar' in spec else list(range(1, loy.n + 1)))
    o = {}
    for t in ('misol', 'biz'):
        Ls = [tasvir.ol(loy.fayl(t, k), loy.olcham) for k in K]
        o[t] = ketma_massiv(Ls, spec, [_bog(spec, k) for k in K])
    return K, o


def ketma_jadval(spec, K, o):
    q = ['KETMA-KET %s (yon %s): juft ichida niqob qancha o\'zgaradi -- IoU, maydon %%, chekka o\'rtacha |siljish| px' % (
        spec.get('nom', ''), spec.get('yon', 'ong'))]
    q.append('%7s   %6s %8s %7s   %6s %8s %7s' % ('juft', 'misol', 'maydon', '|sil|', 'biz', 'maydon', '|sil|'))
    for i in range(len(K) - 1):
        a, b = o['misol'][i], o['biz'][i]
        q.append('%3d-%-3d   %6.2f %+8.1f %7.2f   %6.2f %+8.1f %7.2f' % (
            K[i], K[i + 1], a['iou'], a['maydon'], a['ortacha'], b['iou'], b['maydon'], b['ortacha']))
    return '\n'.join(q)


def _qator_oraliq(v):
    """[0,1,2,5,6,9] -> '0..2,5..6,9' (uzuq qatorlar min..max bo'lib ko'rinmasin)"""
    v = sorted(int(x) for x in v)
    q, bosh = [], v[0]
    for i in range(1, len(v) + 1):
        if i == len(v) or v[i] != v[i - 1] + 1:
            q.append('%d' % bosh if bosh == v[i - 1] else '%d..%d' % (bosh, v[i - 1]))
            if i < len(v):
                bosh = v[i]
    return ','.join(q)


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
            s += '  | faqat misolda ' + _qator_oraliq(e['faqat_misol'])
        if e['faqat_biz']:
            s += '  | faqat bizda ' + _qator_oraliq(e['faqat_biz'])
        if 'qiymat' in e:
            (mm, mp), (bm, bp) = e['qiymat']['misol'], e['qiymat']['biz']
            s = 'L med/p90 misol %.0f/%.0f biz %.0f/%.0f  ' % (mm, mp, bm, bp) + s
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
