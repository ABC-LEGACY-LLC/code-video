/* ===== POSE SHEET -- THE FULL 1.32 SECONDS, ALL THREE SHOTS =====

   Every number is measured FROM THE TARGET CLIP. The cut points were found at the peaks
   of the frame-to-frame difference (18.9 and 18.3, median 9.27), and the detector
   was calibrated by finding nothing in a sequence without cuts.

     shot 1  11 frames  0.66 s   SPEEDS UP    diff 0.336 -> 0.384 (+14%)
     shot 2   2 frames  0.12 s   CALMEST      diff 0.257 (the smallest in the clip)
     shot 3   9 frames  0.54 s   SLOWS DOWN   diff 0.348 -> 0.286 (-18%)
                                 and DARKENS  brightness 29.9 -> 27.4 (-8%)

   The speed-up is NOT from the eye blink: dropping the 10% of pixels that change most
   strengthens the trend from +14% to +31%, i.e. a local burst
   was hiding it. The slow-down is not from the darkening either -- it stays
   after normalising for contrast.

   The BUTTONs below are the values to choose. They are not invented;
   they are tuned by measuring our clip with EXACTLY THE SAME code APPLIED TO THE
   SAMPLE (test/rhythm.mjs). */
import {TEMPLATE} from './head.mjs';
import {readFileSync, existsSync} from 'fs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
/* TRACE TABLE (pass 5): an extra [dx,dy] on the head position for each frame (px,
   540x304). test/trace-tune.py finds it: it draws, measures the head (bright area) trace with the same
   code applied to the sample, adds the remaining difference, repeats.
   This is not the sample's DRAWING but its TIMING and SPACING -- technique. */
/* pass 12: y for 12..22 -- from where the visor touches the hair (test/contact-trace.py; the bright area centre
   loop made the head jump 27 px at 19->20 with the new hood), after 18 the head is held;
   x of frame 13 -- in the sample the bright area moves +0.6 px at 12->13 (ours was +2). */
const TRACES_F=(PERSONAJ_DIR + '/traces.json');
const IZ=existsSync(TRACES_F)?JSON.parse(readFileSync(TRACES_F,'utf8')):null;
const BRIM_F=(PERSONAJ_DIR + '/brim.json');
const BRIM=existsSync(BRIM_F)?JSON.parse(readFileSync(BRIM_F,'utf8')):null;   // shot 3, 9 values
/* pass 11: the hair of shot 1 -- in every frame test/hair3-fit.py fitted the hair3 mass to the sample's
   bright hair mask (polar shell, 12 degrees); the teeth and the ink are ours. */
const HAIR3_F=(PERSONAJ_DIR + '/hair3-fit.json');
const HAIR3=existsSync(HAIR3_F)?JSON.parse(readFileSync(HAIR3_F,'utf8')):null;
/* pass 12: the hood of shots 2 and 3 -- from the side and below (portrait2 hood3Geo). The brim, the lining band,
   the wedge and the upper-right corner are measured from the sample ON SCREEN (test/hood3-measure.py -> hood3-screen.json,
   smoothed with [1,2,1]/4 within the shot). */
const HOOD_SCREEN_F=(PERSONAJ_DIR + '/hood3-screen.json');
const HOOD_SCREEN=existsSync(HOOD_SCREEN_F)?JSON.parse(readFileSync(HOOD_SCREEN_F,'utf8')):null;
const hood3=k=>(HOOD_SCREEN&&HOOD_SCREEN[String(k)])?{screen:HOOD_SCREEN[String(k)]}:undefined;
/* a slit of sky in the band behind the far cheek -- test/band-fit.py (band probe count) */
const BAND_F=(PERSONAJ_DIR + '/band-fit.json');
const BAND=existsSync(BAND_F)?JSON.parse(readFileSync(BAND_F,'utf8')):null;

