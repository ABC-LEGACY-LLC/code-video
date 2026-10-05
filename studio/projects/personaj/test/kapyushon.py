"""KAPYUSHON ASBOBLARI (12-o'tish, 2- va 3-kadr). Ikkala tomonda bir xil kod, 320x180 L.
Langar -- YORUG' SOCH massasi (L>85, median 3, x<230, eng katta qism): kamera kadr ichida
qimirlamaydi, bosh esa kapyushon ichida cho'kadi -- qutilar shu massaga bog'lanadi.

  soch   -- yorug' soch massasi: maydon, markaz, qutisi
  tasma  -- qirra OSTI (astar) -- 33 <= L <= 65 (median 3), soch massasi tepasidagi qutida
            (x: soch x0-10 .. x1+10, y: soch y0-30 .. y0+12); eng katta qism: maydon,
            markaz, qalinlik (maydon / eni)
  pona   -- kapyushon ICHI -- 6.5 <= L <= 12 (median 5), soch massasidan chapda
            (x: soch x0-45 .. soch markazi, y: soch y0-25 .. y1+10); eng katta qism
  massa  -- kapyushon tashqi sirti -- 12 <= L <= 32 (median 7), kadrning chap 3/4 da,
            eng katta bog'langan qism; tepa-o'ng cho'qqi = (x - y) eng katta nuqta

Misolda (3-kadr, 17-tasvir L jadvali): tashqi sirt L 19, astar tasma L 43..48, ichki
pona L 7..9, soch L ~100, osmon L 2..6 (zarrali). Chegaralar shu darajalar oralig'ida.
python3 test/kapyushon.py [--kalibr] [--kadrlar 12-22] [--tomon misol,biz]"""
import sys, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import loyiha, tasvir

W = '/home/claude/work/personaj'


def _eng_katta(m):
    lab, n = ndimage.label(m)
    if not n:
        return None
    s = ndimage.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(s)))


def soch(L):
    m = ndimage.median_filter(L, 3) > 85
    m[:, 230:] = False
    k = _eng_katta(m)
    if k is None:
        return None
    ys, xs = np.nonzero(k)
    return {'maydon': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()),
            'quti': (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1), 'niq': k}


def _qutida(m, q):
    x0, y0, x1, y1 = [int(round(v)) for v in q]
    o = np.zeros_like(m); H, W_ = m.shape
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W_, x1), min(H, y1)
    o[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return o


def tasma(L, s):
    if s is None:
        return None
    x0, y0, x1, y1 = s['quti']
    m = (ndimage.median_filter(L, 3) >= 33) & (ndimage.median_filter(L, 3) <= 65)
    m = _qutida(m, (x0 - 10, y0 - 30, x1 + 10, y0 + 12))
    k = _eng_katta(m)
    if k is None:
        return {'maydon': 0, 'x': None, 'y': None, 'qalinlik': 0.0}
    ys, xs = np.nonzero(k)
    en = xs.max() - xs.min() + 1
    return {'maydon': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()), 'qalinlik': float(k.sum() / en), 'niq': k}


def pona(L, s):
    if s is None:
        return None
    x0, y0, x1, y1 = s['quti']
    Lm = ndimage.median_filter(L, 5)
    m = (Lm >= 6.5) & (Lm <= 12)
    m = _qutida(m, (x0 - 45, y0 - 25, s['x'], y1 + 10))
    k = _eng_katta(m)
    if k is None:
        return {'maydon': 0, 'x': None, 'y': None}
    ys, xs = np.nonzero(k)
    return {'maydon': int(k.sum()), 'x': float(xs.mean()), 'y': float(ys.mean()), 'niq': k}


def massa(L):
    Lm = ndimage.median_filter(L, 7)
    m = (Lm >= 12) & (Lm <= 32)
    m[:, 240:] = False
    k = _eng_katta(m)
    if k is None:
        return None
    ys, xs = np.nonzero(k)
    i = int(np.argmax(xs - ys))
    return {'maydon': int(k.sum()), 'chuqqi': (int(xs[i]), int(ys[i])), 'niq': k}


def olch(L):
    s = soch(L)
    return {'soch': s, 'tasma': tasma(L, s), 'pona': pona(L, s), 'massa': massa(L)}


