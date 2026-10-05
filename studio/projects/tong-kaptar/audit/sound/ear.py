# An ear that is not mine: an AudioSet tagger (EfficientAT mn40_as_ext, Schmid et al., trained on
# 2 M human-labelled clips, 527 classes) run over each shot of the film, and over each stem in it.
# It answers the one question the metrics cannot: what does this passage SOUND LIKE to something
# that has heard the real things? A slow-motion wingbeat that the tagger calls "wind" or "engine"
# is a finding, whatever its spectrum says.
#   python3 audit/sound/ear.py                 -> per shot, the master and each stem
#   python3 audit/sound/ear.py file.wav [t0 t1] -> one file (or one window of it)
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import sys, os, warnings
warnings.filterwarnings('ignore')
import numpy as np
import torch
sys.path.insert(0, f'{ROOT}/tools/EfficientAT')
_CWD = os.getcwd()
os.chdir(f'{ROOT}/tools/EfficientAT')     # (its label table and weights are read relative to its root)
sys.path.insert(0, f'{ROOT}/sound')
from models.mn.model import get_model as get_mobilenet
from models.preprocess import AugmentMelSTFT
from helpers.utils import NAME_TO_WIDTH, labels
import scipy.signal as sg
os.chdir(_CWD)

SR_M = 32000
WATCH = ['Bird flight, flapping wings', 'Flap', 'Bird', 'Pigeon, dove', 'Coo', 'Whistling', 'Whistle', 'Wind', 'Wind noise (microphone)',
         'Rustle', 'Rustling leaves', 'Whoosh, swoosh, swish', 'Thump, thud', 'Breathing', 'Sigh', 'Chirp, tweet', 'Helicopter', 'Engine',
         'Noise', 'White noise', 'Pink noise', 'Hum', 'Music', 'Speech', 'Outside, rural or natural', 'Outside, urban or manmade', 'Vehicle', 'Silence']
_model = None


def model():
    global _model
    if _model is None:
        name = 'mn40_as_ext'
        import contextlib, io
        cwd = os.getcwd()
        os.chdir(f'{ROOT}/tools/EfficientAT')          # (the weights live in its resources/)
        try:
            with contextlib.redirect_stdout(io.StringIO()):          # (it prints its whole architecture)
                m = get_mobilenet(width_mult=NAME_TO_WIDTH(name), pretrained_name=name, strides=[2, 2, 2, 2], head_type='mlp')
        finally:
            os.chdir(cwd)
        m.eval()
        mel = AugmentMelSTFT(n_mels=128, sr=SR_M, win_length=800, hopsize=320)
        mel.eval()
        _model = (m, mel)
    return _model


def tag(x, sr):
    """x mono float; returns dict label -> probability"""
    m, mel = model()
    if sr != SR_M:
        g = np.gcd(sr, SR_M)
        x = sg.resample_poly(x, SR_M // g, sr // g)
    x = x.astype(np.float32)
    with torch.no_grad():
        spec = mel(torch.from_numpy(x[None, :]))
        preds, _ = m(spec.unsqueeze(0))
    p = torch.sigmoid(preds.float()).squeeze().numpy()
    return dict(zip(labels, p))


def top(p, n=6):
    idx = np.argsort([p[l] for l in labels])[::-1][:n]
    return ', '.join(f'{labels[i]} {p[labels[i]]:.2f}' for i in idx)


def watch(p, n=5):
    w = sorted(WATCH, key=lambda l: -p[l])[:n]
    return ', '.join(f'{l.split(",")[0]} {p[l]:.2f}' for l in w)


if __name__ == '__main__':
    from dsp import read_wav
    if len(sys.argv) > 1:
        x, sr = read_wav(sys.argv[1])
        m = 0.5 * (x[0] + x[1]) if x.ndim == 2 else x
        if len(sys.argv) > 3:
            m = m[int(float(sys.argv[2]) * sr):int(float(sys.argv[3]) * sr)]
        p = tag(m, sr)
        print(top(p, 10))
        sys.exit()
    import mix as MX
    mix, stems, _ = MX.mixdown()
    SR = 48000
    WIN = {'s1': (0.6, 3.69), 's1 take-off': (0.85, 1.8), 's2': (4.31, 6.9), 's3': (7.1, 9.65), 's4': (9.85, 13.4), 's4 whistle': (11.7, 12.7),
           's5 landing': (14.4, 16.4), 's5 end': (16.5, 19.9)}
    for name, (a, b) in WIN.items():
        xm = 0.5 * (mix[0] + mix[1])[int(a * SR):int(b * SR)]
        p = tag(xm, SR)
        print(f'== {name} ({a}..{b} s)  MIX: {top(p)}')
        for k, x in stems.items():
            xs = 0.5 * (x[0] + x[1])[int(a * SR):int(b * SR)]
            if 20 * np.log10(np.sqrt(np.mean(xs ** 2)) + 1e-12) < -60:
                continue
            xs = xs / (np.max(np.abs(xs)) + 1e-9) * 0.5      # each stem heard on its own, at one level
            p = tag(xs, SR)
            print(f'   {k:8s} {top(p, 4)}')
