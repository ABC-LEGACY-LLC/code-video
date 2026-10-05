/* SHOT 1 7..11 POSE + EYE MAP (pass 5) -- the method of fit_pose1b (pass 4), but the profile weight w no longer pushes the
   LOWER FACE (HEAD.profileZ = 0); it only moves the near-eye drawing along the surface (eyeMap). In every frame, for each
   w (0..0.5) the pose (tilt, turn; sideways fixed) is fitted to the face points, then the front contour edges are
   scored; the w with the smallest total error is chosen. Points and targets -- the same as in fit_pose1b.
   node test/fit_pose1c.mjs */
import {HEAD, FACE, facePoint, headShape, eyePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {writeFileSync} from 'fs';
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]};
const KM = [1.75, 2.4];
const T = {7: {near: [98.4 + KM[0], 45.5 + KM[1]], far: [123.0, 47.4], mouth: [126.4, 83.7], lip: [127.7, 90.7]}, 8: {near: [99.4 + KM[0], 44.7 + KM[1]], far: [123.5, 46.4], mouth: [127.2, 83.3], lip: [128.5, 90.0]},
  9: {near: [100.9 + KM[0], 44.4 + KM[1]], far: [124.3, 46.8], mouth: [128.3, 83.1], lip: [130.0, 89.8]}, 10: {closed: [107.8 + KM[0], 52.0], mouth: [134.7, 87.0]}, 11: {closed: [112.5 + KM[0], 53.9], mouth: [138.4, 89.7]}};
const Q = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
           10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const SIDE = {7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15};
HEAD.profileW = 0;
const surface = () => { const S = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
/* shift (lower face forward, as a share of HEAD.shiftZ) -- only 10-11 (fast turn): scanned with --shift */
const PUSH = process.argv.includes('--shift') ? [0, 0.15, 0.3, 0.45, 0.6] : [0];
const rowMax = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const out = {};
for (const k of [7, 8, 9, 10, 11]) {
  let optimum = null;
  for (const su of (k >= +(process.argv[5] || 10) ? PUSH : [0])) { HEAD.shift = su; const S = surface();
  for (let w = 0; w <= +(process.argv[2] || 0.5) + 1e-4; w += 0.05) {
    const H = FACE.eyeH, L = {near: eyePoint(w), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(-0.03, FACE.mouthY), lip: facePoint(0, FACE.mouthY + FACE.lipShadowY), closed: eyePoint(w, 0, -0.1 * H)};
    let best = null;
    for (let eg = -0.5; eg <= 0.0; eg += 0.01) for (let yaw = -0.3; yaw <= 0.4; yaw += 0.01) {
      const p = projector(K1, {tilt: eg, turn: yaw, sideways: SIDE[k]}); let e = 0;
      for (const n in T[k]) { const q = p(L[n]), v = (n === 'near' || n === 'closed') ? 3 : 1; e += v * ((q[0] - T[k][n][0]) ** 2 + (q[1] - T[k][n][1]) ** 2); }
      if (!best || e < best.e) best = {e, eg, yaw};
    }
    const p = projector(K1, {tilt: best.eg, turn: best.yaw, sideways: SIDE[k]}), P = S.map(p);
    const r = Q[k].map(([y, x]) => rowMax(P, y) - x), ec = r.reduce((a, t) => a + t * t, 0);
    const n = Object.keys(T[k]).length + 2, f = best.e / n + (+(process.argv[3] || 0.5)) * ec / 3;
    const nm = T[k].near ? 'near' : 'closed', kz = p(L[nm]), kt = T[k][nm];
    const og = p(L.mouth);
    if (!optimum || f < optimum.f) optimum = {f, w, su, eg: best.eg, yaw: best.yaw, rmsN: Math.sqrt(best.e / n), r, eye: [kz[0] - kt[0], kz[1] - kt[1]], mouth: [og[0] - T[k].mouth[0], og[1] - T[k].mouth[1]]};
  } }
  HEAD.shift = 0;
  out[k] = {w: +optimum.w.toFixed(2), shift: optimum.su, tilt: +optimum.eg.toFixed(3), turn: +optimum.yaw.toFixed(3), sideways: SIDE[k], rms: +optimum.rmsN.toFixed(2), contour: optimum.r.map(t => +t.toFixed(1))};
  console.log(`${k}: w ${optimum.w.toFixed(2)} shift ${optimum.su} tilt ${optimum.eg.toFixed(2)} turn ${optimum.yaw.toFixed(2)} sideways ${SIDE[k]} | points RMS ${optimum.rmsN.toFixed(2)} px (eye ${optimum.eye.map(t => t.toFixed(1))}, mouth ${optimum.mouth.map(t => t.toFixed(1))}), contour [${optimum.r.map(t => t.toFixed(1)).join(' ')}]`);
}
writeFileSync(new URL('./pose1c_fit.json', import.meta.url), JSON.stringify(out, null, 1));
