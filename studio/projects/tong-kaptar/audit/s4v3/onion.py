# onion skin of the pole over frames: python3 onion.py probe.json frame.png out.png [f0 f1]
import json, sys
from PIL import Image, ImageDraw
D = json.load(open(sys.argv[1])); im = Image.open(sys.argv[2]).convert('RGB'); out = sys.argv[3]
f0 = int(sys.argv[4]) if len(sys.argv) > 4 else 0; f1 = int(sys.argv[5]) if len(sys.argv) > 5 else 95
d = ImageDraw.Draw(im)
pts = [r for r in D if f0 <= r['i'] <= f1]
for k, r in enumerate(pts):
    v = r['v']; c = int(255 * k / max(1, len(pts) - 1))
    col = (255, c, 0)
    d.line([tuple(v['butt']), tuple(v['tip'])], fill=col + (), width=1)
for key, col in [('tip', (0, 255, 255)), ('hL', (255, 0, 255)), ('hR', (0, 255, 0)), ('head', (255, 255, 255))]:
    path = [tuple(r['v'][key]) for r in pts]
    d.line(path, fill=col, width=2)
    for k, p in enumerate(path):
        if (pts[k]['i']) % 6 == 0: d.ellipse([p[0]-3, p[1]-3, p[0]+3, p[1]+3], outline=col); d.text((p[0]+4, p[1]-10), str(pts[k]['i']), fill=col)
im.save(out); print(out)
