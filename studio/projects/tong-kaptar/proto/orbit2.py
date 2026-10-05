# Iteration 2: closer orbit, forward throw, flock passes the release point then the hero chases and joins on the near side.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import numpy as np, math, sys, json
from PIL import Image, ImageDraw
F, CX, CY = 1000.0, 640.0, 360.0
TH = math.atan(0.2)
def proj(p):
    x, y, z = p
    yc = y * math.cos(TH) - z * math.sin(TH); zc = z * math.cos(TH) + y * math.sin(TH)
    return np.array([CX + F * x / zc, CY - F * yc / zc]), zc
def unproj(sx, sy, zc):
    x = (sx - CX) * zc / F; y = -(sy - CY) * zc / F
    return np.array([x, y * math.cos(TH) + zc * math.sin(TH), zc * math.cos(TH) - y * math.sin(TH)])
cfg = dict(C=[-9.5, 10.5, 37.0], R=13.5, v=10.5, phic0=-2.55, spread=0.55, tj=3.15, slot=[0.12, -0.8, 0.6], V0=[-1.6, 3.6, 3.4], rel=[836, 262, 2.95])
if len(sys.argv) > 1: cfg.update(json.loads(sys.argv[1]))
C = np.array(cfg['C']); R = cfg['R']; W = cfg['v'] / R
orbit = lambda ph, dr=0, dy=0: C + np.array([-(R + dr) * math.sin(ph), dy, -(R + dr) * math.cos(ph)])
orbit_v = lambda ph, dr=0: np.array([-(R + dr) * math.cos(ph), 0.0, (R + dr) * math.sin(ph)]) * W
rng = np.random.default_rng(11)
birds = [dict(dphi=rng.uniform(-1, 1) * cfg['spread'], dr=rng.uniform(-2.2, 2.2), dy=rng.uniform(-1.5, 1.5), sp=rng.uniform(0.97, 1.03)) for _ in range(26)]
t_r = 22 / 24
P0 = unproj(*cfg['rel']); V0 = np.array(cfg['V0']); tj = cfg['tj']
sd, sr, sy = cfg['slot']
phj = cfg['phic0'] + W * tj + sd
Pj = orbit(phj, sr, sy); Vj = orbit_v(phj, sr)
def hero(t):
    if t >= tj: return orbit(cfg['phic0'] + W * t + sd, sr, sy)
    T = tj - t_r; s = (t - t_r) / T
    h00 = 2*s**3 - 3*s**2 + 1; h10 = s**3 - 2*s**2 + s; h01 = -2*s**3 + 3*s**2; h11 = s**3 - s**2
    return h00 * P0 + h10 * T * V0 + h01 * Pj + h11 * T * Vj
im = Image.open(f'{ROOT}/audit/scan0/full/f000.png').convert('RGB'); d = ImageDraw.Draw(im)
for i in range(96):
    t = i / 24
    for b in birds:
        s, z = proj(orbit(cfg['phic0'] + W * t * b['sp'] + b['dphi'], b['dr'], b['dy']))
        if i in (0, 22, 48, 72, 95):
            r = 0.66 * F / z / 2; col = {0: (255, 255, 0), 22: (255, 128, 0), 48: (0, 255, 0), 72: (255, 0, 255), 95: (255, 255, 255)}[i]
            d.line([s[0] - r, s[1], s[0] + r, s[1]], fill=col, width=2)
        else: d.point((s[0], s[1]), fill=(200, 200, 0))
    if t >= t_r:
        s, z = proj(hero(t)); d.ellipse([s[0] - 2, s[1] - 2, s[0] + 2, s[1] + 2], fill=(0, 255, 255))
        if i in (22, 48, 72, 95): r = 0.66 * F / z / 2; d.line([s[0] - r, s[1] - 3, s[0] + r, s[1] - 3], fill=(0, 255, 255), width=2)
im.save('orbit2.png')
prev = None; out = []
for i in range(22, 96, 3):
    t = i / 24; p = hero(t); s, z = proj(p)
    sp = np.linalg.norm((hero(t + 1e-3) - hero(t - 1e-3)) / 2e-3)
    px = np.linalg.norm(s - prev) / 3 if prev is not None else 0; prev = s
    out.append(f'f{i:02d} {sp:4.1f}m/s ({s[0]:4.0f},{s[1]:4.0f}) span {0.66*F/z:5.1f} {px:4.1f}px/f')
print('\n'.join(out))
for i in (0, 22, 48, 72, 95):
    pts = np.array([proj(orbit(cfg['phic0'] + W * i / 24 * b['sp'] + b['dphi'], b['dr'], b['dy']))[0] for b in birds])
    hs = proj(hero(max(i / 24, t_r)))[0]
    dmin = np.min(np.linalg.norm(pts - hs, axis=1))
    print(f'flock f{i:02d}: x {pts[:,0].min():4.0f}-{pts[:,0].max():4.0f} y {pts[:,1].min():4.0f}-{pts[:,1].max():4.0f}   hero-nearest {dmin:5.1f}px')
