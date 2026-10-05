"""HAIR AUDIT SHEET (pass 6): each shot -- SAMPLE | BEFORE (pass 5, the delivered GIF panel) | NOW (pass 6, from the GIF
path) | bright hair map BEFORE | map NOW. The map (the same code, test/audit_sample/hair_coverage.py): magenta --
only the sample's hair is bright, green -- only ours, white -- both; dim red -- our skin, dim blue -- our
hood (exact, from the role render). Numbers: hair_measure.py, hair_coverage.py (clean render). python3 test/hair_sheet.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import hair_coverage as SQ
from composition import mask

R = (P3D_DIR)
def typeface(n, thick=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else ''), n)
F13, F16, F20 = typeface(13), typeface(16, True), typeface(20, True)
PW, PH = 400, 225
WHITE = (225, 225, 235); HEADING = (255, 214, 60)

def cover_map(clean, role, ks):
    fm = np.zeros((180, 320)); fb = np.zeros((180, 320)); skin = np.zeros((180, 320)); hood = np.zeros((180, 320))
    for k in ks:
        fm += mask(SQ.L320((SAMPLE_DIR + '/k%02d.png') % k)); fb += mask(SQ.L320('%s/%03d.png' % (clean, k - 1)))
        r = SQ.role320('%s/%03d.png' % (role, k - 1)); skin += r == 'skin'; hood += r == 'hood'
    n = len(ks); fm /= n; fb /= n; skin /= n; hood /= n
    img = np.stack([fm, fb, fm], -1)
    img = np.maximum(img, np.stack([skin * 0.25, skin * 0.10, skin * 0.10], -1))
    img = np.maximum(img, np.stack([hood * 0.0, hood * 0.0, hood * 0.35], -1))
    return Image.fromarray((img * 255).clip(0, 255).astype(np.uint8)).resize((PW, PH), Image.NEAREST)

SHOT = [
  dict(name="SHOT 1 (1..11) -- 3/4, from below, head ~17 deg up", k=1, ks=range(1, 12), text=[
    "The sample's bright hair overlapping our bright hair: 1 % -> 49 % (the rest, in ours: skin 17 %, shadow 14 %, background 17 %).",
    "BEHIND the near eye, bare skin 28..33 -> 6..9 px (sample 1..9); forehead skin (above the eye) 15..23.5 -> 2.5..5.5 px (sample 1..4.5).",
    "Bright mass 1.51 % (58, 35) -> 5.48 % (84, 28); sample 3.01 % (104, 40) -- the centre moved 26 px closer to the face, the area is larger.",
    "The 'looks sideways' impression is gone: the near strands hang from behind the eye, BEHIND the jaw (in shot 1, 10-11, they do not fall over the cheek either)."]),
  dict(name="SHOT 2 (12-13) -- profile, head level", k=12, ks=(12, 13), text=[
    "Overlap: 0 % -> 28 %. Hair over the profile eye 0.44 -> 0.00 (sample 0). Bright mass 0.15 % -> 1.88 % (sample 4.29 %).",
    "The sample's bright hair under our HOOD 49 % -> 14 %: the hair peak is now IN FRONT of the hood (as in the sample).",
    "Hair shape: a fan spreading ~1 unit up from the crown and ~1 unit forward from the forehead (from the sample's rows, in head space);",
    "wind from behind -- in the sample the snow drifts right and up; our wind blows the same way (physics weight + wind bend)."]),
  dict(name="SHOT 3 (14-22) -- from below, head tilted ~39 deg", k=20, ks=range(14, 23), text=[
    "Overlap: 0 % -> 43 %: the sample's bright hair (forehead hair hanging IN FRONT of the face) is now in the same place in ours too.",
    "OPEN: bright mass 3.13 % -> 9.60 %, sample 1.74 % -- the hair peak sticks out of the hood and is lit; in the sample the crown is",
    "under the hood, in its shadow. The hood dome was slid forward in this shot (hoodSlide; 11.1 -> 9.6 %), the full fix is",
    "for the hood pass (the hood brim/opening fitted to the sample's dark mass in all three shots)."]),
]

def main():
    P = 8; TW = 5 * PW + 6 * P
    rows = []
    for sh in SHOT:
        k = sh['k']
        h = 30 + PH + 22 + 18 * len(sh['text']) + 14
        c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
        d.text((P, 6), sh['name'], font=F16, fill=HEADING)
        pan = [('SAMPLE k%02d' % k, Image.open((SAMPLE_DIR + '/k%02d.png') % k)),
               ("BEFORE (pass 5)", Image.open('%s/frames-sample/delivered5/%03d.png' % (R, k - 1))),
               ("NOW (pass 6)", Image.open('%s/frames-sample/delivered6/%03d.png' % (R, k - 1))),
               ("bright hair: BEFORE", cover_map(R + '/frames-clean-5', R + '/frames-sample/role-stage5', sh['ks'])),
               ("bright hair: NOW", cover_map(R + '/frames-clean-6', R + '/frames-sample/role-hair6', sh['ks']))]
        for j, (t, im) in enumerate(pan):
            x = P + j * (PW + P)
            c.paste(im.convert('RGB').resize((PW, PH), Image.LANCZOS), (x, 30))
            d.text((x + 4, 33), t, font=F13, fill=WHITE)
        y = 30 + PH + 10
        for s in sh['text']:
            d.text((P, y), s, font=F13, fill=WHITE); y += 18
        rows.append(c)
    head = Image.new('RGB', (TW, 76), (12, 12, 18)); d = ImageDraw.Draw(head)
    d.text((P, 8), "PASS 6: HAIR -- where the sample's bright hair mass is, and where ours is (the same code on both sides)", font=F20, fill=(255, 235, 200))
    d.text((P, 38), "Map: magenta -- only the sample's hair is bright, green -- only ours, white -- both; dim red -- our skin, dim blue -- our hood.",
           font=F13, fill=WHITE)
    d.text((P, 56), "Image -- the sample's is used only for technique (mass, coverage); the hair drawing and shape are ours, fitted to the sample's mass.", font=F13, fill=WHITE)
    W = Image.new('RGB', (TW, 76 + sum(r.height for r in rows)), (12, 12, 18)); W.paste(head, (0, 0)); y = 76
    for r in rows: W.paste(r, (0, y)); y += r.height
    W.save(R + '/out/hair-audit-6.png'); print(R + '/out/hair-audit-6.png', W.size)

main()
