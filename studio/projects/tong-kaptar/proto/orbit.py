# Prototype: pitched pinhole camera, flock orbit, hero Hermite path -> screen paths.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import numpy as np, math
from PIL import Image, ImageDraw
F, CX, CY = 1000.0, 640.0, 360.0
TH = math.atan(0.2)                      # camera pitched up so the horizon sits at y=560
def to_cam(p):
    x, y, z = p
    yc = y * math.cos(TH) - z * math.sin(TH)
    zc = z * math.cos(TH) + y * math.sin(TH)
    return np.array([x, yc, zc])
def proj(p):
    x, y, z = to_cam(p)
    return np.array([CX + F * x / z, CY - F * y / z]), z
def unproj(sx, sy, zc):
    x = (sx - CX) * zc / F; y = -(sy - CY) * zc / F
    return np.array([x, y * math.cos(TH) + zc * math.sin(TH), zc * math.cos(TH) - y * math.sin(TH)])
import sys, json
cfg = dict(C=[-9.0, 12.0, 44.0], R=17.0, v=13.0, phi0=-2.35, tj=3.05, joinOff=0.20)
if len(sys.argv) > 1: cfg.update(json.loads(sys.argv[1]))
C = np.array(cfg['C']); R = cfg['R']; W = cfg['v'] / R
def orbit(phi, dr=0.0, dy=0.0):
    return C + np.array([-(R + dr) * math.sin(phi), dy, -(R + dr) * math.cos(phi)])
def orbit_v(phi, dr=0.0):
    return np.array([-(R + dr) * math.cos(phi), 0.0, (R + dr) * math.sin(phi)]) * W
rng = np.random.default_rng(7)
N = 26
birds = [dict(dphi=rng.uniform(-0.55, 0.45), dr=rng.uniform(-2.5, 2.5), dy=rng.uniform(-1.8, 1.8), sp=rng.uniform(0.97, 1.03)) for _ in range(N)]
t_r = 22 / 24
P0 = unproj(836, 262, 2.95)
V0 = np.array([-1.2, 5.2, 2.2])
tj = cfg['tj']
phij = cfg['phi0'] + W * tj + cfg['joinOff']
Pj = orbit(phij, 0.5, 1.2); Vj = orbit_v(phij, 0.5)
def hero(t):
    if t >= tj:
        ph = cfg['phi0'] + W * t + cfg['joinOff']; return orbit(ph, 0.5, 1.2)
    T = tj - t_r; s = (t - t_r) / T
    h00 = 2*s**3 - 3*s**2 + 1; h10 = s**3 - 2*s**2 + s; h01 = -2*s**3 + 3*s**2; h11 = s**3 - s**2
    return h00 * P0 + h10 * T * V0 + h01 * Pj + h11 * T * Vj
im = Image.open(f'{ROOT}/audit/scan0/full/f048.png').convert('RGB')
d = ImageDraw.Draw(im)
for i in range(96):
    t = i / 24
    for b in birds:
        ph = cfg['phi0'] + W * t * b['sp'] + b['dphi']
        s, z = proj(orbit(ph, b['dr'], b['dy']))
        r = max(1, 0.66 * F / z / 2)
        if i % 12 == 0: d.ellipse([s[0] - r, s[1] - 1, s[0] + r, s[1] + 1], fill=(255, 255, 0))
        else: d.point((s[0], s[1]), fill=(255, 220, 0))
    if t >= t_r:
        s, z = proj(hero(t)); r = 0.66 * F / z / 2
        d.ellipse([s[0] - 2, s[1] - 2, s[0] + 2, s[1] + 2], fill=(0, 255, 255))
        if i % 6 == 4: d.line([s[0] - r, s[1], s[0] + r, s[1]], fill=(0, 255, 255))
im.save(f'{ROOT}/proto/orbit.png')
# numbers
print('W rad/s', round(W, 3), ' P0', P0.round(2), ' Pj', Pj.round(1))
prev = None
for i in range(22, 96, 4):
    t = i / 24; p = hero(t); s, z = proj(p)
    sp = np.linalg.norm((hero(t + 1e-3) - hero(t - 1e-3)) / 2e-3)
    px = np.linalg.norm(s - prev) / 4 if prev is not None else 0
    print(f'f{i:02d} t={t:.2f} hero world {p.round(1)} speed {sp:5.1f} m/s  screen ({s[0]:6.1f},{s[1]:6.1f}) z={z:5.1f} span={0.66*F/z:6.1f}px  {px:5.1f}px/f')
    prev = s
cl = []
for i in (0, 24, 48, 72, 95):
    pts = np.array([proj(orbit(cfg['phi0'] + W * i / 24 * b['sp'] + b['dphi'], b['dr'], b['dy']))[0] for b in birds])
    print(f'flock f{i:02d}: x {pts[:,0].min():.0f}-{pts[:,0].max():.0f}  y {pts[:,1].min():.0f}-{pts[:,1].max():.0f}')
