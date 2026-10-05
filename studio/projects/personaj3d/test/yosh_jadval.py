"""test/yosh_fit.json -> film.js dagi YOSH1 jadvali (qayta yozadi). Ko'z yoshi izlari: A (1-6), B (5-11), C (7-9, jag'
chetidagi halqa -- sirt chegarasida, taxminiy), tomchi (10-11, dunyo). Kuch va enlar -- misol L>70 komponentlari (1.5..2 px)."""
import json, re
y = json.load(open('test/yosh_fit.json')); A, B, D = y['A'], y['B'], y['D']
kA = {1: 0.9, 2: 0.9, 3: 0.9, 4: 0.85, 5: 0.7, 6: 0.55}
rows = []
for f in range(1, 12):
    q = []
    if str(f) in A: a, b = A[str(f)]; q.append("A: {a: [%s, %s], b: [%s, %s], w: 0.014, k: %s}" % (a[0], a[1], b[0], b[1], kA[f]))
    if str(f) in B: a, b = B[str(f)]; q.append("B: {a: [%s, %s], b: [%s, %s], w: 0.016, k: 0.9}" % (a[0], a[1], b[0], b[1]))
    if f in (7, 8, 9): q.append("C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}")
    if str(f) in D: q.append("tomchi: [%s, %s, %s]" % tuple(D[str(f)]))
    rows.append("  {%s},   // %d" % (", ".join(q), f))
tab = "const YOSH1 = [\n" + "\n".join(rows) + "\n];"
p = 'src/film.js'; s = open(p).read()
s = re.sub(r"const YOSH1 = \[\n.*?\n\];", lambda m: tab, s, flags=re.S)
open(p, 'w').write(s)
print(tab)
