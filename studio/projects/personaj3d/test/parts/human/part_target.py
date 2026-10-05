"""SAMPLE PARTS TARGET (pass 12, structure; PRIVATE -- from the sample): per-frame 320x180 bits --
  1 -- visible head (face + hair, lit and in shadow: test/audit_sample/head_mask.py, L>=40 connected to the face seed);
  2 -- hood inside (dark L 5-14, inside the figure, up to 28 px from the head mask) -- in the sample the inside of the wide
       hood shows between the hair and the cloth (in all 3 shots), in ours (a narrow hood) it was 19-30 px;
  8 -- lit skin (part_measure.face_mask) -- hair = 1 and not 8;
  4 -- figure (where no snow shows and it is not sky): in shots 1 and 3, on the held frames, the cloth that does not move
       (std < 5, L >= 6) + head + inner; in shot 2 (2 frames, one drawing) cloth L 15-33 on the minimum image + head +
       inner, the largest connected part. Check: a sheet (test/parts/human/part_target.py --sheet OUT.png).
Why: in pass 11 the hood was fitted to the "head" mask (the lining counted as head too) -- the lining filled in where the
hair should be; now the classes are separate (head, inner, figure), the lining is not head.
python3 test/parts/human/part_target.py [--sheet OUT.png]  ->  private/test/parts/human/part_target_12.json"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, os, json, base64
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import head_mask as BN
def Lk(k): return ndimage.median_filter(np.asarray(Image.open((SAMPLE_DIR + '/k%02d.png') % k).convert('L').resize((320, 180), Image.LANCZOS), float), 3)
SHOT = {1: list(range(1, 12)), 2: [12, 13], 3: list(range(14, 23))}
HOLD = {1: list(range(1, 7)), 3: list(range(15, 23))}
def figure_shot(s):
    if s in HOLD:
        S = np.stack([Lk(k) for k in HOLD[s]]); M = np.median(S, 0); V = ndimage.median_filter(S.std(0), 3)
        fig = (V < 5) & (M >= 6)
    else:
        M = np.minimum(Lk(12), Lk(13)); fig = (M >= 15) & (M < 33)
    fig = ndimage.binary_opening(fig, np.ones((3, 3)))
    return fig
out = {}; FIG = {s: figure_shot(s) for s in SHOT}
FIG8 = json.load(open((P3D_DIR + '/private/test/sample_figure8.json')))
for s, ks in SHOT.items():
    for k in ks:
        L = Lk(k); B = BN.mask(BN.L320((SAMPLE_DIR + '/k%02d.png') % k), k)
        FG = np.kron(np.array(FIG8['shot%d' % s]), np.ones((10, 10)))[:180, :320]        # coarse figure (pass 8, 32x18)
        fig0 = (FIG[s] & ndimage.binary_dilation(FG > 0.3, np.ones((9, 9)))) | B
        lab, n = ndimage.label(fig0); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        big = np.isin(lab, 1 + np.nonzero(sz > 0.2 * sz.max())[0])        # large parts (the figure; snow islands are dropped)
        fig = ndimage.binary_fill_holes(big | B)
        near = ndimage.distance_transform_edt(~B) < 28
        inner = near & (L >= 5) & (L < 15) & ~B & ndimage.binary_erosion(fig, np.ones((5, 5)))
        sys.path.insert(0, (P3D_DIR + '/test/parts')); import part_measure as QO
        g_, p_ = QO.params(k); Fy = QO.face_mask(QO.L320((SAMPLE_DIR + '/k%02d.png') % k), p_)
        Fy = np.zeros_like(B) if Fy is None else Fy
        m = B.astype(np.uint8) | (inner.astype(np.uint8) << 1) | ((fig | inner).astype(np.uint8) << 2) | ((Fy & B).astype(np.uint8) << 3)
        # pass 13 (item 4) FIX -- a tool error: the darkest cloth and the neck (L < 15) had fallen outside the figure threshold
        # (figure L 15..33 in shot 2, L >= 6 in shots 1/3; inner L >= 5) and were marked BACKGROUND. In the lower part of the frame
        # (y >= 110) the background is L 20..50 (snow), a dark patch is not background: L < 15 patches (>= 20 px) touching the
        # figure or the head -- figure; those within 28 px of the head -- inner (the neck/collar shadow under the chin, the
        # cloak's dark folds in shot 2).
        background = (m & 7) == 0; yy = np.arange(180)[:, None] * np.ones((1, 320))
        lab2, n2 = ndimage.label((L < 15) & background & (yy >= 110)); touch = ndimage.binary_dilation(fig | B, np.ones((3, 3)))
        brow = np.zeros_like(background)
        for i in range(1, n2 + 1):
            c = lab2 == i
            if c.sum() >= 20 and (c & touch).any(): brow |= c
        m[brow] |= 4; m[brow & near] |= 2
        out[k - 1] = base64.b64encode(m.tobytes()).decode()
H = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'private', 'test', 'parts', 'human'))   # the private marks and targets
json.dump({'note': 'PRIVATE: from the sample. bit1 visible head, bit2 hood inner, bit4 figure, bit8 skin', 'm': out}, open(os.path.join(H, 'part_target_12.json'), 'w'))
print(len(out), 'frame')
if '--sheet' in sys.argv:
    from PIL import ImageDraw
    rows = []
    for k in (3, 10, 12, 16, 20):
        m = np.frombuffer(base64.b64decode(out[k - 1]), np.uint8).reshape(180, 320); L = Lk(k)
        o = np.stack([L * 1.5] * 3, -1)
        o[(m & 4) > 0] = o[(m & 4) > 0] * 0.4 + np.array([40, 60, 160]) * 0.6
        o[(m & 2) > 0] = [120, 50, 170]; o[(m & 1) > 0] = o[(m & 1) > 0] * 0.4 + np.array([250, 230, 120]) * 0.6
        rows.append(np.concatenate([np.stack([np.clip(L * 2.2, 0, 255)] * 3, -1), np.full((180, 4, 3), 255), o], 1)); rows.append(np.full((4, 644, 3), 255))
    Image.fromarray(np.clip(np.concatenate(rows, 0), 0, 255).astype(np.uint8)).resize((1288, 2*len(rows)//2*184), Image.NEAREST).save(sys.argv[sys.argv.index('--sheet') + 1])
