# Build strips/sheets from rendered frames. usage in code below.
import sys, json
from PIL import Image, ImageDraw, ImageFont
def label(im, text):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 * len(text) + 8, 16], fill=(0, 0, 0)); d.text((4, 2), text, fill=(255, 255, 0)); return im
def strip(frames, box, scale, out, src='scan0/full', cols=None, lab=lambda i: f'f{i:02d} t={i/24:.2f}'):
    x0, y0, x1, y1 = box; w, h = int((x1 - x0) * scale), int((y1 - y0) * scale)
    cols = cols or len(frames); rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + 4), rows * (h + 4)), (40, 40, 40))
    for k, i in enumerate(frames):
        im = Image.open(f'{src}/f{i:03d}.png').convert('RGB').crop(box).resize((w, h), Image.LANCZOS)
        sheet.paste(label(im, lab(i)), ((k % cols) * (w + 4), (k // cols) * (h + 4)))
    sheet.save(out); print(out, sheet.size)
if __name__ == '__main__':
    D = sys.argv[1] if len(sys.argv) > 1 else 'scan0'
    S = f'{D}/full'
    # boy through the throw (every frame 12..27), delivered resolution
    strip(list(range(12, 28)), (690, 230, 1030, 720), 0.62, f'{D}/strip_throw.png', S, cols=8)
    # boy through the hold, every 6th frame
    strip(list(range(24, 96, 6)), (690, 230, 1030, 720), 0.62, f'{D}/strip_hold.png', S, cols=6)
    # head/neck joint, x2
    strip([0, 14, 18, 20, 22, 30, 60, 95], (800, 330, 1000, 520), 1.0, f'{D}/joint_head.png', S, cols=4)
    # release: bird leaving the hands, x2
    strip(list(range(18, 30)), (700, 200, 900, 380), 1.2, f'{D}/strip_release.png', S, cols=6)
