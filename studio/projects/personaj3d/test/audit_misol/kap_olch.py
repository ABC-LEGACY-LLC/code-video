"""KAPYUSHON O'LCHOVI (7-o'tish) -- ikkala tomonda bir xil kod, 320x180.
  A. Ko'rinadigan bosh: misolda test/misol_bosh7.json (bosh_niqob.py: median 5, L>=40, ochish, yuz urug'i, 3-shotda
     ruxsat qutisi), bizda rol renderidan ANIQ (teri, bo'yin, soch, qopqoq, astar -- misol niqobida astar tasmasi L 43-48
     ham bor), 3-shotda o'sha quti. Har tasvir: IoU, maydon (px), biz/misol nisbati.
  B. Figura (uch shot; 2-shot 8-o'tishda qo'shildi): rol renderida fon emas ulushi 10x10 blokda, shot tasvirlari
     o'rtachasi, misolning yopilish xaritasi (test/misol_figura8.json) bilan yumshoq IoU va maydon ulushi.
python3 test/audit_misol/kap_olch.py ROL_PAPKA [ROL_PAPKA2 ...]   (%03d.png, 0-asosli; istalgan o'lcham -> 320x180 NEAREST)"""
import sys, json, base64
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import bosh_niqob as BN
R = '/home/claude/work/personaj3d'
REF = json.load(open(R + '/test/misol_bosh7.json'))['m']
FIG = json.load(open(R + '/test/misol_figura8.json'))       # 8-o'tish: 2-shot xaritasi ham (k12-13, 2 tasvir)
SHOT = {'1-shot': range(0, 11), '2-shot': (11, 12), '3-shot': range(13, 22)}
FIGFR = {'1-shot': ([0, 3, 6, 8, 9, 10], 'shot1'), '2-shot': ([11, 12], 'shot2'), '3-shot': ([13, 15, 17, 19, 21], 'shot3')}

def misol(f): return (np.frombuffer(base64.b64decode(REF[str(f)]), np.uint8).reshape(180, 320) & 1).astype(bool)

def rol(p):
    return np.asarray(Image.open(p).convert('RGB').resize((320, 180), Image.NEAREST), int)

def bosh(a, f):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30)) | ((g > 200) & (b > 200) & (r < 30))
    if f >= 13: m &= BN.RUXSAT3
    return m

def olch(d):
    o = {'tasvir': {}, 'shot': {}}
    for f in range(22):
        a = rol('%s/%03d.png' % (d, f)); mb = bosh(a, f); mr = misol(f)
        o['tasvir'][f] = dict(iou=float((mb & mr).sum() / max(1, (mb | mr).sum())), biz=int(mb.sum()), misol=int(mr.sum()))
    for s, fr in SHOT.items():
        t = [o['tasvir'][f] for f in fr]
        o['shot'][s] = dict(iou=float(np.mean([x['iou'] for x in t])), nisbat=float(np.mean([x['biz'] / max(1, x['misol']) for x in t])),
                            biz=[x['biz'] for x in t], misol=[x['misol'] for x in t])
    for s, (fr, k) in FIGFR.items():
        B = np.zeros((18, 32))
        for f in fr:
            B += (rol('%s/%03d.png' % (d, f)).sum(-1) > 30).reshape(18, 10, 32, 10).mean((1, 3))
        B /= len(fr); T = np.array(FIG[k])
        o['shot'][s]['figura'] = float(np.minimum(B, T).sum() / np.maximum(B, T).sum())
        o['shot'][s]['figura_maydon'] = float(B.mean()); o['shot'][s]['figura_maydon_misol'] = float(T.mean())
    return o

if __name__ == '__main__':
    for d in sys.argv[1:]:
        o = olch(d); print('==', d)
        for s, e in o['shot'].items():
            print('  %s  bosh IoU %.3f  biz/misol %.2f  %s' % (s, e['iou'], e['nisbat'], ('figura IoU %.3f  maydon %.3f (misol %.3f)' % (e['figura'], e['figura_maydon'], e['figura_maydon_misol'])) if 'figura' in e else ''))
        print('  IoU har tasvir: ' + ' '.join('%.2f' % o['tasvir'][f]['iou'] for f in range(22)))
        print('  biz px:         ' + ' '.join('%d' % o['tasvir'][f]['biz'] for f in range(22)))
        print('  misol px:       ' + ' '.join('%d' % o['tasvir'][f]['misol'] for f in range(22)))
        json.dump(o, open(d.rstrip('/') + '_kap7.json', 'w'), indent=1)
