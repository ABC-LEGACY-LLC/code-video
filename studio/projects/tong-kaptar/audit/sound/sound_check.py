# Tong · kaptar — the sound's automatic check. Run after every synth + mix:
#     python3 audit/sound/sound_check.py            -> table (PASS / WARN / FAIL) + audit/sound/check_report.json
# Each check answers a question a listener would ask, with a number and a threshold:
#   SYNC      is every accent within a frame of the first frame that shows its cause?        (event log)
#   BEAT      does the sound beat with the drawn wing: phase-folded depth, peak in the downstroke,
#             the envelope's rhythm at the drawn beat rate?                                    (scan + stems)
#   MOTOR     is there a fast tremolo on slow wings (the engine/helicopter reading)?          (stems)
#   EAR       what does an AudioSet tagger (EfficientAT mn40_as_ext, 527 classes, trained on 2 M
#             human-labelled clips) hear in each layer: what it should, or a vehicle, an owl, a clock?
#   MIX       per-shot level spread, relief, peak, whistle over landing, small speaker, mono, hiss.
#   CUTS      do the slow motion's cuts stop what belongs to the other world?
#   SILENCE   is the output digital silence with every layer muted?
# Every threshold is stated with the check; the tagger is not a human ear: its verdict is evidence, not
# proof (calibrated here on this film's own whistle, breath and sparrows, which it names correctly).
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import sys, os, json, warnings
warnings.filterwarnings('ignore')
import numpy as np
import scipy.signal as sg
sys.path.insert(0, f'{ROOT}/audit/sound')
sys.path.insert(0, f'{ROOT}/sound')
from metrics import flatness, env_db, rms_db, mono, SR
import scanlib
import mix as MX
import pyloudnorm as pyln

FPS = 24
OUT = f'{ROOT}/sound/out'
REPORT = []


def rec(group, name, value, status, detail=''):
    REPORT.append({'group': group, 'check': name, 'value': value, 'status': status, 'detail': detail})


