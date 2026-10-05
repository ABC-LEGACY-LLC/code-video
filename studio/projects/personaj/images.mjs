/* FRAME SVG -- film.mjs and the hair fitting server (test/hair-server.mjs) build a
   frame from the SAME code. Pass 11: the hair fit had to draw every frame quickly;
   the functions in film.mjs were moved to this file (behaviour unchanged: film.html
   is checked to come out byte-for-byte the same). */
import {SHEET, BLACK, MS, BOUNDARIES, CLOAK, CLOAK_TONE, CLOAK_LOW, HAND, TEAR2, EYE_TEARS, HELD} from './sheet.mjs';
import {portrait, STYLE_CSS, GRAD, hood3Geo} from './portrait2.mjs';
import {build} from './head.mjs';
import {hairPoly3} from './face.mjs';
export {SHEET, BLACK, MS, BOUNDARIES, STYLE_CSS, GRAD};
export const W=540,H=304;
/* sky measured from the sample: in the right 28% of columns, particle-free via a median filter, 6 bands */
export const BACKGROUND='linear-gradient(to bottom,#020318 8.3%,#06071e 25%,#11112c 41.7%,#201d3c 58.3%,#2b2748 75%,#38325d 91.7%)';
/* CLOAK: a dark mass tied to the shot, BEHIND the portrait. Its right edge is
   measured (sheet.mjs CLOAK); in the head rows it does not pass the head centre. */
