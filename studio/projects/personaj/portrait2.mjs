/* ===== PORTRAIT (second structure) =====
   The features come from face.mjs. This file knows only the LAYER ORDER and
   the hood.  The palette was sampled from the target clip:
     hair #13142e / lit #656b97, face #38385a / lit #636993,
     hood #101128, sky #04051c */
import {build} from './head.mjs';
import {eye, hair, hair2, hair3} from './face.mjs';

export const GRAD = `
<filter id="softCloak" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="softFace" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
<filter id="softDraw" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="0.7"/></filter>
<linearGradient id="gFace" x1="0" y1="0" x2="0" y2="1">
  <!-- pass 8: in the sample the forehead under the hair is DARK, the middle of the face flat, the jaw
       with a rim light. It used to be the other way round: light on top, dark below. -->
  <stop offset="0.34" stop-color="#14152a" stop-opacity="0.50"/>
  <stop offset="0.47" stop-color="#14152a" stop-opacity="0"/>
  <stop offset="1"    stop-color="#14152a" stop-opacity="0"/>
</linearGradient>
<linearGradient id="gHair" x1="0.15" y1="0" x2="0.6" y2="1">
  <stop offset="0%"   stop-color="#a7abd8" stop-opacity="0.34"/>
  <stop offset="40%"  stop-color="#6d72a4" stop-opacity="0.12"/>
  <stop offset="100%" stop-color="#101128" stop-opacity="0.40"/>
</linearGradient>`;

export const STYLE_CSS = `
.hoodT{fill:#101128}.hoodI{fill:#070818}.hoodS{fill:#1a1b36}.hoodB{fill:none;stroke:#080917;stroke-width:2}
/* RE-MEASURED in pass 3 (sample/k01..k11, head box, spatial):
   hair median #5b608e L110, lit hair #77789c L132, face #383857 L66,
   hair/face contrast 1.65. With the old values the hair (L81) was too close to the face (L72)
   -- so the hair did not stand out. skinY (L107) gave the face a tone at hair
   level and broke the hierarchy; the sample has no such tone on the face. */
.hair{fill:#5b608e}.hairM{fill:#494c76}.hairY{fill:#77789c}
.skin{fill:#383857}.skinM{fill:#343552}.skinQ{fill:#262740}.skinY{fill:#4b4b70}
.ing{fill:none;stroke:#191b33;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`;

/* ===== PASS 12: THE HOOD FROM THE SIDE AND BELOW (P.__hood3 = {screen}, shots 2 and 3) =====
   The camera is on the character's RIGHT side and below (on screen the right side of the face that looks
   to the right is visible; earlier this was written as "left" -- wrong): the bright lining band UNDER the brim (L 43..48),
   the INSIDE of the hood (L 7..9), the outer surface (L 19) -- these are seen only from the side and below.
   The hood is cloth resting on the shoulders; its brim (the visor above the forehead) RESTS on the hair,
   and when the head tilts the visor drops over the forehead and covers more of the hair (in the sample the bright hair
   -67%, the lower edge of the band 53 px lower at 14->18, the hair tips only 18 px).
   The keys are ON SCREEN (540 px), MEASURED from the sample: test/hood3-measure.py -> hood3-screen.json:
     top, low    -- the top and bottom edges of the lining band, 7 column keys (left to right)
     A R1 R2 B   -- the wedge (inside of the hood): tip, right side (vertical edge or sharp tip), bottom tip
     side        -- the brim beside the face, below the wedge (2 points)
     angle       -- the upper-right corner of the hood; top_right -- where its line cuts the top of the frame
   Brim = top_right -> angle -> top edge of the band (right to left) -> R1 -> A -> B -> side -> straight
   down. The outer surface covers everything to the LEFT of the brim; the wedge and the band are drawn OVER THE HEAD
   (in the sample the back of the head is hidden inside the hood, the inside shows in the gap; our head is
   larger -- its back is where the wedge is -- so the wedge covers it the same way the outer surface would).
   History: step 1 of pass 12 tried a model in head units (the brim a STRAIGHT
   line from the peak to the temple, the dome fitted with CMA) -- in the sample that line passes OVER the band,
   and in ours the band was left as a 'horn' in the sky; the 17-parameter CMA produced a sharp tip and a self-crossing
   brim. Now only the measured keys. */
export function hood3Geo(P){
 const E=P.__hood3&&P.__hood3.screen; if(!E) return null;
 const topEdge=E.top, lowEdge=E.low;
 const rim=[E.angle, ...topEdge.slice().reverse(), E.R1, E.A, E.B, ...E.side];
 const yo=E.side[E.side.length-1]||E.B, top=E.top_right||[E.angle[0],0];
 const outer=[[-40,-40],[top[0],-40],[top[0],top[1]], ...rim, [yo[0],344], [-40,344]];
 return {outer, wedge:[E.A,E.R1,E.R2,E.B], band:[...topEdge, ...lowEdge.slice().reverse()],
  dbg:[[...E.angle,'angle'],[...topEdge[0],'C'],[...topEdge[topEdge.length-1],'E'],[...E.A,'A'],[...E.R1,'R1'],[...E.R2,'R2'],[...E.B,'B'],...E.side.map((p,j)=>[...p,'side'+j])]};
}
const _d=v=>'M '+v.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')+' Z';

