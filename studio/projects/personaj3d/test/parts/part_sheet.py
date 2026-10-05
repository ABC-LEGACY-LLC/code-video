"""PARTS SHEET (pass 10): in every shot, the sample / ours bare (no hair, hood or cloak) / ours dressed -- each part separately.
The parts the tool found on the sample -- filled dot; ours (exact, from 3D) -- filled, and the sample's on our panel as a hollow circle.
Under-jaw trace: sample -- orange, ours (bare silhouette) -- blue. Table: per part, per shot -- ours - sample (px, 320x180).
python3 test/parts/part_sheet.py TAG   -> out/parts-audit-10.png"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q

R = (P3D_DIR)
TAG = sys.argv[1] if len(sys.argv) > 1 else 'world9b'
BEFORE = sys.argv[2] if len(sys.argv) > 2 else None          # in the table: before -> now
OUT = sys.argv[3] if len(sys.argv) > 3 else R + '/out/parts-audit-10.png'
T = json.load(open('%s/private/test/parts/compare_%s.json' % (R, TAG)))
TO = json.load(open('%s/private/test/parts/compare_%s.json' % (R, BEFORE))) if BEFORE else None
EXACT = json.load(open('%s/test/parts/ours_%s.json' % (R, TAG)))
def typeface(n, q=False): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if q else ''), n)
F11, F13, F15, F18 = typeface(11), typeface(13), typeface(15, True), typeface(18, True)
WHITE = (225, 225, 235); YELLOW = (255, 214, 60); BACKGROUND = (12, 12, 18)
COLOUR = {'eye': (0, 255, 255), 'brow': (255, 255, 0), 'nose': (0, 255, 0), 'mouth': (255, 0, 255), 'lip': (255, 150, 255), 'chin': (255, 50, 50)}
NAME = {'eye': "eye", 'brow': 'brow', 'nose': 'nose tip', 'mouth': "mouth", 'lip': 'lip shadow', 'chin': 'chin'}
AN = {'eye_near': 'eye_near', 'eye_far': 'eye_far', 'brow_near': 'brow_near_mid', 'brow_far': 'brow_far_mid', 'mouth': 'mouth', 'lip': 'lip_shadow'}
FRAME = [(5, (70, 20, 150, 120)), (10, (80, 22, 160, 122)), (12, (112, 50, 182, 125)), (16, (118, 88, 198, 172)), (20, (118, 88, 198, 172))]
SC = 5

def picture(p, bx):
    a = Q.L320(p) if not isinstance(p, np.ndarray) else p
    b = np.clip((a / 255) ** 0.6 * 255, 0, 255).astype(np.uint8)
    t = Image.fromarray(b).convert('RGB').crop(bx); return t.resize((t.width * SC, t.height * SC), Image.NEAREST)

def panel(k, bx, kind):
    src = {'sample': (SAMPLE_DIR + '/k%02d.png') % k, 'bare': '%s/frames-part/anime-bare-%s/%03d.png' % (R, TAG, k - 1),
           'dressed': '%s/frames-sample/anime-%s/%03d.png' % (R, TAG, k - 1)}[kind]
    t = picture(src, bx); d = ImageDraw.Draw(t)
    P = lambda x, y: ((x - bx[0] + 0.5) * SC, (y - bx[1] + 0.5) * SC)
    o = T[str(k)]
    # under-jaw traces
    if 'jaw' in o:
        xs = sorted(o['jaw']['sample'], key=int)
        d.line([P(int(x), o['jaw']['sample'][x]) for x in xs], fill=(255, 150, 0), width=2)
        if kind != 'sample': d.line([P(int(x), o['jaw']['ours'][x]) for x in xs], fill=(60, 140, 255), width=2)
    def point(x, y, colour, head=False, r=4):
        X, Y = P(x, y)
        if head: d.ellipse([X - r - 1, Y - r - 1, X + r + 1, Y + r + 1], outline=colour, width=2)
        else: d.ellipse([X - r, Y - r, X + r, Y + r], fill=colour, outline=(0, 0, 0))
    for q, v in o.items():
        if q in ('jaw', 'contour'): continue
        c = COLOUR[q.split('_')[0]]
        if kind == 'sample': point(*v['sample'], c)
        else:
            point(*v['sample'], c, head=True)
            point(*v['ours'], c)
    if kind != 'sample':                                        # also our parts that are not visible on the sample (small)
        A = EXACT[str(k - 1)]
        for q, qa in list(AN.items()) + [('chin_tip', 'chin_tip'), ('nose_tip', 'nose_tip')]:
            if q in o or qa not in A: continue
            point(A[qa][0], A[qa][1], COLOUR[q.split('_')[0]], r=2)
    d.text((4, 3), {'sample': 'SAMPLE k%02d' % k, 'bare': "OURS BARE (no hair, hood or cloak)", 'dressed': 'OURS DRESSED'}[kind], font=F13, fill=YELLOW)
    return t

def jaw_chart(W, H):
    g = Image.new('RGB', (W, H), BACKGROUND); d = ImageDraw.Draw(g)
    d.text((10, 6), "UNDER THE JAW (chin) -- in every column the lower edge y, px: sample (orange) and ours bare (blue); down -- larger y", font=F15, fill=YELLOW)
    bl = [(5, "shot 1 k05 (3/4)"), (12, "shot 2 k12 (profile)"), (16, "shot 3 k16 (tilted)"), (20, "shot 3 k20")]
    w = (W - 40) // len(bl)
    for i, (k, nm) in enumerate(bl):
        j = T[str(k)]['jaw']; xs = sorted(j['sample'], key=int); x0 = 20 + i * w
        ys = [j['sample'][x] for x in xs] + [j['ours'][x] for x in xs]; ya, yb = min(ys) - 3, max(ys) + 3
        X = lambda x: x0 + 30 + (w - 60) * (int(x) - int(xs[0])) / max(1, int(xs[-1]) - int(xs[0])); Y = lambda y: 40 + (H - 80) * (y - ya) / (yb - ya)
        d.rectangle([x0 + 30, 40, x0 + w - 30, H - 40], outline=(50, 50, 65))
        for yy in range(int(ya), int(yb) + 1):
            if yy % 5 == 0: d.text((x0 + 2, Y(yy) - 6), str(yy), font=F11, fill=(150, 150, 165)); d.line([(x0 + 30, Y(yy)), (x0 + w - 30, Y(yy))], fill=(35, 35, 48))
        d.line([(X(x), Y(j['sample'][x])) for x in xs], fill=(255, 150, 0), width=3)
        d.line([(X(x), Y(j['ours'][x])) for x in xs], fill=(60, 140, 255), width=3)
        for x in xs[::max(1, len(xs) // 5)]: d.text((X(x) - 8, H - 36), x, font=F11, fill=(150, 150, 165))
        f = [j['ours'][x] - j['sample'][x] for x in xs]
        d.text((x0 + 34, H - 20), '%s: diff %+d..%+d px' % (nm, min(f), max(f)), font=F13, fill=WHITE)
    return g

def table(W):
    sh = {1: range(1, 12), 2: (12, 13), 3: range(14, 23)}
    qs = [('eye_near', "near eye"), ('eye_far', "far eye"), ('brow_near', 'near brow'), ('nose_tip', 'nose tip'), ('mouth', "mouth"),
          ('lip', 'lip shadow'), ('chin_tip', 'chin tip')]
    line = []
    def pt(TT, q, s):
        v = [TT[str(k)][q] for k in sh[s] if q in TT[str(k)]]
        if not v: return None
        f = np.array([e['diff'] for e in v]); return f[:, 0].mean(), f[:, 1].mean(), len(v), sum('under hair/hood' in e['source'] for e in v)
    for q, nm in qs:
        r = [nm]
        for s in (1, 2, 3):
            a = pt(T, q, s)
            if a is None: r.append('not visible on the sample'); continue
            if TO is not None and pt(TO, q, s): b = pt(TO, q, s); r.append('%+.1f, %+.1f -> %+.1f, %+.1f  (%d)' % (b[0], b[1], a[0], a[1], a[2]))
            else: r.append('%+.1f, %+.1f  (%d frames%s)' % (a[0], a[1], a[2], ', %d of ours under the hair' % a[3] if a[3] else ''))
        line.append(r)
    def jg(TT, s):
        f = np.concatenate([list(TT[str(k)]['jaw']['diff'].values()) for k in sh[s] if 'jaw' in TT[str(k)]]); return np.abs(f).mean(), f.min(), f.max()
    r = ["under jaw |mean| (min..max)"]
    for s in (1, 2, 3):
        a = jg(T, s)
        if TO is not None: b = jg(TO, s); r.append('%.1f (%+d..%+d) -> %.1f (%+d..%+d)' % (b[0], b[1], b[2], a[0], a[1], a[2]))
        else: r.append('%.1f (%+d..%+d)' % a)
    line.append(r)
    g = Image.new('RGB', (W, 56 + 20 * (len(line) + 1)), BACKGROUND); d = ImageDraw.Draw(g)
    d.text((10, 6), "DIFFERENCE PER PART: ours - sample (x, y px, 320x180; y > 0 -- ours is lower)" + ("  --  %s -> %s" % (BEFORE, TAG) if TO is not None else ''), font=F15, fill=YELLOW)
    d.text((10, 26), "ours: eye, mouth, lip -- dressed render (the same rule on both); chin, nose, jaw -- bare silhouette (the same scan); brow -- 3D point (ours is mostly under the hair)", font=F11, fill=WHITE)
    xs = [10, 220, 620, 960]
    for i, h in enumerate(('part', 'shot 1 (3/4, 11 frames)', 'shot 2 (profile, 2 frames)', 'shot 3 (tilted, 9 frames)')): d.text((xs[i], 46), h, font=F13, fill=YELLOW)
    for j, r in enumerate(line):
        for i, v in enumerate(r): d.text((xs[i], 66 + 20 * j), v, font=F13, fill=WHITE)
    return g

def layer(W):
    Qd = json.load(open('%s/test/parts/layer_%s.json' % (R, TAG)))
    sh = {1: range(1, 12), 2: (12, 13), 3: range(14, 23)}
    LAYERS = ['bare', '+ hair', '+ hood (full)']
    g = Image.new('RGB', (W, 40 + 20 * 11), BACKGROUND); d = ImageDraw.Draw(g)
    d.text((10, 6), "LAYERS: what we have over the sample's visible face (skin + rim, hair excluded) -- bare -> + hair -> + hood", font=F15, fill=YELLOW)
    y = 32
    for s in (1, 2, 3):
        ks = [str(k) for k in sh[s]]
        d.text((10, y), 'shot %d (sample face mean %d px)' % (s, np.mean([Qd[k]['face_px'] for k in ks])), font=F13, fill=YELLOW); y += 19
        for nm in LAYERS:
            v = {c: 100 * np.mean([Qd[k][nm][c] for k in ks]) for c in ('skin', 'hair', 'hood', 'excess')}
            d.text((30, y), '%-22s' % nm, font=F13, fill=WHITE)
            d.text((260, y), 'on the sample face, ours: skin %3.0f %%   hair %3.0f %%   hood/cloak %3.0f %%' % (v['skin'], v['hair'], v['hood']), font=F13, fill=WHITE)
            d.text((830, y), 'our visible skin outside the sample face: %3.0f %%' % v['excess'], font=F13, fill=WHITE); y += 19
        y += 2
    return g

def main():
    parts = []
    W = max(3 * (80 * SC + 8) + 20, 1290)
    head = Image.new('RGB', (W, 70), BACKGROUND); d = ImageDraw.Draw(head)
    d.text((10, 8), "PASS 10: PARTS SEPARATELY -- eye, brow, nose, mouth, chin, jaw, hair, hood", font=F18, fill=(255, 235, 200))
    d.text((10, 36), "On the sample every part was found by the tool (reviewed on the check sheets); ours -- exact points from 3D and the silhouette without hair/hood. Hollow circle -- that part on the sample.", font=F13, fill=WHITE)
    parts.append(head)
    for k, bx in FRAME:
        ts = [panel(k, bx, t) for t in ('sample', 'bare', 'dressed')]
        row = Image.new('RGB', (W, max(t.height for t in ts) + 8), BACKGROUND); x = 10
        for t in ts: row.paste(t, (x, 4)); x += t.width + 8
        parts.append(row)
    parts.append(jaw_chart(W, 260)); parts.append(table(W)); parts.append(layer(W))
    Wd = Image.new('RGB', (W, sum(p.height for p in parts)), BACKGROUND); y = 0
    for p in parts: Wd.paste(p, (0, y)); y += p.height
    Wd.save(OUT); print(OUT, Wd.size)

main()
