/* STAGE FIT (pass 5) -- in each shot the camera (az, el, d, screen) and the head pose (tilt, turn, sideways) are fitted to the
   sample's face points and silhouette edges; the camera height (el) is set FIXED (--el), because one view gives only
   the RELATIVE angle between the face and the camera: "head up + camera level" and "head down + camera low" are
   almost the same on the face points. Which one is right is decided from other marks (hood, hair, neck, background).
   No render: the head surface in node and the same projection as the page (test/projection.mjs).
   node test/stage_fit.mjs --shot 1 --el -30 [--eg -0.1..0.4 centre of the range --pitchSigma]  */
import {HEAD, FACE, facePoint, nosePoint, chinPoint, headShape} from '../src/personaj.js';
import {projector} from './projection.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 1), EL = +arg('el', -8), PITCH0 = arg('eg', null), PITCH_SIGMA = +arg('pitchSigma', 0.05), OUT = process.argv.includes('--json');
const KM = [1.75, 2.4];                    // drawing centre -> centre of the dark mass (pass 4, measured)
const H = () => FACE.eyeH;
/* targets: [name, head-space point (function), screen px] ; edges: row y -> contour x, column x -> under-jaw y */
const T = {
  1: {pts: [['near', () => facePoint(-FACE.eyeX, FACE.eyeY), [97.6 + KM[0], 46.3 + KM[1]]], ['far', () => facePoint(FACE.eyeX, FACE.eyeY), [120.3, 49.3]],
            ['mouth', () => facePoint(-0.03, FACE.mouthY), [125.5, 84.5]], ['lip', () => facePoint(0, FACE.mouthY + FACE.lipShadowY), [125.7, 91.0]], ['nose', nosePoint, [130.5, 60]]],
      q: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], u: [[104.8, 107.6], [116.8, 109.7], [124.8, 109.8]], profile: 0, fov: 27, az: 55, d: 7.03},
  2: {pts: [['closed', () => facePoint(-FACE.eyeX, FACE.eyeY - 0.1 * H()), [137 + KM[0], 77.5]], ['nose', nosePoint, [163.5, 92]], ['mouth', () => facePoint(0, FACE.mouthY), [161, 102]],
            ['chin', chinPoint, [156, 112]]], q: [[106, 159.5]], u: [[146, 113.5], [150, 113.5]], profile: 0, fov: 27, az: 84, d: 11},
};
const t = T[SHOT];
const surface = () => { const o = []; for (let j = 0; j <= 120; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 120; for (let i = 0; i <= 90; i++) { const ph = -1.9 + 3.6 * i / 90; o.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return o; };
const rowMax = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.75 && q[1] > m) m = q[1]; return m; };
HEAD.profileW = t.profile;
const S = surface(), L = t.pts.map(([n, f]) => f());
// parameters: az, d, sx, sy, tilt, turn, sideways
const AZ = (arg('az', '') || '').split(',').filter(Boolean).map(Number), SIDE = +arg('side', 0.4), YAW = (arg('yaw', '') || '').split(',').filter(Boolean).map(Number);
const PAR = [['az', AZ.length ? AZ[0] : t.az - 40, AZ.length ? AZ[1] : t.az + 40], ['d', t.d * 0.6, t.d * 1.6], ['sx', 0.1, 0.7], ['sy', 0.1, 0.8], ['eg', -0.8, 1.2],
             ['yaw', YAW.length ? YAW[0] : -0.6, YAW.length ? YAW[1] : 0.6], ['side', -SIDE, SIDE]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
function score(x, detailed = false) {
  const o = ob(x), p = projector({az: o.az, el: EL, d: o.d, fov: t.fov, screen: [o.sx, o.sy]}, {tilt: o.eg, turn: o.yaw, sideways: o.side});
  const e = [], r = {};
  t.pts.forEach(([n, f, s], i) => { const q = p(L[i]); r[n] = q; e.push(q[0] - s[0], q[1] - s[1]); });
  const Q = S.map(p);
  r.q = t.q.map(([y, xx]) => rowMax(Q, y)); t.q.forEach(([y, xx], i) => e.push(0.7 * (r.q[i] - xx)));
  r.u = t.u.map(([xx, y]) => columnMax(Q, xx)); t.u.forEach(([xx, y], i) => e.push(0.7 * (r.u[i] - y)));
  let f = e.reduce((a, v) => a + v * v, 0);
  if (PITCH0 !== null) f += ((o.eg - +PITCH0) / PITCH_SIGMA) ** 2;          // if the tilt is given in advance (soft)
  f += (o.side / 0.15) ** 2 * 0.5;                              // keep sideways small
  if (detailed) return {f, e, r, o, rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)};
  return f;
}
function nelder(x0, step, iter) {
  const N = x0.length, cl = v => v.map(tt => Math.min(1, Math.max(0, tt)));
  const P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -step : step))); P.push(pp); }
  let F = P.map(pp => score(pp));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-7) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((tt, j) => tt + (tt - P[N][j]))), fr = score(xr);
    if (fr < F[0]) { const xe = cl(c.map((tt, j) => tt + 2 * (tt - P[N][j]))), fe = score(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((tt, j) => tt + 0.5 * (P[N][j] - tt))), fc = score(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((tt, j) => P[0][j] + 0.5 * (tt - P[0][j]))); F[i] = score(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
let optimum = null;
for (const pitch0 of [-0.3, 0.0, 0.3, 0.6]) for (const yaw0 of [-0.15, 0.1]) {
  const x0 = PAR.map(([n, a, b]) => { const v = {az: Math.min(b, Math.max(a, t.az)), d: t.d, sx: 0.35, sy: 0.35, eg: PITCH0 !== null ? +PITCH0 : pitch0, yaw: Math.min(b, Math.max(a, yaw0)), side: 0}[n]; return Math.min(1, Math.max(0, (v - a) / (b - a))); });
  let r = nelder(x0, 0.1, 1500); r = nelder(r.x, 0.03, 1500);
  if (!optimum || r.f < optimum.f) optimum = r;
}
const b = score(optimum.x, true), o = b.o;
const fx = v => v.toFixed(3);
console.log('   residual: ' + t.pts.map(([n], i) => n + ' ' + b.e[2 * i].toFixed(1) + '/' + b.e[2 * i + 1].toFixed(1)).join('  ') + ' | edge ' + b.e.slice(2 * t.pts.length).map(v => v.toFixed(1)).join(' '));
console.log(`shot ${SHOT} el ${EL}: RMS ${b.rms.toFixed(2)} px | camera az ${o.az.toFixed(1)} d ${o.d.toFixed(2)} screen [${fx(o.sx)}, ${fx(o.sy)}] | pose tilt ${fx(o.eg)} (${(o.eg * 57.3).toFixed(1)} deg) turn ${fx(o.yaw)} sideways ${fx(o.side)}`);
if (OUT) console.log(JSON.stringify({shot: SHOT, el: EL, rms: b.rms, camera: {az: o.az, el: EL, d: o.d, fov: t.fov, screen: [o.sx, o.sy]}, pose: {tilt: o.eg, turn: o.yaw, sideways: o.side}, r: b.r}));
