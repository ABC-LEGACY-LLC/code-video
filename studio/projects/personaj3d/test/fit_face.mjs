/* FACE FIT -- the head proportions (face length, chin, lower face, nose), the places of the face drawing (eyes, mouth) and
   each shot's pose (tilt, turn) + the camera shift are fitted to the sample's FACE POINTS. The drawing is ours;
   only the place is measured (technique: staging and proportion).
   Sample points (320x180), read from the L tables (tools/compare table, +-2 px):
     frame 3 (shot 1, held): near eye (97.6, 46.3) -- the anchor probe; far eye pupil (121, 48.5);
       mouth line centre (122.5, 85); chin (the lower turn of the face's front line) (127, 107)
     frame 12 (shot 2, profile): closed eye line centre (137, 78); nose tip (161, 90); mouth (162, 104);
       chin (155, 114)
   node test/fit_face.mjs  ->  test/face_fit.json */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=320&h=180&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});

const M1 = {near: [97.6, 46.3], far: [121, 48.5], mouth: [122.5, 85], chin: [127, 107]};
const M2 = {near: [137, 78], nose: [161, 90], mouth: [162, 104], chin: [155, 114]};
// parameters: [name, min, max, initial]
const PAR = [   // attempt 2: pose and camera FIXED (in attempt 1 the tilt went to -0.79 and the face ended up seen from below -- the 4 points
               // matched, the look was wrong: "right number, wrong reason"); only the face shape and the drawing places
  ['chinY', 0.0, 0.6, 0.20], ['chinZ', 0.0, 0.9, 0.16], ['jawBack', -0.3, 0.35, 0.20], ['nose', 0.05, 0.40, 0.13],
  ['mouthY', -0.95, -0.50, -0.64], ['eyeY', -0.32, -0.02, -0.17],
];
const LAYERS = {pitch1: -0.30, yaw1: -0.15, ex1: 0.261, ey1: 0.31, pitch2: 0.02, yaw2: 0.12, ex2: 0.31, ey2: 0.39, d2: 9.51};
const X0 = PAR.map(([n, a, b, v]) => (v - a) / (b - a));
const ob = x => ({...LAYERS, ...Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]))});
const error = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
async function score(x) {
  const o = ob(x);
  const head = {chinY: o.chinY, chinZ: o.chinZ, jawBack: o.jawBack, nose: o.nose}, face = {mouthY: o.mouthY, eyeY: o.eyeY};
  const r1 = await pg.evaluate(a => window.facePoints(a), {head, face, cam: {az: 55, el: -8, d: 7.03, fov: 27, screen: [o.ex1, o.ey1], centre: [0, 0, 0]},
    pose: {tilt: o.pitch1, turn: o.yaw1, sideways: 0, closed: 0}});
  const r2 = await pg.evaluate(a => window.facePoints(a), {head, face, cam: {az: 84, el: -4, d: o.d2, fov: 27, screen: [o.ex2, o.ey2], centre: [0, 0, 0]},
    pose: {tilt: o.pitch2, turn: o.yaw2, sideways: 0, closed: 1}});
  let e = 0; for (const k in M1) e += error(r1[k], M1[k]); for (const k in M2) e += error(r2[k], M2[k]);
  const reg = 0.5 * x.reduce((s, t, i) => s + (t - X0[i]) ** 2, 0);        // small: no needless drift from the start
  return {f: e + reg, e, r1, r2, o};
}
async function nelder(x0, step, iter) {
  const N = x0.length, P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + step)); P.push(p); }
  let F = []; for (const p of P) F.push(await score(p));
  const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N].f - F[0].f < 1e-5) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await score(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await score(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await score(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await score(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0]; return {x: P[i], r: F[i]};
}
const b0 = await score(X0);
console.log('initial error (px RMS):', Math.sqrt(b0.e / 8).toFixed(2));
let optimum = {x: X0, r: b0};
for (let q = 0; q < 4; q++) {
  const r = await nelder(optimum.x, q === 0 ? 0.15 : 0.08, 1500);
  if (r.r.f < optimum.r.f) optimum = r;
  console.log('restart', q, 'error px RMS', Math.sqrt(optimum.r.e / 8).toFixed(2));
}
const o = optimum.r.o, f = v => v.map(t => t.toFixed(1)).join(', ');
console.log(JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v));
for (const k in M1) console.log('shot 1', k, 'ours (' + f(optimum.r.r1[k]) + ')  sample (' + f(M1[k]) + ')');
for (const k in M2) console.log('shot 2', k, 'ours (' + f(optimum.r.r2[k]) + ')  sample (' + f(M2[k]) + ')');
writeFileSync(ROOT + 'test/face_fit2.json', JSON.stringify({param: o, error_px: Math.sqrt(optimum.r.e / 8), r1: optimum.r.r1, r2: optimum.r.r2, M1, M2}, null, 1));
await br.close(); srv.close();
