/* pass 9, 2b AGAIN (fit_hair9b): once the shot 2 camera was refitted together with the hood (d 10.32 -> 10.80, screen
   [0.422, 0.474] -> [0.3865, 0.4228]; face contour 9.81 -> 2.10 px) the face landed on the sample's face, and the near strand in
   its single 3/4 rest shape covered 27 / 23 % of the sample's face skin (test/audit_sample/face_hair.py; 5 / 3 % in hair9). The
   bright-mass IoU does not notice this (the strand is small, the fan is large) -- so COVERAGE was added to the objective: the
   share of our hair over the sample's face skin on the role render (mean of k12, k13 + 0.5 x k5), weight --lam (default 1).
   The previous fit (fit_hair9) got contaminated when the source changed and was stopped -- its result was not applied.
   node test/fit_hair9b.mjs [--iter 60] [--lam 1] [--score-only '{"x0":-0.45,...}']
   ---
   ONE HAIR -- THE NEAR SIDE STRANDS FOR ALL THREE SHOTS TOGETHER (pass 9, 2b). The view weight (3/4 and profile rest shapes,
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
const ITER = +arg('iter', 60), LAM = +arg('lam', 1), WEIGHT = arg('weight', 'equal'), ROOT = new URL('..', import.meta.url).pathname, TMP = (process.env.TMPDIR || '/tmp') + '/personaj3d-hair9bfit';
mkdirSync(TMP, {recursive: true});
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
/* parameters: group.name -- the near strands now run ALONG A SECTION (personaj.js side(): root x0/yRoot on the face surface, the
   tip turns toward azimuth phU with t^pk) + how high the side strands of the short forehead fringe end (yTipSide). Fixed: dx -0.06,
   phD -0.1, yTip0 -1.0, swing 0.5 (wind and swing barely affect coverage: shF 0 -> 0.260/0.234, swing 0.15 -> 0.256/0.226) */
const PAR = [['near.x0', -0.85, -0.3], ['near.yRoot', 0.1, 0.75], ['near.phU', -2.4, -0.6], ['near.pk', 0.4, 3.0], ['near.width0', 0.18, 0.45],
             ['near.off', 0.0, 0.3], ['short.yTipSide', 0.0, 0.8]];
const STRICT = {near: {dx: -0.06, phD: -0.1, yTip0: -1.0, swing: 0.5}, short: {}};
const ORIG0 = {'near.x0': -0.4577, 'near.yRoot': 0.75, 'near.phU': -1.9669, 'near.pk': 0.4036,   // start: the best of attempt 1 (score 20, test/hair9b_stopped.log)
  'near.width0': 0.31, 'near.off': 0.0842, 'short.yTipSide': 0.4498};
