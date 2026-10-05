/* KAMERA VA POZA -- YANGI MODELGA (12-o'tish, oxirgi qadam). Alonur: "birinchi to'g'ri 3D modellar, keyin kamerani oshanga
   to'g'rilasak". Model (bosh, soch, kapyushon, yorug'lik) qat'iy; shot kamerasi (d, ekran, az, el) va bosh pozasi qo'shimchasi
   (egilish, burilish, yonga) BIRGA: inson belgilari (yuz RMS, test/yuz11.mjs -- MAXFIY nishon) + butun kadr bo'yicha qism
   sinflari (misol: 1 bosh, 2 ich, 4 figura -- test/qism/inson/qism_nishon_12.json, MAXFIY; biz: rol render, window.kapTuzBaho)
   + figura massasi. Kamera burchagi o'zgarishi jarimali (bosh pozasi bilan almashinadi).
   node test/fit_kamera_tuz.mjs --shot 3 [--iter 300] [--baho '{"nom": {"dEl": 5}}'] [--chiq test/kamera_tuz_s3.json] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const {yuzBaho} = await import('./yuz11.mjs'), {yuzBaho1} = await import('./yuz13_s1.mjs');   // 1-shot: Alonur belgilari R03, R10 (13-o'tish)
const {FILMLAR} = await import('../src/film.js');
const S = +arg('shot', 3), si = S - 1, sh = FILMLAR.misol22.shotlar[si], kam0 = sh.kamera;
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]}[S];
const M = JSON.parse(readFileSync(ROOT + 'test/qism/inson/qism_nishon_12.json')).m, GR = {};
for (const f of FR) { const m = Buffer.from(M[String(f)], 'base64'), px = new Array(W * H), c = new Array(W * H);
  for (let j = 0; j < W * H; j++) { px[j] = j; const b = m[j]; c[j] = b & 1 ? 0 : b & 2 ? 1 : b & 4 ? 2 : 3; } GR[f] = {px, c}; }
await pg.evaluate(g => { window.__GR = g; }, GR);
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FT = FIG['shot' + S];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const iou = (C, k) => { let r = 0, c = 0; for (let j = 0; j < 4; j++) { r += C[k * 4 + j]; c += C[j * 4 + k]; } const d = r + c - C[k * 4 + k]; return d ? C[k * 4 + k] / d : 1; };
const VZ = {yuz: +arg('wy', 1 / 3), bosh: +arg('wb', 3), ich: +arg('wi', 1.5), tashqi: +arg('wt', 1.5), fig: +arg('wf', 2)};
const KP = [['dEg', -0.6, 0.6, 0.04], ['dBur', -0.8, 0.8, 0.05], ['dYon', -0.4, 0.4, 0.03], ['dD', -3, 3, 0.3], ['dSx', -0.15, 0.15, 0.01],
            ['dSy', -0.15, 0.15, 0.01], ['dAz', -30, 30, 3], ['dEl', -35, 35, 3]];
async function baho(v) {
  const o = {pozaShot: {[si]: {dEg: v.dEg || 0, dBur: v.dBur || 0, dYon: v.dYon || 0}},
             kamShot: {[si]: {az: kam0.az + (v.dAz || 0), el: kam0.el + (v.dEl || 0), d: kam0.d + (v.dD || 0), ekran: [kam0.ekran[0] + (v.dSx || 0), kam0.ekran[1] + (v.dSy || 0)]}}};
  const r = await pg.evaluate(({o, fr}) => window.kapTuzBaho(o, fr, null), {o, fr: FR});
  const C = new Array(16).fill(0), B = new Array(576).fill(0);
  for (const f of FR) { r[f].conf.forEach((x, i) => C[i] += x); r[f].B.forEach((x, i) => B[i] += x / FR.length); }
  const yz = S === 1 ? yuzBaho1(v) : yuzBaho(S, v);
  const b = {yz, bosh: iou(C, 0), ich: iou(C, 1), tashqi: iou(C, 2), fig: soft(B, FT)};
  b.F = VZ.yuz * yz + VZ.bosh * (1 - b.bosh) + VZ.ich * (1 - b.ich) + VZ.tashqi * (1 - b.tashqi) + VZ.fig * (1 - b.fig) + 0.5 * (((v.dAz || 0) / 15) ** 2 + ((v.dEl || 0) / 15) ** 2);
  return b;
}
const fmt = b => `F ${b.F.toFixed(3)} | yuz ${b.yz.toFixed(2)} px | bosh ${b.bosh.toFixed(3)} ich ${b.ich.toFixed(3)} tashqi ${b.tashqi.toFixed(3)} fig ${b.fig.toFixed(3)}`;
if (arg('baho', null)) for (const [nom, v] of Object.entries(JSON.parse(arg('baho')))) console.log(nom.padEnd(12), fmt(await baho(v)));
if (process.argv.includes('--moslash')) {
  const ITER = +arg('iter', 300), B0 = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};
  const x0 = KP.map(([n]) => B0[n] || 0), lo = KP.map(t => t[1]), hi = KP.map(t => t[2]), q = KP.map(t => t[3]);
  const vOl = x => Object.fromEntries(KP.map(([n], i) => [n, x[i]]));
  let n = 0, eng = null;
  const yoz = () => writeFileSync(ROOT + arg('chiq', `test/kamera_tuz_s${S}.json`), JSON.stringify({shot: S, baho: n, natija: eng.b, v: Object.fromEntries(Object.entries(vOl(eng.x)).map(([k, t]) => [k, +t.toFixed(4)])),
    kamera: {az: +(kam0.az + eng.x[6]).toFixed(3), el: +(kam0.el + eng.x[7]).toFixed(3), d: +(kam0.d + eng.x[3]).toFixed(4), ekran: [+(kam0.ekran[0] + eng.x[4]).toFixed(4), +(kam0.ekran[1] + eng.x[5]).toFixed(4)]}}, null, 1));
  const f = async x => { const b = await baho(vOl(x)); if (!eng || b.F < eng.b.F) { eng = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)} | ${KP.map(([nn], i) => nn + ' ' + x[i].toFixed(3)).join(' ')}`); yoz(); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, turg = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; turg = 0; } else if (++turg > 40) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  console.log('YAKUN', fmt(eng.b), JSON.stringify(vOl(eng.x)));
}
await br.close(); srv.close();
