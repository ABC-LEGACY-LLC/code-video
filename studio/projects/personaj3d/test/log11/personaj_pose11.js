/* PERSONAJ -- built from scratch in code (3D style). The design (shape, colours, face drawing) lives
   here; how it is SHADED (style) is separate -- src/style/*.js. Every mesh carries userData.role:
   the style gives that role its material and outline.
   Frame: in head-local space +z -- face, +y -- top, +x -- the character's LEFT hand side
   (right for the viewer). The whole character is turned +90 degrees about y at the root: in the
   world it faces +x (right on screen), its right side is at +z (the camera is on that side). Unit:
   head radius 1. */
import * as THREE from 'three';
import {ParametricGeometry} from 'three/addons/geometries/ParametricGeometry.js';

export const COLOUR = {                 // design colours (the base, in the lit state)
  skin: '#f1e3e1', hair: '#eceeff', hoodOuter: '#2a2c58', hoodInner: '#6a6ca6',
  cloak: '#232550', neck: '#e6d4d6',
};

/* seeded random -- the same on every render */
export function rng(s) { return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- HEAD (v3) ---------- */
/* Head -- a body of revolution (a horizontal section at every height), its front side a DESIGNED profile (our own design).
   Audit 3 (face, pass 4): v2 (a deformed sphere) could not bring the lower face forward: in the sample the nose, mouth and
   chin are 0.1..0.4 units IN FRONT of the eyes (triangulated from two views, test/triangle.mjs); in 3/4 the front contour is
   vertical (x 130) and the jaw underside horizontal (y 108.5); ours had the chin's front edge 18 px and the jaw underside
   14..15 px behind/above (tools/compare probe, shot 1). Only PLACEMENT and MASS are measured; the drawing is ours.
   Section (height y): the front half is a superellipse -- midline depth zF, half-width W, exponent p (p < 2 -- more pointed
   toward the front); the back half is an ellipse -- back boundary zB. Section centre (zF+zB)/2: it moves forward at the jaw.
   Skull (y >= 0.3) -- the v2 sphere (skull, en, nape). Under the chin (y < chinY) the section is closed with an elliptic arc
   (flat jaw underside). Two layers (as in v2): the large shape -- shading normals; the small one -- nose and lips (silhouette). */
/* PASS 9 (one head, fitted to three shots together -- test/fit_head9.mjs): the eye map and the lower-face shift no longer depend
   on the view/frame (w 0, s 0). The lower-face section (eyeP, mouthZ/W/P, jawP, chinZ/W) was fitted jointly to the face targets
   of ALL frames (each frame's pose fitted inside): total RMS 2.25 -> 1.77 px (weighted over 22 frames). Previous values: eyeP 2.646,
   mouthZ 1.005, mouthW 0.603, chinZ 0.915, chinW 0.173, mouthP 1.85, jawP 1.95. */
/* PASS 10 (parts separately -- test/parts/, test/fit_head10.mjs): in the pass 9 fit the chin and jaw were almost absent (in shot 1
   a single row of the chin's front edge; the ear-ward part of the jaw underside nowhere) -- in shot 1 the jaw underside toward the
   ear sat up to 17 px lower than the sample (a flat, long jaw bottom). Now the targets are: eyes, brow, mouth, lip shadow, nose tip,
   chin tip, the jaw-underside trace (every column) and the contour (every row), in every frame. The goal is shot 1 (3/4, 11 frames),
   with a penalty against shots 2 and 3 getting worse: with equal weights the chin in shot 1 went 5-6 px up (in shot 2 the sample
   draws the profile face ~20 % smaller relative to the head; in shot 3 the face length depends on the pose -- separate). Result:
   shot 1 RMS 4.03 -> 2.58 px (jaw trace 5.5 -> 1.6, largest 14.9 -> 5.0; chin -2.2/-0.4 -> -1.6/-0.4); the shot 1 poses too (with
   a (x / 0.04 rad)^2 penalty). The shot 2 and shot 3 poses were left as before (see the film.js comment) -- at those poses the lower
   face goes 4.78 -> 4.89 and 8.49 -> 9.04 px. Previous values: chinY -1.18, chinZ 0.974, chinW 0.196, jawBack 0.692, jawBack2 -0.3,
   jawBack1 -0.40, mouthW 0.508, mouthZ 1.051, mouthP 1.666, jawP 1.682, cover 0.07. */
export const HEAD = {
  skull: 1.06,      // skull height (y > 0)
  en: 0.90,         // skull width
  nape: 1.10,       // nape bulge
  eyeZ: 0.924,       // midline depth at the eye line (y -0.15) (bridge of the nose)
  eyeP: 2.847,        // section exponent at the eye line (how far back the eyes sit: 2 -- ellipse)
  mouthZ: 1.06,       // midline depth at mouth height (large shape)
  mouthW: 0.554,      // half-width at mouth height (jaw)
  chinY: -1.173,    // height of the chin corner (face length)
  chinZ: 1.032,      // depth of the chin corner
  chinW: 0.221,      // half-width at the chin corner
  jawBack: 0.685,    // back boundary (z) of the chin-corner section: the jaw underside RISES backward from here --
                    // in shot 1 (from below, 25 deg) the sample's jaw line is horizontal (y 108.5): a flat jaw underside, seen
                    // from below, pushed the silhouette 5..12 px down (fit_face3 attempt 1)
  jawBack2: 0.325,  // back boundary of the section just above the chin (knot 0.84) (pass 10: -0.3 -> 0.325 -- the jaw rises toward the ear)
  jawBack1: -0.18,  // back boundary of the section at mouth height (knot 0.66) (pass 10: made a parameter -- before, fixed at -0.40)
  mouthP: 1.812,     // section exponent at mouth height
  jawP: 1.302,      // section exponent just above the chin (knot 0.84)
  cover: 0.075,    // height of the closing under the chin
  nose: 0.249,      // how far the nose tip sticks out (small layer)
  noseY: -0.534,   // nose tip height
  noseUnder: 0.134,   // softness under the nose (length of the drop below the tip): in the sample in 3/4 the front contour drops
                    // straight down from the nose tip (no notch) -- a sharp drop left a 5 px notch under the nose
  lip: 0.022,       // how far the lips stick out
  shiftZ: 0.40,    // LOWER-FACE SHIFT (anime "the edge comes before the eye"): below the eyes the lower face moves this much FORWARD,
                    // weighted by shift (0..1). In pass 4 it was tied to the profile weight (full in profile). Pass 5 staging audit:
                    // the sample's shot 2 front contour (21 rows) lands on the rigid profile without the shift -- RMS 1.29 px, head level
                    // (tilt -0.08); with the shift the contour only landed with the head TILTED 15 deg, while we had set -0.10 (upward)
                    // -> the face came out looking ~20 deg up ("ours looks sideways/up, the sample looks down"). In profile the
                    // sample differs not in the lower face but in the EYE (EYE_PROFILE). The shift is only for the fast turn (shot 1, 10-11).
  shift: 0.0,
  profileW: 0.0,     // profile weight (0 -- 3/4, 1 -- profile): the near-eye drawing moves along the surface toward the side (eyeMap)
};

/* Fritsch-Carlson monotone cubic: knots in y (increasing), values */
function monotonic(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
/* sphere section (skull, v2): at height y, [zF, W, zB] */
function sphereSection(y) {
  const B = HEAD, y0 = Math.min(1, y / B.skull), c = Math.sqrt(Math.max(0, 1 - y0 * y0));
  return [c * (0.94 + 0.06 * (1 - y0)), B.en * c, -B.nape * c];
}
/* profile: knots from HEAD -> y -> {zF, W, zB, p}. Lower knots y_k = -0.15 + (chinY + 0.15) * f */
let _profile = null, _profileKey = '';
function profile() {
  const B = HEAD, key = JSON.stringify(B);
  if (_profile && key === _profileKey) return _profile;
  const yk = f => -0.15 + (B.chinY + 0.15) * f, pz = B.shiftZ * B.shift;
  const s45 = sphereSection(0.45), s30 = sphereSection(0.30);
  const T = [   // [y, zF, W, zB, p] -- from top to bottom
    [0.45, ...s45, 2.0],
    [0.30, ...s30, 2.0],
    [0.10, 0.5 * (s30[0] + B.eyeZ) + 0.005, 0.90, -1.095, 0.5 * (2.0 + B.eyeP)],
    [-0.15, B.eyeZ, 0.90, -1.08, B.eyeP],
    [yk(0.25), 0.5 * (B.eyeZ + B.mouthZ) + 0.6 * pz, 0.86, -0.96, B.eyeP],
    [yk(0.66), B.mouthZ + pz, B.mouthW, B.jawBack1, B.mouthP],
    [yk(0.84), 0.5 * (B.mouthZ + B.chinZ) + 0.01 + pz, 0.5 * (B.mouthW + B.chinW) + 0.02, B.jawBack2, B.jawP],
    [B.chinY, B.chinZ + pz, B.chinW, B.jawBack + pz, 2.1],
  ].reverse();
  const ys = T.map(t => t[0]), f = [1, 2, 3, 4].map(j => monotonic(ys, T.map(t => t[j])));
  _profile = y => y >= 0.30 ? {zF: sphereSection(y)[0], W: sphereSection(y)[1], zB: sphereSection(y)[2], p: 2}
                           : {zF: f[0](y), W: f[1](y), zB: f[2](y), p: f[3](y)};
  _profileKey = key;
  return _profile;
}
/* section point: polar angle ph around the centre (from front +z) -> [x, z] */
function sectionPoint(K, ph, k = 1) {
  const cz = 0.5 * (K.zF + K.zB), s = Math.sin(ph), c = Math.cos(ph);
  if (K.W < 1e-6 || K.zF - cz < 1e-6) return [0, cz];              // pole (the section has shrunk to a point)
  let r;
  if (c >= 0) { const a = K.zF - cz; r = Math.pow(Math.pow(Math.abs(s) / K.W, K.p) + Math.pow(c / a, K.p), -1 / K.p); }
  else { const b = cz - K.zB; r = 1 / Math.sqrt(s * s / (K.W * K.W) + c * c / (b * b)); }
  return [r * s * k, cz + r * c * k];
}
/* small layer: nose (a ridge on the midline, rounded tip, sharp underside) and lips -- in z only */
export function smallZ(x, y) {
  const B = HEAD, yb = -0.18, yt = B.noseY;
  const ko = sm(yb, yt, y), rid = Math.pow(ko, 1.4) * sm(yt - B.noseUnder, yt - 0.005, y);
  const en = 0.045 + 0.05 * ko;
  let dz = B.nose * rid * Math.exp(-Math.pow(x / en, 2));
  const oy = FACE.mouthY;
  dz += B.lip * (Math.exp(-Math.pow((y - oy - 0.045) / 0.035, 2)) + 0.8 * Math.exp(-Math.pow((y - oy + 0.065) / 0.04, 2))) * Math.exp(-Math.pow(x / 0.16, 2));
  return dz;
}
/* head surface: direction on the unit sphere (x, y, z) -> surface point (scaled by r if the radius is r) */
export function headShape(x, y, z, small = false) {
  const B = HEAD, rho = Math.hypot(x, y, z) || 1, al = Math.asin(Math.max(-1, Math.min(1, y / rho))), ph = Math.atan2(x, z);
  const P = profile();
  let yy, k = 1, K;
  if (al >= 0) { yy = B.skull * Math.sin(al); K = P(yy); }
  else {
    const t = -al / (Math.PI / 2), tK = 0.86;
    if (t <= tK) { yy = B.chinY * t / tK; K = P(yy); }
    else { const s = (t - tK) / (1 - tK); yy = B.chinY - B.cover * Math.sin(s * Math.PI / 2); k = Math.cos(s * Math.PI / 2); K = P(B.chinY); }
  }
  const [xx, zz] = sectionPoint(K, ph, k);
  let zo = zz;
  if (small && Math.cos(ph) > 0) zo += smallZ(xx, yy) * k;
  return [xx * rho, yy * rho, zo * rho];
}

/* facePoint: (x, y) in the flat projection -- that point of the front surface (bisection on x within the section, with the small layer).
   chinPoint: the outermost point forward-down (45 deg) on the midline (chin corner). nosePoint: the nose tip. */
export function facePoint(x, y) {
  const K = profile()(y);
  let a = 0, b = Math.PI / 2; const sx = Math.sign(x) || 1, ax = Math.abs(x);
  for (let i = 0; i < 50; i++) { const m = 0.5 * (a + b); if (sectionPoint(K, m)[0] < ax) a = m; else b = m; }
  const z = sectionPoint(K, 0.5 * (a + b))[1];
  return [x, y, z + smallZ(x, y)];
}
function midLine(n = 800) {                       // midline points (x = 0, front), with the small layer
  const L = [];
  for (let i = 0; i <= n; i++) { const al = -Math.PI / 2 + Math.PI * i / n; L.push(headShape(0, Math.sin(al), Math.cos(al) + 1e-9, true)); }
  return L;
}
export function chinPoint() {
  let optimum = null;
  for (const p of midLine()) if (p[2] > 0.2 && (!optimum || p[2] - p[1] > optimum[2] - optimum[1])) optimum = p;
  return optimum;
}
export function nosePoint() {
  let optimum = null;
  for (const p of midLine()) if (Math.abs(p[1] - HEAD.noseY) < 0.2 && (!optimum || p[2] > optimum[2])) optimum = p;
  return optimum;
}
/* Pass 10: PARTS -- NAMED points of every part in head space (for measuring: test/parts/). The user: "separate which one is
   hair, which is the nose, eye, brow, mouth, chin; when you measure the head down to the mouth, do not leave out the chin". Eye and
   brow -- the face drawing's own numbers for its shapes (faceCanvas: the open eye's opening, the closed lash line, the brow curve);
   the near eye and its brow -- through the map on the surface (eyePoint, as in the drawing), the far eye -- flat projection. Mouth,
   lip shadow -- the drawing; nose tip, chin tip -- the surface (with the small layer); under the chin -- the lowest point of the
   midline; jaw corner -- the widest side point of the section at the knot above the chin (y = yk(0.84)). Each point comes with its
   outward normal (for visibility). */
export function partPoints(closed = false) {
  const Y = FACE, W = Y.eyeW, H = Y.eyeH, w = HEAD.profileW, e = 1e-3;
  const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(t => t / l); };
  const faceN = (x, y) => {                                     // front surface point and its normal (flat-projection parameters)
    const p = facePoint(x, y), a = facePoint(x + e, y), b = facePoint(x - e, y), c = facePoint(x, y + e), d = facePoint(x, y - e);
    const tx = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], ty = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    return [p, nrm([tx[1] * ty[2] - tx[2] * ty[1], tx[2] * ty[0] - tx[0] * ty[2], tx[0] * ty[1] - tx[1] * ty[0]])];
  };
  const kk = eyeMap(w);
  const near = (lx, ly) => [eyePoint(w, -lx, ly), kk.N];        // +lx -- the outer side (as in the drawing)
  const far = (lx, ly) => faceN(Y.eyeX + lx, Y.eyeY + ly);
  const n = {};
  for (const [name, f] of [['near', near], ['far', far]]) {
    if (closed) {                                                // lash line: (-1.15W, -0.10H) -> (0.05W, -0.22H) -> (1.30W, 0)
      n['eye_' + name] = f(0.06 * W, -0.135 * H); n['eye_' + name + '_inner'] = f(-1.15 * W, -0.10 * H); n['eye_' + name + '_outer'] = f(1.30 * W, 0);
    } else {
      n['eye_' + name] = f(0.08 * W, -0.12 * H); n['eye_' + name + '_inner'] = f(-0.95 * W, 0.20 * H); n['eye_' + name + '_outer'] = f(1.05 * W, 0.55 * H);
      n['eye_' + name + '_top'] = f(0.20 * W, 0.93 * H); n['eye_' + name + '_low'] = f(-0.10 * W, -1.0 * H);
    }
    n['brow_' + name + '_inner'] = f(-0.95 * W, Y.browY); n['brow_' + name + '_mid'] = f(0.075 * W, Y.browY + 0.105 * H); n['brow_' + name + '_outer'] = f(1.15 * W, Y.browY - 0.18 * H);
  }
  const bu = nosePoint(), iu = chinPoint();
  n.nose_bridge = faceN(0, -0.18); n.nose_tip = [bu, faceN(0, bu[1])[1]]; n.nose_under = faceN(0, HEAD.noseY - HEAD.noseUnder);
  n.mouth_near = faceN(-Y.mouthWidth, Y.mouthY + 0.004); n.mouth = faceN(0, Y.mouthY - 0.003); n.mouth_far = faceN(Y.mouthWidth, Y.mouthY + 0.004);
  n.lip_shadow = faceN(0, Y.mouthY + Y.lipShadowY);
  n.chin_tip = [iu, nrm([0, -1, 1])]; n.chin_under = [headShape(0, -1, 1e-6, true), [0, -1, 0]];
  const yj = -0.15 + (HEAD.chinY + 0.15) * 0.84, K = profile()(yj), cz = 0.5 * (K.zF + K.zB);
  n.jaw_near = [[-K.W, yj, cz], [-1, 0, 0]]; n.jaw_far = [[K.W, yj, cz], [1, 0, 0]];
  n.skull_top = [headShape(0, 1, 1e-6), [0, 1, 0]];
  return n;
}

