/* HEAD -- WITH ALL PARTS, THREE SHOTS EQUAL (pass 10). The user: "when you measure the head down to the mouth, do not leave
   out the chin; take the hair and the hood off and measure them one by one". The pass 9 fit (test/fit_head9.mjs) had almost
   no chin or jaw in it: in shot 1, one row of the chin's front edge; in shot 2, 3 points under the jaw (at the weight of 2
   frames); in shot 3, 2 columns under the jaw; the weight went by screen time (shot 1 11 / 22). Result (test/parts/compare.py):
   in shot 1 the jaw is up to 17 px too low toward the ear, in shot 2 the chin is 6 px low, in shot 3 10 px low.
   Here the targets are the sample's PARTS (test/parts/part_measure.py, every frame; private/test/parts/sample_part.json -- taken
   from the sample, not in the public repo): the eyes, near brow, mouth, lip shadow (centre of the dark blob -- on ours an
   exact point + the tool's offset, measured on our bare render), nose tip and chin tip (edge rule -- on the model the same
   rule applied to the silhouette), the UNDER-JAW TRACE (each column) and the CONTOUR (each row) -- against the model
   silhouette (projection of head-surface points, the outermost per column/row). The shot 2 eye is left out (profile eye --
   the sample's 2D trick, a residual). Weight: each SHOT equal (1/3), frames equal within a shot, within a frame each point 1,
   jaw trace 3, contour 2 (mean square of the traces).
   Parameters: lower face and jaw sections (HEAD) + each pose (shot 1: 1-6 as one, 7, 8, 9, 10, 11; shot 2: one
   tilt/turn/sideways; shot 3: one tilt/turn added on top of the table). Cameras fixed.
   node test/fit_head10.mjs [--iter 400] [--check] [--score-only] */
import {HEAD, FACE, partPoints, headShape} from '../src/personaj.js';
import {FILMS} from '../src/film.js';
import {projector, headMatrix, getCamera} from './projection.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, ITER = +arg('iter', 400), WEIGHT = arg('weight', 'equal');   // equal: each shot 1/3; frame: screen time (11/2/9); shot1: only shot 1, with a no-worsening penalty on shots 2 and 3
const SAMPLE = JSON.parse(readFileSync(ROOT + 'private/test/parts/sample_part.json'));
const M22 = FILMS.sample22.shotList;
/* the tool's offset: centre of the dark blob - exact point (on our bare render, test/parts/part_measure.py): */
const OFS = {eye_openness: [-1.6, -3.7], eye_closed: [-1.3, -0.8], far_openness: [-2.1, -3.4], brow: [-0.25, -1.2], mouth: [-2.5, -0.5], lip: [-1.9, -0.4]};
const GROUP = k => k <= 9 ? 'a' : k === 10 ? 'b' : k === 11 ? 'c' : k <= 13 ? 'd' : 'e';
const CHIN = {a: [0.45, 0.89], b: [0.45, 0.89], c: [0.45, 0.89], d: [0.71, 0.71], e: [-0.35, 0.94]};
const NOSE = {b: [52, 76], c: [54, 80], d: [80, 97]};
const IZ = {a: {jaw: [86, 128], cont: [60, 104]}, b: {jaw: [96, 138], cont: [60, 104]}, c: {jaw: [98, 142], cont: [62, 108]},
            d: {jaw: [146, 158], cont: [84, 110]}, e: {jaw: [132, 168], cont: [140, 156]}};

const FRAME = [];                                          // {k, s (shot 0..2), i, cam, h0}
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) FRAME.push({k, si, i, cam: s.camera, h0: s.pose(i)}); }); }

/* head-surface points -- the FULL azimuth (-pi..pi): in shot 1 the under-jaw trace comes from the middle of the head (z -0.1..0.5,
   the flat part under the jaw) -- with only the front side the model trace came out 1.5..2.7 px above the render scan (--check).
   Lower half (al -pi/2 .. 0.35), in fine layers; Float64Array -- fast projection (one 4x4 matrix). */
