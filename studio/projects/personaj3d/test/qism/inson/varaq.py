"""INSON BELGILARI -- tekshiruv varag'i (11-o'tish).
  python3 test/qism/inson/varaq.py MALUMOT.json BELGILAR.json CHIQ.png [--biz]
Har misol kadri kattalashtirilgan (kontrast), ustida: to'q sariq -- odam belgilari, ko'k -- Claude detektori (XOM, kalibrsiz:
detektor nimaga tekkanini ko'rish uchun), --biz bilan yashil -- bizning model shu kadrda. Chap-tepada 10 px to'r.
MAXFIY: misol kadrlari -- varaq repoga kirmaydi."""
import json, sys
from PIL import Image, ImageDraw
import numpy as np

M = json.load(open(sys.argv[1])); B = json.load(open(sys.argv[2]))['marks']; CHIQ = sys.argv[3]
BIZ = '--biz' in sys.argv
mq = json.load(open('/home/claude/work/personaj3d/test/qism/misol_qism.json'))
SC = 5
A, C, G = (255, 174, 52), (70, 200, 240), (120, 230, 130)


def kadr(f):
    x0, y0, x1, y1 = f['box']
    a = np.asarray(Image.open(f"/home/claude/work/maqsad/k{f['k']:02d}.png").convert('L')).astype(float)[y0:y1, x0:x1]
    lo, hi = np.percentile(a, 1), np.percentile(a, 99.5)
    a = np.clip((a - lo) / (hi - lo + 1e-6), 0, 1) ** 0.72 * 255
    im = Image.fromarray(a.astype(np.uint8)).resize(((x1 - x0) * SC, (y1 - y0) * SC), Image.NEAREST).convert('RGB')
    dr = ImageDraw.Draw(im)
    P = lambda x, y: ((x - x0 + 0.5) * SC, (y - y0 + 0.5) * SC)

    def X(x, y, c, r=6):
        u, v = P(x, y); dr.line((u - r, v - r, u + r, v + r), fill=c, width=2); dr.line((u - r, v + r, u + r, v - r), fill=c, width=2)

    def O(x, y, c, r=6):
        u, v = P(x, y); dr.ellipse((u - r, v - r, u + r, v + r), outline=c, width=2)

    for gx in range((x0 // 10 + 1) * 10, x1, 10):
        u = (gx - x0 + 0.5) * SC; dr.line((u, 0, u, 5), fill=(210, 210, 210)); dr.text((u + 2, 6), str(gx), fill=(235, 235, 235))
    for gy in range((y0 // 10 + 1) * 10, y1, 10):
        v = (gy - y0 + 0.5) * SC; dr.line((0, v, 5, v), fill=(210, 210, 210)); dr.text((7, v - 6), str(gy), fill=(235, 235, 235))
    r = mq[str(f['k'])]
    if r.get('iyak_uchi'): X(*r['iyak_uchi'], C)
    if r.get('burun_uchi'): X(*r['burun_uchi'], C)
    for q in ('koz_yaqin', 'koz_uzoq', 'ogiz', 'qosh_yaqin', 'qosh_uzoq'):
        v = r.get(q)
        if v and isinstance(v, dict):
            X(v['x'], v['y'], C, 4)
            u0, v0 = P(v['chap'] - 0.5, v['tepa'] - 0.5); u1, v1 = P(v['ong'] + 0.5, v['past'] + 0.5)
            dr.rectangle((u0, v0, u1, v1), outline=C)
    for xs, y in (r.get('jag') or {}).items():
        u, v = P(int(xs), y); dr.rectangle((u - 1, v - 1, u + 1, v + 1), fill=C)
    if BIZ:
        for q, v in f['biz'].items():
            if q == 'jag':
                for xs, y in v.items():
                    u, w = P(int(xs), y); dr.rectangle((u - 1, w - 1, u + 1, w + 1), fill=G)
            else: X(v[0], v[1], G, 5)
    m = B.get(f['id'], {})
    for q, v in m.items():
        if v.get('yoq'): continue
        if 'x' in v: O(v['x'], v['y'], A)
        else:
            pts = [P(x, y) for x, y in v['pts']]
            dr.line(pts, fill=A if q != 'soch' else (255, 120, 200), width=2)
            for p in pts: dr.ellipse((p[0] - 2.5, p[1] - 2.5, p[0] + 2.5, p[1] + 2.5), fill=A if q != 'soch' else (255, 120, 200))
    dr.rectangle((0, im.height - 16, im.width, im.height), fill=(0, 0, 0))
    dr.text((4, im.height - 14), f"{f['id']}  to'q sariq: Alonur, pushti: soch cheti, ko'k: Claude (xom){', yashil: biz' if BIZ else ''}", fill=(255, 220, 120))
    return im


ims = [kadr(f) for f in sorted(M['kadrlar'], key=lambda f: f['k'])]
cols = 4; W = max(i.width for i in ims); H = max(i.height for i in ims)
sheet = Image.new('RGB', (cols * W + (cols - 1) * 6, 2 * H + 6), (18, 18, 22))
for j, im in enumerate(ims):
    sheet.paste(im, ((j % cols) * (W + 6), (j // cols) * (H + 6)))
sheet.save(CHIQ); print(sheet.size)
