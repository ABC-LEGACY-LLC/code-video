"""PASS 9 MEASUREMENT SUMMARY -- after each patch is removed, ALL THREE SHOTS TOGETHER and the camera test (the same code):
  render (--render): clean anime (snowN=1) -> frames-clean-TAG, role -> frames-sample/role-TAG, plain anime -> frames-sample/anime-TAG
  shot 1 face probes (compare probe, from the project compare3d_camera8.json: ours = frames-clean-TAG, old = frames-clean-8 -- the delivered 8)
  shot 2 front contour, shot 3 eye and chin (audit_sample/stage_measure.py), visible head and figure (hood_measure.py),
  shot 1 9->10->11 scale (scale.py), snow (snow_zoom.py), camera test (camera_test9.mjs: camPath, orbit -- role).
python3 test/measure9.py TAG [--render] [--base role-camera8,frames-clean-8,delivered8]"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import sys, os, json, re, subprocess
import numpy as np
R = (P3D_DIR)
sys.path.insert(0, R + '/test/audit_sample')
import hood_measure as KO, snow_zoom as QZ, scale as MS

def run(cmd, cwd=R):
    return subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)

def render(tag):
    cmds = [f'node render.mjs --style anime --film sample22 --frames 0-21 --out frames-clean-{tag} --w 960 --h 540 --extra "snowN=1"',
            f'node render.mjs --style role --film sample22 --frames 0-21 --out frames-sample/role-{tag} --w 960 --h 540',
            f'node render.mjs --style anime --film sample22 --frames 0-21 --out frames-sample/anime-{tag} --w 960 --h 540']
    ps = [subprocess.Popen(c, cwd=R, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) for c in cmds]
    for p in ps:
        o = p.communicate()[0]
        if p.returncode: print('RENDER ERROR', o[-2000:]); sys.exit(1)

def probe(tag, before='frames-clean-8'):
    d = json.load(open(R + '/test/compare/compare3d_camera8.json'))
    d['name'] = "personaj3d -- pass 9 (%s), face probes" % tag
    d['ours'] = R + '/frames-clean-%s/%%03d.png' % tag; d['before'] = R + '/%s/%%03d.png' % before; d['before_note'] = before
    f = R + '/test/compare/compare3d_%s.json' % tag; json.dump(d, open(f, 'w'), indent=1, ensure_ascii=False)
    o = run('python3 -m compare probe ' + f, cwd=(COMPARE_DIR)).stdout
    res = {}
    for line in o.splitlines():
        m = re.match(r'^(\S+\.\S+|ANCHOR\.\S)\s+(.*?)\s+([0-9.]+)$', line)
        if not m: continue
        vals = m.group(2).split()
        res[m.group(1)] = {'mean': float(m.group(3)), 'frame': [None if v in ('-', 'absent') else float(v.rstrip('*')) for v in vals[:11]]}
    return res

def stage(folder):
    run('python3 test/audit_sample/stage_measure.py ' + folder)
    return json.load(open(R + '/private/test/audit_sample/stage_measure_%s.json' % folder.replace('/', '_')))

def camera(tag):
    out = {}
    for film in ('camPath', 'orbit'):
        f = R + '/test/test9_%s_%s.json' % (film, tag)
        run(f'node test/camera_test9.mjs --film {film} --style role --out {f}')
        d = json.load(open(f))['result']
        out[film] = {c: {'relative_max': max(e['part'][c]['relative'].get('max', 0) or 0 for e in d),
                         'step_max': max((e['part'][c]['step'] or {}).get('max', 0) or 0 for e in d)} for c in d[0]['part']}
        out[film]['top'] = max(e['top']['deviation'] for e in d)
    return out

def measure(tag, role, clean, anime):
    o = {'tag': tag}
    k = KO.measure(R + '/' + role)
    o['head'] = {s: {'iou': round(v['iou'], 3), 'ratio': round(v['ratio'], 2), 'figure': round(v['figure'], 3), 'figure_area': round(v['figure_area'], 3)} for s, v in k['shot'].items()}
    s = stage(clean)
    m2, b2 = s['sample']['2shot_contour'], s['ours']['2shot_contour']
    d2 = [b2[y] - m2[y] for y in m2 if b2.get(y) is not None and m2[y] is not None]
    o['shot2_contour'] = {'mean_abs': round(float(np.mean(np.abs(d2))), 2), 'diff': d2}
    d3 = []; kz = []
    for n in ('20', '21', '22'):
        a, b = s['sample']['3shot'][n], s['ours']['3shot'][n]
        d3 += [b['contour'][y] - a['contour'][y] for y in a['contour'] if b['contour'].get(y) is not None and a['contour'][y] is not None]
        kz.append([b['eye'][0] - a['eye'][0], b['eye'][1] - a['eye'][1]])
    o['shot3'] = {'contour_mean_abs': round(float(np.mean(np.abs(d3))), 2), 'eye': kz}
    o['scale'] = [round(MS.ecc(MS.L(MS.file(R + '/' + anime, i)), MS.L(MS.file(R + '/' + anime, i + 1))), 3) for i in (9, 10)]
    q = QZ.measure(R + '/' + anime)[0]
    o['snow'] = {sh: {'count': round(float(v['count'])), 'p90': round(float(v['p90']), 1)} for sh, v in q.items()}
    o['snow_cut'] = [round(QZ.cut(R + '/' + anime, i, j)[2], 2) for i, j in ((11, 12), (13, 14))]
    return o

if __name__ == '__main__':
    tag = sys.argv[1]
    if tag == '8':          # base: the delivered pass 8 (role and clean -- pass 8 renders, anime -- the delivered GIF frames)
        result = {'now': measure(tag, 'frames-sample/role-camera8', 'frames-clean-8', 'frames-sample/delivered8')}
        d = json.load(open(R + '/test/compare/compare3d_camera8.json')); result['probe'] = None
        o = run('python3 -m compare probe ' + R + '/test/compare/compare3d_camera8.json', cwd=(COMPARE_DIR)).stdout
        result['probe'] = {}
        for line in o.splitlines():
            m = re.match(r'^(\S+\.\S+|ANCHOR\.\S)\s+(.*?)\s+([0-9.]+)$', line)
            if m: vals = m.group(2).split(); result['probe'][m.group(1)] = {'mean': float(m.group(3)), 'frame': [None if v in ('-', 'absent') else float(v.rstrip('*')) for v in vals[:11]]}
        result['camera'] = {}
        for film in ('camPath', 'orbit'):
            dd = json.load(open(R + '/test/test9_%s_before.json' % film))['result']
            result['camera'][film] = {c: {'relative_max': max(e['part'][c]['relative'].get('max', 0) or 0 for e in dd), 'step_max': max((e['part'][c]['step'] or {}).get('max', 0) or 0 for e in dd)} for c in dd[0]['part']}
            result['camera'][film]['top'] = max(e['top']['deviation'] for e in dd)
    else:
        if '--render' in sys.argv: render(tag)
        result = {'now': measure(tag, 'frames-sample/role-' + tag, 'frames-clean-' + tag, 'frames-sample/anime-' + tag)}
        result['probe'] = probe(tag)
        result['camera'] = camera(tag)
    json.dump(result, open(R + '/test/measure9_%s.json' % tag, 'w'), indent=1)
    h = result['now']
    print('== %s' % tag)
    for sh, v in h['head'].items(): print('  %s  head IoU %.3f ratio %.2f | figure IoU %.3f area %.3f' % (sh, v['iou'], v['ratio'], v['figure'], v['figure_area']))
    print('  shot 2 front contour |diff| %.2f px   shot 3 chin contour |diff| %.2f px, eye %s' % (h['shot2_contour']['mean_abs'], h['shot3']['contour_mean_abs'], h['shot3']['eye']))
    print('  scale 9->10, 10->11: %s   snow count %s   cut r %s' % (h['scale'], [v['count'] for v in h['snow'].values()], h['snow_cut']))
    z = result['probe']
    print('  shot 1 probes (mean |diff|): ' +'  '.join('%s %.2f' % (k, v['mean']) for k, v in z.items()))
    for film, v in result['camera'].items():
        print('  camera %s: ' % film + '  '.join('%s %.1f/%.1f' % (c, x['relative_max'], x['step_max']) for c, x in v.items() if c != 'top') + '  top %.1f deg' % v['top'])
