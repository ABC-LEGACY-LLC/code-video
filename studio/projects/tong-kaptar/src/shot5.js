// Tong · kaptar — shot 5: home. The film's first frame again, some seconds after shot 4: the pole
// is back against the coop with the rag flying from it, the boy stands with his hands on his hips
// as he stood at the end of shot 1, and the flock comes down out of the sky onto the coop and the
// parapet by it. When the last of them is down he turns round over his left shoulder, the way home,
// and we see his face for the first time, smiling.
'use strict';

// t0: film time at the first frame. Six seconds after shot 4 (an ellipsis: the flock that dived at
// the coop at 18 s has gone round once more, and he has put the pole back against the coop).
// (7.5 s: the smile he turns round with is the film's last picture, and it holds 3 s once the lens
// has come to rest on him; at 6 s it had 1.7 s and the film stopped dead on it)
const S5 = { t0: 24, dur: 7.5 };

// ------------------------------------------------------------------ the lens
// Shot 1's lens, its crane at the top of its rise. The painted layers are drawn in its pixels as
// shot 1 draws them; the boy through projW as in shot 1. Birds are placed by the painted coop and
// parapet, so they are seen through shot 1's lens read as the painted layers are (a level lens
// with its horizon raised, CAM1S), risen with the crane.
const cam5At = (t) => makeCam({ pos: V3(0, craneH(t), 0), pitch: 0, cy: CAM1S.cy, f: CAM1S.f });
// The push-in: as the last birds come down the lens closes in on him (2.2 times, a medium close
// shot), about a point by his hips, so that he ends on the right of the frame looking left, into
// the room the frame gives his look, the white pigeon and its neighbours on the coping at lower
// left, and the sun just off the right edge (in the frame it outshone his face, which is in shade). The painted layers are drawn again through the zoom (withMap: their lines as
// sharp as before, and as much thicker as they are nearer); he and the birds through the zoomed lens.
// (eased with smoothstep over 2.3 s: the scale grows at most 2.2 % a frame, 20 px a frame at the
// frame's far edge; the cubic ease over 2 s peaked at 4.9 %, 44 px, and the push lurched mid-turn)
const ZOOM5 = { t: [2.0, 4.3], k: 2.2, c: V(898, 678) };
function zoom5At(s) {
  const e = smooth(clamp((s - ZOOM5.t[0]) / (ZOOM5.t[1] - ZOOM5.t[0]), 0, 1));
  const k = Math.pow(ZOOM5.k, e), c = ZOOM5.c;
  return { k, e, M: (x, y) => V(c.x + k * (x - c.x), c.y + k * (y - c.y)) };
}
let Z5 = zoom5At(0);
// shot 1's lens (projW, with its crane) through the zoom of this frame
const proj5 = (p, t) => { const q = projW(p, t), m = Z5.M(q.x, q.y); return { x: m.x, y: m.y, z: q.z }; };
const view5 = (t) => ({ pos: V3(0, 0, 0), f: CAM.f * Z5.k, project: (p) => proj5(p, t) });

function renderShot5(i, only) {
  const t = S5.t0 + i / FPS;
  const tc = t;
  const want = (k) => !only || only === k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (only) ctx.clearRect(0, 0, W, H);
  const s = t - S5.t0;
  Z5 = zoom5At(s);
  const zoomed = Z5.k > 1.0005;
  const lay = (fn) => (zoomed ? withMap(Z5.M, fn) : fn());
  const sun0 = sunAt(t), sun = Z5.M(sun0.x, sun0.y);
  if (!FAR_REC) { FAR_REC = recorded(() => makeSkyline(5, 540, 14, 44, 26, 70, 0.35)); LANDMARK_REC = recorded(() => makeLandmark()); }
  if (want('sky')) {
    lay(() => { drawSky(t); drawStars(t); });
    drawSunGlow(t, sun0, zoomed ? Z5.M : null);
    lay(() => { drawCirrus(t); drawSunDisk(t); });
    for (const cl of CLOUDS) drawCloud(zoomed ? cloudIn(cl, t, Z5.M) : cl, t, sun);
    lay(() => { drawFar(t, zoomed ? FAR_REC : FAR, zoomed ? LANDMARK_REC : LANDMARK); drawBlocks(t); });
  }
  if (want('flock')) drawFlock5(t, s, 'far');
  if (want('sky')) {
    lay(() => { drawWires(t); drawMahalla(t); drawSunBloom(t); drawSunCore(t); drawMotes(t); });
  }
  if (want('flock')) drawFlock5(t, s, 'mid');
  if (want('flag')) lay(() => drawPoleFlag(t));
  if (want('sky')) lay(() => drawParapet(t));
  if (want('flock')) drawFlock5(t, s, 'cap');
  if (want('coop')) {
    lay(() => drawCoop(t, tc, false));
    drawPerched5(t, tc);
  }
  if (want('flock')) drawFlock5(t, s, 'coop');
  if (want('boy')) {
    BOY_POSE = boyPose5;
    if (zoomed) setBoyView(view5(t));
    try { drawBoy5(t, tc, { noBird: true, torso: drawTorso5 }, perf5(tc - S5.t0).face); } finally { BOY_POSE = null; setBoyView(null); }
  }
  if (!only) finish(t, sun);
}

// ------------------------------------------------------------------ the flock comes home
// Landing, as pigeons land (Berg & Biewener 2010, pigeons landing on a perch; Lee et al. 1993;
// Provini et al. 2014; Crandell et al. 2018):
//  - they come down gliding, wings in a shallow V, and brake over the last four wingbeats, about
//    half a second: from 4.2 m/s to 1 m/s at the touchdown, beating faster (7.8 Hz against 6.6),
//    the stroke tipped forward, pushing air ahead;
//  - the body pitches up from about 19 degrees to about 72 on the last beat, the tail fanned wide
//    and turned down with it;
//  - the braking follows a constant rate of change of the time to contact (tau-dot 0.775): the
//    speed goes as the distance to the landing spot to the power 0.225, so it brakes hardest at
//    the end ("a controlled collision");
//  - the feet go forward when the time to contact is about 150 ms (about 190 ms before it);
//  - on the perch the bird is steady within 0.11..0.21 s, straightens up, then folds its wings;
//    the tail is held down as a counterweight.
// Each lander: its bird of the flock (-1: the white one he threw), where it comes down ('coop' on
// the coop's roof, 'cap' on the parapet's coping, 'off' on the coping past the frame's left edge,
// x in the painted pixels or, for 'off', metres), the touchdown (seconds into the shot), the way it
// flies in (yaw of travel: atan2(x, z) of the heading), the way it stands after (yaw), and whether
// there is room to beat the wings on the perch (on the coop they come down between two others, so
// they touch down with the wings up and fold them from there).
// (On the coping they all end facing right, into the wind that streams the flag and his shirt
// to the left: perched birds turn their heads into a wind, which keeps the feathers down. Each
// comes in from the left, so it turns less than 60 degrees on the spot: two that came in from the
// right turned through facing the lens, an owl for a few frames, and one ended facing left with
// its tail across the white one's. On the coop they stand as its own three do, facing left.)
const LAND5 = [
  { b: 2, on: 'coop', x: 119, td: 1.55, a: -2.5, yaw: -Math.PI / 2 - 0.3, crowd: true },
  { b: 0, on: 'cap', x: 385, td: 1.72, a: 2.55, yaw: Math.PI / 2 + 0.2 },
  { b: 5, on: 'coop', x: 234, td: 1.86, a: -2.45, yaw: -Math.PI / 2 - 0.4, crowd: true },
  { b: 6, on: 'cap', x: 455, td: 1.98, a: 2.6, yaw: Math.PI / 2 - 0.25 },
  { b: 8, on: 'cap', x: 530, td: 2.1, a: 2.5, yaw: Math.PI / 2 + 0.35 },
  { b: 7, on: 'cap', x: 595, td: 2.24, a: 2.6, yaw: Math.PI / 2 + 0.1 },
  { b: 4, on: 'cap', x: 745, td: 2.4, a: 2.6, yaw: Math.PI / 2 - 0.3 },
  // (the white one comes in more across the picture than the rest: at 34 degrees off the lens its
  // flare, the body pitched up 60 degrees, showed us its breast, an egg with wings)
  { b: -1, on: 'cap', x: 670, td: 2.66, a: 2.3, yaw: Math.PI / 2 + 0.25 },
  // down past the frame's left edge: on the coping beyond the coop, or (feet: [x, y, z], world
  // metres) on the next roofs back, half a metre lower, 6 to 10 m off. (All ten on the coping, 3.6 m
  // off, they went out of the frame at one size along one line, past the flag: a knot of birds at
  // the pole for a second.)
  { b: 1, on: 'off', x: -3.9, td: 1.45, a: -2.35 }, { b: 3, on: 'off', x: -6.5, td: 1.62, a: -2.4, feet: [-6.5, -0.9, 8] },
  { b: 9, on: 'off', x: -4.7, td: 1.78, a: -2.3 }, { b: 10, on: 'off', x: -8, td: 1.95, a: -2.45, feet: [-8, -1.0, 9.5] },
  { b: 14, on: 'off', x: -5.2, td: 2.08, a: -2.35, feet: [-5.2, -0.8, 6] }, { b: 15, on: 'off', x: -5.9, td: 2.22, a: -2.4 },
  { b: 16, on: 'off', x: -7, td: 2.34, a: -2.3, feet: [-7, -0.95, 8.5] }, { b: 18, on: 'off', x: -6.7, td: 2.48, a: -2.45 },
  { b: 19, on: 'off', x: -8.5, td: 2.6, a: -2.35, feet: [-8.5, -1.0, 10] }, { b: 21, on: 'off', x: -7.5, td: 2.74, a: -2.4 },
];
// the rest of the flock goes round once more over the mahalla
const AROUND5 = [11, 12, 13, 17, 20, 24, 22, 23, 25];
const LAND = { vf: 4.2, vtd: 1.0, amax: 8.5, tdot: 0.775, dBrake: 1.66, hBrake: 0.5, vStream: 6.4, v0: 8.5, stream: n3(V3(-0.05, -0.32, -0.95)), tdHigh: 0.1, tdPitch: 1.05 };
const UP5 = V3(0, 1, 0);
const yawDir = (a) => V3(Math.sin(a), 0, Math.cos(a));
// feet on the coop's roof (where its three birds stand) or on the parapet's coping, from the
// painted pixels (the coping is drawn risen 1.1 times the crane: see drawParapet)
const coopFeet = (x) => unprojW(x, coopRoofY(x), COOP_D, 0);
const capFeet = (x) => unprojW(x, 683.5 - (13.5 * (x + 10)) / 1300 + 0.1 * craneAtZ(DUR, 3.4), 3.4, 0);
const hermite = (P0, V0, P1, V1, T, s) => {
  const s2 = s * s, s3v = s2 * s;
  return a3(a3(m3(P0, 2 * s3v - 3 * s2 + 1), m3(V0, (s3v - 2 * s2 + s) * T)), a3(m3(P1, -2 * s3v + 3 * s2), m3(V1, (s3v - s2) * T)));
};
// the plan of one lander: feet, body at the touchdown, the braking curve (a quadratic Bezier from
// the gate, where braking starts, flattening onto the spot), its length and time, and the stream
// point it starts from
function landPlan(e) {
  if (e.plan) return e.plan;
  const bird = e.b >= 0 ? FLOCK[e.b] : null;
  const sz = bird ? bird.sz : 1.04;
  const feet = e.on === 'coop' ? coopFeet(e.x) : e.on === 'cap' ? capFeet(e.x) : e.feet ? V3(...e.feet) : capFeet(640 + (e.x * 1000) / 3.4);
  const h = yawDir(e.a);
  // body centre at the touchdown: legs reaching forward and down to the spot (feet 4 cm ahead,
  // 10 cm below; standing, the body sits 7 cm over its feet)
  const L = a3(a3(feet, m3(h, -0.04 * sz)), m3(UP5, LAND.tdHigh * sz));
  const G = a3(a3(L, m3(h, -LAND.dBrake)), m3(UP5, LAND.hBrake));
  const C = a3(a3(L, m3(h, -0.55)), m3(UP5, 0.1));
  const bez = (s) => a3(a3(m3(G, (1 - s) ** 2), m3(C, 2 * s * (1 - s))), m3(L, s * s));
  // arc length table
  const N = 64, arc = [0];
  for (let k = 1; k <= N; k++) arc.push(arc[k - 1] + len3(s3(bez(k / N), bez((k - 1) / N))));
  const rho = arc[N];
  // The braking: the tau-dot law (speed as the distance left to the power 0.225, 4.2 m/s at the
  // gate), but never braking harder than the measured peak (8.5 m/s2) and touching down at 1 m/s
  // (Berg & Biewener 2010: 0.97 m/s). (The law alone brakes almost all of it in the last frame:
  // the birds came in on a rail at one speed and stopped dead.)
  const vAt = (d) => Math.max(LAND.vtd, Math.min(LAND.vf * Math.pow(Math.max(d, 0) / rho, 1 - LAND.tdot), Math.sqrt(LAND.vtd ** 2 + 2 * LAND.amax * d)));
  const NB = 240, tt = [0];
  for (let k = 1; k <= NB; k++) { const d0 = rho * (1 - (k - 1) / NB), d1 = rho * (1 - k / NB); tt.push(tt[k - 1] + (d0 - d1) / ((vAt(d0) + vAt(d1)) / 2)); }
  const Tb = tt[NB];
  const tg = e.td - Tb;
  const vg = m3(n3(s3(C, G)), LAND.vf);
  // where it is in the stream at the shot's start (half a second before, so it is already on its
  // way): back along the stream from the gate, at the stream's mean speed
  const tA = -0.5;
  const P0 = a3(G, m3(LAND.stream, -LAND.vStream * (tg - tA)));
  const v0 = m3(LAND.stream, LAND.v0);
  e.plan = { sz, feet, h, L, G, C, bez, arc, rho, Tb, tt, NB, tg, vg, tA, P0, v0 };
  return e.plan;
}
// the lander's body centre at shot time s (seconds into the shot); u: how far through the braking
// (0 at the gate, 1 at the touchdown)
function landPos(e, s) {
  const p = landPlan(e);
  if (s <= p.tg) {
    const T = p.tg - p.tA, x = (s - p.tA) / T;
    if (x < 0) return { pos: a3(p.P0, m3(p.v0, s - p.tA)), u: 0, phase: 'fly' };
    return { pos: hermite(p.P0, p.v0, p.G, p.vg, T, x), u: 0, phase: 'fly' };
  }
  if (s < e.td) {
    // distance along the curve at this time, from the braking's table
    const tq = s - p.tg;
    let j = 0;
    while (j < p.NB - 1 && p.tt[j + 1] < tq) j++;
    const fr = clamp((tq - p.tt[j]) / Math.max(1e-9, p.tt[j + 1] - p.tt[j]), 0, 1);
    const d = (p.rho * (j + fr)) / p.NB;
    let k = 0;
    while (k < p.arc.length - 2 && p.arc[k + 1] < d) k++;
    const f = (d - p.arc[k]) / Math.max(1e-9, p.arc[k + 1] - p.arc[k]);
    return { pos: p.bez((k + f) / (p.arc.length - 1)), u: (s - p.tg) / p.Tb, phase: 'brake' };
  }
  return { pos: p.L, u: 1, phase: 'down' };
}