export function portrait(P,cx,cy,idp=''){
 const b=build(P,cx,cy), K=b.K, R=P.R;
 /* THE SKULL AND THE HAIR ARE ROUND. K in build() squeezes x by
    (0.52+0.48*turn) for the 3/4 view -- right for the face features, but a sphere
    looks like a circle from every side. Because the squeeze was applied to the hair too,
    the hair had turned into a narrow ellipse (in the sample it is wide and full).
    Ks: a gentler squeeze for the hair and the hood (0.80+0.20*turn). */
 const sq=b.sq, sqs=0.80+0.20*(P.turn??0.26);   // sq now comes from build() (a blend of the keys)
 const Ks=(x,y)=>K(x*sqs/sq, y);
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const H=(a,k)=>Ks(R*k*Math.cos(a*Math.PI/180), -R*k*Math.sin(a*Math.PI/180));   // hood arcs -- round
 const arc=(a0,a1,k,n=26)=>{const o=[];for(let i=0;i<=n;i++)o.push(H(a0+(a1-a0)*i/n,k));return o;};
 const yo=v=>v.map(p=>` L ${XY(p)}`).join('');
 const L=[];

 /* 1. BACK OF THE HOOD -- 1.5 times wider than the head, falls down to the shoulders */
 /* pass 3: the hood now covers only the BACK (62..214 degrees). It used to start at -30
    and wrap the front-top of the head too -- in a side-by-side look
    this read as a helmet rim. In the sample the front-top of the head is open
    sky, where the hair tips stand. The return path runs under the chin and behind
    the face -- the face covers it. */
 const noHood=!!P.__noHood;   // pass 12: for the fitting model -- a head without a hood
 const hoodScreen=!!(P.hoodFront&&P.__hood3&&P.__hood3.screen);   // pass 12: the outer surface covers the back arc and the folds (not drawn)
 const d1=arc(96,214,1.26);   // at 62 a dark 'horn' came out at the front-top
 /* pass 6: the lower (body) points of the hood do NOT ROTATE with the head.
    They used to go through K down to 3.8R, and when the head rolled (shot 1 -12..+12)
    they swept the whole body to the right and drew a dark triangle below. The body
    comes from the cloak tied to the frame; here it goes only down to below the neck. */
 const Kt=(x,y)=>[cx+x*R*0.9, cy+y*R];       // non-rotating frame
 if(!noHood&&!hoodScreen) L.push(`<path class="hoodT" d="M ${XY(d1[0])}${yo(d1.slice(1))}`
      + ` L ${XY(Kt(-2.2,2.6))} L ${XY(Kt(0.7+(P.__hoodTFront??0),2.6))}`
      + ` L ${XY(Kt(0.75+(P.__hoodTFront??0),1.3))} L ${XY(K(0.15*R,0.15*R))} Z"/>`);   // __hoodTFront: moves the front edge of the body (shot 2 map)
 /* folds: spread out from where the cloth gathers */
 [[112,1.20,0.80],[162,1.24,0.60]].forEach(([a,k,t])=>{
  if(!noHood&&!hoodScreen) L.push(`<path class="hoodB" opacity="0.5" d="M ${XY(H(a,k))} Q ${XY(H(a-10,k*0.75))} ${XY(K((Math.cos(a*Math.PI/180)*0.5-0.2)*R,(t*2.6)*R))}"/>`);
 });
 /* 2. INSIDE OF THE HOOD -- the darkness around the face, wide at the top, narrow at the bottom */
 /* the width of the inner shadow is measured: in the sample a dark band ~0.5R wide
    behind the face (L<16). It used to be 0.08R. */
 /* ...and only BEHIND THE FACE (from above the ear to the jaw, 140..225 degrees). Starting
    at 74 it drew a black crescent over the hair -- in the sample the top of the head
    has hood (L~20), not black. */
 const i1=arc(140,225,1.40), i2=arc(225,140,1.00);
 const G3=P.hoodFront&&P.__hood3 ? hood3Geo(P) : null;
 if(G3) {}                     // pass 12: the inside of the hood (wedge) OVER the head, in section 8
 else if(P.hoodFront) L.push(`<path class="hoodI" d="M ${XY(i1[0])}${yo(i1.slice(1))}${yo(i2)} Z"/>`);
 else {
  /* pass 9: THE HOOD OPENING (shot 1). In the sample the hood COVERS the back
     of the head: at eye height the hair starts at x~76..78 (ours started at 54,
     sticking out ~20 px to the back). Measured IN HEAD SPACE (test/unwarp: each
     frame had its roll and centre undone and was spread onto a grid in head units):
       frame 1: left edge of the hair x -0.40 (y -0.1..1.1); left of it a DARK
         sickle (L 9-13) y -0.1..0.5, x -1.1..-0.45; lower down a BRIGHT lining
         (L 36-47, the same colour as the far band) x -0.62..-0.42, y 0.5..1.1;
       frame 11: edge -0.35 (y 0) .. -0.60 (y 0.8); sickle y -0.3..0.3;
         lining x -0.8..-0.55, y 0.4..1.1, also at the top (y -0.6..-0.3).
     The head turns inside the hood -- the shapes are blended by tbo between two keys
     (frames 1 and 11), as on the face. */
  const U=(x,y)=>XY(K(x*R,y*R)), mx=(A1,A2)=>A1.map((p,i)=>[A2[i][0]+(p[0]-A2[i][0])*b.tbo, A2[i][1]+(p[1]-A2[i][1])*b.tbo]);
  /* a smooth closed curve (quadratics through the edge midpoints): a polygon with straight
     edges read as an angular "patch" at film size */
  const poly=v=>{const n=v.length, m=i=>[(v[i][0]+v[(i+1)%n][0])/2,(v[i][1]+v[(i+1)%n][1])/2];
   let d=`M ${U(...m(n-1))}`; for(let i=0;i<n;i++) d+=` Q ${U(...v[i])} ${U(...m(i))}`; return d+' Z';};
  const backPts=mx([[-0.32,-0.12],[-1.12,-0.08],[-1.12,0.15],[-0.80,0.45],[-0.60,0.56],[-0.32,0.52]],
               [[-0.28,-0.34],[-1.12,-0.34],[-1.12,0.14],[-0.82,0.28],[-0.66,0.34],[-0.36,0.32]]);
  L.push(`<path class="hoodI" d="${poly(backPts)}"/>`);
  /* lining -- a BAND along the hair edge (a smooth 5-point shape read as a round
     "ear" at film size; in the sample its outer edge is parallel to the hair edge) */
  const liningPts=mx([[-0.36,0.46],[-0.52,0.47],[-0.62,0.52],[-0.645,0.66],[-0.65,0.80],[-0.64,0.95],[-0.60,1.10],[-0.50,1.15],[-0.36,1.16],[-0.36,0.80]],
               [[-0.40,0.34],[-0.60,0.36],[-0.74,0.44],[-0.80,0.58],[-0.82,0.75],[-0.80,0.92],[-0.70,1.08],[-0.55,1.12],[-0.40,1.12],[-0.40,0.72]]);
  L.push(`<path fill="#242851" filter="url(#softDraw)" d="${poly(liningPts)}"/>`);   // soft edge: in the sample the lining merges with the hair
  const tO=Math.min(1,Math.max(0,(1-b.tbo)/0.81));
  if(tO>0.02) L.push(`<path fill="#242851" filter="url(#softDraw)" opacity="${tO.toFixed(2)}" d="${poly([[-0.12,-0.70],[-0.30,-0.69],[-0.46,-0.64],[-0.52,-0.52],[-0.50,-0.38],[-0.40,-0.30],[-0.26,-0.28],[-0.22,-0.50]])}"/>`);
  P.__hole=mx([[0.45,-1.12],[0.18,-1.05],[-0.06,-0.79],[-0.21,-0.61],[-0.30,-0.44],[-0.37,-0.26],[-0.40,-0.10],[-0.39,0.30],[-0.40,0.50],[-0.40,0.80],[-0.40,1.10],[-0.30,1.25],[-0.20,1.45],[-0.20,2.80]],
                [[0.45,-1.12],[0.18,-1.05],[-0.02,-0.85],[-0.12,-0.66],[-0.21,-0.50],[-0.28,-0.30],[-0.34,-0.10],[-0.45,0.30],[-0.52,0.50],[-0.60,0.80],[-0.54,1.00],[-0.42,1.12],[-0.30,1.30],[-0.20,2.80]]);
 }
 /* 2b. THE FAR SIDE OF THE HOOD (pass 9). In sample frames 1..9 there is a band ~15 px
    wide behind the far edge of the face: #242851 (L 44) -- different from the face
    (#383756) and the cloak (#101128), bluer. The far temple also stays under this
    band: the face edge is cut DIAGONALLY from behind the far eye to the cheek
    (a bright rim along the line). Once the head turns to profile the band disappears
    from the bottom up: ~40% in frame 10, in frame 11 only above the temple (measured: the pixel count in the band
    box 354 -> 139 -> 64). Ours had no such element at all
    -- the right side of the face went straight out into the dark sky. */
 if(!P.hoodFront){
  const ch=b.edge, Rp=R;                                    // FOREHEAD ROOT NOSE_T NOSE_O MOUTH_ CHIN_O IY
  const gP=Math.min(1,Math.max(0,(b.tbo-0.33)/0.55));       // lower part: full at 3/4, 0 in frame 11 (frame 10: sample 139 px, ours was 204)
  const en=[0.33,0.47,0.36*gP,0.33*gP,0.38*gP,0.09*gP,0.06*gP];
  const outerPts=ch.map((p,i)=>[p[0]+en[i]*Rp, p[1]]);
  const innerPts=ch.slice().reverse().map(p=>[p[0]-0.25*Rp, p[1]]);
  const tp=[ch[0][0]+0.10*Rp, ch[0][1]-0.30*Rp];            // at the top, under the hair
  /* pass 11: the band is hanging hair strands; in sample frames 7..11 the SKY shows
     between them (band probe: ours had +12..35% more L 30..55 pixels).
     P.__band=[g0,g1] -- a slit at the g0..g1 share of the band width (0 on the face side),
     full below the eye line, closing toward the top. The slit width is fitted in every
     frame to the band probe (test/band-fit.py). */
  const tq=P.__band;
  if(tq && tq[1]>tq[0]+0.005){
   const w=[0,0.3,1,1,1,1,1], ga=en.map((e,i)=>e*(tq[0]*w[i]+(1-w[i]))), gb=en.map((e,i)=>e*(tq[1]*w[i]+(1-w[i])));
   const A=ch.map((p,i)=>[p[0]+ga[i]*Rp, p[1]]), B=ch.map((p,i)=>[p[0]+gb[i]*Rp, p[1]]);
   L.push(`<path fill="#242851" d="M ${XY(tp)} L ${A.map(XY).join(' L ')} L ${innerPts.map(XY).join(' L ')} Z"/>`);
   L.push(`<path fill="#242851" d="M ${B.map(XY).join(' L ')} L ${outerPts.slice().reverse().map(XY).join(' L ')} Z"/>`);
  } else
  L.push(`<path fill="#242851" d="M ${XY(tp)} L ${outerPts.map(XY).join(' L ')} L ${innerPts.map(XY).join(' L ')} Z"/>`);
 }

 /* 3. FACE -- in shot 1 inside the hood opening (clip, pass 9) */
 const holeClip=!P.hoodFront;
 if(holeClip){ const U=(x,y)=>XY(K(x*R,y*R));
  const T=P.__hole; let d=`M ${U(1.2,-1.55)} L ${U(...T[0])}`;
  for(let i=1;i<T.length-1;i++) d+=` Q ${U(...T[i])} ${U((T[i][0]+T[i+1][0])/2,(T[i][1]+T[i+1][1])/2)}`;
  L.push(`<clipPath id="${idp}tk"><path d="${d} L ${U(...T[T.length-1])} L ${U(3.2,2.8)} L ${U(3.2,-1.55)} Z"/></clipPath>`);
  L.push(`<g clip-path="url(#${idp}tk)">`); }
 L.push(`<path class="skin" d="${b.silhouette}"/>`);
 /* shadow: following the form -- from the forehead to the cheek, then under the jaw */
 /* shadow only in the BACK third: it used to cover two thirds of the face
    and made the face muddy */
 /* pass 8: THE MASK WAS REMOVED. There used to be two shadow shapes here drawn for the
    profile (back shadow, middle band). When the face moved to 3/4 the back shadow
    covered the near jaw and made a diagonal boundary across the face -- the MASK EDGE;
    the softening of pass 6 did not hide it at film size (it showed at 5x).
    In the sample the middle of the face is FLAT (L 60..75); the form comes from the
    RIM LIGHT line (below). */
 /* SOFT GRADIENT. An airbrush layer over flat cel -- this is exactly how anime is
    done. The measurement said: the target head uses 39/64 tone buckets, ours
    (at the same size) 24/64. The flat bands stay; tone is brushed over them. */
 L.push(`<clipPath id="${idp}cy"><path d="${b.silhouette}"/></clipPath>`);
 /* (the far cheek shadow was removed: in the sample the far edge is not DARK -- it has
    a BRIGHT line, from the bright snow behind) */
 /* BACK RIM LIGHT LINE (pass 8, 8x measurement): in the sample a ~1 px (at 320) bright line
    along the far edge of the face and under the jaw -- from the bright snow background.
    Beside the cheekbone the base tone (L 66), on the cheek/chin L 95..113; along the jaw
    brightest at the chin (L 106..114), fading to the base toward the jaw corner. */
 { const Ai=b.points.ROOT, Bi=b.points.IY, Ci=b.points.JAW;
  /* pass 9: the line starts at the cut (behind the far eye). In sample frame 1,
     L along the edge: cut 97..115, cheek (y 61..71) NONE (54..56), nose tip
     63..89, lips 81..92, front of the chin upper 92..109, lower 64..79, chin
     corner and under the jaw 86..114, fading along the jaw up to x~104. */
  const st=(a)=>a.map(([o,op,c])=>`<stop offset="${o}" stop-color="${c||'#7a7eb0'}" stop-opacity="${op}"/>`).join('');
  L.push(`<linearGradient id="${idp}rc" gradientUnits="userSpaceOnUse" x1="${f(Ai[0])}" y1="${f(Ai[1])}" x2="${f(Bi[0])}" y2="${f(Bi[1])}">`
   + st([[0,0.9,'#8a8ec2'],[0.13,0.9,'#8a8ec2'],[0.17,0],[0.33,0],[0.40,0.6],[0.52,0.6],[0.60,0.7],[0.66,0.95,'#8a8ec2'],[0.77,0.95,'#8a8ec2'],[0.84,0.5],[0.95,0.5],[1,1,'#8a8ec2']]) + `</linearGradient>`);
  L.push(`<linearGradient id="${idp}rj" gradientUnits="userSpaceOnUse" x1="${f(Bi[0])}" y1="${f(Bi[1])}" x2="${f(Ci[0])}" y2="${f(Ci[1])}">`
   + st([[0,1,'#8a8ec2'],[0.35,0.7],[0.55,0]]) + `</linearGradient>`);
  /* the line is INSIDE THE FACE: centred on the edge, half of it fell on the background
     and it looked dim (5x). With the face clip, twice as thick -> the inner half. */
  L.push(`<g clip-path="url(#${idp}cy)">`
   + `<path fill="none" stroke="url(#${idp}rc)" stroke-width="${f(0.070*R)}" stroke-linecap="round" d="${b.edgePath}"/>`
   + `<path fill="none" stroke="url(#${idp}rj)" stroke-width="${f(0.070*R)}" stroke-linecap="round" d="${b.jawPath}"/></g>`);
 }
 /* FAR TEMPLE LINE (pass 9). In sample frames 1..8, above the far eye,
    on the boundary of the face and the hood band, a vertical dark path ~5 px wide (L 20-35,
    x 115..121, y 33..45) -- at the bottom it joins the far eye. It is in frame 11 too
    (x 133..134, y 48..58, L 14..37). Inside the face, along the edge. */
 if(!P.hoodFront){ const [pA,pB]=[b.edge[0],b.edge[1]];
  L.push(`<g clip-path="url(#${idp}cy)"><path fill="none" stroke="#15162e" stroke-width="${f(0.13*R)}" stroke-linecap="round" filter="url(#softDraw)" d="M ${XY([pA[0],pA[1]-0.30*R])} L ${XY(pA)} L ${XY([pB[0],pB[1]+0.01*R])}"/></g>`); }   // 12x: in the sample the path joins the eye (L<30 one vertical mass, 19..22 px)
 /* HOOD SHADOW ON THE FACE (shot 3 only). Measurement: in the sample's shot 3 the area
    at face tone (L 55..90) is ~4.3%, ours 10.5% -- our face was fully lit
    while being inside the hood. */
 if(P.hoodFront && P.__faceShadow) L.push(`<rect x="${f(cx-2.4*R)}" y="${f(cy-2.4*R)}" width="${f(4.8*R)}" height="${f(4.8*R)}"`
      + ` fill="#0a0b1c" opacity="${P.__faceShadow.toFixed(2)}" clip-path="url(#${idp}cy)"/>`);

 /* 4. NOSE and MOUTH -- two keys: in profile the nose is a line on the edge, at 3/4
    a small hook INSIDE the face; the mouth in profile is near the front edge, at 3/4 in the middle. */
 { /* pass 9: the NOSE is not drawn inside. On the sample's 3/4 face the nose tip is
     a 1.5 px bump ON THE EDGE (NOSE_O in the silhouette) plus the rim light; inside the face
     L 58..60, flat. In frame 11 the edge is vertical, no bump either. The earlier "("
     hook and the small line at 3/4 were removed.
     MOUTH: in sample frame 1 a thin (1 px), dim (L 37..47), almost straight
     line, 10 px, rising slightly to the right and touching the edge; below its right
     end a small dark diagonal (L 23) -- the lower lip shadow. In frame 11
     13 px, its right half OPEN (a dark gap ~6x3 px). */
  const [oL,oM,oR]=b.mouth, [s1,s2]=b.lipShadow;
  const qc=[2*oM[0]-(oL[0]+oR[0])/2, 2*oM[1]-(oL[1]+oR[1])/2];
  L.push(`<path fill="none" stroke="#24253f" stroke-width="${f(0.022*R)}" stroke-linecap="round" d="M ${XY(oL)} Q ${XY(qc)} ${XY(oR)}"/>`);
  L.push(`<path fill="none" stroke="#141528" stroke-width="${f(0.034*R)}" stroke-linecap="round" opacity="0.9" d="M ${XY(s1)} L ${XY(s2)}"/>`);
  const lip=P.__lip||0;
  if(lip>0.02){ /* open lips: from the right end leftward, ~45% of the mouth length */
   const t0=0.55, pA=[oL[0]+(oR[0]-oL[0])*t0, oL[1]+(oR[1]-oL[1])*t0], hh=0.075*R*lip;
   L.push(`<path fill="#0f1029" d="M ${XY(pA)} Q ${XY([(pA[0]+oR[0])/2, (pA[1]+oR[1])/2+hh*1.3])} ${XY([oR[0],oR[1]+hh*0.5])} L ${XY(oR)} Q ${XY([(pA[0]+oR[0])/2,(pA[1]+oR[1])/2-hh*0.2])} ${XY(pA)} Z"/>`);
  }
 }

 /* 5. EYES -- the far eye smaller and close to the face edge */
 const open=P.eyeOpenness===undefined?1:P.eyeOpenness;
 /* THE EYES ARE LARGE and APART. They used to be at 0.20 and 0.72, and since the turn squeezed x
    to 0.78 they stuck together on screen. In anime an eye is
    a quarter of the face width, with one eye width between them. */
 /* IN PROFILE THE FAR EYE IS NOT VISIBLE. The target has one eye, not two --
    a natural result of the turn, and drawing both makes the face look as if it
    faces forward. */
 /* pass 6: the eyes come from the blend of keys in build() -- both eyes at 3/4,
    one in profile; the far eye foreshortens (sx) and fades in (ko). */
 const H3=(P.__hair3 && !P.__hair3.absent) ? hair3(Ks,R,P.__hair3,idp) : null;
 if(H3) L.push(H3.shadow);                 // pass 11: the forehead shadow UNDER the eyes
 /* for the fitting model: a full layer in the shadow colour exactly where the shadow goes -- the look of "eyes on top of
    the shadow" (test/hair3-fit.py). Restoring the eye pixels from the background was inexact:
    the dim lid line above the eye was restored too, and a bright line was left inside the shadow
    in the brow zone -- model 0.62, render 0.78 (frame 1). */
 if(P.__shadowTest) L.push(`<rect x="-4000" y="-4000" width="9000" height="9000" fill="${P.__shadowTest}"/>`);
 if(!P.__noEyes) for(const k of b.eyes) L.push(eye(b.Kf,R,k.u,b.kz,open,k.s,idp+k.id,k.sx,k.ko,k.id==='u'?-1:1));
 /* TEAR (P.__tear = 0..1, not drawn when absent). The sample's shot 1:
    it appears under the near eye in frame 6, runs down the cheek and in frame 11
    reaches lip/chin level. In face coordinates -- it moves with the
    turn. A drop + a thin wet trail behind it. */
 if(P.__tear!==undefined && P.__tear!==null){
  /* in the sample the tear is 11, 28, 30, 35 px below the eye (frames 6, 9, 10, 11):
     fast at first, slowing as it nears the jaw -- 1-(1-t)^1.7 */
  const k0=b.eyes[0], g=1-Math.pow(1-Math.min(1,Math.max(0,P.__tear)),1.7);
  const fpath=t=>[k0.u+0.02+0.10*t, b.kz+0.26+0.57*t];          // pass 9: in frame 6 of the sample 11 px below the eye (ours was 7); end ~0.83R
  const [tx,ty]=fpath(g), [sx0,sy0]=fpath(0);
  const T=b.Kf(tx*R,ty*R), S0=b.Kf(sx0*R,sy0*R), rr=0.040*R;
  /* trail: only behind the drop, SHORT and dim (in the sample a short bright line; a long line
     along the whole path looked like a scratch) */
  /* pass 9: in the sample the wet trail shows FROM THE EYE to the drop (frames 6, 9: L 90..120
     on the flat face at L 58) -- the earlier short dim trail did not show at 5x. */
  /* ...but a full line from the eye to the drop looked scratched at 4x:
     in the sample the trail is ~15 px above the drop (0.36R), fading toward the top. */
  { const tt=Math.max(0,g-0.36/0.57), [ax,ay]=fpath(tt), gid=`${idp}yz`;
   const A0=b.Kf(ax*R,ay*R), A1=b.Kf((tx-0.004)*R,(ty-0.05)*R);
   L.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(A0[0])}" y1="${f(A0[1])}" x2="${f(A1[0])}" y2="${f(A1[1])}"><stop offset="0" stop-color="#9ea2d2" stop-opacity="0"/><stop offset="1" stop-color="#9ea2d2" stop-opacity="0.55"/></linearGradient>`);
   L.push(`<path fill="none" stroke="url(#${gid})" stroke-width="${f(0.020*R)}" stroke-linecap="round" d="M ${XY(A0)} L ${XY(A1)}"/>`); }
  /* pass 9: in the sample the drop is elongated and dimmer: L 100..124 in frame 6,
     brightest L ~165 in frame 11 (ours was ~190 and round) */
  L.push(`<path fill="#9a9ed2" d="M ${f(T[0])} ${f(T[1]-rr*2.4)} Q ${f(T[0]+rr*0.95)} ${f(T[1]-rr*0.1)} ${f(T[0])} ${f(T[1]+rr)} Q ${f(T[0]-rr*0.95)} ${f(T[1]-rr*0.1)} ${f(T[0])} ${f(T[1]-rr*2.4)} Z"/>`);
  L.push(`<ellipse cx="${f(T[0]-rr*0.25)}" cy="${f(T[1]-rr*0.1)}" rx="${f(rr*0.26)}" ry="${f(rr*0.45)}" fill="#c9cdf0"/>`);
 }
 /* THE EYE must sit BEHIND THE ROOT OF THE NOSE. At 0.02 it was at the head centre
    -- in profile that is a spot near the ear. The profile boundary is at 0.86..1.045,
    i.e. the eye is around 0.50. */


 /* 6. SILHOUETTE INK -- BEFORE THE HAIR. Until pass 3 it was drawn after the hair,
    and since the silhouette also includes the skull arc it drew
    a dark ring over the hair (a helmet rim). Now the hair covers
    the head part, while the profile (nose, lip, chin) keeps its line. */
 L.push(`<path class="ing" stroke-width="${f(0.016*R)}" d="${b.silhouette}"/>`);

 /* 7. HAIR -- strands, crossing the forehead */
 let S2=null;
 { /* eye zones in hair units: face x -> hair x = x*sq/sqs. The far eye zone
      reaches the edge (pass 9: in the sample there is no bright strand above the far eye). */
  const zone=b.eyes.map(k=>{const w=0.24*k.s*(k.id==='u'?0.80:k.sx); return [(k.u-w)*sq/sqs,(k.u+w*(k.id==='u'?1.6:1))*sq/sqs];});
  /* pass 11: when P.__hairP is set (shot 1) -- hair2 with large strands, its parameters
     from sheet.mjs HAIR_P (test/hair-fit.py fits them to the sample masks) */
  if(P.__hair3){ /* hair3: drawn OUTSIDE the opening clip (below) */ }
  else if(P.__hairP){ S2=hair2(Ks,R,b.kz,P.__hairP,idp,zone); L.push(S2.inner); }
  else L.push(hair(Ks,R,b.kz,P.hairSeed||2749,idp,P.__t||0,P.__sway||0,zone,P.__hairLag||0)); }
 if(holeClip) L.push(`</g>`);
 if(S2) L.push(S2.outer);                 // near-side mass outside the opening clip
 if(H3) L.push(H3.upper);                // pass 11: mass + strands (over the eyes)

 /* 8. LARGE HOOD IN FRONT (shot 3 only, P.hoodFront). In the sample's shot 3
    the camera looks at the hood from the side: a large dark mass fills the middle-left
    of the frame from top to bottom, the head is tilted inside it, the face
    sticks out of the opening down and to the right, the hair from under the hood brim.
    The darkening of shot 3 in the sample (-7%) comes from this mass growing --
    not from dimming the whole frame (the measurement showed that).
    evenodd: the outer shape minus the face opening. Everything turns with the head. */
 if(G3){
  L.push(`<clipPath id="${idp}hoodFront"><path id="${idp}hoodFrontP" d="${noHood?'M 0 0 Z':_d(G3.outer)}"/></clipPath>`);
  if(!noHood){
   L.push(`<path class="hoodI" d="${_d(G3.wedge)}"/>`);                      // wedge (inside of the hood) OVER the head
   if(G3.band) L.push(`<path fill="#242851" d="${_d(G3.band)}"/>`);     // UNDER the brim (lining), OVER the hair
   L.push(`<path class="hoodT" d="${_d(G3.outer)}"/>`); }
  if(P.__hoodDbg) G3.dbg.forEach(([x,y,n])=>{P.__dbgL=(P.__dbgL||'')+`<circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="#ff3b3b"/><text x="${f(x+4)}" y="${f(y-3)}" font-size="9" fill="#ffd166">${n}</text>`;});
 }
 else if(P.hoodFront){
  /* attempt 1 was an evenodd opening -- the face was wrapped by the hood on every side,
     IN FRONT TOO, and looked like it was behind a porthole. In the sample the front is open:
     the hood covers only the top and the back, the face and hair stick out forward, into the
     sky. So there is no opening: the front edge starts at the brim tip above the forehead
     and goes down BEHIND the eye, BEHIND the cheek and the jaw. */
  const U=(x,y)=>XY(K(x*R,y*R));
  /* The dome does not turn RIGIDLY with the head: the hood hangs from the shoulders.
     In attempt 1 it turned fully with the tilt and ended up lying in the upper right
     of the frame; in the sample the peak is above the face and a bit to the left. So
     the dome points turn with only 25% of the tilt, while the front edge
     stays in the head frame so that it hugs the head. */
  const th=(-P.tilt*0.25)*Math.PI/180, ch=Math.cos(th), sh=Math.sin(th);
  /* the dome's own anchor: the boil measurement showed it -- in the sample's shot 3
     the blocks move 0.90 px/frame, ours 2.3-2.7: our hood sank rigidly
     together with the head. In the sample the large hood almost stays put, the head
     sinks INSIDE it. P.__hoodY -- the y of the dome centre (slower). */
  const hy=P.__hoodY??cy;
  const Uh=(x,y)=>{const X=x*0.85*R, Y=y*R; return XY([cx+X*ch-Y*sh, hy+X*sh+Y*ch]);};
  /* BRIM EXTENSION (P.__brim). Measurement: in the sample, during the sink, the bright
     hair area shrinks from 3.32% to 1.1% -- the head goes into the hood and
     the brim swallows the hair; ours was always ~1.5%. 0 = the earlier state, 1 = the brim
     has come down to the eye, negative = pulled back (more hair visible).
     The value for each frame is found by measuring with test/brim-tune.py. */
  const qb=P.__brim??0, Lp=(a,b)=>[a[0]+(b[0]-a[0])*qb, a[1]+(b[1]-a[1])*qb];
  /* OPENING WIDTH (P.__openness, pass 7): 0 = the opening behind the eye (shot 3),
     1 = behind the ear -- the side hair shows (the sample's shot 2: the head is seen
     with its left side hair down to the chin). */
  const oc=P.__openness??0;
  /* moving the front side (pass 7, from the figure map difference): in shot 2
     the brim above the head stuck out 1-4 blocks further right than the sample's, and lower down
     the front edge leaned forward from under the chin (in the sample it falls straight
     down from under the head). onx -- moves the front of the dome and the brim back; px -- moves the lower
     front edge under the head. */
  const onx=P.__hoodOnX??0, px=P.__hoodLow??0;
  const q1=(v=>[v[0]+onx,v[1]])(Lp([1.75,-1.45],[1.85,-0.75])), q2=(v=>[v[0]+onx*0.7,v[1]])(Lp([1.05,-0.95],[1.20,-0.25])),
        q3=Lp([0.45,-0.75],[0.60,-0.05]), q4=Lp([0.05,-0.55],[0.15,0.05]), q5=Lp([-0.55,-0.25],[-0.50,0.10]);
  const edge=` Q ${U(...q1)} ${U(...q2)}`                     // brim tip, above the forehead
   + ` Q ${U(...q3)} ${U(q4[0]-0.30*oc,q4[1]-0.10*oc)}`       // brim back over the crown
   + ` Q ${U(q5[0]-0.45*oc,q5[1])} ${U(-0.45-0.42*oc,0.35)}`  // behind the eye (or the ear)
   + ` Q ${U(-0.35-0.38*oc,0.95)} ${U(-0.10-0.30*oc,1.35)}`   // behind the jaw
   + ` Q ${U(0.25+px,1.90)} ${U(0.90+px,4.6)}`;
  /* the dome is lower: at -3.45R the peak was far above the frame and the hood
     outline was not visible. In the sample the peak touches the top edge of the frame and
     its round line shows at the upper left against the snow background. */
  const hoodD=`M ${Uh(-2.9,4.6)} L ${Uh(-2.8,0.7)} Q ${Uh(-2.7,-1.4)} ${Uh(-1.5,-1.95)}`
   + ` Q ${Uh(0.0+onx*0.5,-2.45)} ${Uh(1.2+onx,-1.75)}${edge} Z`;
  L.push(`<clipPath id="${idp}hoodFront"><path id="${idp}hoodFrontP" d="${hoodD}"/></clipPath>`);
  L.push(`<path class="hoodT" d="${hoodD}"/>`);
  /* pass 7: HOOD ANATOMY (from the sample's stretched dark maps):
     along a row, left to right -- shell -> DARK INNER band -> RIM (light) ->
     head. Inner band: a thick dark line INSIDE the hood along the opening edge
     (with the clip only its inner half is visible). Rim: a light band along
     the same edge. Sample tones: inner #010114..#05061d (L 8..13), rim L ~31..37. */
  /* attempt 1: a line of even thickness -- it read as a heavy OUTLINE around the face.
     In the sample the inner shadow is a WEDGE: narrow at the brim, wide at ear/face height,
     narrowing again at the jaw. The opening edge from the brim tip to the jaw is split into points that
     are pushed OUTWARD from the face centre by a varying width. The rim too is
     only on this part (it does not run down the cloak below the jaw). */
  const qS=(a,c,b,n)=>{const o=[];for(let k=0;k<=n;k++){const t=k/n,m=1-t;o.push([m*m*a[0]+2*m*t*c[0]+t*t*b[0], m*m*a[1]+2*m*t*c[1]+t*t*b[1]]);}return o;};
  const p4=[q4[0]-0.30*oc,q4[1]-0.10*oc], p5c=[q5[0]-0.45*oc,q5[1]], p6=[-0.45-0.42*oc,0.35], p7c=[-0.35-0.38*oc,0.95], p8=[-0.10-0.30*oc,1.35];
  const fpath=[...qS(q2,q3,p4,8), ...qS(p4,p5c,p6,8).slice(1), ...qS(p6,p7c,p8,8).slice(1)];
  const fc=[0.35,0.35], N=fpath.length-1;
  /* widest at FACE height (from the ear to the jaw, t~0.65) -- the sample map:
     in shot 2 the inner shadow is at y 45..80 (the face), the hood above it in a middle tone. */
  const inner=fpath.map(([x,y],k)=>{const t=k/N, w=0.04+0.58*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,1.6))),1.5);
    const dx=x-fc[0], dy=y-fc[1], l=Math.hypot(dx,dy)||1; return [x+w*dx/l, y+w*dy/l];});
  const innerD=`M ${fpath.map(v=>U(...v)).join(' L ')} L ${inner.slice().reverse().map(v=>U(...v)).join(' L ')} Z`;
  if(P.__hoodDbg){ const nm=['q1','q2','q3','p4','p5c','p6','p7c','p8'];
   [q1,q2,q3,p4,p5c,p6,p7c,p8].forEach((v,i)=>{const [x,y]=K(v[0]*R,v[1]*R); P.__dbgL=(P.__dbgL||'')+`<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="#ff3b3b"/><text x="${f(x+4)}" y="${f(y-3)}" font-size="9" fill="#ffd166">${nm[i]}</text>`;}); }
  L.push(`<g clip-path="url(#${idp}hoodFront)">`
   + `<path fill="#04051a" opacity="0.92" d="${innerD}"/>`
   + `<path fill="none" stroke="#1c1d3b" stroke-width="${f(0.16*R)}" stroke-linecap="round" stroke-linejoin="round" d="M ${fpath.map(v=>U(...v)).join(' L ')}"/>`
   + `</g>`);
 }
 /* (The old step 8 "front edge of the hood" was removed: at -30..52
    degrees it covered the front-top of the head, and its ink arc made the hair
    tips look like a crown. In the sample the front-top is open sky.) */
 if(P.__dbgL) L.push(P.__dbgL);
 return L.join('\n');
}
