/* HAIR VOLUME -- FOR ALL THREE SHOTS TOGETHER (pass 12, structure). Hood and cloak hidden: is the sample's hair (separated by
   tone + the motion across the held frames, test/parts/human/part_target.py -- PRIVATE) covered by hair on ours (recovery), and
   does our hair cover the sample's bright skin (face cover). The hood covers it from above later -- our hair outside the
   sample's head carries no penalty. window.hairScore12 / window.buildHair (src/main.js).
   node test/fit_hair12.mjs --score '{"name": {"faceside": {...}, "near": {"n": 0}}}'
   node test/fit_hair12.mjs --fit [--iter 200] [--start '{"faceside.az0": 40, ...}'] [--out test/hair12_fit.json] */
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
const {HAIR} = await import('../src/personaj.js');
const ORIG = JSON.parse(JSON.stringify(HAIR));                                // the original hair (every score starts from it)
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]}, ALL = [...FR[1], ...FR[2], ...FR[3]];
const LAM = +arg('lam', 2), LF = +arg('lf', 1);                              // lf: our hair over the sample's background (sky/snow) -- the hood does not cover that either
async function score(o) {
  const merged = JSON.parse(JSON.stringify(ORIG));                             // original + o (per group)
  for (const g in o) merged[g] = {...(merged[g] || {}), ...o[g]};
  const r = await pg.evaluate(({o, fr}) => window.hairScore12(o, fr), {o: merged, fr: ALL});
  const sh = {};
  for (const s of [1, 2, 3]) { const m = n => FR[s].reduce((a, f) => a + r[f][n], 0) / FR[s].length;
    sh[s] = {recovery: m('recovery'), skin: m('skinInHair'), cover: m('faceCover'), background: m('inBackground')}; }
  const F = [1, 2, 3].reduce((a, s) => a + (1 - sh[s].recovery) + LAM * sh[s].cover + LF * sh[s].background, 0);
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + [1, 2, 3].map(s => `${s}: recovery ${b.sh[s].recovery.toFixed(3)} (skin ${b.sh[s].skin.toFixed(2)}) face cover ${b.sh[s].cover.toFixed(3)} inBackground ${b.sh[s].background.toFixed(3)}`).join(' | ');
if (arg('score', null)) {
  const C = JSON.parse(arg('score'));
  for (const [name, o] of Object.entries(C)) console.log(name.padEnd(12), fmt(await score(o)));
}
if (process.argv.includes('--fit')) {
  const ITER = +arg('iter', 200);
  const PAR = JSON.parse(arg('par', '[["faceside.az0",20,70],["faceside.az1",40,110],["faceside.y0",-0.2,0.8],["faceside.y1",-1.5,-0.5],["faceside.off",0,0.3],["faceside.en",0.15,0.6],["faceside.dAz",-40,40],["faceside.swing",0,1],["faceside.shKFar",0,1],["capShell.th",0.55,0.85]]'));
  const LAYERS = JSON.parse(arg('strict', '{"faceside":{"n":5,"pk":1,"shK":0.1},"near":{"n":0}}'));
  const B0 = arg('start', null) ? JSON.parse(arg('start')) : {};
  const get = (n, obj) => { const [g, k] = n.split('.'); return obj[g] && obj[g][k]; };
  const x0 = PAR.map(([n, lo, hi]) => B0[n] !== undefined ? B0[n] : get(n, LAYERS) !== undefined ? get(n, LAYERS) : get(n, ORIG) !== undefined ? get(n, ORIG) : 0.5 * (lo + hi));
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.1 * (b - a));
  const getO = x => { const o = JSON.parse(JSON.stringify(LAYERS)); PAR.forEach(([n], i) => { const [g, k] = n.split('.'); (o[g] = o[g] || {})[k] = x[i]; }); return o; };
  let n = 0, optimum = null;
  const f = async x => { const b = await score(getO(x)); if (!optimum || b.F < optimum.b.F) { optimum = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}  ${PAR.map(([nn], i) => nn.split('.')[1] + ' ' + x[i].toFixed(3)).join(' ')}`); } n++; return b.F; };
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
  const out = {score: n, result: optimum.b, hair: getO(optimum.x)};
  writeFileSync(ROOT + arg('out', 'test/hair12_fit.json'), JSON.stringify(out, null, 1));
  console.log('FINAL', fmt(optimum.b), JSON.stringify(out.hair));
}
await br.close(); srv.close();
