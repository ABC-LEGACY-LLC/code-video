"""INSON BELGILARI -- farq varag'i (11-o'tish): odam belgilagan misol nuqtalari (to'q sariq doira) va bizning model shu
kadrda (yashil X), har juft chiziq bilan ulangan; pastda ko'z -> iyak uzunligi misolda va bizda.
  python3 test/qism/inson/farq_varaq.py MALUMOT.json BELGILAR.json CHIQ.png        (MAXFIY: misol kadrlari)"""
import json, math, sys
from PIL import Image, ImageDraw
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
from tahlil import nuqta
M = json.load(open(sys.argv[1])); B = json.load(open(sys.argv[2]))['marks']
SC = 5; A, G, L = (255, 174, 52), (120, 230, 130), (235, 235, 235)
QS = ('koz_yaqin', 'koz_uzoq', 'burun', 'ogiz', 'iyak')
ims = []
for f in sorted(M['kadrlar'], key=lambda f: f['k']):
    if f['id'] == 'R13': continue                      # R12 bilan bir xil chizma
    m, bz = B[f['id']], f['biz']
    pts = [p for q in QS for p in (nuqta(q, m.get(q)), bz.get(q)) if p]
    x0 = int(min(p[0] for p in pts)) - 12; x1 = int(max(p[0] for p in pts)) + 13
    y0 = int(min(p[1] for p in pts)) - 12; y1 = int(max(p[1] for p in pts)) + 13
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(320, x1), min(180, y1)
    a = np.asarray(Image.open(f"/home/claude/work/maqsad/k{f['k']:02d}.png").convert('L')).astype(float)[y0:y1, x0:x1]
    lo, hi = np.percentile(a, 1), np.percentile(a, 99.5)
    a = (np.clip((a - lo) / (hi - lo + 1e-6), 0, 1) ** 0.72 * 200 + 20)
    im = Image.fromarray(a.astype(np.uint8)).resize(((x1 - x0) * SC, (y1 - y0) * SC), Image.NEAREST).convert('RGB')
    dr = ImageDraw.Draw(im); P = lambda x, y: ((x - x0 + 0.5) * SC, (y - y0 + 0.5) * SC)
    for q in QS:
        h, b = nuqta(q, m.get(q)), bz.get(q)
        if h and b: dr.line((*P(*h), *P(*b)), fill=(250, 250, 250), width=2)
        if h: u, v = P(*h); dr.ellipse((u - 7, v - 7, u + 7, v + 7), outline=A, width=3)
        if b: u, v = P(*b); dr.line((u - 6, v - 6, u + 6, v + 6), fill=G, width=3); dr.line((u - 6, v + 6, u + 6, v - 6), fill=G, width=3)
    e, c = nuqta('koz_yaqin', m.get('koz_yaqin')), nuqta('iyak', m.get('iyak'))
    t = f"{f['id']} ({'1' if f['k'] <= 11 else '2' if f['k'] <= 13 else '3'}-shot)"
    if e and c:
        t += f"  ko'z->iyak: misol {math.dist(e, c):.0f}, biz {math.dist(bz['koz_yaqin'], bz['iyak']):.0f} px"
    im2 = Image.new('RGB', (max(im.width, 330), im.height + 22), (14, 14, 18)); im2.paste(im, (0, 22))
    ImageDraw.Draw(im2).text((4, 5), t, fill=L); ims.append(im2)
W = sum(i.width for i in ims[:4]) + 18; H1 = max(i.height for i in ims[:4]); H2 = max(i.height for i in ims[4:])
sheet = Image.new('RGB', (max(W, sum(i.width for i in ims[4:]) + 18), H1 + H2 + 40), (14, 14, 18))
x = 0
for i in ims[:4]: sheet.paste(i, (x, 0)); x += i.width + 6
x = 0
for i in ims[4:]: sheet.paste(i, (x, H1 + 6)); x += i.width + 6
ImageDraw.Draw(sheet).text((6, H1 + H2 + 16), "to'q sariq doira: misol (Alonur belgilagan)   yashil X: bizning model shu kadrda   chiziq: farq.  Qismlar: yaqin ko'z, uzoq ko'z, burun uchi, og'iz o'rtasi, iyak", fill=L)
sheet.save(sys.argv[3]); print(sheet.size)
