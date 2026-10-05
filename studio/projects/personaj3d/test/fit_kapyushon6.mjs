/* KAPYUSHON MOSLASH (6-o'tish) -- yangi soch bilan. Misolda kapyushon 1- va 2-shotda BOSH ORTIDA (soch undan oldinda),
   3-shotda toj ustida. Maqsad: 1 - o'rtacha yumshoq figura IoU (1- va 3-shot, 10 px bloklar -- fit_kiyim.mjs dagidek)
   + lA * (misolning yorug' sochi bizda kapyushon ostida qolgan ulushi, 3 shot o'rtachasi)
   + lB * (bizning ko'rinadigan sochimiz misolda qorong'i (L<30) joyda -- ulush, 3 shot o'rtachasi)
   + jarima (yuz ko'rinishi boshlang'ichdan 85 % dan kam, bo'yin o'sishi). Nelder-Mead [0,1] da + qayta boshlash.
   Misol niqoblari: test/misol_niqob6.json (python, soch_qoplash.py bilan bir xil niqob). Parametrlar faqat kapyushon;
   plash/gavda 3-o'tishdagi moslashdan qoladi.
   node test/fit_kapyushon6.mjs [--iter 300] [--qayta 2] [--faqat-baho 1] [--lA 1] [--lB 0.5] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 300), QAYTA = +arg('qayta', 2), LA = +arg('lA', 1), LB = +arg('lB', 0.5), FAQAT = +arg('faqat-baho', 0);
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180;
const pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_niqob6.json')));

const T = JSON.parse(readFileSync(ROOT + 'test/misol_figura.json'));
const SHOT = {shot1: [0, 3, 6, 8, 9, 10], shot2: [11, 12], shot3: [13, 15, 17, 19, 21]};
const PAR = [
  ['r0', 1.12, 1.50], ['yTepa', 1.2, 2.4], ['gumbaz', 0, 0.6], ['uchY', 0, 1.2], ['uchZ', 0, 1.6], ['kengX', 0.85, 1.45],
  ['uzun', 3.0, 4.8], ['orqa', 0, 2.2], ['ochiq', 1.4, 2.6], ['ochV0', -0.10, 0.25], ['ochV1', 0.10, 0.45],
  ['surZ', 0, 1.0], ['surY', -0.3, 0.6], ['soyabon', 0, 0.3], ['rYelka', 0.3, 1.6],
];
const obyekt = x => { const kap = {}; PAR.forEach(([n, a, b], i) => { kap[n] = a + Math.min(1, Math.max(0, x[i])) * (b - a); }); return {kap}; };
const blok = a => { const B = []; for (let y = 0; y < 18; y++) B.push(a.slice(y * 32, y * 32 + 32)); return B; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { mn += Math.min(B[y][x], T[y][x]); mx += Math.max(B[y][x], T[y][x]); } return mn / mx; };

let YUZ0 = null, X0 = null, n = 0;
async function baho(x) {
  const o = obyekt(x), r = await pg.evaluate(({o, SHOT}) => window.kapBaho(o, SHOT), {o, SHOT}); n++;
  if (!YUZ0) YUZ0 = r.yuz;
  let jarima = 0; r.yuz.forEach((v, i) => { jarima += Math.max(0, 0.85 - v / Math.max(1, YUZ0[i])); });
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  const i1 = soft(blok(r.B.shot1), T.shot1), i3 = soft(blok(r.B.shot3), T.shot3);
  const A = (r.A.shot1 + r.A.shot2 + r.A.shot3) / 3, Bs = (r.Bs.shot1 + r.Bs.shot2 + r.Bs.shot3) / 3;
  return {f: 1 - (i1 + i3) / 2 + LA * A + LB * Bs + 2 * jarima + reg, i1, i3, A: r.A, Bs: r.Bs, jarima, o};
}
const chiz = (s, b) => console.log('%s f %s | figura IoU %s / %s | A (yorug\' soch kapyushon ostida) %s %s %s | B (soch misol qorong\'isida) %s %s %s | jarima %s',
  s, b.f.toFixed(4), b.i1.toFixed(3), b.i3.toFixed(3), b.A.shot1.toFixed(3), b.A.shot2.toFixed(3), b.A.shot3.toFixed(3), b.Bs.shot1.toFixed(3), b.Bs.shot2.toFixed(3), b.Bs.shot3.toFixed(3), b.jarima.toFixed(3));

const joriy = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__kiyimJoriy())));
const x0 = PAR.map(([nm, a, b]) => Math.min(1, Math.max(0, ((joriy.kap[nm] || 0) - a) / (b - a)))); X0 = x0.slice();
const b0 = await baho(x0); chiz('boshlang\'ich:', b0);
if (FAQAT) {
  for (const v of JSON.parse(arg('sinov', '[]'))) { const x = x0.slice(); for (const [k, val] of Object.entries(v)) { const i = PAR.findIndex(p => p[0] === k); x[i] = (val - PAR[i][1]) / (PAR[i][2] - PAR[i][1]); } chiz(JSON.stringify(v), await baho(x)); }
  await br.close(); srv.close(); process.exit(0);
}
async function nm(x0, iter, qadam = 0.15) {
  const N = x0.length, P = [x0.slice()];
  for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = []; for (const p of P) F.push(await baho(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f);
    const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) chiz('  ' + k + ' (baho ' + n + ')', F[0]);
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))); const fr = await baho(xr);
    if (fr.f < F[0].f) {
      const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))); const fe = await baho(xe);
      if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; }
    } else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else {
      const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))); const fc = await baho(xc);
      if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; }
      else { for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await baho(P[i]); } }
    }
  }
  const i0 = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0];
  return {x: P[i0], r: F[i0]};
}
let eng = {x: x0, r: b0};
let rnd = 777; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < QAYTA; q++) {
  const bosh = q === 0 ? x0 : eng.x.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(bosh, ITER, q === 0 ? 0.2 : 0.1);
  chiz('qayta ' + q + ':', r.r);
  if (r.r.f < eng.r.f) eng = r;
  writeFileSync(ROOT + 'test/kapyushon6_oraliq.json', JSON.stringify({qayta: q, kap: eng.r.o.kap, f: eng.r.f}, null, 1));
}
writeFileSync(ROOT + 'test/kapyushon6_fit.json', JSON.stringify({kap: eng.r.o.kap, f: eng.r.f, figura: [eng.r.i1, eng.r.i3], A: eng.r.A, B: eng.r.Bs,
  boshlangich: {f: b0.f, figura: [b0.i1, b0.i3], A: b0.A, B: b0.Bs}, baholar: n}, null, 1));
chiz('ENG YAXSHI:', eng.r); console.log(JSON.stringify(eng.r.o.kap));
await br.close(); srv.close();
