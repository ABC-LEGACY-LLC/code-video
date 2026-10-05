"""9-O'TISH O'LCHOV YIG'INDISI -- har yamoq olib tashlangandan keyin UCH SHOT BIRGALIKDA va kamera sinovi (bir xil kod):
  render (--render): anime toza (qorN=1) -> kadrlar-toza-TEG, rol -> kadrlar-misol/rol-TEG, anime oddiy -> kadrlar-misol/anime-TEG
  1-shot yuz zondlari (taqqos zond, loyiha taqqos3d_kamera8.json dan: biz = kadrlar-toza-TEG, eski = kadrlar-toza-8 -- topshirilgan 8)
  2-shot old kontur, 3-shot ko'z va iyak (audit_misol/sahna_olch.py), ko'rinadigan bosh va figura (kap_olch.py),
  1-shot 9->10->11 masshtab (masshtab.py), qor (qor_zoom.py), kamera sinovi (kamera_sinov9.mjs: kamYol, orbita -- rol).
python3 test/olch9.py TEG [--render] [--asos rol-kamera8,kadrlar-toza-8,topshirilgan8]"""
import sys, os, json, re, subprocess
import numpy as np
R = '/home/claude/work/personaj3d'
sys.path.insert(0, R + '/test/audit_misol')
import kap_olch as KO, qor_zoom as QZ, masshtab as MS

def yugur(cmd, cwd=R):
    return subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)

def render(teg):
    cmds = [f'node render.mjs --style anime --film misol22 --kadrlar 0-21 --chiq kadrlar-toza-{teg} --w 960 --h 540 --qoshimcha "qorN=1"',
            f'node render.mjs --style rol --film misol22 --kadrlar 0-21 --chiq kadrlar-misol/rol-{teg} --w 960 --h 540',
            f'node render.mjs --style anime --film misol22 --kadrlar 0-21 --chiq kadrlar-misol/anime-{teg} --w 960 --h 540']
    ps = [subprocess.Popen(c, cwd=R, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) for c in cmds]
    for p in ps:
        o = p.communicate()[0]
        if p.returncode: print('RENDER XATO', o[-2000:]); sys.exit(1)

def zond(teg, eski='kadrlar-toza-8'):
    d = json.load(open(R + '/test/taqqos/taqqos3d_kamera8.json'))
    d['nom'] = "personaj3d -- 9-o'tish (%s), yuz zondlari" % teg
    d['biz'] = R + '/kadrlar-toza-%s/%%03d.png' % teg; d['eski'] = R + '/%s/%%03d.png' % eski; d['eski_izoh'] = eski
    f = R + '/test/taqqos/taqqos3d_%s.json' % teg; json.dump(d, open(f, 'w'), indent=1, ensure_ascii=False)
    o = yugur('python3 -m taqqos zond ' + f, cwd='/home/claude/work/mono/taqqos').stdout
    res = {}
    for line in o.splitlines():
        m = re.match(r'^(\S+\.\S+|LANGAR\.\S)\s+(.*?)\s+([0-9.]+)$', line)
        if not m: continue
        vals = m.group(2).split()
        res[m.group(1)] = {'ort': float(m.group(3)), 'kadr': [None if v in ('-', 'yoq') else float(v.rstrip('*')) for v in vals[:11]]}
    return res

def sahna(papka):
    yugur('python3 test/audit_misol/sahna_olch.py ' + papka)
    return json.load(open(R + '/test/audit_misol/sahna_olch_%s.json' % papka.replace('/', '_')))

def kamera(teg):
    out = {}
    for film in ('kamYol', 'orbita'):
        f = R + '/test/sinov9_%s_%s.json' % (film, teg)
        yugur(f'node test/kamera_sinov9.mjs --film {film} --style rol --chiq {f}')
        d = json.load(open(f))['natija']
        out[film] = {c: {'nisbiy_max': max(e['qism'][c]['nisbiy'].get('max', 0) or 0 for e in d),
                         'qadam_max': max((e['qism'][c]['qadam'] or {}).get('max', 0) or 0 for e in d)} for c in d[0]['qism']}
        out[film]['tepa'] = max(e['tepa']['ogish'] for e in d)
    return out