function cloak(P,cx,cy,R,i){
 const ch=CLOAK[P.__name]; if(!ch) return '';
 /* only the FACE rows are limited (forehead .. chin). It used to be limited above
    the crown too, and a vertical line showed in the sky above the hair --
    in the sample there is hood there. */
 const y0=cy-0.95*R, y1=cy+1.55*R;
 const pts=ch.map((x,r)=>{const y=(r+0.5)/18*H; let X=x*W;
  if(y>y0&&y<y1) X=Math.min(X,cx); return [X,y];});
 let sm=pts.map((p,i)=>[(pts[Math.max(0,i-1)][0]+2*p[0]+pts[Math.min(pts.length-1,i+1)][0])/4,p[1]]);
 /* pass 10: below the chin, a per-shot measured edge (sheet.mjs
    CLOAK_LOW, 320 px, every 3 px) -- instead of the 10 px rows */
 const pp=CLOAK_LOW[i];
 if(pp){ const yk=pp[0][0]*S5; sm=sm.filter(p=>p[1]<yk-6).concat(pp.map(([y,x])=>[x*S5,y*S5])); }
 /* pass 12: in hood screen mode (shots 2 and 3) the top-right part of the cloak does not pass
    the measured hood line (where it cuts the frame top -> the top-right corner). The cloak
    is a coarse 18-row profile: at the top of shot 3 x 0.66 (~211 at 320) -- in the sample the
    hood cuts the frame top at x 179, with sky to its right (L 2..8). */
 const KE=P.__hood3&&P.__hood3.screen;
 if(KE&&KE.top_right){ const [tx]=KE.top_right, [bx,by]=KE.angle;
  sm=[[tx,0],[bx,by],...sm.filter(p=>p[1]>by+4)]; }
 const d=`M -12 -12 L ${sm[0][0].toFixed(1)} -12 `
  + sm.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  + ` L ${sm[sm.length-1][0].toFixed(1)} ${H+12} L -12 ${H+12} Z`;
 const T=CLOAK_TONE[P.__name];
 if(!T) return `<path class="hoodT" d="${d}"/>`;
 if(T.above) return `<path class="hoodT" d="${d}"/>`;            // tones after the portrait (upper)
 /* smooth closed curve: quadratics through the midpoint of every edge */
 const curve=pp=>{const q=pp.map(([x,y])=>[x*W,y*H]), n=q.length, m=i=>[(q[i][0]+q[(i+1)%n][0])/2,(q[i][1]+q[(i+1)%n][1])/2];
  let s=`M ${m(n-1)[0].toFixed(1)} ${m(n-1)[1].toFixed(1)}`;
  for(let i=0;i<n;i++) s+=` Q ${q[i][0].toFixed(1)} ${q[i][1].toFixed(1)} ${m(i)[0].toFixed(1)} ${m(i)[1].toFixed(1)}`;
  return s+' Z';};
 /* the id MUST be unique per frame: in frames 1..6 cx,cy were the same -> 6 identical
    ids, url(#..) bound to the first one (inside a hidden svg), and in 2..6 the shadows
    were drawn UNCLIPPED (the silhouette measurement found it in pass 10) */
 const id='pl'+i+'_'+Math.round(cx)+'_'+Math.round(cy);
 const flange=sm.filter(p=>p[1]<T.flange*H+12);
 return `<clipPath id="${id}"><path d="${d}"/></clipPath>`
  + `<path fill="${T.base}" d="${d}"/>`
  + `<g clip-path="url(#${id})">`
  /* lit side: a hard-edged shape read as a disc (strong contrast next to the inner
     black band). The sample has a soft transition -- a radial gradient. */
  + T.bright.map((p,k)=>{const xs=p.map(v=>v[0]*W), ys=p.map(v=>v[1]*H);
     const gx=(Math.min(...xs)+Math.max(...xs))/2, gy=(Math.min(...ys)+Math.max(...ys))/2,
           rr=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*0.62;
     return `<radialGradient id="${id}y${k}" cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${rr.toFixed(1)}" gradientUnits="userSpaceOnUse">`
      + `<stop offset="0" stop-color="#15162f" stop-opacity="1"/><stop offset="1" stop-color="#15162f" stop-opacity="0"/></radialGradient>`
      + `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*1.3).toFixed(1)}" fill="url(#${id}y${k})"/>`;}).join('')
  /* pass 10: in the sample's under-chin column L 7..9 (median 7-8); #07081a 0.92 -> was L 10.5 */
  + T.shadow.map(p=>`<path fill="#04051a" opacity="0.95" d="${curve(p)}"/>`).join('')
  + `</g>`
  + (flange.length>1?`<path fill="none" stroke="#1c1d3a" stroke-width="3" stroke-linecap="round" d="M ${flange[0][0].toFixed(1)} -4 `+flange.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')+`"/>`:'');
}
/* BOIL: as if every frame were redrawn. Each frame gets a new, SMOOTH random
   displacement field (wavelength ~68 px) -- neighbouring points move together,
   the line stays clean, but each part shakes on its own. Shapes sharing a
   border move the same way. Only absolute M/L/Q/Z are used (checked),
   so every pair of numbers in d is a coordinate. */
function jitter(svg,i,A){
 if(!A) return svg;
 let h=(i+1)*2654435761>>>0; const r=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};
 const f=[r(),r(),r(),r()].map(v=>v*6.2832), w=6.2832/(+process.env.JITTER_TL||68);
 const D=(x,y)=>[A*(Math.sin(w*(0.8*x+0.6*y)+f[0])+Math.sin(w*(-0.5*x+0.9*y)+f[1]))/1.414,
                 A*(Math.sin(w*(0.7*x-0.7*y)+f[2])+Math.sin(w*(0.3*x+1.0*y)+f[3]))/1.414];
 svg=svg.replace(/ d="([^"]*)"/g,(m,d)=>{
  const t=d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g); const o=[]; let buf=[];
  for(const k of t){ if(/[A-Za-z]/.test(k)){o.push(k);} else { buf.push(+k); if(buf.length===2){const [dx,dy]=D(buf[0],buf[1]); o.push((buf[0]+dx).toFixed(1),(buf[1]+dy).toFixed(1)); buf=[];} } }
  return ` d="${o.join(' ')}"`;});
 svg=svg.replace(/<(circle|ellipse)([^>]*?) cx="([-\d.]+)" cy="([-\d.]+)"/g,(m,tag,pre,x,y)=>{const [dx,dy]=D(+x,+y); return `<${tag}${pre} cx="${(+x+dx).toFixed(1)}" cy="${(+y+dy).toFixed(1)}"`;});
 return svg;
}
/* UPPER TONES: in frames where the hood covers the cloak, the shadows come after the
   portrait, inside the (cloak U hood) clip -- the clipPath children give the union. */
