"""PARTS COMPARISON (pass 10): the sample and ours -- every part, every frame, the same code (test/parts/part_measure.py).
  Ours in two states: DRESSED (anime render: hair and hood on -- the parts visible as in the sample) and BARE (role
  render, hair/hood/cloak hidden -- the head's own silhouette: contour, under the jaw, chin, nose tip) + exact
  points from 3D (test/parts/ours_TAG.json). Which source is used per part:
    eye, mouth, lip shadow -- the sample and the dressed render, the very same blob rule (when visible in both); when ours is
      under the hair -- exact point + calibration offset (test/parts/calibrate.py: how far the blob centre is from the exact point) -- marked;
    brow -- ours is almost always under the hair: exact point (middle of the brow line, calibration offset 0) -- marked;
    chin tip, nose tip, under the jaw, contour -- the sample and our BARE silhouette (the same scan).
  Distances (px, since the camera is the same): eye -> mouth, mouth -> chin, eye -> chin (vertical), back part of the under-jaw line.
python3 test/parts/part_compare.py TAG   -> private/test/parts/compare_TAG.json, table"""
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
EXACT = json.load(open('%s/test/parts/ours_%s.json' % (R, TAG)))
CAL = json.load(open('%s/test/parts/calibrate_%s.json' % (R, TAG))) if __import__('os').path.exists('%s/test/parts/calibrate_%s.json' % (R, TAG)) else {}
AGREE = {'eye_near': 'eye_near', 'eye_far': 'eye_far', 'brow_near': 'brow_near_mid', 'brow_far': 'brow_far_mid', 'mouth': 'mouth', 'lip': 'lip_shadow'}
def xy(v): return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))
def shot(k): return 1 if k <= 11 else 2 if k <= 13 else 3

def main():
    out = {}
    for k in range(1, 23):
        m = Q.measure(Q.L320((SAMPLE_DIR + '/k%02d.png') % k), k)
        bk = Q.measure(Q.L320('%s/frames-sample/anime-%s/%03d.png' % (R, TAG, k - 1)), k)
        by = Q.measure(Q.role_L('%s/frames-part/role-bare-%s/%03d.png' % (R, TAG, k - 1)), k)
        rk = Q.role_mask('%s/frames-sample/role-%s/%03d.png' % (R, TAG, k - 1))
        A = EXACT[str(k - 1)]
        o = {}
        for q, qa in AGREE.items():
            mv = xy(m.get(q))
            if mv is None: continue
            a = A.get(qa); x, y = int(round(a[0])), int(round(a[1]))
            around = rk[max(0, y - 1):y + 2, max(0, x - 1):x + 2]
            view = bool((around == 'skin').sum() >= 5 and a[3])
            bv = xy(bk.get(q))
            if view and bv is not None and not q.startswith('brow') and abs(bv[0] - a[0]) < 6 and abs(bv[1] - a[1]) < 7:
                o[q] = {'sample': mv, 'ours': bv, 'source': 'dressed'}
            else:
                s = CAL.get(q, {}); dx, dy = (s.get('dx') or 0, s.get('dy') or 0) if not q.startswith('brow') else (0, 0)
                o[q] = {'sample': mv, 'ours': [round(a[0] + dx, 2), round(a[1] + dy, 2)], 'source': 'exact' + ('' if view else ' (under hair/hood)')}
        for q in ('chin_tip', 'nose_tip'):
            mv, bv = xy(m.get(q)), xy(by.get(q))
            if mv is not None and bv is not None: o[q] = {'sample': mv, 'ours': bv, 'source': "bare"}
        for q in ('jaw', 'contour'):
            mj, bj = m.get(q, {}), by.get(q, {})
            general = sorted(set(mj) & set(bj))
            if general: o[q] = {'sample': {i: mj[i] for i in general}, 'ours': {i: bj[i] for i in general}, 'diff': {i: bj[i] - mj[i] for i in general},
                             'only_sample': sorted(set(mj) - set(bj)), 'only_ours': sorted(set(bj) - set(mj)), 'source': "bare"}
        for q, v in o.items():
            if q not in ('jaw', 'contour'): v['diff'] = [round(v['ours'][0] - v['sample'][0], 2), round(v['ours'][1] - v['sample'][1], 2)]
        out[k] = o
    json.dump(out, open('%s/private/test/parts/compare_%s.json' % (R, TAG), 'w'))
    # table: per shot, per part -- mean difference (ours - sample), px 320x180
    for s in (1, 2, 3):
        ks = [k for k in out if shot(k) == s]
        print('== shot %d (frames %d-%d)' %(s, ks[0], ks[-1]))
        for q in ('eye_near', 'eye_far', 'brow_near', 'brow_far', 'nose_tip', 'mouth', 'lip', 'chin_tip'):
            v = [(k, out[k][q]) for k in ks if q in out[k]]
            if not v: print('  %-10s -- not found / not visible in the sample' % q); continue
            f = np.array([e['diff'] for _, e in v]); srcs = sorted(set(e['source'] for _, e in v))
            print('  %-10s %2d frames | diff x %+5.1f  y %+5.1f  (|max| %4.1f) | %s' % (q, len(v), f[:, 0].mean(), f[:, 1].mean(), np.abs(f).max(), ', '.join(srcs)))
        for q in ('jaw', 'contour'):
            v = [(k, out[k][q]) for k in ks if q in out[k]]
            if not v: continue
            f = np.concatenate([list(e['diff'].values()) for _, e in v])
            print('  %-10s %2d frames | %s diff mean %+5.1f, |mean| %4.1f, max %+5.1f / %+5.1f' % (q, len(v), 'vertical (y)' if q == 'jaw' else 'horizontal (x)',
                  f.mean(), np.abs(f).mean(), f.min(), f.max()))

main()