export const BUTTON = {
 /* These values are not CHOSEN, they are found by MEASURING: test/tune.mjs changes each one,
    draws the shot and measures it with exactly the same code applied to the sample,
    and keeps the closest. The error fell from 0.901 to 0.109. */
 p1: 3.20,   // shot 1 acceleration power (>1 speeds up)
 a1: 1.90,   // shot 1 motion size
 p3: 0.55,   // shot 3 deceleration power (<1 slows down)
 a3: 1.00,   // shot 3 motion size (re-tuned)
 k12: 0.20,  // size of the 1->2 cut
 k23: 0.20,  // size of the 2->3 cut
 /* CUT COMPOSITION. The measurement said: in the sample a cut is 1.97x the
    frame-to-frame difference, while in ours the detector did not SEE it at all. The reason -- our
    "cut" was not a cut but a nudge of the camera: R 10% and an angle of 5
    degrees. A real cut changes the COMPOSITION, so every
    shot has its own placement and scale. */
 /* pass 5: the head was ENLARGED to fill the frame without a cloak
    (R 58 -> 108). Now the cloak provides the coverage and the head goes back to its own size.
    Target (bright area): shot 1 centre (0.32,0.22), area 3.0%;
    shot 2 (0.45,0.31) 4.3%; shot 3 (0.58,0.54) 1.7%. */
 j1:[176, 80,0.66],   // pass 6: 10% larger, from the face targets   // shot 1: cx, cy (540x304), scale
 J2:[240,122,0.72],   // shot 2: direct (not a blend)
 J3:[128, 84,0.86],   // (old, no longer used)
 /* frame 11 measured: in the sample it is NOT a full profile -- a closed eye (113,54),
    the smooth edge at x~140 lies 28 px in front of it, the far eye is under the hair. Relative to the hair mass
    the near eye moved +11 px in the turn -> for us du ~0.26R ->
    turn ~0.28. The eye line is almost horizontal at the end -> roll ~+4. */
 b1:[0.55,0.28],      // shot 1 turn: 3/4 -> deep 3/4
 e1:[-12,4],          // shot 1 roll: -12 (eye line slanted) -> +4
 e3:[-24,-40],        // shot 3 tilt: start -> end (degrees, - = down)
 j3y:[272,150,30,0.76],   // the scale was 0.92: the head was bigger than in the sample, the hood peak went out of the frame// shot 3 place: cx, start cy, cy growth (px, at 540x304), scale
 /* k12/k23 set what share of this full size is taken.
    At 1.00 the cut measured 3.53x, while in the sample it is 1.97x -- i.e. the
    composition jump was too strong. The value was chosen by measurement. */
 boilAmp: 2.0,   // shiver amplitude, px (540x304) -- found with test/boil-tune.py
 sway: 0.14,// hair sway, as a share of R -- the same loop
 faceShadow: 0.03, // hood shadow on the face in shot 3. Pass 12 (new hood) re-measured: sample face class (52..70) median L 59 in every frame (14..22); ours at 0.22 L 49 (fell into the lining class), at 0.08 56, at 0 60 -> 0.03. Face class IoU 0.19 -> 0.26 (the same over 0..0.14)
 black0: 0.00,// darkening at the start of shot 3
 black1: 0.00,// darkening at the end of shot 3
};

const mix=(a,b,t)=>a+(b-a)*t;
const place=(A,B,t)=>A.map((v,i)=>v+(B[i]-v)*t);
for(const k of ['p1','a1','p3','a3','k12','k23','black0','black1','boilAmp','sway','faceShadow'])
 if(process.env[k.toUpperCase()]!==undefined) BUTTON[k]=+process.env[k.toUpperCase()];

/* --- SHOT 1: 11 frames. The state follows u^p, i.e. the speed is u^(p-1) --
   each step is bigger than the last. The eye closes at 9..11 (measured). --- */
