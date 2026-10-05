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
// ellipsoid read as a featureless balloon: no jaw line, no chin.) Placed as a child's face is:
// widest at the zygomatic arch just in front of the ear, the cheekbone and brow further forward
// and narrower, full cheeks, a small chin. (The cheekbone 5 cm forward of the ear and 7 cm out
// made a wide dome of the lost profile.) [x, y, z, radius]
const FACE_BLOBS = [
  [0.05, 0.058, 0.026, 0.01],     // zygomatic arch
  [0.043, 0.056, 0.05, 0.012],    // cheekbone
  [0.036, 0.08, 0.062, 0.012],    // outer brow
  [0.018, 0.09, 0.08, 0.012],     // brow
  [0.043, 0.028, 0.046, 0.014],   // cheek
  [0.037, 0.008, 0.056, 0.013],   // lower cheek, beside the mouth
  [0.042, 0.008, 0.008, 0.01],    // jaw angle, below and in front of the ear lobe
  [0.032, -0.012, 0.038, 0.01],   // jaw
  [0.022, -0.02, 0.058, 0.01],    // jaw, front
  [0.008, -0.028, 0.07, 0.01],    // chin: small, a boy's
  [0, 0.012, 0.082, 0.012],       // mouth
  [0, 0.04, 0.094, 0.009],        // nose tip: turned far round (past ~60 degrees) it rounds the cheek line out
];
// the outer corner of the eye: where the socket dips the cheek line in a lost profile
const EYE_CORNER = V3(0.044, 0.068, 0.06);
const EAR = { y: 0.058, z: 0.006, stick: 0.032 };      // centre on the side of the skull; how far the rim stands out

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
    tdirL: V3(0.66, -0.42, -0.62), tdirR: V3(-0.66, -0.42, -0.62), tmixL: 0, tmixR: 0, hipLock: 0,
    hYaw: -0.72, hPitch: -0.14, hRoll: 0.05, aim: 0,
    bird: V3(-0.3, 0.33, 0.13), bYaw: -Math.PI / 2 - 0.3, bPitch: 0.16, bRoll: 0.05, bOpen: 0, bHead: 0.0 },
  { f: 6, bHead: 0.55 },
  { f: 10, hold: true, root: V3(0, 0.004, 0), shL: 0.006, shR: 0.005, bird: V3(-0.3, 0.345, 0.13), bHead: 0.55 },
  // anticipation: a real crouch (knees), the pigeon lowered in front, the back fairly straight
  { f: 14, root: V3(-0.008, -0.082, 0.016), hipRoll: 0.018, lean: 0.1, bend: -0.024, twist: -0.2,
    bird: V3(-0.25, 0.075, 0.19), bYaw: -Math.PI / 2 - 0.13, bPitch: 0.02, bRoll: 0.08, bHead: -0.2,
    hYaw: -0.52, hPitch: -0.34, hRoll: 0.02 },
  { f: 16, hold: true, gripT: 0, root: V3(-0.01, -0.1, 0.02), hipRoll: 0.01, lean: 0.12, bend: -0.03, twist: -0.24,
    bird: V3(-0.24, 0.02, 0.2), bYaw: -Math.PI / 2 - 0.1, bPitch: -0.05, bRoll: 0.1, bHead: -0.25,
    hYaw: -0.47, hPitch: -0.38, hRoll: 0.02, poleL: V3(-0.6, -0.5, -0.8), poleR: V3(0.3, -0.6, 1), curlL: 0.5 },
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
  // down and forward round the hip, thumbs back along the belt line toward the spine, so from
  // behind each hand is a V: thumb across the back, hand down the side. (Before: the arms flung
  // out level, hung, then rose again; the hands hung off the hips like hooks; and with the fingers
  // level round the waist the hand pointed straight away from the lens, leaving only a wrist and
  // a thumb, which read as a finger pointing at his spine.)
  // The hands keep their backs to us as they fall (palms forward, as they were when they let the
  // pigeon go), thumbs along the hands; turned palm-down with the thumb hanging under, a flat hand
  // read as a foot in a boot. Near the hips the thumbs start to hook back for the waist.
  { f: 31, root: V3(0, 0.026, 0.009), lean: -0.1, wL: V3(-0.5, 0.74, 0.1), wR: V3(0.48, 0.74, 0.1), curlL: 0.25, curlR: 0.25,
    spreadL: 0.04, spreadR: 0.04, pnL: V3(0.2, -0.1, 1), pnR: V3(-0.2, -0.1, 1), hdL: V3(-0.7, 0.62, 0.1), hdR: V3(0.7, 0.62, 0.1),
    thumbL: 0.25, thumbR: 0.25, poleL: V3(-0.3, -1, -0.3), poleR: V3(0.3, -1, -0.3) },
  // at the fastest part of the fall the elbows give and the hands trail, bent back at the wrist
  // (arms locked straight with the hands in line read as a stiff T-pose)
  { f: 34, root: V3(0, 0.018, 0.008), lean: -0.09, wL: V3(-0.52, 0.36, 0.09), wR: V3(0.51, 0.35, 0.09),
    pnL: V3(0.1, -0.15, 1), pnR: V3(-0.1, -0.15, 1), hdL: V3(-0.8, 0.45, 0.15), hdR: V3(0.8, 0.45, 0.15), curlL: 0.3, curlR: 0.3,
    thumbL: 0.2, thumbR: 0.2, poleL: V3(-0.2, -1, -0.5), poleR: V3(0.2, -1, -0.5) },
  { f: 36, root: V3(0.002, 0.01, 0.006), lean: -0.07, wL: V3(-0.4, 0.13, 0.02), wR: V3(0.4, 0.12, 0.02),
    pnL: V3(0.45, -0.1, 1), pnR: V3(-0.45, -0.1, 1), hdL: V3(-0.72, -0.6, 0.2), hdR: V3(0.72, -0.6, 0.2), curlL: 0.34, curlR: 0.34,
    thumbL: 0.1, thumbR: 0.1, tmixL: 0.25, tmixR: 0.25, poleL: V3(-0.7, -0.4, -0.6), poleR: V3(0.7, -0.4, -0.6) },
  // halfway in, the hands drop straight down past the hips, backs still to us, thumbs along them;
  // they turn onto the hips in the next drawing (turning on the way, a flat hand read as a foot
  // and the thumb standing off the hand as a flipper)
  { f: 37, root: V3(0.003, 0.007, 0.005), lean: -0.06, hipRoll: 0.02, wL: V3(-0.32, 0.13, 0.0), wR: V3(0.32, 0.128, 0.0),
    pnL: V3(0.5, -0.1, 0.85), pnR: V3(-0.5, -0.1, 0.85), hdL: V3(-0.2, -0.95, 0.25), hdR: V3(0.2, -0.95, 0.25), curlL: 0.45, curlR: 0.45,
    thumbL: 0.05, thumbR: 0.05, tmixL: 0.12, tmixR: 0.12, spreadL: 0.045, spreadR: 0.045,
    poleL: V3(-0.85, -0.175, -0.525), poleR: V3(0.85, -0.175, -0.525) },
  // the wrists keep coming in and down to the hips (no lift before the contact), the hands turning
  // onto them as they arrive; the grip closes only at the contact, where the hands lock to the hips
  { f: 38, root: V3(0.004, 0.004, 0.004), lean: -0.05, hipRoll: 0.03, wL: V3(-0.235, 0.125, -0.025), wR: V3(0.235, 0.122, -0.025),
    pnL: V3(0.55, -0.15, 0.8), pnR: V3(-0.55, -0.15, 0.8), hdL: V3(-0.05, -0.85, 0.5), hdR: V3(0.05, -0.85, 0.5), curlL: 0.42, curlR: 0.42,
    thumbL: 0.1, thumbR: 0.1, tmixL: 0.25, tmixR: 0.25, spreadL: 0.05, spreadR: 0.05, poleL: V3(-1, 0.05, -0.45), poleR: V3(1, 0.05, -0.45) },
  { f: 39, root: V3(0.006, 0.004, 0.003), lean: -0.045, hipRoll: 0.038, bend: 0.004, shL: 0.011, shR: 0.0095,
    wL: V3(-0.176, 0.116, -0.04), wR: V3(0.18, 0.112, -0.039),
    pnL: V3(1, -0.3, 0.05), pnR: V3(-1, -0.3, 0.05), hdL: V3(0.33, -0.57, 0.75), hdR: V3(-0.33, -0.57, 0.75), curlL: 0.15, curlR: 0.15,
    thumbL: 0.45, thumbR: 0.45, tmixL: 1, tmixR: 1, hipLock: 0.75, poleL: V3(-1, 0.15, -0.4), poleR: V3(1, 0.15, -0.4) },
  { f: 40, root: V3(0.008, 0.004, 0.002), lean: -0.04, hipRoll: 0.045, bend: -0.014, shL: 0.016, shR: 0.014,
    wL: V3(-0.156, 0.112, -0.045), wR: V3(0.16, 0.107, -0.043), pnL: V3(1, -0.3, 0), pnR: V3(-1, -0.3, 0), hdL: V3(0.35, -0.55, 0.75), hdR: V3(-0.35, -0.55, 0.75),
    tmixL: 1, tmixR: 1, curlL: 0.15, curlR: 0.15, thumbL: 0.5, thumbR: 0.5, hipLock: 1, poleL: V3(-1, 0.2, -0.35), poleR: V3(1, 0.2, -0.35) },
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
// Hands on the hips, in the waist frame: wrist beside the hip (the left one pressed a little further
// in, it hovered off the shirt), palm in against the side, fingers down and forward round the hip.
const HIP_HOLD = {
  L: { w: V3(-0.145, -0.094, -0.047), pn: V3(0.952, -0.305, -0.005), hd: V3(0.342, -0.572, 0.746) },
  R: { w: V3(0.148, -0.101, -0.045), pn: V3(-0.963, -0.269, -0.005), hd: V3(-0.363, -0.559, 0.746) },
};

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
// A shot with its own acting sets BOY_POSE: (tc, t) -> the pose channels, as boyPose gives them
// (and P.hold(side, S, H), if set, a place for each hand to go: {w, pn, hd, k})
let BOY_POSE = null;
function rig(tc, t) {
  const P = (BOY_POSE || boyPose)(tc, t);
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
    // On the hips the hands hold on to the waist: target and hand direction are carried by the
    // waist frame, so the body's sway and weight shift move the hands with it (held in boy space,
    // the waist slid under hands that stayed put, and a gap opened between hand and shirt)
    const lock = clamp(P.hipLock || 0, 0, 1);
    if (lock > 0) {
      const HL = HIP_HOLD[side];
      wT = l3(wT, toP(S.waist, HL.w), lock);
      pn = l3(pn, dirP(S.waist, HL.pn), lock);
      hd = l3(hd, dirP(S.waist, HL.hd), lock);
    }
    if (P.hold) {
      const h = P.hold(side, S, Hf);
      if (h && h.k > 0) { wT = l3(wT, h.w, h.k); pn = l3(pn, h.pn, h.k); hd = l3(hd, h.hd, h.k); }
    }
    // (a shot may give the elbow's direction as a function of where the shoulder is: toward a place
    // for the elbow, which then stays put as the shoulder moves)
    const pv = side === 'L' ? P.poleL : P.poleR;
    const { E, Wr } = ik3(Sj, wT, BODY.upper, BODY.fore, typeof pv === 'function' ? pv(Sj) : pv);
    return { side, sg, S: Sj, E, W: Wr, pn: n3(pn), hd: n3(hd), curl: side === 'L' ? P.curlL : P.curlR, curls: side === 'L' ? P.curlsL : P.curlsR, spread: side === 'L' ? P.spreadL : P.spreadR, thumb: side === 'L' ? P.thumbL : P.thumbR,
      tdir: side === 'L' ? P.tdirL : P.tdirR, tmix: clamp(side === 'L' ? P.tmixL : P.tmixR, 0, 1), fist: side === 'L' ? P.fistL : P.fistR };
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

// a finger segment with a round, blunt end (capsule3 ends in a point)
function digit3(a, b, wa, wb, proj) {
  const pa = proj(a), pb = proj(b);
  const ka = pxPerM(pa.z) * wa / 2, kb = pxPerM(pb.z) * wb / 2;
  const L = len(sub(pb, pa));
  if (L < 0.6 * Math.max(ka, kb)) return capsule3(a, b, wa, wb, proj);
  const d = mul(sub(pb, pa), 1 / L), nn = perp(d);
  const tip = (u, v) => add(add(pb, mul(d, kb * u)), mul(nn, kb * v));
  return [add(pa, mul(nn, ka)), add(pb, mul(nn, kb)), tip(0.72, 0.72), tip(1, 0), tip(0.72, -0.72), sub(pb, mul(nn, kb)), sub(pa, mul(nn, ka)), sub(pa, mul(d, ka * 0.8))];
}

// ------------------------------------------------------------------ hands (finger chains)
// Palm, four fingers and thumb as one union with the forearm, traced as ONE outline (a union
// outlined part by part left steps at every knuckle, and a hull swapped in for fingers held
// together changed the hand's shape in one frame). The thumb sits on the side the anatomy puts
// it: back of the right hand toward us with fingers up -> thumb on the left.
// Parts are returned as `near` (always seen) and `far`: the fingers and the front of the palm,
// which, when the hand is on his hip, go round the front of the waist and so are hidden wherever
// the body is in front of them.
function handShapes(A, proj, waist) {
  const hd = A.hd;
  let pn = s3(A.pn, m3(hd, dot3(A.pn, hd)));
  pn = len3(pn) < 1e-4 ? V3(0, 0, 1) : n3(pn);
  const ts = A.sg > 0 ? cross3(pn, hd) : cross3(hd, pn);
  // wrap: how far the hand is wrapped round the body (hands on hips). Round the front of the
  // waist the fingers are out of sight; what shows from behind is the heel of the hand at his
  // side and the thumb on the back of the waist.
  // (a shot that sets A.fist, 0 or 1, turns the thumb with tdir/tmix too, round a pole: that is
  // not a wrap round his waist)
  const wrap = A.fist !== undefined ? 0 : clamp(A.tmix || 0, 0, 1);
  const palmL = 0.08, palmW = 0.076;
  const W0 = A.W;
  const k0 = a3(W0, m3(hd, palmL));
  // Hidden behind the body: the ray from the lens to the point crosses the waist first (the
  // waist as an ellipse in its horizontal plane, a loose shirt round a boy's middle). The back
  // of a hand lying on the side of the waist faces us past the body and stays in view; fingers
  // round the front go out of sight. (Sorting by depth alone hid the back of the hand as well, and
  // what was left, a wrist and a thumb, read as a finger pointing at his spine.)
  const camL = waist ? toL(waist, BOY_CAM) : null;
  const far = (p3) => {
    if (!waist) return false;
    const q = toL(waist, p3);
    const ea = 0.13, eb = 0.085, ez = -0.01;
    const cx = camL.x, cz = camL.z - ez, dx = q.x - camL.x, dz = q.z - camL.z;
    const A = (dx / ea) ** 2 + (dz / eb) ** 2, B = 2 * ((cx * dx) / ea ** 2 + (cz * dz) / eb ** 2), C = (cx / ea) ** 2 + (cz / eb) ** 2 - 1;
    const disc = B * B - 4 * A * C;
    if (disc <= 0) return false;
    const t0 = (-B - Math.sqrt(disc)) / (2 * A);
    return t0 > 0 && t0 < 0.995;
  };
  const near = [], hidden = [];
  const put = (shape, p3) => (far(p3) ? hidden : near).push(shape);
  const P = (p3) => proj(p3);
  const heel = [a3(W0, m3(ts, palmW * 0.34)), a3(a3(W0, m3(hd, palmL * 0.55)), m3(ts, palmW * 0.5)),
    a3(a3(W0, m3(hd, palmL * 0.5)), m3(ts, -palmW * 0.48)), a3(W0, m3(ts, -palmW * 0.38))];
  near.push({ pts: heel.map(P), smooth: true });
  const front = [a3(a3(W0, m3(hd, palmL * 0.4)), m3(ts, palmW * 0.5)), a3(k0, m3(ts, palmW * 0.48)),
    a3(k0, m3(ts, -palmW * 0.5)), a3(a3(W0, m3(hd, palmL * 0.4)), m3(ts, -palmW * 0.48))];
  put({ pts: front.map(P), smooth: true }, a3(W0, m3(hd, palmL * 0.75)));
  const fingerLens = [[0.041, 0.025, 0.02], [0.046, 0.028, 0.021], [0.043, 0.026, 0.02], [0.034, 0.02, 0.017]];
  const fingerTips = [], fingerBases = [], fingerJoints = [];
  for (let k = 0; k < 4; k++) {
    const off = (1.5 - k) * palmW * 0.25;           // index finger on the thumb side
    const base = a3(a3(k0, m3(ts, off)), m3(hd, -0.004 * Math.abs(1.5 - k)));
    // spread > 0 fans the fingers out: the index turns toward the thumb side, the little finger away
    const dir = rotAxis(hd, pn, (1.5 - k) * A.spread * (A.sg > 0 ? 1 : -1));
    const axis = n3(cross3(dir, pn));
    let p = base, ang = 0;
    // fingers held together press into each other (no gaps between them, only the tips part)
    const wid = [0.0185, 0.018, 0.017, 0.0155][k] * (1 + 0.16 * clamp(1 - A.spread / 0.12, 0, 1));
    const segs = [], joints = [base];
    for (let j = 0; j < 3; j++) {
      // (curls, if set: each finger its own curl, index first)
      ang += [0.55, 1.0, 0.8][j] * (A.curls ? A.curls[k] : A.curl) * 1.35 * (1 + 0.08 * (k - 1.5));
      const q = a3(p, m3(rotAxis(dir, axis, -ang), fingerLens[k][j]));
      segs.push({ pts: capsule3(p, q, wid * (1 - j * 0.1), wid * (0.92 - j * 0.12), proj), smooth: true });
      joints.push(q);
      p = q;
    }
    // the whole finger goes behind the body or not, judged at its middle (judged segment by
    // segment, a lone fingertip blinked on and off at the edge of the hip as he swayed)
    const fl = far(joints[2]) ? hidden : near;
    for (const sg2 of segs) fl.push(sg2);
    fingerTips.push(p);
    fingerBases.push(base);
    fingerJoints.push(joints);
  }
  // thumb from the heel of the palm on the thumb side, turned toward the palm
  const tb = a3(a3(W0, m3(hd, 0.018)), a3(m3(ts, palmW * 0.4), m3(pn, 0.01)));
  let td = n3(a3(a3(m3(hd, 0.75), m3(ts, 0.15 + 0.6 * (A.thumb ?? 0.5))), m3(pn, 0.22 + A.curl * 0.35)));
  // a thumb can be set to point a given way (hooked round the back of the waist, it is out of
  // the palm's plane, which the default thumb never leaves)
  if (A.tmix > 0 && A.tdir) td = n3(l3(td, n3(A.tdir), A.tmix));
  // On the back of the waist it lies flat along it: short, thick at the root (the ball of the
  // thumb) and blunt at the end. (A long tapered one with a pointed end, rim-lit at the tip, read
  // as a finger pointing at his spine.)
  const tl = 1 - 0.32 * wrap;
  const t1 = a3(tb, m3(td, 0.036 * tl));
  const t2 = a3(t1, m3(n3(a3(td, m3(pn, 0.25 + A.curl * 0.5 * (1 - wrap)))), 0.029 * tl));
  near.push({ pts: digit3(tb, t1, 0.021 + 0.004 * wrap, 0.018 - 0.001 * wrap, proj), smooth: true });
  near.push({ pts: digit3(t1, t2, 0.018 - 0.001 * wrap, 0.015, proj), smooth: true });
  // the web of skin between thumb and index finger: without it the thumb stood off the hand with
  // a gap, and a hand hanging with the thumb along it read as a pincer
  const web = [tb, l3(tb, t1, 0.8), a3(fingerBases[0], m3(hd, -0.012)), a3(a3(W0, m3(hd, palmL * 0.45)), m3(ts, palmW * 0.45))];
  near.push({ pts: web.map(P), smooth: true });
  return { near, far: hidden, fingerTips, fingerBases, fingerJoints, knuckle: k0, pn, ts, wrap };
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
  // a raised arm takes the sleeve's root up over the shoulder; a lowered one starts it below the
  // shoulder line, so the torso's own slope from the collar rounds into the sleeve (rooted at the
  // joint, the sleeve's top corner stood up past the shoulder line: a hump either side of the
  // collar that sank the head)
  const root = sub(s, mul(d, (0.018 - 0.045 * (1 - armUp(A))) * k0));
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
  // (o.part: 'upper' draws the upper arm's skin, elbow and cuff alone, 'fore' the forearm and hand
  // alone, each with its own outline: for an arm folded on itself in the picture, the forearm
  // going away from the lens behind the upper arm)
  const skinStart = vlerp(s, e, 0.56);
  const skinU = [
    { pts: taperQuad(skinStart, e, 0.071 * k, 0.062 * k, 0.6, 0.2), smooth: true },
    { pts: ellipsePts(e, V(0.033 * k, 0), V(0, 0.033 * k), 12), smooth: true },
  ];
  const skinF = [{ pts: taperQuad(e, w, 0.076 * k, 0.054 * k, 0.012 * k, 0.002 * k), smooth: true }];
  const skin = o.part === 'upper' ? skinU : o.part === 'fore' ? skinF : skinU.concat(skinF);
  const hs = handShapes(A, proj, o.body ? R.S.waist : null);
  const sl = o.sleeve && o.part !== 'fore' ? sleeveShape(A, t) : null;
  const hand = o.part === 'upper' ? [] : hs.near;
  const outline = traceUnion(skin.concat(hand), 1.3, o.body && hs.far.length && o.part !== 'upper' ? { shapes: hs.far, cover: o.body } : null);
  const path = polyPath(outline);
  // no rim light where the hand lies on the back of the shirt or against its side: the sun is
  // on the far side of his body, so there the hand is in the body's shadow (a rim on the thumb's
  // tip lit it up like a pointing finger)
  ctx.fillStyle = PAL.skin;
  ctx.fill(path);
  rimOnly(path, PAL.skinRim, 3, LIGHT, bboxOf(outline, 6), o.body || null, o.body ? 10 : 0);
  ink(path, 2.1);
  // (o.fold with the forearm drawn on its own, part 'fore': a forearm pointing away from the lens
  // hides part of the fist beyond it, and in one outline the two were a tube ending in the pole,
  // no wrist, no fist. The forearm's own edge is drawn across the fist where it covers it.)
  if (o.fold && o.part === 'fore') {
    const dF = len3(s3(m3(a3(A.E, A.W), 0.5), BOY_CAM)), dH = len3(s3(a3(A.W, m3(A.hd, 0.045)), BOY_CAM));
    if (dF < dH - 0.01) {
      const fq = polyPath(traceUnion(skinF, 1.3, null));
      ctx.save();
      ctx.clip(path);
      ink(fq, 1.7);
      ctx.restore();
    }
  }
  // knuckles and finger separations: short strokes inside the silhouette only
  const see = hs.wrap < 0.3 && dot3(hs.pn, n3(s3(A.W, BOY_CAM))) > 0.35 && len(sub(proj(hs.fingerTips[1]), proj(hs.fingerBases[1]))) > 11;
  const seps = (clipPath) => {
    ctx.save();
    ctx.clip(clipPath);
    const sep = new Path2D();
    for (let i = 0; i < (see ? 3 : 0); i++) {
      const a = proj(hs.fingerBases[i]), b = proj(hs.fingerBases[i + 1]), m = vlerp(a, b, 0.5);
      const ta = proj(hs.fingerTips[i]), tb2 = proj(hs.fingerTips[i + 1]), tm = vlerp(ta, tb2, 0.5);
      const q = vlerp(m, tm, 0.8);
      sep.moveTo(m.x, m.y); sep.lineTo(q.x, q.y);
    }
    // (a fist, A.fist, with the back of the hand to the lens: its fingers fold away from us, 3..10
    // px long in the picture, too short for the lines above, and it was drawn as a plain mitten.
    // The lines between the folded fingers run from the knuckles over the fold nearly to the second
    // joints, where the fist's far edge is; begun behind the knuckles they fanned out over the back
    // of the hand like scratches)
    if (!see && A.fist > 0.5 && o.part !== 'upper' && dot3(hs.pn, n3(s3(A.W, BOY_CAM))) > 0.35) {
      for (let i = 0; i < 3; i++) {
        const J = hs.fingerJoints[i], K = hs.fingerJoints[i + 1];
        const m = vlerp(proj(J[0]), proj(K[0]), 0.5), q = vlerp(proj(J[2]), proj(K[2]), 0.5), d = sub(q, m);
        if (len(d) < 2) continue;
        const a0 = add(m, mul(d, 0.05)), b0 = add(m, mul(d, 0.9));
        sep.moveTo(a0.x, a0.y); sep.lineTo(b0.x, b0.y);
      }
    }
    ink(sep, 1.0, 'rgba(62,34,52,0.75)');
    ctx.restore();
  };
  if (o.part !== 'upper') seps(path);
  if (sl) {
    const sp = curvePath(sl);
    ctx.save();
    ctx.lineWidth = 4.4; ctx.strokeStyle = PAL.line; ctx.lineJoin = 'round';
    ctx.stroke(sp);
    ctx.restore();
    fillRim(sp, PAL.shirt, PAL.shirtRim, 3.5, LIGHT, bboxOf(sl, 8));
    rimOnly(sp, PAL.shirtFold, 8, V(-0.96, 0.28), bboxOf(sl, 8));
  }
  if (o.part !== 'fore') drawCuff(A, t);
  // (o.fold: an arm bent back on itself with the forearm nearer the lens than the upper arm has
  // the forearm and hand drawn again over the upper arm, cuff and sleeve, with their own outline:
  // in one outline the bent arm was a mitten, the cuff floating in the middle of it)
  if (o.fold && !o.part) {
    const dU = len3(s3(m3(a3(A.S, A.E), 0.5), BOY_CAM)), dF = len3(s3(m3(a3(A.E, A.W), 0.5), BOY_CAM));
    if (dF < dU - 0.015) {
      const fore = [{ pts: taperQuad(e, w, 0.076 * k, 0.054 * k, 0.012 * k, 0.002 * k), smooth: true }].concat(hs.near);
      const ol = traceUnion(fore, 1.3, null);
      const fp = polyPath(ol);
      ctx.fillStyle = PAL.skin;
      ctx.fill(fp);
      rimOnly(fp, PAL.skinRim, 3, LIGHT, bboxOf(ol, 6));
      ink(fp, 2.1);
      seps(fp);
    }
  }
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
  const onHip = (A) => clamp(((A.tmix || 0) - 0.4) / 0.6, 0, 1);
  const wrL = onHip(R.L), wrR = onHip(R.R);
  // the wind cannot fill the shirt out under a hand that holds it at the waist
  const pinL = 1 - 0.8 * wrL;
  const zb = -0.095;
  const C = (x, y) => toP(S.chest, V3(x, y, zb));
  const Wf = (x, y) => toP(S.waist, V3(x, y, zb));
  const Pf = (x, y) => toP(S.pel, V3(x, y, zb + 0.01));
  // an arm reaching forward still leaves its shoulder cap in the outline (a deltoid under the
  // sleeve), or the figure reads one-armed from behind
  const fwL = (R.fwdL ?? armForward(R.L)) ? 1 : 0, fwR = (R.fwdR ?? armForward(R.R)) ? 1 : 0, cap = R.capOut ?? 0.008;
  const pts3 = [
    // a raised arm takes the shoulder's corner with it: the corner tucks under the sleeve and the
    // side runs straight down from the armpit (no point left standing out past the sleeve).
    // Shoulders slope from the neck (trapezius) and round over the deltoid; the waist tapers.
    // A raised arm also lifts the top of the shoulder (the trapezius bunches between neck and
    // arm); without it the arm seemed to grow out of the side of the neck.
    C(-0.056, 0.155), C(-0.1, 0.137 + shL * 0.55 + 0.04 * upL * upL), C(-0.14 + 0.008 * upL, 0.115 + shL + 0.045 * upL * upL), C(-0.166 + 0.02 * upL - cap * fwL, 0.08 + shL * 0.8 + upL * 0.03),
    C(-0.158 + upL * 0.008 - cap * 0.5 * fwL, 0.012 + upL * 0.04), Wf(-0.14 - billowL * 0.4, 0.1), Wf(-0.128 - billowL * pinL, 0.0),
    Wf(-0.134 - billowL * 0.9 * pinL + 0.013 * wrL, -0.095), Pf(-0.143 - billowL * pinL, 0.02), Pf(-0.153 - billowL * (1.4 - 0.6 * wrL) + flut(1, 0.011), -0.074 + hemLift + flut(1.7, 0.006)),
    Pf(-0.1, -0.1 + hemLift + flut(2, 0.004)), Pf(0, -0.124 + hemLift + flut(2.8, 0.004)), Pf(0.1, -0.1 + hemLift + flut(3.6, 0.003)),
    Pf(0.15 + pressR + flut(4.2, 0.003), -0.076 + hemLift), Pf(0.142 + pressR, 0.02), Wf(0.132 + pressR - 0.013 * wrR, -0.095), Wf(0.127 + pressR, 0.0), Wf(0.138, 0.1),
    C(0.158 - upR * 0.008 + cap * 0.5 * fwR, 0.012 + upR * 0.04), C(0.166 - 0.02 * upR + cap * fwR, 0.08 + shR * 0.8 + upR * 0.03), C(0.14 - 0.008 * upR, 0.115 + shR + 0.045 * upR * upR), C(0.1, 0.137 + shR * 0.55 + 0.04 * upR * upR), C(0.056, 0.155),
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
  // (R.reachFolds: an arm reaching across in front of him pulls the back of the shirt from that
  // shoulder blade toward the other hip, two drag folds as strong as the hand has crossed over:
  // with the whole arm hidden in front of him, a clean back and shoulder read as one-armed)
  // (as strong as the hand is across, in front of him and low: a hand raised in front of his face
  // pulls nothing across his back, and with both arms counted the folds crossed in a big X; and
  // set by the hand's place, not by which side of the body the arm is drawn, they fade in and out
  // with the reach instead of switching in one frame)
  if (R.reachFolds) {
    for (const [A, sg] of [[R.L, -1], [R.R, 1]]) {
      const across = clamp((-sg * A.W.x + 0.04) / 0.22, 0, 1) * clamp(A.W.z / 0.1, 0, 1) * clamp((0.6 - A.W.y) / 0.15, 0, 1);
      if (across < 0.02) continue;
      for (const [a, b, c] of [[[0.145, 0.05], [0.06, -0.03], [-0.05, -0.15]], [[0.13, -0.03], [0.05, -0.11], [-0.035, -0.25]]]) {
        const p1 = P2(T.C(sg * a[0], a[1])), p2 = P2(T.C(sg * b[0], b[1])), p3 = P2(T.C(sg * c[0], c[1]));
        const fp = new Path2D(); fp.moveTo(p1.x, p1.y); fp.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
        ink(fp, 2.0 * across, `rgba(95,86,135,${(0.65 * across).toFixed(3)})`);
      }
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
  // drag folds gathering at the untucked hem, pushed by the wind
  for (const x of [-0.11, -0.035, 0.065]) {
    const a = P2(T.Pf(x, -0.02)), b = P2(T.Pf(x - 0.015 * windAt(tc), -0.1 + 0.028 * (T.upL + T.upR) / 2));
    const fp = new Path2D(); fp.moveTo(a.x, a.y); fp.quadraticCurveTo(a.x - 3, (a.y + b.y) / 2, b.x, b.y);
    ink(fp, 1.4, 'rgba(95,86,135,0.55)');
  }
  ctx.restore();
  return T;
}

// ------------------------------------------------------------------ legs (only the tops show)
function drawLegs(R, t) {
  const { S } = R;
  const P2 = (p) => projB(p, t);
  for (const sg of [-1, 1]) {
    const top3 = toP(S.pel, V3(sg * 0.078, 0.02, -0.02));
    let bot3 = toP(S.pel, V3(sg * 0.088, -0.5, 0.02));
    // (R.plantFeet: his feet stay where they stand, so as his hips shift and dip the legs lean
    // and give from the feet up; carried with the pelvis they slid about under him like a
    // puppet's, the feet out of the picture but the legs never changing their slant)
    if (R.plantFeet) {
      const foot = V3(sg * 0.1, -0.8, 0.03), d = n3(s3(foot, top3));
      bot3 = a3(top3, m3(d, 0.52));
    }
    const top = P2(top3);
    const bot = P2(bot3);
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
// The ear is a thick shell, not a flat flap: a real ear seen edge-on is still a rolled rim and a
// bowl a centimetre deep, so it never thins to a slit (the flat flap came out as a slit, a dark
// tab or nothing at all as the head turned). A D-shaped outline in the side plane of the head:
// the front edge is attached, the free rim (helix, then lobe) stands out and back from the skull.
// [f forward, u up] in metres, unscaled; from the top of the root, over the helix, to the lobe.
const EAR_RIM = [[0.004, 0.024], [-0.002, 0.03], [-0.01, 0.031], [-0.018, 0.026], [-0.023, 0.017], [-0.025, 0.006],
  [-0.024, -0.005], [-0.02, -0.014], [-0.014, -0.021], [-0.007, -0.027], [0.001, -0.026], [0.005, -0.019]];
const EAR_ROOT = [[0.006, -0.012], [0.007, 0.0], [0.006, 0.014]];
function earShape(Hd, sg, HS, proj) {
  // frame on the side of the head: f = toward the face, u = up, o = out
  const c = V3(sg * SKULL.r.x * 0.97, EAR.y, EAR.z);
  const f = V3(0, 0, 1), u = V3(0, 1, 0), o = V3(sg, 0, 0);
  const k = EAR.stick / 0.031;                       // the free rim stands out ~20 mm at the back
  const nLat = n3(a3(o, m3(f, k)));                  // the outer (lateral) side of the shell
  const TH = 0.0045;                                 // half its thickness
  const W3 = (df, du, side = 0) => toP(Hd, m3(a3(a3(a3(c, m3(f, df)), m3(u, du)), a3(m3(o, k * Math.max(0, 0.006 - df)), m3(nLat, side * TH))), HS));
  const P = (df, du, side) => proj(W3(df, du, side));
  const all = [];
  for (const [df, du] of EAR_RIM.concat(EAR_ROOT)) for (const s of [-1, 1]) all.push(P(df, du, s));
  const ctr = W3(-0.008, 0.002);
  // which side of the shell faces us: the outer side (bowl, helix fold) or the back (root crease)
  const cosV = dot3(dirP(Hd, nLat), n3(s3(ctr, BOY_CAM)));
  const lateral = cosV < 0;
  const vis = lateral ? 1 : -1;
  const inset = (df, du, t) => [lerp(df, -0.008, t), lerp(du, 0.002, t)];
  return {
    sg, lateral, face: Math.min(1, Math.abs(cosV) * 1.6),
    outline: smoothLoop(hull(all), 28, 2),
    rim: EAR_RIM.map(([df, du]) => P(df, du, vis)),
    helix: EAR_RIM.slice(1, 8).map(([df, du]) => P(...inset(df, du, 0.3), vis)),
    concha: [[-0.004, 0.01], [-0.012, 0.004], [-0.011, -0.01], [-0.003, -0.012], [0.001, 0.0]].map(([df, du]) => P(df, du, vis)),
    root: [[0.003, 0.02], [0.0, 0.004], [0.001, -0.014]].map(([df, du]) => P(df, du, -1)),
    anchor: toP(Hd, m3(c, HS)),
  };
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
  // The throat: from the floor of the mouth, just behind the chin, down into the neck. With the
  // head tipped back to watch the sky it is the front edge of the neck, a slope from the chin to
  // the collar (without it the jaw ended in a flat step onto a vertical neck).
  const sub = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; sub.push(proj(toP(Hd, m3(V3(Math.cos(a) * 0.03, -0.022, 0.03 + Math.sin(a) * 0.032), BODY.HS)))); }
  return { rings: shapes, throat: { pts: hull(sub.concat(P[1])), smooth: false } };
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
    ...(({ rings, throat }) => ({ neck: rings, throat }))(neckShapes(R, proj)),
    ears: [1, -1].map((sg) => earShape(Hd, sg, HS, proj)),
  };
}
// The sun is ahead of him, so the ears are lit from behind: the thin rim glows warm through the
// skin while the bowl stays in shade. Seen from outside, the helix fold and the dark bowl; seen
// from behind, the crease where the ear meets the head.
const EAR_FILL = '#744257', EAR_LINE = 'rgba(52,26,42,0.85)';
function drawEar(e) {
  const p = curvePath(e.outline);
  const bb = bboxOf(e.outline, 6);
  // only the ear on the sun's side catches the rim light (on the far ear it read as a lit eye)
  fillRim(p, EAR_FILL, e.sg > 0 ? '#ffb48c' : null, 2.2, LIGHT, bb);
  ctx.save();
  ctx.clip(p);
  // (edge-on, the rim runs down the middle of a narrow shape: the glow is kept faint there; and
  // the ear on his left, away from the sun, is in the head's own shadow, so it barely glows)
  const glow = (0.22 + 0.3 * e.face) * (e.sg > 0 ? 1 : 0.45);
  ink(curvePath(e.rim, false), 2.8, `rgba(190,92,90,${glow.toFixed(3)})`);
  if (e.lateral) {
    ctx.fillStyle = 'rgba(58,28,44,0.55)';
    ctx.fill(curvePath(e.concha));
    ink(curvePath(e.helix, false), 1.15, EAR_LINE);
  } else {
    ink(curvePath(e.root, false), 1.4, 'rgba(52,26,42,0.6)');
  }
  ctx.restore();
  ink(p, 1.5);
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
// In a lost profile the eye itself is hidden, but the socket dips the cheek line a little under
// the brow: where the outline at the outer corner of the eye is the face's own edge (not the
// skull's), it gets that dip, so the lost profile is brow, socket, cheekbone, cheek, not a dome.
// (Lash tips breaking the line were tried twice, curled and straight: at this size, a head some
// 75 px tall, they are 2-4 px marks and read as a speck or a whisker, so like a long-shot model
// sheet the face is kept to its contour.)
function eyeNotch(HP, outline) {
  const { Hd, HS, proj } = HP;
  const skullP = unionPath([{ pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  const n = outline.length;
  const cen = mul(outline.reduce((acc, q) => add(acc, q), V(0, 0)), 1 / n);
  let out = outline;
  for (const sg of [-1, 1]) {
    const e = proj(toP(Hd, m3(V3(sg * EYE_CORNER.x, EYE_CORNER.y, EYE_CORNER.z), HS)));
    let bi = 0, bd = Infinity;
    for (let i = 0; i < n; i++) { const d = len(sub(out[i], e)); if (d < bd) { bd = d; bi = i; } }
    const P = out[bi];
    if (bd > 6 || ctx.isPointInPath(skullP, P.x, P.y)) continue;
    const tg = norm(sub(out[(bi + 2) % n], out[(bi - 2 + n) % n]));
    let nr = perp(tg);
    if (dot(nr, sub(P, cen)) < 0) nr = mul(nr, -1);                   // outward
    const R = 7.5, depth = 1.8 * clamp((6 - bd) / 3, 0, 1);
    out = out.map((q) => { const d = len(sub(q, P)); if (d >= R) return q; const w = (1 - (d / R) ** 2) ** 2; return sub(q, mul(nr, depth * w)); });
  }
  return out;
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
  const parts = [{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }, HP.throat].concat(HP.neck);
  const outline = eyeNotch(HP, traceUnion(parts, 2.2));
  const headP = polyPath(outline);
  const obb = bboxOf(outline, 8);
  // no rim light in the last few pixels above the collar: where hair, neck and collar meet, what
  // was left of it showed as a lone bright speck
  const colP = curvePath(collarPts(R, t));
  const nearCollar = new Path2D();
  nearCollar.addPath(colP);
  nearCollar.addPath(colP, new DOMMatrix([1, 0, 0, 1, 0, -3.5]));
  ctx.fillStyle = PAL.skinShade;
  ctx.fill(headP);
  rimOnly(headP, PAL.skinRim, 2.4, LIGHT, obb, nearCollar);
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
  const notHair = new Path2D();
  notHair.rect(obb.x0 - 20, obb.y0 - 20, obb.x1 - obb.x0 + 40, obb.y1 - obb.y0 + 40);
  notHair.addPath(hairPath);
  ctx.clip(notHair, 'evenodd');
  // The jaw's lower edge where it passes in front of the throat: with the head tipped back to
  // watch the sky it is the line that says "jaw". (With the chin down it lies on the collar, and
  // the line there read as a squiggle, so it comes in with the lift of the head.)
  // (and only once the face is turned well away from the back view: with the face behind the
  // head the jaw is behind the neck, and the line showed as a crease across the nape)
  const faceTurn = Math.acos(clamp(dot3(dirP(Hd, V3(0, 0, 1)), n3(s3(R.H.pivot, BOY_CAM))), -1, 1));
  const lift = clamp((R.H.pitch - 0.1) / 0.3, 0, 1) * sstep(0.6, 0.95, faceTurn);
  if (lift > 0) {
    ctx.save();
    ctx.clip(unionPath([HP.throat]));
    // Along the jaw from under the chin, fading in (from the notch under the chin it read as a
    // closed mouth) and fading out before the neck's edge crosses it (run on past, it made a cross
    // under the ear): the jaw goes on behind the neck, which is nearer to us.
    const side = sub(proj(toP(Hd, V3(0, 0, 0.1))), proj(Hd.o)).x < 0 ? -1 : 1;
    const bl = (b) => proj(toP(Hd, m3(V3(side * b[0], b[1], b[2]), HS)));
    const chin = bl(FACE_BLOBS[9]), angle = bl(FACE_BLOBS[6]);
    const jg = ctx.createLinearGradient(chin.x, chin.y, angle.x, angle.y);
    const ja = (k) => `rgba(33,26,48,${(0.95 * k * lift).toFixed(3)})`;
    jg.addColorStop(0, ja(0)); jg.addColorStop(0.17, ja(0)); jg.addColorStop(0.3, ja(1));
    jg.addColorStop(0.45, ja(0.9)); jg.addColorStop(0.58, ja(0)); jg.addColorStop(1, ja(0));
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = jg;
    ctx.stroke(curvePath(HP.face));
    ctx.restore();
  }
  ctx.clip(unionPath([{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }]));
  const top = add(pv, mul(down, -0.035 * pxPerM(pv.z)));
  const g = ctx.createLinearGradient(nbp.x, nbp.y, top.x, top.y);
  // (it fades out well before the ear: run up to under the ear at full strength it read as a
  // crease or seam the whole height of the neck)
  g.addColorStop(0, 'rgba(33,26,48,0.8)');
  g.addColorStop(0.4, 'rgba(33,26,48,0.6)');
  g.addColorStop(0.8, 'rgba(33,26,48,0)');
  ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = g;
  ctx.stroke(neckLine);
  ctx.restore();
  ink(headP, 2.3);
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
  rimOnly(headP, PAL.hairRim, 2.6, LIGHT, bboxOf(HP.skull.pts, 8), nearCollar);
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
  // (a shot can say which arms reach out in front of him, opts.forward(A); shot 1's rule is by the
  // elbow and how far the arm is raised)
  const fwd = opts.forward || armForward;
  const fwdL = fwd(R.L), fwdR = fwd(R.R);
  // (or, opts.forwardParts(A) -> {upper, fore}: the forearm and hand can be in front of him while
  // the upper arm hangs at his side; then the arm is drawn in two halves split across the elbow,
  // the forearm's before the body, the upper arm's after it)
  const part = (A) => (opts.forwardParts ? opts.forwardParts(A) : null);
  const pL = part(R.L), pR = part(R.R);
  const splitL = !!pL && !fwdL && !pL.upper && pL.fore, splitR = !!pR && !fwdR && !pR.upper && pR.fore;
  // (a split arm folded on itself in the picture, its elbow's angle there under 70 degrees, or
  // under the angle whose cosine opts.foldCos gives, is split into its parts instead, the forearm
  // and hand before the body and the upper arm after: cut across the elbow's angle, part of the
  // forearm fell on the upper arm's side and lay over it, a patch of skin with a cut edge)
  // (a number, or one for each side: {L, R})
  const foldCos = (A) => { const f = opts.foldCos ?? 0.34; return typeof f === 'number' ? f : f[A.sg > 0 ? 'R' : 'L']; };
  const folded = (A) => {
    const s = projB(A.S, t), e = projB(A.E, t), w = projB(A.W, t), a = norm(sub(s, e)), b = norm(sub(w, e));
    return a.x * b.x + a.y * b.y > foldCos(A);
  };
  const foldL = splitL && folded(R.L), foldR = splitR && folded(R.R);
  // (the torso's outline takes the same rule, and a shot may set how far a forward arm's shoulder
  // cap stands out of it)
  R.fwdL = fwdL; R.fwdR = fwdR; R.capOut = opts.capOut; R.reachFolds = !!opts.reachFolds; R.plantFeet = !!opts.plantFeet;
  // behind his back from our side: arms reaching forward and the held pigeon, farthest first
  const behind = [];
  if (fwdL) behind.push({ z: Math.min(R.L.E.z, R.L.W.z), draw: () => drawArm(R.L, R, t, { sleeve: true }) });
  if (fwdR) behind.push({ z: Math.min(R.R.E.z, R.R.W.z), draw: () => drawArm(R.R, R, t, { sleeve: true }) });
  if (splitL) behind.push({ z: R.L.W.z, draw: foldL ? () => drawArm(R.L, R, t, { part: 'fore', fold: !!opts.fold }) : () => armHalf(R.L, t, 1, () => drawArm(R.L, R, t, {})) });
  if (splitR) behind.push({ z: R.R.W.z, draw: foldR ? () => drawArm(R.R, R, t, { part: 'fore', fold: !!opts.fold }) : () => armHalf(R.R, t, 1, () => drawArm(R.R, R, t, {})) });
  if (held) behind.push({ z: R.P.bird.z, draw: () => drawHeldBird(R, t, tc) });
  behind.sort((a, b) => b.z - a.z);
  for (const it of behind) it.draw();
  drawLegs(R, t);
  const T = drawTorso(R, t, tc, [fwdL ? null : sleeveShape(R.L, t), fwdR ? null : sleeveShape(R.R, t)].filter(Boolean));
  // hands on the hips go round the front of the waist: the body hides what passes behind it
  const body = curvePath(T.pts);
  const fold = !!opts.fold;
  if (!fwdL) {
    if (foldL) drawArm(R.L, R, t, { body, part: 'upper' });
    else if (splitL) armHalf(R.L, t, -1, () => drawArm(R.L, R, t, { body }));
    else drawArm(R.L, R, t, { body, fold });
  }
  if (!fwdR) {
    if (foldR) drawArm(R.R, R, t, { body, part: 'upper' });
    else if (splitR) armHalf(R.R, t, -1, () => drawArm(R.R, R, t, { body }));
    else drawArm(R.R, R, t, { body, fold });
  }
  drawHead(R, t, tc);
  return R;
}
// Draw fn clipped to one side of a line through the elbow halving its angle on the picture: side 1
// the forearm's, -1 the upper arm's. (Square to the upper arm, a forearm folded across the back
// fell half on the upper arm's side, and that half lay on his back.) The halves overlap by a pixel,
// so no seam of background shows where they meet.
function armHalf(A, t, side, fn) {
  const s = projB(A.S, t), e = projB(A.E, t), w = projB(A.W, t);
  const a = norm(sub(s, e)), b = norm(sub(w, e)), c = add(a, b);
  const along = len(c) > 1e-3 ? norm(c) : perp(b);
  let n = perp(along);
  if (n.x * b.x + n.y * b.y < 0) n = mul(n, -1);            // (toward the forearm)
  const B = 4000, o = sub(e, mul(n, side * 0.8));
  const q = [add(o, mul(along, B)), sub(o, mul(along, B)), add(sub(o, mul(along, B)), mul(n, side * B)), add(add(o, mul(along, B)), mul(n, side * B))];
  ctx.save();
  ctx.clip(polyPath(q));
  fn();
  ctx.restore();
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
