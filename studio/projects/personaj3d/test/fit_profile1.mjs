/* OBSOLETE (pass 5): this script uses HEAD.profileW as the lower-face shift -- the shift now lives in HEAD.shift (shiftZ),
   and profileW is only the near-eye map. Use instead: test/fit_pose1c.mjs (shift and eye map kept apart). */
/* SHOT 1 PROFILE WEIGHT (pass 4) -- in frames 7..11 the forward stretch of the lower face (HEAD.profileZ * w) is fitted to the
   sample's front contour edges (pose from film.js, fixed). Why: tools/compare probe (head v3): in 1-6 the front contour difference
   is -0.5 px, in 7-9 -2.6..-4.0 px (ours to the left) -- in the sample a new drawing (from frame 7 on) puts the lower face further
   forward; the view angle changes by 3 deg while the stretch jumps -> not a function of the angle, a value per drawing.
   Sample edges (tools/compare probe sample values, absolute): row y -> contour x (far_edge_y20/y30, chin_front_y52).
   node test/fit_profile1.mjs */
import {HEAD, headShape} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {FILMS} from '../src/film.js';
const sh = FILMS.sample22.shotList[0];
const Q = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
           10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
function points() { const out = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; out.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return out; }
const rowMax = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
for (const k of [7, 8, 9, 10, 11]) {
  const p = projector(sh.camera, sh.pose(k - 1)); let s = `${k}: `, best = null;
  for (let w = 0; w <= 1.001; w += 0.1) {
    HEAD.profileW = w; const P = points().map(p);
    const r = Q[k].map(([y, x]) => rowMax(P, y) - x), e = r.reduce((a, t) => a + t * t, 0);
    s += `w${w.toFixed(1)} [${r.map(t => t.toFixed(1)).join(' ')}]  `;
    if (!best || e < best.e) best = {e, w};
  }
  console.log(s + ` => best w ${best.w.toFixed(1)}`);
}