function frame1(T){
 /* SHOT 1, pass 6: what happens in the sample.
    frames 1..6: 3/4, looking up (the eye line slanted ~12 degrees clockwise
    -- roll -12). In frame 6 a tear appears under the near eye and
    runs down the cheek until frame 11. 7..11: the head turns to PROFILE (in the sample's
    head trace x speeds up after frame 7), the eye closes at 9..11.
    In profile, looking up becomes an in-plane rotation: roll +12.
    The old shot 1 (tilt and R acceleration with a1/p1) had no turn --
    so the sample's +14% speed-up did not come out in ours. */
 const N=11, o=[];
 for(let i=0;i<N;i++){
  const u=i/(N-1);
  /* the turn is measured: in the sample the near eye stays almost in place in frames 1..9
     ((95,46) (94,46) (97,45)), then JUMPS at 10 and 11 ((105,51) (111,54)) --
     a quick turn over two frames, with a little anticipation before it. */
  const g_=[0,0,0,0,0,0,0.03,0.08,0.15,0.55,1.0], g=g_[i];
  o.push({...TEMPLATE,
   turn: T.b1[0] + (T.b1[1]-T.b1[0])*g,
   tilt: T.e1[0] + (T.e1[1]-T.e1[0])*g,
   gaze: 1,
   R: 108,
   eyeOpenness: [1,1,1,1,1,1,1,1,0.9,0.08,0.04][i],     // sample: open at 9, closed at 10-11
   __tear: null,   // pass 9: the tears now come from the MEASURED per-frame table (EYE_TEARS, drawn by film.mjs)
   __lip: [0,0,0,0,0,0,0,0,0,0.5,1][i],          // sample frame 11: the lips are open
   /* (pass 9: hair lag -- pushing the tips back with the turn speed --
      was TRIED and REMOVED: the blocks of the sample's head area move WITH the head
      (+2,+2) at 10->11; in ours the lag raised the difference from 1.1 to 2.2 px.) */
   /* pass 9: in the sample frames 1..5 are a HELD drawing -- the median shift of the
      figure blocks is 0.00 px for every pair (1.4..3.2 at 6..11). Ours, since the hair
      swayed all the time, drifted 1.0..2.6 px on the held frames.
      Sway follows activity: almost none when held, full with the turn. */
   __swayK: [0.08,0.08,0.08,0.08,0.08,0.45,1,1,1,1,1][i],
   __hair3: (HAIR3&&HAIR3[String(i+1)])||null,
   __band: (BAND&&BAND[String(i+1)])||null,
   /* pass 10: the DARK COLUMN under the chin. In the sample at x 112..124, y 118..177
      L 7..9 (frames 1..8), left boundary x~109; in ours the front edge of the hood body (hoodT,
      L 19) reached cx+0.63R ~ 120 and covered the column (+11 L). */
   __hoodTFront: -0.29,
   __name:'shot-1', __place:T.j1});
 }
 return o;
}

function frame2(T){
 const b={...TEMPLATE,
  tilt: -9 + 3.2 + T.k12*4.6,
  /* the sample's shot 2: the face almost in profile, ONE eye, and it is CLOSED. The turn
     used to be 0.46 (>0.34 -> the second eye is drawn too) and the eyes open. */
  turn: 0.30,
  R: 108*(1 + T.k12*0.10),
  eyeOpenness: 0.12, __name:'shot-2', __place:T.J2,
  /* pass 7: in the sample's shot 2 the hood wraps the head FROM ABOVE (on the map
     there is hood above the head), the opening is wide -- the side hair shows down to the chin.
     The same hood model as in shot 3, with a wide opening. */
  hoodFront:true, __openness:1, __brim:-0.35, __faceShadow:0, __hoodOnX:-0.45, __hoodLow:-0.80, __hoodTFront:-0.70};
 return [{...b, __hood3:hood3(12)}, {...b, tilt:b.tilt+0.22, R:b.R*1.003, eyeOpenness:0.12, __hood3:hood3(13)}];
}

/* --- SHOT 3: 9 frames. Another cut, a closer shot. The motion is u^p (p<1) --
   the first step is large, the last small: it settles as if coming to rest on the floor. --- */
function frame3(T){
 /* shot 3, pass 3: a REAL different angle. Measured from the sample:
    the bright character centre (0.58, 0.54) -- in shot 1 (0.32, 0.22);
    within the shot it sinks: y 0.43 -> 0.55, slowing down.
    The head is tilted (looking down), the large hood in front (hoodFront).
    The old shot 3 was almost the same as shot 1 -- the cut measurement missed it,
    the side-by-side look caught it. */
 const N=9, o=[];
 for(let i=0;i<N;i++){
  const u=i/(N-1), s=Math.pow(u,T.p3);
  o.push({...TEMPLATE,
   tilt: T.e3[0] + (T.e3[1]-T.e3[0])*s*T.a3,
   turn: 0.26,
   R: 108,
   eyeOpenness: 0.45,
   hoodFront: true,
   __hoodY: T.j3y[1] + T.j3y[2]*s*T.a3*0.33,        // the dome moves with 1/3 of the head's sink
   /* SECONDARY ACTION (pass 6): the hair answers the head ONE FRAME LATE
      and settles. In the sample's shot 3 the head speed (px/frame, at 320):
      7.2 9.3 10.0 6.7 5.5 1.1 2.3 1.7 -- the pair difference falls smoothly with it
      (0.348 -> 0.286). Ours had constant sway, the difference flat and noisy. */
   __swayK: [0.72,0.72,0.93,1.0,0.67,0.55,0.11,0.23,0.17].map(v=>0.35+1.3*v)[i],
   __brim: (BRIM&&BRIM[i]!==undefined)?BRIM[i]:0,
   __faceShadow: T.faceShadow,
   __hood3: hood3(14+i),
   __name:'shot-3', __place:[T.j3y[0], T.j3y[1] + T.j3y[2]*s*T.a3, T.j3y[3]]});
 }
 return o;
}

