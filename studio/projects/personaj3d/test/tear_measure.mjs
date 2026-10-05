/* TEAR POSITION (pass 4) -- the sample's tear traces (320x180, L>70 components, every image) are carried into head space:
   for every screen point, the (x, y) on the face surface whose projection with that image's pose and camera lands on
   this point (no render). The drawing is ours (a thin bright line); what is measured is the position and the timing.
   Sample components (x range, y range):
     A (straight down from under the eye, slides down on the held images): 1 (98, 62..68)  2 (98..99, 60..67)  3 (97..100, 56..66)
       4 (97..98, 63..66)  5 (97..99, 69..72)  6 (96..98, 73..75)
     B (along the cheek): 5 (103..105, 60..65)  6 (103..105, 61..67)  7 (106..108, 66..74)  8 (107..109, 69..76)
       9 (108..110, 69..77)  10 (111..114, 77..88)  11 (115..119, 85..95)
     C (a drop hanging on the jaw edge): 7..9 ~ (112, 108)  -- falls at 10-11: (125, 129.6), (123.5, 157.1) (tear_jaw probe)
   node test/tear_measure.mjs  ->  test/tear_fit.json */
import * as THREE from 'three';
import {HEAD, facePoint, chinPoint} from '../src/personaj.js';
import {projector, headMatrix, getCamera} from './projection.mjs';
import {FILMS} from '../src/film.js';
import {writeFileSync} from 'fs';

const shot = FILMS.sample22.shotList[0], K1 = shot.camera;
const A = {1: [[98, 62], [98, 68]], 2: [[98.5, 60], [98.5, 67]], 3: [[98.5, 56], [98.5, 66]], 4: [[97.5, 63], [97.5, 66]], 5: [[98, 69], [98, 72]], 6: [[97, 73], [97, 75]]};
const B = {5: [[103, 60], [105, 65]], 6: [[103, 61], [105, 67]], 7: [[106, 66], [108, 74]], 8: [[107, 69], [109, 76]], 9: [[108, 69], [110, 77]], 10: [[111, 77], [114, 88]], 11: [[115, 85], [119, 95]]};
const C = {7: [112, 108], 8: [112, 108], 9: [112, 107]};
function head(k, s) {                     // screen point -> (x, y) on the face surface
  HEAD.shift = shot.pose(k - 1).shift || 0;          // pass 5: the lower face shift is separate (the profile weight -- only the eye card)
  const p = projector(K1, shot.pose(k - 1));
  let best = null;
  for (let x = -0.8; x <= 0.3; x += 0.01) for (let y = -1.3; y <= 0.1; y += 0.01) {
    const q = p(facePoint(x, y)), e = (q[0] - s[0]) ** 2 + (q[1] - s[1]) ** 2; if (!best || e < best.e) best = {e, x, y};
  }
  let {x, y} = best, h = 0.005;
  for (let it = 0; it < 60; it++) {       // fine search
    let good = false;
    for (const [dx, dy] of [[h, 0], [-h, 0], [0, h], [0, -h]]) {
      const q = p(facePoint(x + dx, y + dy)), e = (q[0] - s[0]) ** 2 + (q[1] - s[1]) ** 2;
      if (e < best.e) { best = {e, x: x + dx, y: y + dy}; x += dx; y += dy; good = true; break; }
    }
    if (!good) h /= 2;
  }
  return [+x.toFixed(3), +y.toFixed(3), +Math.sqrt(best.e).toFixed(2)];
}
const out = {A: {}, B: {}, C: {}};
for (const [k, [a, b]] of Object.entries(A)) out.A[k] = [head(+k, a), head(+k, b)];
for (const [k, [a, b]] of Object.entries(B)) out.B[k] = [head(+k, a), head(+k, b)];
for (const [k, c] of Object.entries(C)) out.C[k] = head(+k, c);
/* D -- the falling drop (10, 11): world point -- on the camera ray through the screen point, at the chin's depth */
const D = {10: [125, 129.6], 11: [123.5, 157.1]};
out.D = {};
for (const [k, s] of Object.entries(D)) {
  HEAD.shift = shot.pose(+k - 1).shift || 0;
  const cam = getCamera(K1), M = headMatrix(shot.pose(+k - 1));
  const chin = new THREE.Vector3(...chinPoint()).applyMatrix4(M);
  const zdepth = chin.clone().sub(cam.position).dot(cam.getWorldDirection(new THREE.Vector3()));
  const ndc = new THREE.Vector3(s[0] / 320 * 2 - 1, 1 - s[1] / 180 * 2, 0.5).unproject(cam);
  const light = ndc.sub(cam.position).normalize(), t = zdepth / light.dot(cam.getWorldDirection(new THREE.Vector3()));
  const w = cam.position.clone().addScaledVector(light, t);
  out.D[k] = [+w.x.toFixed(3), +w.y.toFixed(3), +w.z.toFixed(3)];
  console.log('D', k, JSON.stringify(out.D[k]), 'check px', projector(K1, {tilt: 0})(new THREE.Vector3(...out.D[k]).applyMatrix4(headMatrix({tilt: 0}).invert()).toArray()).map(t => t.toFixed(1)));
}
for (const n of ['A', 'B']) for (const k in out[n]) console.log(n, k, JSON.stringify(out[n][k]));
for (const k in out.C) console.log('C', k, JSON.stringify(out.C[k]));
writeFileSync(new URL('./tear_fit.json', import.meta.url), JSON.stringify(out, null, 1));
