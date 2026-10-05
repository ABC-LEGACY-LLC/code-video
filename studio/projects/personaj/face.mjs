/* ===== FACE FEATURES =====
   An anime face has a definite structure, and it rests on a few rules:

   EYE. The most important feature, and it is not an ellipse. The upper lid is a THICK curve,
   thicker at the outer corner. The iris is a tall ellipse, and the upper lid
   CUTS it from above -- so it is always partly hidden. The highlight
   is at the upper left. A blink does not squash the ellipse; the CUT moves
   down: the lid closes over the iris.

   HAIR. Not a solid cap -- pointed strands. Each strand tapers
   downward, and they partly cover one another.

   Everything is in head coordinates -- so it follows the tilt by itself. */

export function eye(K,R,u,drawEye,open,large,id,sx=1,ko=1,side=1){
 /* ===== EYE, pass 9 (sample at 12x, L table cell by cell) =====
    The pass 8 eye came out wrong at 5x: 3 px too high, 3 px too
    tall, its wing at the INNER corner, a light ring inside. The next attempt (almond
    opening) squeezed the iris to 5 px. The sample (frame 5, near eye,
    px relative to the dark centre):
      - the OPENING is a rounded rectangle, ~15x9 px: upper lid (-8,-1.5)->(7,-3.5),
        inner side almost VERTICAL (7,-3.5)->(6.5,5.5), flat bottom;
      - the lid is a band ~2.5 px thick, its outer end bends down;
      - iris 8x7 px, centre (0.5,2.5), very dark (L 4-15), its BOTTOM 3
        rows lighter (L 21-25); EYE WHITE on both sides (#52567e, L 74-104):
        ~4.5 px outside, ~2 px inside;
      - highlight 1 px, dim (L 78); the lower lid is not drawn;
      - closed: a thick line 10-16 px long, ~1 px above the anchor.
    FAR EYE (side -1): foreshortened -- a dark vertical oval ~5x8 px (sample frame 1
    118..122 x 45..52), no eye white visible, a short lid above it.
    All in head units: the measurement was rotated back by the 12 degree roll
    and divided by s*R. */
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const s=large, o=Math.min(1,Math.max(0,open));
 const P=(du,dv)=>K((u+side*du*s*sx)*R, (drawEye+dv*s)*R);
 const m=(a,b)=>[a[0]+(b[0]-a[0])*o, a[1]+(b[1]-a[1])*o];
 const L=[];
 if(side>0){
  const O=m([-0.28,-0.03],[-0.211,-0.014]), I=m([0.30,-0.05],[0.299,-0.196]);
  const RB=m([0.30,-0.04],[0.349,0.123]),   LB=m([-0.28,-0.02],[-0.163,0.214]);
  const cT=m([0.01,-0.05],[0.044,-0.125]),  cR=m([0.30,-0.045],[0.34,-0.04]);
  const cB=m([0.01,-0.03],[0.09,0.24]),     cL=m([-0.28,-0.025],[-0.24,0.10]);
  const Od=m([-0.33,0.02],[-0.247,0.078]);
  const hole=`M ${XY(P(...O))} Q ${XY(P(...cT))} ${XY(P(...I))} Q ${XY(P(...cR))} ${XY(P(...RB))}`
   + ` Q ${XY(P(...cB))} ${XY(P(...LB))} Q ${XY(P(...cL))} ${XY(P(...O))} Z`;
  if(o>0.08){
   L.push(`<clipPath id="k${id}"><path d="${hole}"/></clipPath>`);
   L.push(`<g clip-path="url(#k${id})">`);
   L.push(`<path fill="#52567e" d="${hole}"/>`);
   /* the iris starts UNDER THE LID (in the sample the lid band and the iris are one
      dark mass; at 8x ours left a strip of eye white between them, and the lid read as
      a separate "brow"). It fills the full height of the opening; the opening clip
      cuts its top. */
   const km=P(0.116,0.02);
   L.push(`<ellipse cx="${f(km[0])}" cy="${f(km[1])}" rx="${f(0.143*s*sx*R)}" ry="${f(0.205*s*R)}" fill="#080b26"/>`);
   const kp=P(0.116,0.170);
   L.push(`<ellipse cx="${f(kp[0])}" cy="${f(kp[1])}" rx="${f(0.105*s*sx*R)}" ry="${f(0.045*s*R)}" fill="#15173c"/>`);
   const h=P(0.076,-0.030);
   L.push(`<ellipse cx="${f(h[0])}" cy="${f(h[1])}" rx="${f(0.028*s*sx*R)}" ry="${f(0.030*s*R)}" fill="#4d5180"/>`);
   L.push(`</g>`);
  }
  L.push(`<path fill="none" stroke="#07081a" stroke-width="${f((0.090+0.020*(1-o))*s*R)}" stroke-linecap="round" stroke-linejoin="round"`
       + ` d="M ${XY(P(...Od))} Q ${XY(P(O[0]+0.004,O[1]-0.012))} ${XY(P(...O))} Q ${XY(P(...cT))} ${XY(P(...I))}"/>`);
 } else {
  /* pass 10 (compare, every frame): the dark core of the far eye (L<22) is in the sample
     x 118..122, y 47..53, ours 117..121, 44..52 -- in frames 1..6 a systematic
     (-1.4, -1.4) px. The whole far eye (oval, highlight, lid) was moved by
     (-0.125, +0.046) in eye units (side -1: +du is to the left). In the sample the highlight
     is at the LOWER-left edge of the core (119,52 L 92); ours was at the upper left. */
  const D=[-0.125,0.046], c=[0.056+D[0],-0.134+D[1]];
  if(o>0.08){
   const e=P(c[0],c[1]+0.02*(1-o));
   L.push(`<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(0.19*s*sx*R)}" ry="${f(0.167*o*s*R)}" fill="#080b26"/>`);
   const h=P(c[0]+0.057,c[1]+0.113*o);
   L.push(`<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${f(0.022*s*R)}" fill="#4d5180" opacity="${o.toFixed(2)}"/>`);
  }
  /* 12x overlay: the left end of the lid stuck out of the oval (the sample has face tone there) */
  const yA=m([-0.10+D[0],c[1]],[-0.10+D[0],c[1]-0.15]), yB=m([0.24+D[0],c[1]-0.01],[0.25+D[0],c[1]-0.17]);
  L.push(`<path fill="none" stroke="#07081a" stroke-width="${f(0.085*s*R)}" stroke-linecap="round" d="M ${XY(P(...yA))} L ${XY(P(...yB))}"/>`);
 }
 /* brow: thin and dim -- in the sample the brows are mostly under the forehead strands */
 L.push(`<path fill="none" stroke="#2b2d44" stroke-width="${f(0.032*s*R)}" stroke-linecap="round" opacity="0.6"`
      + ` d="M ${XY(P(-0.20,-0.40))} Q ${XY(P(0.00,-0.50))} ${XY(P(0.22,-0.48))}"/>`);
 return ko<0.999 ? `<g opacity="${ko.toFixed(2)}">${L.join('\n')}</g>` : L.join('\n');
}

