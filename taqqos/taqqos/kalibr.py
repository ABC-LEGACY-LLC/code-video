"""KALIBRLASH -- har o'lchov o'zining yaxshi va BUZILGAN holatini ajratishini
isbotlaydi. Ajrata olmasa UNPROVEN, va undan chiqqan raqam o'lchov emas.

Hammasi sintetik: javobi oldindan ma'lum tasvirlar yasaladi (tarmoq ham, misol
fayli ham kerak emas). Repo qoidasi bilan bir xil: o'tayotgan, lekin hech narsani
ushlab turmaydigan tekshiruv -- eng yomon tekshiruv."""
import numpy as np
from scipy import ndimage
from . import zond, harakat, farq, yopilish, yoyish

H, W = 180, 320


def _disk(cx, cy, r=4.0, fon=60.0, rang=10.0):
    y, x = np.mgrid[0:H, 0:W]
    L = np.full((H, W), fon)
    L[(x - cx) ** 2 + (y - cy) ** 2 <= r * r] = rang
    return L


def k_komponent():
    a = zond.komponent(_disk(100.0, 50.0), [80, 30, 120, 70], 36, 'qorongi', [100, 50])
    b = zond.komponent(_disk(103.0, 52.0), [80, 30, 120, 70], 36, 'qorongi', [100, 50])
    bosh = zond.komponent(np.full((H, W), 60.0), [80, 30, 120, 70], 36, 'qorongi', [100, 50])
    ok = a and b and abs(a['x'] - 100) < 0.05 and abs((b['x'] - a['x']) - 3) < 0.05 and abs((b['y'] - a['y']) - 2) < 0.05 and bosh is None
    return ok, 'markaz (%.2f,%.2f); +3,+2 surilgan -> farq (%.2f,%.2f); bo\'sh tasvir -> %s' % (
        a['x'], a['y'], b['x'] - a['x'], b['y'] - a['y'], bosh)


def k_chet():
    L = np.full((H, W), 60.0); L[:, 151:] = 20.0          # chet 150/151 orasida
    L2 = np.full((H, W), 60.0); L2[:, 153:] = 20.0
    a = zond.chet(L, [140, 90], [1, 0], 30, '<45')
    b = zond.chet(L2, [140, 90], [1, 0], 30, '<45')
    yoq = zond.chet(np.full((H, W), 60.0), [140, 90], [1, 0], 30, '<45')
    ok = a and b and abs(a['x'] - 150.4) < 0.4 and abs((b['x'] - a['x']) - 2) < 0.1 and yoq is None
    return ok, 'chet x=%.2f; 2 px surilgan -> farq %.2f; chetsiz -> %s' % (a['x'], b['x'] - a['x'], yoq)


def k_uch():
    L = np.full((H, W), 60.0); L[100:180, 0:140] = 10; L[140:150, 139:171] = 10
    L2 = L.copy(); L2[140:150, 161:171] = 60
    a = zond.uch(L, [130, 120, 200, 180], '<26', [60, 170], 'ong', 1)
    b = zond.uch(L2, [130, 120, 200, 180], '<26', [60, 170], 'ong', 1)
    ok = a and b and abs(a['x'] - 170) < 0.6 and abs(b['x'] - 160) < 0.6
    return ok, 'uchi x=%.1f (170 kutilgan); qisqartirilgan -> %.1f (160)' % (a['x'], b['x'])


def k_hisob_soha():
    L = np.full((H, W), 60.0); L[60:70, 130:140] = 44
    n = zond.hisob(L, [120, 50, 150, 80], [30, 55])['n']
    v = zond.soha(L, None, [120, 50, 150, 80])['v']
    ok = n == 100 and v == 60
    return ok, 'hisob %d (100 kutilgan), median %.0f (60)' % (n, v)


def k_harakat():
    rng = np.random.default_rng(3)
    base = ndimage.gaussian_filter(rng.random((H, W)) * 255, 1.5)
    m = np.zeros((H, W), bool); m[20:160, 20:300] = True
    r = harakat.juft(base, np.roll(base, 1, axis=1), m)
    # qaynash: har blok o'zicha siljiydi
    b2 = base.copy()
    for y in range(20, 160, 12):
        for x in range(20, 300, 12):
            dx, dy = rng.integers(-2, 3), rng.integers(-2, 3)
            b2[y:y + 12, x:x + 12] = np.roll(np.roll(base, dy, 0), dx, 1)[y:y + 12, x:x + 12]
    q = harakat.juft(base, b2, m)
    ok = r and abs(r['dx'] - 1) < 0.01 and r['qaynash'] < 0.3 and q and q['qaynash'] > 1.0
    return ok, 'qattiq 1 px: harakat %.2f qaynash %.2f; blokma-blok tasodifiy: qaynash %.2f' % (
        r['harakat'], r['qaynash'], q['qaynash'])


