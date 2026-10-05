"""Pass 12 (the hood): render + measurements (one command). film.mjs -> ff/ -> ff-12t (the frame-full
GIF path, 480x270). BEFORE = ff-11t (delivered in pass 11, the same path). The same code on both
sides: the hood tools (test/hood.py), tone class mass IoU (test/tone_class.py),
occlusion, rhythm, probes (a check that shot 1 did not change).
python3 test/measure12.py [--no-render]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, glob, io, subprocess, json, importlib.util
import numpy as np
from PIL import Image

W = (PERSONAJ_DIR)
T = (COMPARE_DIR)
S = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p12')
sys.path.insert(0, T); sys.path.insert(0, W + '/test')
if '--no-render' not in sys.argv:
    subprocess.run('node film.mjs >/dev/null && rm -rf ff && node view3.mjs >/dev/null', shell=True, cwd=W, check=True)
    fr = [Image.open(b).convert('RGB').resize((480, 270), Image.LANCZOS) for b in sorted(glob.glob(W + '/ff/??.png'))]
    buf = io.BytesIO(); fr[0].save(buf, format='GIF', save_all=True, append_images=fr[1:], duration=60, loop=0)
    g = Image.open(io.BytesIO(buf.getvalue()))
    os.makedirs(W + '/ff-12t', exist_ok=True)
    for i in range(len(fr)):
        g.seek(i); g.convert('RGB').save('%s/ff-12t/%02d.png' % (W, i))
from compare import image
import hood as KP
import tone_class as F
assert F.calibrate() and KP.calibrate()

dup = subprocess.run("grep -o ' id=\"[^\"]*\"' film.html | sort | uniq -d | wc -l", shell=True, cwd=W, capture_output=True, text=True).stdout.strip()
print('duplicate ids:', dup)
M = (SAMPLE_DIR + '/k%02d.png')
P = {'before': W + '/ff-11t/%02d.png', 'now': W + '/ff-12t/%02d.png'}
L = {t: {k: image.load((P[t] % (k - 1)) if t != 'sample' else (M % k), (320, 180)) for k in range(12, 23)} for t in ('sample', 'before', 'now')}

print('\n== hood tools (shots 2 and 3): area / centre')
O = {t: {k: KP.measure(L[t][k]) for k in range(12, 23)} for t in L}
for name in ('band', 'wedge'):
    for t in ('sample', 'before', 'now'):
        v = [O[t][k][name] for k in range(12, 23)]
        print('  %-5s %-5s area %s' % (name, t, ' '.join('%4d' % (x['area'] if x else 0) for x in v)))
for t in ('sample', 'before', 'now'):
    print('  band thickness %-5s %s' % (t, ' '.join('%4.1f' % (O[t][k]['band']['thickness'] if O[t][k]['band'] else 0) for k in range(12, 23))))
for t in ('sample', 'before', 'now'):
    print('  peak           %-5s %s' % (t, ' '.join('(%d,%d)' % O[t][k]['mass']['peak'] for k in range(12, 23))))

print('\n== band and wedge IN THE SAMPLE\'S PLACE (inside the sample part dilated by 4 px, the same class')
print('   boundary on both sides): IoU. The tools above are tied to our lit hair mass -- in ours the largest')
print('   lit part is the long strands left of the face (x 130..170), the box does not see the band (frames 15..18)')
from scipy import ndimage as _nd
for name in ('band', 'wedge'):
    for t in ('before', 'now'):
        r = []
        for k in range(12, 23):
            mm = O['sample'][k][name]['msk']
            D = _nd.binary_dilation(mm, iterations=4)
            Lt = L[t][k]
            c = ((_nd.median_filter(Lt, 3) >= 33) & (_nd.median_filter(Lt, 3) <= 65)) if name == 'band' else ((_nd.median_filter(Lt, 5) >= 6.5) & (_nd.median_filter(Lt, 5) <= 12))
            b = c & D
            r.append((mm & b).sum() / max(1, (mm | b).sum()))
        print('  %-5s %-5s IoU %s  mean 12-13 %.2f | 14-22 %.2f' % (name, t, ' '.join('%.2f' % v for v in r), np.mean(r[:2]), np.mean(r[2:])))

print('\n== tone classes, mass IoU (against the sample, ROI), mean 12-13 | 14-22')
for t in ('before', 'now'):
    R = {c: {} for c in F.CLASSES}
    for k in range(12, 23):
        sample = F.Sample(k); s = F.classes(L[t][k])
        for c in F.CLASSES:
            R[c][k] = F.iou(F.mass(s[c]), sample.m[c], sample.q)
    print('  %-5s ' % t + '  '.join('%s %.2f|%.2f' % (c, np.mean([R[c][k] for k in (12, 13)]), np.mean([R[c][k] for k in range(14, 23)])) for c in F.CLASSES))
    print('        per frame J: %s' % ' '.join('%.2f' % (sum(F.WEIGHT[c] * (1 - R[c][k]) for c in F.CLASSES) / sum(F.WEIGHT.values())) for k in range(12, 23)))

print('\n== lit region trace (test/composition.py mask: L>=90, not particles), 12..22: centre (x,y) and area %')
from composition import mask
for t in ('sample', 'before', 'now'):
    r = []
    for k in range(12, 23):
        m = mask(L[t][k]); ys, xs = np.nonzero(m)
        r.append('(%3.0f,%3.0f)%4.2f' % (xs.mean(), ys.mean(), m.mean() * 100) if len(xs) > 20 else '   -   ')
    print('  %-5s %s' % (t, ' '.join(r)))
for t in ('before', 'now'):
    d = []
    for k in range(12, 23):
        a, b = mask(L['sample'][k]), mask(L[t][k])
        ya, xa = np.nonzero(a); yb, xb = np.nonzero(b)
        d.append(np.hypot(xb.mean() - xa.mean(), yb.mean() - ya.mean()))
    print('  %-5s centre difference (px): %s  mean %.1f' % (t, ' '.join('%4.1f' % v for v in d), np.mean(d)))

tf = S + '/compare-t12.json'
cfg = json.load(open(W + '/compare.json')); cfg['ours'] = W + '/ff-12t/%02d.png'; cfg['before'] = W + '/ff-11t/%02d.png'
json.dump(cfg, open(tf, 'w'), ensure_ascii=False)
q = lambda c: subprocess.run('python3 -m compare ' + c, shell=True, cwd=T, capture_output=True, text=True).stdout
print('\n== occlusion, rhythm, probes')
for g_ in ('1-11', '12-13', '14-22'):
    print('  occlusion %s: %s' % (g_, q('occlusion %s --frames %s' % (tf, g_)).strip().split('\n')[-1]))
print('\n'.join(l for l in q('rhythm %s --frames 1-22' % tf).split('\n') if 'cut' in l or 'trend' in l))
print('\n'.join(l for l in q('rhythm %s --frames 14-22' % tf).split('\n') if 'trend' in l))
z = q('probe %s --frames 1-11' % tf)
keys = ('ANCHOR.x', 'ANCHOR.y', 'far_eye.x', 'far_eye.y', 'mouth.x', 'band.n%')
print(' '.join('%s=%s' % (l.split()[0], l.split()[-1]) for l in z.split('\n') if l.split() and l.split()[0] in keys))
# shot 1 unchanged: the RAW render (ff/ and the pass 11 ff-11/) -- on the GIF path there is one palette
# for the whole clip, so when shots 2-3 change, the shot 1 pixels shift with the dither too
if os.path.isdir(W + '/ff-11'):
    d = [np.abs(np.asarray(Image.open(W + '/ff/%02d.png' % i).convert('RGB')).astype(int) - np.asarray(Image.open(W + '/ff-11/%02d.png' % i).convert('RGB')).astype(int)) for i in range(11)]
    print("shot 1 (1..11) RAW render against pass 11: largest |diff| %d, mean %.4f (Chromium +-1 noise)" % (max(x.max() for x in d), np.mean([x.mean() for x in d])))
