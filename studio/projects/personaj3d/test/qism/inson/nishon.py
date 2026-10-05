"""NISHONLAR (11-o'tish): har kadrda har qism -- misolda qayerda (nishon) va bizning model qayerda, bitta jadvalda.
Har tomon O'Z haqiqati bilan o'lchanadi (chizmalar har xil: bir xil kod ikkala tomonda siljishni qisqartirmaydi --
og'iz: misolda qora qismi o'ngda, bizda chapda -> "bir xil kod" farqi 5 px teskari chiqardi):
  MISOL  -- Alonur belgisi bo'lsa o'sha (R12 va R13 bir xil chizma -> o'rtachasi); bo'lmasa tuzatilgan detektor
            (test/qism/qism_olch.py; test/qism/inson/sinov_detektor.py dan o'tgan), odam bilan o'lchangan ta'rif farqi
            tuzatiladi (1-shot og'iz: detektor faqat qora qismini ko'radi, +2.5 px o'ngda).
  BIZ    -- ko'z, burun, og'iz o'rtasi, qosh o'rtasi: 3D nuqta (test/qism/biz_TEG.json, markazga -0.5);
            iyak va jag': xuddi shu detektor bizning YALANG'OCH renderimiz siluetida (ta'rif misol bilan bir xil).
  python3 test/qism/inson/nishon.py TEG   -> test/qism/inson/nishon_TEG.json + jadval
MAXFIY: misoldan olingan (odam belgilari, misol detektori)."""
import json, math, sys, os
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qism_olch as Q
from tahlil import nuqta

R = '/home/claude/work/personaj3d'
H = os.path.dirname(os.path.abspath(__file__))
TEG = sys.argv[1] if len(sys.argv) > 1 else 'bosh10c'
B = json.load(open(os.path.join(H, 'belgilar_alonur_1.json')))['marks']
BIZ = json.load(open('%s/test/qism/biz_%s.json' % (R, TEG)))
TUZ = {('ogiz', 1): (-2.5, 0.0)}           # (qism, shot): odam - detektor, o'lchangan (R03 -2.4, R10 -2.7)
TAXMINIY_JAG = {'R22'}                     # Alonur: soch to'sgan, jag' taxminiy -- detektor ham soch chetini oldi
QISM = {'koz_yaqin': 'koz_yaqin', 'koz_uzoq': 'koz_uzoq', 'burun': 'burun_uchi', 'ogiz': 'ogiz', 'qosh_yaqin': 'qosh_yaqin_orta',
        'qosh_uzoq': 'qosh_uzoq_orta', 'iyak': None}
DET = {'koz_yaqin': 'koz_yaqin', 'koz_uzoq': 'koz_uzoq', 'burun': 'burun_uchi', 'ogiz': 'ogiz', 'qosh_yaqin': 'qosh_yaqin',
       'qosh_uzoq': 'qosh_uzoq', 'iyak': 'iyak_uchi'}
shot = lambda k: 1 if k <= 11 else 2 if k <= 13 else 3


def xy(v):
    return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))


def odam(k, q):
    ids = ['R12', 'R13'] if k in (12, 13) else ['R%02d' % k]
    p = [nuqta(q, B[i].get(q)) for i in ids if i in B]
    p = [v for v in p if v]
    if not p: return None, any(B.get(i, {}).get(q, {}).get('yoq') for i in ids)
    return [sum(v[0] for v in p) / len(p), sum(v[1] for v in p) / len(p)], False


def main():
    out = {}
    for k in range(1, 23):
        m = Q.olch(Q.L320('/home/claude/work/maqsad/k%02d.png' % k), k)
        by = Q.olch(Q.rol_L('%s/kadrlar-qism/rol-yalang-%s/%03d.png' % (R, TEG, k - 1)), k)
        A = BIZ[str(k - 1)]
        o = {}
        for q, a3 in QISM.items():
            t, yoq = odam(k, q); manba = 'odam'
            if t is None and not yoq:
                d = xy(m.get(DET[q]))
                if d is not None:
                    dx, dy = TUZ.get((q, shot(k)), (0, 0)); t = [d[0] + dx, d[1] + dy]
                    manba = 'detektor' + ('+tuzatish' if (q, shot(k)) in TUZ else '')
            if q == 'iyak': b = xy(by.get('iyak_uchi')); bm = "yalang'och siluet"
            else: b = [A[a3][0] - 0.5, A[a3][1] - 0.5]; bm = '3D' + ('' if A[a3][3] else ' (orqada)')
            o[q] = {'misol': None if t is None else [round(t[0], 2), round(t[1], 2)], 'manba': manba if t else ('odam: ko\'rinmaydi' if yoq else 'yo\'q'),
                    'biz': None if b is None else [round(b[0], 2), round(b[1], 2)], 'biz_manba': bm}
            if t and b: o[q]['farq'] = [round(b[0] - t[0], 2), round(b[1] - t[1], 2)]
        mj = {int(x): y for x, y in m.get('jag', {}).items()}; bj = {int(x): y for x, y in by.get('jag', {}).items()}
        fid = 'R%02d' % k
        if fid in TAXMINIY_JAG: mj = {}
        umum = sorted(set(mj) & set(bj))
        o['jag'] = {'misol': mj, 'biz': bj, 'farq': {x: bj[x] - mj[x] for x in umum}, 'manba': 'detektor' if mj else "yo'q (soch ostida)"}
        out[k] = o
    json.dump(out, open(os.path.join(H, 'nishon_%s.json' % TEG), 'w'), ensure_ascii=False)
    for s in (1, 2, 3):
        ks = [k for k in out if shot(k) == s]
        print('== %d-shot (kadrlar %d-%d): biz - misol, px' % (s, ks[0], ks[-1]))
        for q in QISM:
            v = [(k, out[k][q]) for k in ks if 'farq' in out[k][q]]
            if not v: print('  %-10s -- nishon yo\'q' % q); continue
            fx = [e['farq'][0] for _, e in v]; fy = [e['farq'][1] for _, e in v]
            man = sorted(set(e['manba'] for _, e in v))
            print('  %-10s %2d kadr | x %+6.1f  y %+6.1f | |o\'rt| %5.1f | %s' % (q, len(v), sum(fx) / len(fx), sum(fy) / len(fy),
                  math.hypot(sum(fx) / len(fx), sum(fy) / len(fy)), ', '.join(man)))
        f = [d for k in ks for d in out[k]['jag']['farq'].values()]
        if f: print('  %-10s %2d ustun | y o\'rt %+5.1f | |y| %4.1f' % ('jag\'', len(f), sum(f) / len(f), sum(map(abs, f)) / len(f)))


main()
