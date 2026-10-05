"""INSON BELGILARI -- tahlil (11-o'tish).
  python3 test/qism/inson/tahlil.py MALUMOT.json BELGILAR.json [--json CHIQ.json]
    MALUMOT.json  -- tayyorla.py yozgan (sahifaga kirgan) ma'lumot: misol kadrlari, Claude o'lchovi, bizning model joyi
    BELGILAR.json -- sahifadan: "JSON nusxasi" ({marks,notes,harakat}) yoki db hujjatlari (ro'yxat / {id: body})
  python3 test/qism/inson/tahlil.py --kalibr MALUMOT.json   -- asbobning o'zini sintetik belgilar bilan tekshirish

Faqat MISOL kadrlari belgilanadi (Alonur: chala modelda "to'g'ri joy" yo'q). Hammasi 320x180, piksel markazi = butun son.
  1. TAKROR: R12 va R13 -- bir xil chizma (yuz qutisida o'rtacha farq 0.32): ikki javob masofasi d, E[d^2] = 4 sigma^2.
  2. DETEKTOR: odam - Claude, xom (qo'l siljishi o'lchanmagan: farq ta'rif farqini ham o'z ichiga oladi). Masofa
     3 sigma (kamida 2 px) dan katta -- TEKSHIR: varaqda kim nimani o'lchaganini ko'rish (odam ham adashishi mumkin).
     Shot bo'yicha o'rtacha ham beriladi: bir shotda hammasi bir tomonga siljisa -- detektor o'sha shotda boshqa narsani
     o'lchayotgan bo'lishi mumkin (median bilan yashirib bo'lmaydi: 8 kadrning 6 tasi 2-3 shotda).
  3. FARQ: bizning model - misol, ikki yo'l bilan: odam nuqtasi bo'yicha va Claude o'lchovi bo'yicha. Ikkalasi yaqin
     bo'lsa -- farq haqiqiy; uzoq bo'lsa -- 2-bandga qarang.
  4. YANGI: Claude topmagan, odam belgilagan qismlar -- faqat odam bo'yicha farq."""
import json, math, sys, random

NUQTA = ('iyak', 'burun', 'koz_yaqin', 'koz_uzoq')
CHIZIQ = ('ogiz', 'qosh_yaqin', 'qosh_uzoq')
SHOT = lambda k: 1 if k <= 11 else 2 if k <= 13 else 3


def orta_chiziq(pts):
    """Siniq chiziqning uzunlik bo'yicha o'rtasi."""
    seg = [math.dist(pts[i - 1], pts[i]) for i in range(1, len(pts))]
    L = sum(seg)
    if not L: return list(pts[0])
    h = L / 2
    for i, s in enumerate(seg):
        if h <= s:
            t = h / s if s else 0
            return [pts[i][0] + t * (pts[i + 1][0] - pts[i][0]), pts[i][1] + t * (pts[i + 1][1] - pts[i][1])]
        h -= s
    return list(pts[-1])


def prof_y(prof, x):
    """Profil (butun ustunlarda y) -- x da chiziqli oraliq; ustun yo'q bo'lsa None."""
    a, b = math.floor(x), math.ceil(x)
    if str(a) not in prof or str(b) not in prof: return None
    return prof[str(a)] if a == b else prof[str(a)] + (x - a) * (prof[str(b)] - prof[str(a)])


def jag_nuqtalar(pts, prof):
    """Odam jag' nuqtalari (uchlar) - profil, faqat odam BOSGAN joylarda: nuqtalar orasidagi to'g'ri chiziq egri jag'ni
    kesib o'tadi va o'z xatosini qo'shadi (sintetik sinovda 0.9 px gacha) -- shuning uchun faqat uchlar."""
    d = [y - prof_y(prof, x) for x, y in pts if prof_y(prof, x) is not None]
    if len(d) < 2: return None
    return {'ort': sum(d) / len(d), 'abs': sum(map(abs, d)) / len(d), 'max': max(d, key=abs), 'n': len(d)}


def prof_farq(a, b):
    """Ikki profil (a - b) umumiy ustunlarda o'rtacha."""
    d = [a[x] - b[x] for x in a if x in b]
    return sum(d) / len(d) if len(d) >= 3 else None


def nuqta(q, v):
    """Belgidan bitta solishtiriladigan nuqta: nuqta savoli -- o'zi; og'iz/qosh -- chiziq o'rtasi."""
    if not v or v.get('yoq'): return None
    if 'x' in v: return [v['x'], v['y']]
    if v.get('pts') and len(v['pts']) >= 2: return orta_chiziq(v['pts'])
    return None