def kalibr():
    """sintetik kapyushon: osmon L 3 (zarrali), tashqi sirt L 19, pona L 8 (ma'lum
    uchburchak), astar tasma L 45 (qalinligi ma'lum), soch L 100, yuz L 60"""
    rng = np.random.default_rng(3)

    def yasa(qal=10, pona_d=(0, 0), tasma_bor=True, pona_bor=True):
        L = np.full((180, 320), 3.0)
        z = rng.random((180, 320)) < 0.02; L[z] = 200                   # zarralar
        L[0:180, 0:200] = 19                                            # tashqi sirt
        L[70:130, 150:215] = 100                                        # soch massasi (x 150..214, y 70..129)
        L[130:170, 150:200] = 60                                        # yuz
        if tasma_bor:
            L[70 - qal:70, 150:215] = 45                                # astar: soch ustida
        if pona_bor:
            yy, xx = np.mgrid[0:180, 0:320]
            dx, dy = pona_d
            tri = (xx >= 125 + dx) & (xx < 150 + dx) & (yy >= 80 + dy) & (yy < 125 + dy) & ((xx - 125 - dx) > (yy - 80 - dy) * 0.4)
            L[tri] = 8
        return L

    ok = True
    a = olch(yasa()); b = olch(yasa(qal=5)); c = olch(yasa(pona_d=(4, 3))); d = olch(yasa(tasma_bor=False, pona_bor=False))
    r1 = abs(a['tasma']['qalinlik'] - 10) < 1.0 and abs(b['tasma']['qalinlik'] - 5) < 1.0
    r2 = abs(c['pona']['x'] - a['pona']['x'] - 4) < 0.6 and abs(c['pona']['y'] - a['pona']['y'] - 3) < 0.6
    r3 = d['tasma']['maydon'] == 0 and d['pona']['maydon'] == 0
    # median 3 to'rtburchakning burchak piksellarini oladi (3x3 da 4/9) -- maydon +-0.5%
    r4 = abs(a['soch']['maydon'] - 65 * 60) <= 0.005 * 65 * 60 and abs(a['soch']['x'] - 182) < 0.05
    print('kalibr kapyushon/tasma  qalinlik 10 -> %.2f, 5 -> %.2f  %s' % (a['tasma']['qalinlik'], b['tasma']['qalinlik'], 'PROVEN' if r1 else 'UNPROVEN'))
    print('kalibr kapyushon/pona   +4,+3 surilgan -> %+.2f,%+.2f  %s' % (c['pona']['x'] - a['pona']['x'], c['pona']['y'] - a['pona']['y'], 'PROVEN' if r2 else 'UNPROVEN'))
    print('kalibr kapyushon/yo\'q   tasma va pona yo\'q -> maydon %d, %d  %s' % (d['tasma']['maydon'], d['pona']['maydon'], 'PROVEN' if r3 else 'UNPROVEN'))
    print('kalibr kapyushon/soch   maydon %d (3900), x %.2f (182)  %s' % (a['soch']['maydon'], a['soch']['x'], 'PROVEN' if r4 else 'UNPROVEN'))
    return r1 and r2 and r3 and r4


def jadval(loy, kadrlar, tomonlar=('misol', 'biz')):
    R = {}
    for t in tomonlar:
        R[t] = {k: olch(tasvir.ol(loy.fayl(t, k), loy.olcham)) for k in kadrlar}
    f = lambda v, fmt='%5.0f': (fmt % v) if v is not None else '    -'
    print(' tasvir | soch maydon, markaz        | tasma maydon qalin, markaz      | pona maydon, markaz        | massa maydon, cho\'qqi')
    for k in kadrlar:
        for t in tomonlar:
            o = R[t][k]; s, ta, p, m = o['soch'], o['tasma'], o['pona'], o['massa']
            print('  %2d %-5s| %5d (%5.1f,%5.1f)        | %5d %4.1f (%s,%s)          | %5d (%s,%s)            | %5d %s' % (
                k, t[:5], s['maydon'] if s else 0, s['x'] if s else 0, s['y'] if s else 0,
                ta['maydon'] if ta else 0, ta['qalinlik'] if ta else 0, f(ta and ta['x'], '%5.1f'), f(ta and ta['y'], '%5.1f'),
                p['maydon'] if p else 0, f(p and p['x'], '%5.1f'), f(p and p['y'], '%5.1f'),
                m['maydon'] if m else 0, m['chuqqi'] if m else '-'))
    return R


if __name__ == '__main__':
    ok = kalibr()
    if '--kalibr' in sys.argv:
        sys.exit(0 if ok else 1)
    assert ok
    loy = loyiha.Loyiha(W + '/taqqos.json')
    a = sys.argv[sys.argv.index('--kadrlar') + 1] if '--kadrlar' in sys.argv else '12-22'
    k0, k1 = [int(v) for v in a.split('-')]
    tl = sys.argv[sys.argv.index('--tomon') + 1].split(',') if '--tomon' in sys.argv else ['misol', 'biz']
    jadval(loy, list(range(k0, k1 + 1)), tl)
