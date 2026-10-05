/* 2- VA 3-SHOT: POZA + KAMERA -- RENDER BAHOSI (11-o'tish, 2-ish). test/fit_poza11.mjs yuzni (inson belgilari) node da
   moslaydi; bu yerda xuddi shu qiymatlar RENDERDA baholanadi: ko'rinadigan bosh IoU (test/misol_bosh7.json, kadr bo'yicha)
   va figura massasi (test/misol_figura8.json, 32x18 yumshoq niqob) -- 8/9-o'tishda kamera masofasi shularga moslangan edi.
   Yuz (node) va massa (render) birga: --moslash rejimida Nelder-Mead (sekin: har baho ~11 render).
   node test/fit_poza11b.mjs --baho '{"nom":{"kam":{"1":{"d":7.4}},"poza":{"1":{"dBur":-0.5}}}, ...}'
   node test/fit_poza11b.mjs --moslash 2 [--iter 80] [--yuzV 1] [--boshla '{...}']       (MAXFIY nishonlar: misoldan)  */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {spawnSync} from 'child_process';
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
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_bosh7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const FR = {1: [11, 12], 2: [13, 15, 17, 19, 21]};                 // 0 dan: 2-shot 12-13, 3-shot 14,16,18,20,22
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
async function render(cfg, shots = [1, 2]) {
  await pg.evaluate(p => { window.__pozaShot = p; }, cfg.poza || null);
  const fr = shots.flatMap(s => FR[s]);
  const r = await pg.evaluate(({kam, fr}) => window.kapBaho9(null, kam, fr), {kam: cfg.kam || null, fr});
  const out = {};
  for (const s of shots) out[s + 1] = {bosh: +(FR[s].reduce((a, f) => a + r.iou[f], 0) / FR[s].length).toFixed(3),
    nisbat: +(FR[s].reduce((a, f) => a + r.biz[f] / Math.max(1, r.misol[f]), 0) / FR[s].length).toFixed(2), figura: +soft(r.B[s], FIGT[s]).toFixed(3)};
  return out;
}
/* yuz bahosi -- node (test/fit_poza11.mjs --bir): kamera/poza qo'shimchasi bilan RMS px */
function yuz(shot, x) {
  const r = spawnSync('node', [ROOT + 'test/fit_poza11.mjs', '--bir', JSON.stringify({shot, x})], {encoding: 'utf8'});
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { console.error(r.stderr); return null; }
}
if (arg('baho', null)) {
  const C = JSON.parse(arg('baho'));
  for (const [nom, cfg] of Object.entries(C)) console.log(nom, JSON.stringify(await render(cfg)));
}
if (arg('moslash', null)) {
  /* BIRGALIKDA: poza + kamera (d, ekran, az, el) + shu shot kapyushon kaliti (joylashuv, kalit pozasi yangi pozaga ergashadi).
     Maqsad: yuz RMS/3 + 8 (1 - bosh IoU) + 3 (1 - figura) + kamera burchagi jarimasi + 1-shot 10-11 qo'riqchisi (2-shot kaliti
     1-shot oxirgi pozalariga eng yaqin -- 10-o'tishda 10 -> 11 masshtab sakrashi shundan qaytgan edi) */
  const S = +arg('moslash'), si = S - 1, ITER = +arg('iter', 300);
  const {KIYIM} = await import('../src/personaj.js');
  const {yuzBaho} = await import('./yuz11.mjs');
  const {FILMLAR} = await import('../src/film.js');
  const sh = FILMLAR.misol22.shotlar[si], kam0 = sh.kamera;
  const DEF = [['ochiq', 0.5, 2.6], ['ochV0', -0.25, 0.30], ['ochV1', 0.10, 0.70], ['surZ', -1.2, 1.2], ['surY', -0.8, 0.9], ['butunZ', -0.8, 0.8],
               ['butunY', -0.9, 0.6], ['bur', -0.8, 0.8], ['eg', -0.4, 1.0], ['ochA', 0.5, 2.0], ['ochB', 0.5, 2.0], ['tasmaA', 0.5, 7.0],
               ['tasmaB', 0.5, 7.0], ['tasmaAlt', 0, 1.5], ['tasmaBlt', 0, 1.5], ['tasmaV', 0.40, 0.90]];
  const KP = [['dEg', -0.6, 0.6, 0.04], ['dBur', -0.8, 0.8, 0.05], ['dYon', -0.4, 0.4, 0.03], ['dD', -4, 3, 0.3], ['dSx', -0.15, 0.15, 0.01],
              ['dSy', -0.15, 0.15, 0.01], ['dAz', -25, 25, 3], ['dEl', -25, 25, 3]];
  const kalit0 = KIYIM.kapPoza.kalit.map(k => ({p: k.p.slice(), d: {...k.d}}));
  const p0 = kalit0[si].p.slice();
  const BL = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};
  const x0 = [...KP.map(([n]) => BL[n] || 0), ...DEF.map(([n]) => (BL.kalit && BL.kalit[n] !== undefined) ? BL.kalit[n] : kalit0[si].d[n])];
  const lo = [...KP.map(t => t[1]), ...DEF.map(t => t[1])], hi = [...KP.map(t => t[2]), ...DEF.map(t => t[2])];
  const q = [...KP.map(t => t[3]), ...DEF.map(([, a, b]) => 0.08 * (b - a))];
  const cfgOl = x => {
    const v = Object.fromEntries(KP.map(([n], i) => [n, x[i]])), d = Object.fromEntries(DEF.map(([n], i) => [n, x[KP.length + i]]));
    const kalit = kalit0.map((k, i) => i === si ? {p: [p0[0] + v.dEg, p0[1] + v.dBur], d} : k);
    return {v, kiyim: {kap: {...KIYIM.kap}, kapPoza: {sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB, kalit}},
            kam: {[si]: {az: kam0.az + v.dAz, el: kam0.el + v.dEl, d: kam0.d + v.dD, ekran: [kam0.ekran[0] + v.dSx, kam0.ekran[1] + v.dSy]}},
            poza: {[si]: {dEg: v.dEg, dBur: v.dBur, dYon: v.dYon}}};
  };
  const QOR = S === 2 ? [9, 10] : [];                       // 1-shot 10-11 (0 dan 9, 10)
  async function baholash(x) {
    const c = cfgOl(x), fr = [...QOR, ...FR[si]];
    await pg.evaluate(p => { window.__pozaShot = p; }, c.poza);
    const r = await pg.evaluate(({k, kam, fr}) => window.kapBaho9(k, kam, fr), {k: c.kiyim, kam: c.kam, fr});
    const bosh = FR[si].reduce((a, f) => a + r.iou[f], 0) / FR[si].length, fig = soft(r.B[si], FIGT[si]);
    const nis = FR[si].reduce((a, f) => a + r.biz[f] / Math.max(1, r.misol[f]), 0) / FR[si].length;
    const q1 = QOR.map(f => r.iou[f]), f1 = QOR.length ? soft(r.B[0], FIGT[0]) : 0;
    const yz = yuzBaho(S, c.v);
    return {yz, bosh, fig, nis, q1, f1, c};
  }
  const b0 = await baholash(x0.map((t, i) => i < KP.length ? 0 : kalit0[si].d[DEF[i - KP.length][0]]));
  console.log(`BOSHLANG'ICH (hozirgi): yuz ${b0.yz.toFixed(2)} px | bosh IoU ${b0.bosh.toFixed(3)} (nisbat ${b0.nis.toFixed(2)}) | figura ${b0.fig.toFixed(3)} | 1-shot 10-11 bosh ${b0.q1.map(v => v.toFixed(3))} figura ${b0.f1.toFixed(3)}`);
  let n = 0, eng = null;
  const f = async x => {
    const b = await baholash(x), v = b.c.v;
    const qor = QOR.length ? 20 * b.q1.reduce((a, t, i) => a + Math.max(0, b0.q1[i] - t - 0.005), 0) + 20 * Math.max(0, b0.f1 - b.f1 - 0.005) : 0;
    const F = b.yz / 3 + 8 * (1 - b.bosh) + 3 * (1 - b.fig) + 0.5 * ((v.dAz / 15) ** 2 + (v.dEl / 15) ** 2) + qor;
    if (!eng || F < eng.F) { eng = {F, b, x: x.slice()};
      console.log(`  ${n}: F ${F.toFixed(3)} | yuz ${b.yz.toFixed(2)} | bosh ${b.bosh.toFixed(3)} (${b.nis.toFixed(2)}) | figura ${b.fig.toFixed(3)} | qor ${qor.toFixed(3)} | ${KP.map(([nn], i) => nn + ' ' + x[i].toFixed(3)).join(' ')}`); }
    n++; return F;
  };
  /* async Nelder-Mead */
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, turg = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-4) { best = Fv[0]; turg = 0; } else if (++turg > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const c = eng.b.c;
  const out = {shot: S, baho: n, boshlangich: {yuz: b0.yz, bosh: b0.bosh, nisbat: b0.nis, figura: b0.fig, q1: b0.q1, f1: b0.f1},
               natija: {F: eng.F, yuz: eng.b.yz, bosh: eng.b.bosh, nisbat: eng.b.nis, figura: eng.b.fig, q1: eng.b.q1, f1: eng.b.f1},
               x: Object.fromEntries(KP.map(([nn], i) => [nn, +eng.x[i].toFixed(4)])), kalit: {p: c.kiyim.kapPoza.kalit[si].p.map(v => +v.toFixed(4)),
               d: Object.fromEntries(Object.entries(c.kiyim.kapPoza.kalit[si].d).map(([k, v]) => [k, +v.toFixed(4)]))}, kamera: c.kam[si]};
  { const ch = arg('chiq', `test/poza11b_shot${S}.json`); writeFileSync(ch.startsWith('/') ? ch : ROOT + ch, JSON.stringify(out, null, 1)); }
  console.log('YAKUN', JSON.stringify(out.natija), JSON.stringify(out.x));
}
await br.close(); srv.close();
