"""HUMAN MARKS -- difference sheet (pass 11): the sample points the person marked (orange circle) and our model in the same
frame (green X), each pair joined by a line; below, the eye -> chin length in the sample and in ours.
  python3 test/parts/human/diff_sheet.py INFO.json MARKS.json OUT.png        (PRIVATE: sample frames)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import json, math, sys
from PIL import Image, ImageDraw
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
from analysis import point
M = json.load(open(sys.argv[1])); B = json.load(open(sys.argv[2]))['marks']
SC = 5; A, G, L = (255, 174, 52), (120, 230, 130), (235, 235, 235)
QS = ('eye_near', 'eye_far', 'nose', 'mouth', 'chin')
ims = []
for f in sorted(M['frames'], key=lambda f: f['k']):
    if f['id'] == 'R13': continue                      # the same drawing as R12
    m, bz = B[f['id']], f['ours']
    pts = [p for q in QS for p in (point(q, m.get(q)), bz.get(q)) if p]
    x0 = int(min(p[0] for p in pts)) - 12; x1 = int(max(p[0] for p in pts)) + 13
    y0 = int(min(p[1] for p in pts)) - 12; y1 = int(max(p[1] for p in pts)) + 13
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(320, x1), min(180, y1)
    a = np.asarray(Image.open(f"{SAMPLE_DIR}/k{f['k']:02d}.png").convert('L')).astype(float)[y0:y1, x0:x1]
    lo, hi = np.percentile(a, 1), np.percentile(a, 99.5)
    a = (np.clip((a - lo) / (hi - lo + 1e-6), 0, 1) ** 0.72 * 200 + 20)
    im = Image.fromarray(a.astype(np.uint8)).resize(((x1 - x0) * SC, (y1 - y0) * SC), Image.NEAREST).convert('RGB')
    dr = ImageDraw.Draw(im); P = lambda x, y: ((x - x0 + 0.5) * SC, (y - y0 + 0.5) * SC)
    for q in QS:
        h, b = point(q, m.get(q)), bz.get(q)
        if h and b: dr.line((*P(*h), *P(*b)), fill=(250, 250, 250), width=2)
        if h: u, v = P(*h); dr.ellipse((u - 7, v - 7, u + 7, v + 7), outline=A, width=3)
        if b: u, v = P(*b); dr.line((u - 6, v - 6, u + 6, v + 6), fill=G, width=3); dr.line((u - 6, v + 6, u + 6, v - 6), fill=G, width=3)
    e, c = point('eye_near', m.get('eye_near')), point('chin', m.get('chin'))
    t = f"{f['id']} (shot {'1' if f['k'] <= 11 else '2' if f['k'] <= 13 else '3'})"
    if e and c:
        t += f"  eye->chin: sample {math.dist(e, c):.0f}, ours {math.dist(bz['eye_near'], bz['chin']):.0f} px"
    im2 = Image.new('RGB', (max(im.width, 330), im.height + 22), (14, 14, 18)); im2.paste(im, (0, 22))
    ImageDraw.Draw(im2).text((4, 5), t, fill=L); ims.append(im2)
W = sum(i.width for i in ims[:4]) + 18; H1 = max(i.height for i in ims[:4]); H2 = max(i.height for i in ims[4:])
sheet = Image.new('RGB', (max(W, sum(i.width for i in ims[4:]) + 18), H1 + H2 + 40), (14, 14, 18))
x = 0
for i in ims[:4]: sheet.paste(i, (x, 0)); x += i.width + 6
x = 0
for i in ims[4:]: sheet.paste(i, (x, H1 + 6)); x += i.width + 6
ImageDraw.Draw(sheet).text((6, H1 + H2 + 16), "orange disc: sample (marked by Alonur)   green X: our model in this frame   line: difference.  Parts: near eye, far eye, nose tip, mouth middle, chin", fill=L)
sheet.save(sys.argv[3]); print(sheet.size)
