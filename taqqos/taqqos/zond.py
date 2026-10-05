"""ZONDLAR -- har kadrda nomlangan o'lchovlar, misol va bizga BIR XIL joyda.

Joy LANGARga bog'lanadi: langar (masalan yaqin ko'zning qorong'i komponentasi)
har kadrda MISOLDA o'lchanadi; "nisbiy": true bo'lgan zond geometriyasi shu
langar nuqtasidan hisoblanadi va ikkala tomonga aynan o'sha joyda qo'llanadi.
Shunda bosh harakat qilganda ham zond o'sha yuz nuqtasini o'lchaydi, va farq
bizning shakl xatomizni ko'rsatadi, joylashuv xatosini emas (joylashuvni langar
farqining o'zi ko'rsatadi).

Zond turlari (qiymatlar ishchi o'lcham pikselida):
  komponent  qorong'i/yorug' bog'langan soha urug'dan: x y (markaz), w h, n
             {"qutb":"qorongi"|"yorug","chegara":36,"urug":[dx,dy],"quti":[x0,y0,x1,y1]}
             "eng_yorug"/"eng_qorongi": true -- urug' o'rniga qutidagi eng yorug'/qorong'i nuqta
             "quti" lug'at bo'lishi mumkin: {"10":[...],"11":[...]} -- har kadrga o'z qutisi
  chet       chiziq bo'ylab birinchi o'tish: t (masofa), x y
             {"bosh":[dx,dy],"yon":[ux,uy],"uzunlik":30,"shart":"<45"|">75"}
  soha       qutidagi median L (v) va median rang (r g b)   {"quti":[...]}
  hisob      qutida L oralig'idagi piksel soni (n)            {"quti":[...],"L":[30,55]}
  uch        qorong'i niqob (median filtr), bog' nuqtasiga ulangan qismining
             chekka nuqtasi: x y   {"quti":[...],"shart":"<26","median":5,"bog":[x,y],"eng":"ong"}
Har zondda: "nisbiy" (langarga), "kadrlar" ("6-11"), "tol" (bayroq chegarasi)."""
import numpy as np
from scipy import ndimage
from . import tasvir
from .loyiha import oraliq

YORDAM = __doc__


def _quti(q, H, W):
    x0, y0, x1, y1 = [int(round(v)) for v in q]
    return max(0, x0), max(0, y0), min(W, x1), min(H, y1)


def komponent(L, quti, chegara, qutb='qorongi', urug=None, eng=None):
    H, W = L.shape
    x0, y0, x1, y1 = _quti(quti, H, W)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return None
    sub = L[y0:y1, x0:x1]
    m = np.zeros_like(L, bool)
    m[y0:y1, x0:x1] = (sub < chegara) if qutb == 'qorongi' else (sub > chegara)
    lab, n = ndimage.label(m)
    if n == 0:
        return None
    if eng or urug is None:
        # qutidagi eng qorong'i (yoki yorug') niqob pikseli
        v = np.where(m[y0:y1, x0:x1], sub, np.inf if qutb == 'qorongi' else -np.inf)
        iy, ix = np.unravel_index(np.argmin(v) if qutb == 'qorongi' else np.argmax(v), v.shape)
        py, px = y0 + iy, x0 + ix
    else:
        sx, sy = int(round(urug[0])), int(round(urug[1]))
        a, b = max(0, sy - 4), max(0, sx - 4)
        win = L[a:sy + 5, b:sx + 5]
        wm = m[a:sy + 5, b:sx + 5]
        if not wm.any():
            return None
        v = np.where(wm, win, np.inf if qutb == 'qorongi' else -np.inf)
        iy, ix = np.unravel_index(np.argmin(v) if qutb == 'qorongi' else np.argmax(v), v.shape)
        py, px = a + iy, b + ix
    c = lab[py, px]
    if c == 0:
        return None
    ys, xs = np.nonzero(lab == c)
    return {'x': float(xs.mean()), 'y': float(ys.mean()), 'w': float(xs.max() - xs.min() + 1),
            'h': float(ys.max() - ys.min() + 1), 'n': float(len(xs))}


