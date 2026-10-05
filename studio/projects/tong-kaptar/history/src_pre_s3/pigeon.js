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
function tailPts(spread, pitch, cup = 0.3) {
  const half = lerp(0.03, 0.085, spread);
  const root = V3(0, 0.008, -0.07);
  const Lz = 0.135;
  const k = [[-0.024, 0], [-half, -Lz * 0.97], [-half * 0.55, -Lz * 1.02], [0, -Lz * 1.03], [half * 0.55, -Lz * 1.02], [half, -Lz * 0.97], [0.024, 0]];
  // the outer feathers sit a little lower than the central ones, so from the side it has thickness
  return k.map(([x, dz]) => V3(x, root.y + Math.sin(pitch) * dz - Math.abs(x) * cup, root.z + Math.cos(pitch) * dz));
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
  const tail = tailPts(st.tail ?? 0.2, st.tailPitch ?? 0, st.tailCup ?? 0.3).map(P);
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
    // the low sun catching the edge that faces it (st.sunRim: { dir on screen, width, color })
    if (st.sunRim) rimOnly(all, st.sunRim.color, st.sunRim.width, st.sunRim.dir, bboxOf(allPts(bodyShapes).concat(...wings.map((w) => w.pts)), 4));
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
    const tl = tailPts(st.tail ?? 0.2, st.tailPitch ?? 0, st.tailCup ?? 0.3);
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
// ------------------------------------------------------------------ the flock's flight after shot 1
// Shot 1 shows the flock on its first circle. From tau = FLOCK_SPLIT on (tau is the flock's own
// clock along its path: a bird at the head of the flock is ahead of one at the tail) the path is
// flown, not drawn: a heading turned at curvature x speed, a speed and a climb, keyed and eased,
// and integrated from the circle's own state at the split, so position, heading, speed and turn
// all carry on without a seam. (The leading bird of the flock reaches tau = 4.46 on shot 1's last
// frame, so nothing in shot 1 moves.)
const FLOCK_SPLIT = 4.5;
// [tau, curvature (1/m, + turns left), speed (m/s), climb (m/s), spacing (x the circle's)]
// (shot 2: the flock carries on left over the far roofs, wheels right through a tight climbing
// turn toward us (radius 2.4 m, banked about 50°), loosening as it turns, comes back right over the
// top, then turns right onto the sun's bearing and flies off toward it at a pigeon's cruising
// speed (16 m/s), out of the frame on the right in the last frames, going from 13 to 17 m (its
// birds shrink by a quarter) as it goes. (Turned less, or slower, it crossed the frame's stretched
// right side and grew as it left; turned more, it headed for a point mid-frame and stalled there;
// sinking fast, it read as coming down, not going away.) A left turn on that leg brings a bird at us: a bird heading +x has its left
// toward the lens. It climbs through the turn because that is when it flies at us: a pigeon coming
// at you level or sinking shows its wings edge-on (a stick), one climbing shows its underside
// (measured through shot 2's lens: nose-on birds showed 0.22 of their wing face, now 0.39).)
// (the flock loosens through the tight turn, up to 1.8 times its spacing across the path, and
// closes up again after: flying at the lens its length collapses into depth, and at the circle's
// spacing eight to ten birds merged into one knot)
// [.., lag]: how long the flock is along its path, as a share of its length on the circle. It
// closes up through the tight loop, so that it banks round together as a wide group: at its full
// length (±2.5 m on a loop of 2.4 m radius) it curled round the loop, a ball of birds heading every
// way at once.
let FLOCK_KEYS = [
  [4.5, 1 / (12.5 * 0.6), 8 * 0.6, 0, 1, 1],
  [4.8, -0.18, 5.2, -0.4, 1.1, 0.92],
  [5.1, -0.42, 5.4, 0.3, 1.5, 0.72],
  [5.5, -0.42, 5.4, 0.9, 1.8, 0.5],
  [6.0, -0.42, 5.4, 0.8, 1.8, 0.45],
  [6.4, -0.15, 6.0, -0.6, 1.4, 0.6],
  [6.7, -0.12, 8.2, -0.5, 1.1, 0.8],
  [7.2, -0.08, 12.0, -0.5, 1, 1],
  [7.7, -0.02, 15.5, -0.4, 1, 1],
  [8.5, 0.0, 16.0, -0.3, 1, 1],
  [9.5, 0.0, 6.5, 0.3, 1, 1],
  [12, 0.13, 4.8, 0, 1, 1],
];
let FLOCK_TRACK = null;
// the flock's length along its path at time t (1 on the circle), and a bird's place on the path
const flockLag = (t) => (t > FLOCK_SPLIT ? keyedAt(FLOCK_KEYS, t)[4] ?? 1 : 1);
const birdTau = (b, t) => t * b.sp + (b.dphi / OMEGA) * flockLag(t);
function keyedAt(keys, tau) {
  if (tau <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i + 1 < keys.length; i++) {
    const a = keys[i], b = keys[i + 1];
    if (tau <= b[0]) { const u = smooth((tau - a[0]) / (b[0] - a[0])); return a.slice(1).map((v, k) => lerp(v, b[k + 1], u)); }
  }
  return keys[keys.length - 1].slice(1);
}
function flockTrack() {
  if (FLOCK_TRACK) return FLOCK_TRACK;
  const dt = 1 / 96;
  const phi = ORBIT.phi0 + OMEGA * FLOCK_SPLIT;
  let p = orbitPos(phi, 0, 0);
  let dir = n3(orbitVel(phi, 0));
  const out = [];
  const n = Math.ceil((FILM_T - FLOCK_SPLIT) * 96) + 1;
  for (let i = 0; i <= n; i++) {
    const tau = FLOCK_SPLIT + i * dt;
    const [k, v, vy, sp = 1] = keyedAt(FLOCK_KEYS, tau);   // (the lag column is read by flockLag)
    out.push({ p, dir, k, v, vy, sp });
    p = a3(p, a3(m3(dir, v * dt), V3(0, vy * dt, 0)));
    dir = n3(rotAxis(dir, V3(0, 1, 0), k * v * dt));
  }
  FLOCK_TRACK = out;
  return out;
}
function trackAt(tau) {
  const tr = flockTrack(), u = (tau - FLOCK_SPLIT) * 96;
  const i = clamp(Math.floor(u), 0, tr.length - 2), f = clamp(u - i, 0, 1);
  const A = tr[i], B = tr[i + 1];
  const dir = n3(l3(A.dir, B.dir, f));
  // spacing and its rate (per second of the flock's own clock)
  const C = tr[Math.max(0, i - 1)], D = tr[Math.min(tr.length - 1, i + 2)];
  const dsp = ((D.sp - C.sp) * 96) / Math.max(1, Math.min(tr.length - 1, i + 2) - Math.max(0, i - 1));
  return { p: l3(A.p, B.p, f), dir, k: lerp(A.k, B.k, f), v: lerp(A.v, B.v, f), vy: lerp(A.vy, B.vy, f), sp: lerp(A.sp, B.sp, f), dsp, L: V3(dir.z, 0, -dir.x) };
}

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
// On the flown path a bird flaps whenever the path climbs, whatever its schedule says: a pigeon
// climbs on its wings (they glided up shot 2's climbing turn with wings set, like gulls).
// (0 on the circle, so shot 1's flock flaps exactly as it did.)
// And there a glide is never a rigid one: the wings keep a shallow beat (at least 0.45 of a full
// one). In shot 2 the birds are near, and a glider held one silhouette for 5..20 frames while it
// moved and banked: a card slid and turned across the sky.
// (from shot 2's first frames on, t > 4 s, whether or not the bird has reached the flown path yet)
const flockEffort = (tau, t = 0) => Math.max(tau > FLOCK_SPLIT ? sstep(0.15, 0.7, trackAt(tau).vy) : 0, 0.45 * sstep(DUR, DUR + 0.25, t));
// the wing phase through bursts, glides and effort: as flapPhase, the schedule read at scaled
// time s, the effort at real time s / rate (tauOf: real time -> the bird's place on the path)
function flapPhaseE(sched, t, ph0, rate, tauOf) {
  let p = ph0;
  const n = Math.round(Math.max(0, t * rate) * 48);
  for (let k = 0; k < n; k++) p += SHEET.flap * Math.max(activity(sched, k / 48), flockEffort(tauOf(k / 48 / rate), k / 48 / rate)) / 48;
  return p;
}
// where the flock is (its centre line): the birds on the coop watch it
const flockCentre = (t) => (t > FLOCK_SPLIT ? trackAt(t).p : orbitPos(ORBIT.phi0 + OMEGA * t, 0, 0));
const FILM_T = 60;          // seconds of film the flock's flapping schedules cover
function extendSchedule(sched, seed) {
  const R = rng(seed);
  let [, t, on] = sched[sched.length - 1];
  on = !on;
  while (t < FILM_T) { const d = on ? 1.1 + R() * 1.1 : 0.3 + R() * 0.4; sched.push([t, t + d, on]); t += d; on = !on; }
  return sched;
}
const FLOCK = (() => {
  const R = rng(11), V2 = rng(12);
  const kinds = ['grey', 'grey', 'dark', 'white', 'grey', 'red', 'white', 'dark'];
  return Array.from({ length: 26 }, (_, i) => ({
    dphi: (R() * 2 - 1) * ORBIT.spread, dr: (R() * 2 - 1) * 1.6 * FS, dy: (R() * 2 - 1) * 1.1 * FS,
    sp: 0.993 + R() * 0.014, sz: 0.9 + R() * 0.2, ph0: Math.floor(R() * 4) / 4, kind: kinds[i % kinds.length], sched: makeSchedule(R), bob: R() * TAU,
    // no two birds bank, head or beat alike: that is what keeps a flock from reading as one stamp
    bk: 0.55 + V2() * 0.7, hd: (V2() * 2 - 1) * 0.14, amp: 0.7 + V2() * 0.25, rate: 0.9 + V2() * 0.22, rph: V2() * TAU,
  })).map((b, i) => ({ ...b, sched: extendSchedule(b.sched, 5000 + i) }));
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
// A bird of the flock at t: its own frame (flight line and bank), before it is turned for the lens.
function flockFrame(b, t) {
  const tau = birdTau(b, t);
  if (tau > FLOCK_SPLIT) {
    // its place in the flock on the flown path (same offsets, same bank rule: the coordinated-turn
    // angle for the path's curvature, which is the circle's own on the circle)
    // (its place across the path scales with the flock's spacing; as that changes the bird steers
    // out or in, so the rate is part of its velocity: it never slides sideways)
    const tr = trackAt(tau), sp = tr.sp;
    const pos = a3(a3(tr.p, m3(tr.L, -b.dr * sp)), V3(0, b.dy * sp + Math.sin(t * 1.3 + b.bob) * 0.25 * FS, 0));
    let vel = a3(m3(tr.dir, tr.v * (1 + b.dr * sp * tr.k)), V3(0, tr.vy, 0));
    vel = a3(vel, a3(m3(tr.L, -b.dr * tr.dsp * b.sp), V3(0, b.dy * tr.dsp * b.sp, 0)));
    vel = rotAxis(vel, V3(0, 1, 0), b.hd + 0.07 * Math.sin(t * 1.1 + b.bob * 2));
    vel = a3(vel, V3(0, 1.3 * 0.25 * FS * Math.cos(t * 1.3 + b.bob) * 2.2, 0));
    const bank = Math.atan((tr.k * tr.v * tr.v) / G) * b.bk + 0.14 * Math.sin(t * 1.7 + b.rph);
    return birdFrameFrom(pos, vel, tr.L, bank);
  }
  const phi = ORBIT.phi0 + OMEGA * t * b.sp + b.dphi;
  const pos = a3(orbitPos(phi, b.dr, b.dy), V3(0, Math.sin(t * 1.3 + b.bob) * 0.25 * FS, 0));
  // it flies along its own line: the orbit's tangent turned a little its own way, rising and
  // sinking with its bob, and rolling a little about its bank
  let vel = orbitVel(phi, b.dr);
  vel = rotAxis(vel, V3(0, 1, 0), b.hd + 0.07 * Math.sin(t * 1.1 + b.bob * 2));
  vel = a3(vel, V3(0, 1.3 * 0.25 * FS * Math.cos(t * 1.3 + b.bob) * 2.2, 0));
  const toC = s3(V3(ORBIT.C.x, pos.y, ORBIT.C.z), pos);
  return birdFrameFrom(pos, vel, toC, BANK * b.bk + 0.14 * Math.sin(t * 1.7 + b.rph));
}
// The turn for the lens (see viewRoll), on the flown path taken as its mean over a third of a
// second: where a bird passes the quarter-turn it fades through, the turn changed by up to 26° in
// one frame in shot 2's tight turn (measured); spread over eight frames it reads as the bird
// rolling. (On the circle, shot 1's, it is the frame's own: there it changes 4° a frame at most.)
function flockBird(b, t) {
  const tau = birdTau(b, t);
  const F0 = flockFrame(b, t);
  // (on the flown path the birds are near: seen as they are, a bird gliding over us shows a cross
  // of wings, head and tail; turned side-on for the lens, a glider there was a dash with a bead.
  // So there the turn fades to a quarter.)
  const u = sstep(FLOCK_SPLIT, FLOCK_SPLIT + 0.3, tau);
  const kv = 0.85 * lerp(1, 0.25, sstep(FLOCK_SPLIT + 0.3, FLOCK_SPLIT + 1.3, tau));   // (after its bank reverses)
  let roll = viewRoll(F0, kv);
  if (u > 0) {
    let m = 0;
    for (let k = -3; k <= 3; k++) m += viewRoll(flockFrame(b, t + k / FPS), kv) / 7;
    roll = lerp(roll, m, u);
  }
  const F = turnFrame(F0, F0.z, roll);
  const tauOf = (tt) => birdTau(b, tt);
  const a = Math.max(activity(b.sched, t), flockEffort(tau, t));
  // each bird holds its glide its own way on the flown path (wings a little up or down): two birds
  // gliding side by side in the one glide drawing looked cloned
  const glide = mixPose(GLIDE, flapPose(b.rph / TAU, b.amp), 0.22 * u);
  const pose = mixPose(glide, flapPose(flapPhaseE(b.sched, t, b.ph0, b.rate, tauOf), b.amp), a);
  return { F: frameAt(F.o, m3(F.x, b.sz), m3(F.y, b.sz), m3(F.z, b.sz)), pose, a };
}
// "Geometrically correct can still read wrong": a small bird crossing the sky above us, banked
// into its circle, is seen from below at a shallow angle, and its wings then project as a tall
// oval (a moth, a fish). Roll it about its own flight line toward the lens by `k` of that angle,
// so we see it side-on, the way the eye expects a passing bird: wings up, down or level.
// Only for a bird seen crossing: one seen from dead ahead or behind (or from right below) would
// need a quarter turn either way, and the choice flipped between frames (measured: 26 rolls of
// 140°+ from one frame to the next in shot 1's flock, 43 in shot 2's turn: birds spinning like
// propellers). The correction fades out within 25..55° of the flight line, where the bird keeps
// its own bank, which changes smoothly.
function viewRoll(F, k) {
  const v = n3(F.o);                       // from the lens (the sky world's origin) to the bird
  const A = dot3(F.y, v), B = dot3(F.x, v);
  let rho = Math.atan2(-A, B);
  if (rho > Math.PI / 2) rho -= Math.PI; else if (rho < -Math.PI / 2) rho += Math.PI;
  const side = Math.acos(clamp(Math.abs(dot3(n3(F.z), v)), 0, 1));     // 0: nose- or tail-on, pi/2: crossing
  return -rho * k * sstep(0.44, 0.96, side) * sstep(0.12, 0.45, Math.abs(Math.cos(rho)));
}
const viewLevel = (F, k) => turnFrame(F, F.z, viewRoll(F, k));
const CAM_W = V3(0, 0, 0);
// opts.tailCup: how cupped the tails are (seen from the side, a flat fan is a 1 px line; shot 2's
// birds are near enough for that to read as a stick). opts.whiteFlash, opts.whiteTone: how bright
// a white bird's wings flash, and how far its white goes toward grey (a shot that must be followed
// by its thrown pigeon keeps the others below it). opts.sun: the sun's point on screen, for a lens
// that sees the flock fly toward it: a bird between us and the low sun goes darker, and the edge
// that faces the sun catches it (flat cool cut-outs with no sunlit side read as pasted on, most of
// all flying into the sunrise)
function drawFlock(t, cam = null, opts = {}) {
  const proj = cam ? cam.project : (p) => projW(p, t);
  const camPos = cam ? cam.pos : CAM_W;
  const list = FLOCK.map((b) => ({ b, s: flockBird(b, t) })).map((o) => ({ ...o, z: len3(o.s.F.o) })).sort((p, q) => q.z - p.z);
  for (const { b, s, z } of list) {
    const base = b.kind === 'white' && opts.whiteTone ? BIRD_COLS.white.map((v, k) => lerp(v, BIRD_COLS.grey[k], opts.whiteTone)) : BIRD_COLS[b.kind];
    const haze = clamp((z - 22 * FS) / (60 * FS), 0, b.kind === 'dark' || b.kind === 'red' ? 0.32 : 0.5);   // dark birds stay solid
    const sky = [150, 128, 184];
    let c = base.map((v, k) => Math.round(lerp(v, sky[k], haze)));
    let sunRim = null;
    if (opts.sun) {
      const back = clamp((dot3(n3(s3(s.F.o, camPos)), SUN_DIR) - 0.3) / 0.6, 0, 1);    // toward the sun
      c = c.map((v, k) => Math.round(lerp(v, [60, 50, 86][k], 0.3 * back)));
      const q = proj(s.F.o), dx = opts.sun.x - q.x, dy = opts.sun.y - q.y, l = Math.hypot(dx, dy) || 1;
      sunRim = { dir: V(dx / l, dy / l), width: clamp(pxPerM(q.z) * 0.014, 0.8, 2.4) * (0.7 + 0.6 * back), color: `rgba(255,212,165,${(0.45 + 0.4 * back).toFixed(3)})` };
    }
    let flash = 0;
    if (b.kind === 'white' || b.kind === 'grey') {
      // the undersides of the wings light up when they turn to the low sun
      const w = wingPts(s.pose, 1, 1);
      const up = dirP(s.F, w.up);
      flash = clamp(-dot3(up, SUN_DIR) * 1.4 - 0.2, 0, 1) * (b.kind === 'white' ? opts.whiteFlash ?? 0.85 : 0.35);
    }
    const st = { pose: s.pose, open: 1, tail: 0.25, tailCup: opts.tailCup, color: `rgb(${c[0]},${c[1]},${c[2]})`, flash, sunRim };
    // (opts.smear: a bird crossing more than 18 px a frame leaves a faint copy half a frame back, as
    // an animator smears a fast drawing: at 30+ px a frame they stepped across the sky)
    if (opts.smear) {
      const q1 = proj(s.F.o), q0 = proj(flockFrame(b, t - 1 / FPS).o), dx = q1.x - q0.x, dy = q1.y - q0.y;
      if (Math.hypot(dx, dy) > 18) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawPigeon(s.F, (p) => { const q = proj(p); return { x: q.x - dx * 0.45, y: q.y - dy * 0.45, z: q.z }; }, camPos, { ...st, sunRim: null }, 'flat');
        ctx.restore();
      }
    }
    drawPigeon(s.F, proj, camPos, st, 'flat');
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
// its place on the flock's path: its slot, among the flock. (Moved up to the flock's front edge in
// shot 2, on the tight loop it was also the bird nearest the lens: half as big again as the birds
// round it and apart from them, a lone bird on its own line. It is told apart by its white: shot 2
// tones the flock's other whites down.)
const heroTau = (t) => t + (HERO_SLOT.dphi / OMEGA) * flockLag(t);
function heroPos(t) {
  const tj = SHEET.joinT;
  const slotPhi = (tt) => ORBIT.phi0 + OMEGA * tt + HERO_SLOT.dphi;
  if (t >= tj) {
    const tau = heroTau(t);
    if (tau > FLOCK_SPLIT) { const tr = trackAt(tau); return a3(a3(tr.p, m3(tr.L, -HERO_SLOT.dr * tr.sp)), V3(0, HERO_SLOT.dy * tr.sp, 0)); }
    return orbitPos(slotPhi(t), HERO_SLOT.dr, HERO_SLOT.dy);
  }
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
// (its last glide ends on shot 2's second frame, and from there it works on its wings to the end:
// it leads the flock. Every glide it had in shot 2 read wrong: gliding on to 5 s it held one frozen
// outline while every other bird flapped; over the top of the loop its far wing showed edge-on as
// a needle out of its head; on the run home it was a white blob blown across like a rag.)
const HERO_SCHED = [[-1, 2.55, true], [2.55, 2.95, false], [2.95, 3.55, true], [3.55, 4.05, false], [4.05, FILM_T, true]];
// The thrown pigeon's own frame at t (flight line, pitch and bank), before it is turned for the
// lens, and how much of that turn it takes (none until it joins the flock).
function heroFrame0(t) {
  const dt = 1 / 96;
  const p = heroPos(t);
  const v = m3(s3(heroPos(t + dt), heroPos(t - dt)), 1 / (2 * dt));
  // (its acceleration over three frames either side: the path's curve changes at each waypoint,
  // and read over a quarter frame its bank flipped there, 34° in one frame at shot 1's f64)
  const ha = 3 / FPS;
  const acc = m3(a3(s3(heroPos(t + ha), m3(p, 2)), heroPos(t - ha)), 1 / (ha * ha));
  // Body pitched up while it climbs to the flock's height, levelling off as it joins. This is
  // also what makes it read: its path runs almost straight away from the lens, and a body laid
  // along that path is seen tail-on (a round dot with wings edge-on: "a shuttlecock"). Nose-up,
  // we see it from below: the dove silhouette, wings spread, tail fanned, all the way up.
  const climb = 1 - sstep(SHEET.joinT - 0.4, SHEET.joinT + 0.05, t);
  const vel = a3(v, V3(0, len3(v) * (0.35 + 0.9 * (1 - sstep(RELEASE_T, RELEASE_T + 0.7, t))) * climb, 0));
  // bank into the turn: horizontal acceleration across the path. Leans are signed angles about
  // its own left (+: leaning left), so that easing its lean into the flock's never passes through
  // a side that vanishes: the two sides it used to blend pointed nearly opposite ways as it
  // joined, and the lean flipped 25° in one frame at shot 1's f68.
  const vh = n3(V3(v.x, 0, v.z));
  const L = V3(vh.z, 0, -vh.x);
  const lat = s3(V3(acc.x, 0, acc.z), m3(vh, dot3(V3(acc.x, 0, acc.z), vh)));
  // no banking while it is still climbing out of the hands, and only a little on the way up
  const bank = clamp(dot3(lat, L) * 4, -1, 1) * clamp(0.8 * Math.atan(len3(lat) / G), 0, 0.5) * sstep(RELEASE_T + 0.25, RELEASE_T + 0.9, t);
  const toC = s3(V3(ORBIT.C.x, p.y, ORBIT.C.z), p);
  const j = sstep(SHEET.joinT - 0.7, SHEET.joinT, t);
  // on the circle the flock leans toward its centre; on the flown path by its curve (signed: a
  // right turn banks right), plus the slow sway every bird of the flock has, eased in
  let bankJoin = BANK * clamp(dot3(n3(toC), L) * 3, -1, 1);
  const tauH = heroTau(t);
  if (t >= SHEET.joinT && tauH > FLOCK_SPLIT) {
    const tr = trackAt(tauH);
    bankJoin = Math.atan((tr.k * tr.v * tr.v) / G) + 0.14 * Math.sin(t * 1.7 + 0.9) * sstep(4.25, 4.6, t);
  }
  // (on the flown path, near the lens, it takes a quarter of the turn, as the flock does there)
  const kv = 0.85 * j * lerp(1, 0.25, sstep(FLOCK_SPLIT + 0.3, FLOCK_SPLIT + 1.3, tauH));
  return { F0: birdFrameFrom(p, vel, L, lerp(bank, bankJoin, j)), k: kv, climb };
}
function heroState(t) {
  const { F0, climb } = heroFrame0(t);
  // once it is one of the flock it is seen the way the flock is (see viewRoll), the turn taken as
  // its mean over a third of a second, as the flock's is on the flown path (it turned 34° in one
  // frame at f64 of shot 1, where its path bends at a waypoint)
  let roll = 0;
  for (let q = -3; q <= 3; q++) { const h = heroFrame0(t + q / FPS); if (h.k > 0) roll += viewRoll(h.F0, h.k) / 7; }
  const F = turnFrame(F0, F0.z, roll);
  const tr = t - RELEASE_T;
  const a = Math.max(activity(HERO_SCHED, t), flockEffort(heroTau(t)));
  // strong take-off beats (bigger amplitude) settling into cruise
  const amp = lerp(1.18, 0.82, sstep(0, 1.0, tr));
  const ph0 = 0.97;   // the release drawing: wings up in a V at the top of the stroke
  const phase = ph0 + (t < 2.55 ? SHEET.flap * tr : flapPhaseE(HERO_SCHED, t, 0, 1, heroTau) - flapPhase(HERO_SCHED, 2.55, 0) + SHEET.flap * (2.55 - RELEASE_T));
  const pose = mixPose(GLIDE, flapPose(phase, amp), a);
  // the tail stays fanned while it climbs (a climbing pigeon spreads it), closing as it levels
  return { F, pose, tail: lerp(0.6, 0.45, sstep(0, 0.6, tr)) * lerp(1, 0.55, 1 - climb), tailPitch: lerp(0.35, 0.12, sstep(0, 0.6, tr)) };
}
// xfade: over this many px/m past the switch, the inked drawing fades in over the silhouette
// (shot 2, where it comes nearer: swapped on one frame, its underwing turned from white to peach
// between two frames, measured at f73 -> f74)
function drawHeroFlying(t, cam = null, xfade = 0, opts = {}) {
  // (opts.sun: as drawFlock's, a warm rim on the side facing the sun while it is a silhouette)
  const s = heroState(t);
  const proj = cam ? cam.project : (p) => projW(p, t);
  const camPos = cam ? cam.pos : CAM_W;
  const k = pxPerM(proj(s.F.o).z);
  // the wings open as it leaves the hands: barely begun at the release, full the frame after
  const open = 1;   // it bursts from the hands wings-up (half-open wings read as paper panels)
  const st = { pose: s.pose, open, tail: s.tail, tailPitch: s.tailPitch, tailCup: opts.tailCup };
  // far: a clean silhouette like the rest of the flock (a little larger and the brightest, so the
  // eye can follow it in), its wings flashing in the low sun; near: the drawn, inked pigeon.
  const flat = () => {
    const up = dirP(s.F, wingPts(s.pose, 1, 1).up);
    const flash = clamp(-dot3(up, SUN_DIR) * 1.4 - 0.2, 0, 1) * 0.8;
    const g = lerp(1, 1.08, sstep(100, 70, k));
    const F2 = frameAt(s.F.o, m3(s.F.x, g), m3(s.F.y, g), m3(s.F.z, g));
    let sunRim = null;
    if (opts.sun) {
      const q = proj(s.F.o), dx = opts.sun.x - q.x, dy = opts.sun.y - q.y, l = Math.hypot(dx, dy) || 1;
      sunRim = { dir: V(dx / l, dy / l), width: clamp(k * 0.014, 0.8, 2.4), color: 'rgba(255,222,180,0.7)' };
    }
    drawPigeon(F2, proj, camPos, { ...st, color: '#f4f0fa', flash, sunRim }, 'flat');
  };
  const inked = () => drawPigeon(s.F, proj, camPos, { ...st, inkFade: [100, 150], fill: '#f4f0fa' }, 'hero');
  if (k < 100) flat();
  else if (k < 100 + xfade) {
    flat();
    const real = ctx, c = scratch('heroInk', W, H);
    ctx = c.getContext('2d');
    try { inked(); } finally { ctx = real; }
    ctx.save();
    ctx.globalAlpha = sstep(100, 100 + xfade, k);
    ctx.drawImage(c, 0, 0, W, H, 0, 0, W, H);
    ctx.restore();
  } else inked();
}
