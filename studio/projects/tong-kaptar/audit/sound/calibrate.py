# Pass 2f: every metric run on references whose answer is known, before it reports on the film.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import sys
import numpy as np
sys.path.insert(0, f'{ROOT}/audit/sound')
sys.path.insert(0, f'{ROOT}/sound')
from metrics import flatness, roughness, sharpness, audible_at, SR
from dsp import pink, bpn

rng = np.random.default_rng(1)
n = SR * 2
t = np.arange(n) / SR
refs = {
    'pink noise': (pink(rng, n), 'SMOOTH', 'hiss'),
    'white noise': (rng.standard_normal(n), 'SMOOTH', 'hiss'),
    '1 kHz sine': (np.sin(2 * np.pi * 1000 * t), 'SMOOTH', 'tone'),
    '1 kHz + 4 Hz AM': (np.sin(2 * np.pi * 1000 * t) * (1 + np.sin(2 * np.pi * 4 * t)), 'SMOOTH', 'tone'),
    '1 kHz + 70 Hz AM 100%': (np.sin(2 * np.pi * 1000 * t) * (1 + np.sin(2 * np.pi * 70 * t)), 'ROUGH', 'tone'),
    '2 kHz + 70 Hz AM 100%': (np.sin(2 * np.pi * 2000 * t) * (1 + np.sin(2 * np.pi * 70 * t)), 'ROUGH', 'tone'),
    'pink + 70 Hz AM': (pink(rng, n) * (1 + np.sin(2 * np.pi * 70 * t)), 'ROUGH', 'hiss'),
    'noise Q=0.6 @1k': (bpn(rng, n, 1000, 0.6), 'SMOOTH', 'mid'),
    'noise Q=3 @1k': (bpn(rng, n, 1000, 3), 'SMOOTH', 'narrow'),
}
print(f"{'reference':26s} {'expect':7s} {'rough':>7s} {'flat':>7s} {'sharp':>6s}")
for k, (x, exp, kind) in refs.items():
    print(f'{k:26s} {exp:7s} {roughness(x, SR):7.3f} {flatness(x, SR):7.3f} {sharpness(x, SR):6.2f}')
# masking: a 3 kHz tone 20 dB under pink noise's total level, and 20 dB over the local floor
x = pink(rng, SR // 2)
for lvl in [0.003, 0.01, 0.03, 0.1]:
    y = x + lvl * np.sin(2 * np.pi * 3000 * np.arange(SR // 2) / SR)
    print(f'audible_at 3 kHz tone amp {lvl:5.3f} in unit pink: {audible_at(y, SR, 3000):6.1f} dB')
# sharpness of a whistle-like 3 kHz tone vs speech-band noise
print('sharpness 3 kHz sine', round(sharpness(np.sin(2 * np.pi * 3000 * t), SR), 2), '| 700 Hz noise band', round(sharpness(bpn(rng, n, 700, 1), SR), 2))