/* PROFILE EYE (pass 5, the anime profile technique) -- in the sample's profile view (shot 2) the eye sits 17.5 px (0.6 units)
   BEHIND and 5 px ABOVE our 3/4 position: on the side of the head, in front of the temple. One rigid head cannot give both
   views (the anime drawing moves the eye depending on the view). The previous solution (shifting the lower face forward)
   tipped the face upward. Now the near-eye DRAWING moves along the surface: a local map (O -- eye centre,
   T -- the drawing's horizontal axis (toward the nose), U -- its vertical axis, k -- drawing unit / surface unit). w = 0 -- the
   flat projection itself (3/4, the shot 1 measurements do not change), w = 1 -- the profile position measured from the sample.
   Measurement (test/stage2_fit.mjs, el -5, head level, tilt -0.08): the sample's closed-eye lash line (133, 77.5) ->
   (144, 80) back-projected onto the head surface: back end (-0.881, 0.003, 0.226), centre (-0.855, -0.040, 0.362),
   front end (-0.791, -0.097, 0.544) -> length along the surface 0.345 (our closed line 0.233 -> kx 0.675), sloping
   16.9 deg down toward the front (ours 3 deg -> deviation 13.9 deg), cylindrical angle -67.1 deg, centre y -0.040 (the closed
   line is 0.018 below the eye centre -> eye centre y -0.022). ky -- line thickness (sample 2..3 px, ours 1.6 px). */
export const EYE_PROFILE = {y: -0.022, phi: -67.1, kx: 0.675, ky: 0.85, deviation: 13.9};
function sectionSide(y, phi) {                    // the point with cylindrical angle phi (rad, from +z toward +x) on the section at height y
  const K = profile()(y), ang = ph => { const [x, z] = sectionPoint(K, ph); return Math.atan2(x, z); };
  let a = 0, b = (phi < 0 ? -1 : 1) * Math.PI * 0.95;
  for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b); if (Math.abs(ang(m)) < Math.abs(phi)) a = m; else b = m; }
  const ph = 0.5 * (a + b), [x, z] = sectionPoint(K, ph);
  return {x, z, ph, K};
}
const _nrm = v => { const l = Math.hypot(...v) || 1; return v.map(t => t / l); };
const _crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function eyeMap(w) {
  const KP = EYE_PROFILE, O0 = facePoint(-FACE.eyeX, FACE.eyeY);
  const phi0 = Math.atan2(O0[0], O0[2]), phi = phi0 + w * (KP.phi * Math.PI / 180 - phi0), y = FACE.eyeY + w * (KP.y - FACE.eyeY);
  const s = sectionSide(y, phi), O = [s.x, y, s.z + smallZ(s.x, y)];
  const e = 1e-3, [x2, z2] = sectionPoint(s.K, s.ph + (s.ph < 0 ? e : -e));            // forward (toward the nose)
  let T = _nrm([x2 - s.x, 0, z2 - s.z]);
  const s2 = sectionSide(y + e, phi); let U = _nrm([s2.x - s.x, e, s2.z - s.z]);
  const N = _nrm(_crs(T, U)); U = _nrm(_crs(N, T));
  const a = w * KP.deviation * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const T2 = T.map((t, i) => ca * t - sa * U[i]), U2 = T.map((t, i) => sa * t + ca * U[i]);
  return {O, T: T2, U: U2, N, k: [1 + w * (KP.kx - 1), 1 + w * (KP.ky - 1)]};
}
/* for fitting: a point of the near-eye drawing (dx, dy from the centre, in drawing units) in head space -- via the map */
export function eyePoint(w, dx = 0, dy = 0) {
  const c = eyeMap(w);
  return c.O.map((o, i) => o + c.T[i] * dx / c.k[0] + c.U[i] * dy / c.k[1]);
}

