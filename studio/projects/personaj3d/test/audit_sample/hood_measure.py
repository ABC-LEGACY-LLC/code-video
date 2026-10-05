"""HOOD MEASUREMENT (pass 7) -- the same code on both sides, 320x180.
  A. Visible head: in the sample private/test/sample_head7.json (head_mask.py: median 5, L>=40, opening, face seed, the
     allowed box in shot 3), in ours EXACT from the role render (skin, neck, hair, cap, lining -- the sample's mask also
     holds the lining band L 43-48), the same box in shot 3. Per frame: IoU, area (px), ours/sample ratio.
  B. Figure (three shots; shot 2 added in pass 8): the not-background share of the role render in 10x10 blocks, averaged
     over the shot's frames, soft IoU and area share against the sample's occlusion map (private/test/sample_figure8.json).
python3 test/audit_sample/hood_measure.py ROLE_FOLDER [ROLE_FOLDER2 ...]   (%03d.png, 0-based; any size -> 320x180 NEAREST)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
import sys, json, base64
import numpy as np
from PIL import Image
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import head_mask as BN
R = (P3D_DIR)
REF = json.load(open(R + '/private/test/sample_head7.json'))['m']
FIG = json.load(open(R + '/private/test/sample_figure8.json'))       # pass 8: the shot 2 map as well (k12-13, 2 frames)
SHOT = {'1-shot': range(0, 11), '2-shot': (11, 12), '3-shot': range(13, 22)}
FIGFR = {'1-shot': ([0, 3, 6, 8, 9, 10], 'shot1'), '2-shot': ([11, 12], 'shot2'), '3-shot': ([13, 15, 17, 19, 21], 'shot3')}

def sample(f): return (np.frombuffer(base64.b64decode(REF[str(f)]), np.uint8).reshape(180, 320) & 1).astype(bool)

def role(p):
    return np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), int)

def head(a, f):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30)) | ((g > 200) & (b > 200) & (r < 30))
    if f >= 13: m &= BN.ALLOWED3
    return m

def measure(d):
    o = {'image': {}, 'shot': {}}
    for f in range(22):
        a = role('%s/%03d.png' % (d, f)); mb = head(a, f); mr = sample(f)
        o['image'][f] = dict(iou=float((mb & mr).sum() / max(1, (mb | mr).sum())), ours=int(mb.sum()), sample=int(mr.sum()))
    for s, fr in SHOT.items():
        t = [o['image'][f] for f in fr]
        o['shot'][s] = dict(iou=float(np.mean([x['iou'] for x in t])), ratio=float(np.mean([x['ours'] / max(1, x['sample']) for x in t])),
                            ours=[x['ours'] for x in t], sample=[x['sample'] for x in t])
    for s, (fr, k) in FIGFR.items():
        B = np.zeros((18, 32))
        for f in fr:
            B += (role('%s/%03d.png' % (d, f)).sum(-1) > 30).reshape(18, 10, 32, 10).mean((1, 3))
        B /= len(fr); T = np.array(FIG[k])
        o['shot'][s]['figure'] = float(np.minimum(B, T).sum() / np.maximum(B, T).sum())
        o['shot'][s]['figure_area'] = float(B.mean()); o['shot'][s]['figure_area_sample'] = float(T.mean())
    return o

if __name__ == '__main__':
    for d in sys.argv[1:]:
        o = measure(d); print('==', d)
        for s, e in o['shot'].items():
            print('  %s  head IoU %.3f  ours/sample %.2f  %s' % (s, e['iou'], e['ratio'], ('figure IoU %.3f  area %.3f (sample %.3f)' % (e['figure'], e['figure_area'], e['figure_area_sample'])) if 'figure' in e else ''))
        print('  IoU per frame:   ' +' '.join('%.2f' % o['image'][f]['iou'] for f in range(22)))
        print('  ours px:         ' + ' '.join('%d' % o['image'][f]['ours'] for f in range(22)))
        print('  sample px:       ' + ' '.join('%d' % o['image'][f]['sample'] for f in range(22)))
        json.dump(o, open(d.rstrip('/') + '_hood7.json', 'w'), indent=1)