function upper(P,cx,cy,R,i){
 const T=CLOAK_TONE[P.__name]; if(!T||!T.above) return '';
 /* pass 12: the new hood (P.__hood3) has NONE of these shadows -- in the sample there is no
    black oval on the hood, the folds are thin diagonal lines (measured separately) */
 if(P.__hood3) return '';
 const ch=CLOAK[P.__name], y0=cy-0.95*R, y1=cy+1.55*R;
 const pts=ch.map((x,r)=>{const y=(r+0.5)/18*H; let X=x*W; if(y>y0&&y<y1) X=Math.min(X,cx); return [X,y];});
 const d=`M -12 -12 L ${pts[0][0].toFixed(1)} -12 `+pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')+` L ${pts[pts.length-1][0].toFixed(1)} ${H+12} L -12 ${H+12} Z`;
 const curve=pp=>{const q=pp.map(([x,y])=>[x*W,y*H]), n=q.length, m=j=>[(q[j][0]+q[(j+1)%n][0])/2,(q[j][1]+q[(j+1)%n][1])/2];
  let s=`M ${m(n-1)[0].toFixed(1)} ${m(n-1)[1].toFixed(1)}`;
  for(let j=0;j<n;j++) s+=` Q ${q[j][0].toFixed(1)} ${q[j][1].toFixed(1)} ${m(j)[0].toFixed(1)} ${m(j)[1].toFixed(1)}`;
  return s+' Z';};
 const id='us'+i;
 return `<clipPath id="${id}"><path d="${d}"/><use href="#f${i}_hoodFrontP"/></clipPath>`
  /* the folds have soft edges: with hard edges they read as holes/openings */
  + `<g clip-path="url(#${id})"><g filter="url(#softCloak)">` + T.shadow.map(p=>`<path fill="#05061d" opacity="0.85" d="${curve(p)}"/>`).join('') + `</g></g>`;
}
/* HAND (shot 1, pass 10): a "tongue" model -- base B (half-width hB, along the
   normal to B->T), tip T, top edge P0->T with control U, bottom edge T->P1
   with control D; its back is inside the body. Points in sheet.mjs HAND (320 px),
   fitted by test/hand-fit.py to the sample mask. Colour: in the sample the inside of
   the hand is L 8 (same as the body), no lit edge (the edge in pass 9 was really a
   slit of background under the hand). */
const S5=540/320, F=v=>(v*S5).toFixed(1);
function hand(i){
 const q=HAND[i]; if(!q) return '';
 return q.map(lang).join('');
}
function lang({B,T,U,D,hB}){
 const dx=T[0]-B[0], dy=T[1]-B[1], l=Math.hypot(dx,dy)||1, n=[-dy/l,dx/l];
 const P0=[B[0]-n[0]*hB,B[1]-n[1]*hB], P1=[B[0]+n[0]*hB,B[1]+n[1]*hB];
 const p=a=>`${F(a[0])} ${F(a[1])}`;
 const d=`M ${p(P0)} Q ${p(U)} ${p(T)} Q ${p(D)} ${p(P1)} Q ${p([B[0]-8,B[1]])} ${p(P0)} Z`;
 return `<path fill="#05061c" d="${d}"/>`;   // L 8.2
}
/* TEAR ON THE JAW (the second one): a hanging and a falling ring */
function tear2(i){
 const y=TEAR2[i]; if(!y) return '';
 const [x,z]=y.c, [rx,ry]=y.r;
 if(y.t==='droplet') return `<ellipse cx="${F(x)}" cy="${F(z)}" rx="${F(rx)}" ry="${F(ry)}" fill="#9a9ed2"/><circle cx="${F(x-0.6)}" cy="${F(z-0.7)}" r="${F(0.8)}" fill="#d4d7f4"/>`;
 return `<ellipse cx="${F(x)}" cy="${F(z)}" rx="${F(rx)}" ry="${F(ry)}" fill="#1a1b33" fill-opacity="0.55" stroke="#6e72a4" stroke-width="1.1"/>`
  + `<circle cx="${F(x+rx*0.3)}" cy="${F(z-ry*0.75)}" r="${F(0.6)}" fill="#9ea2d2"/>`;
}
/* TEARS (pass 9): from the per-frame table, 320 px -> 540. 'iz' -- a thin
   drop-streak (pointed top, round bottom, bright); 'large' -- a clear drop:
   bright edge, inside lighter than the face tone, a highlight at the bottom; iz: [x,y] --
   start of the wet trail behind it. Direction: top to bottom, slightly right (as in the sample). */