function headGeo(shift = 0) {
  const oldS = HEAD.shift; HEAD.shift = shift;
  const g = new THREE.SphereGeometry(1, 200, 200);
  const p = g.attributes.position, large = g.clone(), pk = large.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x0 = p.getX(i), y0 = p.getY(i), z0 = p.getZ(i);
    pk.setXYZ(i, ...headShape(x0, y0, z0, false));
    p.setXYZ(i, ...headShape(x0, y0, z0, true));
  }
  large.computeVertexNormals();
  g.setAttribute('normal', large.attributes.normal);     // shading -- from the large shape (does not break the nose/lip cel boundary)
  HEAD.shift = oldS;
  return g;
}
/* for fitting/measuring: points of the head surface (no render) -- silhouette (test/fit_face3.mjs) */
export function headPoints(nU = 120, nV = 120, small = true) {
  const out = [];
  for (let j = 0; j <= nV; j++) {
    const al = -Math.PI / 2 + Math.PI * j / nV;
    for (let i = 0; i < nU; i++) { const ph = -Math.PI + 2 * Math.PI * i / nU; out.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), small)); }
  }
  return out;
}

/* ---------- FACE DRAWING (canvas; flat projection in head space: u = .5 + x/2.2, v = (y + 1.45)/2.2) ---------- */
/* v3: the chin goes down to y -1.33 -- the projection was extended downward (v2: v = .5 + (y+.2)/2, y > -1.2) */
export const FACE_UV = {sx: 2.2, y0: -1.45, sy: 2.2};
const YS = 1024;
/* FACE -- positions and sizes of the face drawing (in head space, flat-projection coordinates). The drawing is ours;
   position/size are measured from the sample (test/triangle.mjs, test/fit_face3.mjs). */
export const FACE = {eyeX: 0.313, eyeY: -0.205, eyeW: 0.095, eyeH: 0.13, browY: 0.20, browThick: 0.045,
  mouthY: -0.876, mouthWidth: 0.11, mouthThick: 0.022, lipShadowY: -0.13,
  colour: {brow: '#2a283f', lid: '#0a0918', fold: 'rgba(28,26,48,0.8)', sclera: '#4a4964', iris: ['#08081c', '#15163a', '#30356a'],
         pupil: '#06061a', light: '#9ea2de', light2: '#6d72b8', tear: '#a9abe6', skin: '#39374e', mouth: '#17152a', lipShadow: '#1d1b31', noseArc: '#8a8ac4'}};

function faceCanvas(state) {                           // state: 'openness' | 'half' | 'closed'
  /* Pass 4: the drawing was redesigned -- size, tone and placement from the sample (frame 3, 320 px, L table):
     the near eye's dark mass is 11 px (eyelid line, widest) x 10 px, narrowing downward (6..7 px) -> ~0.21 x 0.20
     units; the white part is hardly visible (night scene: the eye is in shadow, L 3..16 above, 22..43 below); the eyelid
     line is thick (2..3 px); above the eye a dark brow band (3 px, ~10 px above the eye, 14 px wide); mouth -- a dark
     line (L 37..49, 10 px), with the lip shadow under it (L 23..38, 3 px). The previous eye was ~2 times larger, with a white sclera.
     Colours are final (sRGB); the style multiplies them by the light, 0.8..1.0. */
  const closed = state === 'closed', half = state === 'half';
  const c = document.createElement('canvas'); c.width = c.height = YS;
  const g = c.getContext('2d');
  const K = YS / FACE_UV.sx;                                  // canvas px / unit
  const P = (x, y) => [(0.5 + x / FACE_UV.sx) * YS, (1 - (y - FACE_UV.y0) / FACE_UV.sy) * YS];
  const R = FACE.colour;
  const eye = (s) => {                                       // s = +1 the character's left eye (x > 0), -1 the right one
    const [cx, cy] = P(FACE.eyeX * s, FACE.eyeY);
    const W = FACE.eyeW, H = FACE.eyeH;
    g.save(); g.translate(cx, cy); g.scale(s * K, -K);       // local: units, +x -- the outer side, +y -- up
    g.lineCap = 'round'; g.lineJoin = 'round';
    // brow: a dark band above the eye, its outer end lower
    g.lineWidth = FACE.browThick; g.strokeStyle = R.brow;
    g.beginPath(); g.moveTo(-0.95 * W, FACE.browY); g.quadraticCurveTo(0.05 * W, FACE.browY + 0.30 * H, 1.15 * W, FACE.browY - 0.18 * H); g.stroke();
    const hole = () => {                                   // eye opening: wide and flat at the top, narrowing at the bottom
      g.beginPath(); g.moveTo(-0.95 * W, 0.20 * H);
      g.bezierCurveTo(-0.75 * W, 0.80 * H, 0.35 * W, 1.02 * H, 1.05 * W, 0.55 * H);
      g.bezierCurveTo(0.95 * W, -0.35 * H, 0.45 * W, -1.02 * H, -0.10 * W, -1.0 * H);
      g.bezierCurveTo(-0.60 * W, -0.98 * H, -0.92 * W, -0.40 * H, -0.95 * W, 0.20 * H);
      g.closePath();
    };
    if (closed) {
      // closed: a thick lash line (curved down), a small tip at the outer end; a thin fold above it
      // sample frames 10-11: the closed eye is a thick dark line (3 px, L 5..20), wider than the open eye (15 px), a light fold above it
      g.lineWidth = 0.42 * H; g.strokeStyle = R.lid;
      g.beginPath(); g.moveTo(-1.15 * W, -0.10 * H); g.quadraticCurveTo(0.05 * W, -0.22 * H, 1.30 * W, 0.0); g.stroke();
      g.lineWidth = 0.16 * H; g.beginPath(); g.moveTo(1.20 * W, 0.0); g.lineTo(1.50 * W, -0.12 * H); g.stroke();
      g.lineWidth = 0.08 * H; g.strokeStyle = R.fold;
      g.beginPath(); g.moveTo(-0.80 * W, 0.45 * H); g.quadraticCurveTo(0.10 * W, 0.28 * H, 1.05 * W, 0.50 * H); g.stroke();
    } else {
      g.save(); hole(); g.clip();
      g.fillStyle = R.sclera; g.fillRect(-2 * W, -2 * H, 4 * W, 4 * H);
      const gr = g.createLinearGradient(0, H, 0, -H);        // iris: almost black at the top, bluish at the bottom
      gr.addColorStop(0, R.iris[0]); gr.addColorStop(0.55, R.iris[1]); gr.addColorStop(1, R.iris[2]);
      g.beginPath(); g.ellipse(0.08 * W, -0.12 * H, 0.80 * W, 1.05 * H, 0, 0, 7); g.fillStyle = gr; g.fill();
      g.beginPath(); g.ellipse(0.08 * W, -0.02 * H, 0.34 * W, 0.55 * H, 0, 0, 7); g.fillStyle = R.pupil; g.fill();
      const qs = g.createLinearGradient(0, H, 0, 0.1 * H);   // eyelid shadow over the eyeball
      qs.addColorStop(0, 'rgba(6,6,20,0.85)'); qs.addColorStop(1, 'rgba(6,6,20,0)');
      g.fillStyle = qs; g.fillRect(-2 * W, 0.1 * H, 4 * W, 2 * H);
      if (!half) { g.beginPath(); g.ellipse(0.30 * W, 0.42 * H, 0.13 * W, 0.10 * H, 0, 0, 7); g.fillStyle = R.light; g.fill(); }
      g.beginPath(); g.ellipse(-0.30 * W, -0.55 * H, 0.07 * W, 0.05 * H, 0, 0, 7); g.fillStyle = R.light2; g.fill();
      if (half) { g.fillStyle = R.skin; g.fillRect(-2 * W, 0.08 * H, 4 * W, 2 * H); }   // the eyelid has come down halfway
      g.restore();
      if (!half) {                                          // tear pool: a bright crescent on the inner-lower rim (sample frames 1..9: L 100..124)
        g.lineWidth = 0.13 * H; g.strokeStyle = R.tear;
        g.beginPath(); g.moveTo(-0.30 * W, -0.97 * H); g.bezierCurveTo(-0.70 * W, -0.92 * H, -0.95 * W, -0.45 * H, -1.02 * W, 0.05 * H); g.stroke();
        g.beginPath(); g.ellipse(-1.02 * W, -0.40 * H, 0.16 * W, 0.20 * H, 0, 0, 7); g.fillStyle = R.tear; g.fill();
      }
      // upper eyelid line: thick, with a tip pointing down-and-out at the outer end
      g.lineWidth = 0.30 * H; g.strokeStyle = R.lid;
      g.beginPath();
      if (half) { g.moveTo(-0.95 * W, 0.10 * H); g.quadraticCurveTo(0.05 * W, -0.05 * H, 1.05 * W, 0.12 * H); }
      else { g.moveTo(-0.95 * W, 0.20 * H); g.bezierCurveTo(-0.75 * W, 0.80 * H, 0.35 * W, 1.02 * H, 1.05 * W, 0.55 * H); }
      g.stroke();
      g.lineWidth = 0.14 * H; g.beginPath();
      if (half) { g.moveTo(0.95 * W, 0.12 * H); g.lineTo(1.30 * W, -0.05 * H); } else { g.moveTo(0.95 * W, 0.60 * H); g.lineTo(1.30 * W, 0.30 * H); }
      g.stroke();
    }
    g.restore();
  };
  eye(1); eye(-1);
  // mouth -- a dark line; the lip shadow below it (short, on the midline)
  const oy = FACE.mouthY;
  g.lineCap = 'round'; g.strokeStyle = R.mouth; g.lineWidth = FACE.mouthThick * K;
  const [ax, ay] = P(-FACE.mouthWidth, oy + 0.004), [bx, by] = P(0, oy - 0.010), [ex, ey] = P(FACE.mouthWidth, oy + 0.004);
  g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(bx, by, ex, ey); g.stroke();
  /* nose ridge: in the sample a bright curve runs from under the far eye down to the nose tip (L 82..113, in every frame
     of shot 1; in profile the nose ridge is bright too) -- with the shot 1 camera this is the NOSE RIDGE: midline y -0.34..-0.52
     on screen (117.6, 54.5) -> (129.3, 59.9), sample (120, 56) -> (130.5, 60). The silhouette rim is very thin in 3D (less
     than a pixel of area) -- drawn instead: a thin bright line on the ridge (thicker toward the tip) */
  g.strokeStyle = R.noseArc; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const t0 = i / 8, t1 = (i + 1) / 8, y0 = -0.34 - 0.18 * t0, y1 = -0.34 - 0.18 * t1;
    const [ax, ay] = P(-0.006, y0), [bx, by] = P(-0.006, y1);           // on the ridge (on its far side -- in 3/4 it stays behind the ridge)
    g.lineWidth = (0.026 + 0.018 * t1) * K; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }
  g.strokeStyle = R.lipShadow; g.lineWidth = 0.045 * K;
  const [lx, ly] = P(-0.045, oy + FACE.lipShadowY), [rx, ry] = P(0.045, oy + FACE.lipShadowY);
  g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/* ---------- HAIR: strands (band tubes), spring-bone physics ---------- */
