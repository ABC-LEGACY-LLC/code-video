/* KAMERA MOSLASH -- har shot kamerasi (ekran, masofa) va 3-shot pozasi misolning YUZ nuqtalariga moslanadi:
   yaqin ko'z va iyak (320x180). Yuz -- kompozitsiyaning tayanchi: yorug' massa (soch) bo'yicha moslashda yuz
   1-shotda 45 px o'ngda, 2-shotda 1.6 barobar katta edi (audit 2). Misol nuqtalari: 1-shot yaqin ko'z -- taqqos
   langar zondi (97.6, 46.3); qolganlari setka varag'idan o'qilgan (+-5 px): 1-shot iyak (120, 107); 2-shot ko'z
   (138, 77), iyak (150, 118); 3-shot 14-tasvir ko'z (172, 83), iyak (185, 125); 22-tasvir ko'z (158, 113), iyak (170, 150).
   Render yo'q: faqat proyeksiya (window.nuqtalar). node test/fit_kamera.mjs */
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

const KOZ = [-0.35, -0.17, 0.93], IYAK = [0, -1.10, 0.40];
const nm = (f, x0, qadam, iter = 400) => {           // oddiy Nelder-Mead (sinxron baho massivi uchun async emas -- pastda async)
};
async function nelder(f, x0, qadam, iter = 300) {
  const N = x0.length, P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] += qadam[i]; P.push(p); }
  let F = []; for (const p of P) F.push(await f(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = c.map((t, j) => t + (t - P[N][j])), fr = await f(xr);
    if (fr < F[0]) { const xe = c.map((t, j) => t + 2 * (t - P[N][j])), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = c.map((t, j) => t + 0.5 * (P[N][j] - t)), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j])); F[i] = await f(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
const kam = (az, el, fov, x) => ({az, el, d: x[2], fov, ekran: [x[0], x[1]], markaz: [0, 0, 0]});
const xato = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const natija = {};

// 1-shot: poza 0 (ushlangan 1..6)
const P1 = {egilish: -0.30, burilish: -0.15, yonga: 0, yumuq: 0};
let r = await nelder(async x => { const [k, c] = await pg.evaluate(({K, P, pts}) => window.nuqtalar(K, P, pts), {K: kam(55, -8, 27, x), P: P1, pts: [KOZ, IYAK]}); return xato(k, [97.6, 46.3]) + xato(c, [120, 107]); }, [0.40, 0.39, 7.0], [0.05, 0.05, 0.8]);
natija.shot1 = {ekran: [r.x[0], r.x[1]], d: r.x[2], xato_px: Math.sqrt(r.f / 2)};
// 2-shot: profilda iyak mosligi noaniq (bizning iyak ko'zdan 0.53 birlik orqada, misolda oldinda) -- masshtab ko'z-iyak
// tik masofasidan: misol 41 px, biz (d 6.0) 65 px -> d = 6.0 * 65 / 41; faqat ko'z o'rni moslanadi
const D2 = 6.0 * 65 / 41;
const P2 = {egilish: 0.02, burilish: 0.12, yonga: 0, yumuq: 1};
r = await nelder(async x => { const [k] = await pg.evaluate(({K, P, pts}) => window.nuqtalar(K, P, pts), {K: kam(84, -4, 27, [x[0], x[1], D2]), P: P2, pts: [KOZ]}); return xato(k, [138, 77]); }, [0.42, 0.43], [0.05, 0.05]);
natija.shot2 = {ekran: [r.x[0], r.x[1]], d: D2, xato_px: Math.sqrt(r.f)};
// 3-shot: masshtab ko'z-iyak 42 px (14-tasvir), biz (d 6.8) 50 px -> d = 6.8 * 50 / 42; egilish kichik (0.15 -> 0.30);
// ko'z 14 -> 22 da (-14, +30) px -- bosh ORQAGA va pastga cho'kadi: chokish c, orqaga o moslanadi
const D3 = 6.8 * 50 / 42;
r = await nelder(async x => {
  let e = 0;
  for (const [i, tk] of [[0, [172, 83]], [8, [158, 113]]]) {
    const s = Math.pow(i / 8, 0.55);
    const P3 = {egilish: 0.15 + 0.15 * s, burilish: 0.10, yonga: 0, yumuq: 0.5, chokish: -x[2] * s, orqaga: x[3] * s};
    const [k] = await pg.evaluate(({K, P, pts}) => window.nuqtalar(K, P, pts), {K: kam(80, -5, 29, [x[0], x[1], D3]), P: P3, pts: [KOZ]});
    e += xato(k, tk);
  }
  return e + 100 * (Math.max(0, -x[2]) + Math.max(0, x[2] - 1.2) + Math.max(0, -x[3] - 0.2) + Math.max(0, x[3] - 1.0));
}, [0.46, 0.54, 0.6, 0.3], [0.05, 0.05, 0.2, 0.2]);
natija.shot3 = {ekran: [r.x[0], r.x[1]], d: D3, egilish: '0.15 + 0.15 s', chokishC: r.x[2], orqagaO: r.x[3], xato_px: Math.sqrt(r.f / 2)};
console.log(JSON.stringify(natija, null, 1));
writeFileSync(ROOT + 'test/kamera_fit.json', JSON.stringify(natija, null, 1));
await br.close(); srv.close();
