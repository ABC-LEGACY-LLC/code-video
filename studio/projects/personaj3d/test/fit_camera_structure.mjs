/* CAMERA AND POSE -- TO THE NEW MODEL (pass 12, the last step). Alonur: "first the right 3D models, then let's set the camera
   to match them". The model (head, hair, hood, light) is fixed; the shot camera (d, screen, az, el) and the head pose offset
   (tilt, turn, sideways) TOGETHER: human marks (face RMS, test/face11.mjs -- PRIVATE target) + part classes over the whole
   frame (sample: 1 head, 2 inner, 4 figure -- private/test/parts/human/part_target_12.json, PRIVATE; ours: role render,
   window.hoodStructureScore) + figure mass. A change of camera angle is penalized (it trades off against the head pose).
   node test/fit_camera_structure.mjs --shot 3 [--iter 300] [--score '{"name": {"dEl": 5}}'] [--out test/camera_structure_s3.json] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
const {faceScore} = await import('./face11.mjs'), {faceScore1} = await import('./face13_s1.mjs');   // shot 1: Alonur's marks R03, R10 (pass 13)
const {FILMS} = await import('../src/film.js');
const S = +arg('shot', 3), si = S - 1, sh = FILMS.sample22.shotList[si], cam0 = sh.camera;
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]}[S];
const M = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/part_target_12.json')).m, GR = {};
for (const f of FR) { const m = Buffer.from(M[String(f)], 'base64'), px = new Array(W * H), c = new Array(W * H);
  for (let j = 0; j < W * H; j++) { px[j] = j; const b = m[j]; c[j] = b & 1 ? 0 : b & 2 ? 1 : b & 4 ? 2 : 3; } GR[f] = {px, c}; }
await pg.evaluate(g => { window.__GR = g; }, GR);
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FT = FIG['shot' + S];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const iou = (C, k) => { let r = 0, c = 0; for (let j = 0; j < 4; j++) { r += C[k * 4 + j]; c += C[j * 4 + k]; } const d = r + c - C[k * 4 + k]; return d ? C[k * 4 + k] / d : 1; };
const VZ = {face: +arg('wy', 1 / 3), head: +arg('wb', 3), inner: +arg('wi', 1.5), outer: +arg('wt', 1.5), fig: +arg('wf', 2)};
const KP = [['dPitch', -0.6, 0.6, 0.04], ['dYaw', -0.8, 0.8, 0.05], ['dSide', -0.4, 0.4, 0.03], ['dD', -3, 3, 0.3], ['dSx', -0.15, 0.15, 0.01],
            ['dSy', -0.15, 0.15, 0.01], ['dAz', -30, 30, 3], ['dEl', -35, 35, 3]];
async function score(v) {
  const o = {poseShot: {[si]: {dPitch: v.dPitch || 0, dYaw: v.dYaw || 0, dSide: v.dSide || 0}},
             camShot: {[si]: {az: cam0.az + (v.dAz || 0), el: cam0.el + (v.dEl || 0), d: cam0.d + (v.dD || 0), screen: [cam0.screen[0] + (v.dSx || 0), cam0.screen[1] + (v.dSy || 0)]}}};
  const r = await pg.evaluate(({o, fr}) => window.hoodStructureScore(o, fr, null), {o, fr: FR});
  const C = new Array(16).fill(0), B = new Array(576).fill(0);
  for (const f of FR) { r[f].conf.forEach((x, i) => C[i] += x); r[f].B.forEach((x, i) => B[i] += x / FR.length); }
  const yz = S === 1 ? faceScore1(v) : faceScore(S, v);
  const b = {yz, head: iou(C, 0), inner: iou(C, 1), outer: iou(C, 2), fig: soft(B, FT)};
  b.F = VZ.face * yz + VZ.head * (1 - b.head) + VZ.inner * (1 - b.inner) + VZ.outer * (1 - b.outer) + VZ.fig * (1 - b.fig) + 0.5 * (((v.dAz || 0) / 15) ** 2 + ((v.dEl || 0) / 15) ** 2);
  return b;
}
const fmt = b => `F ${b.F.toFixed(3)} | face ${b.yz.toFixed(2)} px | head ${b.head.toFixed(3)} inner ${b.inner.toFixed(3)} outer ${b.outer.toFixed(3)} fig ${b.fig.toFixed(3)}`;
if (arg('score', null)) for (const [name, v] of Object.entries(JSON.parse(arg('score')))) console.log(name.padEnd(12), fmt(await score(v)));
if (process.argv.includes('--fit')) {
  const ITER = +arg('iter', 300), B0 = arg('start', null) ? JSON.parse(arg('start')) : {};
  const x0 = KP.map(([n]) => B0[n] || 0), lo = KP.map(t => t[1]), hi = KP.map(t => t[2]), q = KP.map(t => t[3]);
  const getV = x => Object.fromEntries(KP.map(([n], i) => [n, x[i]]));
  let n = 0, optimum = null;
  const write = () => writeFileSync(ROOT + arg('out', `test/camera_structure_s${S}.json`), JSON.stringify({shot: S, score: n, result: optimum.b, v: Object.fromEntries(Object.entries(getV(optimum.x)).map(([k, t]) => [k, +t.toFixed(4)])),
    camera: {az: +(cam0.az + optimum.x[6]).toFixed(3), el: +(cam0.el + optimum.x[7]).toFixed(3), d: +(cam0.d + optimum.x[3]).toFixed(4), screen: [+(cam0.screen[0] + optimum.x[4]).toFixed(4), +(cam0.screen[1] + optimum.x[5]).toFixed(4)]}}, null, 1));
  const f = async x => { const b = await score(getV(x)); if (!optimum || b.F < optimum.b.F) { optimum = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)} | ${KP.map(([nn], i) => nn + ' ' + x[i].toFixed(3)).join(' ')}`); write(); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, stall = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; stall = 0; } else if (++stall > 40) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  console.log('FINAL', fmt(optimum.b), JSON.stringify(getV(optimum.x)));
}
await br.close(); srv.close();
