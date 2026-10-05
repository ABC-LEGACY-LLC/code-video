"""PART CHECK SHEET (pass 10): on every frame, over the sample (or our render), the parts the tool found (filled
dot), the contour and jaw traces (small marks) and our exact points from 3D (hollow circle) -- to check by eye what the
tool found (skill: "see on a sheet what the measurement hit").
python3 test/parts/check_sheet.py SOURCE TAG OUT.png   (SOURCE: sample | folder; TAG: our exact points test/parts/ours_TAG.json)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q

R = (P3D_DIR)
SOURCE, TAG, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
FRAME = [int(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else list(range(1, 23))
file = (lambda k: (SAMPLE_DIR + '/k%02d.png') % k) if SOURCE == 'sample' else (lambda k: '%s/%03d.png' % (SOURCE, k - 1))
EXACT = json.load(open('%s/test/parts/ours_%s.json' % (R, TAG)))
COLOUR = {'eye': (0, 255, 255), 'brow': (255, 255, 0), 'nose': (0, 255, 0), 'mouth': (255, 0, 255), 'lip': (255, 150, 255), 'chin': (255, 50, 50), 'jaw': (255, 150, 0), 'skull': (255, 255, 255)}
SECTION = {'a': (70, 20, 150, 120), 'b': (80, 22, 160, 122), 'c': (80, 24, 160, 124), 'd': (110, 50, 180, 130), 'e': (120, 90, 200, 170)}
SC = 5
F12 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)

def tile(k):
    L = Q.L320(file(k)); o = Q.measure(L, k); bx = SECTION[o['group']]
    a = np.clip((L / 255) ** 0.6 * 255, 0, 255).astype(np.uint8)
    t = Image.fromarray(a).convert('RGB').crop(bx); t = t.resize((t.width * SC, t.height * SC), Image.NEAREST)
    d = ImageDraw.Draw(t)
    P = lambda x, y: ((x - bx[0] + 0.5) * SC, (y - bx[1] + 0.5) * SC)
    for y, x in o['contour'].items(): X, Y = P(x, y); d.line([X - 2, Y, X + 2, Y], fill=(80, 200, 255))
    for x, y in o['jaw'].items(): X, Y = P(x, y); d.line([X, Y - 2, X, Y + 2], fill=(255, 150, 0))
    for n, v in EXACT[str(k - 1)].items():                  # our exact points -- hollow circle
        X, Y = P(v[0], v[1]); d.ellipse([X - 4, Y - 4, X + 4, Y + 4], outline=COLOUR[n.split('_')[0]], width=1)
    for q in ('eye_near', 'eye_far', 'brow_near', 'brow_far', 'mouth', 'lip', 'nose_tip', 'chin_tip'):
        v = o.get(q)
        if v is None: continue
        x, y = (v['x'], v['y']) if isinstance(v, dict) else v
        X, Y = P(x, y); d.ellipse([X - 4, Y - 4, X + 4, Y + 4], fill=COLOUR[q.split('_')[0]], outline=(0, 0, 0))
        if isinstance(v, dict):
            d.rectangle([P(v['left'] - 0.5, v['top'] - 0.5), P(v['right'] + 0.5, v['low'] + 0.5)], outline=COLOUR[q.split('_')[0]])
    for x in range(bx[0], bx[2]):
        if x % 10 == 0: d.line([((x - bx[0]) * SC, 0), ((x - bx[0]) * SC, 5)], fill=(200, 200, 0)); d.text(((x - bx[0]) * SC + 2, 6), str(x), fill=(200, 200, 0), font=F12)
    for y in range(bx[1], bx[3]):
        if y % 10 == 0: d.line([(0, (y - bx[1]) * SC), (5, (y - bx[1]) * SC)], fill=(200, 200, 0)); d.text((7, (y - bx[1]) * SC - 6), str(y), fill=(200, 200, 0), font=F12)
    d.text((t.width - 60, t.height - 16), 'k%02d' % k, fill=(255, 120, 120), font=F12)
    return t

ts = [tile(k) for k in FRAME]
nc = 3; W = max(t.width for t in ts); H = max(t.height for t in ts)
c = Image.new('RGB', (nc * (W + 6), ((len(ts) + nc - 1) // nc) * (H + 6)), (10, 10, 14))
for i, t in enumerate(ts): c.paste(t, ((i % nc) * (W + 6), (i // nc) * (H + 6)))
c.save(OUT); print(OUT, c.size)
