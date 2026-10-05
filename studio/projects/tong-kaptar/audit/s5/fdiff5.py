# fdiff.py dir : per-frame luminance change, whole frame and on the boy (his layer in either frame)
import sys, numpy as np
from PIL import Image
d = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 96
L = lambda i: np.asarray(Image.open(f'{d}/f{i:03d}.png').convert('L'), dtype=np.float32)
A = lambda i: np.asarray(Image.open(f'{d}/boy/f{i:03d}.png'))[..., 3] > 40
prev = L(0); pa = A(0); rows = []
for i in range(1, N):
    cur = L(i); ca = A(i); m = pa | ca
    dd = np.abs(cur - prev)
    rows.append((i, float(dd.mean()), float(dd[m].mean()) if m.any() else 0.0))
    prev, pa = cur, ca
w = np.array([r[1] for r in rows]); b = np.array([r[2] for r in rows])
print('whole: median %.2f max %.2f at f%d | boy: median %.2f max %.2f at f%d min %.2f at f%d' % (np.median(w), w.max(), rows[int(w.argmax())][0], np.median(b), b.max(), rows[int(b.argmax())][0], b.min(), rows[int(b.argmin())][0]))
# spikes: a frame's boy diff over 2x the median of its 6 neighbours
for k, r in enumerate(rows):
    nb = [rows[j][2] for j in range(max(0, k - 3), min(len(rows), k + 4)) if j != k]
    if r[2] > 2.0 * np.median(nb) and r[2] > 4: print('spike f%d boy %.2f (nbhd median %.2f)' % (r[0], r[2], np.median(nb)))
# dead runs: 4+ consecutive frames with the boy's diff under 0.6
run = []
for r in rows:
    if r[2] < 0.6: run.append(r[0])
    else:
        if len(run) >= 4: print('still run f%d..f%d' % (run[0], run[-1]))
        run = []
if len(run) >= 4: print('still run f%d..f%d' % (run[0], run[-1]))
print(' '.join('%d:%.1f' % (r[0], r[2]) for r in rows))
