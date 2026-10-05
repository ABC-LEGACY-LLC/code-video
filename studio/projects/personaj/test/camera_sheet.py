"""Pass 12: the CAMERA AND HOOD sheet. Each shot: scheme (from above / from the side) | sample
(measured marks) | ours (hood differences). The placement in the scheme is a reading; its
evidence is on the sample panel as numbers (test/camera.py, test/focus.py, the L tables)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W = (PERSONAJ_DIR)
OUT = (PERSONAJ_DIR + '/camera-hood.png')
F = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', n)
FB = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', n)
PW, PH = 560, 315          # 320x180 * 1.75
SX = PW / 320
SW = 330
YELLOW, BLUE, RED, GREEN, WHITE, GREY = (255, 214, 102), (110, 210, 255), (255, 110, 120), (120, 235, 140), (235, 235, 245), (150, 150, 170)


def gam(p, k):
    a = np.asarray(Image.open(p % k).convert('RGB').resize((PW, PH), Image.LANCZOS)).astype(float)
    return Image.fromarray(np.clip(255 * np.power(a / 255, 0.6), 0, 255).astype('uint8'))


def arrow(d, a, b, colour, w=3, tip=12):
    d.line([a, b], fill=colour, width=w)
    ax, ay = a; bx, by = b; v = np.array([bx - ax, by - ay], float); v /= np.linalg.norm(v) + 1e-9
    n = np.array([-v[1], v[0]])
    p1 = np.array(b) - v * tip + n * tip * 0.5; p2 = np.array(b) - v * tip - n * tip * 0.5
    d.polygon([tuple(b), tuple(p1), tuple(p2)], fill=colour)


def label(d, xy, t, colour=WHITE, f=None, background=(10, 10, 20)):
    f = f or F(15)
    x, y = xy; bb = d.textbbox((x, y), t, font=f)
    d.rectangle((bb[0] - 3, bb[1] - 2, bb[2] + 3, bb[3] + 2), fill=background)
    d.text((x, y), t, font=f, fill=colour)


def P(x, y):                                 # from 320 coordinates to the panel
    return (x * SX, y * SX)


def camera_mark(d, c, side, colour=YELLOW):
    """small camera: rectangle + lens, side -- the direction it looks (unit vector)"""
    x, y = c; v = np.array(side, float); v /= np.linalg.norm(v); n = np.array([-v[1], v[0]])
    k = [np.array(c) + a * v * 14 + b * n * 9 for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    d.polygon([tuple(p) for p in k], fill=colour)
    t = [np.array(c) + v * 14 + n * 4, np.array(c) + v * 24 + n * 9, np.array(c) + v * 24 - n * 9, np.array(c) + v * 14 - n * 4]
    d.polygon([tuple(p) for p in t], fill=colour)


def scheme(frame, top_cam, top_side, side_cam_h, head_tilt, label_t):
    im = Image.new('RGB', (SW, PH), (14, 14, 26)); d = ImageDraw.Draw(im)
    # from above
    d.text((10, 6), 'FROM ABOVE', font=FB(14), fill=GREY)
    c = (165, 95); r = 26
    d.ellipse((c[0] - r - 12, c[1] - r - 6, c[0] + r - 2, c[1] + r + 6), fill=(40, 42, 80))       # back of the hood
    d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), fill=(170, 160, 150))                       # head
    d.polygon([(c[0] + r - 2, c[1] - 7), (c[0] + r + 12, c[1]), (c[0] + r - 2, c[1] + 7)], fill=(170, 160, 150))   # nose
    arrow(d, (c[0] + 45, c[1]), (c[0] + 95, c[1]), GREY, 2, 9); d.text((c[0] + 50, c[1] + 6), 'looks', font=F(12), fill=GREY)
    d.text((c[0] - 150, c[1] - r - 8), "character's left", font=F(12), fill=GREY); d.text((c[0] - 150, c[1] + r - 4), "character's right", font=F(12), fill=GREY)
    kp = (c[0] + top_cam[0], c[1] + top_cam[1]); camera_mark(d, kp, top_side)
    # from the side
    d.text((10, 172), 'FROM THE SIDE (height)', font=FB(14), fill=GREY)
    g = 292; d.line([(10, g), (SW - 10, g)], fill=(60, 60, 90), width=2)
    hb = (170, 212)
    d.ellipse((hb[0] - 20, hb[1] - 20, hb[0] + 20, hb[1] + 20), fill=(170, 160, 150))
    a = np.radians(head_tilt); nx, ny = np.cos(a), np.sin(a)
    arrow(d, (hb[0] + 22 * nx, hb[1] + 22 * ny), (hb[0] + 52 * nx, hb[1] + 52 * ny), GREY, 2, 8)
    d.line([(hb[0] - 2, hb[1] + 20), (hb[0] - 8, g)], fill=(120, 110, 110), width=6)
    kc = (60, side_cam_h); v = np.array([hb[0] - kc[0], hb[1] - kc[1]], float)
    camera_mark(d, kc, v); d.line([kc, hb], fill=(255, 214, 102, 120), width=1)
    y0 = 300
    return im


def sample_panel(k, marks):
    im = gam((SAMPLE_DIR + '/k%02d.png'), k); d = ImageDraw.Draw(im)
    for b in marks:
        b(d)
    return im


def ours_panel(k, marks):
    im = gam(W + '/ff-11/%02d.png', k - 1); d = ImageDraw.Draw(im)
    for b in marks:
        b(d)
    return im


def wind(d):
    arrow(d, P(262, 16), P(262 + 2.9 * 14, 16 - 1.1 * 14), BLUE, 3)
    label(d, P(192, 24), 'particle, px/frame:', BLUE, F(13))
    label(d, P(192, 33), 'near +2.9,-1.1  far +1.0,-0.4', BLUE, F(13))


def heaviness(d, x=300, y=60):
    arrow(d, P(x, y), P(x, y + 30), GREEN, 3); label(d, P(x - 42, y + 33), "weight", GREEN, F(13))


def box(d, q, colour, t, place=None, f=13):
    x0, y0, x1, y1 = q
    d.rectangle((P(x0, y0), P(x1, y1)), outline=colour, width=2)
    if t:
        label(d, place or P(x0, y1 + 2), t, colour, F(f))


rows = []
# shot 1
rows.append((
    scheme(1, (48, 44), (-1, -1), 262, -35, ''),
    sample_panel(1, [wind, lambda d: heaviness(d, 300, 60),
                    lambda d: box(d, (95, 0, 160, 60), YELLOW, 'hair 134..142 deg: down-right in the wind', P(96, 62)),
                    lambda d: box(d, (50, 55, 80, 100), RED, 'lining edge "(" -- hood BEHIND the head', P(2, 102)),
                    lambda d: label(d, P(4, 150), "snow density 3x toward the bottom -- the same in all three shots", WHITE, F(13))]),
    ours_panel(1, [lambda d: box(d, (0, 0, 60, 180), RED, 'hood a vertical column, no folds', P(2, 4))]),
    "SHOT 1 (1..11): camera FRONT-RIGHT (both eyes), lower (slope as in shot 3 -- the same snow density); the character looks up-right. The hood is on the far side of the head."))
# shot 2
rows.append((
    scheme(12, (0, 62), (0, -1), 240, 15, ''),
    sample_panel(12, [wind,
                     lambda d: box(d, (80, 40, 112, 100), RED, 'inner wedge L 8..10 (outer surface L 19..21)', P(10, 102)),
                     lambda d: box(d, (110, 0, 195, 70), YELLOW, 'hair IN FRONT OF the hood', P(150, 72))]),
    ours_panel(12, [lambda d: box(d, (125, 0, 215, 120), RED, "the ring wraps the head -- a helmet", P(2, 4))]),
    "SHOT 2 (12..13): camera on the RIGHT (profile), near; head slightly tilted. The brim passes BEHIND the face, the profile is open; the brim does not wrap the head from above."))
# shot 3
rows.append((
    scheme(17, (0, 62), (0, -1), 262, 50, ''),
    sample_panel(17, [wind, lambda d: heaviness(d, 250, 110),
                     lambda d: box(d, (160, 52, 210, 80), YELLOW, 'brim UNDERSIDE lit L 43..48', P(62, 44)),
                     lambda d: box(d, (138, 62, 162, 104), RED, 'inner wedge L 7..9', P(60, 106)),
                     lambda d: box(d, (155, 78, 225, 125), GREEN, 'hair hanging 72..99 deg', P(170, 127)),
                     lambda d: label(d, P(4, 150), "head drops 8 px/frame x4; lit hair -67%", WHITE, F(13))]),
    ours_panel(17, [lambda d: box(d, (130, 60, 240, 180), RED, "head upright, eye open, looks right", P(2, 4)),
                   lambda d: label(d, P(2, 22), "no band under the brim and no inner wedge; the peak is round", RED, F(13))]),
    "SHOT 3 (14..22): camera on the RIGHT, BELOW; the head tilts (face down-right). The brim underside (lit) and the hood inside (dark) show -- as seen from the side and below."))

HD, PAD, TX = 30, 10, 44
Wt = SW + 2 * PW + 4 * PAD
Ht = 70 + len(rows) * (HD + PH + TX + PAD)
v = Image.new('RGB', (Wt, Ht), (8, 8, 16)); d = ImageDraw.Draw(v)
d.text((PAD, 10), "Pass 12: where the camera is, from which side -- and the hood physics", font=FB(20), fill=YELLOW)
d.text((PAD, 38), "Sample and ours (pass 11 render), brightness raised with gamma 0.6. Numbers at 320x180. Scheme -- a reading; evidence -- the numbers on the sample panel.", font=F(14), fill=GREY)
y = 70
for sx, m, b, t in rows:
    d.text((PAD, y + 6), 'SCHEME', font=FB(15), fill=GREY); d.text((PAD * 2 + SW, y + 6), 'SAMPLE', font=FB(15), fill=YELLOW); d.text((PAD * 3 + SW + PW, y + 6), "OURS (pass 11)", font=FB(15), fill=YELLOW)
    y += HD
    v.paste(sx, (PAD, y)); v.paste(m, (PAD * 2 + SW, y)); v.paste(b, (PAD * 3 + SW + PW, y))
    y += PH + 6
    d.text((PAD, y), t, font=F(15), fill=WHITE)
    y += TX - 6 + PAD
v.save(OUT); print(OUT, v.size)
