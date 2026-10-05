/* CAMERA SCALE (pass 8) -- the shot camera's distance (d) and screen offset (sx, sy): IoU with the sample's figure mass
   (occlusion map, private/test/sample_figure8.json) and its visible head (private/test/sample_head7.json); face points
   (near eye, chin -- the sample targets from the stage fit of pass 5) soft: w * (error / 5 px)^2. The camera angles
   (az, el, fov) and the pose do not change -- only the scale and the place in the frame.
   Why: the user said "after 10 the camera gets big-small like a zoom" -- the figure area in the sample is 0.431/0.509/0.578
   (three shots), in ours 0.441/0.407/0.648: it shrinks in shot 2 and grows in shot 3 (in the sample it grows in both).
   node test/fit_camera8.mjs --shot 1|2 [--w 0.25] [--iter 120] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 1), ITER = +arg('iter', 120), WF = +arg('w', 0.25);
const ROOT = new URL('..', import.meta.url).pathname;
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': extname(p) === '.js' ? 'text/javascript' : extname(p) === '.json' ? 'application/json' : 'text/html'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=320&h=180&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'private/test/sample_head7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json'))['shot' + (SHOT + 1)];
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]][SHOT];
/* sample face targets (pass 5, test/stage2_fit.mjs, stage3_fit.mjs): shot 2 eye, centre of the lash line (138.5, 78.5),
   chin tip (157, 111); shot 3 eye (155.7, 112.0), chin front-bottom (153, 154). Shot 1 -- the probe anchor (99.4, 48.7). */
const FACE = [{eye: [99.35, 48.7], chin: null}, {eye: [138.5, 78.5], chin: [157, 111]}, {eye: [155.7, 112.0], chin: [153, 154]}][SHOT];
const K0 = JSON.parse(readFileSync(ROOT + 'test/camera8_initial.json', 'utf8'))[SHOT];
const PAR = [['d', K0.d * 0.7, K0.d * 1.3], ['sx', K0.screen[0] - 0.12, K0.screen[0] + 0.12], ['sy', K0.screen[1] - 0.12, K0.screen[1] + 0.12]];
const ob = x => { const o = {}; PAR.forEach(([n, a, b], i) => { o[n] = +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4); }); return o; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
let n = 0;
async function score(x) {
  const o = ob(x), cam = {d: o.d, screen: [o.sx, o.sy]};
  const r = await pg.evaluate(({cam, idx, fr}) => {
    window.__camShot = {[idx]: cam};
    const b = window.hoodScore7({}, idx, fr);              // {} -- the shot hood in film.js
    const yz = fr.map(f => { window.frame(f); return window.faceScreen(); });
    return {...b, yz};
  }, {cam, idx: SHOT, fr: FR}); n++;
  const iou = r.iou.reduce((a, v) => a + v, 0) / r.iou.length, fig = soft(r.B, FIG);
  let e2 = 0, m = 0;
  for (const p of r.yz) { e2 += (p.eye[0] - FACE.eye[0]) ** 2 + (p.eye[1] - FACE.eye[1]) ** 2; m++; if (FACE.chin) { e2 += (p.chin[0] - FACE.chin[0]) ** 2 + (p.chin[1] - FACE.chin[1]) ** 2; m++; } }
  const faceRms = Math.sqrt(e2 / m);
  return {f: (1 - iou) + (1 - fig) + WF * (faceRms / 5) ** 2, iou, fig, faceRms, o, r};
}
const draw = (s, b) => console.log('%s f %s | head IoU %s | figure %s | face RMS %s px | d %s screen [%s, %s] | ours px %s sample %s', s, b.f.toFixed(4), b.iou.toFixed(3), b.fig.toFixed(3), b.faceRms.toFixed(1), b.o.d, b.o.sx, b.o.sy, b.r.ours.join(','), b.r.sample.join(','));
const x0 = PAR.map(([nm, a, b]) => { const v = nm === 'd' ? K0.d : nm === 'sx' ? K0.screen[0] : K0.screen[1]; return (v - a) / (b - a); });
const b0 = await score(x0); draw('initial (shot ' + SHOT + '):', b0);
if (arg('scan', null)) {       // --scan 0.8,0.9,1.0,1.1 -- d ratios, the screen offset fixed
  for (const k of arg('scan').split(',').map(Number)) { const x = x0.slice(); x[0] = (K0.d * k - PAR[0][1]) / (PAR[0][2] - PAR[0][1]); draw('  d x' + k + ':', await score(x)); }
  await br.close(); srv.close(); process.exit(0);
}
async function nm(z0, iter, q) {
  const N = z0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [z0.slice()]; for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -q : q))); P.push(p); }
  let F = []; for (const p of P) F.push(await score(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (k % 20 === 0) draw('  ' + k + ' (score ' + n + ')', F[0]);
    if (F[N].f - F[0].f < 1e-5) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await score(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await score(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await score(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await score(P[i]); } }
  }
  return F[0];
}
const optimum = await nm(x0, ITER, 0.15);
draw('BEST (w ' + WF + '):', optimum);
writeFileSync(ROOT + 'test/camera8_fit_shot' + SHOT + '_w' + WF + '.json', JSON.stringify({shot: SHOT, w: WF, camera: {d: optimum.o.d, screen: [optimum.o.sx, optimum.o.sy]}, iou: optimum.iou, figure: optimum.fig, faceRms: optimum.faceRms, initial: {iou: b0.iou, figure: b0.fig, faceRms: b0.faceRms, camera: K0}}, null, 1));
await br.close(); srv.close();
