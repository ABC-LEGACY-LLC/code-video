/* BITTA KAPYUSHON -- UCH SHOTGA BIRGALIKDA (9-o'tish, 2c). 7-8-o'tishda kapyushon har shotga alohida moslangan edi (uch xil
   sirt + shotga bog'liq ergashish) -- kamera sinovida kalit almashganda 114 / 159 px sakrardi. Endi: bitta sirt
   (KIYIM.kap), boshga vaqt bo'yicha ergashish (tau -- mato inersiyasi), yuqori qism egilishi pozadan (eg + egK x egilish).
   Maqsad (fit_kapyushon7 dagi o'lchovlar, bir xil kod): har tasvirda misolning ko'rinadigan boshi (test/misol_bosh7.json)
   bilan IoU, shot bo'yicha figura bloklari (test/misol_figura8.json) yumshoq IoU -- UCH SHOT TENG og'irlik bilan.
   2-shot kamerasi (masofa, ekran) ham moslanadi, lekin YUZ bilan bog'langan: old kontur (21 qator) va iyak osti
   (test/fit_bosh9.mjs nishonlari, node proyeksiya) RMS 1.5 px dan oshsa jarima -- kamera yuzga mos qoladi, massa farqi
   KAPYUSHONDA hal bo'ladi (8-o'tishda 2-shot kamerasi massaga 12.88 -> 10.32 tortilgan, yuz 1.25 barobar katta chiqqan).
   node test/fit_kap9.mjs [--iter 400] [--bosh 1|2|3|joriy] [--faqat-baho] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {BOSH, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 400), ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_bosh7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]], FRALL = FR.flat();
const PAR = [['ochiq', 0.7, 2.6], ['ochV0', -0.25, 0.30], ['ochV1', 0.10, 0.60], ['surZ', -1.2, 1.2], ['surY', -0.8, 0.8],
             ['butunZ', -0.8, 0.8], ['butunY', -0.9, 0.6], ['r0', 1.12, 1.6], ['bur', -0.8, 0.8], ['soyabon', 0, 1.0],
             ['eg', -0.4, 1.0], ['uchY', 0.5, 2.2], ['gumbaz', 0.1, 1.2], ['ochA', 0.5, 2.0], ['ochB', 0.5, 2.0],
             ['tasmaA', 0.5, 7.0], ['tasmaB', 0.5, 7.0], ['tasmaAlt', 0, 1.5], ['tasmaBlt', 0, 1.5], ['tasmaV', 0.40, 0.90],
             ['tau', 0.0, 0.4], ['egK', -0.5, 1.2], ['d2', 9.0, 14.0], ['sx2', 0.34, 0.50], ['sy2', 0.36, 0.52]];
/* 2-shot yuz nishonlari (sahna2_fit.mjs / fit_bosh9.mjs) -- node proyeksiya, poza filmdagidek (i = 0) */
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const J2 = [[146, 114], [150, 113.5], [154, 113]];
BOSH.surish = 0; BOSH.profilW = 0;
const S2 = []; for (let j = 0; j <= 140; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 140; for (let i = 0; i <= 80; i++) { const ph = -1.9 + 3.8 * i / 80; S2.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
function yuz2(d, sx, sy) {
  const p = proyektor({az: 83.6, el: -5, fov: 27, d, ekran: [sx, sy]}, {egilish: -0.014, burilish: 0, yonga: 0});
  const q = Q2.map(() => -1e9), u = J2.map(() => -1e9);
  for (const s of S2) { const v = p(s);
    for (let i = 0; i < Q2.length; i++) if (Math.abs(v[1] - Q2[i][0]) < 0.6 && v[0] > q[i]) q[i] = v[0];
    for (let i = 0; i < J2.length; i++) if (Math.abs(v[0] - J2[i][0]) < 0.6 && v[1] > u[i]) u[i] = v[1]; }
  const e = [...Q2.map(([y, x], i) => q[i] - x), ...J2.map(([x, y], i) => u[i] - y)];
  return Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length);
}
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
let X0 = null, n = 0;
async function baho(x) {
  const o = ob(x), kap = Object.fromEntries(Object.entries(o).filter(([k]) => !['d2', 'sx2', 'sy2'].includes(k)));
  const r = await pg.evaluate(({kap, kam, fr}) => window.kapBaho9(kap, kam, fr), {kap, kam: {1: {d: o.d2, ekran: [o.sx2, o.sy2]}}, fr: FRALL}); n++;
  const sh = FR.map((fr, s) => ({iou: fr.reduce((a, f) => a + r.iou[f], 0) / fr.length, fig: soft(r.B[s], FIGT[s])}));
  const yz = yuz2(o.d2, o.sx2, o.sy2), jarima = 0.01 * Math.max(0, yz - 1.5) ** 2;
  const reg = X0 ? 0.002 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0) : 0;
  /* --vazn kadr: ko'rinadigan bosh -- ekranda turish vaqti (11/2/9), figura -- shotlar teng */
  const VK = arg('vazn', 'teng') === 'kadr' ? [11 / 22, 2 / 22, 9 / 22] : [1 / 3, 1 / 3, 1 / 3];
  const f = sh.reduce((a, s, i) => a + VK[i] * (1 - s.iou) + 0.5 * (1 - s.fig) / 3, 0) + jarima + reg;
  return {f, sh, yz, o, r};
}
const chiz = (s, b) => console.log('%s f %s | bosh IoU %s | figura %s | yuz2 RMS %s', s, b.f.toFixed(4), b.sh.map(t => t.iou.toFixed(3)).join('/'), b.sh.map(t => t.fig.toFixed(3)).join('/'), b.yz.toFixed(2));
/* boshlang'ich nuqtalar: 7-8-o'tishdagi uch shot kapyushoni (har biri HAMMA shotga) va joriy KIYIM.kap */
const ASOS = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__kiyimJoriy().kap)));
const SHOTKAP = [{ochiq: 0.842, ochV0: -0.2, ochV1: 0.534, surZ: 0.343, surY: 0.034, butunZ: -0.09, butunY: -0.425, r0: 1.304, bur: 0.069, soyabon: 0.206, eg: 0.052, uchY: 1.262, gumbaz: 0.507, ochA: 1.213, ochB: 1.26, tasmaA: 4.836, tasmaAlt: 0.264, tasmaV: 0.6},
                 {ochiq: 1.81, ochV0: -0.179, ochV1: 0.446, surZ: 0.74, surY: 0.594, butunZ: 0.217, butunY: -0.77, r0: 1.435, bur: 0.054, tasmaA: 3.754, tasmaB: 0.593},
                 {ochiq: 1.252, ochV0: 0.133, ochV1: 0.357, surZ: 0.626, surY: 0.702, butunZ: -0.52, butunY: -0.103, r0: 1.19, bur: 0.482, soyabon: 0.036, eg: 0.41, uchY: 1.031, gumbaz: 0.312, ochA: 0.624, ochB: 1.044, tasmaA: 4.792, tasmaV: 0.56}];
