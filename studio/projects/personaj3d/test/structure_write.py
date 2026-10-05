"""Pass 12: write the result of the hood structure fit (test/fit_hood_structure.mjs -> JSON) into the source: personaj.js CLOTHES.hood,
common.js key light (EYE.light, lightHair) and the AO threshold. python3 test/structure_write.py test/hood_structure_fit_D.json
Pass 13: the hair groups too (o.hair -> personaj.js HAIR.<group>: an existing key is replaced, a missing one is appended at the end
of the group's line); the light and AO are written only if they were parameters in the fit (lightAz/lightEl/aoD in x) -- otherwise the
source's values stay (the fit was made under that source light)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
import sys, json, math, re
R = (P3D_DIR + '/')
d = json.load(open(sys.argv[1])); o = d['o']; hood = o['clothes']['hood']; az, el = o.get('light', [None, None]); aoD, aoS = o.get('ao', [None, None])
hood = {k: round(v, 4) if isinstance(v, float) else v for k, v in hood.items()}
keyOrder = ['yTop', 'long', 'Rg', 'R0', 'Rn', 'Ry', 'zg', 'z0', 'zn', 'wideX', 'back', 'visor', 'muzzle', 'muzzleW', 'wing', 'wingW',
        'openV0', 'v1', 'v2', 'v3', 'v4', 'v5', 'fi1', 'fi2', 'fi3', 'fi4', 'kfE', 'kfB', 'kfY', 'kf', 'kt', 'kgB', 'tau']
p = R + 'src/personaj.js'; s = open(p).read()
m = re.search(r"  hood: \{yTop: .*?kf: [^}]*?tau: [0-9.]+\},[^\n]*", s, re.S)
assert m, 'CLOTHES.hood not found'
old = m.group(0)
value = {}
for mm in re.finditer(r'(\w+): (-?[0-9.]+)', old.split('//')[0]): value[mm.group(1)] = float(mm.group(2))
value.update(hood)
if 'kfE' in value and 'kf' in value: value['kf'] = value['kfE']
note = "fit: test/fit_hood_structure.mjs -> %s (F %.3f, %d score)" % (sys.argv[1].split('/')[-1], d['result']['F'], d['score'])
fresh = "  hood: {" + ', '.join('%s: %s' % (k, ('%g' % value[k])) for k in keyOrder if k in value) + "},   // " + note
s = s.replace(old, fresh)
# hair groups: key: value inside the "  <group>: {...}," block (it may span several lines)
for g, kv in (o.get('hair') or {}).items():
    mg = re.search(r"\n  %s: +\{.*?\},?[^\n]*" % re.escape(g), s, re.S)
    assert mg, 'HAIR.%s not found' % g
    block = mg.group(0); yb = block
    for k, v in kv.items():
        val = '%g' % round(v, 4)
        if re.search(r'([{ ,])%s: -?[0-9.]+' % re.escape(k), yb): yb = re.sub(r'([{ ,])%s: -?[0-9.]+' % re.escape(k), r'\g<1>%s: %s' % (k, val), yb, count=1)
        else:
            # appended after the group object's last plain value (before its inner arrays)
            i = yb.index('{') + 1; j = yb.rfind('}'); inner = yb[i:j]
            n = re.search(r'-?[0-9.]+(?=(, *\w+: *\[|\s*$))', inner)
            k0 = n.end() if n else len(inner)
            yb = yb[:i] + inner[:k0] + ', %s: %s' % (k, val) + inner[k0:] + yb[j:]
    s = s.replace(block, yb)
    print('HAIR.%s:' % g, yb.strip()[:400])
open(p, 'w').write(s)
x = d.get('x', {})
if any(k in x for k in ('lightAz', 'lightEl', 'aoD')) and az is not None and aoD is not None:
    p = R + 'src/style/common.js'; s = open(p).read()
    a, e = math.radians(az), math.radians(el)
    v = '(%.4f, %.4f, %.4f)' % (math.cos(e) * math.cos(a), math.sin(e), math.cos(e) * math.sin(a))
    s = re.sub(r"light: new THREE\.Vector3\([^)]*\)\.normalize\(\),(\s*// moon/key light \(world\))[^\n]*", "light: new THREE.Vector3%s.normalize(),\\1 -- az %.1f, el %.1f (structure fit)" % (v, az, el), s)
    s = re.sub(r"lightHair: new THREE\.Vector3\([^)]*\)\.normalize\(\) \};", "lightHair: new THREE.Vector3%s.normalize() };" % v, s)
    s = re.sub(r"_qs.get\('aoD'\) !== null \? \+_qs.get\('aoD'\) : [0-9.]+", "_qs.get('aoD') !== null ? +_qs.get('aoD') : %.3f" % aoD, s)
    open(p, 'w').write(s)
    print('light', v, 'aoD', aoD)
else:
    print("light and AO -- the source's values (not parameters in the fit)")
print(fresh)
