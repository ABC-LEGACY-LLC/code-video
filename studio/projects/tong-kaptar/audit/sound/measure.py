# Pass 2 on the film's sound (media-audit-reality): per-shot level, bands, stereo, relief, small
# speaker, bed hiss, what never stops, masking, sharpness/roughness, loudness range, true peak;
# and the event log: visibility at onset, onset lag, density, repetition.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
TMP = _os.path.join(__import__('tempfile').gettempdir(), 'kaptar'); _os.makedirs(TMP, exist_ok=True)
import sys, json, subprocess, os
import numpy as np
import scipy.signal as sg
sys.path.insert(0, f'{ROOT}/audit/sound')
sys.path.insert(0, f'{ROOT}/sound')
from metrics import flatness, roughness, rough_index, sharpness, audible_at, env_db, rms_db, mono, SR
from dsp import read_wav
import mix as MX
import pyloudnorm as pyln

OUT = f'{ROOT}/sound/out'
# each shot's solo window, clear of its cuts (and of the fades) by 0.1 s
WIN = {'s1': (0.6, 3.69), 'whip': (3.79, 4.21), 's2': (4.31, 6.9), 's3': (7.1, 9.65), 's4': (9.85, 13.4), 's5': (13.6, 19.9)}
BANDS = [(20, 120), (120, 400), (400, 1200), (1200, 4000), (4000, 10000)]
ACCENT = {'whistle', 'breath', 'coo', 'land', 'whip', 'foley', 'sparrow'}


def rough_steady(m, win=1.0, hop=0.5):
    """roughness where the sound is steady: the median over 1 s windows (over a whole shot, a sparse
    burst in silence reads as rough from its own edges: the whistle, smooth in its own second (-0.03),
    read 0.47 over shot 4's 3.5 s)"""
    n, h = int(win * SR), int(hop * SR)
    v = [rough_index(m[i:i + n], SR) for i in range(0, len(m) - n + 1, h)]
    return float(np.median(v)) if v else float('nan')


def cut(x, w):
    a, b = int(w[0] * SR), int(w[1] * SR)
    return x[..., a:b]


def bands(x):
    m = mono(x)
    X = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    tot = X[(f >= 20) & (f < 10000)].sum() + 1e-18
    return [X[(f >= a) & (f < b)].sum() / tot for a, b in BANDS]


def hp450(x):
    sos = sg.butter(4, 450 / (SR / 2), 'high', output='sos')
    return sg.sosfilt(sos, x, axis=-1)


def floor_db(x):
    e = env_db(x, SR)
    return float(np.percentile(e, 27.5))      # the resting level: 20..35th percentile of a 30 ms envelope


def relief(x):
    e = env_db(x, SR)
    return float(np.percentile(e, 97) - np.percentile(e, 35))


