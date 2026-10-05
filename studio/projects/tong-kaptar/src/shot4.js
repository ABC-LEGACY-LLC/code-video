// Tong · kaptar — shot 4: the boy steers the flock with the rag on the pole, whistling.
// A lens low behind him on the roof, looking up past his shoulder: his back and the long pole he
// swings round and round, the atlas rag drawing a circle in the sky the way the flock circles over
// the mahalla; then the circles die down, the pole held up still toward the flock, two fingers of
// his right hand to his mouth for one long whistle, and the flock turns for home and comes down, and
// he lowers the rag after it.
'use strict';

// t0: film time at the first frame (the flock's clock; after shot 3, an ellipsis)
const S4 = {
  t0: 14, dur: 4,
  pos: V3(0.2, -0.5, 0.1), yaw: (-10 * Math.PI) / 180, pitch: (24 * Math.PI) / 180, f: 720,
};
// As he whistles the flock home the lens closes in on him, 2.1 times, to his head and shoulders
// under the pole (a zoom about a point low right of him, which keeps his head 65 % across and 40 %
// down, and takes the sun, at (1172, 597), wholly out past the right edge: about (1072, 580) it
// ended as a half disc cut by the edge, the brightest thing in the frame), eased over f50..f94, at
// most 2.7 % a frame. Then the cut to shot 5, six seconds on, is a
// step from a close shot to the wide one (his size 1.58 times smaller), where it was a jump: the
// same boy, 1.33 times bigger, in the same place, in the next frame standing with his hands on his
// hips (measured, and read by a fresh eye as a skipped frame).
const PUSH4 = { t: [2.1, 3.9], k: 2.1, c: V(1010, 580) };
const cam4At = (t) => {
  const e = smooth(clamp((t - S4.t0 - PUSH4.t[0]) / (PUSH4.t[1] - PUSH4.t[0]), 0, 1)), k = Math.pow(PUSH4.k, e);
  return makeCam({ pos: S4.pos, yaw: S4.yaw, pitch: S4.pitch, f: S4.f * k, cx: PUSH4.c.x + k * (CAM.cx - PUSH4.c.x), cy: PUSH4.c.y + k * (CAM.cy - PUSH4.c.y) });
};
const map4 = (cam, d, t) => layerMap(cam, d, t, CAM1S);
// A row of shot 1's picture is a height in the sky; this lens looks up 24°, so a row is carried
// across through both lenses' tilt. (Shot 2's yFrom1 scales the row about the centre, which holds
// for a lens tilted as shot 1's: here it put the horizon's haze band at mid-sky, from 300 px down,
// half over the sun, a pale disc 1.03 times as bright as the sky round it, measured.)
const yFrom1At = (cam, y) => cam.projectDir(CAM1S.dirOf(CAM1S.cx, y)).y;
function drawSkyCam4(cam) {
  const g = ctx.createLinearGradient(0, yFrom1At(cam, -80), 0, yFrom1At(cam, 575));
  for (const [u, c] of SKY_STOPS) g.addColorStop(u, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function drawHazeCam4(cam) {
  const hz = ctx.createLinearGradient(0, yFrom1At(cam, 500), 0, yFrom1At(cam, 580));
  hz.addColorStop(0, 'rgba(255,200,165,0)');
  hz.addColorStop(1, 'rgba(255,196,160,0.5)');
  ctx.fillStyle = hz;
  const top = yFrom1At(cam, 480);
  ctx.fillRect(0, top, W, H - top);
}
function vgrad4(cam, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, yFrom1At(cam, y0), 0, yFrom1At(cam, y1));
  for (const [u, c] of stops) g.addColorStop(u, c);
  return g;
}

// ------------------------------------------------------------------ the pole
// The keeper's pole from shot 1's coop: a bamboo 3.2 m long, 3.4 cm across at the butt and 1.6 at
// the tip, the atlas rag tied along its top. He swings it round and round, the way keepers keep a
// flock up: the rag draws a circle in the sky and the flock goes round with it (a Damascus keeper's
// birds "kept going up in a circle in a perfect synchrony with the circle he was drawing with his
// sash", Syrian Heritage; New York keepers wave it "in wide, swooping arcs", Scouting NY). He works
// it the way a big flag is swung: the left hand high, at his head and out to his left, holds it and
// is the pivot, and the right fist on the butt drives it round below, beside and in front of his
// right hip, so the top goes round the other way, three times as far. To call the flock down he
// slows the circles until the pole stands still ("he calmed down his movement and his whistles
// signalled to the birds that play time is over"), lets go of the butt, the pole up in his left hand
// alone, and whistles with two fingers of his right hand in his mouth; then he takes the butt again
// and brings the rag down after the flock.
// (Before: one sweep of the pole across the sky and back, like a lever, with a hold at each end: a
// wiper, not a keeper. With the butt held still at his hip and the left hand at his shoulder steering
// it round, the left forearm and fist were behind his shoulder from the lens, and the arm read as a
// stump with a knob on the shoulder, and the pole went round without the hand on it seeming to carry
// it, measured by a fresh reviewer.)
const POLE = { len: 3.2, r0: 0.017, r1: 0.008, gripR: 0.14 };
// The pole's line in boy space, on a cone about a still point on it: aPhi, aBeta, the cone's axis
// (from upright toward his right; leaning forward); alpha, its half-angle; theta, where round it the
// pole is (0: the top to the right of the axis, pi/2 beyond it, pi to the left, 3pi/2 toward us:
// anticlockwise from above, the way the flock circles); CIRC.ecc squeezes the circle front to back
// (the butt swings out to the sides more than toward and away from him: swung as far toward him it
// went into his belly); q, the still point, sq metres up the pole from the butt (the left hand).
function coneFrame(aPhi, aBeta) {
  const A = n3(V3(Math.sin(aPhi) * Math.cos(aBeta), Math.cos(aPhi) * Math.cos(aBeta), Math.sin(aBeta)));
  const E1 = n3(s3(V3(1, 0, 0), m3(A, A.x)));
  return { A, E1, E2: cross3(E1, A) };
}
function pole4(P) {
  const { A, E1, E2 } = coneFrame(P.aPhi, P.aBeta);
  const off = a3(m3(E1, Math.cos(P.theta)), m3(E2, CIRC.ecc * Math.sin(P.theta)));
  const u = n3(a3(m3(A, Math.cos(P.alpha)), m3(off, Math.sin(P.alpha))));
  const butt = s3(P.q, m3(u, P.sq || 0)), fx = P.flex || V3(0, 0, 0);
  const at = (s) => a3(a3(butt, m3(u, s)), m3(fx, (s / POLE.len) ** 2));
  return { butt, u, handR: at(POLE.gripR), handL: at(POLE.gripR + P.span), tip: at(POLE.len), at };
}
// The circles, frames of the shot: one every CIRC.per frames, going on from before the shot opens,
// the first growing into the next ("the circle started getting bigger"), then slower and smaller
// until the pole stands still. theta in closed form: the rate eases from per to perEnd over slow.
// (res: what is left of it while he whistles, a slow drift of the rag, gone as he lowers it)
const CIRC = { ecc: 0.45, th0: -0.9, per: 24, slow: [30, 50], perEnd: 48, a0: 0.24, a1: 0.3, grow: [-4, 14], shrink: [30, 47], res: 0.03, resEnd: [76, 86] };
function circle4(f) {
  const w0 = TAU / CIRC.per, w1 = TAU / CIRC.perEnd, [f1, f2] = CIRC.slow, D = f2 - f1;
  const x = clamp((f - f1) / D, 0, 1);
  const theta = CIRC.th0 + w0 * f + (w1 - w0) * (D * (x ** 3 - x ** 4 / 2) + Math.max(0, f - f2));
  const w = w0 + (w1 - w0) * smooth(x);
  const s = sstep(CIRC.shrink[0], CIRC.shrink[1], f);
  const full = lerp(CIRC.a0, CIRC.a1, sstep(CIRC.grow[0], CIRC.grow[1], f)) * (1 - s);
  const alpha = full + CIRC.res * s * (1 - sstep(CIRC.resEnd[0], CIRC.resEnd[1], f));
  return { theta, alpha, k: full / CIRC.a1, w: w / w0 };
}
// The bamboo gives: swung round, its top trails the circle, bowed back against the way it goes by
// POLE_FLEX metres at the tip at the full circle (the rag's drag and its own weight on 3 m of cane),
// bent as the square of the way up it, so the hands' places on it hardly move.
let POLE_FLEX = 0.06;

// ------------------------------------------------------------------ the acting
// Frames of the shot (24 fps, on ones). `hold` keys ease in and out. The circles themselves are
// circle4's; the keys carry the slow part: where he holds the pole's circle and how he stands.
// lq: the left hand on the pole, the pivot, in his chest's frame (it goes with his back as he sways);
// aPhi, aBeta: the circle's axis, up and out to his left, toward the flock; span, the hands' distance
// on the pole; mouth: his right hand at his mouth (0 on the butt); hYaw, hPitch: on top of his eyes on
// the flock (see flockAim4); poleL: the left elbow's way.
const BOY4_KEYS = [
  { f: 0, root: V3(0.012, -0.008, 0), hipRoll: 0.04, lean: 0.03, bend: 0.05, twist: -0.16, shL: 0.035, shR: 0.0,
    hYaw: 0, hPitch: 0, hRoll: 0.02, aim: 0,
    lq: V3(-0.175, 0.374, 0.382), aPhi: -0.6, aBeta: 0.29, span: 0.72, mouth: 0,
    poleL: V3(-1, -0.8, 0.05) },
  { f: 30, aPhi: -0.62 },
  // the circles die down, the pole comes to lean out to his left toward the flock
  { f: 45, hold: true, root: V3(0.01, -0.004, 0), hipRoll: 0.03, twist: -0.12, bend: 0.03, lean: 0.0, aPhi: -0.6, aBeta: 0.26 },
  // the right hand off the butt and up to his mouth (a third of a second), round his right side
  { f: 55, hold: true, mouth: 1, shR: 0.02, lean: -0.02 },
  { f: 72, hold: true, mouth: 1 },
  { f: 82, hold: true, mouth: 0, shR: 0.0, lean: 0.01 },
  // and he brings the rag down out of the sky to his left, the way the flock is coming down
  { f: 89, root: V3(0.042, -0.026, 0), hipRoll: 0.085, twist: -0.16, bend: 0.06, lq: V3(-0.243, 0.226, 0.284), aPhi: -0.822, aBeta: 0.235, poleL: V3(-0.4, -1, -0.2) },
  { f: 93, root: V3(0.035, -0.012, 0), hipRoll: 0.07, twist: -0.18, bend: 0.07, lq: V3(-0.239, 0.236, 0.282), aPhi: -0.8, aBeta: 0.22 },
  { f: 95, hold: true, root: V3(0.035, -0.01, 0), hipRoll: 0.07, twist: -0.18, bend: 0.07, lq: V3(-0.239, 0.238, 0.282), aPhi: -0.805, aBeta: 0.223 },
];
(() => {
  // the other channels as shot 1's first drawing has them, then each key the previous one's
  const base = BOY_KEYS[0];
  for (const ch of Object.keys(base)) if (!(ch in BOY4_KEYS[0])) BOY4_KEYS[0][ch] = base[ch];
  for (let i = 1; i < BOY4_KEYS.length; i++) {
    const prev = BOY4_KEYS[i - 1], k = BOY4_KEYS[i];
    for (const ch of Object.keys(BOY4_KEYS[0])) if (ch !== 'f' && ch !== 'hold' && !(ch in k)) k[ch] = prev[ch];
  }
})();
// a hand round the pole at s metres from the butt, posed for this lens: the back of the hand to us,
// the knuckles across the near side of the pole and the fingers round behind it, so the pole goes
// in at one side of the fist and out at the other. (Palm against the pole's side and the fingers
// round it away from us, the fist sat 10..20 px beside the pole, the pole passing under the wrist:
// a mitten next to a stick.) The wrist 4.5 cm from the pole's middle, so it runs through the middle
// of the fist: at 3 cm it crossed the heel of the hand, 4..5 px off the fist's middle, and the fist
// stood up off the pole with the pole at its wrist.
function gripOn(pl, s, sg) {
  const q = pl.at(s), u = pl.u;
  let away = s3(q, BOY_CAM);
  away = n3(s3(away, m3(u, dot3(away, u))));          // across the pole, away from the lens
  let e2 = n3(cross3(u, away));                        // across the pole in the picture
  if (e2.x < 0) e2 = m3(e2, -1);                       // (toward his right)
  const hd = m3(e2, -sg);                              // the fingers across it toward his middle
  const w = a3(s3(q, m3(away, 0.024)), m3(e2, sg * 0.045));
  return { w, pn: away, hd, k: 1 };
}
// Two fingers in his mouth, the way a finger whistle is made: the tips under the tip of the tongue,
// in from the front to the first knuckle (Art of Manliness), the palm down, the other two fingers
// curled under the thumb. In the head frame: the wrist 20 cm in front of the head's pivot, below
// the lips, the hand pointing back into the mouth. From behind, all of it is in front of his face.
const MOUTH_R = { w: V3(0.085, -0.03, 0.175), hd: V3(-0.55, 0.2, -0.8), pn: V3(0.1, -1, -0.1) };
// Where the right elbow goes (boy space), frame by frame: the IK's pole is the way to it from the
// shoulder. Driving the butt round at his hip, out and back; up at his mouth, out beside his head
// (out in front of his shoulder, the lens behind him lost the whole arm while the hand was at his
// mouth, and he read one-armed); with the pole lowered, back.
// (one ease each way: with a place keyed halfway, the elbow stopped there and then rushed up 45 px
// a frame to his mouth. Going up the elbow leads the hand by a frame or two; coming down it follows
// it by one, the hand a little further out round his side: moved together, the elbow held still
// beside his head for two frames of the way down and then dropped 124 px in three, measured by a
// fresh reviewer; leading, it went in front of his shoulder for a frame. Now 13, 29, 40, 29, 13.)
const ELB_R4 = [[0, V3(0.26, 0.28, -0.12)], [44, V3(0.26, 0.28, -0.12)], [53, V3(0.52, 0.52, -0.12)],
  [73, V3(0.52, 0.52, -0.12)], [83, V3(0.26, 0.28, -0.12)], [89, V3(0.2, 0.33, -0.24)], [95, V3(0.2, 0.35, -0.25)]];
function elbowR4(f) {
  const K = ELB_R4;
  if (f <= K[0][0]) return K[0][1];
  for (let i = 0; i + 1 < K.length; i++) if (f <= K[i + 1][0]) return l3(K[i][1], K[i + 1][1], smooth((f - K[i][0]) / (K[i + 1][0] - K[i][0])));
  return K[K.length - 1][1];
}
// His eyes on the flock: yaw and pitch from his head to its middle, a tenth of a second behind it
// (boy space and the sky world share their axes)
function flockAim4(t) {
  const d = s3(s3(flockCentre(t - 0.1), BOY_ROOT), V3(0, 0.62, 0));
  return { yaw: Math.atan2(d.x, d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}
// Overlap: his hips go first, his back a frame after them, the arms and the pole on the beat, and
// his head last (frames: + ahead of the keys, - behind them).
let BOY4_LAG = { hips: 2, torso: 1, head: -2 };
// How the circles move him (at the full circle; frames of lag as above): the weight goes onto the
// leg away from the rag (root, hipRoll), the back turns and bends after it (twist, bend), leans in
// as it goes out beyond him (lean), the knees give once a round as he drives it over the far side,
// and the left shoulder rides up and down with the hand that steers.
let BOY4_SWAY = { rootX: 0.028, roll: 0.07, twist: 0.2, bend: 0.09, lean: 0.04, dip: 0.012, sh: 0.025, head: 0.06 };
// The whistle: one long blast (a keeper's whistle is "loud and very long"), from f56, the first
// birds' dive just after it. Before it he draws breath (his shoulders rise); on it his shoulders
// drop, he leans in and his head dips, over two frames, and he holds it for half a second while he
// blows, easing; then he lets go over four frames. (Two blasts, the second one frame at the top of
// its pump, and a first held for six frames: a twitch and a chirp, 42 ms, measured by a fresh
// reviewer; the hit in one frame dropped his whole back 8..9 px, the largest change in the shot.)
// len: the frames it is held.
const BOY4_BLASTS = [{ f: 57, len: 10 }];
// (a long blast lets go on an ease over four frames: dropped as the short one does, its first frame
// of letting go moved him as much as the hit, 15.5 grey levels on his outline against 5..8 round
// it, measured)
const blastHit = (x, L) => {
  if (x < -3) return 0;
  if (x < 0) return smooth((x + 3) / 3);
  const lev = L > 0 ? 1 - 0.25 * Math.min(1, x / L) : 1;
  if (x < L) return lev;
  if (L > 0) { const r = (x - L) / 4; return r < 1 ? lev * (1 - smooth(r)) : 0; }
  const r = x / 3.5;
  return r < 1 ? (1 - r) ** 2 : 0;
};
// (the breath before each, over a fifth of a second: snatched in two frames, it jerked him up and
// down between the blasts, f61..f63)
const blastIn = (x) => Math.exp(-(((x + 3) / 1.6) ** 2));
// (how far out of the straight line from his hip to his mouth the right hand goes, halfway: a little
// out round his side and forward of his shirt. Straight up the front, the elbow came in before his
// shoulder and the lens lost the whole arm for a frame on the way down, f76; 17 cm out, the arm
// swung out level to the side like a salute, f50..51)
let BOY4_ARC = V3(0.07, 0, 0.03);
function boyPose4(tc, t) {
  const f = (tc - S4.t0) * FPS;
  const P = keyAt(BOY4_KEYS, f);
  const Ph = keyAt(BOY4_KEYS, f + BOY4_LAG.hips), Pt = keyAt(BOY4_KEYS, f + BOY4_LAG.torso), Pd = keyAt(BOY4_KEYS, f + BOY4_LAG.head);
  P.root = Ph.root; P.hipRoll = Ph.hipRoll;
  P.twist = Pt.twist; P.bend = Pt.bend; P.lean = Pt.lean;
  P.hYaw = Pd.hYaw; P.hPitch = Pd.hPitch; P.hRoll = Pd.hRoll;
  // the circle, and the body with it
  const C = circle4(f), cH = circle4(f + BOY4_LAG.hips), cT = circle4(f + BOY4_LAG.torso), cD = circle4(f + BOY4_LAG.head), W = BOY4_SWAY;
  P.theta = C.theta; P.alpha = C.alpha;
  {
    const { E1, E2 } = coneFrame(P.aPhi, P.aBeta);
    const T = n3(a3(m3(E1, -Math.sin(C.theta)), m3(E2, CIRC.ecc * Math.cos(C.theta))));
    P.flex = m3(T, -POLE_FLEX * C.k * C.w);
  }
  const hx = cH.k * Math.cos(cH.theta), tx = cT.k * Math.cos(cT.theta), tz = cT.k * Math.sin(cT.theta);
  const sway = V3(-W.rootX * hx, -W.dip * cH.k * (0.5 + 0.5 * Math.sin(cH.theta)), 0);
  P.root = a3(P.root, sway);
  P.hipRoll += -W.roll * hx;
  P.twist += W.twist * tx; P.bend += -W.bend * tx; P.lean += W.lean * tz;
  P.shL += -W.sh * cT.k * Math.sin(cT.theta);
  // eyes on the flock, following the rag round a little
  const aim = flockAim4(t);
  P.hYaw += 1.15 * aim.yaw + W.head * cD.k * Math.cos(cD.theta);
  P.hPitch += 0.95 * aim.pitch + 0.05;
  let hit = 0, inh = 0;
  for (const b of BOY4_BLASTS) { hit += blastHit(f - b.f, b.len); inh += blastIn(f - b.f); }
  // (a blow, not a blow to him: leaning in 0.08 and dipping his head 0.11 over two frames, his whole
  // back dropped 8..9 px a frame and the pole's top jerked with the hand that holds it, measured by
  // a fresh reviewer)
  P.lean += 0.045 * hit - 0.025 * inh;
  P.shL += -0.022 * hit + 0.016 * inh; P.shR += -0.022 * hit + 0.016 * inh;
  P.hPitch += -0.07 * hit + 0.03 * inh;
  P.root = a3(P.root, V3(0, -0.012 * hit + 0.006 * inh, 0));
  const br = Math.sin((t * TAU) / 3.2);
  P.shL += 0.004 * br; P.shR += 0.004 * br;
  P.root = a3(P.root, V3(0, 0.0015 * br, 0));
  P.grip = 0; P.visor = 0; P.hipLock = 0; P.tmixL = 0; P.tmixR = 0;
  // The right hand's shapes: a fist on the pole, a loose open hand on its way to his mouth and back
  // (the fingers together and a little bent, the thumb along them), and at his mouth the whistle,
  // the first two fingers into it and the other two curled.
  const mh = clamp(P.mouth, 0, 1);
  const kWh = sstep(0.8, 0.94, mh), kOpen = sstep(0.04, 0.22, mh) * (1 - kWh), kFist = 1 - kOpen - kWh;
  const HAND_OPEN = [0.32, 0.32, 0.38, 0.44], HAND_WH = [0.22, 0.26, 0.82, 0.8];
  P.curlsR = HAND_OPEN.map((c, k) => 0.95 * kFist + c * kOpen + HAND_WH[k] * kWh);
  P.curlR = 0.95 - 0.5 * kOpen; P.curlL = 0.95;
  P.spreadR = 0.03 * kFist; P.spreadL = 0.03; P.thumbR = lerp(0.7, 0.25, kOpen); P.thumbL = 0.7;
  P.poleR = s3(elbowR4(f), V3(0.16, 0.47, 0));
  // (the pole jolts with him on each blast, a frame late and spread over two)
  let kick = 0;
  for (const b of BOY4_BLASTS) kick += Math.exp(-(((f - b.f - 1) / 1.1) ** 2));
  P.aBeta += -0.012 * kick;
  // (as his right hand lets go of the butt the pole's weight comes onto the left hand alone: the top
  // falls out a little before the hand catches it, and comes back a touch past where it was. Held
  // still through the change, 3.2 m of cane went from two hands to one without a tremor, measured
  // by a fresh reviewer.)
  P.aPhi += -0.03 * Math.exp(-(((f - 48) / 1.8) ** 2)) + 0.007 * Math.exp(-(((f - 53) / 2.2) ** 2));
  // the pivot is the left hand, where he holds it in his chest's frame: it goes with his back as he
  // sways, turns and dips
  P.sq = POLE.gripR + P.span;
  P.q = toP(spineFrames(P).chest, P.lq);
  const pl = pole4(P);
  P.pole = pl;
  // Fists round the pole (A.fist: the lines between the folded fingers), their thumbs round it: from
  // the heel of the hand away from the lens and on over the pole toward the fingers, so the lens
  // sees their root at the side of the fist. (Laid along the side of the palm as for an open hand,
  // each thumb stood out along the pole, a spike, and the fist read as a paddle.)
  const thumbRound = (g) => n3(s3(g.w, BOY_CAM));
  P.fistL = 1; P.tdirL = thumbRound(gripOn(pl, POLE.gripR + P.span, -1)); P.tmixL = 0.85;
  // (the right one a fist, lines and all, while it is on the pole; its thumb comes off the pole's
  // line smoothly as the hand opens. fistR -1: the hand at his mouth, which ARM_PARTS4 keeps behind
  // his head)
  P.fistR = mh < 0.1 ? 1 : mh > 0.6 ? -1 : 0; P.tdirR = thumbRound(gripOn(pl, POLE.gripR, 1)); P.tmixR = 0.85 * (1 - sstep(0.04, 0.22, mh));
  P.hold = (side, S, Hf) => {
    if (side === 'L') return gripOn(pl, POLE.gripR + P.span, -1);
    const g = gripOn(pl, POLE.gripR, 1), mk = clamp(P.mouth, 0, 1);
    if (mk <= 0) return g;
    const m = { w: toP(Hf.head, MOUTH_R.w), hd: dirP(Hf.head, n3(MOUTH_R.hd)), pn: dirP(Hf.head, n3(MOUTH_R.pn)) };
    // (on the way the open hand keeps its back to the lens, and turns palm down only as it gets to
    // his mouth, with the fingers)
    // (on an arc, BOY4_ARC: carried out in front of him, the elbow went forward with the hand and the
    // lens lost the whole arm behind his back for five frames, f72..f76)
    const arc = Math.sin(Math.PI * mk) * (f > 62 ? 1.4 : 1), wNow = a3(l3(g.w, m.w, mk), m3(BOY4_ARC, arc)), away = n3(s3(wNow, BOY_CAM));
    const pnT = l3(l3(g.pn, away, sstep(0, 0.2, mk)), m.pn, kWh);
    return { w: wNow, pn: pnT, hd: l3(g.hd, m.hd, mk), k: 1 };
  };
  return P;
}

// ------------------------------------------------------------------ the rag
// Shot 1's atlas rag on the pole's top: its hoist tied along the last 24 cm of the pole, the fly
// half a metre out. A cloth: a grid of points joined by stiff links (along, down and across) and
// weak ones two apart (so it bends and does not fold flat), pulled down by gravity and pushed by the
// air on each small triangle of it (the air's speed against the cloth across its face: that is what
// makes a flag stream and flap). The world's wind blows to his left; the pole's own swing is most of
// the air it meets. Run once from 1.5 s before the shot with the pole as he holds it then, at 8
// steps a frame, and every frame of the shot kept.
// (bend: the stiffness of the links two apart. At 0.12 the cloth crumpled into a ball as the swing
// to the right reversed, 37% of it lying over itself, and at the reversals it turned through 97..114
// degrees from one panel to the next (three frames): a claw, a blob. At 0.4 it folds in wider
// curves, 61 degrees at most, measured.)
// (wind: the breeze on the roof, metres a second at the world's full wind. At 2.4, held still up in
// one hand for the whistle, the rag lost the air of the swing and curled into hooks, crescents and
// a bow-tie for ten frames, then showed its edge; at 4.8 it flies there as a flag.)
const RAG = { w: 0.5, h: 0.24, nu: 10, nv: 5, sub: 8, pre: 1.5, mass: 0.1, bend: 0.4, wind: 4.8 };
let RAG_SIM = null;
const poleAtT = (t) => boyPose4(t, t).pole;
function ragSim() {
  if (RAG_SIM) return RAG_SIM;
  const { nu, nv, w, h, sub, pre } = RAG, dt = 1 / (FPS * sub), n1 = nv + 1, N = (nu + 1) * n1;
  const id = (i, j) => i * n1 + j;
  const pin = (pl, j) => pl.at(POLE.len - 0.015 - (j / nv) * h);
  const t0 = S4.t0 - pre;
  let pl = poleAtT(t0);
  const pos = [], prev = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = a3(pin(pl, j), V3(-(i / nu) * w, -0.02 * (i / nu), 0)); pos.push(p); prev.push(p); }
  const links = [];
  const link = (a, b, k) => links.push([a, b, len3(s3(pos[a], pos[b])), k]);
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    if (i < nu) link(id(i, j), id(i + 1, j), 1);
    if (j < nv) link(id(i, j), id(i, j + 1), 1);
    if (i < nu && j < nv) { link(id(i, j), id(i + 1, j + 1), 0.7); link(id(i + 1, j), id(i, j + 1), 0.7); }
    if (i + 2 <= nu) link(id(i, j), id(i + 2, j), RAG.bend);
    if (j + 2 <= nv) link(id(i, j), id(i, j + 2), RAG.bend);
  }
  const mP = RAG.mass * w * h / N;                   // kg a point (a light cotton: 100 g a square metre)
  const triA = (w * h) / (2 * nu * nv);
  const tris = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) tris.push([id(i, j), id(i + 1, j), id(i, j + 1)], [id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)]);
  const frames = [];
  const steps = Math.round((pre + S4.dur) * FPS * sub), first = Math.round(pre * FPS * sub);
  const acc = pos.map(() => V3(0, 0, 0));
  for (let k = 0; k <= steps; k++) {
    const t = t0 + k * dt;
    if (k >= first && (k - first) % sub === 0) frames.push(pos.map((p) => V3(p.x, p.y, p.z)));
    pl = poleAtT(t);
    const air = V3(-RAG.wind * windAt(t), 0.15, 0);
    for (let q = 0; q < N; q++) acc[q] = V3(0, -9.8, 0);
    for (const [a, b, c] of tris) {
      const nrm = cross3(s3(pos[b], pos[a]), s3(pos[c], pos[a])), nl = len3(nrm);
      if (nl < 1e-9) continue;
      const n = m3(nrm, 1 / nl);
      const v = m3(s3(a3(a3(s3(pos[a], prev[a]), s3(pos[b], prev[b])), s3(pos[c], prev[c])), V3(0, 0, 0)), 1 / (3 * dt));
      const rel = s3(air, v), vn = dot3(rel, n);
      // (pressure across the face, and a little drag along it)
      const F = a3(m3(n, 0.72 * triA * vn * Math.abs(vn)), m3(s3(rel, m3(n, vn)), 0.02 * triA * len3(rel)));
      const aF = m3(F, 1 / (3 * mP));
      for (const q of [a, b, c]) acc[q] = a3(acc[q], aF);
    }
    for (let q = 0; q < N; q++) {
      if (q % n1 === q && q < n1) continue;           // (the hoist is placed below)
      const p = pos[q], vel = s3(p, prev[q]);
      prev[q] = p;
      pos[q] = a3(a3(p, m3(vel, 0.985)), m3(acc[q], dt * dt));
    }
    for (let j = 0; j <= nv; j++) { const p = pin(pl, j); prev[id(0, j)] = pos[id(0, j)]; pos[id(0, j)] = p; }
    for (let it = 0; it < 6; it++) {
      for (const [a, b, rest, kk] of links) {
        const d = s3(pos[b], pos[a]), l = len3(d) || 1e-9, e = ((l - rest) / l) * 0.5 * kk;
        const pa = a < n1, pb = b < n1;
        if (!pa) pos[a] = a3(pos[a], m3(d, pb ? 2 * e : e));
        if (!pb) pos[b] = s3(pos[b], m3(d, pa ? 2 * e : e));
      }
    }
  }
  RAG_SIM = frames;
  return frames;
}
// the rag at frame i: its points projected, and a map (u, v) -> screen across it
function ragAt(i, t) {
  const F = ragSim()[i], { nu, nv } = RAG, n1 = nv + 1;
  const scr = F.map((p) => projB(p, t));
  const P = (u, v) => {
    const x = clamp(u, 0, 1) * nu, y = clamp(v, 0, 1) * nv, i0 = Math.min(nu - 1, Math.floor(x)), j0 = Math.min(nv - 1, Math.floor(y)), fx = x - i0, fy = y - j0;
    const a = scr[i0 * n1 + j0], b = scr[(i0 + 1) * n1 + j0], c = scr[i0 * n1 + j0 + 1], d = scr[(i0 + 1) * n1 + j0 + 1];
    return V(lerp(lerp(a.x, b.x, fx), lerp(c.x, d.x, fx), fy), lerp(lerp(a.y, b.y, fx), lerp(c.y, d.y, fx), fy));
  };
  return { F, scr, P };
}
// Shot 1's khan-atlas: a wine ground with the ikat's lozenges, each in one colour with another
// nested inside, their edges combed into teeth where the dyed threads bled; in the cloth's own
// (u along the fly, v down the hoist) coordinates
const RAG_LOZ = (() => {
  const out = [], COLS = [['#b8914e', '#3e4d85'], ['#d3c6cf', '#4c7a66'], ['#3e4d85', '#b8914e']];
  const lozenge = (uc, vc, du, dv, col, seed) => {
    const pts = [], M = 9;
    for (let k = 0; k <= M; k++) { const v = -1 + (2 * k) / M, ww = 1 - Math.abs(v), tooth = (k % 2 ? 1 : -0.4) * 0.35 * ww + 0.12 * Math.sin(seed + k * 1.7) * ww; pts.push([uc + du * (ww + tooth * 0.5), vc + dv * v]); }
    for (let k = M; k >= 0; k--) { const v = -1 + (2 * k) / M, ww = 1 - Math.abs(v), tooth = (k % 2 ? -0.4 : 1) * 0.35 * ww + 0.12 * Math.sin(seed * 2 + k * 1.3) * ww; pts.push([uc - du * (ww + tooth * 0.5), vc + dv * v]); }
    const us = pts.map((q) => q[0]), vs = pts.map((q) => q[1]);
    out.push({ pts, col, u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) });
  };
  [0.16, 0.46, 0.76].forEach((uc, ci) => {
    [[0.25, 0.3], [0.78, 0.3]].forEach(([vc, dv], ri) => {
      const [c1, c2] = COLS[(ci + ri) % 3];
      lozenge(uc, vc, 0.1, dv, c1, ci * 3 + ri);
      lozenge(uc, vc, 0.045, dv * 0.55, c2, ci * 5 + ri + 2);
    });
  });
  return out;
})();
// an old rag: its free end is frayed, as in shot 1 (u of the fly edge at v = k/10)
const RAG_FRAY = [...Array(11).keys()].map((k) => (k === 0 || k === 10 ? 1 : 1 - 0.045 * (0.5 + 0.5 * Math.sin(k * 2.7 + 1.3)) * (k % 2 ? 1 : 0.35)));
// a polygon in (u, v) cut to a rectangle (Sutherland-Hodgman)
function clipUV(pts, u0, u1, v0, v1) {
  const cut = (P, k, c, keep) => {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[k] - c), ib = keep(b[k] - c);
      if (ia) out.push(a);
      if (ia !== ib) { const s = (c - a[k]) / (b[k] - a[k]); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s)]); }
    }
    return out;
  };
  let P = cut(pts, 0, u0, (d) => d >= 0);
  if (P.length) P = cut(P, 0, u1, (d) => d <= 0);
  if (P.length) P = cut(P, 1, v0, (d) => d >= 0);
  if (P.length) P = cut(P, 1, v1, (d) => d <= 0);
  return P;
}
const RAG_GLOW = [255, 190, 140], RAG_DARK = [28, 16, 44];
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// a colour of the cloth as a panel of it is lit: the cloth is thin, and turned to the low sun ahead
// of him or away from it, it goes dark or glows through
function ragLit(hex, lit) {
  const c = hexRgb(hex), [g, k] = lit > 0 ? [RAG_GLOW, 0.34 * lit] : [RAG_DARK, 0.4 * -lit];
  return `rgb(${c.map((v, i) => Math.round(lerp(v, g[i], k))).join(',')})`;
}
// The rag is drawn panel by panel, far to near: where it folds over itself or wraps round the
// pole the near layer covers the far one, its pattern and its edge. (As one outline filled at once
// a fold crossed itself: the wrap after the right-hand swing drew as a knot with a stick out of
// it.) The pattern is cut to each panel in the cloth's own coordinates and laid on through that
// panel's own map, so a lozenge on a far layer never shows through a near one. Outline on the
// cloth's edges (thinner where the cloth is seen edge-on) and along a fold, where the cloth turns
// from showing its one face to the other.
function drawRag4(i, t, pole = null) {
  const { F, scr } = ragAt(i, t), { nu, nv } = RAG, n1 = nv + 1, camB = BOY_CAM;
  const G = (a, b) => scr[a * n1 + b];
  // the top and bottom edges as smooth curves (Catmull-Rom through the grid, three points a panel)
  const cr = (p0, p1, p2, p3, s) => {
    const s2 = s * s, s3v = s2 * s;
    const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3v);
    return V(f('x'), f('y'));
  };
  const edgeSeg = (b, a) => {
    const E = (k) => G(clamp(k, 0, nu), b);
    return [E(a), cr(E(a - 1), E(a), E(a + 1), E(a + 2), 1 / 3), cr(E(a - 1), E(a), E(a + 1), E(a + 2), 2 / 3), E(a + 1)];
  };
  const panels = [];
  for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) {
    const p00 = F[a * n1 + b], p10 = F[(a + 1) * n1 + b], p01 = F[a * n1 + b + 1], p11 = F[(a + 1) * n1 + b + 1];
    const n = n3(a3(cross3(s3(p10, p00), s3(p01, p00)), cross3(s3(p01, p11), s3(p10, p11))));
    const c = m3(a3(a3(p00, p10), a3(p01, p11)), 0.25), toCam = n3(s3(camB, c));
    const cosV = dot3(n, toCam), facing = cosV > 0 ? n : m3(n, -1);
    const q00 = G(a, b), q10 = G(a + 1, b), q01 = G(a, b + 1), q11 = G(a + 1, b + 1);
    const map = (u, v) => { const fx = u * nu - a, fy = v * nv - b; return V(lerp(lerp(q00.x, q10.x, fx), lerp(q01.x, q11.x, fx), fy), lerp(lerp(q00.y, q10.y, fx), lerp(q01.y, q11.y, fx), fy)); };
    const u0 = a / nu, u1 = (a + 1) / nu, v0 = b / nv, v1 = (b + 1) / nv;
    // (a panel's fill and its pattern reach a tenth of a panel over each side it shares with
    // another, the same cloth on both, so no seam of sky shows between panels; not over the rag's
    // own edges)
    const eL = a > 0 ? 0.1 / nu : 0, eR = a < nu - 1 ? 0.1 / nu : 0, eT = b > 0 ? 0.1 / nv : 0, eB = b < nv - 1 ? 0.1 / nv : 0;
    // the outline of the panel: its top (the rag's top edge if it is on it), its right side (the
    // frayed end on the last column), its bottom back
    const top = b === 0 ? edgeSeg(0, a) : [q00, q10];
    const fly = a === nu - 1 ? [0, 1, 2].map((k) => map(RAG_FRAY[2 * b + k], v0 + k / (2 * nv))) : null;
    const bot = b === nv - 1 ? edgeSeg(nv, a).reverse() : [q11, q01];
    const poly = top.concat(fly ? fly.slice(1) : [], fly ? bot.slice(1) : bot);
    const U0 = u0 - eL, U1 = u1 + eR, V0 = v0 - eT, V1 = v1 + eB;
    // (on the last column the right side is the frayed edge, carried on over the panels above and
    // below it)
    const uTR = fly ? RAG_FRAY[2 * b] : U1, uBR = fly ? RAG_FRAY[2 * b + 2] : U1;
    const topX = b === 0 ? [map(U0, 0)].concat(top, fly ? [] : [map(U1, 0)]) : [map(U0, V0), map(uTR, V0)];
    const botX = b === nv - 1 ? (fly ? [] : [map(U1, 1)]).concat(bot, [map(U0, 1)]) : [map(uBR, V1), map(U0, V1)];
    const polyX = topX.concat(fly || [], botX);
    panels.push({ a, b, d: len3(s3(c, camB)), side: Math.sign(cosV), open: Math.abs(cosV), lit: -dot3(facing, SUN_DIR), map, U0, U1, V0, V1, poly, polyX, top, bot, fly });
  }
  const order = panels.slice().sort((p, q) => q.d - p.d);
  const rank = new Map(order.map((p, k) => [p.a * n1 + p.b, k]));
  const at = (a, b) => panels[a * nv + b];
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  let poleDone = !pole;
  for (const P of order) {
    // (the pole goes in among the panels at its own depth: where the cloth wraps round its top, the
    // part of it in front of the pole covers it; drawn after the whole rag, the pole speared
    // through the cloth)
    if (!poleDone && P.d < pole.d) { pole.draw(); poleDone = true; }
    const path = polyPath(P.polyX);
    ctx.fillStyle = ragLit('#6e2a4e', P.lit);
    ctx.fill(path);
    ctx.save();
    ctx.clip(path);
    for (const L of RAG_LOZ) {
      if (L.u1 < P.U0 || L.u0 > P.U1 || L.v1 < P.V0 || L.v0 > P.V1) continue;
      const cutp = clipUV(L.pts, P.U0, P.U1, P.V0, P.V1);
      if (cutp.length < 3) continue;
      ctx.fillStyle = ragLit(L.col, P.lit);
      ctx.fill(polyPath(cutp.map((q) => P.map(q[0], q[1]))));
    }
    ctx.restore();
    // outline: the rag's own edges on this panel, and a fold along a side it shares with a panel
    // turned the other face to us that was drawn before it (the fold's near side is this one)
    const wEdge = lerp(1.0, 1.9, sstep(0.06, 0.4, P.open));
    ctx.strokeStyle = PAL.line;
    ctx.lineWidth = wEdge;
    if (P.b === 0) ctx.stroke(openPath(P.top));
    if (P.b === nv - 1) ctx.stroke(openPath(P.bot));
    if (P.fly) ctx.stroke(openPath(P.fly));
    ctx.lineWidth = 1.3;
    const me = rank.get(P.a * n1 + P.b);
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a2 = P.a + da, b2 = P.b + db;
      if (a2 < 0 || a2 >= nu || b2 < 0 || b2 >= nv) continue;
      const Q = at(a2, b2);
      if (Q.side === P.side || rank.get(a2 * n1 + b2) > me) continue;
      const e = da === 1 ? [G(P.a + 1, P.b), G(P.a + 1, P.b + 1)] : da === -1 ? [G(P.a, P.b), G(P.a, P.b + 1)] : db === 1 ? [G(P.a, P.b + 1), G(P.a + 1, P.b + 1)] : [G(P.a, P.b), G(P.a + 1, P.b)];
      ctx.stroke(openPath(e));
    }
  }
  ctx.restore();
  if (!poleDone) pole.draw();
  // the rim of low sun along the lit edges of the whole cloth (its outline is the panels' union)
  const all = panels.map((P) => ({ pts: P.poly, smooth: false }));
  rimOnly(unionPath(all), '#f3a384', 2.4, LIGHT, bboxOf(scr, 8));
}
const openPath = (pts) => { const p = new Path2D(); p.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) p.lineTo(pts[k].x, pts[k].y); return p; };
// the pole, drawn in the lens: a tapered bamboo with a node every 30 cm
function drawPole4(pl, t, ghost = false) {
  const n = 24, L = [], R = [];
  const q = (s) => projB(pl.at(s), t);
  for (let i = 0; i <= n; i++) {
    const s = (POLE.len * i) / n, a = q(Math.max(0, s - 0.05)), b = q(Math.min(POLE.len, s + 0.05)), c = q(s);
    const d = norm(sub(b, a)), nn = perp(d), w = (lerp(POLE.r0, POLE.r1, s / POLE.len) * pxPerM(c.z));
    L.push(add(c, mul(nn, w))); R.push(sub(c, mul(nn, w)));
  }
  const path = polyPath(L.concat(R.reverse()));
  if (ghost) { ctx.fillStyle = '#4a3d62'; ctx.fill(path); return; }
  fillRim(path, '#3a2d4f', '#f0b485', 1.6, LIGHT, bboxOf(L.concat(R), 4));
  ink(path, 1.2);
}

