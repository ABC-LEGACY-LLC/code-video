"""python3 -m taqqos <buyruq> [loyiha.json] [...]

  kalibr                                   har o'lchovning buzilgan-holat sinovi
  zond     LOY --kadrlar 1-11 [--json F]   har kadrda zondlar, farq jadvali
  varaq    LOY --kadrlar 1-11 --quti x0,y0,x1,y1 [--zoom 4] [--langarli]
           [--qatorlar misol,biz,ustma,eski] [--chozish 35,120] [--ustun 6] --chiq F
  setka    LOY --kadr 5 --quti ... [--zoom 8] [--kontrast 1.6] --chiq F
  jadval   LOY --kadr 5 --quti x0,x1,y0,y1 [--tomon biz] [--qadam 1]
  harakat  LOY --kadrlar 1-11 --quti x0,y0,x1,y1[;...]
  ritm     LOY --kadrlar 1-11                kesish, tendensiya, juftlar MAE
  xarita   LOY --juftlar 1-2,6-7 --chiq F     farq xaritalari
  yopilish LOY --kadrlar 1-11                 figura xaritasi IoU
  yoyish   LOY --kadr 1 [--chiq F] [--jadval x0,x1,dx:y0,y1,dy] [--tomon misol]
  siluet   LOY --nom tana_ong [--kadrlar 1-11] [--chiq F] [--qator 5]
           [--ketma]  (bir tomonda k va k+1 -- ushlangan tasvirlarda nima qimirlaydi)
           (yoki --quti ... --bog x,y [--shart <26] [--median 5] [--yon ong])
  gif      LOY --chiq F"""
import argparse, json, sys
import numpy as np
from . import loyiha, zond, varaq, harakat, farq, yopilish, yoyish, kalibr, tasvir, siluet


def _q(s):
    return [float(v) for v in s.split(',')]


def main(argv=None):
    p = argparse.ArgumentParser(prog='taqqos', description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('buyruq')
    p.add_argument('loyiha', nargs='?')
    for a in ('--kadrlar', '--quti', '--chiq', '--json', '--qatorlar', '--chozish', '--juftlar', '--jadval', '--tomon',
              '--nom', '--bog', '--shart', '--yon'):
        p.add_argument(a)
    p.add_argument('--kadr', type=int)
    p.add_argument('--qator', type=int)
    p.add_argument('--median', type=int, default=5)
    p.add_argument('--zoom', type=int, default=4)
    p.add_argument('--ustun', type=int, default=6)
    p.add_argument('--kontrast', type=float, default=1.0)
    p.add_argument('--langarli', action='store_true')
    p.add_argument('--ketma', action='store_true')
    a = p.parse_args(argv)
    if a.buyruq == 'kalibr':
        t, yiq = kalibr.hammasi(); print(t); return 1 if yiq else 0
    loy = loyiha.Loyiha(a.loyiha)
    K = loy.guruh(a.kadrlar) if a.kadrlar else list(range(1, loy.n + 1))
    if a.buyruq == 'zond':
        n = zond.yugur(loy, K)
        print(zond.jadval(loy, n, K))
        if a.json:
            json.dump(n, open(a.json, 'w'), indent=1)
    elif a.buyruq == 'varaq':
        q = [int(v) for v in _q(a.quti)]
        qat = tuple(a.qatorlar.split(',')) if a.qatorlar else ('misol', 'biz')
        cho = tuple(_q(a.chozish)) if a.chozish else None
        varaq.kadr_varaq(loy, K, q, a.zoom, qat, a.langarli, cho, a.ustun, a.chiq,
                         sarlavha='%s | kadrlar %s | %s' % (loy.nom, a.kadrlar, 'langarga bog\'langan' if a.langarli else 'qat\'iy quti'))
        print(a.chiq)
    elif a.buyruq == 'setka':
        varaq.setka(loy, a.kadr, [int(v) for v in _q(a.quti)], a.zoom, a.kontrast, a.chiq); print(a.chiq)
    elif a.buyruq == 'jadval':
        x0, x1, y0, y1 = [int(v) for v in _q(a.quti)]
        L = tasvir.ol(loy.fayl(a.tomon or 'misol', a.kadr), loy.olcham)
        print('    ' + ''.join('%4d' % x for x in range(x0, x1)))
        for y in range(y0, y1):
            print('%3d ' % y + ''.join('%4d' % L[y, x] for x in range(x0, x1)))
    elif a.buyruq == 'harakat':
        m = harakat.quti_niqob(loy.olcham, [_q(s) for s in a.quti.split(';')])
        t, _ = harakat.jadval(loy, K, m); print(t)
    elif a.buyruq == 'ritm':
        print(farq.ritm(loy, K))
    elif a.buyruq == 'xarita':
        j = [tuple(int(v) for v in s.split('-')) for s in a.juftlar.split(',')]
        farq.xarita(loy, j, a.chiq); print(a.chiq)
    elif a.buyruq == 'yopilish':
        xm, xb, i = yopilish.taqqos(loy, K)
        print('misol\n' + yopilish.chiz(xm)); print('biz\n' + yopilish.chiz(xb))
        print('qamrov misol %.1f%%  biz %.1f%%  IoU %.2f' % (xm.mean() * 100, xb.mean() * 100, i))
    elif a.buyruq == 'yoyish':
        T = yoyish.transformlar(loy.transform_yol())[a.kadr]
        if a.chiq:
            yoyish.varaq(loy, a.kadr, T, a.chiq); print(a.chiq)
        if a.jadval:
            xs, ys = a.jadval.split(':')
            print(yoyish.jadval(loy, a.kadr, T, _q(xs), _q(ys), a.tomon or 'misol'))
    elif a.buyruq == 'siluet':
        if a.nom:
            spec = next(s for s in loy.siluetlar if s['nom'] == a.nom)
        else:
            spec = {'nom': 'ad-hoc', 'quti': [int(v) for v in _q(a.quti)], 'bog': _q(a.bog),
                    'shart': a.shart or '<26', 'median': a.median, 'yon': a.yon or 'ong'}
        if a.ketma:
            KK, o = siluet.ketma(loy, spec, K if a.kadrlar else None)
            print(siluet.ketma_jadval(spec, KK, o))
            return 0
        r = siluet.yugur(loy, spec, K if a.kadrlar else None)
        print(siluet.jadval(spec, r))
        if a.qator:
            print(siluet.qator_jadval(r, a.qator))
        if a.chiq:
            siluet.varaq(loy, spec, r, a.chiq, zoom=a.zoom if a.zoom != 4 else 3, ustun=a.ustun); print(a.chiq)
    elif a.buyruq == 'gif':
        print(varaq.gif(loy, a.chiq), 'tasvir ->', a.chiq)
    else:
        p.error('nomalum buyruq: ' + a.buyruq)
    return 0


if __name__ == '__main__':
    sys.exit(main())
