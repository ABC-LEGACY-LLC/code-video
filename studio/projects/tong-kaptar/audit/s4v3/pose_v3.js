// ------------------------------------------------------------------ the pole
// The keeper's pole from shot 1's coop: a bamboo 3.2 m long, 3.4 cm across at the butt and 1.6 at
// the tip, the atlas rag tied along its top. He swings it round and round, the way keepers keep a
// flock up: the rag draws a circle in the sky and the flock goes round with it (a Damascus keeper's
// birds "kept going up in a circle in a perfect synchrony with the circle he was drawing with his
// sash", Syrian Heritage). The left hand, high, steers and is the pivot; the right hand at the butt
// drives it round below. To call the flock down he slows the circles until the pole stands still
// ("he calmed down his movement and his whistles signalled to the birds that play time is over"),
// rests the butt against his hip with the pole up in his left hand, and whistles with two fingers
// of his right in his mouth; then he brings the rag down after the flock.
const POLE = { len: 3.2, r0: 0.017, r1: 0.008, gripR: 0.14 };
// The pole's line in boy space, on a cone: aPhi, aBeta, its axis (from upright toward his right;
// leaning forward); alpha, the cone's half-angle; theta, where round it the pole is (0: the top to
// the right of the axis, pi/2 beyond it, pi to the left, 3pi/2 toward us: anticlockwise from above,
// the way the flock circles); q, the still point, POLE_SQ of the way up from the right hand to the
// left (so the left hand moves a little with the top and the right hand round the other way, more).
const POLE_SQ = 0.85;
function coneFrame(aPhi, aBeta) {
  const A = n3(V3(Math.sin(aPhi) * Math.cos(aBeta), Math.cos(aPhi) * Math.cos(aBeta), Math.sin(aBeta)));
  const E1 = n3(s3(V3(1, 0, 0), m3(A, A.x)));
  return { A, E1, E2: cross3(E1, A) };
}
function pole4(P) {
  const { A, E1, E2 } = coneFrame(P.aPhi, P.aBeta);
  const off = a3(m3(E1, Math.cos(P.theta)), m3(E2, Math.sin(P.theta)));
  const u = n3(a3(m3(A, Math.cos(P.alpha)), m3(off, Math.sin(P.alpha))));
  const butt = s3(P.q, m3(u, POLE.gripR + POLE_SQ * P.span));
  const hR = a3(butt, m3(u, POLE.gripR));
  return { butt, u, handR: hR, handL: a3(hR, m3(u, P.span)), tip: a3(butt, m3(u, POLE.len)), at: (s) => a3(butt, m3(u, s)) };
}
// The circles, frames of the shot: one every CIRC.per frames, going on from before the shot opens,
// the first growing into the next ("the circle started getting bigger"), then slower and smaller
// until the pole stands still. theta in closed form: the rate eases from per to perEnd over slow.
const CIRC = { th0: 0.1, per: 30, slow: [34, 50], perEnd: 70, a0: 0.28, a1: 0.38, grow: [-4, 16], shrink: [33, 49] };
function circle4(f) {
  const w0 = TAU / CIRC.per, w1 = TAU / CIRC.perEnd, [f1, f2] = CIRC.slow, D = f2 - f1;
  const x = clamp((f - f1) / D, 0, 1);
  const theta = CIRC.th0 + w0 * f + (w1 - w0) * (D * (x ** 3 - x ** 4 / 2) + Math.max(0, f - f2));
  const alpha = lerp(CIRC.a0, CIRC.a1, sstep(CIRC.grow[0], CIRC.grow[1], f)) * (1 - sstep(CIRC.shrink[0], CIRC.shrink[1], f));
  return { theta, alpha, k: alpha / CIRC.a1 };
}

