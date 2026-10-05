/* SHOT 3 STAGE (pass 5) -- the last (still) images 20-22: the camera and head pose are fitted to the sample's eye line, the front
   edge of the lower face (chin) and the bright line under the jaw; the camera height (el) and azimuth (az) are held FIXED and scanned
   (one view gives only the relative orientation). An extra soft target: the forehead hairline (middle line,
   y 0.55) inside the bright hair mass. No render (test/projection.mjs).
   Sample (k20/k22, 320x180, L tables): eyelid lash line (152..159, 111..113) -> its centre (155.7, 112.0)
   (on a half-open eye our eyelid line is at the height of the eye centre); right edge of the bright skin per row: y144 x167, y146 161, y148 158,
   y150 157, y152 153, y154 153, y156 151; the bright line under the jaw y ~158 (x 144..150); hair mass (L>=85) x 165..215,
   y 88..120, the band under the hood brim y 66..88.
   node test/stage3_fit.mjs --el -20 --az 80 */
import {HEAD, FACE, facePoint, headShape, chinPoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const EL = +arg('el', -20), AZ = +arg('az', 80), FOV = 29, PW = +arg('pw', 0);
HEAD.profileW = PW;
const EYE = [155.7, 112.0];            // centre of the half-open eye's eyelid line (k20..22: lash line 152..159 x 111..113) = our eye centre (in the half-open drawing the eyelid line is at the centre's height)
const ROW = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]];
const JAW = [[146, 158], [150, 158]];
const HAIR = [188, 92];
/* silhouette points: only the lower half (the chin rows and the under-jaw come from it), dense -- 110x70 over the whole head
   gave a +3.3 px sampling error at row 144 (checked with 600x400) */
const S = []; for (let j = 0; j <= 160; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.1) * j / 160; for (let i = 0; i <= 110; i++) { const ph = -1.9 + 3.8 * i / 110; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const Lk = facePoint(-FACE.eyeX, FACE.eyeY), Ls = headShape(0, 0.55, 0.83, false);
const rowMax = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.5 && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.5 && q[1] > m) m = q[1]; return m; };
const YAW_MAX = +arg('yawMax', 0.8), SIDE_MAX = +arg('sideMax', 0.5);
const PAR = [['d', 4, 14], ['sx', 0.1, 0.9], ['sy', 0.1, 0.9], ['eg', -0.3, 1.6], ['yaw', -YAW_MAX, YAW_MAX], ['side', -SIDE_MAX, SIDE_MAX]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
function score(x, detailed = false) {
  const o = ob(x), p = projector({az: AZ, el: EL, d: o.d, fov: FOV, screen: [o.sx, o.sy]}, {tilt: o.eg, turn: o.yaw, sideways: o.side});
  const e = [], r = {};
  r.eye = p(Lk); e.push(1.5 * (r.eye[0] - EYE[0]), 1.5 * (r.eye[1] - EYE[1]));
  const Q = S.map(p);
  r.q = ROW.map(([y]) => rowMax(Q, y)); ROW.forEach(([y, x], i) => e.push(r.q[i] - x));
  r.u = JAW.map(([x]) => columnMax(Q, x)); JAW.forEach(([x, y], i) => e.push(r.u[i] - y));
  r.hair = p(Ls); const ds = Math.hypot(r.hair[0] - HAIR[0], r.hair[1] - HAIR[1]); e.push(0.3 * Math.max(0, ds - 10));
  let f = e.reduce((a, v) => a + v * v, 0) + (o.side / 0.2) ** 2 + (o.yaw / +arg('yawS', 1e9)) ** 2;
  return detailed ? {f, e, r, o, rms: Math.sqrt(e.slice(0, 2 + ROW.length + JAW.length).reduce((a, v) => a + v * v, 0) / (2 + ROW.length + JAW.length))} : f;
}
function nelder(x0, q, it) {
  const N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -q : q))); P.push(pp); }
  let F = P.map(pp => score(pp));
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = score(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = score(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = score(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = score(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}
let optimum = null;
for (const pitch0 of [0.2, 0.6, 1.0]) for (const yaw0 of [-0.3, 0.0, 0.3]) for (const d0 of [6, 9]) {
  const v0 = {d: d0, sx: 0.5, sy: 0.6, eg: pitch0, yaw: Math.max(-YAW_MAX, Math.min(YAW_MAX, yaw0)), side: 0};
  const x0 = PAR.map(([n, a, b]) => (v0[n] - a) / (b - a));
  let r = nelder(x0, 0.12, 1200); r = nelder(r.x, 0.03, 1200);
  if (!optimum || r.f < optimum.f) optimum = r;
}
const b = score(optimum.x, true), o = b.o, f = v => v.toFixed(2);
console.log(`el ${EL} az ${AZ}: RMS ${b.rms.toFixed(2)} px | d ${f(o.d)} screen [${f(o.sx)}, ${f(o.sy)}] | tilt ${f(o.eg)} (${(o.eg * 57.3).toFixed(0)} deg) turn ${f(o.yaw)} sideways ${f(o.side)} | eye (${b.r.eye.map(v => v.toFixed(1))}) chin row ${b.r.q.map(v => v.toFixed(0)).join(',')} jaw ${b.r.u.map(v => v.toFixed(0)).join(',')} hair (${b.r.hair.map(v => v.toFixed(0))})`);
if (process.argv.includes('--json')) console.log(JSON.stringify({el: EL, az: AZ, ...o, rms: b.rms}));
