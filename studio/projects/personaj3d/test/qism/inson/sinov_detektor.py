"""DETEKTOR SINOVI (11-o'tish): misol detektori (test/qism/qism_olch.py) Alonur belgilariga qarshi -- doimiy test to'plami.
Detektordagi har o'zgarishdan keyin: python3 test/qism/inson/sinov_detektor.py [BELGILAR.json] [--jadval]
Solishtirish (320x180, piksel markazi = butun son):
  iyak, burun, ko'zlar -- nuqta; og'iz -- detektor markazi va odam chizig'ining o'rtasi; jag' -- odam BOSGAN nuqtalarda
  detektor profilidan y farqi (R22 jag'i soch ostida -- Alonur: taxminiy, hisobga olinmaydi, faqat ko'rsatiladi).
Chegaralar: qo'l shovqini ~0.45 px (R12 = R13 takrori); ta'rif farqi uchun nuqtaga 2.5 px, iyakda x ga 3.5 px (tekis pastki
chekka bo'ylab ta'rif noaniq), jag'da o'rtacha |dy| 2 px. Qosh -- faqat ko'rsatiladi (odam soch ostidan davom ettiradi).
MAXFIY: belgilar misoldan olingan."""
import json, math, sys, os
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qism_olch as Q
from tahlil import nuqta, prof_y

BEL = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.json') else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'belgilar_alonur_1.json')
B = json.load(open(BEL))['marks']
TAXMINIY_JAG = {'R22'}
MALUM = {('R03', 'ogiz'): "1-shot og'iz: detektor faqat qora qismini ko'radi, och davomi (L 54-57, yuz 59) odamga ko'rinadi",
         ('R10', 'ogiz'): "1-shot og'iz: xuddi shunday, +2.5 px o'ngda -- nishon.py da tuzatiladi"}
CH = {'nuqta': 2.5, 'iyak_x': 3.5, 'iyak_y': 2.5, 'jag': 2.0}


def xy(v):
    return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))


def sinov(olch=Q.olch):
    qator, xato = [], []
    for fid in sorted(B, key=lambda s: int(s[1:])):
        k = int(fid[1:]); m = B[fid]
        o = olch(Q.L320('/home/claude/work/maqsad/k%02d.png' % k), k)
        for q, dq in (('iyak', 'iyak_uchi'), ('burun', 'burun_uchi'), ('koz_yaqin', 'koz_yaqin'), ('koz_uzoq', 'koz_uzoq'),
                      ('ogiz', 'ogiz'), ('qosh_yaqin', 'qosh_yaqin')):
            h, d = nuqta(q, m.get(q)), xy(o.get(dq))
            if h is None and d is None: continue
            if h is None: qator.append((fid, q, None, d, 'odam: ko\'rinmaydi / belgilanmagan', q != 'qosh_yaqin')); continue
            if d is None: qator.append((fid, q, h, None, 'detektor topmagan', False)); continue
            dx, dy = h[0] - d[0], h[1] - d[1]
            if q == 'iyak': ok = abs(dx) <= CH['iyak_x'] and abs(dy) <= CH['iyak_y']
            elif q == 'qosh_yaqin': ok = True
            else: ok = math.hypot(dx, dy) <= CH['nuqta']
            qator.append((fid, q, h, d, f'({dx:+5.1f},{dy:+5.1f}) {math.hypot(dx, dy):4.1f}', ok))
        jv = (m.get('jag') or {}).get('pts')
        if jv and o.get('jag'):
            prof = {str(x): y for x, y in o['jag'].items()}
            d = [y - prof_y(prof, x) for x, y in jv if prof_y(prof, x) is not None]
            if len(d) >= 2:
                a = sum(map(abs, d)) / len(d)
                ok = fid in TAXMINIY_JAG or a <= CH['jag']
                qator.append((fid, 'jag', None, None, f'|dy| {a:4.1f} ({len(d)} nuqta){" taxminiy" if fid in TAXMINIY_JAG else ""}', ok))
            else:
                qator.append((fid, 'jag', None, None, f'umumiy ustun {len(d)} ta', False))
    for r in qator:
        if not r[5] and r[3] is not None and (r[0], r[1]) not in MALUM: xato.append(r)      # XATO -- detektor topgan, lekin odamnikidan uzoq
    return qator, xato                                        # topmagan -- qamrov (odam belgisi nishon bo'ladi), xato emas


if __name__ == '__main__':
    qator, xato = sinov()
    topmadi = [r for r in qator if r[3] is None and r[2] is not None]
    jag_x = [r for r in qator if r[1] == 'jag' and not r[5]]
    for fid, q, h, d, s, ok in qator:
        holat = 'ok ' if ok else ('--  ' if d is None and q != 'jag' else "ma'lum" if (fid, q) in MALUM else 'XATO')
        print(f"{fid} {q:10s} {holat} {s}   odam {None if h is None else [round(v, 1) for v in h]}  detektor {None if d is None else [round(v, 1) for v in d]}")
    print(f"== XATO (topgan, lekin uzoq): {len(xato) + len(jag_x)} -- " + ', '.join(f'{r[0]} {r[1]}' for r in xato + jag_x))
    print(f"== topmagan (odam belgisi nishon bo'ladi): {len(topmadi)} -- " + ', '.join(f'{r[0]} {r[1]}' for r in topmadi))
