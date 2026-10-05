/* ONE HAIR -- THE NEAR SIDE STRANDS FOR ALL THREE SHOTS TOGETHER (pass 9, 2b). The view weight (3/4 and profile rest shapes,
   blended by camera angle) was removed; the single 3/4 shape falls in front of the face in shot 2 (our bright where the sample
   is not bright 25.7 -> 37.9 %). Here the design of the NEAR strands (HAIR.near: root, path, lean behind the jaw, distance from
   the surface, width, weight) is fitted as one shape to shots 1 and 2 together: in every frame the IoU of the sample's and our
   bright-mass masks (test/audit_sample/hair_iou.py -- the same code), shot means with equal weights. Physics, pose,
   camera -- as in the film (render 480x270 -> 320x180).
   node test/fit_hair9.mjs [--iter 60] [--score-only '{"x0":-0.45,...}'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {extname, join} from 'path';
import {execSync} from 'child_process';
import {HAIR} from '../src/personaj.js';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 60), ROOT = new URL('..', import.meta.url).pathname, TMP = (process.env.TMPDIR || '/tmp') + '/personaj3d-hair9fit';
mkdirSync(TMP, {recursive: true});
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const PAR = [['x0', -0.75, -0.25], ['dx', -0.14, 0.0], ['dxU', -0.55, 0.05], ['dzU', 0.0, 0.9], ['yRoot', 0.2, 0.75], ['yTip0', -1.35, -0.65], ['off', 0.0, 0.3], ['width0', 0.18, 0.45], ['swing', 0.15, 0.85]];
const ORIG = Object.fromEntries(PAR.map(([n]) => [n, HAIR.near[n]]));
let n = 0;
async function score(o, folder = TMP + '/k') {
  const pg = await br.newPage({viewport: {width: 480, height: 270}});
  const qs = `style=anime&w=480&h=270&film=sample22&snowN=1&hair=${encodeURIComponent(JSON.stringify({near: o}))}`;
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
  mkdirSync(folder, {recursive: true});
  for (let k = 0; k <= 21; k++) { await pg.evaluate(k => window.frame(k), k); const d = await pg.evaluate(() => window.image()); writeFileSync(`${folder}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pg.close();
  const r = JSON.parse(execSync(`python3 ${ROOT}test/audit_sample/hair_iou.py ${folder} 1-22`).toString());
  const s1 = [...Array(11).keys()].map(i => r[i + 1].iou).reduce((a, b) => a + b) / 11, s2 = (r[12].iou + r[13].iou) / 2;
  const s3 = [...Array(9).keys()].map(i => r[i + 14].iou).reduce((a, b) => a + b) / 9;
  return {f: 1 - (s1 + s2 + s3) / 3, s1, s2, s3, r};
}
const ob = x => Object.fromEntries(PAR.map(([nn, a, b], i) => [nn, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
if (arg('score-only', null)) {
  const o = {...ORIG, ...JSON.parse(arg('score-only'))}, b = await score(o);
  console.log(JSON.stringify(o), `-> shot 1 ${b.s1.toFixed(3)} shot 2 ${b.s2.toFixed(3)} shot 3 ${b.s3.toFixed(3)} f ${b.f.toFixed(4)}`);
} else {
  const f = async x => { const o = ob(x), b = await score(o); if (++n % 5 === 0 || n === 1) console.log(`  ${n}: f ${b.f.toFixed(4)} (shot 1 ${b.s1.toFixed(3)}, shot 2 ${b.s2.toFixed(3)}, shot 3 ${b.s3.toFixed(3)}) ${JSON.stringify(o)}`); return b.f; };
  const x0 = PAR.map(([nn, a, b]) => (ORIG[nn] - a) / (b - a)), N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -0.15 : 0.15))); P.push(pp); }
  let F = []; for (const pp of P) F.push(await f(pp));
  for (let k = 0; k < ITER; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
    writeFileSync(ROOT + 'test/hair9_fit.json', JSON.stringify({orig: ORIG, optimum: ob(P[0]), f: F[0], iter: k}, null, 1));
  }
  const best = ob(P[0]), b = await score(best);
  console.log('ORIG', JSON.stringify(ORIG)); console.log('OPTIMUM', JSON.stringify(best), `-> shot 1 ${b.s1.toFixed(3)} shot 2 ${b.s2.toFixed(3)} shot 3 ${b.s3.toFixed(3)} f ${b.f.toFixed(4)}`);
  writeFileSync(ROOT + 'test/hair9_fit.json', JSON.stringify({orig: ORIG, optimum: best, f: b.f, s1: b.s1, s2: b.s2, s3: b.s3, r: b.r}, null, 1));
}
await br.close(); srv.close();
