// Tong · kaptar — one pigeon model for every state (held, opening, flapping, gliding, perched,
// far away), the flock that circles over the mahalla, and the thrown pigeon's flight.
'use strict';

// ------------------------------------------------------------------ the model (metres)
// Bird frame: x = its right wing, y = its back, z = where its beak points.
const PG = {
  body: { c: V3(0, 0, 0), r: V3(0.052, 0.056, 0.104) },
  breast: { c: V3(0, -0.014, 0.05), r: V3(0.049, 0.05, 0.058) },
  neck: { c: V3(0, 0.03, 0.096), r: V3(0.029, 0.037, 0.034) },
  head: { c: V3(0, 0.052, 0.128), r: V3(0.024, 0.026, 0.029) },
  shoulder: V3(0.03, 0.03, 0.045),
};
// Open wing outline in wing coordinates [span out, chord (+ = forward)]: leading edge out to
// the tip, then back along the trailing edge with the separated tips of the primaries.
// (a pigeon's wing is long and pointed: chord about 0.15 m at the root, tapering to the tip)
const WING_OPEN = [
  [0.0, 0.028], [0.06, 0.038], [0.12, 0.04], [0.165, 0.036],
  [0.22, 0.024], [0.278, 0.004], [0.326, -0.026], [0.36, -0.056],
  [0.334, -0.062], [0.336, -0.078], [0.306, -0.08], [0.303, -0.096], [0.272, -0.095], [0.265, -0.11], [0.234, -0.106], [0.222, -0.118], [0.192, -0.114],
  [0.165, -0.116], [0.12, -0.118], [0.075, -0.115], [0.035, -0.106], [0.0, -0.092],
];
const WING_NOTCH = [8, 10, 12, 14, 16];   // the slots between the separated primaries
// the primaries' tips are corners (pointed feathers), everything else is a smooth curve
const WING_SHARP = new Set([7, 9, 11, 13, 15]);
const WRIST = 3;              // index of the wrist on the leading edge
const WRIST_S = 0.165;
const ARM_TRAIL = 17;         // first trailing-edge point of the arm (inner) part
// The same points when the wing is folded against the body (right side, bird frame):
// wrist at the front, primaries lying over the tail, secondaries along the flank.
const WING_FOLD = [
  V3(0.05, 0.03, 0.058), V3(0.053, 0.034, 0.052), V3(0.055, 0.037, 0.044), V3(0.056, 0.038, 0.032),
  V3(0.053, 0.037, -0.01), V3(0.048, 0.034, -0.06), V3(0.042, 0.029, -0.115), V3(0.035, 0.023, -0.168),
  V3(0.033, 0.02, -0.172), V3(0.032, 0.017, -0.178), V3(0.033, 0.014, -0.172), V3(0.034, 0.011, -0.174), V3(0.035, 0.008, -0.165),
  V3(0.036, 0.006, -0.162), V3(0.038, 0.004, -0.15), V3(0.04, 0.002, -0.142), V3(0.043, 0.0, -0.125),
  V3(0.047, -0.005, -0.09), V3(0.052, -0.008, -0.05), V3(0.055, -0.006, -0.01), V3(0.056, 0.002, 0.025), V3(0.054, 0.016, 0.05),
];

// Wingbeat: phase 0 = top of the upstroke. Down-stroke with the wing fully spread, up-stroke
// with the wrist flexed and the hand flicked back. Sampled at 0, .25, .5, .75 on ones this
// gives the classic 4-drawing cycle: up, level going down, down, folded coming up.
function flapPose(phase, amp = 1) {
  const p = ((phase % 1) + 1) % 1, D = 0.58;
  if (p < D) {
    const u = p / D, e = 0.5 - 0.5 * Math.cos(u * Math.PI);
    return { elev: lerp(1.15, -0.72, e) * amp, fold: 0.03, sweep: 0.14 * Math.sin(u * Math.PI), hand: lerp(0.3, -0.25, e) };
  }
  const u = (p - D) / (1 - D), e = 0.5 - 0.5 * Math.cos(u * Math.PI);
  return { elev: lerp(-0.72, 1.15, e) * amp, fold: 0.5 * Math.sin(u * Math.PI), sweep: -0.22 * Math.sin(u * Math.PI), hand: lerp(-0.25, 0.3, e) + 0.55 * Math.sin(u * Math.PI) };
}
const GLIDE = { elev: 0.16, fold: 0.06, sweep: 0.02, hand: 0.06 };
const mixPose = (a, b, k) => ({ elev: lerp(a.elev, b.elev, k), fold: lerp(a.fold, b.fold, k), sweep: lerp(a.sweep, b.sweep, k), hand: lerp(a.hand, b.hand, k) });

