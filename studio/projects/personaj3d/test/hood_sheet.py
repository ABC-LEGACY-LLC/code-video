"""HOOD AUDIT SHEET (pass 7): each shot -- SAMPLE | BEFORE (pass 6, the delivered GIF panel) | NOW (pass 7,
from the GIF path) | visible head map BEFORE | NOW; jump (9->10, 10->11 difference map); figure blocks.
Yellow contour -- the sample's visible head (test/audit_sample/head_mask.py), green -- ours (from the role render).
Map: magenta -- head only in the sample, green -- only in ours, white -- in both. The numbers are computed here
(hood_measure.py, jump.py -- the same code on both sides). python3 test/hood_sheet.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import hood_measure as KO
import jump as SK

R = (P3D_DIR)
BEFORE_A, NOW_A = R + '/frames-sample/delivered6', R + '/frames-sample/delivered7'
BEFORE_R, NOW_R = R + '/frames-sample/role-hair6', R + '/frames-sample/role-hood7'
def typeface(n, thick=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else ''), n)
F13, F16, F20 = typeface(13), typeface(16, True), typeface(20, True)
PW, PH, P = 400, 225, 8
WHITE = (225, 225, 235); HEADING = (255, 214, 60)

def contour(m): return m & ~ndimage.binary_erosion(m)
def panel(src, f, contours):
    im = Image.open(src).convert('RGB').resize((PW, PH), Image.LANCZOS); a = np.asarray(im).copy()
    for m, colour in contours:
        k = np.asarray(Image.fromarray(contour(m).astype(np.uint8) * 255).resize((PW, PH), Image.NEAREST)) > 0
        a[k] = colour
    return Image.fromarray(a)
def cover_map(f, role_dir):
    mr = KO.sample(f); mb = KO.head(KO.role('%s/%03d.png' % (role_dir, f)), f)
    a = np.zeros((180, 320, 3), np.uint8); a[mr & ~mb] = (255, 0, 255); a[mb & ~mr] = (0, 230, 0); a[mr & mb] = (215, 215, 215)
    return Image.fromarray(a).resize((PW, PH), Image.NEAREST)
def diff(d, i, j):
    e = SK.cover_map(d, i, j)
    return Image.fromarray(np.clip(e * 90, 0, 255).astype(np.uint8)).convert('RGB').resize((PW, PH), Image.NEAREST), float(e[:, :128].mean())

def main():
    o0, o1 = KO.measure(BEFORE_R), KO.measure(NOW_R)
    j0, j1, jm = SK.pairs(BEFORE_A), SK.pairs(NOW_A), SK.pairs('sample')
    TW = 5 * PW + 6 * P; rows = []
    SH = [('SHOT 1 (1..11) -- 3/4, from below', 9, '1-shot'), ('SHOT 2 (12-13) -- profile', 11, '2-shot'), ('SHOT 3 (14-22) -- head tilted 39 deg', 17, '3-shot')]
    NOTE = {'1-shot': "In the sample the hood brim is behind the near hair mass: the back of the head, the skull cap and the neck are covered.",
            '2-shot': "In the sample the large hair mass is IN FRONT of the hood; the face and jaw are smaller in ours (left for the face pass) -- this limits the IoU.",
            '3-shot': "In the sample the head tilts INTO the hood: only the lower face and the front strands are visible, the crown and the back are in shadow."}
    for name, f, s in SH:
        e0, e1 = o0['shot'][s], o1['shot'][s]
        text = ["Visible head IoU (shot mean) %.3f -> %.3f;  ours/sample area %.2f -> %.2f" % (e0['iou'], e1['iou'], e0['ratio'], e1['ratio'])
                + ("   figure (silhouette) %.3f -> %.3f" % (e0['figure'], e1['figure']) if 'figure' in e0 else ''),
                NOTE[s]]
        h = 30 + PH + 12 + 18 * len(text) + 10
        c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
        d.text((P, 6), name + '  -- frame %d' % (f + 1), font=F16, fill=HEADING)
        mr = KO.sample(f)
        mb0 = KO.head(KO.role('%s/%03d.png' % (BEFORE_R, f)), f); mb1 = KO.head(KO.role('%s/%03d.png' % (NOW_R, f)), f)
        pan = [('SAMPLE k%02d' % (f + 1), panel((SAMPLE_DIR + '/k%02d.png') % (f + 1), f, [(mr, (255, 220, 0))])),
               ("BEFORE (pass 6) IoU %.2f" % o0['image'][f]['iou'], panel('%s/%03d.png' % (BEFORE_A, f), f, [(mr, (255, 220, 0)), (mb0, (60, 255, 60))])),
               ("NOW (pass 7) IoU %.2f" % o1['image'][f]['iou'], panel('%s/%03d.png' % (NOW_A, f), f, [(mr, (255, 220, 0)), (mb1, (60, 255, 60))])),
               ('head map: BEFORE', cover_map(f, BEFORE_R)), ('head map: NOW', cover_map(f, NOW_R))]
        for j, (t, im) in enumerate(pan):
            x = P + j * (PW + P); c.paste(im, (x, 30)); d.text((x + 4, 33), t, font=F13, fill=WHITE)
        y = 30 + PH + 10
        for t in text: d.text((P, y), t, font=F13, fill=WHITE); y += 18
        rows.append(c)
    # jump row
    h = 30 + PH + 12 + 18 * 2 + 10
    c = Image.new('RGB', (TW, h), (12, 12, 18)); d = ImageDraw.Draw(c)
    d.text((P, 6), "JUMP: 9 -> 10 -> 11 difference map (white -- the places that changed; energy of the left 40 %)", font=F16, fill=HEADING)
    pan = []
    for t, dd, i, j in (('SAMPLE', 'sample', 9, 10), ('BEFORE', BEFORE_A, 9, 10), ('NOW', NOW_A, 9, 10), ('BEFORE', BEFORE_A, 10, 11), ('NOW', NOW_A, 10, 11)):
        im, en = diff(dd, i, j); pan.append(('%s %d->%d  %.3f' % (t, i, j, en), im))
    for j, (t, im) in enumerate(pan):
        x = P + j * (PW + P); c.paste(im, (x, 30)); d.text((x + 4, 33), t, font=F13, fill=HEADING)
    y = 30 + PH + 10
    for t in ("Energy of the left 40 %%: 9->10 sample %.3f, BEFORE %.3f, NOW %.3f;  10->11 sample %.3f, BEFORE %.3f, NOW %.3f;  12->13 (held) sample %.3f, BEFORE %.3f, NOW %.3f"
              % (jm[(9, 10)], j0[(9, 10)], j1[(9, 10)], jm[(10, 11)], j0[(10, 11)], j1[(10, 11)], jm[(12, 13)], j0[(12, 13)], j1[(12, 13)]),
              "The back of the head is now under the hood -- the turn/tilt in frame 10 changes the face and the hair, not the head silhouette (the rest: the face and hair passes)."):
        d.text((P, y), t, font=F13, fill=WHITE); y += 18
    rows.append(c)
    head = Image.new('RGB', (TW, 76), (12, 12, 18)); d = ImageDraw.Draw(head)
    d.text((P, 8), "PASS 7: HOOD -- the visible head (face + hair) in each shot at the sample's place and size (the same code on both sides)", font=F20, fill=(255, 235, 200))
    d.text((P, 38), "Yellow -- the sample's visible head, green -- ours (exact, from the role render). Map: magenta -- only in the sample, green -- only in ours, white -- in both.", font=F13, fill=WHITE)
    d.text((P, 56), "Image -- the sample's is used only for technique (mass, coverage); the hood is our parametric surface, fitted to the sample's mass per shot.", font=F13, fill=WHITE)
    W = Image.new('RGB', (TW, 76 + sum(r.height for r in rows)), (12, 12, 18)); W.paste(head, (0, 0)); y = 76
    for r in rows: W.paste(r, (0, y)); y += r.height
    W.save(R + '/out/hood-audit-7.png'); print(R + '/out/hood-audit-7.png', W.size)

main()