export function collect(T=BUTTON){
 const V=[...frame1(T), ...frame2(T), ...frame3(T)].map((p,i)=>{
  const o=(IZ&&IZ[i])?IZ[i]:[0,0];
  const q={...p, __t:i, __sway:T.sway*(p.__swayK??1), __boilAmp:T.boilAmp, __place:[p.__place[0]+o[0], p.__place[1]+o[1], p.__place[2]]};
  if(q.__hoodY!==undefined) q.__hoodY+=o[1]*0.33;      // the hood moves with 1/3 of the head (in the sample it moves little)
  return q;});
 /* darkening: none in shots 1 and 2, in shot 3 it grows along the measured curve */
 const Q=V.map((v,i)=>{
  if(i<13) return 0;
  const u=(i-13)/8;
  return mix(T.black0, T.black1, u);
 });
 return {V, Q};
}

const _=collect();
export const SHEET=_.V;
export const BLACK=_.Q;
export const MS=60;
/* CLOAK -- from the figure map (test/figure.py, IoU 0.82 against the exact mask).
   In the sample the figure starts at the LEFT edge of the frame in EVERY shot; this is the right
   boundary, 18 rows, as a share of the frame width. In the head rows film.mjs does not let it
   pass the head centre -- otherwise a dark blot appears in front of the face. */
/* CLOAK INNER TONES -- from the mean image of shot 1, a 5x5 px map.
   The sample's cloak is almost flat (L 23..27, 25-95 percentile) -- the form comes not from BRIGHT
   folds but from DARK shadows (30% of the cloak is L<18).
   Coordinates as a share of the frame. */
export const CLOAK_TONE = {
 'shot-1':{base:'#101128',                       // the median of the sample's cloak (L 24)
  bright:[[[0.03,0.17],[0.20,0.17],[0.22,0.33],[0.19,0.50],[0.08,0.55],[0.02,0.45]]],   // side of the hood
  /* pass 6: the two shadows on the left were lens-shaped and read as
     "objects floating" on the cloak. A fold is a diagonal stretching down
     from the shoulder. (Their places from the same map: x 0..0.23, y 0.62..0.83.) */
  shadow:[[[-0.03,0.70],[0.15,0.58],[0.21,0.60],[0.05,0.98],[-0.03,1.03]],
        [[0.19,0.62],[0.25,0.63],[0.17,0.93],[0.12,0.90]],
        [[0.30,0.63],[0.46,0.63],[0.47,1.02],[0.33,1.02],[0.29,0.80]]],               // front-bottom: large shadow
  flange:0.20}};                                                                       // a light line on the edge down to this y
/* tones of shots 2 and 3 (pass 7) -- from the sample's stretched maps (mean
   image, 5 px blocks). In these shots the hood covers the cloak, so
   they are drawn AFTER the portrait, inside the (cloak + hood) clip (on top). */
CLOAK_TONE['shot-2']={base:'#101128', above:true, bright:[],
  shadow:[[[-0.02,-0.02],[0.12,-0.02],[0.07,0.30],[0.03,0.60],[-0.02,0.62]],   // left back edge
        [[0.30,0.60],[0.37,0.62],[0.12,0.99],[0.03,0.99]],                   // diagonal fold
        [[0.30,0.74],[0.44,0.72],[0.46,0.99],[0.33,0.99]]], flange:0};      // under the chin
