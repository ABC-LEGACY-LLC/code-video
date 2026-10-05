/* ONE HEAD SHAPE -- FOR ALL THREE SHOTS TOGETHER (pass 9, 2a). The eye card (w) and the lower face push (s) are now always 0
   (test/fit_face9.mjs: w 0, s 0 gives the smallest total -- 2.70 px). The remaining difference is in shot 1, 7..11: the front contour is 3..10 px
   behind the sample's (the sample drew the lower face further forward in these frames). Here the head SHAPE itself (lower face section: width, power,
   midline depth) is fitted TOGETHER to the targets of all frames; each frame's pose (animation) is fitted again
   inside (Nelder-Mead, from the previous best). The shot 2 camera (d, screen) -- to the face (a shot camera, allowed).
   Weight -- time on screen (frame count). The targets are the ones in test/fit_face9.mjs.
   node test/fit_head9.mjs [--iter 150] [--score-only] */
import {HEAD, FACE, facePoint, headShape, eyePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 150);

const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {3: {near: [97.6 + KM[0], 46.3 + KM[1]], far: [120.3, 49.3], mouth: [125.5, 84.5], lip: [125.7, 91.0]},
  7: {near: [98.4 + KM[0], 45.5 + KM[1]], far: [123.0, 47.4], mouth: [126.4, 83.7], lip: [127.7, 90.7]}, 8: {near: [99.4 + KM[0], 44.7 + KM[1]], far: [123.5, 46.4], mouth: [127.2, 83.3], lip: [128.5, 90.0]},
  9: {near: [100.9 + KM[0], 44.4 + KM[1]], far: [124.3, 46.8], mouth: [128.3, 83.1], lip: [130.0, 89.8]}, 10: {closed: [107.8 + KM[0], 52.0], mouth: [134.7, 87.0]}, 11: {closed: [112.5 + KM[0], 53.9], mouth: [138.4, 89.7]}};
const Q1 = {3: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], 7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const SIDE1 = {3: 0, 7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15}, COUNT1 = {3: 6, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1};
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const J2 = [[146, 114], [150, 113.5], [154, 113]], EYE2 = [138.5, 78.5];
const K3 = {az: 55, el: -30, fov: 29, d: 7.10, screen: [0.34, 0.50]}, H3 = {tilt: 0.68, turn: 0.03, sideways: -0.05, sink: -0.02, backward: -0.02};
const EYE3 = [155.7, 112.0], Q3 = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], J3 = [[146, 158], [150, 158]];

