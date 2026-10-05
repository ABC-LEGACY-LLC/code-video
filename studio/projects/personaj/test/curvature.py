"""CONTOUR CURVATURE PROFILE.

The first item of the card's "seen by eye" list: the profile outline must have
NOTCHES -- the root of the nose, the base of the nose, in front of the chin. A line
without notches is not a face but an egg.  This measurement counts exactly that.

Why it does not depend on tilt or size: we divide the contour into equal steps
along the arc length and measure the change of the TURNING ANGLE.
The change of the angle does not depend on the rotation of the shape, because the
same constant is added to every angle and it vanishes in the difference.  The scale
vanishes by taking the step as a SHARE of the arc length.
"""
import numpy as np

def contour(mask, n=256):
    """The boundary of the largest connected region, divided into n equal steps."""
    from scipy import ndimage
    lab,k=ndimage.label(mask)
    if k==0: return None
    mask = lab==(1+np.argmax(ndimage.sum(mask,lab,range(1,k+1))))
    edge = mask & ~ndimage.binary_erosion(mask)
    ys,xs=np.nonzero(edge)
    if len(xs)<n: return None
    cx,cy=xs.mean(),ys.mean()
    # sorting by angle: this is reliable for a face silhouette, because the shape
    # is star-shaped about its centre (one boundary point at each angle)
    a=np.arctan2(ys-cy,xs-cx); o=np.argsort(a)
    xs,ys,a=xs[o],ys[o],a[o]
    # the farthest point of each angle bin -- drops the inner noise
    bins=np.linspace(-np.pi,np.pi,n+1); rr=np.full(n,np.nan)
    r=np.hypot(xs-cx,ys-cy)
    for i in range(n):
        m=(a>=bins[i])&(a<bins[i+1])
        if m.any(): rr[i]=r[m].max()
    head=np.isnan(rr)
    # Empty bins: up to 10% are filled from their neighbours; with more than
    # that the shape is too small -- the measurement does not work, None is returned.
    if head.mean()>0.10: return None
    if head.any():
        idx=np.arange(n)
        rr[head]=np.interp(idx[head], idx[~head], rr[~head], period=n)
    mid=(bins[:-1]+bins[1:])/2
    return np.stack([cx+rr*np.cos(mid), cy+rr*np.sin(mid)],1)

def profile(P, flat=5):
    """The change of the turning angle at each point (curvature)."""
    d=np.roll(P,-flat,0)-np.roll(P,flat,0)
    t=np.arctan2(d[:,1],d[:,0])
    k=np.diff(np.unwrap(np.concatenate([t,t[:1]])))
    return k

def grooves(k, threshold=2.2):
    """Notch = a sharp excursion of the curvature to the NEGATIVE side (a dent inward).
    Threshold -- how many times the mean absolute curvature."""
    s=np.abs(k).mean()
    inner = k < -threshold*s
    # count neighbouring pixels as one notch
    n=0; before=False
    for v in np.concatenate([inner,inner[:1]]):
        if v and not before: n+=1
        before=v
    return n, float(np.abs(k[inner]).sum()/ (np.abs(k).sum()+1e-9))

def measure(mask):
    P=contour(mask)
    if P is None: return None
    k=profile(P)
    n,share=grooves(k)
    return {"groove":n, "groove_share":round(share,4), "curvature_spread":round(float(k.std()/ (np.abs(k).mean()+1e-9)),3)}


# ===========================================================================
# FINAL MEASUREMENT: GATE + ASYMMETRY
#
# Two attempts FAILED, the third one passed. I write it down, because what
# does not work is a result too:
#
#  1) NOTCH COUNT -- failed. Under a turn it fell from 4 to 2, and a WOBBLY egg
#     also gave 4. That is, it counts roughness, not structure.
#  2) CURVATURE SPREAD -- failed. Raising the smoothing made the separation worse:
#     at t=28 the wobbly egg (0.960) came out HIGHER than the original profile (0.648).
#  3) ASYMMETRY + GATE -- passed. A face profile is front-back asymmetric;
#     an egg is not. But a strongly wobbly egg goes above the original on
#     asymmetry (0.345 > 0.226), so a GATE stands before it:
#     high-frequency energy. A drawn silhouette is smooth, not wobbly.
#
#     Strong wobble    -> blocked at the gate (0.0817 > 0.0114)
#     Light wobble     -> passes the gate, but drops out on asymmetry
#                         (0.063 << 0.226)
#     Egg, circle      -> drop out on asymmetry (0.002, 0.004)
#
# LIMITATION: for near-circular shapes the gate is meaningless (the radius change is
# close to zero, the ratio divides noise by noise). Such a shape drops out on
# asymmetry anyway, so the gate is never used alone.
# ===========================================================================

def high_frequency(mask, n=256, floor=12):
    P=contour(mask,n)
    if P is None: return None
    C=P-P.mean(0); r=np.hypot(C[:,0],C[:,1])
    F=np.abs(np.fft.rfft(r-r.mean()))**2
    return float(F[floor:].sum()/F.sum())

def asymmetry(mask, n=256, pieces=64):
    """Front-back difference about the PCA principal axis. Independent of rotation and scale."""
    P=contour(mask,n)
    if P is None: return None
    C=P-P.mean(0)
    _,_,vt=np.linalg.svd(C,full_matrices=False)
    A=C@vt.T
    t=np.linspace(A[:,0].min(),A[:,0].max(),pieces)
    ch,on=[],[]
    for i in range(pieces-1):
        m=(A[:,0]>=t[i])&(A[:,0]<t[i+1])
        if not m.any(): continue
        v=A[m,1]; ch.append(-v.min()); on.append(v.max())
    ch,on=np.array(ch),np.array(on)
    return float(np.abs(ch-on).mean()/((ch+on).mean()/2))

GATE_THRESHOLD = 0.0114   # 2.5x the worst of the drawings

def profile_measurement(mask):
    """The single entry point. If it does not pass the gate -- NO measurement is given."""
    g=high_frequency(mask)
    if g is None: return {"state":"contour not found"}
    if g>GATE_THRESHOLD:
        return {"state":"BLOCKED AT THE GATE", "high_frequency":round(g,4),
                "reason":"the contour wobbles -- this is noise, not a drawing"}
    return {"state":"measured", "high_frequency":round(g,4),
            "asymmetry":round(asymmetry(mask),4)}
