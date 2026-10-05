"""CLOAK/HOOD DARK SHARE (L<18) -- inside the figure map, with the head
(bright mask, dilated by 4 px) and the snow particles left out, the mean
over drawings. Rewritten in pass 9: the pass 7 script had not been kept,
so these numbers do not compare directly with the old 18.6/26.3/27.6 on
the card -- both sides are measured with THIS code."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../personaj3d'))              # the personaj3d folder
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import sys,glob; sys.path.insert(0,(PERSONAJ_DIR + '/test'))
import numpy as np
from scipy import ndimage
from figure import cover_map, load_frames
from composition import mask
def share(fl):
    F=load_frames(fl); m,_=cover_map(F); M=np.kron(m,np.ones((10,10))).astype(bool); v=[]
    for L in F:
        sel=M&~ndimage.binary_dilation(mask(L),iterations=4)&~((L-ndimage.median_filter(L,9))>28)
        v.append((L[sel]<18).mean()*100)
    return np.mean(v)
if __name__=='__main__':
    sample=sorted(glob.glob((SAMPLE_DIR + '/k??.png'))); ours=sorted(glob.glob((PERSONAJ_DIR + '/ff/??.png')))
    for name,a,b in (('shot 1',0,11),('shot 2',11,13),('shot 3',13,22)):
        print("%s dark (L<18) share: sample %.1f%%  ours %.1f%%"%(name,share(sample[a:b]),share(ours[a:b])))