const KAM2 = {d2: 12.70, sx2: 0.4045, sy2: 0.4356};     // test/fit_bosh9.mjs: yuzga mos 2-shot kamerasi
const tox = v => PAR.map(([nm, a, b]) => Math.min(1, Math.max(0, ((v[nm] ?? 0) - a) / (b - a))));
let eng = null;
const nomlar = ['joriy', '1-shot', '2-shot', '3-shot'];
for (const [i, k] of [ASOS, ...SHOTKAP.map(s => ({...ASOS, ...s}))].entries()) {
  const b = await baho(tox({tau: 0, egK: 0, ...k, ...KAM2})); chiz('boshlang\'ich ' + nomlar[i] + ' kapyushoni hamma shotda:', b);
  if (!eng || b.f < eng.b.f) eng = {b, x: tox({tau: 0, egK: 0, ...k, ...KAM2}), nom: nomlar[i]};
}
if (process.argv.includes('--faqat-baho')) {
  /* --sinov '[{...}]' -- berilgan qiymatlar (ASOS ustiga); "aralash": [t1, t2, t3] -- uch shot kapyushonining og'irlikli o'rtachasi */
  for (const v of JSON.parse(arg('sinov', '[]'))) {
    let k = {...ASOS, tau: 0, egK: 0, ...KAM2};
    if (v.aralash) { const S = SHOTKAP.map(t => ({...ASOS, ...t})); for (const [nm] of PAR) if (S[0][nm] !== undefined) k[nm] = v.aralash.reduce((a, w, i) => a + w * (S[i][nm] ?? ASOS[nm] ?? 0), 0); }
    k = {...k, ...Object.fromEntries(Object.entries(v).filter(([nm]) => nm !== 'aralash'))};
    chiz(JSON.stringify(v).slice(0, 80), await baho(tox(k)));
  }
  await br.close(); srv.close(); process.exit(0);
}
if (arg('boshla', null) !== null) {       // --boshla 0..3 (joriy, 1-, 2-, 3-shot kapyushoni) yoki JSON (to'liq qiymatlar)
  const b = arg('boshla'), v = /^[0-3]$/.test(b) ? {tau: 0, egK: 0, ...[ASOS, ...SHOTKAP.map(t => ({...ASOS, ...t}))][+b], ...KAM2} : {...ASOS, ...JSON.parse(b)};
  eng = {x: tox(v), nom: 'boshla ' + b.slice(0, 40)}; eng.b = await baho(eng.x); chiz('majburiy boshlanish:', eng.b);
}
console.log('boshlanadi:', eng.nom);
X0 = eng.x.slice();
async function nm(z0, iter, qadam) {
  const N = z0.length, P = [z0.slice()];
  for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = []; for (const p of P) F.push(await baho(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) { chiz('  ' + k + ' (baho ' + n + ')', F[0]); writeFileSync(ROOT + 'test/kap9_fit' + (arg('chiq', '') || '') + '.json', JSON.stringify({o: F[0].o, f: F[0].f, sh: F[0].sh, yz: F[0].yz, k}, null, 1)); }
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await baho(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await baho(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await baho(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await baho(P[i]); } }
  }
  return {x: P[0], b: F[0]};
}
let r = await nm(eng.x, ITER, 0.12);
chiz('1-yurish:', r.b);
for (let q = 0; q < +arg('qayta', 2); q++) { r = await nm(r.x, ITER, 0.05); chiz(`qayta ${q + 1}:`, r.b); }
writeFileSync(ROOT + 'test/kap9_fit' + (arg('chiq', '') || '') + '.json', JSON.stringify({o: r.b.o, f: r.b.f, sh: r.b.sh, yz: r.b.yz, baho: n}, null, 1));
console.log('NATIJA', JSON.stringify(r.b.o));
await br.close(); srv.close();
