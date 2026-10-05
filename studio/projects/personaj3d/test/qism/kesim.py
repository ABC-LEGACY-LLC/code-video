"""Bosh fazosida kesim chizmasi (12-o'tish): yon (z-y), old (x-y), tepa (x-z) -- bosh sirti, soch zanjirlari (guruh rangi),
kapyushon qirrasi (yaqin -- to'q, uzoq -- och), o'rta chizig'i va yon chiziqlari.  python3 test/qism/kesim.py KESIM.json BOSH.json CHIQ.png [kadr]"""
import sys, json, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
K = json.load(open(sys.argv[1])); B = np.array(json.load(open(sys.argv[2])))
kadrlar = sys.argv[4].split(',') if len(sys.argv) > 4 else list(K.keys())
RANG = {'yel': '#e0a000', 'qisqa': '#ff4040', 'uzoq': '#40c0ff', 'yuzyonYaqin': '#40ff80', 'yuzyonUzoq': '#20a060', 'orqa': '#b060ff', 'yaqin': '#ff80ff', '': '#aaaaaa'}
fig, ax = plt.subplots(len(kadrlar), 3, figsize=(15, 5 * len(kadrlar)), squeeze=False)
for r, k in enumerate(kadrlar):
    d = K[k]
    for c, (i, j, nom) in enumerate(((2, 1, 'yon: z (old ->) / y'), (0, 1, 'old: x (uzoq ->) / y'), (0, 2, 'tepa: x / z (old ^)'))):
        a = ax[r][c]; a.set_facecolor('#15151c')
        a.scatter(B[:, i], B[:, j], s=0.3, c='#555566')
        for t in d['soch']:
            p = np.array(t['p']); a.plot(p[:, i], p[:, j], '-', lw=1.0, c=RANG.get(t['gr'], '#cccccc'))
            a.plot(p[0, i], p[0, j], 'o', ms=2, c=RANG.get(t['gr'], '#cccccc'))
        q = np.array(d['qirra'])
        for tomon, col in ((1, '#ffffff'), (0, '#888888')):         # u=1 -- -x (yaqin), u=0 -- +x (uzoq)
            s = q[q[:, 4] == tomon]; s = s[np.argsort(s[:, 3])]; a.plot(s[:, i], s[:, j], '-', lw=2.2, c=col)
        o = np.array(d['orta']); o = o[np.argsort(o[:, 3])]; a.plot(o[:, i], o[:, j], '--', lw=1.2, c='#6fa8ff')
        y = np.array(d['yon']);
        for tomon in (0, 1):
            s = y[y[:, 4] == tomon]; s = s[np.argsort(s[:, 3])]; a.plot(s[:, i], s[:, j], ':', lw=1.0, c='#6fa8ff')
        a.set_aspect('equal'); a.set_xlim(-2.6, 2.6); a.set_ylim(-2.2, 2.6) if j == 1 else a.set_ylim(-2.6, 2.6)
        a.grid(True, color='#333344', lw=0.5); a.set_title('kadr %s -- %s' % (k, nom), color='k', fontsize=10)
plt.tight_layout(); plt.savefig(sys.argv[3], dpi=70, facecolor='white'); print(sys.argv[3])
