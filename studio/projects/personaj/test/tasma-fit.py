"""TASMA TIRQISHI (11-o'tish). Uzoq yonoq ortidagi tasma -- osilgan soch tutamlari;
misolda ular orasidan osmon ko'rinadi. Har tasvirda tirqish [g0,g1] (tasma enining
ulushi, yuz tomonidan) taqqos zondi 'tasma' (hisob: L 30..55, misol langariga
nisbiy quti) bilan misoldagi songa moslanadi. Ikkala tomonda bir xil kod:
zond.langar (misolda) va zond.hisob. Render -- soch-server (toza, titroqsiz).
python3 test/tasma-fit.py [1-11]"""
import sys, os, json, itertools
import numpy as np
sys.path.insert(0, '/home/claude/work/mono/taqqos'); sys.path.insert(0, '/home/claude/work/personaj/test')
from taqqos import loyiha, tasvir, zond
from soch_srv import Server

W = '/home/claude/work/personaj'
TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/p11/tasma'
os.makedirs(TMP, exist_ok=True)
loy = loyiha.Loyiha(W + '/taqqos.json')
Z = next(z for z in loy.zondlar if z['nom'] == 'tasma')
S3 = json.load(open(W + '/soch3-fit.json'))
CHIQ = W + '/tasma-fit.json'
G0 = float(os.environ.get('G0', '0.55'))   # 7..9-tasvir ustun profili: 0.40 -> |farq| 0.200, 0.55 -> 0.134


def son(L, A):
    q = [Z['quti'][0] + A[0], Z['quti'][1] + A[1], Z['quti'][2] + A[0], Z['quti'][3] + A[1]]
    return zond.hisob(L, q, Z['L'])['n']


def main():
    kad = loy.guruh(sys.argv[1]) if len(sys.argv) > 1 else list(range(1, 12))
    nat = json.load(open(CHIQ)) if os.path.exists(CHIQ) else {}
    sv = Server()
    try:
        for k in kad:
            A, _ = zond.langar(loy, 'misol', k)
            nm = son(tasvir.ol(loy.fayl('misol', k), loy.olcham), A)
            def olch(tq):
                yol = '%s/t%02d.png' % (TMP, k)
                # __tasma ANIQ beriladi (null ham): aks holda varaq.mjs dagi oldingi moslash
                # natijasi qoladi va "tirqishsiz" o'lchov aslida eski tirqish bilan chiqadi
                ust = {'__soch3': S3[str(k)], '__tasma': tq}
                sv.render(k - 1, ust, yol); tasvir.kesh_tozala()
                return son(tasvir.ol(yol, loy.olcham), A)
            n0 = olch(None)
            best = (abs(n0 - nm), None, n0)
            if n0 > nm:            # bizda ko'p -- tirqish ochiladi
                # tirqish BOSHI qat'iy (G0): faqat soni moslansa, joyi erkin bo'lib tasvirdan
                # tasvirga sakraydi (1-urinish: 0.8, 0.75, 0.35, 0.7 ...). Misolda qorong'i
                # qism qutining tashqi yarmida (7..9-tasvir, ustunlar 6..11)
                for w in np.arange(0.02, 0.61, 0.02):
                    g0 = G0
                    if g0 + w > 0.98:
                        continue
                    tq = [round(float(g0), 2), round(float(g0 + w), 2)]
                    n = olch(tq)
                    if abs(n - nm) < best[0]:
                        best = (abs(n - nm), tq, n)
            nat[str(k)] = best[1]
            json.dump(nat, open(CHIQ, 'w'), indent=1)
            print('tasvir %2d: misol %d, biz %d -> %d  tirqish %s' % (k, nm, n0, best[2], best[1]), flush=True)
    finally:
        sv.yop()


if __name__ == '__main__':
    main()