const surface = (a0, a1, na, p0, p1, np) => { const S = []; for (let j = 0; j <= na; j++) { const al = a0 + (a1 - a0) * j / na; for (let i = 0; i <= np; i++) { const ph = p0 + (p1 - p0) * i / np; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
/* row/column edges in one sweep (the points are projected once) */
function edges(S, p, rows, columns, tq, tu) {
  const q = rows.map(() => -1e9), u = columns.map(() => -1e9);
  for (const s of S) { const v = p(s);
    for (let i = 0; i < rows.length; i++) if (Math.abs(v[1] - rows[i]) < tq && v[0] > q[i]) q[i] = v[0];
    for (let i = 0; i < columns.length; i++) if (Math.abs(v[0] - columns[i]) < tu && v[1] > u[i]) u[i] = v[1]; }
  return {q, u};
}
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f);
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}

/* each frame's pose (starts from the previous best) */
const POSE = {3: [-0.32, -0.12], 7: [-0.33, -0.10], 8: [-0.34, -0.07], 9: [-0.34, -0.03], 10: [-0.28, 0.12], 11: [-0.24, 0.20], s2: [-0.081, 0, 0, 12.88, 0.411, 0.447], s3: [0.68, 0.02]};
function frames(detailed = false) {
  const S1 = surface(-Math.PI / 2, 0.35, 150, -0.4, 1.4, 60), S2 = surface(-Math.PI / 2, 0.7, 140, -1.9, 1.9, 80), S3 = surface(-Math.PI / 2, 0.1, 160, -1.9, 1.9, 110);
  const H = FACE.eyeH, L = {near: eyePoint(0), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(-0.03, FACE.mouthY), lip: facePoint(0, FACE.mouthY + FACE.lipShadowY), closed: eyePoint(0, 0, -0.1 * H)};
  const out = {}; let total = 0;
  for (const k of [3, 7, 8, 9, 10, 11]) {
    const qy = Q1[k].map(t => t[0]);
    const f = x => { const p = projector(K1, {tilt: x[0], turn: x[1], sideways: SIDE1[k]}); let e = 0;
      for (const n in T1[k]) e += ((n === 'near' || n === 'closed') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
      const c = edges(S1, p, qy, [], 0.75, 0); Q1[k].forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); return e; };
    const r = nelder(f, POSE[k], [0.02, 0.02], 60, [-0.6, -0.4], [0.1, 0.5]); POSE[k] = r.x;
    const n = Object.keys(T1[k]).length + 2 + Q1[k].length; total += COUNT1[k] * r.f / n;
    if (detailed) { const p = projector(K1, {tilt: r.x[0], turn: r.x[1], sideways: SIDE1[k]}), c = edges(S1, p, qy, [], 0.75, 0);
      out[k] = {eg: +r.x[0].toFixed(3), yaw: +r.x[1].toFixed(3), point: Object.fromEntries(Object.keys(T1[k]).map(nn => [nn, p(L[nn]).map((v, i) => +(v - T1[k][nn][i]).toFixed(1))])), contour: c.q.map((v, i) => +(v - Q1[k][i][1]).toFixed(1))}; }
  }
  { const qy = Q2.map(t => t[0]), ux = J2.map(t => t[0]);
    const f = x => { const p = projector({az: 83.6, el: -5, fov: 27, d: x[3], screen: [x[4], x[5]]}, {tilt: x[0], turn: x[1], sideways: x[2]}), c = edges(S2, p, qy, ux, 0.6, 0.6);
      let e = 0; Q2.forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); J2.forEach(([x0, y], i) => { e += (c.u[i] - y) ** 2; });   // the eye is not in the fit (the profile eye is the sample's 2D trick, measured as a residual)
      return e + (x[1] / 0.02) ** 2 + (x[2] / 0.02) ** 2; };
    const r = nelder(f, POSE.s2, [0.02, 0.01, 0.01, 0.3, 0.01, 0.01], 120, [-0.4, -0.2, -0.2, 9, 0.2, 0.2], [0.3, 0.2, 0.2, 16, 0.7, 0.7]); POSE.s2 = r.x;
    total += 2 * r.f / (Q2.length + J2.length);
    if (detailed) { const x = r.x, p = projector({az: 83.6, el: -5, fov: 27, d: x[3], screen: [x[4], x[5]]}, {tilt: x[0], turn: x[1], sideways: x[2]}), c = edges(S2, p, qy, ux, 0.6, 0.6);
      out.s2 = {pose: x.slice(0, 3).map(v => +v.toFixed(3)), camera: {d: +x[3].toFixed(3), screen: [+x[4].toFixed(4), +x[5].toFixed(4)]}, eye: p(L.closed).map((v, i) => +(v - EYE2[i]).toFixed(1)),
        contour: c.q.map((v, i) => +(v - Q2[i][1]).toFixed(1)), jaw: c.u.map((v, i) => +(v - J2[i][1]).toFixed(1))}; } }
  { const qy = Q3.map(t => t[0]), ux = J3.map(t => t[0]);
    const f = x => { const p = projector(K3, {...H3, tilt: x[0], turn: x[1]}), c = edges(S3, p, qy, ux, 0.5, 0.5);
      let e = 2.25 * e2(p(L.near), EYE3); Q3.forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); J3.forEach(([x0, y], i) => { e += (c.u[i] - y) ** 2; }); return e + (x[1] / 0.15) ** 2; };
    const r = nelder(f, POSE.s3, [0.02, 0.02], 60, [0.4, -0.4], [0.9, 0.4]); POSE.s3 = r.x;
    total += 9 * r.f / (2 + Q3.length + J3.length);
    if (detailed) { const p = projector(K3, {...H3, tilt: r.x[0], turn: r.x[1]}), c = edges(S3, p, qy, ux, 0.5, 0.5);
      out.s3 = {eg: +r.x[0].toFixed(3), yaw: +r.x[1].toFixed(3), eye: p(L.near).map((v, i) => +(v - EYE3[i]).toFixed(1)), contour: c.q.map((v, i) => +(v - Q3[i][1]).toFixed(1)), jaw: c.u.map((v, i) => +(v - J3[i][1]).toFixed(1))}; } }
  return detailed ? {total: Math.sqrt(total / 22), out} : Math.sqrt(total / 22);
}

const SHAPE = [['mouthW', 0.45, 0.75], ['chinW', 0.08, 0.32], ['eyeP', 2.0, 3.3], ['mouthP', 1.4, 2.8], ['jawP', 1.4, 2.8], ['mouthZ', 0.90, 1.10], ['chinZ', 0.80, 1.02]];
const ORIG = Object.fromEntries(SHAPE.map(([n]) => [n, HEAD[n]]));
const place = x => SHAPE.forEach(([n], i) => { HEAD[n] = x[i]; });
HEAD.shift = 0; HEAD.profileW = 0;
const b0 = frames(true); frames(); const b0b = frames(true);
console.log('INITIAL shape (current head):', JSON.stringify(ORIG), '-> total RMS', b0b.total.toFixed(3));
console.log(JSON.stringify(b0b.out));
if (!process.argv.includes('--score-only')) {
  let n = 0;
  const f = x => { place(x); const v = frames(); if (++n % 10 === 0) console.log(`  ${n}: ${v.toFixed(3)} ${x.map(t => t.toFixed(3)).join(' ')}`); return v; };
  const x0 = SHAPE.map(([nn]) => ORIG[nn]);
  const r = nelder(f, x0, SHAPE.map(([, a, b]) => 0.08 * (b - a)), ITER, SHAPE.map(t => t[1]), SHAPE.map(t => t[2]));
  place(r.x); frames(); const b1 = frames(true);
  console.log('FITTED shape:', JSON.stringify(Object.fromEntries(SHAPE.map(([nn], i) => [nn, +r.x[i].toFixed(4)]))), '-> total RMS', b1.total.toFixed(3));
  console.log(JSON.stringify(b1.out));
  writeFileSync(new URL('./head9_fit.json', import.meta.url), JSON.stringify({orig: ORIG, initial: b0b, shape: Object.fromEntries(SHAPE.map(([nn], i) => [nn, r.x[i]])), result: b1}, null, 1));
}
