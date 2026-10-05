/* SOCH HAJMI -- UCH SHOTGA BIRGA (12-o'tish, tuzilish). Kapyushon va plash yashirin: misolning sochi (ton + ushlangan
   kadrlardagi harakat bilan ajratilgan, test/qism/inson/qism_nishon.py -- MAXFIY) bizda soch bilan qoplanganmi (tiklash) va
   bizning soch misolning yorug' terisini yopadimi (yuzni yopish). Kapyushon keyin ustidan yopadi -- misol boshidan
   tashqaridagi sochimiz jarimasiz. window.sochBaho12 / window.sochQur (src/main.js).
   node test/fit_soch12.mjs --baho '{"nom": {"yuzyon": {...}, "yaqin": {"n": 0}}}'
   node test/fit_soch12.mjs --moslash [--iter 200] [--boshla '{"yuzyon.az0": 40, ...}'] [--chiq test/soch12_fit.json] */
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
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__qism = r; }, JSON.parse(readFileSync(ROOT + 'test/qism/inson/qism_nishon_12.json')));
const {SOCH} = await import('../src/personaj.js');
const ASL = JSON.parse(JSON.stringify(SOCH));                                // asl soch (har baho shundan boshlanadi)
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]}, ALL = [...FR[1], ...FR[2], ...FR[3]];
const LAM = +arg('lam', 2), LF = +arg('lf', 1);                              // lf: sochimiz misol fonida (osmon/qor) -- kapyushon ham yopmaydi
async function baho(o) {
  const tam = JSON.parse(JSON.stringify(ASL));                             // asl + o (guruh bo'yicha)
  for (const g in o) tam[g] = {...(tam[g] || {}), ...o[g]};
  const r = await pg.evaluate(({o, fr}) => window.sochBaho12(o, fr), {o: tam, fr: ALL});
  const sh = {};
  for (const s of [1, 2, 3]) { const m = n => FR[s].reduce((a, f) => a + r[f][n], 0) / FR[s].length;
    sh[s] = {tiklash: m('tiklash'), teri: m('teriSochda'), yopish: m('yuzniYopish'), fon: m('fonda')}; }
  const F = [1, 2, 3].reduce((a, s) => a + (1 - sh[s].tiklash) + LAM * sh[s].yopish + LF * sh[s].fon, 0);
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + [1, 2, 3].map(s => `${s}: tiklash ${b.sh[s].tiklash.toFixed(3)} (teri ${b.sh[s].teri.toFixed(2)}) yuzni yopish ${b.sh[s].yopish.toFixed(3)} fonda ${b.sh[s].fon.toFixed(3)}`).join(' | ');
if (arg('baho', null)) {
  const C = JSON.parse(arg('baho'));
  for (const [nom, o] of Object.entries(C)) console.log(nom.padEnd(12), fmt(await baho(o)));
}
if (process.argv.includes('--moslash')) {
  const ITER = +arg('iter', 200);
  const PAR = JSON.parse(arg('par', '[["yuzyon.az0",20,70],["yuzyon.az1",40,110],["yuzyon.y0",-0.2,0.8],["yuzyon.y1",-1.5,-0.5],["yuzyon.off",0,0.3],["yuzyon.en",0.15,0.6],["yuzyon.dAz",-40,40],["yuzyon.osil",0,1],["yuzyon.shKUzoq",0,1],["qopqoq.th",0.55,0.85]]'));
  const QAT = JSON.parse(arg('qatiy', '{"yuzyon":{"n":5,"pk":1,"shK":0.1},"yaqin":{"n":0}}'));
  const B0 = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};
  const get = (n, obj) => { const [g, k] = n.split('.'); return obj[g] && obj[g][k]; };
  const x0 = PAR.map(([n, lo, hi]) => B0[n] !== undefined ? B0[n] : get(n, QAT) !== undefined ? get(n, QAT) : get(n, ASL) !== undefined ? get(n, ASL) : 0.5 * (lo + hi));
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.1 * (b - a));
  const oOl = x => { const o = JSON.parse(JSON.stringify(QAT)); PAR.forEach(([n], i) => { const [g, k] = n.split('.'); (o[g] = o[g] || {})[k] = x[i]; }); return o; };
  let n = 0, eng = null;
  const f = async x => { const b = await baho(oOl(x)); if (!eng || b.F < eng.b.F) { eng = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}  ${PAR.map(([nn], i) => nn.split('.')[1] + ' ' + x[i].toFixed(3)).join(' ')}`); } n++; return b.F; };
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
  const out = {baho: n, natija: eng.b, soch: oOl(eng.x)};
  writeFileSync(ROOT + arg('chiq', 'test/soch12_fit.json'), JSON.stringify(out, null, 1));
  console.log('YAKUN', fmt(eng.b), JSON.stringify(out.soch));
}
await br.close(); srv.close();