/* each strand: the root on the head surface (in head space), the chain points in the rest state (in head space).
   Physics in world space: the root is tied to the head, the others -- a spring pulling toward the rest state,
   gravity, wind, drag, a length constraint, collision with the head sphere (like VRM SpringBone). */
/* HAIR (pass 6) -- the design is ours (pointed strands); what is measured from the sample is MASS and COVERAGE, with the same
   code on both sides (test/audit_sample/hair_coverage.py -- WHAT the sample's bright hair lands on in ours; hair_measure.py -- M1..M4).
   The previous hair was a thin cap stuck to the head: in shot 1 only 9 % of the sample's bright mass matched ours
   (the rest landed on our skin 33.5 %, hood 27.6 %, inner cap 14 %). The sample's mass in head space (shot
   cameras, node projection): in shot 2 (profile, head level) a broad mass ~1 unit above the crown (y ~2.0, single
   tips up to 2.6), at forehead height (y 0.5..0.7) ~1 unit IN FRONT of the forehead (z 1.9), at brow height z 1.3,
   at the eye row the front of the face is clear; the near side mass behind the eye, down below the chin. Wind from behind (the snow
   goes right-and-up) -- the hair is a fan spread forward-and-up. In shot 1 (3/4, from below) the forehead is under hair down to
   8..11 px above the eye, 1..9 px of skin behind the near eye, tips spread forward outside the far contour; in shot 3 (head
   tilted 39 deg) the bright mass is IN FRONT of the face. Groups: FAN (crown and long forehead -- rises, then bends forward-and-down),
   SHORT forehead (lies down to the brows), NEAR side (view-dependent), FAR side (spread forward), BACK (inside the hood).
   Physics: the rest shape bends toward gravity and wind (personaj.tiltedRest); shading with a mass normal
   (strandGeometry, aHairN). Pass 9: near strands and the short forehead -- one rest shape (the view weight was removed). */
