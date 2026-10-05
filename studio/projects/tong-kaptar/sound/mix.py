# Tong · kaptar — the mix: the stems synthesized by synth.py, each at its level (MIX, dB), the
# picture's fades, a 25 Hz high-pass, then a peak limiter at -1 dBFS. Writes the master and the
# mixed stems (what the audit measures and the player page can solo).
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import sys, os, json
import numpy as np
import scipy.signal as sg
sys.path.insert(0, os.path.dirname(__file__))
from dsp import SR, sstep, limiter, write_wav

FPS = 24
T_END = 21.0
OUT = f'{ROOT}/sound/out'
MIX = json.load(open(os.path.join(os.path.dirname(__file__), 'mix.json')))
RIDE = [None]       # the last ride curve, for the check


def fades(n):
    tt = np.arange(n) / SR
    return sstep(0, 12 / FPS, tt) * (1 - sstep(T_END - 24 / FPS, T_END, tt))


def mixdown(mute=(), gains=None, limit=True):
    g = dict(MIX['stems'])
    if gains:
        g.update(gains)
    stems = {}
    for k in g:
        x = np.load(f'{OUT}/stems/{k}.npy').astype(float)
        stems[k] = x * 10 ** (g[k] / 20)
    n = next(iter(stems.values())).shape[1]
    fd = fades(n)
    b, a = sg.butter(2, 25 / (SR / 2), 'high')
    for k in stems:
        stems[k] = sg.lfilter(b, a, stems[k] * fd[None, :], axis=1) * 10 ** (MIX['master_db'] / 20)
    # rides: a shot's whole level, as a mixer rides a fader (shot 2 is the flock far off, which is
    # right, and alone it sat 12 dB under the loudest shot; lifted as a whole it keeps its own relief)
    ride = np.ones(n)
    tt = np.arange(n) / SR
    # (each ride sets the gain over its own half-open span [t0, t1): assigned, not multiplied. v2 and
    # v3a multiplied spans widened by 5 ms each side, so where two rides met the gain doubled for
    # 10 ms: +8 dB instead of +4 right before the cut into slow motion, found by a fresh eye)
    for r in MIX.get('rides', []):
        g0, g1 = 10 ** (r['db0'] / 20), 10 ** (r['db1'] / 20)
        a, b = r['t0'], r['t1']
        w = np.clip((tt - a) / max(b - a, 1e-9), 0, 1)
        seg = (tt >= a) & (tt < b)
        ride[seg] = (g0 + (g1 - g0) * (w * w * (3 - 2 * w)))[seg]
    top = max([1.0] + [10 ** (max(r['db0'], r['db1']) / 20) for r in MIX.get('rides', [])])
    assert ride.max() <= top * (1 + 1e-9), 'rides overlap'
    RIDE[0] = ride
    for k in stems:
        stems[k] = stems[k] * ride[None, :]
    mix = np.zeros((2, n))
    for k, x in stems.items():
        if k not in mute:
            mix = mix + x
    if limit:
        mix, gl = limiter(mix, MIX['ceiling_db'])
    else:
        gl = np.ones(n)
    return mix, stems, gl


if __name__ == '__main__':
    mix, stems, gl = mixdown()
    write_wav(OUT + '/master.wav', mix)
    os.makedirs(OUT + '/mixed', exist_ok=True)
    for k, x in stems.items():
        write_wav(OUT + f'/mixed/{k}.wav', np.clip(x, -1, 1))
    print('master peak', round(20 * np.log10(np.max(np.abs(mix))), 2), 'dBFS; limiter max reduction', round(-20 * np.log10(gl.min()), 2), 'dB;',
          'reduced >1 dB on', round(float(np.mean(gl < 10 ** (-1 / 20))) * 100, 3), '% of samples')
    for k, x in stems.items():
        r = np.sqrt(np.mean(x ** 2))
        print(f'  {k:8s} rms {20 * np.log10(r + 1e-12):7.1f} dBFS  peak {20 * np.log10(np.max(np.abs(x)) + 1e-12):6.1f}')
