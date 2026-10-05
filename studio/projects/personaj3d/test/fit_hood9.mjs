/* ONE HOOD -- FOR ALL THREE SHOTS TOGETHER (pass 9, 2c). In passes 7-8 the hood was fitted to each shot separately (three different
   surfaces + shot-dependent following) -- in the camera test it jumped 114 / 159 px when the key changed. Now: one surface
   (CLOTHES.hood), following the head over time (tau -- the cloth's inertia), the upper part's tilt from the pose (eg + pitchK x tilt).
   Target (the measurements of fit_hood7, the same code): IoU with the sample's visible head in each frame (private/test/sample_head7.json),
   soft IoU with the figure blocks per shot (private/test/sample_figure8.json) -- THE THREE SHOTS weighted EQUALLY.
   The shot 2 camera (distance, screen) is fitted too, but TIED to the FACE: the front contour (21 rows) and under the chin
   (the test/fit_head9.mjs targets, node projection) are penalized when their RMS exceeds 1.5 px -- the camera stays fitted to the face,
   the mass difference is resolved IN THE HOOD (in pass 8 the shot 2 camera was pulled to the mass, 12.88 -> 10.32, the face came out 1.25 times too big).
   node test/fit_hood9.mjs [--iter 400] [--start 1|2|3|current] [--score-only] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {HEAD, headShape} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 400), ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'private/test/sample_head7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]], FRALL = FR.flat();
const PAR = [['openness', 0.7, 2.6], ['openV0', -0.25, 0.30], ['openV1', 0.10, 0.60], ['pushZ', -1.2, 1.2], ['pushY', -0.8, 0.8],
             ['wholeZ', -0.8, 0.8], ['wholeY', -0.9, 0.6], ['r0', 1.12, 1.6], ['yaw', -0.8, 0.8], ['visor', 0, 1.0],
             ['eg', -0.4, 1.0], ['tipY', 0.5, 2.2], ['dome', 0.1, 1.2], ['openA', 0.5, 2.0], ['openB', 0.5, 2.0],
             ['bandA', 0.5, 7.0], ['bandB', 0.5, 7.0], ['bandAlt', 0, 1.5], ['bandBlt', 0, 1.5], ['bandV', 0.40, 0.90],
             ['tau', 0.0, 0.4], ['pitchK', -0.5, 1.2], ['d2', 9.0, 14.0], ['sx2', 0.34, 0.50], ['sy2', 0.36, 0.52]];
/* shot 2 face targets (stage2_fit.mjs / fit_head9.mjs) -- node projection, the pose as in the film (i = 0) */
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const J2 = [[146, 114], [150, 113.5], [154, 113]];
HEAD.shift = 0; HEAD.profileW = 0;
const S2 = []; for (let j = 0; j <= 140; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 140; for (let i = 0; i <= 80; i++) { const ph = -1.9 + 3.8 * i / 80; S2.push(headShape(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
function face2(d, sx, sy) {
  const p = projector({az: 83.6, el: -5, fov: 27, d, screen: [sx, sy]}, {tilt: -0.014, turn: 0, sideways: 0});
  const q = Q2.map(() => -1e9), u = J2.map(() => -1e9);
  for (const s of S2) { const v = p(s);
    for (let i = 0; i < Q2.length; i++) if (Math.abs(v[1] - Q2[i][0]) < 0.6 && v[0] > q[i]) q[i] = v[0];
    for (let i = 0; i < J2.length; i++) if (Math.abs(v[0] - J2[i][0]) < 0.6 && v[1] > u[i]) u[i] = v[1]; }
  const e = [...Q2.map(([y, x], i) => q[i] - x), ...J2.map(([x, y], i) => u[i] - y)];
  return Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length);
}
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
let X0 = null, n = 0;
async function score(x) {
  const o = ob(x), hood = Object.fromEntries(Object.entries(o).filter(([k]) => !['d2', 'sx2', 'sy2'].includes(k)));
  const r = await pg.evaluate(({hood, cam, fr}) => window.hoodScore9(hood, cam, fr), {hood, cam: {1: {d: o.d2, screen: [o.sx2, o.sy2]}}, fr: FRALL}); n++;
  const sh = FR.map((fr, s) => ({iou: fr.reduce((a, f) => a + r.iou[f], 0) / fr.length, fig: soft(r.B[s], FIGT[s])}));
  const yz = face2(o.d2, o.sx2, o.sy2), penalty = 0.01 * Math.max(0, yz - 1.5) ** 2;
  const reg = X0 ? 0.002 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0) : 0;
  /* --weight frame: the visible head -- by time on screen (11/2/9), the figure -- shots equal */
  const VK = arg('weight', 'equal') === 'frame' ? [11 / 22, 2 / 22, 9 / 22] : [1 / 3, 1 / 3, 1 / 3];
  const f = sh.reduce((a, s, i) => a + VK[i] * (1 - s.iou) + 0.5 * (1 - s.fig) / 3, 0) + penalty + reg;
  return {f, sh, yz, o, r};
}
const draw = (s, b) => console.log('%s f %s | head IoU %s | figure %s | face2 RMS %s', s, b.f.toFixed(4), b.sh.map(t => t.iou.toFixed(3)).join('/'), b.sh.map(t => t.fig.toFixed(3)).join('/'), b.yz.toFixed(2));
/* starting points: the three per-shot hoods of passes 7-8 (each on ALL shots) and the current CLOTHES.hood */
const BASE = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__clothesCurrent().hood)));
const SHOT_HOOD = [{openness: 0.842, openV0: -0.2, openV1: 0.534, pushZ: 0.343, pushY: 0.034, wholeZ: -0.09, wholeY: -0.425, r0: 1.304, yaw: 0.069, visor: 0.206, eg: 0.052, tipY: 1.262, dome: 0.507, openA: 1.213, openB: 1.26, bandA: 4.836, bandAlt: 0.264, bandV: 0.6},
                 {openness: 1.81, openV0: -0.179, openV1: 0.446, pushZ: 0.74, pushY: 0.594, wholeZ: 0.217, wholeY: -0.77, r0: 1.435, yaw: 0.054, bandA: 3.754, bandB: 0.593},
                 {openness: 1.252, openV0: 0.133, openV1: 0.357, pushZ: 0.626, pushY: 0.702, wholeZ: -0.52, wholeY: -0.103, r0: 1.19, yaw: 0.482, visor: 0.036, eg: 0.41, tipY: 1.031, dome: 0.312, openA: 0.624, openB: 1.044, bandA: 4.792, bandV: 0.56}];