/* ===== HAIR =====
   Two groups, and their jobs differ:

   FOREHEAD STRANDS -- hang down from the hairline and stop
   ABOVE THE BROW. The first version drew them across the whole head and they
   covered both the eye and the nose.

   SIDE STRANDS -- fall OUTSIDE the face silhouette, in front of the ear.
   They frame the face, and they are exactly what makes the head "have hair". */
/* ===== HAIR, pass 11: LARGE STRANDS (hair2) =====
   Measurement (compare, every frame 1..11, bright hair mask L>85, median 3):
   in the sample the hair is made of FEW, LARGE strands -- wide, long, sharp, swept
   right-and-down by the wind; the bright tone is even (median ~100, p90 103..104);
   the area above the near eye is dark hair (L 20..55). Ours was many thin vertical
   strands, bright lines at L 124, the volume on top ~60% of the sample's, the strands
   10..22 px short on the right. Mask IoU 0.30..0.44.
   Here the strands are built by OUR rule (seeded randomness, blade
   shape, ink line); only the MASSES are measured from the sample: each group's
   (sweep, forehead, near side) length, direction, width and bend are fitted in every frame
   to the sample's region masks by test/hair-fit.py. No strand-by-strand
   copying.
   S -- the parameters (sheet.mjs HAIR_P[i]); missing fields -- the originals below. */
