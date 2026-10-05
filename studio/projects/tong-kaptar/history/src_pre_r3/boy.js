// Tong · kaptar — the boy: a 3-D skeleton seen from behind (arms by two-bone IK, a head built
// from a skull/face/ears proxy wearing a four-sided do‘ppi, hands from finger chains), posed
// by an exposure sheet of key drawings and drawn as cel shapes with one outline per body.
'use strict';

// ------------------------------------------------------------------ proportions (metres)
const BODY = {
  waistY: 0.2, chestY: 0.36,
  neckBase: V3(0, 0.155, -0.012),          // in the chest frame
  shoulder: V3(0.145, 0.112, -0.004),      // in the chest frame (x mirrored for the left)
  upper: 0.265, fore: 0.228,
  neckLen: 0.088,
  HS: 1.12,                                // head scale (a little large, for appeal)
};
// head frame: origin at the neck pivot, x to his right, y up, z where his face points
const SKULL = { c: V3(0, 0.07, -0.012), r: V3(0.074, 0.097, 0.094) };
// The face, as the solid its lost profile is cut from: small round masses at the landmarks a
// face turns on (x > 0 is mirrored). Projected and wrapped in their convex hull they give, from
// any angle, a cheek that narrows past the jaw angle to a chin. (One face ellipsoid plus a jaw
// ellipsoid read as a featureless balloon: no jaw line, no chin.) [x, y, z, radius]
const FACE_BLOBS = [
  [0.052, 0.062, 0.058, 0.016],   // cheekbone
  [0.045, 0.036, 0.05, 0.015],    // cheek
  [0.043, 0.01, 0.012, 0.012],    // jaw angle, below and in front of the ear lobe
  [0.027, -0.016, 0.046, 0.01],   // jaw
  [0.009, -0.029, 0.07, 0.009],   // chin: small, a boy's
  [0, 0.012, 0.082, 0.012],       // mouth
  [0.03, 0.088, 0.08, 0.012],     // brow
];
// the outer corner of the eye, where lashes break the cheek line in a lost profile
const EYE_CORNER = V3(0.047, 0.07, 0.07);
const EAR = { y: 0.058, z: 0.006, h: 0.056, w: 0.03, stick: 0.021 };

// ------------------------------------------------------------------ the exposure sheet: key drawings
// Frames are the frame numbers of the shot (24 fps). Keys marked `hold` get zero velocity
// (the drawing eases in and out); others pass through with velocity (Catmull-Rom).
// Wrist targets are in boy space; `grip` pins the hands to the held pigeon, `visor` pins the
// left hand to the forehead. The pigeon (bird*) is only drawn by the boy while he holds it.
const BOY_KEYS = [
  { f: 0, hold: true,
    root: V3(0, 0, 0), hipRoll: 0.035, lean: 0.03, bend: 0.03, twist: -0.12, shL: 0, shR: 0,
    wL: V3(-0.26, 0.24, 0.1), wR: V3(-0.2, 0.3, 0.16), poleL: V3(-0.5, -1, -0.6), poleR: V3(0.25, -0.5, 1),
    pnL: V3(0, 1, 0), pnR: V3(1, 0, 0.3), hdL: V3(0.2, 0, 1), hdR: V3(-0.2, -1, 0.2),
    curlL: 0.4, curlR: 0.4, spreadL: 0.04, spreadR: 0.05, thumbL: 0.5, thumbR: 0.5,
    grip: 1, gripT: 0, visor: 0,
    tdirL: V3(0.55, -0.55, -0.62), tdirR: V3(-0.55, -0.55, -0.62), tmixL: 0, tmixR: 0,
    hYaw: -0.62, hPitch: -0.32, hRoll: 0.05, aim: 0,
    bird: V3(-0.3, 0.33, 0.13), bYaw: -Math.PI / 2 - 0.3, bPitch: 0.16, bRoll: 0.05, bOpen: 0, bHead: 0.0 },
  { f: 6, bHead: 0.55 },
  { f: 10, hold: true, root: V3(0, 0.004, 0), shL: 0.006, shR: 0.005, bird: V3(-0.3, 0.345, 0.13), bHead: 0.55 },
  // anticipation: a real crouch (knees), the pigeon lowered in front, the back fairly straight
  { f: 14, root: V3(-0.008, -0.082, 0.016), hipRoll: 0.018, lean: 0.1, bend: -0.024, twist: -0.2,
    bird: V3(-0.25, 0.075, 0.19), bYaw: -Math.PI / 2 - 0.13, bPitch: 0.02, bRoll: 0.08, bHead: -0.2,
    hYaw: -0.44, hPitch: -0.42, hRoll: 0.02 },
  { f: 16, hold: true, gripT: 0, root: V3(-0.01, -0.1, 0.02), hipRoll: 0.01, lean: 0.12, bend: -0.03, twist: -0.24,
    bird: V3(-0.24, 0.02, 0.2), bYaw: -Math.PI / 2 - 0.1, bPitch: -0.05, bRoll: 0.1, bHead: -0.25,
    hYaw: -0.4, hPitch: -0.46, hRoll: 0.02, poleL: V3(-0.6, -0.5, -0.8), poleR: V3(0.3, -0.6, 1), curlL: 0.5 },
  // the toss, on ones: the pigeon keeps its speed right through the release (no slowing before it)
  { f: 18, root: V3(-0.008, -0.088, 0.02), lean: 0.1, twist: -0.2, bend: -0.02,
    bird: V3(-0.25, 0.12, 0.22), bYaw: -Math.PI / 2 + 0.05, bPitch: 0.15, hPitch: -0.3, hYaw: -0.42, gripT: 1 },
  { f: 19, root: V3(-0.005, -0.052, 0.015), lean: 0.05, twist: -0.14, bend: -0.01,
    bird: V3(-0.22, 0.34, 0.25), bYaw: -Math.PI / 2 + 0.35, bPitch: 0.45, hPitch: -0.02, hYaw: -0.33,
    poleL: V3(-0.55, -1, -0.1), poleR: V3(0.5, -1, 0.1) },
  { f: 20, root: V3(-0.002, -0.012, 0.01), lean: -0.01, twist: -0.07, bend: 0.0,
    bird: V3(-0.17, 0.57, 0.28), bYaw: -0.75, bPitch: 0.62, bRoll: 0.0, hPitch: 0.24, hYaw: -0.23 },
  { f: 21, root: V3(0, 0.02, 0.01), lean: -0.07, twist: -0.02,
    // wings stay folded in the hands: they open only as the pigeon leaves them (f22)
    bird: V3(-0.12, 0.8, 0.29), bYaw: -0.45, bPitch: 0.72, bOpen: 0, hPitch: 0.42, hYaw: -0.15,
    poleL: V3(-1, -0.5, -0.1), poleR: V3(1, -0.4, -0.1) },
  { f: 22, root: V3(0, 0.035, 0.01), lean: -0.11, twist: 0, bend: 0.02,
    bird: V3(-0.07, 1.07, 0.3), bOpen: 1, grip: 0,
    wL: V3(-0.2, 0.9, 0.23), wR: V3(0.07, 0.92, 0.24), pnL: V3(0.2, 0.5, 1), pnR: V3(-0.2, 0.5, 1), hdL: V3(-0.25, 1, 0.12), hdR: V3(0.25, 1, 0.12),
    curlL: 0.12, curlR: 0.12, spreadL: 0.2, spreadR: 0.2, thumbL: 0.7, thumbR: 0.7, hPitch: 0.55, hYaw: -0.1, hRoll: 0.0, aim: 0.2 },
  { f: 24, root: V3(0, 0.038, 0.01), lean: -0.13, bird: V3(0.0, 1.46, 0.31),
    wL: V3(-0.27, 0.95, 0.19), wR: V3(0.13, 0.97, 0.2), spreadL: 0.17, spreadR: 0.17, curlL: 0.14, curlR: 0.14, aim: 0.6 },
  { f: 27, hold: true, root: V3(0, 0.032, 0.01), lean: -0.12, wL: V3(-0.3, 0.93, 0.16), wR: V3(0.14, 0.96, 0.17), aim: 1,
    curlL: 0.24, curlR: 0.24, spreadL: 0.14, spreadR: 0.14, pnL: V3(0.5, -0.2, 1), pnR: V3(-0.5, -0.2, 1), poleL: V3(-1, 0, -0.3), poleR: V3(1, 0, -0.3) },
  // The arms come down (on ones) and the hands land on the hips, in one movement: a slow start,
  // a fall through the sides with the elbows giving and the relaxed hands trailing, then the
  // hands arrive at the waist and settle there (a small overshoot of the shoulders). The hands on
  // the hips the way a person puts them: the web of the hand on the top of the hip bone, fingers
  // forward round the waist, thumbs back on the back of it toward the spine. (Before: the arms
  // flung out level, hung, then rose again; and the hands hung off the hips like hooks, the
  // thumbs sticking out sideways, the hands half out of the frame.)
  { f: 31, root: V3(0, 0.026, 0.009), lean: -0.1, wL: V3(-0.5, 0.74, 0.1), wR: V3(0.48, 0.74, 0.1), curlL: 0.25, curlR: 0.25,
    spreadL: 0.04, spreadR: 0.04, pnL: V3(0.3, -0.6, 0.75), pnR: V3(-0.3, -0.6, 0.75), hdL: V3(-0.7, 0.62, 0.1), hdR: V3(0.7, 0.62, 0.1),
    thumbL: 0.1, thumbR: 0.1, poleL: V3(-0.3, -1, -0.3), poleR: V3(0.3, -1, -0.3) },
  { f: 34, root: V3(0, 0.018, 0.008), lean: -0.09, wL: V3(-0.56, 0.38, 0.06), wR: V3(0.55, 0.37, 0.06),
    pnL: V3(0.2, -0.7, -0.7), pnR: V3(-0.2, -0.7, -0.7), hdL: V3(-0.95, -0.2, 0.1), hdR: V3(0.95, -0.2, 0.1), curlL: 0.3, curlR: 0.3,
    poleL: V3(-0.2, -1, -0.5), poleR: V3(0.2, -1, -0.5) },
  { f: 36, root: V3(0.002, 0.01, 0.006), lean: -0.07, wL: V3(-0.4, 0.13, 0.02), wR: V3(0.4, 0.12, 0.02),
    pnL: V3(0.85, -0.2, -0.45), pnR: V3(-0.85, -0.2, -0.45), hdL: V3(-0.45, -0.85, 0.15), hdR: V3(0.45, -0.85, 0.15), curlL: 0.34, curlR: 0.34,
    poleL: V3(-0.7, -0.4, -0.6), poleR: V3(0.7, -0.4, -0.6) },
  { f: 38, root: V3(0.004, 0.004, 0.004), lean: -0.05, hipRoll: 0.03, wL: V3(-0.25, 0.17, -0.02), wR: V3(0.25, 0.165, -0.02),
    pnL: V3(1, -0.2, 0.1), pnR: V3(-1, -0.2, 0.1), hdL: V3(0.1, -0.5, 0.85), hdR: V3(-0.1, -0.5, 0.85), curlL: 0.4, curlR: 0.4,
    tmixL: 0.5, tmixR: 0.5, spreadL: 0.05, spreadR: 0.05, poleL: V3(-1, 0.05, -0.45), poleR: V3(1, 0.05, -0.45) },
  { f: 40, root: V3(0.008, 0.004, 0.002), lean: -0.04, hipRoll: 0.045, bend: -0.03, shL: 0.016, shR: 0.014,
    wL: V3(-0.156, 0.112, -0.045), wR: V3(0.16, 0.107, -0.043), pnL: V3(1, -0.3, 0), pnR: V3(-1, -0.3, 0), hdL: V3(0.3, 0.05, 0.95), hdR: V3(-0.3, 0.05, 0.95),
    tmixL: 1, tmixR: 1, curlL: 0.55, curlR: 0.55, thumbL: 0.5, thumbR: 0.5, poleL: V3(-1, 0.2, -0.35), poleR: V3(1, 0.2, -0.35) },
  { f: 44, hold: true, root: V3(0.01, 0, 0), hipRoll: 0.05, bend: -0.045, shL: 0.006, shR: 0.004,
    wL: V3(-0.156, 0.1, -0.045), wR: V3(0.16, 0.096, -0.043) },
  { f: 70, hold: true, root: V3(0.012, 0.001, 0), hipRoll: 0.055, bend: -0.05, shL: 0.008, shR: 0.004,
    wL: V3(-0.154, 0.1, -0.045), wR: V3(0.162, 0.095, -0.043) },
  // as his pigeon joins the flock he settles his weight onto one leg (contrapposto: the hips tip
  // one way, the shoulders the other), hands still on his hips, riding with them
  { f: 80, root: V3(0.026, -0.004, 0), hipRoll: 0.095, bend: -0.085, shL: 0.024, shR: -0.004,
    wL: V3(-0.141, 0.092, -0.045), wR: V3(0.177, 0.107, -0.043) },
  { f: 95, hold: true, root: V3(0.024, -0.003, 0), hipRoll: 0.09, bend: -0.08, shL: 0.022, shR: -0.003,
    wL: V3(-0.143, 0.093, -0.045), wR: V3(0.175, 0.105, -0.043) },
];
// Fill every key with the previous key's values for channels it does not set.
(() => {
  for (let i = 1; i < BOY_KEYS.length; i++) {
    const prev = BOY_KEYS[i - 1], k = BOY_KEYS[i];
    for (const ch of Object.keys(BOY_KEYS[0])) if (ch !== 'f' && ch !== 'hold' && !(ch in k)) k[ch] = prev[ch];
  }
})();
const isVec = (v) => v && typeof v === 'object' && 'z' in v;
// Hermite through the keys with time-aware (Catmull-Rom) tangents; holds get zero tangents.
function keyAt(keys, f) {
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1].f) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const km = keys[Math.max(0, i - 1)], k2 = keys[Math.min(keys.length - 1, i + 2)];
  const dt = k1.f - k0.f;
  const s = clamp((f - k0.f) / dt, 0, 1);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  const out = {};
  for (const ch of Object.keys(k0)) {
    if (ch === 'f' || ch === 'hold') continue;
    const comp = (get) => {
      const m0 = k0.hold || i === 0 ? 0 : (get(k1) - get(km)) / (k1.f - km.f);
      const m1 = k1.hold || i + 1 === keys.length - 1 ? 0 : (get(k2) - get(k0)) / (k2.f - k0.f);
      return h00 * get(k0) + h10 * dt * m0 + h01 * get(k1) + h11 * dt * m1;
    };
    out[ch] = isVec(k0[ch]) ? V3(comp((k) => k[ch].x), comp((k) => k[ch].y), comp((k) => k[ch].z)) : comp((k) => k[ch]);
  }
  return out;
}