// Wing points in the bird frame for one side (sg = +1 right, -1 left).
function wingPts(pose, sg, open) {
  const Y = V3(0, 1, 0), Z = V3(0, 0, 1);
  let es = V3(sg, 0, 0), ec = V3(0, 0, 1);
  es = rotAxis(es, Y, -sg * pose.sweep); ec = rotAxis(ec, Y, -sg * pose.sweep);
  es = rotAxis(es, Z, sg * pose.elev); ec = rotAxis(ec, Z, sg * pose.elev);
  const root = V3(sg * PG.shoulder.x, PG.shoulder.y, PG.shoulder.z);
  // flexing: the arm shortens and narrows, the hand sweeps back, and the primaries close up
  const beta = pose.fold * 0.9;
  const armK = 1 - 0.42 * pose.fold, chordK = 1 - 0.4 * pose.fold;
  const wrist = a3(root, a3(m3(es, WING_OPEN[WRIST][0] * armK), m3(ec, WING_OPEN[WRIST][1])));
  // the hand plane is tilted at the wrist
  const esH = rotAxis(es, ec, sg * pose.hand);
  const out = [];
  const closed = clamp(pose.fold * 2.4, 0, 1);
  const src = WING_OPEN.map(([s0, c0], i) => {
    if (!WING_NOTCH.includes(i)) return [s0, c0];
    const a = WING_OPEN[i - 1], b = WING_OPEN[i + 1];
    return [lerp(s0, (a[0] + b[0]) / 2, closed), lerp(c0, (a[1] + b[1]) / 2, closed)];
  });
  src.forEach(([s, c], i) => {
    let p;
    if (s <= WRIST_S + 1e-6 && (i <= WRIST || i >= ARM_TRAIL)) {
      p = a3(root, a3(m3(es, s * armK), m3(ec, c < 0 ? c * chordK : c)));
    } else {
      const ds = s - WRIST_S, dc = c - WING_OPEN[WRIST][1];
      const cb = Math.cos(beta), sb = Math.sin(beta);
      const s2 = ds * cb + dc * sb, c2 = -ds * sb + dc * cb;
      p = a3(wrist, a3(m3(esH, s2), m3(ec, c2)));
    }
    const f = WING_FOLD[i];
    out.push(l3(V3(sg * f.x, f.y, f.z), p, open));
  });
  return { pts: out, up: m3(cross3(ec, es), sg) };
}

// Project an ellipsoid (bird-frame centre c, radii r) to a screen polygon.
function ellipsoidPts(F, c, r, proj, n = 18) {
  const C = toP(F, c);
  const pc = proj(C);
  const axes = [m3(F.x, r.x), m3(F.y, r.y), m3(F.z, r.z)].map((a) => {
    const p1 = proj(a3(C, a)), p2 = proj(s3(C, a));
    return V((p1.x - p2.x) / 2, (p1.y - p2.y) / 2);
  });
  let sxx = 0, sxy = 0, syy = 0;
  for (const a of axes) { sxx += a.x * a.x; sxy += a.x * a.y; syy += a.y * a.y; }
  const tr = (sxx + syy) / 2, dt = Math.sqrt(Math.max(0, tr * tr - (sxx * syy - sxy * sxy)));
  const l1 = tr + dt, l2 = Math.max(0, tr - dt);
  let v1 = Math.abs(sxy) > 1e-9 ? norm(V(sxy, l1 - sxx)) : (sxx >= syy ? V(1, 0) : V(0, 1));
  const e1 = mul(v1, Math.sqrt(l1)), e2 = mul(perp(v1), Math.sqrt(l2));
  return { pts: ellipsePts(V(pc.x, pc.y), e1, e2, n), z: pc.z };
}

