/* SHOT 1 FACE SCORE (pass 13, item 5): Alonur's human marks (private/test/parts/human/marks_alonur_1.json, PRIVATE -- R03, R10:
   eyes, nose tip, mouth middle, chin) and the model's same points (personaj.js partPoints, node projection -- no
   render). test/face11.mjs is for shots 2 and 3 (target_fit_11, frames 12..22); the shot 1 camera had not been re-checked in pass 12.
   faceScore1(v) -- RMS px (320x180) with the offset v = {dPitch, dYaw, dSide, dD, dSx, dSy, dAz, dEl}. */
import {HEAD, partPoints} from '../src/personaj.js';
import {FILMS} from '../src/film.js';
import {projector} from './projection.mjs';
import {readFileSync} from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const B = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/marks_alonur_1.json')).marks;
const S1 = FILMS.sample22.shotList[0];
HEAD.shift = 0; HEAD.profileW = 0;
const QN = [partPoints(false), partPoints(true)];
const W = {eye_near: 1, eye_far: 1, nose_tip: 1, mouth: 1, chin_tip: 2};
const TARGET = {};
for (const [tag, i] of [['R03', 2], ['R10', 9]]) {
  const m = B[tag], o = m.mouth.pts;
  TARGET[i] = {eye_near: [m.eye_near.x, m.eye_near.y], eye_far: [m.eye_far.x, m.eye_far.y], nose_tip: [m.nose.x, m.nose.y],
               mouth: [(o[0][0] + o[1][0]) / 2, (o[0][1] + o[1][1]) / 2], chin_tip: [m.chin.x, m.chin.y]};
}
export function faceScore1(v = {}, detailed = false) {
  let e = 0, w = 0; const d = {};
  for (const [i, T] of Object.entries(TARGET)) {
    const h0 = S1.pose(+i), h = {...h0, tilt: h0.tilt + (v.dPitch || 0), turn: h0.turn + (v.dYaw || 0), sideways: (h0.sideways || 0) + (v.dSide || 0)};
    const K = S1.camera, cam = {...K, d: K.d + (v.dD || 0), screen: [K.screen[0] + (v.dSx || 0), K.screen[1] + (v.dSy || 0)], az: K.az + (v.dAz || 0), el: K.el + (v.dEl || 0)};
    const p = projector(cam, h), N = QN[h.closed > 0.5 ? 1 : 0];
    for (const [q, t] of Object.entries(T)) {
      const m = p(N[q][0]), dx = m[0] - 0.5 - t[0], dy = m[1] - 0.5 - t[1];
      e += W[q] * (dx * dx + dy * dy); w += W[q];
      if (detailed) (d[i] = d[i] || {})[q] = [+dx.toFixed(1), +dy.toFixed(1)];
    }
  }
  const rms = Math.sqrt(e / w);
  return detailed ? {rms, d} : rms;
}
if (process.argv[1] && process.argv[1].endsWith('face13_s1.mjs')) console.log(JSON.stringify(faceScore1(JSON.parse(process.argv[2] || '{}'), true)));