def band_env(x, lo=300, hi=6000, rate=200):
    """energy envelope of x (mono) in a band, sampled at `rate` Hz (linear power)"""
    sos = sg.butter(4, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos')
    y = sg.sosfilt(sos, x) ** 2
    k = SR // rate
    n = len(y) // k
    return y[:n * k].reshape(n, k).mean(1)


# ------------------------------------------------------------------ SYNC
def check_sync(ev):
    bad = []
    n = 0
    for e in ev:
        if 't_vis' not in e:
            continue
        n += 1
        lag = e['t_vis'] - e['t']
        if abs(lag) > 1 / FPS + 1e-6:
            bad.append((e['layer'], e['name'], e['t'], round(lag * 1000, 1)))
    rec('SYNC', 'accents within one frame of their cause', f'{n - len(bad)}/{n}', 'PASS' if not bad else 'FAIL', str(bad[:5]))


# ------------------------------------------------------------------ BEAT
def beats(D, sid, t0, t1, modes=None):
    s = D['src'][sid]
    tb = D['tb']
    m = (tb >= t0) & (tb < t1) & np.isfinite(s['ph'])
    idx = np.where(m)[0]
    out = []
    for k0, k1 in zip(idx[:-1], idx[1:]):
        if k1 != k0 + 1 or D['shot'][k0] != D['shot'][k1]:
            continue
        a, b = s['ph'][k0], s['ph'][k1]
        if not b > a:
            continue
        if modes is not None and s['mode'][k0] not in modes:
            continue
        for nb in range(int(np.floor(a)) + 1, int(np.floor(b)) + 1):
            x = (nb - a) / (b - a)
            out.append((tb[k0] + x * (tb[k1] - tb[k0]), 1.0 / ((b - a) / (tb[k1] - tb[k0]))))
    return out


def check_beat(label, D, stem, sid, t0, t1, modes=None, lag=0.5 / FPS):
    """fold the stem's band energy on the drawn beats: depth (max/min of the mean profile, dB), where
    in the beat it peaks (0 = top of the upstroke; the downstroke is 0..0.58), and whether the
    envelope's strongest rhythm is the drawn beat rate"""
    bt = beats(D, sid, t0, t1, modes)
    if len(bt) < 2:
        rec('BEAT', label, 'n/a', 'WARN', 'fewer than 2 drawn beats')
        return
    x = mono(stem)
    env = band_env(x)
    rate = 200
    prof = np.zeros(40)
    cnt = 0
    for tb_, T in bt:
        ts = tb_ + lag + np.arange(40) / 40 * T
        ii = np.round(ts * rate).astype(int)
        if ii[-1] >= len(env):
            continue
        prof += env[ii]
        cnt += 1
    prof /= max(cnt, 1)
    prof = np.convolve(np.r_[prof[-2:], prof, prof[:2]], np.ones(5) / 5, 'valid')
    depth = 10 * np.log10(prof.max() / max(prof.min(), 1e-15))
    peak_ph = int(np.argmax(prof)) / 40
    # rhythm: the envelope's modulation spectrum over the window
    f_drawn = 1.0 / np.median([T for _, T in bt])
    seg = env[int(t0 * rate):int(t1 * rate)]
    seg = np.log(seg + seg.mean() * 1e-3)
    # (the slow trend taken out, over 1.5 beats: a burst that decays as the bird flies off is not a
    # rhythm, and read raw it outweighed the 6 Hz beat in the take-off, 0.63 Hz)
    k = max(3, int(1.5 * rate / f_drawn) | 1)
    seg = seg - np.convolve(seg, np.ones(k) / k, 'same')
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), 8192))
    ff = np.fft.rfftfreq(8192, 1 / rate)
    sel = (ff > 0.5 * f_drawn) & (ff < 2.5 * f_drawn)
    f_pk = ff[sel][np.argmax(F[sel])]
    prom = F[sel].max() / np.median(F[sel])
    hit = min(abs(f_pk - f_drawn), abs(f_pk - 2 * f_drawn)) / f_drawn < 0.15
    st = 'PASS' if depth >= 8 and peak_ph <= 0.62 and hit else 'WARN' if depth >= 5 else 'FAIL'
    rec('BEAT', label, f'depth {depth:.1f} dB, peak at {peak_ph:.2f} of the beat, rhythm {f_pk:.2f} Hz vs drawn {f_drawn:.2f} Hz (x{prom:.1f})', st,
        f'{cnt} beats folded; PASS: depth >= 8 dB, peak in the downstroke (<= 0.62), rhythm within 15 % of the drawn rate')
    return prof


# ------------------------------------------------------------------ MOTOR
def motor_index(x, t0, t1):
    """fast (8-40 Hz) against slow (0.3-8 Hz) modulation of the 300-6000 Hz band's log envelope, dB"""
    return _motor(mono(x)[int(t0 * SR):int(t1 * SR)])


def _motor(m):
    env = band_env(m)
    e = np.log(env + env.mean() * 1e-3)
    e = e - e.mean()
    F = np.abs(np.fft.rfft(e * np.hanning(len(e)), 8192)) ** 2
    ff = np.fft.rfftfreq(8192, 1 / 200)
    return 10 * np.log10(F[(ff >= 8) & (ff < 40)].sum() / F[(ff >= 0.3) & (ff < 8)].sum())


def surrogate(m, rng, am=None, smooth=4.0):
    """the same spectrum and the same slow envelope (under `smooth` Hz), with no fast structure of its
    own: Gaussian noise of m's power spectrum (random phases), times m's envelope smoothed"""
    X = np.fft.rfft(m)
    y = np.fft.irfft(np.abs(X) * np.exp(2j * np.pi * rng.uniform(size=len(X))), len(m))
    env = np.sqrt(band_env(m) + 1e-20)
    b, a = sg.butter(2, smooth / 100, 'low')
    env = np.maximum(sg.filtfilt(b, a, env), 0) + 1e-12
    k = SR // 200
    envs = np.interp(np.arange(len(m)) / k, np.arange(len(env)), env)
    y = y / (np.std(y) + 1e-12) * envs
    if am is not None:
        y = y * am(np.arange(len(m)) / SR)
    return y


