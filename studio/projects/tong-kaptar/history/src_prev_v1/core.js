// Tong · kaptar — core: maths, canvas helpers, the exposure sheet, cameras, wind.
// Loaded first; later files share these top-level names (classic scripts, one global scope).
'use strict';
const W = 1280, H = 720, FPS = 24, DUR = 4;
const N_FRAMES = FPS * DUR;

// ------------------------------------------------------------------ scalar helpers
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (t) => t * t * (3 - 2 * t);
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2;
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// smooth 1-D value noise in [-1, 1], deterministic per seed
function noise1(x, seed = 0) {
  const h = (n) => { let v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
  const i = Math.floor(x), f = x - i;
  return lerp(h(i), h(i + 1), smooth(f));
}

// ------------------------------------------------------------------ 2-D vectors
const V = (x, y) => ({ x, y });
const add = (a, b) => V(a.x + b.x, a.y + b.y);
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const mul = (a, s) => V(a.x * s, a.y * s);
const len = (a) => Math.hypot(a.x, a.y);
const norm = (a) => { const l = len(a) || 1; return V(a.x / l, a.y / l); };
const perp = (a) => V(-a.y, a.x);
const vlerp = (a, b, t) => V(lerp(a.x, b.x, t), lerp(a.y, b.y, t));

// ------------------------------------------------------------------ 3-D vectors + matrices
const V3 = (x, y, z) => ({ x, y, z });
const a3 = (a, b) => V3(a.x + b.x, a.y + b.y, a.z + b.z);
const s3 = (a, b) => V3(a.x - b.x, a.y - b.y, a.z - b.z);
const m3 = (a, k) => V3(a.x * k, a.y * k, a.z * k);
const dot3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross3 = (a, b) => V3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len3 = (a) => Math.hypot(a.x, a.y, a.z);
const n3 = (a) => { const l = len3(a) || 1; return V3(a.x / l, a.y / l, a.z / l); };
const l3 = (a, b, t) => V3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
// A frame is {o, x, y, z}: origin plus three orthonormal axes. Local point -> parent space.
const frameAt = (o, x, y, z) => ({ o, x, y, z });
const toP = (F, p) => V3(
  F.o.x + F.x.x * p.x + F.y.x * p.y + F.z.x * p.z,
  F.o.y + F.x.y * p.x + F.y.y * p.y + F.z.y * p.z,
  F.o.z + F.x.z * p.x + F.y.z * p.y + F.z.z * p.z);
const dirP = (F, d) => V3(F.x.x * d.x + F.y.x * d.y + F.z.x * d.z, F.x.y * d.x + F.y.y * d.y + F.z.y * d.z, F.x.z * d.x + F.y.z * d.y + F.z.z * d.z);
// rotate a vector about a unit axis (Rodrigues)
function rotAxis(v, k, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return a3(a3(m3(v, c), m3(cross3(k, v), s)), m3(k, dot3(k, v) * (1 - c)));
}
// rotate a whole frame's axes (not origin) about a unit axis given in parent space
const turnFrame = (F, k, a) => frameAt(F.o, rotAxis(F.x, k, a), rotAxis(F.y, k, a), rotAxis(F.z, k, a));
// yaw (about y), pitch (about local x, + = nose up), roll (about local z) applied to a frame
function yprFrame(F, yaw, pitch, roll) {
  let G = turnFrame(F, F.y, yaw);
  G = turnFrame(G, G.x, -pitch);
  return turnFrame(G, G.z, roll);
}

// ------------------------------------------------------------------ paths
// Catmull-Rom through the points; indices in `sharp` are corners (the curve arrives and leaves
// with zero tangent there: a feather tip, not a scallop).
function curvePath(pts, closed = true, path = new Path2D(), sharp = null) {
  const n = pts.length;
  const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const isSharp = (i) => !!sharp && sharp.has(((i % n) + n) % n);
  path.moveTo(pts[0].x, pts[0].y);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const k1 = isSharp(i) ? 0 : 1 / 6, k2 = isSharp(i + 1) ? 0 : 1 / 6;
    path.bezierCurveTo(p1.x + (p2.x - p0.x) * k1, p1.y + (p2.y - p0.y) * k1, p2.x - (p3.x - p1.x) * k2, p2.y - (p3.y - p1.y) * k2, p2.x, p2.y);
  }
  if (closed) path.closePath();
  return path;
}
function polyInto(pts, path = new Path2D()) {
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
  path.closePath();
  return path;
}
const polyPath = (pts) => polyInto(pts);
const area2 = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; } return s / 2; };
function bboxOf(pts, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
  return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
}
// Sub-shapes: {pts, smooth, sharp} (smooth => Catmull-Rom). Every sub-shape gets the same winding,
// so the nonzero fill of the returned Path2D is their union (no cancelling holes).
function unionPath(shapes) {
  const p = new Path2D();
  for (const s of shapes) {
    const flip = area2(s.pts) < 0;
    const pts = flip ? s.pts.slice().reverse() : s.pts;
    const n = pts.length;
    const sharp = s.sharp ? new Set([...s.sharp].map((i) => (flip ? n - 1 - i : i))) : null;
    if (s.smooth === false) polyInto(pts, p); else curvePath(pts, true, p, sharp);
  }
  return p;
}
const allPts = (shapes) => shapes.reduce((acc, s) => acc.concat(s.pts), []);
// resample a closed polygon to n points evenly spaced along its length, then relax it `iter`
// times (each point to the mean of its neighbours): hull corners become round
function smoothLoop(pts, n, iter) {
  const L = [0];
  for (let i = 1; i <= pts.length; i++) L.push(L[i - 1] + len(sub(pts[i % pts.length], pts[i - 1])));
  const total = L[pts.length], out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const d = (k / n) * total;
    while (L[j + 1] < d) j++;
    const u = (d - L[j]) / Math.max(1e-9, L[j + 1] - L[j]);
    out.push(vlerp(pts[j], pts[(j + 1) % pts.length], u));
  }
  let cur = out;
  for (let it = 0; it < iter; it++) cur = cur.map((p, i) => { const a = cur[(i + n - 1) % n], b = cur[(i + 1) % n]; return V((a.x + 2 * p.x + b.x) / 4, (a.y + 2 * p.y + b.y) / 4); });
  return cur;
}
// convex hull of 2-D points (monotone chain), counter-clockwise
function hull(points) {
  const P = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (P.length < 3) return P;
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// ellipse polygon from centre + 2x2 shape (two semi-axis vectors)
function ellipsePts(c, ax, ay, n = 20) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; out.push(V(c.x + ax.x * Math.cos(a) + ay.x * Math.sin(a), c.y + ax.y * Math.cos(a) + ay.y * Math.sin(a))); }
  return out;
}

