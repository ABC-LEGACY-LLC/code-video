/* check (pass 9, 2a): shot 1 7..11 -- at w 0, s 0 the pose (tilt, turn, sideways) is FREE, contour weight 1 */
import {HEAD, FACE, facePoint, headShape, eyePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {7: {near: [98.4 + KM[0], 45.5 + KM[1]], far: [123.0, 47.4], mouth: [126.4, 83.7], lip: [127.7, 90.7]}, 8: {near: [99.4 + KM[0], 44.7 + KM[1]], far: [123.5, 46.4], mouth: [127.2, 83.3], lip: [128.5, 90.0]},
  9: {near: [100.9 + KM[0], 44.4 + KM[1]], far: [124.3, 46.8], mouth: [128.3, 83.1], lip: [130.0, 89.8]}, 10: {closed: [107.8 + KM[0], 52.0], mouth: [134.7, 87.0]}, 11: {closed: [112.5 + KM[0], 53.9], mouth: [138.4, 89.7]}};
const Q1 = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const KV = +(process.argv[2] || 1);
HEAD.shift = 0; HEAD.profileW = 0;
const S = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const rowMax = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const H = FACE.eyeH, L = {near: eyePoint(0), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(-0.03, FACE.mouthY), lip: facePoint(0, FACE.mouthY + FACE.lipShadowY), closed: eyePoint(0, 0, -0.1 * H)};
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
for (const k of [7, 8, 9, 10, 11]) {
  let best = null;
  for (let eg = -0.5; eg <= 0.001; eg += 0.02) for (let yaw = -0.3; yaw <= 0.401; yaw += 0.02) for (let side = -0.15; side <= 0.451; side += 0.03) {
    const p = projector(K1, {tilt: eg, turn: yaw, sideways: side}); let e = 0;
    for (const n in T1[k]) e += ((n === 'near' || n === 'closed') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
    if (best && e > best.f) continue;
    const P = S.map(p), cont = Q1[k].map(([y, x]) => rowMax(P, y) - x), f = e + KV * cont.reduce((a, v) => a + v * v, 0);
    if (!best || f < best.f) best = {f, eg, yaw, side, cont, pt: Object.keys(T1[k]).map(n => Math.sqrt(e2(p(L[n]), T1[k][n])).toFixed(1))};
  }
  console.log(`${k}: tilt ${best.eg.toFixed(2)} yaw ${best.yaw.toFixed(2)} side ${best.side.toFixed(2)} | points ${best.pt.join(' ')} | contour ${best.cont.map(v => v.toFixed(1)).join(' ')}`);
}