// Tail fan behind the body; spread 0 = closed, 1 = fanned.
function tailPts(spread, pitch) {
  const half = lerp(0.03, 0.085, spread);
  const root = V3(0, 0.008, -0.07);
  const Lz = 0.135;
  const k = [[-0.024, 0], [-half, -Lz * 0.97], [-half * 0.55, -Lz * 1.02], [0, -Lz * 1.03], [half * 0.55, -Lz * 1.02], [half, -Lz * 0.97], [0.024, 0]];
  // the outer feathers sit a little lower than the central ones, so from the side it has thickness
  return k.map(([x, dz]) => V3(x, root.y + Math.sin(pitch) * dz - Math.abs(x) * 0.3, root.z + Math.cos(pitch) * dz));
}

// Draw one pigeon.
//  F: frame (origin = body centre) in the space `proj` understands; camPos: the lens in that space.
//  st: { pose, open, tail, tailPitch, headYaw, headPitch }
//  style: 'hero' (inked, lit, detailed) | 'flat' (one colour silhouette) with st.color
function drawPigeon(F, proj, camPos, st, style = 'hero') {
  const pose = st.pose || GLIDE, open = st.open ?? 1;
  const P = (p) => proj(toP(F, p));
  // head can turn on the neck (a living bird looks around)
  const HF = yprFrame(frameAt(toP(F, PG.head.c), F.x, F.y, F.z), st.headYaw || 0, st.headPitch || 0, 0);
  const n = style === 'hero' ? 22 : 10;
  const body = ellipsoidPts(F, PG.body.c, PG.body.r, proj, n);
  const breast = ellipsoidPts(F, PG.breast.c, PG.breast.r, proj, n);
  const neck = ellipsoidPts(F, PG.neck.c, PG.neck.r, proj, n);
  const head = ellipsoidPts(frameAt(HF.o, HF.x, HF.y, HF.z), V3(0, 0, 0), PG.head.r, proj, n);
  const tail = tailPts(st.tail ?? 0.2, st.tailPitch ?? 0).map(P);
  const tp = st.tailPitch ?? 0;
  const under = [V3(0.02, -0.012, -0.06), V3(0, -0.016 - Math.sin(tp) * 0.05, -0.07 - Math.cos(tp) * 0.06), V3(-0.02, -0.012, -0.06), V3(0, 0.004, -0.075)].map(P);
  const wings = [1, -1].map((sg) => {
    const w = wingPts(pose, sg, open);
    const pts = w.pts.map(P);
    const mid = toP(F, w.pts[WRIST]);
    const up = dirP(F, w.up);
    const view = s3(mid, camPos);
    return { sg, pts, z: len3(view), seeTop: dot3(up, view) < 0, up };
  });
  const bodyShapes = [{ pts: body.pts }, { pts: breast.pts }, { pts: neck.pts }, { pts: head.pts }, { pts: tail, smooth: true }, { pts: under, smooth: true }];
  if (style !== 'hero') {
    const all = unionPath(bodyShapes.concat(wings.map((w) => ({ pts: w.pts, smooth: true, sharp: WING_SHARP }))));
    ctx.fillStyle = st.color;
    ctx.fill(all);
    ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.strokeStyle = st.color;
    ctx.stroke(all);
    if (st.flash > 0.02) {
      ctx.save();
      ctx.globalAlpha = st.flash;
      ctx.fillStyle = st.flashColor || '#fff1e0';
      ctx.fill(unionPath(wings.map((w) => ({ pts: w.pts, smooth: true, sharp: WING_SHARP }))));
      ctx.restore();
    }
    return;
  }
  const o0 = P(V3(0, 0, 0));
  const scale = Math.max(len(sub(P(V3(0.1, 0, 0)), o0)), len(sub(P(V3(0, 0.1, 0)), o0)), len(sub(P(V3(0, 0, 0.1)), o0))) / 0.1;   // px per metre here
  const lw = clamp(scale * 0.0062, 0.6, 2.3);
  const [f0, f1] = st.inkFade || [70, 140];
  const fade = clamp((scale - f0) / (f1 - f0), 0, 1);    // the ink and detail fade out as it gets small
  const lineCol = fade > 0.5 ? PAL.birdLine : `rgba(59,50,82,${(fade * 2 * 0.9).toFixed(3)})`;
  wings.sort((a, b) => b.z - a.z);
  const fillTop = st.fill || PAL.bird, fillUnder = st.fillUnder || '#f3e3d9', rimCol = st.rim || PAL.birdRim;
  const drawWing = (w) => {
    const col = w.seeTop || open < 0.35 ? fillTop : fillUnder;     // a folded wing shows its upper side
    const path = drawUnion([{ pts: w.pts, smooth: true, sharp: WING_SHARP }], { fill: col, rim: rimCol, rimW: clamp(scale * 0.009, 0.8, 3.2), line: lineCol, lineW: fade > 0 ? lw : 0 });
    // how much of the wing's face we see: its area against a full-on wing of the same span
    const span = Math.max(1e-3, len(sub(w.pts[7], w.pts[0])));
    const faceOn = Math.abs(area2(w.pts)) / (span * span * 0.42);
    if (fade > 0.2 && faceOn > 0.35) {
      // coverts line and the primaries
      ctx.save();
      ctx.clip(path);
      const a = w.pts;
      // the coverts' edge, then the shafts between the primaries
      const cov = [vlerp(a[1], a[20], 0.45), vlerp(a[2], a[18], 0.5), vlerp(a[3], a[17], 0.52), vlerp(a[4], a[15], 0.5), vlerp(a[5], a[13], 0.45), vlerp(a[6], a[9], 0.4)];
      ink(curvePath(cov, false), lw * 0.7, `rgba(150,138,184,${(0.7 * fade).toFixed(3)})`);
      const sh = new Path2D();
      for (const j of [8, 10, 12, 14]) { const q = vlerp(a[j], a[j <= 10 ? 6 : 5], 0.4); sh.moveTo(a[j].x, a[j].y); sh.lineTo(q.x, q.y); }
      ink(sh, lw * 0.6, `rgba(150,138,184,${(0.6 * fade).toFixed(3)})`);
      ctx.restore();
    }
  };
  // which wings pass behind the body: the wing roots are on its back, so seen from below both
  // wings are behind the body, seen from above both are over it, side-on the far one is behind
  const view = n3(s3(toP(F, V3(0, 0, 0)), camPos));
  const belly = dot3(n3(F.y), view);
  const behind = wings.filter((w, i) => belly > 0.3 || (belly > -0.3 && i === 0));
  const front = wings.filter((w) => !behind.includes(w));
  for (const w of behind) drawWing(w);
  const bp = drawUnion(bodyShapes, { fill: fillTop, rim: rimCol, rimW: clamp(scale * 0.01, 0.8, 3.5), line: lineCol, lineW: fade > 0 ? lw : 0 });
  if (fade > 0.2) {
    // the tail's feathers: a few shafts from the root to the fan's edge
    const tl = tailPts(st.tail ?? 0.2, st.tailPitch ?? 0);
    const root = P(V3(0, 0.008, -0.075));
    const fs = new Path2D();
    for (const u of [0.3, 0.5, 0.7]) {
      const e = P(l3(tl[1], tl[5], u));
      const q = vlerp(root, e, 0.35);
      fs.moveTo(q.x, q.y); fs.lineTo(vlerp(root, e, 0.92).x, vlerp(root, e, 0.92).y);
    }
    ctx.save();
    ctx.clip(bp);
    ink(fs, lw * 0.55, `rgba(150,138,184,${(0.55 * fade).toFixed(3)})`);
    ctx.restore();
  }
  rimOnly(bp, `rgba(150,138,184,${(0.55 * clamp(fade * 1.5, 0, 1)).toFixed(3)})`, clamp(scale * 0.012, 0.8, 4), V(-LIGHT.x, -LIGHT.y), bboxOf(allPts(bodyShapes), 6));
  // beak, cere and eye: only once there is room for them
  if (scale > 150) {
    const bk = [V3(0.006, -0.002, 0.024), V3(0, -0.004, 0.046), V3(-0.006, -0.002, 0.024), V3(0, 0.004, 0.026)].map((p) => proj(toP(HF, p)));
    ctx.fillStyle = '#d99a86';
    ctx.fill(polyPath(bk));
    ink(polyPath(bk), lw * 0.6, PAL.birdLine);
    for (const sd of [1, -1]) {
      const eyeC = toP(HF, V3(sd * 0.018, 0.006, 0.01));
      const nrm = n3(dirP(HF, V3(sd, 0.05, 0.25)));
      if (dot3(nrm, n3(s3(eyeC, camPos))) < -0.35) {      // only an eye that really faces us
        const e = proj(eyeC);
        const r = clamp(scale * 0.0058, 1, 4);
        ctx.fillStyle = '#e8863c';
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1d1424';
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.5, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(e.x - r * 0.3, e.y - r * 0.3, r * 0.25, 0, TAU); ctx.fill();
      }
    }
  }
  for (const w of front) drawWing(w);
}