def belgilarni_ol(obj):
    """Sahifa nusxasi yoki db hujjatlari -> {kadr_id: belgi}, {kadr_id: izoh}, harakat."""
    if isinstance(obj, dict) and 'marks' in obj:
        return obj['marks'], obj.get('notes', {}), obj.get('harakat')
    docs = obj if isinstance(obj, list) else [{'id': k, 'data': v} for k, v in obj.items()]
    marks, notes, har = {}, {}, None
    for d in docs:
        i, b = d.get('id') or d.get('doc_id'), d.get('data') or d.get('body') or d
        i = str(i).split('/')[-1]
        if i == 'harakat': har = b; continue
        if 'belgi' in b: marks[i] = b['belgi']; notes[i] = b.get('izoh', '')
    return marks, notes, har


def tahlil(M, marks):
    K = {f['id']: f for f in M['kadrlar']}
    out = {'takror': {}, 'detektor': {}, 'shot': {}, 'farq': {}, 'yangi': {}, 'jag': {}}
    a, b = M['takror']
    for q in NUQTA + CHIZIQ:
        pa, pb = nuqta(q, marks.get(a, {}).get(q)), nuqta(q, marks.get(b, {}).get(q))
        if pa and pb: out['takror'][q] = round(math.dist(pa, pb), 2)
    t = [v for q, v in out['takror'].items() if q in NUQTA]       # faqat nuqta savollari: chiziq o'rtasi chizilgan uzunlikka
    sigma = math.sqrt(sum(v * v for v in t) / len(t) / 4) if t else None   # bog'liq (qosh 5 px), bosish shovqini emas
    out['bir_bosish_sigma'] = round(sigma, 2) if sigma else None
    chegara = max(2.0, 3.0 * (sigma or 0.7))          # Rayleigh: r > 3 sigma -- 1% ehtimol
    out['chegara_px'] = round(chegara, 2)
    yig = {}
    for fid, f in K.items():
        if fid not in marks: continue
        m, c, bz = marks[fid], f['claude'], f['biz']
        for q in NUQTA + CHIZIQ:
            p = nuqta(q, m.get(q))
            if p is None: continue
            gh = [round(bz[q][0] - p[0], 2), round(bz[q][1] - p[1], 2)] if q in bz else None
            if q in c:
                d = [p[0] - c[q][0], p[1] - c[q][1]]
                out['detektor'].setdefault(fid, {})[q] = {'farq': [round(d[0], 2), round(d[1], 2)], 'masofa': round(math.hypot(*d), 2),
                                                          'tekshir': math.hypot(*d) > chegara}
                yig.setdefault((SHOT(f['k']), q), []).append(d)
                gc = [round(bz[q][0] - c[q][0], 2), round(bz[q][1] - c[q][1], 2)] if q in bz else None
                out['farq'].setdefault(fid, {})[q] = {'odam': gh, 'claude': gc}
            else:
                out['yangi'].setdefault(fid, {})[q] = {'odam_nuqta': [round(p[0], 2), round(p[1], 2)], 'biz_minus_odam': gh,
                                                       'bizda_korinadi': f.get('biz_kor', {}).get(q)}
        jv = m.get('jag') or {}
        if jv.get('pts'):
            r = {}
            if c.get('jag'): r['odam_minus_claude'] = jag_nuqtalar(jv['pts'], c['jag'])
            if bz.get('jag'):
                j = jag_nuqtalar(jv['pts'], bz['jag'])
                r['biz_minus_odam'] = round(-j['ort'], 2) if j else None
                if c.get('jag'):                                  # xuddi odam bosgan ustunlarda -- ikki farq solishtirilsin
                    d = [prof_y(bz['jag'], x) - prof_y(c['jag'], x) for x, _ in jv['pts']
                         if prof_y(bz['jag'], x) is not None and prof_y(c['jag'], x) is not None]
                    r['biz_minus_claude'] = round(sum(d) / len(d), 2) if len(d) >= 2 else None
            out['jag'][fid] = r
    for (s, q), L in yig.items():
        n = len(L)
        out['shot'].setdefault(f'{s}-shot', {})[q] = {'n': n, 'ort': [round(sum(x for x, _ in L) / n, 2), round(sum(y for _, y in L) / n, 2)]}
    return out


