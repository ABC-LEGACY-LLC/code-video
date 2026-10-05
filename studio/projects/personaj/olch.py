import numpy as np, glob, statistics, sys
from PIL import Image
from scipy import ndimage
K=[np.asarray(Image.open(f).convert('RGB'),dtype=float).mean(axis=2) for f in sorted(glob.glob('/home/claude/work/personaj/ff/*.png'))]
d=[]
for i in range(1,len(K)):
    a,b=ndimage.median_filter(K[i-1],3),ndimage.median_filter(K[i],3)
    m=(a<95)&(b<95)&(a>20)&(b>20)
    d.append(int(((np.abs(a-b)>12)&m).sum()))
print(f"  {sys.argv[1]:32s} o'rtacha {statistics.mean(d):6.0f}   eng katta {max(d):6d}")
