"""quick snow density (pass 9 check): snow_zoom.stats on chosen frames (the same code) -- FOLDER %03d.png"""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '..'))              # the personaj3d folder
import sys
sys.path.insert(0, (P3D_DIR + '/test/audit_sample'))
import snow_zoom as QZ
for d in sys.argv[1:]:
    r = []
    for k in (3, 6, 12, 13, 17, 20):
        a = QZ.L(QZ.file(d, k)); s = QZ.stats(a, QZ.x0k(k)); r.append('%d:%.0f/p90 %.1f' % (k, s[0], s[1]))
    print(d.split('/')[-1], ' '.join(r))