export const HAIR = {
  /* FAN (crown + long forehead): k = 0 (back of the crown) .. 1 (hairline); at each k, lat strands (sideways -phLat..phLat).
     The tips follow the sample's shot 2 front/top boundary (head space, [y, z]) -- measured from the rows; the bend
     point is H above the root (a strand first rises, then falls forward-and-down: volume) */
  fan: {kn: 7, lat: 4, thBack: -0.30, thFront: 0.55, phLat: 1.0, H0: 0.70, H1: 0.35, width0: 0.80, width1: 0.65, arcX: 0.20,
        swing0: 0.12, swing1: 0.45,       // the front ones hang heavier: in shot 3 (head tilted) the forehead hair is IN FRONT of the face
        tip: [[2.00, 1.05], [1.80, 1.40], [1.50, 1.65], [1.25, 1.80], [1.05, 1.85], [0.90, 1.75], [0.72, 1.50]]},
  /* SHORT forehead: in shot 1 the sample's forehead hair ends 8..11 px above the near eye (y ~ -0.03; the bright part
     down to rows 26..37, lower down in shadow); in profile (w=1) the near-side ones are higher (yTipP + yTipPSide * a) */
  short: {n: 7, phMax: 0.85, th: 0.60, yTip: -0.30, yTipSide: 0.05, yTipP: 0.25, yTipPSide: 0.45, off: 0.08, en: 0.60},
  /* NEAR side mass -- view-dependent (the anime technique, like the eye map of pass 5): in 3/4 (w=0) it hangs STRAIGHT
     DOWN beside the face (x0 + j dx, z -- face surface + off): in the sample's shot 1 the bright mass is left of the eye at
     x 70..90 (head x -0.45..-0.7), down to row 94; in profile (w=1) beside the head, behind the profile eye (sample shot 2:
     at the eye row the front edge is at z -0.14, at the jaw +0.33, the back -0.6, the lower tip y -1.2) */
  /* PASS 10 TEST (not accepted): the near strand along the section (side(), phU/pk) + fitting with coverage (test/fit_hair9b.mjs,
     test/hair10_fit.json): coverage in shots 1/2/3 ~14 / 18 / 13 % -> 2 / 3 / 0.2 %, shot 2 IoU 0.29 -> 0.46, but in shot 1 (11
     frames) the strand vanished from the cheek edge (IoU 0.26 -> 0.19; in the overlaid masks, in frames 1-9 the pass 9 strand
     matches the sample's, in 10-11 -- as the head turns -- it moves onto the face, while the sample's stays at the face edge).
     The strand stays as in pass 9 (vertical()). */
  near: {n: 3, x0: -0.45, dx: -0.06, dxU: -0.29, dzU: 0.30, yRoot: 0.50, yTip0: -1.00, off: 0.08, width0: 0.30, swing: 0.50, shK: 0.0,
          ph0: -1.75, ph1: -2.45, th: 1.00, yTip: -1.15, zFront: -0.20, zBack: -0.65, xTip: -1.00, en: 0.42},
  /* FAR side: spread FORWARD from the far temple (sample shot 1: bright hair 15..25 px outside the face's far contour,
     going down-right over rows 26..56; in head space x ~1.0, y 0..0.4, z 0.8..1.2 -- node projection) */
  far:  {n: 3, ph0: 1.20, ph1: 1.75, th: 0.95, yTip: 0.20, dyTip: 0.12, zFront: 1.20, zBack: 0.85, xTip: 1.02, en: 0.70},
  /* inner cap (dark -- the shadow between the strands): the hairline is low in the middle (the forehead is under hair down
     to the brows), high at the temples: draw = c0 + c1 |x|^1.5 (direction y) */
  capShell: {c0: 0.10, c1: 0.50},
  physics: {swing: 0.12, shK: 0.12},     // gravity/wind bend (personaj.tiltedRest); a group may give its own
  massN: {k: 0.50, dy: 0.4},          // mass normal: radial share, centre height (in head space)
};
const MN = HAIR.massN;
export function strandsDesign() {
  const R = rng(20260924), T = [], B = HEAD;
  const brow = (root, fpath, en, n = 7) => {           // fpath: [dx,dy,dz] steps (in head space)
    const pts = [root]; let p = root;
    for (const d of fpath) { p = [p[0] + d[0], p[1] + d[1], p[2] + d[2]]; pts.push(p); }
    T.push({rest: pts, rest0: pts, rest1: pts, en, gr: 'back'});
  };
  const sphere = (th, ph, r = 1.02) => [r * Math.sin(th) * Math.sin(ph), r * Math.cos(th), r * Math.sin(th) * Math.cos(ph)];
  // a point on the head surface: th from the top, ph from the front (+z); off outside the surface
  const surface = (th, ph, off = 0) => {
    const s = headShape(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph), false), r = Math.hypot(...s) || 1;
    return s.map(v => v * (r + off) / r);
  };
  // if a point is inside the head (the section at that height + min) -- it is pushed outward from the section centre
  const outside = (pts, min = 0.05) => pts.map((p, i) => {
    if (i === 0 || p[1] > B.skull || p[1] < B.chinY) return p;
    const K = profile()(p[1]), cz = 0.5 * (K.zF + K.zB), ph = Math.atan2(p[0], p[2] - cz);
    const [bx, bz] = sectionPoint(K, ph), rb = Math.hypot(bx, bz - cz), rp = Math.hypot(p[0], p[2] - cz);
    return rp >= rb + min ? p : [p[0] * (rb + min) / (rp || 1), p[1], cz + (p[2] - cz) * (rb + min) / (rp || 1)];
  });
  const bez = (p0, p1, p2, n = 6) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; pts.push([0, 1, 2].map(k => a * p0[k] + b * p1[k] + c * p2[k])); }
    return pts;
  };
  let G = '';                                          // group name (check: ?strands=group)
  const one = (d, en) => T.push({rest: d, rest0: d, rest1: d, en, gr: G});
  // a path along the surface (SHORT forehead): latitude (th from the top) from y0 to y1, azimuth ph, off outside the surface
  const thY = y => Math.PI / 2 - (y >= 0 ? Math.asin(Math.min(1, y / B.skull)) : -Math.min(0.86, y / B.chinY * 0.86) * Math.PI / 2);
  const fpath = (ph, y0, y1, off, n = 6) => {
    const a = thY(y0), b = thY(y1), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push(surface(a + (b - a) * t, ph, off * (0.4 + 0.6 * t))); }
    return pts;
  };
  // FAN: from the back of the crown (k=0) to the hairline (k=1); a strand rises, then bends forward-and-down
  G = 'fan';
  const Y = HAIR.fan, tipK = k => {                  // linear along the tip boundary (k -> [y, z])
    const f = k * (Y.tip.length - 1), i = Math.min(Y.tip.length - 2, Math.floor(f)), t = f - i;
    return [Y.tip[i][0] + (Y.tip[i + 1][0] - Y.tip[i][0]) * t, Y.tip[i][1] + (Y.tip[i + 1][1] - Y.tip[i][1]) * t];
  };
  for (let a = 0; a < Y.kn; a++) for (let b = 0; b < Y.lat; b++) {
    const k = Math.min(1, Math.max(0, (a + (R() - 0.5) * 0.5) / (Y.kn - 1))), lu = Y.lat > 1 ? b / (Y.lat - 1) : 0.5;
    const phL = (-Y.phLat + 2 * Y.phLat * lu) * (0.55 + 0.45 * k) + (R() - 0.5) * 0.15;
    const ths = Y.thBack + (Y.thFront - Y.thBack) * k, r0 = surface(Math.abs(ths) + 0.02, ths < 0 ? Math.PI - phL : phL, 0.0);
    const [yt, zt] = tipK(k), yl = 1 - 0.25 * Math.abs(2 * lu - 1);     // the edge ones a little shorter
    const tip = [r0[0] * (1.15 + Y.arcX) + Math.sign(r0[0]) * 0.05, r0[1] + (yt - r0[1]) * yl + (R() - 0.5) * 0.2, r0[2] + (zt - r0[2]) * yl + (R() - 0.5) * 0.15];
    const H = Y.H0 + (Y.H1 - Y.H0) * k, c = [r0[0] * 1.15, Math.max(r0[1], tip[1]) + H, 0.5 * (r0[2] + tip[2]) - 0.1];
    one(outside(bez(r0, c, tip)), (Y.width0 + (Y.width1 - Y.width0) * k) * (0.85 + 0.3 * R()));
    T[T.length - 1].swing = Y.swing0 + (Y.swing1 - Y.swing0) * k;
  }
  // SHORT forehead: lies on the forehead, down to the brows
  const Q = HAIR.short; G = 'short';
  for (let i = 0; i < Q.n; i++) {
    const u = i / (Q.n - 1), ph = -Q.phMax + 2 * Q.phMax * u + (R() - 0.5) * 0.06, a = Math.abs(ph) / Q.phMax;
    const y0 = B.skull * Math.cos(Q.th + R() * 0.05), j = (R() - 0.5) * 0.08 + (i % 2 ? 0.04 : -0.03), y1 = Q.yTip + Q.yTipSide * a + j;
    const en = Q.en * (0.85 + 0.3 * R()) * (ph > 0 ? 1 + 0.5 * a : 1);   // wider on the far side (seen at a slant in 3/4)
    one(fpath(ph, y0, y1, Q.off), en);
  }
  // NEAR (right, -x) and FAR (left, +x) side mass: hangs from the temple to the jaw, bulging off the surface
  /* a path along the side of the face: x from x0 to x0+dxU, z = front surface + off - dzU t^2 (going down, BEHIND the jaw: in 3/4
     it does not fall over the cheek -- and when the head turns to profile it stays behind the cheek, sample frames 9..11) */
  const vertical = (x0, y0, y1, off, dxU = 0, dzU = 0, n = 6) => {
    const pts = []; let zOx = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = y0 + (y1 - y0) * t, K = profile()(y), x = x0 + dxU * t;
      let z = zOx, zFace = null;
      if (Math.abs(x) < K.W * 0.98) { zFace = facePoint(x, y)[2] + off; z = zFace; }
      if (z === null) z = 0.5 * (K.zF + K.zB);
      zOx = z;
      const zo = z - dzU * t * t;
      pts.push([x, y, zFace === null ? zo : Math.max(zFace, zo)]);   // where there is face, it does not go inside the surface
    }
    return pts;
  };
  /* Pass 9 (2b redo): a side strand ALONG THE SECTION -- the root on the face surface (x0, y0); going down, the azimuth around
     the head section turns from the root's to phU (with t^pk), off outside the surface. In vertical() the strand, within the face
     width, was always on the face surface (over the cheek) -- in the profile view (shot 2) it covered the face; here the tip can
     pass from the cheek to behind the jaw. */
  const side = (x0, y0, y1, off, phU, pk, n = 6) => {
    const K0 = profile()(y0), cz0 = 0.5 * (K0.zF + K0.zB);
    const z0 = Math.abs(x0) < K0.W * 0.98 ? facePoint(x0, y0)[2] : cz0, ph0 = Math.atan2(x0, z0 - cz0), pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = y0 + (y1 - y0) * t, K = profile()(Math.max(y, B.chinY)), cz = 0.5 * (K.zF + K.zB);
      const [bx, bz] = sectionPoint(K, ph0 + (phU - ph0) * Math.pow(t, pk)), r = Math.hypot(bx, bz - cz) || 1, k = (r + off) / r;
      pts.push([bx * k, y, cz + (bz - cz) * k]);
    }
    return pts;
  };
  for (const [YY, s] of [[HAIR.near, -1], [HAIR.far, 1]]) {
    G = s < 0 ? 'near' : 'far';
    for (let i = 0; i < YY.n; i++) {
      const u = YY.n > 1 ? i / (YY.n - 1) : 0, ph = YY.ph0 + (YY.ph1 - YY.ph0) * u, r0 = surface(YY.th + (R() - 0.5) * 0.10, ph, 0.0);
      const tip = [YY.xTip * (0.95 + 0.1 * R()), YY.yTip + (R() - 0.5) * 0.25 + (YY.dyTip !== undefined ? YY.dyTip : 0.12) * u, YY.zFront + (YY.zBack - YY.zFront) * u];
      const c = [r0[0] + s * 0.28, 0.5 * (r0[1] + tip[1]) + 0.15, 0.5 * (r0[2] + tip[2])];
      const d1 = outside(bez(r0, c, tip)), en = YY.en * (0.85 + 0.3 * R());
      /* Pass 9: near strands -- only the 3/4 rest shape (the profile shape and the view weight were removed; one shape
         for three shots: shot 2 coverage 54 -> 52 %, bright mass 3.13 -> 3.60 % (sample 4.29), hair over the profile eye 0) */
      if (s < 0) {                                     // random numbers drawn in the same order as before (first the path, then en)
        const y1 = YY.yTip0 - 0.06 * i + (R() - 0.5) * 0.1;
        const d0 = YY.phU !== undefined ? side(YY.x0 + YY.dx * i, YY.yRoot - 0.05 * i, y1, YY.off, YY.phU + (YY.phD || 0) * i, YY.pk || 1)
                                        : vertical(YY.x0 + YY.dx * i, YY.yRoot - 0.05 * i, y1, YY.off, YY.dxU, YY.dzU + 0.08 * i);
        one(d0, YY.width0 * (0.9 + 0.2 * R())); T[T.length - 1].swing = YY.swing; T[T.length - 1].shK = YY.shK; if (YY.shF !== undefined) T[T.length - 1].shF = YY.shF;
      }
      else one(d1, en);
    }
  }
  // BACK (stays inside the hood -- short)
  for (let i = 0; i < 6; i++) {
    const ph = Math.PI * 0.62 + (i / 5) * Math.PI * 0.76, th = 0.60 + R() * 0.35;
    const r = sphere(th, ph, 1.03), o = [r[0] * 0.10, 0, r[2] * 0.10];
    brow(r, [[o[0], 0.02, o[2]], [o[0], -0.22, o[2]], [o[0] * 0.5, -0.26, o[2] * 0.5], [0, -0.22, 0]], 0.30);
  }
  return T;
}