def matn(o):
    f = lambda v: '—' if v is None else f"({v[0]:+.1f},{v[1]:+.1f})"
    L = [f"== TAKROR (bir xil chizma ikki marta): " + ', '.join(f"{q} {d:.2f}" for q, d in o['takror'].items()) +
         f"  -> bir bosish sigma ~ {o['bir_bosish_sigma']}, tekshirish chegarasi {o['chegara_px']} px"]
    L.append("== DETEKTOR (odam - Claude, xom)")
    for fid, r in o['detektor'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['farq'])} {v['masofa']:.1f}{' <- TEKSHIR' if v['tekshir'] else ''}" for q, v in r.items()))
    L.append("== SHOT BO'YICHA O'RTACHA (odam - Claude)")
    for s, r in sorted(o['shot'].items()):
        L.append(f"  {s}: " + '  '.join(f"{q} n={v['n']} {f(v['ort'])}" for q, v in r.items()))
    L.append("== FARQ (biz - misol): odam bo'yicha / Claude bo'yicha")
    for fid, r in o['farq'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['odam'])}/{f(v['claude'])}" for q, v in r.items()))
    L.append("== JAG'")
    for fid, r in o['jag'].items():
        j = r.get('odam_minus_claude')
        L.append(f"  {fid}: odam-Claude " + ('—' if not j else f"ort {j['ort']:+.1f} |ort| {j['abs']:.1f} max {j['max']:+.1f} ({j['n']} nuqta)") +
                 f"   biz-misol: odam bo'yicha {r.get('biz_minus_odam')}, Claude bo'yicha {r.get('biz_minus_claude')}")
    L.append("== YANGI (Claude topmagan, odam belgilagan): biz - odam")
    for fid, r in o['yangi'].items():
        L.append(f"  {fid}: " + '  '.join(f"{q} {f(v['biz_minus_odam'])}{'' if v['bizda_korinadi'] is not False else ' (bizda orqada)'}" for q, v in r.items()))
    return '\n'.join(L)


def kalibr():
    """Sintetik: odam = Claude + (0.8,-0.4) + N(0,0.6); R13 -- R12 ning mustaqil takrori; R17 iyagi Claude'nikidan 8 px
    yuqorida (sindirilgan holat); jag' nuqtalari profildan aniq 3 px pastda. Bilinadigan javoblar:
    sigma ~ 0.6; faqat R17 iyagi TEKSHIR; jag' odam-Claude = +3.0; farq(odam) = farq(Claude) - (0.8,-0.4)."""
    M = json.load(open(sys.argv[sys.argv.index('--kalibr') + 1]))
    rnd = random.Random(7); B = (0.8, -0.4); S = 0.6
    nz = lambda: rnd.gauss(0, S)
    marks = {}
    for f in M['kadrlar']:
        c, m = f['claude'], {}
        for q in NUQTA:
            if q in c: m[q] = {'x': c[q][0] + B[0] + nz(), 'y': c[q][1] + B[1] + nz()}
        for q in CHIZIQ:
            if q in c:
                y = c[q][1] + B[1]
                m[q] = {'pts': [[c[q][0] - 3 + B[0], y], [c[q][0] + 3 + B[0], y]]}     # o'rtasi aniq Claude + B
        if c.get('jag'):
            xs = sorted(map(int, c['jag'])); sel = xs[::max(1, len(xs) // 4)] + [xs[-1]]
            m['jag'] = {'pts': [[x, c['jag'][str(x)] + 3.0] for x in sel]}
        marks[f['id']] = m
    marks['R17']['iyak']['y'] -= 8.0
    o = tahlil(M, marks)
    print(matn(o))
    ok = [o['bir_bosish_sigma'] is not None and abs(o['bir_bosish_sigma'] - S) < 0.35,
          o['detektor']['R17']['iyak']['tekshir'],
          sum(v['tekshir'] for r in o['detektor'].values() for v in r.values()) == 1,
          all(r.get('odam_minus_claude') and abs(r['odam_minus_claude']['ort'] - 3.0) < 0.05 for r in o['jag'].values()),
          all(r['biz_minus_claude'] is None or abs(r['biz_minus_claude'] - r['biz_minus_odam'] - 3.0) < 0.05 for r in o['jag'].values())]
    d = [(v['odam'][0] - v['claude'][0], v['odam'][1] - v['claude'][1]) for fid, r in o['farq'].items() if fid != 'R17'
         for q, v in r.items() if v['odam'] and v['claude'] and q in ('ogiz',)]     # chiziq o'rtasi shovqinsiz: aniq -B
    ok.append(bool(d) and all(abs(x + B[0]) < 0.01 and abs(y + B[1]) < 0.01 for x, y in d))
    print('KALIBR:', 'ISBOTLANDI' if all(ok) else 'ISBOTLANMADI', ok)


if __name__ == '__main__':
    if '--kalibr' in sys.argv: kalibr(); sys.exit()
    M = json.load(open(sys.argv[1])); marks, notes, har = belgilarni_ol(json.load(open(sys.argv[2])))
    o = tahlil(M, marks); o['izoh'] = notes; o['harakat'] = har
    print(matn(o)); print('== HARAKAT:', har); print('== IZOHLAR:', {k: v for k, v in notes.items() if v})
    if '--json' in sys.argv: json.dump(o, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
