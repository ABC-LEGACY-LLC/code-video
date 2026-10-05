/* FACE -- ONE 3D PLACE (pass 9, 2a): the near-eye drawing no longer depends on the view/shot -- one place (w along the
   card's path, the same in every shot) and one head shape (lower-face shift s, the same in every frame). For each (w, s)
   the pose of every frame (animation -- allowed) is refitted, then the THREE SHOTS ARE SCORED TOGETHER.
   Targets (sample, 320x180) -- from earlier fits: shot 1 (fit_pose1.mjs frame 3 = held 1..6; fit_pose1c.mjs
   7..11: near/far eye, mouth, lip shadow, closed-eye line, front contour rows); shot 2 (stage2_fit.mjs: centre of the
   closed-eye line, front contour 21 rows, under the chin) -- with the face-matched camera of pass 5 (d 12.88): the eye's
   place RELATIVE TO THE FACE CONTOUR does not depend on scale; shot 3 (stage3_fit.mjs: eye, chin front edge 7 rows, under the jaw).
   Weight -- the frame count (screen time): shot 1 11, shot 2 2, shot 3 9.
   node test/fit_face9.mjs [--s 0,0.15,0.3] [--wmax 1] */
import {HEAD, FACE, facePoint, headShape, eyePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SVALS = arg('s', '0').split(',').map(Number), WMAX = +arg('wmax', 1);

/* shot 1 */
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {3: {near: [97.6 + KM[0], 46.3 + KM[1]], far: [120.3, 49.3], mouth: [125.5, 84.5], lip: [125.7, 91.0]},
  7: {near: [98.4 + KM[0], 45.5 + KM[1]], far: [123.0, 47.4], mouth: [126.4, 83.7], lip: [127.7, 90.7]}, 8: {near: [99.4 + KM[0], 44.7 + KM[1]], far: [123.5, 46.4], mouth: [127.2, 83.3], lip: [128.5, 90.0]},
  9: {near: [100.9 + KM[0], 44.4 + KM[1]], far: [124.3, 46.8], mouth: [128.3, 83.1], lip: [130.0, 89.8]}, 10: {closed: [107.8 + KM[0], 52.0], mouth: [134.7, 87.0]}, 11: {closed: [112.5 + KM[0], 53.9], mouth: [138.4, 89.7]}};
const Q1 = {3: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], 7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const SIDE1 = {3: 0, 7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15}, COUNT1 = {3: 6, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1};
/* shot 2 (the face-matched camera and pose of pass 5) */
const K2 = {az: 83.6, el: -5, d: 12.88, fov: 27, screen: [0.411, 0.447]}, H2 = {tilt: -0.081, turn: 0, sideways: 0};
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const EYE2 = [138.5, 78.5];
/* shot 3 (still 20..22) */
const K3 = {az: 55, el: -30, d: 7.10, fov: 29, screen: [0.34, 0.50]}, H3 = {tilt: 0.68, turn: 0.03, sideways: -0.05, sink: -0.02, backward: -0.02};
const EYE3 = [155.7, 112.0], Q3 = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], J3 = [[146, 158], [150, 158]];

