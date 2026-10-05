"""HAIR TREMOR (pass 11). Over the held drawings 1..6 the sample's hair mask changes in every pair
(consecutive IoU 0.61..0.72). Once the mass fit was tied over time (the large blobs in the
difference map went away) ours is 0.77..0.88 -- it moves too little. The tooth-tip tremor fl
(in units of R, its own phase in each drawing, flT = drawing number) is chosen so that the mean
IoU of these pairs equals the sample's. The same code on both sides:
tools/compare silhouette.consecutive_arrays (the 'hair' spec). Render -- hair-server (clean).
python3 test/tremor-tune.py [--write]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, json
import numpy as np
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import project, image, silhouette
from hair_srv import Server

W = (PERSONAJ_DIR)
TMP = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p11-tremor')
os.makedirs(TMP, exist_ok=True)
prj = project.Project(W + '/compare.json')
SP = next(s for s in prj.silhouettes if s['name'] == 'hair')
S3 = json.load(open(W + '/hair3-fit.json'))
T = json.load(open(W + '/band-fit.json')) if os.path.exists(W + '/band-fit.json') else {}
K = [1, 2, 3, 4, 5, 6]


def pairs(Ls):
    return [r['iou'] for r in silhouette.consecutive_arrays(Ls, SP)]


sample = pairs([image.load(prj.file('sample', k), prj.size) for k in K])
print('sample pairs IoU', ' '.join('%.2f' % v for v in sample), " mean %.3f" % np.mean(sample))
sv = Server()
try:
    result = {}
    for fl in (0.04, 0.05, 0.06, 0.07):      # now: the boil amplitude boilAmp (R), fl=0 (0..0.04: 0.853 0.835 0.806 0.777 0.748)
        Ls = []
        for k in K:
            p = dict(S3[str(k)]); p['fl'] = 0; p['boilAmp'] = fl; p['flT'] = k
            fpath = '%s/t%02d.png' % (TMP, k)
            sv.render(k - 1, {'__hair3': p, '__band': T.get(str(k))}, fpath); image.clear_cache()
            Ls.append(image.load(fpath, prj.size))
        b = pairs(Ls)
        result[fl] = np.mean(b)
        print('boilAmp %.2f: pairs IoU %s  mean %.3f' % (fl, ' '.join('%.2f' % v for v in b), np.mean(b)), flush=True)
finally:
    sv.close()
fl = min(result, key=lambda f: abs(result[f] - np.mean(sample)))
print('chosen boilAmp =', fl)
if '--write' in sys.argv:
    for k in range(1, 12):
        S3[str(k)]['fl'] = 0; S3[str(k)]['boilAmp'] = fl; S3[str(k)]['flT'] = k
    json.dump(S3, open(W + '/hair3-fit.json', 'w'), indent=1)
    print('written to hair3-fit.json')
