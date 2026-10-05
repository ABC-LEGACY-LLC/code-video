"""TUZILISH O'LCHOVI (12-o'tish) -- rol renderlari (320x180, %03d.png, 0..21) bo'yicha, test/fit_kap_tuz.mjs dagi sahifa bahosi
(window.kapTuzBaho) bilan BIR XIL ta'riflar: bosh qobig'i to'ri (test/qism/sirt_proyeksiya_02.json, 9 kadr) har nuqtasi misolda
va bizda qaysi sinf (0 bosh -- teri/bo'yin/soch; 1 ich -- kapyushon/plash ichi va AO/soya qorong'isi; 2 tashqi -- boshqa figura;
3 fon); shot bo'yicha sinf IoU va kelishuv; figura -- 32x18 bloklar, yumshoq IoU (test/misol_figura8.json). MAXFIY nishon.
  python3 test/qism/tuz_olch.py [SIRT.json] ROL_DIR [ROL_DIR2 ...]   (SIRT -- boshqa qobiq, masalan sirt_proyeksiya_055.json)"""
import sys, json, base64, numpy as np
from PIL import Image
R = '/home/claude/work/personaj3d/'
S = json.load(open(R + (sys.argv[1] if sys.argv[1].endswith('.json') else 'test/qism/sirt_proyeksiya_02.json')))
M = json.load(open(R + 'test/qism/inson/qism_nishon_12.json'))['m']
FIG = json.load(open(R + 'test/misol_figura8.json')); FIGT = {1: np.array(FIG['shot1']), 2: np.array(FIG['shot2']), 3: np.array(FIG['shot3'])}
SHOT = lambda f: 1 if f <= 10 else 2 if f <= 12 else 3
GR = {}
for ks, G in S['kadr'].items():
    f = int(ks) - 1; m = np.frombuffer(base64.b64decode(M[str(f)]), np.uint8).reshape(180, 320)
    px, c = [], []
    for row in G:
        for x, y, v in row:
            if v < 0.2 or not (0 <= x < 320 and 0 <= y < 180): continue
            j = int(y) * 320 + int(x); b = m.flat[j]; px.append(j); c.append(0 if b & 1 else 1 if b & 2 else 2 if b & 4 else 3)
    GR[f] = (np.array(px), np.array(c))
def sinf(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    o = np.full(r.shape, 3)
    o[(r + g + b) > 30] = 2
    o[(b > 30) & (b < 90) & (g < 30) & (r < 90)] = 1
    o[((r > 30) & (g < 30) & (b < 30)) | ((g > 30) & (r < 30) & (b < 30))] = 0
    return o
def iou(C, k):
    d = C[k].sum() + C[:, k].sum() - C[k, k]
    return C[k, k] / d if d else 1.0
def olch(D):
    out = {}
    for s in (1, 2, 3):
        fs = [f for f in GR if SHOT(f) == s]; C = np.zeros((4, 4)); B = np.zeros((18, 32))
        for f in fs:
            a = np.asarray(Image.open('%s/%03d.png' % (D, f)).convert('RGB')); cl = sinf(a).ravel()
            px, cm = GR[f]; np.add.at(C, (cm, cl[px]), 1)
            fig = ((a.astype(int).sum(-1)) > 30).astype(float)
            B += fig.reshape(18, 10, 32, 10).mean((1, 3)) / len(fs)
        T = FIGT[s]
        out[s] = dict(mos=np.trace(C) / C.sum(), bosh=iou(C, 0), ich=iou(C, 1), tashqi=iou(C, 2), fig=np.minimum(B, T).sum() / np.maximum(B, T).sum())
    return out
if __name__ == '__main__':
    for D in [a for a in sys.argv[1:] if not a.endswith('.json')]:
        o = olch(D)
        print(D.split('/')[-1].ljust(22), ' | '.join('%d: mos %.3f bosh %.3f ich %.3f tashqi %.3f fig %.3f' % (s, o[s]['mos'], o[s]['bosh'], o[s]['ich'], o[s]['tashqi'], o[s]['fig']) for s in (1, 2, 3)))