def chet(L, bosh, yon, uzunlik, shart, qadam=0.25):
    op, t = shart[0], float(shart[1:])
    u = np.asarray(yon, float)
    u = u / (np.hypot(*u) or 1)
    s = np.arange(0, uzunlik + 1e-9, qadam)
    xs, ys = bosh[0] + u[0] * s, bosh[1] + u[1] * s
    v = ndimage.map_coordinates(L, [ys, xs], order=1, mode='nearest')
    c = (v < t) if op == '<' else (v > t)
    if not c.any():
        return None
    i = int(np.argmax(c))
    if i == 0:
        d = 0.0
    else:                                   # chiziqli interpolatsiya (piksel ichida)
        a, b = v[i - 1], v[i]
        f = (a - t) / (a - b) if a != b else 0.0
        d = s[i - 1] + f * qadam
    return {'t': float(d), 'x': float(bosh[0] + u[0] * d), 'y': float(bosh[1] + u[1] * d)}


def soha(L, rgb, quti):
    H, W = L.shape
    x0, y0, x1, y1 = _quti(quti, H, W)
    if x1 <= x0 or y1 <= y0:
        return None
    o = {'v': float(np.median(L[y0:y1, x0:x1]))}
    if rgb is not None:
        m = np.median(rgb[y0:y1, x0:x1].reshape(-1, 3), 0)
        o.update({'r': float(m[0]), 'g': float(m[1]), 'b': float(m[2])})
    return o


def hisob(L, quti, oraliq_L):
    H, W = L.shape
    x0, y0, x1, y1 = _quti(quti, H, W)
    s = L[y0:y1, x0:x1]
    return {'n': float(((s >= oraliq_L[0]) & (s <= oraliq_L[1])).sum())}


def uch(L, quti, shart, bog, eng='ong', median=5):
    op, t = shart[0], float(shart[1:])
    Lm = ndimage.median_filter(L, median) if median > 1 else L
    m = (Lm < t) if op == '<' else (Lm > t)
    lab, n = ndimage.label(m)
    c = lab[int(bog[1]), int(bog[0])]
    if c == 0:
        return None
    f = ndimage.binary_fill_holes(lab == c)
    H, W = L.shape
    x0, y0, x1, y1 = _quti(quti, H, W)
    sub = f[y0:y1, x0:x1]
    ys, xs = np.nonzero(sub)
    if len(xs) == 0:
        return None
    if eng == 'ong':
        k = xs == xs.max()
    elif eng == 'chap':
        k = xs == xs.min()
    elif eng == 'past':
        k = ys == ys.max()
    else:
        k = ys == ys.min()
    return {'x': float(xs[k].mean() + x0), 'y': float(ys[k].mean() + y0)}


# ---------------------------------------------------------------- langar
def _urug(spec, k):
    u = spec.get('urug')
    if isinstance(u, list):
        return u
    if not u:
        return None
    ks = sorted(int(a) for a in u)
    if str(k) in u:
        return u[str(k)]
    a = max([x for x in ks if x < k], default=None)
    b = min([x for x in ks if x > k], default=None)
    if a is None:
        return u[str(b)]
    if b is None:
        return u[str(a)]
    t = (k - a) / (b - a)
    return [u[str(a)][i] + (u[str(b)][i] - u[str(a)][i]) * t for i in (0, 1)]


def langar(loy, tomon, k):
    s = loy.langar
    if not s:
        return (0.0, 0.0), None
    L = tasvir.ol(loy.fayl(tomon, k), loy.olcham)
    r = komponent(L, s['quti'], s['chegara'], s.get('qutb', 'qorongi'), _urug(s, k))
    return ((r['x'], r['y']) if r else None), r


# ---------------------------------------------------------------- bitta zond
def _siljit(q, a):
    return [q[0] + a[0], q[1] + a[1], q[2] + a[0], q[3] + a[1]]


def olch(loy, z, tomon, k, A):
    """z -- zond spec; A -- MISOLNING shu kadrdagi langar nuqtasi (nisbiy zondlar uchun)"""
    L = tasvir.ol(loy.fayl(tomon, k), loy.olcham)
    a = A if z.get('nisbiy') else (0.0, 0.0)
    tur = z['tur']
    if isinstance(z.get('quti'), dict):            # har kadrga o'z qutisi
        q = z['quti'].get(str(k))
        if q is None:
            return None
        z = dict(z, quti=q)
    if tur == 'komponent':
        ur = [z['urug'][0] + a[0], z['urug'][1] + a[1]] if 'urug' in z else None
        return komponent(L, _siljit(z['quti'], a), z['chegara'], z.get('qutb', 'qorongi'), ur,
                         eng=z.get('eng_yorug') or z.get('eng_qorongi'))
    if tur == 'chet':
        return chet(L, [z['bosh'][0] + a[0], z['bosh'][1] + a[1]], z['yon'], z['uzunlik'], z['shart'])
    if tur == 'soha':
        rgb = tasvir.ol(loy.fayl(tomon, k), loy.olcham, 'RGB') if z.get('rang') else None
        return soha(L, rgb, _siljit(z['quti'], a))
    if tur == 'hisob':
        return hisob(L, _siljit(z['quti'], a), z['L'])
    if tur == 'uch':
        return uch(L, _siljit(z['quti'], a), z['shart'], z['bog'], z.get('eng', 'ong'), z.get('median', 5))
    raise ValueError('nomalum zond turi: ' + tur)