// ------------------------------------------------------------------ skeleton
function spineFrames(P) {
  const root = P.root;
  let pel = frameAt(root, V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1));
  pel = turnFrame(pel, pel.z, -P.hipRoll);           // hip line tilts (contrapposto)
  // the spine bends in two segments: 40% of lean/bend/twist below the waist, 60% above
  const seg = (F, k, dy) => {
    let G = frameAt(toP(F, V3(0, dy, 0)), F.x, F.y, F.z);
    G = turnFrame(G, G.y, P.twist * k);
    G = turnFrame(G, G.x, P.lean * k);
    G = turnFrame(G, G.z, -P.bend * k);
    return G;
  };
  const base = frameAt(root, V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1));
  const waist = seg(base, 0.4, BODY.waistY);
  const chest = seg(waist, 0.6, BODY.chestY - BODY.waistY);
  return { pel, waist, chest };
}
function headFrame(P, chest, aimYaw, aimPitch) {
  const nb = toP(chest, BODY.neckBase);
  const yaw = lerp(P.hYaw, aimYaw, P.aim), pitch = lerp(P.hPitch, aimPitch, P.aim), roll = P.hRoll;
  // the neck takes part of the turn, the head the rest
  let N = frameAt(nb, chest.x, chest.y, chest.z);
  N = yprFrame(N, yaw * 0.35, pitch * 0.4, roll * 0.3);
  const pivot = toP(N, V3(0, BODY.neckLen, 0));
  let Hd = frameAt(pivot, N.x, N.y, N.z);
  Hd = yprFrame(Hd, yaw * 0.65, pitch * 0.6, roll * 0.7);
  return { neck: N, head: Hd, nb, pivot, pitch };
}
function ik3(S, T, a, b, pole) {
  const d = s3(T, S);
  let dist = len3(d);
  const dn = m3(d, 1 / (dist || 1));
  dist = clamp(dist, Math.abs(a - b) + 1e-3, (a + b) * 0.998);
  const x = (a * a - b * b + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  let pp = s3(pole, m3(dn, dot3(pole, dn)));
  pp = len3(pp) < 1e-6 ? V3(0, -1, 0) : n3(pp);
  return { E: a3(S, a3(m3(dn, x), m3(pp, h))), Wr: a3(S, m3(dn, dist)) };
}
function birdFrameBoy(P) {
  return yprFrame(frameAt(P.bird, V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)), P.bYaw, P.bPitch, P.bRoll);
}
// Hands on the held bird: left hand under its breast, right hand over its back (pinning the wings).
const GRIP = {
  L: { w: V3(0.006, -0.07, 0.03), pn: V3(0, 1, 0.1), hd: V3(1, 0.45, 0.12) },
  R: { w: V3(0.012, 0.05, -0.075), pn: V3(0, -1, 0.1), hd: V3(0, -0.12, 1) },
};
// During the toss both hands hold the bird's flanks, like a ball.
// (round the rear half of the body, so the head and breast stand clear above the hands)
const GRIP_T = {
  L: { w: V3(-0.05, -0.022, -0.04), pn: V3(1, 0.35, 0), hd: V3(0, 0.25, 1) },
  R: { w: V3(0.05, -0.022, -0.04), pn: V3(-1, 0.35, 0), hd: V3(0, 0.25, 1) },
};
// Visor: the left hand flat over the brow, palm down, the heel at the left temple and the
// fingers reaching forward and a little outward, so from behind the flat hand shows past his
// brow against the sky (hidden entirely behind the head, it read as a hand on his head).
const VISOR = { w: V3(-0.07, 0.106, 0.09), pn: V3(0.15, -1, 0.1), hd: V3(-0.62, 0.08, 0.78) };

