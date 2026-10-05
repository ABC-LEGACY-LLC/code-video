/* HOOD FIT (pass 7) -- PER SHOT (the hood is cloth: it slides on the head; constant within a shot). Objective: IoU of
   the sample's VISIBLE HEAD (face + hair; test/audit_sample/head_mask.py -> private/test/sample_head7.json) with our visible
   head on the role render (skin, hair, cap shell, neck, lining) -- every frame; in shots 1 and 3 the soft IoU of the figure
   blocks (occlusion map, private/test/sample_figure.json) at weight 0.5 AND a condition: a 4x penalty if the figure drops
   below FIG0 - 0.003 (--fig0: the delivered level 0.914 / 0.857; in the first run without the condition the figure fell to 0.784).
   Parameters (PAR; --par a,b -- only these are fitted, the rest stay at their value in --head): opening (openness, openV0, openV1,
   two brims openA/openB), crown (pushZ, pushY), upper part (wholeZ, wholeY, yaw -- turn, eg -- tilt), r0, visor,
   tipY, dome, lining band (bandA/B, bandAlt/Blt, bandV). Each new parameter was added for a specific error seen on the
   sheet (README pass 7). Nelder-Mead on [0,1] + restarts. Result: test/hood7_fit_shotN<--extra>.json.
   Final: shot0 _4, shot1 _3, shot2 _3 (+ a bandV scan with --score-only --test) -> src/film.js.
   node test/fit_hood7.mjs --shot 0|1|2 [--iter 200] [--restarts 2] [--par ...] [--head '{...}'] [--fig0 x]
        [--extra _N] [--score-only 1 --test '[{...}]'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 0), ITER = +arg('iter', 200), RESTARTS = +arg('restarts', 2), ONLY = +arg('score-only', 0);
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'private/test/sample_head7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json'));     // pass 8: the shot 2 map too (k12-13)
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]][SHOT], FIGT = [FIG.shot1, FIG.shot2, FIG.shot3][SHOT];
const PAR = [['openness', 0.7, 2.6], ['openV0', -0.25, 0.30], ['openV1', 0.10, 0.60], ['pushZ', -1.2, 1.2], ['pushY', -0.8, 0.8],
             ['wholeZ', -0.8, 0.8], ['wholeY', -0.9, 0.6], ['r0', 1.12, 1.6], ['yaw', -0.8, 0.8], ['visor', 0, 1.0],
             ['eg', -0.4, 1.0], ['tipY', 0.5, 2.2], ['dome', 0.1, 1.2], ['openA', 0.5, 2.0], ['openB', 0.5, 2.0],
             ['bandA', 0.5, 7.0], ['bandB', 0.5, 7.0], ['bandAlt', 0, 1.5], ['bandBlt', 0, 1.5], ['bandV', 0.40, 0.90],
             ['kfInner', 0.0, 1.2]];
const objects = x => { const o = {}; PAR.forEach(([n, a, b], i) => { o[n] = +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4); }); return o; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
let X0 = null, n = 0, FIG0 = null;
async function score(x) {
  const o = objects(x), r = await pg.evaluate(({o, idx, fr}) => window.hoodScore7(o, idx, fr), {o, idx: SHOT, fr: FR}); n++;
  const iou = r.iou.reduce((a, v) => a + v, 0) / r.iou.length, fig = FIGT ? soft(r.B, FIGT) : null;
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  /* the figure (silhouette) must not drop below the initial (delivered) level: in the first run a 0.5 weight was not enough --
     in shot 3 head IoU 0.24 -> 0.56 cost figure 0.857 -> 0.784 (the top of the hood moved forward and the top-left corner
     was left empty) */
  const penalty = fig !== null && FIG0 !== null ? 4 * Math.max(0, FIG0 - 0.003 - fig) : 0;
  return {f: 1 - iou + (fig !== null ? 0.5 * (1 - fig) : 0) + penalty + reg, iou, fig, r, o};
}
const draw = (s, b) => console.log('%s f %s | head IoU %s [%s] | figure %s | ours px %s sample %s', s, b.f.toFixed(4), b.iou.toFixed(3), b.r.iou.map(v => v.toFixed(2)).join(' '), b.fig === null ? '-' : b.fig.toFixed(3), b.r.ours.join(','), b.r.sample.join(','));
const current = await pg.evaluate(idx => { const K = JSON.parse(JSON.stringify(window.__clothesCurrent().hood)); return K; }, SHOT);
const film = await pg.evaluate(idx => (window.__filmShotHood || null), SHOT);
const head0 = JSON.parse(arg('head', 'null')) || {};
const x0 = PAR.map(([nm, a, b]) => { const v = head0[nm] !== undefined ? head0[nm] : (current[nm] || 0); return Math.min(1, Math.max(0, (v - a) / (b - a))); }); X0 = x0.slice();
let b0 = await score(x0); FIG0 = arg('fig0', null) !== null ? +arg('fig0', 0) : b0.fig;
b0 = await score(x0); draw('initial (shot ' + SHOT + '):', b0); console.log('FIG0', FIG0);     // again, with the penalty
if (ONLY) {
  for (const v of JSON.parse(arg('test', '[]'))) { const x = x0.slice(); for (const [k, val] of Object.entries(v)) { const i = PAR.findIndex(p => p[0] === k); x[i] = (val - PAR[i][1]) / (PAR[i][2] - PAR[i][1]); } draw(JSON.stringify(v), await score(x)); }
  await br.close(); srv.close(); process.exit(0);
}
/* --par a,b,c -- only these parameters are fitted (the others stay at their initial value); the simplex spans only them */
const SEL = arg('par', null) ? arg('par').split(',').map(k => { const i = PAR.findIndex(p => p[0] === k); if (i < 0) throw new Error('no such par: ' + k); return i; }) : PAR.map((p, i) => i);
console.log('fitting:', SEL.map(i => PAR[i][0]).join(','));
const full = z => { const x = X0.slice(); SEL.forEach((i, k) => { x[i] = z[k]; }); return x; };
const scoreZ = z => score(full(z));
async function nm(z0, iter, step) {
  const N = z0.length, P = [z0.slice()];
  for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = []; for (const p of P) F.push(await scoreZ(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) draw('  ' + k + ' (score ' + n + ')', F[0]);
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))); const fr = await scoreZ(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))); const fe = await scoreZ(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))); const fc = await scoreZ(xc);
      if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else { for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await scoreZ(P[i]); } } }
  }
  const i0 = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0]; return {x: full(P[i0]), z: P[i0], r: F[i0]};
}
let optimum = {x: x0, r: b0}; let rnd = 4242; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < RESTARTS; q++) {
  const zOptimum = SEL.map(i => optimum.x[i]);
  const head = q === 0 ? zOptimum : zOptimum.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(head, ITER, q === 0 ? 0.2 : 0.1); draw('restarts ' + q + ':', r.r); if (r.r.f < optimum.r.f) optimum = r;
}
const file = ROOT + 'test/hood7_fit_shot' + SHOT + arg('extra', '') + '.json', J = {};
J['shot' + SHOT] = {hood: optimum.r.o, f: optimum.r.f, iou: optimum.r.iou, iou_image: optimum.r.r.iou, figure: optimum.r.fig, initial: {f: b0.f, iou: b0.iou, figure: b0.fig, hood: b0.o}, scores: n};
writeFileSync(file, JSON.stringify(J, null, 1)); draw('BEST:', optimum.r); console.log(JSON.stringify(optimum.r.o));
await br.close(); srv.close();
