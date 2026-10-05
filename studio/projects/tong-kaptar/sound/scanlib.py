# Loads sound/scan.json (the probe over edit B) into per-source time series on the B clock.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import json, collections
import numpy as np

FPS = 24
NB = 504                     # frames in edit B
T_END = NB / FPS             # 21.0 s


def load(path=f'{ROOT}/sound/scan.json'):
    d = json.load(open(path))
    rows = d['rows']
    tb = np.array([r['fb'] for r in rows]) / FPS          # B time of each sample (s)
    shot = np.array([r['shot'] for r in rows])
    tw = np.array([r['tw'] for r in rows])
    lf = np.array([r['lf'] for r in rows])
    zoom = np.array([r.get('zoom', 1.0) for r in rows])
    fshot = np.array([r['f'] for r in rows])
    src = collections.OrderedDict()
    for k, r in enumerate(rows):
        for s in r['src']:
            e = src.setdefault(s['id'], {'kind': s['kind'], 'k': [], 'rows': []})
            e['k'].append(k)
            e['rows'].append(s)
    S = {}
    n = len(rows)
    for sid, e in src.items():
        keys = set()
        for s in e['rows']:
            keys.update(s.keys())
        o = {'kind': e['kind'], 'idx': np.array(e['k'])}
        for key in keys:
            if key in ('id', 'kind'):
                continue
            vals = [s.get(key) for s in e['rows']]
            if all(isinstance(v, (int, float)) or v is None for v in vals):
                a = np.full(n, np.nan)
                a[o['idx']] = [np.nan if v is None else v for v in vals]
                o[key] = a
            else:
                a = np.full(n, None, dtype=object)
                a[o['idx']] = vals
                o[key] = a
        S[sid] = o
    return {'tb': tb, 'shot': shot, 'tw': tw, 'lf': lf, 'zoom': zoom, 'f': fshot, 'src': S,
            'rag': d.get('rag'), 'sub': d['sub']}


SEGS = [('s1', 0, 91), ('whip', 91, 101), ('s2', 101, 168), ('s3', 168, 234), ('s4', 234, 324), ('s5', 324, 504)]


def seg_bounds(name):
    for n, a, b in SEGS:
        if n == name:
            return a / FPS, b / FPS
    raise KeyError(name)
