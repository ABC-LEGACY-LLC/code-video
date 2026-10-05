/* ===== PORTRAIT =====
   Everything comes from the points of the head construction: forehead, front edge,
   chin, ear, top, back. So if you change the "tilt", the hood, the hair and the
   eyes all follow together -- nothing is placed by hand. */
import {TEMPLATE, build} from './head.mjs';
import {writeFileSync} from 'fs';

export function portrait(P, cx, cy, S=1){
 const b=build(P,cx,cy), K=b.K, R=P.R;
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const L=[];
 const q=(cls,d)=>L.push(`<path class="${cls}" d="${d}"/>`);

 /* BACK OF THE HOOD: an arc 1.42 times wider than the skull, falling to the shoulder */
 const H=(a,k)=>K(R*k*Math.cos(a*Math.PI/180), -R*k*Math.sin(a*Math.PI/180));
 const hood=[]; for(let i=0;i<=30;i++) hood.push(H(-26+(232)*i/30, 1.44));
 q('hoodT', `M ${XY(hood[0])}` + hood.slice(1).map(v=>` L ${XY(v)}`).join('')
   + ` L ${XY(K(-2.0*R, 2.7*R))} L ${XY(K(1.5*R, 3.0*R))} Z`);
 /* inside the hood: a dark ring around the face */
 const inner=[]; for(let i=0;i<=24;i++) inner.push(H(30+(170)*i/24, 1.30));
 const inner2=[]; for(let i=0;i<=24;i++) inner2.push(H(200-(170)*i/24, 1.02));
 q('hoodI', `M ${XY(inner[0])}` + inner.slice(1).map(v=>` L ${XY(v)}`).join('')
   + inner2.map(v=>` L ${XY(v)}`).join('') + ' Z');

 /* FACE */
 q('skin', b.silhouette);
 /* SHADOW: a hard step. The border runs from the forehead down to the chin, splitting the face in two */
 q('skinQ', `M ${XY(b.back)} L ${XY(K(-0.10*R,-0.95*R))} Q ${XY(K(-0.34*R,0.30*R))} ${XY(K(-0.30*R,1.02*R))}`
   + ` Q ${XY(K(-0.62*R,0.92*R))} ${XY(b.jaw)} Q ${XY(K(-0.90*R,0.52*R))} ${XY(b.back)} Z`);

 /* HAIR: strands crossing the forehead, all in head coordinates */
 const hair=[]; for(let i=0;i<=22;i++) hair.push(H(8+(184)*i/22, 1.08));
 q('hair', `M ${XY(hair[0])}` + hair.slice(1).map(v=>` L ${XY(v)}`).join('')
   + ` Q ${XY(K(-0.70*R,-0.30*R))} ${XY(K(-0.18*R,-0.52*R))}`
   + ` Q ${XY(K(0.42*R,-0.46*R))} ${XY(K(0.76*R,-0.16*R))} Z`);
 q('hairQ', `M ${XY(hair[13])} L ${XY(hair[22])} Q ${XY(K(-0.70*R,-0.30*R))} ${XY(K(-0.30*R,-0.50*R))} Z`);
 [[0.10,-0.60,0.02,-0.16],[0.40,-0.56,0.30,-0.10],[0.66,-0.36,0.58,0.00]].forEach(([x0,y0,x1,y1])=>{
  q('hair', `M ${XY(K(x0*R,y0*R))} L ${XY(K(x1*R,y1*R))} L ${XY(K((x1+0.14)*R,(y1-0.10)*R))} L ${XY(K((x0+0.12)*R,(y0+0.02)*R))} Z`);
 });

 /* EYE, BROW, NOSE, MOUTH -- in head coordinates, so they slant together */
 /* EYE OPENNESS: 1 = fully open, 0 = closed. When closed, a curve is drawn,
    not an ellipse -- a closed eye is a line, not a squashed ellipse. */
 const OPEN = P.eyeOpenness===undefined ? 1 : P.eyeOpenness;
 const E=(u,r)=>{ const c=K(u*R,P.drawEye*R);
   if(OPEN<0.22){
    const a=K((u-0.13)*R,P.drawEye*R), b=K((u+0.13)*R,P.drawEye*R),
          m=K(u*R,(P.drawEye+0.06)*R);
    L.push(`<path class="ing" d="M ${XY(a)} Q ${XY(m)} ${XY(b)}"/>`);
    return;
   }
   L.push(`<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r*S)}" ry="${f(r*1.18*OPEN*S)}" class="eye"/>`);
   const h=K((u+0.05)*R,(P.drawEye-0.10*OPEN)*R);
   L.push(`<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${f(0.30*r*S)}" fill="#f4f6fa"/>`); };
 // upper eyelid lines
 L.push(`<path class="ing" d="M ${XY(K(0.02*R,(P.drawEye-0.13)*R))} Q ${XY(K(0.20*R,(P.drawEye-0.26)*R))} ${XY(K(0.40*R,(P.drawEye-0.14)*R))}"/>`);
 L.push(`<path class="ing" d="M ${XY(K(0.58*R,(P.drawEye-0.14)*R))} Q ${XY(K(0.72*R,(P.drawEye-0.25)*R))} ${XY(K(0.86*R,(P.drawEye-0.15)*R))}"/>`);
 E(0.20,7); E(0.72,5.2);
 // brows
 L.push(`<path class="ingQ" d="M ${XY(K(0.00*R,(P.drawEye-0.36)*R))} Q ${XY(K(0.20*R,(P.drawEye-0.48)*R))} ${XY(K(0.42*R,(P.drawEye-0.34)*R))}"/>`);
 L.push(`<path class="ingQ" d="M ${XY(K(0.58*R,(P.drawEye-0.36)*R))} Q ${XY(K(0.74*R,(P.drawEye-0.47)*R))} ${XY(K(0.90*R,(P.drawEye-0.33)*R))}"/>`);
 // nose (seen from below when looking up) and mouth
 L.push(`<path class="ing" d="M ${XY(K(0.86*R,(P.nose-0.10)*R))} L ${XY(K(0.94*R,P.nose*R))} L ${XY(K(0.80*R,(P.nose+0.06)*R))}"/>`);
 L.push(`<path class="ing" d="M ${XY(K(0.50*R,P.mouth*R))} Q ${XY(K(0.60*R,(P.mouth+0.05)*R))} ${XY(K(0.70*R,P.mouth*R))}"/>`);
 // ear
 L.push(`<path class="ingQ" d="M ${XY(K((P.ear[0]+0.06)*R,(P.ear[1]-0.12)*R))} Q ${XY(K((P.ear[0]-0.06)*R,P.ear[1]*R))} ${XY(K((P.ear[0]+0.06)*R,(P.ear[1]+0.14)*R))}"/>`);
 // ink: silhouette
 L.push(`<path class="ing" d="${b.silhouette}"/>`);

 /* FRONT EDGE OF THE HOOD: falls over the face */
 const front1=[]; for(let i=0;i<=14;i++) front1.push(H(-26+86*i/14, 1.44));
 const front2=[]; for(let i=0;i<=14;i++) front2.push(H(60-86*i/14, 1.16));
 q('hoodS', `M ${XY(front1[0])}` + front1.slice(1).map(v=>` L ${XY(v)}`).join('')
   + front2.map(v=>` L ${XY(v)}`).join('') + ' Z');
 L.push(`<path class="ing" d="M ${XY(front1[0])}` + front1.slice(1).map(v=>` L ${XY(v)}`).join('') + '"/>');

 return L.join('\n');
}

/* ===== MEASURED PALETTE =====
   Sampled from the target clip, not invented (k01.png, 320x180):
     hair      median #13142e   brightest #656b97
     face      median #38385a   brightest #636993
     hood      median #101128
     sky       median #04051c   particle #d5d6ed .. #f3eeff
   In the first version the face was #e2dad3 -- L 218, while the target has 59. So the face
   was two and a half times too bright, and that is not a drawing mistake but a tone mistake. */
export const STYLE_CSS = `
.hoodT{fill:#101128}.hoodI{fill:#07081a}.hoodS{fill:#191835}
.hair{fill:#13142e}.hairQ{fill:#0b0c1e}
.skin{fill:#38385a}.skinQ{fill:#23243f}
.eye{fill:#0a0b1c}
.ing{fill:none;stroke:#000210;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ingQ{fill:none;stroke:#000210;stroke-width:1.2;stroke-linecap:round}
`;
