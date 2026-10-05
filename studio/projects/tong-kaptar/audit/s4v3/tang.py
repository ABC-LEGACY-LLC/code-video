# tang.py dir : per frame, visible pole pixels within 4 px of the boy's silhouette (a pole running
# along his edge: a tangent), from the layer renders dir/pole/fNNN.png and dir/body/fNNN.png
import sys, glob, os
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, label
d = sys.argv[1]
rows = []
for f in sorted(glob.glob(d + '/pole/f*.png')):
    n = os.path.basename(f)
    P = np.asarray(Image.open(f))[..., 3] > 40
    B = np.asarray(Image.open(d + '/body/' + n))[..., 3] > 40
    V = P & ~B
    dist = distance_transform_edt(~B)
    near = V & (dist <= 4)
    # the longest stretch of it: the biggest connected piece of near pixels, by its extent
    lab, k = label(near)
    ext = 0
    for j in range(1, k + 1):
        ys, xs = np.nonzero(lab == j)
        ext = max(ext, int(np.hypot(xs.max() - xs.min(), ys.max() - ys.min())))
    rows.append((n[1:4], int(near.sum()), ext, int(V.sum())))
for r in rows:
    flag = '  <-- along the edge' if r[2] > 30 else ''
    print(f'f{r[0]} near {r[1]:5d} px  longest {r[2]:3d} px  pole visible {r[3]:6d}{flag}')
print('frames with a stretch > 30 px:', sum(1 for r in rows if r[2] > 30))
