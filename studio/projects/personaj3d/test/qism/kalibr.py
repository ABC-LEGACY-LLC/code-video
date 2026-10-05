"""QISM ASBOBI KALIBRI (10-o'tish): bizning renderimizda har qismning ANIQ o'rni ma'lum (3D dan, test/qism/nuqtalar.mjs) --
xuddi misolga qo'llanadigan kod (test/qism/qism_olch.py) bizning renderda shu qismni topadimi? Har qism: nechta kadrda
ko'rinadi (rol renderida nuqta pikseli teri va sirt kameraga qaragan), nechtasida topildi, topilgan - aniq farq
(o'rtacha dx, dy va eng katta |farq|). Doimiy siljish (masalan qorong'i bo'lak markazi -- kiprik chizig'i tufayli tepada)
ikkala tomonda bir xil -- taqqoslashda qisqaradi; katta va o'zgaruvchan farq -- asbob boshqa narsani topgan (tuzatiladi).
python3 test/qism/kalibr.py TEG   (test/qism/biz_TEG.json, kadrlar-misol/anime-TEG, kadrlar-misol/rol-TEG)"""
import sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q

R = '/home/claude/work/personaj3d'
TEG = sys.argv[1] if len(sys.argv) > 1 else 'dunyo9b'
ANIQ = json.load(open('%s/test/qism/biz_%s.json' % (R, TEG)))
MOS = {'koz_yaqin': 'koz_yaqin', 'koz_uzoq': 'koz_uzoq', 'qosh_yaqin': 'qosh_yaqin_orta', 'qosh_uzoq': 'qosh_uzoq_orta',
       'ogiz': 'ogiz', 'lab': 'lab_soyasi', 'burun_uchi': 'burun_uchi', 'iyak_uchi': 'iyak_uchi'}
ROL = {'teri': (255, 0, 0), 'boyin': (128, 0, 0), 'soch': (0, 255, 0), 'sochIch': (0, 128, 0), 'kap': (0, 0, 255), 'kapAstar': (0, 255, 255),
       'kapIch': (0, 0, 128), 'plash': (255, 0, 255), 'plashIch': (128, 0, 128), 'fon': (0, 0, 0)}
def rol(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), float)
    nom = list(ROL); RR = np.array([ROL[n] for n in nom], float)
    return np.array(nom)[((a[:, :, None, :] - RR[None, None]) ** 2).sum(-1).argmin(-1)]

def main():
    det = Q.papka_olch('%s/kadrlar-misol/anime-%s' % (R, TEG))
    natija = {}
    for q, qa in MOS.items():
        satr = []
        for k in range(1, 23):
            a = ANIQ[str(k - 1)].get(qa)
            if a is None: continue
            rr = rol('%s/kadrlar-misol/rol-%s/%03d.png' % (R, TEG, k - 1))
            x, y = int(round(a[0])), int(round(a[1]))
            atrof = rr[max(0, y - 1):y + 2, max(0, x - 1):x + 2]
            if q in ('burun_uchi', 'iyak_uchi'):        # silueta nuqtalari: atrofda teri bor va soch/kapyushon yo'q
                korinadi = bool((atrof == 'teri').sum() >= 1 and not np.isin(atrof, ['soch', 'sochIch', 'kap', 'kapAstar', 'kapIch', 'plash']).any())
            else:
                korinadi = bool((atrof == 'teri').sum() >= 5 and a[3])
            d = det[k].get(q)
            dd = None if d is None else ([d['x'], d['y']] if isinstance(d, dict) else d)
            satr.append((k, korinadi, dd, a[:2]))
        kor = [s for s in satr if s[1]]; top = [s for s in kor if s[2] is not None]
        err = np.array([[s[2][0] - s[3][0], s[2][1] - s[3][1]] for s in top]) if top else np.zeros((0, 2))
        yolg = [s for s in satr if not s[1] and s[2] is not None]          # ko'rinmaydi, lekin asbob nimanidir topdi
        natija[q] = {'korinadi': len(kor), 'topildi': len(top), 'dx': round(float(err[:, 0].mean()), 2) if len(err) else None,
                     'dy': round(float(err[:, 1].mean()), 2) if len(err) else None, 'max': round(float(np.abs(err).max()), 2) if len(err) else None,
                     'kadr': {s[0]: [s[1], s[2], [round(s[3][0], 2), round(s[3][1], 2)]] for s in satr}, 'yolgon_kadr': [s[0] for s in yolg]}
        print('%-11s ko\'rinadi %2d, topildi %2d | o\'rtacha farq (%s, %s) | eng katta |farq| %s | ko\'rinmaydigan kadrda topgan: %s' % (
            q, len(kor), len(top), natija[q]['dx'], natija[q]['dy'], natija[q]['max'], yolg and [s[0] for s in yolg]))
        for s in top:
            e = (s[2][0] - s[3][0], s[2][1] - s[3][1])
            if max(abs(e[0]), abs(e[1])) > 3: print('     k%02d topilgan %s aniq %s farq (%.1f, %.1f)' % (s[0], s[2], [round(v, 1) for v in s[3]], *e))
    json.dump(natija, open('%s/test/qism/kalibr_%s.json' % (R, TEG), 'w'))

main()
