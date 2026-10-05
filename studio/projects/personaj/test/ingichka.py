"""INGICHKA YORUG' CHIZIQ o'lchovi (11-o'tish). Soch niqobi (L>85, median 3) 320 da 1..2 px
ingichka va L ~75 li yoylarni ko'rmaydi -- ular faqat ko'zga ko'rinardi (uzoq ko'z ostida
ko'zoynak gardishiday yoy). Bu o'lchov ularni sanaydi: oq top-hat, L - ochish(L, 5x5) > 10
(5 px dan ingichka va atrofidan 10 dan yorug' piksellar) YONOQ qutisida -- yaqin ko'z
urug'idan (x-8..x+45, y+6..y+25). Ko'zlar qutidan tashqarida: ikki qorong'i chiziq
orasidagi teri ham "ingichka yorug'" bo'lib sanalardi (1-urinish, y-3 dan: misol 2258,
10-o'tish 2079 -- asosan ko'z atrofi). Ikkala tomonda bir xil kod; kalibr: tekis fon 0, 1 px
chiziq sanaladi, 8 px tasma sanalmaydi.
python3 test/ingichka.py papka1 [papka2 ...]   (papka -- 00..21.png; 'misol' -- maqsad)"""
import sys, glob, json
import numpy as np
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos import loyiha, tasvir

W = '/home/claude/work/personaj'
loy = loyiha.Loyiha(W + '/taqqos.json')
URUG = loy.langar['urug']


def tophat(L):
    return L - ndimage.grey_opening(L, size=(5, 5))


SP = next(s for s in loy.siluetlar if s['nom'] == 'soch')


def sana(L, k):
    """soch massasidan TASHQARIDA (o'z niqobi 3 px kengaytirilgan): tutamlar orasidagi
    ingichka yorug' yo'llar va siyoh chiziqlari orasidagi soch ham sanalardi (2-urinish:
    misol 1491 -- asosan tutamlar)"""
    from taqqos import siluet
    x, y = URUG[str(k)]
    soch = ndimage.binary_dilation(siluet.spec_niqob(L, SP, None), iterations=3)
    t = (tophat(L) > 10) & ~soch
    return int(t[y + 6:y + 25, x - 8:x + 45].sum())


def kalibr():
    L = np.full((60, 80), 60.0)
    ok0 = int((tophat(L) > 10).sum()) == 0
    L1 = L.copy(); L1[30, 10:70] = 80
    ok1 = int((tophat(L1) > 10).sum()) == 60
    L2 = L.copy(); L2[26:34, 10:70] = 80
    ok2 = int((tophat(L2) > 10).sum()) == 0
    print('kalibr: tekis 0 %s, 1 px chiziq 60 %s, 8 px tasma 0 %s' % (ok0, ok1, ok2))
    return ok0 and ok1 and ok2


if __name__ == '__main__':
    assert kalibr()
    for pap in sys.argv[1:]:
        v = []
        for k in range(1, 12):
            f = loy.fayl('misol', k) if pap == 'misol' else '%s/%02d.png' % (pap, k - 1)
            v.append(sana(tasvir.ol(f, loy.olcham), k))
        print('%-10s %s  jami %d' % (pap.split('/')[-1], ' '.join('%3d' % a for a in v), sum(v)))
