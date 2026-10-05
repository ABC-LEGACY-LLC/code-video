/* HOOD STRUCTURE -- IN HEAD SPACE, ALL THREE SHOTS AT ONCE (pass 12). Alonur: "first you have to get the 3D models
   right, then the camera". The hood is a big, empty cloth (the CLOTHES.hood comment in personaj.js), its inside is dark from the light
   (AO + hood shadow, common.js); the hair is complete (the back layer too). Only the hood's STRUCTURE dimensions (brim azimuth
   profile, ring size and position, dome) and one key light direction are fitted here, to the head shell map (the same as
   test/parts/hood_map.py: which part of the sample the grid 0.2 outside the head surface falls on in each frame -- head / inner /
   outer / background, PRIVATE target) and to the figure mass; penalty: the cloth must not enter the hair layer (shellDepth).
   node test/fit_hood_structure.mjs --score '{"name": {"clothes": {"hood": {...}}, "light": [az, el]}}'
   node test/fit_hood_structure.mjs --fit [--iter 400] [--start '{...}'] [--out test/hood_structure_fit.json] */
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
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1${arg('extra', '') ? '&' + arg('extra', '') : ''}`);   // --extra: URL parameters for a check
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
const {CLOTHES} = await import('../src/personaj.js');
/* whole-frame classes (item 1: the top of the hair) -- the sample bits go to the page once */
const WF = {headF: +arg('wbF', 0), headT: +arg('wbT', 0), innerF: +arg('wiF', 0), hairF: +arg('wsF', 0), hairFace: +arg('wsY', arg('wsF', 0))};
/* innerF (item 2): inner IoU over the whole frame; hairF (item 6): IoU with the SAM 2 hair mask (bit16, the bit32 face not counted); hairFace (item 6):
   how much of the SAM face (bit32, without hair) our hair covers -- a fraction, penalized in shots 1-2 (in shot 3 the sample has strands over the face too) */
if (WF.headF || WF.headT || WF.innerF || WF.hairF) await pg.evaluate(r => { window.__part = r; }, JSON.parse(readFileSync(ROOT + 'private/test/parts/human/part_target_12.json')));
/* head shell grid -> a pixel list per frame and the sample's class */
/* several shells (comma-separated): 0.2 -- next to the head surface, 0.55 -- the hair volume (strands above the head, the inner gap
   between the hood brim and the hair -- the 0.2 shell does not see it) */
const M = JSON.parse(readFileSync(ROOT + 'private/test/parts/human/part_target_12.json')).m;
const GR = {}, FRS = [];
for (const fn of arg('surface', 'private/test/parts/surface_projection_02.json').split(',')) {
  const S = JSON.parse(readFileSync(ROOT + fn));
  for (const [ks, G] of Object.entries(S.frame)) {
    const f = +ks - 1, m = Buffer.from(M[String(f)], 'base64');
    if (!GR[f]) { GR[f] = {px: [], c: []}; FRS.push(f); }
    for (const row of G) for (const [x, y, v] of row) {
      if (v < 0.2 || x < 0 || x >= W || y < 0 || y >= H) continue;
      const j = Math.floor(y) * W + Math.floor(x), bt = m[j];
      GR[f].px.push(j); GR[f].c.push(bt & 1 ? 0 : bt & 2 ? 1 : bt & 4 ? 2 : 3);
    }
  }
}
FRS.sort((a, b) => a - b);
const SHOT = f => f <= 10 ? 1 : f <= 12 ? 2 : 3;
/* --shots 3 (pass 13, a check): only these shot(s) -- to learn how good the best static shape for a single shot
   can be (not the model: the result is not written to the SOURCE) */
const SH = arg('shots', '1,2,3').split(',').map(Number);
for (let i = FRS.length - 1; i >= 0; i--) if (!SH.includes(SHOT(FRS[i]))) FRS.splice(i, 1);
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FIGT = {1: FIG.shot1, 2: FIG.shot2, 3: FIG.shot3};
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const VZ = {head: +arg('wb', 2), inner: +arg('wi', 1.5), outer: +arg('wt', 1), fig: +arg('wf', 2), pen: +arg('wp', 20)};
const iou = (C, k) => { let r = 0, c = 0; for (let j = 0; j < 4; j++) { r += C[k * 4 + j]; c += C[j * 4 + k]; } const d = r + c - C[k * 4 + k]; return d ? C[k * 4 + k] / d : 1; };
async function score(o) {
  const r = await pg.evaluate(({o, fr, GR}) => window.hoodStructureScore(o, fr, GR), {o, fr: FRS, GR});
  const sh = {};
  for (const s of SH) {
    const fs = FRS.filter(f => SHOT(f) === s), C = new Array(16).fill(0), B = new Array(576).fill(0);
    let pen = 0, sI = 0, sU = 0, yS = 0, yN = 0; const CF = new Array(16).fill(0), CT = new Array(16).fill(0);
    for (const f of fs) { r[f].conf.forEach((v, i) => C[i] += v); r[f].B.forEach((v, i) => B[i] += v / fs.length); pen += r[f].pen / fs.length;
      if (r[f].confF) { r[f].confF.forEach((v, i) => CF[i] += v); r[f].confT.forEach((v, i) => CT[i] += v); sI += r[f].hair[0]; sU += r[f].hair[1]; yS += r[f].face[0]; yN += r[f].face[1]; } }
    sh[s] = {head: iou(C, 0), inner: iou(C, 1), outer: iou(C, 2), fig: soft(B, FIGT[s]), pen, agree: [0, 1, 2, 3].reduce((a, k) => a + C[k * 5], 0) / C.reduce((a, b) => a + b, 0),
             headF: CF.some(v => v) ? iou(CF, 0) : null, headT: CT.some(v => v) ? iou(CT, 0) : null, innerF: CF.some(v => v) ? iou(CF, 1) : null, hairF: sU ? sI / sU : null, hairFace: yN ? yS / yN : null};
  }
  const F = SH.reduce((a, s) => a + VZ.head * (1 - sh[s].head) + VZ.inner * (1 - sh[s].inner) + VZ.outer * (1 - sh[s].outer) + VZ.fig * (1 - sh[s].fig) + VZ.pen * sh[s].pen
    + (sh[s].headF !== null ? WF.headF * (1 - sh[s].headF) + (s < 3 ? WF.headT * (1 - sh[s].headT) : 0) + WF.innerF * (1 - sh[s].innerF) + WF.hairF * (1 - sh[s].hairF) + (s < 3 ? WF.hairFace * sh[s].hairFace : 0) : 0), 0);   // top -- shots 1, 2 (in shot 3 there is no head at the top of the frame)
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + SH.map(s => `${s}: agree ${b.sh[s].agree.toFixed(3)} head ${b.sh[s].head.toFixed(3)} inner ${b.sh[s].inner.toFixed(3)} outer ${b.sh[s].outer.toFixed(3)} fig ${b.sh[s].fig.toFixed(3)} pen ${b.sh[s].pen.toFixed(3)}` + (b.sh[s].headF !== null ? ` headF ${b.sh[s].headF.toFixed(3)} top ${b.sh[s].headT.toFixed(3)} innerF ${b.sh[s].innerF.toFixed(3)} hair ${b.sh[s].hairF.toFixed(3)} hairFace ${b.sh[s].hairFace.toFixed(3)}` : '')).join(' | ');
if (arg('score', null)) {
  const C = JSON.parse(arg('score'));
  for (const [name, o] of Object.entries(C)) console.log(name.padEnd(12), fmt(await score(o)));
}
if (process.argv.includes('--fit')) {
  const ITER = +arg('iter', 400);
  const PAR = JSON.parse(arg('par', JSON.stringify([
    ['yTop', 1.8, 2.9], ['Rg', 0.6, 1.6], ['R0', 1.1, 1.9], ['Rn', 0.75, 1.4], ['zg', -1.4, 0.2], ['z0', -0.7, 0.3], ['zn', -0.6, 0.2],
    ['wideX', 0.8, 1.25], ['back', 0, 1.3], ['visor', 0, 0.5], ['openV0', 0.10, 0.28], ['fi1', 15, 75], ['fi2', 35, 95], ['fi3', 55, 115], ['fi4', 25, 95],
    ['wing', 0, 0.6], ['kf', 0.4, 1.0], ['kt', 0.5, 1.0], ['lightAz', -10, 100], ['lightEl', 5, 65]])));
  const B0 = arg('start', null) ? JSON.parse(arg('start')) : {};
  const STD = {lightAz: 41.5, lightEl: 20.5, wing: 0, shadowA: 20, shadowE: 15, aoD: 0.45, aoS: 0.70, kfE: 0.8, kfB: 0.8};
  const {HAIR} = await import('../src/personaj.js');
  const KG = ['cloak.', 'neck.', 'torso.'];                  // pass 13: the other clothes groups ("cloak.r0", "neck.rT")
  const x0 = PAR.map(([n]) => B0[n] !== undefined ? B0[n] : n.startsWith('hair.') ? HAIR[n.split('.')[1]][n.split('.')[2]]
    : KG.some(g => n.startsWith(g)) ? CLOTHES[n.split('.')[0]][n.split('.')[1]] : B0.hood && B0.hood[n] !== undefined ? B0.hood[n] : CLOTHES.hood[n] !== undefined ? CLOTHES.hood[n] : STD[n]);
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.08 * (b - a));
  const SPECIAL = ['lightAz', 'lightEl', 'shadowA', 'shadowE', 'aoD', 'aoS'];
  const getO = x => { const hood = {...(B0.hood || {})}, o = {clothes: {hood}}; PAR.forEach(([n], i) => { if (SPECIAL.includes(n) || n.startsWith('hair.')) return;
      if (KG.some(g => n.startsWith(g))) { const [g, k] = n.split('.'); (o.clothes[g] = o.clothes[g] || {})[k] = x[i]; return; } hood[n] = x[i]; });
    const ix = n => PAR.findIndex(p => p[0] === n), ia = ix('lightAz'), ie = ix('lightEl'), sa = ix('shadowA'), se = ix('shadowE');
    /* pass 13: the light / AO is set only when it is a parameter (or given in --start) -- otherwise the page keeps the SOURCE value.
       (The F fit had run with STD 41.5/20.5 and AO 0.45 -- the source has 41.7/29.7, 0.505: the result was fitted to a different light) */
    if (ia >= 0 || ie >= 0 || B0.lightAz !== undefined || B0.lightEl !== undefined)
      o.light = [ia >= 0 ? x[ia] : (B0.lightAz ?? STD.lightAz), ie >= 0 ? x[ie] : (B0.lightEl ?? STD.lightEl)];
    if (sa >= 0 || se >= 0) hood.shadow = [sa >= 0 ? x[sa] : B0.shadowA, se >= 0 ? x[se] : B0.shadowE];
    const ad = ix('aoD'), as = ix('aoS');
    if (ad >= 0 || as >= 0 || B0.aoD !== undefined || B0.aoS !== undefined) o.ao = [ad >= 0 ? x[ad] : (B0.aoD ?? STD.aoD), as >= 0 ? x[as] : (B0.aoS ?? STD.aoS)];
    PAR.forEach(([n], i) => { if (n.startsWith('hair.')) { const [, g, k] = n.split('.'); ((o.hair = o.hair || {})[g] = o.hair[g] || {})[k] = x[i]; } });
    return o; };
  let n = 0, optimum = null;
  const write = () => writeFileSync(ROOT + arg('out', 'test/hood_structure_fit.json'), JSON.stringify({score: n, result: optimum.b, x: Object.fromEntries(PAR.map(([nn], i) => [nn, +optimum.x[i].toFixed(4)])), o: getO(optimum.x)}, null, 1));
  const f = async x => { const b = await score(getO(x)); if (!optimum || b.F < optimum.b.F) { optimum = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}`); write(); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += (pp[i] + q[i] > hi[i] ? -q[i] : q[i]); P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, stall = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; stall = 0; } else if (++stall > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const out = {score: n, result: optimum.b, x: Object.fromEntries(PAR.map(([nn], i) => [nn, +optimum.x[i].toFixed(4)])), o: getO(optimum.x)};
  writeFileSync(ROOT + arg('out', 'test/hood_structure_fit.json'), JSON.stringify(out, null, 1));
  console.log('FINAL', fmt(optimum.b), JSON.stringify(out.x));
}
await br.close(); srv.close();
