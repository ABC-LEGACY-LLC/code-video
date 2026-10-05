/* HEAD SURFACE -> SCREEN (pass 12, structure): a grid (azimuth x height) of points at distance off outside the head surface
   (the hair layer), and for each given frame their position on screen and visibility (does the surface normal face the camera).
   Python puts the sample's and our classes (hair / skin / other) onto this grid and outputs the hair's COVERAGE MAP on the head
   surface (from the three views together) -- to measure where to put the hair in 3D (test/parts/hair_map.py).
   node test/surface_projection.mjs [--off 0.08] [--frames 3,10,12,16,20] [--out private/test/parts/surface_projection.json] */
import {HEAD, headShape} from '../src/personaj.js';
import {FILMS} from '../src/film.js';
import {projector, headMatrix, getCamera} from './projection.mjs';
import * as THREE from 'three';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, OFF = +arg('off', 0.08);
const KS = arg('frames', '3,10,12,16,20').split(',').map(Number);
HEAD.shift = 0; HEAD.profileW = 0;
const M22 = FILMS.sample22.shotList, FRAME = [];
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) FRAME.push({k, shot: si + 1, i, cam: s.camera, h: {sideways: 0, sink: 0, backward: 0, ...s.pose(s.hold && s.hold.includes(i) ? s.hold[0] : i)}}); }); }
/* grid: azimuth a (deg, 0 -- front of the face, -90 -- the near (right, -x) side, +90 -- the far one), height y (head space) */
const AZ = [], YS = [];
for (let a = -180; a <= 180; a += 5) AZ.push(a);
const YMAX = +arg('ymax', 1.05);                      // pass 12: the top too (the crown of the skull) -- --ymax 1.3
for (let y = YMAX; y >= -1.35; y -= 0.05) YS.push(+y.toFixed(3));
function surface(a, y) {                          // the surface point at this azimuth and height (by searching the unit-sphere direction)
  const ph = a * Math.PI / 180;
  let lo = -Math.PI / 2, hi = Math.PI / 2;     // latitude al: headShape(y) grows monotonically
  for (let i = 0; i < 40; i++) { const m = 0.5 * (lo + hi), p = headShape(Math.cos(m) * Math.sin(ph), Math.sin(m), Math.cos(m) * Math.cos(ph), true); if (p[1] < y) lo = m; else hi = m; }
  const al = 0.5 * (lo + hi);
  return headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true);
}
const out = {off: OFF, az: AZ, y: YS, frame: {}};
const P = YS.map(y => AZ.map(a => {
  const s = surface(a, y), e = 1e-3, s1 = surface(a + 0.5, y), s2 = surface(a, y + e);
  const t1 = s1.map((v, i) => v - s[i]), t2 = s2.map((v, i) => v - s[i]);
  let n = [t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0]];
  const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
  if (n[0] * s[0] + n[1] * s[1] + n[2] * s[2] < 0) n = n.map(v => -v);          // outward
  return {p: s.map((v, i) => v + n[i] * OFF), n};
}));
for (const k of KS) {
  const K = FRAME.find(K => K.k === k), pr = projector(K.cam, K.h), Mb = headMatrix(K.h), camObj = getCamera(K.cam);
  const cp = camObj.position.clone(), R = new THREE.Matrix3().setFromMatrix4(Mb);
  out.frame[k] = P.map(row => row.map(({p, n}) => {
    const w = new THREE.Vector3(...p).applyMatrix4(Mb), nw = new THREE.Vector3(...n).applyMatrix3(R).normalize();
    const vis = nw.dot(cp.clone().sub(w).normalize());
    const [x, y] = pr(p);
    return [+x.toFixed(2), +y.toFixed(2), +vis.toFixed(3)];
  }));
}
writeFileSync(ROOT + arg('out', 'private/test/parts/surface_projection.json'), JSON.stringify(out));
console.log('grid', YS.length, 'x', AZ.length, 'frames', KS.join(','));
