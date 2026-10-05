/* YUZ MOSLASH -- bosh nisbatlari (yuz uzunligi, iyak, pastki yuz, burun), yuz chizmasi o'rinlari (ko'z, og'iz) va
   har shot pozasi (egilish, burilish) + kamera surilishi misolning YUZ NUQTALARIGA moslanadi. Chizma -- bizniki;
   o'lchanadi faqat o'rin (texnika: sahnalashtirish va nisbat).
   Misol nuqtalari (320x180), L jadvallaridan o'qilgan (taqqos jadval, +-2 px):
     3-tasvir (1-shot, ushlangan): yaqin ko'z (97.6, 46.3) -- langar zondi; uzoq ko'z qorachig'i (121, 48.5);
       og'iz chizig'i markazi (122.5, 85); iyak (yuz old chizig'ining pastki buriluvi) (127, 107)
     12-tasvir (2-shot, profil): yumuq ko'z chizig'i markazi (137, 78); burun uchi (161, 90); og'iz (162, 104);
       iyak (155, 114)
   node test/fit_yuz.mjs  ->  test/yuz_fit.json */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=320&h=180&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});

const M1 = {yaqin: [97.6, 46.3], uzoq: [121, 48.5], ogiz: [122.5, 85], iyak: [127, 107]};
const M2 = {yaqin: [137, 78], burun: [161, 90], ogiz: [162, 104], iyak: [155, 114]};
// parametrlar: [nom, min, max, boshlang'ich]
const PAR = [   // 2-urinish: poza va kamera QAT'IY (1-urinishda egilish -0.79 ga ketib, yuz pastdan ko'rinib qoldi -- 4 nuqta mos,
               // ko'rinish noto'g'ri: "to'g'ri son, noto'g'ri sabab"); faqat yuz shakli va chizma o'rinlari
  ['iyakY', 0.0, 0.6, 0.20], ['iyakZ', 0.0, 0.9, 0.16], ['jagOrqa', -0.3, 0.35, 0.20], ['burun', 0.05, 0.40, 0.13],
  ['ogizY', -0.95, -0.50, -0.64], ['kozY', -0.32, -0.02, -0.17],
];
const QAT = {eg1: -0.30, bur1: -0.15, ex1: 0.261, ey1: 0.31, eg2: 0.02, bur2: 0.12, ex2: 0.31, ey2: 0.39, d2: 9.51};
const X0 = PAR.map(([n, a, b, v]) => (v - a) / (b - a));
const ob = x => ({...QAT, ...Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]))});
const xato = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
async function baho(x) {
  const o = ob(x);
  const bosh = {iyakY: o.iyakY, iyakZ: o.iyakZ, jagOrqa: o.jagOrqa, burun: o.burun}, yuz = {ogizY: o.ogizY, kozY: o.kozY};
  const r1 = await pg.evaluate(a => window.yuzNuqtalar(a), {bosh, yuz, kam: {az: 55, el: -8, d: 7.03, fov: 27, ekran: [o.ex1, o.ey1], markaz: [0, 0, 0]},
    poza: {egilish: o.eg1, burilish: o.bur1, yonga: 0, yumuq: 0}});
  const r2 = await pg.evaluate(a => window.yuzNuqtalar(a), {bosh, yuz, kam: {az: 84, el: -4, d: o.d2, fov: 27, ekran: [o.ex2, o.ey2], markaz: [0, 0, 0]},
    poza: {egilish: o.eg2, burilish: o.bur2, yonga: 0, yumuq: 1}});
  let e = 0; for (const k in M1) e += xato(r1[k], M1[k]); for (const k in M2) e += xato(r2[k], M2[k]);
  const reg = 0.5 * x.reduce((s, t, i) => s + (t - X0[i]) ** 2, 0);        // kichik: boshlang'ichdan keraksiz uzoqlashmasin
  return {f: e + reg, e, r1, r2, o};
}
async function nelder(x0, qadam, iter) {
  const N = x0.length, P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + qadam)); P.push(p); }
  let F = []; for (const p of P) F.push(await baho(p));
  const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N].f - F[0].f < 1e-5) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await baho(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await baho(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await baho(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await baho(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0]; return {x: P[i], r: F[i]};
}
const b0 = await baho(X0);
console.log('boshlang\'ich xato (px RMS):', Math.sqrt(b0.e / 8).toFixed(2));
let eng = {x: X0, r: b0};
for (let q = 0; q < 4; q++) {
  const r = await nelder(eng.x, q === 0 ? 0.15 : 0.08, 1500);
  if (r.r.f < eng.r.f) eng = r;
  console.log('qayta', q, 'xato px RMS', Math.sqrt(eng.r.e / 8).toFixed(2));
}
const o = eng.r.o, f = v => v.map(t => t.toFixed(1)).join(', ');
console.log(JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v));
for (const k in M1) console.log('1-shot', k, 'biz (' + f(eng.r.r1[k]) + ')  misol (' + f(M1[k]) + ')');
for (const k in M2) console.log('2-shot', k, 'biz (' + f(eng.r.r2[k]) + ')  misol (' + f(M2[k]) + ')');
writeFileSync(ROOT + 'test/yuz_fit2.json', JSON.stringify({param: o, xato_px: Math.sqrt(eng.r.e / 8), r1: eng.r.r1, r2: eng.r.r2, M1, M2}, null, 1));
await br.close(); srv.close();
