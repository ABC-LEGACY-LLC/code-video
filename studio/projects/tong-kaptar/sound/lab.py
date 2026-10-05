# A bench for single sounds: build a candidate, hear what the tagger hears in it, measure it.
# python3 sound/lab.py <name>   (the candidates are the functions below)
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
TMP = _os.path.join(__import__('tempfile').gettempdir(), 'kaptar'); _os.makedirs(TMP, exist_ok=True)
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, f'{ROOT}/audit/sound')
from dsp import SR, filt, bpn, sstep

# ------------------------------------------------------------------ textures
def velvet(rng, n, density, jitter=1.0):
    """sparse random impulses (+-1) at `density` per second: the grain of rustle, crackle and feathers,
    where Gaussian noise is hiss (Farnell, Designing Sound: fabric and fire are built from it)"""
    y = np.zeros(n)
    k = rng.poisson(density * n / SR)
    idx = rng.integers(0, n, k)
    y[idx] = rng.choice([-1.0, 1.0], k) * rng.uniform(0.3, 1.0, k) ** jitter
    return y


def crackle(rng, n, density, fc, q, decay_ms=0.4):
    """impulses rung through a short resonance: each one a tiny tick of a feather or a fibre"""
    v = velvet(rng, n, density)
    k = int(decay_ms * 1e-3 * SR * 6)
    h = np.exp(-np.arange(k) / (decay_ms * 1e-3 * SR))
    y = np.convolve(v, h)[:n]
    return filt('bp', y, fc, q)


def norm(y, p=0.5):
    return y / (np.max(np.abs(y)) + 1e-12) * p


# ------------------------------------------------------------------ a wingbeat, rebuilt
def flap(rng, Tb, U=1.0, ts=1.0, clap=0.0, f_w=1400.0, near=1.0, slow_pitch=1.0):
    """One wingbeat from the top of the upstroke (t = 0).
    - the downstroke's slap: as the wing starts down its feathers close into one surface and meet the
      air: a quick, crackly onset (feather ticks, dense) that falls away through the stroke;
    - a body of air behind it: a short low push (the 'whump') when near;
    - the upstroke: the hand flicked up and back, a soft rustle of feathers opening;
    - the clap (take-off): the wings meeting above the back, a hard broadband smack.
    ts stretches time (slow motion) without lowering the feathers' ticks: in slow motion each tick
    is still a tick, there are just more of them heard apart."""
    n = int(1.05 * Tb * SR) + 64
    t = np.arange(n) / SR
    phi = t / Tb
    # downstroke envelope: fast rise (to 0.06 of the beat), then a fall through the stroke
    a = np.clip(phi / 0.06, 0, 1) ** 1.5
    d = np.exp(-np.clip(phi - 0.06, 0, None) / 0.16) * (phi < 0.62)
    down = a * d
    dens = 2500 * U / ts ** 0.5
    tex = crackle(rng, n, dens, f_w * slow_pitch * np.sqrt(max(U, 0.4)), 0.9, 0.35) + 0.5 * crackle(rng, n, dens * 0.6, 3800 * slow_pitch, 1.2, 0.2)
    tex = tex / (np.std(tex) + 1e-12)
    air = bpn(rng, n, 650 * slow_pitch * np.sqrt(max(U, 0.4)), 1.3)
    y = down * (0.8 * tex + 0.45 * air)
    if near > 0:
        wp = filt('lp', rng.standard_normal(n), 180 * slow_pitch, 0.8)
        wp /= np.std(wp) + 1e-12
        y += near * 0.35 * down * wp
    # upstroke rustle
    up = np.where(phi > 0.6, np.sin(np.pi * np.clip((phi - 0.6) / 0.4, 0, 1)) ** 2, 0.0)
    ru = crackle(rng, n, 1200 / ts ** 0.5, 2600 * slow_pitch, 1.0, 0.25)
    y += 0.22 * up * ru / (np.std(ru) + 1e-12)
    if clap > 0:
        tau = 0.004 * ts ** 0.5
        env = (1 - np.exp(-t / 0.0003)) * np.exp(-t / tau)
        wn = rng.standard_normal(n)
        c = env * (filt('bp', wn, 2200 * slow_pitch, 0.7) + 0.5 * filt('bp', wn, 900 * slow_pitch, 0.9))
        y += clap * 2.2 * c / (np.max(np.abs(c)) + 1e-12)
    return y


def old_flap(rng, Tb, U=1.0, clap=0.0, flut=0.0):
    sys.path.insert(0, f'{ROOT}/sound/out/v2')
    import synth_v2 as S2  # noqa (the v2 grain, for comparison)
    return S2.wing_grain(rng, Tb, U, 1.0, 1.0, clap, flut, 700.0, 1100.0)


def train(grain_fn, rate=6.0, n_beats=8, dur=2.0, seed=0, **kw):
    y = np.zeros(int(dur * SR))
    for k in range(n_beats):
        rng = np.random.default_rng(seed + k)
        g = grain_fn(rng, 1 / rate, **kw)
        i = int((0.1 + k / rate) * SR)
        m = min(len(g), len(y) - i)
        if m > 0:
            y[i:i + m] += g[:m]
    return y


def flock(grain_fn, n_birds=26, dur=2.6, seed=0, **kw):
    y = np.zeros(int(dur * SR))
    R = np.random.default_rng(seed)
    for b in range(n_birds):
        rate = 6 * R.uniform(0.9, 1.12)
        ph = R.uniform(0, 1)
        r = R.uniform(14, 30)
        fw = R.uniform(1000, 1800)
        t = ph / rate
        k = 0
        while t < dur:
            if R.uniform() < 0.8:
                g = grain_fn(np.random.default_rng(seed * 1000 + b * 50 + k), 1 / rate, f_w=fw, near=0.0, **kw)
                i = int(t * SR)
                m = min(len(g), len(y) - i)
                y[i:i + m] += g[:m] / r
            t += 1 / rate
            k += 1
    return y


if __name__ == '__main__':
    import ear
    from dsp import write_wav
    tests = {
        'old take-off (v2)': lambda: train(old_flap, U=1.44, clap=1.0, flut=1.0),
        'old cruise (v2)': lambda: train(old_flap, U=1.0),
        'new take-off, clap': lambda: train(flap, U=1.44, clap=1.0),
        'new take-off, no clap': lambda: train(flap, U=1.44),
        'new cruise': lambda: train(flap, U=1.0, near=0.3),
        'new flock far': lambda: flock(flap, U=1.0),
        'old flock far': lambda: flock(lambda rng, Tb, f_w, near, **k: old_flap(rng, Tb, 1.0)),
        'new slow (x5, full pitch)': lambda: train(flap, rate=1.2, n_beats=3, dur=2.6, U=1.0, ts=5.0),
        'new slow (x5, 1/3 oct down)': lambda: train(flap, rate=1.2, n_beats=3, dur=2.6, U=1.0, ts=5.0, slow_pitch=0.8),
    }
    sel = sys.argv[1:] or list(tests)
    os.makedirs(f'{TMP}/lab', exist_ok=True)
    for name in sel:
        y = norm(tests[name]())
        p = ear.tag(y, SR)
        print(f'{name:28s} {ear.top(p, 5)}')
        print(f'{"":28s} flap/bird: ' + ', '.join(f'{l} {p[l]:.3f}' for l in ['Bird flight, flapping wings', 'Flap', 'Bird', 'Pigeon, dove', 'Whoosh, swoosh, swish', 'Rustle']))
        write_wav(f'{TMP}/lab/{name.replace(" ", "_").replace("/", "")}.wav', np.vstack([y, y]))