CLOAK_TONE['shot-3']={base:'#101128', above:true, bright:[],
  shadow:[[[-0.02,-0.02],[0.24,-0.02],[0.18,0.30],[0.09,0.55],[-0.02,0.58]],   // back of the hood, deep shadow
        [[0.15,0.55],[0.20,0.56],[0.22,0.88],[0.17,0.90]],                   // vertical fold
        [[0.30,0.90],[0.52,0.88],[0.54,1.02],[0.30,1.02]]], flange:0};      // bottom
export const CLOAK = {
 'shot-1':[0.41,0.44,0.41,0.41,0.34,0.47,0.47,0.50,0.47,0.44,0.41,0.41,0.44,0.41,0.50,0.50,0.44,0.44],
 'shot-2':[0.53,0.53,0.53,0.56,0.56,0.56,0.59,0.56,0.56,0.53,0.53,0.50,0.47,0.47,0.50,0.44,0.44,0.47],
 'shot-3':[0.66,0.59,0.62,0.66,0.66,0.66,0.66,0.66,0.66,0.62,0.62,0.53,0.62,0.56,0.56,0.53,0.50,0.47]};
export const BOUNDARIES=[11,13];   // cut points (counting from 0: 10|11, 12|13)
/* HOLD (pass 10, compare motion): in the sample frames 1..6 are ONE drawing -- the rigid
   targets are identical to within 0.1 px, the pair motion in the face box is 0.00 (1-2..4-5).
   Ours drew every frame with its own shiver seed: motion 0.25..0.50,
   boil 1.25..1.50. On a held drawing the line does not shiver. Using a single seed
   (0) was not enough: the field of seed 0 moves all 6 frames THE SAME WAY -- the rigid targets
   0.7..1.1 px to the side, the mouth 1.2 px up (the head trace was tuned by measuring without shiver).
   So the held frames have no shiver -- their trace is the tuned geometry itself. */