export const HAIR_ORIG={
 volume:1.06,                       // radius of the cap top (R)
 sN:7, sA0:40, sA1:150, sTheta:-32, sSpread:-4, sL:1.05, sW:0.34, sB:0.10, sS:0.06, sK:0.93,   // sweep
 pN:4, pA0:52, pA1:112, pDrop:-0.05, pDx:0.30, pW:0.22, pB:0.08, pEye:0.10, pShadowL:0.0,        // forehead
 yN:3, yA0:128, yA1:156, yX:-0.36, yDx:0.07, yY:1.30, yDy:0.10, yW:0.26, yBulge:0.10,          // near side
 fl:0, flT:0,                     // shiver of the strand tips: amplitude (R) and frame phase
 tone:'#5b608e', toneY:'#5f6494', ink:'#2a2c52', shadow:'#1a1b36',
 seed:4127
};
export function hair2(K,R,drawEye,S0,idp='',eyeZone=[]){
 const S={...HAIR_ORIG,...S0};
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const DB=S.dbg?{q:'#888888',y:'#3050ff',s:'#ff3030',p:'#30c030',t:'#ffff00'}:null;   // for checking only
 let s=S.seed; const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
 const P=([x,y])=>K(x*R,y*R);
 const U=(a,k)=>[k*Math.cos(a*Math.PI/180), -k*Math.sin(a*Math.PI/180)];
 const D=(t)=>[Math.cos(t*Math.PI/180), -Math.sin(t*Math.PI/180)];
 /* strand tip shiver: each strand has its own phase (hash), the frame phase is S.flT --
    on held frames the face stays still while the hair moves (sample pairs IoU 0.61..0.72) */
 const hs=i=>{let h=((i+1)*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296;};
 let tN=0;
 const shiver=(t)=>{const k=tN++; if(!S.fl) return t; const a=hs(k*7+1)*6.2832, b=hs(k*7+3)*6.2832;
  return [t[0]+S.fl*Math.sin(S.flT*2.1+a), t[1]+S.fl*0.7*Math.sin(S.flT*1.7+b)];};
 const geo=(r,t,w,b,b2,sS)=>{
  const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy)||1e-6, nx=-dy/l, ny=dx/l, B2=(b2??b), SS=sS||0;
  return {a:[r[0]+nx*w/2, r[1]+ny*w/2], c:[r[0]-nx*w/2, r[1]-ny*w/2], t,
   a1:[r[0]+dx*0.30+nx*(w*0.42+b*l*1.1), r[1]+dy*0.30+ny*(w*0.42+b*l*1.1)],
   a2:[r[0]+dx*0.72+nx*(w*0.18+b*l*0.6-SS*l), r[1]+dy*0.72+ny*(w*0.18+b*l*0.6-SS*l)],
   c2:[r[0]+dx*0.70-nx*(w*0.14-B2*l*0.6+SS*l), r[1]+dy*0.70-ny*(w*0.14-B2*l*0.6+SS*l)],
   c1:[r[0]+dx*0.30-nx*(w*0.36-B2*l*1.1), r[1]+dy*0.30-ny*(w*0.36-B2*l*1.1)]};
 };
 const blade=(g)=>`M ${XY(P(g.a))} C ${XY(P(g.a1))} ${XY(P(g.a2))} ${XY(P(g.t))} C ${XY(P(g.c2))} ${XY(P(g.c1))} ${XY(P(g.c))} Z`;
 const inkPath=(g)=>`M ${XY(P(g.c))} C ${XY(P(g.c1))} ${XY(P(g.c2))} ${XY(P(g.t))}`;
 const L=[];
 const inkW=(0.012*R).toFixed(2);
 /* 1. CAP -- the mass over the skull; its top is S.volume */
 const qal=[]; for(let i=0;i<=30;i++){const a=22+186*i/30, k=1.0+(S.volume-1.0)*Math.max(0,Math.sin(a*Math.PI/180)); qal.push(U(a,k));}
 const capD=`M ${XY(P(qal[0]))}`+qal.slice(1).map(v=>` L ${XY(P(v))}`).join('')
  + ` Q ${XY(P([-0.96,0.40]))} ${XY(P([-0.80,0.58]))}`
  + ` Q ${XY(P([-0.42,-0.02]))} ${XY(P([-0.05,-0.40]))}`
  + ` Q ${XY(P([0.45,-0.52]))} ${XY(P(qal[0]))} Z`;
 L.push(`<path fill="${DB?DB.q:S.tone}" d="${capD}"/>`);
 /* 2. NEAR SIDE -- a "(" mass from temple to jaw. Drawn OUTSIDE the hood opening
    clip (portrait2): in sample frames 5..11 this mass goes left past the opening
    edge, OVER the hood lining; inside the clip it was being cut off. */
 const Ly=[];
 for(let j=0;j<S.yN;j++){
  const a=S.yA0+(S.yA1-S.yA0)*(S.yN>1?j/(S.yN-1):0.5)+(rnd()-0.5)*4, r=U(a,S.volume*0.93);
  const t=shiver([S.yX+S.yDx*j+(rnd()-0.5)*0.05, S.yY+S.yDy*j+(rnd()-0.5)*0.08]);
  const w=S.yW*(0.85+rnd()*0.3), g=geo(r,t,w,-S.yBulge,-S.yBulge*0.6,0.02);
  Ly.push(`<path fill="${DB?DB.y:(j===1?S.toneY:S.tone)}" d="${blade(g)}"/>`);
  Ly.push(`<path fill="none" stroke="${S.ink}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.8" d="${inkPath(g)}"/>`);
 }
 /* 3. SWEEP -- long wide strands from the crown to the right and down */
 const sup=[];
 for(let j=0;j<S.sN;j++){
  const u=S.sN>1?j/(S.sN-1):0.5;
  const a=S.sA0+(S.sA1-S.sA0)*u+(rnd()-0.5)*6, r=U(a,S.volume*S.sK);
  const th=S.sTheta+S.sSpread*j+(rnd()-0.5)*8, l=S.sL*(0.70+0.55*rnd());
  const d=D(th), t=shiver([r[0]+d[0]*l, r[1]+d[1]*l]);
  const w=S.sW*(0.75+0.5*rnd()), b=S.sB*(0.6+0.8*rnd()), ss=S.sS*(0.5+rnd());
  sup.push({g:geo(r,t,w,b,b*0.3,ss), z:rnd(), y:rnd()<0.3});
 }
 sup.sort((p,q)=>p.z-q.z);
 for(const o of sup){
  L.push(`<path fill="${DB?DB.s:(o.y?S.toneY:S.tone)}" d="${blade(o.g)}"/>`);
  L.push(`<path fill="none" stroke="${S.ink}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.8" d="${inkPath(o.g)}"/>`);
 }
 /* 4. FOREHEAD -- from the hairline down and to the right; the ones in front of an eye stop S.pEye
    above it. Underneath, a SHADOW extension (S.pShadowL): in the sample the area above the eye
    is dark hair (L<45 share 55..72%, ours 0%) */
 for(let j=0;j<S.pN;j++){
  const u=S.pN>1?j/(S.pN-1):0.5;
  const a=S.pA0+(S.pA1-S.pA0)*u+(rnd()-0.5)*6, r=U(a,0.97);
  let tx=r[0]+S.pDx*(0.7+0.6*rnd()), ty=drawEye+S.pDrop+(rnd()-0.5)*0.12;
  const inFront=eyeZone.some(([p,q])=>tx>p-0.05&&tx<q+0.05);
  if(inFront) ty=Math.min(ty,drawEye-S.pEye);
  const t=shiver([tx,ty]), w=S.pW*(0.8+0.4*rnd()), b=S.pB*(0.6+0.8*rnd());
  if(S.pShadowL>0){ const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy)||1;
   const t2=[t[0]+dx/l*S.pShadowL, t[1]+dy/l*S.pShadowL];
   L.push(`<path fill="${S.shadow}" d="${blade(geo(r,t2,w*1.05,b,b*0.3,0.03))}"/>`); }
  const g=geo(r,t,w,b,b*0.3,0.04);
  L.push(`<path fill="${DB?DB.p:S.tone}" d="${blade(g)}"/>`);
  L.push(`<path fill="none" stroke="${S.ink}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.75" d="${inkPath(g)}"/>`);
 }
 /* soft gradient (airbrush) -- only over the cap, as before */
 L.push(`<clipPath id="${idp}cs"><path d="${capD}"/></clipPath>`);
 const c=K(0,0);
 L.push(`<rect x="${(c[0]-2.4*R).toFixed(1)}" y="${(c[1]-2.4*R).toFixed(1)}"`
      + ` width="${(4.8*R).toFixed(1)}" height="${(4.8*R).toFixed(1)}"`
      + ` fill="url(#gHair)" clip-path="url(#${idp}cs)"/>`);
 return {inner:L.join('\n'), outer:Ly.join('\n')};
}

