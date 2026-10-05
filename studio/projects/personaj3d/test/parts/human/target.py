"""TARGETS (pass 11): every part in every frame -- where it is in the sample (the target) and where our model has it, in
one table. Each side is measured by ITS OWN truth (the drawings differ: the same code on both sides does not cancel the
offset -- mouth: in the sample the black part is on the right, in ours on the left -> "the same code" gave a difference
5 px the wrong way):
  SAMPLE -- Alonur's mark if there is one (R12 and R13 are the same drawing -> their mean); otherwise the fixed detector
            (test/parts/part_measure.py; it passed test/parts/human/test_detector.py), with the definition difference
            measured against the person corrected (shot 1 mouth: the detector sees only the black part, +2.5 px right).
  OURS   -- eye, nose, mouth middle, brow middle: the 3D point (test/parts/ours_TAG.json, -0.5 to the pixel centre);
            chin and jaw: the very same detector on the silhouette of our BARE render (the same definition as the sample).
  python3 test/parts/human/target.py TAG   -> private/test/parts/human/target_TAG.json + table
PRIVATE: taken from the sample (the person's marks, the sample detector)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import json, math, sys, os
sys.path.insert(0, (P3D_DIR + '/test/parts'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import part_measure as Q
from analysis import point

R = (P3D_DIR)
H = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'private', 'test', 'parts', 'human'))   # the private marks and targets
TAG = sys.argv[1] if len(sys.argv) > 1 else 'head10c'
B = json.load(open(os.path.join(H, 'marks_alonur_1.json')))['marks']
OURS = json.load(open('%s/test/parts/ours_%s.json' % (R, TAG)))
CORR = {('mouth', 1): (-2.5, 0.0)}           # (part, shot): person - detector, measured (R03 -2.4, R10 -2.7)
APPROX_JAW = {'R22'}                     # Alonur: hidden by hair, the jaw is approximate -- the detector also took the hair edge
PART = {'eye_near': 'eye_near', 'eye_far': 'eye_far', 'nose': 'nose_tip', 'mouth': 'mouth', 'brow_near': 'brow_near_mid',
        'brow_far': 'brow_far_mid', 'chin': None}
DET = {'eye_near': 'eye_near', 'eye_far': 'eye_far', 'nose': 'nose_tip', 'mouth': 'mouth', 'brow_near': 'brow_near',
       'brow_far': 'brow_far', 'chin': 'chin_tip'}
shot = lambda k: 1 if k <= 11 else 2 if k <= 13 else 3


def xy(v):
    return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))


def person(k, q):
    ids = ['R12', 'R13'] if k in (12, 13) else ['R%02d' % k]
    p = [point(q, B[i].get(q)) for i in ids if i in B]
    p = [v for v in p if v]
    if not p: return None, any(B.get(i, {}).get(q, {}).get('absent') for i in ids)
    return [sum(v[0] for v in p) / len(p), sum(v[1] for v in p) / len(p)], False


def main():
    out = {}
    for k in range(1, 23):
        m = Q.measure(Q.L320((SAMPLE_DIR + '/k%02d.png') % k), k)
        by = Q.measure(Q.role_L('%s/frames-part/role-bare-%s/%03d.png' % (R, TAG, k - 1)), k)
        A = OURS[str(k - 1)]
        o = {}
        for q, a3 in PART.items():
            t, absent = person(k, q); source = 'person'
            if t is None and not absent:
                d = xy(m.get(DET[q]))
                if d is not None:
                    dx, dy = CORR.get((q, shot(k)), (0, 0)); t = [d[0] + dx, d[1] + dy]
                    source = 'detector' + ('+correction' if (q, shot(k)) in CORR else '')
            if q == 'chin': b = xy(by.get('chin_tip')); bm = "bare silhouette"
            else: b = [A[a3][0] - 0.5, A[a3][1] - 0.5]; bm = '3D' + ('' if A[a3][3] else ' (behind)')
            o[q] = {'sample': None if t is None else [round(t[0], 2), round(t[1], 2)], 'source': source if t else ('person: not visible' if absent else 'none'),
                    'ours': None if b is None else [round(b[0], 2), round(b[1], 2)], 'ours_source': bm}
            if t and b: o[q]['diff'] = [round(b[0] - t[0], 2), round(b[1] - t[1], 2)]
        mj = {int(x): y for x, y in m.get('jaw', {}).items()}; bj = {int(x): y for x, y in by.get('jaw', {}).items()}
        fid = 'R%02d' % k
        if fid in APPROX_JAW: mj = {}
        general = sorted(set(mj) & set(bj))
        o['jaw'] = {'sample': mj, 'ours': bj, 'diff': {x: bj[x] - mj[x] for x in general}, 'source': 'detector' if mj else "none (under the hair)"}
        out[k] = o
    json.dump(out, open(os.path.join(H, 'target_%s.json' % TAG), 'w'), ensure_ascii=False)
    for s in (1, 2, 3):
        ks = [k for k in out if shot(k) == s]
        print('== shot %d (frames %d-%d): ours - sample, px' % (s, ks[0], ks[-1]))
        for q in PART:
            v = [(k, out[k][q]) for k in ks if 'diff' in out[k][q]]
            if not v: print('  %-10s -- no target' % q); continue
            fx = [e['diff'][0] for _, e in v]; fy = [e['diff'][1] for _, e in v]
            srcs = sorted(set(e['source'] for _, e in v))
            print('  %-10s %2d frame | x %+6.1f  y %+6.1f | |mean| %5.1f | %s' % (q, len(v), sum(fx) / len(fx), sum(fy) / len(fy),
                  math.hypot(sum(fx) / len(fx), sum(fy) / len(fy)), ', '.join(srcs)))
        f = [d for k in ks for d in out[k]['jaw']['diff'].values()]
        if f: print('  %-10s %2d column | y mean %+5.1f | |y| %4.1f' % ('jaw',len(f), sum(f) / len(f), sum(map(abs, f)) / len(f)))


main()