// Which parts of an arm the lens sees behind his body (drawn before it) and which over it: the
// forearm and hand when the hand is in front of his back; the upper arm when the elbow is in front
// of him and in within his width. An arm with only the first is drawn in two halves split at the
// elbow (see drawBoy). (By the hand alone, the whole arm: an arm hanging at his side with the hand
// at the front of his hip went behind him, and he read one-armed, a hand growing out of his hip;
// drawn over, a hand coming round his side lay on his back.) An arm wholly behind leaves its
// shoulder cap in his outline: capOut, 2 cm.
// (an elbow out at his side, past 16 cm from his spine, is beside his body, its upper arm drawn after
// the body; unless it is well in front of him, ARM4_ZFWD forward. There, as the right hand swung in
// front of his belly, the upper arm drawn after the body lay on his back, a cuff and a stub like a
// pocket, f14..15 and f41; and the raised left arm, drawn after his body until its elbow came in
// front of his face, lost its whole sleeve in one frame as it went across, f24 and f34. Drawn
// before the body, the arm goes behind his shoulder and head as far as it really is behind them.)
// (0.09 now: the left arm, up on the pole in front of his shoulder all through the shot, stays
// behind his body as its elbow comes back to 11 cm in front of him while he lowers the rag; at 0.15
// its sleeve came out over his shoulder in one frame, f84)
let ARM4_ZFWD = 0.09;
// (the whistling hand is at his mouth, on the far side of his head, however he leans: judged by the
// wrist's depth, his breath before each blast took it 3.4 cm back and the hand came out in front
// of his cheek for two frames, f59..60)
// (the right arm, on his far side from the lens, keeps its upper arm over his body out beside him a
// little further forward: coming down from his mouth its elbow passed 18 cm in front of him for one
// frame, and the upper arm went behind his back for that frame alone, f73)
let ARM4_ZFWD_R = 0.2;
const ARM_PARTS4 = (A) => ({ upper: A.E.z > 0.06 && (A.sg * A.E.x < 0.16 || A.E.z > (A.sg > 0 ? ARM4_ZFWD_R : ARM4_ZFWD)), fore: A.W.z > -0.03 || A.fist === -1 });
const ARM_FWD4 = (A) => { const p = ARM_PARTS4(A); return p.upper && p.fore; };
// (a split arm is drawn in its parts, forearm then upper arm, when its elbow's angle in the picture
// has a cosine over this; otherwise cut across the angle. The right arm always in its parts: its
// forearm goes in behind his body from the elbow, the hand in front of his belly, and cut across the
// angle the elbow's near half was a wedge with a straight edge on his back as the arm went in and
// came out, f14 and f41; and as he lowers the pole the elbow points at the lens, its angle in the
// picture swung from 0.35 to -0.73 and back in four frames and the drawing switched with it, f68..
// f73. The left forearm goes up in the open to the pole, and there one outline round the elbow is
// cleaner.)
let BOY4_FOLDCOS = { L: 0.38, R: -1.01 };
// (how far a forward arm's shoulder stands out of his outline, and the shirt dragged across his back
// by it: with the right arm hidden in front of him for 26 frames, a clean back and a 2 cm shoulder
// read as a boy with one arm, and at 3.5 cm still did to a fresh reviewer)
let BOY4_CAP = 0.05;
function renderShot4(i, only) {
  const t = S4.t0 + i / FPS;
  const tc = t;                                    // on ones
  const want = (k) => !only || only === k;
  const cam = cam4At(t);
  if (!FAR_REC) { FAR_REC = recorded(() => makeSkyline(5, 540, 14, 44, 26, 70, 0.35)); LANDMARK_REC = recorded(() => makeLandmark()); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (only) ctx.clearRect(0, 0, W, H);
  const sun = sunIn(cam, t);
  const Minf = map4(cam, 1e7, t);
  if (want('sky')) {
    drawSkyCam4(cam);
    // (the shafts at half strength: fanning up from a sun low at the corner behind him, they show
    // only where they leave the glow, above his head, and at full strength read as a halo on him)
    drawSunGlow(t, sunAt(t), Minf, true, 0.45);
    withMap(Minf, () => drawCirrus(t));
    for (const cl of CLOUDS) drawCloud(cloudIn(cl, t, Minf), t, sun);
    withMap(Minf, () => drawSunDisk(t));
    const farFill = vgrad4(cam, 470, 560, FAR_STOPS);
    withMap(Minf, () => drawFar(t, FAR_REC, LANDMARK_REC, false, farFill));
    drawHazeCam4(cam);
    const blockFill = vgrad4(cam, 510, 600, BLOCK_STOPS);
    withMap(map4(cam, 60, t), () => drawBlocks(t, BLOCKS, 1100, true, blockFill, 720));
  }
  // (no smear: at 20 px a frame a copy half a frame back sat half over its bird, a see-through twin)
  if (want('flock')) drawFlock(t, cam, { tailCup: 0.6, whiteFlash: 0.6, sun });
  if (want('hero')) drawHeroFlying(t, cam, 12, { tailCup: 0.6, sun });
  if (want('sky')) {
    withMap(map4(cam, 12, t), () => drawWires(t, false, false, 320, false));
    drawWiresCam(t, cam);
    withMap(map4(cam, 30, t), () => drawMahalla(t, 0));
    withMap(map4(cam, 16, t), () => drawMahalla(t, 1));
    withMap(map4(cam, 3.4, t), () => drawParapet(t));
  }
  if (want('coop')) {
    withMap(map4(cam, COOP_D, t), () => drawCoop(t, tc, false));
    // the coop's own three pigeons, on its roof as in shots 1, 2 and 5, in the round from this lens,
    // watching the flock go round over them (left out, they were gone for this shot alone and back
    // in the next, a cut's continuity broken both ways). The middle one turned a little from the
    // lens as in the shots either side, which see it from nearly the same side.
    drawPerched(t, tc, (b) => {
      const W0 = CAM1S.unproject(b.x, b.y, COOP_D);
      return { proj: (p) => cam.project(a3(W0, p)), camPos: s3(cam.pos, W0), yawOff: b === PERCHED[1] ? -0.6 : 0 };
    });
  }
  // (layers 'pole' and 'body': the pole alone and the boy alone, for measuring where one runs along
  // the other's edge)
  if (want('boy') || only === 'pole' || only === 'body') {
    setBoyView(cam);
    BOY_POSE = boyPose4;
    try {
      const P = boyPose4(tc, t);
      if (only === 'pole') { drawPole4(P.pole, t); return; }
      if (only === 'body') { drawBoy(t, tc, { noBird: true, forward: ARM_FWD4, forwardParts: ARM_PARTS4, capOut: BOY4_CAP, fold: true, foldCos: BOY4_FOLDCOS, reachFolds: true, plantFeet: true }); return; }
      // (the fastest swings move the pole's top 30 px a frame: drawn sharp it jumps from place to
      // place, so there it leaves faint copies of itself a quarter, half and three quarters of a
      // frame back, the way an animator draws multiples)
      const tip0 = projB(P.pole.tip, t), tipB = projB(boyPose4(tc - 1 / FPS, t).pole.tip, t);
      if (len(sub(tip0, tipB)) > 12) {
        for (const [k, a] of [[0.75, 0.1], [0.5, 0.16], [0.25, 0.24]]) {
          ctx.save();
          ctx.globalAlpha = a;
          drawPole4(boyPose4(tc - k / FPS, t).pole, t, true);
          ctx.restore();
        }
      }
      drawRag4(i, t, { d: len3(s3(P.pole.at(POLE.len - 0.12), BOY_CAM)), draw: () => drawPole4(P.pole, t) });
      // (an arm is behind his body from here when its hand is in front of his back and in toward
      // his middle: see ARM_FWD4)
      drawBoy(t, tc, { noBird: true, forward: ARM_FWD4, forwardParts: ARM_PARTS4, capOut: BOY4_CAP, fold: true, foldCos: BOY4_FOLDCOS, reachFolds: true, plantFeet: true });
    } finally { setBoyView(null); BOY_POSE = null; }
  }
  if (!only) finish(t, sun, V(W * 0.7, H * 0.55), [H * 0.5, H * 1.5]);
}

defineShot('s4', { dur: S4.dur, t0: S4.t0, render: renderShot4 });