/* ===== HAIR, pass 11, attempt 2: MASS + OUR STRANDS (hair3) =====
   hair2 (group strands) raised the IoU in frame 1 only from 0.33 to 0.42:
   the group parameters could not give the sample's mass distribution (the near-side roots
   stuck out above the head, the forehead turned into vertical teeth). Now two layers:
   1) MASS -- a polar shell around the head centre: at each angle (th0 + j*dth) an
      outer radius ro[j] and an inner radius ri[j] (in units of R). This is the measured MASS: in every
      frame it is fitted to the sample's bright hair mask (test/hair-fit.py), a 20
      degree step -- ~22 px at the head edge, i.e. a mass, not a strand.
   2) STRANDS -- our rule: pointed teeth on the mass edge (period p, depth
      d, seeded randomness), ink lines inward from between the teeth, a dark hair band
      under the forehead (in the sample, above the near eye, L<45 share 55..72%).
   hairPoly3 -- the geometry (in head units); hair3 -- the SVG. The fitting server also
   uses exactly hairPoly3: one geometry code. */
export const HAIR3_ORIG={th0:-70, dth:20,
 ro:[0.6,0.9,1.1,1.2,1.25,1.25,1.2,1.15,1.1,1.05,1.0,1.0,1.0,1.0,1.0,0.9,0.8,0.6],
 ri:[0.6,0.8,0.7,0.5,0.35,0.2,0.1,0.1,0.15,0.3,0.6,0.8,0.85,0.85,0.85,0.8,0.75,0.6],
 tO:[-70,70,0.16,0.10], tO2:[160,270,0.16,0.08], tI:[10,160,0.14,0.08],   // teeth: [angle0, angle1, period, depth]
 shadowA:[-10,80], shadowH:0.0,          // dark hair under the forehead: angle range and thickness (R)
 inkK:0.45, tone:'#5b608e', shadowTone:'#1a1b36', ink:'#2a2c52', seed:9151};
function _catmull(v,M){ const n=v.length, o=[];
 for(let i=0;i<n-1;i++){ const p0=v[Math.max(0,i-1)], p1=v[i], p2=v[i+1], p3=v[Math.min(n-1,i+2)];
  for(let k=0;k<M;k++){ const t=k/M, t2=t*t, t3=t2*t;
   o.push(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)); } }
 o.push(v[n-1]); return o; }
