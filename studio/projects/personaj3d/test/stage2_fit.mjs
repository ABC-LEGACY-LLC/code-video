/* SHOT 2 STAGE (pass 5) -- profile: the camera and head pose are fitted to the sample's FRONT CONTOUR (rows) and the
   under-chin (columns); the eye is NOT part of the fit (the anime profile eye is drawn elsewhere) -- after the fit the sample's
   eye (closed lash line) is back-projected onto the head surface: where the profile eye is in head space.
   Sample k12 (320x180, L table, 2 px step): front contour row y -> x (the change from skin L~59 to the dark line);
   under-chin y 113..114 (x 144..156); closed-eye lash line (133, 77.5) -> (144, 80), centre (138.5, 78.5).
   The previous (pass 4) fit matched the front contour with a LOWER FACE SHIFT (profileZ): in a 2D curve fit, with the shift
   the best pitch was -15 deg (up, RMS 1.97), without it +5 deg (slightly tilted, RMS 1.35) -- the shift tipped the face back.
   node test/stage2_fit.mjs --el -5 */
import {HEAD, FACE, facePoint, headShape} from '../src/personaj.js';
import {projector} from './projection.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const EL = +arg('el', -5), FOV = 27;
HEAD.profileW = +arg('pw', 0);
const ROW = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const JAW = [[146, 114], [150, 113.5], [154, 113]];
const EYE = [[133, 77.5], [138.5, 78.5], [144, 80]];
const S = []; for (let j = 0; j <= 140; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 140; for (let i = 0; i <= 80; i++) { const ph = -1.9 + 3.8 * i / 80; S.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const rowMax = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.6 && q[0] > m) m = q[0]; return m; };
const columnMax = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.6 && q[1] > m) m = q[1]; return m; };
const PAR = [['az', 70, 110], ['d', 6, 18], ['sx', 0.1, 0.9], ['sy', 0.1, 0.9], ['eg', -0.6, 0.8], ['yaw', -0.3, 0.3], ['side', -0.3, 0.3]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
const cam = o => ({az: o.az, el: EL, d: o.d, fov: FOV, screen: [o.sx, o.sy]}), pos = o => ({tilt: o.eg, turn: o.yaw, sideways: o.side});
function score(x, detailed = false) {
  const o = ob(x), p = projector(cam(o), pos(o)), Q = S.map(p), e = [], r = {};
  r.q = ROW.map(([y]) => rowMax(Q, y)); ROW.forEach(([y, xx], i) => e.push(r.q[i] - xx));
  r.u = JAW.map(([xx]) => columnMax(Q, xx)); JAW.forEach(([xx, y], i) => e.push(r.u[i] - y));
  const f = e.reduce((a, v) => a + v * v, 0) + (o.side / +arg('sideS', 0.1)) ** 2 + (o.yaw / +arg('yawS', 0.15)) ** 2;
  return detailed ? {f, e, r, o, rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)} : f;
}
function nelder(x0, q, it) {
  const N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -q : q))); P.push(pp); }
  let F = P.map(pp => score(pp));
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = score(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = score(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = score(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = score(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}
let optimum = null;
for (const pitch0 of [-0.2, 0.1, 0.35]) for (const az0 of [80, 92]) for (const d0 of [10, 13]) {
  const v0 = {az: az0, d: d0, sx: 0.45, sy: 0.45, eg: pitch0, yaw: 0, side: 0}, x0 = PAR.map(([n, a, b]) => (v0[n] - a) / (b - a));
  let r = nelder(x0, 0.12, 1200); r = nelder(r.x, 0.03, 1200); if (!optimum || r.f < optimum.f) optimum = r;
}
const b = score(optimum.x, true), o = b.o, f = v => v.toFixed(3);
console.log(`el ${EL}: RMS ${b.rms.toFixed(2)} px | az ${o.az.toFixed(1)} d ${f(o.d)} screen [${f(o.sx)}, ${f(o.sy)}] | tilt ${f(o.eg)} (${(o.eg * 57.3).toFixed(1)} deg) turn ${f(o.yaw)} sideways ${f(o.side)}`);
console.log('   contour residual ' + b.e.slice(0, ROW.length).map(v => v.toFixed(1)).join(' ') + ' | jaw ' + b.e.slice(ROW.length).map(v => v.toFixed(1)).join(' '));
// where our eye (3/4 position) lands, and which point of the head surface the sample's eye is
const p = projector(cam(o), pos(o));
const bk = p(facePoint(-FACE.eyeX, FACE.eyeY - 0.013));
console.log(`   our closed eye line (3/4 position) -> (${bk.map(v => v.toFixed(1))}), sample (138.5, 78.5): diff ${(bk[0] - 138.5).toFixed(1)}, ${(bk[1] - 78.5).toFixed(1)} px`);
const near = S.filter(q => q[0] < 0 && q[2] > -0.6);        // the near (right) side, not the back
for (const [n, t] of [['back tip', EYE[0]], ['centre', EYE[1]], ['front tip', EYE[2]]]) {
  let bb = null; for (const q of near) { const s = p(q), e = (s[0] - t[0]) ** 2 + (s[1] - t[1]) ** 2; if (!bb || e < bb.e) bb = {e, q}; }
  console.log(`   sample eye ${n} (${t}) -> head surface (${bb.q.map(v => v.toFixed(3))}) error ${Math.sqrt(bb.e).toFixed(2)} px`);
}
if (process.argv.includes('--json')) console.log(JSON.stringify({el: EL, ...o, rms: b.rms}));
