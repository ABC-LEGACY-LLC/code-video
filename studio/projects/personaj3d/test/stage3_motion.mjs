/* SHOT 3 MOTION (pass 5) -- the camera is fixed (stage3_fit, dense silhouette: az 55, el -30, d 7.10, fov 29, screen [0.34, 0.50]); on
   every image the tilt comes from the table, the head shift (sink -- down, backward) is solved from the track of the sample's eye.
   Sample eye (centre of the eyelid lash line, 320x180, L tables; at k14 the eye is not visible during the motion):
     k15 (158, 106.5)  k16 (157.5, 108.5)  k17 (157, 110.5)  k18 (158, 112)  k19 (155.5, 112)  k20 (155.5, 112)
     k21 (156, 112)  k22 (155.5, 112)
   The eye drops only 5.5 px over 15 -> 18, then stays in place: the head is already tilted at image 15 (the face area is
   almost the same over 15..22), what changes is that the top of the head goes into the hood's shadow (bright hair 2.8 -> 1.0 %).
   Tilt table: 14 -- in motion (0.43, the face at another angle), over 15..18 0.62 -> 0.70 (overshoot), 19.. 0.68;
   turn 0.03, sideways -0.05 (from the still pose).
   node test/stage3_motion.mjs */
import {FACE, facePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
const CAM = {az: 55, el: -30, d: 7.10, fov: 29, screen: [0.34, 0.50]};
const IZ = {15: [158, 106.5], 16: [157.5, 108.5], 17: [157, 110.5], 18: [158, 112], 19: [155.5, 112], 20: [155.5, 112], 21: [156, 112], 22: [155.5, 112]};
const EG = {14: 0.43, 15: 0.62, 16: 0.66, 17: 0.68, 18: 0.70, 19: 0.69, 20: 0.68, 21: 0.68, 22: 0.68};
const L = facePoint(-FACE.eyeX, FACE.eyeY);
const out = {};
for (const k of Object.keys(IZ).map(Number)) {
  let best = null;
  for (let ch = -0.4; ch <= 0.4001; ch += 0.005) for (let white = -0.4; white <= 0.4001; white += 0.005) {
    const q = projector(CAM, {tilt: EG[k], turn: 0.03, sideways: -0.05, sink: ch, backward: white})(L);
    const e = (q[0] - IZ[k][0]) ** 2 + (q[1] - IZ[k][1]) ** 2 + 2 * (ch * ch + white * white);    // a small shift is preferred
    if (!best || e < best.e) best = {e, ch, white, q};
  }
  out[k] = {tilt: EG[k], sink: +best.ch.toFixed(3), backward: +best.white.toFixed(3)};
  console.log(k, JSON.stringify(out[k]), 'eye', best.q.map(v => v.toFixed(1)), 'vs', IZ[k]);
}
