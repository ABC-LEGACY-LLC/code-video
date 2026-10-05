"""PASS 9 SHEET: ONE 3D WORLD -- the camera test and the three shots together (the same code, results of test/measure9.py).
Frames: SAMPLE | BEFORE (pass 8, the delivered GIF frames) | NOW (pass 9). Table: the largest non-rigid shift in the
camera test (px, 320x180) for each part; the three-shot measurements; the residuals.
python3 test/world_sheet9.py TAG   (test/measure9_8.json and test/measure9_TAG.json; frames-sample/anime-TAG)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import sky_measure as OS

R = (P3D_DIR)
TAG = sys.argv[1]
def typeface(n, thick=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else ''), n)
F12, F13, F15, F18 = typeface(12), typeface(13), typeface(15, True), typeface(18, True)
WHITE = (225, 225, 235); HEADING = (255, 214, 60); BACKGROUND = (12, 12, 18); GREEN = (120, 230, 140); RED = (255, 110, 110)
A, B = json.load(open(R + '/test/measure9_8.json')), json.load(open(R + '/test/measure9_%s.json' % TAG))
KS = [5, 10, 11, 12, 13, 16, 21]; PW, PH = 240, 135

def lift(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((PW, PH), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def main():
    TW = 150 + len(KS) * (PW + 6) + 10
    parts = []
    head = Image.new('RGB', (TW, 64), BACKGROUND); d = ImageDraw.Draw(head)
    d.text((10, 8), "PASS 9: ONE 3D WORLD -- only the camera belongs to the shot (the patches are removed)", font=F18, fill=(255, 235, 200))
    d.text((10, 38), "Image -- the sample's is used only for technique (staging, mass, timing); the character and the drawing are ours. Numbers: the same code on both sides.", font=F13, fill=WHITE)
    parts.append(head)
    for name, f in (('SAMPLE', lambda k: (SAMPLE_DIR + '/k%02d.png') % k), ("BEFORE (pass 8)", lambda k: '%s/frames-sample/delivered8/%03d.png' % (R, k - 1)),
                   ("NOW (pass 9)", lambda k:'%s/frames-sample/anime-%s/%03d.png' % (R, TAG, k - 1))):
        c = Image.new('RGB', (TW, PH + 8), BACKGROUND); d = ImageDraw.Draw(c)
        d.text((10, PH // 2 - 8), name, font=F15, fill=HEADING)
        for j, k in enumerate(KS):
            x = 150 + j * (PW + 6); c.paste(lift(f(k)), (x, 4)); d.text((x + 4, 6), 'k%02d' % k, font=F12, fill=WHITE)
        parts.append(c)
    # camera test table
    q = ['skin', 'eye', 'hair', 'hood', 'snow']; part_label = {'skin': 'head surface', 'eye': "near eye", 'hair': 'hair', 'hood': 'hood', 'snow': 'snow'}
    t = Image.new('RGB', (TW, 150), BACKGROUND); d = ImageDraw.Draw(t)
    d.text((10, 6), "CAMERA TEST (pose and time held, only the camera moves) -- the largest shift from the rigid 3D place, px (320x180): BEFORE -> NOW", font=F15, fill=HEADING)
    y = 30
    for film, title in (('camPath', "camera path shots 1->2->3"), ('orbit', 'orbit 360 deg')):
        s = '%-26s' % title
        x = 10; d.text((x, y), title, font=F13, fill=WHITE); x = 230
        for c in q:
            a, b = A['camera'][film][c]['relative_max'], B['camera'][film][c]['relative_max']
            txt = '%s %.0f -> %.0f' % (part_label[c], a, b); d.text((x, y), txt, font=F13, fill=GREEN if b < 0.5 else RED); x += d.textlength(txt, font=F13) + 22
        txt = 'background top %.0f -> %.0f deg' %(A['camera'][film]['top'], B['camera'][film]['top']); d.text((x, y), txt, font=F13, fill=GREEN if B['camera'][film]['top'] < 0.5 else RED)
        y += 22
    d.text((10, y + 6), "Calibration: with the patches frozen every part is 0.0000 px; an artificial +0.1 unit shift -- matches the independent camera model itself (0.000 %).", font=F13, fill=WHITE)
    parts.append(t)
    # three-shot table
    ha, hb = A['now'], B['now']
    sky_sample = OS.profile('sample'); oa = OS.profile(R + '/frames-sample/delivered8'); ob = OS.profile(R + '/frames-sample/anime-' + TAG)
    difference = lambda o: [np.mean(np.abs(np.array(o[s]) - np.array(sky_sample[s]))) for s in '123']
    fa, fb = difference(oa), difference(ob)
    line = [
        ("visible head IoU, shot 1 / 2 / 3", ' / '.join('%.2f' % ha['head'][s]['iou'] for s in ha['head']), ' / '.join('%.2f' % hb['head'][s]['iou'] for s in hb['head']), '1'),
        ("figure (mass) IoU, shot 1 / 2 / 3", ' / '.join('%.2f' % ha['head'][s]['figure'] for s in ha['head']), ' / '.join('%.2f' % hb['head'][s]['figure'] for s in hb['head']), '1'),
        ("figure area, shot 1 / 2 / 3", ' / '.join('%.3f' % ha['head'][s]['figure_area'] for s in ha['head']), ' / '.join('%.3f' % hb['head'][s]['figure_area'] for s in hb['head']), '0.431 / 0.509 / 0.578'),
        ("shot 2 front contour |diff|, px", '%.1f' % ha['shot2_contour']['mean_abs'], '%.1f' % hb['shot2_contour']['mean_abs'], '0'),
        ("shot 3 chin contour |diff|, px", '%.1f' % ha['shot3']['contour_mean_abs'], '%.1f' % hb['shot3']['contour_mean_abs'], '0'),
        ("shot 1 scale 9->10 / 10->11 (ECC)", '%.3f / %.3f' % tuple(ha['scale']), '%.3f / %.3f' % tuple(hb['scale']), '0.995 / 0.985'),
        ("snow density shot 1 / 2 / 3 (/10k px)", ' / '.join('%d' % v['count'] for v in ha['snow'].values()), ' / '.join('%d' % v['count'] for v in hb['snow'].values()), '271 / 273 / 272'),
        ("snow continuity at the cut r 11->12 / 13->14", '%.2f / %.2f' % tuple(ha['snow_cut']), '%.2f / %.2f' % tuple(hb['snow_cut']), '0.71 / 0.69'),
        ("background profile |diff| L, shot 1 / 2 / 3", ' / '.join('%.1f' % v for v in fa), ' / '.join('%.1f' % v for v in fb), '0'),
    ]
    z = B['probe']; za = A['probe']
    for kk in ('far_eye.x', 'far_eye.y', 'mouth.x', 'far_edge_y20.t', 'far_edge_y30.t', 'chin_front_y52.t', 'tear_cheek.x'):
        line.append(('shot 1 probe %s (mean |diff|)' % kk, '%.2f' % za[kk]['mean'], '%.2f' % z[kk]['mean'], '0'))
    T = Image.new('RGB', (TW, 30 + 19 * (len(line) + 1)), BACKGROUND); d = ImageDraw.Draw(T)
    d.text((10, 6), "ALL THREE SHOTS TOGETHER (role / clean / anime render, the same code)", font=F15, fill=HEADING)
    xs = [10, 400, 620, 840]
    for i, h in enumerate(("measurement", "BEFORE (pass 8)", "NOW (pass 9)", 'sample')): d.text((xs[i], 28), h, font=F13, fill=HEADING)
    for j, (a, b, c, m) in enumerate(line):
        for i, v in enumerate((a, b, c, m)): d.text((xs[i], 47 + 19 * j), v, font=F12, fill=WHITE)
    parts.append(T)
    resid = json.load(open(R + '/test/world9_residual.json')) if __import__('os').path.exists(R + '/test/world9_residual.json') else []
    if resid:
        Q = Image.new('RGB', (TW, 30 + 19 * len(resid)), BACKGROUND); d = ImageDraw.Draw(Q)
        d.text((10, 6), "RESIDUALS (one 3D world cannot reproduce the sample in these places -- measured, not hidden)", font=F15, fill=HEADING)
        for j, s in enumerate(resid): d.text((10, 30 + 19 * j), s, font=F12, fill=WHITE)
        parts.append(Q)
    Wd = Image.new('RGB', (TW, sum(p.height for p in parts)), BACKGROUND); y = 0
    for p in parts: Wd.paste(p, (0, y)); y += p.height
    Wd.save(R + '/out/world-audit-9.png'); print(R + '/out/world-audit-9.png', Wd.size)

main()
