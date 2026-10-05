# Crops centred on a probed joint per frame: python3 handsheet.py <framesDir[+dir2]> <probes.json> <key LW|RW> <frames> <half> <scale> <out> [dx,dy]
import sys, json
from PIL import Image, ImageDraw
dirs = sys.argv[1].split('+')
pr = {p['i']: p for p in json.load(open(sys.argv[2]))}
key = sys.argv[3]
frames = [int(f) for f in sys.argv[4].split(',')]
half = int(sys.argv[5]); sc = float(sys.argv[6]); out = sys.argv[7]
dx, dy = (int(v) for v in sys.argv[8].split(',')) if len(sys.argv) > 8 else (0, 0)
w = int(2 * half * sc)
sheet = Image.new('RGB', (len(frames) * (w + 4), len(dirs) * (w + 18)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for di, dd in enumerate(dirs):
    for k, f in enumerate(frames):
        c = pr[f][key]
        cx, cy = int(c['x']) + dx, int(c['y']) + dy
        im = Image.open(f'{dd}/f{f:03d}.png').convert('RGB').crop((cx - half, cy - half, cx + half, cy + half)).resize((w, w), Image.NEAREST)
        X, Y = k * (w + 4), di * (w + 18)
        sheet.paste(im, (X, Y + 16))
        d.text((X + 3, Y + 2), f'{dd.split("/")[-2] if dd.endswith("/full") else dd.split("/")[-1]} f{f} {key}', fill=(255, 255, 0))
sheet.save(out)
print(out, sheet.size)