def olch(teg, rol, toza, anime):
    o = {'teg': teg}
    k = KO.olch(R + '/' + rol)
    o['bosh'] = {s: {'iou': round(v['iou'], 3), 'nisbat': round(v['nisbat'], 2), 'figura': round(v['figura'], 3), 'figura_maydon': round(v['figura_maydon'], 3)} for s, v in k['shot'].items()}
    s = sahna(toza)
    m2, b2 = s['misol']['2shot_kontur'], s['biz']['2shot_kontur']
    d2 = [b2[y] - m2[y] for y in m2 if b2.get(y) is not None and m2[y] is not None]
    o['shot2_kontur'] = {'ort_abs': round(float(np.mean(np.abs(d2))), 2), 'farq': d2}
    d3 = []; kz = []
    for n in ('20', '21', '22'):
        a, b = s['misol']['3shot'][n], s['biz']['3shot'][n]
        d3 += [b['kontur'][y] - a['kontur'][y] for y in a['kontur'] if b['kontur'].get(y) is not None and a['kontur'][y] is not None]
        kz.append([b['koz'][0] - a['koz'][0], b['koz'][1] - a['koz'][1]])
    o['shot3'] = {'kontur_ort_abs': round(float(np.mean(np.abs(d3))), 2), 'koz': kz}
    o['masshtab'] = [round(MS.ecc(MS.L(MS.fayl(R + '/' + anime, i)), MS.L(MS.fayl(R + '/' + anime, i + 1))), 3) for i in (9, 10)]
    q = QZ.olch(R + '/' + anime)[0]
    o['qor'] = {sh: {'soni': round(float(v['soni'])), 'p90': round(float(v['p90']), 1)} for sh, v in q.items()}
    o['qor_kesish'] = [round(QZ.kesish(R + '/' + anime, i, j)[2], 2) for i, j in ((11, 12), (13, 14))]
    return o

if __name__ == '__main__':
    teg = sys.argv[1]
    if teg == '8':          # asos: topshirilgan 8-o'tish (rol va toza -- 8-o'tish renderlari, anime -- topshirilgan GIF kadrlari)
        natija = {'hozir': olch(teg, 'kadrlar-misol/rol-kamera8', 'kadrlar-toza-8', 'kadrlar-misol/topshirilgan8')}
        d = json.load(open(R + '/test/taqqos/taqqos3d_kamera8.json')); natija['zond'] = None
        o = yugur('python3 -m taqqos zond ' + R + '/test/taqqos/taqqos3d_kamera8.json', cwd='/home/claude/work/mono/taqqos').stdout
        natija['zond'] = {}
        for line in o.splitlines():
            m = re.match(r'^(\S+\.\S+|LANGAR\.\S)\s+(.*?)\s+([0-9.]+)$', line)
            if m: vals = m.group(2).split(); natija['zond'][m.group(1)] = {'ort': float(m.group(3)), 'kadr': [None if v in ('-', 'yoq') else float(v.rstrip('*')) for v in vals[:11]]}
        natija['kamera'] = {}
        for film in ('kamYol', 'orbita'):
            dd = json.load(open(R + '/test/sinov9_%s_oldin.json' % film))['natija']
            natija['kamera'][film] = {c: {'nisbiy_max': max(e['qism'][c]['nisbiy'].get('max', 0) or 0 for e in dd), 'qadam_max': max((e['qism'][c]['qadam'] or {}).get('max', 0) or 0 for e in dd)} for c in dd[0]['qism']}
            natija['kamera'][film]['tepa'] = max(e['tepa']['ogish'] for e in dd)
    else:
        if '--render' in sys.argv: render(teg)
        natija = {'hozir': olch(teg, 'kadrlar-misol/rol-' + teg, 'kadrlar-toza-' + teg, 'kadrlar-misol/anime-' + teg)}
        natija['zond'] = zond(teg)
        natija['kamera'] = kamera(teg)
    json.dump(natija, open(R + '/test/olch9_%s.json' % teg, 'w'), indent=1)
    h = natija['hozir']
    print('== %s' % teg)
    for sh, v in h['bosh'].items(): print('  %s  bosh IoU %.3f nisbat %.2f | figura IoU %.3f maydon %.3f' % (sh, v['iou'], v['nisbat'], v['figura'], v['figura_maydon']))
    print('  2-shot old kontur |farq| %.2f px   3-shot iyak kontur |farq| %.2f px, ko\'z %s' % (h['shot2_kontur']['ort_abs'], h['shot3']['kontur_ort_abs'], h['shot3']['koz']))
    print('  masshtab 9->10, 10->11: %s   qor soni %s   kesish r %s' % (h['masshtab'], [v['soni'] for v in h['qor'].values()], h['qor_kesish']))
    z = natija['zond']
    print('  1-shot zondlar (o\'rtacha |farq|): ' + '  '.join('%s %.2f' % (k, v['ort']) for k, v in z.items()))
    for film, v in natija['kamera'].items():
        print('  kamera %s: ' % film + '  '.join('%s %.1f/%.1f' % (c, x['nisbiy_max'], x['qadam_max']) for c, x in v.items() if c != 'tepa') + '  tepa %.1f gr' % v['tepa'])
