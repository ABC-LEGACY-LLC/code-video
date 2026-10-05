/* ONE WORLD BACKGROUND -- SKY AND SNOW FOR ALL THREE SHOTS TOGETHER (pass 9, 2d-2e). The background "top" (tilted toward the
   camera) and the snow layer (stuck to the camera) were removed: the sky is a world gradient, the snow a volume around all the cameras.
   Here the WORLD parameters (the sky gradient bounds osA/osB -- sine of the view ray's elevation; the fall-off of snow density
   with height snowGround/snowThick; particle count snowN) are fitted to all three shots together: the background profile
   (test/audit_sample/sky_measure.py: median of 20-row bands in the background box) and the snow density / size
   (snow_zoom.stats) -- the same code on both sides, shots with equal weights. The sample's background plate is the same in all
   three shots (2D); the world sky turns dark in shot 3, where the camera looks up -- a residual, measured here.
   node test/fit_background9.mjs [--iter 60] [--score-only '{"osA":-0.22,...}'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {extname, join} from 'path';
import {execSync} from 'child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 60), ROOT = new URL('..', import.meta.url).pathname, TMP = (process.env.TMPDIR || '/tmp') + '/personaj3d-background9fit';
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const FRAME = [1, 4, 8, 11, 12, 15, 18, 21];          // 0-based: shot 1 2,5,9; shot 2 12,13; shot 3 16,19,22 (sky_measure.py)
const PAR = [['osA', -0.8, 0.2], ['osB', -0.3, 0.9], ['snowGround', -8, 2], ['snowThick', 2, 40], ['snowN', 20000, 70000], ['snowSize', 40, 160], ['snowMin', 2, 9]];
const ORIG = {osA: -0.22, osB: 0.16, snowGround: -3, snowThick: 7, snowN: 37029, snowSize: 70, snowMin: 4};
const SAMPLE = JSON.parse(execSync(`python3 -c "import sys; sys.path.insert(0,'${ROOT}test/audit_sample'); import sky_measure as O, json; print(json.dumps(O.profile('sample')))"`).toString());
async function score(o, folder = TMP) {
  const pg = await br.newPage({viewport: {width: 960, height: 540}});
  const qs = `style=anime&w=960&h=540&film=sample22&osA=${o.osA}&osB=${o.osB}&snowGround=${o.snowGround}&snowThick=${o.snowThick}&snowN=${Math.round(o.snowN)}&snowSize=${o.snowSize}&snowMin=${o.snowMin}`;
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
  mkdirSync(folder, {recursive: true});
  for (const k of FRAME) { await pg.evaluate(k => window.frame(k), k); const d = await pg.evaluate(() => window.image()); writeFileSync(`${folder}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pg.close();
  const r = JSON.parse(execSync(`python3 -c "
import sys, json; sys.path.insert(0,'${ROOT}test/audit_sample'); import sky_measure as O, snow_zoom as QZ
p = O.profile('${folder}')
q = {s: [QZ.stats(QZ.L(QZ.file('${folder}', k)), QZ.BOX_X[s]) for k in ks] for s, ks in O.FRAME.items()}
qm = {s: [QZ.stats(QZ.L(QZ.file('sample', k)), QZ.BOX_X[s]) for k in ks] for s, ks in O.FRAME.items()}
print(json.dumps({'p': p, 'q': {s: [sum(v[0] for v in x) / len(x), sum(v[1] for v in x) / len(x)] for s, x in q.items()}, 'qm': {s: [sum(v[0] for v in x) / len(x), sum(v[1] for v in x) / len(x)] for s, x in qm.items()}}))
"`).toString());
  const sh = ['1', '2', '3'].map(s => {
    const pr = r.p[s].reduce((a, v, i) => a + Math.abs(v - SAMPLE[s][i]), 0) / r.p[s].length;
    return {background: pr, count: r.q[s][0], countM: r.qm[s][0], p90: r.q[s][1], p90M: r.qm[s][1]};
  });
  const f = sh.reduce((a, t) => a + t.background / 10 + Math.abs(t.count - t.countM) / 60 + Math.abs(t.p90 - t.p90M) / 3, 0) / 3;
  return {f, sh, p: r.p};
}
const draw = (s, b) => console.log('%s f %s | background |diff| %s | snow count %s (sample %s) | p90 %s (sample %s)', s, b.f.toFixed(4), b.sh.map(t => t.background.toFixed(1)).join('/'),
  b.sh.map(t => t.count.toFixed(0)).join('/'), b.sh.map(t => t.countM.toFixed(0)).join('/'), b.sh.map(t => t.p90.toFixed(1)).join('/'), b.sh.map(t => t.p90M.toFixed(1)).join('/'));
const ob = x => Object.fromEntries(PAR.map(([nn, a, b], i) => [nn, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
if (arg('score-only', null)) {
  for (const v of JSON.parse(arg('score-only'))) { const o = {...ORIG, ...v}, b = await score(o); draw(JSON.stringify(v), b); console.log('   profile', JSON.stringify(b.p)); }
} else {
  let n = 0;
  const f = async x => { const o = ob(x), b = await score(o); n++; if (n % 5 === 1) draw(`  ${n} ${JSON.stringify(o)}`, b); return b.f; };
  const x0 = PAR.map(([nn, a, b]) => (ORIG[nn] - a) / (b - a)), N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -0.2 : 0.2))); P.push(pp); }
  let F = []; for (const pp of P) F.push(await f(pp));
  for (let k = 0; k < ITER; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
    writeFileSync(ROOT + 'test/background9_fit.json', JSON.stringify({orig: ORIG, optimum: ob(P[0]), f: F[0], k}, null, 1));
  }
  const best = ob(P[0]), b = await score(best); draw('OPTIMUM ' + JSON.stringify(best), b);
  writeFileSync(ROOT + 'test/background9_fit.json', JSON.stringify({orig: ORIG, optimum: best, f: b.f, sh: b.sh, p: b.p}, null, 1));
}
await br.close(); srv.close();
import {chrome} from '../chrome.mjs';
