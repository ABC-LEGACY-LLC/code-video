/* CLOTHES FIT -- the hood, cloak and torso parameters are fitted TOGETHER in shots 1 and 3 to the sample's figure mass (occlusion map, 10 px
   blocks, 320x180). Fit, not trace: the shape is our own parametric model, the render is
   the same code as the final render (role style, 320x180). Objective: 1 - mean soft IoU (the covered
   fraction of a block 0..1, sample block 0/1) + penalty: when the visible head (skin+hair) falls below 85 % of the
   initial one. Nelder-Mead (on normalized [0,1] parameters) + random restarts.
   node test/fit_clothes.mjs [--iter 400] [--restarts 3] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 400), RESTARTS = +arg('restarts', 3);
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180;
const pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});

const T = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure.json'));
const SHOT = {shot1: [0, 3, 6, 8, 9, 10], shot3: [13, 15, 17, 19, 21]};
const FR = [...SHOT.shot1, ...SHOT.shot3];

// parameters: [group, name, min, max]
const PAR = [   // bounds: plausible for anatomy/clothing. Attempt 2: the hood's front radius (r0) close to the head -- its back
               // (back) large; at r0 1.67 the front side came out as a "visor" over the face (audit 2)
  ['hood', 'r0', 1.12, 1.40], ['hood', 'rShoulder', 0.3, 1.6], ['hood', 'yTop', 1.2, 2.0], ['hood', 'dome', 0, 0.6],
  ['hood', 'tipY', 0, 1.2], ['hood', 'tipZ', 0, 1.6], ['hood', 'wideX', 0.85, 1.45], ['hood', 'long', 3.0, 4.8], ['hood', 'back', 0, 2.2],
  ['cloak', 'r0', 1.4, 2.8], ['cloak', 'rWide', 0.4, 2.6], ['cloak', 'zRatio', 0.5, 1.3], ['cloak', 'back', 0, 1.5],
  ['torso', 'dz', 0, 0.8], ['torso', 'dy', -0.6, 0.3], ['torso', 'yaw', -0.8, 0.8],
];
function objects(x) {                                      // normalized vector -> CLOTHES parameters
  const o = {hood: {}, cloak: {}, torso: {}};
  PAR.forEach(([g, n, a, b], i) => { o[g][n] = a + Math.min(1, Math.max(0, x[i])) * (b - a); });
  return o;
}
async function count(o) { return pg.evaluate(({o, SHOT}) => window.fitScore(o, SHOT), {o, SHOT}); }
const block = a => { const B = []; for (let y = 0; y < 18; y++) B.push(a.slice(y * 32, y * 32 + 32)); return B; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { mn += Math.min(B[y][x], T[y][x]); mx += Math.max(B[y][x], T[y][x]); } return mn / mx; };
const rigid = (B, T) => { let i = 0, u = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y][x] > 0.5, t = T[y][x] > 0; i += b && t; u += b || t; } return i / u; };

let FACE0 = null, HEIGHT0 = null, X0 = null, n = 0;
async function score(x) {
  const o = objects(x), r = await count(o); n++;
  const B1 = block(r.B.shot1), B3 = block(r.B.shot3), face = r.face;
  if (!FACE0) { FACE0 = face; HEIGHT0 = r.neck; }
  let penalty = 0; face.forEach((v, i) => { penalty += Math.max(0, 0.85 - v / FACE0[i]); });
  r.neck.forEach((v, i) => { penalty += Math.max(0, (v - HEIGHT0[i] - 150) / 1500); });     // the visible neck must not grow (it is short in the sample)
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);                  // a small penalty for moving away from the start
  const i1 = soft(B1, T.shot1), i3 = soft(B3, T.shot3);
  return {f: 1 - (i1 + i3) / 2 + 2 * penalty + reg, i1, i3, q1: rigid(B1, T.shot1), q3: rigid(B3, T.shot3), penalty, o};
}

// starting point: the current CLOTHES values (from the page)
const current = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__clothesCurrent())));
const x0 = PAR.map(([g, nm, a, b]) => Math.min(1, Math.max(0, (current[g][nm] - a) / (b - a)))); X0 = x0.slice();
const b0 = await score(x0);
console.log('initial: soft IoU shot1 %s shot3 %s | rigid %s %s', b0.i1.toFixed(3), b0.i3.toFixed(3), b0.q1.toFixed(3), b0.q3.toFixed(3));

async function nm(x0, iter, step = 0.15) {
  const N = x0.length, P = [x0.slice()];
  for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = []; for (const p of P) F.push(await score(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f);
    const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) console.log('  %d  best f %s  IoU %s / %s  (rigid %s / %s)  penalty %s  score %d', k, F[0].f.toFixed(4), F[0].i1.toFixed(3), F[0].i3.toFixed(3), F[0].q1.toFixed(3), F[0].q3.toFixed(3), F[0].penalty.toFixed(3), n);
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))); const fr = await score(xr);
    if (fr.f < F[0].f) {
      const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))); const fe = await score(xe);
      if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; }
    } else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else {
      const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))); const fc = await score(xc);
      if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; }
      else { for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await score(P[i]); } }
    }
  }
  const i0 = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0];
  return {x: P[i0], r: F[i0]};
}

let optimum = {x: x0, r: b0};
let rnd = 12345; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < RESTARTS; q++) {
  const head = q === 0 ? x0 : optimum.x.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(head, ITER, q === 0 ? 0.2 : 0.1);
  console.log('restart %d: f %s  IoU %s / %s  rigid %s / %s', q, r.r.f.toFixed(4), r.r.i1.toFixed(3), r.r.i3.toFixed(3), r.r.q1.toFixed(3), r.r.q3.toFixed(3));
  if (r.r.f < optimum.r.f) optimum = r;
  writeFileSync(ROOT + 'test/clothes_fit_interim.json', JSON.stringify({restarts: q, clothes: optimum.r.o, soft: [optimum.r.i1, optimum.r.i3], rigid: [optimum.r.q1, optimum.r.q3]}, null, 1));
}
writeFileSync(ROOT + 'test/clothes_fit.json', JSON.stringify({clothes: optimum.r.o, soft: [optimum.r.i1, optimum.r.i3], rigid: [optimum.r.q1, optimum.r.q3],
  initial: {soft: [b0.i1, b0.i3], rigid: [b0.q1, b0.q3]}, scores: n}, null, 1));
console.log('best:',JSON.stringify(optimum.r.o));
await br.close(); srv.close();