// ------------------------------------------------------------------ the flock
// Pigeons circle over the mahalla in a loose cluster (sky-world metres). On the near side of
// the circle they are higher in frame and larger; on the far side lower and smaller.
// (the whole circle is 0.6x the size it was, about the lens: the flock covers the same sky and
// moves the same way on screen, but flies lower and nearer, so every bird is 1.7x larger and
// reads as a pigeon rather than a speck)
const FS = 0.6;
const ORBIT = { C: V3(-11 * FS, 10.8 * FS, 37 * FS), R: 12.5 * FS, v: 8 * FS, phi0: -2.7, spread: 0.3 };
const OMEGA = ORBIT.v / ORBIT.R;
const G = 9.8;
const BANK = Math.atan(ORBIT.v * ORBIT.v / (ORBIT.R * G));
const orbitPos = (phi, dr, dy) => a3(ORBIT.C, V3(-(ORBIT.R + dr) * Math.sin(phi), dy, -(ORBIT.R + dr) * Math.cos(phi)));
const orbitVel = (phi, dr) => m3(V3(-(ORBIT.R + dr) * Math.cos(phi), 0, (ORBIT.R + dr) * Math.sin(phi)), OMEGA);
const BIRD_COLS = { white: [214, 205, 214], grey: [124, 118, 156], dark: [70, 60, 96], red: [122, 84, 98] };
// flapping bursts and glides; activity is 1 while flapping
function makeSchedule(R) {
  const out = [];
  let t = -R() * 1.2, on = R() < 0.6;
  while (t < DUR + 1) { const d = on ? 1.1 + R() * 1.1 : 0.3 + R() * 0.4; out.push([t, t + d, on]); t += d; on = !on; }
  return out;
}
function activity(sched, t) {
  for (const [a, b, on] of sched) {
    if (t >= a && t < b) {
      // flapping ramps up at the start of a burst and down at its end; a glide stays at 0
      return on ? Math.max(0, Math.min(sstep(a, a + 0.12, t), 1 - sstep(b - 0.12, b, t))) : 0;
    }
  }
  return 1;
}
function flapPhase(sched, t, ph0) {
  // integral of the flap rate, stepped at 1/48 s so it is the same every run
  let p = ph0;
  const n = Math.round(Math.max(0, t) * 48);
  for (let k = 0; k < n; k++) p += SHEET.flap * activity(sched, k / 48) / 48;
  return p;
}
const FLOCK = (() => {
  const R = rng(11), V2 = rng(12);
  const kinds = ['grey', 'grey', 'dark', 'white', 'grey', 'red', 'white', 'dark'];
  return Array.from({ length: 26 }, (_, i) => ({
    dphi: (R() * 2 - 1) * ORBIT.spread, dr: (R() * 2 - 1) * 1.6 * FS, dy: (R() * 2 - 1) * 1.1 * FS,
    sp: 0.993 + R() * 0.014, sz: 0.9 + R() * 0.2, ph0: Math.floor(R() * 4) / 4, kind: kinds[i % kinds.length], sched: makeSchedule(R), bob: R() * TAU,
    // no two birds bank, head or beat alike: that is what keeps a flock from reading as one stamp
    bk: 0.55 + V2() * 0.7, hd: (V2() * 2 - 1) * 0.14, amp: 0.7 + V2() * 0.25, rate: 0.9 + V2() * 0.22, rph: V2() * TAU,
  }));
})();
const SUN_DIR = n3(V3(0.45, 0.06, 1));
function birdFrameFrom(pos, vel, bankToward, bankAng) {
  const Fw = n3(vel);
  // a bird climbing nearly straight up has no "up" to orient by: its back then faces back,
  // toward us, so the wings spread across the picture (not both to one side)
  const steep = sstep(0.55, 0.92, Math.abs(Fw.y));
  let U = n3(l3(V3(0, 1, 0), V3(0, 0, -1), steep));
  U = n3(s3(U, m3(Fw, dot3(U, Fw))));
  if (bankToward) {
    const side = n3(s3(bankToward, m3(Fw, dot3(bankToward, Fw))));
    U = n3(a3(m3(U, Math.cos(bankAng)), m3(side, Math.sin(bankAng))));
  }
  const Rt = cross3(U, Fw);
  return frameAt(pos, Rt, U, Fw);
}
function flockBird(b, t) {
  const phi = ORBIT.phi0 + OMEGA * t * b.sp + b.dphi;
  const pos = a3(orbitPos(phi, b.dr, b.dy), V3(0, Math.sin(t * 1.3 + b.bob) * 0.25 * FS, 0));
  // it flies along its own line: the orbit's tangent turned a little its own way, rising and
  // sinking with its bob, and rolling a little about its bank
  let vel = orbitVel(phi, b.dr);
  vel = rotAxis(vel, V3(0, 1, 0), b.hd + 0.07 * Math.sin(t * 1.1 + b.bob * 2));
  vel = a3(vel, V3(0, 1.3 * 0.25 * FS * Math.cos(t * 1.3 + b.bob) * 2.2, 0));
  const toC = s3(V3(ORBIT.C.x, pos.y, ORBIT.C.z), pos);
  const a = activity(b.sched, t);
  const pose = mixPose(GLIDE, flapPose(flapPhase(b.sched, t * b.rate, b.ph0), b.amp), a);
  const F = viewLevel(birdFrameFrom(pos, vel, toC, BANK * b.bk + 0.14 * Math.sin(t * 1.7 + b.rph)), 0.85);
  return { F: frameAt(F.o, m3(F.x, b.sz), m3(F.y, b.sz), m3(F.z, b.sz)), pose, a };
}
// "Geometrically correct can still read wrong": a small bird crossing the sky above us, banked
// into its circle, is seen from below at a shallow angle, and its wings then project as a tall
// oval (a moth, a fish). Roll it about its own flight line toward the lens by `k` of that angle,
// so we see it side-on, the way the eye expects a passing bird: wings up, down or level.
function viewLevel(F, k) {
  const v = n3(F.o);                       // from the lens (the sky world's origin) to the bird
  const A = dot3(F.y, v), B = dot3(F.x, v);
  let rho = Math.atan2(-A, B);
  if (rho > Math.PI / 2) rho -= Math.PI; else if (rho < -Math.PI / 2) rho += Math.PI;
  return turnFrame(F, F.z, -rho * k);
}
const CAM_W = V3(0, 0, 0);
function drawFlock(t) {
  const proj = (p) => projW(p, t);
  const list = FLOCK.map((b) => ({ b, s: flockBird(b, t) })).map((o) => ({ ...o, z: len3(o.s.F.o) })).sort((p, q) => q.z - p.z);
  for (const { b, s, z } of list) {
    const base = BIRD_COLS[b.kind];
    const haze = clamp((z - 22 * FS) / (60 * FS), 0, b.kind === 'dark' || b.kind === 'red' ? 0.32 : 0.5);   // dark birds stay solid
    const sky = [150, 128, 184];
    const c = base.map((v, k) => Math.round(lerp(v, sky[k], haze)));
    let flash = 0;
    if (b.kind === 'white' || b.kind === 'grey') {
      // the undersides of the wings light up when they turn to the low sun
      const w = wingPts(s.pose, 1, 1);
      const up = dirP(s.F, w.up);
      flash = clamp(-dot3(up, SUN_DIR) * 1.4 - 0.2, 0, 1) * (b.kind === 'white' ? 0.85 : 0.35);
    }
    drawPigeon(s.F, proj, CAM_W, { pose: s.pose, open: 1, tail: 0.25, color: `rgb(${c[0]},${c[1]},${c[2]})`, flash }, 'flat');
  }
}

