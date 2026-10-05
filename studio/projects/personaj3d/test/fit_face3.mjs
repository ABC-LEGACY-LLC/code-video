/* FACE FIT (attempt 3, head v3) -- the head profile (HEAD) and the places of the face drawing (FACE) are fitted to the
   sample's shot 1 measurements; shot 2 (profile) at a low weight, its camera and pose free (within bounds). No render: head
   surface points in node (the same headShape as in personaj.js) and the same projection (test/projection.mjs, 0.00 px from the page).
   Fit, not trace: the shape is our own parametric profile; only points and silhouette edges are measured.
   Sample (320x180; frame 3, shot 1 held; tools/compare probe, sample values):
     anchor (near eye) (97.6, 46.3); far eye (120.3, 49.3); middle of the mouth (125.5, 84.5) -- above the lip shadow;
     nose tip (130.5, 60) -- the tip of the rim arc that runs from under the far eye down to the front contour;
     front contour (silhouette, row y -> x): y 60 -> 130.5, 66.3 -> 131.2, 76.3 -> 132.5, 98.3 -> 130.4
       (in the sample a 1..2 px rim line lies on the contour -- the edge is measured at L<50);
     far contour at eye level: y 50 -> 124;
     under the jaw (column x -> lowest y): 105.6 -> 107.6, 117.6 -> 109.5, 125.6 -> 109.6.
   frame 12 (profile): near eye (137, 77.5), nose tip (163.5, 92), mouth cut (161, 102), chin corner (156, 112),
     under the jaw y 113.5 (x 146..152), front contour y 106 -> 159.5.
   node test/fit_face3.mjs [--iter 3000] [--v2 0.4]  ->  test/face_fit3.json */
import {HEAD, FACE, facePoint, nosePoint, chinPoint, headShape} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {writeFileSync} from 'fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const ITER = arg('iter', 3000), V2 = arg('v2', 0.4), V9 = arg('v9', 0);   // v9: weight of frame 9 (after the pose was corrected)
const B0 = {...HEAD}, Y0 = {...FACE};
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]}, P1 = {tilt: -0.30, turn: -0.15};
const M1 = {near: [97.6, 46.3], far: [120.3, 49.3], mouth: [125.5, 84.5], nose: [130.5, 60]};
/* attempt 2: the front contour every 3 rows (sample face mask L>=50, median 3, rightmost x) -- frames 3 and 9; frame 9
   (turn at 0.76 of the way) was added: with the attempt 1 result the nose stuck out 3 px too far in frame 9, with a 4 px gap under it */
const FRONT1 = [[58, 127], [61, 130], [64, 130], [67, 130], [70, 130], [73, 130], [76, 131], [79, 131], [82, 130], [85, 129], [88, 130], [91, 129], [94, 129], [97, 129], [100, 129], [103, 129], [106, 129]], FAR1 = [[50, 124]];
const JAW1 = [[105.6, 107.6], [117.6, 109.5], [125.6, 109.6]];
const P9 = {tilt: arg('pitch9', -0.30 - 0.05 * 0.76), turn: arg('yaw9', -0.15 + 0.47 * 0.76)};
const M9 = {near: [100.9, 44.4], far: [124.3, 46.8], mouth: [128.3, 83.1]};
const FRONT9 = [[58, 134], [61, 134], [64, 135], [67, 135], [70, 135], [73, 135], [76, 136], [79, 136], [82, 134], [85, 133], [88, 134], [91, 134], [94, 133], [97, 134], [100, 134], [103, 135]];
const JAW9 = [[108.9, 106.3], [120.9, 107.6], [128.9, 107.8]];
const M2 = {nose: [163.5, 92], mouth: [161, 102], chin: [156, 112]};   // attempt 2: the profile eye -- a shot-specific offset (the anime profile trick), not here
const FRONT2 = [[106, 159.5]], JAW2 = [[146, 113.5], [150, 113.5]];

