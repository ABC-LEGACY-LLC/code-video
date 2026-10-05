/* KAMERA MASSHTABI (8-o'tish) -- shot kamerasining masofasi (d) va ekran siljishi (sx, sy): misolning figura massasi
   (yopilish xaritasi, test/misol_figura8.json) va ko'rinadigan boshi (test/misol_bosh7.json) bilan IoU; yuz nuqtalari
   (yaqin ko'z, iyak -- 5-o'tish sahna moslashidagi misol nishonlari) yumshoq: w * (xato / 5 px)^2. Kamera burchaklari
   (az, el, fov) va poza o'zgarmaydi -- faqat masshtab va kadrdagi o'rin.
   Sabab: foydalanuvchi "10 dan keyin kamera zoom ga o'xshab katta-kichik" -- figura maydoni misolda 0.431/0.509/0.578
   (uch shot), bizda 0.441/0.407/0.648: 2-shotda kichrayadi, 3-shotda kattalashadi (misolda ikkalasida o'sadi).
   node test/fit_kamera8.mjs --shot 1|2 [--w 0.25] [--iter 120] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 1), ITER = +arg('iter', 120), WF = +arg('w', 0.25);
const ROOT = new URL('..', import.meta.url).pathname;
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': extname(p) === '.js' ? 'text/javascript' : extname(p) === '.json' ? 'application/json' : 'text/html'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=320&h=180&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_bosh7.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json'))['shot' + (SHOT + 1)];
const FR = [[0, 3, 6, 8, 9, 10], [11, 12], [13, 15, 17, 19, 21]][SHOT];
/* misol yuz nishonlari (5-o'tish, test/sahna2_fit.mjs, sahna3_fit.mjs): 2-shot ko'z kiprik chizig'i markazi (138.5, 78.5),
   iyak uchi (157, 111); 3-shot ko'z (155.7, 112.0), iyak old-pasti (153, 154). 1-shot -- zondlar langari (99.4, 48.7). */
const YUZ = [{koz: [99.35, 48.7], iyak: null}, {koz: [138.5, 78.5], iyak: [157, 111]}, {koz: [155.7, 112.0], iyak: [153, 154]}][SHOT];
const K0 = JSON.parse(readFileSync(ROOT + 'test/kamera8_boshlangich.json', 'utf8'))[SHOT];
const PAR = [['d', K0.d * 0.7, K0.d * 1.3], ['sx', K0.ekran[0] - 0.12, K0.ekran[0] + 0.12], ['sy', K0.ekran[1] - 0.12, K0.ekran[1] + 0.12]];
const ob = x => { const o = {}; PAR.forEach(([n, a, b], i) => { o[n] = +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4); }); return o; };
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
let n = 0;
async function baho(x) {
  const o = ob(x), kam = {d: o.d, ekran: [o.sx, o.sy]};
  const r = await pg.evaluate(({kam, idx, fr}) => {
    window.__kamShot = {[idx]: kam};
    const b = window.kapBaho7({}, idx, fr);              // {} -- film.js dagi shot kapyushoni
    const yz = fr.map(f => { window.kadr(f); return window.yuzEkran(); });
    return {...b, yz};
  }, {kam, idx: SHOT, fr: FR}); n++;
  const iou = r.iou.reduce((a, v) => a + v, 0) / r.iou.length, fig = soft(r.B, FIG);
  let e2 = 0, m = 0;
  for (const p of r.yz) { e2 += (p.koz[0] - YUZ.koz[0]) ** 2 + (p.koz[1] - YUZ.koz[1]) ** 2; m++; if (YUZ.iyak) { e2 += (p.iyak[0] - YUZ.iyak[0]) ** 2 + (p.iyak[1] - YUZ.iyak[1]) ** 2; m++; } }
  const yuzRms = Math.sqrt(e2 / m);
  return {f: (1 - iou) + (1 - fig) + WF * (yuzRms / 5) ** 2, iou, fig, yuzRms, o, r};
}
const chiz = (s, b) => console.log('%s f %s | bosh IoU %s | figura %s | yuz RMS %s px | d %s ekran [%s, %s] | biz px %s misol %s', s, b.f.toFixed(4), b.iou.toFixed(3), b.fig.toFixed(3), b.yuzRms.toFixed(1), b.o.d, b.o.sx, b.o.sy, b.r.biz.join(','), b.r.misol.join(','));
const x0 = PAR.map(([nm, a, b]) => { const v = nm === 'd' ? K0.d : nm === 'sx' ? K0.ekran[0] : K0.ekran[1]; return (v - a) / (b - a); });
const b0 = await baho(x0); chiz('boshlang\'ich (shot ' + SHOT + '):', b0);
if (arg('skan', null)) {       // --skan 0.8,0.9,1.0,1.1 -- d nisbatlari, ekran o'zgarmas
  for (const k of arg('skan').split(',').map(Number)) { const x = x0.slice(); x[0] = (K0.d * k - PAR[0][1]) / (PAR[0][2] - PAR[0][1]); chiz('  d x' + k + ':', await baho(x)); }
  await br.close(); srv.close(); process.exit(0);
}
async function nm(z0, iter, q) {
  const N = z0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [z0.slice()]; for (let i = 0; i < N; i++) { const p = z0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -q : q))); P.push(p); }
  let F = []; for (const p of P) F.push(await baho(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a].f - F[b].f); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (k % 20 === 0) chiz('  ' + k + ' (baho ' + n + ')', F[0]);
    if (F[N].f - F[0].f < 1e-5) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await baho(xr);
    if (fr.f < F[0].f) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await baho(xe); if (fe.f < fr.f) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr.f < F[N - 1].f) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await baho(xc); if (fc.f < F[N].f) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await baho(P[i]); } }
  }
  return F[0];
}
const eng = await nm(x0, ITER, 0.15);
chiz('ENG YAXSHI (w ' + WF + '):', eng);
writeFileSync(ROOT + 'test/kamera8_fit_shot' + SHOT + '_w' + WF + '.json', JSON.stringify({shot: SHOT, w: WF, kamera: {d: eng.o.d, ekran: [eng.o.sx, eng.o.sy]}, iou: eng.iou, figura: eng.fig, yuzRms: eng.yuzRms, boshlangich: {iou: b0.iou, figura: b0.fig, yuzRms: b0.yuzRms, kamera: K0}}, null, 1));
await br.close(); srv.close();