// the white one he threw: as the flock's birds are, with its own beat
const HERO5 = { sz: 1.04, kind: 'white', sched: [[-100, 100, true]], ph0: 0.3, rate: 1.02, amp: 0.85, bk: 1, rph: 0.9, bob: 1.7 };
const birdOf = (e) => (e.b >= 0 ? FLOCK[e.b] : HERO5);
// Wingbeat phase: on the way in, the bird's own bursts and glides (a descending pigeon glides
// with its wings in a V) and a few beats before the braking; in the braking, four or five beats
// timed so the wings are up at the touchdown (the last downstroke comes just after it: doves start
// their last beat 8 ms after touching the perch, Provini et al. 2014).
function landPhase(e, s) {
  const p = landPlan(e), bird = birdOf(e);
  if (!p.ph) {
    // integrate the way in once, in 1/96 s steps, from a second before the shot
    const tab = [];
    let ph = bird.ph0;
    for (let k = 0; k <= 96 * 8; k++) {
      const ss = -1 + k / 96;
      tab.push(ph);
      const act = Math.max(activity(bird.sched, S5.t0 + ss), sstep(p.tg - 0.5, p.tg - 0.15, ss));
      ph += (SHEET.flap * bird.rate * act) / 96;
    }
    const phG = tab[Math.round((p.tg + 1) * 96)];
    const N = Math.round(phG + 7.6 * p.Tb);
    p.ph = { tab, phG, N, fb: (N - phG) / p.Tb };
  }
  const q = p.ph;
  if (s < p.tg) return { ph: q.tab[clamp(Math.round((s + 1) * 96), 0, q.tab.length - 1)], act: Math.max(activity(bird.sched, S5.t0 + s), sstep(p.tg - 0.5, p.tg - 0.15, s)) };
  if (s < e.td) return { ph: q.phG + q.fb * (s - p.tg), act: 1 };
  // (on a flat ledge there is no room for a last downstroke under it: the wings stay up and fold)
  return { ph: q.N, act: 1 };
}
// a bird frame from its body axis (fwd), with a bank about it; axes scaled by the bird's size
function bodyFrame(pos, fwd, bank, sz) {
  const z = n3(fwd);
  let y = n3(s3(UP5, m3(z, dot3(UP5, z))));
  y = rotAxis(y, z, bank);
  const x = cross3(y, z);
  return frameAt(pos, m3(x, sz), m3(y, sz), m3(z, sz));
}
// Standing: as the coop's own birds stand (see drawPerched), feet at W0, body tipped up 0.5 rad.
function standFrame(W0, yaw, sz, dip = 0, tip = 0) {
  const F = yprFrame(frameAt(a3(W0, V3(0, 0.07 * sz - dip, 0)), V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)), yaw, 0.5 + tip, 0);
  return frameAt(F.o, m3(F.x, sz), m3(F.y, sz), m3(F.z, sz));
}
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
// Everything drawn of one lander at shot time s.
// (On a flat ledge the body cannot go up to the 72 degrees measured for landing on a perch: with
// the tail fanned and turned down under it, the tail went 13 cm into the roof and hung over the
// coop's front edge. 60 degrees, the legs at full reach, and the tail held clear of the ledge.)
const TUCK = { elev: 0.1, fold: 0.95, sweep: -0.25, hand: 0.9 };
function tailClear(F, spread, pitch, cup, floorY) {
  // raise the fanned tail (pitch down is +) until its lowest point is 8 mm over the ledge
  let pt = pitch;
  for (let k = 0; k < 40; k++) {
    const tl = tailPts(spread, pt, cup);
    let lo = Infinity;
    for (const q of tl) lo = Math.min(lo, toP(F, q).y);
    if (lo >= floorY + 0.008) break;
    pt -= 0.05;
  }
  return pt;
}
function landState(e, s) {
  const p = landPlan(e), bird = birdOf(e), sz = p.sz;
  const { ph, act } = landPhase(e, s);
  const at = landPos(e, s);
  const legs = sstep(e.td - 0.26, e.td - 0.1, s);
  if (s < e.td) {
    const e1 = 1 / 96, A = landPos(e, s - e1).pos, B = landPos(e, s + e1).pos;
    const v = m3(s3(B, A), 1 / (2 * e1));
    const vh = V3(v.x, 0, v.z), sp = len3(vh);
    const h = sp > 1e-4 ? m3(vh, 1 / sp) : p.h;
    const gam = Math.atan2(v.y, sp);
    // body pitch: a little above the flight line on the way in, 19 degrees at the gate, 60 at the
    // touchdown, most of it in the last beats
    let th = lerp(gam + 0.12, 0.33, sstep(p.tg - 0.35, p.tg, s));
    if (at.phase === 'brake') th = 0.33 + (LAND.tdPitch - 0.33) * Math.pow(at.u, 1.8);
    // bank into the curve: the sideways part of the acceleration
    const e2 = 3 / FPS, A2 = landPos(e, s - e2).pos, B2 = landPos(e, s + e2).pos;
    const acc = m3(a3(s3(B2, m3(at.pos, 2)), A2), 1 / (e2 * e2));
    const L = V3(h.z, 0, -h.x);
    const bank = clamp(Math.atan(dot3(acc, L) / G) * 0.8 * (bird.bk || 1), -0.7, 0.7) * (1 - at.u);
    const fwd = a3(m3(h, Math.cos(th)), m3(UP5, Math.sin(th)));
    const F = bodyFrame(at.pos, fwd, bank, sz);
    // the wings: the glide's V mixed with the beat; braking, bigger beats reaching forward
    const glide = mixPose(GLIDE, flapPose(bird.rph / TAU, bird.amp), 0.2);
    let pose = mixPose(glide, flapPose(ph, bird.amp), act);
    if (at.phase === 'brake') {
      const f = flapPose(ph, e.crowd ? 0.85 : 1.08);
      pose = { ...f, sweep: f.sweep + 0.22 * sstep(0, 0.6, at.u) };
    }
    const spread = lerp(0.25, 1, sstep(0, 0.5, at.u));
    let tp = 0.35 * at.u;
    if (at.phase === 'brake') tp = tailClear(F, spread, tp, 0.5, p.feet.y);
    return { F, pose, open: 1, tail: spread, tailPitch: tp, headYaw: 0, headPitch: -0.75 * (th - 0.08) + (at.phase === 'brake' ? 0 : 0.1 * gam), legs, h, flying: true };
  }
  // down: steady and straightened up (60 -> 29 degrees) over its feet in 0.2 s, the legs giving
  // (the body sinks from 10 cm over the feet to 7); the wings fold (after the last downstroke, or,
  // with no room, from up): swept back and in to the body, then laid along it; the fanned tail held
  // clear, then closed; and it turns on the spot in three small steps to the way it stands.
  const k = sstep(e.td, e.td + 0.26, s);
  const yaw0 = Math.atan2(p.h.x, p.h.z), yaw1 = e.yaw ?? yaw0;
  const dy = angDiff(yaw0, yaw1);
  const steps = 3, st0 = e.td + 0.3, stepT = 0.2;
  let turnK = 0;
  for (let j = 0; j < steps; j++) turnK += sstep(st0 + j * stepT, st0 + j * stepT + stepT * 0.7, s) / steps;
  const yaw = yaw0 + dy * turnK;
  const dip = 0.008 * Math.exp(-(((s - e.td - 0.14) / 0.07) ** 2));
  const Fs = standFrame(p.feet, yaw, sz, dip, 0);
  let F = Fs;
  if (k < 1) {
    const fwd0 = a3(m3(p.h, Math.cos(LAND.tdPitch)), m3(UP5, Math.sin(LAND.tdPitch)));
    const F0 = bodyFrame(p.L, fwd0, 0, sz);
    const o = l3(F0.o, Fs.o, k);
    const z = n3(l3(n3(F0.z), n3(Fs.z), k)), y0 = n3(l3(n3(F0.y), n3(Fs.y), k));
    const y = n3(s3(y0, m3(z, dot3(y0, z))));
    F = frameAt(o, m3(cross3(y, z), sz), m3(y, sz), m3(z, sz));
  }
  // (flexed first and laid in after, the half-folded wing stood up behind it for five frames as
  // a fan, a sail: it flexes and comes in together)
  // (no measured fold time for pigeons was found; diamond doves are steady on the perch within
  // 0.11..0.21 s and fold after that. Over 0.26 s the half-folded wings hung round the bird like a
  // cape for six frames, and over 0.15 s from 0.04 s after touchdown, laid back before they had
  // closed, still for three: it folds from 0.02 s after touchdown in 0.13 s. Faster than the
  // doves: drawn without feathers, a wing held half-open reads as a cape. It closes while still
  // raised and is laid down closed: laid back half-open it was a flat slab over the bird for a
  // frame, seen from above on the coping.)
  const f0 = e.td + 0.02;
  const fk = sstep(f0, f0 + 0.13, s);
  const up = flapPose(ph, 1.08), flexed = { ...TUCK, elev: up.elev };
  const pose = mixPose(mixPose(up, flexed, sstep(0, 0.45, fk)), TUCK, sstep(0.45, 1, fk));
  const open = 1 - sstep(0.3, 0.8, fk);
  const spread = lerp(1, 0.12, sstep(e.td + 0.12, e.td + 0.45, s));
  const tp = tailClear(F, spread, lerp(0.3, -0.12, sstep(e.td + 0.05, e.td + 0.45, s)), 0.5, p.feet.y);
  // then it looks round, on beats of its own (a pigeon holds its head still between turns)
  let hy = 0, hp = lerp(-0.75 * (LAND.tdPitch - 0.08), 0.05, k);
  if (!e.beats) e.beats = lookBeats(600 + LAND5.indexOf(e) * 7);
  if (s > e.td + 0.55) {
    let j = 0;
    while (j < e.beats.length && e.beats[j] <= S5.t0 + s) j++;
    hy = [0.35, -0.3, 0.55, 0.1, -0.5, 0.25][j % 6];
    hp = [0.05, 0.12, 0.0, 0.2, 0.08, -0.05][j % 6];
  }
  return { F, pose, open, tail: spread, tailPitch: tp, headYaw: hy, headPitch: hp, legs: 1, h: p.h, flying: false, yaw, stood: k >= 1 };
}
// Colours: far, the flock's flat silhouettes (as drawFlock has them); near, the drawn bird in the
// same shade as the coop's three, backlit, lighter for a light bird.
// (the underwing paler than the back, as a rock pigeon's is: dark underwings raised in the flare
// stood over the bird as a shell)
const LAND_FILL = { grey: ['#6f6290', '#968bb4'], white: ['#c9c0da', '#ddd6e8'], dark: ['#463c5f', '#6c6288'], red: ['#74526b', '#9a7d96'] };
const flatColor5 = (kind, z) => {
  const base = BIRD_COLS[kind];
  const haze = clamp((z - 22 * FS) / (60 * FS), 0, kind === 'dark' || kind === 'red' ? 0.32 : 0.5);
  const sky = [150, 128, 184];
  const c = base.map((v, k) => Math.round(lerp(v, sky[k], haze)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
// the legs: tarsus and three toes forward, pinkish, from under the body; out (forward and down,
// toward the spot) as it comes in, under it once it stands
function drawLegs5(st, proj, feet, sz) {
  if (st.legs <= 0.02) return;
  const F = st.F;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#b8636c';
  for (const sd of [-1, 1]) {
    const hip = toP(F, V3(sd * 0.014, -0.03, -0.005));
    let foot, ankle = null;
    if (st.flying) {
      // reaching for the ledge: the shank down and a little forward, bent at the ankle, the tarsus
      // (a rock pigeon's is 26-32 mm) forward to the foot, the feet a little apart. (One straight
      // stroke 10.5 cm long was two chopsticks under the bird, once they were seen for six frames.)
      const side = n3(F.x);
      ankle = a3(hip, m3(a3(a3(m3(st.h, 0.012 * sz), m3(UP5, -0.05 * sz)), m3(side, sd * 0.004 * sz)), st.legs));
      foot = a3(ankle, m3(a3(a3(m3(st.h, 0.028 * sz), m3(UP5, -0.024 * sz)), m3(side, sd * 0.004 * sz)), st.legs));
    } else foot = a3(feet, m3(n3(F.x), sd * 0.012 * sz));
    const a = proj(hip), b = proj(foot);
    const k = (CAM.f * Z5.k) / b.z;
    ctx.lineWidth = clamp(0.0065 * k * sz, 1, 3);
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    if (ankle) { const c = proj(ankle); ctx.lineTo(c.x, c.y); }
    ctx.lineTo(b.x, b.y); ctx.stroke();
    // toes: three forward, spread, one back
    const fw = st.flying ? st.h : n3(V3(F.z.x, 0, F.z.z));
    const sideV = n3(V3(fw.z, 0, -fw.x));
    ctx.lineWidth = clamp(0.005 * k * sz, 0.8, 2.4);
    for (const [f, sdd] of [[1, 0], [0.85, 0.5], [0.85, -0.5], [-0.6, 0]]) {
      const tip = a3(foot, m3(n3(a3(m3(fw, f), m3(sideV, sdd))), 0.028 * sz * (st.flying ? 0.8 : 1)));
      const c = proj(tip);
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke();
    }
  }
  ctx.restore();
}
function drawLander(e, s, t) {
  const st = landState(e, s), bird = birdOf(e), p = landPlan(e);
  const proj = (q) => proj5(q, t);
  const camPos = V3(0, craneH(t), 0);
  const q = proj(st.F.o);
  if (q.z < 1 || q.x < -250 || q.x > W + 250 || q.y < -250 || q.y > H + 250) return;
  const k = (CAM.f * Z5.k) / q.z;
  const kind = bird.kind;
  const base = { pose: st.pose, open: st.open, tail: st.tail, tailPitch: st.tailPitch, tailCup: 0.5, headYaw: st.headYaw, headPitch: st.headPitch };
  // (small and flat, turned about its line of flight for the lens as drawAround's are, fading out
  // before it is drawn in the round: coming at us, the wings were edge on, sticks)
  const Fflat = () => {
    const r = st.flying ? viewRoll(frameAt(s3(st.F.o, camPos), st.F.x, st.F.y, st.F.z), 0.5) * (1 - sstep(60, 95, k)) : 0;
    return r ? turnFrame(st.F, n3(st.F.z), r) : st.F;
  };
  const flat = () => drawPigeon(Fflat(), proj, camPos, { ...base, color: flatColor5(kind, q.z) }, 'flat');
  const fill = e.b < 0 ? ['#ddd5ea', '#ece7f3'] : LAND_FILL[kind];
  // (coming in toward the lens, the legs reach forward out of the belly on our side of it and are
  // drawn over the body; drawn under it they were hidden until the last two frames, though they are
  // out from 0.26 s before touchdown: diamond doves start to extend them 137 +- 37 ms before it,
  // at the downstroke of the third wingbeat from the end, which at a pigeon's slower beat is
  // earlier still (Provini et al. 2014))
  const legsFront = st.flying && st.legs > 0.02 && proj(a3(st.F.o, m3(st.h, 0.045 * p.sz))).z < q.z;
  const inked = () => {
    if (!legsFront) drawLegs5(st, proj, p.feet, p.sz);
    drawPigeon(st.F, proj, camPos, { ...base, fill: fill[0], fillUnder: fill[1], rim: '#ffd7ae', inkFade: [90, 150] }, 'hero');
    if (legsFront) drawLegs5(st, proj, p.feet, p.sz);
  };
  // (fast across the picture, 25..35 px a frame over the coop, it leaves a faint copy half a frame
  // back, as drawFlock's birds do: drawn sharp it stepped from place to place)
  if (s < e.td) {
    const q0 = proj(landState(e, s - 1 / FPS).F.o), dx = q.x - q0.x, dy = q.y - q0.y;
    if (Math.hypot(dx, dy) > 24) {
      const sh = landState(e, s - 0.45 / FPS);
      const rs = viewRoll(frameAt(s3(sh.F.o, camPos), sh.F.x, sh.F.y, sh.F.z), 0.5) * (1 - sstep(60, 95, k));
      ctx.save();
      ctx.globalAlpha = 0.12;
      drawPigeon(rs ? turnFrame(sh.F, n3(sh.F.z), rs) : sh.F, proj, camPos, { pose: sh.pose, open: sh.open, tail: sh.tail, tailPitch: sh.tailPitch, tailCup: 0.5, color: flatColor5(kind, q.z) }, 'flat');
      ctx.restore();
    }
  }
  const k0 = 95, k1 = 135;
  if (k < k0) flat();
  else if (k < k1) {
    flat();
    const real = ctx, c = scratch('land5', W, H);
    ctx = c.getContext('2d');
    try { inked(); } finally { ctx = real; }
    ctx.save();
    ctx.globalAlpha = sstep(k0, k1, k);
    ctx.drawImage(c, 0, 0, W, H, 0, 0, W, H);
    ctx.restore();
  } else inked();
}
// The birds that go round again: out of the tail of the stream they climb away left and circle
// wide over the mahalla, as the flock circled it (anticlockwise from above), to come down later.
const ROUND5 = { C: V3(-6, 7.5, 24), R: 6, v: 9, ph0: 0.2 };
function aroundPos(j, s) {
  const i = AROUND5[j], b = FLOCK[i];
  // (from the tail of the stream, behind the birds that land)
  const P0 = a3(a3(V3(-0.5, 5.6, 20.5), m3(LAND.stream, -2.2 * (j / AROUND5.length))), V3(b.dr * 1.4, b.dy * 1.2, b.dphi * 4));
  const w = ROUND5.v / ROUND5.R, tj = 1.2 + 0.12 * j;
  const circ = (tt) => {
    const ph = ROUND5.ph0 + w * (tt - tj) + b.dphi * 1.5;
    return { p: a3(ROUND5.C, V3(ROUND5.R * Math.cos(ph) + b.dr, b.dy * 1.5 + 0.8 * Math.sin(tt * 0.7 + b.bob), ROUND5.R * Math.sin(ph))), v: V3(-ROUND5.R * w * Math.sin(ph), 0, ROUND5.R * w * Math.cos(ph)) };
  };
  if (s >= tj) return circ(s).p;
  const c = circ(tj);
  const T = tj + 0.5, x = (s + 0.5) / T;
  return hermite(P0, m3(LAND.stream, LAND.v0), c.p, c.v, T, clamp(x, 0, 1));
}
function drawAround(j, s, t) {
  const i = AROUND5[j], b = FLOCK[i];
  const e1 = 1 / 96, pos = aroundPos(j, s), v = m3(s3(aroundPos(j, s + e1), aroundPos(j, s - e1)), 48);
  const vh = V3(v.x, 0, v.z), sp = len3(vh) || 1, h = m3(vh, 1 / sp);
  const e2 = 3 / FPS, acc = m3(a3(s3(aroundPos(j, s + e2), m3(pos, 2)), aroundPos(j, s - e2)), 1 / (e2 * e2));
  const L = V3(h.z, 0, -h.x);
  const bank = clamp(Math.atan(dot3(acc, L) / G) * b.bk, -0.8, 0.8);
  const gam = Math.atan2(v.y, sp);
  let F = bodyFrame(pos, a3(m3(h, Math.cos(gam)), m3(UP5, Math.sin(gam))), bank, b.sz);
  F = turnFrame(F, n3(F.z), viewRoll(F, 0.5));
  const proj = (q) => proj5(q, t);
  const q = proj(pos);
  if (q.z < 1) return;
  // climbing away, they work their wings
  const a = Math.max(activity(b.sched, t), sstep(0.2, 0.8, v.y));
  let ph = b.ph0;
  for (let k = 0; k < Math.round((s + 1) * 48); k++) ph += (SHEET.flap * b.rate * Math.max(activity(b.sched, S5.t0 - 1 + k / 48), 0.5)) / 48;
  const pose = mixPose(mixPose(GLIDE, flapPose(b.rph / TAU, b.amp), 0.2), flapPose(ph, b.amp), a);
  drawPigeon(F, proj, V3(0, craneH(t), 0), { pose, open: 1, tail: 0.25, tailCup: 0.5, color: flatColor5(b.kind, q.z) }, 'flat');
}
// The coop's own three birds, in the round (shot 1 draws them side-on for its lens; seen through
// the same lens in the round they are the same birds): they watch the flock come in, each on its
// own beat, and look to the ones that come down next to them.
function perchAim5(b, tb) {
  const W0 = unprojW(b.x, b.y, COOP_D, 0);
  let best = null, bd = 1e9;
  const s = tb - S5.t0;
  for (const e of LAND5) {
    if (e.on === 'off' && s > e.td - 0.6) continue;
    const pos = landPos(e, clamp(s, -0.5, e.td)).pos, d = len3(s3(pos, W0));
    // the nearest bird still in the air, or one just down beside it
    if (s > e.td + 0.8) continue;
    if (d < bd) { bd = d; best = pos; }
  }
  return best ? s3(best, W0) : null;
}
function drawPerched5(t, tc, only = null) {
  for (const b of PERCHED) {
    if (only && !only.includes(b)) continue;
    let k = 0;
    while (k < b.beats.length && b.beats[k] <= tc) k++;
    const tb = k > 0 ? b.beats[k - 1] : 0;
    const W0 = unprojW(b.x, b.y, COOP_D, 0);
    // (the middle one sat facing shot 1's lens: seen in the round from here, square on, it was an
    // upright egg with a fan under it, the owl shot 2 turned it away from; twenty seconds on it has
    // turned a little, to three-quarters)
    const yaw = b.yaw + (b === PERCHED[1] ? -0.75 : 0);
    let hy = b.look[k % b.look.length], hp = 0.05;
    const d = perchAim5(b, tb);
    if (d) {
      const aim = Math.atan2(d.x, d.z) - yaw;
      hy = clamp(Math.atan2(Math.sin(aim), Math.cos(aim)) + b.look[k % b.look.length] * 0.2, -1.9, 1.9);
      hp = clamp(0.1 + 0.7 * Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.3, 0.6);
    }
    const br = Math.sin(TAU * 1.3 * tc + b.x * 0.05);
    const settle = k > 0 ? Math.exp(-(tc - tb) / 0.1) : 0;
    // a bird coming down right beside it: it ducks and leans away as the wings come in
    let lean = 0;
    for (const e of LAND5) {
      if (e.on !== 'coop') continue;
      const dx = e.x - b.x;
      if (Math.abs(dx) > 80) continue;
      lean += -Math.sign(dx) * 0.05 * Math.exp(-(((tc - S5.t0 - e.td + 0.05) / 0.16) ** 2));
    }
    let F = yprFrame(frameAt(a3(W0, V3(lean, 0.07 * b.sz - 0.004 * settle - Math.abs(lean) * 0.25, 0)), V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)), yaw, 0.5 + 0.06 * settle, 0);
    F = frameAt(F.o, m3(F.x, b.sz * (1 + 0.012 * br)), m3(F.y, b.sz * (1 + 0.02 * br)), m3(F.z, b.sz));
    const proj = (p) => proj5(p, t);
    ctx.fillStyle = '#b8636c';
    for (const dx of [-0.012, 0.012]) {
      const a = proj(a3(W0, V3(dx, 0.022, 0))), c = proj(a3(W0, V3(dx, 0, 0)));
      ctx.fillRect(a.x - 1.2, a.y, 2.4, c.y - a.y + 1);
    }
    drawPigeon(F, proj, V3(0, craneH(t), 0), { pose: GLIDE, open: 0, tail: 0.12, tailPitch: -0.12, headYaw: hy, headPitch: hp, fill: '#6a5c8a', fillUnder: '#5d4f7c', rim: '#ffd7ae' }, 'hero');
  }
}
// all the flock's birds at shot time s: far ones (before the town's near rows), then the rest
function drawFlock5(t, s, band) {
  const items = [];
  for (const e of LAND5) {
    const st = landPos(e, Math.min(s, e.td));
    const z = projW(st.pos, t).z;
    const where = e.on === 'coop' ? 'coop' : e.on === 'cap' ? 'cap' : 'air';
    items.push({ z, where, draw: () => drawLander(e, s, t), e });
  }
  for (let j = 0; j < AROUND5.length; j++) items.push({ z: projW(aroundPos(j, s), t).z, where: 'air', draw: () => drawAround(j, s, t) });
  items.sort((a, b) => b.z - a.z);
  // (a lander goes in front of the ledge it comes down on in its last third of a second: it is
  // over the ledge by then, above its top)
  const bandOf = (it) => (it.where !== 'air' && s >= it.e.td - 0.35 ? it.where : it.z >= 14 ? 'far' : 'mid');
  for (const it of items) if (bandOf(it) === band) it.draw();
}

// ------------------------------------------------------------------ his face
// Until now he was only ever seen from behind, the face a lost profile past his cheek. Here he
// turns round, and the face is a boy's of ten to twelve (Farkas' norms for boys of 10 and 12,
// in mm: eyes' outer corners 83-86 apart, inner corners 31-32, pupils 57-58 (MacLachlan &
// Howland 2002), mouth 46-48 wide, nose 30-32 wide, nasion to chin 105-108, subnasale to chin
// 64-65; a child's eyes a little below the middle of the head). In the head's own frame (x his
// right, y up, z where he faces; metres, before the head's 1.12 scale).
// The face as a solid: the sides (cheekbones, cheeks, jaw) as one hull, and down the middle a
// chain of small masses (brow, the dip at the nasion, the bridge, the tip, under the nose, the
// lips, the dip under them, the chin) joined as a union, so that turned to three-quarters or
// profile the outline has a nose, a mouth and a chin. (One hull of all of them, which the lost
// profile had, fills the dips in: a smooth front with no nose.)
// The face below is laid out as first drawn, then moved in height by fy5: built nasion to chin
// 111 mm (124 at the head's scale, a man's: 121), on a head 203 mm from crown to chin, the face was
// 55 % of the head, a man's proportion (121 of 232, 52 %), where a boy of ten has 105 of about
// 215 (49 %): with his face he read 12 to 14. So the eyes and brows come down 5 mm (a child's eyes
// sit a little below the middle of the head) and the face below the nose is shortened by 15 %,
// the chin rising 6.5 mm (the lower face is what grows most after ten): nasion to chin 99.5 mm,
// 49 %; the eye line 52 % down from the crown. Near the eyes it is a plain shift, so the eyes keep
// their shape; above the brow it fades out up the forehead, which grows taller, as a child's is.
const FACE5Y = { shift: -0.005, y1: 0.08, top: SKULL.c.y + SKULL.r.y, yc: 0.04, k: 0.005, c: 0.151 };
function fy5(y) {
  const up = 1 - smooth(clamp((y - FACE5Y.y1) / (FACE5Y.top - FACE5Y.y1), 0, 1));
  const x = (FACE5Y.yc - y) / FACE5Y.k;
  return y + FACE5Y.shift * up + FACE5Y.c * FACE5Y.k * (x > 30 ? x : Math.log1p(Math.exp(x)));
}
const fv5 = (v) => V3(v.x, fy5(v.y), v.z);
const FACE_SIDE = [
  [0.05, 0.058, 0.026, 0.01], [0.04, 0.056, 0.044, 0.012], [0.034, 0.083, 0.054, 0.011],
  [0.039, 0.028, 0.04, 0.014], [0.034, 0.008, 0.047, 0.013], [0.041, 0.011, 0.01, 0.011],
  [0.031, -0.01, 0.036, 0.01], [0.021, -0.018, 0.054, 0.01],
];
// Down the middle, the profile as a swept section: at each height [y, front z, half-width,
// depth], the front of the face; neighbouring sections are joined, so the outline in profile is
// one line (small round masses strung down it drew a string of beads).
// (a boy's: no ridge at the brow, the forehead running smooth into a shallow nasion, a low bridge
// and a small tip turned up, well ahead of the brow; with the brow's ridge 4.5 mm proud of the
// forehead and a nose no further forward than it, the outline at three-quarters was a man's)
const PROFILE5 = [
  [0.1, 0.087, 0.03, 0.02], [0.092, 0.0885, 0.022, 0.016], [0.084, 0.0875, 0.015, 0.013],
  [0.075, 0.083, 0.0085, 0.01],                                                       // nasion
  [0.066, 0.0855, 0.0066, 0.009], [0.056, 0.0905, 0.0068, 0.009], [0.047, 0.097, 0.0076, 0.009],
  [0.041, 0.1045, 0.0088, 0.0095], [0.035, 0.1045, 0.0095, 0.01], [0.03, 0.098, 0.0088, 0.01],     // tip
  [0.0255, 0.0875, 0.009, 0.008],                                                     // under the nose
  [0.02, 0.0885, 0.015, 0.008], [0.0135, 0.0912, 0.018, 0.008], [0.0078, 0.0895, 0.02, 0.007],    // upper lip
  [0.002, 0.0902, 0.017, 0.008], [-0.004, 0.0872, 0.014, 0.008],                      // lower lip
  [-0.0105, 0.0818, 0.012, 0.008],                                                    // the dip under it
  [-0.019, 0.0812, 0.014, 0.012], [-0.026, 0.0795, 0.014, 0.013],                     // chin: a boy's, small
  [-0.032, 0.072, 0.012, 0.013], [-0.036, 0.06, 0.012, 0.013],                        // under the chin
];
// cheeks lifting in the smile (the cheek raiser: skin drawn up toward the eye)
const FACE_CHEEK = [0.034, 0.032, 0.045, 0.012];
function faceShapes5(Hd, HS, proj, smile, tuck = 0) {
  const disc = (x, y, z, r) => {
    const pc = proj(toP(Hd, m3(fv5(V3(x, y, z)), HS)));
    const rr = pxPerM(pc.z) * r * HS, pts = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; pts.push(V(pc.x + Math.cos(a) * rr, pc.y + Math.sin(a) * rr)); }
    return pts;
  };
  const side = [];
  for (const [x, y, z, r] of FACE_SIDE) for (const sg of [1, -1]) side.push(...disc(sg * x, y, z, r));
  const [cx, cy, cz, cr] = FACE_CHEEK;
  // (the cheeks round out as they lift: the far one's bulge is the smile on the face's outline)
  for (const sg of [1, -1]) side.push(...disc(sg * (cx + 0.004 * smile), cy + 0.004 * smile, cz + 0.0025 * smile, cr + 0.003 * smile));
  const out = [{ pts: smoothLoop(hull(side), 40, 2), smooth: false }];
  const secs = PROFILE5.map(([y, z, w, d], i) => {
    // the smile widens the mouth's sections a little
    const ww = w + (y < 0.022 && y > -0.006 ? 0.003 * smile : 0);
    const pts = [];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; pts.push(proj(toP(Hd, m3(fv5(V3(Math.cos(a) * ww, y, z - d - tuck + Math.sin(a) * d)), HS)))); }
    return pts;
  });
  for (let i = 0; i + 1 < secs.length; i++) out.push({ pts: hull(secs[i].concat(secs[i + 1])), smooth: false });
  return out;
}
// The features. Eyes: the lids' opening from the inner corner (en) to the outer (ex), the outer
// corner 12 mm further back than the inner and 2 mm higher; the upper lid highest a little in from
// the middle, the lower lid lowest a little out from it; the eyeball behind (a boy's is some 23 mm
// across) with the iris (11.7 mm) and pupil on it where he looks.
// (a child's eye is nearly an adult's in size, on a smaller face: the opening some 10 mm tall for
// 26 mm wide. At 4 mm the smiling eye was a slit, and with the brow low over it he looked sly)
// (the opening drawn 10 % taller than the measured 10 mm, and the iris 12 mm: at the size he is on
// the screen, 15 px wide, the eye as measured read as a slit with a dark bead in it)
const EYE5 = { en: V3(0.0155, 0.0655, 0.066), ex: V3(0.042, 0.0675, 0.054), c: V3(0.0285, 0.066, 0.0555), r: 0.0115, ri: 0.006, rp: 0.0024, hU: 0.0066, hL: 0.005 };
function eyelid5(sg, u, open, smile, upper) {
  const E = EYE5, x = sg * lerp(E.en.x, E.ex.x, u);
  // (in the smile the outer corner lifts 1.2 mm, the smiling eye's upward tilt)
  const y0 = lerp(E.en.y, E.ex.y, u) + 0.0012 * smile * u * u, z = lerp(E.en.z, E.ex.z, u) + 0.0042 * Math.sin(Math.PI * u);
  // (a child's upper lid is a round arch, rising steeply from the corners: the sine alone gave a
  // long low curve, an older, heavier lid)
  // (in the smile the upper lid stays where it is: lowered with the lower lid raised it was the lid
  // tightener, AU 7, a squint, which reads as a sly or put-on smile)
  if (upper) return V3(x, y0 + E.hU * open * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.72), z + 0.0008 * Math.sin(Math.PI * u));
  // the smile pushes the lower lid up from below, the cheek raiser (AU 6): most in the middle, so
  // the lid straightens under the eye, the smiling eye's flat lower edge (raised evenly by 0.3,
  // with the upper lid down as well, three-quarters on and 5 px tall, the eye was a slit)
  // (all along it, to a fifth of its drop, so in the full smile the lower lid lies nearly flat over
  // the bottom third of the iris and the eye is a half moon: the eyes smile too. Lifted by a third
  // or a half in the middle only, the eye was 1 px shorter than open and the lid still sagged: a
  // wide-open eye over a smiling mouth, pleased with himself, not glad.)
  const lo = E.hL * Math.sin(Math.PI * Math.pow(u, 1.15)) * (1 - 0.78 * smile);
  return V3(x, y0 - lo, z);
}
// the brow: a boy's, soft, thicker at the head; in the smile it lifts a little at the head
const BROW5 = [[0.011, 0.0845, 0.0845], [0.021, 0.0892, 0.0825], [0.032, 0.0906, 0.0772], [0.042, 0.0882, 0.068], [0.049, 0.0835, 0.0585]];
// The mouth: the line between the lips, corners 23 mm out, round the face (set back 13 mm at the
// corners); in the smile (the lip-corner puller) the corners go up and back, and the mouth widens,
// each corner 4.1 mm (9 % of the mouth's width, as measured for smiles; at 4.8 the smile was long
// and thin, a man's), and opens a little on the upper teeth.
const MOUTH5 = { w0: 0.023, dw: 0.0041 };
function mouthPt5(x, smile, open, lower = false) {
  const w = MOUTH5.w0 + MOUTH5.dw * smile, u = clamp(x / w, -1, 1), a = Math.abs(u);
  const y = 0.0075 + (0.0055 * smile - 0.0006) * a * a - (lower ? open * (1 - a * a) : 0);
  return V3(u * w, y, 0.0895 - 0.0145 * a * a - 0.0022 * smile * a * a);
}
const farSgPre = (Hd) => (dot3(dirP(Hd, V3(1, 0, 0)), n3(s3(BOY_CAM, Hd.o))) < 0 ? 1 : -1);
function drawFace5(R, HP, F, headP) {
  const { Hd, HS, proj } = HP;
  // (every point of the face goes through fy5, the boy's proportions)
  const P = (v) => proj(toP(Hd, m3(fv5(v), HS)));
  const toCam = (v) => n3(s3(BOY_CAM, toP(Hd, m3(fv5(v), HS))));
  // how much a surface with normal n (head frame) faces the lens, as an ink alpha
  const seen = (v, n, a = 0.05, b = 0.3) => sstep(a, b, dot3(dirP(Hd, n3(n)), toCam(v)));
  const kpx = pxPerM(proj(Hd.o).z) * HS;          // px per (unscaled) metre of the face here
  const lw = (m) => Math.max(0.6, m * kpx);
  const line = (pts, w, col, alpha = 1) => {
    if (alpha < 0.02 || pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ink(curvePath(pts, false), w, col);
    ctx.restore();
  };
  ctx.save();
  ctx.clip(headP);
  // The face in the sky's light: the sun is behind his head, so the face turned to us is lit only
  // by the open sky over the lens; a soft lighter plane on the front of the face (forehead,
  // cheek, the near side of the nose), fading toward the ear and the jaw.
  const faceUp = sstep(0.4, 0.62, F.turn);
  if (faceUp > 0.01) {
    const c0 = P(V3(-farSgPre(Hd) * 0.012, 0.055, 0.075)), e0 = P(V3(-farSgPre(Hd) * 0.07, 0.04, 0.0));
    const r = len(sub(e0, c0));
    const g = ctx.createRadialGradient(c0.x, c0.y, r * 0.15, c0.x, c0.y, r * 1.05);
    g.addColorStop(0, `rgba(150,112,140,${(0.42 * faceUp).toFixed(3)})`);
    g.addColorStop(0.6, `rgba(150,112,140,${(0.22 * faceUp).toFixed(3)})`);
    g.addColorStop(1, 'rgba(150,112,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(c0.x - r * 1.1, c0.y - r * 1.1, r * 2.2, r * 2.2);
    // warmth in the cheeks, a child's, a little more as the smile lifts them (soft, under the
    // features; the far cheek only where it shows beside the nose). Without it the face was one
    // cool mauve from brow to chin, a mask.
    for (const sg of [1, -1]) {
      const cv = seen(V3(sg * 0.04, 0.032, 0.055), V3(sg * 0.6, 0, 0.8), 0.0, 0.35);
      if (cv < 0.03) continue;
      // (on the apple of the cheek, under the eye's outer half and beside the nose's wing; placed
      // out toward the ear it was a spot of rouge)
      const c = P(V3(sg * (0.031 + 0.002 * F.smile), 0.03 + 0.004 * F.smile, 0.064)), rr = 0.023 * kpx;
      const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr);
      const al = (0.09 + 0.07 * F.smile) * cv * faceUp;
      cg.addColorStop(0, `rgba(204,98,120,${al.toFixed(3)})`);
      cg.addColorStop(1, 'rgba(204,98,120,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rr, rr * 0.8, 0, 0, TAU); ctx.fill();
    }
  }
  // Form in the soft light: the open sky over the lens lights him from above and in front, so the
  // hollows under the nose and under the lower lip, and the inner corner of the eye's socket under
  // the brow, lie in a little shade (soft, a tenth of the way to the line colour: without them the
  // features sat on one flat plane, a mask, with them the face has a mouth and a nose in it)
  if (faceUp > 0.01) {
    const soft = (v, r, a, sq = 0.7) => {
      if (a < 0.005) return;
      const c = P(v), rr = r * kpx;
      const sg2 = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr);
      sg2.addColorStop(0, `rgba(40,20,42,${a.toFixed(3)})`);
      sg2.addColorStop(1, 'rgba(40,20,42,0)');
      ctx.fillStyle = sg2;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rr, rr * sq, 0, 0, TAU); ctx.fill();
    };
    const nS = -farSgPre(Hd);
    // (at a tenth of the line colour they darkened the skin by 1.7..1.9 L, measured: below seeing;
    // at a quarter the one under the nose was a moustache's shadow and the one under the lip a
    // smudge on the chin)
    soft(V3(nS * 0.002, 0.021, 0.086), 0.007, 0.15 * faceUp * seen(V3(0, 0.021, 0.086), V3(0, -0.2, 1), -0.2, 0.2), 0.55);
    soft(V3(nS * 0.002, -0.007, 0.083), 0.008, 0.14 * faceUp * seen(V3(0, -0.007, 0.083), V3(0, -0.1, 1), -0.2, 0.2), 0.5);
    soft(V3(nS * 0.017, 0.073, 0.071), 0.011, 0.18 * faceUp * seen(V3(nS * 0.017, 0.073, 0.071), V3(nS * 0.3, 0.1, 0.95), 0.0, 0.3), 0.8);
  }
  // which eye is the far one: the one on the side of the head turned away from the lens
  const farSg = dot3(dirP(Hd, V3(1, 0, 0)), n3(s3(BOY_CAM, Hd.o))) < 0 ? 1 : -1;
  // the nose's bridge on the picture, and the side of it the far eye is on (the bridge hides the
  // far eye's inner corner at three-quarters)
  const n0 = P(V3(0, 0.076, 0.082)), n1 = P(V3(0, 0.05, 0.094));
  const nd = norm(sub(n1, n0)), nn = perp(nd);
  // (the side away from the near eye, which is always well to its own side of the line, 38 px in
  // the hold. Judged by the far eye's own middle, which at three-quarters lies on the line, the
  // side flipped at f128 and back at f136: a wink. Judged by the far temple, 7 cm further back, it
  // came out on the near eye's side: the far eye's outer part, beyond the bridge, was cut away and
  // its inner corner, behind the nose, drawn over it as a dark notch)
  const farSide = -Math.sign(dot(sub(P(V3(-farSg * EYE5.c.x, EYE5.c.y, EYE5.c.z)), n0), nn)) || 1;
  // --- the eyes
  const Pn = P;
  for (const sg of [farSg, -farSg]) {
    const far = sg === farSg;
    const c3 = V3(sg * EYE5.c.x, EYE5.c.y, EYE5.c.z);
    const vis = seen(c3, V3(sg * 0.35, 0.05, 0.94), 0.08, 0.32);
    if (vis < 0.03) continue;
    // (the far eye, turned 67 degrees from us, is drawn a third wider than it is, about its own
    // middle, as an animator cheats it: at its true width, 5 px, the iris filled it from lid to lid
    // and it read as a keyhole, a dark speck by the nose)
    const ec = Pn(c3);
    const P = far ? (v) => { const q = Pn(v); return { x: ec.x + 1.35 * (q.x - ec.x), y: q.y, z: q.z }; } : Pn;
    const up = [], lo = [];
    for (let k = 0; k <= 10; k++) { up.push(eyelid5(sg, k / 10, F.open, F.smile, true)); lo.push(eyelid5(sg, k / 10, F.open, F.smile, false)); }
    const upP = up.map(P), loP = lo.map(P);
    const hole = curvePath(upP.concat(loP.slice(1, -1).reverse()), true, new Path2D(), new Set([0, 10]));
    ctx.save();
    if (far) {
      // behind the bridge of the nose: only the part of it beyond the bridge's line
      const B = 3000, o = sub(n0, mul(nd, B));
      const half = [add(o, mul(nn, farSide * 0.6)), add(add(n0, mul(nd, B)), mul(nn, farSide * 0.6)), add(add(n0, mul(nd, B)), mul(nn, farSide * B)), add(o, mul(nn, farSide * B))];
      ctx.clip(polyPath(half));
    }
    ctx.globalAlpha = vis;
    if (F.open > 0.08) {
      ctx.save();
      ctx.clip(hole);
      // the white of the eye, in the shade of the face (the sun is behind his head)
      ctx.fillStyle = '#b9a8bd';
      ctx.fill(hole);
      // iris and pupil where he looks
      const g = n3(V3(Math.sin(F.gy) * Math.cos(F.gp), Math.sin(F.gp), Math.cos(F.gy) * Math.cos(F.gp)));
      const e1 = n3(cross3(V3(0, 1, 0), g)), e2 = cross3(g, e1);
      const dep = Math.sqrt(EYE5.r ** 2 - EYE5.ri ** 2);
      const ring = (r0, dd) => { const pts = []; for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; pts.push(P(a3(a3(c3, m3(g, dd)), a3(m3(e1, Math.cos(a) * r0), m3(e2, Math.sin(a) * r0))))); } return pts; };
      // (a boy's brown iris in the face's shade: darker under the lid, lighter below where the sky
      // comes in, with its dark rim, the limbus. One flat near-black disc read as a bead.)
      const irisPts = ring(EYE5.ri, dep), ib = bboxOf(irisPts, 0);
      const ig = ctx.createLinearGradient(0, ib.y0, 0, ib.y1);
      if (far) { ig.addColorStop(0, '#3a2229'); ig.addColorStop(0.55, '#5f3b36'); ig.addColorStop(1, '#7a513e'); }
      else { ig.addColorStop(0, '#2c1720'); ig.addColorStop(0.55, '#51302d'); ig.addColorStop(1, '#6f4634'); }
      ctx.fillStyle = ig;
      const irisP = polyPath(irisPts);
      ctx.fill(irisP);
      ink(irisP, lw(0.0006), '#23111a');
      ctx.fillStyle = '#140a12';
      ctx.fill(polyPath(ring(EYE5.rp, Math.sqrt(EYE5.r ** 2 - EYE5.rp ** 2))));
      // the upper lid's shadow on the eyeball
      ctx.globalAlpha = vis * 0.45;
      ink(curvePath(upP, false), lw(0.0022), '#2a1826');
      // a catchlight: the open sky behind the lens in the wet of the eye
      const cl = P(a3(a3(c3, m3(g, EYE5.r * 1.001)), a3(m3(e1, -0.0022 * sg), m3(e2, 0.0022))));
      ctx.globalAlpha = vis * 0.75;
      ctx.fillStyle = '#e4dcf0';
      ctx.beginPath(); ctx.arc(cl.x, cl.y, Math.max(0.6, 0.0013 * kpx), 0, TAU); ctx.fill();
      ctx.restore();
    }
    // the upper lid's line (lashes): heavy, running a little past the outer corner; the lower lid
    // a light line along its outer part; the fold of the lid above
    ctx.globalAlpha = 1;
    // (no flick past the outer corner: it gave him a sly, made-up look)
    // the lash line as a drawn stroke: fine at the inner corner, heaviest two-thirds of the way out,
    // easing off at the outer corner (one even line read as a diagram of an eye)
    {
      const tw = (u) => (u < 0.7 ? lerp(0.0006, 0.0023, smooth(u / 0.7)) : lerp(0.0023, 0.001, (u - 0.7) / 0.3));
      const top = [], bot = [];
      for (let i = 0; i < upP.length; i++) {
        const a = upP[Math.max(0, i - 1)], b = upP[Math.min(upP.length - 1, i + 1)], nrm = perp(norm(sub(b, a)));
        const w = lw(tw(i / (upP.length - 1))) * 0.5;
        top.push(add(upP[i], mul(nrm, w))); bot.push(sub(upP[i], mul(nrm, w)));
      }
      ctx.save();
      ctx.globalAlpha = vis;
      ctx.fillStyle = PAL.line;
      ctx.fill(curvePath(top.concat(bot.reverse()), true, new Path2D(), new Set([0, upP.length - 1, upP.length, 2 * upP.length - 1])));
      ctx.restore();
    }
    line(loP.slice(5, 10), lw(0.0007), PAL.skinLine, vis * 0.3);
    const crease = up.slice(2, 10).map((q) => P(a3(q, V3(0, 0.0034 + 0.0006 * (1 - F.open), 0.0012))));
    line(crease, lw(0.0007), PAL.skinLine, vis * 0.18 * F.open);
    // (no fold or light line under the smiling eye: at this size the lid's own shape says it, and
    // the lines read as bags under the eyes, older and tired)
    ctx.restore();
    // the brow
    const bv = seen(V3(sg * 0.03, 0.085, 0.078), V3(sg * 0.3, 0.3, 0.9), 0.02, 0.28);
    if (bv > 0.03) {
      // (in the smile the brow's head lifts, 2 mm at the inner end and less along it: open and glad;
      // lifted evenly by 1 mm it did not read, and the face kept a level, knowing look)
      const bp = BROW5.map(([x, y, z], i) => P(V3(sg * x, y + F.smile * [0.002, 0.0015, 0.0009, 0.0005, 0.0003][i], z)));
      ctx.save();
      if (far) {
        const B = 3000, o = sub(n0, mul(nd, B));
        ctx.clip(polyPath([add(o, mul(nn, farSide * -2)), add(add(n0, mul(nd, B)), mul(nn, farSide * -2)), add(add(n0, mul(nd, B)), mul(nn, farSide * B)), add(o, mul(nn, farSide * B))]));
      }
      // a tapering stroke: thick at the head, thin at the tail
      const top = [], bot = [];
      for (let i = 0; i < bp.length; i++) {
        const a = bp[Math.max(0, i - 1)], b = bp[Math.min(bp.length - 1, i + 1)], nrm = perp(norm(sub(b, a)));
        const w = lw(lerp(0.0016, 0.0006, i / (bp.length - 1)));
        top.push(add(bp[i], mul(nrm, w))); bot.push(sub(bp[i], mul(nrm, w)));
      }
      ctx.globalAlpha = bv * 0.85;
      ctx.fillStyle = PAL.hair;
      ctx.fill(curvePath(top.concat(bot.reverse()), true, new Path2D(), new Set([0, bp.length - 1, bp.length, 2 * bp.length - 1])));
      ctx.restore();
    }
  }
  // --- the nose: the wing and nostril on the near side, a light line up the near side of the
  // bridge (its far side is the outline itself at three-quarters)
  const nearSg = -farSg;
  const nv = seen(V3(nearSg * 0.012, 0.035, 0.085), V3(nearSg * 0.75, -0.1, 0.65), 0.0, 0.3);
  if (nv > 0.03) {
    const ala = [[0.006, 0.0255, 0.087], [0.0125, 0.026, 0.084], [0.016, 0.0305, 0.079], [0.0125, 0.036, 0.083]].map(([x, y, z]) => P(V3(nearSg * x, y, z)));
    line(ala, lw(0.0009), PAL.skinLine, nv * 0.6);
  }
  const nosV = seen(V3(0, 0.029, 0.09), V3(0, -0.6, 0.8), 0.0, 0.3);
  for (const sg of [nearSg, farSg]) {
    // (the far one smaller and fainter, half behind the tip: the same size and level, the pair
    // was a nose seen from the front on a face turned three-quarters)
    const q = P(V3(sg * (sg === nearSg ? 0.0062 : 0.0048), 0.0285 + (sg === nearSg ? 0 : 0.0008), 0.0905));
    const r = Math.max(0.6, (sg === nearSg ? 0.0022 : 0.0014) * kpx);
    ctx.save();
    ctx.globalAlpha = nosV * (sg === nearSg ? 0.8 : 0.3);
    ctx.fillStyle = '#3a1f2e';
    ctx.beginPath(); ctx.ellipse(q.x, q.y, r, r * 0.6, Math.atan2(nd.y, nd.x) + Math.PI / 2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // --- the mouth
  const mv = seen(V3(0, 0.008, 0.088), V3(0, 0, 1), -0.35, 0.05);
  if (mv > 0.03) {
    const xs = [-1, -0.75, -0.45, -0.18, 0, 0.18, 0.45, 0.75, 1];
    const wv = (x) => seen(mouthPt5(x, F.smile, 0), V3(x * 22, 0, 1), -0.25, 0.05);
    const w = MOUTH5.w0 + MOUTH5.dw * F.smile;
    const upperL = xs.filter((u) => wv(u * w) > 0.2).map((u) => P(mouthPt5(u * w, F.smile, 0)));
    // open a little on the upper teeth in the full smile
    if (F.mouthOpen > 0.05 && upperL.length > 2) {
      // (open 6.5 mm on the upper teeth: an amused smile is an open one, measured against polite
      // smiles; at 4.5 mm the teeth were a thread and the smile read as a closed smirk)
      const lowerL = xs.filter((u) => wv(u * w) > 0.2).map((u) => P(mouthPt5(u * w, F.smile, F.mouthOpen * 0.011, true)));
      const hole = curvePath(upperL.concat(lowerL.slice(1, -1).reverse()), true, new Path2D(), new Set([0, upperL.length - 1]));
      ctx.save();
      ctx.globalAlpha = mv;
      ctx.fillStyle = '#34192a';
      ctx.fill(hole);
      ctx.clip(hole);
      // the upper teeth: a band under the upper lip
      // (the upper teeth fill most of it, 5 mm at the middle, the dark of the mouth a band under
      // them: a child's open, glad smile; at 2 mm of teeth in a 6 mm opening it was a thin grin)
      // (in the shade of his face, no brighter than his lit collar: at #d0c3d3 they were the brightest
      // thing on him, as bright as the sky, and glowed)
      ctx.fillStyle = '#b5a7ba';
      const teeth = upperL.map((q, i) => add(q, V(0, (0.0052 * Math.sin((i / (upperL.length - 1)) * Math.PI) + 0.0008) * kpx * F.mouthOpen)));
      ctx.fill(curvePath(upperL.concat(teeth.slice().reverse()), true));
      ctx.restore();
      line(lowerL, lw(0.0008), '#4a2437', mv * 0.3);
      // the lower lip, full and catching the sky's light under the opening
      const lip = lowerL.slice(1, -1).map((q) => add(q, V(0, 0.0016 * kpx)));
      line(lip, lw(0.0022), '#9c6f86', mv * 0.3 * F.mouthOpen);
    }
    line(upperL, lw(0.0017), '#35192a', mv);
    // the lower lip's shadow under it, and the corners, turned up in the smile
    const ll = [-0.55, -0.2, 0.2, 0.55].map((u) => P(a3(mouthPt5(u * w, F.smile, 0), V3(0, -0.0072 - F.mouthOpen * 0.0045, -0.003))));
    line(ll, lw(0.001), '#52283c', mv * 0.22);
    for (const sg of [nearSg, farSg]) {
      const cv = wv(sg * w);
      if (cv < 0.1) continue;
      const c0 = mouthPt5(sg * w, F.smile, 0);
      // (a small soft tuck at the corner: drawn long and sweeping up into the cheek it ended the
      // mouth in a point, a smirk's)
      const tick = [P(c0), P(a3(c0, V3(sg * 0.0012, 0.0011 * F.smile - 0.0004, -0.0012)))];
      if (sg === nearSg) line(tick, lw(0.0009), '#3a1c2d', cv * mv * 0.3 * F.smile);
    }
  }
  // under the jaw on the near side, from the chin back to under the ear, the neck is in the jaw's
  // shade: a soft dark band below the jaw's edge, the line between face and neck (without it they
  // were one mass, face down to the collar; drawn as a line it read as a scar)
  const jv = seen(V3(nearSg * 0.03, -0.02, 0.04), V3(nearSg * 0.7, -0.45, 0.3), -0.2, 0.2) * sstep(0.35, 0.75, F.turn);
  if (jv > 0.03) {
    const jaw = [[0.004, -0.037, 0.066], [0.018, -0.032, 0.058], [0.03, -0.023, 0.043], [0.039, -0.01, 0.025], [0.043, 0.001, 0.01]].map(([x, y, z]) => P(V3(nearSg * x, y, z)));
    const down = 0.008 * kpx;
    const band = jaw.concat(jaw.slice().reverse().map((q, i) => add(q, V(0, down * (0.35 + 0.65 * Math.sin(((jaw.length - 1 - i) / (jaw.length - 1)) * Math.PI * 0.85))))));
    const g = ctx.createLinearGradient(0, jaw[1].y, 0, jaw[1].y + down);
    // (faint: at 0.14, with his jaw shortened, it read as a crease down the cheek, a man's jaw line)
    g.addColorStop(0, `rgba(38,20,40,${(0.055 * jv).toFixed(3)})`);
    g.addColorStop(1, 'rgba(38,20,40,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fill(curvePath(band));
    ctx.restore();
  }
  ctx.restore();
}

// The hair's region on screen, from any side: the head's surface above the hairline, sampled, the
// samples that face the lens (or lie just past its edge) as small discs, their union traced. (The
// hull of every sample, which serves from behind, from the side fills the dip of the hairline round
// the ear with hair, and from in front would lay the back of the head's hair over the face.)
// Where the hair ends, all round: behind, as shot 1 has it (hairlineY); in front, a boy's: the
// temples filled in (a few mm below the cap's edge over the brow's tail, 2 cm further back), and in
// front of each ear the hair coming down as a short sideburn to the ear's middle. (hairlineY was
// made for the back of the head; turned, it gave him a high, bare temple, like a man's receding
// hair. Filled down to the brow's level over its tail, the far temple, at three-quarters, was a dark
// drip hanging from the cap beside the far eye.)
function hairlineY5(th) {
  const back = hairlineY(th);
  const f = -Math.sin(th);
  if (f <= 0) return back;
  const side = back;                                    // at the ear
  return side - 0.02 * Math.exp(-(((f - 0.2) / 0.09) ** 2)) + (0.121 - side) * sstep(0.2, 0.75, f) * (1 - 0.2 * Math.exp(-(((f - 0.55) / 0.2) ** 2)));
}
function hairRegion5(Hd, HS, proj, sig, capRim = null) {
  const shapes = capRim ? [{ pts: capRim, smooth: false }] : [];
  const top = SKULL.c.y + SKULL.r.y;
  // (rings 1.7 cm apart with 0.7 cm discs left bands of skin across the hair: the union fell into
  // pieces and only the largest was kept)
  const n = 60, m = 24, rr = 0.0075;
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU, y0 = hairlineY5(th) + 0.006;
    for (let j = 0; j <= m; j++) {
      const q = headSurf(th, lerp(y0, top - 0.004, j / m));
      if (!q) continue;
      const W3 = toP(Hd, m3(q, HS));
      const nrm = dirP(Hd, n3(s3(q, V3(0, 0.055, -0.02))));
      const v = s3(W3, BOY_CAM);
      if (dot3(nrm, v) > 0.18 * len3(v)) continue;
      const pc = proj(W3), r = pxPerM(pc.z) * rr * HS;
      shapes.push({ pts: ellipsePts(V(pc.x, pc.y), V(r, 0), V(0, r), 10) });
    }
  }
  const top3 = toP(Hd, m3(V3(0, top, SKULL.c.z), HS));
  if (dot3(dirP(Hd, V3(0, 1, 0)), s3(top3, BOY_CAM)) < 0) { const pc = proj(top3), r = pxPerM(pc.z) * 0.01; shapes.push({ pts: ellipsePts(V(pc.x, pc.y), V(r, 0), V(0, r), 10) }); }
  return polyPath(traceUnion(shapes, sig * 0.8));
}
// (drawHead with his face: see drawFace5)
function drawHead5(R, t, tc, F5, torso) {
  // (his ears lie a little closer to his head as he turns to us, 21 mm at the rim for shot 1's 32:
  // turned to us they stood out 40 px wide, as wide as seen from behind, and read as sticking out;
  // eased over the head's turn, where a centimetre's change is lost in the turning)
  const HP = headParts(R, t, { earStick: lerp(EAR.stick, 0.021, easeTurn(TURN5.head[0], TURN5.head[1], tc - S5.t0)) });
  // (turned away, the middle of the face stays inside the cheek's line: the lost profile is the
  // cheek, as in the earlier shots; poking past it, brow, nose and lips made it knobbly)
  const turn0 = Math.acos(clamp(dot3(dirP(HP.Hd, V3(0, 0, 1)), n3(s3(R.H.pivot, BOY_CAM))), -1, 1)) / Math.PI;
  HP.face5 = faceShapes5(HP.Hd, HP.HS, HP.proj, F5.smile, 0.013 * (1 - sstep(0.3, 0.47, turn0)));
  const { Hd, proj, HS } = HP;
  // judged by the skull's surface where the ear sits, not the flap's own tilt, so an ear does
  // not flip between behind and in front of the hair as the head turns a little
  const facing = (e) => dot3(dirP(Hd, n3(V3(e.sg, 0.1, -0.25))), s3(e.anchor, BOY_CAM)) < 0;
  // The back of the shirt is nearer to us than the neck and the jaw: whatever of them lies over
  // the shirt's body is behind it (a neck drawn over the shirt showed as a brown tongue under the
  // collar, and a lowered jaw would hang over the shoulder).
  const T = torso;
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
  // (the cap's rim, a rounded square, stands out past the skull at its front corners: turned to
  // three-quarters the corner hung over the temple with sky under it, the cap floating. The head
  // is filled out to the rim, with hair: hair shows under the edge of a cap)
  const rim = doppiGeom(Hd, HS).bot.map(proj);
  HP.capRim = hull(rim);
  const parts = HP.face5.concat([{ pts: HP.skull.pts }, { pts: HP.occ.pts }, HP.throat, { pts: HP.capRim, smooth: false }]).concat(HP.neck);
  // (the outline's smoothing is a length on the head, not a number of pixels: at 2.2 px, pushed in
  // on him, the profile came out lumpy)
  const sig = 2.2 * Math.max(1, (BOY_VIEW ? BOY_VIEW.f : CAM.f) / CAM.f);
  const outline = eyeNotch(HP, traceUnion(parts, sig), fv5(EYE_CORNER));
  const headP = polyPath(outline);
  const obb = bboxOf(outline, 8);
  // no rim light in the last few pixels above the collar: where hair, neck and collar meet, what
  // was left of it showed as a lone bright speck
  const colO = collarOutline5(R, t), colP = colO ? polyPath(colO) : new Path2D();
  const nearCollar = new Path2D();
  nearCollar.addPath(colP);
  nearCollar.addPath(colP, new DOMMatrix([1, 0, 0, 1, 0, -3.5]));
  ctx.fillStyle = PAL.skinShade;
  ctx.fill(headP);
  rimOnly(headP, PAL.skinRim, 2.4, LIGHT, obb, nearCollar);
  const hairPath = hairRegion5(Hd, HS, proj, sig, HP.capRim);
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
    const bl = (b) => proj(toP(Hd, m3(fv5(V3(side * b[0], b[1], b[2])), HS)));
    const chin = bl(FACE_BLOBS[9]), angle = bl(FACE_BLOBS[6]);
    const jg = ctx.createLinearGradient(chin.x, chin.y, angle.x, angle.y);
    const ja = (k) => `rgba(33,26,48,${(0.95 * k * lift).toFixed(3)})`;
    jg.addColorStop(0, ja(0)); jg.addColorStop(0.17, ja(0)); jg.addColorStop(0.3, ja(1));
    jg.addColorStop(0.45, ja(0.9)); jg.addColorStop(0.58, ja(0)); jg.addColorStop(1, ja(0));
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = jg;
    // (along this shot's face, shortened by fy5: shot 1's face hull keeps the longer jaw)
    ctx.stroke(curvePath(traceUnion(HP.face5, sig)));
    ctx.restore();
  }
  ctx.clip(unionPath(HP.face5.concat([{ pts: HP.skull.pts }, { pts: HP.occ.pts }])));
  const top = add(pv, mul(down, -0.035 * pxPerM(pv.z)));
  const g = ctx.createLinearGradient(nbp.x, nbp.y, top.x, top.y);
  // (it fades out well before the ear: run up to under the ear at full strength it read as a
  // crease or seam the whole height of the neck)
  g.addColorStop(0, 'rgba(33,26,48,0.8)');
  g.addColorStop(0.4, 'rgba(33,26,48,0.6)');
  g.addColorStop(0.8, 'rgba(33,26,48,0)');
  ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = g;
  // (turned to us, the jaw is in front of the neck: its edge drawn over the cheek read as a scar)
  ctx.globalAlpha = 1 - sstep(0.3, 0.44, faceTurn / Math.PI);
  if (ctx.globalAlpha > 0.01) ctx.stroke(neckLine);
  ctx.globalAlpha = 1;
  ctx.restore();
  if (F5.face > 0.01) drawFace5(R, HP, { ...F5, turn: faceTurn / Math.PI }, headP);
  ink(headP, 2.3);
  ctx.restore();
  drawCollar5(R, t);
  ctx.save();
  ctx.clip(behindShirt, 'evenodd');
  const notCollar = new Path2D();
  notCollar.rect(-50, -50, W + 100, H + 100);
  notCollar.addPath(colP);
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
      // (only where the back of the head faces us: seen from the side they ran across it in stripes)
      const W3 = toP(Hd, m3(p, HS));
      if (dot3(dirP(Hd, n3(s3(p, SKULL.c))), s3(W3, BOY_CAM)) > -0.25 * len3(s3(W3, BOY_CAM))) { if (pts.length > 1) curvePath(pts, false, strands); pts.length = 0; continue; }
      pts.push(proj(W3));
    }
    if (pts.length > 1) curvePath(pts, false, strands);
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
  // (the ear turned to us: its hollow a soft shade and the backlit rim's glow at 0.6; at full
  // strength, a saturated maroon disc in a red ring, it read as a red dot at phone size)
  for (const e of HP.ears) if (facing(e)) drawEar(e, true, { concha: 'rgba(58,28,44,0.36)', glowK: 0.6 });
  drawDoppi(Hd, HS, proj);
  ctx.restore();
}

