"""BAND GAP (pass 11). The band behind the far cheek -- hanging hair strands;
in the sample the sky shows between them. In each image the gap [g0,g1] (a share of
the band's width, from the face side) is fitted to the sample's count with the
tools/compare probe 'band' (count: L 30..55, a box relative to the sample's anchor).
The same code on both sides: probe.anchor (on the sample) and probe.count. Render --
hair-server (clean, no tremor).
python3 test/band-fit.py [1-11]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, json, itertools
import numpy as np
sys.path.insert(0, (COMPARE_DIR)); sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from compare import project, image, probe
from hair_srv import Server

W = (PERSONAJ_DIR)
TMP = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p11-band')
os.makedirs(TMP, exist_ok=True)
prj = project.Project(W + '/compare.json')
Z = next(z for z in prj.probes if z['name'] == 'band')
S3 = json.load(open(W + '/hair3-fit.json'))
OUT = W + '/band-fit.json'
G0 = float(os.environ.get('G0', '0.55'))   # column profile of images 7..9: 0.40 -> |diff| 0.200, 0.55 -> 0.134


def number(L, A):
    q = [Z['box'][0] + A[0], Z['box'][1] + A[1], Z['box'][2] + A[0], Z['box'][3] + A[1]]
    return probe.count(L, q, Z['L'])['n']


def main():
    frameList = prj.group(sys.argv[1]) if len(sys.argv) > 1 else list(range(1, 12))
    res = json.load(open(OUT)) if os.path.exists(OUT) else {}
    sv = Server()
    try:
        for k in frameList:
            A, _ = probe.anchor(prj, 'sample', k)
            nm = number(image.load(prj.file('sample', k), prj.size), A)
            def measure(tq):
                fpath = '%s/t%02d.png' % (TMP, k)
                # __band is given EXPLICITLY (null too): otherwise the previous fit result in
                # sheet.mjs stays and the "no gap" measurement actually comes out with the old gap
                over = {'__hair3': S3[str(k)], '__band': tq}
                sv.render(k - 1, over, fpath); image.clear_cache()
                return number(image.load(fpath, prj.size), A)
            n0 = measure(None)
            best = (abs(n0 - nm), None, n0)
            if n0 > nm:            # ours has too many -- a gap is opened
                # the gap START is fixed (G0): if only the count is fitted, the position is free and
                # jumps from image to image (attempt 1: 0.8, 0.75, 0.35, 0.7 ...). In the sample the
                # dark part is in the outer half of the box (images 7..9, columns 6..11)
                for w in np.arange(0.02, 0.61, 0.02):
                    g0 = G0
                    if g0 + w > 0.98:
                        continue
                    tq = [round(float(g0), 2), round(float(g0 + w), 2)]
                    n = measure(tq)
                    if abs(n - nm) < best[0]:
                        best = (abs(n - nm), tq, n)
            res[str(k)] = best[1]
            json.dump(res, open(OUT, 'w'), indent=1)
            print('image %2d: sample %d, ours %d -> %d  gap %s' % (k, nm, n0, best[2], best[1]), flush=True)
    finally:
        sv.close()


if __name__ == '__main__':
    main()