let SURFACE = null;
const buildSurface = () => {
  const NA = 150, NP = 300, S = new Float64Array((NA + 1) * NP * 3); let n = 0;
  for (let j = 0; j <= NA; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / NA;
    for (let i = 0; i < NP; i++) { const ph = -Math.PI + 2 * Math.PI * i / NP, q = headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true); S[n++] = q[0]; S[n++] = q[1]; S[n++] = q[2]; } }
  SURFACE = S;
};
function fastProjector(cam, pose) {
  const M = headMatrix(pose), c = getCamera(cam), e = new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse).multiply(M).elements;
  return (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / w + 1) * 160, (1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w) * 90]; };
}
function traces(S, tp) {
  const jaw = new Map(), cont = new Map();
  for (let n = 0; n < S.length; n += 3) { const [x, y] = tp(S[n], S[n + 1], S[n + 2]); const c = Math.floor(x), r = Math.floor(y);
    if (!(jaw.get(c) >= y)) jaw.set(c, y); if (!(cont.get(r) >= x)) cont.set(r, x); }
  return {jaw, cont};
}
/* on the model side, with the sample's rule: trace value = silhouette - 1.0 -- in the render row j is skin if its centre (j + 0.5)
   is inside the silhouette: last row = floor(y_b - 0.5), on average y_b - 1.0 (--check: with -0.5 the model trace was +0.6..+0.9 px) */
function modelFrame(K, h) {
  const p = projector(K.cam, h), g = GROUP(K.k), N = QN[h.closed > 0.5 ? 1 : 0], iz = traces(SURFACE, fastProjector(K.cam, h));
  const jaw = {}, cont = {};
  for (let c = IZ[g].jaw[0]; c <= IZ[g].jaw[1]; c++) if (iz.jaw.has(c)) jaw[c] = iz.jaw.get(c) - 1.0;
  for (let r = IZ[g].cont[0]; r <= IZ[g].cont[1]; r++) if (iz.cont.has(r)) cont[r] = iz.cont.get(r) - 1.0;
  const P = n => p(N[n][0]);
  const o = {jaw, cont, point: {}};
  const isClosed = h.closed > 0.5, ko = isClosed ? OFS.eye_closed : OFS.eye_openness;
  o.point.eye_near = P('eye_near').map((v, j) => v + ko[j]);
  o.point.eye_far = P('eye_far').map((v, j) => v + (isClosed ? OFS.eye_closed : OFS.far_openness)[j]);
  o.point.brow_near = P('brow_near_mid').map((v, j) => v + OFS.brow[j]);
  o.point.mouth = P('mouth').map((v, j) => v + OFS.mouth[j]);
  o.point.lip = P('lip_shadow').map((v, j) => v + OFS.lip[j]);
  const jp = Object.entries(jaw).map(([c, y]) => [+c, y]);                 // chin tip -- the end of the jaw trace in the shot's direction
  if (jp.length) { const [dx, dy] = CHIN[g], s = jp.map(([x, y]) => x * dx + y * dy), m = Math.max(...s), sel = jp.filter((_, j) => s[j] >= m - 1);
    o.point.chin_tip = [sel.reduce((a, t) => a + t[0], 0) / sel.length, sel.reduce((a, t) => a + t[1], 0) / sel.length]; }
  if (NOSE[g]) { const [a, b] = NOSE[g], kk = Object.entries(cont).filter(([r]) => +r >= a && +r <= b);   // nose tip -- the rightmost among the contour rows
    if (kk.length) { const m = Math.max(...kk.map(t => t[1])), yy = kk.filter(t => t[1] >= m - 0.5).map(t => +t[0]); o.point.nose_tip = [m, yy.reduce((a, t) => a + t, 0) / yy.length]; } }
  return o;
}
/* the sample's targets */
function target(k) {
  const m = SAMPLE[k], g = GROUP(k), o = {point: {}, jaw: {}, cont: {}};
  for (const q of ['eye_near', 'eye_far', 'brow_near', 'mouth', 'lip']) if (m[q]) o.point[q] = [m[q].x, m[q].y];
  if (g === 'd') delete o.point.eye_near;                  // profile eye -- left out of the fit (the sample's 2D trick)
  if (m.chin_tip) o.point.chin_tip = m.chin_tip;
  if (m.nose_tip && NOSE[g]) o.point.nose_tip = m.nose_tip;
  for (const [c, y] of Object.entries(m.jaw || {})) if (+c >= IZ[g].jaw[0] && +c <= IZ[g].jaw[1]) o.jaw[c] = y;
  for (const [r, x] of Object.entries(m.contour || {})) if (+r >= IZ[g].cont[0] && +r <= IZ[g].cont[1]) o.cont[r] = x;
  return o;
}
const TARGET = Object.fromEntries(FRAME.map(K => [K.k, target(K.k)]));
function error(K, h, detailed = false) {
  const md = modelFrame(K, h), n = TARGET[K.k]; let e = 0, w = 0; const d = {};
  for (const [q, t] of Object.entries(n.point)) { const v = md.point[q]; if (!v) continue; const r = (v[0] - t[0]) ** 2 + (v[1] - t[1]) ** 2; e += r; w += 1; if (detailed) d[q] = [+(v[0] - t[0]).toFixed(1), +(v[1] - t[1]).toFixed(1)]; }
  for (const [nm, wt] of [['jaw', 3], ['cont', 2]]) {
    const ks = Object.keys(n[nm]).filter(c => md[nm][c] !== undefined); if (!ks.length) continue;
    const f = ks.map(c => md[nm][c] - n[nm][c]); e += wt * f.reduce((a, t) => a + t * t, 0) / f.length; w += wt;
    if (detailed) d[nm] = {mid: +(f.reduce((a, t) => a + t, 0) / f.length).toFixed(2), rms: +Math.sqrt(f.reduce((a, t) => a + t * t, 0) / f.length).toFixed(2), min: +Math.min(...f).toFixed(1), max: +Math.max(...f).toFixed(1)};
  }
  return detailed ? {e: w ? e / w : 0, d} : (w ? e / w : 0);
}
function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f), optimum = Infinity, stall = 0;
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    if (F[0] < optimum - 1e-4) { optimum = F[0]; stall = 0; } else if (++stall > 40) break;        // stops after 40 steps without improvement
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}
/* poses: shot 1 groups [1-6], 7, 8, 9, 10, 11 -- (tilt, turn); shot 2 -- (tilt, turn, sideways) added;
   shot 3 -- (tilt, turn) added to the whole table */