// (drawBoy with drawHead5, and a torso of the shot's own)
function drawBoy5(t, tc, opts = {}, F5) {
  const R = rig(tc, t);
  // the hands on his hips: the fingers go round the front of the hips, behind him from here (see
  // handShapes' farFix), for the whole shot
  R.L.farFix = R.R.farFix = [true, true, true, true, true];
  // and the heel of each hand has its thickness (handShapes' palmThick): 3.5 cm at the wrist, the
  // wrist thickness measured for boys of 11-12 (3.54-3.65 cm), 2.8 cm at its far edge (assumed,
  // 80 % of it); flat, it was a one-pixel spike hanging from the wrist seen edge on from behind
  R.L.palmThick = R.R.palmThick = [0.035, 0.028];
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
  const T = (opts.torso || drawTorso)(R, t, tc, [fwdL ? null : sleeveShape(R.L, t), fwdR ? null : sleeveShape(R.R, t)].filter(Boolean));
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
  drawHead5(R, t, tc, F5, T);
  return R;
}
// ------------------------------------------------------------------ his shirt, in the round
// Shot 1's shirt is its back: an outline of points on the plane of his back. Turned 46 degrees
// that plane is seen at 60 degrees, half as wide, and the side of his chest, which then faces us,
// was not there at all (the sleeve hung off in the air beside a narrow back). Here the shirt is a
// solid: cross-sections round the body at the heights shot 1's outline has, as wide as its outline
// there (so from behind it is the same shirt), 17..21 cm deep (a boy's chest, the loose cotton),
// flatter across the back than the front; neighbouring sections are joined and the whole traced
// as one outline. [frame, y, half-width, half-depth, centre z, squareness]
const TORSO5 = [
  ['chest', 0.155, 0.056, 0.05, -0.02, 2.2], ['chest', 0.138, 0.1, 0.066, -0.012, 2.4],
  ['chest', 0.115, 0.14, 0.08, -0.006, 2.6], ['chest', 0.08, 0.166, 0.092, 0, 2.6],
  ['chest', 0.012, 0.158, 0.098, 0.004, 2.5], ['waist', 0.1, 0.14, 0.096, 0.002, 2.4],
  ['waist', 0.0, 0.128, 0.09, 0, 2.3], ['waist', -0.095, 0.134, 0.092, 0, 2.3],
  ['pel', 0.02, 0.143, 0.096, 0.005, 2.3], ['pel', -0.074, 0.153, 0.1, 0.01, 2.2],
];
// a point of a section at angle a (0: his right side, pi/2: his front... as sin/cos below), with
// the back flattened (the shoulder blades) and the front rounder
function secPt(hw, hd, zc, sq, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const e = 2 / sq;
  const x = hw * Math.sign(c) * Math.pow(Math.abs(c), e);
  let z = hd * Math.sign(s) * Math.pow(Math.abs(s), e);
  if (z < 0) z *= 0.92;                                  // the back flatter
  return V3(x, 0, zc + z);
}
function torsoShape5(R, t, tc) {
  const { S, P } = R;
  const upL = armUp(R.L), upR = armUp(R.R);
  const wd = windAt(tc);
  const flut = (k, a) => (Math.sin(tc * 6.1 + k) + 0.45 * Math.sin(tc * 10.7 + k * 1.9)) * a * 1.7 * (0.6 + 0.4 * wd);
  const onHip = (A) => clamp(((A.tmix || 0) - 0.4) / 0.6, 0, 1);
  const wrL = onHip(R.L), wrR = onHip(R.R);
  const F = { chest: S.chest, waist: S.waist, pel: S.pel };
  const hemLift = 0.028 * (upL + upR) / 2;
  const secs = TORSO5.map(([fr, y, hw, hd, zc, sq], si) => {
    const Fm = F[fr], pts3 = [];
    const low = si >= 5 ? (si - 4) / 5 : 0;              // how far down the loose part it is
    const cen = toP(Fm, V3(0, y, zc));
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * TAU;
      let q = secPt(hw, hd, zc, sq, a);
      let yy = y;
      // shoulders: the sleeve's top and a raised arm lift them, as shot 1's outline does
      if (fr === 'chest' && y > 0.07) { const sh = q.x < 0 ? P.shL : P.shR; yy += sh * (y > 0.1 ? 0.7 : 0.8); }
      // hands on the hips gather the shirt in at the waist, under each hand
      if (fr === 'waist' && y < -0.05) {
        for (const [A, sg, w] of [[R.L, -1, wrL], [R.R, 1, wrR]]) {
          if (w <= 0) continue;
          const hand = toL(Fm, A.W), da = Math.atan2(Math.sin(a - Math.atan2(hand.z - zc, hand.x)), Math.cos(a - Math.atan2(hand.z - zc, hand.x)));
          q = l3(q, V3(q.x * 0.9, 0, zc + (q.z - zc) * 0.9), w * Math.exp(-((da / 0.5) ** 2)));
        }
      }
      // the hem, loose: it ripples in the wind
      if (si === TORSO5.length - 1) yy += -0.03 + hemLift + flut(a * 2, 0.005);
      let W3 = toP(Fm, V3(q.x, yy, q.z));
      // the wind fills out the shirt on the side it blows to (screen-left), more toward the hem
      const off = (W3.x - cen.x) * WIND_DIR;
      if (off > 0 && low > 0) W3 = a3(W3, V3(WIND_DIR * (0.018 * wd + flut(1 + si, 0.006)) * low * (off / hw), 0, 0));
      pts3.push(W3);
    }
    return pts3.map((p) => projB(p, t));
  });
  const shapes = [];
  for (let i = 0; i + 1 < secs.length; i++) shapes.push({ pts: hull(secs[i].concat(secs[i + 1])), smooth: false });
  // (the same back-plane helpers as shot 1's shirt, for the seams and folds on his back)
  const zb = -0.095;
  const C = (x, y) => toP(S.chest, V3(x, y, zb));
  const Wf = (x, y) => toP(S.waist, V3(x, y, zb));
  const Pf = (x, y) => toP(S.pel, V3(x, y, zb + 0.01));
  const sig = 1.6 * Math.max(1, (BOY_VIEW ? BOY_VIEW.f : CAM.f) / CAM.f);
  return { pts: traceUnion(shapes, sig), upL, upR, shL: P.shL + 0.03 * upL, shR: P.shR + 0.03 * upR, C, Wf, Pf };
}
// The collar all the way round the neck (shot 1's is the part behind the neck, the part it sees):
// a band standing 2.4 cm at the back, lower at the sides, open at the throat; the parts of it
// whose outside faces the lens are drawn over the neck.
function collarBand5(R, t) {
  const n = 28, out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
    // (a: 0 his right, pi/2 his front, pi his left, 3pi/2 his back)
    const front = (a) => Math.max(0, Math.sin(a));
    if (front((a0 + a1) / 2) > 0.97) continue;            // the opening at the throat
    const P3 = (a, top) => {
      const f = front(a);
      const y = top ? 0.176 - 0.014 * f - 0.004 * Math.abs(Math.cos(a)) : 0.15 - 0.008 * f;
      const r = top ? 1.06 : 1.0;
      return toP(R.S.chest, V3(0.066 * r * Math.cos(a), y, -0.012 + 0.06 * r * Math.sin(a) + 0.01 * f));
    };
    const q = [P3(a0, false), P3(a1, false), P3(a1, true), P3(a0, true)];
    const mid = toP(R.S.chest, V3(0.066 * Math.cos((a0 + a1) / 2), 0.163, -0.012 + 0.06 * Math.sin((a0 + a1) / 2)));
    const nrm = n3(s3(mid, toP(R.S.chest, V3(0, 0.163, -0.012))));
    out.push({ pts: q, seen: dot3(nrm, s3(BOY_CAM, mid)) > 0 });
  }
  return out;
}
function collarOutline5(R, t) {
  const band = collarBand5(R, t).filter((q) => q.seen);
  if (!band.length) return null;
  const shapes = band.map((q) => ({ pts: q.pts.map((p) => projB(p, t)), smooth: false }));
  return traceUnion(shapes, 1.2 * Math.max(1, (BOY_VIEW ? BOY_VIEW.f : CAM.f) / CAM.f));
}
function drawCollar5(R, t) {
  const ol = collarOutline5(R, t);
  if (!ol) return;
  const cp = polyPath(ol);
  fillRim(cp, '#a39ac6', PAL.shirtRim, 3, LIGHT, bboxOf(ol, 6));
  ink(cp, 2);
}
// how much of his back faces us (1: square on, 0: edge on)
const backFacing5 = (R) => clamp(dot3(dirP(R.S.chest, V3(0, 0, -1)), n3(s3(BOY_CAM, R.S.chest.o))), 0, 1);
function drawTorso5(R, t, tc, sleeves) {
  const T = torsoShape5(R, t, tc);
  const shapes = [{ pts: T.pts }].concat(sleeves.map((s) => ({ pts: s })));
  const path = drawUnion(shapes, { fill: PAL.shirt, rim: PAL.shirtRim, rimW: 4, lineW: 2.5, line: PAL.line });
  const bb = bboxOf(allPts(shapes), 12);
  const P2 = (p) => projB(p, t);
  const back = backFacing5(R);
  ctx.save();
  ctx.clip(path);
  const torsoOnly = unionPath([{ pts: T.pts }]);
  rimOnly(torsoOnly, PAL.shirtFold, 22, V(-0.96, 0.28), bb);
  for (const sl of sleeves) rimOnly(unionPath([{ pts: sl }]), PAL.shirtFold, 7, V(-0.96, 0.28), bboxOf(sl, 12), torsoOnly);
  ctx.filter = 'blur(6px)';
  const e1 = P2(T.C(0.19, 0.08)), e2 = P2(T.Pf(0.165, -0.1));
  ctx.strokeStyle = `rgba(255,214,184,${(0.42 * back).toFixed(3)})`;
  ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();
  ctx.filter = 'none';
  // on his back (fading as it turns away): the yoke seam, the spine's crease, the folds
  ctx.globalAlpha = sstep(0.15, 0.6, back);
  const y1 = P2(T.C(-0.135, 0.105 + T.shL * 0.5)), y2 = P2(T.C(0, 0.09)), y3 = P2(T.C(0.135, 0.105 + T.shR * 0.5));
  const yoke = new Path2D(); yoke.moveTo(y1.x, y1.y); yoke.quadraticCurveTo(y2.x, y2.y + 6, y3.x, y3.y);
  ink(yoke, 1.3, 'rgba(95,86,135,0.75)');
  const c1 = P2(T.C(0.004, 0.07)), c2 = P2(T.Wf(0.01, 0.12)), c3 = P2(T.Pf(0.0, -0.02));
  const crease = new Path2D(); crease.moveTo(c1.x, c1.y); crease.quadraticCurveTo(c2.x, c2.y, c3.x, c3.y);
  ink(crease, 1.6, 'rgba(98,89,140,0.7)');
  for (const [x, k, w] of [[-0.075, 0, 0.018], [0.045, 1.3, 0.014], [-0.012, 2.1, 0.01]]) {
    const sway = 0.02 * WIND_DIR * windAt(tc) + Math.sin(tc * 5.2 + k) * 0.006;
    const a = P2(T.C(x + 0.01, 0.045)), b = P2(T.Pf(x + sway, -0.085 + 0.028 * (T.upL + T.upR) / 2));
    const d = norm(sub(b, a)), n = perp(d), L = len(sub(b, a)), kk = pxPerM(a.z);
    const m1 = add(vlerp(a, b, 0.42), mul(n, w * kk)), m2 = sub(vlerp(a, b, 0.5), mul(n, w * kk * 0.35));
    ctx.fillStyle = 'rgba(96,86,140,0.55)';
    ctx.fill(curvePath([a, m1, add(b, mul(d, -L * 0.02)), m2], true, new Path2D(), new Set([0, 2])));
  }
  ctx.globalAlpha = 1;
  // the sleeves' seams round the top of each shoulder, where they face us
  for (const [A, sg] of [[R.L, -1], [R.R, 1]]) {
    const a3d = T.C(sg * 0.125, 0.125 + (sg < 0 ? T.shL : T.shR));
    const nrm = dirP(R.S.chest, n3(V3(sg * 0.8, 0.3, -0.3)));
    if (dot3(nrm, s3(BOY_CAM, a3d)) < 0) continue;
    const a = P2(a3d), b = P2(toP(R.S.chest, V3(sg * 0.165, 0.06, -0.02))), c = P2(toP(R.S.chest, V3(sg * 0.155, 0.0 + armUp(A) * 0.08, 0.0)));
    const sm = new Path2D(); sm.moveTo(a.x, a.y); sm.quadraticCurveTo(b.x, b.y, c.x, c.y);
    ink(sm, 1.4, 'rgba(95,86,135,0.8)');
  }
  // the side seam down the side of the shirt that is turned to us, and the drag folds from under
  // the arm to the hand on the hip
  const sideSg = dot3(dirP(R.S.chest, V3(-1, 0, 0)), n3(s3(BOY_CAM, R.S.chest.o))) > 0 ? -1 : 1;
  const side = 1 - back;
  if (side > 0.15) {
    const A = sideSg < 0 ? R.L : R.R;
    const seam = [toP(R.S.chest, V3(sideSg * 0.15, 0.0, 0.0)), toP(R.S.waist, V3(sideSg * 0.13, 0.05, 0.0)), toP(R.S.waist, V3(sideSg * 0.128, -0.06, 0.0)), toP(R.S.pel, V3(sideSg * 0.148, -0.06, 0.005))].map(P2);
    ctx.globalAlpha = sstep(0.15, 0.5, side);
    ink(curvePath(seam, false), 1.3, 'rgba(95,86,135,0.7)');
    const hand = P2(A.W);
    for (const [y0, dx] of [[0.03, 0.0], [-0.02, 0.012]]) {
      const a = P2(toP(R.S.chest, V3(sideSg * 0.145, y0, -0.03 + dx))), m = P2(toP(R.S.waist, V3(sideSg * 0.12, 0.02, -0.02)));
      const fp = new Path2D(); fp.moveTo(a.x, a.y); fp.quadraticCurveTo(m.x, m.y, lerp(m.x, hand.x, 0.6), lerp(m.y, hand.y, 0.6));
      ink(fp, 1.6, 'rgba(95,86,135,0.5)');
    }
    ctx.globalAlpha = 1;
  }
  for (const x of [-0.11, -0.035, 0.065]) {
    const a = P2(T.Pf(x, -0.02)), b = P2(T.Pf(x - 0.015 * windAt(tc), -0.1 + 0.028 * (T.upL + T.upR) / 2));
    const fp = new Path2D(); fp.moveTo(a.x, a.y); fp.quadraticCurveTo(a.x - 3, (a.y + b.y) / 2, b.x, b.y);
    ctx.globalAlpha = 0.3 + 0.7 * back;
    ink(fp, 1.4, 'rgba(95,86,135,0.55)');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  return T;
}

// ------------------------------------------------------------------ the boy
// What he watches and how he turns (seconds into the shot).
//  - He watches the flock come in, his head a beat behind the birds (0.12 s), his eyes on them.
//  - As they come down he follows each one in over its last half second, the coop's two, the
//    parapet's, and last the white one, which comes down on the coping just left of him (2.66).
//  - He smiles at it (a spontaneous smile rises in about 0.6 s: Schmidt et al. 2006), then turns
//    round over his left shoulder the way home: the eyes first, with a blink (a large turn of the
//    gaze usually carries one), the head 50 ms after them and over 0.85 s, the trunk 0.1 s after
//    the head (in whole-body turns of up to 180 degrees the eyes start at about 0.5 s, the head 0.6,
//    the trunk 0.7: Anastasopoulos et al. 2009; the head within 30-150 ms of the eyes: Sidenmark &
//    Gellersen 2019). (Started 0.3 s after the head, the trunk left the neck at its limit halfway:
//    the head's speed fell from 185 to 86 deg/s in three frames and it was carried round the rest
//    of the way; now one bell, 176 deg/s at its peak.)
//  - The head ends 120 degrees round from straight ahead: the trunk 46 of them, the neck 74 (a
//    child's neck turns 77 +- 7: Lynch-Caris et al. 2008), the eyes 25 more, toward the stairs down
//    past the left of the lens; his face at three-quarters to us.
// (the head's end: the trunk 57 degrees round, the neck 73 of a ten-year-old's 77, the face 35
// degrees from the lens; his eyes 15 degrees further, just past it. With the trunk 46 and the eyes
// 37 degrees in their corners, past the 25 or so eyes usually keep to, he looked at us sidelong,
// sly; with the face 47 degrees off and the eyes 22, his eyes still sat in their inner corners, a
// sideways glance over a smile. The nose now stays inside the far cheek's line: a rounder, flatter
// face, which is a child's.)
const TURN5 = { look0: 2.95, head: [3.0, 3.85], trunk: [3.1, 4.0], yawEnd: -2.3, pitchEnd: -0.06, twistEnd: -1.0,
  gazeYaw: -2.52, gazePitch: -0.1, smile: [2.75, 3.15], smile2: [3.55, 4.15], blinks: [2.97, 5.1, 6.85] };
const HEAD5 = a3(BOY_ROOT, V3(0, 0.66, 0));
const inFrame5 = () => LAND5.filter((e) => e.on !== 'off');
// where his eyes are on the flock at shot time s
function lookTarget5(s) {
  const L = inFrame5();
  const mean = L.reduce((acc, e) => a3(acc, landPos(e, Math.min(s, e.td)).pos), V3(0, 0, 0));
  let sum = m3(mean, 0.25 / L.length), wsum = 0.25;
  for (const e of L) {
    let w = Math.exp(-(((s - (e.td - 0.2)) / 0.32) ** 2));
    if (e.b < 0 && s > e.td - 0.2) w = 1.5;                // then the white one, and it stays
    sum = a3(sum, m3(landPos(e, Math.min(s, e.td)).pos, w)); wsum += w;
  }
  return m3(sum, 1 / wsum);
}
function lookAngles5(s) {
  let yaw = 0, pitch = 0;
  for (let k = -2; k <= 2; k++) {
    const d = s3(lookTarget5(s + k * 0.05), HEAD5);
    yaw += Math.atan2(d.x, d.z) / 5; pitch += Math.atan2(d.y, Math.hypot(d.x, d.z)) / 5;
  }
  return { yaw, pitch };
}
const easeTurn = (a, b, s) => { const x = clamp((s - a) / (b - a), 0, 1); return x * x * x * (x * (6 * x - 15) + 10); };
// While he watches them come in, his head does not pan: it holds on a place and then steps to the
// next, as a head does when the eyes jump from bird to bird. At each of these times the eyes go to
// where the birds are 0.12 s on and the head follows, a quick minimum-jerk turn over 0.22 s (the
// head starts 30-150 ms after the eyes and can go on turning up to 0.4 s after they land); between
// steps it drifts after them at 30 % of their motion. (Tracking the mean of the flock, it turned at
// one steady rate for three seconds, 11..93 degrees a second: a camera on a tripod, not a boy.)
const FIX5 = [0, 0.36, 0.78, 1.12, 1.5, 1.86, 2.22, 2.6];
function headLook5(s, cur) {
  const D = 0.22, P = 0.3, aim = 0.12;
  let S = cur(0), k = 0;
  // the head's place at the start of each step, carried forward from the first
  for (; k + 1 < FIX5.length && FIX5[k + 1] <= s; k++) {
    const B = cur(FIX5[k] + aim), L1 = cur(FIX5[k + 1]);
    S = { yaw: B.yaw + P * (L1.yaw - B.yaw), pitch: B.pitch + P * (L1.pitch - B.pitch) };
  }
  const B = cur(FIX5[k] + aim), L = cur(s), m = easeTurn(FIX5[k], FIX5[k] + D, s);
  return { yaw: lerp(S.yaw, B.yaw, m) + P * (L.yaw - B.yaw) * m, pitch: lerp(S.pitch, B.pitch, m) + P * (L.pitch - B.pitch) * m };
}
// the head's direction in the world, the trunk's twist, the eyes in the head, the face
function perf5(s) {
  const T = TURN5;
  // the head a beat behind; and the look played bigger than the geometry while he watches them
  // come in far off (a head turning 6 degrees did not move his cap a pixel: from behind, a look
  // has to be bigger than the angle to read, as shot 1 found)
  const cur = (ss) => { const a = lookAngles5(ss - 0.12); return { yaw: a.yaw * 1.3, pitch: clamp(a.pitch * 1.35 + 0.05, -0.55, 0.45) }; };
  // (the head in steps, the trunk on the smooth look: see headLook5)
  const pre = headLook5(Math.min(s, T.look0), cur), look = cur(Math.min(s, T.look0));
  const ph = easeTurn(T.head[0], T.head[1], s), pt = easeTurn(T.trunk[0], T.trunk[1], s);
  // (after the turn the head overshoots a little and settles, and he never stands quite still:
  // a slow sway of the head; held dead still the last two seconds read as a freeze)
  const settle = s > 3.8 ? Math.sin((TAU * (s - 3.8)) / 0.9) * Math.exp(-(s - 3.8) / 0.32) : 0;
  const sway = 0.018 * Math.sin((TAU * s) / 3.1 + 0.4), nod = 0.012 * Math.sin((TAU * s) / 2.3 + 1.9);
  const headYaw = lerp(pre.yaw, T.yawEnd, ph) - 0.05 * settle + sway * ph, headPitch = lerp(pre.pitch, T.pitchEnd, ph) + 0.02 * settle + nod * ph;
  const tw0 = (a) => clamp(0.28 * a.yaw, -0.35, 0.05);
  const twist = lerp(tw0(look), T.twistEnd, pt);
  // eyes: on the birds (ahead of the head by its lag) until the turn; then a saccade to where he is
  // going (80 ms), holding there while the head comes round under them
  const eyeNow = lookAngles5(Math.min(s, T.look0));
  const sac = sstep(T.look0 + 0.02, T.look0 + 0.1, s);
  const gazeYaw = lerp(eyeNow.yaw, T.gazeYaw, sac), gazePitch = lerp(eyeNow.pitch, T.gazePitch, sac);
  const gy = clamp(gazeYaw - headYaw, -0.7, 0.7), gp = clamp(gazePitch - headPitch, -0.4, 0.4);
  let shut = 0;
  for (const b of T.blinks) shut = Math.max(shut, s < b ? sstep(b - 0.07, b, s) : 1 - sstep(b + 0.03, b + 0.16, s));
  // the smile in two stages: a small one as the white one lands by him, and the full one, the
  // cheeks lifting and the teeth showing, once he has turned to us (a smile seen only after it
  // had risen, behind his head, never happened on screen)
  const s2 = sstep(T.smile2[0], T.smile2[1], s);
  const smile = 0.35 * sstep(T.smile[0], T.smile[1], s) + 0.65 * s2;
  return { headYaw, headPitch, twist, face: { face: 1, smile, open: 1 - shut, gy, gp, mouthOpen: s2 } };
}
function boyPose5(tc, t) {
  const P = boyPose(95 / FPS, t);
  const s = tc - S5.t0, q = perf5(s);
  P.aim = 0;
  // (a child's neck is short: with his face shortened to a boy's the neck under it, 88 mm to the
  // head's pivot as drawn for shots 1..4 from behind, showed long in front, a thin, grown neck)
  P.neckK = 0.85;
  P.twist = q.twist;
  // the neck takes what the trunk has not (within a child's reach of it)
  // (a soft limit, the identity up to 63 degrees: at a hard one the head stopped dead against it,
  // and a tanh over the whole range took 17 degrees off a turn well within reach)
  const want = q.headYaw - q.twist, a = Math.abs(want), x0 = 1.1, L = 1.35;
  P.hYaw = a <= x0 ? want : Math.sign(want) * (x0 + (L - x0) * Math.tanh((a - x0) / (L - x0)));
  P.hPitch = q.headPitch;
  // his weight goes onto his left leg as he turns that way; a standing body sways a little; and
  // once he has turned, one slow contented breath out, the shoulders rising and settling
  const w = easeTurn(TURN5.trunk[0], TURN5.trunk[1] + 0.2, s);
  P.hipRoll = lerp(P.hipRoll, 0.03, w);
  const sigh = Math.exp(-(((s - 4.9) / 0.45) ** 2));
  P.root = a3(P.root, V3(-0.012 * w + 0.005 * Math.sin((TAU * s) / 2.6 + 0.7), 0.003 * sigh, 0));
  P.shL += 0.009 * sigh; P.shR += 0.008 * sigh;
  P.hRoll = (P.hRoll || 0) + 0.02 * Math.sin((TAU * s) / 2.9 + 1.1) * w;
  // looking down at the birds on the coping he leans a little to them
  P.lean += 0.03 * clamp(-q.headPitch * 2, 0, 1) * (1 - w);
  return P;
}

defineShot('s5', { dur: S5.dur, t0: S5.t0, render: renderShot5 });
