# A picture of the sound: the master's spectrogram (log frequency), the shots, the events by layer,
# and each stem's level over time. python3 audit/sound/spec.py out.png [t0 t1]
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import sys, json
import numpy as np
import scipy.signal as sg
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
sys.path.insert(0, f'{ROOT}/audit/sound')
sys.path.insert(0, f'{ROOT}/sound')
from metrics import env_db, mono, SR
import mix as MX

out = sys.argv[1]
t0, t1 = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0.0, 21.0)
mix, stems, _ = MX.mixdown()
ev = json.load(open(f'{ROOT}/sound/out/events.json'))['events']
m = mono(mix)[int(t0 * SR):int(t1 * SR)]
f, t, Z = sg.spectrogram(m, SR, nperseg=2048, noverlap=2048 - 256, window='hann')
Z = 10 * np.log10(Z + 1e-14)
fig, ax = plt.subplots(3, 1, figsize=(22, 13), gridspec_kw={'height_ratios': [3, 1.2, 2]}, sharex=True)
ax[0].pcolormesh(t + t0, f, Z, shading='auto', cmap='magma', vmin=Z.max() - 90, vmax=Z.max())
ax[0].set_yscale('log')
ax[0].set_ylim(40, 16000)
ax[0].set_ylabel('Hz')
cuts = [(0, 's1'), (91 / 24, 'whip'), (101 / 24, 's2'), (7.0, 's3'), (9.75, 's4'), (13.5, 's5')]
for a in ax:
    for c, name in cuts:
        a.axvline(c, color='cyan', lw=0.8, alpha=0.7)
for c, name in cuts:
    if t0 <= c < t1:
        ax[0].text(c + 0.03, 12000, name, color='cyan', fontsize=11)
cols = {'wings': 'tab:blue', 'land': 'tab:orange', 'flag': 'tab:green', 'coo': 'tab:purple', 'sparrow': 'tab:olive', 'rag': 'tab:brown',
        'whistle': 'tab:red', 'breath': 'tab:pink', 'whip': 'tab:gray', 'foley': 'tab:cyan'}
layers = list(cols)
for e in ev:
    if t0 <= e['t'] <= t1 and e['layer'] in cols:
        y = layers.index(e['layer'])
        ax[1].plot([e['t'], e['t'] + e['dur']], [y, y], color=cols[e['layer']], lw=3 if e.get('on', 1) else 1, alpha=0.8)
ax[1].set_yticks(range(len(layers)))
ax[1].set_yticklabels(layers)
for k, x in stems.items():
    e = env_db(x[:, int(t0 * SR):int(t1 * SR)], SR, 0.03)
    tt = t0 + (np.arange(len(e)) * 0.015 + 0.015)
    ax[2].plot(tt, e, lw=1, label=k, color=cols.get(k, None))
e = env_db(mix[:, int(t0 * SR):int(t1 * SR)], SR, 0.03)
ax[2].plot(t0 + np.arange(len(e)) * 0.015 + 0.015, e, lw=1.6, color='k', label='MIX')
ax[2].set_ylim(-80, 0)
ax[2].set_ylabel('dBFS (30 ms)')
ax[2].legend(ncol=7, fontsize=9, loc='lower left')
ax[2].grid(alpha=0.3)
ax[2].set_xlim(t0, t1)
ax[2].set_xlabel('film seconds (edit B)')
plt.tight_layout()
plt.savefig(out, dpi=70)
print(out)
