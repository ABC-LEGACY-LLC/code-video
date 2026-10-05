/* CAMERA FIT -- each shot's camera (screen, distance) and the shot 3 pose are fitted to the sample's FACE points:
   the near eye and the chin (320x180). The face is the anchor of the composition: in the fit by the bright mass (hair) the face
   was 45 px to the right in shot 1 and 1.6 times too big in shot 2 (audit 2). Sample points: shot 1 near eye -- the tools/compare
   anchor probe (97.6, 46.3); the others read from the grid sheet (+-5 px): shot 1 chin (120, 107); shot 2 eye
   (138, 77), chin (150, 118); shot 3 frame 14 eye (172, 83), chin (185, 125); frame 22 eye (158, 113), chin (170, 150).
   No render: projection only (window.points). node test/fit_camera.mjs */
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

const EYE = [-0.35, -0.17, 0.93], CHIN = [0, -1.10, 0.40];
const nm = (f, x0, step, iter = 400) => {           // plain Nelder-Mead (not async, for a synchronous score array -- the async one is below)
};
async function nelder(f, x0, step, iter = 300) {
  const N = x0.length, P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] += step[i]; P.push(p); }
  let F = []; for (const p of P) F.push(await f(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = c.map((t, j) => t + (t - P[N][j])), fr = await f(xr);
    if (fr < F[0]) { const xe = c.map((t, j) => t + 2 * (t - P[N][j])), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = c.map((t, j) => t + 0.5 * (P[N][j] - t)), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j])); F[i] = await f(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
const cam = (az, el, fov, x) => ({az, el, d: x[2], fov, screen: [x[0], x[1]], centre: [0, 0, 0]});
const error = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const result = {};

// shot 1: pose 0 (held 1..6)
const P1 = {tilt: -0.30, turn: -0.15, sideways: 0, closed: 0};
let r = await nelder(async x => { const [k, c] = await pg.evaluate(({K, P, pts}) => window.points(K, P, pts), {K: cam(55, -8, 27, x), P: P1, pts: [EYE, CHIN]}); return error(k, [97.6, 46.3]) + error(c, [120, 107]); }, [0.40, 0.39, 7.0], [0.05, 0.05, 0.8]);
result.shot1 = {screen: [r.x[0], r.x[1]], d: r.x[2], error_px: Math.sqrt(r.f / 2)};
// shot 2: in profile the chin match is unclear (our chin is 0.53 units behind the eye, the sample's is in front) -- the scale from
// the vertical eye-chin distance: sample 41 px, ours (d 6.0) 65 px -> d = 6.0 * 65 / 41; only the eye position is fitted
const D2 = 6.0 * 65 / 41;
const P2 = {tilt: 0.02, turn: 0.12, sideways: 0, closed: 1};
r = await nelder(async x => { const [k] = await pg.evaluate(({K, P, pts}) => window.points(K, P, pts), {K: cam(84, -4, 27, [x[0], x[1], D2]), P: P2, pts: [EYE]}); return error(k, [138, 77]); }, [0.42, 0.43], [0.05, 0.05]);
result.shot2 = {screen: [r.x[0], r.x[1]], d: D2, error_px: Math.sqrt(r.f)};
// shot 3: scale eye-chin 42 px (frame 14), ours (d 6.8) 50 px -> d = 6.8 * 50 / 42; a small tilt (0.15 -> 0.30);
// the eye moves (-14, +30) px over 14 -> 22 -- the head sinks BACK and down: sink c and backward o are fitted
const D3 = 6.8 * 50 / 42;
r = await nelder(async x => {
  let e = 0;
  for (const [i, tk] of [[0, [172, 83]], [8, [158, 113]]]) {
    const s = Math.pow(i / 8, 0.55);
    const P3 = {tilt: 0.15 + 0.15 * s, turn: 0.10, sideways: 0, closed: 0.5, sink: -x[2] * s, backward: x[3] * s};
    const [k] = await pg.evaluate(({K, P, pts}) => window.points(K, P, pts), {K: cam(80, -5, 29, [x[0], x[1], D3]), P: P3, pts: [EYE]});
    e += error(k, tk);
  }
  return e + 100 * (Math.max(0, -x[2]) + Math.max(0, x[2] - 1.2) + Math.max(0, -x[3] - 0.2) + Math.max(0, x[3] - 1.0));
}, [0.46, 0.54, 0.6, 0.3], [0.05, 0.05, 0.2, 0.2]);
result.shot3 = {screen: [r.x[0], r.x[1]], d: D3, tilt: '0.15 + 0.15 s', sinkC: r.x[2], backwardO: r.x[3], error_px: Math.sqrt(r.f / 2)};
console.log(JSON.stringify(result, null, 1));
writeFileSync(ROOT + 'test/camera_fit.json', JSON.stringify(result, null, 1));
await br.close(); srv.close();
