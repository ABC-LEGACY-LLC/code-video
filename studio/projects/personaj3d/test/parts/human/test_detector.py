"""DETECTOR TEST (pass 11): the sample detector (test/parts/part_measure.py) against Alonur's marks -- a permanent test set.
After every change to the detector: python3 test/parts/human/test_detector.py [MARKS.json] [--table]
Comparison (320x180, pixel centre = integer):
  chin, nose, eyes -- a point; mouth -- the detector centre vs the middle of the person's line; jaw -- the y difference
  from the detector profile at the points the person CLICKED (the R22 jaw is under the hair -- Alonur: approximate, not
  counted, only shown).
Thresholds: hand noise ~0.45 px (the R12 = R13 repeat); allowing for definition differences, 2.5 px for a point, 3.5 px in
x at the chin (the definition is vague along the flat lower edge), mean |dy| 2 px at the jaw. Brow -- only shown (the
person continues it under the hair).
PRIVATE: the marks are taken from the sample."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import json, math, sys, os
sys.path.insert(0, (P3D_DIR + '/test/parts'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import part_measure as Q
from analysis import point, prof_y

MARKS = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.json') else os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'private', 'test', 'parts', 'human'), 'marks_alonur_1.json')
B = json.load(open(MARKS))['marks']
APPROX_JAW = {'R22'}
KNOWN = {('R03', 'mouth'): "shot 1 mouth: the detector sees only the black part, the open continuation (L 54-57, face 59) is visible to the person",
         ('R10', 'mouth'): "shot 1 mouth: the same, +2.5 px to the right -- corrected in target.py"}
CH = {'point': 2.5, 'chin_x': 3.5, 'chin_y': 2.5, 'jaw': 2.0}


def xy(v):
    return None if v is None else ([v['x'], v['y']] if isinstance(v, dict) else list(v))


def test(measure=Q.measure):
    row, error = [], []
    for fid in sorted(B, key=lambda s: int(s[1:])):
        k = int(fid[1:]); m = B[fid]
        o = measure(Q.L320((SAMPLE_DIR + '/k%02d.png') % k), k)
        for q, dq in (('chin', 'chin_tip'), ('nose', 'nose_tip'), ('eye_near', 'eye_near'), ('eye_far', 'eye_far'),
                      ('mouth', 'mouth'), ('brow_near', 'brow_near')):
            h, d = point(q, m.get(q)), xy(o.get(dq))
            if h is None and d is None: continue
            if h is None: row.append((fid, q, None, d, 'person: not visible / not marked', q != 'brow_near')); continue
            if d is None: row.append((fid, q, h, None, 'detector did not find it', False)); continue
            dx, dy = h[0] - d[0], h[1] - d[1]
            if q == 'chin': ok = abs(dx) <= CH['chin_x'] and abs(dy) <= CH['chin_y']
            elif q == 'brow_near': ok = True
            else: ok = math.hypot(dx, dy) <= CH['point']
            row.append((fid, q, h, d, f'({dx:+5.1f},{dy:+5.1f}) {math.hypot(dx, dy):4.1f}', ok))
        jv = (m.get('jaw') or {}).get('pts')
        if jv and o.get('jaw'):
            prof = {str(x): y for x, y in o['jaw'].items()}
            d = [y - prof_y(prof, x) for x, y in jv if prof_y(prof, x) is not None]
            if len(d) >= 2:
                a = sum(map(abs, d)) / len(d)
                ok = fid in APPROX_JAW or a <= CH['jaw']
                row.append((fid, 'jaw', None, None, f'|dy| {a:4.1f} ({len(d)} point){" approximate" if fid in APPROX_JAW else ""}', ok))
            else:
                row.append((fid, 'jaw', None, None, f'shared columns: {len(d)}', False))
    for r in row:
        if not r[5] and r[3] is not None and (r[0], r[1]) not in KNOWN: error.append(r)      # ERROR -- the detector found it, but far from the person's
    return row, error                                        # not found -- coverage (the person's mark becomes the target), not an error


if __name__ == '__main__':
    row, error = test()
    missed = [r for r in row if r[3] is None and r[2] is not None]
    jaw_x = [r for r in row if r[1] == 'jaw' and not r[5]]
    for fid, q, h, d, s, ok in row:
        state = 'ok ' if ok else ('--  ' if d is None and q != 'jaw' else "known" if (fid, q) in KNOWN else 'ERROR')
        print(f"{fid} {q:10s} {state} {s}   person {None if h is None else [round(v, 1) for v in h]}  detector {None if d is None else [round(v, 1) for v in d]}")
    print(f"== ERROR (found, but far off): {len(error) + len(jaw_x)} -- " + ', '.join(f'{r[0]} {r[1]}' for r in error + jaw_x))
    print(f"== not found (the person's mark becomes the target): {len(missed)} -- "+ ', '.join(f'{r[0]} {r[1]}' for r in missed))
