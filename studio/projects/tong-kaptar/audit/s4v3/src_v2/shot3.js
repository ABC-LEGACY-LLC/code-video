// Tong · kaptar — shot 3: his pigeon against the sun.
// A long lens in the air with the flock, looking into the low sun: the thrown pigeon large in
// front of the disk, the flock round it, the far roofs under the sun, in slow motion.
'use strict';

// t0: the flock's clock at the first frame; rate: its seconds per second of film (slow motion)
// sun(u), hero(u): where the sun and the thrown pigeon sit in the frame at u = 0..1 of the shot
// D: the lens's distance to the thrown pigeon; K: the lens's blur (px of blur circle x metres):
// the aperture times the focal length, in pixels. (At 120, f/11 on this 200 mm lens, the flock
// birds 2 to 4 m behind him were as sharp as he is, and he did not stand out from them, measured by
// a fresh eye: edges 2-3 px against his 3-4. At 200, about f/7, they soften to 2-4 px of blur and
// the sun's edge from 5 to 8 px.)
const S3 = {
  t0: 9.2, dur: 4, rate: 0.2, f: 7000, D: 12, K: 200, mb: 14, step: 2.2, shutter: 0.5,
  sun: (u) => V(610, 340),
  // (the lens keeps with him, he gains on it a little: onto the sun from its left and across it, not
  // from one edge of the frame to the other, as he was, the lens left behind; and the shot ends with
  // him still on the disk, its strongest picture, not on plain sky after it, as he was from f083)
  hero: (u) => V(lerp(390, 770, u), lerp(390, 310, u)),
};
const sunDirAt = (t) => { const s = sunAt(t); return CAM1S.dirOf(s.x, s.y); };
// A level lens (verticals stay vertical: the horizon is shifted, not tilted) turned so the sun is
// at screen point s, and placed so the hero is at screen point h, D metres in front of it.
function aimCam(t, s, h, D, f = S3.f) {
  const sd = sunDirAt(t), az = Math.atan2(sd.x, sd.z), hh = Math.hypot(sd.x, sd.z);
  const yaw = az - Math.atan((s.x - W / 2) / f);
  const cy = s.y + (f * sd.y) / (hh * Math.cos(az - yaw));
  const c0 = makeCam({ pos: V3(0, 0, 0), yaw, pitch: 0, cy, f });
  const Hp = heroState(t, true).F.o;
  return makeCam({ pos: s3(Hp, c0.unproject(h.x, h.y, D)), yaw, pitch: 0, cy, f });
}
const s3Time = (i) => S3.t0 + (i / FPS) * S3.rate;
const cam3At = (i) => { const u = i / (S3.dur * FPS - 1); return aimCam(s3Time(i), S3.sun(u), S3.hero(u), S3.D); };
// the lens's blur circle (px) for a thing at camera depth z, focused on the thrown pigeon
const blurAt = (z) => S3.K * Math.abs(1 / S3.D - 1 / z);

