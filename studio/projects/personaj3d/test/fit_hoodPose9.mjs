/* HOOD -- CORRECTIVE SHAPES IN POSE SPACE, FOR ALL THREE SHOTS TOGETHER (pass 9, 2c). One rigid hood (fit_hood9)
   gave the mass in all three shots (figure 0.93/0.87/0.88), but in shot 2 it covered the face (visible head 0.13). Now: the cloth
   has ONE size (hood: r0, visor, dome, tipY, rShoulder, back; tau -- the inertia of following), its placement (opening, crown and
   the upper part's shift/turn, the lining band) comes from the head's pose -- a Gaussian blend between three key poses (shot 1 at rest,
   shot 2, shot 3 at rest) (personaj.js hoodDeform). Blocks in turn (Nelder-Mead): k0, k1 (+ the shot 2 camera, tied to the
   face), k2, the general size; the target is the one in fit_hood9 (head IoU -- time on screen, figure -- shots equal).
   node test/fit_hoodPose9.mjs [--iter 120] [--circle 2] [--blocks k0,k1,k2,hood] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {HEAD, headShape, CLOTHES} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 120), CIRCLE = +arg('circle', 2), ROOT = new URL('..', import.meta.url).pathname;
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
/* state: hood (the general size), keys (placement), the shot 2 camera */
const DEF = [['openness', 0.5, 2.6], ['openV0', -0.25, 0.30], ['openV1', 0.10, 0.70], ['pushZ', -1.2, 1.2], ['pushY', -0.8, 0.9], ['wholeZ', -0.8, 0.8],
             ['wholeY', -0.9, 0.6], ['yaw', -0.8, 0.8], ['eg', -0.4, 1.0], ['openA', 0.5, 2.0], ['openB', 0.5, 2.0], ['bandA', 0.5, 7.0],
             ['bandB', 0.5, 7.0], ['bandAlt', 0, 1.5], ['bandBlt', 0, 1.5], ['bandV', 0.40, 0.90]];
const GENERAL = [['r0', 1.05, 1.6], ['visor', 0, 1.0], ['dome', 0.1, 1.2], ['tipY', 0.5, 2.2], ['rShoulder', 0.1, 0.6], ['back', 1.0, 3.0], ['tau', 0.0, 0.4]];
const CAM = [['d2', 9.0, 14.0], ['sx2', 0.34, 0.50], ['sy2', 0.36, 0.52]];
const H0 = {hood: Object.fromEntries(GENERAL.map(([n]) => [n, CLOTHES.hood[n]])), key: CLOTHES.hoodPose.key.map(k => ({p: k.p, d: {...k.d}})),
            cam: {d2: 10.868, sx2: 0.3871, sy2: 0.4164}, sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB};
const clothes = h => ({hood: h.hood, hoodPose: {sigmaE: h.sigmaE, sigmaB: h.sigmaB, key: h.key}});
let n = 0;
async function score(h) {
  const r = await pg.evaluate(({k, cam, fr}) => window.hoodScore9(k, cam, fr), {k: clothes(h), cam: {1: {d: h.cam.d2, screen: [h.cam.sx2, h.cam.sy2]}}, fr: FRALL}); n++;
  const sh = FR.map((fr, s) => ({iou: fr.reduce((a, f) => a + r.iou[f], 0) / fr.length, fig: soft(r.B[s], FIGT[s]), ratio: fr.reduce((a, f) => a + r.ours[f] / Math.max(1, r.sample[f]), 0) / fr.length}));
  const yz = face2(h.cam.d2, h.cam.sx2, h.cam.sy2), VK = arg('weight', 'frame') === 'equal' ? [1 / 3, 1 / 3, 1 / 3] : [11 / 22, 2 / 22, 9 / 22];
  const f = sh.reduce((a, s, i) => a + VK[i] * (1 - s.iou) + 0.5 * (1 - s.fig) / 3, 0) + 0.01 * Math.max(0, yz - 1.5) ** 2;
  return {f, sh, yz};
}
const draw = (s, b) => console.log('%s f %s | head IoU %s (ratio %s) | figure %s | face2 %s', s, b.f.toFixed(4), b.sh.map(t => t.iou.toFixed(3)).join('/'), b.sh.map(t => t.ratio.toFixed(2)).join('/'), b.sh.map(t => t.fig.toFixed(3)).join('/'), b.yz.toFixed(2));
/* block: a list of parameters [path, a, b] -> written to / read from the state */
const BLOCK = {
  k0: DEF.map(([nm, a, b]) => [['key', 0, nm], a, b]), k1: [...DEF.map(([nm, a, b]) => [['key', 1, nm], a, b]), ...CAM.map(([nm, a, b]) => [['cam', nm], a, b])],
  k2: DEF.map(([nm, a, b]) => [['key', 2, nm], a, b]), hood: GENERAL.map(([nm, a, b]) => [['hood', nm], a, b]),
};
const ol = (h, y) => y[0] === 'key' ? h.key[y[1]].d[y[2]] : h[y[0]][y[1]];
const write = (h, y, v) => { if (y[0] === 'key') h.key[y[1]].d[y[2]] = v; else h[y[0]][y[1]] = v; };
async function blockNM(h, block, iter, step) {
  const B = BLOCK[block], N = B.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  const z0 = B.map(([y, a, b]) => Math.min(1, Math.max(0, ((ol(h, y) ?? a) - a) / (b - a))));
  const build = z => { const g = JSON.parse(JSON.stringify(h)); B.forEach(([y, a, b], i) => write(g, y, +(a + z[i] * (b - a)).toFixed(4))); return g; };
  const f = async z => (await score(build(z))).f;
  let P = [z0.slice()]; for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -step : step))); P.push(p); }
  let F = []; for (const p of P) F.push(await f(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
  }
  const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]);
  return build(P[o[0]]);
}
let h = arg('head', null) ? JSON.parse(readFileSync(arg('head'))).h : JSON.parse(JSON.stringify(H0));     // --head F.json -- from a saved state
if (arg('sigma', null)) { h.sigmaE = h.sigmaB = +arg('sigma'); }
if (arg('sigmaE', null)) h.sigmaE = +arg('sigmaE');
if (arg('sigmaB', null)) h.sigmaB = +arg('sigmaB');
draw('initial (the placements of passes 7-8, one size):', await score(h));
const BLOCKS = arg('blocks', 'k0,k1,k2,hood').split(',');
for (let a = 0; a < CIRCLE; a++) for (const bl of BLOCKS) {
  h = await blockNM(h, bl, ITER, a ? 0.06 : 0.12);
  const b = await score(h); draw(`circle ${a + 1} block ${bl} (score ${n}):`, b);
  writeFileSync(ROOT + 'test/hoodPose9_fit' + arg('out', '') + '.json', JSON.stringify({h, f: b.f, sh: b.sh, yz: b.yz, circle: a, block: bl}, null, 1));
}
console.log('RESULT', JSON.stringify(h));
await br.close(); srv.close();