def k_ritm():
    rng = np.random.default_rng(5)
    base = ndimage.gaussian_filter(rng.random((H, W + 200)) * 255, 2)
    tek = [base[:, i * 3:i * 3 + W] for i in range(11)]
    pos = np.cumsum([0] + [2 + i * 0.6 for i in range(10)]).astype(int)
    tez = [base[:, p:p + W] for p in pos]
    d1 = [farq.farq(tek[i], tek[i + 1]) for i in range(10)]
    d2 = [farq.farq(tez[i], tez[i + 1]) for i in range(10)]
    t1, t2 = (d1[-1] / d1[0] - 1) * 100, (d2[-1] / d2[0] - 1) * 100
    ok = abs(t1) < 3 and t2 > 20
    return ok, 'bir tekis harakat tendensiyasi %+.1f%% (0 kutilgan); tezlashuvchi %+.1f%% (musbat)' % (t1, t2)


def k_yopilish():
    rng = np.random.default_rng(7)
    def qor(fig):
        F = []
        for _ in range(11):
            f = np.full((H, W), 12.0)
            ys, xs = rng.integers(0, H, 2600), rng.integers(0, W, 2600)
            f[ys, xs] = 190
            if fig:
                f[40:180, 0:120] = 18
            F.append(f)
        return F
    bosh = yopilish.xarita(qor(False))
    m = yopilish.xarita(qor(True))
    haq = np.zeros_like(m); haq[4:18, 0:12] = True
    i = yopilish.iou(m, haq)
    ok = bosh.mean() < 0.02 and i > 0.8
    return ok, 'figurasiz: figura bloklari %.1f%%; figura bilan IoU %.2f' % (bosh.mean() * 100, i)


def k_yoyish():
    y, x = np.mgrid[0:H, 0:W]
    T = {'cx': 160.0, 'cy': 90.0, 'R': 40.0, 'rol': -12.0, 'sx': 1.0}
    t = np.deg2rad(-T['rol']); co, si = np.cos(t), np.sin(t)
    # sub'ekt fazosidagi belgi: x 0..0.8, y -0.4..0.4 to'rtburchak -> ekranga
    # (0.4 birlikli kichik to'rtburchakda chet kataklari ulushi IoU ni 0.90 da
    # ushlab qolardi -- bu o'lchov emas, sinovning o'z cheklovi edi)
    dx, dy = x - T['cx'], y - T['cy']
    u = (dx * co + dy * si) / T['R']; v = (-dx * si + dy * co) / T['R']
    L = np.where((u > 0.0) & (u < 0.8) & (v > -0.4) & (v < 0.4), 200.0, 20.0)
    s, xs, ys = yoyish.namuna(L, T)
    X, Y = np.meshgrid(xs, ys)
    haq = (X > 0.0) & (X < 0.8) & (Y > -0.4) & (Y < 0.4)
    i1 = yopilish.iou(s > 110, haq)
    T2 = dict(T, rol=-2.0)
    s2, _, _ = yoyish.namuna(L, T2)
    i2 = yopilish.iou(s2 > 110, haq)
    ok = i1 > 0.9 and i2 < i1 - 0.1
    return ok, 'to\'g\'ri transform IoU %.2f; rol 10 gradus xato -> %.2f' % (i1, i2)


def k_ustma():
    from . import varaq
    a = _disk(100, 50); b = _disk(103, 50)
    s = np.asarray(varaq.ustma(a, a)).astype(int)
    t = np.asarray(varaq.ustma(a, b)).astype(int)
    ok = np.abs(s[:, :, 0] - s[:, :, 1]).max() == 0 and np.abs(t[:, :, 0] - t[:, :, 1]).max() >= 40   # sintetik tasvirda mumkin bo'lgan eng katta farq 50
    return ok, 'bir xil -> rang farqi %d (0); 3 px surilgan -> %d' % (
        np.abs(s[:, :, 0] - s[:, :, 1]).max(), np.abs(t[:, :, 0] - t[:, :, 1]).max())


def k_siluet():
    from . import siluet
    # tana (chap past) + undan chiqqan qo'l (y 140..150, x 139..170), ustida qor zarralari
    rng = np.random.default_rng(11)
    def tasv(uzun):
        L = np.full((H, W), 60.0); L[100:180, 0:140] = 12; L[140:150, 139:139 + uzun] = 12
        ys, xs = rng.integers(0, H, 900), rng.integers(0, W, 900)
        L[ys, xs] = 200                       # zarra: median 5 o'chirishi kerak
        return L
    a = siluet.niqob(tasv(31), '<26', 5, [60, 170])
    b = siluet.niqob(tasv(21), '<26', 5, [60, 170])
    uz = siluet.niqob(np.where(np.arange(W)[None, :] > 200, 12.0, 60.0) * np.ones((H, 1)), '<26', 5, [60, 170])
    s0 = siluet.solishtir(a, a, [120, 120, 200, 170], 'ong')
    s1 = siluet.solishtir(a, b, [120, 120, 200, 170], 'ong')
    qo = s1['farq'][(s1['o'] >= 142) & (s1['o'] < 148)]            # qo'lning ichki qatorlari
    ok = (s0['iou'] == 1.0 and s0['ortacha'] == 0 and abs(np.median(qo) + 10) < 0.6
          and s1['iou'] < 0.95 and not uz.any())
    return ok, 'o\'zi bilan IoU %.2f farq %.1f; qo\'l 10 px qisqa -> qo\'l qatorlarida %+.1f px, IoU %.2f; bog\' uzilgan -> bo\'sh %s' % (
        s0['iou'], s0['ortacha'], np.median(qo), s1['iou'], not uz.any())


