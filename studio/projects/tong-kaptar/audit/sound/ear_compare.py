# The tagger's A/B: every EAR window of sound_check, read on two versions' mixed stems side by side,
# under the same rule (sound_check.ear_verdict). What the ear that is not mine hears, before and after.
#     python3 audit/sound/ear_compare.py [old_dir] [new_dir]   -> table + audit/sound/ear_compare.json
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import sys, os, json, warnings
warnings.filterwarnings('ignore')
import numpy as np
sys.path.insert(0, f'{ROOT}/audit/sound')
sys.path.insert(0, f'{ROOT}/sound')
from dsp import read_wav
from metrics import mono, rms_db, SR
import sound_check as SC
import ear

WINDOWS = [('s1 take-off wings', 'wings', 0.85, 1.8), ('s2 flock wings', 'wings', 4.31, 6.9), ('s3 slow wings', 'wings', 7.05, 9.7),
           ('s5 landing', 'land', 14.4, 16.4), ('s1 coo', 'coo', 0.06, 0.8), ('s2 coo', 'coo', 5.5, 6.6), ('s5 coo', 'coo', 19.5, 20.4),
           ('s1-s2 flag', 'flag', 0.6, 6.9), ('s4 rag circles', 'rag', 9.8, 11.2), ('s1-s2 town', 'amb', 0.6, 6.9), ('s5 town', 'amb', 16.5, 19.9),
           ('sparrows', 'sparrow', 0.6, 7.0), ('whistle', 'whistle', 11.75, 12.6), ('sigh', 'breath', 17.7, 19.4), ('throw clothes', 'foley', 0.4, 1.2),
           ('turn clothes', 'foley', 16.4, 17.6)]


def read(d, stem):
    x, sr = read_wav(f'{d}/{stem}.wav')
    return x


def verdict(x, stem, label, a, b):
    xs = mono(x)[int(a * SR):int(b * SR)]
    if rms_db(xs) < -70:
        return {'status': 'WARN', 'top': [], 'note': 'silent'}
    p = ear.tag(xs / (np.max(np.abs(xs)) + 1e-9) * 0.5, SR)
    st, best, worst, rank, order = SC.ear_verdict(p, SC.EXPECT[stem] + SC.EXTRA.get(label, []))
    return {'status': st, 'best': [best, round(float(p[best]), 3)], 'worst': [worst, round(float(p[worst]), 3)],
            'top': [[l, round(float(p[l]), 3)] for l in order[:4]]}


if __name__ == '__main__':
    old = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/sound/out/v2/mixed'
    new = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/sound/out/mixed'
    cache = {}
    rows = []
    for label, stem, a, b in WINDOWS:
        r = {'window': label, 'stem': stem, 't': [a, b]}
        for tag, d in (('old', old), ('new', new)):
            key = (d, stem)
            if key not in cache:
                cache[key] = read(d, stem)
            r[tag] = verdict(cache[key], stem, label, a, b)
        rows.append(r)
        fmt = lambda v: f"{v['status']:4s} " + ', '.join(f'{l.split(",")[0]} {q:.2f}' for l, q in v['top'][:3])
        print(f"{label:18s} | {fmt(r['old']):52s} | {fmt(r['new'])}")
    cnt = {t: {s: sum(1 for r in rows if r[t]['status'] == s) for s in ('PASS', 'WARN', 'FAIL')} for t in ('old', 'new')}
    print('old', cnt['old'], ' new', cnt['new'])
    json.dump({'old': old, 'new': new, 'rows': rows, 'counts': cnt}, open(f'{ROOT}/audit/sound/ear_compare.json', 'w'), indent=1)