function bandGeo(nSeg, nRad) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((nSeg + 1) * nRad * 3), idx = [];
  for (let i = 0; i < nSeg; i++) for (let j = 0; j < nRad; j++) {
    const a = i * nRad + j, b = i * nRad + (j + 1) % nRad, c = (i + 1) * nRad + j, d = (i + 1) * nRad + (j + 1) % nRad;
    idx.push(a, c, b, b, c, d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('aHairN', new THREE.BufferAttribute(new Float32Array((nSeg + 1) * nRad * 3), 3));   // mass normal (shading)
  return g;
}

/* ---------- HOOD: shell, face opening, thick brim, inside (lining) ---------- */
/* CLOTHES -- hood, cloak and torso (body mass) parameters. The values are fitted with test/fit_clothes.mjs to the sample's
   figure mass (occlusion map, shots 1 and 3 TOGETHER); the result is written here. */
/* openV0/openV1: the opening starts at y = yTop - v*long -- at 0.20 y ~1.05 (at the crown of the head), fully open at 0.36 (brow).
   In the fit (0.04..0.24) the opening started 0.7 units ABOVE the top of the head: in shot 3 the head came down out of the
   opening and did not go into the shadow (audit 2). */
export const CLOTHES = {    // fit result (test/fit_clothes.mjs -> test/clothes_fit.json; after the cameras were fitted to the face): soft IoU shot 1 0.873, shot 3 0.836
  /* pass 6 (minimal, with the hair): the opening starts at the crown (openV0 0.2 -> -0.05), the crown dome goes back (pushZ 0.45) and
     higher (dome 0.378 -> 0.5) -- the new hair peak poked through the hood / stayed under it in shot 2:
     the sample's bright hair under our hood 0.101 / 0.410 / 0.002 -> 0.004 / 0.138 / 0.000 (shots 1/2/3),
     figure IoU 0.902 / 0.868 -> 0.903 / 0.866 (test/fit_hood6.mjs --score-only). The full hood pass comes later. */
  /* pass 9: the hood is not PER SHOT. The cloth size is ONE (r0, visor, dome, tipY, rShoulder, back; tau -- the inertia of
     following the head), its placement (opening, crown and upper part, lining band) comes from the head pose -- the hoodPose keys
     (personaj.hoodDeform). Fitted to the three shots together: test/fit_hoodPose9.mjs (test/hoodPose9_result.json); follow
     inertia tau 0.1 s, placement lag tauD 0.4 s (shot 1 10->11 scale jump 1.075 -> 1.014, head IoU 0.794 ->
     0.810; shot 3 0.694 -> 0.676 -- scan: test results README pass 9). The placement
     values here (openness, pushZ, ...) are used only when there are no keys. A single rigid hood (fit_hood9) had covered
     the face in shot 2 (visible head 0.13). */
  hood: {r0: 1.1542, rMid: 0.08, rShoulder: 0.3397, visor: 0.4752, yTop: 1.989, long: 4.183, dome: 0.6295, tipY: 1.2685, tipZ: 1.389, tipV: 0.12, openness: 0.7968, openV0: -0.1679, openV1: 0.5787, shut: 0.8, wideX: 1.21, back: 2.7679, pushZ: 0.5102, pushY: 0.2724, wholeZ: -0.0693, wholeY: -0.3844, yaw: 0.0134, eg: 0.323, openA: 1.1625, openB: 1.263, bandA: 6.8722, bandB: 2.0777, bandAlt: 0.1104, bandBlt: 0.5799, bandV: 0.5639, tau: 0.1, tauD: 0.4},
  /* key poses (tilt, turn) and the cloth placement at that pose (test/fit_hoodPose9.mjs; keys -- the shot 1 still,
     shot 2 and shot 3 still poses; the blend is mainly by tilt: sigmaE 0.2, sigmaB 1.0). Pass 10: the shot poses were refitted
     with the head (test/fit_head10.mjs) -- the shot 1 key moved to that pose too: [-0.3, -0.158] -> [-0.2816, -0.1658] (in shot 1
     the placement stays the same); the shot 2 and 3 poses and keys -- as before (the film.js comment). Pass 11: the shot 2 and 3 poses,
     cameras and keys were fitted TOGETHER to the human marks (test/fit_pose11b.mjs; with the shot 1 10-11 guard) -- the key
     poses follow the new shot poses; previous: [-0.014, 0] and [0.66, -0.02] (test/log11/personaj_before11.js) */
  hoodPose: {sigmaE: 0.2, sigmaB: 1, key: [
    {p: [-0.2816, -0.1658], d: {openness: 0.5, openV0: -0.1678, openV1: 0.4631, pushZ: 0.2869, pushY: -0.2602, wholeZ: -0.3212, wholeY: -0.324, yaw: 0.0079, eg: 0.1487, openA: 1.2063, openB: 1.3609, bandA: 5.6943, bandB: 2.1521, bandAlt: 0.4419, bandBlt: 0.7798, bandV: 0.5397}},
    {p: [-0.0646, -0.5838], d: {openness: 1.2099, openV0: -0.1152, openV1: 0.47, pushZ: 0.4711, pushY: 0.6274, wholeZ: 0.3729, wholeY: -0.9, yaw: 0.0286, eg: 0.0684, openA: 0.7975, openB: 1.1903, bandA: 6.6959, bandB: 5.3081, bandAlt: 0.7792, bandBlt: 0.9529, bandV: 0.6607}},
    {p: [0.7025, 0.1089], d: {openness: 1.2553, openV0: 0.1067, openV1: 0.3392, pushZ: 0.6958, pushY: 0.693, wholeZ: -0.6037, wholeY: -0.2613, yaw: 0.4162, eg: 0.4412, openA: 0.5152, openB: 1.0755, bandA: 6.8637, bandB: 0.83, bandAlt: 0.7088, bandBlt: 0.9253, bandV: 0.6209}},
  ]},
  cloak: {r0: 1.92, rWide: 1.504, zRatio: 0.772, yHead: -1.95, long: 7.5, back: 0.209},
  torso: {dy: -0.284, dz: 0.622, yaw: 0.402},
};

function hoodGeo(P = CLOTHES.hood) {
  /* u: 0..1 -- from one edge of the opening around the back to the other edge; v: 0 (top) .. 1 (shoulder).
     The opening half-angle (from the front of the face) depends on v: it starts from 0 at the crown, ~106 deg at the cheek (the brim
     BEHIND the ear), and narrows at the collar. In the sample's shots 2 and 3 (side view) the hood brim is behind the head: the face,
     the forehead hair and the side strands are IN FRONT of the brim -- this MASS placement was measured, not the drawing. */
  const eh = v => { const a = sm(P.openV0, P.openV1, v) * P.openness * (1 - P.shut * sm(0.50, 0.90, v)); return Math.max(0.0001, a); };
  /* pass 7: the opening's two brims separately -- openA (u=0, the +x side: far in shot 1) and openB (u=1, -x: near) multiply
     eh, in full at head height, going back to 1 under the chin (v 0.55..0.85): in shot 1 the near brim covers the back of the
     head, the far brim must stay BEHIND the face profile (with a narrow symmetric opening the inside of the far panel showed to the
     right of the face as a dark frame + a lining line, where the sample has sky), but the collar under the chin stays in place (figure) */
  const absent = v => 1 - sm(0.55, 0.85, v);
  const ehA = v => eh(v) * (1 + ((P.openA || 1) - 1) * absent(v)), ehB = v => eh(v) * (1 + ((P.openB || 1) - 1) * absent(v));
  const f = (u, v, t) => {
    const eA = ehA(v), eB = ehB(v), ph = eA + u * (2 * Math.PI - eA - eB);        // ph: from the front (+z)
    // radius profile: close to the head at the top, spreading onto the shoulders at the bottom
    const r = P.r0 + P.rMid * Math.sin(v * Math.PI) + P.rShoulder * Math.pow(sm(0.55, 1.0, v), 1.2)
            + P.visor * (1 - sm(0.05, 0.40, v)) * Math.max(0, Math.cos(ph))       // visor at the front-top, outside the hair
            + P.back * Math.max(0, -Math.cos(ph)) * sm(0.05, 0.45, v);                 // wider at the back (loosely hanging cloth)
    /* pass 6: the crown (dome) part shifts back by pushZ -- so that the hair peak (shot 2, in the sample IN FRONT of the hood)
       does not poke through the dome; the side panels stay in place (so that in shot 1 the far side's inner face does not show beside the face) */
    const crown = 1 - sm(0.10, 0.35, v), high = 1 - sm(0.45, 0.80, v);   // the crown (dome) and the whole upper part (in the head frame)
    let y = P.yTop - v * P.long + (P.pushY || 0) * crown + (P.wholeY || 0) * high;
    let x = r * Math.sin(ph) * P.wideX, z = r * Math.cos(ph) - (P.pushZ || 0) * crown - (P.wholeZ || 0) * high;
    // top: dome (small v -- gathers to the crown)
    const top = sm(0.0, 0.22, v);
    x *= 0.25 + 0.75 * top; z *= 0.25 + 0.75 * top; y += (1 - top) * P.dome;
    // the hood tip at the back-top
    const back = Math.max(0, -Math.cos(ph));
    y += P.tipY * back * Math.exp(-Math.pow((v - P.tipV) / 0.10, 2));
    z -= P.tipZ * back * Math.exp(-Math.pow((v - P.tipV - 0.03) / 0.12, 2));
    /* pass 7: the upper part (in the head frame) turns by yaw about the vertical axis -- the opening shifts to one side
       relative to the head (the cloth has rotated on the head). When a symmetric narrow opening covered the back of the head on
       the near side in shot 1, the far side's brim stuck out of the face profile as a thin line (in the sample it is behind the face) -- the two brims separately. */
    const b = (P.yaw || 0) * high;
    if (b) { const c = Math.cos(b), s = Math.sin(b), x0 = x; x = x0 * c + z * s; z = -x0 * s + z * c; }
    /* eg: the upper part tilts forward about the head centre (shot 3: the head tilted 39 deg, the hood frame at the KF share
       only 14 deg -- the top of the head came out forward through the opening; in the sample the head is INSIDE the hood) */
    const eg = (P.eg || 0) * high;
    if (eg) { const c = Math.cos(eg), s = Math.sin(eg), y0 = y; y = y0 * c - z * s; z = y0 * s + z * c; }
    t.set(x, y, z);
  };
  const g = new ParametricGeometry(f, 96, 64);
  rotate(g);                          // so the outer surface is the front face (gl_FrontFacing)
  const uv = g.attributes.uv, n = uv.count, w = new Float32Array(n), edge = new Float32Array(n), pa = g.attributes.position;
  for (let i = 0; i < n; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    w[i] = sm(0.45, 0.80, v);           // head (hood frame) / torso blend weight
    /* aEdge: distance along the surface to the edge of the opening (units). The part of the inner surface far from the edge
       stays behind the head and the hood itself -- no light reaches it (in the sample: a lining band along the edge, a wedge inside) */
    /* pass 7: band width for each brim (bandA, bandB -- multipliers of BAND; per shot) at head height,
       under the chin bandAlt, bandBlt (blended with absent(v)): in the sample's shot 1 the far brim's lining from the face edge to the brim
       is ~14 px at L 43-45 (at 320, rows 40-95), ours was a 3 px band + a dark inside; under the chin the sample's cloak is dark
       (L 9-30) -- there is no band there */
    const tv = P.bandV ?? 0.7, yv = 1 - sm(tv - 0.04, tv + 0.04, v);   // bandV: the head-height band ends at this v (in shot 1 under the jaw v ~0.64)
    const tk = u < 0.5 ? (P.bandA ?? 1) * yv + (P.bandAlt ?? 1) * (1 - yv) : (P.bandB ?? 1) * yv + (P.bandBlt ?? 1) * (1 - yv);
    edge[i] = Math.min(u, 1 - u) * (2 * Math.PI - ehA(v) - ehB(v)) * Math.hypot(pa.getX(i), pa.getZ(i)) / Math.max(1e-3, tk);
  }
  g.setAttribute('bodyW', new THREE.BufferAttribute(w, 1));
  g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1));
  g.computeVertexNormals();
  return {g, f, eh};
}

function rotate(g) {                   // reverse the winding order of the triangles
  const ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  g.index.needsUpdate = true;
}

function cloakGeo(P = CLOTHES.cloak) {
  const f = (u, v, t) => {
    const ph = u * 2 * Math.PI, y = P.yHead - v * P.long;
    let r = P.r0 + P.rWide * Math.pow(v, 0.8) + (P.back || 0) * Math.max(0, -Math.cos(ph)) * Math.pow(v, 0.5);   // back hem
    r += (0.10 + 0.22 * v) * Math.sin(ph * 7 + v * 2.0) + 0.06 * Math.sin(ph * 13 + 1.3);
    t.set(r * Math.sin(ph), y, r * Math.cos(ph) * P.zRatio);
  };
  const g = new ParametricGeometry(f, 128, 48); rotate(g); g.computeVertexNormals();
  return g;
}