function boyPose(tc, t) {
  const P = keyAt(BOY_KEYS, tc * FPS);
  // breathing: a slow rise of chest and shoulders, always on (holds must breathe)
  const br = Math.sin((t * TAU) / 3.2);
  P.shL += 0.004 * br; P.shR += 0.004 * br;
  P.root = a3(P.root, V3(0, 0.0015 * br, 0));
  return P;
}
// where the boy looks once the pigeon is up: at the pigeon, a beat late
function aimAngles(tc, pivot) {
  const tt = Math.max(RELEASE_T + 0.05, tc - 0.12);
  const target = s3(heroPos(tt), BOY_ROOT);          // sky world -> boy space (same axes)
  const d = s3(target, pivot);
  const yaw3 = Math.atan2(d.x, d.z), pitch3 = Math.atan2(d.y, Math.hypot(d.x, d.z));
  // "geometrically correct can still read wrong": the pigeon flies away almost straight ahead
  // of him, but on screen it is up and to the left of his head. Bias toward the screen.
  const hs = projB(pivot, tt), bs = projW(heroPos(tt), tt);
  const yawScreen = clamp((bs.x - hs.x) / 700, -1, 0.6);
  // (the true angle up to the flock is only ~20 degrees; from behind that barely tilts the cap,
  // so the look up is played bigger than the geometry)
  return { yaw: clamp(0.4 * yaw3 + 0.6 * yawScreen - 0.15, -0.95, 0.35), pitch: clamp(pitch3 * 1.4 + 0.08, -0.5, 0.72) };
}
function rig(tc, t) {
  const P = boyPose(tc, t);
  const S = spineFrames(P);
  let aimY = P.hYaw, aimP = P.hPitch;
  if (P.aim > 0) {
    const a = aimAngles(tc, headFrame(P, S.chest, 0, 0).pivot);
    aimY = a.yaw; aimP = a.pitch;
  }
  const Hf = headFrame(P, S.chest, aimY, aimP);
  const BF = birdFrameBoy(P);
  const arm = (side) => {
    const sg = side === 'L' ? -1 : 1;
    const sh = side === 'L' ? P.shL : P.shR;
    const Sj = toP(S.chest, V3(sg * BODY.shoulder.x, BODY.shoulder.y + sh, BODY.shoulder.z));
    let wT = side === 'L' ? P.wL : P.wR;
    let pn = side === 'L' ? P.pnL : P.pnR;
    let hd = side === 'L' ? P.hdL : P.hdR;
    const g0 = GRIP[side], g1 = GRIP_T[side], k = clamp(P.gripT || 0, 0, 1);
    if (P.grip > 0) {
      wT = l3(wT, toP(BF, l3(g0.w, g1.w, k)), P.grip);
      pn = l3(pn, dirP(BF, n3(l3(g0.pn, g1.pn, k))), P.grip);
      hd = l3(hd, dirP(BF, n3(l3(g0.hd, g1.hd, k))), P.grip);
    }
    if (side === 'L' && P.visor > 0) {
      // the hand stays level over the eyes while the head tips back to watch the sky (it does
      // not tilt up with the head: fingers pointing up over the cap read as holding the cap)
      const lev = (Hf.pitch || 0) * 0.8;
      wT = l3(wT, toP(Hf.head, VISOR.w), P.visor);
      pn = l3(pn, rotAxis(dirP(Hf.head, VISOR.pn), Hf.head.x, lev), P.visor);
      hd = l3(hd, rotAxis(dirP(Hf.head, VISOR.hd), Hf.head.x, lev), P.visor);
    }
    const { E, Wr } = ik3(Sj, wT, BODY.upper, BODY.fore, side === 'L' ? P.poleL : P.poleR);
    return { side, sg, S: Sj, E, W: Wr, pn: n3(pn), hd: n3(hd), curl: side === 'L' ? P.curlL : P.curlR, spread: side === 'L' ? P.spreadL : P.spreadR, thumb: side === 'L' ? P.thumbL : P.thumbR,
      tdir: side === 'L' ? P.tdirL : P.tdirR, tmix: clamp(side === 'L' ? P.tmixL : P.tmixR, 0, 1) };
  };
  return { P, S, H: Hf, BF, L: arm('L'), R: arm('R') };
}

// ------------------------------------------------------------------ shape helpers
function taperQuad(a, b, wa, wb, bulge = 0, flat = 0) {
  // one edge curved, the other straighter (straight against curve)
  const d = norm(sub(b, a)), n = perp(d);
  const m = vlerp(a, b, 0.42);
  return [
    add(a, mul(n, wa / 2)), add(m, mul(n, (wa + wb) / 4 + bulge)), add(b, mul(n, wb / 2)),
    add(b, mul(d, wb * 0.3)),
    sub(b, mul(n, wb / 2)), sub(m, mul(n, (wa + wb) / 4 + flat)), sub(a, mul(n, wa / 2)),
    sub(a, mul(d, wa * 0.3)),
  ];
}
// a projected capsule between two 3-D points of given widths (metres); a short one becomes a blob
function capsule3(a, b, wa, wb, proj) {
  const pa = proj(a), pb = proj(b);
  const ka = pxPerM(pa.z) * wa / 2, kb = pxPerM(pb.z) * wb / 2;
  const L = len(sub(pb, pa));
  if (L < 0.6 * Math.max(ka, kb)) {
    const c = vlerp(pa, pb, 0.5), r = Math.max(ka, kb) + L / 2;
    return ellipsePts(c, V(r, 0), V(0, r), 10);
  }
  const d = mul(sub(pb, pa), 1 / L), nn = perp(d);
  return [add(pa, mul(nn, ka)), add(pb, mul(nn, kb)), add(pb, mul(d, kb * 0.9)), sub(pb, mul(nn, kb)), sub(pa, mul(nn, ka)), sub(pa, mul(d, ka * 0.8))];
}

// ------------------------------------------------------------------ hands (finger chains)
// Palm, four fingers and thumb as one union with the forearm. The thumb sits on the side
// the anatomy puts it: back of the right hand toward us with fingers up -> thumb on the left.
function handShapes(A, proj) {
  const hd = A.hd;
  let pn = s3(A.pn, m3(hd, dot3(A.pn, hd)));
  pn = len3(pn) < 1e-4 ? V3(0, 0, 1) : n3(pn);
  const ts = A.sg > 0 ? cross3(pn, hd) : cross3(hd, pn);
  // wrap: how far the hand is wrapped round the body (hands on hips). The fingers go round the
  // front of the waist, out of sight; what shows from behind is the heel of the hand and a short
  // thick thumb on the back. (Drawn whole, the hand read as a finger pointing at his spine.)
  const wrap = clamp(A.tmix || 0, 0, 1);
  const palmL = 0.08 * (1 - 0.45 * wrap), palmW = 0.076;
  const W0 = A.W;
  const shapes = [];
  const k0 = a3(W0, m3(hd, palmL));
  const palm = [a3(W0, m3(ts, palmW * 0.34)), a3(a3(W0, m3(hd, palmL * 0.55)), m3(ts, palmW * 0.5)), a3(k0, m3(ts, palmW * 0.48)),
    a3(k0, m3(ts, -palmW * 0.5)), a3(a3(W0, m3(hd, palmL * 0.5)), m3(ts, -palmW * 0.48)), a3(W0, m3(ts, -palmW * 0.38))].map(proj);
  shapes.push({ pts: palm, smooth: true });
  const fingerLens = [[0.041, 0.025, 0.02], [0.046, 0.028, 0.021], [0.043, 0.026, 0.02], [0.034, 0.02, 0.017]];
  const fingerTips = [], fingerBases = [];
  // fingers held together are drawn as one mitten shape (their hull): separate fingertips side
  // by side read as a comb or a crab claw, and outlined knuckle by knuckle as stacked thumbs
  const mitten = A.spread < 0.12;
  const fingerPts = [];
  for (let k = 0; k < 4; k++) {
    const off = (1.5 - k) * palmW * 0.25;           // index finger on the thumb side
    const base = a3(a3(k0, m3(ts, off)), m3(hd, -0.004 * Math.abs(1.5 - k)));
    // spread > 0 fans the fingers out: the index turns toward the thumb side, the little finger away
    const dir = rotAxis(hd, pn, (1.5 - k) * A.spread * (A.sg > 0 ? 1 : -1));
    const axis = n3(cross3(dir, pn));
    let p = base, ang = 0;
    const wid = [0.0185, 0.018, 0.017, 0.0155][k];
    for (let j = 0; j < 3; j++) {
      ang += [0.55, 1.0, 0.8][j] * A.curl * 1.35 * (1 + 0.08 * (k - 1.5));
      const q = a3(p, m3(rotAxis(dir, axis, -ang), fingerLens[k][j] * (1 - 0.97 * wrap)));
      const cap = capsule3(p, q, wid * (1 - j * 0.1), wid * (0.92 - j * 0.12), proj);
      if (mitten) fingerPts.push(...cap); else shapes.push({ pts: cap, smooth: true });
      p = q;
    }
    fingerTips.push(p);
    fingerBases.push(base);
  }
  if (mitten) shapes.push({ pts: hull(fingerPts), smooth: true });
  // thumb from the heel of the palm on the thumb side, turned toward the palm
  const tb = a3(a3(W0, m3(hd, 0.018)), a3(m3(ts, palmW * 0.4), m3(pn, 0.01)));
  let td = n3(a3(a3(m3(hd, 0.75), m3(ts, 0.15 + 0.6 * (A.thumb ?? 0.5))), m3(pn, 0.22 + A.curl * 0.35)));
  // a thumb can be set to point a given way (hooked round the back of the waist, it is out of
  // the palm's plane, which the default thumb never leaves)
  if (A.tmix > 0 && A.tdir) td = n3(l3(td, n3(A.tdir), A.tmix));
  const tl = 1 - 0.32 * wrap, tw = 1 + 0.15 * wrap;
  const t1 = a3(tb, m3(td, 0.036 * tl));
  const t2 = a3(t1, m3(n3(a3(td, m3(pn, 0.25 + A.curl * 0.5))), 0.028 * tl));
  shapes.push({ pts: capsule3(tb, t1, 0.022 * tw, 0.019 * tw, proj), smooth: true });
  shapes.push({ pts: capsule3(t1, t2, 0.019 * tw, 0.015 * tw, proj), smooth: true });
  return { shapes, fingerTips, fingerBases, knuckle: k0, pn, ts };
}