const B0 = arg('start', null) ? JSON.parse(arg('start')) : {};   // --start '{"near.x0":...}'
const ORIG = Object.fromEntries(PAR.map(([n]) => [n, B0[n] !== undefined ? B0[n] : ORIG0[n]]));
const inner = o => { const r = {near: {...STRICT.near}, short: {...STRICT.short}}; for (const k in o) { const [g, n] = k.split('.'); r[g][n] = o[k]; } return r; };
let n = 0;
async function score(o, folder = TMP + '/k') {
  const pg = await br.newPage({viewport: {width: 480, height: 270}});
  const qs = `style=anime&w=480&h=270&film=sample22&snowN=1&hair=${encodeURIComponent(JSON.stringify(inner(o)))}`;
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
  mkdirSync(folder, {recursive: true});
  for (let k = 0; k <= 21; k++) { await pg.evaluate(k => window.frame(k), k); const d = await pg.evaluate(() => window.image()); writeFileSync(`${folder}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pg.close();
  const r = JSON.parse(execSync(`python3 ${ROOT}test/audit_sample/hair_iou.py ${folder} 1-22`).toString());
  const s1 = [...Array(11).keys()].map(i => r[i + 1].iou).reduce((a, b) => a + b) / 11, s2 = (r[12].iou + r[13].iou) / 2;
  const s3 = [...Array(9).keys()].map(i => r[i + 14].iou).reduce((a, b) => a + b) / 9;
  /* pass 10: coverage -- the share of our hair over the sample's visible face (test/parts/part_measure.py face_mask), on the
     role render, frames from each shot (1, 5, 9, 10 | 12, 13 | 16, 20), shot means equal (test/parts/coverage.py) */
  const pr = await br.newPage({viewport: {width: 480, height: 270}}), rp = folder + 'r';
  await pr.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs.replace('style=anime', 'style=role')}`);
  await pr.waitForFunction(() => window.ready, null, {timeout: 60000});
  mkdirSync(rp, {recursive: true});
  for (const k of [0, 4, 8, 9, 11, 12, 15, 19]) { await pr.evaluate(k => window.frame(k), k); const d = await pr.evaluate(() => window.image()); writeFileSync(`${rp}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pr.close();
  const q = JSON.parse(execSync(`python3 ${ROOT}test/parts/coverage.py ${rp} 1,5,9,10,12,13,16,20`).toString());
  const c1 = (q[1] + q[5] + q[9] + q[10]) / 4, c2 = (q[12] + q[13]) / 2, c3 = (q[16] + q[20]) / 2, cov = (c1 + c2 + c3) / 3;
  const W = WEIGHT === 'frame' ? [11 / 22, 2 / 22, 9 / 22] : [1 / 3, 1 / 3, 1 / 3];     // frame: by screen time
  return {f: 1 - (W[0] * s1 + W[1] * s2 + W[2] * s3) + LAM * (W[0] * c1 + W[1] * c2 + W[2] * c3), s1, s2, s3, cov, c12: c1, c13: c2, c5: c3, r};
}
const ob = x => Object.fromEntries(PAR.map(([nn, a, b], i) => [nn, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
if (arg('score-only', null)) {
  const o = {...ORIG, ...JSON.parse(arg('score-only'))}, b = await score(o);
  console.log(JSON.stringify(o), `-> shot 1 ${b.s1.toFixed(3)} shot 2 ${b.s2.toFixed(3)} shot 3 ${b.s3.toFixed(3)} hair on face shot 1/2/3 ${b.c12.toFixed(3)} / ${b.c13.toFixed(3)} / ${b.c5.toFixed(3)} f ${b.f.toFixed(4)}`);
} else {
  const f = async x => { const o = ob(x), b = await score(o); if (++n % 5 === 0 || n === 1) console.log(`  ${n}: f ${b.f.toFixed(4)} (shot 1 ${b.s1.toFixed(3)}, shot 2 ${b.s2.toFixed(3)}, shot 3 ${b.s3.toFixed(3)}; hair on face 1/2/3 ${b.c12.toFixed(3)}/${b.c13.toFixed(3)}/${b.c5.toFixed(3)}) ${JSON.stringify(o)}`); return b.f; };
  const x0 = PAR.map(([nn, a, b]) => (ORIG[nn] - a) / (b - a)), N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -0.2 : 0.2))); P.push(pp); }
  let F = []; for (const pp of P) F.push(await f(pp));
  for (let k = 0; k < ITER; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
    writeFileSync(ROOT + arg('out', 'test/hair9b_fit.json'), JSON.stringify({orig: ORIG, lam: LAM, weight: WEIGHT, optimum: ob(P[0]), f: F[0], iter: k}, null, 1));
  }
  const best = ob(P[0]), b = await score(best);
  console.log('ORIG', JSON.stringify(ORIG)); console.log('OPTIMUM', JSON.stringify(best), `-> shot 1 ${b.s1.toFixed(3)} shot 2 ${b.s2.toFixed(3)} shot 3 ${b.s3.toFixed(3)} hair on face ${b.c12.toFixed(3)}/${b.c13.toFixed(3)}/${b.c5.toFixed(3)} f ${b.f.toFixed(4)}`);
  writeFileSync(ROOT + arg('out', 'test/hair9b_fit.json'), JSON.stringify({orig: ORIG, lam: LAM, weight: WEIGHT, optimum: best, f: b.f, s1: b.s1, s2: b.s2, s3: b.s3, c12: b.c12, c13: b.c13, c5: b.c5, r: b.r}, null, 1));
}
await br.close(); srv.close();
