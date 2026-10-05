/* TRIANGULATION -- find where the sample's face points are in head space from two views (shot 1 3/4, shot 2 profile).
   The camera and pose are FIXED (shot 1: the camera fitted to the figure; shot 2: the pose is fixed, the camera distance and
   shift are free -- shot 2 took no part in the figure fit). Unknowns: the near eye (x, y, z), the nose tip, the mouth
   middle, the chin corner (on the middle line: y, z). The residual -- can the two views be explained by one rigid face
   (consistency). This is not a shape, only points: the head model is designed to pass through these points.
   Sample points (320x180, from the L tables, pass 4; +-1..2 px):
     image 3: near eye (97.6, 46.3), far eye (121, 48.5), mouth middle (125.5, 84.5) -- line (118,86)->(128,84),
       its middle above the lip shadow (125.5, 91); nose tip (130.5, 60) -- the rim arc that runs from the far eye's inner
       corner (120, 56) down to the front contour ends here (the far-side silhouette of the nose); seen from below, the nose
       comes out close to the eye (a point that sticks forward is higher on screen);
       chin corner (129.5, 107.5) -- where the vertical front contour x 130 and the horizontal jaw line y 108.5 meet
     image 12: near eye (137, 77.5), nose tip (163.5, 92), mouth slit (161, 102), chin corner (156, 112)
   node test/triangle.mjs [--pitch1 -0.30 --yaw1 -0.15] */
import {projector} from './projection.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const PITCH1 = arg('pitch1', -0.30), YAW1 = arg('yaw1', -0.15), PITCH2 = arg('pitch2', 0.02), YAW2 = arg('yaw2', 0.12);
export const M1 = {near: [97.6, 46.3], far: [121, 48.5], mouth: [125.5, 84.5], nose: [130.5, 60], chin: [129.5, 107.5]};
export const M2 = {near: [137, 77.5], nose: [163.5, 92], mouth: [161, 102], chin: [156, 112]};
const WEIGHT = {nose1: arg('nose1', 1), shot2: arg('shot2', 1)};
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310], centre: [0, 0, 0]};

function points(x) {   // x: [xe, ye, ze, yn, zn, ym, zm, yc, zc, sx2, sy2, d2]
  return {near: [-x[0], x[1], x[2]], far: [x[0], x[1], x[2]], nose: [0, x[3], x[4]], mouth: [0, x[5], x[6]], chin: [0, x[7], x[8]]};
}
function residual(x) {
  const L = points(x), r = [];
  const p1 = projector(K1, {tilt: PITCH1, turn: YAW1});
  const p2 = projector({az: 84, el: -4, d: x[11], fov: 27, screen: [x[9], x[10]], centre: [0, 0, 0]}, {tilt: PITCH2, turn: YAW2});
  for (const k in M1) { const s = p1(L[k]), w = k === 'nose' ? WEIGHT.nose1 : 1; r.push(w * (s[0] - M1[k][0]), w * (s[1] - M1[k][1])); }
  for (const k in M2) { const s = p2(L[k]); r.push(WEIGHT.shot2 * (s[0] - M2[k][0]), WEIGHT.shot2 * (s[1] - M2[k][1])); }
  return r;
}
// Levenberg-Marquardt (numerical Jacobian)
function lm(x0, iter = 200) {
  let x = x0.slice(), r = residual(x), f = r.reduce((a, t) => a + t * t, 0), lam = 1e-2;
  for (let it = 0; it < iter; it++) {
    const J = x.map((_, j) => { const e = 1e-5, xp = x.slice(); xp[j] += e; const rp = residual(xp); return rp.map((t, i) => (t - r[i]) / e); });
    const n = x.length, A = Array.from({length: n}, () => new Array(n).fill(0)), g = new Array(n).fill(0);
    for (let a = 0; a < n; a++) { for (let b = 0; b < n; b++) for (let i = 0; i < r.length; i++) A[a][b] += J[a][i] * J[b][i]; for (let i = 0; i < r.length; i++) g[a] += J[a][i] * r[i]; }
    let ok = false;
    for (let t = 0; t < 20 && !ok; t++) {
      const B = A.map((row, a) => row.map((v, b) => v + (a === b ? lam * (A[a][a] + 1e-9) : 0)));
      const dx = solve(B, g.map(v => -v)), xn = x.map((v, j) => v + dx[j]), rn = residual(xn), fn = rn.reduce((a, t) => a + t * t, 0);
      if (fn < f) { x = xn; r = rn; f = fn; lam *= 0.3; ok = true; } else lam *= 10;
    }
    if (!ok) break;
  }
  return {x, r, f};
}
function solve(A, b) {   // Gauss
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) { const k = M[i][c] / M[c][c]; for (let j = c; j <= n; j++) M[i][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}

const x0 = [0.35, -0.17, 0.85, -0.45, 1.05, -0.70, 1.0, -1.05, 0.9, 0.31, 0.39, 9.51];
const {x, r, f} = lm(x0);
const L = points(x), fx = v => v.map(t => t.toFixed(3)).join(', ');
console.log(`pose1 tilt ${PITCH1} turn ${YAW1} | pose2 tilt ${PITCH2} turn ${YAW2}`);
console.log('residual RMS px', Math.sqrt(f / r.length).toFixed(2), ' each point:', r.map(t => t.toFixed(1)).join(' '));
for (const k of ['near', 'nose', 'mouth', 'chin']) console.log('  %s  (%s)', k.padEnd(6), fx(L[k]));
console.log('  shot 2 camera: screen [%s, %s] d %s', x[9].toFixed(3), x[10].toFixed(3), x[11].toFixed(2));
console.log('  nose ahead of the eye %s, mouth %s, chin %s; eye->chin vertical %s', (x[4] - x[2]).toFixed(3), (x[6] - x[2]).toFixed(3), (x[8] - x[2]).toFixed(3), (x[1] - x[7]).toFixed(3));
