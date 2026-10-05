"""INSON BELGILARI -- tayyorlash (11-o'tish).
Alonur MISOL kadrlarida bosh qismlarini qo'lda belgilaydi; Claude o'z detektorlarini shu belgilar bilan tekshiradi
va bizning model farqini (biz - misol) ikki yo'l bilan ko'rsatadi: o'z detektori bo'yicha va odam nuqtasi bo'yicha.
Bizning kadrlar belgilanmaydi (Alonur: chala modelda "to'g'ri joy" yo'q; qo'l aniqligi u yerda 3D ta'rifimiz bilan
aralashib ketadi). Qo'l shovqini -- takror: bir xil misol chizmasi ikki marta (R12 va R13, yuz qutisida farq 0.32).

  python3 test/qism/inson/tayyorla.py TEG CHIQ_PAPKA
    CHIQ_PAPKA/misol-belgi-kadrlar.png  -- faqat misol kadrlari (1280x360, 4x2 plitka).
    CHIQ_PAPKA/koz-bilan-olchov.html    -- sahifa; misol kadrlari ICHIDA (Alonur so'radi: fayl yuklash qiyin edi).
                                           Shuning uchun sahifa faqat shaxsiy artifact bo'ladi (db -> ommaviy havola yo'q),
                                           hech qachon repoga kirmaydi. --fayl-bilan: kadrlarsiz, foydalanuvchi yuklaydi.
    CHIQ_PAPKA/malumot.json             -- sahifaga kirgan ma'lumot (tahlil ham shuni o'qiydi).

Koordinatalar: 320x180 ish o'lchami, PIKSEL MARKAZI = BUTUN SON (detektor sentroidlari bilan bir xil).
3D nuqtalar (window.qismNuqtalar) chekka konvensiyasida keladi -> markazga o'tkazish: -0.5.
MAXFIY: misol kadrlari va misoldan olingan raqamlar ommaviy repoga kirmaydi (malumot.json ham)."""
import base64, json, sys
sys.path.insert(0, '/home/claude/work/personaj3d/test/qism')
import qism_olch as QO
from pathlib import Path
from PIL import Image

ROOT = Path('/home/claude/work/personaj3d')
MAQSAD = Path('/home/claude/work/maqsad')
TEG = sys.argv[1] if len(sys.argv) > 1 else 'bosh10c'
CHIQ = Path(sys.argv[2] if len(sys.argv) > 2 else '.')
CHIQ.mkdir(parents=True, exist_ok=True)

Q = ROOT / 'test/qism'
misol = json.load(open(Q / 'misol_qism.json'))
biz = json.load(open(Q / f'biz_{TEG}.json'))            # 3D nuqtalar, kalit = render indeksi (0 = k01)
taq = json.load(open(Q / f'taqqos_{TEG}.json'))          # detektor ikkala tomonda + farq (biz - misol), kalit = k
kal = json.load(open(Q / f'kalibr_{TEG}.json'))          # detektor - 3D nuqta (bizning renderda)

# ko'rsatish tartibi: avval asosiy (2-3 shot: iyak, ko'z; takror), keyin qo'shimcha
TARTIB = [('R', 12), ('R', 17), ('R', 20), ('R', 22), ('R', 13), ('R', 14), ('R', 3), ('R', 10)]
ASOSIY = 5
ATLAS = [3, 10, 12, 13, 14, 17, 20, 22]                 # plitka tartibi: 4 ustun x 2 qator
TW, TH = 320, 180


def r2(v):
    return [round(float(v[0]), 2), round(float(v[1]), 2)]


def markaz(v):                                           # 3D (chekka) -> piksel markazi
    return [round(v[0] - 0.5, 2), round(v[1] - 0.5, 2)]


def quti(xs, ys, chap=16, tepa=14, ong=18, past=16):
    x0, y0, x1, y1 = int(min(xs)) - chap, int(min(ys)) - tepa, int(max(xs)) + ong, int(max(ys)) + past
    return [max(0, x0), max(0, y0), min(TW, x1), min(TH, y1)]


def kal_off(nom):
    c = kal.get(nom) or {}
    return (c.get('dx'), c.get('dy'))


TUZ = {('ogiz', 1): (-2.5, 0.0)}          # nishon.py dagi bilan bir xil: 1-shot og'iz, odam bilan o'lchangan ta'rif farqi


