"""SHOT 1 HEAD TRACE -- by RIGID targets (pass 9, tools/compare probes).

The previous trace (test/eye-trace.py) was tied to the dark component of the near eye.
The tools/compare probe table showed: in the sample, over drawings 1..6 the far edge x=130.3, the
chin front 129.6, under the jaw y=109.7 -- the SAME to a tenth of a pixel (the drawing is held), only
the eye component moves 97.6 -> 95.4 (a hair strand slides off the eye, a tear
gathers). The eye-tied trace made the head follow this change of shape and had moved it
by 2..4 px. Now: dx = median of the far edge and chin front differences, dy = median of the
under-jaw differences; the measurement is clean (no tremor, no sway, no snow); 1..6 the same."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
COMPARE_DIR = os.path.normpath(os.path.join(_HERE, '../../../../tools/compare'))  # tools/compare
import subprocess, json, os, sys
import numpy as np
sys.path.insert(0,(COMPARE_DIR))
from compare import project, probe, image
W=(PERSONAJ_DIR); F=W+'/traces.json'
prj=project.Project(W+'/compare.json')
ENV={**os.environ,'BOIL_AMP':'0','SWAY':'0','NO_PARTICLES':'1'}
DX=('far_edge_y20','far_edge_y30','chin_front_y52'); DY=('jaw_under_x8','jaw_under_x20','jaw_under_x28')
K=list(range(1,12))
def measure():
    image.clear_cache(); n=probe.run(prj,K); o={}
    for k in K:
        dx=[n['probe'][z][k]['sample']['x']-n['probe'][z][k]['ours']['x'] for z in DX if n['probe'][z].get(k) and n['probe'][z][k]['sample'] and n['probe'][z][k]['ours']]
        dy=[n['probe'][z][k]['sample']['y']-n['probe'][z][k]['ours']['y'] for z in DY if n['probe'][z].get(k) and n['probe'][z][k]['sample'] and n['probe'][z][k]['ours']]
        o[k]=(float(np.median(dx)) if dx else 0.0, float(np.median(dy)) if dy else 0.0)
    return o
for it in range(int(sys.argv[1]) if len(sys.argv)>1 else 3):
    subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=W,check=True,capture_output=True,env=ENV)
    d=measure(); IZ=json.load(open(F))
    for k in K:
        IZ[k-1]=[round(IZ[k-1][0]+d[k][0]*540/320*0.85,2), round(IZ[k-1][1]+d[k][1]*540/320*0.85,2)]
    # 1..6 held: one place (their mean)
    m=[float(np.mean([IZ[i][c] for i in range(6)])) for c in (0,1)]
    for i in range(6): IZ[i]=[round(m[0],2),round(m[1],2)]
    json.dump(IZ,open(F,'w'))
    print('round',it,' '.join('%d:%+.1f,%+.1f'%(k,*d[k]) for k in K),' max %.2f'%max(np.hypot(*d[k]) for k in K),flush=True)
subprocess.run('node film.mjs && rm -rf ff && node view3.mjs',shell=True,cwd=W,check=True,capture_output=True)
d=measure(); print('FINAL (with tremor):',' '.join('%d:%+.1f,%+.1f'%(k,*d[k]) for k in K))
