/* SHOT 1 POSE (pass 4) -- in every frame the head turn and tilt are fitted to the sample's face points (head shape
   and camera fixed). Why: with head v3, in frame 9 the near eye was 9.5 px right of the sample and the mouth 7.6 px right --
   the g table (0.23 .. 1.0) and the turn amplitude 0.47 came from figure pair differences, not from face points.
   Sample (tools/compare probe, sample values): anchor -- the dark mass of the near eye (in 10-11 the closed-eye line),
   far eye, mouth, lip shadow; front contour every 3 rows (face mask L>=50).
   node test/fit_pose1.mjs  ->  test/pose1_fit.json */
import {FACE, facePoint, headShape} from '../src/personaj.js';
/* silhouette edges (tools/compare probe sample values -> absolute): row y -> front contour x; column x -> under-jaw y */
const EDGE = {
  3: {q: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], u: [[104.8, 107.6], [116.8, 109.7], [124.8, 109.8]]},
  7: {q: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], u: [[106.4, 106.8], [118.4, 108.8], [126.4, 108.9]]},
  8: {q: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], u: [[107.4, 106.3], [119.4, 108.6], [127.4, 108.6]]},
  9: {q: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]], u: [[108.9, 106.3], [120.9, 107.6], [128.9, 107.8]]},
  10: {q: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], u: [[115.8, 109.8], [127.8, 111.6], [135.8, 110.8]]},
  11: {q: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]], u: [[120.5, 114.6], [132.5, 114.4], [140.5, 112.3]]},
};
const PTS = []; for (let j = 0; j <= 120; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 120; for (let i = 0; i <= 90; i++) { const ph = -1.9 + 3.6 * i / 90; PTS.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const rowMax = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.75 && q[1] > m) m = q[1]; return m; };
import {projector} from './projection.mjs';
import {writeFileSync} from 'fs';

const K1 = {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310]};
const T = {   // frame -> points
  3: {near: [97.6, 46.3], far: [120.3, 49.3], mouth: [125.5, 84.5], lip: [125.7, 91.0]},
  7: {near: [98.4, 45.5], far: [123.0, 47.4], mouth: [126.4, 83.7], lip: [127.7, 90.7]},
  8: {near: [99.4, 44.7], far: [123.5, 46.4], mouth: [127.2, 83.3], lip: [128.5, 90.0]},
  9: {near: [100.9, 44.4], far: [124.3, 46.8], mouth: [128.3, 83.1], lip: [130.0, 89.8]},
  10: {closed: [107.8, 52.0], mouth: [134.7, 87.0]},
  11: {closed: [112.5, 53.9], mouth: [138.4, 89.7]},
};
/* the midline mouth point is, in the sample, the centre of the line (the darkest component) -- the line stretches to the near
   side, its centre ~1.5 px left of the midline; lip shadow -- on the midline (FACE.lipShadowY) */
function points() {
  const W = FACE.eyeW, H = FACE.eyeH;
  return {near: facePoint(-FACE.eyeX, FACE.eyeY), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(-0.03, FACE.mouthY),
          lip: facePoint(0, FACE.mouthY + FACE.lipShadowY), closed: facePoint(-FACE.eyeX, FACE.eyeY - 0.25 * H)};
}
function score(k, eg, yaw, side = 0) {
  const p = projector(K1, {tilt: eg, turn: yaw, sideways: side}), L = points();
  let e = 0; const r = {};
  for (const n in T[k]) { const s = p(L[n]); r[n] = s; e += (s[0] - T[k][n][0]) ** 2 + (s[1] - T[k][n][1]) ** 2; }
  if (EDGED && EDGE[k]) {
    const Q = PTS.map(p);
    r.q = EDGE[k].q.map(([y, x]) => rowMax(Q, y)); EDGE[k].q.forEach(([y, x], i) => { e += 0.5 * (r.q[i] - x) ** 2; });
    r.u = EDGE[k].u.map(([x, y]) => columnMax(Q, x)); EDGE[k].u.forEach(([x, y], i) => { e += 0.5 * (r.u[i] - y) ** 2; });
  }
  return {e, r};
}
const SIDE = process.argv.includes('--sideways'), EDGED = process.argv.includes('--edge'), out = {};
for (const k of Object.keys(T).map(Number)) {
  let best = null;
  for (let eg = -0.6; eg <= 0.1; eg += EDGED ? 0.04 : 0.02) for (let yaw = -0.3; yaw <= 0.5; yaw += EDGED ? 0.04 : 0.02) for (let side = -0.3; side <= 0.301; side += SIDE ? (EDGED ? 0.04 : 0.02) : 1) {
    const b = score(k, eg, yaw, SIDE ? side : 0); if (!best || b.e < best.e) best = {...b, eg, yaw, side: SIDE ? side : 0};
  }
  const n = Object.keys(T[k]).length;
  out[k] = {tilt: +best.eg.toFixed(3), turn: +best.yaw.toFixed(3), sideways: +best.side.toFixed(3), rms: +Math.sqrt(best.e / n).toFixed(2)};
  console.log(`${k}: tilt ${best.eg.toFixed(2)} turn ${best.yaw.toFixed(2)} sideways ${best.side.toFixed(2)}  RMS ${Math.sqrt(best.e / n).toFixed(2)} px  ` +
    Object.keys(T[k]).map(m => `${m} (${best.r[m].map(t => t.toFixed(1))}) vs (${T[k][m]})`).join('  ') +
    (best.r.q ? `\n      contour ${best.r.q.map(t => t.toFixed(1))} vs ${EDGE[k].q.map(t => t[1])} | jaw ${best.r.u.map(t => t.toFixed(1))} vs ${EDGE[k].u.map(t => t[1])}` : ''));
}
writeFileSync(new URL('./pose1_fit.json', import.meta.url), JSON.stringify(out, null, 1));
