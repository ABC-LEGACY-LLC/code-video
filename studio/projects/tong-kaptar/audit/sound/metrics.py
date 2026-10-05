# Pass 2 metrics (media-audit-reality 2e), exactly as the skill gives them, plus the envelope helpers.
import numpy as np

SR = 48000


def bark(f):
    return 13 * np.arctan(0.00076 * f) + 3.5 * np.arctan((f / 7500.0) ** 2)


def audible_at(x, sr, f0, bw=7, ref=(200, 6000)):
    """MASKING: energy at f0 above the local spectral floor (>= +6 dB audible, +3..6 marginal)"""
    X = np.abs(np.fft.rfft(x * np.hanning(len(x))))
    f = np.fft.rfftfreq(len(x), 1 / sr)
    m = (f >= f0 - bw) & (f <= f0 + bw)
    floor = np.median(X[(f > ref[0]) & (f < ref[1])]) + 1e-12
    return 20 * np.log10(X[m].max() / floor)


def sharpness(x, sr):
    """Zwicker acum. ~1 = speech, >2.5 starts to pierce."""
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    z = bark(f)
    E = np.array([X[(z >= b) & (z < b + 1)].sum() if ((z >= b) & (z < b + 1)).any() else 1e-14 for b in range(24)])
    Np = np.power(E / (E.sum() + 1e-14), 0.23)
    zc = np.arange(24) + 0.5
    g = np.where(zc < 16, 1.0, 0.066 * np.exp(0.171 * zc))
    return 0.11 * np.sum(Np * g * zc) / (np.sum(Np) + 1e-14)


def flatness(x, sr, lo=300, hi=8000):
    """HISS: spectral flatness over the band the ear calls 'noise' (above ~0.12 on a continuous layer)"""
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    P = X[(f >= lo) & (f < hi)] + 1e-18
    return float(np.exp(np.mean(np.log(P))) / np.mean(P))


def roughness(x, sr):
    """Modulation DEPTH at a rough rate (~70 Hz). Calibrated threshold ~0.13."""
    F = np.fft.rfft(x)
    ff = np.fft.rfftfreq(len(x), 1 / sr)
    tot = float((np.abs(F) ** 2).sum()) + 1e-14
    out = 0.0
    for lo, hi in [(300, 600), (600, 1200), (1200, 2400), (2400, 4800), (4800, 9000)]:
        if float((np.abs(F[(ff >= lo) & (ff < hi)]) ** 2).sum()) / tot < 0.02:
            continue
        F2 = F.copy()
        F2[(ff < lo) | (ff >= hi)] = 0
        env = np.abs(np.fft.irfft(F2))
        mu = env.mean()
        if mu < 1e-7:
            continue
        e = env / mu - 1.0
        if e.std() < 1e-4:
            continue
        M = np.abs(np.fft.rfft(e * np.hanning(len(e)))) / (len(e) / 4.0)
        mf = np.fft.rfftfreq(len(e), 1 / sr)
        k = max(1, int(round(3.0 / (mf[1] - mf[0]))))
        M = np.convolve(M, np.ones(k) / k, mode='same')
        sel = (mf >= 20) & (mf <= 300)
        w = np.exp(-((np.log2((mf[sel] + 1e-9) / 70.0)) ** 2) / 1.2)
        out = max(out, float((M[sel] * w).max()))
    return out


def env_db(x, sr, win=0.03):
    """short-time RMS envelope (dB), 30 ms windows, hop half"""
    m = x if x.ndim == 1 else np.sqrt(0.5 * (x[0] ** 2 + x[1] ** 2))
    n = int(win * sr)
    h = n // 2
    k = (len(m) - n) // h + 1
    if k < 1:
        return np.array([-150.0])
    e = np.array([np.sqrt(np.mean(m[i * h:i * h + n] ** 2)) for i in range(k)])
    return 20 * np.log10(e + 1e-9)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def mono(x):
    return 0.5 * (x[0] + x[1]) if x.ndim == 2 else x


_RCAL = {}


def rough_index(x, sr):
    """roughness() rescaled by references of the same length (its raw value falls with window length:
    smooth pink noise reads 0.18 at 0.42 s and 0.06 at 2.6 s): 0 = smooth pink, 1 = pink + 70 Hz AM"""
    n = len(x)
    if n not in _RCAL:
        from dsp import pink
        vals = []
        t = np.arange(n) / sr
        for seed in range(3):
            rng = np.random.default_rng(100 + seed)
            vals.append((roughness(pink(rng, n), sr), roughness(pink(rng, n) * (1 + np.sin(2 * np.pi * 70 * t)), sr)))
        v = np.array(vals).mean(0)
        _RCAL[n] = v
    lo, hi = _RCAL[n]
    return (roughness(x, sr) - lo) / (hi - lo)
