"""QISMLAR TAQQOSI (10-o'tish): misol va biz -- har qism, har kadr, bir xil kod (test/qism/qism_olch.py).
  Bizda ikki holat: KIYINGAN (anime render: soch, kapyushon bor -- misoldagidek ko'rinadigan qismlar) va YALANG'OCH (rol
  render, soch/kapyushon/plash yashirilgan -- boshning o'z siluetasi: kontur, jag' osti, iyak, burun uchi) + 3D dan aniq
  nuqtalar (test/qism/biz_TEG.json). Qism bo'yicha qaysi manba ishlatiladi:
    ko'z, og'iz, lab soyasi -- misol va kiyingan render, xuddi shu bo'lak qoidasi (ikkalasida ko'rinsa); bizda soch ostida
      bo'lsa -- aniq nuqta + kalibr siljishi (test/qism/kalibr.py: bo'lak markazi aniq nuqtadan qancha) -- belgilanadi;
    qosh -- bizniki deyarli doim soch ostida: aniq nuqta (qosh chizig'ining o'rtasi, kalibr siljishi 0) -- belgilanadi;
    iyak uchi, burun uchi, jag' osti, kontur -- misol va YALANG'OCH siluetamiz (bir xil skan).
  Masofalar (kamera bir xil bo'lgani uchun px): ko'z -> og'iz, og'iz -> iyak, ko'z -> iyak (tik), jag' osti orqa qismi.
python3 test/qism/taqqos.py TEG   -> test/qism/taqqos_TEG.json, jadval"""
import sys, json
import numpy as np
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q

R = '/home/claude/work/personaj3d'
TEG = sys.argv[1] if len(sys.argv) > 1 else 'dunyo9b'
ANIQ = json.load(open('%s/test/qism/biz_%s.json' % (R, TEG)))
KAL = json.load(open('%s/test/qism/kalibr_%s.json' % (R, TEG))) if __import__('os').path.exists('%s/test/qism/kalibr_%s.json' % (R, TEG)) else {}
MOS = {'koz_yaqin': 'koz_yaqin', 'koz_uzoq': 'koz_uzoq', 'qosh_yaqin': 'qosh_yaqin_orta', 'qosh_uzoq': 'qosh_uzoq_orta', 'ogiz': 'ogiz', 'lab': 'lab_soyasi'}
def xy(v): return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))
def shot(k): return 1 if k <= 11 else 2 if k <= 13 else 3

def main():
    out = {}
    for k in range(1, 23):
        m = Q.olch(Q.L320('/home/claude/work/maqsad/k%02d.png' % k), k)
        bk = Q.olch(Q.L320('%s/kadrlar-misol/anime-%s/%03d.png' % (R, TEG, k - 1)), k)
        by = Q.olch(Q.rol_L('%s/kadrlar-qism/rol-yalang-%s/%03d.png' % (R, TEG, k - 1)), k)
        rk = Q.rol_niqob('%s/kadrlar-misol/rol-%s/%03d.png' % (R, TEG, k - 1))
        A = ANIQ[str(k - 1)]
        o = {}
        for q, qa in MOS.items():
            mv = xy(m.get(q))
            if mv is None: continue
            a = A.get(qa); x, y = int(round(a[0])), int(round(a[1]))
            atrof = rk[max(0, y - 1):y + 2, max(0, x - 1):x + 2]
            kor = bool((atrof == 'teri').sum() >= 5 and a[3])
            bv = xy(bk.get(q))
            if kor and bv is not None and not q.startswith('qosh') and abs(bv[0] - a[0]) < 6 and abs(bv[1] - a[1]) < 7:
                o[q] = {'misol': mv, 'biz': bv, 'manba': 'kiyingan'}
            else:
                s = KAL.get(q, {}); dx, dy = (s.get('dx') or 0, s.get('dy') or 0) if not q.startswith('qosh') else (0, 0)
                o[q] = {'misol': mv, 'biz': [round(a[0] + dx, 2), round(a[1] + dy, 2)], 'manba': 'aniq' + ('' if kor else ' (soch/kap ostida)')}
        for q in ('iyak_uchi', 'burun_uchi'):
            mv, bv = xy(m.get(q)), xy(by.get(q))
            if mv is not None and bv is not None: o[q] = {'misol': mv, 'biz': bv, 'manba': "yalang'och"}
        for q in ('jag', 'kontur'):
            mj, bj = m.get(q, {}), by.get(q, {})
            umum = sorted(set(mj) & set(bj))
            if umum: o[q] = {'misol': {i: mj[i] for i in umum}, 'biz': {i: bj[i] for i in umum}, 'farq': {i: bj[i] - mj[i] for i in umum},
                             'faqat_misol': sorted(set(mj) - set(bj)), 'faqat_biz': sorted(set(bj) - set(mj)), 'manba': "yalang'och"}
        for q, v in o.items():
            if q not in ('jag', 'kontur'): v['farq'] = [round(v['biz'][0] - v['misol'][0], 2), round(v['biz'][1] - v['misol'][1], 2)]
        out[k] = o
    json.dump(out, open('%s/test/qism/taqqos_%s.json' % (R, TEG), 'w'))
    # jadval: har shot, har qism -- o'rtacha farq (biz - misol), px 320x180
    for s in (1, 2, 3):
        ks = [k for k in out if shot(k) == s]
        print('== %d-shot (kadrlar %d-%d)' % (s, ks[0], ks[-1]))
        for q in ('koz_yaqin', 'koz_uzoq', 'qosh_yaqin', 'qosh_uzoq', 'burun_uchi', 'ogiz', 'lab', 'iyak_uchi'):
            v = [(k, out[k][q]) for k in ks if q in out[k]]
            if not v: print('  %-10s -- misolda topilmadi / ko\'rinmaydi' % q); continue
            f = np.array([e['farq'] for _, e in v]); man = sorted(set(e['manba'] for _, e in v))
            print('  %-10s %2d kadr | farq x %+5.1f  y %+5.1f  (|max| %4.1f) | %s' % (q, len(v), f[:, 0].mean(), f[:, 1].mean(), np.abs(f).max(), ', '.join(man)))
        for q in ('jag', 'kontur'):
            v = [(k, out[k][q]) for k in ks if q in out[k]]
            if not v: continue
            f = np.concatenate([list(e['farq'].values()) for _, e in v])
            print('  %-10s %2d kadr | %s farq o\'rtacha %+5.1f, |o\'rtacha| %4.1f, max %+5.1f / %+5.1f' % (q, len(v), 'tik (y)' if q == 'jag' else 'yotiq (x)',
                  f.mean(), np.abs(f).mean(), f.min(), f.max()))

main()
