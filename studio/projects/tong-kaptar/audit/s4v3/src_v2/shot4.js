// Tong · kaptar — shot 4: the boy steers the flock with the rag on the pole, whistling.
// A lens low behind him on the roof, looking up past his shoulder: his back and the long pole he
// swings across the sky and back, the atlas rag streaming from its top, the flock wheeling over the
// mahalla with it; then, the pole held up toward the flock, two fingers to his mouth for the
// whistle, and the flock turns for home and comes down, and he lowers the rag after it.
'use strict';

// t0: film time at the first frame (the flock's clock; after shot 3, an ellipsis)
const S4 = {
  t0: 14, dur: 4,
  pos: V3(0.2, -0.5, 0.1), yaw: (-10 * Math.PI) / 180, pitch: (24 * Math.PI) / 180, f: 720,
};
const cam4At = (t) => makeCam({ pos: S4.pos, yaw: S4.yaw, pitch: S4.pitch, f: S4.f });
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
// the tip, the atlas rag tied along its top. He works it as a lever: the left hand high, at his
// head, is the pivot, and the right hand at the butt pushes it across under it, so the top sweeps
// the sky from one side to the other. To whistle he lets go with the left hand and lifts the pole
// in the right alone, up beside his head, the rag high toward the flock.
const POLE = { len: 3.2, r0: 0.017, r1: 0.008, gripR: 0.14 };
// the pole's line in boy space from its channels: phi, the sweep (+ to his right, from upright);
// beta, how far the top leans forward; pivot, the left hand's place on it (where the left hand
// would be on it while it is at his mouth); span, how far apart the hands are on it
function pole4(P) {
  const u = n3(V3(Math.sin(P.phi) * Math.cos(P.beta), Math.cos(P.phi) * Math.cos(P.beta), Math.sin(P.beta)));
  // (the pivot slides the way the top goes: with the right hand at the butt that is how far both
  // arms can reach, and it keeps the raised left hand clear of his head)
  const pv = a3(P.pivot, V3(0.15 * Math.sin(P.phi), 0, 0));
  const hR = s3(pv, m3(u, P.span));
  const butt = s3(hR, m3(u, POLE.gripR));
  return { butt, u, handR: hR, tip: a3(butt, m3(u, POLE.len)), at: (s) => a3(butt, m3(u, s)) };
}
// the pole's own frame: e1 along it, e2 across it to his right, e3 = e1 x e2
function poleFrame(u) {
  let e2 = s3(V3(1, 0, 0), m3(u, u.x));
  e2 = len3(e2) < 1e-4 ? V3(0, 0, -1) : n3(e2);
  return { e1: u, e2, e3: cross3(u, e2) };
}