export function hairPoly3(S0){
 const S={...HAIR3_ORIG,...S0}, N=S.ro.length, M=8;
 let sd=S.seed; const rnd=()=>{sd^=sd<<13;sd^=sd>>>17;sd^=sd<<5;return (sd>>>0)/4294967296;};
 const th=_catmull(S.ro.map((_,j)=>S.th0+j*S.dth),M), ro=_catmull(S.ro,M), ri0=_catmull(S.ri,M);
 const ri=ri0.map((v,k)=>Math.max(0,Math.min(v,ro[k])));
 const pt=(r,a)=>[r*Math.cos(a*Math.PI/180), -r*Math.sin(a*Math.PI/180)];
 /* FLOW: the hair spreads from the crown (S.crown, in head units) -- the tooth tips point
    AWAY from the crown, the ink lines run from between the teeth TOWARD the crown. (In attempt 1
    they were radial to the head centre -- they read as a fan on top of the head.) */
 const crown=S.crown||[-0.35,-0.85];
 const flow=p=>{const dx=p[0]-crown[0], dy=p[1]-crown[1], l=Math.hypot(dx,dy)||1; return [dx/l,dy/l];};
 /* tooth depth is at most 45% of the mass thickness: where there is no hair (ro=ri)
    the teeth came out as a thin saw over the face (frame 1, cheek) */
 const qal=ro.map((v,k)=>Math.max(0,v-ri[k]));
 /* tooth PHASE comes from the angle (the arc at a fixed radius rref): when the mass changes
    from frame to frame the strands stay in place -- computed from the arc length, the teeth
    would "crawl" along the edge as the radius changed */
 const tooth=(rr,sp,rref)=>{ const [a0,a1,p,d]=sp, dl=rr.map(()=>0), notch=[];
  let s=0, t0=0, t1=p*(0.7+0.6*rnd()), dd=d*(0.7+0.6*rnd()), ti=0;
  /* SHIVER (S.fl, S.flT): each tooth tip moves +-fl along the flow from frame to frame
     with its own phase -- the fine edge movement on the sample's held frames. The phase
     comes from the tooth number (hash) and does not touch the rnd() sequence (at fl=0 the geometry is unchanged). */
  const fz=i=>{let h=((i+1)*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296*6.2832;};
  for(let k=0;k<rr.length;k++){
   s=Math.max(0,(th[k]-th[0]))*Math.PI/180*rref;
   while(s>=t1){ t0=t1; t1=t0+p*(0.7+0.6*rnd()); dd=d*(0.7+0.6*rnd()); ti++; if(th[k]>=a0&&th[k]<=a1) notch.push(k); }
   if(th[k]<a0||th[k]>a1) continue;
   const w=Math.min(1,(th[k]-a0)/8,(a1-th[k])/8), u=(s-t0)/(t1-t0), tip=Math.pow(1-Math.abs(2*u-1),1.6);
   dl[k]=w*Math.min(dd,0.45*qal[k])*(-0.4+1.4*tip) + (S.fl? w*tip*S.fl*Math.sin(2.1*(S.flT||0)+fz(ti+a0*7)) : 0); }
  return {dl, notch}; };
 const o1=tooth(ro,S.tO,1.2), o2=tooth(ro,S.tO2,1.0), i1=tooth(ri,S.tI,0.4);
 const shifted=(r,a,dlt)=>{const p=pt(r,a); if(!dlt) return p; const u=flow(p); return [p[0]+u[0]*dlt, p[1]+u[1]*dlt];};
 const PO=ro.map((r,k)=>shifted(r,th[k],o1.dl[k]+o2.dl[k]));
 const PI=ri.map((r,k)=>shifted(Math.min(r,ro[k]-0.01),th[k],i1.dl[k]));
 /* BOIL (S.boilAmp, S.flT): on held frames the FACE stays still while the hair boils -- in the sample's
    difference map every strand edge changes slightly. A smooth displacement field over the
    whole hair geometry (the same shape as jitter, wavelength ~1.06 R ~ 68 px/540), with its own
    phase per frame. The tooth tip shiver (fl) was not enough: even at 0.08 R the pairs' IoU only went 0.85 -> 0.82
    (sample 0.67) -- the tips are a small part of the mass. */
 /* This field is INSIDE THE FIT (the test/hair3-fit.py model takes the same geometry): the fit
    compensates it at the mass level, so the held pairs' IoU is 0.73..0.83 (sample
    0.61..0.72; added after the fit it was 0.64..0.72, but it broke the brow zones).
    A fine random field (wavelength 0.3 R, 0.05 R) brought the pairs down to 0.68..0.73, but
    the edges rippled as if melting -- removed (METHOD 12). In the sample the change is
    the strands going from light to shadow: the next step, strand shadows. */
 const qz=(()=>{ if(!S.boilAmp) return p=>p; let h=((S.flT||0)+1)*2654435761>>>0;
  const r=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};
  const f=[r(),r(),r(),r()].map(v=>v*6.2832), w=6.2832/1.06, A=S.boilAmp;
  return p=>[p[0]+A*(Math.sin(w*(0.8*p[0]+0.6*p[1])+f[0])+Math.sin(w*(-0.5*p[0]+0.9*p[1])+f[1]))/1.414,
             p[1]+A*(Math.sin(w*(0.7*p[0]-0.7*p[1])+f[2])+Math.sin(w*(0.3*p[0]+1.0*p[1])+f[3]))/1.414]; })();
 PO.forEach((p,k)=>{PO[k]=qz(p);}); PI.forEach((p,k)=>{PI[k]=qz(p);});
 /* THIN SPOTS (S.minThick). The shell is one closed ring: at an angle with no hair the fit sets ro=ri,
    but since the inner edge is clamped to ro-0.01, a thin bright arc
    remained there -- in frame 1 an arc like a spectacle rim under the far eye, radial
    lines lower down. At 320 they are 1..2 px: the mask's median 3 erases them, i.e. the fit
    did NOT SEE them and did not choose where they go. Spots thinner than minThick are dropped;
    each run is a separate polygon with a sharp tip (the midpoint of the neighbouring thin point).
    At minThick=0 the geometry is the same as before (a single polygon). */
 const lit=[], nP=PO.length, mq=S.minThick||0;
 const mid=k=>[(PO[k][0]+PI[k][0])/2, (PO[k][1]+PI[k][1])/2];
 for(let k=0, s=-1; k<=nP; k++){ const exists=k<nP && qal[k]>=mq;
  if(exists && s<0) s=k;
  if(!exists && s>=0){ const e=k-1;
   if(e-s>=3) lit.push([...(s>0?[mid(s-1)]:[]), ...PO.slice(s,e+1), ...(e<nP-1?[mid(e+1)]:[]), ...PI.slice(s,e+1).reverse()]);
   s=-1; } }
 /* the shadow under the forehead: from the inner boundary toward the centre, shadowH thick (smooth ends) */
 let shadow=null;
 if(S.shadowH>0.005){ const [a0,a1]=S.shadowA, ks=[];
  for(let k=0;k<th.length;k++) if(th[k]>=a0&&th[k]<=a1) ks.push(k);
  if(ks.length>2){ const w=k=>Math.min(1,(th[k]-a0)/12,(a1-th[k])/12);
   /* the shadow moves DOWN (along the head's y), not toward the centre: the head centre is right at
      the near eye, so a radial shadow fell on the eye and merged with it (anchor probe 2.2 -> 5.6 px) */
   shadow=[...ks.map(k=>qz(shifted(ri[k]+0.02,th[k],i1.dl[k]))), ...ks.slice().reverse().map(k=>{const p=qz(shifted(ri[k],th[k],i1.dl[k])); return [p[0],p[1]+S.shadowH*w(k)];})]; } }
 /* ink lines: from between the teeth (notch) toward the crown, their length the inkK share of the distance to the crown */
 const inkPath=[];
 const draw=(P,f)=>{const q=[P[0]+(crown[0]-P[0])*f, P[1]+(crown[1]-P[1])*f]; inkPath.push([P,q]);};
 /* only on the remaining (not dropped) mass: lines coming from under a dropped thin arc
    cut across the face (frame 6, between the eyes) */
 const qm=Math.max(0.08,mq);
 for(const k of [...o1.notch,...o2.notch]) if(qal[k]>qm) draw(PO[k],S.inkK*(0.6+0.6*rnd()));
 for(const k of i1.notch) if(qal[k]>qm) draw(PI[k],S.inkK*0.7*(0.6+0.6*rnd()));
 return {lit, shadow, inkPath, S};
}
/* shadow -- the shadow on the forehead, drawn BEFORE THE EYES (portrait2): the eyes are on top of it.
   Drawn after the eye, it covered the eye white and became one dark
   component with the pupil (anchor probe 2.2 -> 8.4 px); in the sample the eye white is light. */
