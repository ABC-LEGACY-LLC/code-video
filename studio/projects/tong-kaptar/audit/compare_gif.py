# Side-by-side comparison frames: python3 compare_gif.py <prevDir> <newDir> <x0,y0,x1,y1> <scale> <outDir> <labelL> <labelR> [note]
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont
prev, new, box, sc, out, la, lb = sys.argv[1:8]
note = sys.argv[8] if len(sys.argv) > 8 else ''
x0, y0, x1, y1 = [int(v) for v in box.split(',')]
sc = float(sc)
os.makedirs(out, exist_ok=True)
w, h = int((x1 - x0) * sc), int((y1 - y0) * sc)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception:
    font = ImageFont.load_default()
n = len(glob.glob(f'{prev}/f*.png'))
for f in range(n):
    A = Image.open(f'{prev}/f{f:03d}.png').convert('RGB').crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS)
    B = Image.open(f'{new}/f{f:03d}.png').convert('RGB').crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS)
    S = Image.new('RGB', (2 * w + 6, h + 24), (18, 16, 26))
    S.paste(A, (0, 24)); S.paste(B, (w + 6, 24))
    d = ImageDraw.Draw(S)
    d.text((8, 4), la, fill=(235, 225, 245), font=font)
    d.text((w + 14, 4), lb, fill=(255, 214, 140), font=font)
    tag = (f'f{f:03d}' if n > 99 else f'f{f:02d}') + (f' · {note}' if note else '')
    tw = d.textlength(tag, font=font)
    d.text((2 * w + 6 - tw - 8, 4), tag, fill=(170, 160, 190), font=font)
    S.save(f'{out}/f{f:03d}.png')
print(out, S.size)
