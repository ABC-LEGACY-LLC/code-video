/* FACE SCORE (pass 11) -- shared by test/fit_pose11.mjs and test/fit_pose11b.mjs: human-mark targets
   (private/test/parts/human/target_fit_11.json, PRIVATE), the model side in node (no render). Details -- at the start of fit_pose11.mjs. */
import {HEAD, partPoints, headShape} from '../src/personaj.js';
import {FILMS} from '../src/film.js';
import {projector, headMatrix, getCamera} from './projection.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const RATIO = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/target_fit_11.json'));
const M22 = FILMS.sample22.shotList;
const CHIN = {2: [0.71, 0.71], 3: [0, 1]};
const W = {chin: 2, eye_near: 1, eye_far: 1, nose: 1, mouth: 1, brow_near: 0.3};
const NAME = {eye_near: 'eye_near', eye_far: 'eye_far', nose: 'nose_tip', mouth: 'mouth', brow_near: 'brow_near_mid'};
HEAD.shift = 0; HEAD.profileW = 0;

let SURFACE = null;
{ const NA = 150, NP = 300, S = new Float64Array((NA + 1) * NP * 3); let n = 0;
  for (let j = 0; j <= NA; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / NA;
    for (let i = 0; i < NP; i++) { const ph = -Math.PI + 2 * Math.PI * i / NP, q = headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true); S[n++] = q[0]; S[n++] = q[1]; S[n++] = q[2]; } }
  SURFACE = S; }
const QN = [partPoints(false), partPoints(true)];
function fastProjector(cam, pose) {
  const M = headMatrix(pose), c = getCamera(cam), e = new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse).multiply(M).elements;
  return (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / w + 1) * 160, (1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w) * 90]; };
}
function traces(tp) {
  const jaw = new Map(), cont = new Map();
  for (let n = 0; n < SURFACE.length; n += 3) { const [x, y] = tp(SURFACE[n], SURFACE[n + 1], SURFACE[n + 2]); const c = Math.floor(x), r = Math.floor(y);
    if (!(jaw.get(c) >= y)) jaw.set(c, y); if (!(cont.get(r) >= x)) cont.set(r, x); }
  return {jaw, cont};
}

export const FRAME = [];
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) FRAME.push({k, shot: si + 1, i, cam: s.camera, h0: s.pose(i)}); }); }

export function model(K, h, cam) {
  const p = projector(cam, h), N = QN[h.closed > 0.5 ? 1 : 0], iz = traces(fastProjector(cam, h));
  const o = {point: {}, jaw: {}, cont: {}};
  for (const [q, nm] of Object.entries(NAME)) { const v = p(N[nm][0]); o.point[q] = [v[0] - 0.5, v[1] - 0.5]; }
  const jp = [...iz.jaw.entries()].filter(([c]) => c >= 100 && c <= 200).map(([c, y]) => [c, y - 1.0]);
  if (jp.length) {
    const [dx, dy] = CHIN[K.shot], s = jp.map(([x, y]) => x * dx + y * dy), m = Math.max(...s), sel = jp.filter((_, j) => s[j] >= m - 1);
    const ix = sel.reduce((a, t) => a + t[0], 0) / sel.length, iy = sel.reduce((a, t) => a + t[1], 0) / sel.length;
    o.point.chin = [ix, iy];
    for (const [c, y] of jp) if (c <= ix + 0.5) o.jaw[c] = y;
  }
  for (const [r, x] of iz.cont.entries()) o.cont[r] = x - 1.0;
  return o;
}
export function error(K, h, cam, detailed = false) {
  const md = model(K, h, cam), t = RATIO[K.k]; let e = 0, w = 0; const d = {};
  for (const [q, v] of Object.entries(t.point)) { const m = md.point[q]; if (!m) continue;
    const r = (m[0] - v[0]) ** 2 + (m[1] - v[1]) ** 2; e += W[q] * r; w += W[q]; if (detailed) d[q] = [+(m[0] - v[0]).toFixed(1), +(m[1] - v[1]).toFixed(1)]; }
  for (const [nm, key, wt] of [['jaw', 'jaw', 2], ['cont', 'contour', 1]]) {
    const T = t[key] || {}, ks = Object.keys(T).filter(c => md[nm][+c] !== undefined); if (ks.length < 3) continue;
    const f = ks.map(c => md[nm][+c] - T[c]); e += wt * f.reduce((a, x) => a + x * x, 0) / f.length; w += wt;
    if (detailed) d[nm] = {mid: +(f.reduce((a, x) => a + x, 0) / f.length).toFixed(2), rms: +Math.sqrt(f.reduce((a, x) => a + x * x, 0) / f.length).toFixed(2), n: f.length};
  }
  return detailed ? {e: w ? e / w : 0, d} : (w ? e / w : 0);
}
export function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f), optimum = Infinity, stall = 0;
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    if (F[0] < optimum - 1e-4) { optimum = F[0]; stall = 0; } else if (++stall > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}

export function check() {        // model side (node) == 'ours' (render/3D) in target_TAG.json ?
  const NB = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/target_head10c.json'));
  for (const K of FRAME.filter(K => K.shot >= 2)) { const md = model(K, K.h0, K.cam), b = NB[K.k];
    const r = Object.keys(W).map(q => b[q] && b[q].ours && md.point[q] ? `${q} ${(md.point[q][0] - b[q].ours[0]).toFixed(2)},${(md.point[q][1] - b[q].ours[1]).toFixed(2)}` : '').filter(Boolean);
    const bj = b.jaw.ours, js = Object.keys(bj).filter(c => md.jaw[+c] !== undefined), jd = js.map(c => md.jaw[+c] - bj[c]);
    console.log(`k${K.k}: ${r.join(' | ')} | jaw ${js.length} columns, mean ${(jd.reduce((a, x) => a + x, 0) / Math.max(1, jd.length)).toFixed(2)}`); }
}
/* score of one shot with a camera/pose offset: x = {dPitch, dYaw, dSide, dD, dSx, dSy, dAz, dEl} -> RMS px (+ per-frame detail) */
export function faceScore(shot, v, detailed = false) {
  const Ks = FRAME.filter(K => K.shot === shot); let e = 0; const d = {};
  for (const K of Ks) {
    const h = {...K.h0, tilt: K.h0.tilt + (v.dPitch || 0), turn: K.h0.turn + (v.dYaw || 0), sideways: (K.h0.sideways || 0) + (v.dSide || 0)};
    const cam = {...K.cam, d: K.cam.d + (v.dD || 0), screen: [K.cam.screen[0] + (v.dSx || 0), K.cam.screen[1] + (v.dSy || 0)], az: K.cam.az + (v.dAz || 0), el: K.cam.el + (v.dEl || 0)};
    const r = error(K, h, cam, detailed); e += detailed ? r.e : r; if (detailed) d[K.k] = {rms: +Math.sqrt(r.e).toFixed(2), ...r.d};
  }
  const rms = Math.sqrt(e / Ks.length);
  return detailed ? {rms, frame: d} : rms;
}
