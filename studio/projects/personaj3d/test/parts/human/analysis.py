"""HUMAN MARKS -- analysis (pass 11).
  python3 test/parts/human/analysis.py INFO.json MARKS.json [--json OUT.json]
    INFO.json  -- the data prepare.py wrote (what went into the page): the sample frames, Claude's measurement, where our
                  model is
    MARKS.json -- from the page: the "JSON copy" ({marks,notes,motion}) or the db documents (a list / {id: body})
  python3 test/parts/human/analysis.py --calibrate INFO.json   -- check the tool itself with synthetic marks

Only the SAMPLE frames are marked (Alonur: a half-done model has no "right place"). All 320x180, pixel centre = integer.
  1. REPEAT: R12 and R13 -- the same drawing (mean difference 0.32 in the face box): distance d between the two answers,
     E[d^2] = 4 sigma^2.
  2. DETECTOR: person - Claude, raw (the hand offset is not measured: the difference also contains the difference in
     definitions). A distance over 3 sigma (at least 2 px) -- CHECK: see on the sheet who measured what (the person can be
     wrong too). The mean per shot is given as well: if everything in one shot shifts to one side -- the detector may be
     measuring something else in that shot (a median cannot hide it: 6 of the 8 frames are in shots 2-3).
  3. DIFFERENCE: our model - the sample, two ways: by the person's point and by Claude's measurement. If the two are
     close -- the difference is real; if far apart -- see point 2.
  4. NEW: parts the person marked that Claude did not find -- the difference by the person only."""
import json, math, sys, random

POINT = ('chin', 'nose', 'eye_near', 'eye_far')
LINE = ('mouth', 'brow_near', 'brow_far')
SHOT = lambda k: 1 if k <= 11 else 2 if k <= 13 else 3


def mid_line(pts):
    """The middle of a polyline, by length."""
    seg = [math.dist(pts[i - 1], pts[i]) for i in range(1, len(pts))]
    L = sum(seg)
    if not L: return list(pts[0])
    h = L / 2
    for i, s in enumerate(seg):
        if h <= s:
            t = h / s if s else 0
            return [pts[i][0] + t * (pts[i + 1][0] - pts[i][0]), pts[i][1] + t * (pts[i + 1][1] - pts[i][1])]
        h -= s
    return list(pts[-1])


def prof_y(prof, x):
    """Profile (y at integer columns) -- linear interpolation at x; None if a column is missing."""
    a, b = math.floor(x), math.ceil(x)
    if str(a) not in prof or str(b) not in prof: return None
    return prof[str(a)] if a == b else prof[str(a)] + (x - a) * (prof[str(b)] - prof[str(a)])


def jaw_points(pts, prof):
    """The person's jaw points (the vertices) - the profile, only where the person CLICKED: the straight line between points
    cuts across the curved jaw and adds its own error (up to 0.9 px in the synthetic test) -- hence the vertices only."""
    d = [y - prof_y(prof, x) for x, y in pts if prof_y(prof, x) is not None]
    if len(d) < 2: return None
    return {'mean': sum(d) / len(d), 'abs': sum(map(abs, d)) / len(d), 'max': max(d, key=abs), 'n': len(d)}


def prof_diff(a, b):
    """Two profiles (a - b), the mean over their shared columns."""
    d = [a[x] - b[x] for x in a if x in b]
    return sum(d) / len(d) if len(d) >= 3 else None


def point(q, v):
    """One comparable point from a mark: a point question -- the point itself; mouth/brow -- the middle of the line."""
    if not v or v.get('absent'): return None
    if 'x' in v: return [v['x'], v['y']]
    if v.get('pts') and len(v['pts']) >= 2: return mid_line(v['pts'])
    return None


def get_marks(obj):
    """The page copy or the db documents -> {frame_id: mark}, {frame_id: note}, motion."""
    if isinstance(obj, dict) and 'marks' in obj:
        return obj['marks'], obj.get('notes', {}), obj.get('motion')
    docs = obj if isinstance(obj, list) else [{'id': k, 'data': v} for k, v in obj.items()]
    marks, notes, each = {}, {}, None
    for d in docs:
        i, b = d.get('id') or d.get('doc_id'), d.get('data') or d.get('body') or d
        i = str(i).split('/')[-1]
        if i == 'motion': each = b; continue
        if 'mark' in b: marks[i] = b['mark']; notes[i] = b.get('note', '')
    return marks, notes, each


