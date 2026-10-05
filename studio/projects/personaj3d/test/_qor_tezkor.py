"""tezkor qor zichligi (9-o'tish tekshiruvi): tanlangan kadrlarda qor_zoom.statistika (bir xil kod) -- PAPKA %03d.png"""
import sys
sys.path.insert(0, '/home/claude/work/personaj3d/test/audit_misol')
import qor_zoom as QZ
for d in sys.argv[1:]:
    r = []
    for k in (3, 6, 12, 13, 17, 20):
        a = QZ.L(QZ.fayl(d, k)); s = QZ.statistika(a, QZ.x0k(k)); r.append('%d:%.0f/p90 %.1f' % (k, s[0], s[1]))
    print(d.split('/')[-1], ' '.join(r))