const surface = (a0, a1, na, p0, p1, np) => { const S = []; for (let j = 0; j <= na; j++) { const al = a0 + (a1 - a0) * j / na; for (let i = 0; i <= np; i++) { const ph = p0 + (p1 - p0) * i / np; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
const rowMax = (Q, y0, t = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < t && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0, t = 0.5) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < t && q[1] > m) m = q[1]; return m; };
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function score(w, s) {
  HEAD.shift = s;
  const S1 = surface(-Math.PI / 2, 0.35, 150, -0.4, 1.4, 60), S2 = surface(-Math.PI / 2, 0.7, 140, -1.9, 1.9, 80), S3 = surface(-Math.PI / 2, 0.1, 160, -1.9, 1.9, 110);
  const H = FACE.eyeH, L = {near: eyePoint(w), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(-0.03, FACE.mouthY), lip: facePoint(0, FACE.mouthY + FACE.lipShadowY), closed: eyePoint(w, 0, -0.1 * H)};
  const r = {w, s, shot1: {}, total: 0};
  let c1 = 0, n1 = 0;
  for (const k of [3, 7, 8, 9, 10, 11]) {
    let best = null;
    for (let eg = -0.5; eg <= 0.001; eg += 0.01) for (let yaw = -0.3; yaw <= 0.401; yaw += 0.01) {
      const p = projector(K1, {tilt: eg, turn: yaw, sideways: SIDE1[k]}); let e = 0;
      for (const n in T1[k]) e += ((n === 'near' || n === 'closed') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
      if (!best || e < best.e) best = {e, eg, yaw};
    }
    const p = projector(K1, {tilt: best.eg, turn: best.yaw, sideways: SIDE1[k]}), P = S1.map(p);
    const cont = Q1[k].map(([y, x]) => rowMax(P, y) - x), nm = T1[k].near ? 'near' : 'closed';
    const kz = p(L[nm]), eye = [kz[0] - T1[k][nm][0], kz[1] - T1[k][nm][1]];
    const pt = Object.keys(T1[k]).map(n => Math.sqrt(e2(p(L[n]), T1[k][n])));
    const rms = Math.sqrt((pt.reduce((a, v) => a + v * v, 0) + cont.reduce((a, v) => a + v * v, 0)) / (pt.length + cont.length));
    r.shot1[k] = {eg: +best.eg.toFixed(2), yaw: +best.yaw.toFixed(2), eye: eye.map(v => +v.toFixed(1)), contour: cont.map(v => +v.toFixed(1)), rms: +rms.toFixed(2)};
    c1 += COUNT1[k] * rms * rms; n1 += COUNT1[k];
  }
  r.rms1 = Math.sqrt(c1 / n1);
  // shot 2: pose and camera fixed (the contour changes when there is a shift)
  { const p = projector(K2, H2), P = S2.map(p), cont = Q2.map(([y, x]) => rowMax(P, y, 0.6) - x), kz = p(L.closed);
    const eye = [kz[0] - EYE2[0], kz[1] - EYE2[1]], rk = Math.sqrt(cont.reduce((a, v) => a + v * v, 0) / cont.length);
    r.shot2 = {eye: eye.map(v => +v.toFixed(1)), contourRms: +rk.toFixed(2)}; r.rms2 = Math.sqrt((e2(kz, EYE2) + cont.reduce((a, v) => a + v * v, 0)) / (1 + cont.length)); }
  // shot 3: the pose is refitted (tilt, turn) -- eye (weight 1.5), chin rows, under the jaw
  { let best = null;
    for (let eg = 0.55; eg <= 0.811; eg += 0.01) for (let yaw = -0.3; yaw <= 0.301; yaw += 0.02) {
      const h = {...H3, tilt: eg, turn: yaw}, p = projector(K3, h), P = S3.map(p);
      const kz = p(L.near), e = [1.5 * (kz[0] - EYE3[0]), 1.5 * (kz[1] - EYE3[1]), ...Q3.map(([y, x]) => rowMax(P, y, 0.5) - x), ...J3.map(([x, y]) => columnMax(P, x) - y)];
      const f = e.reduce((a, v) => a + v * v, 0) + (yaw / 0.15) ** 2;
      if (!best || f < best.f) best = {f, eg, yaw, eye: [kz[0] - EYE3[0], kz[1] - EYE3[1]], rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)};
    }
    r.shot3 = {eg: +best.eg.toFixed(2), yaw: +best.yaw.toFixed(2), eye: best.eye.map(v => +v.toFixed(1)), rms: +best.rms.toFixed(2)}; r.rms3 = best.rms; }
  r.total = Math.sqrt((11 * r.rms1 ** 2 + 2 * r.rms2 ** 2 + 9 * r.rms3 ** 2) / 22);
  HEAD.shift = 0;
  return r;
}

const result = [];
for (const s of SVALS) for (let w = 0; w <= WMAX + 1e-6; w += 0.1) {
  const r = score(+w.toFixed(2), s); result.push(r);
  const k1 = r.shot1;
  console.log(`w ${w.toFixed(1)} s ${s.toFixed(2)} | shot 1 RMS ${r.rms1.toFixed(2)} (eye 3: ${k1[3].eye} 9: ${k1[9].eye} 11: ${k1[11].eye}) | shot 2 eye ${r.shot2.eye} contour ${r.shot2.contourRms} | shot 3 RMS ${r.rms3.toFixed(2)} eye ${r.shot3.eye} (eg ${r.shot3.eg} yaw ${r.shot3.yaw}) | TOTAL ${r.total.toFixed(2)}`);
}
writeFileSync(new URL('./face9_fit.json', import.meta.url), JSON.stringify(result, null, 1));