function droplet(d){
 const [x,y]=d.c, w=d.w, h=d.h, a=Math.atan2(1,0.42)-Math.PI/2;       // ~23 degrees
 const ux=Math.sin(-a), uy=Math.cos(a);                                 // downward direction
 const nx=uy, ny=-ux;
 const T=[x-ux*h*0.55, y-uy*h*0.55], B=[x+ux*h*0.45, y+uy*h*0.45];
 const P=(p)=>`${F(p[0])} ${F(p[1])}`;
 const L1=[B[0]+nx*w*0.5, B[1]+ny*w*0.5], L2=[B[0]-nx*w*0.5, B[1]-ny*w*0.5];
 const path=`M ${P(T)} Q ${P([x+nx*w*0.45,y+ny*w*0.45])} ${P(L1)} Q ${P([B[0]+ux*w*0.55,B[1]+uy*w*0.55])} ${P(L2)} Q ${P([x-nx*w*0.45,y-ny*w*0.45])} ${P(T)} Z`;
 let o='';
 if(d.trail) o+=`<path fill="none" stroke="#9ea2d2" stroke-width="${F(1.0)}" stroke-linecap="round" opacity="0.45" d="M ${P(d.trail)} L ${P(T)}"/>`;
 /* brightness measured: in the sample the streak is L 100..131 (170 in frame 11), the drop 127..164;
    ours was 197..224 */
 if(d.t==='trail') return o+`<path fill="#686c9b" d="${path}"/><ellipse cx="${F(B[0]-nx*w*0.12)}" cy="${F(B[1]-uy*h*0.12)}" rx="${F(w*0.22)}" ry="${F(h*0.14)}" fill="#8589bb"/>`;
 /* ON the face a clear drop reads as bright (sample: ~half of a 7x11 box is L>82,
    the brightest 127..164) -- a ring with a dark inside only over the dark cloak (falling) */
 return o+`<path fill="#686c9b" fill-opacity="0.85" stroke="#7e82b3" stroke-width="${F(0.7)}" d="${path}"/>`
  + `<ellipse cx="${F(B[0]-nx*w*0.15)}" cy="${F(B[1]-uy*h*0.18)}" rx="${F(w*0.18)}" ry="${F(h*0.12)}" fill="#9296c6"/>`;
}
function tears(i){ const t=EYE_TEARS[i]; return t? t.map(droplet).join('') : ''; }
/* over -- values written over the frame's parameters (for fitting);
   boil=false -- no boil (a clean render for measurement) */
export function frameSVG(i, over={}, boil=true){
 const P={...SHEET[i], ...over}; const [cx,cy,k]=P.__place; const R=P.R*k;
 return jitter(cloak(P,cx,cy,R,i)+portrait({...P,R},cx,cy,'f'+i+'_')+tears(i)+hand(i)+tear2(i)+upper(P,cx,cy,R,i), i, (boil&&!HELD[i])?(P.__boilAmp||0):0);
}

/* HAIR GEOMETRY ON SCREEN (for fitting): the same Ks as in portrait() --
   the K of build(), with the soft squeeze sqs for the hair. Returns: the lit mass, the shadow
   and the ink lines as 540x304 screen points. */
export function hairGeo(i, prm){
 const P0=SHEET[i]; const [cx,cy,k]=P0.__place; const R=P0.R*k; const P={...P0,R};
 const b=build(P,cx,cy), sqs=0.80+0.20*(P.turn??0.26);
 const Ks=(x,y)=>b.K(x*sqs/b.sq, y), m=p=>Ks(p[0]*R,p[1]*R);
 const {lit,shadow,ink}=hairPoly3(prm);
 return {lit:lit.map(pl=>pl.map(m)), shadow:shadow?shadow.map(m):null, ink:ink.map(([a,c])=>[m(a),m(c)]), inkW:0.012*R, R, o:Ks(0,0), ex:Ks(R,0), ey:Ks(0,R)};
}

/* HOOD GEOMETRY ON SCREEN (pass 12): the same P and hood3Geo as in frameSVG --
   outer surface, wedge and lining points at 540x304 (hair-server 'hoodgeo'). */
export function hoodGeo(i, over={}){
 const P={...SHEET[i], ...over}; const [cx,cy,k]=P.__place; const R=P.R*k; const Q={...P,R};
 const g=hood3Geo(Q); if(!g) return null;
 return {outer:g.outer, wedge:g.wedge, band:g.band};
}
