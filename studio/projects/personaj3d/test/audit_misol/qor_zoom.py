"""QOR MAYDONI: shot bo'yicha zarra soni / o'lchami va harakat maydoni -- "kamera zoom" ga o'xshash o'zgarishni o'lchash
(8-o'tish; foydalanuvchi: "10 dan keyin kamera zoom ga o'xshagan katta-kichik siljish"). Ikkala tomonda bir xil kod:
320x180 LANCZOS, L; zarra = top-hat (L - median9) > 28 (taqqos.yopilish.zarra), faqat FON qutisi -- shot bo'yicha
personajdan (misol va biz, bosh + soch + kapyushon) o'ngda: 1-shot x >= 170, 2-shot x >= 200, 3-shot x >= 245 (varaqda
tekshirilgan; birinchi variant x >= 144 da 2- va 3-shotda sochimiz "katta zarra" bo'lib sanalardi: p99 15 / 32).
Zarra soni -- 10 000 px ga.
  A. Har tasvir: zarra soni, maydon p90 / p99, cho'qqi L.
  C. Kesishda uzluksizlik: 10->11 (shot ichida), 11->12 va 13->14 (kesish) -- fazaviy korrelyatsiya cho'qqisi r.
  B. Har juft (shot ichida): o'ng qism 3x3 katakka bo'linadi, har katakda zarra top-hat tasvirlarining fazaviy
     korrelyatsiyasi -> (dx, dy); katak markazlari bo'yicha affin maydon dx = a + b x + c y, dy = d + e x + f y:
     siljish (a, d) katak markazlari o'rtasida, DIVERGENSIYA b + f (1/kadr; zoom s da ~ 2 (s - 1)), aylanish e - c.
Kalibr (--kalibr): misol k05 ni o'zi bilan (0), 2 px siljitilgan (+2, 0; div 0), markazdan 1.02 marta kattalashtirilgan
(div ~ +0.04) va 0.98 (div ~ -0.04) -- natija pastda chiqariladi.
python3 test/audit_misol/qor_zoom.py [--kalibr] PAPKA...   (PAPKA: %03d.png 0-asosli; 'misol' -- maqsad k%02d.png)"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
import cv2
sys.path.insert(0, '/home/claude/work/mono/taqqos')
from taqqos.yopilish import zarra

SHOT = {'1': list(range(1, 12)), '2': [12, 13], '3': list(range(14, 23))}
QUTI_X = {'1': 170, '2': 200, '3': 245}
def x0k(k): return QUTI_X['1' if k <= 11 else '2' if k <= 13 else '3']

def L(p):
    im = Image.open(p).convert('L')
    if im.size != (320, 180): im = im.resize((320, 180), Image.LANCZOS)
    return np.asarray(im, dtype=float)

def fayl(d, k): return '/home/claude/work/maqsad/k%02d.png' % k if d == 'misol' else '%s/%03d.png' % (d, k - 1)

def tophat(a):
    t = a - ndimage.median_filter(a, 9)
    return np.clip(t, 0, None) * zarra(a)       # faqat zarra piksellari (qolgani 0)

def statistika(a, X0):
    m = zarra(a)[:, X0:]
    lab, n = ndimage.label(m)
    if not n: return 0, 0, 0, 0
    s = ndimage.sum(m, lab, range(1, n + 1)); pk = ndimage.maximum(a[:, X0:], lab, range(1, n + 1))
    return n * 1e4 / m.size, float(np.percentile(s, 90)), float(np.percentile(s, 99)), float(np.median(pk))

def maydon(a, b, X0=144):
    """a -> b harakat maydoni: 3x3 katak, har birida fazaviy korrelyatsiya; affin moslash."""
    ta, tb = tophat(a)[:, X0:].astype(np.float32), tophat(b)[:, X0:].astype(np.float32)
    H, W = ta.shape; P, Q, V = [], [], []
    for i in range(3):
        for j in range(3):
            y0, y1, x0, x1 = i * H // 3, (i + 1) * H // 3, j * W // 3, (j + 1) * W // 3
            ca, cb = ta[y0:y1, x0:x1], tb[y0:y1, x0:x1]
            if ca.sum() < 50 or cb.sum() < 50: continue
            win = cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_32F)
            (dx, dy), r = cv2.phaseCorrelate(ca, cb, win)
            if r < 0.05: continue
            P.append([1.0, (x0 + x1) / 2 - W / 2, (y0 + y1) / 2 - H / 2]); Q.append(dx); V.append(dy)
    if len(P) < 5: return None
    P = np.array(P); cx = np.linalg.lstsq(P, np.array(Q), rcond=None)[0]; cy = np.linalg.lstsq(P, np.array(V), rcond=None)[0]
    return dict(dx=cx[0], dy=cy[0], div=cx[1] + cy[2], ayl=cy[1] - cx[2], n=len(P))

def kesish(d, i, j, X0=200):
    """qo'shni tasvirlar (kesish orqali ham) qor maydonining siljishi va korrelyatsiya cho'qqisi r: misolda qatlam
    uzluksiz (r ~0.7 shot ichida ham, kesishda ham), qayta chizilgan qorda r ~0.0-0.1"""
    ta, tb = tophat(L(fayl(d, i)))[:, X0:].astype(np.float32), tophat(L(fayl(d, j)))[:, X0:].astype(np.float32)
    win = cv2.createHanningWindow((ta.shape[1], ta.shape[0]), cv2.CV_32F)
    (dx, dy), r = cv2.phaseCorrelate(ta, tb, win)
    return dx, dy, r

def kalibr():
    a = L(fayl('misol', 5)); H, W = a.shape
    def zoom(s):
        M = cv2.getRotationMatrix2D((144 + (W - 144) / 2, H / 2), 0, s)
        return cv2.warpAffine(a.astype(np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(float)
    sh = np.roll(a, 2, axis=1)
    for nom, b, kut in (("o'zi", a, 'dx 0, div 0'), ('+2 px', sh, 'dx +2, div 0'), ('zoom 1.02', zoom(1.02), 'div ~+0.04'), ('zoom 0.98', zoom(0.98), 'div ~-0.04')):
        m = maydon(a, b)
        print('KALIBR %-10s dx %+.2f dy %+.2f div %+.4f ayl %+.4f (katak %d)   kutilgan: %s' % (nom, m['dx'], m['dy'], m['div'], m['ayl'], m['n'], kut))

def olch(d):
    F = {k: L(fayl(d, k)) for k in range(1, 23)}
    st = {k: statistika(F[k], x0k(k)) for k in F}
    out = {}
    for s, ks in SHOT.items():
        mv = [maydon(F[k], F[k + 1], QUTI_X[s]) for k in ks[:-1]]; mv = [m for m in mv if m]
        out[s] = dict(soni=np.mean([st[k][0] for k in ks]), p90=np.mean([st[k][1] for k in ks]), p99=np.mean([st[k][2] for k in ks]),
                      pk=np.mean([st[k][3] for k in ks]), dx=np.median([m['dx'] for m in mv]) if mv else np.nan,
                      dy=np.median([m['dy'] for m in mv]) if mv else np.nan, div=np.median([m['div'] for m in mv]) if mv else np.nan,
                      divs=[m['div'] for m in mv])
    return out, st

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--kalibr' in args: kalibr(); args = [x for x in args if x != '--kalibr']
    for d in args:
        o, st = olch(d)
        print('==', d.rstrip('/').split('/')[-1])
        for s, e in o.items():
            print('  %s-shot: zarra /10k px %5.0f  maydon p90 %.1f p99 %.1f  cho\'qqi L %.0f | siljish (%.2f, %.2f) px/kadr  divergensiya %+.4f  [%s]'
                  % (s, e['soni'], e['p90'], e['p99'], e['pk'], e['dx'], e['dy'], e['div'], ' '.join('%+.3f' % v for v in e['divs'])))
        print('  kesishda uzluksizlik (x >= 200, top-hat fazaviy korrelyatsiya): ' + '  '.join('%d->%d (%.1f, %.1f) r %.2f' % (i, j, *kesish(d, i, j)) for i, j in ((10, 11), (11, 12), (13, 14))))
        print('  har tasvir soni/10k: ' + ' '.join('%d' % st[k][0] for k in range(1, 23)))
        print('  har tasvir p99:  ' + ' '.join('%.0f' % st[k][2] for k in range(1, 23)))