// ------------------------------------------------------------------ canvas
const canvas = document.getElementById('c');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const offA = mk(), offR = mk(), offG = mk(), offS = mk(W / 2, H / 2);
// a named scratch canvas, cleared and reset. Allocated once at frame size (never re-made mid-run:
// a fresh canvas can take a different raster path, and every frame must come out the same)
const SCRATCH = {};
function scratch(name, w, h) {
  let c = SCRATCH[name];
  if (!c || c.width < w || c.height < h) { c = mk(Math.max(W, Math.ceil(w)), Math.max(H, Math.ceil(h))); SCRATCH[name] = c; }
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.filter = 'none';
  g.clearRect(0, 0, c.width, c.height);
  return c;
}

// Light: the low sun sits ahead of the boy and to the right, so he is backlit; rims face right and a little down.
const LIGHT = norm(V(0.93, 0.37));
const PAL = {
  line: '#211a30',
  skin: '#7d5062', skinShade: '#6a4155', skinRim: '#ffd6a6', skinLine: '#4a2a3c',
  hair: '#1b1727', hairRim: '#ffa274', hairLine: '#463d62',
  shirt: '#8d83b2', shirtFold: '#6f6697', shirtRim: '#fff0da', shirtDeep: '#5f5687',
  trousers: '#2e2944',
  doppi: '#16121e', motif: '#e2dcef', doppiRim: '#ffb884',
  bird: '#ece6f5', birdShade: '#aea5ca', birdDeep: '#8a81ab', birdRim: '#fff1dc', birdLine: '#3b3252',
};
const clampBox = (b) => {
  const x0 = clamp(Math.floor(b.x0), 0, W), y0 = clamp(Math.floor(b.y0), 0, H);
  const x1 = clamp(Math.ceil(b.x1), 0, W), y1 = clamp(Math.ceil(b.y1), 0, H);
  return { x0, y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
};
// Fill a shape, then add a rim-light band on the edge that faces the sun.
// Offscreen work is limited to the shape's box (bb), so small shapes stay cheap.
function fillRim(path, fill, rim, width, dir = LIGHT, bb = null, soft = 0) {
  ctx.fillStyle = fill;
  ctx.fill(path);
  if (!rim || width <= 0) return;
  const B = clampBox(bb || { x0: 0, y0: 0, x1: W, y1: H });
  if (!B.w || !B.h) return;
  const r = offR.getContext('2d');
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(B.x0, B.y0, B.w, B.h);
  r.save();
  r.beginPath(); r.rect(B.x0, B.y0, B.w, B.h); r.clip();
  r.fillStyle = rim;
  r.fill(path);
  r.globalCompositeOperation = 'destination-out';
  r.translate(-dir.x * width, -dir.y * width);
  r.fill(path);
  r.restore();
  if (soft) { ctx.save(); ctx.filter = `blur(${soft}px)`; }
  ctx.drawImage(offR, B.x0, B.y0, B.w, B.h, B.x0, B.y0, B.w, B.h);
  if (soft) ctx.restore();
}
// Only the band on the edge facing `dir` (no base fill): cel shade on the side away from the light.
function rimOnly(path, color, width, dir, bb, cut = null) {
  const B = clampBox(bb || { x0: 0, y0: 0, x1: W, y1: H });
  if (!B.w || !B.h || width <= 0) return;
  const r = offR.getContext('2d');
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(B.x0, B.y0, B.w, B.h);
  r.save();
  r.beginPath(); r.rect(B.x0, B.y0, B.w, B.h); r.clip();
  r.fillStyle = color;
  r.fill(path);
  r.globalCompositeOperation = 'destination-out';
  r.translate(-dir.x * width, -dir.y * width);
  r.fill(path);
  r.setTransform(1, 0, 0, 1, 0, 0);
  if (cut) r.fill(cut);                          // no band where another shape covers this one
  r.restore();
  ctx.drawImage(offR, B.x0, B.y0, B.w, B.h, B.x0, B.y0, B.w, B.h);
}
function ink(path, w = 2.3, color = PAL.line) {
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke(path);
}
// One body made of overlapping parts: outline only on the union's outside, no seams inside.
// (stroke every part at twice the width, then fill all parts on top.)
function drawUnion(shapes, o) {
  const path = unionPath(shapes);
  const bb = bboxOf(allPts(shapes), (o.lineW || 0) + (o.rimW || 0) + 4);
  if (o.lineW) {
    ctx.lineWidth = o.lineW * 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.line || PAL.line;
    ctx.stroke(path);
  }
  fillRim(path, o.fill, o.rim, o.rimW || 0, o.dir || LIGHT, bb);
  return path;
}

// ------------------------------------------------------------------ the exposure sheet
// Every timing decision of the shot lives here. The boy is drawn on twos (a new drawing
// every 2nd frame) except the throw and its follow-through, which are drawn on ones.
const SHEET = {
  onesFrom: 18, onesTo: 39,   // frames drawn on ones: the toss, the follow-through and the arms' fall
  release: 22,                // the pigeon leaves the hands on this frame
  joinT: 3.15,                // from here the pigeon flies as a member of the flock
  flap: 6,                    // wingbeats per second in powered flight: a 4-drawing cycle on ones
};
const RELEASE_T = SHEET.release / FPS;
const charFrame = (i) => (i >= SHEET.onesFrom && i <= SHEET.onesTo ? i : i - (i % 2));

// ------------------------------------------------------------------ cameras
// Sky world: metres, camera at the origin, y up, z ahead; the lens is pitched up so the
// true horizon sits at y = 560 on screen. The camera rises a little over the shot (crane),
// which shifts near things more than far ones.
const CAM = { f: 1000, cx: 640, cy: 360, pitch: Math.atan(0.2) };
const BOY_D = 2.6;                        // the boy's pelvis is 2.6 m from the lens
const craneAt = (t) => 16 * easeInOut(clamp(t / DUR, 0, 1));   // px of rise at the boy's depth
const craneAtZ = (t, z) => craneAt(t) * BOY_D / z;
function projW(p, t) {
  const c = Math.cos(CAM.pitch), s = Math.sin(CAM.pitch);
  const yc = p.y * c - p.z * s, zc = p.z * c + p.y * s;
  return { x: CAM.cx + CAM.f * p.x / zc, y: CAM.cy - CAM.f * yc / zc + craneAtZ(t, zc), z: zc };
}
function unprojW(sx, sy, zc, t) {
  const c = Math.cos(CAM.pitch), s = Math.sin(CAM.pitch);
  const x = (sx - CAM.cx) * zc / CAM.f, yc = -(sy - craneAtZ(t, zc) - CAM.cy) * zc / CAM.f;
  return V3(x, yc * c + zc * s, zc * c - yc * s);
}
// Boy space: metres, origin at the pelvis, x to his right (= screen right), y up (true vertical),
// z the way he faces (away from us). He is seen through the same low, pitched lens as the sky,
// so we look up at his head: the do‘ppi's top is hidden and its band arches, as it should.
const BOY_ROOT = unprojW(915, 682, BOY_D, 0);       // pelvis in sky-world metres
const BOY_CAM = V3(-BOY_ROOT.x, -BOY_ROOT.y, -BOY_ROOT.z);   // the lens, in boy space
const projB = (p, t) => projW(a3(BOY_ROOT, p), t);
const pxPerM = (z) => CAM.f / z;

// ------------------------------------------------------------------ wind
// One wind for the whole world: it blows to screen-left, with gusts. Flag, hair, shirt,
// feathers, dust and clouds all read from here, so they can never disagree.
const windAt = (t) => 1 + 0.3 * Math.sin(t * 1.9 + 0.4) + 0.18 * Math.sin(t * 4.3 + 1.1) + 0.1 * noise1(t * 3, 7);
const WIND_DIR = -1;   // screen-left
