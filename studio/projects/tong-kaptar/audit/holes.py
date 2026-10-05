# Pass 1 hole test: threshold the subject layer, flood-fill background from the border, report unreached background (holes).
import sys, numpy as np
from PIL import Image
from scipy import ndimage
D = sys.argv[1] if len(sys.argv) > 1 else 'scan0'
layer = sys.argv[2] if len(sys.argv) > 2 else 'boy'
frames = range(96) if len(sys.argv) < 4 else [int(x) for x in sys.argv[3].split(',')]
tot = 0
for i in frames:
    a = np.asarray(Image.open(f'{D}/{layer}/f{i:03d}.png').convert('RGBA'))[..., 3]
    obj = a > 128
    bg = ~obj
    lab, n = ndimage.label(bg)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    holes = [(k, int((lab == k).sum())) for k in range(1, n + 1) if k not in border]
    holes = [(k, s) for k, s in holes if s >= 2]
    if holes:
        tot += 1
        desc = []
        for k, s in sorted(holes, key=lambda x: -x[1])[:6]:
            ys, xs = np.nonzero(lab == k); desc.append(f'{s}px@({int(xs.mean())},{int(ys.mean())})')
        print(f'f{i:02d}: {len(holes)} holes: ' + ', '.join(desc))
print(f'{tot} frames with holes in layer {layer}')
