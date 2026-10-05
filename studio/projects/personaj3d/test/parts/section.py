"""Section drawing in head space (pass 12): side (z-y), front (x-y), top (x-z) -- the head surface, hair chains (group colour),
the hood brim (near -- strong, far -- pale), its middle line and side lines.  python3 test/parts/section.py SECTION.json HEAD.json OUT.png [frame]"""
import sys, json, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
K = json.load(open(sys.argv[1])); B = np.array(json.load(open(sys.argv[2])))
frames = sys.argv[4].split(',') if len(sys.argv) > 4 else list(K.keys())
COLOUR = {'fan': '#e0a000', 'short': '#ff4040', 'far': '#40c0ff', 'facesideNear': '#40ff80', 'facesideFar': '#20a060', 'back': '#b060ff', 'near': '#ff80ff', '': '#aaaaaa'}
fig, ax = plt.subplots(len(frames), 3, figsize=(15, 5 * len(frames)), squeeze=False)
for r, k in enumerate(frames):
    d = K[k]
    for c, (i, j, name) in enumerate(((2, 1, 'side: z (front ->) / y'), (0, 1, 'front: x (far ->) / y'), (0, 2, 'top: x / z (front ^)'))):
        a = ax[r][c]; a.set_facecolor('#15151c')
        a.scatter(B[:, i], B[:, j], s=0.3, c='#555566')
        for t in d['hair']:
            p = np.array(t['p']); a.plot(p[:, i], p[:, j], '-', lw=1.0, c=COLOUR.get(t['gr'], '#cccccc'))
            a.plot(p[0, i], p[0, j], 'o', ms=2, c=COLOUR.get(t['gr'], '#cccccc'))
        q = np.array(d['brim'])
        for side, col in ((1, '#ffffff'), (0, '#888888')):         # u=1 -- -x (near), u=0 -- +x (far)
            s = q[q[:, 4] == side]; s = s[np.argsort(s[:, 3])]; a.plot(s[:, i], s[:, j], '-', lw=2.2, c=col)
        o = np.array(d['mid']); o = o[np.argsort(o[:, 3])]; a.plot(o[:, i], o[:, j], '--', lw=1.2, c='#6fa8ff')
        y = np.array(d['side']);
        for side in (0, 1):
            s = y[y[:, 4] == side]; s = s[np.argsort(s[:, 3])]; a.plot(s[:, i], s[:, j], ':', lw=1.0, c='#6fa8ff')
        a.set_aspect('equal'); a.set_xlim(-2.6, 2.6); a.set_ylim(-2.2, 2.6) if j == 1 else a.set_ylim(-2.6, 2.6)
        a.grid(True, color='#333344', lw=0.5); a.set_title('frame %s -- %s' % (k, name), color='k', fontsize=10)
plt.tight_layout(); plt.savefig(sys.argv[3], dpi=70, facecolor='white'); print(sys.argv[3])
