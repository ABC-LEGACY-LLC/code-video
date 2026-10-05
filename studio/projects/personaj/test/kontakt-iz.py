"""SOYABON SOCHGA TEGADIMI (12-o'tish, 2- va 3-kadr bosh izi). Kapyushon qirrasi (soyabon)
sochga TAYANADI: misolda astar tasmaning pastki cheti yorug' sochning tepasi -- bo'shliq
ta'rifan 0. Bizda: kapyushonsiz toza render (__kapYoq), har tasma kaliti ustunida yorug' soch
(L>85, median 3) tepasi bilan o'lchangan tasma pastki cheti (kap3-ekran.json) orasidagi
bo'shliq, 320 px: musbat -- tasma sochdan YUQORIDA (osmonda suzadi), manfiy -- tasma sochning
tepasini yopadi.

Bosh izi (izlar.json, 12..22 y) shu bilan tanlangan (5-o'tishdagi yorug' soha markazi halqasi
yangi kapyushon bilan ishlamadi: soyabon/pona yopgan qism har siljishda o'zgaradi, bosh 19->20
da 27 px sakradi):
  2-kadr: ikkala tasvir bir xil siljish, bo'shliq ~ +2 (misolda 12-13 eng tinch juftlik)
  3-kadr: 14..16 tasma sochga tegadi (-1..-4), 17 dan keyin bosh USHLANADI (misolda tasma
          chap uchi 19..22 da y 86..88) -- bosh y (320): 78.6 90 100 107.5 111 111.5 111.5 111.5 111.3
python3 test/kontakt-iz.py"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj/test')
from soch_srv import Server

W = '/home/claude/work/personaj'
TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p12'


def boshliq(k, png, E):
    L = np.asarray(Image.open(png).convert('L').resize((320, 180), Image.LANCZOS), dtype=float)
    soch = ndimage.median_filter(L, 3) > 85
    g = []
    for (x, _), (_, yb) in zip(E[str(k)]['tepa'], E[str(k)]['past']):
        X = int(round(x * 320 / 540)); t = np.nonzero(soch[:, X])[0]
        yb320 = yb * 180 / 304
        if len(t) and t.min() < yb320 + 45:       # shu ustunda soch bor (tasmadan uzoq pastdagi tutam emas)
            g.append(t.min() - yb320)
    return np.array(g)


def main():
    E = json.load(open(W + '/kap3-ekran.json'))
    sv = Server()
    try:
        for k in range(12, 23):
            p = '%s/kontakt%02d.png' % (TMP, k)
            sv.render(k - 1, {'__kapYoq': 1}, p)
            g = boshliq(k, p, E)
            print('tasvir %2d  bo\'shliq (px, 320) %s   median %+.1f  eng katta %+.1f' % (
                k, ' '.join('%+.0f' % v for v in g), np.median(g), g.max()))
    finally:
        sv.yop()


if __name__ == '__main__':
    main()