export const HELD=[1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

/* ===== THE HAND AND THE TEAR ON THE JAW (pass 9, shot 1) =====
   Measured in every frame from the sample's figure map (snow occlusion, median5 L<26, the component
   connected to the body), 320x180 px:
     frames 1..6: the hand is RAISED -- the sleeve from the body (134,151) to the wrist
       (158,146), palm/fingers to the upper right, tip (173..175, 132..134);
     7: horizontal, tip (173,151); 9..11: wrist horizontal (y ~157), the palm
       HANGS down, fingers (158..172, 164..175).
   The hand drops as the eye closes -- the secondary action in the sample.
   The ring written up as a "pin" in the previous pass is actually the SECOND
   TEAR: in frame 6 a bright drop under the jaw (106,108), at 7..9 a ring hanging
   along the jaw (112..117.5, 109..112.5), at 10-11 it falls (123.5,133)
   (125.5,157). Ring line L 50..80, inside L 26..40, background L ~8. */
/* PASS 10: BODY EDGE + HAND -- compare/silhouette frame by frame (L<20, median 5,
   mask connected to the body, the same code on both sides). Found (IoU 0.70):
     - from under the chin to the hand the body edge in the sample is VERTICAL: x~131 (1..6), 134..146
       (7..11); ours ran diagonally along the 10 px rows of CLOAK (113 -> 140);
     - under the hand an armpit hollow (x~125), at 1..4 a slit under the hand where the sky
       shows (y 158..166) -- earlier read as a "bright cuff", it is actually background;
     - hand: a thick wrist + a hand pointing upper right (1..6), horizontal at 7, at 8..11
       a hanging sickle; inside L 8 (ours 16), NO bright edge (L 40..60 with the background).
   test/hand-fit.py: CLOAK_LOW -- the right edge of the body in every 3 px row (the end of the
   dark run from the left, bridging an inner band of <=6 px); HAND -- our "tongue"
   model (base B, half-width hB, tip T, top edge control U, bottom edge D),
   fitted to the residual. Model IoU (in the box): 1:0.89->0.92 2:0.89->0.94 3:0.88->0.95 4:0.86->0.95 5:0.77->0.92 6:0.75->0.94 7:0.85->0.91 8:0.80->0.88 9:0.77->0.89 10:0.75->0.84 11:0.78->0.86 */
export const CLOAK_LOW=[
 [[112,122],[115,122],[118,131],[121,130],[124,130],[127,130],[130,132],[133,131],[136,129],[139,127],[142,126],[145,125],[148,160],[151,159],[154,157],[157,154],[160,133],[163,142],[166,151],[169,149],[172,145],[175,141],[178,140],[179,139]],
 [[112,123],[115,124],[118,129],[121,130],[124,131],[127,132],[130,133],[133,132],[136,130],[139,129],[142,127],[145,126],[148,161],[151,159],[154,158],[157,156],[160,150],[163,137],[166,145],[169,145],[172,142],[175,138],[178,139],[179,139]],
 [[112,125],[115,126],[118,132],[121,131],[124,131],[127,132],[130,133],[133,133],[136,132],[139,130],[142,128],[145,125],[148,159],[151,159],[154,158],[157,157],[160,153],[163,146],[166,141],[169,141],[172,140],[175,139],[178,139],[179,139]],
 [[112,122],[115,125],[118,126],[121,129],[124,131],[127,132],[130,133],[133,133],[136,132],[139,129],[142,128],[145,126],[148,132],[151,158],[154,159],[157,158],[160,155],[163,152],[166,138],[169,137],[172,138],[175,138],[178,139],[179,140]],
 [[118,127],[121,130],[124,132],[127,134],[130,134],[133,133],[136,132],[139,130],[142,128],[145,126],[148,125],[151,134],[154,139],[157,159],[160,158],[163,155],[166,151],[169,145],[172,138],[175,139],[178,140],[179,140]],
 [[118,123],[121,132],[124,133],[127,133],[130,133],[133,133],[136,131],[139,130],[142,128],[145,127],[148,126],[151,131],[154,134],[157,138],[160,159],[163,158],[166,155],[169,152],[172,142],[175,139],[178,139],[179,139]],
 [[112,129],[115,131],[118,134],[121,135],[124,135],[127,135],[130,135],[133,134],[136,132],[139,130],[142,128],[145,126],[148,128],[151,152],[154,154],[157,169],[160,167],[163,165],[166,159],[169,139],[172,139],[175,139],[178,140],[179,140]],
 [[112,130],[115,132],[118,134],[121,136],[124,136],[127,136],[130,136],[133,134],[136,132],[139,130],[142,128],[145,127],[148,148],[151,152],[154,153],[157,135],[160,138],[163,141],[166,164],[169,161],[172,140],[175,140],[178,140],[179,140]],
 [[112,133],[115,134],[118,137],[121,138],[124,139],[127,138],[130,137],[133,135],[136,133],[139,130],[142,128],[145,128],[148,154],[151,154],[154,132],[157,134],[160,137],[163,140],[166,142],[169,147],[172,166],[175,140],[178,140],[179,140]],
 [[112,138],[115,139],[118,140],[121,142],[124,141],[127,141],[130,140],[133,138],[136,135],[139,133],[142,131],[145,129],[148,130],[151,145],[154,148],[157,152],[160,134],[163,136],[166,139],[169,142],[172,164],[175,161],[178,136],[179,136]],
 [[115,144],[118,145],[121,146],[124,146],[127,145],[130,144],[133,142],[136,141],[139,138],[142,135],[145,131],[148,130],[151,131],[154,137],[157,142],[160,143],[163,147],[166,149],[169,139],[172,141],[175,159],[178,157],[179,156]]];
/* the list of tongues for each frame: 1..7 -- one (wrist+hand), 8..11 -- a second one, the
   SICKLE under the wrist (in the sample it comes out of the body lower down and bends to the upper right,
   with background visible between it and the wrist) */
export const HAND=[
 [{B:[141,152.5],hB:7,T:[176,134.5],U:[163.5,131],D:[158,144.5]}],
 [{B:[150.5,152.5],hB:9,T:[176,131.5],U:[147,136.5],D:[148.5,141.5]}],
 [{B:[149,154.5],hB:9,T:[166,135.5],U:[154,130],D:[145.5,144]}],
 [{B:[150,159.5],hB:4.5,T:[171.5,135],U:[152.5,129],D:[157,135.5]}],
 [{B:[149,161.5],hB:6.5,T:[170.5,127],U:[147.5,157.5],D:[161.5,151.5]}],
 [{B:[134,169],hB:6.5,T:[170,130.5],U:[132,187],D:[162.5,164.5]}],
 [{B:[143.5,162],hB:5.5,T:[176,148],U:[156,160.5],D:[161.5,168.5]}],
 [{B:[140.5,153],hB:2.5,T:[149.5,162],U:[169.5,161.5],D:[157,165]},{B:[139.5,165.5],hB:2.5,T:[169,156],U:[162,176.5],D:[168.5,177.5]}],
 [{B:[134,150],hB:3.5,T:[157,152],U:[151.5,139],D:[181.5,165.5]},{B:[147,171.5],hB:5,T:[179,159],U:[135,185.5],D:[162.5,180.5]}],
 [{B:[142.5,157.5],hB:3.5,T:[153,158],U:[178.5,166.5],D:[159.5,169.5]},{B:[144.5,175],hB:5.5,T:[177.5,158.5],U:[158,176.5],D:[160,182]}],
 [{B:[142.5,178],hB:4,T:[153.5,175.5],U:[151.5,176],D:[140,208.5]},{B:[141.5,176.5],hB:2.5,T:[163,172],U:[145,177],D:[156.5,181.5]}]];
export const TEAR2=[null,null,null,null,null,
 null,   // frame 6: now the tip of tear 1 that has reached the jaw (EYE_TEARS)
 {c:[112,109.5],r:[3.8,4.5],t:'ring'},
 {c:[116,110.5],r:[4.5,4.2],t:'ring'},
 {c:[117.5,112.5],r:[3.5,3.5],t:'ring'},
 {c:[123.5,133],r:[3.5,5.0],t:'ring'},
 {c:[125.5,157],r:[3.5,4.0],t:'ring'}];

/* ===== TEARS (pass 9, compare frame-by-frame check) =====
   Not visible in the 5-frame sampling: the sample has TWO tears and one leftover
   drop. Small bright spots on the face (L>82, 3..80 px, surrounded by face)
   were found in every frame (320 px, centre, width x height):
     tear 1: 3 (91.8,75) 2x3 -> 4 (96.6,85.4) 7x11 -> 5 (100.6,94.9) 7x11 ->
             6 (103.4,102) 10x21 reaches the jaw -> 7..9 a ring hanging on the jaw ->
             10..11 falls. Shape: a LARGE transparent drop -- bright edge, inside slightly lighter
             than the face tone, pointed top, diagonal (from the upper left).
     leftover drop: 7 (100.8,89.2) 3x7 -> 8 (105.4,98.2) 2x3 -> 9 (108.5,100) 2x3
     tear 2: 5 (103.9,62.7) 2x6 -> 6 (104.5,64.5) 2x4 -> 7 (107.3,70) 3x7 ->
             8 (108.2,73.2) 3x6 -> 9 (109.5,73.8) 3x8 -> 10 (112.9,84.5) 3x7 ->
             11 (116.7,90.3) 4x9. Shape: a thin bright TRAIL (a drop-line).
   Our earlier tear started in frame 6 and was ~7 px tall; tear 1
   did not exist at all -- the drop on the jaw appeared out of nowhere. */
export const EYE_TEARS=[[],[],
 [{c:[91.8,75.0],w:2.5,h:4,t:'large'}],
 [{c:[96.6,85.6],w:5.5,h:9.5,t:'large'}],
 [{c:[100.4,94.6],w:5.8,h:10,t:'large'},{c:[103.9,62.7],w:2,h:6,t:'trail'}],
 [{c:[103.4,101.5],w:5,h:10,t:'large',trail:[97.5,88]},{c:[104.5,64.5],w:2,h:4.5,t:'trail'}],
 [{c:[100.8,89.2],w:2.5,h:6,t:'trail'},{c:[107.3,70.0],w:2.8,h:7,t:'trail'}],
 [{c:[105.4,98.2],w:2,h:3,t:'trail'},{c:[108.2,73.2],w:2.8,h:6,t:'trail'}],
 [{c:[108.5,100.0],w:2,h:3,t:'trail'},{c:[109.5,73.8],w:3,h:8,t:'trail'}],
 [{c:[112.9,84.5],w:3,h:7,t:'trail'}],
 [{c:[116.7,90.3],w:3.6,h:9,t:'trail'}]];

