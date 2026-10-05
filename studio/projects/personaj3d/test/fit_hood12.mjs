/* HOOD -- ONE LOOSE GARMENT, ALL THREE SHOTS AT ONCE (pass 12, structure). Alonur: "you are correcting the numbers, not the original 3D
   model, to the sample". Up to pass 11 the hood opening was a shell stuck to the face (in the sample it is wide: the brim is behind the hair,
   between hair and cloth a dark inside shows), the lining band was wide (where the sample's hair in shadow is) and each shot's pose had its own
   key (hoodPose). Here: no keys (one shape, it follows the head only by the KF fraction), a thin lining (band 1), the classes
   separate (window.hoodScore12: head -- skin+hair; inner; figure). PRIVATE target: private/test/parts/human/part_target_12.json.
   node test/fit_hood12.mjs --score '{"name": {...clothes...}}'
   node test/fit_hood12.mjs --fit [--iter 300] [--start '{...hood...}'] [--out test/hood12_fit.json] */
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
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
await pg.evaluate(r => { window.__part = r; }, JSON.parse(readFileSync(ROOT + 'private/test/parts/human/part_target_12.json')));
const {CLOTHES} = await import('../src/personaj.js');
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]};
const ALL = [...FR[1], ...FR[2], ...FR[3]];
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const VZ = {head: +arg('wb', 4), inner: +arg('wi', 2), figure: +arg('wf', 3), lining: +arg('wa', 1)};
async function score(clothes) {
  const r = await pg.evaluate(({k, fr}) => window.hoodScore12(k, null, fr), {k: clothes, fr: ALL});
  const sh = {};
  for (const s of [1, 2, 3]) { const m = n => FR[s].reduce((a, f) => a + r[f][n], 0) / FR[s].length;
    sh[s] = {head: m('head'), inner: m('inner'), figure: soft(r.B[s - 1], FIGT[s - 1]), lining: m('lining'), ratio: m('headRatio')}; }
  const F = [1, 2, 3].reduce((a, s) => a + VZ.head * (1 - sh[s].head) + VZ.inner * (1 - sh[s].inner) + VZ.figure * (1 - sh[s].figure) + VZ.lining * sh[s].lining / 1000, 0);
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + [1, 2, 3].map(s => `${s}: head ${b.sh[s].head.toFixed(3)} (${b.sh[s].ratio.toFixed(2)}) inner ${b.sh[s].inner.toFixed(3)} fig ${b.sh[s].figure.toFixed(3)} lining ${Math.round(b.sh[s].lining)}`).join(' | ');
/* no keys, a thin lining -- the structure; the rest is CLOTHES.hood (or what is given) */
const STRUCTURE = {bandA: 1, bandB: 1, bandAlt: 1, bandBlt: 1};
const getClothes = hood => ({hood: {...CLOTHES.hood, ...STRUCTURE, ...hood}, hoodPose: {sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB, key: []}});
if (arg('score', null)) {
  const C = JSON.parse(arg('score'));
  for (const [name, k] of Object.entries(C)) {
    const clothes = k === 'current' ? {hood: {...CLOTHES.hood}, hoodPose: {sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB, key: CLOTHES.hoodPose.key}} : getClothes(k);
    console.log(name.padEnd(12), fmt(await score(clothes)));
  }
}
if (process.argv.includes('--fit')) {
  const ITER = +arg('iter', 300);
  const PAR = [['openness', 0.8, 2.6], ['openV0', -0.25, 0.30], ['openV1', 0.10, 0.70], ['shut', 0.3, 1.0], ['r0', 1.2, 1.7], ['visor', 0, 1.0],
               ['yTop', 1.5, 2.7], ['dome', 0.2, 1.1], ['tipY', 0.3, 2.2], ['tipZ', 0.3, 2.2], ['back', 0.8, 3.2], ['wideX', 0.9, 1.5],
               ['pushZ', -0.6, 1.2], ['pushY', -0.6, 0.9], ['wholeZ', -0.8, 0.8], ['wholeY', -0.9, 0.6], ['yaw', -0.5, 0.5], ['eg', -0.4, 1.0],
               ['rShoulder', 0, 0.8], ['rMid', -0.3, 0.5], ['openA', 0.6, 1.6], ['openB', 0.6, 1.6], ['kf', 0.2, 1.0], ['kt', 0.5, 1.0]];
  const STD = {kf: 0.35, kt: 0.8};
  const B0 = arg('start', null) ? JSON.parse(arg('start')) : {};
  const x0 = PAR.map(([n]) => B0[n] !== undefined ? B0[n] : CLOTHES.hood[n] !== undefined ? CLOTHES.hood[n] : STD[n]);
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.08 * (b - a));
  const getHood = x => Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
  let n = 0, optimum = null;
  const f = async x => { const b = await score(getClothes(getHood(x))); if (!optimum || b.F < optimum.b.F) { optimum = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}`); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, stall = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; stall = 0; } else if (++stall > 50) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const out = {score: n, result: optimum.b, hood: Object.fromEntries(Object.entries(getHood(optimum.x)).map(([k, v]) => [k, +v.toFixed(4)]))};
  writeFileSync(ROOT + arg('out', 'test/hood12_fit.json'), JSON.stringify(out, null, 1));
  console.log('FINAL', fmt(optimum.b), JSON.stringify(out.hood));
}
await br.close(); srv.close();
