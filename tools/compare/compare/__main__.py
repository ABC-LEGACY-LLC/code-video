"""python3 -m compare <command> [project.json] [...]

  calibrate                                    the broken-case test of every measurement
  probe      PRJ --frames 1-11 [--json F]      probes in every frame, the difference table
  sheet      PRJ --frames 1-11 --box x0,y0,x1,y1 [--zoom 4] [--anchored]
             [--rows sample,ours,overlay,before] [--stretch 35,120] [--columns 6] --out F
  grid       PRJ --frame 5 --box ... [--zoom 8] [--contrast 1.6] --out F
  table      PRJ --frame 5 --box x0,x1,y0,y1 [--side ours]
  motion     PRJ --frames 1-11 --box x0,y0,x1,y1[;...]
  rhythm     PRJ --frames 1-11                  cuts, trend, pairs MAE
  diffmap    PRJ --pairs 1-2,6-7 --out F        difference maps
  occlusion  PRJ --frames 1-11                  figure map IoU
  unwarp     PRJ --frame 1 [--out F] [--table x0,x1,dx:y0,y1,dy] [--side sample]
  silhouette PRJ --name body_right [--frames 1-11] [--out F] [--row 5]
             [--consecutive]  (k and k+1 on one side -- what moves in the held images)
             (or --box ... --seed x,y [--condition <26] [--median 5] [--edge right])
  gif        PRJ --out F"""
import argparse, json, sys
import numpy as np
from . import project, probe, sheet, motion, diff, occlusion, unwarp, calibrate, image, silhouette


def _floats(s):
    return [float(v) for v in s.split(',')]


def main(argv=None):
    p = argparse.ArgumentParser(prog='compare', description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('command')
    p.add_argument('project', nargs='?')
    for a in ('--frames', '--box', '--out', '--json', '--rows', '--stretch', '--pairs', '--table', '--side',
              '--name', '--seed', '--condition', '--edge'):
        p.add_argument(a)
    p.add_argument('--frame', type=int)
    p.add_argument('--row', type=int)
    p.add_argument('--median', type=int, default=5)
    p.add_argument('--zoom', type=int, default=4)
    p.add_argument('--columns', type=int, default=6)
    p.add_argument('--contrast', type=float, default=1.0)
    p.add_argument('--anchored', action='store_true')
    p.add_argument('--consecutive', action='store_true')
    a = p.parse_args(argv)
    if a.command == 'calibrate':
        t, failed = calibrate.run_all(); print(t); return 1 if failed else 0
    prj = project.Project(a.project)
    K = prj.group(a.frames) if a.frames else list(range(1, prj.n + 1))
    if a.command == 'probe':
        r = probe.run(prj, K)
        print(probe.table(prj, r, K))
        if a.json:
            json.dump(r, open(a.json, 'w'), indent=1)
    elif a.command == 'sheet':
        q = [int(v) for v in _floats(a.box)]
        rows = tuple(a.rows.split(',')) if a.rows else ('sample', 'ours')
        levels = tuple(_floats(a.stretch)) if a.stretch else None
        sheet.frame_sheet(prj, K, q, a.zoom, rows, a.anchored, levels, a.columns, a.out,
                          title='%s | frames %s | %s' % (prj.name, a.frames, 'anchored' if a.anchored else 'fixed box'))
        print(a.out)
    elif a.command == 'grid':
        sheet.grid(prj, a.frame, [int(v) for v in _floats(a.box)], a.zoom, a.contrast, a.out); print(a.out)
    elif a.command == 'table':
        x0, x1, y0, y1 = [int(v) for v in _floats(a.box)]
        L = image.load(prj.file(a.side or 'sample', a.frame), prj.size)
        print('    ' + ''.join('%4d' % x for x in range(x0, x1)))
        for y in range(y0, y1):
            print('%3d ' % y + ''.join('%4d' % L[y, x] for x in range(x0, x1)))
    elif a.command == 'motion':
        m = motion.box_mask(prj.size, [_floats(s) for s in a.box.split(';')])
        t, _ = motion.table(prj, K, m); print(t)
    elif a.command == 'rhythm':
        print(diff.rhythm(prj, K))
    elif a.command == 'diffmap':
        j = [tuple(int(v) for v in s.split('-')) for s in a.pairs.split(',')]
        diff.diffmap(prj, j, a.out); print(a.out)
    elif a.command == 'occlusion':
        ms, mo, i = occlusion.compare(prj, K)
        print('sample\n' + occlusion.draw(ms)); print('ours\n' + occlusion.draw(mo))
        print('coverage sample %.1f%%  ours %.1f%%  IoU %.2f' % (ms.mean() * 100, mo.mean() * 100, i))
    elif a.command == 'unwarp':
        T = unwarp.transforms(prj.transform_path())[a.frame]
        if a.out:
            unwarp.sheet(prj, a.frame, T, a.out); print(a.out)
        if a.table:
            xs, ys = a.table.split(':')
            print(unwarp.table(prj, a.frame, T, _floats(xs), _floats(ys), a.side or 'sample'))
    elif a.command == 'silhouette':
        if a.name:
            spec = next(s for s in prj.silhouettes if s['name'] == a.name)
        else:
            spec = {'name': 'ad-hoc', 'box': [int(v) for v in _floats(a.box)], 'seed': _floats(a.seed),
                    'condition': a.condition or '<26', 'median': a.median, 'edge': a.edge or 'right'}
        if a.consecutive:
            KK, o = silhouette.consecutive(prj, spec, K if a.frames else None)
            print(silhouette.consecutive_table(spec, KK, o))
            return 0
        r = silhouette.run(prj, spec, K if a.frames else None)
        print(silhouette.table(spec, r))
        if a.row:
            print(silhouette.row_table(r, a.row))
        if a.out:
            silhouette.sheet(prj, spec, r, a.out, zoom=a.zoom if a.zoom != 4 else 3, columns=a.columns); print(a.out)
    elif a.command == 'gif':
        print(sheet.gif(prj, a.out), 'images ->', a.out)
    else:
        p.error('unknown command: ' + a.command)
    return 0


if __name__ == '__main__':
    sys.exit(main())