const PG = [{ks: [1, 2, 3, 4, 5, 6]}, {ks: [7]}, {ks: [8]}, {ks: [9]}, {ks: [10]}, {ks: [11]}, {ks: [12, 13], tip: true}, {ks: [14, 15, 16, 17, 18, 19, 20, 21, 22]}];
PG.forEach(g => { g.x = g.tip ? [0, 0, 0] : [0, 0]; });
const getPose = (K, x) => ({...K.h0, tilt: K.h0.tilt + x[0], turn: K.h0.turn + x[1], sideways: (K.h0.sideways || 0) + (x[2] || 0)});
function poses(it = 50, detailed = false) {
  const shot = [[], [], []], count = {};
  for (const g of PG) {
    const Ks = g.ks.map(k => FRAME[k - 1]);
    /* pose penalty: (x / 0.04)^2 (in px^2) -- in the first fit without a penalty the shot 2 and 3 turn ran to the bound (+0.30 rad,
       17 deg): with only lower-face targets the pose "swallowed" the shape difference (the top of the head, the hair and the hood
       are not in this fit -- they were fitted to the previous pose); test/head10_fit_free_pose.json */
    const f = x => Ks.reduce((a, K) => a + error(K, getPose(K, x)), 0) / Ks.length + (x[0] / 0.04) ** 2 + (x[1] / 0.04) ** 2 + (g.tip ? (x[2] / 0.03) ** 2 : 0);
    const layers = process.argv.includes('--pose23-strict') && g.ks[0] >= 12;     // the shot 2 and 3 pose does not change (the one from earlier fits)
    const r = layers ? {x: g.x.map(() => 0)} : nelder(f, g.x, g.tip ? [0.02, 0.02, 0.02] : [0.02, 0.02], it, g.tip ? [-0.3, -0.3, -0.2] : [-0.3, -0.3], g.tip ? [0.3, 0.3, 0.2] : [0.3, 0.3]);
    g.x = r.x;
    for (const K of Ks) { const e = error(K, getPose(K, g.x), detailed); shot[K.si].push(detailed ? e.e : e); if (detailed) count[K.k] = e.d; }
  }
  const S = shot.map(v => v.reduce((a, t) => a + t, 0) / v.length);
  const total = WEIGHT === 'frame' ? Math.sqrt(shot.flat().reduce((a, t) => a + t, 0) / 22) : WEIGHT === 'shot1' ? Math.sqrt(S[0]) : Math.sqrt(S.reduce((a, t) => a + t, 0) / 3);
  /* no shot may get worse than at the start: penalty 10 x (S - S0)^2 (px^2) -- with equal weights the shot 1 chin went 6 px up
     for the sake of the shot 2 and 3 chin (test/head10_fit_penalized.json): in shot 2 the sample draws the profile face ~20 %
     small relative to the head (pass 8: d 12.88 for the face, 10.32 for the silhouette) -- one rigid head cannot give it fully */
  const layers = S0 && !process.argv.includes('--no-penalty') ? S.reduce((a, t, i) => a + 10 * Math.max(0, t - S0[i]) ** 2, 0) : 0;
  return detailed ? {total, shot: S.map(v => +Math.sqrt(v).toFixed(3)), count, pose: PG.map(g => ({ks: g.ks, x: g.x.map(v => +v.toFixed(4))}))} : Math.sqrt(total * total + layers / 3);
}