def motor_excess(x, t0, t1, n=20, smooth=4.0):
    """How much tremolo the passage's fast modulation amounts to. A noise's own bandwidth and grain
    shake its envelope, so the raw index is read against surrogates of the passage itself (its
    spectrum, its envelope under `smooth` Hz, nothing else) and against the same surrogates with an
    11 Hz tremolo of 5, 10, 15 and 20 % laid on: the passage's excess over its surrogates is given as
    the tremolo depth that would add as much. (A tremolo on a noise is at the edge of hearing at 5-6 %,
    Viemeister 1979, JASA 66:1364.) Earlier forms: a fixed white-noise calibration, biased against any
    band-limited sound; then a pass line halfway to a 40 % tremolo, which let 15 % through; then the
    surrogates' mean + 2 SD, which fails any grain that is not Gaussian (shot 3's slow whoosh measured
    the same with its feather ticks removed): each found wanting, the second and third by a fresh eye."""
    m = mono(x)[int(t0 * SR):int(t1 * SR)]
    rng = np.random.default_rng(5)
    base = np.array([_motor(surrogate(m, rng, smooth=smooth)) for _ in range(n)])
    depths = [0.0, 0.05, 0.1, 0.15, 0.2]
    curve = [base.mean()] + [np.mean([_motor(surrogate(m, rng, (lambda t, d=d: 1 + d * np.sin(2 * np.pi * 11 * t)), smooth)) for _ in range(n)])
                             for d in depths[1:]]
    raw = _motor(m)
    eq = float(np.interp(raw, curve, depths, left=0.0, right=np.nan))
    if not np.isfinite(eq):         # beyond 20 %: extrapolate on the last step
        eq = 0.2 + 0.05 * (raw - curve[-1]) / max(curve[-1] - curve[-2], 1e-6)
    return raw, base.mean(), base.std(), curve, eq


# ------------------------------------------------------------------ EAR
EXPECT = {
    'wings': ['Bird flight, flapping wings', 'Flap', 'Bird', 'Pigeon, dove', 'Whoosh, swoosh, swish', 'Rustle'],
    'land': ['Bird flight, flapping wings', 'Flap', 'Bird', 'Pigeon, dove', 'Whoosh, swoosh, swish', 'Rustle', 'Tap', 'Thump, thud'],
    'coo': ['Pigeon, dove', 'Coo', 'Bird', 'Bird vocalization, bird call, bird song'],
    'flag': ['Flap', 'Rustle', 'Wind', 'Rustling leaves', 'Whoosh, swoosh, swish'],
    'rag': ['Flap', 'Rustle', 'Whoosh, swoosh, swish', 'Wind'],
    'amb': ['Outside, urban or manmade', 'Traffic noise, roadway noise', 'Vehicle', 'Outside, rural or natural', 'Environmental noise', 'Wind', 'Car'],
    'sparrow': ['Bird', 'Chirp, tweet', 'Bird vocalization, bird call, bird song'],
    'whistle': ['Whistle', 'Whistling'],
    'breath': ['Breathing', 'Sigh'],
    'foley': ['Rustle'],
}
# (per window, what a listener would also accept: a pigeon's take-off is 'a clatter of wings')
EXTRA = {'s1 take-off wings': ['Clatter']}
# never counted either way: the tagger's catch-alls and the room
# (and the ontology's broad parents, which a right reading and a wrong one share: 'Animal' is the root of
# every animal class, so a coo read as 'Animal, cat' is a cat; counted right, it let that pass, and
# counting breathing's own children right hid a sigh read as a snort, found by a fresh eye)
NEUTRAL = ['Sound effect', 'Silence', 'Echo', 'Reverberation', 'Outside, rural or natural', 'Outside, urban or manmade', 'Environmental noise',
           'Domestic animals, pets', 'Wind noise (microphone)', 'Inside, small room', 'Inside, large room or hall', 'Animal', 'Wild animals',
           'Livestock, farm animals, working animals', 'Snort', 'Gasp', 'Pant', 'Wheeze']
RIGHT_MIN = 0.10
WRONG_MIN = 0.10


