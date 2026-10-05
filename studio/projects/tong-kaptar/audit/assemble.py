# assemble.py out_dir spec.json : the film as one frame sequence, shot folders joined by cuts,
# dissolves or whip pans, with an optional fade in from black and fade out to black.
# spec: {"shots": [{"dir": ..., "from": 0, "to": 95}, ...],
#        "joins": ["cut" | {"dissolve": N} | {"whip": N, "dx": px, "dy": px}, ...],
#        "fadeIn": frames, "fadeOut": frames}
# A dissolve overlaps the last N frames kept of one shot with the first N of the next, mixed in
# linear light (a mix of the encoded values darkens the middle of a dissolve between two bright
# shots), with a smoothstep weight; the film is N frames shorter for it.
# A whip pan joins two framings of one place taken from one spot (the second turned from the first
# by the pixel offset dx, dy that its content moves by). The last N frames of the first shot and the
# first N of the second become 2N frames of one pan across the two frames laid side by side as a
# panorama: the window slides from the first framing to the second on an ease in and out, each of
# its pixels taken from whichever shot covers it, from both where both do, the second weighed in
# from 30 % to 70 % of the way; then smeared along the motion over the frame (a whip is a blur, not a
# slide). (Each shot slid on its own, the part of the window past its edge was edge pixels
# stretched into streaks and bar codes, and the change from one shot to the other was one hard
# frame, 1.6 times the difference of the frames round it, the boy gone from it.) No frames are
# dropped.
import sys, os, json
import numpy as np
import cv2
from PIL import Image

out, spec = sys.argv[1], json.load(open(sys.argv[2]))
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith('.png'): os.remove(os.path.join(out, f))

def frames(s):
    return [os.path.join(s['dir'], f'f{i:03d}.png') for i in range(s['from'], s['to'] + 1)]

def lin(a): a = a / 255.0; return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
def enc(a): a = np.clip(a, 0, 1); return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055) * 255.0
def load(p): return lin(np.asarray(Image.open(p).convert('RGB'), dtype=np.float64))

def smear(img, sx, sy, vx, vy):
    """img (linear) moved by (sx, sy) and blurred along (vx, vy) px (the motion during the shutter)"""
    h, w = img.shape[:2]
    M = np.float32([[1, 0, sx], [0, 1, sy]])
    moved = cv2.warpAffine(img.astype(np.float32), M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    L = int(round(max(abs(vx), abs(vy))))
    if L < 2: return moved
    k = np.zeros((2 * L + 1, 2 * L + 1), np.float32)
    for q in np.linspace(-0.5, 0.5, 4 * L + 1):
        k[int(round(L + q * vy)), int(round(L + q * vx))] += 1
    k /= k.sum()
    return cv2.filter2D(moved, -1, k, borderType=cv2.BORDER_REPLICATE)

seq = []          # ('file', path) | ('mix', pathA, pathB, w) | ('img', linear image)
for k, s in enumerate(spec['shots']):
    fr = frames(s)
    j = spec['joins'][k - 1] if k > 0 else 'cut'
    if isinstance(j, dict) and 'dissolve' in j:
        n = j['dissolve']
        tail = seq[-n:]
        del seq[-n:]
        for m in range(n):
            u = (m + 0.5) / n
            assert tail[m][0] == 'file'
            seq.append(('mix', tail[m][1], fr[m], u * u * (3 - 2 * u)))
        fr = fr[n:]
    elif isinstance(j, dict) and 'whip' in j:
        n, dx, dy = j['whip'], j['dx'], j['dy']
        pos = lambda x: x * x * (3 - 2 * x)
        steps = 2 * n
        tail = seq[-n:]
        del seq[-n:]
        assert all(t[0] == 'file' for t in tail)
        srcA = [t[1] for t in tail]                              # the first shot's last n frames
        srcB = fr[:n]                                            # the second's first n
        for m in range(steps):
            x = (m + 0.5) / steps
            p = pos(x)
            v = pos(min(1, x + 0.5 / steps)) - pos(max(0, x - 0.5 / steps))
            A = load(srcA[m] if m < n else srcA[-1]).astype(np.float32)
            B = load(srcB[m - n] if m >= n else srcB[0]).astype(np.float32)
            h, w = A.shape[:2]
            one = np.ones((h, w), np.float32)
            MA = np.float32([[1, 0, dx * p], [0, 1, dy * p]])
            MB = np.float32([[1, 0, -dx * (1 - p)], [0, 1, -dy * (1 - p)]])
            wA = cv2.warpAffine(A, MA, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            wB = cv2.warpAffine(B, MB, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            mA = cv2.warpAffine(one, MA, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            mB = cv2.warpAffine(one, MB, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            kB = pos(min(1, max(0, (p - 0.3) / 0.4)))
            ga = mA * (1 - kB) + 1e-6 * mA
            gb = mB * kB + 1e-6 * mB
            # where only one shot covers the window it alone is used, whatever the weight
            ga = np.where(mB < 1e-3, mA, ga); gb = np.where(mA < 1e-3, mB, gb)
            img = (wA * ga[..., None] + wB * gb[..., None]) / np.maximum(ga + gb, 1e-6)[..., None]
            # the corners neither frame reaches (the pan goes up as well as across): the nearer
            # shot's edge carried out into them, under the blur (left black, they showed as notches)
            cov = np.clip(mA + mB, 0, 1)
            if cov.min() < 0.999:
                near = cv2.warpAffine(A if p < 0.5 else B, MA if p < 0.5 else MB, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                img = img * cov[..., None] + near * (1 - cov)[..., None]
            seq.append(('img', smear(img, 0, 0, dx * v, dy * v)))
        fr = fr[n:]
    seq += [('file', p) for p in fr]

N = len(seq)
fin, fout = spec.get('fadeIn', 0), spec.get('fadeOut', 0)
def fade(i):
    g = 1.0
    if fin and i < fin: u = (i + 0.5) / fin; g *= u * u * (3 - 2 * u)
    if fout and i >= N - fout: u = (N - i - 0.5) / fout; g *= u * u * (3 - 2 * u)
    return g
for i, it in enumerate(seq):
    dst = os.path.join(out, f'f{i:04d}.png')
    g = fade(i)
    if it[0] == 'file' and g >= 0.9999:
        os.symlink(os.path.abspath(it[1]), dst)
        continue
    if it[0] == 'file': img = load(it[1])
    elif it[0] == 'mix': img = (1 - it[3]) * load(it[1]) + it[3] * load(it[2])
    else: img = it[1]
    # (RGBA like the shots' own frames: a sequence that changed pixel format part way had the GIF
    # encoder rebuild its filters and write 24 frames for the whole film)
    Image.fromarray(enc(img * g).round().astype(np.uint8)).convert('RGBA').save(dst)
print(out, N, 'frames', f'{N / 24:.2f} s')
