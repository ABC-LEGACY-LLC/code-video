"""DOES THE VISOR TOUCH THE HAIR (pass 12, head trace of shots 2 and 3). The hood brim (visor)
RESTS on the hair: in the sample the lower edge of the lining band is the top of the lit hair -- the gap
is 0 by definition. Ours: a clean render without the hood (__noHood); in the column of every band key,
the gap between the top of the lit hair (L>85, median 3) and the measured lower band edge
(hood3-screen.json), 320 px: positive -- the band is ABOVE the hair (floats in the sky), negative --
the band covers the top of the hair.

The head trace (traces.json, y for 12..22) was chosen with this (the pass 5 ring around the centre of
the lit region did not work with the new hood: the part the visor/wedge covers changes with every shift,
the head jumped 27 px at 19->20):
  shot 2: both drawings the same shift, gap ~ +2 (in the sample 12-13 is the calmest pair)
  shot 3: at 14..16 the band touches the hair (-1..-4), from 17 on the head is HELD (in the sample the
          band's left end is at y 86..88 over 19..22) -- head y (320): 78.6 90 100 107.5 111 111.5 111.5 111.5 111.3
python3 test/contact-trace.py"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, (PERSONAJ_DIR + '/test'))
from hair_srv import Server

W = (PERSONAJ_DIR)
TMP = __import__('os').path.join(__import__('tempfile').gettempdir(), 'personaj-p12')


def headness(k, png, E):
    L = np.asarray(Image.open(png).convert('L').resize((320, 180), Image.LANCZOS), dtype=float)
    hair = ndimage.median_filter(L, 3) > 85
    g = []
    for (x, _), (_, yb) in zip(E[str(k)]['top'], E[str(k)]['low']):
        X = int(round(x * 320 / 540)); t = np.nonzero(hair[:, X])[0]
        yb320 = yb * 180 / 304
        if len(t) and t.min() < yb320 + 45:       # this column has hair (not a strand far below the band)
            g.append(t.min() - yb320)
    return np.array(g)


def main():
    E = json.load(open(W + '/hood3-screen.json'))
    sv = Server()
    try:
        for k in range(12, 23):
            p = '%s/contact%02d.png' % (TMP, k)
            sv.render(k - 1, {'__noHood': 1}, p)
            g = headness(k, p, E)
            print('frame %2d  gap (px, 320) %s   median %+.1f  largest %+.1f' % (
                k, ' '.join('%+.0f' % v for v in g), np.median(g), g.max()))
    finally:
        sv.close()


if __name__ == '__main__':
    main()