def ear_verdict(p, right):
    """every class that is neither right nor neutral is a wrong reading. PASS: a right class in the
    tagger's top 3, at least 0.10 (under it the tagger is guessing, its own word) and above every wrong
    one. FAIL: a confident wrong reading, a wrong class at >= 0.10 and at least twice the best right
    one. WARN: neither (the tagger is not saying anything definite).
    Calibrated on this film's own sounds: its whistle, breath and sparrows are named right at
    0.23..0.83, above every wrong class; v2's coo, flock, town, flag and rag drew wrong readings of
    0.13..0.42 (theremin, vehicle, eruption, chop, music). Under 0.10 the tagger is guessing; its
    'Bird flight, flapping wings' never rose above 0.01 for any wing sound synthesized here, so wings
    can be cleared of wrong readings, not certified right."""
    from helpers.utils import labels
    order = sorted(labels, key=lambda l: -p[l])
    wrong = [l for l in order if l not in right and l not in NEUTRAL]
    rank = min(order.index(l) for l in right)
    best = max(right, key=lambda l: p[l])
    worst = wrong[0]
    if rank < 3 and p[best] >= RIGHT_MIN and p[best] > p[worst]:
        st = 'PASS'
    elif p[worst] >= WRONG_MIN and p[worst] >= 2 * p[best]:
        st = 'FAIL'
    else:
        st = 'WARN'
    return st, best, worst, rank, order


def check_ear(label, stem_name, x, t0, t1):
    import ear
    xs = mono(x)[int(t0 * SR):int(t1 * SR)]
    if rms_db(xs) < -70:
        rec('EAR', label, 'silent', 'WARN')
        return
    xs = xs / (np.max(np.abs(xs)) + 1e-9) * 0.5
    p = ear.tag(xs, SR)
    st, best, worst, rank, order = ear_verdict(p, EXPECT[stem_name] + EXTRA.get(label, []))
    rec('EAR', label, f'best right: {best} {p[best]:.2f} (rank {rank + 1}); worst wrong: {worst} {p[worst]:.2f}', st,
        'heard as: ' + ', '.join(f'{l} {p[l]:.2f}' for l in order[:5]))
    EAR_TOP[label] = [(l, round(float(p[l]), 3)) for l in order[:6]]


EAR_TOP = {}


