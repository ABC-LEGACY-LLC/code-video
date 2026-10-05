"""CAMERA AUDIT SHEET (pass 8): "after 10 the camera grows and shrinks like a zoom" -- the frames around the cuts
(10..14) SAMPLE | BEFORE (pass 7, the delivered GIF) | NOW (pass 8, from the GIF path); the visible head area in each frame
(lines), the shot's figure area, the snow density and the snow continuity at the cut. The numbers are computed here
(hood_measure.py, snow_zoom.py -- the same code on both sides). python3 test/camera_sheet.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import hood_measure as KO
import snow_zoom as QZ
import scale as MS

R = (P3D_DIR)
A7, A8 = R + '/frames-sample/delivered7', R + '/frames-sample/delivered8'
R7, R8 = R + '/frames-sample/role-hood7', R + '/frames-sample/role-camera8'
def typeface(n, thick=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else ''), n)
F13, F16, F20 = typeface(13), typeface(16, True), typeface(20, True)
WHITE = (225, 225, 235); HEADING = (255, 214, 60); BACKGROUND = (12, 12, 18)
COLOUR = {'sample': (255, 120, 220), 'BEFORE (7)': (150, 150, 170), 'NOW (8)': (90, 230, 120)}
PW, PH, P = 320, 180, 8
KS = [10, 11, 12, 13, 14]

def lift(im):
    a = np.asarray(im.convert('RGB').resize((PW, PH), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def main():
    o7, o8 = KO.measure(R7), KO.measure(R8)
    q = {name: QZ.measure(d)[0] for name, d in (('sample', 'sample'), ('BEFORE (7)', A7), ('NOW (8)', A8))}
    cut = {name: [QZ.cut(d, i, j) for i, j in ((11, 12), (13, 14))] for name, d in (('sample', 'sample'), ('BEFORE (7)', A7), ('NOW (8)', A8))}
    TW = 5 * PW + 6 * P + 150
    # 1. frames
    rows = []
    for name, f in (('SAMPLE', lambda k: (SAMPLE_DIR + '/k%02d.png') % k), ("BEFORE (pass 7)", lambda k: '%s/%03d.png' % (A7, k - 1)),
                   ("NOW (pass 8)", lambda k: '%s/%03d.png' % (A8, k - 1))):
        c = Image.new('RGB', (TW, PH + 6), BACKGROUND); d = ImageDraw.Draw(c)
        d.text((P, PH // 2 - 8), name, font=F16, fill=HEADING)
        for j, k in enumerate(KS):
            x = 150 + P + j * (PW + P); c.paste(lift(Image.open(f(k))), (x, 3)); d.text((x + 4, 6), 'k%02d%s' % (k, ' (cut)' if k in (12, 14) else ''), font=F13, fill=WHITE)
        rows.append(c)
    # 2. lines: the visible head area in each frame
    GW, GH = TW - 2 * P, 260
    g = Image.new('RGB', (TW, GH + 40), BACKGROUND); d = ImageDraw.Draw(g)
    d.text((P, 4), "Visible head area (px, 320x180) in each frame -- sample / BEFORE (7) / NOW (8); vertical line -- cut", font=F16, fill=HEADING)
    x0, y0, x1, y1 = 70, 30, TW - 30, GH + 20
    series = {'sample': [o8['image'][f]['sample'] for f in range(22)], 'BEFORE (7)': [o7['image'][f]['ours'] for f in range(22)], 'NOW (8)': [o8['image'][f]['ours'] for f in range(22)]}
    vmin, vmax = 3000, 8000
    X = lambda i: x0 + (x1 - x0) * i / 21; Y = lambda v: y1 - (y1 - y0) * (v - vmin) / (vmax - vmin)
    for v in range(3000, 8001, 1000):
        d.line([(x0, Y(v)), (x1, Y(v))], fill=(40, 40, 55)); d.text((8, Y(v) - 7), '%d' % v, font=F13, fill=(150, 150, 165))
    for i in range(22): d.text((X(i) - 6, y1 + 3), '%d' % (i + 1), font=F13, fill=(150, 150, 165))
    for kx in (10.5, 12.5): d.line([(X(kx), y0), (X(kx), y1)], fill=(110, 90, 40), width=2)
    for name, v in series.items():
        pts = [(X(i), Y(v[i])) for i in range(22)]
        for s0, s1 in ((0, 11), (11, 13), (13, 22)):
            if s1 - s0 > 1: d.line(pts[s0:s1], fill=COLOUR[name], width=3)
            for pnt in pts[s0:s1]: d.ellipse([pnt[0] - 3, pnt[1] - 3, pnt[0] + 3, pnt[1] + 3], fill=COLOUR[name])
    lx = x1 - 190
    for j, name in enumerate(series):
        d.line([(lx, y0 + 10 + 18 * j), (lx + 26, y0 + 10 + 18 * j)], fill=COLOUR[name], width=3); d.text((lx + 32, y0 + 3 + 18 * j), name, font=F13, fill=WHITE)
    # 3. text
    s7, s8 = o7['shot'], o8['shot']
    ms = {name: [MS.ecc(MS.L(MS.file(d, i)), MS.L(MS.file(d, i + 1))) for i in (9, 10)] for name, d in (('sample', 'sample'), ('BEFORE (7)', A7), ('NOW (8)', A8))}
    text = [
        "SHOT 1, 9 -> 10 -> 11 (\"after 10\"): scale of the figure region (left 45 %%, ECC, scale.py): sample %.3f / %.3f;  BEFORE %.3f / %.3f (was shrinking);  NOW %.3f / %.3f"
        % (ms['sample'][0], ms['sample'][1], ms['BEFORE (7)'][0], ms['BEFORE (7)'][1], ms['NOW (8)'][0], ms['NOW (8)'][1]),
        "   reason: when the head turned, the hood followed it at a 0.35 share and its brim kept covering the back of the head (visible head in frame 11: 6094 px, sample 7031);",
        "   now the hood follows the turn within the shot at a 0.2 share (kfInner -- the measured optimum, head IoU 0.802 -> 0.809; frame 11: 6862 px).",
        "Figure area (hood + head + cloak, occlusion map) shot 1 / 2 / 3: sample %.3f / %.3f / %.3f;  BEFORE %.3f / %.3f / %.3f;  NOW %.3f / %.3f / %.3f"
        % (s8['1-shot']['figure_area_sample'], s8['2-shot']['figure_area_sample'], s8['3-shot']['figure_area_sample'],
           s7['1-shot']['figure_area'], s7['2-shot']['figure_area'], s7['3-shot']['figure_area'],
           s8['1-shot']['figure_area'], s8['2-shot']['figure_area'], s8['3-shot']['figure_area']),
        "   in the sample the figure grows over shots 1 -> 2 -> 3; BEFORE, it SHRANK in shot 2 (as if the camera moved away) and grew sharply in shot 3.",
        "Shot 2: visible head IoU %.3f -> %.3f, ours/sample area %.2f -> %.2f, figure IoU %.3f -> %.3f  (camera d 12.88 -> 10.32, test/fit_camera8.mjs)"
        % (s7['2-shot']['iou'], s8['2-shot']['iou'], s7['2-shot']['ratio'], s8['2-shot']['ratio'], s7['2-shot']['figure'], s8['2-shot']['figure']),
        "Snow density (particles / 10k px, in the background box) shot 1 / 2 / 3: sample %.0f / %.0f / %.0f;  BEFORE %.0f / %.0f / %.0f;  NOW %.0f / %.0f / %.0f"
        % tuple([q['sample'][s]['count'] for s in '123'] + [q['BEFORE (7)'][s]['count'] for s in '123'] + [q['NOW (8)'][s]['count'] for s in '123']),
        "Snow continuity at the cut (11->12, 13->14; phase-correlation peak r): sample %.2f / %.2f;  BEFORE %.2f / %.2f;  NOW %.2f / %.2f"
        % (cut['sample'][0][2], cut['sample'][1][2], cut['BEFORE (7)'][0][2], cut['BEFORE (7)'][1][2], cut['NOW (8)'][0][2], cut['NOW (8)'][1][2]),
        "   in the sample the snow is ONE 2D layer -- it carries on across the cut; ours redrew the snow with each shot's camera (shot 2: particles +51 %). Now the snow lives",
        "   in shot 1's camera space and is carried to each shot by a similarity (depth stretched by d_shot/d_1 -- a particle stays in front of / behind the head as before).",
        "Open: in shot 2 the face at this scale is ~1.25 times larger than the sample's (front contour in rows 96-112 lies 10-16 px to the right) -- in the sample the profile face is drawn",
        "   small relative to the head; left for the face pass. The snow looks different from the sample (density 195 vs 271, particle p90 4.0 vs 7.3 px, speed 1.5 vs 2.6 px/frame).",
    ]
    t = Image.new('RGB', (TW, 18 * len(text) + 16), BACKGROUND); d = ImageDraw.Draw(t)
    for i, s in enumerate(text): d.text((P, 8 + 18 * i), s, font=F13, fill=WHITE)
    head = Image.new('RGB', (TW, 60), BACKGROUND); d = ImageDraw.Draw(head)
    d.text((P, 8), "PASS 8: CAMERA SCALE and the SNOW LAYER -- no 'camera zoom' at the cut (the same code on both sides)", font=F20, fill=(255, 235, 200))
    d.text((P, 36), "Image -- the sample's is used only for technique (scale, layer, mass); the character and the drawing are ours.", font=F13, fill=WHITE)
    parts = [head] + rows + [g, t]
    W = Image.new('RGB', (TW, sum(p.height for p in parts)), BACKGROUND); y = 0
    for p in parts: W.paste(p, (0, y)); y += p.height
    W.save(R + '/out/camera-audit-8.png'); print(R + '/out/camera-audit-8.png', W.size)

main()