// ------------------------------------------------------------------ arms
// The sleeve is rolled up to mid upper arm. When the arm hangs or is raised to the side the
// sleeve belongs to the shirt (drawn in one union with the torso: no seam at the shoulder);
// when the arm reaches forward, behind his back from our side, it is drawn on its own.
function sleeveShape(A, t) {
  const proj = (p) => projB(p, t);
  const s = proj(A.S), e = proj(A.E);
  const d = norm(sub(e, s)), n = perp(d);
  const k0 = pxPerM(s.z), k1 = pxPerM(e.z);
  const w0 = 0.102 * k0, w1 = 0.078 * k1;
  const root = sub(s, mul(d, 0.018 * k0));
  const end = vlerp(s, e, 0.53);
  const mid = vlerp(root, end, 0.45);
  return [add(root, mul(n, w0 * 0.42)), add(mid, mul(n, (w0 + w1) / 4 + 1.2)), add(end, mul(n, w1 / 2)),
    sub(end, mul(n, w1 / 2)), sub(mid, mul(n, (w0 + w1) / 4 + 0.4)), sub(root, mul(n, w0 * 0.42)), sub(root, mul(d, w0 * 0.3))];
}
const armForward = (A) => A.E.z > 0.09 && armUp(A) < 0.55;
function drawArm(A, R, t, o = {}) {
  const proj = (p) => projB(p, t);
  const s = proj(A.S), e = proj(A.E), w = proj(A.W);
  const k = pxPerM(e.z);
  // skin: lower upper-arm, elbow, forearm and hand are ONE body (no seam at elbow or wrist)
  const skinStart = vlerp(s, e, 0.56);
  const skin = [
    { pts: taperQuad(skinStart, e, 0.071 * k, 0.062 * k, 0.6, 0.2), smooth: true },
    { pts: ellipsePts(e, V(0.033 * k, 0), V(0, 0.033 * k), 12), smooth: true },
    { pts: taperQuad(e, w, 0.076 * k, 0.054 * k, 0.012 * k, 0.002 * k), smooth: true },
  ];
  const hs = handShapes(A, proj);
  const all = skin.concat(hs.shapes);
  const sl = o.sleeve ? sleeveShape(A, t) : null;
  const path = drawUnion(all, { fill: PAL.skin, rim: PAL.skinRim, rimW: 3, lineW: 2.1, line: PAL.line });
  // knuckles and finger separations: short strokes inside the silhouette only
  const see = dot3(hs.pn, n3(s3(A.W, BOY_CAM))) > 0.35 && len(sub(proj(hs.fingerTips[1]), proj(hs.fingerBases[1]))) > 11;
  ctx.save();
  ctx.clip(path);
  const sep = new Path2D();
  for (let i = 0; i < (see ? 3 : 0); i++) {
    const a = proj(hs.fingerBases[i]), b = proj(hs.fingerBases[i + 1]), m = vlerp(a, b, 0.5);
    const ta = proj(hs.fingerTips[i]), tb2 = proj(hs.fingerTips[i + 1]), tm = vlerp(ta, tb2, 0.5);
    const q = vlerp(m, tm, 0.8);
    sep.moveTo(m.x, m.y); sep.lineTo(q.x, q.y);
  }
  ink(sep, 1.0, 'rgba(62,34,52,0.75)');
  ctx.restore();
  if (sl) {
    const sp = curvePath(sl);
    ctx.save();
    ctx.lineWidth = 4.4; ctx.strokeStyle = PAL.line; ctx.lineJoin = 'round';
    ctx.stroke(sp);
    ctx.restore();
    fillRim(sp, PAL.shirt, PAL.shirtRim, 3.5, LIGHT, bboxOf(sl, 8));
    rimOnly(sp, PAL.shirtFold, 8, V(-0.96, 0.28), bboxOf(sl, 8));
  }
  drawCuff(A, t);
}
function drawCuff(A, t) {
  const proj = (p) => projB(p, t);
  const s = proj(A.S), e = proj(A.E);
  const d = norm(sub(e, s)), n = perp(d);
  const k = pxPerM(e.z);
  const cw = 0.084 * k;
  const a = vlerp(s, e, 0.5), b = vlerp(s, e, 0.62);
  const cuff = [add(a, mul(n, cw / 2)), add(vlerp(a, b, 0.5), mul(n, cw / 2 + 0.6)), add(b, mul(n, cw / 2 - 1)), sub(b, mul(n, cw / 2 - 1)), sub(vlerp(a, b, 0.5), mul(n, cw / 2 + 0.6)), sub(a, mul(n, cw / 2))];
  const cp = curvePath(cuff);
  fillRim(cp, '#a79ecb', PAL.shirtRim, 2.5, LIGHT, bboxOf(cuff, 6));
  ink(cp, 1.9);
  const fold = new Path2D();
  const f1 = add(vlerp(a, b, 0.5), mul(n, cw * 0.42)), f2 = sub(vlerp(a, b, 0.5), mul(n, cw * 0.42));
  fold.moveTo(f1.x, f1.y); fold.quadraticCurveTo(vlerp(a, b, 0.62).x, vlerp(a, b, 0.62).y, f2.x, f2.y);
  ink(fold, 1.1, PAL.shirtFold);
}