def main():
    mix, stems, gl = MX.mixdown()
    report = {}
    print('== per shot (solo windows)')
    print(f"{'shot':5s} {'RMS':>6s} {'pk98':>6s} {'relief':>6s} {'floor':>6s}  bands% 20-120/120-400/400-1.2k/1.2-4k/4-10k   corr  mono   HP450 dRMS dPk98  sharp rough")
    for s, w in WIN.items():
        x = cut(mix, w)
        m = mono(x)
        e = env_db(x, SR)
        bd = bands(x)
        L, R = x[0], x[1]
        corr = float(np.corrcoef(L, R)[0, 1])
        mc = 20 * np.log10(np.sqrt(np.mean(((L + R) / 2) ** 2)) / np.sqrt(0.5 * (np.mean(L ** 2) + np.mean(R ** 2))) + 1e-12)
        h = hp450(x)
        eh = env_db(h, SR)
        rep = {'rms': rms_db(m), 'pk98': float(np.percentile(e, 98)), 'relief': relief(x), 'floor': floor_db(x), 'bands': bd, 'corr': corr, 'mono': mc,
               'hp_drms': rms_db(mono(h)) - rms_db(m), 'hp_dpk98': float(np.percentile(eh, 98) - np.percentile(e, 98)),
               'sharp': sharpness(m, SR), 'rough': rough_steady(m)}
        report[s] = rep
        print(f"{s:5s} {rep['rms']:6.1f} {rep['pk98']:6.1f} {rep['relief']:6.1f} {rep['floor']:6.1f}  " + '/'.join(f'{100 * v:4.1f}' for v in bd) +
              f"   {corr:5.2f} {mc:5.1f}   {rep['hp_drms']:6.1f} {rep['hp_dpk98']:6.1f}  {rep['sharp']:5.2f} {rep['rough']:5.3f}")
    rmss = [report[s]['rms'] for s in WIN if s != 'whip']
    print(f'RMS spread across shots (whip excluded): {max(rmss) - min(rmss):.1f} dB')
    # loudness range: 95th - 10th percentile of a 0.4 s envelope over the whole piece (fades excluded)
    xm = cut(mix, (0.6, 19.9))
    e4 = env_db(xm, SR, win=0.4)
    print(f'loudness range (95-10 pct, 0.4 s): {np.percentile(e4, 95) - np.percentile(e4, 10):.1f} dB')
    meter = pyln.Meter(SR)
    print(f'integrated loudness: {meter.integrated_loudness(mix.T):.1f} LUFS')
    # momentary loudness (BS.1770, 400 ms windows, 100 ms hop): the loudest of each key moment
    mm = pyln.Meter(SR, block_size=0.4)
    def mom(a, b):
        v = []
        for t0 in np.arange(a, b - 0.4 + 1e-9, 0.1):
            seg = mix[:, int(t0 * SR):int((t0 + 0.4) * SR)].T
            try:
                v.append(mm.integrated_loudness(seg))
            except Exception:
                pass
        v = [x for x in v if np.isfinite(x)]
        return max(v) if v else float('nan')
    for name, (a, b) in {'take-off': (0.85, 1.6), 'shot 2 flock': (4.3, 6.9), 'slow wings': (7.0, 9.7), 'rag circles': (9.8, 11.0),
                         'whistle': (11.75, 12.6), 'landing': (14.5, 16.4), 'white one down': (16.05, 16.5), 'sigh': (18.3, 19.3), 'end coo': (19.5, 20.3)}.items():
        print(f'  momentary max {name:15s} {mom(a, b):6.1f} LUFS')
    pk = np.max(np.abs(mix), axis=0)
    print(f'sample peak max {20 * np.log10(pk.max()):.2f} dBFS, 99.99th pct {20 * np.log10(np.percentile(pk, 99.99)):.2f}')
    # (true peak after a lossy round trip, as the page will play it: AAC 192k)
    from dsp import write_wav
    tmp = f'{TMP}/tp'
    write_wav(tmp + '.wav', mix)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp + '.wav', '-c:a', 'aac', '-b:a', '192k', tmp + '.m4a'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp + '.m4a', '-ar', '48000', tmp + '_d.wav'], check=True)
    y, _ = read_wav(tmp + '_d.wav')
    pk2 = np.max(np.abs(y), axis=0)
    print(f'after AAC 192k: max {20 * np.log10(pk2.max()):.2f} dBFS, 99.99th pct {20 * np.log10(np.percentile(pk2, 99.99)):.2f} dBFS')
    print(f'limiter: max reduction {-20 * np.log10(gl.min()):.2f} dB, on {100 * np.mean(gl < 0.99):.3f} % of samples')

    # ---- bed versus events (2i) and what never stops (2h)
    print('\n== bed hiss (flatness of the continuous layers, accents muted) and each stem alone')
    bed = sum(x for k, x in stems.items() if k not in ACCENT)
    print(f"{'shot':5s} {'bed flat':>8s} " + ' '.join(f'{k:>7s}' for k in stems))
    for s, w in WIN.items():
        row = [flatness(mono(cut(bed, w)), SR)]
        for k, x in stems.items():
            xx = mono(cut(x, w))
            row.append(flatness(xx, SR) if rms_db(xx) > -75 else np.nan)
        print(f'{s:5s} {row[0]:8.3f} ' + ' '.join(f'{v:7.3f}' if np.isfinite(v) else '      -' for v in row[1:]))
    print('\n== what never stops: resting floor per shot (dB), and how far muting each stem drops it')
    print(f"{'shot':5s} {'floor':>6s} " + ' '.join(f'{k:>7s}' for k in stems))
    for s, w in WIN.items():
        f0 = floor_db(cut(mix, w))
        row = []
        for k in stems:
            mm = sum(x for kk, x in stems.items() if kk != k)
            row.append(floor_db(cut(mm, w)) - f0)
        print(f'{s:5s} {f0:6.1f} ' + ' '.join(f'{v:7.1f}' for v in row))
    # silence: every stem muted -> the output must be digital silence (no process of its own)
    z, _, _ = MX.mixdown(mute=tuple(stems.keys()))
    print(f'all stems muted: peak {np.max(np.abs(z)):.2e}')

    # ---- masking and the accents' own character
    ev = json.load(open(OUT + '/events.json'))['events']
    print('\n== accents: audible over the rest (audible_at on the best 0.5 s), sharpness, roughness')
    wh = [e for e in ev if e['name'] == 'whistle'][0]
    x = mono(cut(mix, (wh['t'], wh['t'] + 0.5)))
    print(f"whistle {wh['f0']:.0f} Hz: audible_at {audible_at(x, SR, wh['f0'], bw=60):5.1f} dB  sharpness {sharpness(x, SR):.2f}  rough index {rough_index(x, SR):.2f}  (whistle stem alone {rough_index(mono(cut(stems['whistle'], (wh['t'], wh['t'] + 0.5))), SR):.2f})")
    for e in [e for e in ev if e['name'].startswith('coo')]:     # (named 'coo (perch)', 'coo (soft)': '== coo' matched none)
        x = mono(cut(mix, (e['t'] + 0.15, e['t'] + 0.65)))
        rest = mono(cut(sum(v for k, v in stems.items() if k != 'coo'), (e['t'] + 0.15, e['t'] + 0.65)))
        print(f"coo at {e['t']:5.2f} ({e['shot']}): band 300..600 Hz over the rest {rms_db(sg.sosfilt(sg.butter(4, [300, 600], 'band', fs=SR, output='sos'), x)) - rms_db(sg.sosfilt(sg.butter(4, [300, 600], 'band', fs=SR, output='sos'), rest)):5.1f} dB")
    x = mono(cut(mix, (0.92, 1.42)))
    print(f"take-off (0.92..1.42 s): flutter 700 Hz audible_at {audible_at(x, SR, 700, bw=40):5.1f} dB  sharpness {sharpness(x, SR):.2f}  rough index {rough_index(x, SR):.2f}")
    x = mono(cut(mix, (13.5 + 1.4, 13.5 + 2.8)))
    print(f"landing (s5 1.4..2.8 s): sharpness {sharpness(x, SR):.2f}  rough index {rough_index(x, SR):.2f}")

    # ---- the event log (2b)
    print('\n== event log: per layer, shot -- fires, fires/s, on screen at onset, onset lag (ms), smallest gap per source (ms), fires inside their own tail')
    by = {}
    for e in ev:
        by.setdefault((e['layer'], e['shot']), []).append(e)
    for (layer, shot), es in sorted(by.items()):
        a, b = WIN.get(shot, (0, 21))
        dur = max(b - a, 0.3)
        on = [e.get('on') for e in es if e.get('on') is not None]
        lags = [1000 * (e['t_vis'] - e['t']) for e in es if 't_vis' in e]
        gaps, inside = [], 0
        bysrc = {}
        for e in es:
            bysrc.setdefault(e.get('src'), []).append(e)
        for src, ee in bysrc.items():
            ee = sorted(ee, key=lambda q: q['t'])
            for p, q in zip(ee[:-1], ee[1:]):
                gaps.append(1000 * (q['t'] - p['t']))
                if q['t'] < p['t'] + p['dur']:
                    inside += 1
        print(f"{layer:8s} {shot:5s} n {len(es):4d}  {len(es) / dur:5.1f}/s  on {100 * np.mean(on) if on else float('nan'):5.1f}%  "
              f"lag {np.min(lags) if lags else float('nan'):6.1f}..{np.max(lags) if lags else float('nan'):5.1f}  gap min {min(gaps) if gaps else float('nan'):6.1f}  inside {inside}")
    json.dump(report, open(OUT + '/measure.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