// ------------------------------------------------------------------ the sky round the sun
// Seen through a long lens the sun is large: its disk has the angular size it has in shot 1 (25 px
// at f 1000, 1.43°), so here it is f × 0.025 across the radius. And the lens is exposed for the
// disk, not for the town: a sun 4° up, its light through fifteen times the air it would cross at
// noon, is a deep gold disk with a hard edge, orange at its rim, a little flattened by the air
// bending its lower edge up more than its upper. (Shot 1's wide lens, exposed for the town, burns
// it to white.) The sky round it is darker and deeper than shot 1's for the same reason.
const SUN_R = 0.025, SUN_FLAT = 0.96;
function drawSky3(cam, t, sun) {
  // by elevation, as shot 1 lays it, then taken down to this exposure
  drawSkyCam(cam);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(206,170,188)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // the aureole: orange at the disk's edge, through coral to rose
  const R = cam.f * SUN_R;
  const g = ctx.createRadialGradient(sun.x, sun.y, R, sun.x, sun.y, R * 7);
  g.addColorStop(0, 'rgba(240,150,92,1)');
  g.addColorStop(0.05, 'rgba(236,138,90,0.9)');
  g.addColorStop(0.15, 'rgba(226,124,94,0.72)');
  g.addColorStop(0.33, 'rgba(204,104,104,0.44)');
  g.addColorStop(0.6, 'rgba(176,90,118,0.16)');
  g.addColorStop(1, 'rgba(150,80,130,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function sunPath3(cam, sun) {
  const R = cam.f * SUN_R;
  const p = new Path2D();
  p.ellipse(sun.x, sun.y, R, R * SUN_FLAT, 0, 0, TAU);
  return p;
}
function drawSunDisk3(cam, t, sun) {
  const R = cam.f * SUN_R;
  const g = ctx.createRadialGradient(sun.x, sun.y - R * 0.08, 0, sun.x, sun.y, R);
  g.addColorStop(0, '#fff6dc');
  g.addColorStop(0.5, '#ffe4a8');
  g.addColorStop(0.84, '#ffc97e');
  g.addColorStop(1, '#fcb062');
  ctx.fillStyle = g;
  ctx.fill(sunPath3(cam, sun));
  // and the lower limb, through more air than the upper (at 4° up, a tenth more), redder and dimmer
  const R2 = R * 1.02;
  ctx.save();
  ctx.clip(sunPath3(cam, sun));
  ctx.globalCompositeOperation = 'multiply';
  const lg = ctx.createLinearGradient(0, sun.y - R2, 0, sun.y + R2);
  lg.addColorStop(0, '#ffffff');
  lg.addColorStop(0.42, '#ffffff');
  lg.addColorStop(1, 'rgb(250,204,168)');
  ctx.fillStyle = lg;
  ctx.fillRect(sun.x - R2, sun.y - R2, 2 * R2, 2 * R2);
  ctx.restore();
}

// ------------------------------------------------------------------ the far roofs under the sun
// The long lens looks along a few degrees of shot 1's far skyline, the buildings the sun rises
// behind, seven times as large: its roofs and the tops of its walls fill the bottom of the frame.
// What shot 1 could not resolve is there to see: the windows (a storey is 2 of shot 1's pixels
// with the far roofs a kilometre and a half off), a lit one here and there, the parapets, and on the roofs
// the water tanks, stair huts, masts and dishes of a Tashkent roofscape. All of it is drawn in
// shot 1's pixels and carried over by the same map as the skyline itself.
const FAR3_X = [960, 1280];            // the part of shot 1's skyline this lens can see (px)
let FAR3 = null;
function far3Detail() {
  if (FAR3) return FAR3;
  const inView = FAR_REC.rects.filter((q) => q[0] + q[2] > FAR3_X[0] && q[0] < FAR3_X[1]);
  const R = rng(3303);
  const walls = [], lit = [], ledges = [], clutter = [];
  for (const [x, y, w, h] of inView) {
    const tall = h > 40;                        // a building (the short ones are huts on its roof)
    // the windows: rows a storey apart below the parapet, down past the frame; each building its
    // own (panel blocks have a strict grid, older ones a looser one), and not all of them
    const px = 2.3 + R() * 0.8, ww = 0.8 + R() * 0.5, wh = 0.8 + R() * 0.35, off = 1 + R() * 1.2;
    const blank = R() < 0.2;
    for (let yy = y + 1.6 + R() * 0.5; yy < 546 && !blank; yy += 2.1) {
      for (let xx = x + off; xx + ww < x + w - 0.8; xx += px) {
        if (R() < 0.14) continue;
        (R() < 0.03 ? lit : walls).push([xx, yy, ww, wh]);
      }
    }
    ledges.push([x, y, w, 0.28]);
    if (!tall) continue;
    // on the roof: a water tank on legs, a stair hut, a mast with its cross-bars, a dish
    const k = 1 + Math.floor(R() * 3);
    for (let j = 0; j < k; j++) {
      const cx = x + 2 + R() * (w - 6), kind = R();
      if (kind < 0.3) { clutter.push([cx, y - 2.6, 2.6, 1.7], [cx + 0.2, y - 0.9, 0.18, 0.95], [cx + 2.2, y - 0.9, 0.18, 0.95]); }
      else if (kind < 0.55) { clutter.push([cx, y - 2.1, 3.2, 2.15]); }
      else if (kind < 0.85) {
        const mh = 3 + R() * 4;
        clutter.push([cx, y - mh, 0.14, mh + 0.05], [cx - 0.7, y - mh + 0.6, 1.54, 0.1]);
        if (R() < 0.6) clutter.push([cx - 0.5, y - mh + 1.6, 1.14, 0.1]);
      } else clutter.push([cx, y - 1.1, 1.1, 0.8]);
    }
  }
  // the trees in front of them, with a leafy edge (seen seven times as large, the lobes shot 1 drew
  // as ellipses were smooth purple clouds): every lobe's outline broken into small leaf clumps
  // (recorded, as the skyline is: a native path would be drawn in shot 1's pixels, unmapped)
  const trees = recorded(() => new Path2D());
  const inT = FAR_REC.trees.filter((sh) => sh.pts.some((p) => p.x > FAR3_X[0] - 40 && p.x < FAR3_X[1] + 40));
  for (const sh of inT) {
    const src = sh.smooth === false ? sh.pts : smoothLoop(sh.pts, 64, 1);
    const n = src.length, out = [];
    let cx = 0, cy = 0;
    for (const p of src) { cx += p.x / n; cy += p.y / n; }
    const Lp = src.reduce((a, p, i) => a + len(sub(src[(i + 1) % n], p)), 0);
    const m = Math.max(24, Math.round(Lp / 0.7));
    const even = smoothLoop(src, m, 0);
    even.forEach((p, i) => {
      const d = norm(sub(p, V(cx, cy)));
      const k = 0.32 * noise1(i * 0.9, 17 + n) + 0.18 * noise1(i * 2.3, 29 + n);
      out.push(add(p, mul(d, k)));
    });
    // (every outline wound the same way: the lobes overlap, and opposite windings cut holes)
    const loop = sh.smooth === false ? sh.pts : out;
    trees.addPath(recorded(() => polyPath(area2(loop) < 0 ? loop.slice().reverse() : loop)));
  }
  FAR3 = { walls, lit, ledges, clutter, trees };
  return FAR3;
}
// the skyline's fill for this lens: its walls face us, away from the sun, in shadow; deeper at the
// top where they stand against the bright aureole, hazier lower down (and all of it taken down to
// the exposure the lens has for the sun)
const FAR3_STOPS = [[0, '#5a4776'], [0.45, '#6f5486'], [1, '#937292']];      // y 490 -> 545 of shot 1
// The far roofs are not at infinity for a lens that has flown 30 m out from the roof and climbed
// 8: at a kilometre and a half they sit lower under the sun than shot 1 saw them, and they slide
// against the sun as the lens flies on (about 25 px over the shot), which is how the eye knows the
// lens is moving. The trees in front of them are nearer, and slide further. (Shot 1's and 2's
// lenses hardly move, and there they are drawn at infinity.) The clump right of the sun is shot 1's,
// its top 82 px over shot 1's horizon (f 1000): put at 1.1 km it stood 90 m over the roof we threw
// from (a fresh eye read 75 m); at 300 m it is 25 m over it, a big chinar, and sits lower, among
// the roofs.
let FAR3_D = 1500, FAR3_DT = 300;
const FARL = mk(W, H);
function drawFar3(cam, t, M, Mt, sun, lightMap = false) {
  const D = far3Detail();
  const yOf = (y1) => M(1112, y1).y;
  const real = ctx;
  const L = FARL.getContext('2d');
  if (!lightMap) { reset2d(L).clearRect(0, 0, W, H); ctx = L; }
  const grad = (y0, y1, stops) => { const g = ctx.createLinearGradient(0, yOf(y0), 0, yOf(y1)); for (const [u, c] of stops) g.addColorStop(u, c); return g; };
  try {
    const fill = lightMap ? '#000' : grad(490, 545, FAR3_STOPS);
    const treeFill = lightMap ? '#000' : grad(480, 545, [[0, '#4e3d6a'], [1, '#806485']]);
    withMap(M, () => {
      const box = (list) => { const p = new Path2D(); for (const r of list) p.rect(...r); return p; };
      ctx.fillStyle = fill;
      ctx.fill(box(FAR_REC.rects));
      ctx.fill(box(D.clutter));
      if (lightMap) return;
      ctx.fillStyle = 'rgba(40,26,60,0.16)';
      ctx.fill(box(D.walls));
      ctx.fillStyle = 'rgba(255,196,140,0.5)';
      ctx.fill(box(D.lit));
      ctx.fillStyle = 'rgba(255,190,160,0.2)';
      ctx.fill(box(D.ledges));
    });
    withMap(Mt, () => { ctx.fillStyle = treeFill; ctx.fill(D.trees); });
  } finally { ctx = real; }
  if (lightMap) return;
  // the haze between us and them, lit by the sun behind them: thicker low down, and toward the sun
  // the air between is lit through (forward scatter), so under the sun the roofs all but vanish
  // into it, and away from it they stand darker
  L.globalCompositeOperation = 'source-atop';
  const hz = L.createLinearGradient(0, yOf(500), 0, yOf(545));
  hz.addColorStop(0, 'rgba(236,160,132,0)');
  hz.addColorStop(1, 'rgba(236,160,132,0.45)');
  L.fillStyle = hz;
  L.fillRect(0, 0, W, H);
  const R = cam.f * SUN_R;
  const gl = L.createRadialGradient(sun.x, sun.y, R * 0.6, sun.x, sun.y, R * 3.2);
  gl.addColorStop(0, 'rgba(255,188,122,0.86)');
  gl.addColorStop(0.35, 'rgba(246,164,114,0.5)');
  gl.addColorStop(1, 'rgba(230,140,120,0)');
  L.fillStyle = gl;
  L.fillRect(0, 0, W, H);
  L.globalCompositeOperation = 'source-over';
  ctx.drawImage(FARL, 0, 0);
}

// ------------------------------------------------------------------ the light behind things
// Feathers are thin: held against the low sun a pigeon's flight feathers glow, and the fringe of its
// outline burns bright, but only where there is light behind them. The picture itself cannot say
// where that is (the sky near the sun and the disk are both near white in it, the disk is a hundred
// times brighter), so a second picture, the light map, holds how much light comes from behind each
// point: the disk 1, the aureole falling off round it, the sky a little; and every thing that
// stands in front of the sun (the far roofs, each bird as it is drawn) is painted into it black.
const LM = mk(W, H);
function lightMapStart(cam, t, sun) {
  const g = LM.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.filter = 'none';
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const R = cam.f * SUN_R;
  const a = g.createRadialGradient(sun.x, sun.y, R, sun.x, sun.y, R * 7);
  a.addColorStop(0, 'rgba(255,255,255,0.26)');
  a.addColorStop(0.08, 'rgba(255,255,255,0.1)');
  a.addColorStop(0.3, 'rgba(255,255,255,0.035)');
  a.addColorStop(1, 'rgba(255,255,255,0.012)');
  g.fillStyle = a;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.fill(sunPath3(cam, sun));
  return g;
}
// run fn with the light map as the drawing context (for layers drawn by code that uses ctx)
function onLightMap(fn) {
  const real = ctx;
  ctx = LM.getContext('2d');
  try { fn(); } finally { ctx = real; }
}

// ------------------------------------------------------------------ the pigeon up close
// What the other shots never needed: the wing's trailing edge as a row of rounded feather tips,
// the tail as twelve feathers, the wing's leading edge as thick as it is, the beak.
// The open wing's outline, in wing coordinates [span, chord] (WING_OPEN, from the body to the tip
// and back): the leading edge and the separated primaries as WING_OPEN has them, then one rounded
// tip per feather along the trailing edge from P5 in to the body (about 1.4 cm apart).
const WING_DETAIL = (() => {
  const out = [];
  for (let i = 0; i <= 15; i++) out.push({ s: WING_OPEN[i][0], c: WING_OPEN[i][1], sharp: WING_SHARP.has(i), notch: WING_NOTCH.includes(i) });
  const te = [[0.222, -0.118], [0.192, -0.116], [0.165, -0.116], [0.12, -0.118], [0.075, -0.115], [0.035, -0.106], [0.0, -0.092]];
  const cAt = (s) => {
    for (let k = 0; k + 1 < te.length; k++) { const a = te[k], b = te[k + 1]; if (s <= a[0] && s >= b[0]) return lerp(a[1], b[1], (a[0] - s) / (a[0] - b[0])); }
    return s > te[0][0] ? te[0][1] : te[te.length - 1][1];
  };
  out.push({ s: 0.208, c: cAt(0.208) + 0.007, sharp: true, notch: true });     // the slot inside P6
  const tips = [0.197, 0.183, 0.169, 0.155, 0.141, 0.127, 0.113, 0.099, 0.085, 0.071, 0.057, 0.043, 0.029, 0.016];
  // (each feather a little longer or shorter than its neighbours: an even saw-tooth read as drawn)
  tips.forEach((s, k) => {
    const sp = k + 1 < tips.length ? s - tips[k + 1] : 0.013, jc = 0.0022 * Math.sin(k * 2.7 + 0.4);
    out.push({ s: s + sp * 0.32, c: cAt(s + sp * 0.32) + 0.0013 + jc * 0.7 });
    out.push({ s, c: cAt(s) + jc });
    out.push({ s: s - sp * 0.32, c: cAt(s - sp * 0.32) + 0.0013 + jc * 0.7 });
    if (k + 1 < tips.length) out.push({ s: s - sp / 2, c: cAt(s - sp / 2) + 0.0032, sharp: true });
  });
  out.push({ s: 0.004, c: -0.09 });
  // then along the back: the tertials lie from the arm's inner edge back over the rump, the
  // scapulars forward over the back to the shoulder (bird-frame points, x on the wing's own side):
  // the wing is joined to the body along its root, not pinned to it at a corner. (A patch between
  // the two, laid as their hull, left a stair-step where it met the trailing edge, traced by the
  // bright fringe.)
  // (and last, two points inside the breast before the shoulder: the leading edge's root stands a
  // few mm off the body, and seen from below a sliver of sky between them burned with the fringe, a
  // bright fleck at the nape, measured f021, f040, f060)
  // (all of them a few mm inside the body: on its surface, they drew the wing's edge along the body's
  // own outline wherever the lens saw that surface edge-on, and the two edges, a pixel apart, left a
  // crack of sky between them, 1 to 10 px at the thrown pigeon's flank on 50 frames, measured)
  for (const b of [[0.0224, 0.0272, -0.072], [0.0144, 0.024, -0.084], [0.0064, 0.04, -0.045], [0.008, 0.0448, 0.015], [0.0144, 0.04, 0.058], [0.0096, 0.028, 0.07], [0.022, 0.018, 0.068]]) out.push({ body: V3(...b) });
  // (and the outer primaries a little longer at the tip: the wing ends in a point in every phase)
  out[9] = { ...out[9], s: 0.343, c: -0.073 };
  out[11] = { ...out[11], s: 0.311, c: -0.093 };
  return out;
})();
// the wing's root, many feathers deep and opaque: the root of the trailing edge and the patch over
// the back (by index into WING_DETAIL: its root trailing point and the body points after it)
const WING_ROOT = WING_DETAIL.map((q, i) => i).filter((i) => i >= WING_DETAIL.findIndex((q) => !q.body && q.s === 0.004));
// The wing in two parts, each carried by the bone it grows from (entries: an index into
// WING_DETAIL, or a point of its own in wing coordinates). The hand: from the wrist out along the
// leading edge, back along the primaries' tips to the innermost primary, and along its inner vane to
// the wrist, tucked under the outer secondaries (so the open wing has no seam). The arm: from the root
// out to the wrist, down the outer secondary, back along the secondaries' tips and over the back.
// Folded, the hand turns back about the wrist over the arm. (Drawn as one outline through a blend of
// the two maps across the wrist, the outer secondaries swung half-way back with the hand and the
// trailing edge crossed itself: a hole between arm, hand and body in every upstroke, measured at
// f013, f033, f074; and a thin bar of wing reaching past the breast.)
const WING_PARTS = (() => {
  const TIP0 = 17, NP = 2, n = WING_DETAIL.length;          // the trailing tips start after the slot; the first two are primaries
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  return {
    hand: [{ s: WRIST_S, c: WING_OPEN[WRIST][1], sharp: true }].concat(range(WRIST + 1, TIP0 + 4 * NP - 2), [{ s: 0.158, c: -0.06 }, { s: 0.156, c: 0.004 }]),
    arm: range(0, WRIST - 1).concat([{ s: WRIST_S, c: WING_OPEN[WRIST][1], sharp: true }, { s: 0.171, c: -0.04 }], range(TIP0 + 4 * NP, n - 1)),
  };
})();
// The feathers' shafts [base, tip] (the primaries fan from the hand, the secondaries from the
// forearm), and where the coverts end: in front of that line the wing is many layers deep and
// opaque; behind it the flight feathers are one or two vanes thick and let the light through.
const WING_SHAFTS = (() => {
  const out = [];
  // (the primaries' roots close together along the hand, 6 cm of it: they fan from there to the tip)
  // (third: on the hand, a primary; else a secondary, on the forearm)
  const prim = [[0.36, -0.056], [0.343, -0.073], [0.311, -0.093], [0.265, -0.11], [0.222, -0.118], [0.197, -0.116], [0.183, -0.116]];
  prim.forEach((tip, k) => { const u = k / (prim.length - 1); out.push([[lerp(0.232, 0.172, u), lerp(0.006, 0.012, u)], tip, true]); });
  const sec = [0.169, 0.155, 0.141, 0.127, 0.113, 0.099, 0.085, 0.071, 0.057, 0.043, 0.029];
  const te = (s) => lerp(-0.116, -0.1, clamp((0.075 - s) / 0.075, 0, 1)) + (s > 0.075 ? -0.002 * Math.sin(((s - 0.075) / 0.09) * Math.PI) : 0);
  for (const s of sec) out.push([[s - 0.004, 0.016], [s, te(s)], false]);
  return out;
})();
// where the coverts end, on the arm and on the hand (the hand's tucked under the arm's, as the wing is)
const COVERTS = [[[0, 0.028], [0.06, 0.038], [0.12, 0.04], [0.165, 0.036], [0.165, -0.054], [0.12, -0.056], [0.075, -0.054], [0.035, -0.048], [0, -0.042]],
  [[0.165, 0.036], [0.22, 0.024], [0.278, 0.004], [0.292, -0.006], [0.262, -0.026], [0.225, -0.04], [0.19, -0.05], [0.158, -0.052]]];
const onHand = (s) => s > WRIST_S + 1e-6;
// the leading edge's thickness (m, radius) from the body to the tip: the arm with its muscles, the
// hand, the outer primary's stiff edge
const LEAD_R = [0.012, 0.011, 0.009, 0.0065, 0.004, 0.0026, 0.0018, 0.0012];

// Twelve tail feathers in the bird frame (the fan as tailPts lays it: spread 0..1, pitch, cup):
// narrow at the root, broad and round at the tip, the middle pair longest.
function tailFeathers3(spread, pitch, cup) {
  const half = lerp(0.03, 0.085, spread), Lz = 0.135, root = V3(0, 0.008, -0.07);
  const to3 = (x, dz) => V3(x, root.y + Math.sin(pitch) * dz - Math.abs(x) * cup, root.z + Math.cos(pitch) * dz);
  const out = [];
  for (let k = 0; k < 12; k++) {
    const u = (k / 11) * 2 - 1;
    const L = Lz * (1.03 - 0.03 * u * u);
    const x0 = u * 0.016, x1 = u * half;
    const d = norm(V(x1 - x0, -L)), n = perp(d);
    const at = (a, w) => V(x0 + d.x * a * L + n.x * w, -0 + d.y * a * L + n.y * w);
    const w = 0.0118;
    const pts2 = [at(0, -0.004), at(0.35, -w * 0.8), at(0.75, -w), at(0.93, -w * 0.78), at(1, 0), at(0.93, w * 0.78), at(0.75, w), at(0.35, w * 0.8), at(0, 0.004)];
    out.push({ pts: pts2.map((p) => to3(p.x, p.y)), shaft: [to3(at(0.3, 0).x, at(0.3, 0).y), to3(at(0.97, 0).x, at(0.97, 0).y)], u });
  }
  // and the closed tail's depth, seen from the side: twelve feathers stacked and the coverts under
  // them, a band a centimetre deep ending square (a fan of flat feathers seen edge-on was a spike
  // tapering to a point, a swallow's, on every flock bird side-on)
  const keel = [[0.007, 0], [0.005, -0.5], [0.0035, -0.9], [0.0015, -0.955], [-0.0015, -0.955], [-0.0035, -0.9], [-0.006, -0.5], [-0.009, 0]];
  out.push({ pts: keel.map(([h, a]) => a3(to3(0, a * Lz), V3(0, h, 0))), shaft: null, u: 0 });
  return out;
}

// Everything about one bird that is drawn, in screen pixels.
function birdGeom3(F, proj, camPos, st) {
  const pose = st.pose || GLIDE;
  const P = (p) => proj(toP(F, p));
  const o = P(V3(0, 0, 0));
  // px per metre at the bird: a small step across the line of sight
  const scale = (() => { const v = n3(s3(F.o, camPos)), a = n3(cross3(v, V3(0, 1, 0))); return len(sub(proj(a3(F.o, m3(a, 0.1))), o)) / 0.1; })();
  const HF = yprFrame(frameAt(toP(F, PG.head.c), F.x, F.y, F.z), st.headYaw || 0, st.headPitch || 0, 0);
  const n = 30;
  const body = ellipsoidPts(F, PG.body.c, PG.body.r, proj, n);
  const breast = ellipsoidPts(F, PG.breast.c, PG.breast.r, proj, n);
  const neck = ellipsoidPts(F, PG.neck.c, PG.neck.r, proj, n);
  const head = ellipsoidPts(frameAt(HF.o, HF.x, HF.y, HF.z), V3(0, 0, 0), PG.head.r, proj, n);
  const tp = st.tailPitch ?? 0;
  const under = [V3(0.02, -0.012, -0.06), V3(0, -0.016 - Math.sin(tp) * 0.05, -0.07 - Math.cos(tp) * 0.06), V3(-0.02, -0.012, -0.06), V3(0, 0.004, -0.075)].map(P);
  // the body as one soft outline (a pigeon's head runs into its neck, its neck into its breast: the
  // ellipsoids' unions had a notch at each join, a snowman)
  const sig = clamp(scale * 0.005, 0.8, 7);
  // (a pigeon's head sits on a thick neck: the nape fills the waist between the two)
  const nape = ellipsoidPts(F, V3(0, 0.042, 0.112), V3(0.026, 0.03, 0.028), proj, n);
  const bodyOut = traceUnion([{ pts: body.pts }, { pts: breast.pts }, { pts: neck.pts }, { pts: nape.pts }, { pts: head.pts }, { pts: under, smooth: true }], sig);
  // the bill short and stout, the white cere a swelling on top of its base, the tip turned down a
  // little (a pigeon's, not a needle)
  const beak = hull([V3(0.0058, -0.0015, 0.021), V3(-0.0058, -0.0015, 0.021), V3(0, 0.0075, 0.021), V3(0, 0.0088, 0.029), V3(0, 0.0045, 0.036),
    V3(0, 0.0012, 0.044), V3(0, -0.002, 0.047), V3(0, -0.0045, 0.039), V3(0, -0.0075, 0.02)].map((p) => proj(toP(HF, p))));
  const tf3 = tailFeathers3(st.tail ?? 0.3, tp, st.tailCup ?? 0.3);
  const tailF = tf3.map((f) => ({ pts: f.pts.map(P), shaft: f.shaft ? f.shaft.map(P) : null, u: f.u }));
  const tailZ = len3(s3(toP(F, l3(tf3[5].pts[4], tf3[6].pts[4], 0.5)), camPos)) * 0.5 + len3(s3(toP(F, V3(0, 0.008, -0.07)), camPos)) * 0.5;
  const closed = clamp(pose.fold * 2.4, 0, 1);
  const wings = [1, -1].map((sg) => {
    const X = wingXform(pose, sg);
    // every point carried by its own bone: the arm's map inboard of the wrist, the hand's outboard
    // (see WING_PARTS). (The primaries bend under the air: tips up through the downstroke, down a
    // little on the way up; st.bend is how far the tip of the outer primary moves off the hand's
    // plane, m.)
    const nH = m3(cross3(X.ec, X.esH), sg), bend = st.bend || 0;
    // (the arm at its full chord: a flexed wing's secondaries fan closed along the forearm but are no
    // shorter. The shared map narrows the arm as it folds, and here that opened a gap between the
    // secondaries' tips and the primaries folded back over them, closed by the body into a hole,
    // measured on 65 of the thrown pigeon's frames)
    const armM = (s, c) => P(a3(X.arm(s, 0), m3(X.ec, c)));
    const handM = (s, c) => { let p = X.hand(s, c); if (bend && s > 0.24) p = a3(p, m3(nH, bend * ((s - 0.24) / 0.12) ** 2)); return P(p); };
    const map = (s, c) => (onHand(s) ? handM(s, c) : armM(s, c));
    const src = WING_DETAIL.map((q, i) => {
      if (!q.notch) return q;
      const a = WING_DETAIL[i - 1], b = WING_DETAIL[i + 1];
      return { ...q, s: lerp(q.s, (a.s + b.s) / 2, closed), c: lerp(q.c, (a.c + b.c) / 2, closed) };
    });
    const at = (e, onH) => { const q = typeof e === 'number' ? src[e] : e; return q.body ? P(V3(sg * q.body.x, q.body.y, q.body.z)) : onH ? handM(q.s, q.c) : armM(q.s, q.c); };
    const part = (list, onH) => ({ pts: list.map((e) => at(e, onH)), smooth: true, sharp: new Set(list.map((e, k) => ((typeof e === 'number' ? src[e] : e).sharp ? k : -1)).filter((k) => k >= 0)) });
    const parts = [part(WING_PARTS.arm, false), part(WING_PARTS.hand, true)];
    const pts = parts[0].pts.concat(parts[1].pts);
    const root = WING_ROOT.map((i) => at(i, false)).concat([armM(0, 0.028), armM(0.03, -0.04)]);
    const cov = [COVERTS[0].map(([s, c]) => armM(s, c)), COVERTS[1].map(([s, c]) => handM(s, c))];
    const shafts = WING_SHAFTS.map(([b, tp2, h]) => { const m = h ? handM : armM; return [m(b[0], b[1]), m(lerp(b[0], tp2[0], 0.82), lerp(b[1], tp2[1], 0.82))]; });
    const shaftHand = WING_SHAFTS.map((q) => q[2]);
    // the leading edge as a tube: circles along it, as wide as it is thick, each within half its
    // radius of the next (spaced by the metre, they left pinholes between them near the tip)
    const tube = [];
    const lead = [];
    for (let i = 0; i < 7; i++) for (let k = 0; k < 10; k++) {
      const u = k / 10, a = WING_OPEN[i], b = WING_OPEN[i + 1], rm = lerp(LEAD_R[i], LEAD_R[i + 1], u);
      lead.push({ q: map(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - rm * 0.6), r: rm * scale });
    }
    let acc = 1e9;
    for (let k = 0; k < lead.length; k++) {
      if (k) acc += len(sub(lead[k].q, lead[k - 1].q));
      const r = lead[k].r;
      if (r < 0.5) continue;
      if (acc >= Math.max(0.5 * r, 0.8)) { tube.push({ pts: ellipsePts(V(lead[k].q.x, lead[k].q.y), V(r, 0), V(0, r), 14) }); acc = 0; }
    }
    const mid = toP(F, (onHand(0.2) ? X.hand : X.arm)(0.12, -0.02));
    const view = s3(mid, camPos);
    // how squarely the lens sees the wing's face: 1 face-on, 0 looking along its plane (edge-on, or
    // along its span, the tip toward the lens)
    const face = Math.abs(dot3(n3(dirP(F, X.up)), n3(view)));
    return { sg, pts, parts, cov, shafts, shaftHand, tube, root, z: len3(view), up: dirP(F, X.up), face };
  });
  // which wing passes behind the body (as drawPigeon decides)
  const view = n3(s3(toP(F, V3(0, 0, 0)), camPos));
  const belly = dot3(n3(F.y), view);
  wings.sort((a, b) => b.z - a.z);
  const behind = wings.filter((w, i) => belly > 0.3 || (belly > -0.3 && i === 0));
  return { scale, o, bodyOut, beak, tailF, tailZ, wings, behind, front: wings.filter((w) => !behind.includes(w)) };
}
// a wing's outline: its two parts, each wound the same way (so where they overlap they add)
const wingShape = (w) => w.parts;
// polygons as one path, each wound the same way
const posPath = (polys) => { const p = new Path2D(); for (const q of polys) polyInto(area2(q) < 0 ? q.slice().reverse() : q, p); return p; };
// Each part as a list of paths, filled one by one. (One path for the whole bird, filled nonzero,
// punched holes through it: a wing seen edge-on or folded is a self-crossing outline, part of it
// wound the other way, and where that part lay over the body the two cancelled. Measured: holes of
// up to 191 px in 14 birds' frames, the thrown pigeon's among them.)
function birdPaths3(G) {
  const body = [unionPath([{ pts: G.bodyOut, smooth: false }, { pts: G.beak, smooth: false }])];
  const tail = [unionPath(G.tailF.map((f) => ({ pts: f.pts, smooth: true })))];
  const wing = G.wings.map((w) => [unionPath(wingShape(w))].concat(w.tube.length ? [unionPath(w.tube)] : []));
  const all = body.concat(tail, ...wing);
  const allPts = G.bodyOut.concat(G.beak, ...G.tailF.map((f) => f.pts), ...G.wings.map((w) => w.pts));
  return { body, tail, wing, all, bb: bboxOf(allPts, 4) };
}
const fillAll = (g, list) => { for (const p of [].concat(list).flat(3)) g.fill(p); };

// How a bird of each kind looks against the light: its body in shadow (lit only by the sky behind
// the lens), how much light its flight feathers and tail let through, how bright its fringe burns.
// tint: the colour a flight feather adds with the disk right behind it; rimC: the fringe's, likewise;
// floor: the share of that the plain sky near the sun still gives
// lobe: how brightly its flight feathers shine with the sun near but not behind them (pale birds
// most: they are the pale grey and white birds of shot 2, lit through)
// (the thrown pigeon is the whitest of them: its flight feathers two and a half degrees off the sun
// came out darker than the sky beside them, a grey bird, measured; the flock's whites a step down,
// so it is the one that burns)
const LOOK3 = {
  hero: { base: [78, 66, 98], trans: 1, cov: 0.4, tail: 0.9, rim: 1, band: 0.0028, tint: [196, 138, 52], floor: 0.08, lobe: 1.0 },
  white: { base: [72, 60, 92], trans: 0.7, cov: 0.24, tail: 0.62, rim: 1, band: 0.0024, tint: [190, 132, 50], floor: 0.07, lobe: 0.34 },
  grey: { base: [56, 46, 74], trans: 0.45, cov: 0.06, tail: 0.35, rim: 0.9, band: 0.0022, tint: [176, 112, 42], floor: 0.06, lobe: 0.3 },
  red: { base: [60, 38, 50], trans: 0.45, cov: 0.06, tail: 0.35, rim: 0.9, band: 0.0022, tint: [190, 98, 46], floor: 0.06, lobe: 0.3 },
  dark: { base: [36, 28, 48], trans: 0.22, cov: 0, tail: 0.15, rim: 0.8, band: 0.0022, tint: [164, 92, 38], floor: 0.05, lobe: 0.18 },
};
const rgbS = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
// A3: a bird's body, G3: the light it lets through or that burns on its edge (added onto the frame),
// M3: a mask, L3: the light behind it, E3: its outline shrunk
const A3 = mk(W, H), G3 = mk(W, H), M3 = mk(W, H), L3 = mk(W, H), E3 = mk(W, H), D3 = mk(W, H), K3 = mk(W, H), ERODED = mk(W, H);
// (read back pixel by pixel: see fillHoles3)
const SIL = (() => { const c = mk(W, H); c.getContext("2d", { willReadFrequently: true }); return c; })();
const reset2d = (g) => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; return g; };
// the light behind the box (from the light map), softened by `blur` px and coloured by `tint`
// Feathers near the sun glow with its light even where the disk is not behind them: a thin vane
// scatters light mostly forward, a little off its line, so a white flight feather a few degrees
// from a low sun shines brighter than the sky beside it (the lobe). Where the disk itself is behind
// it, the disk shows through as well (the light map). (With the light map alone, a white pigeon
// glowed only while a wing was over the disk, and one degree off it read as a grey bird with a
// white outline.) S3L: the sun's centre and radius on screen, this frame.
const S3L = { sun: V(0, 0), R: 1 };
function lightIn(bb, blur, tint, floor = 0, lobe = 0) {
  const g = reset2d(L3.getContext('2d'));
  g.fillStyle = '#000';
  g.fillRect(0, 0, bb.w, bb.h);
  const pad = Math.ceil(blur * 3) + 2;
  if (blur > 0.3) g.filter = `blur(${blur.toFixed(2)}px)`;
  g.drawImage(LM, bb.x0 - pad, bb.y0 - pad, bb.w + 2 * pad, bb.h + 2 * pad, -pad, -pad, bb.w + 2 * pad, bb.h + 2 * pad);
  g.filter = 'none';
  g.globalCompositeOperation = 'lighter';
  if (floor > 0) { const v = Math.round(255 * floor); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, 0, bb.w, bb.h); }
  if (lobe > 0) {
    const c = sub(S3L.sun, V(bb.x0, bb.y0)), R = S3L.R;
    const lg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 8);
    for (const [u, k] of [[0, 1], [0.125, 0.86], [0.25, 0.62], [0.375, 0.41], [0.5, 0.29], [0.75, 0.16], [1, 0.1]]) lg.addColorStop(u, `rgba(255,255,255,${(lobe * k).toFixed(3)})`);
    g.fillStyle = lg;
    g.fillRect(0, 0, bb.w, bb.h);
  }
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgbS(tint);
  g.fillRect(0, 0, bb.w, bb.h);
  return L3;
}
// The light behind the box as the fringe sees it: what is drawn behind the bird so far (the sky, the
// disk, the birds beyond it) less the bird's own colour, times how much light comes from behind
// there (the light map), softened by `blur` px. Added through the fringe's mask at full strength, the
// fringe over the disk is the disk, over the sky a little of the sky.
const BG3 = mk(W, H);
function lightBehind(bb, blur, base) {
  const g = reset2d(L3.getContext('2d'));
  g.fillStyle = '#000';
  g.fillRect(0, 0, bb.w, bb.h);
  const pad = Math.ceil(blur * 3) + 2;
  if (blur > 0.3) g.filter = `blur(${blur.toFixed(2)}px)`;
  g.drawImage(LM, bb.x0 - pad, bb.y0 - pad, bb.w + 2 * pad, bb.h + 2 * pad, -pad, -pad, bb.w + 2 * pad, bb.h + 2 * pad);
  g.filter = 'none';
  const b = reset2d(BG3.getContext('2d'));
  b.fillStyle = '#000';
  b.fillRect(0, 0, bb.w, bb.h);
  b.drawImage(canvas, bb.x0, bb.y0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  b.globalCompositeOperation = 'difference';
  b.fillStyle = rgbS(base);
  b.fillRect(0, 0, bb.w, bb.h);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(BG3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  return L3;
}
// a mask in the box, drawn in screen coordinates by fn, minus every path in `cut`
function maskIn(bb, fn, cut) {
  const g = reset2d(M3.getContext('2d'));
  g.clearRect(0, 0, bb.w, bb.h);
  g.setTransform(1, 0, 0, 1, -bb.x0, -bb.y0);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  fn(g);
  g.globalCompositeOperation = 'destination-out';
  for (const c of cut) fillAll(g, c);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return g;
}
// the union of a list of paths, drawn into T3 in the box's pixels
const T3 = mk(W, H);
function unionIn(bb, list, dx = 0, dy = 0) {
  const g = reset2d(T3.getContext('2d'));
  g.clearRect(0, 0, bb.w, bb.h);
  g.setTransform(1, 0, 0, 1, -bb.x0 + dx, -bb.y0 + dy);
  g.fillStyle = '#fff';
  fillAll(g, list);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return T3;
}
// add the light in L3 to the light layer through the mask in M3
function addLight(bb, strength) {
  if (strength <= 0) return;
  const g = M3.getContext('2d');
  g.globalCompositeOperation = 'source-in';
  g.drawImage(L3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  const a = G3.getContext('2d');
  a.globalCompositeOperation = 'lighter';
  for (let k = strength; k > 0.001; k -= 1) { a.globalAlpha = Math.min(1, k); a.drawImage(M3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h); }
  a.globalAlpha = 1;
  a.globalCompositeOperation = 'source-over';
}
// take light away through the mask in M3 (a shaft is opaque: the vane's glow stops at it)
function cutLight(bb, alpha) {
  const a = G3.getContext('2d');
  a.globalCompositeOperation = 'destination-out';
  a.globalAlpha = alpha;
  a.drawImage(M3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  a.globalAlpha = 1;
  a.globalCompositeOperation = 'source-over';
}
// Draw one bird against the light: into its own layer, then onto the frame (blurred as the lens
// blurs it at its depth), then into the light map as a shadow for what is in front of it.
function drawBird3(F, cam, st, look, blur = 0, sunScreen = null, out = null) {
  const G = birdGeom3(F, cam.project, cam.pos, st);
  const Pp = birdPaths3(G);
  const pad = Math.ceil(blur * 2 + 6);
  const bb = clampBox({ x0: Pp.bb.x0 - pad, y0: Pp.bb.y0 - pad, x1: Pp.bb.x1 + pad, y1: Pp.bb.y1 + pad });
  if (!bb.w || !bb.h) return G;
  // (the layers cleared well past the box: the lens blur reads past it, and a bird cut by the
  // frame's edge picked up what an earlier bird had left there, 2 px different on a second render
  // of f0)
  const mg = Math.ceil(blur * 1.5) + 6;
  reset2d(G3.getContext('2d')).clearRect(0, 0, bb.w + mg, bb.h + mg);
  const a = reset2d(A3.getContext('2d'));
  a.clearRect(0, 0, bb.w + mg, bb.h + mg);
  if (out) out.reg = { x0: bb.x0 - mg, y0: bb.y0 - mg, x1: bb.x0 + bb.w + mg, y1: bb.y0 + bb.h + mg };
  a.setTransform(1, 0, 0, 1, -bb.x0, -bb.y0);
  a.fillStyle = rgbS(look.base);
  fillAll(a, Pp.all);
  a.setTransform(1, 0, 0, 1, 0, 0);
  const sc = G.scale;
  // the flight feathers and the tail let the light through (diffused: the light behind a feather
  // spreads through its vane). The body stops it wherever it is, in front or behind. Where two of
  // the thin parts overlap, the one behind is hidden by the one in front, and the one in front gets
  // only what came through the one behind. (Order by distance from the lens: seen from below both
  // wings are behind the body, but one is still nearer than the other; cut by the body alone, the
  // two glows added up where the wings crossed, a bright line along the near wing's edge.)
  lightIn(bb, clamp(sc * 0.012, 1, 14), look.tint, look.floor, look.lobe || 0);
  const wingP = (w) => Pp.wing[G.wings.indexOf(w)];
  // (how much of a wing's face we see: its area against a full-on wing of the same span. Seen
  // edge-on the lens looks along the vanes, through many of them: it is opaque, a dark bar; lit
  // through, it was a white needle)
  // (measured from the wing's own normal: the area-to-span ratio used before called a wing seen
  // tip-on "face-on", and it glowed as a pale triangle at the bird's chest, read as a beak)
  const faceOf = (w) => w.face;
  const covP = (w) => posPath(w.cov.concat([w.root]));
  const parts = G.wings.map((w) => ({ w, path: wingP(w), z: w.z, cov: covP(w), trans: look.trans }))
    .concat([{ w: null, path: Pp.tail, z: G.tailZ, cov: null, trans: look.tail }]).sort((a, b) => b.z - a.z);
  const nearer = (pt) => parts.filter((q) => q !== pt && q.z < pt.z).map((q) => q.path);
  const tubeOf = (pt) => (pt.w && pt.path[1] ? [pt.path[1]] : []);
  const farther = (pt) => parts.filter((q) => q !== pt && q.z > pt.z);
  for (const pt of parts) {
    // (the leading edge is bone and muscle under its coverts: it lets no light through. Lit, the
    // round end of it standing off the body burned as a fleck at the nape, f021 f040 f060)
    const cuts = [Pp.body].concat(tubeOf(pt), nearer(pt));
    maskIn(bb, (g) => fillAll(g, pt.path), cuts.concat(pt.cov ? [pt.cov] : []));
    const fk = pt.w ? clamp((faceOf(pt.w) - 0.08) / 0.4, 0.08, 1) : 1;
    addLight(bb, pt.trans * fk);
    if (pt.cov) { maskIn(bb, (g) => g.fill(pt.cov), cuts); addLight(bb, look.cov * fk); }
    // through two thin layers the light is dimmer
    for (const q of farther(pt)) {
      const qm = unionIn(bb, q.path);
      maskIn(bb, (g) => { fillAll(g, pt.path); g.globalCompositeOperation = 'destination-in'; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(qm, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h); g.setTransform(1, 0, 0, 1, -bb.x0, -bb.y0); g.globalCompositeOperation = 'source-over'; }, [Pp.body]);
      cutLight(bb, 0.55);
    }
    // each flight feather: where it lies over its neighbour the vane is two deep and darker (a
    // band beside each shaft, part of the way to the next), and the shaft itself is opaque,
    // thick at the base and fine at the tip. (Every band the same width, hard-edged and dark read
    // as a louvred blind: each feather overlaps its neighbour by its own amount, the vane's light
    // fades into the overlap rather than stepping, and the step is a shade, not a stripe.)
    if (pt.w) {
      const w = pt.w, fcuts = cuts.concat([pt.cov]);
      // (how much of the wing's face we see: its area against a full-on wing of the same span; the
      // stripes and shafts of a wing turned edge-on crowd into a dotted checker, so they fade out)
      const dk = clamp((faceOf(w) - 0.15) / 0.35, 0, 1);
      maskIn(bb, (g) => {
        g.save(); g.clip(pt.path[0]);
        const bands = new Path2D();
        for (let k = 0; k + 1 < w.shafts.length; k++) {
          if (w.shaftHand[k] !== w.shaftHand[k + 1]) continue;       // (the hand's last primary lies over the first secondary)
          const [a0, a1] = w.shafts[k], [b0, b1] = w.shafts[k + 1];
          const f = 0.2 + 0.24 * (0.5 + 0.5 * Math.sin(k * 2.39 + 0.7));
          polyInto([a0, a1, vlerp(a1, b1, f), vlerp(a0, b0, f * 0.7)], bands);
        }
        g.filter = `blur(${clamp(sc * 0.0012, 0.5, 1.6).toFixed(2)}px)`;
        g.fill(bands);
        g.restore();
      }, fcuts);
      cutLight(bb, 0.12 * dk);
      maskIn(bb, (g) => {
        g.save(); g.clip(pt.path[0]);
        const w0 = clamp(sc * 0.0022, 0.6, 2.4), w1 = clamp(sc * 0.0006, 0.25, 0.8);
        for (const [p, q] of w.shafts) {
          const d = norm(sub(q, p)), n = perp(d);
          g.fill(polyPath([add(p, mul(n, w0 / 2)), add(q, mul(n, w1 / 2)), sub(q, mul(n, w1 / 2)), sub(p, mul(n, w0 / 2))]));
        }
        g.restore();
      }, fcuts);
      // (a shaft is a shade across the lit vane, not an ink line: at 0.8, twenty of them read as
      // the slats of a blind, and they stop short of the tip, where the shaft is a hair)
      cutLight(bb, 0.45 * dk);
    } else {
      maskIn(bb, (g) => {
        g.save(); g.clip(Pp.tail[0]);
        g.lineCap = 'round'; g.lineWidth = clamp(sc * 0.0014, 0.5, 2);
        const ts = new Path2D();
        for (const f of G.tailF) { if (!f.shaft) continue; ts.moveTo(f.shaft[0].x, f.shaft[0].y); ts.lineTo(f.shaft[1].x, f.shaft[1].y); }
        g.stroke(ts); g.restore();
      }, cuts);
      cutLight(bb, 0.4);
    }
  }
  // the fringe: a thin band inside the outline (its outside edge only: the whole shape less the
  // shape shrunk, as the shape less its copies moved every way by the band's width) burns with the
  // light just behind it. It is the sun's light, so it takes the sun's colour and is never brighter
  // than the disk: over the disk the edge all but vanishes into it (a white line there, brighter
  // than the sun, read as a sticker's outline). It is on the body's edge and the wings' leading
  // edges, not on the lit-through feathers (they have their own glow), and only where the shape has
  // some body: a part thinner than two bands (a wing edge-on, a tail feather's tip) got the band
  // on both sides and turned into a white needle.
  const band = clamp(sc * (look.band || 0.0022), 0.7, 3.5);
  const S = SIL;
  reset2d(SIL.getContext('2d')).clearRect(0, 0, bb.w, bb.h);
  SIL.getContext('2d').drawImage(unionIn(bb, Pp.all), 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  const holes = fillHoles3(bb, look.base);
  const e = reset2d(E3.getContext('2d'));
  e.clearRect(0, 0, bb.w, bb.h);
  e.drawImage(S, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  e.globalCompositeOperation = 'destination-in';
  for (let k = 0; k < 10; k++) {
    const an = (k / 10) * TAU;
    e.drawImage(S, 0, 0, bb.w, bb.h, Math.cos(an) * band, Math.sin(an) * band, bb.w, bb.h);
  }
  // the shrunk shape grown back out by two bands: where the shape has an inside
  const d3 = reset2d(D3.getContext('2d'));
  d3.clearRect(0, 0, bb.w, bb.h);
  for (let k = 0; k < 12; k++) {
    const an = (k / 12) * TAU;
    d3.drawImage(E3, 0, 0, bb.w, bb.h, Math.cos(an) * band * 2, Math.sin(an) * band * 2, bb.w, bb.h);
  }
  d3.drawImage(E3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  const thin = parts.map((pt) => pt.path);          // the lit-through parts (their coverts are put back below)
  const rimMask = (shift) => {
    const m = reset2d(M3.getContext('2d'));
    m.clearRect(0, 0, bb.w, bb.h);
    m.drawImage(S, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    m.globalCompositeOperation = 'destination-out';
    if (shift) m.drawImage(S, 0, 0, bb.w, bb.h, shift.x, shift.y, bb.w, bb.h);
    else m.drawImage(ERODED, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    m.globalCompositeOperation = 'destination-in';
    m.drawImage(D3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    // (not on the translucent feathers; their coverts and the body keep it)
    const keep = unionIn(bb, [].concat(Pp.body, parts.filter((pt) => pt.cov).map((pt) => pt.cov), ...parts.map(tubeOf)));
    m.globalCompositeOperation = 'destination-out';
    m.setTransform(1, 0, 0, 1, -bb.x0, -bb.y0);
    for (const p of thin) fillAll(m, p);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'source-over';
    // put back the band where the coverts or the body are at the edge
    const k2 = reset2d(K3.getContext('2d'));
    k2.clearRect(0, 0, bb.w, bb.h);
    k2.drawImage(S, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    k2.globalCompositeOperation = 'destination-out';
    if (shift) k2.drawImage(S, 0, 0, bb.w, bb.h, shift.x, shift.y, bb.w, bb.h);
    else k2.drawImage(ERODED, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    k2.globalCompositeOperation = 'destination-in';
    k2.drawImage(keep, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    k2.drawImage(D3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    m.drawImage(K3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    // (soft on its inner side: the fringe is down lit from behind, fading into the body; a band with
    // a hard inner edge read as a sticker's cut line. Kept inside the outline.)
    const sb = clamp(band * 0.45, 0.4, 1.4), tb = reset2d(E3.getContext('2d'));
    tb.clearRect(0, 0, bb.w, bb.h);
    tb.filter = `blur(${sb.toFixed(2)}px)`;
    tb.drawImage(M3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    tb.filter = 'none';
    tb.globalCompositeOperation = 'destination-in';
    tb.drawImage(S, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    m.clearRect(0, 0, bb.w, bb.h);
    m.drawImage(E3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
    return m;
  };
  // (keep a copy of the shrunk shape: E3 is reused)
  reset2d(ERODED.getContext('2d')).clearRect(0, 0, bb.w, bb.h);
  ERODED.getContext('2d').drawImage(E3, 0, 0, bb.w, bb.h, 0, 0, bb.w, bb.h);
  // (in the colour of what is behind it, so over the disk the fringe goes to the disk's own colour at
  // that point and no further: in one fixed colour it was a yellow line brighter than the disk's
  // middle and darker than its rim, measured (255,255,204) on (255,246,219), a sticker's edge)
  const toDisk = look.base.map((v, k) => Math.max(0, [255, 222, 156][k] - v));
  lightBehind(bb, clamp(sc * 0.003, 0.7, 4), look.base);
  rimMask(null);
  addLight(bb, look.rim);
  // ... and away from the disk, on the side that faces the sun (the shape less itself moved toward
  // the sun), in the sun's colour, dimmer
  // (lit by what lights the feathers near the sun as well: the fringe is feathers too, and without it
  // the off-disk fringe was a dull grey line; and not over the disk, where the fringe above is all)
  if (sunScreen) {
    lightIn(bb, clamp(sc * 0.003, 0.7, 4), toDisk.map((v) => v * 0.6), look.floor * 2.2, (look.lobe || 0) * 0.8);
    const c = sub(sunScreen, V(bb.x0 + bb.w / 2, bb.y0 + bb.h / 2)), cl = len(c) || 1, d = mul(c, 1 / cl);
    const mk2 = rimMask(V(-d.x * band * 1.6, -d.y * band * 1.6));
    const sx = S3L.sun.x - bb.x0, sy = S3L.sun.y - bb.y0, R = S3L.R, gr = mk2.createRadialGradient(sx, sy, R * 0.95, sx, sy, R * 1.02);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    mk2.globalCompositeOperation = 'destination-out';
    mk2.fillStyle = gr;
    mk2.fillRect(0, 0, bb.w, bb.h);
    mk2.globalCompositeOperation = 'source-over';
    addLight(bb, look.rim);
  }
  // onto the frame (or onto out.g, one exposure of a bird the shutter sees move, see renderShot3:
  // its light then onto a layer of its own, out.gl. Added onto a clear layer, light adds opacity as
  // well as colour, and where the body's edge was part-clear it went darker than the body: a dark
  // contour on every flock bird, measured (36,30,48) at full opacity round a body of (56,46,74))
  const tg = out ? out.g : ctx;
  tg.save();
  if (blur > 0.4) tg.filter = `blur(${(blur / 2).toFixed(2)}px)`;
  tg.drawImage(A3, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  tg.restore();
  const tl = out ? out.gl : ctx;
  tl.save();
  if (blur > 0.4) tl.filter = `blur(${(blur / 2).toFixed(2)}px)`;
  tl.globalCompositeOperation = 'lighter';
  tl.drawImage(G3, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  tl.restore();
  // and its shadow in the light map (or its outline in out.sh, to be averaged)
  const lm = out ? out.sh : LM.getContext('2d');
  lm.save();
  if (blur > 0.4) lm.filter = `blur(${(blur / 2).toFixed(2)}px)`;
  if (out) { lm.globalAlpha = out.w; lm.globalCompositeOperation = 'lighter'; }
  lm.fillStyle = out ? '#fff' : '#000';
  fillAll(lm, Pp.all);
  if (holes) lm.drawImage(out ? HOLE : HOLEK, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  lm.restore();
  return G;
}
// Sky a bird's parts close in on all sides (an edge-on wing across the spread tail, two parts of an
// edge-on wing a pixel apart) reads as a hole punched through it, rimmed with light. A bird's body
// feathers close such gaps: they are filled with its body colour, in its outline (SIL), its body
// (A3) and its shadow (HOLE, HOLEK: white and black). Measured before: holes on 5 birds' frames, up
// to 194 px. Returns whether there were any.
const HOLE = mk(W, H), HOLEK = mk(W, H);
function fillHoles3(bb, base) {
  const w = bb.w, h = bb.h, d = SIL.getContext('2d').getImageData(0, 0, w, h).data;
  const seen = new Uint8Array(w * h), stk = [];
  for (let x = 0; x < w; x++) stk.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stk.push(y * w, y * w + w - 1);
  while (stk.length) {
    const p = stk.pop();
    if (seen[p] || d[p * 4 + 3] >= 128) continue;
    seen[p] = 1;
    const x = p % w;
    if (x > 0) stk.push(p - 1);
    if (x < w - 1) stk.push(p + 1);
    if (p >= w) stk.push(p - w);
    if (p < (h - 1) * w) stk.push(p + w);
  }
  // the holes, and the part-covered pixels round them
  let any = false;
  const hole = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) if (!seen[p] && d[p * 4 + 3] < 128) { hole[p] = 1; any = true; }
  if (!any) return false;
  const img = new ImageData(w, h), q = img.data;
  for (let p = 0; p < w * h; p++) {
    const x = p % w, y = (p / w) | 0;
    let on = hole[p];
    if (!on && d[p * 4 + 3] < 255) on = (x > 0 && hole[p - 1]) || (x < w - 1 && hole[p + 1]) || (y > 0 && hole[p - w]) || (y < h - 1 && hole[p + w]);
    if (on) { q[p * 4] = q[p * 4 + 1] = q[p * 4 + 2] = 255; q[p * 4 + 3] = 255; }
  }
  const hw = reset2d(HOLE.getContext('2d'));
  hw.clearRect(0, 0, w, h);
  hw.putImageData(img, 0, 0);
  const hk = reset2d(HOLEK.getContext('2d'));
  hk.clearRect(0, 0, w, h);
  hk.drawImage(HOLE, 0, 0, w, h, 0, 0, w, h);
  hk.globalCompositeOperation = 'source-in';
  hk.fillStyle = '#000';
  hk.fillRect(0, 0, w, h);
  SIL.getContext('2d').drawImage(HOLE, 0, 0, w, h, 0, 0, w, h);
  // (A3 in the body colour: the same trick, through a copy)
  hk.globalCompositeOperation = 'source-over';
  const a = reset2d(K3.getContext('2d'));
  a.clearRect(0, 0, w, h);
  a.drawImage(HOLE, 0, 0, w, h, 0, 0, w, h);
  a.globalCompositeOperation = 'source-in';
  a.fillStyle = rgbS(base);
  a.fillRect(0, 0, w, h);
  a.globalCompositeOperation = 'source-over';
  A3.getContext('2d').drawImage(K3, 0, 0, w, h, 0, 0, w, h);
  return true;
}

// ------------------------------------------------------------------ the glare
// The lens scatters a little of the disk's light over everything round it: the edges of whatever
// stands in front of the sun (a wing, a roof) are eaten into by the glow. The light map now holds
// the disk as it is seen, every bird and roof in front of it cut out; blurred, it is that glow.
const HAL = mk(W, H);
function drawHalation3() {
  const g = reset2d(HAL.getContext('2d'));
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.7;
  g.filter = 'blur(5px)';
  g.drawImage(LM, 0, 0);
  g.filter = 'blur(30px)';
  g.globalAlpha = 0.22;
  g.globalCompositeOperation = 'lighter';
  g.drawImage(LM, 0, 0);
  g.filter = 'none';
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgb(255,204,140)';
  g.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.6;
  ctx.drawImage(HAL, 0, 0);
  ctx.restore();
}

// ------------------------------------------------------------------ each bird, this close
// a flapping bird's body rises and falls with its wings: lowest at mid-downstroke (the lift
// peaks there, and the body's rise lags the force that drives it), 11 mm either way
const bob3 = (s) => { const k = 0.011 * (s.a ?? 1) * -Math.cos(TAU * ((s.phase ?? 0) - 0.29)); return { ...s, F: frameAt(a3(s.F.o, m3(n3(s.F.y), k)), s.F.x, s.F.y, s.F.z) }; };
// the primaries' bend through the beat (2 cm at the tip at mid-downstroke, as slow-motion film
// of pigeons shows them curling)
const bendOf = (s) => { const p = (((s.phase ?? 0) % 1) + 1) % 1, D = 0.58; return (s.a ?? 1) * (p < D ? 0.02 * Math.sin((Math.PI * p) / D) : -0.008 * Math.sin((Math.PI * (p - D)) / (1 - D))); };
// No two beats alike and none a machine's: the beat's timing and size wander a little, and the
// upstroke folds the wing well in (a pigeon's span in the upstroke is half to two-thirds of it in
// the downstroke; the shared model's, drawn for small birds, only lost a fifth, and at 5x slow
// motion 4.8 identical beats read as clockwork, measured: f036, f056, f076 the same outline)
const beat3 = (s, amp, seed) => {
  const ph = (s.phase ?? 0) + 0.035 * Math.sin((TAU * (s.phase ?? 0)) / 2.7 + seed);
  const p = flapPose(ph, amp * (1 + 0.07 * Math.sin((TAU * (s.phase ?? 0)) / 3.3 + seed * 1.7)));
  return { ...s, phase: ph, pose: mixPose(GLIDE, { ...p, fold: Math.min(0.85, p.fold * 1.65), sweep: p.sweep * 1.3 }, s.a ?? 1) };
};
// and each bird of the flock holds itself its own way, rocked a little and turned a little off the
// line (every bird on one heading and attitude, in step, read as one bird copied; at ±11° of bank
// and ±4° of heading the birds on screen still showed one silhouette, so ±17° and ±9°)
const own3 = (b, s, tt) => {
  const F = s.F, z = n3(F.z);
  const roll = 0.3 * Math.sin(b.bob * 3.1 + 1.3) + 0.06 * Math.sin(tt * 2.3 + b.rph);
  const yaw = 0.16 * Math.sin(b.bob * 5.3 + 0.4);
  let G2 = turnFrame(F, z, roll);
  G2 = turnFrame(G2, n3(G2.y), yaw);
  return { ...s, F: G2 };
};
// The birds near the thrown pigeon, as this lens sees them: each beats its own time. (The flock's
// beats run together on the climb, and from f046 every bird on screen beat in step and the thrown
// pigeon in exact counter-step, four copies of one V opening and closing together, measured by a
// fresh eye; before, the white under him beat 0.03 of a beat off his for half the shot.) So each
// bird on screen is set off by a fraction of a beat, chosen so that no two birds in the frame
// together, him included, beat within a tenth of a beat of each other for long, and none in counter-
// step with him (the fractions searched in fortieths, scored over every frame they share).
// And the white that flies under him all shot (19), 230 to 250 px straight below, read as his
// blurred double as soon as it was white (its body 4 dE from his, its V over the sun under his V,
// measured by a fresh eye): it is a grey here, and the white is the one that comes and goes at the
// left (15), never under him. (No one can tell one bird of shot 2's flock from another across the
// cut.) His own beat is set a third of a beat on, so the shot ends on his wings up and open over the
// disk, not on the blurred upstroke. PH3.H: his; the others as above, chosen with his fixed.
const KIND3 = { 19: 'grey', 15: 'white' };
const PH3 = { H: 0.3, 3: 0.6, 15: 0.325, 19: 0.5, 21: 0.075, 23: 0.075 };
const kind3 = (who) => KIND3[who] || FLOCK[who].kind;
// how a flock bird holds its tail: each its own spread and cup (one fan on every bird, with one
// body and one wing, read as one bird printed many times; their sizes already differ by a fifth)
// (and closed, as a pigeon's is in straight flight: spread, its outer feathers' tips came together
// into a point seen from below at a slant, a swallow's spike)
const flockParams3 = (who, s) => { const b = FLOCK[who]; return { pose: s.pose, tail: 0.15 + 0.08 * Math.sin(b.bob * 4.1 + 0.6), tailCup: 0.15 + 0.08 * Math.sin(b.bob * 2.3 + 1.9), bend: bendOf(s) }; };
// a bird (a flock bird's index, or 'H') as it is at time tt
const stateAt3 = (who, tt) => {
  if (who === 'H') { const h = heroState(tt, true); h.phase += PH3.H || 0; return bob3(beat3(h, 0.82, 0.7)); }
  const b = FLOCK[who], s = flockBird(b, tt, true);
  if (PH3[who]) s.phase += PH3[who];
  return bob3(beat3(own3(b, s, tt), b.amp, b.rph));
};

// ------------------------------------------------------------------ the shutter
// the layers a bird's exposures are averaged in (read back pixel by pixel, so kept off the GPU)
const MB = (() => {
  const mkR = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d', { willReadFrequently: true }); return c; };
  return { acc: mkR(), accl: mkR(), cov: mkR(), blr: mkR(), sh: mkR(), smp: mkR(), smpl: mkR(), s1: new Float32Array(W * H), s2: new Float32Array(W * H), s3v: new Float32Array(W * H), m: new Float32Array(W * H), tmp: new Float32Array(W * H), f: new Float32Array(W * H * 4), fl: new Float32Array(W * H * 4) };
})();
// Average a bird's exposures (regs: each one's body pixels, light pixels and cover, in its own box)
// into MB.acc (its body), MB.accl (its light, to be added) and its mean cover into MB.sh, over the
// region U; then blur the averages by sigma px where the exposures disagree. The disagreement is the
// cover's variance across the exposures, where it spreads wider than a slow edge (a body edge moving
// a pixel across the shutter disagrees along a band a pixel or two wide: blurred, it took the dark
// body out over its own bright fringe), then spread over a step (the gap between two copies of a
// thin part agrees, empty in all of them, and must be smoothed with them).
function averageExposures(U, regs, n, sigma) {
  const uw = U.x1 - U.x0, uh = U.y1 - U.y0, { s1, s2, m, tmp, f, fl } = MB;
  for (let y = U.y0; y < U.y1; y++) {
    const o = y * W;
    s1.fill(0, o + U.x0, o + U.x1); s2.fill(0, o + U.x0, o + U.x1);
    f.fill(0, (o + U.x0) * 4, (o + U.x1) * 4); fl.fill(0, (o + U.x0) * 4, (o + U.x1) * 4);
  }
  for (const { r, px, lx, a } of regs) {
    for (let y = 0; y < r.h; y++) {
      const o = (r.y0 + y) * W + r.x0, q = y * r.w;
      for (let x = 0; x < r.w; x++) {
        const j = (q + x) * 4, c = a[j + 3] / 255, al = px[j + 3] / 255, ll = lx[j + 3] / 255, g = (o + x) * 4;
        s1[o + x] += c; s2[o + x] += c * c;
        if (al > 0) { f[g] += px[j] * al; f[g + 1] += px[j + 1] * al; f[g + 2] += px[j + 2] * al; f[g + 3] += al; }
        if (ll > 0) { fl[g] += lx[j] * ll; fl[g + 1] += lx[j + 1] * ll; fl[g + 2] += lx[j + 2] * ll; }
      }
    }
  }
  // (premultiplied, in 0..255: the averages, then back to straight colour for the canvas; the light
  // carried as colour with an opacity of its brightest channel, so added with 'lighter' onto the
  // opaque frame it adds exactly its colour)
  const img = new ImageData(uw, uh), d = img.data, imgL = new ImageData(uw, uh), dl = imgL.data, sh = new ImageData(uw, uh), sd = sh.data;
  const put = (q, c0, c1, c2, al) => { if (al < 1 / 510) { d[q + 3] = 0; return; } d[q] = c0 / al; d[q + 1] = c1 / al; d[q + 2] = c2 / al; d[q + 3] = al * 255; };
  const putL = (q, c0, c1, c2) => { const mx = Math.max(c0, c1, c2); if (mx < 0.5) { dl[q + 3] = 0; return; } dl[q] = (c0 / mx) * 255; dl[q + 1] = (c1 / mx) * 255; dl[q + 2] = (c2 / mx) * 255; dl[q + 3] = mx; };
  for (let y = 0; y < uh; y++) for (let x = 0; x < uw; x++) {
    const o = (U.y0 + y) * W + U.x0 + x, g = o * 4, q = (y * uw + x) * 4;
    f[g] /= n; f[g + 1] /= n; f[g + 2] /= n; f[g + 3] /= n; fl[g] /= n; fl[g + 1] /= n; fl[g + 2] /= n;
    put(q, f[g], f[g + 1], f[g + 2], f[g + 3]);
    putL(q, fl[g], fl[g + 1], fl[g + 2]);
    sd[q] = sd[q + 1] = sd[q + 2] = 255; sd[q + 3] = (s1[o] / n) * 255;
  }
  MB.sh.getContext('2d').putImageData(sh, U.x0, U.y0);
  if (sigma >= 0.35) {
    for (let y = U.y0; y < U.y1; y++) for (let x = U.x0; x < U.x1; x++) { const o = y * W + x, e = s1[o] / n; m[o] = Math.max(0, s2[o] / n - e * e); }
    // (the disagreement where it is wider than a slow edge: opened, the least of it over 5 px
    // across and down, then the most of that)
    const open = (src, dst, r, pick) => {
      for (let y = U.y0; y < U.y1; y++) for (let x = U.x0; x < U.x1; x++) {
        let v = src[y * W + x];
        for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= U.x0 && xx < U.x1) v = pick(v, src[y * W + xx]); }
        tmp[y * W + x] = v;
      }
      for (let y = U.y0; y < U.y1; y++) for (let x = U.x0; x < U.x1; x++) {
        let v = tmp[y * W + x];
        for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= U.y0 && yy < U.y1) v = pick(v, tmp[yy * W + x]); }
        dst[y * W + x] = v;
      }
    };
    const s3v = MB.s3v;
    open(m, s3v, 2, Math.min);
    open(s3v, s3v, 2, Math.max);
    // (a box blur, across then down, a step wide)
    const R = Math.max(1, Math.round(sigma * 1.6));
    for (let y = U.y0; y < U.y1; y++) {
      let s = 0;
      for (let x = U.x0; x < Math.min(U.x1, U.x0 + R); x++) s += s3v[y * W + x];
      for (let x = U.x0; x < U.x1; x++) {
        if (x + R < U.x1) s += s3v[y * W + x + R];
        if (x - R - 1 >= U.x0) s -= s3v[y * W + x - R - 1];
        tmp[y * W + x] = s / (2 * R + 1);
      }
    }
    for (let x = U.x0; x < U.x1; x++) {
      let s = 0;
      for (let y = U.y0; y < Math.min(U.y1, U.y0 + R); y++) s += tmp[y * W + x];
      for (let y = U.y0; y < U.y1; y++) {
        if (y + R < U.y1) s += tmp[(y + R) * W + x];
        if (y - R - 1 >= U.y0) s -= tmp[(y - R - 1) * W + x];
        m[y * W + x] = Math.min(1, (12 * s) / (2 * R + 1));
      }
    }
    // the averages blurred: the body's and the light's
    const blurred = (src, data) => {
      src.getContext('2d').putImageData(data, U.x0, U.y0);
      const b = reset2d(MB.blr.getContext('2d'));
      b.clearRect(U.x0, U.y0, uw, uh);
      b.filter = `blur(${sigma.toFixed(2)}px)`;
      b.drawImage(src, U.x0, U.y0, uw, uh, U.x0, U.y0, uw, uh);
      b.filter = 'none';
      return b.getImageData(U.x0, U.y0, uw, uh).data;
    };
    const bd = blurred(MB.acc, img), bl = blurred(MB.accl, imgL);
    for (let y = 0; y < uh; y++) for (let x = 0; x < uw; x++) {
      const o = (U.y0 + y) * W + U.x0 + x, k = m[o];
      if (k <= 0.002) continue;
      const g = o * 4, q = (y * uw + x) * 4, pb = bd[q + 3] / 255, pl = bl[q + 3] / 255;
      put(q, f[g] + k * (bd[q] * pb - f[g]), f[g + 1] + k * (bd[q + 1] * pb - f[g + 1]), f[g + 2] + k * (bd[q + 2] * pb - f[g + 2]), f[g + 3] + k * (pb - f[g + 3]));
      putL(q, fl[g] + k * (bl[q] * pl - fl[g]), fl[g + 1] + k * (bl[q + 1] * pl - fl[g + 1]), fl[g + 2] + k * (bl[q + 2] * pl - fl[g + 2]));
    }
  }
  MB.acc.getContext('2d').putImageData(img, U.x0, U.y0);
  MB.accl.getContext('2d').putImageData(imgL, U.x0, U.y0);
}

// ------------------------------------------------------------------ the frame
function renderShot3(i, only) {
  PHASE_SMOOTH = true;
  try { renderShot3In(i, only); } finally { PHASE_SMOOTH = false; }
}
function renderShot3In(i, only) {
  const t = s3Time(i);
  const want = (k) => !only || only === k;
  const cam = cam3At(i);
  if (!FAR_REC) { FAR_REC = recorded(() => makeSkyline(5, 540, 14, 44, 26, 70, 0.35)); LANDMARK_REC = recorded(() => makeLandmark()); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (only) ctx.clearRect(0, 0, W, H);
  const Minf = layerMap(cam, 1e7, t, CAM1S), Mfar = layerMap(cam, FAR3_D, t, CAM1S), Mtree = layerMap(cam, FAR3_DT, t, CAM1S);
  const sun = sunIn(cam, t);
  S3L.sun = sun; S3L.R = cam.f * SUN_R;
  lightMapStart(cam, t, sun);
  if (want('sky')) {
    drawSky3(cam, t, sun);
    // shot 1's light shafts, where they leave the sun
    drawSunGlow(t, sunAt(t), Minf, false, 0.75);
    drawSunDisk3(cam, t, sun);
    drawFar3(cam, t, Mfar, Mtree, sun);
    // the lens is focused on the thrown pigeon: the sun and the far roofs are a little soft
    const b = blurAt(1e7) / 2, c = scratch('s3bg', W, H), g = c.getContext('2d');
    g.filter = `blur(${b.toFixed(2)}px)`;
    g.drawImage(canvas, 0, 0);
    ctx.drawImage(c, 0, 0);
  }
  onLightMap(() => drawFar3(cam, t, Mfar, Mtree, sun, true));
  { const g = LM.getContext('2d'), c = scratch('s3lm', W, H), h = c.getContext('2d'); h.filter = `blur(${(blurAt(1e7) / 2).toFixed(2)}px)`; h.drawImage(LM, 0, 0); g.drawImage(c, 0, 0); }
  // the flock and the thrown pigeon, far to near
  const stateAt = stateAt3;
  const list = FLOCK.map((b, k) => k).concat(['H']).map((who) => { const s0 = stateAt(who, t); return { who, s: s0, z: cam.toCam(s0.F.o).z }; });
  list.sort((p, q) => q.z - p.z);
  // The shutter: slow motion 5x is shot at 120 frames a second, open for half of each (1/240 s). In
  // that time a wingtip in the downstroke moves 12..19 px on screen (measured 25..38 px a frame),
  // and film of it shows the tips smeared; drawn sharp they stepped like cut paper. Each bird is
  // drawn at S3.mb moments across the open shutter, each from where the lens is then, and the
  // exposures averaged (the lens flies with the flock, so bodies stay sharp and wings smear).
  const nS = S3.mb, dtF = S3.rate / FPS;
  const ACC = MB.acc, SHC = MB.sh, SMP = MB.smp, COV = MB.cov;
  for (const o of list) {
    if (o.z < 0.5) continue;
    const isH = o.who === 'H';
    if (isH ? !want('hero') : !want('flock')) continue;
    const look = isH ? LOOK3.hero : LOOK3[kind3(o.who)];
    const blur = isH ? 0 : blurAt(o.z);
    const params = (s) => (isH ? { pose: s.pose, tail: 0.5, tailPitch: s.tailPitch, tailCup: 0.15, bend: bendOf(s) } : flockParams3(o.who, s));
    // as many exposures as keep the steps between them under S3.step px anywhere on the outline
    // (the wingtips alone were measured before: in the upstroke the wrist leads and outran them,
    // and a thin forearm edge-on showed as a stack of separate bars)
    // (points that are the same points in both: the wings', the tail's, the body's centre)
    const outline = (sk, ck) => { const Gk = birdGeom3(sk.F, ck.project, ck.pos, params(sk)); return [Gk.o].concat(...Gk.wings.slice().sort((a, b) => a.sg - b.sg).map((w) => w.pts), ...Gk.tailF.map((f) => f.pts)); };
    const e0 = -0.5 * S3.shutter, e1 = 0.5 * S3.shutter;
    const a0 = outline(stateAt(o.who, t + e0 * dtF), cam3At(i + e0)), a1 = outline(stateAt(o.who, t + e1 * dtF), cam3At(i + e1));
    let disp = 0;
    for (let k = 0; k < a0.length; k++) disp = Math.max(disp, len(sub(a0[k], a1[k])));
    const n = nS > 1 ? clamp(Math.ceil(disp / S3.step), 1, nS) : 1;
    if (n <= 1) { drawBird3(o.s.F, cam, params(o.s), look, blur, sun); continue; }
    // (each exposure kept as its pixels, and averaged in floating point: summed on a canvas, 1/14th
    // of a colour at a time in 8 bits, the body came out 6 levels light and see-through, with a
    // line wherever a part's edge crossed it, measured at f053)
    const smp = reset2d(SMP.getContext('2d')), smpl = reset2d(MB.smpl.getContext('2d')), cov = reset2d(COV.getContext('2d'));
    let U = null;
    const regs = [];
    for (let k = 0; k < n; k++) {
      const off = S3.shutter * ((k + 0.5) / n - 0.5);          // in frames
      const camk = cam3At(i + off), sk = stateAt(o.who, t + off * dtF);
      const outk = { g: smp, gl: smpl, sh: cov, w: 1, reg: null };
      drawBird3(sk.F, camk, params(sk), look, blur, sun, outk);
      if (!outk.reg) continue;
      const r = clampBox(outk.reg);
      if (!r.w || !r.h) continue;
      regs.push({ r, px: smp.getImageData(r.x0, r.y0, r.w, r.h).data, lx: smpl.getImageData(r.x0, r.y0, r.w, r.h).data, a: cov.getImageData(r.x0, r.y0, r.w, r.h).data });
      smp.clearRect(r.x0, r.y0, r.w, r.h);
      smpl.clearRect(r.x0, r.y0, r.w, r.h);
      cov.clearRect(r.x0, r.y0, r.w, r.h);
      U = U ? { x0: Math.min(U.x0, r.x0), y0: Math.min(U.y0, r.y0), x1: Math.max(U.x1, r.x0 + r.w), y1: Math.max(U.y1, r.y0 + r.h) } : { x0: r.x0, y0: r.y0, x1: r.x0 + r.w, y1: r.y0 + r.h };
    }
    if (!U) continue;
    const uw = U.x1 - U.x0, uh = U.y1 - U.y0;
    // Averaged, n sharp exposures a step apart are a stack of copies wherever a part is thinner than
    // the step: a real shutter smears it evenly. So where the exposures disagree (the moving parts:
    // each pixel's coverage varies across them) the average is blurred by about a step; where they
    // agree (the body, a still edge) it is left as sharp as it was.
    averageExposures(U, regs, n, (0.55 * disp) / n);
    ctx.drawImage(ACC, U.x0, U.y0, uw, uh, U.x0, U.y0, uw, uh);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(MB.accl, U.x0, U.y0, uw, uh, U.x0, U.y0, uw, uh);
    ctx.restore();
    // its shadow in the light map: the light less the bird's average cover
    const lm = LM.getContext('2d');
    lm.save();
    lm.globalCompositeOperation = 'destination-out';
    lm.drawImage(SHC, U.x0, U.y0, uw, uh, U.x0, U.y0, uw, uh);
    lm.restore();
    reset2d(ACC.getContext('2d')).clearRect(U.x0, U.y0, uw, uh);
    reset2d(MB.accl.getContext('2d')).clearRect(U.x0, U.y0, uw, uh);
    reset2d(SHC.getContext('2d')).clearRect(U.x0, U.y0, uw, uh);
  }
  if (!only) {
    drawHalation3();
    finish(t, sun, sun, [H * 0.4, H * 1.3]);
  }
}

defineShot('s3', { dur: S3.dur, t0: S3.t0, render: renderShot3 });
