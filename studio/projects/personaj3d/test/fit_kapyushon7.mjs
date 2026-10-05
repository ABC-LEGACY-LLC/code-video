/* KAPYUSHON MOSLASH (7-o'tish) -- SHOT bo'yicha (kapyushon mato: boshda sirg'anadi; shot ichida o'zgarmas). Maqsad:
   misolning KO'RINADIGAN BOSHI (yuz + soch; test/audit_misol/bosh_niqob.py -> test/misol_bosh7.json) bilan bizning rol
   renderidagi ko'rinadigan boshimiz (teri, soch, qopqoq, bo'yin, astar) IoU si -- har tasvir; 1- va 3-shotda figura
   bloklari (yopilish xaritasi, test/misol_figura.json) yumshoq IoU si 0.5 og'irlik bilan VA shart: figura FIG0 - 0.003
   dan tushsa 4x jarima (--fig0: topshirilgan daraja 0.914 / 0.857; birinchi yurishda shartsiz figura 0.784 ga tushgan).
   Parametrlar (PAR; --par a,b -- faqat shular moslanadi, qolgani --bosh dagi qiymatda): teshik (ochiq, ochV0, ochV1,
   ikki qirra ochA/ochB), toj (surZ, surY), yuqori qism (butunZ, butunY, bur -- burilish, eg -- egilish), r0, soyabon,
   uchY, gumbaz, astar tasmasi (tasmaA/B, tasmaAlt/Blt, tasmaV). Har yangi parametr varaqda ko'rilgan aniq xato uchun
   qo'shilgan (README 7-o'tish). Nelder-Mead [0,1] da + qayta boshlash. Natija: test/kapyushon7_fit_shotN<--qoshimcha>.json.
   Yakuniy: shot0 _4, shot1 _3, shot2 _3 (+ tasmaV skanerlash --faqat-baho --sinov bilan) -> src/film.js.
   node test/fit_kapyushon7.mjs --shot 0|1|2 [--iter 200] [--qayta 2] [--par ...] [--bosh '{...}'] [--fig0 x]
        [--qoshimcha _N] [--faqat-baho 1 --sinov '[{...}]'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 0), ITER = +arg('iter', 200), QAYTA = +arg('qayta', 2), FAQAT = +arg('faqat-baho', 0);
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_bosh7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json'));     // 8-o'tish: 2-shot xaritasi ham (k12-13)
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]][SHOT], FIGT = [FIG.shot1, FIG.shot2, FIG.shot3][SHOT];
const PAR = [['ochiq', 0.7, 2.6], ['ochV0', -0.25, 0.30], ['ochV1', 0.10, 0.60], ['surZ', -1.2, 1.2], ['surY', -0.8, 0.8],
             ['butunZ', -0.8, 0.8], ['butunY', -0.9, 0.6], ['r0', 1.12, 1.6], ['bur', -0.8, 0.8], ['soyabon', 0, 1.0],
             ['eg', -0.4, 1.0], ['uchY', 0.5, 2.2], ['gumbaz', 0.1, 1.2], ['ochA', 0.5, 2.0], ['ochB', 0.5, 2.0],
             ['tasmaA', 0.5, 7.0], ['tasmaB', 0.5, 7.0], ['tasmaAlt', 0, 1.5], ['tasmaBlt', 0, 1.5], ['tasmaV', 0.40, 0.90],
             ['kfIch', 0.0, 1.2]];
const obyekt = x => { const o = {}; PAR.forEach(([n, a, b], i) => { o[n] = +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4); }); return o; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
let X0 = null, n = 0, FIG0 = null;
async function baho(x) {
  const o = obyekt(x), r = await pg.evaluate(({o, idx, fr}) => window.kapBaho7(o, idx, fr), {o, idx: SHOT, fr: FR}); n++;
  const iou = r.iou.reduce((a, v) => a + v, 0) / r.iou.length, fig = FIGT ? soft(r.B, FIGT) : null;
  const reg = 0.01 * x.reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  /* figura (silueta) boshlang'ich darajadan (topshirilgan) pastga tushmasin: birinchi yurishda 0.5 og'irlik yetmadi --
     3-shotda bosh IoU 0.24 -> 0.56 uchun figura 0.857 -> 0.784 (kapyushon tepasi oldinga surilib, chap-tepa burchak
     bo'shab qoldi) */
  const jarima = fig !== null && FIG0 !== null ? 4 * Math.max(0, FIG0 - 0.003 - fig) : 0;
  return {f: 1 - iou + (fig !== null ? 0.5 * (1 - fig) : 0) + jarima + reg, iou, fig, r, o};
}
const chiz = (s, b) => console.log('%s f %s | bosh IoU %s [%s] | figura %s | biz px %s misol %s', s, b.f.toFixed(4), b.iou.toFixed(3), b.r.iou.map(v => v.toFixed(2)).join(' '), b.fig === null ? '-' : b.fig.toFixed(3), b.r.biz.join(','), b.r.misol.join(','));
const joriy = await pg.evaluate(idx => { const K = JSON.parse(JSON.stringify(window.__kiyimJoriy().kap)); return K; }, SHOT);
const film = await pg.evaluate(idx => (window.__filmShotKap || null), SHOT);
const bosh0 = JSON.parse(arg('bosh', 'null')) || {};
const x0 = PAR.map(([nm, a, b]) => { const v = bosh0[nm] !== undefined ? bosh0[nm] : (joriy[nm] || 0); return Math.min(1, Math.max(0, (v - a) / (b - a))); }); X0 = x0.slice();
let b0 = await baho(x0); FIG0 = arg('fig0', null) !== null ? +arg('fig0', 0) : b0.fig;
b0 = await baho(x0); chiz('boshlang\'ich (shot ' + SHOT + '):', b0); console.log('FIG0', FIG0);     // jarima bilan qayta
if (FAQAT) {
  for (const v of JSON.parse(arg('sinov', '[]'))) { const x = x0.slice(); for (const [k, val] of Object.entries(v)) { const i = PAR.findIndex(p => p[0] === k); x[i] = (val - PAR[i][1]) / (PAR[i][2] - PAR[i][1]); } chiz(JSON.stringify(v), await baho(x)); }
  await br.close(); srv.close(); process.exit(0);
}
/* --par a,b,c -- faqat shu parametrlar moslanadi (qolganlari boshlang'ich qiymatda); simpleks faqat ular bo'yicha */
const SEL = arg('par', null) ? arg('par').split(',').map(k => { const i = PAR.findIndex(p => p[0] === k); if (i < 0) throw new Error('par yo\'q: ' + k); return i; }) : PAR.map((p, i) => i);
console.log('moslanadigan:', SEL.map(i => PAR[i][0]).join(','));
const toliq = z => { const x = X0.slice(); SEL.forEach((i, k) => { x[i] = z[k]; }); return x; };
const bahoZ = z => baho(toliq(z));
async function nm(z0, iter, qadam) {
  const N = z0.length, P = [z0.slice()];
  for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = []; for (const p of P) F.push(await bahoZ(p));
  for (let k = 0; k < iter; k++) {
    const idx = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); const Ps = idx.map(i => P[i]), Fs = idx.map(i => F[i]); P.splice(0, P.length, ...Ps); F = Fs;
    if (k % 25 === 0) chiz('  ' + k + ' (baho ' + n + ')', F[0]);
    if (F[N].f - F[0].f < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const cl = v => v.map(t => Math.min(1, Math.max(0, t)));
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))); const fr = await bahoZ(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))); const fe = await bahoZ(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))); const fc = await bahoZ(xc);
      if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else { for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await bahoZ(P[i]); } } }
  }
  const i0 = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f)[0]; return {x: toliq(P[i0]), z: P[i0], r: F[i0]};
}
let eng = {x: x0, r: b0}; let rnd = 4242; const R = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
for (let q = 0; q < QAYTA; q++) {
  const zEng = SEL.map(i => eng.x[i]);
  const bosh = q === 0 ? zEng : zEng.map(t => Math.min(1, Math.max(0, t + (R() - 0.5) * 0.3)));
  const r = await nm(bosh, ITER, q === 0 ? 0.2 : 0.1); chiz('qayta ' + q + ':', r.r); if (r.r.f < eng.r.f) eng = r;
}
const fayl = ROOT + 'test/kapyushon7_fit_shot' + SHOT + arg('qoshimcha', '') + '.json', J = {};
J['shot' + SHOT] = {kap: eng.r.o, f: eng.r.f, iou: eng.r.iou, iou_tasvir: eng.r.r.iou, figura: eng.r.fig, boshlangich: {f: b0.f, iou: b0.iou, figura: b0.fig, kap: b0.o}, baholar: n};
writeFileSync(fayl, JSON.stringify(J, null, 1)); chiz('ENG YAXSHI:', eng.r); console.log(JSON.stringify(eng.r.o));
await br.close(); srv.close();