export function hair3(K,R,S0,idp=''){
 const {lit,shadow,inkPath,S}=hairPoly3(S0);
 const f=v=>v.toFixed(1), P=([x,y])=>K(x*R,y*R), XY=p=>{const q=P(p); return `${f(q[0])} ${f(q[1])}`;};
 const poly=v=>'M '+v.map(XY).join(' L ')+' Z';
 const L=[];
 if(lit.length){ const d=lit.map(poly).join(' ');
  L.push(`<path fill="${S.tone}" d="${d}"/>`);
  /* ink only INSIDE the hair (clip): a line pointing at the crown overshot a thin mass onto the face
     or the background. The clip id carries the frame prefix -- with a repeated id the clip of an
     invisible frame is used (lesson of pass 8). */
  if(S.minThick && inkPath.length){ L.push(`<clipPath id="${idp}sk"><path d="${d}"/></clipPath><g clip-path="url(#${idp}sk)">`); } }
 for(const [a,b] of inkPath) L.push(`<path fill="none" stroke="${S.ink}" stroke-width="${(0.012*R).toFixed(2)}" stroke-linecap="round" opacity="0.8" d="M ${XY(a)} L ${XY(b)}"/>`);
 if(S.minThick && lit.length && inkPath.length) L.push('</g>');
 return {shadow: shadow?`<path fill="${S.shadowTone}" d="${poly(shadow)}"/>`:'', upper: L.join('\n')};
}