// ------------------------------------------------------------------ the acting
// Frames of the shot (24 fps, on ones: the swings are the action). `hold` keys ease in and out.
// (He is already wound up to the left as the shot opens, only the pole still going back: from the
// last swing's pose his body wound up in the first three frames, the head 5.1, 3.9, 1.4 px a frame
// and then still before the push, a start, a stop and a start, measured.)
// (Spacing: the keys that carry his right hand round in front of his hip are spread so the hand
// gathers speed over five frames and the rag's sweep has no hitch: with the wind-up held to f6 and
// the next key at f8 the hand went from 2 to 25 px a frame in one frame, and the pole's top from
// 54 px a frame to 28 and back to 50 in the middle of the swing, measured; now at most 10 px a
// frame from one frame to the next, 40 -> 32 -> 41 through the middle.) And the push has an arc:
// the rag's top gathers speed to 57 px a frame at f19 and slows from there over nine frames into
// the overshoot, 46, 40, 37, 32, 26, 17, 6 (it had crossed the sky at 44..47 px a frame for twelve
// frames and then stopped in four, a wiper, measured by a fresh reviewer).)
// mouth: the left hand at his mouth, two fingers in, whistling (0 on the pole).
// Left to right across the sky and back, then the whistle with the pole still up to the left, then
// he brings the rag down to the left as the flock comes down. (Whistling with the pole held up by
// his right shoulder, the right hand had to cross from the butt's place at his left, hidden in
// front of him, and came out on the other side 115 px away in one frame; held where the swing to
// the left leaves it, the pole never changes hands.)
// Upright, halfway through each swing, the pole passes 20 cm to the left of his head, the left hand
// on it at the height of his temple and the right hand across at his belly. (Held upright in front
// of his face, the lens behind him saw the pole rise out of the top of his head: within 15 px of
// its middle for six frames of each swing, measured; 13 cm to the left, its lower half ran down the
// edge of his body, 104 px of it within 4 px of his outline; now 65..76 px left of his head's
// middle, and what touches his outline is the hand on it.) At the left end it crosses behind his
// head on a slant, both ends showing, the left hand high (lower, the pole ran along the side of his
// neck). At the right end his left hand has pushed it across in front of his face and holds it out
// past his right cheek, the fist in sight beside his head, 15 cm right of his spine: held in front
// of his face, the fist was hidden for 14 frames and the pole came out from behind his head at his
// ear (or higher, out of the corner of his cap), and the ear read as the hand working the lever.
// His weight goes onto the leg away from the swing (root, hipRoll): without it the lever was
// all arms, the hips and legs still for the whole shot. And his back bends and turns with it
// (bend, twist): the line of his shoulders swings from 18 degrees one way to 19 the other, and
// his hips 4.5 cm to each side (at 11..13 degrees and 3 cm, and at 8..9 degrees before that, he
// swung a 3 m pole from a torso that barely moved: all arms).
// At the right end he looks round after the rag, his head turned as far as at the left end (turned
// less, the pole ran 24..29 px along his ear's edge for six frames, measured).
// For the whistle he turns his head well round to the left, to the flock: at 0.62 the fingers at
// his mouth were hidden by his cheek, at 0.85 the lens sees them against his profile.
const BOY4_KEYS = [
  { f: 0, root: V3(0.042, -0.012, 0), hipRoll: 0.11, lean: 0.02, bend: 0.19, twist: -0.36, shL: 0.03, shR: 0.01,
    hYaw: -0.4, hPitch: 0.55, hRoll: 0.04, aim: 0,
    phi: -0.72, beta: 0.55, pivot: V3(-0.03, 0.88, 0.2), span: 0.66, mouth: 0,
    poleL: V3(-1, -0.5, -0.4) },
  { f: 4, hold: true, twist: -0.392, bend: 0.203, phi: -0.8, beta: 0.56, pivot: V3(-0.03, 0.9, 0.18), hYaw: -0.42, root: V3(0.045, -0.016, 0), hipRoll: 0.117 },
  // (the butt swings round in front of him: the pole leans back upright as it comes across, so the
  // right hand comes forward past his hip before it crosses to his left; lerped straight from
  // behind his shoulder to in front of his belly, it went through his chest, and for two frames
  // the lens saw a hand on his back)
  { f: 8, twist: -0.334, bend: 0.18, phi: -0.72, beta: 0.42, pivot: V3(-0.025, 0.88, 0.2), span: 0.76, hYaw: -0.38, root: V3(0.04, -0.014, 0), hipRoll: 0.104 },
  { f: 12, twist: -0.196, bend: 0.113, phi: -0.5, beta: 0.12, pivot: V3(-0.01, 0.84, 0.25), span: 0.6, hYaw: -0.3, hPitch: 0.58, root: V3(0.025, -0.006, 0), hipRoll: 0.083 },
  { f: 16, twist: 0.039, bend: 0, phi: 0.0, beta: 0.24, pivot: V3(-0.2, 0.8, 0.32), span: 0.54, hYaw: -0.1, hPitch: 0.62, root: V3(0, 0.004, 0), hipRoll: 0.047 },
  { f: 22, twist: 0.392, bend: -0.18, phi: 0.62, beta: 0.297, pivot: V3(0.033, 0.696, 0.288), span: 0.617, hYaw: 0.45, root: V3(-0.04, -0.006, 0), hipRoll: -0.023 },
  // (the pole's top runs on past where he holds it, stops there and hangs, drifting back a little,
  // for three frames before the pull back: the swing has weight. Settling back to a held key
  // at f31 and pulling away from it, it moved +1.1, -0.3, -1.3, -0.8, -1.5, -4.0 degrees a
  // frame, a start, a stall and a snap.)
  // (at this end the right hand holds the pole 7 cm further down, clear of his hip: with his weight
  // gone over to his left, the edge of his body came over the fist on the butt, half of it hidden
  // at f27, measured, and the pole grew out of his side)
  { f: 28, hold: true, twist: 0.478, bend: -0.225, phi: 0.93, beta: 0.29, pivot: V3(0.05, 0.687, 0.287), span: 0.626, hYaw: 0.502, hPitch: 0.62, root: V3(-0.054, -0.014, 0), hipRoll: -0.05 },
  { f: 31.5, hold: true, twist: 0.47, bend: -0.225, phi: 0.905, beta: 0.288, pivot: V3(0.045, 0.686, 0.288), span: 0.634, hYaw: 0.51, root: V3(-0.05, -0.01, 0), hipRoll: -0.047 },
  // back across, faster, to the left again (the pole leans back less as the butt comes round: leaning
  // 0.12 at f43 and 0.42 two frames later, the rag's top sped up again at the end of the swing, 41 to
  // 60 px a frame, as the lean swung it down across the sky; now it slows all the way, 81 to 28)
  { f: 39, twist: 0, bend: 0.022, phi: 0.0, beta: 0.24, pivot: V3(-0.2, 0.8, 0.32), span: 0.52, hYaw: 0.0, hPitch: 0.62, root: V3(0, 0.004, 0), hipRoll: 0.047 },
  { f: 43, twist: -0.196, bend: 0.113, phi: -0.5, beta: 0.26, pivot: V3(-0.01, 0.84, 0.25), span: 0.6, hYaw: -0.24, hPitch: 0.6, root: V3(0.025, -0.004, 0), hipRoll: 0.083 },
  { f: 45.5, twist: -0.29, bend: 0.158, phi: -0.7, beta: 0.36, pivot: V3(-0.025, 0.88, 0.2), span: 0.76, hYaw: -0.3, hPitch: 0.6, root: V3(0.036, -0.012, 0), hipRoll: 0.094 },
  { f: 48, hold: true, twist: -0.352, bend: 0.18, span: 0.66, phi: -0.78, beta: 0.52, pivot: V3(-0.03, 0.88, 0.2), hYaw: -0.34, root: V3(0.04, -0.016, 0), hipRoll: 0.104 },
  // (the one-handed lift peaks in its middle and slows into the hold, 5.9 degrees a frame on screen at
  // f52, then 4.6, 4.2, 1.9 and still: keyed to rise to the last, it went on speeding up to the top,
  // 6.4 at f54, and stopped in a frame, measured by a fresh reviewer)
  // (the return ends on a held key: without it the pole's top turned back up for the whistle in one
  // frame, -4.1 to +3.2 degrees a frame, a ricochet; now it slows over five frames, -5.5 -4.2 -3.2
  // -2.2 -0.8, and turns through +1.2)
  // the whistle: the left hand leaves the pole for his mouth, and his right hand alone lifts it,
  // the fist out beside his head (41 cm right of his spine: 8 cm nearer, the pole ran along the top
  // of his cap for 54 px) and the pole up over it to the left, toward the flock, steep enough to
  // stand clear of his cap (16 px; at 38 cm and 23 degrees from upright it passed 1..5 px off the
  // cap's corner for the whole hold, a graze). (Held lower, the pole lay along the top of his
  // shoulder, 57 px within 4 px of his outline, and passed behind his head to come out just where
  // the whistling hand was; the fist sat at his neck with the pole's butt hidden, an arm reaching
  // to his collar, not a hand holding a pole.) He fills his chest for it as the hand comes up, the
  // shoulders rising 2.5 cm, and they sink as he blows.
  { f: 52, twist: -0.26, bend: 0.12, root: V3(0.029, -0.002, 0), hipRoll: 0.081, shL: 0.05, shR: 0.03, mouth: 0.75, phi: -0.47, beta: 0.39, pivot: V3(0.17, 1.2, 0.223), hYaw: -0.7, hPitch: 0.62, poleL: V3(-1, -0.4, 0) },
  { f: 55, hold: true, root: V3(0.016, 0.008, 0), shL: 0.056, shR: 0.036, mouth: 1, phi: -0.28, pivot: V3(0.28, 1.216, 0.226), beta: 0.35, hYaw: -1.05, hPitch: 0.62, hRoll: -0.08, lean: -0.03 },
  { f: 65, hold: true, root: V3(0.016, 0.004, 0), shL: 0.018, shR: -0.002, mouth: 1, phi: -0.28, hYaw: -1.09, hPitch: 0.66, hRoll: -0.06 },
  // and he brings the rag down out of the sky to his left, the way the flock is coming down: the
  // butt to his right hip, the left hand back on the pole in front of his left shoulder (lowered
  // across his chest at the shoulder, the pole ran in at one side of his neck and out at the other),
  // then held out beside him at his shoulder, 23 cm to his left and 21 in front, the elbow down at
  // his side and the fist on the pole where the lens sees it. (Held in front of his chest, hidden,
  // the arm was an upper arm and an elbow with nothing below it, a stump for the last 18 frames; at
  // the edge of his body, a mitten. Held lower, at his chest, the rag came down into the flock as
  // it dives, 44..118 bird places within 70 px of it after f60, measured; here 15.) The right fist
  // holds the butt out beside his hip, 26 cm right of his spine and 7 in front: 16 cm in front and
  // 20 out, his body covered all but the edge of it, and for the last 20 frames the lens saw a
  // talon hooked over the butt. (The whole pole moved with it, so the rag stays where it was.)
  { f: 72, root: V3(0.03, -0.006, 0), hipRoll: 0.075, shL: 0.03, shR: 0.01, mouth: 0, phi: -0.769, beta: 0.375, pivot: V3(-0.022, 0.66, 0.25), span: 0.628, hYaw: -0.62, hPitch: 0.5, hRoll: 0.02, lean: 0.01, poleL: V3(-1, -0.5, -0.4) },
  { f: 78, root: V3(0.042, -0.026, 0), hipRoll: 0.085, phi: -0.87, beta: 0.244, pivot: V3(-0.112, 0.591, 0.224), span: 0.68, hYaw: -0.62, hPitch: 0.3, twist: -0.16, bend: 0.06, poleL: V3(-0.4, -1, -0.2) },
  // (as he brings the rag down to his left his weight goes over onto his right leg, 2.6 cm, and sinks
  // with the dip: through the whistle and the lowering his legs had not moved, 43 frames, measured)
  // (on the way down the butt goes out beside his hip, 28 cm right of his spine by f72: through the
  // middle of it, in front of his belly, his body hid the fist and the arm was a tube, f69..74)
  // (the rag comes down past where he holds it, 2.3 degrees, and he brings it back up and it
  // settles: lowered on one long ease, the pole, both arms and his head crept on together for 20
  // frames, 11 px a frame down to nothing, a glide, measured by a fresh reviewer)
  { f: 85, phi: -0.812, beta: 0.212, pivot: V3(-0.119, 0.579, 0.213), span: 0.68, hYaw: -0.6, hPitch: 0.24, twist: -0.18, bend: 0.07, root: V3(0.035, -0.012, 0), hipRoll: 0.07 },
  { f: 95, hold: true, phi: -0.829, beta: 0.212, pivot: V3(-0.119, 0.579, 0.213), span: 0.68, hYaw: -0.6, hPitch: 0.24, twist: -0.18, bend: 0.07, root: V3(0.035, -0.01, 0), hipRoll: 0.07 },
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
// two fingers in his mouth: the fingertips at his lips (9.5 cm in front of the head's pivot, in
// the head frame), the hand come in from the side, palm down, its first two fingers pointing across
// into the corner of his mouth and the other two curled, the wrist 10 cm out to his left at the
// height of his mouth (in the body's frame), the elbow out at his side. (7.5 cm out, all of the
// hand but three knuckle bumps of 6..8 px was behind his cheek, measured by a fresh reviewer; at
// 10 the curled fingers show beside it.) From behind, the forearm
// then runs above his shoulder to his face, one limb from the elbow to the lips. (With the hand
// under his chin, fingers pointing up, the forearm lay behind his shoulder and upper arm: an arm
// that ended in a stump and two fingers floating at his cheek, 18..20 px of sky between them,
// measured by a fresh reviewer. Placed under the chin in the head frame, the hand ended up beside
// his neck with the fingers up at his temple, a hook, and the elbow flipped behind him for a frame
// on the way in and out.)
const MOUTH = { lips: V3(0, 0.012, 0.095), w: V3(-0.1, -0.01, -0.025), pn: V3(0, -1, 0) };
// Where the right elbow goes (boy space), frame by frame: the IK's pole is the way to it from the
// shoulder. Leading each swing round his side it is out in front (the hand trails it); across his
// body, in front of his belly; with the pole raised for the whistle, out and down; at his hip,
// back, turning back as the hand comes down past his shoulder. (Keyed as one direction, the
// direction lay along the arm whenever the hand swung close past the shoulder, and the elbow flipped
// from front to back in a frame, 33 cm, measured.) While the hand is close under the shoulder,
// just before it goes in front of him, the elbow stays out at his side: kept on the way in, the
// arm folded 17 cm short, the elbow's direction lay near the line from shoulder to hand, and the
// upper arm showed beside his body, vanished, came out again and went, 73/36/0/73/55 % in five
// frames (f9..f13, measured); now 73/73/82/82/55/27/0.
const ELB_R4 = [[0, V3(0.38, 0.28, -0.02)], [4, V3(0.38, 0.28, -0.02)], [8, V3(0.38, 0.4, 0.08)], [10, V3(0.42, 0.45, 0.04)],
  [12, V3(0.4, 0.42, 0.1)], [16, V3(0.06, 0.3, 0.2)], [39, V3(0.06, 0.3, 0.2)], [43, V3(0.4, 0.42, 0.1)], [45, V3(0.42, 0.45, 0.04)],
  [46, V3(0.38, 0.4, 0.08)], [48, V3(0.38, 0.28, -0.02)], [52, V3(0.36, 0.34, 0.0)], [64, V3(0.36, 0.34, 0.0)], [70, V3(0.2, 0.33, -0.24)],
  [95, V3(0.2, 0.35, -0.25)]];
function elbowR4(f) {
  const K = ELB_R4;
  if (f <= K[0][0]) return K[0][1];
  for (let i = 0; i + 1 < K.length; i++) if (f <= K[i + 1][0]) return l3(K[i][1], K[i + 1][1], smooth((f - K[i][0]) / (K[i + 1][0] - K[i][0])));
  return K[K.length - 1][1];
}
// Overlap: his hips go first, his back a frame after them, the arms and the pole on the beat, and
// his head last, following the rag he watches (frames: + ahead of the keys, - behind them).
let BOY4_LAG = { hips: 2, torso: 1, head: -2 };
// The whistle is two blasts: before each he draws breath (his shoulders rise a little), then blows
// hard in a frame, his shoulders dropping 2.5 cm and his head snapping down at the whistle, and
// eases back over three frames. (As a gentle pulse, 1.8 cm and a nod, the head moved 0.9 px and
// the hold read as a still: measured by a fresh reviewer.) Frames of the shot.
// (Two blasts six frames apart, each a breath in over the three frames before it, the hit in one
// frame, then let go over three and a half. Carried by the shoulders alone the hit moved the arm
// 10 px and his head 1..3, an elbow's twitch, and held for a frame at the hit the whole boy stood
// still on the same two frames of each blast, measured by fresh reviewers; now his back pumps: he
// leans into it and sinks, and the pole in his other hand jolts with him.)
const BOY4_BLASTS = [57, 63];
let BOY4_SAG = -0.02;
const blastHit = (x) => (x < -1 ? 0 : x < 0 ? x + 1 : x < 3.5 ? (1 - x / 3.5) ** 2 : 0);
const blastIn = (x) => Math.exp(-(((x + 2.5) / 1.1) ** 2));
function boyPose4(tc, t) {
  const f = (tc - S4.t0) * FPS;
  const P = keyAt(BOY4_KEYS, f);
  const Ph = keyAt(BOY4_KEYS, f + BOY4_LAG.hips), Pt = keyAt(BOY4_KEYS, f + BOY4_LAG.torso), Pd = keyAt(BOY4_KEYS, f + BOY4_LAG.head);
  P.root = Ph.root; P.hipRoll = Ph.hipRoll;
  P.twist = Pt.twist; P.bend = Pt.bend; P.lean = Pt.lean;
  P.hYaw = Pd.hYaw; P.hPitch = Pd.hPitch; P.hRoll = Pd.hRoll;
  let hit = 0, inh = 0;
  for (const c of BOY4_BLASTS) { hit += blastHit(f - c); inh += blastIn(f - c); }
  P.lean += 0.08 * hit - 0.03 * inh;
  P.shL += -0.028 * hit + 0.018 * inh; P.shR += -0.028 * hit + 0.018 * inh;
  P.hPitch += -0.11 * hit + 0.035 * inh;
  P.root = a3(P.root, V3(0, -0.02 * hit + 0.008 * inh, 0));
  // (the pole goes down and up with him as his knees give: held where it was, his arms stretched
  // and gave for him)
  P.pivot = a3(P.pivot, V3(0, P.root.y, 0));
  const br = Math.sin((t * TAU) / 3.2);
  P.shL += 0.004 * br; P.shR += 0.004 * br;
  P.root = a3(P.root, V3(0, 0.0015 * br, 0));
  P.grip = 0; P.visor = 0; P.hipLock = 0; P.tmixL = 0; P.tmixR = 0;
  // The left hand's shapes: a fist on the pole, a loose open hand on its way to his mouth and back
  // (the fingers together and a little bent, the thumb along them), and at his mouth the whistle,
  // the first two fingers straight into it and the other two curled. (Carried there as a fist, it
  // crossed the sky as a hook with the thumb for a spike; with the whistling fingers straightened
  // as it left the pole, as an antler: two fingers up, two curled, the thumb out, f50..53 and
  // f66..68, measured by fresh reviewers. The two whistling fingers pressed together: spread,
  // they stood off his cheek as a V. The other two only as far as a fist: curled past it the
  // finger chain rolled up into a spiral, a curl of hair or a horn.)
  const mh = clamp(P.mouth, 0, 1);
  const kWh = sstep(0.8, 0.94, mh), kOpen = sstep(0.04, 0.22, mh) * (1 - kWh), kFist = 1 - kOpen - kWh;
  const HAND_OPEN = [0.32, 0.32, 0.38, 0.44], HAND_WH = [0.3, 0.34, 0.82, 0.8];
  P.curlsL = HAND_OPEN.map((c, k) => 0.95 * kFist + c * kOpen + HAND_WH[k] * kWh);
  P.curlL = 0.95 - 0.5 * kOpen; P.curlR = 0.95;
  P.spreadL = 0.03 * kFist; P.spreadR = 0.03; P.thumbL = lerp(0.7, 0.25, kOpen); P.thumbR = 0.7;
  P.poleR = s3(elbowR4(f), V3(0.16, 0.47, 0));
  // (held up in one hand for the whistle, the pole has weight: brought up to the hold, it sags on
  // past it and comes back (its top 2 degrees lower two frames after it arrives), bobs in his fist,
  // and dips with each blast. Held dead still, its top on one pixel for nine frames, 3.2 m of
  // bamboo in one fist was weightless; and stopped dead on arrival, it slammed into place.)
  // As his left hand lets go, the pole's top drops before his right arm takes the weight and lifts
  // it (2.3 degrees, f50): lifted at once it rose tip first, weightless. On each blast it jolts in
  // his fist, 1.7 degrees.
  // (the pole's jolt follows the body's a frame late and spreads over two: kicked on the same frame
  // as the lift's last step, it hit a stop and bounced, measured by a fresh reviewer)
  let kick = 0;
  for (const c of BOY4_BLASTS) kick += Math.exp(-(((f - c - 1) / 1.1) ** 2));
  const mk1 = clamp(P.mouth, 0, 1);
  P.phi += mk1 * (BOY4_SAG * Math.exp(-(((f - 57) / 1.6) ** 2)) + 0.01 * Math.sin((TAU * (f - 55)) / 11)) - 0.03 * kick;
  P.phi += -0.04 * Math.exp(-(((f - 50.3) / 1.2) ** 2));
  const pl = pole4(P);
  P.pole = pl;
  // Fists round the pole (A.fist: the lines between the folded fingers), their thumbs round it: from
  // the heel of the hand away from the lens and on over the pole toward the fingers, so the lens
  // sees their root at the side of the fist. (Laid along the side of the palm as for an open hand,
  // each thumb stood out along the pole, a spike, and the fist read as a paddle.)
  const mk0 = clamp(P.mouth, 0, 1);
  const thumbRound = (g) => n3(s3(g.w, BOY_CAM));
  P.fistR = 1; P.tdirR = thumbRound(gripOn(pl, POLE.gripR, 1)); P.tmixR = 0.85;
  // (the left one a fist, lines and all, while it is on the pole; its thumb comes off the pole's
  // line smoothly as the hand opens: switched with the lines, it jumped in a frame. fistL -1: the
  // hand at his mouth, which ARM_PARTS4 keeps behind his head)
  P.fistL = mk0 < 0.1 ? 1 : mk0 > 0.6 ? -1 : 0; P.tdirL = thumbRound(gripOn(pl, POLE.gripR + P.span, -1)); P.tmixL = 0.85 * (1 - sstep(0.04, 0.22, mk0));
  P.hold = (side, S, Hf) => {
    if (side === 'R') return gripOn(pl, POLE.gripR, 1);
    const g = gripOn(pl, POLE.gripR + P.span, -1), mk = clamp(P.mouth, 0, 1);
    if (mk <= 0) return g;
    const lips = toP(Hf.head, MOUTH.lips), w = a3(lips, MOUTH.w), hd = n3(s3(lips, w));
    const m = { w, hd, pn: n3(s3(MOUTH.pn, m3(hd, dot3(MOUTH.pn, hd)))) };
    // (on the way the open hand keeps its back to the lens, and turns palm down only as it gets to
    // his mouth, with the fingers: turned all the way along, it passed edge on to the lens, the
    // fingertips a row of prongs and the thumb a spike, f51..53 and f67..68)
    const wNow = l3(g.w, m.w, mk), away = n3(s3(wNow, BOY_CAM));
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
let ARM4_ZFWD = 0.15;
// (the whistling hand is at his mouth, on the far side of his head, however he leans: judged by the
// wrist's depth, his breath before each blast took it 3.4 cm back and the hand came out in front
// of his cheek for two frames, f59..60)
const ARM_PARTS4 = (A) => ({ upper: A.E.z > 0.06 && (A.sg * A.E.x < 0.16 || A.E.z > ARM4_ZFWD), fore: A.W.z > -0.03 || (A.sg < 0 && A.fist === -1) });
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
  if (want('coop')) withMap(map4(cam, COOP_D, t), () => drawCoop(t, tc, false));
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
