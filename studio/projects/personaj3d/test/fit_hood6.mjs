/* HOOD FIT (pass 6) -- with the new hair. In the sample the hood is BEHIND THE HEAD in shots 1 and 2 (the hair in front of it),
   on the crown in shot 3. Target: 1 - mean soft figure IoU (shots 1 and 3, 10 px blocks -- as in fit_clothes.mjs)
   + lA * (the fraction of the sample's bright hair that ends up under the hood in ours, mean of 3 shots)
   + lB * (our visible hair where the sample is dark (L<30) -- a fraction, mean of 3 shots)
   + penalty (visible face below 85 % of the initial one, neck growth). Nelder-Mead on [0,1] + restarts.
   Sample masks: private/test/sample_mask6.json (python, the same mask as hair_coverage.py). Only hood parameters;
   the cloak/torso stay as the fit of pass 3 left them.
   node test/fit_hood6.mjs [--iter 300] [--restarts 2] [--score-only 1] [--lA 1] [--lB 0.5] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 300), RESTARTS = +arg('restarts', 2), LA = +arg('lA', 1), LB = +arg('lB', 0.5), ONLY = +arg('score-only', 0);
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
await pg.evaluate(r => { window.__ref = r; }, JSON.parse(readFileSync(ROOT + 'private/test/sample_mask6.json')));

const T = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure.json'));
const SHOT = {shot1: [0, 3, 6, 8, 9, 10], shot2: [11, 12], shot3: [13, 15, 17, 19, 21]};
const PAR = [
  ['r0', 1.12, 1.50], ['yTop', 1.2, 2.4], ['dome', 0, 0.6], ['tipY', 0, 1.2], ['tipZ', 0, 1.6], ['wideX', 0.85, 1.45],
  ['long', 3.0, 4.8], ['back', 0, 2.2], ['openness', 1.4, 2.6], ['openV0', -0.10, 0.25], ['openV1', 0.10, 0.45],
  ['pushZ', 0, 1.0], ['pushY', -0.3, 0.6], ['visor', 0, 0.3], ['rShoulder', 0.3, 1.6],
];
const objects = x => { const hood = {}; PAR.forEach(([n, a, b], i) => { hood[n] = a + Math.min(1, Math.max(0, x[i])) * (b - a); }); return {hood}; };
const block = a => { const B = []; for (let y = 0; y < 18; y++) B.push(a.slice(y * 32, y * 32 + 32)); return B; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { mn += Math.min(B[y][x], T[y][x]); mx += Math.max(B[y][x], T[y][x]); } return mn / mx; };

let FACE0 = null, X0 = null, n = 0;
async function score(x) {
  const o = objects(x), r = await pg.evaluate(({o, SHOT}) => window.hoodScore(o, SHOT), {o, SHOT}); n++;
  if (!FACE0) FACE0 = r.face;
  let penalty = 0; r.face.forEach((v, i) => { penalty += Math.max(0, 0.85 - v / Math.max(1, FACE0[i])); });
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  const i1 = soft(block(r.B.shot1), T.shot1), i3 = soft(block(r.B.shot3), T.shot3);
  const A = (r.A.shot1 + r.A.shot2 + r.A.shot3) / 3, Bs = (r.Bs.shot1 + r.Bs.shot2 + r.Bs.shot3) / 3;
  return {f: 1 - (i1 + i3) / 2 + LA * A + LB * Bs + 2 * penalty + reg, i1, i3, A: r.A, Bs: r.Bs, penalty, o};
}
const draw = (s, b) => console.log('%s f %s | figure IoU %s / %s | A (bright hair under the hood) %s %s %s | B (hair where the sample is dark) %s %s %s | penalty %s',
  s, b.f.toFixed(4), b.i1.toFixed(3), b.i3.toFixed(3), b.A.shot1.toFixed(3), b.A.shot2.toFixed(3), b.A.shot3.toFixed(3), b.Bs.shot1.toFixed(3), b.Bs.shot2.toFixed(3), b.Bs.shot3.toFixed(3), b.penalty.toFixed(3));

const current = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__clothesCurrent())));
const x0 = PAR.map(([nm, a, b]) => Math.min(1, Math.max(0, ((current.hood[nm] || 0) - a) / (b - a)))); X0 = x0.slice();
const b0 = await score(x0); draw('initial:', b0);
if (ONLY) {
  for (const v of JSON.parse(arg('test', '[]'))) { const x = x0.slice(); for (const [k, val] of Object.entries(v)) { const i = PAR.findIndex(p => p[0] === k); x[i] = (val - PAR[i][1]) / (PAR[i][2] - PAR[i][1]); } draw(JSON.stringify(v), await score(x)); }
  await br.close(); srv.close(); process.exit(0);
}
async function nm(x0, iter, step = 0.15) {
  const N = x0.length, P = [x0.slice()];
  for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = []; for (const p of P) F.push(await score(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f);
    const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) draw('  ' + k + ' (score ' + n + ')', F[0]);
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
let rnd = 777; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < RESTARTS; q++) {
  const head = q === 0 ? x0 : optimum.x.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(head, ITER, q === 0 ? 0.2 : 0.1);
  draw('restart ' + q + ':', r.r);
  if (r.r.f < optimum.r.f) optimum = r;
  writeFileSync(ROOT + 'test/hood6_interim.json', JSON.stringify({restarts: q, hood: optimum.r.o.hood, f: optimum.r.f}, null, 1));
}
writeFileSync(ROOT + 'test/hood6_fit.json', JSON.stringify({hood: optimum.r.o.hood, f: optimum.r.f, figure: [optimum.r.i1, optimum.r.i3], A: optimum.r.A, B: optimum.r.Bs,
  initial: {f: b0.f, figure: [b0.i1, b0.i3], A: b0.A, B: b0.Bs}, scores: n}, null, 1));
draw('BEST:', optimum.r); console.log(JSON.stringify(optimum.r.o.hood));
await br.close(); srv.close();