// ------------------------------------------------------------------ the thrown pigeon
// From the boy's hands (held position at the release frame, carried into the sky world at
// the same screen point and depth) along a Hermite curve into its slot in the flock.
const HERO_SLOT = { dphi: 0.16, dr: -0.9 * FS, dy: 0.4 * FS };
// The toss leaves the hands going up (the hands' own velocity at the release, from the key
// drawings); the pigeon climbs out over his head, then flies away and left, crossing the sky at
// a steady pace into its slot in the flock. The path is laid out where the eye follows it, on
// the screen: [frame, x, y, depth in metres]. (Laid out in 3-D it flew straight away from the
// lens and sat nearly still on screen for a second: "a parked dot the flock swallowed".)
const HERO_SCREEN_WP = [[30, 790, 160, 4.6], [38, 705, 100, 7.4], [48, 630, 112, 10.0], [56, 578, 128, 12.0], [64, 530, 142, 14.0]];
const HERO_WP = [];
let HERO_P0 = null, HERO_V0 = null;
function heroStart() {
  if (!HERO_P0) {
    const s = boyReleaseScreen();
    HERO_P0 = unprojW(s.x, s.y, s.z, RELEASE_T);
    // velocity of the held pigeon between the last two drawings before it leaves (m/s)
    const P1 = boyPose(RELEASE_T, RELEASE_T).bird, P0 = boyPose(RELEASE_T - 1 / FPS, RELEASE_T - 1 / FPS).bird;
    HERO_V0 = m3(s3(P1, P0), FPS);
    for (const [f, sx, sy, z] of HERO_SCREEN_WP) HERO_WP.push({ dt: f / FPS - RELEASE_T, d: s3(unprojW(sx, sy, z, f / FPS), HERO_P0) });
  }
  return HERO_P0;
}
function heroPos(t) {
  const tj = SHEET.joinT;
  const slotPhi = (tt) => ORBIT.phi0 + OMEGA * tt + HERO_SLOT.dphi;
  if (t >= tj) return orbitPos(slotPhi(t), HERO_SLOT.dr, HERO_SLOT.dy);
  const P0 = heroStart();
  const pts = [{ t: RELEASE_T, p: P0, v: HERO_V0 }]
    .concat(HERO_WP.map((w) => ({ t: RELEASE_T + w.dt, p: a3(P0, w.d), v: null })))
    .concat([{ t: tj, p: orbitPos(slotPhi(tj), HERO_SLOT.dr, HERO_SLOT.dy), v: orbitVel(slotPhi(tj), HERO_SLOT.dr) }]);
  for (let k = 1; k < pts.length - 1; k++) pts[k].v = m3(s3(pts[k + 1].p, pts[k - 1].p), 1 / (pts[k + 1].t - pts[k - 1].t));
  let k = 0;
  while (k < pts.length - 2 && t > pts[k + 1].t) k++;
  const A = pts[k], B = pts[k + 1], T = B.t - A.t, s = clamp((t - A.t) / T, 0, 1);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return a3(a3(m3(A.p, h00), m3(A.v, h10 * T)), a3(m3(B.p, h01), m3(B.v, h11 * T)));
}
const HERO_SCHED = [[-1, 2.55, true], [2.55, 2.95, false], [2.95, 3.55, true], [3.55, 5, false]];
function heroState(t) {
  const dt = 1 / 96;
  const p = heroPos(t);
  const v = m3(s3(heroPos(t + dt), heroPos(t - dt)), 1 / (2 * dt));
  const acc = m3(a3(s3(heroPos(t + dt), m3(p, 2)), heroPos(t - dt)), 1 / (dt * dt));
  // Body pitched up while it climbs to the flock's height, levelling off as it joins. This is
  // also what makes it read: its path runs almost straight away from the lens, and a body laid
  // along that path is seen tail-on (a round dot with wings edge-on: "a shuttlecock"). Nose-up,
  // we see it from below: the dove silhouette, wings spread, tail fanned, all the way up.
  const climb = 1 - sstep(SHEET.joinT - 0.4, SHEET.joinT + 0.05, t);
  const vel = a3(v, V3(0, len3(v) * (0.35 + 0.9 * (1 - sstep(RELEASE_T, RELEASE_T + 0.7, t))) * climb, 0));
  // bank into the turn: horizontal acceleration across the path
  const vh = n3(V3(v.x, 0, v.z));
  const lat = s3(V3(acc.x, 0, acc.z), m3(vh, dot3(V3(acc.x, 0, acc.z), vh)));
  // no banking while it is still climbing out of the hands, and only a little on the way up
  const bank = clamp(0.8 * Math.atan(len3(lat) / G), 0, 0.5) * sstep(RELEASE_T + 0.25, RELEASE_T + 0.9, t);
  const toC = s3(V3(ORBIT.C.x, p.y, ORBIT.C.z), p);
  const j = sstep(SHEET.joinT - 0.7, SHEET.joinT, t);
  const side = len3(lat) > 0.05 ? n3(l3(n3(lat), n3(toC), j)) : n3(toC);
  // once it is one of the flock it is seen the way the flock is (see viewLevel)
  const F = viewLevel(birdFrameFrom(p, vel, side, lerp(bank, BANK, j)), 0.85 * j);
  const tr = t - RELEASE_T;
  const a = activity(HERO_SCHED, t);
  // strong take-off beats (bigger amplitude) settling into cruise
  const amp = lerp(1.18, 0.82, sstep(0, 1.0, tr));
  const ph0 = 0.97;   // the release drawing: wings up in a V at the top of the stroke
  const phase = ph0 + (t < 2.55 ? SHEET.flap * tr : flapPhase(HERO_SCHED, t, 0) - flapPhase(HERO_SCHED, 2.55, 0) + SHEET.flap * (2.55 - RELEASE_T));
  const pose = mixPose(GLIDE, flapPose(phase, amp), a);
  // the tail stays fanned while it climbs (a climbing pigeon spreads it), closing as it levels
  return { F, pose, tail: lerp(0.6, 0.45, sstep(0, 0.6, tr)) * lerp(1, 0.55, 1 - climb), tailPitch: lerp(0.35, 0.12, sstep(0, 0.6, tr)) };
}
function drawHeroFlying(t) {
  const s = heroState(t);
  const proj = (p) => projW(p, t);
  const k = pxPerM(proj(s.F.o).z);
  // the wings open as it leaves the hands: barely begun at the release, full the frame after
  const open = 1;   // it bursts from the hands wings-up (half-open wings read as paper panels)
  const st = { pose: s.pose, open, tail: s.tail, tailPitch: s.tailPitch };
  // far: a clean silhouette like the rest of the flock (a little larger and the brightest, so the
  // eye can follow it in), its wings flashing in the low sun; near: the drawn, inked pigeon. The
  // two cross over in a few frames, never as a pop.
  if (k < 100) {
    const up = dirP(s.F, wingPts(s.pose, 1, 1).up);
    const flash = clamp(-dot3(up, SUN_DIR) * 1.4 - 0.2, 0, 1) * 0.8;
    const g = lerp(1, 1.08, sstep(100, 70, k));
    const F2 = frameAt(s.F.o, m3(s.F.x, g), m3(s.F.y, g), m3(s.F.z, g));
    drawPigeon(F2, proj, CAM_W, { ...st, color: '#f4f0fa', flash }, 'flat');
  } else drawPigeon(s.F, proj, CAM_W, { ...st, inkFade: [100, 150], fill: '#f4f0fa' }, 'hero');
}
