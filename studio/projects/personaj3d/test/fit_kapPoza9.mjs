/* KAPYUSHON -- POZA FAZOSIDAGI TUZATUVCHI SHAKLLAR, UCH SHOTGA BIRGALIKDA (9-o'tish, 2c). Bitta qattiq kapyushon (fit_kap9)
   massani uchala shotda berdi (figura 0.93/0.87/0.88), lekin 2-shotda yuzni yopdi (ko'rinadigan bosh 0.13). Endi: mato
   o'lchami BITTA (kap: r0, soyabon, gumbaz, uchY, rYelka, orqa; tau -- ergashish inersiyasi), joylashuvi (teshik, toj va
   yuqori qism siljishi/burilishi, astar tasmasi) boshning pozasidan -- uch kalit poza (1-shot tinch, 2-shot, 3-shot tinch)
   orasida Gauss aralashmasi (personaj.js kapDeform). Bloklar navbat bilan (Nelder-Mead): k0, k1 (+2-shot kamerasi, yuz
   bilan bog'langan), k2, umumiy o'lcham; maqsad fit_kap9 dagi (bosh IoU -- ekranda turish vaqti, figura -- shotlar teng).
   node test/fit_kapPoza9.mjs [--iter 120] [--aylana 2] [--bloklar k0,k1,k2,kap] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {BOSH, boshShakli, KIYIM} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 120), AYLANA = +arg('aylana', 2), ROOT = new URL('..', import.meta.url).pathname;
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
/* holat: kap (umumiy o'lcham), kalitlar (joylashuv), 2-shot kamerasi */
const DEF = [['ochiq', 0.5, 2.6], ['ochV0', -0.25, 0.30], ['ochV1', 0.10, 0.70], ['surZ', -1.2, 1.2], ['surY', -0.8, 0.9], ['butunZ', -0.8, 0.8],
             ['butunY', -0.9, 0.6], ['bur', -0.8, 0.8], ['eg', -0.4, 1.0], ['ochA', 0.5, 2.0], ['ochB', 0.5, 2.0], ['tasmaA', 0.5, 7.0],
             ['tasmaB', 0.5, 7.0], ['tasmaAlt', 0, 1.5], ['tasmaBlt', 0, 1.5], ['tasmaV', 0.40, 0.90]];
const UMUM = [['r0', 1.05, 1.6], ['soyabon', 0, 1.0], ['gumbaz', 0.1, 1.2], ['uchY', 0.5, 2.2], ['rYelka', 0.1, 0.6], ['orqa', 1.0, 3.0], ['tau', 0.0, 0.4]];
const KAM = [['d2', 9.0, 14.0], ['sx2', 0.34, 0.50], ['sy2', 0.36, 0.52]];
const H0 = {kap: Object.fromEntries(UMUM.map(([n]) => [n, KIYIM.kap[n]])), kalit: KIYIM.kapPoza.kalit.map(k => ({p: k.p, d: {...k.d}})),
            kam: {d2: 10.868, sx2: 0.3871, sy2: 0.4164}, sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB};
const kiyim = h => ({kap: h.kap, kapPoza: {sigmaE: h.sigmaE, sigmaB: h.sigmaB, kalit: h.kalit}});
let n = 0;
async function baho(h) {
  const r = await pg.evaluate(({k, kam, fr}) => window.kapBaho9(k, kam, fr), {k: kiyim(h), kam: {1: {d: h.kam.d2, ekran: [h.kam.sx2, h.kam.sy2]}}, fr: FRALL}); n++;
  const sh = FR.map((fr, s) => ({iou: fr.reduce((a, f) => a + r.iou[f], 0) / fr.length, fig: soft(r.B[s], FIGT[s]), nisbat: fr.reduce((a, f) => a + r.biz[f] / Math.max(1, r.misol[f]), 0) / fr.length}));
  const yz = yuz2(h.kam.d2, h.kam.sx2, h.kam.sy2), VK = arg('vazn', 'kadr') === 'teng' ? [1 / 3, 1 / 3, 1 / 3] : [11 / 22, 2 / 22, 9 / 22];
  const f = sh.reduce((a, s, i) => a + VK[i] * (1 - s.iou) + 0.5 * (1 - s.fig) / 3, 0) + 0.01 * Math.max(0, yz - 1.5) ** 2;
  return {f, sh, yz};
}
const chiz = (s, b) => console.log('%s f %s | bosh IoU %s (nisbat %s) | figura %s | yuz2 %s', s, b.f.toFixed(4), b.sh.map(t => t.iou.toFixed(3)).join('/'), b.sh.map(t => t.nisbat.toFixed(2)).join('/'), b.sh.map(t => t.fig.toFixed(3)).join('/'), b.yz.toFixed(2));
/* blok: parametrlar ro'yxati [yo'l, a, b] -> holatga yozish/o'qish */
const BLOK = {
  k0: DEF.map(([nm, a, b]) => [['kalit', 0, nm], a, b]), k1: [...DEF.map(([nm, a, b]) => [['kalit', 1, nm], a, b]), ...KAM.map(([nm, a, b]) => [['kam', nm], a, b])],
  k2: DEF.map(([nm, a, b]) => [['kalit', 2, nm], a, b]), kap: UMUM.map(([nm, a, b]) => [['kap', nm], a, b]),
};
const ol = (h, y) => y[0] === 'kalit' ? h.kalit[y[1]].d[y[2]] : h[y[0]][y[1]];
const yoz = (h, y, v) => { if (y[0] === 'kalit') h.kalit[y[1]].d[y[2]] = v; else h[y[0]][y[1]] = v; };
async function blokNM(h, blok, iter, qadam) {
  const B = BLOK[blok], N = B.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  const z0 = B.map(([y, a, b]) => Math.min(1, Math.max(0, ((ol(h, y) ?? a) - a) / (b - a))));
  const qur = z => { const g = JSON.parse(JSON.stringify(h)); B.forEach(([y, a, b], i) => yoz(g, y, +(a + z[i] * (b - a)).toFixed(4))); return g; };
  const f = async z => (await baho(qur(z))).f;
  let P = [z0.slice()]; for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = []; for (const p of P) F.push(await f(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
  }
  const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]);
  return qur(P[o[0]]);
}
let h = arg('bosh', null) ? JSON.parse(readFileSync(arg('bosh'))).h : JSON.parse(JSON.stringify(H0));     // --bosh F.json -- saqlangan holatdan
if (arg('sigma', null)) { h.sigmaE = h.sigmaB = +arg('sigma'); }
if (arg('sigmaE', null)) h.sigmaE = +arg('sigmaE');
if (arg('sigmaB', null)) h.sigmaB = +arg('sigmaB');
chiz('boshlang\'ich (7-8-o\'tish joylashuvlari, bitta o\'lcham):', await baho(h));
const BLOKLAR = arg('bloklar', 'k0,k1,k2,kap').split(',');
for (let a = 0; a < AYLANA; a++) for (const bl of BLOKLAR) {
  h = await blokNM(h, bl, ITER, a ? 0.06 : 0.12);
  const b = await baho(h); chiz(`aylana ${a + 1} blok ${bl} (baho ${n}):`, b);
  writeFileSync(ROOT + 'test/kapPoza9_fit' + arg('chiq', '') + '.json', JSON.stringify({h, f: b.f, sh: b.sh, yz: b.yz, aylana: a, blok: bl}, null, 1));
}
console.log('NATIJA', JSON.stringify(h));
await br.close(); srv.close();