def misol_claude(k):
    """Misol kadrida Claude detektori (11-o'tishda Alonur belgilari bilan TUZATILGAN, test/qism/qism_olch.py) topgan joylar.
    Kalibr KO'CHIRILMAYDI (bizning renderdan olingan siljish misolga o'tmaydi -- ko'zda 4 px xato berardi): xom detektor,
    faqat odam bilan o'lchangan ta'rif farqi (1-shot og'iz) tuzatiladi. Jag' -- iyakdan quloq tomonga."""
    r, out = QO.olch(QO.L320(str(MAQSAD / f'k{k:02d}.png')), k), {}
    s = 1 if k <= 11 else 2 if k <= 13 else 3
    for nom, dq in (('iyak', 'iyak_uchi'), ('burun', 'burun_uchi'), ('koz_yaqin', 'koz_yaqin'), ('koz_uzoq', 'koz_uzoq'),
                    ('ogiz', 'ogiz'), ('qosh_yaqin', 'qosh_yaqin'), ('qosh_uzoq', 'qosh_uzoq')):
        v = r.get(dq)
        if v is None: continue
        x, y = (v['x'], v['y']) if isinstance(v, dict) else v
        dx, dy = TUZ.get((nom, s), (0, 0))
        out[nom] = r2([x + dx, y + dy])
    if r.get('jag'): out['jag'] = {str(x): int(y) for x, y in r['jag'].items()}
    return out


def biz_joy(k):
    """Bizning model shu kadrda qismni qayerda chizgan (misoldagi Claude qiymatlari bilan bir ta'rifda):
    ko'z/burun/og'iz o'rtasi/qosh o'rtasi -- 3D nuqta (markazga o'tkazilgan); iyak va jag' -- xuddi misoldagi detektor,
    bizning yalang'och renderda. kor -- qism kameraga qaraganmi (orqada bo'lsa bizda yashirin)."""
    p, out, kor = biz[str(k - 1)], {}, {}
    by = QO.olch(QO.rol_L(str(ROOT / f'kadrlar-qism/rol-yalang-{TEG}/{k - 1:03d}.png')), k)   # xuddi shu (tuzatilgan) detektor
    out['iyak'] = r2(by['iyak_uchi'])
    out['jag'] = {str(x): int(y) for x, y in by.get('jag', {}).items()}
    for nom, n3 in (('koz_yaqin', 'koz_yaqin'), ('koz_uzoq', 'koz_uzoq'), ('burun', 'burun_uchi'), ('ogiz', 'ogiz'),
                    ('qosh_yaqin', 'qosh_yaqin_orta'), ('qosh_uzoq', 'qosh_uzoq_orta')):
        out[nom] = markaz(p[n3]); kor[nom] = bool(p[n3][3])
    return out, kor


kadrlar = []
for i, (tur, k) in enumerate(TARTIB):
    if tur == 'R':
        r = misol[str(k)]
        x0, y0, x1, y1 = r['yuz_quti']
        box = quti([x0, x1], [y0, y1])
        bj, kor = biz_joy(k)
        kadrlar.append({'id': f'R{k:02d}', 'manba': 'misol', 'k': k, 'plitka': ATLAS.index(k), 'box': box,
                        'asosiy': i < ASOSIY, 'claude': misol_claude(k), 'biz': bj, 'biz_kor': kor})

malumot = {'teg': TEG, 'olcham': [TW, TH], 'koord': 'piksel markazi = butun son, 320x180',
           'atlas': {'w': 4 * TW, 'h': 2 * TH, 'ustun': 4, 'tartib': [f'R{k:02d}' for k in ATLAS]},
           'kadrlar': kadrlar, 'takror': ['R12', 'R13']}

# atlas -- faqat misol kadrlari
atlas = Image.new('RGB', (4 * TW, 2 * TH))
for j, k in enumerate(ATLAS):
    atlas.paste(Image.open(MAQSAD / f'k{k:02d}.png').convert('RGB'), ((j % 4) * TW, (j // 4) * TH))
atlas.save(CHIQ / 'misol-belgi-kadrlar.png', optimize=True)

json.dump(malumot, open(CHIQ / 'malumot.json', 'w'), ensure_ascii=False)
shablon = (Path(__file__).parent / 'sahifa.html').read_text()
sahifa = shablon.replace('/*MALUMOT*/null', json.dumps(malumot, ensure_ascii=False, separators=(',', ':')))
if '--fayl-bilan' not in sys.argv:
    uri = 'data:image/png;base64,' + base64.b64encode((CHIQ / 'misol-belgi-kadrlar.png').read_bytes()).decode()
    sahifa = sahifa.replace('/*ATLAS*/null', json.dumps(uri))
(CHIQ / 'koz-bilan-olchov.html').write_text(sahifa)
print('kadrlar', len(kadrlar), 'sahifa KB', len(sahifa) // 1024, 'atlas', atlas.size)
for f in kadrlar: print(f['id'], f['box'], 'Claude:', sorted(f['claude']), 'biz:', sorted(f['biz']))
