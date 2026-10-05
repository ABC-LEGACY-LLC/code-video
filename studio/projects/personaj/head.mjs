/* ===== HEAD CONSTRUCTION =====
   The head is not drawn by hand -- it is BUILT from parameters. The reason is
   practical: in three attempts the request "make it look up" each time meant
   redrawing the whole drawing, and each time a different mistake crept in. Now
   the tilt is one number: change the parameter and the shape follows by itself.

   The construction is classic: skull = circle, jaw = a wedge hanging from it, and
   the WHOLE structure turns together. The facial features sit in head
   coordinates, so they turn with it too -- there is no need to slant the eye
   line separately, it slants by itself. */
export const TEMPLATE = {
 R: 46,          // skull radius
 chin: 1.48,        // the profile is scaled by this     // chin distance, as a fraction of R
 jawWide: 0.66,  // jaw width
 tilt: 0,     // degrees, + = up
 turn: 0.26, // 0 = full profile, 1 = full front
 drawEye: 0.10,  // eye line, as a fraction of R (0 = circle centre)
 nose: 0.45,
 mouth: 0.70,
 ear: [-0.86, 0.10],
};
const rad=d=>d*Math.PI/180;
export function build(P, cx, cy){
 const {R,chin,jawWide,tilt,turn,drawEye,nose,mouth,ear}=P;
 const t=rad(-tilt);                       // in SVG y grows downward
 const co=Math.cos(t), si=Math.sin(t);
 /* ===== TWO KEY DRAWINGS AND INBETWEENS (pass 6) =====
    The face used to be built as a PROFILE silhouette, and the turn only squeezed
    x (0.52+0.48*b). A squeezed profile never becomes a 3/4 face: the nose still
    sits on the edge, the far eye never appears. Shot 1 of the sample starts at 3/4
    and turns to profile -- so both views are needed.
    Animation's own method: two KEY drawings (profile and 3/4) and INBETWEEN
    drawings. Every control point has a value in both keys; tb mixes them.
    The squeeze is now soft (0.84..1.0): the geometry carries the turn, and
    the skull is a circle from every side. */
 const tb=Math.min(1,Math.max(0,(turn-0.10)/0.45));   // 0 = profile, 1 = 3/4
 const sq=0.84+0.16*tb;
 const K=(x,y)=>{ const X=x*sq, Y=y; return [cx+X*co-Y*si, cy+X*si+Y*co]; };
 const f=(v)=>v.toFixed(1);
 const XY=([x,y])=>`${f(x)} ${f(y)}`;
 /* LOOKING UP (P.gaze, 0..1): the facial features move up, the lower part of the
    face shortens -- in shot 1 of the sample the underside of the jaw shows. */
 const q=P.gaze||0;
 const kz=drawEye-0.06*q;
 /* Looking up at 3/4 -- this is not ROLL but PITCH: the underside of the jaw shows,
    the chin comes forward. Points below the eye line are moved FORWARD in
    proportion to their depth (shear). The eye line itself does not move --
    the pitch turns around it. In profile the pitch becomes an in-plane
    rotation, which the tilt gives. */
 /* the shear strength is measured: in frame 1 the sample's chin is BELOW the far eye
    (x 125, at 320); at 0.14 ours was at 107 -- roll -12 pulls it back.
    Strong at 3/4, weak in profile: in profile the roll gives the looking up,
    so the shear must not count it twice. */
 const shear=q*(0.10+0.35*tb);
 const Kf=(x,y)=>K(x + shear*tbq(y), y);
 function tbq(y){ return Math.max(0, y/R - kz)/1.2*R; }
 const point=(a)=>K(R*Math.cos(a*Math.PI/180), -R*Math.sin(a*Math.PI/180));
 const A_FRONT=24, A_BACK=198;
 const arc=[];
 for(let k=0;k<=36;k++) arc.push(point(A_FRONT + (A_BACK-A_FRONT)*k/36));
 /* pass 9: the lower face comes from MEASURED keys. The 5x check showed: our
    mouth was ~24 px below the eye, the chin ~47 px; in the sample 38 and 60 px (the
    same in frames 1, 6 and 11). Two "looking up" rules -- shortening the lower face
    by 8% and raising the chin (kot) -- were INVENTED and opposite to the sample:
    in the sample the lower part of the upturned face is LONG, the front of the chin
    almost vertical, the underside of the jaw almost horizontal. Both were removed. */
 const sc=chin/1.14;
 /* THE EDGE LEADS THE EYE (overlapping action). In frame 11 of the sample the
    edge is already PROFILE (nose, parted lips), while the closed eye is still deep
    inside the face (29 px from the edge). One tb cannot give this: for the edge
    tbo = tb^1.8 (to profile sooner), the eyes stay on tb. */
 const tbo=Math.pow(tb,1.8);
 const A=(pr,tq)=>[pr[0]+(tq[0]-pr[0])*tbo, pr[1]+(tq[1]-pr[1])*tbo];
 /* KEYS (pass 9): each point is [profile, 3/4], in head units (y is multiplied
    by sc). The values were NOT PICKED BY HAND: the targets in frame 1 of the sample
    (3/4, tbo=1) and frame 11 (tbo=0.19) (read from the L table, 320 px) were
    carried into head units by inverting build()
    (test/key-fit.mjs; round-trip error 1e-13 px). The profile key is an
    extrapolation from frame 11 -- tb=0 is never drawn anywhere.
    The shape in the sample: the far eye sits on the edge, behind it the temple is
    CUT (the hood band shows); below the cheek the edge is almost vertical, the nose
    tip is a 1.5 px bump on the edge; the mouth corner touches the edge; the chin front
    is vertical, the lower corner sharp; the underside of the jaw horizontal, then rising to the ear. */
 const CAL={
  c_front   :[[0.955,-0.21],[0.717,-0.322]],
  FOREHEAD :[[0.931,-0.082],[0.628,-0.205]],
  c_PI    :[[0.917,0.044],[0.647,-0.068]],
  ROOT   :[[0.867,0.166],[0.672,0.042]],
  c_IB    :[[0.918,0.239],[0.748,0.138]],
  NOSE_T :[[1.077,0.285],[0.864,0.165]],
  NOSE_O :[[1.022,0.477],[0.837,0.454]],
  c_OU    :[[0.996,0.558],[0.815,0.511]],
  LIP_U   :[[0.973,0.633],[0.767,0.553]],
  c_UO    :[[0.952,0.687],[0.756,0.573]],
  MOUTH_   :[[0.924,0.747],[0.749,0.595]],
  c_OP    :[[0.895,0.785],[0.748,0.619]],
  LIP_P   :[[0.856,0.823],[0.731,0.655]],
  c_PI2   :[[0.798,0.882],[0.718,0.74]],
  CHIN_O  :[[0.75,0.973],[0.697,0.829]],
  c_II    :[[0.707,1.089],[0.675,0.946]],
  IY      :[[0.672,1.157],[0.642,1.008]],
  c_IJ    :[[-0.22,1.13],[-0.133,1.197]],
  JAW     :[[-0.733,0.781],[-0.423,0.964]],
  /* pass 10 (compare, every frame): the mouth's upper line is x 122..128 in the sample,
     119..128 in ours -- the right end is right, the LEFT end 3 px too long (that is why
     the mouth probe was -1.7 px). In the 3/4 key the left end +3 px on screen: in head units +0.091, -0.015
     (at +0.070 it moved 2 px -- the line end is soft) */
  OG_L    :[[0.564,0.686],[0.555,0.606]],
  OG_M    :[[0.745,0.700],[0.583,0.585]],
  OG_R    :[[0.914,0.709],[0.706,0.549]],
  LS_1    :[[0.721,0.779],[0.674,0.658]],
  /* pass 9 (compare, 10x overlay, frames 1..11): the mouth and the lower lip shadow
     were ~2.2 px HIGHER in the sample -- y -0.040 in both keys */
  LS_2    :[[0.65,0.774],[0.597,0.701]],
 };
 const p_=(n)=>{const [x,y]=A(...CAL[n]); return Kf(x*R, y*sc*R);};
 const N={}; for(const n in CAL) N[n]=p_(n);
 const QU=K(ear[0]*R, ear[1]*R);
 const FRONT=point(A_FRONT), BACK=point(A_BACK);
 const FOREHEAD_PT=point(52), TOP=point(96);
 const backC=(()=>{const [x,y]=A([-0.90,0.52],[-0.62,0.28]); return K(x*R,y*R);})();
 const Qs=(c,e)=>` Q ${XY(N[c])} ${XY(N[e])}`;
 const silhouette = `M ${XY(FRONT)}` + Qs('c_front','FOREHEAD') + Qs('c_PI','ROOT') + Qs('c_IB','NOSE_T')
   + ` L ${XY(N.NOSE_O)}` + Qs('c_OU','LIP_U') + Qs('c_UO','MOUTH_') + Qs('c_OP','LIP_P')
   + Qs('c_PI2','CHIN_O') + Qs('c_II','IY') + Qs('c_IJ','JAW')
   + ` Q ${XY(backC)} ${XY(BACK)}`
   + arc.slice(1).reverse().map(v=>` L ${XY(v)}`).join('') + ' Z';
 /* features: their place in both keys (in head units) */
 const L_=(a,b)=>a+(b-a)*tb;
 /* eye size is MEASURED: in the sample near eye width / face width (on the eye line)
    = 8/52 = 0.15; ours was 0.30 -- twice as large, a "cartoon" eye. */
 /* placement in the 3/4 key from the sample: along the eye row
      near strand -> near eye : eye -> eye : far eye -> edge = 0.29 : 0.44 : 0.27
    (15 / 23 / 14 px). Ours was 0.35 : 0.38 : 0.26 -- the eyes too close
    together, the near eye too far from the strand. Eye width = 0.15 of that row -> KS 0.55. */
 const KS=0.66;   // pass 8: the sample's near eye is ~9.5 px wide (without the wing), ours was 8.4
 const eyes=[{u:L_(0.46,0.04), s:KS*L_(0.92,1.00), sx:1, id:'y', ko:1}];
 /* pass 9: the far eye in the sample is ~6-7 px wide (x 116..122, frame 1); at sx 0.80
    ours was ~11 px. */
 if(tb>0.2) eyes.push({u:L_(0.97,0.60), s:KS*0.86, sx:L_(0.25,0.55), id:'u', ko:Math.min(1,(tb-0.2)/0.35)});
 return {
  silhouette, tb, tbo, sq, sc, kz,
  chin:N.IY, jaw:N.JAW, ear:QU, front:FRONT, forehead:FOREHEAD_PT, top:TOP, back:BACK,
  eyes,
  /* mouth and lower lip shadow -- SCREEN points (from the keys) */
  mouth:[N.OG_L, N.OG_M, N.OG_R], lipShadow:[N.LS_1, N.LS_2],
  /* BACK LIGHT LINE: from the cut (behind the far eye) down to the chin, and the jaw */
  edgePath: `M ${XY(N.ROOT)}` + Qs('c_IB','NOSE_T') + ` L ${XY(N.NOSE_O)}` + Qs('c_OU','LIP_U')
    + Qs('c_UO','MOUTH_') + Qs('c_OP','LIP_P') + Qs('c_PI2','CHIN_O') + Qs('c_II','IY'),
  jawPath: `M ${XY(N.IY)}` + Qs('c_IJ','JAW'),
  /* for the hood band: the edge points from top to bottom */
  edge:[N.FOREHEAD, N.ROOT, N.NOSE_T, N.NOSE_O, N.MOUTH_, N.CHIN_O, N.IY],
  points:{NOSE_T:N.NOSE_T, ROOT:N.ROOT, IY:N.IY, JAW:N.JAW},
  K, Kf,
 };
}
