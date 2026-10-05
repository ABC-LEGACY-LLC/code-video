"""STAGING AUDIT SHEET (pass 5): each shot -- the sample (measured points in yellow), a scheme (camera from above and from the side, head
tilt), BEFORE (pass 4, the delivered GIF panel), NOW (pass 5). The yellow marks show the sample's position in EVERY panel --
whether our face lands in the same place can be seen by eye. Numbers: test/stage2_fit.mjs, stage3_fit.mjs, stage_before_now.mjs,
audit_sample/stage_measure.py. python3 test/stage_sheet.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

R = (P3D_DIR)
def typeface(n, thick=False):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else '')
    return ImageFont.truetype(p, n)
F12, F14, F16, F20 = typeface(12), typeface(14), typeface(16, True), typeface(20, True)
def openness(im, g=0.62, m=1.3):
    a = np.asarray(im.convert('RGB')).astype(float) / 255
    return Image.fromarray((np.clip(a ** g * m, 0, 1) * 255).astype('uint8'))
PW, PH = 480, 270
S = PW / 320
YELLOW = (255, 214, 60)

SHOT_LIST = [
  dict(name="SHOT 1  (frames 1..11, 0.66 s)", k=1,
       mark=[('+', 99.4, 48.7), ('+', 120.3, 49.3), ('+', 125.5, 84.5), ('+', 130.5, 60), ('.', 125.7, 91.0)] +
             [('.', x, y) for y, x in [(66.6, 130.3), (76.6, 131.7), (98.6, 129.6)]] + [('.', x, y) for x, y in [(104.8, 107.6), (116.8, 109.7), (124.8, 109.8)]],
       cam=dict(az=55, el=-8), eg=-0.30, pitch_front=-0.30,
       text=["WHAT IT DOES: stands in the snow and cries. 1-6 -- one drawing (the face identical to within 0.1 px), only the hair and the tear",
             "  move; 6-9 the tear runs from the cheek to the jaw, a drop hangs on the jaw; 10-11 it closes its eyes and turns its head to profile, the drop falls.",
             "WHERE IT LOOKS: forward and right, slightly UP -- head raised ~17 deg; eye open, the pupil straight relative to the head.",
             "CAMERA: to its RIGHT-FRONT (az 55), slightly BELOW (el -8), 7 units.  Evidence: 5 face points + front contour + under the jaw, RMS 0.6 px.",
             "  A single view gives only the relative angle: el -8/-20/-30 -> head +17/+8/0 deg up, but then a sideways lean of 3/13/21 deg is needed.",
             "OURS: the staging was right, unchanged. The 'looks sideways' impression comes FROM THE HAIR: bare skin behind the eye 28-31 px (sample 8-12 px)."]),
  dict(name="SHOT 2  (frames 12-13, 0.12 s)", k=12,
       mark=[('.', x, y) for y, x in [(70,157),(72,159),(74,158.5),(76,157),(78,156),(80,155),(82,155),(84,156),(86,159.5),(88,161.5),(90,164.5),(92,165.5),(94,164.5),(96,163),(98,163),(100,162.5),(102,161),(104,161),(106,160.5),(108,159.5),(110,159.5)]] +
             [('.', x, y) for x, y in [(146, 114), (150, 113.5), (154, 113)]] + [('-', 133, 77.5, 144, 80)],
       cam=dict(az=84, el=-5), eg=-0.08, pitch_front=-0.10, cam_front=dict(az=84, el=-4),
       text=["WHAT IT DOES: eyes closed, does not move -- the calmest pair in the clip (12->13 difference 0.257).",
             "WHERE IT LOOKS: forward (profile), head LEVEL (~5 deg up); the 'down' impression -- the closed-eye line slopes forward 17 deg down.",
             "CAMERA: on its RIGHT SIDE (profile, az 84), at face height (el -5), farther away (12.9 units; the face, against shot 1, at 0.55 of the size).",
             "  Evidence: front contour 21 rows + under the chin, RMS 1.33 px. In the sample the eye is BEHIND our 3/4 position by 17.5 px -- an anime profile eye.",
             "BEFORE: tilt -0.10 + the lower face pushed forward in profile -> front contour RMS 9.9 px (max 19.5), the face was tilted ~20 deg UP.",
             "NOW: the shift is removed, the eye drawing moves onto the side of the head -> contour in the render +-2 px (RMS 1.1), eye -0.9/-0.1 px."]),
  dict(name="SHOT 3  (frames 14-22, 0.54 s)", k=22,
       mark=[('-', 152, 111, 159, 113)] + [('.', x, y) for y, x in [(144, 167), (146, 161), (148, 158), (150, 157), (152, 153), (154, 153), (156, 151)]] + [('.', x, y) for x, y in [(146, 158), (150, 158)]],
       cam=dict(az=55, el=-30), eg=0.68, pitch_front=0.30, cam_front=dict(az=80, el=-5),
       text=["WHAT IT DOES: BENDS its head into the hood. 14 -- an in-between drawing in motion; 15->18 the eye drops only 5.5 px,",
             "  then stays in place (the head is already bent at 15); the top of the head goes into the hood's shadow (bright hair 2.8 -> 1.0 %).",
             "WHERE IT LOOKS: DOWN -- head bent ~39 deg, eye half open, its highlight 2-3 px below the lash line.",
             "CAMERA: RIGHT-FRONT (az 55, shot 1's side), BELOW (el -30), close (7.1).  Evidence: eye + chin 7 rows + under the jaw, RMS 0.88 px,",
             "  head not turned (0.03), not leaning (-0.05). BEFORE: camera at the side (az 80, el -5), head 9-17 deg -- upright in profile, 'looks sideways';",
             "  in the render the eye and chin were NOT at the sample's place. NOW: eye track over 15-22 within +-1-2 px, chin edge +-1-3 px (measured in the render)."]),
]

def marks(d, sh):
    for b in sh['mark']:
        if b[0] == '+':
            x, y = b[1] * S, b[2] * S; d.line([(x - 5, y), (x + 5, y)], fill=YELLOW, width=2); d.line([(x, y - 5), (x, y + 5)], fill=YELLOW, width=2)
        elif b[0] == '.':
            x, y = b[1] * S, b[2] * S; d.ellipse([x - 1.6, y - 1.6, x + 1.6, y + 1.6], fill=YELLOW)
        else:
            d.line([(b[1] * S, b[2] * S), (b[3] * S, b[4] * S)], fill=YELLOW, width=3)

def scheme(w, h, sh):
    im = Image.new('RGB', (w, h), (20, 20, 30)); d = ImageDraw.Draw(im)
    # FROM ABOVE: head in the centre, it looks along +x (right), its right side is down
    cx, cy, r = w // 2, 72, 22
    d.text((8, 4), "FROM ABOVE", font=F12, fill=(180, 180, 200))
    d.text((cx + 34, cy - 7), "gaze ->", font=F12, fill=(150, 150, 170)); d.text((cx - 18, cy + 30), "right side", font=F12, fill=(150, 150, 170))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(200, 190, 185), width=2); d.polygon([(cx + r, cy - 5), (cx + r + 9, cy), (cx + r, cy + 5)], fill=(200, 190, 185))
    def camT(k, colour, en=2):
        a = math.radians(k['az']); x, y = cx + 58 * math.cos(a), cy + 58 * math.sin(a)
        d.line([(x, y), (cx + 28 * math.cos(a), cy + 28 * math.sin(a))], fill=colour, width=en); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=colour)
    if sh.get('cam_front'): camT(sh['cam_front'], (230, 120, 60), 1)
    camT(sh['cam'], (90, 230, 120))
    # FROM THE SIDE: height; the head looks right, tilt (+ is down)
    cy2 = 205
    d.text((8, 132), "FROM THE SIDE", font=F12, fill=(180, 180, 200))
    d.line([(20, cy2), (w - 20, cy2)], fill=(60, 60, 80))
    d.ellipse([cx - r, cy2 - r, cx + r, cy2 + r], outline=(200, 190, 185), width=2)
    def gaze(eg, colour, en):                                  # face direction: tilt + is down (y points down on screen)
        d.line([(cx, cy2), (cx + 48 * math.cos(eg), cy2 + 48 * math.sin(eg))], fill=colour, width=en)
    gaze(sh['pitch_front'], (230, 120, 60), 2); gaze(sh['eg'], (90, 230, 120), 3)
    def camY(k, colour, en=2):
        e = math.radians(k['el']); x, y = cx + 62 * math.cos(e), cy2 - 62 * math.sin(e)
        d.line([(x, y), (cx + 26 * math.cos(e), cy2 - 26 * math.sin(e))], fill=colour, width=en); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=colour)
    if sh.get('cam_front'): camY(sh['cam_front'], (230, 120, 60), 1)
    camY(sh['cam'], (90, 230, 120))
    d.text((8, h - 36), "green -- sample / NOW", font=F12, fill=(90, 230, 120))
    d.text((8, h - 20), "orange -- BEFORE", font=F12, fill=(230, 120, 60))
    return im

SW = 300; W = 3 * PW + SW + 5 * 10; TX = 6 * 19 + 10; RH = PH + 30 + TX
H = 70 + 3 * RH + 150
c = Image.new('RGB', (W, H), (12, 12, 18)); d = ImageDraw.Draw(c)
d.text((10, 10), "PASS 5: STAGING AUDIT -- what the sample does, where it looks, where the camera is (measured for each shot)", font=F20, fill=(245, 230, 190))
d.text((10, 40), "Yellow marks -- points measured on the sample (the sample's position in every panel). Image -- the sample's is used only for technique; the character is ours.", font=F14, fill=(190, 190, 205))
y = 70
for sh in SHOT_LIST:
    k = sh['k']
    d.text((10, y), sh['name'], font=F16, fill=(255, 220, 120))
    x = 10; yy = y + 26
    for j, (p, t) in enumerate([((SAMPLE_DIR + '/k%02d.png') % k, 'SAMPLE k%02d' % k), (None, 'SCHEME'),
                                (R + '/frames-sample/anime-delivered4/%03d.png' % (k - 1), "BEFORE (pass 4)"), (R + '/frames-sample/anime-stage5/%03d.png' % (k - 1), "NOW (pass 5)")]):
        if p is None:
            c.paste(scheme(SW, PH, sh), (x, yy)); x += SW + 10; continue
        im = openness(Image.open(p).resize((PW, PH), Image.LANCZOS))
        dd = ImageDraw.Draw(im); marks(dd, sh); dd.text((6, 4), t, font=F14, fill=(255, 255, 255))
        c.paste(im, (x, yy)); x += PW + 10
    ty = yy + PH + 6
    for s in sh['text']:
        d.text((14, ty), s, font=F14, fill=(215, 215, 225)); ty += 19
    y += RH
d.text((10, y + 4), "OUTSIDE THE STAGING -- still different (the next work):", font=F16, fill=(255, 220, 120))
remaining = ["HAIR: does not cover the side of the head (shot 1, bare skin behind the eye 28-31 px, sample 8-12) -- the face looks 'turned'; in profile the forehead",
          "  strands hang over the face; in the sample the hair is a large spiky mass (shot 2 bright area 4.3 %, ours 0.2 %).",
          "HOOD: in shot 2 it sits high above the head; in shot 3 it does not put the top of the head in shadow (bright area sample 1.0 %, ours 3.5 %) -- we do it last.",
          "BACKGROUND: the sample's background is a 2D layer (density gradient and snow motion the same in all three shots) -- ours tied the background 'top' to the camera: in shot 3,",
          "  with the camera looking from 30 deg below, the background is still as in shot 1 (the snow area at the bottom of the frame)."]
ty = y + 30
for s in remaining:
    d.text((14, ty), s, font=F14, fill=(215, 215, 225)); ty += 19
c.save(R + '/out/stage-audit-5.png'); print(c.size)
