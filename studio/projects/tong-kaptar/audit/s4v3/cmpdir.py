# cmpdir.py A B : per-frame count of differing pixels between two frame folders
import sys, glob, os
import numpy as np
from PIL import Image
A, B = sys.argv[1], sys.argv[2]
tot = 0; worst = []
for f in sorted(glob.glob(A + '/*.png')):
    g = os.path.join(B, os.path.basename(f))
    a = np.asarray(Image.open(f).convert('RGB'), dtype=np.int16); b = np.asarray(Image.open(g).convert('RGB'), dtype=np.int16)
    d = np.abs(a - b).max(axis=2)
    n = int((d > 0).sum()); tot += n
    if n: worst.append((n, int(d.max()), os.path.basename(f)))
print('frames', len(glob.glob(A + '/*.png')), 'differing px total', tot, 'frames with diffs', len(worst))
for w in sorted(worst, reverse=True)[:8]: print(w)
