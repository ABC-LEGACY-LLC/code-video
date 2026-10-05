# Search join time / slot so the pigeon accelerates out of the hands and eases into the flock's speed
# without dipping below it (no hesitation), staying in frame.
import numpy as np, math, itertools
F, CX, CY = 1000.0, 640.0, 360.0; TH = math.atan(0.2)
def proj(p):
    x, y, z = p; yc = y*math.cos(TH) - z*math.sin(TH); zc = z*math.cos(TH) + y*math.sin(TH)
    return CX + F*x/zc, CY - F*yc/zc, zc
C = np.array([-11, 10.8, 37.0]); R = 12.5; v = 8.0; phi0 = -2.7; W = v / R
P0 = np.array([0.635, 0.669, 2.994]); V0 = np.array([-0.5, 3.4, 3.6]); tr = 22/24
orb = lambda ph, dr, dy: C + np.array([-(R+dr)*math.sin(ph), dy, -(R+dr)*math.cos(ph)])
orv = lambda ph, dr: np.array([-(R+dr)*math.cos(ph), 0, (R+dr)*math.sin(ph)]) * W
def path(tj, dphi, dr, dy, v0s):
    Pj = orb(phi0 + W*tj + dphi, dr, dy); Vj = orv(phi0 + W*tj + dphi, dr); V0s = V0 * v0s
    T = tj - tr
    def pos(t):
        if t >= tj: return orb(phi0 + W*t + dphi, dr, dy)
        s = (t - tr) / T
        return (2*s**3-3*s**2+1)*P0 + (s**3-2*s**2+s)*T*V0s + (-2*s**3+3*s**2)*Pj + (s**3-s**2)*T*Vj
    return pos
best = []
for tj, dphi, v0s in itertools.product([2.7, 2.85, 3.0, 3.15, 3.3], [0.05, 0.12, 0.18, 0.26, 0.34], [1.0, 1.2, 1.4]):
    pos = path(tj, dphi, -0.6, 0.5, v0s)
    ts = np.arange(tr, 4.0, 1/48)
    sp = np.array([np.linalg.norm(pos(t+0.005)-pos(t-0.005))/0.01 for t in ts])
    ipk = sp.argmax(); after = sp[ipk:]
    dip = max(0.0, 7.6 - after.min())           # how far it drops below cruise
    peak = sp.max()
    scr = np.array([proj(pos(t))[:2] for t in ts])
    offtop = (scr[:,1] < 25).sum() / 48
    score = dip*3 + max(0, peak - 15)*0.6 + offtop*10
    best.append((score, tj, dphi, v0s, round(peak,1), round(after.min(),1), round(offtop,2), round(scr[-1][0]), round(scr[-1][1])))
best.sort()
for b in best[:8]: print(b)
