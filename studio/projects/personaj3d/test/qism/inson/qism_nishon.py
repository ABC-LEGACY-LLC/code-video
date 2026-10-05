"""MISOL QISMLARI NISHONI (12-o'tish, tuzilish; MAXFIY -- misoldan): har kadr 320x180 bitlari --
  1 -- ko'rinadigan bosh (yuz + soch, yorug' va soyada: test/audit_misol/bosh_niqob.py, L>=40 yuz urug'iga ulangan);
  2 -- kapyushon ichi (qorong'i L 5-14, figura ichida, bosh niqobidan 28 px gacha) -- misolda keng kapyushon ichi soch va
       mato orasida ko'rinadi (3 shotda ham), bizda (tor kapyushon) 19-30 px edi;
  8 -- yorug' teri (qism_olch.yuz_niqob) -- soch = 1 va 8 emas;
  4 -- figura (qor ko'rinmaydigan va osmon bo'lmagan joy): 1- va 3-shotda ushlangan kadrlarda qimirlamaydigan mato
       (std < 5, L >= 6) + bosh + ich; 2-shotda (2 kadr, bir chizma) minimum tasvirda L 15-33 mato + bosh + ich,
       eng katta bog'langan qism. Tekshiruv: varaq (test/qism/inson/qism_nishon.py --varaq CHIQ.png).
Nima uchun: 11-o'tishda kapyushon "bosh" niqobiga (astar ham bosh) moslangan -- astar sochning o'rnini to'ldirdi; endi
sinflar alohida (bosh, ich, figura), astar bosh emas.
python3 test/qism/inson/qism_nishon.py [--varaq CHIQ.png]  ->  test/qism/inson/qism_nishon_12.json"""
import sys, os, json, base64
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import bosh_niqob as BN
def Lk(k): return ndimage.median_filter(np.asarray(Image.open('/home/claude/work/maqsad/k%02d.png' % k).convert('L').resize((320, 180), Image.LANCZOS), float), 3)
SHOT = {1: list(range(1, 12)), 2: [12, 13], 3: list(range(14, 23))}
USHLA = {1: list(range(1, 7)), 3: list(range(15, 23))}
def figura_shot(s):
    if s in USHLA:
        S = np.stack([Lk(k) for k in USHLA[s]]); M = np.median(S, 0); V = ndimage.median_filter(S.std(0), 3)
        fig = (V < 5) & (M >= 6)
    else:
        M = np.minimum(Lk(12), Lk(13)); fig = (M >= 15) & (M < 33)
    fig = ndimage.binary_opening(fig, np.ones((3, 3)))
    return fig
out = {}; FIG = {s: figura_shot(s) for s in SHOT}
FIG8 = json.load(open('/home/claude/work/personaj3d/test/misol_figura8.json'))
for s, ks in SHOT.items():
    for k in ks:
        L = Lk(k); B = BN.niqob(BN.L320('/home/claude/work/maqsad/k%02d.png' % k), k)
        FG = np.kron(np.array(FIG8['shot%d' % s]), np.ones((10, 10)))[:180, :320]        # dag'al figura (8-o'tish, 32x18)
        fig0 = (FIG[s] & ndimage.binary_dilation(FG > 0.3, np.ones((9, 9)))) | B
        lab, n = ndimage.label(fig0); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        big = np.isin(lab, 1 + np.nonzero(sz > 0.2 * sz.max())[0])        # katta qismlar (figura; qor orollari tashlanadi)
        fig = ndimage.binary_fill_holes(big | B)
        near = ndimage.distance_transform_edt(~B) < 28
        ich = near & (L >= 5) & (L < 15) & ~B & ndimage.binary_erosion(fig, np.ones((5, 5)))
        sys.path.insert(0, '/home/claude/work/personaj3d/test/qism'); import qism_olch as QO
        g_, p_ = QO.params(k); Fy = QO.yuz_niqob(QO.L320('/home/claude/work/maqsad/k%02d.png' % k), p_)
        Fy = np.zeros_like(B) if Fy is None else Fy
        m = B.astype(np.uint8) | (ich.astype(np.uint8) << 1) | ((fig | ich).astype(np.uint8) << 2) | ((Fy & B).astype(np.uint8) << 3)
        # 13-o'tish (4-ish) TUZATISH -- asbob xatosi: eng qorong'i mato va bo'yin (L < 15) figura chegarasidan tashqarida qolgan edi
        # (2-shotda figura L 15..33, 1-/3-shotda L >= 6; ich L >= 5) va FON deb belgilangan. Kadrning pastki qismida (y >= 110) fon
        # L 20..50 (qor), qorong'i bo'lak fon emas: figuraga yoki boshga tutash L < 15 bo'laklar (>= 20 px) -- figura, boshdan
        # 28 px gacha bo'lganlari -- ich (iyak ostidagi bo'yin/yoqa soyasi, 2-shotda plashning qorong'i burmalari).
        fon = (m & 7) == 0; yy = np.arange(180)[:, None] * np.ones((1, 320))
        lab2, n2 = ndimage.label((L < 15) & fon & (yy >= 110)); tut = ndimage.binary_dilation(fig | B, np.ones((3, 3)))
        qosh = np.zeros_like(fon)
        for i in range(1, n2 + 1):
            c = lab2 == i
            if c.sum() >= 20 and (c & tut).any(): qosh |= c
        m[qosh] |= 4; m[qosh & near] |= 2
        out[k - 1] = base64.b64encode(m.tobytes()).decode()
H = os.path.dirname(os.path.abspath(__file__))
json.dump({'izoh': 'MAXFIY: misoldan. bit1 ko\'rinadigan bosh, bit2 kapyushon ichi, bit4 figura, bit8 teri', 'm': out}, open(os.path.join(H, 'qism_nishon_12.json'), 'w'))
print(len(out), 'kadr')
if '--varaq' in sys.argv:
    from PIL import ImageDraw
    rows = []
    for k in (3, 10, 12, 16, 20):
        m = np.frombuffer(base64.b64decode(out[k - 1]), np.uint8).reshape(180, 320); L = Lk(k)
        o = np.stack([L * 1.5] * 3, -1)
        o[(m & 4) > 0] = o[(m & 4) > 0] * 0.4 + np.array([40, 60, 160]) * 0.6
        o[(m & 2) > 0] = [120, 50, 170]; o[(m & 1) > 0] = o[(m & 1) > 0] * 0.4 + np.array([250, 230, 120]) * 0.6
        rows.append(np.concatenate([np.stack([np.clip(L * 2.2, 0, 255)] * 3, -1), np.full((180, 4, 3), 255), o], 1)); rows.append(np.full((4, 644, 3), 255))
    Image.fromarray(np.clip(np.concatenate(rows, 0), 0, 255).astype(np.uint8)).resize((1288, 2*len(rows)//2*184), Image.NEAREST).save(sys.argv[sys.argv.index('--varaq') + 1])