// ------------------------------------------------------------------ the acting
// Frames of the shot (24 fps, on ones). `hold` keys ease in and out. The circles themselves are
// circle4's; the keys carry the slow part: where he holds the pole's circle and how he stands.
// q, aPhi, aBeta: the circle's still point and axis, up and out to his left, toward the flock; span,
// the hands' distance on the pole; mouth: his right hand at his mouth (0 on the pole); hYaw, hPitch:
// on top of his eyes on the flock (see flockAim4); poleL: the left elbow's way.
const BOY4_KEYS = [
  { f: 0, root: V3(0.012, -0.008, 0), hipRoll: 0.04, lean: 0.03, bend: 0.05, twist: -0.16, shL: 0.035, shR: 0.0,
    hYaw: 0, hPitch: 0, hRoll: 0.02, aim: 0,
    q: V3(-0.087, 0.684, 0.265), aPhi: -0.55, aBeta: 0.2, span: 0.68, mouth: 0,
    poleL: V3(-1, -0.6, -0.2) },
  { f: 30, q: V3(-0.095, 0.68, 0.27) },
  // the circles die down, the pole comes to lean out to his left toward the flock, the butt at his
  // right hip
  { f: 48, hold: true, root: V3(0.01, -0.004, 0), hipRoll: 0.03, twist: -0.12, bend: 0.03, lean: 0.0,
    q: V3(-0.234, 0.658, 0.312), aPhi: -0.68, aBeta: 0.27 },
  // the right hand off the butt and up to his mouth
  { f: 53, mouth: 1, shR: 0.02, lean: -0.02 },
  { f: 66, hold: true, mouth: 1 },
  { f: 72, mouth: 0, shR: 0.0, lean: 0.01 },
  // and he brings the rag down out of the sky to his left, the way the flock is coming down
  { f: 80, root: V3(0.042, -0.026, 0), hipRoll: 0.085, twist: -0.16, bend: 0.06, q: V3(-0.15, 0.527, 0.199), aPhi: -0.872, aBeta: 0.244, poleL: V3(-0.4, -1, -0.2) },
  { f: 87, root: V3(0.035, -0.012, 0), hipRoll: 0.07, twist: -0.18, bend: 0.07, q: V3(-0.156, 0.515, 0.19), aPhi: -0.815, aBeta: 0.212 },
  { f: 95, hold: true, root: V3(0.035, -0.01, 0), hipRoll: 0.07, twist: -0.18, bend: 0.07, q: V3(-0.156, 0.512, 0.191), aPhi: -0.829, aBeta: 0.212 },
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
const MOUTH_R = { w: V3(0.012, -0.022, 0.205), hd: V3(-0.04, 0.22, -1), pn: V3(0, -1, -0.2) };
// Where the right elbow goes (boy space), frame by frame: the IK's pole is the way to it from the
// shoulder. Driving the butt round at his hip, out and back; up at his mouth, out in front of his
// shoulder; with the pole lowered, back.
const ELB_R4 = [[0, V3(0.34, 0.3, -0.12)], [46, V3(0.34, 0.3, -0.12)], [50, V3(0.34, 0.38, 0.02)], [53, V3(0.3, 0.44, 0.14)],
  [66, V3(0.3, 0.44, 0.14)], [69, V3(0.34, 0.38, 0.02)], [72, V3(0.34, 0.3, -0.12)], [80, V3(0.2, 0.33, -0.24)], [95, V3(0.2, 0.35, -0.25)]];
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
let BOY4_SWAY = { rootX: 0.022, roll: 0.06, twist: 0.13, bend: 0.07, lean: 0.03, dip: 0.01, sh: 0.012, head: 0.07 };
// The whistle: one long blast and a short one after it (a keeper's first whistle is "loud and very
// long"). Before each he draws breath (his shoulders rise); on it his shoulders drop, he leans in and
// his head dips, and he holds it while he blows; then he lets go over three and a half frames.
const BOY4_BLASTS = [{ f: 54.5, len: 6 }, { f: 64, len: 0 }];
const blastHit = (x, L) => {
  if (x < -1) return 0;
  if (x < 0) return x + 1;
  const lev = L > 0 ? 1 - 0.25 * Math.min(1, x / L) : 1;
  if (x < L) return lev;
  const r = (x - L) / 3.5;
  return r < 1 ? lev * (1 - r) ** 2 : 0;
};
const blastIn = (x) => Math.exp(-(((x + 2.5) / 1.1) ** 2));
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
  P.lean += 0.08 * hit - 0.03 * inh;
  P.shL += -0.028 * hit + 0.018 * inh; P.shR += -0.028 * hit + 0.018 * inh;
  P.hPitch += -0.11 * hit + 0.035 * inh;
  P.root = a3(P.root, V3(0, -0.02 * hit + 0.008 * inh, 0));
  // (the hands go with him as his weight shifts and his knees give: the still point carries half his
  // hips' sway and all of their dip)
  P.q = a3(P.q, V3(0.5 * (P.root.x - Ph.root.x), P.root.y, 0));
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
    const wNow = l3(g.w, m.w, mk), away = n3(s3(wNow, BOY_CAM));
    const pnT = l3(l3(g.pn, away, sstep(0, 0.2, mk)), m.pn, kWh);
    return { w: wNow, pn: pnT, hd: l3(g.hd, m.hd, mk), k: 1 };
  };
  return P;
}
