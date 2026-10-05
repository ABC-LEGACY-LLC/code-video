/* KIYIM MOSLASH -- kapyushon, plash va gavda parametrlari misolning figura massasiga (yopilish xaritasi, 10 px
   bloklar, 320x180) 1- va 3-shotda BIRGA moslanadi. Fit, not trace: shakl -- o'z parametrli modelimiz, render --
   yakuniy render bilan bir xil kod (rol style, 320x180). Maqsad funksiyasi: 1 - o'rtacha yumshoq IoU (blokdagi
   qoplanish ulushi 0..1, misol bloki 0/1) + jarima: bosh (teri+soch) ko'rinishi boshlang'ichdan 85 % dan kam
   bo'lsa. Nelder-Mead (normallangan [0,1] parametrlarda) + tasodifiy qayta boshlashlar.
   node test/fit_kiyim.mjs [--iter 400] [--qayta 3] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 400), QAYTA = +arg('qayta', 3);
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

const T = JSON.parse(readFileSync(ROOT + 'test/misol_figura.json'));
const SHOT = {shot1: [0, 3, 6, 8, 9, 10], shot3: [13, 15, 17, 19, 21]};
const FR = [...SHOT.shot1, ...SHOT.shot3];

// parametrlar: [guruh, nom, min, max]
const PAR = [   // chegaralar: anatomik/kiyim jihatdan maqbul. 2-urinish: kapyushon old radiusi (r0) boshga yaqin -- orqasi
               // (orqa) katta; r0 1.67 da old tomoni yuz ustida "soyabon/visor" bo'lib chiqardi (audit 2)
  ['kap', 'r0', 1.12, 1.40], ['kap', 'rYelka', 0.3, 1.6], ['kap', 'yTepa', 1.2, 2.0], ['kap', 'gumbaz', 0, 0.6],
  ['kap', 'uchY', 0, 1.2], ['kap', 'uchZ', 0, 1.6], ['kap', 'kengX', 0.85, 1.45], ['kap', 'uzun', 3.0, 4.8], ['kap', 'orqa', 0, 2.2],
  ['plash', 'r0', 1.4, 2.8], ['plash', 'rKeng', 0.4, 2.6], ['plash', 'zNisbat', 0.5, 1.3], ['plash', 'orqa', 0, 1.5],
  ['gavda', 'dz', 0, 0.8], ['gavda', 'dy', -0.6, 0.3], ['gavda', 'bur', -0.8, 0.8],
];
function obyekt(x) {                                      // normallangan vektor -> KIYIM parametrlari
  const o = {kap: {}, plash: {}, gavda: {}};
  PAR.forEach(([g, n, a, b], i) => { o[g][n] = a + Math.min(1, Math.max(0, x[i])) * (b - a); });
  return o;
}
async function hisob(o) { return pg.evaluate(({o, SHOT}) => window.fitBaho(o, SHOT), {o, SHOT}); }
const blok = a => { const B = []; for (let y = 0; y < 18; y++) B.push(a.slice(y * 32, y * 32 + 32)); return B; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { mn += Math.min(B[y][x], T[y][x]); mx += Math.max(B[y][x], T[y][x]); } return mn / mx; };
const qattiq = (B, T) => { let i = 0, u = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y][x] > 0.5, t = T[y][x] > 0; i += b && t; u += b || t; } return i / u; };

let YUZ0 = null, BOY0 = null, X0 = null, n = 0;
async function baho(x) {
  const o = obyekt(x), r = await hisob(o); n++;
  const B1 = blok(r.B.shot1), B3 = blok(r.B.shot3), yuz = r.yuz;
  if (!YUZ0) { YUZ0 = yuz; BOY0 = r.boyin; }
  let jarima = 0; yuz.forEach((v, i) => { jarima += Math.max(0, 0.85 - v / YUZ0[i]); });
  r.boyin.forEach((v, i) => { jarima += Math.max(0, (v - BOY0[i] - 150) / 1500); });     // bo'yin ko'rinishi o'smasin (misolda qisqa)
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);                  // boshlang'ichdan uzoqlashishga kichik jarima
  const i1 = soft(B1, T.shot1), i3 = soft(B3, T.shot3);
  return {f: 1 - (i1 + i3) / 2 + 2 * jarima + reg, i1, i3, q1: qattiq(B1, T.shot1), q3: qattiq(B3, T.shot3), jarima, o};
}

// boshlang'ich nuqta: hozirgi KIYIM qiymatlari (sahifadan)
const joriy = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__kiyimJoriy())));
const x0 = PAR.map(([g, nm, a, b]) => Math.min(1, Math.max(0, (joriy[g][nm] - a) / (b - a)))); X0 = x0.slice();
const b0 = await baho(x0);
console.log('boshlang\'ich: soft IoU shot1 %s shot3 %s | qattiq %s %s', b0.i1.toFixed(3), b0.i3.toFixed(3), b0.q1.toFixed(3), b0.q3.toFixed(3));

async function nm(x0, iter, qadam = 0.15) {
  const N = x0.length, P = [x0.slice()];
  for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = []; for (const p of P) F.push(await baho(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f);
    const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) console.log('  %d  eng yaxshi f %s  IoU %s / %s  (qattiq %s / %s)  jarima %s  baho %d', k, F[0].f.toFixed(4), F[0].i1.toFixed(3), F[0].i3.toFixed(3), F[0].q1.toFixed(3), F[0].q3.toFixed(3), F[0].jarima.toFixed(3), n);
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
let rnd = 12345; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < QAYTA; q++) {
  const bosh = q === 0 ? x0 : eng.x.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(bosh, ITER, q === 0 ? 0.2 : 0.1);
  console.log('qayta %d: f %s  IoU %s / %s  qattiq %s / %s', q, r.r.f.toFixed(4), r.r.i1.toFixed(3), r.r.i3.toFixed(3), r.r.q1.toFixed(3), r.r.q3.toFixed(3));
  if (r.r.f < eng.r.f) eng = r;
  writeFileSync(ROOT + 'test/kiyim_fit_oraliq.json', JSON.stringify({qayta: q, kiyim: eng.r.o, soft: [eng.r.i1, eng.r.i3], qattiq: [eng.r.q1, eng.r.q3]}, null, 1));
}
writeFileSync(ROOT + 'test/kiyim_fit.json', JSON.stringify({kiyim: eng.r.o, soft: [eng.r.i1, eng.r.i3], qattiq: [eng.r.q1, eng.r.q3],
  boshlangich: {soft: [b0.i1, b0.i3], qattiq: [b0.q1, b0.q3]}, baholar: n}, null, 1));
console.log('eng yaxshi:', JSON.stringify(eng.r.o));
await br.close(); srv.close();
