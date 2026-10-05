"""12-o'tish: kapyushon tuzilishi moslashi natijasini (test/fit_kap_tuz.mjs -> JSON) manbaga yozish: personaj.js KIYIM.kap,
umumiy.js kalit yorug'lik (KOZ.nur, nurSoch) va AO chegarasi. python3 test/tuz_yoz.py test/kap_tuz_fit_D.json
13-o'tish: soch guruhlari ham (o.soch -> personaj.js SOCH.<guruh>: bor kalit almashtiriladi, yo'g'i guruh qatori oxiriga
qo'shiladi); yorug'lik va AO faqat moslashda parametr bo'lgan bo'lsa yoziladi (x da nurAz/nurEl/aoD) -- aks holda manbadagisi
qoladi (moslash shu manba yorug'ligida bo'lgan)."""
import sys, json, math, re
R = '/home/claude/work/personaj3d/'
d = json.load(open(sys.argv[1])); o = d['o']; kap = o['kiyim']['kap']; az, el = o.get('nur', [None, None]); aoD, aoS = o.get('ao', [None, None])
kap = {k: round(v, 4) if isinstance(v, float) else v for k, v in kap.items()}
tart = ['yTepa', 'uzun', 'Rg', 'R0', 'Rn', 'Ry', 'zg', 'z0', 'zn', 'kengX', 'orqa', 'soyabon', 'tumshuq', 'tumshuqW', 'qanot', 'qanotW',
        'ochV0', 'v1', 'v2', 'v3', 'v4', 'v5', 'fi1', 'fi2', 'fi3', 'fi4', 'kfE', 'kfB', 'kfY', 'kf', 'kt', 'kgB', 'tau']
p = R + 'src/personaj.js'; s = open(p).read()
m = re.search(r"  kap: \{yTepa: .*?kf: [^}]*?tau: [0-9.]+\},[^\n]*", s, re.S)
assert m, 'KIYIM.kap topilmadi'
eski = m.group(0)
qiymat = {}
for mm in re.finditer(r'(\w+): (-?[0-9.]+)', eski.split('//')[0]): qiymat[mm.group(1)] = float(mm.group(2))
qiymat.update(kap)
if 'kfE' in qiymat and 'kf' in qiymat: qiymat['kf'] = qiymat['kfE']
izoh = "moslash: test/fit_kap_tuz.mjs -> %s (F %.3f, %d baho)" % (sys.argv[1].split('/')[-1], d['natija']['F'], d['baho'])
yangi = "  kap: {" + ', '.join('%s: %s' % (k, ('%g' % qiymat[k])) for k in tart if k in qiymat) + "},   // " + izoh
s = s.replace(eski, yangi)
# soch guruhlari: "  <guruh>: {...}," bloki (bir necha qator bo'lishi mumkin) ichida kalit: qiymat
for g, kv in (o.get('soch') or {}).items():
    mg = re.search(r"\n  %s: +\{.*?\},?[^\n]*" % re.escape(g), s, re.S)
    assert mg, 'SOCH.%s topilmadi' % g
    blok = mg.group(0); yb = blok
    for k, v in kv.items():
        val = '%g' % round(v, 4)
        if re.search(r'([{ ,])%s: -?[0-9.]+' % re.escape(k), yb): yb = re.sub(r'([{ ,])%s: -?[0-9.]+' % re.escape(k), r'\g<1>%s: %s' % (k, val), yb, count=1)
        else:
            # guruh obyektining oxirgi oddiy qiymatidan keyin (ichki massivlardan oldin) qo'shiladi
            i = yb.index('{') + 1; j = yb.rfind('}'); ichi = yb[i:j]
            n = re.search(r'-?[0-9.]+(?=(, *\w+: *\[|\s*$))', ichi)
            k0 = n.end() if n else len(ichi)
            yb = yb[:i] + ichi[:k0] + ', %s: %s' % (k, val) + ichi[k0:] + yb[j:]
    s = s.replace(blok, yb)
    print('SOCH.%s:' % g, yb.strip()[:400])
open(p, 'w').write(s)
x = d.get('x', {})
if any(k in x for k in ('nurAz', 'nurEl', 'aoD')) and az is not None and aoD is not None:
    p = R + 'src/style/umumiy.js'; s = open(p).read()
    a, e = math.radians(az), math.radians(el)
    v = '(%.4f, %.4f, %.4f)' % (math.cos(e) * math.cos(a), math.sin(e), math.cos(e) * math.sin(a))
    s = re.sub(r"nur: new THREE\.Vector3\([^)]*\)\.normalize\(\),(\s*// oy/kalit yorug'lik \(dunyo\))[^\n]*", "nur: new THREE.Vector3%s.normalize(),\\1 -- az %.1f, el %.1f (tuzilish moslashi)" % (v, az, el), s)
    s = re.sub(r"nurSoch: new THREE\.Vector3\([^)]*\)\.normalize\(\) \};", "nurSoch: new THREE.Vector3%s.normalize() };" % v, s)
    s = re.sub(r"_qa.get\('aoD'\) !== null \? \+_qa.get\('aoD'\) : [0-9.]+", "_qa.get('aoD') !== null ? +_qa.get('aoD') : %.3f" % aoD, s)
    open(p, 'w').write(s)
    print('nur', v, 'aoD', aoD)
else:
    print("yorug'lik va AO -- manbadagisi (moslashda parametr emas)")
print(yangi)