const CAM2 = {d2: 12.70, sx2: 0.4045, sy2: 0.4356};     // test/fit_head9.mjs: the shot 2 camera fitted to the face
const tox = v => PAR.map(([nm, a, b]) => Math.min(1, Math.max(0, ((v[nm] ?? 0) - a) / (b - a))));
let optimum = null;
const names = ['current', 'shot 1', 'shot 2', 'shot 3'];
for (const [i, k] of [BASE, ...SHOT_HOOD.map(s => ({...BASE, ...s}))].entries()) {
  const b = await score(tox({tau: 0, pitchK: 0, ...k, ...CAM2})); draw('start: the ' + names[i] + ' hood in every shot:', b);
  if (!optimum || b.f < optimum.b.f) optimum = {b, x: tox({tau: 0, pitchK: 0, ...k, ...CAM2}), name: names[i]};
}
if (process.argv.includes('--score-only')) {
  /* --test '[{...}]' -- the given values (on top of BASE); "mix": [t1, t2, t3] -- a weighted mean of the three shots' hoods */
  for (const v of JSON.parse(arg('test', '[]'))) {
    let k = {...BASE, tau: 0, pitchK: 0, ...CAM2};
    if (v.mix) { const S = SHOT_HOOD.map(t => ({...BASE, ...t})); for (const [nm] of PAR) if (S[0][nm] !== undefined) k[nm] = v.mix.reduce((a, w, i) => a + w * (S[i][nm] ?? BASE[nm] ?? 0), 0); }
    k = {...k, ...Object.fromEntries(Object.entries(v).filter(([nm]) => nm !== 'mix'))};
    draw(JSON.stringify(v).slice(0, 80), await score(tox(k)));
  }
  await br.close(); srv.close(); process.exit(0);
}
if (arg('start', null) !== null) {       // --start 0..3 (the current hood, the shot 1, 2, 3 hood) or JSON (full values)
  const b = arg('start'), v = /^[0-3]$/.test(b) ? {tau: 0, pitchK: 0, ...[BASE, ...SHOT_HOOD.map(t => ({...BASE, ...t}))][+b], ...CAM2} : {...BASE, ...JSON.parse(b)};
  optimum = {x: tox(v), name: 'start ' + b.slice(0, 40)}; optimum.b = await score(optimum.x); draw('forced start:', optimum.b);
}
console.log('starting from:', optimum.name);
X0 = optimum.x.slice();
async function nm(z0, iter, step) {
  const N = z0.length, P = [z0.slice()];
  for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = []; for (const p of P) F.push(await score(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) { draw('  ' + k + ' (score ' + n + ')', F[0]); writeFileSync(ROOT + 'test/hood9_fit' + (arg('out', '') || '') + '.json', JSON.stringify({o: F[0].o, f: F[0].f, sh: F[0].sh, yz: F[0].yz, k}, null, 1)); }
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await score(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await score(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await score(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await score(P[i]); } }
  }
  return {x: P[0], b: F[0]};
}
let r = await nm(optimum.x, ITER, 0.12);
draw('run 1:', r.b);
for (let q = 0; q < +arg('restarts', 2); q++) { r = await nm(r.x, ITER, 0.05); draw(`restart ${q + 1}:`, r.b); }
writeFileSync(ROOT + 'test/hood9_fit' + (arg('out', '') || '') + '.json', JSON.stringify({o: r.b.o, f: r.b.f, sh: r.b.sh, yz: r.b.yz, score: n}, null, 1));
console.log('RESULT', JSON.stringify(r.b.o));
await br.close(); srv.close();