def analysis(M, marks):
    K = {f['id']: f for f in M['frames']}
    out = {'repeat': {}, 'detector': {}, 'shot': {}, 'diff': {}, 'fresh': {}, 'jaw': {}}
    a, b = M['repeat']
    for q in POINT + LINE:
        pa, pb = point(q, marks.get(a, {}).get(q)), point(q, marks.get(b, {}).get(q))
        if pa and pb: out['repeat'][q] = round(math.dist(pa, pb), 2)
    t = [v for q, v in out['repeat'].items() if q in POINT]       # point questions only: a line's middle depends on the drawn
    sigma = math.sqrt(sum(v * v for v in t) / len(t) / 4) if t else None   # length (brow 5 px), not on click noise
    out['one_click_sigma'] = round(sigma, 2) if sigma else None
    threshold = max(2.0, 3.0 * (sigma or 0.7))          # Rayleigh: r > 3 sigma -- 1% probability
    out['threshold_px'] = round(threshold, 2)
    collect = {}
    for fid, f in K.items():
        if fid not in marks: continue
        m, c, bz = marks[fid], f['claude'], f['ours']
        for q in POINT + LINE:
            p = point(q, m.get(q))
            if p is None: continue
            gh = [round(bz[q][0] - p[0], 2), round(bz[q][1] - p[1], 2)] if q in bz else None
            if q in c:
                d = [p[0] - c[q][0], p[1] - c[q][1]]
                out['detector'].setdefault(fid, {})[q] = {'diff': [round(d[0], 2), round(d[1], 2)], 'distance': round(math.hypot(*d), 2),
                                                          'check': math.hypot(*d) > threshold}
                collect.setdefault((SHOT(f['k']), q), []).append(d)
                gc = [round(bz[q][0] - c[q][0], 2), round(bz[q][1] - c[q][1], 2)] if q in bz else None
                out['diff'].setdefault(fid, {})[q] = {'person': gh, 'claude': gc}
            else:
                out['fresh'].setdefault(fid, {})[q] = {'person_point': [round(p[0], 2), round(p[1], 2)], 'ours_minus_person': gh,
                                                       'visible_in_ours': f.get('view_ours', {}).get(q)}
        jv = m.get('jaw') or {}
        if jv.get('pts'):
            r = {}
            if c.get('jaw'): r['person_minus_claude'] = jaw_points(jv['pts'], c['jaw'])
            if bz.get('jaw'):
                j = jaw_points(jv['pts'], bz['jaw'])
                r['ours_minus_person'] = round(-j['mean'], 2) if j else None
                if c.get('jaw'):                                  # on exactly the columns the person clicked -- so the two differences compare
                    d = [prof_y(bz['jaw'], x) - prof_y(c['jaw'], x) for x, _ in jv['pts']
                         if prof_y(bz['jaw'], x) is not None and prof_y(c['jaw'], x) is not None]
                    r['ours_minus_claude'] = round(sum(d) / len(d), 2) if len(d) >= 2 else None
            out['jaw'][fid] = r
    for (s, q), L in collect.items():
        n = len(L)
        out['shot'].setdefault(f'{s}-shot', {})[q] = {'n': n, 'mean': [round(sum(x for x, _ in L) / n, 2), round(sum(y for _, y in L) / n, 2)]}
    return out


