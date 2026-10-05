"""Pass 11: render + the main measurements (one command). film.mjs -> ff/ (plain render) ->
ff-11t (the full-frame GIF path) -> tools/compare: hair mass, consecutive (held), brow,
occlusion, rhythm, probes. For comparison, ff-10t of pass 10 goes along the same path.
python3 test/measure11.py [--no-render]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, glob, io, subprocess, json
import numpy as np
from PIL import Image

W = (PERSONAJ_DIR)
S = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p11')
T = (COMPARE_DIR)
if '--no-render' not in sys.argv:
    subprocess.run('node film.mjs >/dev/null && rm -rf ff && node view3.mjs >/dev/null', shell=True, cwd=W, check=True)
    fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in sorted(glob.glob(W + '/ff/??.png'))]
    buf = io.BytesIO(); fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
    g = Image.open(io.BytesIO(buf.getvalue()))
    os.makedirs(W + '/ff-11t', exist_ok=True)
    for i in range(len(fr)):
        g.seek(i); g.convert('RGB').save('%s/ff-11t/%02d.png' % (W, i))
dup = subprocess.run("grep -o ' id=\"[^\"]*\"' film.html | sort | uniq -d | wc -l", shell=True, cwd=W, capture_output=True, text=True).stdout.strip()
print('duplicate ids:', dup)
f = S + '/compare-t11.json'
q = lambda c: subprocess.run('python3 -m compare ' + c, shell=True, cwd=T, capture_output=True, text=True).stdout
for sp in ('hair', 'hair_under', 'hair_right', 'hair_near_inner', 'body_right'):
    print(sp + ':', q('silhouette %s --name %s --frames 1-11' % (f, sp)).strip().split('\n')[-1])
k = q('silhouette %s --name hair --frames 1-11 --consecutive' % f).strip().split('\n')
print('\n'.join(k[1:8]))
print(q('occlusion %s --frames 1-11' % f).strip().split('\n')[-1])
print('\n'.join(l for l in q('rhythm %s --frames 1-11' % f).split('\n') if 'whole' in l or 'pairs' in l))
# brow zones and cheek (the functions of the fit) -- on the REAL render, through the GIF path:
# when boil was added after the fit, they were "exact" only in the log (METHOD 13)
sys.path.insert(0, T); sys.path.insert(0, W + '/test')
import importlib.util
from compare import image as _tv
_sp = importlib.util.spec_from_file_location('fit3', W + '/test/hair3-fit.py'); F3 = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(F3)
for subdir in ('ff-10t', 'ff-11t'):
    qz = []
    for k in range(1, 12):
        Lm = _tv.load(F3.prj.file('sample', k), F3.prj.size); Lb = _tv.load('%s/%s/%02d.png' % (W, subdir, k - 1), F3.prj.size)
        qz.append((F3.brow(Lb, k) - F3.brow(Lm, k), F3.brow2(Lb, k) - F3.brow2(Lm, k), F3.face(Lb, k) - F3.face(Lm, k)))
    qz = np.array(qz)
    print('%s brow zones (ours - sample)  A: %s' % (subdir, ' '.join('%+.2f' % v for v in qz[:, 0])))
    print('%s                             B: %s' % (subdir, ' '.join('%+.2f' % v for v in qz[:, 1])))
    print('%s                         cheek: %s' % (subdir, ' '.join('%+.2f' % v for v in qz[:, 2])))
    print("%s mean |diff| A %.3f  B %.3f  cheek %.3f" % ((subdir,) + tuple(np.abs(qz).mean(0))))
z = q('probe %s --frames 1-11' % f)
keys = ('ANCHOR.x', 'ANCHOR.y', 'far_eye.x', 'far_eye.y', 'mouth.x', 'band.n%', 'tear_cheek.x', 'tear_jaw.y', 'hair_left_y34.t', 'hair_right_y24.t')
print(' '.join('%s=%s' % (l.split()[0], l.split()[-1]) for l in z.split('\n') if l.split() and l.split()[0] in keys))
open(S + '/probe-last.txt', 'w').write(z)