ASOSIY = {'komponent': ('x', 'y'), 'chet': ('t',), 'soha': ('v',), 'hisob': ('n',), 'uch': ('x', 'y')}


def yugur(loy, kadrlar, tomonlar=('misol', 'biz')):
    """Hamma zondni har kadrda ikkala tomonda o'lchaydi.
    Qaytaradi: {'langar': {k: {...}}, 'zond': {nom: {k: {'misol':{..},'biz':{..}}}}}"""
    natija = {'langar': {}, 'zond': {}}
    A = {}
    for k in kadrlar:
        am, rm = langar(loy, 'misol', k)
        A[k] = am
        e = {'misol': rm}
        for t in tomonlar[1:]:
            _, e[t] = langar(loy, t, k)
        natija['langar'][k] = e
    for z in loy.zondlar:
        ruxsat = set(oraliq(z['kadrlar'])) if 'kadrlar' in z else None
        d = {}
        for k in kadrlar:
            if ruxsat is not None and k not in ruxsat:
                continue
            if z.get('nisbiy') and A[k] is None:
                continue
            d[k] = {t: olch(loy, z, t, k, A[k]) for t in tomonlar}
        natija['zond'][z['nom']] = d
    return natija


def jadval(loy, natija, kadrlar, tomon='biz'):
    """Matn jadval: har zond qiymati uchun (tomon - misol) farqi, har kadr ustunida.
    Bayroq (*) -- |farq| > tol. Oxirida zondlar o'rtacha |farq| bo'yicha tartiblanadi."""
    qator = []
    bosh = '%-22s' % 'zond.qiymat' + ''.join('%7d' % k for k in kadrlar) + '   o\'rt|f|'
    qator.append(bosh)
    reyting = []
    # langar
    for q in ('x', 'y'):
        cells, fs = [], []
        for k in kadrlar:
            e = natija['langar'].get(k, {})
            m, b = e.get('misol'), e.get(tomon)
            if m and b:
                f = b[q] - m[q]; fs.append(abs(f)); cells.append('%+7.1f' % f)
            else:
                cells.append('      -')
        mf = np.mean(fs) if fs else float('nan')
        qator.append('%-22s' % ('LANGAR.' + q) + ''.join(cells) + '   %6.2f' % mf)
    for z in loy.zondlar:
        d = natija['zond'].get(z['nom'], {})
        tol = z.get('tol', 1.5)
        for q in ASOSIY[z['tur']]:
            cells, fs = [], []
            for k in kadrlar:
                e = d.get(k)
                if not e or not e.get('misol') or not e.get(tomon):
                    cells.append('      -' if e is None else '   yoq')
                    continue
                m, b = e['misol'][q], e[tomon][q]
                if z['tur'] == 'hisob':
                    f = (b - m) / max(m, 1.0) * 100            # foiz
                    bayroq = abs(f) > z.get('tol', 25)
                else:
                    f = b - m
                    bayroq = abs(f) > tol
                fs.append(abs(f))
                cells.append(('%+6.1f' % f) + ('*' if bayroq else ' '))
            mf = np.mean(fs) if fs else float('nan')
            nomi = z['nom'] + '.' + q + ('%' if z['tur'] == 'hisob' else '')
            qator.append('%-22s' % nomi[:22] + ''.join(cells) + '   %6.2f' % mf)
            if fs:
                reyting.append((mf / (z.get('tol', 25) if z['tur'] == 'hisob' else tol), nomi, mf))
    qator.append('')
    qator.append('ENG KATTA FARQLAR (tol ga nisbatan):')
    for r, nomi, mf in sorted(reyting, reverse=True)[:12]:
        qator.append('  %-26s o\'rtacha |farq| %6.2f   (%.1fx tol)' % (nomi, mf, r))
    return '\n'.join(qator)
