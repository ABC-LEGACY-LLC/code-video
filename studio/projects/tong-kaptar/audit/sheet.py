# Contact sheet of crops: python3 sheet.py <framesDir> <frames 0,4,8> <x0,y0,x1,y1> <scale> <out.png> [cols]
# Several dirs can be compared row by row: framesDir = dirA+dirB (each row one dir).
import sys
from PIL import Image, ImageDraw
dirs = sys.argv[1].split('+')
frames = [int(f) for f in sys.argv[2].split(',')]
x0, y0, x1, y1 = [int(v) for v in sys.argv[3].split(',')]
sc = float(sys.argv[4])
out = sys.argv[5]
cols = int(sys.argv[6]) if len(sys.argv) > 6 else len(frames)
w, h = int((x1 - x0) * sc), int((y1 - y0) * sc)
rows_per_dir = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 4), len(dirs) * rows_per_dir * (h + 18)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for di, dd in enumerate(dirs):
    for k, f in enumerate(frames):
        im = Image.open(f'{dd}/f{f:03d}.png').convert('RGB').crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS if sc < 1 else Image.NEAREST)
        r, c = divmod(k, cols)
        X, Y = c * (w + 4), (di * rows_per_dir + r) * (h + 18)
        sheet.paste(im, (X, Y + 16))
        d.text((X + 3, Y + 2), f'{dd.split("/")[-2] if dd.endswith("/full") else dd.split("/")[-1]} f{f}', fill=(255, 255, 0))
sheet.save(out)
print(out, sheet.size)