export function hair(K,R,drawEye,seed,idp='',time=0,sway=0,eyeZone=[],lag=0){
 /* SWAY (pass 5). In the sample the boil measurement grows along the interval ladder
    (1.32 -> 2.31 px): part of the change is new on every frame (shiver),
    part of it DRIFTS -- the hair sways in the wind. The strand tips move on a slow
    wave; the phases come from a SEPARATE generator (hash), so
    the hair layout does not change -- changing the layout on every frame
    is exactly the calibrated "flicker" broken state. */
 const phase=i=>{let h=(i*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296*6.2832;};
 let strandN=0;
 const swayAt=(t)=>{const k=strandN++, f=phase(k+seed), w=6.2832/14;
  /* lag (pass 9): AFTER the head turn the hair tips trail behind --
     the turn speed, one frame late, pushes the tips the opposite way (the root
     stays in place, so a long strand bends more) */
  return [t[0]+sway*Math.sin(w*time+f)+lag, t[1]+sway*0.35*Math.sin(w*time*0.8+f*1.7)];};
 /* ===== HAIR, pass 3 =====
    A side-by-side look showed it: the old hair was a HELMET -- a smooth dome,
    a flat "cap line" on the forehead, a single straight band at the back. The cause was in the code:
    the lower edge of the cap was at -0.12R, and the strands also ended
    at about the same place -- so the visible edge stayed the cap's.
    Now every visible edge is made by a STRAND:
      1) the cap is raised (-0.42R), the strands cover it
      2) forehead strands reach the eye line, their tips at different heights and
         sharp, swept forward (to the right) -- the wind in the sample
      3) spikes rising into the sky from the front-top -- they break the dome silhouette
      4) back: not one band, separate strands with gaps
    Colour: hair/hairM/hairY measured from the sample (contrast 1.65). */
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 let s=seed; const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
 const P=([x,y])=>K(x*R,y*R);                       // the head's local unit -> screen
 const U=(a,k)=>[k*Math.cos(a*Math.PI/180), -k*Math.sin(a*Math.PI/180)];
 /* strand: root -> tip, width w at the root, bend b (along the normal).
    Pass 6: CUBIC -- an S-curve with s (the strand ripples in the wind). In a close
    comparison our strands were stiff as straight blades; in the sample they
    bend and flow in the wind direction. */
 const geo=(r,t,w,b,b2,sS)=>{
  const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy), nx=-dy/l, ny=dx/l, B2=(b2??b), S=sS||0;
  const a=[r[0]+nx*w/2, r[1]+ny*w/2], c=[r[0]-nx*w/2, r[1]-ny*w/2];
  const a1=[r[0]+dx*0.30+nx*(w*0.42+b*l*1.1), r[1]+dy*0.30+ny*(w*0.42+b*l*1.1)];
  const a2=[r[0]+dx*0.72+nx*(w*0.18+b*l*0.6-S*l), r[1]+dy*0.72+ny*(w*0.18+b*l*0.6-S*l)];
  const c2=[r[0]+dx*0.70-nx*(w*0.14-B2*l*0.6+S*l), r[1]+dy*0.70-ny*(w*0.14-B2*l*0.6+S*l)];
  const c1=[r[0]+dx*0.30-nx*(w*0.36-B2*l*1.1), r[1]+dy*0.30-ny*(w*0.36-B2*l*1.1)];
  return {a,a1,a2,t,c2,c1,c};
 };
 const blade=(r,t,w,b,b2,sS)=>{ const g=geo(r,t,w,b,b2,sS);
  return `M ${XY(P(g.a))} C ${XY(P(g.a1))} ${XY(P(g.a2))} ${XY(P(g.t))} C ${XY(P(g.c2))} ${XY(P(g.c1))} ${XY(P(g.c))} Z`; };
 /* ink line: the edge on the shadow side of the strand (in the sample, thin dark lines
    between the strands) */
 const bladeInk=(r,t,w,b,b2,sS)=>{ const g=geo(r,t,w,b,b2,sS);
  return `M ${XY(P(g.c))} C ${XY(P(g.c1))} ${XY(P(g.c2))} ${XY(P(g.t))}`; };
 const L=[];
 /* 1. BACK STRANDS -- drawn BEFORE THE CAP, so only their free
    tips come out from under the cap. They used to be on top of the cap, at a fixed 11 degree
    spacing and in colours alternating by i%2 -- seen up close they read as
    a ladder/comb (exactly the warning on the card). Now
    spacing, width, length and colour are random. */
 /* pass 5: in the sample the bright area is y 0.03..0.51 -- long, BRIGHT
    strands beside the face fall to the jaw. Ours was 0.11..0.35: the side strands short and
    40% of them dark (hairM, L 89 -- below the bright threshold). */
 {let a=142;
  for(let i=0;i<6;i++){
   a+=5+rnd()*12; const r=U(a,0.90);
   const t=[r[0]-0.02-rnd()*0.14, 0.85+rnd()*0.75];
   const c=rnd(); const cls=c<0.18?'hairM':(c<0.40?'hairY':'hair');
   L.push(`<path class="${cls}" d="${blade(r,swayAt(t),0.15+rnd()*0.12,-0.04-rnd()*0.06,0.02)}"/>`);
  }}
 /* 2. CAP -- the main mass, its front lower edge raised */
 const k=1.015, qal=[]; for(let i=0;i<=30;i++) qal.push(U(22+186*i/30,k));
 const capD=`M ${XY(P(qal[0]))}`+qal.slice(1).map(v=>` L ${XY(P(v))}`).join('')
  + ` Q ${XY(P([-0.96,0.40]))} ${XY(P([-0.80,0.58]))}`
  + ` Q ${XY(P([-0.42,-0.02]))} ${XY(P([-0.05,-0.40]))}`
  + ` Q ${XY(P([0.45,-0.52]))} ${XY(P(qal[0]))} Z`;
 L.push(`<path class="hair" d="${capD}"/>`);
 /* 2b. STRANDS THAT FRAME THE FACE (pass 6). In the sample, on the near side,
    a strand ~15 px left of the eye falls along the cheek to the jaw -- it makes the face
    narrower. Ours had the near cheek open up to the ear and the 3/4 face
    looked wide. Down from the temple (128..150 degrees). */
 /* pass 8 (5x): in the sample, on the near side, a WIDE bright hair mass frames the face from the temple
    to below the jaw; ours was short and narrow -- between the face and the
    hair the dark inside of the hood showed as a diagonal. */
 for(let i=0;i<4;i++){
  /* pass 9 (measured in head space): in the sample the near hair mass at y 0..1.1 is at
     x -0.40..-0.15 (frame 1; in frame 11 -0.55..-0.10), at y 1.2..1.45 at -0.3..-0.05,
     i.e. it falls almost VERTICALLY and covers the outer corner of the eye. The roots used to be
     at the temple (126..153 degrees) and the strands ran diagonally, leaving only thin
     tips inside the hood opening. Now the root is near the crown. */
  const a=102+i*8+rnd()*4, r=U(a,0.93);
  const t=[-0.10-0.09*i-rnd()*0.05, 1.45+0.08*i+rnd()*0.15];   // in the sample the hair reaches y 100..110 (frame 1), ours ended at ~95
  const tc=swayAt(t), w=0.22+rnd()*0.06;
  L.push(`<path class="${i===1?'hairY':'hair'}" d="${blade(r,tc,w,0.04,-0.03)}"/>`);
  /* a thin dark line between the strands -- in the sample the near hair mass has
     several separating lines inside; ours was a flat "curtain" (4x) */
  L.push(`<path fill="none" stroke="#2a2c52" stroke-width="${(0.013*R).toFixed(2)}" stroke-linecap="round" opacity="0.8" d="${bladeInk(r,tc,w,0.04,-0.03)}"/>`);
 }
 /* 3. SPIKES RISING INTO THE SKY -- front-top and crown */
 for(let i=0;i<4;i++){
  const a=14+i*14+rnd()*6, r=U(a,0.90);
  /* pass 6: the spikes are not radial (outward) -- they flow right and
     down with the WIND. The sample has no tips pointing up; the strands run diagonally
     from the crown to the lower right. */
  const t=[r[0]+0.40+rnd()*0.30, r[1]+0.20+rnd()*0.22];
  L.push(`<path class="${rnd()<0.35?'hairY':'hair'}" d="${blade(r,swayAt(t),0.13+rnd()*0.06,0.05,0.10)}"/>`);
 }
 for(let i=0;i<5;i++){
  const a=72+i*17+rnd()*8, r=U(a,0.96), t0=U(a-6-rnd()*8,1.10+rnd()*0.14);
  const t=[r[0]+0.28+(t0[0]-r[0])*0.3, r[1]+0.02];     // the crown strands also lie to the right
  L.push(`<path class="hair" d="${blade(r,swayAt(t),0.12,0.04)}"/>`);
 }
 /* 4. FOREHEAD STRANDS -- down to the eye line, tips at different heights */
 const strandList=[];
 const NT=16;                                           // more, thinner (in the sample the strands are fine)
 for(let i=0;i<NT;i++){
  const a=34+i*(112/(NT-1))+(rnd()-0.5)*6;
  const r=U(a,0.99);
  let ty=drawEye-0.30+rnd()*0.42;                   // -0.20 .. +0.22 (eye at 0.10)
  if(i%4===1) ty=drawEye+0.30+rnd()*0.30;           // every fourth one down to the cheek
  const tx=r[0]*0.70+0.16+rnd()*0.30;               // swept forward -- diagonal in the sample, stronger
  /* pass 6: the strands in front of an eye end ABOVE the eye. In pass 5 I
     lengthened the forehead strands down to the eye/cheek and they
     covered the eye; in the sample the strands pass BETWEEN and BESIDE the eyes,
     and the eyes stay clear. (rnd() is not called -- the layout must not change.) */
  /* ...and a strand can cover the eye not with its TIP but with its PATH too: a diagonal
     strand ends beside the eye and passes over it. So the strand's x AT EYE
     HEIGHT is checked (when its tip is below the eye). */
  const yT=ty, xEye= yT>drawEye ? r[0]+(tx-r[0])*(drawEye-r[1])/(yT-r[1]) : tx;
  const eyeInFront=eyeZone.some(([a,b])=>(tx>a&&tx<b)||(yT>drawEye-0.2&&xEye>a-0.05&&xEye<b+0.05));
  const cls=rnd()<0.30?'hairM':'hair';
  if(eyeInFront) ty=Math.min(ty, drawEye-0.24-0.05*((i*7)%3));
  const tc=swayAt([tx,ty]);
  /* BUG FIXED: the width's rnd() used to be INSIDE d() -- d() is called twice
     (halo, then the full strand), so the halo and the body got DIFFERENT widths
     and the lines stole the random numbers of the following strands. */
  const w=0.09+rnd()*0.07, bb=0.09+rnd()*0.09, sS=0.04+rnd()*0.06;   // more bend and S
  strandList.push({d:(kk)=>blade(r,[tc[0],tc[1]+kk*0.03],w+kk*0.05,bb,0.02,sS), inkPath:bladeInk(r,tc,w,bb,0.02,sS), cls, z:rnd(), isBright:rnd()<0.28, ink:(i%3===0), r, t:[tx,ty]});
 }
 strandList.sort((p,q)=>(p.cls==='hairM'?0:1)-(q.cls==='hairM'?0:1) || p.z-q.z);   // dark ones behind
 for(const u of strandList){
  L.push(`<path class="${u.cls}" opacity="0.38" d="${u.d(1)}"/>`);          // soft halo
  L.push(`<path class="${u.cls}" d="${u.d(0)}"/>`);
  if(u.ink) L.push(`<path fill="none" stroke="#2a2c52" stroke-width="${(0.013*R).toFixed(2)}" stroke-linecap="round" opacity="0.75" d="${u.inkPath}"/>`);
  if(u.isBright){                                                                 // bright fibre
   const r2=[u.r[0]-0.02,u.r[1]+0.02], t2=[u.r[0]+(u.t[0]-u.r[0])*0.72, u.r[1]+(u.t[1]-u.r[1])*0.72];
   L.push(`<path class="hairY" d="${blade(r2,t2,0.035,0.05)}"/>`);
  }
 }
 /* soft gradient on the hair (airbrush) -- only over the cap */
 L.push(`<clipPath id="${idp}cs"><path d="${capD}"/></clipPath>`);
 const c=K(0,0);
 L.push(`<rect x="${(c[0]-2.4*R).toFixed(1)}" y="${(c[1]-2.4*R).toFixed(1)}"`
      + ` width="${(4.8*R).toFixed(1)}" height="${(4.8*R).toFixed(1)}"`
      + ` fill="url(#gHair)" clip-path="url(#${idp}cs)"/>`);
 return L.join('\n');
}
