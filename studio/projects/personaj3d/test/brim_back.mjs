/* BRIM -> HEAD SPACE (pass 12, structure): casts the sample's hood brim pixels (private/test/parts/human/brim_12.json, PRIVATE)
   with a ray from the camera onto a sphere of radius R around the head centre (first intersection) and turns them into azimuth
   (from the front of the face, deg) and height (y) in head space -- to compare where the brim is in 3D across three views.
   node test/brim_back.mjs [--R 1.3] */
import {FILMS} from '../src/film.js';
import {headMatrix, getCamera} from './projection.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, RR = arg('R', '1.25,1.45').split(',').map(Number);
const Q = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/brim_12.json'));
const M22 = FILMS.sample22.shotList, FRAME = {};
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) FRAME[k] = {shot: si + 1, cam: s.camera, h: {sideways: 0, sink: 0, backward: 0, ...s.pose(s.hold && s.hold.includes(i) ? s.hold[0] : i)}}; }); }
const out = {};
for (const [ks, pts] of Object.entries(Q)) {
  const K = FRAME[+ks], Mb = headMatrix(K.h), inv = Mb.clone().invert(), camObj = getCamera(K.cam);
  const c = new THREE.Vector3().setFromMatrixPosition(Mb), o = camObj.position.clone();
  out[ks] = {};
  for (const R of RR) {
    out[ks][R] = pts.map(([x, y]) => {
      const nd = new THREE.Vector3((x + 0.5) / 320 * 2 - 1, 1 - (y + 0.5) / 180 * 2, 0.5).unproject(camObj), d = nd.sub(o).normalize();
      const oc = o.clone().sub(c), b = oc.dot(d), cc = oc.dot(oc) - R * R, disc = b * b - cc;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc), p = o.clone().addScaledVector(d, t).applyMatrix4(inv);
      return [+(Math.atan2(p.x, p.z) * 180 / Math.PI).toFixed(1), +p.y.toFixed(3)];
    }).filter(Boolean);
  }
}
writeFileSync(ROOT + 'private/test/parts/human/brim_head_12.json', JSON.stringify(out));
for (const [ks, v] of Object.entries(out)) console.log('k' + ks, Object.entries(v).map(([R, p]) => `R${R}: ${p.length} points`).join(' '));
