"""QISM TEKSHIRUV VARAG'I (10-o'tish): har kadrda misol (yoki bizning render) ustiga asbob topgan qismlar (to'ldirilgan
nuqta), kontur va jag' izi (kichik belgilar) va bizning 3D dagi aniq nuqtalarimiz (bo'sh doira) -- asbob nimani topganini
ko'z bilan tekshirish uchun (skill: "o'lchov nimaga tekkanini varaqda ko'r").
python3 test/qism/tekshir_varaq.py MANBA TEG CHIQ.png   (MANBA: misol | papka; TEG: bizning aniq nuqtalar test/qism/biz_TEG.json)"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as Q

R = '/home/claude/work/personaj3d'
MANBA, TEG, CHIQ = sys.argv[1], sys.argv[2], sys.argv[3]
KADR = [int(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else list(range(1, 23))
fayl = (lambda k: '/home/claude/work/maqsad/k%02d.png' % k) if MANBA == 'misol' else (lambda k: '%s/%03d.png' % (MANBA, k - 1))
ANIQ = json.load(open('%s/test/qism/biz_%s.json' % (R, TEG)))
RANG = {'koz': (0, 255, 255), 'qosh': (255, 255, 0), 'burun': (0, 255, 0), 'ogiz': (255, 0, 255), 'lab': (255, 150, 255), 'iyak': (255, 50, 50), 'jag': (255, 150, 0), 'kalla': (255, 255, 255)}
KESIM = {'a': (70, 20, 150, 120), 'b': (80, 22, 160, 122), 'c': (80, 24, 160, 124), 'd': (110, 50, 180, 130), 'e': (120, 90, 200, 170)}
SC = 5
F12 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)

def tile(k):
    L = Q.L320(fayl(k)); o = Q.olch(L, k); bx = KESIM[o['guruh']]
    a = np.clip((L / 255) ** 0.6 * 255, 0, 255).astype(np.uint8)
    t = Image.fromarray(a).convert('RGB').crop(bx); t = t.resize((t.width * SC, t.height * SC), Image.NEAREST)
    d = ImageDraw.Draw(t)
    P = lambda x, y: ((x - bx[0] + 0.5) * SC, (y - bx[1] + 0.5) * SC)
    for y, x in o['kontur'].items(): X, Y = P(x, y); d.line([X - 2, Y, X + 2, Y], fill=(80, 200, 255))
    for x, y in o['jag'].items(): X, Y = P(x, y); d.line([X, Y - 2, X, Y + 2], fill=(255, 150, 0))
    for n, v in ANIQ[str(k - 1)].items():                  # bizning aniq nuqtalar -- bo'sh doira
        X, Y = P(v[0], v[1]); d.ellipse([X - 4, Y - 4, X + 4, Y + 4], outline=RANG[n.split('_')[0]], width=1)
    for q in ('koz_yaqin', 'koz_uzoq', 'qosh_yaqin', 'qosh_uzoq', 'ogiz', 'lab', 'burun_uchi', 'iyak_uchi'):
        v = o.get(q)
        if v is None: continue
        x, y = (v['x'], v['y']) if isinstance(v, dict) else v
        X, Y = P(x, y); d.ellipse([X - 4, Y - 4, X + 4, Y + 4], fill=RANG[q.split('_')[0]], outline=(0, 0, 0))
        if isinstance(v, dict):
            d.rectangle([P(v['chap'] - 0.5, v['tepa'] - 0.5), P(v['ong'] + 0.5, v['past'] + 0.5)], outline=RANG[q.split('_')[0]])
    for x in range(bx[0], bx[2]):
        if x % 10 == 0: d.line([((x - bx[0]) * SC, 0), ((x - bx[0]) * SC, 5)], fill=(200, 200, 0)); d.text(((x - bx[0]) * SC + 2, 6), str(x), fill=(200, 200, 0), font=F12)
    for y in range(bx[1], bx[3]):
        if y % 10 == 0: d.line([(0, (y - bx[1]) * SC), (5, (y - bx[1]) * SC)], fill=(200, 200, 0)); d.text((7, (y - bx[1]) * SC - 6), str(y), fill=(200, 200, 0), font=F12)
    d.text((t.width - 60, t.height - 16), 'k%02d' % k, fill=(255, 120, 120), font=F12)
    return t

ts = [tile(k) for k in KADR]
nc = 3; W = max(t.width for t in ts); H = max(t.height for t in ts)
c = Image.new('RGB', (nc * (W + 6), ((len(ts) + nc - 1) // nc) * (H + 6)), (10, 10, 14))
for i, t in enumerate(ts): c.paste(t, ((i % nc) * (W + 6), (i // nc) * (H + 6)))
c.save(CHIQ); print(CHIQ, c.size)