// ------------------------------------------------------------------ torso (the shirt from behind)
function armUp(A) {
  const u = n3(s3(A.E, A.S));
  return sstep(0.5, 2.5, Math.acos(clamp(-u.y, -1, 1)));
}
function torsoShape(R, t, tc) {
  const { S, P } = R;
  const upL = armUp(R.L), upR = armUp(R.R);
  const wd = windAt(tc);
  // the loose hem ripples in the wind: a wave running along it downwind (on the boy's twos)
  const flut = (k, a) => (Math.sin(tc * 6.1 + k) + 0.45 * Math.sin(tc * 10.7 + k * 1.9)) * a * 1.7 * (0.6 + 0.4 * wd);
  const hemLift = 0.028 * (upL + upR) / 2;
  const billowL = 0.018 * wd + flut(0.3, 0.007);   // the downwind side of the shirt fills out
  const pressR = -0.004 * wd;
  const shL = P.shL + 0.03 * upL, shR = P.shR + 0.03 * upR;
  // hands on the hips gather the loose shirt in at the waist, under each hand
  const wrL = clamp(R.L.tmix || 0, 0, 1), wrR = clamp(R.R.tmix || 0, 0, 1);
  const zb = -0.095;
  const C = (x, y) => toP(S.chest, V3(x, y, zb));
  const Wf = (x, y) => toP(S.waist, V3(x, y, zb));
  const Pf = (x, y) => toP(S.pel, V3(x, y, zb + 0.01));
  // an arm reaching forward still leaves its shoulder cap in the outline (a deltoid under the
  // sleeve), or the figure reads one-armed from behind
  const fwL = armForward(R.L) ? 1 : 0, fwR = armForward(R.R) ? 1 : 0;
  const pts3 = [
    // a raised arm takes the shoulder's corner with it: the corner tucks under the sleeve and the
    // side runs straight down from the armpit (no point left standing out past the sleeve).
    // Shoulders slope from the neck (trapezius) and round over the deltoid; the waist tapers.
    // A raised arm also lifts the top of the shoulder (the trapezius bunches between neck and
    // arm); without it the arm seemed to grow out of the side of the neck.
    C(-0.056, 0.155), C(-0.1, 0.137 + shL * 0.55 + 0.04 * upL * upL), C(-0.14 + 0.008 * upL, 0.115 + shL + 0.045 * upL * upL), C(-0.166 + 0.02 * upL - 0.008 * fwL, 0.08 + shL * 0.8 + upL * 0.03),
    C(-0.158 + upL * 0.008 - 0.004 * fwL, 0.012 + upL * 0.04), Wf(-0.14 - billowL * 0.4, 0.1), Wf(-0.128 - billowL, 0.0),
    Wf(-0.134 - billowL * 0.9 + 0.013 * wrL, -0.095), Pf(-0.143 - billowL, 0.02), Pf(-0.153 - billowL * 1.4 + flut(1, 0.011), -0.074 + hemLift + flut(1.7, 0.006)),
    Pf(-0.1, -0.1 + hemLift + flut(2, 0.004)), Pf(0, -0.124 + hemLift + flut(2.8, 0.004)), Pf(0.1, -0.1 + hemLift + flut(3.6, 0.003)),
    Pf(0.15 + pressR + flut(4.2, 0.003), -0.076 + hemLift), Pf(0.142 + pressR, 0.02), Wf(0.132 + pressR - 0.013 * wrR, -0.095), Wf(0.127 + pressR, 0.0), Wf(0.138, 0.1),
    C(0.158 - upR * 0.008 + 0.004 * fwR, 0.012 + upR * 0.04), C(0.166 - 0.02 * upR + 0.008 * fwR, 0.08 + shR * 0.8 + upR * 0.03), C(0.14 - 0.008 * upR, 0.115 + shR + 0.045 * upR * upR), C(0.1, 0.137 + shR * 0.55 + 0.04 * upR * upR), C(0.056, 0.155),
  ];
  return { pts: pts3.map((p) => projB(p, t)), upL, upR, shL, shR, C, Wf, Pf };
}
function drawTorso(R, t, tc, sleeves) {
  const T = torsoShape(R, t, tc);
  const shapes = [{ pts: T.pts }].concat(sleeves.map((s) => ({ pts: s })));
  const path = drawUnion(shapes, { fill: PAL.shirt, rim: PAL.shirtRim, rimW: 4, lineW: 2.5, line: PAL.line });
  const bb = bboxOf(allPts(shapes), 12);
  const P2 = (p) => projB(p, t);
  ctx.save();
  ctx.clip(path);
  // cel shade on the side away from the sun: a broad band on the body, a narrow one down each
  // raised sleeve that stops at the armhole seam (a union-wide band left a hard-edged block)
  const torsoOnly = unionPath([{ pts: T.pts }]);
  rimOnly(torsoOnly, PAL.shirtFold, 22, V(-0.96, 0.28), bb);
  for (const sl of sleeves) rimOnly(unionPath([{ pts: sl }]), PAL.shirtFold, 7, V(-0.96, 0.28), bboxOf(sl, 12), torsoOnly);
  // light through the thin cotton along the lit edge
  ctx.filter = 'blur(6px)';
  const e1 = P2(T.C(0.19, 0.08)), e2 = P2(T.Pf(0.165, -0.1));
  ctx.strokeStyle = 'rgba(255,214,184,0.42)';
  ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();
  ctx.filter = 'none';
  // yoke seam across the shoulders, spine crease, set-in sleeve seams, tension folds from raised arms
  const y1 = P2(T.C(-0.135, 0.105 + T.shL * 0.5)), y2 = P2(T.C(0, 0.09)), y3 = P2(T.C(0.135, 0.105 + T.shR * 0.5));
  const yoke = new Path2D(); yoke.moveTo(y1.x, y1.y); yoke.quadraticCurveTo(y2.x, y2.y + 6, y3.x, y3.y);
  ink(yoke, 1.3, 'rgba(95,86,135,0.75)');
  const c1 = P2(T.C(0.004, 0.07)), c2 = P2(T.Wf(0.01, 0.12)), c3 = P2(T.Pf(0.0, -0.02));
  const crease = new Path2D(); crease.moveTo(c1.x, c1.y); crease.quadraticCurveTo(c2.x, c2.y, c3.x, c3.y);
  ink(crease, 1.6, 'rgba(98,89,140,0.7)');
  for (const [A, sg] of [[R.L, -1], [R.R, 1]]) {
    // the sleeve's seam round the top of the shoulder (also when the arm reaches forward: the
    // shoulder cap is still sleeve)
    const a = P2(T.C(sg * 0.125, 0.125 + (sg < 0 ? T.shL : T.shR))), b = P2(T.C(sg * 0.16, 0.06)), c = P2(T.C(sg * 0.15, 0.0 + armUp(A) * 0.08));
    const sm = new Path2D(); sm.moveTo(a.x, a.y); sm.quadraticCurveTo(b.x, b.y, c.x, c.y);
    ink(sm, 1.4, 'rgba(95,86,135,0.8)');
  }
  for (const [up, sg] of [[T.upL, -1], [T.upR, 1]]) {
    if (up < 0.15) continue;
    for (const [a, b, c] of [[[0.15, 0.02], [0.08, -0.06], [0.02, -0.16]], [[0.135, -0.06], [0.075, -0.14], [0.045, -0.26]]]) {
      const p1 = P2(T.C(sg * a[0], a[1])), p2 = P2(T.C(sg * b[0], b[1])), p3 = P2(T.C(sg * c[0], c[1]));
      const fp = new Path2D(); fp.moveTo(p1.x, p1.y); fp.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
      ink(fp, 2.2 * up, `rgba(95,86,135,${(0.7 * up).toFixed(3)})`);
    }
  }
  // cel shadows, hard-edged as in a drawn cel: the loose cotton hangs in folds from the shoulder
  // blades to the hem (swayed by the wind), and the yoke throws a thin shadow under itself
  for (const [x, k, w] of [[-0.075, 0, 0.018], [0.045, 1.3, 0.014], [-0.012, 2.1, 0.01]]) {
    const sway = 0.02 * WIND_DIR * windAt(tc) + Math.sin(tc * 5.2 + k) * 0.006;
    const a = P2(T.C(x + 0.01, 0.045)), b = P2(T.Pf(x + sway, -0.085 + 0.028 * (T.upL + T.upR) / 2));
    const d = norm(sub(b, a)), n = perp(d), L = len(sub(b, a)), kk = pxPerM(a.z);
    const m1 = add(vlerp(a, b, 0.42), mul(n, w * kk)), m2 = sub(vlerp(a, b, 0.5), mul(n, w * kk * 0.35));
    const fold = curvePath([a, m1, add(b, mul(d, -L * 0.02)), m2], true, new Path2D(), new Set([0, 2]));
    ctx.fillStyle = 'rgba(96,86,140,0.55)';
    ctx.fill(fold);
  }
  const ys = [P2(T.C(-0.13, 0.1 + T.shL * 0.5)), P2(T.C(-0.06, 0.082)), P2(T.C(0.0, 0.08)), P2(T.C(-0.07, 0.07))];
  ctx.fillStyle = 'rgba(96,86,140,0.4)';
  ctx.fill(curvePath(ys, true, new Path2D(), new Set([0, 2])));
  // the cloth pulled toward each hand on the hip: two short folds fanning in from under the thumb
  for (const A of [R.L, R.R]) {
    const wr = clamp(A.tmix || 0, 0, 1);
    if (wr < 0.3) continue;
    const w0 = P2(A.W), mid = P2(T.Pf(0, 0.05)), k = pxPerM(w0.z);
    const inw = norm(V(mid.x - w0.x, 0)), up = V(0, -1);
    const fp = new Path2D();
    for (const [dy, len1] of [[-0.03, 0.06], [0.025, 0.05]]) {
      const a = add(add(w0, mul(inw, 0.012 * k)), mul(up, -dy * k * 0.3));
      const b = add(add(a, mul(inw, len1 * k)), mul(up, dy * k));
      fp.moveTo(a.x, a.y); fp.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - dy * k * 0.2, b.x, b.y);
    }
    ink(fp, 1.5, `rgba(90,80,130,${(0.85 * wr).toFixed(3)})`);
  }
  // drag folds gathering at the untucked hem, pushed by the wind
  for (const x of [-0.11, -0.035, 0.065]) {
    const a = P2(T.Pf(x, -0.02)), b = P2(T.Pf(x - 0.015 * windAt(tc), -0.1 + 0.028 * (T.upL + T.upR) / 2));
    const fp = new Path2D(); fp.moveTo(a.x, a.y); fp.quadraticCurveTo(a.x - 3, (a.y + b.y) / 2, b.x, b.y);
    ink(fp, 1.4, 'rgba(95,86,135,0.55)');
  }
  ctx.restore();
}

// ------------------------------------------------------------------ legs (only the tops show)
function drawLegs(R, t) {
  const { S } = R;
  const P2 = (p) => projB(p, t);
  for (const sg of [-1, 1]) {
    const top = P2(toP(S.pel, V3(sg * 0.078, 0.02, -0.02)));
    const bot = P2(toP(S.pel, V3(sg * 0.088, -0.5, 0.02)));
    const k = pxPerM(top.z);
    const q = taperQuad(top, bot, 0.14 * k, 0.115 * k, sg < 0 ? 1.5 : 0.5, 0.2);
    const path = curvePath(q);
    fillRim(path, PAL.trousers, '#ffc79a', 2.5, LIGHT, bboxOf(q, 6));
    ink(path, 2.1);
  }
}

// ------------------------------------------------------------------ collar
function collarPts(R, t) {
  const C = (x, y, z = -0.06) => projB(toP(R.S.chest, V3(x, y, z)), t);
  return [C(-0.07, 0.152, -0.04), C(-0.05, 0.168), C(0, 0.178, -0.075), C(0.05, 0.168), C(0.07, 0.152, -0.04), C(0.052, 0.146), C(0, 0.148, -0.08), C(-0.052, 0.146)];
}
function drawCollar(R, t) {
  // the collar stands round the back of the neck
  const col = collarPts(R, t);
  const cp = curvePath(col);
  fillRim(cp, '#a39ac6', PAL.shirtRim, 3, LIGHT, bboxOf(col, 6));
  ink(cp, 2);
}

