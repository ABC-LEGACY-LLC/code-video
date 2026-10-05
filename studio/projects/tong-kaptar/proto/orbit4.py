# Joint choreography check: flock orbit + hero waypoint path, as in the scene code (sky world).
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import numpy as np, math, sys, json
from PIL import Image, ImageDraw
F, CX, CY = 1000.0, 640.0, 360.0; TH = math.atan(0.2)
crane = lambda t: 16 * (lambda u: 4*u**3 if u < 0.5 else 1 - (-2*u+2)**3/2)(min(max(t/4, 0), 1))
def proj(p, t):
    x, y, z = p; yc = y*math.cos(TH) - z*math.sin(TH); zc = z*math.cos(TH) + y*math.sin(TH)
    return np.array([CX + F*x/zc, CY - F*yc/zc + crane(t)*2.6/zc]), zc
cfg = dict(C=[-11, 10.8, 37], R=12.5, v=8, phi0=-2.7, spread=0.3, tj=3.15, slot=[0.16, -0.9, 0.3],
           wp=[[0.35, -0.1, 1.25, 1.2], [0.9, -1.3, 3.5, 5.6]])
if len(sys.argv) > 1: cfg.update(json.loads(sys.argv[1]))
C = np.array(cfg['C'], float); R = cfg['R']; W = cfg['v']/R; tr = 22/24
orb = lambda ph, dr, dy: C + np.array([-(R+dr)*math.sin(ph), dy, -(R+dr)*math.cos(ph)])
orv = lambda ph, dr: np.array([-(R+dr)*math.cos(ph), 0, (R+dr)*math.sin(ph)])*W
P0 = np.array([0.635, 0.669, 2.994]); V0 = np.array([1.2, 5.3, 0.24])
sd, sr, sy = cfg['slot']; tj = cfg['tj']
def hero(t):
    ph = lambda tt: cfg['phi0'] + W*tt + sd
    if t >= tj: return orb(ph(t), sr, sy)
    pts = [(tr, P0, V0)] + [(tr+w[0], P0 + np.array(w[1:]), None) for w in cfg['wp']] + [(tj, orb(ph(tj), sr, sy), orv(ph(tj), sr))]
    pts = [list(p) for p in pts]
    for k in range(1, len(pts)-1): pts[k][2] = (pts[k+1][1]-pts[k-1][1])/(pts[k+1][0]-pts[k-1][0])
    k = 0
    while k < len(pts)-2 and t > pts[k+1][0]: k += 1
    (ta, pa, va), (tb, pb, vb) = pts[k], pts[k+1]; T = tb-ta; s = min(max((t-ta)/T, 0), 1)
    return (2*s**3-3*s**2+1)*pa + (s**3-2*s**2+s)*T*va + (-2*s**3+3*s**2)*pb + (s**3-s**2)*T*vb
rng = np.random.default_rng(11)
birds = [dict(dphi=rng.uniform(-1,1)*cfg['spread'], dr=rng.uniform(-1,1)*1.6, dy=rng.uniform(-1,1)*1.1, sp=0.993+rng.uniform()*0.014) for _ in range(26)]
im = Image.open(f'{ROOT}/audit/scan6/full/f048.png').convert('RGB'); d = ImageDraw.Draw(im)
cols = {0:(255,255,0), 24:(255,128,0), 48:(0,255,0), 72:(255,0,255), 95:(255,255,255)}
for i in range(96):
    t = i/24
    for b in birds:
        s, z = proj(orb(cfg['phi0'] + W*t*b['sp'] + b['dphi'], b['dr'], b['dy']), t)
        if i in cols: r = 0.66*F/z/2; d.line([s[0]-r, s[1], s[0]+r, s[1]], fill=cols[i], width=2)
    if t >= tr:
        s, z = proj(hero(t), t); d.ellipse([s[0]-2, s[1]-2, s[0]+2, s[1]+2], fill=(0,255,255))
im.save('orbit4.png')
prev = None; minv = 1e9; back = 0; out = []
for i in range(22, 96):
    s, z = proj(hero(i/24), i/24)
    if prev is not None:
        v = np.linalg.norm(s - prev)
        if i > 24: minv = min(minv, v)
        if i > 27 and s[0] > prev[0] + 0.5: back += 1
    prev = s
    if i % 6 == 4: out.append(f'{s[0]:.0f},{s[1]:.0f} s{0.66*F/z:.0f}')
print(f'hero min {minv:.1f} back {back} | ' + ' | '.join(out))
for i in (0, 22, 48, 72, 95):
    pts = np.array([proj(orb(cfg['phi0'] + W*i/24*b['sp'] + b['dphi'], b['dr'], b['dy']), i/24)[0] for b in birds])
    hs = proj(hero(max(i/24, tr)), i/24)[0]
    dn = np.sort(np.linalg.norm(pts - hs, axis=1))[:3]
    print(f'flock f{i:02d} x {pts[:,0].min():4.0f}-{pts[:,0].max():4.0f} y {pts[:,1].min():4.0f}-{pts[:,1].max():4.0f}   hero ({hs[0]:.0f},{hs[1]:.0f}) nearest {dn.round(0)}')