def text(o):
    f = lambda v: '—' if v is None else f"({v[0]:+.1f},{v[1]:+.1f})"
    L = [f"== REPEAT (the same drawing twice): " + ', '.join(f"{q} {d:.2f}" for q, d in o['repeat'].items()) +
         f"  -> one-click sigma ~ {o['one_click_sigma']}, check threshold {o['threshold_px']} px"]
    L.append("== DETECTOR (person - Claude, raw)")
    for fid, r in o['detector'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['diff'])} {v['distance']:.1f}{' <- CHECK' if v['check'] else ''}" for q, v in r.items()))
    L.append("== MEAN PER SHOT (person - Claude)")
    for s, r in sorted(o['shot'].items()):
        L.append(f"  {s}: " + '  '.join(f"{q} n={v['n']} {f(v['mean'])}" for q, v in r.items()))
    L.append("== DIFFERENCE (ours - sample): by the person / by Claude")
    for fid, r in o['diff'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['person'])}/{f(v['claude'])}" for q, v in r.items()))
    L.append("== JAW")
    for fid, r in o['jaw'].items():
        j = r.get('person_minus_claude')
        L.append(f"  {fid}: person-Claude " + ('—' if not j else f"mean {j['mean']:+.1f} |mean| {j['abs']:.1f} max {j['max']:+.1f} ({j['n']} point)") +
                 f"   ours-sample: by the person {r.get('ours_minus_person')}, by Claude {r.get('ours_minus_claude')}")
    L.append("== NEW (marked by the person, not found by Claude): ours - person")
    for fid, r in o['fresh'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['ours_minus_person'])}{'' if v['visible_in_ours'] is not False else ' (hidden in ours)'}" for q, v in r.items()))
    return '\n'.join(L)


def calibrate():
    """Synthetic: person = Claude + (0.8,-0.4) + N(0,0.6); R13 -- an independent repeat of R12; the R17 chin 8 px above
    Claude's (a broken case); the jaw points exactly 3 px below the profile. Known answers:
    sigma ~ 0.6; only the R17 chin gets CHECK; jaw person-Claude = +3.0; diff(person) = diff(Claude) - (0.8,-0.4)."""
    M = json.load(open(sys.argv[sys.argv.index('--calibrate') + 1]))
    rnd = random.Random(7); B = (0.8, -0.4); S = 0.6
    nz = lambda: rnd.gauss(0, S)
    marks = {}
    for f in M['frames']:
        c, m = f['claude'], {}
        for q in POINT:
            if q in c: m[q] = {'x': c[q][0] + B[0] + nz(), 'y': c[q][1] + B[1] + nz()}
        for q in LINE:
            if q in c:
                y = c[q][1] + B[1]
                m[q] = {'pts': [[c[q][0] - 3 + B[0], y], [c[q][0] + 3 + B[0], y]]}     # its middle is exactly Claude + B
        if c.get('jaw'):
            xs = sorted(map(int, c['jaw'])); sel = xs[::max(1, len(xs) // 4)] + [xs[-1]]
            m['jaw'] = {'pts': [[x, c['jaw'][str(x)] + 3.0] for x in sel]}
        marks[f['id']] = m
    marks['R17']['chin']['y'] -= 8.0
    o = analysis(M, marks)
    print(text(o))
    ok = [o['one_click_sigma'] is not None and abs(o['one_click_sigma'] - S) < 0.35,
          o['detector']['R17']['chin']['check'],
          sum(v['check'] for r in o['detector'].values() for v in r.values()) == 1,
          all(r.get('person_minus_claude') and abs(r['person_minus_claude']['mean'] - 3.0) < 0.05 for r in o['jaw'].values()),
          all(r['ours_minus_claude'] is None or abs(r['ours_minus_claude'] - r['ours_minus_person'] - 3.0) < 0.05 for r in o['jaw'].values())]
    d = [(v['person'][0] - v['claude'][0], v['person'][1] - v['claude'][1]) for fid, r in o['diff'].items() if fid != 'R17'
         for q, v in r.items() if v['person'] and v['claude'] and q in ('mouth',)]     # a line's middle has no noise: exactly -B
    ok.append(bool(d) and all(abs(x + B[0]) < 0.01 and abs(y + B[1]) < 0.01 for x, y in d))
    print('CALIBRATION:', 'PROVEN' if all(ok) else 'UNPROVEN', ok)


if __name__ == '__main__':
    if '--calibrate' in sys.argv: calibrate(); sys.exit()
    M = json.load(open(sys.argv[1])); marks, notes, each = get_marks(json.load(open(sys.argv[2])))
    o = analysis(M, marks); o['note'] = notes; o['motion'] = each
    print(text(o)); print('== MOTION:', each); print('== NOTES:',{k: v for k, v in notes.items() if v})
    if '--json' in sys.argv: json.dump(o, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