/* ---------- ASSEMBLY ---------- */
export function personaj() {
  const root = new THREE.Group(); root.rotation.y = Math.PI / 2;      // faces +x in the world
  const body = new THREE.Group(); root.add(body);
  const headPivot = new THREE.Group(); headPivot.position.set(0, -0.85, 0); body.add(headPivot);   // top of the neck
  const head = new THREE.Group(); head.position.set(0, 0.85, 0); headPivot.add(head);
  /* hood frame: follows the head's rotation only by the KF share. In the sample's shot 3 the head tilts INSIDE the hood
     and the hood stays in place; when rigidly attached the figure changed 2.3 times more than in the sample
     (pair difference 8.1 vs 3.6, audit 1). */
  const kPivot = new THREE.Group(); kPivot.position.set(0, -0.85, 0); body.add(kPivot);
  const kHead = new THREE.Group(); kHead.position.set(0, 0.85, 0); kPivot.add(kHead);

  const face = {openness: faceCanvas('openness'), half: faceCanvas('half'), closed: faceCanvas('closed')};
  const headG = headGeo(0), headG1 = headGeo(1);
  const headM = new THREE.Mesh(headG, new THREE.MeshBasicMaterial()); headM.userData = {role: 'skin', face};
  head.add(headM);
  /* profile weight (0..1) -- the near-eye map (eyeMap; main.js puts it into the uniforms), the geometry does not change.
     shift (0..1) -- the head geometry blends between two shapes (HEAD.shiftZ; only in the fast turn) */
  const pos0 = Float32Array.from(headG.attributes.position.array), pos1 = headG1.attributes.position.array;
  const nor0 = Float32Array.from(headG.attributes.normal.array), nor1 = headG1.attributes.normal.array;
  function profile(w) { HEAD.profileW = w; }  // near-eye map weight (main.js setEyeMap)
  let shiftCurrent = 0;
  function setShift(w) {
    if (Math.abs(w - shiftCurrent) < 1e-4) return;
    shiftCurrent = w; HEAD.shift = w;
    const pa = headG.attributes.position.array, na = headG.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { pa[i] = pos0[i] + w * (pos1[i] - pos0[i]); na[i] = nor0[i] + w * (nor1[i] - nor0[i]); }
    headG.attributes.position.needsUpdate = true; headG.attributes.normal.needsUpdate = true;
  }
  // hair cap: slightly larger than the head, with a hairline on the forehead
  const qg = new THREE.SphereGeometry(1.06, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const qp = qg.attributes.position;
  for (let i = 0; i < qp.count; i++) {        // hairline at the front: the cap sinks under the forehead (into the head) -- no fold/lip is left
    let x = qp.getX(i) / 1.06, y = qp.getY(i) / 1.06, z = qp.getZ(i) / 1.06;
    const draw = HAIR.capShell.c0 + HAIR.capShell.c1 * Math.pow(Math.abs(x), 1.5);   // hairline: low in the middle, high at the temples (pass 6; was 0.50 + 0.10|x|)
    const inner = sm(0.15, 0.45, z) * sm(draw + 0.12, draw - 0.02, y);   // 1 -- on the face side, below the line
    const r = 1.06 - 0.16 * inner;
    [x, y, z] = headShape(x * r, y * r, z * r);
    qp.setXYZ(i, x * 1.03, y * 1.02, z * 1.03);
  }
  qg.computeVertexNormals();
  const capShell = new THREE.Mesh(qg, new THREE.MeshBasicMaterial()); capShell.userData = {role: 'hairInner'}; head.add(capShell);   // inner hair layer -- darker

  /* torso: the body mass (cloak, base of the neck, lower part of the hood). The head stays in place (the camera composition
     is tied to the head), the torso may shift back/down and turn -- the neck joins the two. */
  const torso = new THREE.Group(); body.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 1.4, 32, 1, true), new THREE.MeshBasicMaterial());
  neck.userData = {role: 'neck'}; body.add(neck);
  const bA = new THREE.Vector3(), bB = new THREE.Vector3(), bY = new THREE.Vector3(0, 1, 0);
  function setNeck() {                     // neck: from under the head (the head pivot) to the torso's neck base
    bA.set(0, headPivot.position.y - 0.05, -0.12);
    bB.set(0, -2.15, -0.12); torso.updateMatrix(); bB.applyMatrix4(torso.matrix);
    const d = bA.clone().sub(bB), L = d.length();
    neck.position.copy(bA).add(bB).multiplyScalar(0.5);
    neck.quaternion.setFromUnitVectors(bY, d.normalize());
    neck.scale.set(1, L / 1.4, 1);
  }

  let K = hoodGeo();
  const hood = new THREE.Mesh(K.g, new THREE.MeshBasicMaterial({side: THREE.DoubleSide})); hood.userData = {role: 'hood', twoSide: true};
  root.add(hood);                                                   // vertices are blended every frame (hood frame / torso)
  let hoodRest = Float32Array.from(K.g.attributes.position.array);

  const cloak = new THREE.Mesh(cloakGeo(), new THREE.MeshBasicMaterial({side: THREE.DoubleSide})); cloak.userData = {role: 'cloak'};
  torso.add(cloak);

  function setTorso(G = CLOTHES.torso) { torso.position.set(0, G.dy, -G.dz); torso.rotation.set(0, G.yaw, 0); }
  setTorso();
  /* for fitting: rebuild the clothes with new parameters (only in checks/fitting; the material does not change) */
  function buildClothes(fresh) {
    for (const k of ['hood', 'cloak', 'torso', 'hoodPose']) if (fresh[k]) Object.assign(CLOTHES[k], fresh[k]);
    const old = K.g; K = hoodGeo(); hood.geometry = K.g; hoodRest = Float32Array.from(K.g.attributes.position.array); old.dispose(); hoodKey = null;
    const ep = cloak.geometry; cloak.geometry = cloakGeo(); ep.dispose();
    /* child meshes (the style outline -- an inverted shell, main.js) get the new geometry too: otherwise the old (disposed)
       geometry stays in a frozen pose -- in pass 7, in shot 1, it showed up as a big black "curtain" to the right of the neck
       (the "far-side inner face" in the pass 6 ?clothes= tests was the same thing) */
    for (const c of hood.children) c.geometry = hood.geometry;
    for (const c of cloak.children) c.geometry = cloak.geometry;
    setTorso(); pose(state);
  }

  // hair strands -- in world space (physics), added to the scene separately
  const NS = 18, NR = 7;
  const strands = strandsDesign().map(t => {
    const g = bandGeo(NS, NR); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); m.userData = {role: 'hair'};
    m.frustumCulled = false;
    return {...t, m, g, p: null, q: null};
  });

  const state = {tilt: 0, turn: 0, sideways: 0, closed: 0, sink: 0};
  const KF = +(new URLSearchParams(location.search).get('kf') || 0.35), KT = +(new URLSearchParams(location.search).get('kt') || 0.8);
  const _c = new THREE.Vector3(), _r = new THREE.Vector3();
  const tmp = new THREE.Vector3(), M = new THREE.Matrix4(), Mt = new THREE.Matrix4();

  /* Pass 9: THE HOOD FOLLOWS OVER TIME (cloth inertia). In passes 7-8 it was per shot: the pose at the start of the shot
     (hood0) and a share within the shot (kfInner, 0.2 in shot 1) -- a shot-dependent value (camera test: a jump where the key
     switches). Now the frame's target is KF x head rotation and the frame approaches it with time constant tau: in the fast
     turn (shot 1, 10-11) it lags behind, in a still pose it catches up; at the start of a shot it is at rest (just as the hair is
     run in advance). The upper part's tilt comes from the pose: eg + pitchK x tilt (not the camera). */
  /* pass 9 (2c): HOOD -- CORRECTIVE SHAPES IN POSE SPACE (the 3D rig method: the shape comes from the joint angle, not from the
     camera). A single rigid hood fitted to the three shots together matches the mass (figure 0.93/0.87/0.88), but the opening
     covered the face in shot 2 (visible head IoU 0.13, area 0.16) -- in the sample the cloth lies differently in each pose. The cloth
     size (r0, long, dome, tip...) is ONE; its placement (opening, crown and upper-part shift/turn, lining band) depends on the head
     pose (tilt, turn): between the key poses it blends smoothly with Gaussian weights (CLOTHES.hoodPose).
     In the camera test (pose held) it does not change; when the head moves it changes smoothly, together with the hood. */
  const hoodR = {tilt: 0, turn: 0, sideways: 0}, hoodP = {tilt: 0, turn: 0};
  let hasHoodR = false, hoodKey = null;
  /* the cloth placement is not instantaneous either: the blend comes from a LAGGED pose (tauD, s) -- in the fast turn at shot 1 10->11 (60 ms)
     the opening widened sharply and the figure scale jumped to 1.08 (sample 0.985) */
  function hoodDeform() {
    const KP = CLOTHES.hoodPose; if (!KP || !KP.key || !KP.key.length) return {};
    const se = KP.sigmaE || 0.25, sb = KP.sigmaB || 0.25;
    const w = KP.key.map(k => Math.exp(-0.5 * ((hoodP.tilt - k.p[0]) / se) ** 2 - 0.5 * ((hoodP.turn - k.p[1]) / sb) ** 2));
    const S = w.reduce((a, b) => a + b, 0) || 1, out = {};
    for (const nm of Object.keys(KP.key[0].d)) out[nm] = KP.key.reduce((a, k, i) => a + w[i] / S * (k.d[nm] ?? CLOTHES.hood[nm] ?? 0), 0);
    return out;
  }
  function hoodRestarts(D) {
    const old = K.g; K = hoodGeo({...CLOTHES.hood, ...D}); hood.geometry = K.g; hoodRest = Float32Array.from(K.g.attributes.position.array); old.dispose();
    for (const c of hood.children) c.geometry = hood.geometry;
  }
  function hoodStep(dt, start) {
    const tau = CLOTHES.hood.tau || 0, a = start || !hasHoodR || tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
    for (const k of ['tilt', 'turn', 'sideways']) hoodR[k] += (KF * (state[k] || 0) - hoodR[k]) * a;
    const tauD = CLOTHES.hood.tauD || 0, aD = start || !hasHoodR || tauD <= 0 ? 1 : 1 - Math.exp(-dt / tauD);
    for (const k of ['tilt', 'turn']) hoodP[k] += ((state[k] || 0) - hoodP[k]) * aD;
    hasHoodR = true;
    const D = hoodDeform(), key = JSON.stringify(D, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v);
    if (key !== hoodKey) { hoodKey = key; hoodRestarts(D); }
    pose(state);
  }
  function pose(h) {
    Object.assign(state, h);
    headPivot.rotation.set(state.tilt, state.turn, state.sideways);
    headPivot.position.y = -0.85 + (state.sink || 0);
    headPivot.position.z = -(state.backward || 0);                 // the head shifting back (into the hood)
    /* hood frame: the KF share of the rotation, the KT share of the head centre's shift -- the hood, resting on the crown,
       sinks with the head, but the head tilts inside it (sample shot 3). Without KT the head would drop down out of the
       opening (tilt + sink, audit 2). */
    /* Pass 9: the frame rotation -- the state kept by hoodStep (over time); if there has been no step yet, KF x pose */
    const kf = k => hasHoodR ? hoodR[k] : KF * (state[k] || 0);
    kPivot.rotation.set(kf('tilt'), kf('turn'), kf('sideways'));
    headPivot.updateMatrix(); _c.set(0, 0.85, 0).applyMatrix4(headPivot.matrix);          // head centre (in body space)
    kPivot.updateMatrix(); _r.set(0, 0.85, 0).applyEuler(kPivot.rotation);
    kPivot.position.copy(_c).multiplyScalar(KT).sub(_r);                                   // kHead = KT * head centre
    root.updateMatrixWorld(true);
    // hood: its top moves with the hood frame (partly follows the head), its bottom with the body (linear blend)
    setNeck();
    M.copy(kHead.matrixWorld); Mt.copy(torso.matrixWorld);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const Mb = new THREE.Matrix4().multiplyMatrices(inv, M).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0));
    const Mtl = new THREE.Matrix4().multiplyMatrices(inv, Mt);
    const pa = K.g.attributes.position, w = K.g.attributes.bodyW;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) {
      a.set(hoodRest[i * 3], hoodRest[i * 3 + 1], hoodRest[i * 3 + 2]); b.copy(a);
      a.applyMatrix4(Mb); b.applyMatrix4(Mtl);
      const t = w.getX(i); pa.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }
    pa.needsUpdate = true; K.g.computeVertexNormals();
  }

  /* hair physics: dt -- the duration of a film frame; inside it, fixed DT_INNER steps (the same physics whether the film
     runs at 60 ms or at 24 fps). The constants were tuned at a 1/24 s step (DT_REF): they are recomputed per step -- the
     speed of the pull toward the rest state and the equilibrium sag (gravity/wind) are preserved. start -- frame 0: the hair
     is run in advance for PRE seconds in that pose (audit 1: on held frames the tips kept "settling down", 18.9 -> 3.0 px). */
  const DT_REF = 1 / 24, DT_INNER = 1 / 120, PRE = 2.0;
  const centre = new THREE.Vector3(), _grav = new THREE.Vector3(0, -1, 0), _sh = new THREE.Vector3(), _sg = new THREE.Vector3();
  /* the rest chain bends toward GRAVITY and the WIND (pass 6): segment direction = rest direction (with the head) +
     swing * f * down (world) + shK * f * wind/1.7 (world; in the sample the snow moves right-and-up, +1,-1 px/frame -- the wind
     blows toward the character's front), f -- 0..1 along the strand. Length is preserved. The spring now pulls toward this bent
     shape: when the head tilts, the hair hangs in the world (it does not stay frozen in head space), flies forward in the wind
     and moves even on held frames. */
  /* shift (lower face forward, shot 1, 7..11): the near strands move together with the face -- otherwise the shifted cheek
     covered their lower part and the hair looked "cut off" (skin behind the eye 19..21 px, sample 5..7) */
  const shiftZ = y => HEAD.shiftZ * HEAD.shift * sm(-0.15, -0.83, y);
  function tiltedRest(t, M2, wind) {
    const rest = t.rest.map(p => new THREE.Vector3(p[0], p[1], p[2] + (t.withShift ? shiftZ(p[1]) : 0)).applyMatrix4(M2));
    const os = t.swing !== undefined ? t.swing : HAIR.physics.swing, sk = t.shK !== undefined ? t.shK : HAIR.physics.shK;
    if (!os && !sk) return rest;
    _sh.set(wind[0], wind[1], wind[2]).multiplyScalar(1 / 1.7);
    const n = rest.length - 1, out = [rest[0]];
    for (let i = 1; i <= n; i++) {
      _sg.copy(rest[i]).sub(rest[i - 1]); const l = _sg.length(); _sg.multiplyScalar(1 / (l || 1));
      const f = i / n;
      _sg.addScaledVector(_grav, os * f).addScaledVector(_sh, sk * f).normalize();
      out.push(out[i - 1].clone().addScaledVector(_sg, l));
    }
    return out;
  }
  function stepInner(wind) {
    const r = DT_INNER / DT_REF, di = Math.pow(0.86, r);
    const M2 = head.matrixWorld, sk = new THREE.Vector3().setFromMatrixScale(M2).x;
    centre.set(0, 0, 0).applyMatrix4(M2);
    for (const t of strands) {
      const rest = tiltedRest(t, M2, wind);
      const L = []; for (let i = 1; i < t.rest.length; i++) L.push(new THREE.Vector3(...t.rest[i]).distanceTo(new THREE.Vector3(...t.rest[i - 1])) * sk);
      t.p[0].copy(rest[0]); t.q[0].copy(rest[0]);
      for (let i = 1; i < t.p.length; i++) {
        const p = t.p[i], q = t.q[i], v = tmp.copy(p).sub(q).multiplyScalar(di);    // drag
        q.copy(p);
        const k = 0.30 * (1 - 0.45 * i / t.p.length), ki = 1 - Math.pow(1 - k, r);  // softer toward the tip
        const s = (DT_REF * DT_REF / k) * ki;                                        // keep the equilibrium sag
        p.add(v).addScaledVector(rest[i].clone().sub(p), ki);
        const sf = t.shF ?? 1;                                                        // pass 9: the group's sensitivity to wind (physics)
        p.x += wind[0] * s * i * sf; p.y += (wind[1] * sf - 2.0) * s * i; p.z += wind[2] * s * i * sf;
      }
      for (let it = 0; it < 3; it++) for (let i = 1; i < t.p.length; i++) {
        const a = t.p[i - 1], b = t.p[i], d = tmp.copy(b).sub(a), l = d.length() || 1e-6;
        b.copy(a).addScaledVector(d, L[i - 1] / l);
        const c = tmp.copy(b).sub(centre), cl = c.length();
        if (cl < 1.04 * sk) b.copy(centre).addScaledVector(c, 1.04 * sk / cl);
      }
    }
  }
  function physics(dt, wind, start = false) {
    head.updateMatrixWorld(true);
    if (start || !strands[0].p) {
      const M2 = head.matrixWorld;
      for (const t of strands) { const rest = tiltedRest(t, M2, wind); t.p = rest.map(v => v.clone()); t.q = rest.map(v => v.clone()); }
      for (let k = 0; k < Math.round(PRE / DT_INNER); k++) stepInner(wind);
    }
    const n = Math.max(1, Math.round(dt / DT_INNER));
    for (let k = 0; k < n; k++) stepInner(wind);
  }

  const _mn = new THREE.Vector3(), _mt = new THREE.Vector3(), _mc = new THREE.Vector3();
  function strandGeometry() {
    const radial = new THREE.Vector3(), T = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
    _mc.set(0, MN.dy, 0).applyMatrix4(head.matrixWorld);          // mass centre: MN.dy above the head centre
    for (const t of strands) {
      const cur = new THREE.CatmullRomCurve3(t.p, false, 'centripetal');
      const pos = t.g.attributes.position;
      for (let i = 0; i <= NS; i++) {
        const u = i / NS, c = cur.getPointAt(u); cur.getTangentAt(u, T);
        radial.copy(c).sub(centre).normalize();
        B.crossVectors(T, radial).normalize(); N.crossVectors(B, T).normalize();
        const en = (t.widthW || t.en) * Math.pow(1 - u, 1.15) * (0.70 + 0.55 * Math.sin(Math.min(1, u * 2.5) * Math.PI / 2));
        const ql = en * 0.45;
        for (let j = 0; j < NR; j++) {
          const a = (j / NR) * Math.PI * 2;
          const x = Math.cos(a) * en * 0.5, y = Math.sin(a) * ql * 0.5 + ql * 0.25;   // thicker toward the outside
          pos.setXYZ(i * NR + j, c.x + B.x * x + N.x * y, c.y + B.y * x + N.y * y, c.z + B.z * x + N.z * y);
        }
      }
      pos.needsUpdate = true; t.g.computeVertexNormals(); t.g.computeBoundingSphere();
      /* MASS NORMAL (pass 6): the hair is lit as a single volume -- the normal is radial from a centre a little above the head
         (share MN.k) + the strand's own normal. Only for shading (aHairN); the outline uses the strand's own normal.
         In the sample the hair is a broad bright mass with thin dark lines in between; the tube's own normal showed every
         strand as a "fingernail", half lit and half in shadow. */
      const nr = t.g.attributes.normal, sn = t.g.attributes.aHairN;
      for (let v = 0; v < pos.count; v++) {
        _mn.set(pos.getX(v), pos.getY(v), pos.getZ(v)).sub(_mc).normalize().multiplyScalar(MN.k)
          .add(_mt.set(nr.getX(v), nr.getY(v), nr.getZ(v)).multiplyScalar(1 - MN.k)).normalize();
        sn.setXYZ(v, _mn.x, _mn.y, _mn.z);
      }
      sn.needsUpdate = true;
    }
  }

  return {root, body, head, headPivot, strands, state, pose, hoodStep, physics, strandGeometry, buildClothes, hood, cloak, kHead, profile, setShift,
          headMesh: headM, meshes: () => [headM, capShell, neck, hood, cloak, ...strands.map(t => t.m)]};
}