# ------------------------------------------------------------------ MIX
def check_mix(mix, stems):
    WIN = {'s1': (0.6, 3.69), 's2': (4.31, 6.9), 's3': (7.1, 9.65), 's4': (9.85, 13.4), 's5': (13.6, 19.9)}
    rms = {}
    for s, (a, b) in WIN.items():
        x = mix[:, int(a * SR):int(b * SR)]
        rms[s] = rms_db(mono(x))
        e = env_db(x, SR)
        rel = np.percentile(e, 97) - np.percentile(e, 35)
        rec('MIX', f'{s} relief (97th - 35th pct of 30 ms)', f'{rel:.1f} dB', 'PASS' if rel >= 5 else 'FAIL', '>= 5 dB: something happens')
        sos = sg.butter(4, 450 / (SR / 2), 'high', output='sos')
        h = sg.sosfilt(sos, x, axis=-1)
        loss = rms_db(mono(x)) - rms_db(mono(h))
        rec('MIX', f'{s} phone speaker loss (HP 450 Hz, 4th order)', f'{loss:.1f} dB', 'PASS' if loss <= 6 else 'WARN', '<= 6 dB')
        L, R = x[0], x[1]
        mc = 20 * np.log10(np.sqrt(np.mean(((L + R) / 2) ** 2)) / np.sqrt(0.5 * (np.mean(L ** 2) + np.mean(R ** 2))) + 1e-12)
        rec('MIX', f'{s} mono fold-down', f'{mc:.1f} dB', 'PASS' if mc >= -3 else 'FAIL', '>= -3 dB: nothing cancels')
    spread = max(rms.values()) - min(rms.values())
    rec('MIX', 'RMS spread across shots', f'{spread:.1f} dB ' + ' '.join(f'{k} {v:.1f}' for k, v in rms.items()),
        'PASS' if spread <= 9 else 'WARN' if spread <= 12 else 'FAIL', '4..9 dB')
    pk = 20 * np.log10(np.max(np.abs(mix)))
    rec('MIX', 'sample peak', f'{pk:.2f} dBFS', 'PASS' if pk <= -0.99 else 'FAIL', '<= -1 dBFS')
    meter = pyln.Meter(SR)
    rec('MIX', 'integrated loudness', f'{meter.integrated_loudness(mix.T):.1f} LUFS', 'PASS')
    mm = pyln.Meter(SR, block_size=0.4)

    def mom(a, b):
        v = [mm.integrated_loudness(mix[:, int(t * SR):int((t + 0.4) * SR)].T) for t in np.arange(a, b - 0.4 + 1e-9, 0.1)]
        v = [q for q in v if np.isfinite(q)]
        return max(v)
    w, l = mom(11.75, 12.6), mom(14.5, 16.4)
    rec('MIX', 'whistle over landing (momentary max)', f'{w - l:.1f} LU ({w:.1f} vs {l:.1f})', 'PASS' if w - l >= 6 else 'FAIL', '>= 6 LU: the loudest real sound is the loudest')
    # the bed: what is continuous in the shot, whatever its layer (a layer whose 30 ms level swings less
    # than 12 dB between its 35th and 97th percentiles has no envelope the ear follows; a flat one of
    # those is heard as hiss). Shot 3's slow wings swing 16 dB: an event there, not a bed.
    ACC = {'whistle', 'breath', 'coo', 'land', 'whip', 'foley', 'sparrow'}
    for s, (a, b) in {'s1 (after take-off)': (1.8, 3.69), 's2': (4.31, 6.9), 's3': (7.1, 9.65), 's4': (9.85, 13.4), 's5': (13.6, 19.9)}.items():
        parts = []
        for k, x in stems.items():
            if k in ACC:
                continue
            w = x[:, int(a * SR):int(b * SR)]
            if rms_db(mono(w)) < -75:
                continue
            e = env_db(w, SR)
            if np.percentile(e, 97) - np.percentile(e, 35) < 12:
                parts.append(k)
        bed = sum(stems[k][:, int(a * SR):int(b * SR)] for k in parts)
        f = flatness(mono(bed), SR)
        rec('MIX', f'{s} bed hiss (flatness of the continuous layers)', f'{f:.3f} ({"+".join(parts)})', 'PASS' if f <= 0.12 else 'FAIL', '<= 0.12')
        # (v2 was judged with every non-accent layer counted as bed, events included: shown too, so the
        # change of definition hides nothing)
        allbed = sum(x[:, int(a * SR):int(b * SR)] for k, x in stems.items() if k not in ACC)
        rec('INFO', f'{s} flatness of every non-accent layer (v2 definition)', f'{flatness(mono(allbed), SR):.3f}', 'INFO')


def check_cuts(stems):
    for cut, stem_list, label in [(7.0, ['wings', 'air', 'amb', 'sparrow', 'flag', 'coo'], 'into the slow motion'), (9.75, ['wings'], 'out of the slow motion')]:
        x = sum(stems[k] for k in stem_list)
        before = rms_db(mono(x[:, int((cut - 0.06) * SR):int((cut - 0.01) * SR)]))
        after = rms_db(mono(x[:, int((cut + 0.02) * SR):int((cut + 0.07) * SR)]))
        # (into s3: the world's own sounds must fall; out of it: the slow wings must stop)
        rec('CUTS', f'{label} at {cut} s ({"+".join(stem_list)})', f'{before - after:.1f} dB drop', 'PASS' if before - after >= 12 else 'FAIL', '>= 12 dB within 20 ms of the cut')


def check_cut_edges(mix):
    """nothing jumps in the last 20 ms before a cut: the level there within 3 dB of the 100 ms before it
    (a ride that doubled over 10 ms before the slow motion hid in the gap the CUTS windows leave)"""
    for cut in (91 / 24, 101 / 24, 7.0, 9.75, 13.5):
        last = rms_db(mono(mix[:, int((cut - 0.02) * SR):int(cut * SR)]))
        prev = rms_db(mono(mix[:, int((cut - 0.12) * SR):int((cut - 0.02) * SR)]))
        rec('CUTS', f'no jump in the last 20 ms before the cut at {cut:.2f} s', f'{last - prev:+.1f} dB', 'PASS' if last - prev <= 3 else 'FAIL', '<= +3 dB')


