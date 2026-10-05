/* KAPYUSHON -- BITTA KENG KIYIM, UCH SHOTGA BIRGA (12-o'tish, tuzilish). Alonur: "sonlarni to'g'irlamoqdasan, original 3D
   modelni misolga emas". 11-o'tishgacha kapyushon teshigi yuzga yopishgan qobiq edi (misolda keng: qirra soch orqasida, soch va
   mato orasida qorong'i ich ko'rinadi), astar tasmasi keng (misolning soyadagi sochi o'rnida) va har shot pozasiga alohida kalit
   (kapPoza). Bu yerda: kalitlar yo'q (bitta shakl, boshga faqat KF ulushida ergashadi), astar ingichka (tasma 1), sinflar
   alohida (window.kapBaho12: bosh -- teri+soch; ich; figura). Nishon MAXFIY: test/qism/inson/qism_nishon_12.json.
   node test/fit_kap12.mjs --baho '{"nom": {...kiyim...}}'
   node test/fit_kap12.mjs --moslash [--iter 300] [--boshla '{...kap...}'] [--chiq test/kap12_fit.json] */
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
const {KIYIM} = await import('../src/personaj.js');
const FR = {1: [0, 4, 8, 9, 10], 2: [11, 12], 3: [13, 15, 17, 19, 21]};
const ALL = [...FR[1], ...FR[2], ...FR[3]];
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const VZ = {bosh: +arg('wb', 4), ich: +arg('wi', 2), figura: +arg('wf', 3), astar: +arg('wa', 1)};
async function baho(kiyim) {
  const r = await pg.evaluate(({k, fr}) => window.kapBaho12(k, null, fr), {k: kiyim, fr: ALL});
  const sh = {};
  for (const s of [1, 2, 3]) { const m = n => FR[s].reduce((a, f) => a + r[f][n], 0) / FR[s].length;
    sh[s] = {bosh: m('bosh'), ich: m('ich'), figura: soft(r.B[s - 1], FIGT[s - 1]), astar: m('astar'), nisbat: m('boshNisbat')}; }
  const F = [1, 2, 3].reduce((a, s) => a + VZ.bosh * (1 - sh[s].bosh) + VZ.ich * (1 - sh[s].ich) + VZ.figura * (1 - sh[s].figura) + VZ.astar * sh[s].astar / 1000, 0);
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + [1, 2, 3].map(s => `${s}: bosh ${b.sh[s].bosh.toFixed(3)} (${b.sh[s].nisbat.toFixed(2)}) ich ${b.sh[s].ich.toFixed(3)} fig ${b.sh[s].figura.toFixed(3)} astar ${Math.round(b.sh[s].astar)}`).join(' | ');
/* kalitsiz, ingichka astar -- tuzilish; qolgani KIYIM.kap (yoki berilgan) */
const TUZ = {tasmaA: 1, tasmaB: 1, tasmaAlt: 1, tasmaBlt: 1};
const kiyimOl = kap => ({kap: {...KIYIM.kap, ...TUZ, ...kap}, kapPoza: {sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB, kalit: []}});
if (arg('baho', null)) {
  const C = JSON.parse(arg('baho'));
  for (const [nom, k] of Object.entries(C)) {
    const kiyim = k === 'joriy' ? {kap: {...KIYIM.kap}, kapPoza: {sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB, kalit: KIYIM.kapPoza.kalit}} : kiyimOl(k);
    console.log(nom.padEnd(12), fmt(await baho(kiyim)));
  }
}
if (process.argv.includes('--moslash')) {
  const ITER = +arg('iter', 300);
  const PAR = [['ochiq', 0.8, 2.6], ['ochV0', -0.25, 0.30], ['ochV1', 0.10, 0.70], ['yopiq', 0.3, 1.0], ['r0', 1.2, 1.7], ['soyabon', 0, 1.0],
               ['yTepa', 1.5, 2.7], ['gumbaz', 0.2, 1.1], ['uchY', 0.3, 2.2], ['uchZ', 0.3, 2.2], ['orqa', 0.8, 3.2], ['kengX', 0.9, 1.5],
               ['surZ', -0.6, 1.2], ['surY', -0.6, 0.9], ['butunZ', -0.8, 0.8], ['butunY', -0.9, 0.6], ['bur', -0.5, 0.5], ['eg', -0.4, 1.0],
               ['rYelka', 0, 0.8], ['rOrta', -0.3, 0.5], ['ochA', 0.6, 1.6], ['ochB', 0.6, 1.6], ['kf', 0.2, 1.0], ['kt', 0.5, 1.0]];
  const STD = {kf: 0.35, kt: 0.8};
  const B0 = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};
  const x0 = PAR.map(([n]) => B0[n] !== undefined ? B0[n] : KIYIM.kap[n] !== undefined ? KIYIM.kap[n] : STD[n]);
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.08 * (b - a));
  const kapOl = x => Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
  let n = 0, eng = null;
  const f = async x => { const b = await baho(kiyimOl(kapOl(x))); if (!eng || b.F < eng.b.F) { eng = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}`); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, turg = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; turg = 0; } else if (++turg > 50) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const out = {baho: n, natija: eng.b, kap: Object.fromEntries(Object.entries(kapOl(eng.x)).map(([k, v]) => [k, +v.toFixed(4)]))};
  writeFileSync(ROOT + arg('chiq', 'test/kap12_fit.json'), JSON.stringify(out, null, 1));
  console.log('YAKUN', fmt(eng.b), JSON.stringify(out.kap));
}
await br.close(); srv.close();