const SHAPE = [['chinY', -1.35, -0.95], ['chinZ', 0.75, 1.05], ['chinW', 0.08, 0.35], ['jawBack', 0.3, 0.95], ['jawBack2', -0.7, 0.6],
               ['jawBack1', -0.9, 0.3], ['mouthW', 0.35, 0.75], ['mouthZ', 0.85, 1.15], ['mouthP', 1.3, 2.8], ['jawP', 1.3, 2.8], ['cover', 0.02, 0.2]];
const ORIG = Object.fromEntries(SHAPE.map(([n]) => [n, HEAD[n]]));
const START = arg('start', null) ? JSON.parse(arg('start')) : null;     // --start '{"chinY":...}' -- from this shape (from a stopped fit)
let QN = null;                                            // part points (open, closed) -- once per shape change
const place = x => { SHAPE.forEach(([n], i) => { HEAD[n] = x[i]; }); buildSurface(); QN = [partPoints(false), partPoints(true)]; };
HEAD.shift = 0; HEAD.profileW = 0;
place(SHAPE.map(([n]) => ORIG[n]));

if (process.argv.includes('--check')) {
  /* model traces (node silhouette) -- against the scan of our bare role render (private/test/parts/compare_TAG.json 'ours') */
  const T = JSON.parse(readFileSync(ROOT + 'private/test/parts/compare_world9b.json'));
  for (const K of FRAME) {
    const md = modelFrame(K, K.h0), t = T[K.k];
    const f = nm => { const a = t[nm === 'cont' ? 'contour' : 'jaw']; if (!a) return '-'; const ks = Object.keys(a.ours).filter(c => md[nm][c] !== undefined);
      const d = ks.map(c => md[nm][c] - a.ours[c]); return ks.length ? `${ks.length} pts, mean ${(d.reduce((x, y) => x + y, 0) / d.length).toFixed(2)}, |max| ${Math.max(...d.map(Math.abs)).toFixed(2)}` : '-'; };
    const iy = t.chin_tip ? md.point.chin_tip.map((v, j) => (v - t.chin_tip.ours[j]).toFixed(2)) : '-';
    console.log(`k${K.k}: jaw (node - role scan) ${f('jaw')} | contour ${f('cont')} | chin tip ${iy}`);
  }
  process.exit(0);
}
let S0 = null;
const b0 = (poses(80), poses(80), poses(40, true));
S0 = b0.shot.map(v => v * v);
console.log("INITIAL (current head, poses fitted again): total RMS", b0.total.toFixed(3), 'shot', JSON.stringify(b0.shot));
if (!process.argv.includes('--score-only')) {
  let n = 0;
  const f = x => { place(x); const v = poses(25); if (++n % 10 === 0) console.log(`  ${n}: ${v.toFixed(3)} ${x.map(t => t.toFixed(3)).join(' ')}`); return v; };
  const x0 = SHAPE.map(([nn]) => START && START[nn] !== undefined ? START[nn] : ORIG[nn]);
  const r = ITER > 0 ? nelder(f, x0, SHAPE.map(([, a, b]) => 0.1 * (b - a)), ITER, SHAPE.map(t => t[1]), SHAPE.map(t => t[2])) : {x: x0};
  /* the NM stop condition (1e-7) is never reached because of the noise of the inner pose fit -- 150+ scores sat at the same 3.712 (stopped by hand) */
  place(r.x); poses(80); poses(80); const b1 = poses(40, true);
  const shape = Object.fromEntries(SHAPE.map(([nn], i) => [nn, +r.x[i].toFixed(4)]));
  console.log('FITTED shape:', JSON.stringify(shape), '-> total RMS', b1.total.toFixed(3), 'shot', JSON.stringify(b1.shot));
  writeFileSync(ROOT + arg('out', 'test/head10_fit.json'), JSON.stringify({orig: ORIG, initial: b0, shape, result: b1}, null, 1));
} else {
  console.log(JSON.stringify(b0.count));
}
