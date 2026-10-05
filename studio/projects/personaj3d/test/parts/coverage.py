"""HAIR COVERAGE (pass 10, for the hair fit): over the sample's visible face (test/parts/part_measure.py face_mask -- skin + rim,
hair excluded), the share of hair (hair + inner hair) in our role render, on the given frames. The same definition as
test/parts/layer.py. python3 test/parts/coverage.py ROLE_FOLDER 1,5,9,10,12,13,16,20   (folder: %03d.png, 0-based)"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys, json
import numpy as np
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as Q
_F = {}
def F(k):
    if k not in _F: g, p = Q.params(k); _F[k] = Q.face_mask(Q.L320((SAMPLE_DIR + '/k%02d.png') % k), p)
    return _F[k]
def coverage(folder, ks):
    out = {}
    for k in ks:
        r = Q.role_mask('%s/%03d.png' % (folder, k - 1)); f = F(k)
        out[k] = float((f & np.isin(r, ['hair', 'hairInner'])).sum() / f.sum())
    return out
if __name__ == '__main__':
    print(json.dumps(coverage(sys.argv[1], [int(v) for v in sys.argv[2].split(',')])))