def _soch_tasvir(uzun=40, dx=0, rng=None):
    """sintetik 'soch': yorug' massa (L 105) qorong'i fonda (L 30), ikki tutam,
    massa ichida qorong'i teshik, 1 px zarralar va bitta 4x4 katta zarra"""
    rng = rng or np.random.default_rng(5)
    L = np.full((H, W), 30.0)
    L[20:60, 100:200] = 105
    L[60:60 + uzun, 110 + dx:118 + dx] = 105
    L[60:100, 150:158] = 105
    L[30:40, 140:150] = 30
    ys, xs = rng.integers(0, H, 400), rng.integers(0, W, 400)
    L[ys, xs] = 200
    L[150:154, 20:24] = 200
    return L


def k_siluet_yorug():
    from . import siluet
    q = [95, 15, 205, 110]
    n = lambda L, toldir=False: siluet.niqob(L, '>85', 3, None, toldir, 60, q)
    a, b, c = n(_soch_tasvir(40)), n(_soch_tasvir(34)), n(_soch_tasvir(40, 2))
    t = n(_soch_tasvir(40), True)
    sp = siluet.solishtir(a, b, q, 'past')
    ust = sp['farq'][(sp['o'] >= 111) & (sp['o'] < 117)]                 # 1-tutam ustunlari
    sc = siluet.solishtir(a, c, [95, 62, 205, 98], 'chap')
    chp = sc['farq'][(sc['o'] >= 64) & (sc['o'] < 96)]                  # 1-tutam qatorlari
    zarra, teshik, toldi = a[150:154, 20:24].any(), a[32:38, 142:148].any(), t[32:38, 142:148].all()
    ok = abs(np.median(ust) + 6) < 0.6 and abs(np.median(chp) - 2) < 0.6 and not zarra and not teshik and toldi
    return ok, ('tutam 6 px qisqa -> "past" %+.1f px; tutam 2 px o\'ngga -> "chap" %+.1f px; '
                'katta zarra niqobda %s; teshik ochiq %s (toldir: yopiq %s)') % (
        np.median(ust), np.median(chp), zarra, not teshik, toldi)


def k_ketma():
    from . import siluet
    spec = {'quti': [95, 62, 205, 98], 'shart': '>85', 'median': 3, 'toldir': False, 'min_maydon': 60, 'yon': 'chap'}
    A, B = _soch_tasvir(40), _soch_tasvir(40, 2)
    r = siluet.ketma_massiv([A, A, B], spec)
    ok = r[0]['ortacha'] == 0 and r[0]['iou'] == 1.0 and abs(r[1]['ortacha'] - 2) < 0.3 and r[1]['iou'] < 1
    return ok, 'bir xil juft -> |siljish| %.2f, IoU %.2f; 2 px surilgan tutam -> %.2f px, IoU %.2f' % (
        r[0]['ortacha'], r[0]['iou'], r[1]['ortacha'], r[1]['iou'])


def k_qiymat():
    from . import siluet
    L = np.full((H, W), 30.0)
    L[20:70, 100:200] = 100
    L[20:30, 100:200] = 120                                              # 20% yorug'roq
    m = siluet.niqob(L, '>85', 1, None, False, 60, [0, 0, W, H])
    med, p90 = siluet.qiymat(L, m, [0, 0, W, H])
    L2 = L.copy(); L2[20:70, 100:200] += 10
    med2, _ = siluet.qiymat(L2, siluet.niqob(L2, '>85', 1, None, False, 60, [0, 0, W, H]), [0, 0, W, H])
    ok = med == 100 and p90 == 120 and med2 == 110
    return ok, 'niqob ichida median %.0f (100), p90 %.0f (120); hammasi +10 -> median %.0f (110)' % (med, p90, med2)


TESTLAR = [('zond/komponent', k_komponent), ('zond/chet', k_chet), ('zond/uch', k_uch),
           ('zond/hisob+soha', k_hisob_soha), ('harakat/qaynash', k_harakat), ('farq/ritm', k_ritm),
           ('yopilish/xarita', k_yopilish), ('yoyish', k_yoyish), ('varaq/ustma', k_ustma),
           ('siluet/profil', k_siluet), ('siluet/yorug\'', k_siluet_yorug), ('siluet/ketma', k_ketma),
           ('siluet/qiymat', k_qiymat)]


def hammasi():
    q, yiq = [], 0
    for nom, f in TESTLAR:
        try:
            ok, izoh = f()
        except Exception as e:
            ok, izoh = False, 'XATO: %r' % e
        yiq += (not ok)
        q.append('%-9s %-18s %s' % ('PROVEN' if ok else 'UNPROVEN', nom, izoh))
    q.append('')
    q.append('hammasi isbotlangan' if yiq == 0 else '%d ta o\'lchov UNPROVEN -- ularning raqamlariga ishonmang' % yiq)
    return '\n'.join(q), yiq