// ------------------------------------------------------------------ the head
// A 3-D proxy, projected. From behind: hair over the skull, the face mass hidden behind it
// except where it turns out past the silhouette (the lost profile), ears as flaps standing
// off the sides, and a four-sided do‘ppi hugging the crown.
function earFlap(Hd, sg, HS, proj) {
  // frame on the side of the head: f = toward the face, u = up, o = out
  const c = m3(V3(sg * SKULL.r.x * 0.97, EAR.y, EAR.z), HS);
  const f = V3(0, 0, 1), u = V3(0, 1, 0), o = V3(sg, 0, 0);
  const at = (df, du, dout) => proj(toP(Hd, a3(c, m3(a3(a3(m3(f, df), m3(u, du)), m3(o, dout)), HS))));
  const pts = [], rim = [];
  // attached along the front edge; the free rim sweeps back and stands out from the head
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI;
    const back = Math.pow(Math.cos(a), a < 0 ? 0.55 : 1) * EAR.w, up = Math.sin(a) * EAR.h * 0.5;
    const p = at(0.006 - back, up, Math.cos(a) * EAR.stick);
    pts.push(p); rim.push(p);
  }
  pts.push(at(0.008, EAR.h * 0.3, 0), at(0.008, -EAR.h * 0.3, 0));
  const nrm = dirP(Hd, n3(V3(sg * 0.8, 0, -0.6)));
  const inner = [at(-0.006, 0.018, 0.008), at(-0.014, 0.004, 0.011), at(-0.01, -0.014, 0.009)];
  return { sg, pts, rim, nrm, inner, anchor: toP(Hd, m3(c, 1)) };
}
function faceHull(Hd, HS, proj) {
  const pts = [];
  for (const [x, y, z, r] of FACE_BLOBS) {
    for (const sg of x === 0 ? [1] : [1, -1]) {
      const pc = proj(toP(Hd, m3(V3(sg * x, y, z), HS)));
      const rr = pxPerM(pc.z) * r * HS;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; pts.push(V(pc.x + Math.cos(a) * rr, pc.y + Math.sin(a) * rr)); }
    }
  }
  return smoothLoop(hull(pts), 40, 2);
}
// The neck from behind: narrowest in the middle, flaring at the top into the base of the skull
// behind the ears (the muscles that hold the head) and at the bottom into the shoulders. Rings
// [frame, y, half-width, half-depth, z offset] in metres; each pair of rings is one frustum,
// whose outline is the hull of the two projected rings. (A flat quad narrower than the skull
// left the bottom of the head standing out over the neck: a notch at each side.)
function neckShapes(R, proj) {
  const N = R.H.neck, Hd = R.H.head;
  const rings = [[N, -0.02, 0.06, 0.052, -0.005], [N, 0.03, 0.049, 0.047, 0], [N, 0.07, 0.051, 0.05, -0.004],
    [Hd, 0.0, 0.057, 0.054, -0.012], [Hd, 0.03, 0.062, 0.058, -0.016]];
  const P = rings.map(([F, y, hx, hz, zo]) => {
    const pts = [];
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; pts.push(proj(toP(F, V3(Math.cos(a) * hx, y, zo + Math.sin(a) * hz)))); }
    return pts;
  });
  const shapes = [];
  for (let i = 0; i + 1 < P.length; i++) shapes.push({ pts: hull(P[i].concat(P[i + 1])), smooth: false });
  return shapes;
}
function headParts(R, t) {
  const Hd = R.H.head;
  const HS = BODY.HS;
  const sc = (v) => m3(v, HS);
  const proj = (p) => projB(p, t);
  return {
    Hd, proj, HS,
    skull: ellipsoidPts(Hd, sc(SKULL.c), sc(SKULL.r), proj, 32),
    occ: ellipsoidPts(Hd, sc(OCC.c), sc(OCC.r), proj, 24),
    face: faceHull(Hd, HS, proj),
    neck: neckShapes(R, proj),
    ears: [1, -1].map((sg) => earFlap(Hd, sg, HS, proj)),
  };
}
function drawEar(e, facing) {
  const p = curvePath(e.pts);
  // only the ear on the sun's side catches a rim; on the far ear an inner rim read as a lit eye
  fillRim(p, facing ? '#86505f' : '#7c4a59', e.sg > 0 ? '#ffb48c' : null, 2.4, LIGHT, bboxOf(e.pts, 6));
  ink(p, 1.3, 'rgba(33,26,48,0.75)');
  ink(curvePath(e.rim, false), 2);
  if (facing) ink(curvePath(e.inner, false), 1, 'rgba(70,40,58,0.8)');
}
// Where the hair ends on the skull, all the way round (head frame, before scaling): lowest at
// the middle of the nape, rising behind the ears, over the ears, and highest at the forehead.
// th: 0 = his right side, pi/2 = the back, pi = his left side, 3pi/2 = the front.
const hairlineY = (th) => {
  const c = Math.cos(th - Math.PI / 2);                   // 1 at the back, 0 at the sides, -1 in front
  const base = -0.01 + 0.058 * Math.pow(Math.max(0, 1 - c), 1.3);
  // round each ear the hair is cut higher (the ear sits in bare skin); behind it the hair drops
  const ear = (d) => 0.03 * Math.exp(-((d / 0.24) ** 2));
  const dR = Math.atan2(Math.sin(th), Math.cos(th)), dL = Math.atan2(Math.sin(th - Math.PI), Math.cos(th - Math.PI));
  return Math.min(0.15, base + ear(dR) + ear(dL));
};
// The back of the head is the union of the skull and the occiput: a point on its outer surface
// at azimuth th and height y (head frame, unscaled) is the farther of the two ray hits.
const OCC = { c: V3(0, 0.045, -0.035), r: V3(0.066, 0.07, 0.07) };
function headSurf(th, y, k = 1.01) {
  const ax = V3(0, y, -0.02), d = V3(Math.cos(th), 0, -Math.sin(th));
  let best = -1;
  for (const E of [SKULL, OCC]) {
    const o = s3(ax, E.c);
    const A = (d.x / E.r.x) ** 2 + (d.z / E.r.z) ** 2;
    const B = 2 * ((o.x * d.x) / E.r.x ** 2 + (o.z * d.z) / E.r.z ** 2);
    const C = (o.x / E.r.x) ** 2 + (o.y / E.r.y) ** 2 + (o.z / E.r.z) ** 2 - 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0) continue;
    best = Math.max(best, (-B + Math.sqrt(disc)) / (2 * A));
  }
  return best < 0 ? null : a3(ax, m3(d, best * k));
}
// The hair's region on screen: every point of the head above the hairline, projected; from any
// view that is one convex shape (a cap cut by a U), so its hull is exact enough.
function hairRegion(Hd, HS, proj) {
  const pts = [];
  const top = SKULL.c.y + SKULL.r.y;
  for (let i = 0; i < 40; i++) {
    const th = (i / 40) * TAU, y0 = hairlineY(th);
    for (let j = 0; j <= 7; j++) {
      const q = headSurf(th, lerp(y0, top - 0.004, j / 7));
      if (q) pts.push(proj(toP(Hd, m3(q, HS))));
    }
  }
  pts.push(proj(toP(Hd, m3(V3(0, top, SKULL.c.z), HS))));
  return hull(pts);
}
// the nape part of the hairline (behind one ear round to the other), for the tufts; each point
// knows whether it faces us (a tuft on the far side of the head would float on the skin)
function hairlinePts(Hd, HS, proj) {
  const pts = [];
  for (let k = 0; k <= 18; k++) {
    const th = lerp(0.3, Math.PI - 0.3, k / 18);
    const q = headSurf(th, hairlineY(th) + 0.002 * Math.sin(k * 2.3));
    if (!q) continue;
    const W3 = toP(Hd, m3(q, HS)), nrm = dirP(Hd, V3(Math.cos(th), -0.3, -Math.sin(th)));
    const p = proj(W3);
    p.seen = dot3(nrm, s3(W3, BOY_CAM)) < -0.02;
    pts.push(p);
  }
  return pts;
}
// In a lost profile the eye itself is hidden, but the tips of the lashes break the cheek line:
// the cue that says "a face is there, turned away". Drawn where the outer corner of the eye comes
// within a few pixels of the outline, outside the back of the head, fading in with the turn.
function drawLashes(HP, outline, headP) {
  const { Hd, HS, proj } = HP;
  const skullP = unionPath([{ pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  const upv = norm(sub(proj(toP(Hd, V3(0, 0.3, 0))), proj(Hd.o)));
  for (const sg of [-1, 1]) {
    const e = proj(toP(Hd, m3(V3(sg * EYE_CORNER.x, EYE_CORNER.y, EYE_CORNER.z), HS)));
    if (ctx.isPointInPath(skullP, e.x, e.y)) continue;           // behind the back of the head
    let bi = 0, bd = Infinity;
    for (let i = 0; i < outline.length; i++) { const d = len(sub(outline[i], e)); if (d < bd) { bd = d; bi = i; } }
    const a = clamp((7 - bd) / 3, 0, 1);
    if (a <= 0.02) continue;
    const n = outline.length, P = outline[bi];
    const tg = norm(sub(outline[(bi + 2) % n], outline[(bi - 2 + n) % n]));
    let nr = perp(tg);
    const probe = add(P, mul(nr, 2));
    if (ctx.isPointInPath(headP, probe.x, probe.y)) nr = mul(nr, -1);   // outward
    const along = dot(tg, upv) >= 0 ? tg : mul(tg, -1);                  // toward the brow
    const lash = new Path2D();
    for (const [o, L] of [[0, 4.2], [2.3, 3.2]]) {
      const b = add(P, mul(along, o)), tip = add(add(b, mul(nr, L)), mul(upv, L * 0.45));
      lash.moveTo(b.x - nr.x * 0.8, b.y - nr.y * 0.8);
      lash.quadraticCurveTo(b.x + nr.x * L * 0.6, b.y + nr.y * L * 0.6, tip.x, tip.y);
    }
    ctx.save();
    ctx.globalAlpha = a;
    ink(lash, 1.25, PAL.line);
    ctx.restore();
  }
}
function drawHead(R, t, tc) {
  const HP = headParts(R, t);
  const { Hd, proj, HS } = HP;
  // judged by the skull's surface where the ear sits, not the flap's own tilt, so an ear does
  // not flip between behind and in front of the hair as the head turns a little
  const facing = (e) => dot3(dirP(Hd, n3(V3(e.sg, 0.1, -0.25))), s3(e.anchor, BOY_CAM)) < 0;
  // The back of the shirt is nearer to us than the neck and the jaw: whatever of them lies over
  // the shirt's body is behind it (a neck drawn over the shirt showed as a brown tongue under the
  // collar, and a lowered jaw would hang over the shoulder).
  const T = torsoShape(R, t, tc);
  const behindShirt = new Path2D();
  behindShirt.rect(-50, -50, W + 100, H + 100);
  behindShirt.addPath(curvePath(T.pts));
  ctx.save();
  ctx.clip(behindShirt, 'evenodd');
  for (const e of HP.ears) if (!facing(e)) drawEar(e, false);
  // Head and neck are ONE skin body with ONE outline: skull, occiput, the face (its lost profile
  // past the ear) and the neck, traced as a single curve and smoothed, so the neck runs up into
  // the skull and the jaw in one line, as drawn (a separate neck quad under an outlined head left
  // a notch at each side of the neck). All of it is in shade: the sun is ahead of him.
  const parts = [{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }].concat(HP.neck);
  const outline = traceUnion(parts, 2.2);
  const headP = polyPath(outline);
  const obb = bboxOf(outline, 8);
  fillRim(headP, PAL.skinShade, PAL.skinRim, 2.4, LIGHT, obb);
  const hairPts = hairRegion(Hd, HS, proj);
  const hairPath = curvePath(hairPts);
  const nbp = proj(R.H.nb), pv = proj(R.H.pivot);
  const down = norm(sub(nbp, pv));
  ctx.save();
  ctx.clip(headP);
  // the hair's shadow on the skin just under it (a cel shadow, offset down the neck)
  ctx.save();
  ctx.translate(down.x * 3.5, down.y * 3.5);
  ctx.fillStyle = 'rgba(46,24,44,0.42)';
  ctx.fill(hairPath);
  ctx.restore();
  // The neck's sides where it passes in front of the jaw and the base of the skull: from the
  // collar up to just under the ear, fading out there. From behind the neck is nearer than the
  // jaw, so its edge is the line that separates them (without it head and neck read as one blob).
  const neckLine = polyPath(traceUnion(HP.neck, 1.6));
  ctx.clip(unionPath([{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }]));
  const notHair = new Path2D();
  notHair.rect(obb.x0 - 20, obb.y0 - 20, obb.x1 - obb.x0 + 40, obb.y1 - obb.y0 + 40);
  notHair.addPath(hairPath);
  ctx.clip(notHair, 'evenodd');
  const top = add(pv, mul(down, -0.035 * pxPerM(pv.z)));
  const g = ctx.createLinearGradient(nbp.x, nbp.y, top.x, top.y);
  g.addColorStop(0, 'rgba(33,26,48,0.85)');
  g.addColorStop(0.55, 'rgba(33,26,48,0.7)');
  g.addColorStop(1, 'rgba(33,26,48,0)');
  ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = g;
  ctx.stroke(neckLine);
  ctx.restore();
  ink(headP, 2.3);
  drawLashes(HP, outline, headP);
  ctx.restore();
  drawCollar(R, t);
  ctx.save();
  ctx.clip(behindShirt, 'evenodd');
  const notCollar = new Path2D();
  notCollar.rect(-50, -50, W + 100, H + 100);
  notCollar.addPath(curvePath(collarPts(R, t)));
  ctx.clip(notCollar, 'evenodd');          // hair tips at the nape go behind the collar
  // ... and the hair covers it above the hairline
  const hl = hairlinePts(Hd, HS, proj);
  const upv = sub(proj(toP(Hd, V3(0, 0.4, 0))), proj(Hd.o));
  const wd = windAt(tc);
  ctx.save();
  ctx.clip(headP);
  ctx.save();
  ctx.clip(hairPath);
  ctx.fillStyle = PAL.hair;
  ctx.fill(headP);
  rimOnly(headP, PAL.hairRim, 2.6, LIGHT, bboxOf(HP.skull.pts, 8));
  // strands: curves on the skull surface from the crown down to the nape
  const strands = new Path2D();
  for (const [a0, a1] of [[-0.55, -0.35], [-0.12, 0.05], [0.3, 0.45]]) {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const v = lerp(0.25, 0.92, k / 8);
      const az = lerp(a0, a1, k / 8) - Math.PI / 2;
      const rr = Math.sin(v * Math.PI * 0.85);
      const p = V3(Math.cos(az) * SKULL.r.x * rr * 0.98 + WIND_DIR * 0.003 * v * wd, SKULL.c.y + SKULL.r.y * Math.cos(v * Math.PI * 0.85), SKULL.c.z + Math.sin(az) * SKULL.r.z * rr * 0.98);
      pts.push(proj(toP(Hd, m3(p, HS))));
    }
    curvePath(pts, false, strands);
  }
  ink(strands, 1.2, 'rgba(78,68,110,0.75)');
  ctx.restore();
  // short tufts along the hairline, pushed by the wind (drawings on twos): they break the
  // edge where hair meets skin, so it reads as a haircut, not a helmet
  const tufts = new Path2D();
  const nT = 9;
  for (let i = 0; i < nT; i++) {
    const k = 2 + Math.round((i / (nT - 1)) * (hl.length - 5));
    const a1 = hl[k], a2 = hl[k + 1];
    if (!a1 || !a2 || !a1.seen || !a2.seen) continue;
    const m = vlerp(a1, a2, 0.5);
    const len1 = (0.45 + 0.35 * ((i * 7) % 3) / 2) * len(sub(a2, a1)) * 1.6;
    const sway = WIND_DIR * (1.2 + 0.8 * wd) + Math.sin(tc * 7.3 + i * 1.9) * 1.1;
    const down = norm(mul(upv, -1));
    const tip = add(add(m, mul(down, len1)), V(sway, 0));
    tufts.moveTo(add(a1, mul(upv, 0.02)).x, add(a1, mul(upv, 0.02)).y);
    tufts.quadraticCurveTo(vlerp(a1, tip, 0.6).x, vlerp(a1, tip, 0.6).y, tip.x, tip.y);
    tufts.quadraticCurveTo(vlerp(a2, tip, 0.55).x, vlerp(a2, tip, 0.55).y, add(a2, mul(upv, 0.02)).x, add(a2, mul(upv, 0.02)).y);
    tufts.closePath();
  }
  ctx.fillStyle = PAL.hair;
  ctx.fill(tufts);
  ctx.restore();
  // sideburns: hanging from the hairline just in front of each ear (only on a side we can see),
  // pushed a little by the wind. Rooted in the hair, never floating on the cheek.
  const sideT = [];
  for (const sg of [-1, 1]) {
    const th = sg > 0 ? -0.22 : Math.PI + 0.22;
    const y0 = hairlineY(sg > 0 ? 0 : Math.PI) - 0.006;
    const q0 = headSurf(th, y0);
    if (!q0) continue;
    const W3 = toP(Hd, m3(q0, HS));
    if (dot3(dirP(Hd, V3(Math.cos(th), 0, -Math.sin(th))), s3(W3, BOY_CAM)) > -0.02) continue;
    const s1 = proj(toP(Hd, m3(a3(q0, V3(0, 0.004, -0.01)), HS))), s2 = proj(toP(Hd, m3(a3(q0, V3(0, 0.004, 0.012)), HS)));
    const tp = proj(toP(Hd, m3(a3(q0, V3(sg * 0.004 + WIND_DIR * (0.004 * wd + 0.003 * Math.sin(tc * 8.1 + sg)), -0.03, 0.004)), HS)));
    sideT.push({ pts: [s1, tp, s2], smooth: true });
  }
  if (sideT.length) {
    ctx.save();
    ctx.clip(headP);
    ctx.fillStyle = PAL.hair;
    ctx.fill(unionPath(sideT));
    ctx.restore();
  }
  for (const e of HP.ears) if (facing(e)) drawEar(e, true);
  drawDoppi(Hd, HS, proj);
  ctx.restore();
}

// ------------------------------------------------------------------ the do‘ppi (Chust style)
// Black, four-sided, a white qalampir (pepper) on each side, white arches under the top edge,
// a stitched band (jiyak) at the bottom. Bottom and top are rounded squares that hug the head.
function doppiGeom(Hd, HS) {
  const loop = (y, hx, hz, ex, n = 48) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, c = Math.cos(a), s = Math.sin(a), e = 2 / ex;
      pts.push(toP(Hd, m3(V3(hx * Math.sign(c) * Math.pow(Math.abs(c), e), y, SKULL.c.z + hz * Math.sign(s) * Math.pow(Math.abs(s), e)), HS)));
    }
    return pts;
  };
  // round where it fits the head, square at the crown: the Chust cap's four corners
  return { bot: loop(SKULL.c.y + 0.047, 0.07, 0.086, 3.0), top: loop(SKULL.c.y + 0.095, 0.064, 0.076, 5.5), n: 48 };
}
const faceOf = (i, n) => Math.floor(((i / n) * 4 + 0.5)) % 4;      // 0 right, 1 front, 2 left, 3 back
// qalampir in face coordinates (u -1..1 across, v 0..1 up): a fat almond, round end low left,
// the tip high right and hooking over; leaf-like ribs inside, no "eye".
const QALAMPIR = [[0.36, 0.93], [0.4, 0.76], [0.34, 0.56], [0.21, 0.36], [0.02, 0.2], [-0.23, 0.12], [-0.42, 0.2], [-0.47, 0.41], [-0.37, 0.62], [-0.15, 0.77], [0.1, 0.85], [0.24, 0.96]];
const QAL_EDGE = [[-0.23, 0.12], [-0.42, 0.2], [-0.47, 0.41], [-0.37, 0.62], [-0.15, 0.77]];
const QAL_SPINE = [[0.04, 0.3], [-0.1, 0.43], [-0.09, 0.6], [0.08, 0.73]];
function drawDoppi(Hd, HS, proj) {
  const G = doppiGeom(Hd, HS);
  const n = G.n;
  const B = G.bot.map(proj), T = G.top.map(proj);
  const faces = [[], [], [], []];
  const vis = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const nrm = cross3(s3(G.top[i], G.bot[i]), s3(G.bot[j], G.bot[i]));     // outward
    const seen = dot3(nrm, s3(G.bot[i], BOY_CAM)) < 0;
    vis.push(seen);
    if (seen) faces[faceOf(i + 0.5, n)].push({ i, j });
  }
  const topSeen = dot3(dirP(Hd, V3(0, 1, 0)), s3(G.top[0], BOY_CAM)) < 0;
  const faceCol = ['#221b2f', '#15111c', '#120e19', '#18131f'];
  const polys = [];
  faces.forEach((strips, fi) => {
    if (!strips.length) return;
    const off = fi === 0 ? n / 2 : 0;
    strips.sort((a, b) => ((a.i + off) % n) - ((b.i + off) % n));
    const bot = [B[strips[0].i]].concat(strips.map((s) => B[s.j]));
    const top = [T[strips[0].i]].concat(strips.map((s) => T[s.j]));
    polys.push({ fi, pts: bot.concat(top.reverse()) });
  });
  const shapes = polys.map((p) => ({ pts: p.pts, smooth: false }));
  if (topSeen) shapes.push({ pts: T, smooth: false });
  ctx.save();
  ctx.lineWidth = 4.6; ctx.strokeStyle = PAL.line; ctx.lineJoin = 'round';
  ctx.stroke(unionPath(shapes));
  ctx.restore();
  const onFaceOf = (fi) => (u, v) => {
    const a0 = (fi * 0.25 - 0.125) * n;
    const s = ((lerp(a0, a0 + 0.25 * n, (u + 1) / 2) % n) + n) % n;
    const i0 = Math.floor(s), fr = s - i0, i1 = (i0 + 1) % n;
    return proj(l3(l3(G.bot[i0], G.bot[i1], fr), l3(G.top[i0], G.top[i1], fr), 0.1 + v * 0.82));
  };
  // Each side's embroidery is lit by how much that side turns to the low sun: the side toward it
  // shines, the back (toward us, away from the sun) is in shade. Two motifs never show as a
  // matched bright pair either side of a seam (which read as a pair of eyes).
  const faceN = [V3(1, 0, 0), V3(0, 0, 1), V3(-1, 0, 0), V3(0, 0, -1)];
  const MOTIF_SHADE = [150, 142, 172], MOTIF_LIT = [236, 226, 240];
  for (const p of polys) {
    const path = polyPath(p.pts);
    fillRim(path, faceCol[p.fi], p.fi === 0 ? PAL.doppiRim : null, 3.2, LIGHT, bboxOf(p.pts, 6));
    ctx.save();
    ctx.clip(path);
    const on0 = onFaceOf(p.fi);
    const on = (u, v) => on0(u * 0.84, 0.08 + v * 0.84);          // the motif a little smaller
    const lit = clamp(dot3(dirP(Hd, faceN[p.fi]), SUN_DIR) * 1.8 + 0.12, 0, 1);
    const mc = MOTIF_SHADE.map((c, k) => Math.round(lerp(c, MOTIF_LIT[k], lit)));
    const mp = curvePath(QALAMPIR.map(([u, v]) => on(u, v)));
    ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
    ctx.fill(mp);
    // the pepper pod's inner contour (a paisley's second line) and the curl of its stalk;
    // feather-like ribs made it read as a little wing
    const cu = QALAMPIR.reduce((a, [u]) => a + u, 0) / QALAMPIR.length, cv = QALAMPIR.reduce((a, [, v]) => a + v, 0) / QALAMPIR.length;
    const inner = curvePath(QALAMPIR.slice(2, 10).map(([u, v]) => on(lerp(cu, u, 0.55), lerp(cv, v, 0.55))), false);
    ink(inner, 1.1, PAL.doppi);
    // arches under the top edge
    const arch = new Path2D();
    for (let k = 0; k < 3; k++) {
      const u0 = -0.9 + k * 0.6, u1 = u0 + 0.6;
      const a = on(u0, 0.97), m = on((u0 + u1) / 2, 0.87), b = on(u1, 0.97);
      arch.moveTo(a.x, a.y); arch.quadraticCurveTo(m.x, m.y, b.x, b.y);
    }
    ink(arch, 1, 'rgba(226,220,239,0.75)');
    ctx.restore();
  }
  if (topSeen) {
    ctx.fillStyle = '#241d33';
    ctx.fill(polyPath(T));
  }
  // corner seams where two visible faces meet
  const seams = new Path2D();
  for (let k = 0; k < 4; k++) {
    const i = Math.round((k * 0.25 + 0.125) * n) % n;
    if (vis[i] && vis[(i - 1 + n) % n]) { seams.moveTo(B[i].x, B[i].y); seams.lineTo(T[i].x, T[i].y); }
  }
  ink(seams, 1.3, 'rgba(226,220,239,0.8)');
  // jiyak: the stitched band along the bottom edge, on visible strips
  const band = new Path2D();
  let open = false;
  for (let i = 0; i <= n; i++) {
    const ii = i % n;
    if (vis[ii] || vis[(ii - 1 + n) % n]) {
      const q = vlerp(B[ii], T[ii], 0.07);
      if (!open) { band.moveTo(q.x, q.y); open = true; } else band.lineTo(q.x, q.y);
    } else open = false;
  }
  ctx.save();
  ctx.lineWidth = 3.6; ctx.strokeStyle = '#2b2439'; ctx.stroke(band);
  ctx.setLineDash([1.8, 2.6]); ctx.lineWidth = 1.2; ctx.strokeStyle = PAL.motif; ctx.stroke(band);
  ctx.restore();
}

