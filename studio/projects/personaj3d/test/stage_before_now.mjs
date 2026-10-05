/* STAGE: BEFORE (pass 4, delivered) vs NOW (pass 5) -- residuals against the sample's shot 2 and shot 3 targets (the same code,
   no render). Shot 2 (k12): front contour 21 rows + under-chin 3 columns + closed eye line; shot 3 (k22): eyelid
   line + chin front edge 7 rows + under-jaw 2 columns. Shift/profile: before, a profile weight (together with the lower face shift),
   now the shift and the eye card separately. node test/stage_before_now.mjs */
import {HEAD, FACE, headShape, eyePoint} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {FILMS} from '../src/film.js';
const surface = () => { const S = []; for (let j = 0; j <= 400; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 400; for (let i = 0; i <= 200; i++) { const ph = -1.9 + 3.8 * i / 200; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
const rowMax = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.4 && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.4 && q[1] > m) m = q[1]; return m; };
const rms = v => Math.sqrt(v.reduce((a, t) => a + t * t, 0) / v.length);
const N2 = {q: [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]],
            u: [[146, 114], [150, 113.5], [154, 113]], eye: [138.5, 78.5]};
const N3 = {q: [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], u: [[146, 158], [150, 158]], eye: [155.7, 112.0]};
function score(name, cam, pose, shift, w, N, eyeDy) {
  HEAD.shift = shift; const p = projector(cam, pose), Q = surface().map(p);
  const eq = N.q.map(([y, x]) => rowMax(Q, y) - x), eu = N.u.map(([x, y]) => columnMax(Q, x) - y);
  const k = p(eyePoint(w, 0, eyeDy)), ek = [k[0] - N.eye[0], k[1] - N.eye[1]];
  HEAD.shift = 0;
  console.log(`${name}: contour RMS ${rms(eq).toFixed(2)} px (max ${Math.max(...eq.map(Math.abs)).toFixed(1)}), under-chin ${eu.map(v => v.toFixed(1)).join(' ')}, eye ${ek.map(v => v.toFixed(1)).join(', ')} px | tilt ${pose.tilt} (${(pose.tilt * 57.3).toFixed(0)} deg)`);
}
const H = FACE.eyeH, F = FILMS.sample22.shotList;
console.log('--- shot 2 (k12) ---');
score('BEFORE', {az: 84, el: -4, d: 11.0, fov: 27, screen: [0.346, 0.425]}, {tilt: -0.10, turn: 0, sideways: 0}, 1.0, 0, N2, -0.1 * H);
score('NOW', F[1].camera, F[1].pose(0), 0, F[1].profile, N2, -0.1 * H);
console.log('--- shot 3 (k22) ---');
const s = 1;
score('BEFORE', {az: 80, el: -5, d: 8.10, fov: 29, screen: [0.396, 0.39]}, {tilt: 0.15 + 0.15 * s, turn: 0.10, sideways: 0.0, sink: -0.493 * s, backward: 0.379 * s}, 0.5, 0, N3, 0);
score('NOW', F[2].camera, F[2].pose(8), 0, F[2].profile, N3, 0);
