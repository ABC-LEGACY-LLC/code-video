# Small DSP kit for the film's sound: filters, air absorption, placement, envelopes, limiter.
import numpy as np
import scipy.signal as sg
from numba import njit

SR = 48000


def rbj(kind, fc, q=0.7071, sr=SR):
    """RBJ biquad (b, a): 'bp' (0 dB peak), 'lp', 'hp'."""
    fc = float(np.clip(fc, 5.0, sr * 0.45))
    w0 = 2 * np.pi * fc / sr
    al = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    if kind == 'bp':
        b = [al, 0.0, -al]
    elif kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:
        raise ValueError(kind)
    a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def filt(kind, x, fc, q=0.7071):
    b, a = rbj(kind, fc, q)
    return sg.lfilter(b, a, x)


def bpn(rng, n, fc, q):
    """band-passed white noise, unit RMS"""
    y = filt('bp', rng.standard_normal(n + 256), fc, q)[256:]
    s = np.std(y)
    return y / (s + 1e-12)


def pink(rng, n):
    """pink noise (Voss-McCartney via FFT shaping), unit RMS"""
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X[1:] /= np.sqrt(f[1:])
    X[0] = 0
    y = np.fft.irfft(X, n)
    return y / (np.std(y) + 1e-12)


def alpha_iso(f, T=288.15, hr=60.0, pa=101.325):
    """ISO 9613-1 atmospheric absorption, dB per metre (15 C, 60 % RH by default: a dawn)"""
    f = np.asarray(f, dtype=float)
    pr, T0, T01 = 101.325, 293.15, 273.16
    psat = pr * 10 ** (-6.8346 * (T01 / T) ** 1.261 + 4.6151)
    h = hr * (psat / pr) / (pa / pr)
    frO = (pa / pr) * (24 + 4.04e4 * h * (0.02 + h) / (0.391 + h))
    frN = (pa / pr) * (T / T0) ** -0.5 * (9 + 280 * h * np.exp(-4.170 * ((T / T0) ** (-1 / 3) - 1)))
    return 8.686 * f ** 2 * (1.84e-11 * (pa / pr) ** -1 * (T / T0) ** 0.5
                             + (T / T0) ** -2.5 * (0.01275 * np.exp(-2239.1 / T) / (frO + f ** 2 / frO)
                                                   + 0.1068 * np.exp(-3352.0 / T) / (frN + f ** 2 / frN)))


def air(x, r):
    """x heard through r metres of air (ISO 9613-1), exact per frequency"""
    if r < 2:
        return x
    n = len(x)
    m = 1 << int(np.ceil(np.log2(n + 64)))
    X = np.fft.rfft(x, m)
    f = np.fft.rfftfreq(m, 1 / SR)
    X *= 10 ** (-alpha_iso(f) * r / 20)
    return np.fft.irfft(X, m)[:n]


def pan_gains(p):
    p = float(np.clip(p, -1, 1))
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def sstep(a, b, x):
    x = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


class Bus:
    """a stereo layer, with its own send to the reverb (so muting a layer mutes its echoes too)"""

    def __init__(self, n):
        self.x = np.zeros((2, n))
        self.send = np.zeros(n)

    def add(self, y, t0, pan=0.0, gain=1.0, send=0.0, tmax=None):
        i0 = int(round(t0 * SR))
        n = len(y)
        if tmax is not None:
            # (cut off at tmax with a 15 ms fade)
            k1 = int(round(tmax * SR)) - i0
            if k1 <= 0:
                return
            if k1 < n:
                f = int(0.015 * SR)
                y = y[:k1].copy()
                y[max(0, k1 - f):] *= np.linspace(1, 0, k1 - max(0, k1 - f))
                n = k1
        a, b = max(0, i0), min(self.x.shape[1], i0 + n)
        if b <= a:
            return
        seg = y[a - i0:b - i0] * gain
        gl, gr = pan_gains(pan)
        self.x[0, a:b] += seg * gl
        self.x[1, a:b] += seg * gr
        if send:
            self.send[a:b] += seg * send

    def add_stereo(self, L, R, t0=0.0, send=0.0):
        i0 = int(round(t0 * SR))
        n = len(L)
        a, b = max(0, i0), min(self.x.shape[1], i0 + n)
        if b <= a:
            return
        self.x[0, a:b] += L[a - i0:b - i0]
        self.x[1, a:b] += R[a - i0:b - i0]
        if send:
            self.send[a:b] += 0.5 * (L[a - i0:b - i0] + R[a - i0:b - i0]) * send


@njit(cache=True)
def _limit(x, thr, att, rel, look):
    n = x.shape[1]
    peak = np.zeros(n)
    for i in range(n):
        peak[i] = max(abs(x[0, i]), abs(x[1, i]))
    # look-ahead: the gain must be down before the peak arrives
    need = np.ones(n)
    for i in range(n):
        if peak[i] > thr:
            need[i] = thr / peak[i]
    g = np.ones(n)
    cur = 1.0
    # the least gain needed over the look-ahead window
    mn = np.ones(n)
    for i in range(n):
        m = 1.0
        for j in range(i, min(n, i + look)):
            if need[j] < m:
                m = need[j]
        mn[i] = m
    for i in range(n):
        tgt = mn[i]
        if tgt < cur:
            cur = cur + (tgt - cur) * att
        else:
            cur = cur + (tgt - cur) * rel
        g[i] = cur
    return g


def limiter(x, ceiling_db=-1.0, att_ms=1.5, rel_ms=120.0, look_ms=3.0):
    thr = 10 ** (ceiling_db / 20)
    att = 1 - np.exp(-1 / (att_ms * 1e-3 * SR))
    rel = 1 - np.exp(-1 / (rel_ms * 1e-3 * SR))
    look = int(look_ms * 1e-3 * SR)
    # the gain aims at the least it will need over the next `look` samples, so it is already down
    # when a peak arrives; clamped so no sample ever exceeds the ceiling
    g = _limit(x, thr, att, rel, look)
    peak = np.maximum(np.abs(x[0]), np.abs(x[1]))
    g = np.minimum(g, np.where(peak > thr, thr / np.maximum(peak, 1e-12), 1.0))
    return x * g[None, :], g


def write_wav(path, x, bits=24):
    """x: (2, n) float in -1..1"""
    import wave
    x = np.clip(x, -1, 1)
    if bits == 24:
        v = np.round(x.T * (2 ** 23 - 1)).astype(np.int32)
        b = np.zeros((v.shape[0], v.shape[1], 3), np.uint8)
        b[..., 0] = v & 0xFF
        b[..., 1] = (v >> 8) & 0xFF
        b[..., 2] = (v >> 16) & 0xFF
        data = b.tobytes()
        sw = 3
    else:
        data = np.round(x.T * 32767).astype('<i2').tobytes()
        sw = 2
    with wave.open(path, 'wb') as w:
        w.setnchannels(x.shape[0])
        w.setsampwidth(sw)
        w.setframerate(SR)
        w.writeframes(data)


def read_wav(path):
    import wave
    with wave.open(path, 'rb') as w:
        n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    if sw == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
        v = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        v = np.where(v >= 2 ** 23, v - 2 ** 24, v)
        x = v.reshape(-1, ch).T / (2 ** 23 - 1)
    else:
        x = np.frombuffer(raw, '<i2').reshape(-1, ch).T / 32767
    return x.astype(float), sr