// ------------------------------------------------------------------ the whole boy
function drawBoy(t, tc, opts = {}) {
  const R = rig(tc, t);
  const held = SHEET.release > Math.round(tc * FPS) && !opts.noBird;
  const fwdL = armForward(R.L), fwdR = armForward(R.R);
  // behind his back from our side: arms reaching forward and the held pigeon, farthest first
  const behind = [];
  if (fwdL) behind.push({ z: Math.min(R.L.E.z, R.L.W.z), draw: () => drawArm(R.L, R, t, { sleeve: true }) });
  if (fwdR) behind.push({ z: Math.min(R.R.E.z, R.R.W.z), draw: () => drawArm(R.R, R, t, { sleeve: true }) });
  if (held) behind.push({ z: R.P.bird.z, draw: () => drawHeldBird(R, t, tc) });
  behind.sort((a, b) => b.z - a.z);
  for (const it of behind) it.draw();
  drawLegs(R, t);
  drawTorso(R, t, tc, [fwdL ? null : sleeveShape(R.L, t), fwdR ? null : sleeveShape(R.R, t)].filter(Boolean));
  if (!fwdL) drawArm(R.L, R, t);
  if (!fwdR) drawArm(R.R, R, t);
  drawHead(R, t, tc);
  return R;
}
function drawHeldBird(R, t, tc) {
  const P = R.P;
  const open = P.bOpen;
  const pose = open > 0.01 ? flapPose(0.0, 1.1) : GLIDE;
  drawPigeon(R.BF, (p) => projB(p, t), BOY_CAM, { pose, open, tail: 0.15 + open * 0.6, tailPitch: 0.1, headYaw: P.bHead, headPitch: 0.05 }, 'hero');
}
// Screen point + depth of the pigeon at the release frame (the sky world starts it from here).
// (Only the pose keys are needed: the full rig would ask where the pigeon is, which asks this.)
function boyReleaseScreen() {
  const tc = SHEET.release / FPS;
  const p = projB(boyPose(tc, tc).bird, tc);
  return { x: p.x, y: p.y, z: p.z };
}