def main():
    mix, stems, _ = MX.mixdown()
    D = scanlib.load()
    ev = json.load(open(OUT + '/events.json'))['events']
    check_sync(ev)
    white = next(k for k, v in D['src'].items() if v['kind'] == 'lander' and np.nanmax(v['b']) < 0)
    check_beat('s1 take-off: the thrown pigeon', D, stems['wings'], 'H', 0.9, 2.45)
    check_beat('s3 slow motion: the thrown pigeon', D, stems['wings'], 'H', 7.0, 9.75)
    # (the rhythm here is the crowd's: eight other birds brake at 6.9..8.2 Hz in the same second as the
    # white one's 8.4 Hz, all in the one 'land' stem; its own binding is the fold's depth and phase)
    check_beat('s5 the white one braking', D, stems['land'], white, 15.2, 16.2, modes=('brake',))
    # (shot 3's slow beats keep their envelope under 4 Hz; shot 2's flock beats at 6 Hz, so its
    # surrogates keep the envelope under 14 Hz and the check asks about what is faster than that)
    for s_, (a, b), st, sm in [('s3 slow wings', (7.05, 9.7), 'wings', 4.0), ('s2 flock wings', (4.31, 6.9), 'wings', 14.0)]:
        raw, mu, sd, curve, eq = motor_excess(stems[st], a, b, smooth=sm)
        rec('MOTOR', f'{s_}: fast modulation (8-40 Hz vs 0.3-8 Hz of the envelope)',
            f'{raw:.1f} dB, {raw - mu:+.1f} dB over its own noise ({mu:.1f} +- {sd:.1f}): as much as a {100 * eq:.0f} % tremolo',
            # (a finding needs both size and significance: shot 2's 6 Hz flock cannot tell a tremolo under
            # about 15 % from its own noise, so there an excess within 2 SD of its surrogates passes)
            'PASS' if (eq < 0.10 or raw - mu <= 2 * sd) else 'WARN' if eq < 0.15 else 'FAIL',
            f'PASS under 10 % or within 2 SD of its own noise; FAIL from 15 %; 5/10/15/20 % tremolos on its own noise: '
            + ' / '.join(f'{c:.1f}' for c in curve[1:]) + ' dB')
    for label, stem, a, b in [('s1 take-off wings', 'wings', 0.85, 1.8), ('s2 flock wings', 'wings', 4.31, 6.9), ('s3 slow wings', 'wings', 7.05, 9.7),
                              ('s5 landing', 'land', 14.4, 16.4), ('s1 coo', 'coo', 0.06, 0.8), ('s2 coo', 'coo', 5.5, 6.6), ('s5 coo', 'coo', 19.5, 20.4),
                              ('s1-s2 flag', 'flag', 0.6, 6.9), ('s4 rag circles', 'rag', 9.8, 11.2), ('s1-s2 town', 'amb', 0.6, 6.9), ('s5 town', 'amb', 16.5, 19.9),
                              ('sparrows', 'sparrow', 0.6, 7.0), ('whistle', 'whistle', 11.75, 12.6), ('sigh', 'breath', 17.7, 19.4), ('throw clothes', 'foley', 0.4, 1.2),
                              ('turn clothes', 'foley', 16.4, 17.6)]:
        check_ear(label, stem, stems[stem], a, b)
    check_mix(mix, stems)
    check_cuts(stems)
    check_cut_edges(mix)
    z, _, _ = MX.mixdown(mute=tuple(stems.keys()))
    rec('SILENCE', 'every layer muted', f'peak {np.max(np.abs(z)):.1e}', 'PASS' if np.max(np.abs(z)) == 0 else 'FAIL')
    cnt = {k: sum(1 for r in REPORT if r['status'] == k) for k in ('PASS', 'WARN', 'FAIL', 'INFO')}
    w = max(len(r['check']) for r in REPORT)
    for r in REPORT:
        print(f"{r['status']:4s}  {r['group']:7s} {r['check']:{w}s}  {r['value']}")
        if r['status'] != 'PASS' and r['detail']:
            print(f"{'':13s}{'':{w}s}  ({r['detail']})")
    print(f"\n{cnt['PASS']} pass, {cnt['WARN']} warn, {cnt['FAIL']} fail ({cnt['INFO']} for information)")
    json.dump({'counts': cnt, 'checks': REPORT, 'ear_top': EAR_TOP}, open(f'{ROOT}/audit/sound/check_report.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
