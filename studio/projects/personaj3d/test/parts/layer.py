"""LAYERS (pass 10): the user -- "on our own model, take the hair and the hood off and measure one by one, then put them
back and measure". What we have over the sample's VISIBLE FACE (test/parts/part_measure.py face_mask: skin + rim, hair excluded,
holes filled) -- in three layers: bare (head only), + hair, + hood and cloak (full). Per frame, role render
(320x180 NEAREST): what share of the sample's face is skin / hair / hood / other on ours; and the part of our visible skin
that lies outside the sample's face (excess, relative to the sample face area). python3 test/parts/layer.py TAG"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q
R = (P3D_DIR)
TAG = sys.argv[1] if len(sys.argv) > 1 else 'world9b'
LAYERS = [('bare', 'frames-part/role-bare-%s'), ('+ hair', 'frames-part/role-hair-%s'), ('+ hood (full)', 'frames-sample/role-%s')]
def shot(k): return 1 if k <= 11 else 2 if k <= 13 else 3
out = {}
for k in range(1, 23):
    L = Q.L320((SAMPLE_DIR + '/k%02d.png') % k); g, p = Q.params(k); F = Q.face_mask(L, p)
    x0, y0, x1, y1 = p['box']; B = np.zeros_like(F); B[y0:y1, x0:x1] = True
    n = F.sum(); o = {'face_px': int(n)}
    for nm, subdir in LAYERS:
        r = Q.role_mask('%s/%s/%03d.png' % (R, subdir % TAG, k - 1))
        skin = (r == 'skin') & B
        o[nm] = {'skin': float((F & (r == 'skin')).sum() / n), 'hair': float((F & np.isin(r, ['hair', 'hairInner'])).sum() / n),
                 'hood': float((F & np.isin(r, ['hood', 'hoodLining', 'hoodInner', 'cloak', 'cloakInner'])).sum() / n),
                 'excess': float((skin & ~F).sum() / n)}
    out[k] = o
json.dump(out, open('%s/test/parts/layer_%s.json' % (R, TAG), 'w'))
for s in (1, 2, 3):
    ks = [k for k in out if shot(k) == s]
    print('== shot %d: sample face mean %d px' %(s, np.mean([out[k]['face_px'] for k in ks])))
    for nm, _ in LAYERS:
        v = {c: np.mean([out[k][nm][c] for k in ks]) for c in ('skin', 'hair', 'hood', 'excess')}
        print('   %-22s on the sample face, ours: skin %4.0f%%  hair %4.0f%%  hood/cloak %4.0f%% | our skin outside the sample face %4.0f%%' % (nm, 100 * v['skin'], 100 * v['hair'], 100 * v['hood'], 100 * v['excess']))
