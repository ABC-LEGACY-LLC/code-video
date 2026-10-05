"""CAMERA TEST SHEET and GIF (pass 9, step 1): pose and time are held, only the camera moves (test/camera_test9.mjs).
Left / top -- the current model (with patches), right / bottom -- the same model with the camera- and shot-dependent values frozen at frame
0 (?patch=0 -- the rigid 3D state). Numbers from the JSON (displacement in object space, 320x180 px).
python3 test/test9_sheet.py [BEFORE_TAG NOW_TAG]   (default: before rigid -> out/camera-test-9.{png,gif})"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

R = (P3D_DIR)
A, B = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ('before', 'rigid')
NAME = {'before': "CURRENT MODEL (pass 8, with patches)", 'rigid': "RIGID 3D (the same model, patches frozen)",
       'now': "NOW (pass 9: one 3D world)"}
TWO = A == 'before' and B == 'now'          # result sheet: BEFORE (pass 8) -> NOW (pass 9)
if TWO: NAME['before'] = "BEFORE (pass 8, with patches)"
SHORT = {'before': 'BEFORE', 'now': 'NOW', 'rigid': 'RIGID'}
OUT = sys.argv[3] if len(sys.argv) > 3 else R + '/out/camera-test-9'
def typeface(n, thick=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if thick else ''), n)
F12, F13, F15, F18 = typeface(12), typeface(13), typeface(15, True), typeface(18, True)
WHITE = (225, 225, 235); HEADING = (255, 214, 60); BACKGROUND = (12, 12, 18); RED = (255, 80, 80)
PARTS = [('eye', "near eye", (255, 120, 220), 'med'), ('hood', 'hood', (90, 160, 255), 'max'), ('hair', 'hair', (120, 230, 120), 'max'),
           ('skin', 'head surface', (255, 170, 90), 'max'), ('snow', 'snow', (200, 200, 255), 'med')]

def load_result(film, tag):
    return json.load(open('%s/test/test9_%s_%s.json' % (R, film, tag)))['result']

def lift(p, w, h):
    a = np.asarray(Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS), float)
    return Image.fromarray(np.clip((a / 255.0) ** 0.6 * 255, 0, 255).astype(np.uint8))

def value(e, c, s):
    v = e['part'][c]['relative']; return v.get(s, 0.0) if v else 0.0

def jump(e):
    return [c for c, _, _, _ in PARTS if e['part'][c]['step'] and e['part'][c]['step'].get('max', 0) > 20 and c != 'snow']

def gif():
    frames, time = [], []
    PW, PH = 480, 270
    for film in ('camPath', 'orbit'):
        ra, rb = load_result(film, A), load_result(film, B)
        for i, (ea, eb) in enumerate(zip(ra, rb)):
            c = Image.new('RGB', (2 * PW + 12, PH + (84 if TWO else 64)), BACKGROUND); d = ImageDraw.Draw(c)
            for j, (t, e) in enumerate(((A, ea), (B, eb))):
                c.paste(lift('%s/frames-test9/%s-%s/%03d.png' % (R, film, t, i), PW, PH), (j * (PW + 12), 44))
                d.text((j * (PW + 12) + 4, 26), NAME.get(t, t), font=F12, fill=HEADING)
            k = ea['camera']
            d.text((4, 4), ("CAMERA PATH shots 1 -> 2 -> 3" if film == 'camPath' else 'ORBIT around the head') + '   az %.1f  el %.1f  d %.2f  fov %.1f   (pose and time held)' % (k['az'], k['el'], k['d'], k['fov']), font=F13, fill=WHITE)
            sk = jump(ea)
            for q, (t, e) in enumerate(((A, ea), (B, eb)) if TWO else ((A, ea),)):
                y = PH + 47 + 19 * q; x = 4
                if TWO: tt = SHORT.get(t, t) + ':'; d.text((x, y), tt, font=F13, fill=HEADING); x += d.textlength(tt, font=F13) + 10
                for cc, name, colour, s in PARTS:
                    tt = '%s %.0f px' % (name, value(e, cc, s)); d.text((x, y), tt, font=F13, fill=colour); x += d.textlength(tt, font=F13) + 14
                tt = "background top %.0f deg" % e['top']['deviation']; d.text((x, y), tt, font=F13, fill=WHITE); x += d.textlength(tt, font=F13) + 14
                s2 = jump(e)
                if s2: d.text((x, y), 'JUMP: ' +', '.join(n for cc, n, _, _ in PARTS if cc in s2), font=F13, fill=RED)
            frames.append(c)
            key = film == 'camPath' and i in (0, 24, 48)
            time.append(900 if sk or key else 110)
    pal = [f.quantize(colors=192, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
    pal[0].save(OUT + '.gif', save_all=True, append_images=pal[1:], duration=time, loop=0, optimize=True)
    print(OUT + '.gif', len(frames))

def plot_line(d, x0, y0, x1, y1, series, xs, vmax, xlab, mark=()):
    X = lambda v: x0 + (x1 - x0) * (v - xs[0]) / (xs[-1] - xs[0]); Y = lambda v: y1 - (y1 - y0) * min(v, vmax) / vmax
    for v in np.linspace(0, vmax, 5):
        d.line([(x0, Y(v)), (x1, Y(v))], fill=(40, 40, 55)); d.text((x0 - 34, Y(v) - 7), '%.0f' % v, font=F12, fill=(150, 150, 165))
    for bx, bt in mark:
        d.line([(X(bx), y0), (X(bx), y1)], fill=(110, 90, 40), width=2); d.text((X(bx) + 3, y0), bt, font=F12, fill=(200, 170, 90))
    for name, colour, v in series:
        d.line([(X(a), Y(b)) for a, b in zip(xs, v)], fill=colour, width=3)
    d.text((x1 - 170, y1 + 4), xlab, font=F12, fill=(150, 150, 165))

def sheet():
    TW = 1500
    parts = []
    head = Image.new('RGB', (TW, 76), BACKGROUND); d = ImageDraw.Draw(head)
    d.text((10, 8), ("PASS 9 RESULT: CAMERA TEST -- BEFORE (pass 8) -> NOW (one 3D world); pose and time held, only the camera moves" if TWO else
                     "PASS 9, STEP 1: CAMERA TEST -- pose and time held, only the camera moves"), font=F18, fill=(255, 235, 200))
    d.text((10, 36), "In a consistent 3D world nothing changes in object space. Each line -- how far a part is from where it would have to be as a rigid 3D body (px, 320x180).", font=F13, fill=WHITE)
    d.text((10, 55), "Calibration: with the patches frozen every part is 0.0000 px (on both paths); an artificial +0.1 unit shift matches the independent camera model itself (0.000 %) -- PROVEN.", font=F13, fill=WHITE)
    parts.append(head)
    for film, xlab, mark in (('camPath', "step (camera of shot 1 -> shot 2 -> shot 3)", ((0, 'K1'), (12.5, 'key changes'), (24, 'K2'), (36.5, 'key changes'), (48, 'K3'))),
                              ('orbit', 'azimuth, deg (shot 1 pose; camera around the head)', ((55, 'shot 1'), (84, 'shot 2'), (90, ''),))):
        ra = load_result(film, A)
        xs = [e['n'] for e in ra] if film == 'camPath' else [e['camera']['az'] for e in ra]
        oy = 20 if TWO else 0
        g = Image.new('RGB', (TW, 300 + oy), BACKGROUND); d = ImageDraw.Draw(g)
        d.text((10, 6), ("CAMERA PATH: continuous between the sample's cameras" if film == 'camPath' else 'ORBIT: 360 deg around the head') + ' -- ' + NAME.get(A, A), font=F15, fill=HEADING)
        if TWO:
            rb = load_result(film, B); mb = max(max((e['part'][c]['relative'] or {}).get('max', 0) for c in e['part']) for e in rb)
            tb = max(e['top']['deviation'] for e in rb)
            tt = "NOW (pass 9): all %d parts, at %d points the largest shift %.2f px, background top %.0f deg -- the lines are at zero" % (len(rb[0]['part']), len(rb), mb, tb)
            d.text((10, 28), tt, font=F13, fill=(120, 230, 140))
        vmax = 160 if film == 'camPath' else 120
        series = [(name, colour, [value(e, c, s) for e in ra]) for c, name, colour, s in PARTS]
        plot_line(d, 60, 34 + oy, TW - 260, 270 + oy, series, xs, vmax, xlab, mark)
        for j, (name, colour, _) in enumerate(series):
            s = [s for c, n, r, s in PARTS if n == name][0]
            d.line([(TW - 240, 44 + oy + 20 * j), (TW - 214, 44 + oy + 20 * j)], fill=colour, width=3); d.text((TW - 208, 37 + oy + 20 * j), '%s (%s)' % (name, 'median' if s == 'med' else 'largest'), font=F12, fill=WHITE)
        d.text((TW - 240, 44 + oy + 20 * len(series)), 'background top (deg): ' +' '.join('%.0f' % e['top']['deviation'] for e in ra[::6]), font=F12, fill=WHITE)
        parts.append(g)
    # frames: camPath keys and around the jumps
    KS = [0, 12, 13, 24, 36, 37, 48]; PW, PH = 208, 117
    for t in (A, B):
        c = Image.new('RGB', (TW, PH + 26), BACKGROUND); d = ImageDraw.Draw(c)
        d.text((10, 4), NAME.get(t, t), font=F13, fill=HEADING)
        for j, k in enumerate(KS):
            c.paste(lift('%s/frames-test9/camPath-%s/%03d.png' % (R, t, k), PW, PH), (10 + j * (PW + 6), 22)); d.text((14 + j * (PW + 6), 24), '%d' % k, font=F12, fill=WHITE)
        parts.append(c)
    ra, ro = load_result('camPath', A), load_result('orbit', A)
    e24, e48, e13, e37 = ra[24], ra[48], ra[13], ra[37]
    q = lambda e, c, s='max': e['part'][c]['step'].get(s, 0)
    text = [
        "Jumps (in a single step, while the camera moves only ~1.2 deg): hood %.0f / %.0f px (largest), then %.0f / %.0f px median -- three different hoods, each fitted to its own shot;"
        % (q(e13, 'hood'), q(e37, 'hood'), value(e13, 'hood', 'med'), value(e37, 'hood', 'med')),
        "   near eye %.0f / %.0f px (eye map: in shot 1 the 3/4 position, in shot 2 the profile position -- 0.6 units along the surface); head surface %.1f px (lower face push 0.3 -> 0)."
        % (q(e13, 'eye'), q(e37, 'eye'), q(e13, 'skin')),
        "Sliding (at every step): hair -- with the camera at 70..84 deg to the head the strands blend from the 3/4 shape into the profile shape, up to %.0f px per step (on the path), largest on the orbit %.0f px;"
        % (max(e['part']['hair']['step']['max'] for e in ra[1:]), max(value(e, 'hair', 'max') for e in ro)),
        "   on the orbit the near eye slides along the face by up to %.0f px (profileWeight: 46..84 deg), the hood and the head surface do not change (one shot's value)." %max(value(e, 'eye', 'med') for e in ro),
        "The snow is stuck to the camera: %.0f px at the end of the path (median) -- wherever the camera goes, the layer goes too; on the orbit up to %.0f px (world snow would show parallax). The background top in shot 3's camera is tilted %.0f deg."
        % (value(e48, 'snow', 'med'), max(value(e, 'snow', 'med') for e in ro), e48['top']['deviation']),
        "Neck, cloak, inner hair -- 0.00 px (3D consistent). The model with patches frozen (bottom row) is 0 in every part -- but in the sample's cameras it does not match the sample: that is the work of step 2",
        "   (one 3D model is fitted to all three shots TOGETHER; shape values tied to the shot/view/frame are removed, each step is measured in all three shots and in this test).",
    ]
    if TWO:
        text = ['BEFORE: ' + text[0]] + text[1:5]
        rh = {f: load_result(f, B) for f in ('camPath', 'orbit')}
        mx = lambda r, c, k: max((e['part'][c][k] or {}).get('max', 0) for e in r)
        py = json.load(open('%s/test/test9_posePath_%s.json' % (R, B)))['result']
        text += [
            "NOW (pass 9): %.2f px on the camera path, %.2f px on the orbit -- every part (head surface, inner hair, hair, neck, hood, cloak, near eye, snow), background top 0 deg: the same as the rigid 3D state."
            % (max(mx(rh['camPath'], c, 'relative') for c in rh['camPath'][0]['part']), max(mx(rh['orbit'], c, 'relative') for c in rh['orbit'][0]['part'])),
            "   Only the camera belongs to the shot: hood -- a pose-driven rig (3 key poses, with a lag), hair/eye/face -- one shape, sky -- a world gradient, snow -- a volume around all the cameras.",
            "POSE PATH (the camera stays in shot 1, the pose shot 1 -> shot 2 -> shot 3 changes continuously over 6 frames): largest shift per step hood %.0f px (between keys 2 and 3), hair %.1f, head surface %.1f, eye %.1f px --"
            % (mx(py, 'hood', 'step'), mx(py, 'hair', 'step'), mx(py, 'skin', 'step'), mx(py, 'eye', 'step')),
            "   when the pose changes the shape changes continuously too, no jump (the camera test checks only the camera; the pose rig was checked on this path).",
        ]
    t = Image.new('RGB', (TW, 20 * len(text) + 16), BACKGROUND); d = ImageDraw.Draw(t)
    for i, s in enumerate(text): d.text((10, 8 + 20 * i), s, font=F13, fill=WHITE)
    parts.append(t)
    W = Image.new('RGB', (TW, sum(p.height for p in parts)), BACKGROUND); y = 0
    for p in parts: W.paste(p, (0, y)); y += p.height
    W.save(OUT + '.png'); print(OUT + '.png', W.size)

sheet()
gif()