// parameters: [group, name, min, max]
const PAR = [
  ['B', 'eyeZ', 0.88, 1.06], ['B', 'eyeP', 1.4, 3.0], ['B', 'mouthZ', 0.92, 1.12], ['B', 'mouthW', 0.50, 0.75],
  ['B', 'chinY', -1.40, -1.10], ['B', 'chinZ', 0.85, 1.05], ['B', 'chinW', 0.12, 0.40], ['B', 'nose', 0.08, 0.30],
  ['B', 'noseY', -0.62, -0.45], ['B', 'jawBack', 0.20, 0.85], ['B', 'jawBack2', -0.30, 0.55], ['B', 'noseUnder', 0.04, 0.35],
  ['B', 'lip', 0.0, 0.03],
  ['Y', 'eyeX', 0.26, 0.38], ['Y', 'eyeY', -0.25, -0.05], ['Y', 'mouthY', -1.0, -0.75],
  ['S', 'pitch2', -0.20, 0.05], ['S', 'yaw2', -0.05, 0.20], ['S', 'd2', 8, 14], ['S', 'sx2', 0.2, 0.6], ['S', 'sy2', 0.2, 0.6],
];
const S0 = {pitch2: 0.02, yaw2: 0.12, d2: 10.8, sx2: 0.37, sy2: 0.40};
const head = (g, n) => g === 'B' ? B0[n] : g === 'Y' ? Y0[n] : S0[n];
const X0 = PAR.map(([g, n, a, b]) => (head(g, n) - a) / (b - a));
function place(x) {
  const S = {};
  PAR.forEach(([g, n, a, b], i) => { const v = a + Math.min(1, Math.max(0, x[i])) * (b - a); if (g === 'B') HEAD[n] = v; else if (g === 'Y') FACE[n] = v; else S[n] = v; });
  return S;
}
/* front face surface points (for the silhouette): lower face and eye level, dense grid */
function surface() {
  const out = [];
  for (let j = 0; j <= 150; j++) {
    const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150;
    for (let i = 0; i <= 110; i++) { const ph = -1.9 + 3.6 * i / 110; out.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); }
  }
  return out;
}
const rowMax = (Q, y0, w = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < w && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0, w = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < w && q[1] > m) m = q[1]; return m; };

function score(x, detailed = false) {
  const S = place(x), pts = surface();
  const p1 = projector(K1, P1), p2 = projector({az: 84, el: -4, d: S.d2, fov: 27, screen: [S.sx2, S.sy2]}, {tilt: S.pitch2, turn: S.yaw2});
  const L = {near: facePoint(-FACE.eyeX, FACE.eyeY), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(0, FACE.mouthY), nose: nosePoint(), chin: chinPoint()};
  const r1 = {}, r2 = {}, e1 = [], e2 = [];
  for (const k in M1) { const s = p1(L[k]); r1[k] = s; e1.push(s[0] - M1[k][0], s[1] - M1[k][1]); }
  const Q1 = pts.map(p1);
  r1.front = FRONT1.map(([y, x]) => rowMax(Q1, y)); FRONT1.forEach(([y, x], i) => e1.push(r1.front[i] - x));
  r1.farEdge = FAR1.map(([y, x]) => rowMax(Q1, y)); FAR1.forEach(([y, x], i) => e1.push(r1.farEdge[i] - x));
  r1.jaw = JAW1.map(([x, y]) => columnMax(Q1, x)); JAW1.forEach(([x, y], i) => e1.push(r1.jaw[i] - y));
  const p9 = projector(K1, P9), Q9 = pts.map(p9);
  const e9 = [];
  for (const k in M9) { const s = p9(L[k]); r1['9' + k] = s; e9.push(s[0] - M9[k][0], s[1] - M9[k][1]); }
  r1.front9 = FRONT9.map(([y, x]) => rowMax(Q9, y)); FRONT9.forEach(([y, x], i) => e9.push(r1.front9[i] - x));
  r1.jaw9 = JAW9.map(([x, y]) => columnMax(Q9, x)); JAW9.forEach(([x, y], i) => e9.push(r1.jaw9[i] - y));
  if (V9 > 0) e1.push(...e9.map(t => t * V9));
  for (const k in M2) { const s = p2(L[k]); r2[k] = s; e2.push(s[0] - M2[k][0], s[1] - M2[k][1]); }
  const Q2 = pts.map(p2);
  r2.front = FRONT2.map(([y, x]) => rowMax(Q2, y)); FRONT2.forEach(([y, x], i) => e2.push(r2.front[i] - x));
  r2.jaw = JAW2.map(([x, y]) => columnMax(Q2, x)); JAW2.forEach(([x, y], i) => e2.push(r2.jaw[i] - y));
  const s1 = e1.reduce((a, t) => a + t * t, 0), s2 = e2.reduce((a, t) => a + t * t, 0);
  const reg = 2 * x.slice(0, 16).reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  const f = s1 + V2 * V2 * s2 + reg;
  if (detailed) return {f, rms1: Math.sqrt(s1 / e1.length), rms2: Math.sqrt(s2 / e2.length), e1, e2, r1, r2, S, L};
  return f;
}
function nelder(x0, step, iter) {
  const N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  const P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = P.map(p => score(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = score(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = score(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = score(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = score(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
const fmt = v => v.map(t => t.toFixed(1)).join(', ');
function report(r, heading) {
  console.log(`${heading}: 1-shot RMS ${r.rms1.toFixed(2)} px | 2-shot RMS ${r.rms2.toFixed(2)} px`);
  for (const k in M1) console.log(`   1 ${k.padEnd(7)} ours (${fmt(r.r1[k])})  sample (${fmt(M1[k])})`);
  console.log(`   1 front contour  ours ${fmt(r.r1.front)}  sample ${fmt(FRONT1.map(t => t[1]))} (y ${fmt(FRONT1.map(t => t[0]))})`);
  console.log(`   1 far edge   ours ${fmt(r.r1.farEdge)}  sample ${fmt(FAR1.map(t => t[1]))}`);
  console.log(`   1 under jaw   ours ${fmt(r.r1.jaw)}  sample ${fmt(JAW1.map(t => t[1]))} (x ${fmt(JAW1.map(t => t[0]))})`);
  for (const k in M9) console.log(`   9 ${k.padEnd(7)} ours (${fmt(r.r1['9' + k])})  sample (${fmt(M9[k])})`);
  console.log(`   9 front contour  ours ${fmt(r.r1.front9)}\n                sample ${fmt(FRONT9.map(t => t[1]))}`);
  console.log(`   9 under jaw   ours ${fmt(r.r1.jaw9)}  sample ${fmt(JAW9.map(t => t[1]))}`);
  for (const k in M2) console.log(`   2 ${k.padEnd(7)} ours (${fmt(r.r2[k])})  sample (${fmt(M2[k])})`);
  console.log(`   2 front contour  ours ${fmt(r.r2.front)}  sample ${fmt(FRONT2.map(t => t[1]))};  under jaw ours ${fmt(r.r2.jaw)} sample ${fmt(JAW2.map(t => t[1]))}`);
}
const b0 = score(X0, true); report(b0, 'initial');
let optimum = {x: X0, f: b0.f};
for (let q = 0; q < 3; q++) { const r = nelder(optimum.x, q === 0 ? 0.12 : 0.05, ITER); if (r.f < optimum.f) optimum = r; console.log('restarts', q, 'f', optimum.f.toFixed(2)); }
const r = score(optimum.x, true); report(r, 'result');
const out = {HEAD: Object.fromEntries(PAR.filter(p => p[0] === 'B').map(p => [p[1], +HEAD[p[1]].toFixed(4)])),
             FACE: Object.fromEntries(PAR.filter(p => p[0] === 'Y').map(p => [p[1], +FACE[p[1]].toFixed(4)])),
             shot2: Object.fromEntries(Object.entries(r.S).map(([k, v]) => [k, +v.toFixed(4)])),
             rms1: r.rms1, rms2: r.rms2, initial: {rms1: b0.rms1, rms2: b0.rms2}, v2_weight: V2};
console.log(JSON.stringify(out));
writeFileSync(new URL('./face_fit3.json', import.meta.url), JSON.stringify(out, null, 1));
