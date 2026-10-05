/* YUZ MOSLASH (3-urinish, bosh v3) -- bosh profili (BOSH) va yuz chizmasi o'rinlari (YUZ) misolning 1-shot o'lchovlariga
   moslanadi; 2-shot (profil) past vaznda, uning kamerasi va pozasi erkin (chegaralarda). Render yo'q: node da bosh
   sirti nuqtalari (personaj.js dagi o'sha boshShakli) va o'sha proyeksiya (test/proyeksiya.mjs, sahifa bilan 0.00 px).
   Fit, not trace: shakl -- o'z parametrli profilimiz; o'lchanadi faqat nuqta va silueta chetlari.
   Misol (320x180; 3-tasvir, 1-shot ushlangan; taqqos zond, misol qiymatlari):
     langar (yaqin ko'z) (97.6, 46.3); uzoq ko'z (120.3, 49.3); og'iz o'rtasi (125.5, 84.5) -- lab soyasi ustida;
     burun uchi (130.5, 60) -- uzoq ko'z ostidan old konturga tushadigan rim yoyi uchi;
     old kontur (silueta, qator y -> x): y 60 -> 130.5, 66.3 -> 131.2, 76.3 -> 132.5, 98.3 -> 130.4
       (misolda kontur ustida 1..2 px rim chizig'i bor -- chet L<50 da o'lchanadi);
     uzoq kontur ko'z darajasida: y 50 -> 124;
     jag' osti (ustun x -> eng pastki y): 105.6 -> 107.6, 117.6 -> 109.5, 125.6 -> 109.6.
   12-tasvir (profil): yaqin ko'z (137, 77.5), burun uchi (163.5, 92), og'iz kesigi (161, 102), iyak burchagi (156, 112),
     jag' osti y 113.5 (x 146..152), old kontur y 106 -> 159.5.
   node test/fit_yuz3.mjs [--iter 3000] [--v2 0.4]  ->  test/yuz_fit3.json */
import {BOSH, YUZ, yuzNuqta, burunNuqta, iyakNuqta, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {writeFileSync} from 'fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const ITER = arg('iter', 3000), V2 = arg('v2', 0.4), V9 = arg('v9', 0);   // v9: 9-tasvir vazni (poza tuzatilgandan keyin)
const B0 = {...BOSH}, Y0 = {...YUZ};
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]}, P1 = {egilish: -0.30, burilish: -0.15};
const M1 = {yaqin: [97.6, 46.3], uzoq: [120.3, 49.3], ogiz: [125.5, 84.5], burun: [130.5, 60]};
/* 2-urinish: old kontur har 3 qatorda (misol yuz niqobi L>=50, median 3, eng o'ng x) -- 3- va 9-tasvir; 9-tasvir
   (burilish 0.76 ulushda) qo'shildi: 1-urinish natijasida burun 9-tasvirda 3 px ortiq chiqib, ostida 4 px kemtik bor edi */
const OLD1 = [[58, 127], [61, 130], [64, 130], [67, 130], [70, 130], [73, 130], [76, 131], [79, 131], [82, 130], [85, 129], [88, 130], [91, 129], [94, 129], [97, 129], [100, 129], [103, 129], [106, 129]], UZOQ1 = [[50, 124]];
const JAG1 = [[105.6, 107.6], [117.6, 109.5], [125.6, 109.6]];
const P9 = {egilish: arg('eg9', -0.30 - 0.05 * 0.76), burilish: arg('bur9', -0.15 + 0.47 * 0.76)};
const M9 = {yaqin: [100.9, 44.4], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1]};
const OLD9 = [[58, 134], [61, 134], [64, 135], [67, 135], [70, 135], [73, 135], [76, 136], [79, 136], [82, 134], [85, 133], [88, 134], [91, 134], [94, 133], [97, 134], [100, 134], [103, 135]];
const JAG9 = [[108.9, 106.3], [120.9, 107.6], [128.9, 107.8]];
const M2 = {burun: [163.5, 92], ogiz: [161, 102], iyak: [156, 112]};   // 2-urinish: profil ko'zi -- shotga xos siljish (anime profil usuli), bu yerda emas
const OLD2 = [[106, 159.5]], JAG2 = [[146, 113.5], [150, 113.5]];

// parametrlar: [guruh, nom, min, max]
const PAR = [
  ['B', 'kozZ', 0.88, 1.06], ['B', 'kozP', 1.4, 3.0], ['B', 'ogizZ', 0.92, 1.12], ['B', 'ogizW', 0.50, 0.75],
  ['B', 'iyakY', -1.40, -1.10], ['B', 'iyakZ', 0.85, 1.05], ['B', 'iyakW', 0.12, 0.40], ['B', 'burun', 0.08, 0.30],
  ['B', 'burunY', -0.62, -0.45], ['B', 'jagOrqa', 0.20, 0.85], ['B', 'jagOrqa2', -0.30, 0.55], ['B', 'burunOst', 0.04, 0.35],
  ['B', 'lab', 0.0, 0.03],
  ['Y', 'kozX', 0.26, 0.38], ['Y', 'kozY', -0.25, -0.05], ['Y', 'ogizY', -1.0, -0.75],
  ['S', 'eg2', -0.20, 0.05], ['S', 'bur2', -0.05, 0.20], ['S', 'd2', 8, 14], ['S', 'sx2', 0.2, 0.6], ['S', 'sy2', 0.2, 0.6],
];
const S0 = {eg2: 0.02, bur2: 0.12, d2: 10.8, sx2: 0.37, sy2: 0.40};
const bosh = (g, n) => g === 'B' ? B0[n] : g === 'Y' ? Y0[n] : S0[n];
const X0 = PAR.map(([g, n, a, b]) => (bosh(g, n) - a) / (b - a));
function qoy(x) {
  const S = {};
  PAR.forEach(([g, n, a, b], i) => { const v = a + Math.min(1, Math.max(0, x[i])) * (b - a); if (g === 'B') BOSH[n] = v; else if (g === 'Y') YUZ[n] = v; else S[n] = v; });
  return S;
}
/* old yuz sirti nuqtalari (silueta uchun): pastki yuz va ko'z darajasi, zich to'r */
function sirt() {
  const out = [];
  for (let j = 0; j <= 150; j++) {
    const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150;
    for (let i = 0; i <= 110; i++) { const ph = -1.9 + 3.6 * i / 110; out.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); }
  }
  return out;
}
const qatorMaks = (Q, y0, w = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < w && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0, w = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < w && q[1] > m) m = q[1]; return m; };

function baho(x, bat = false) {
  const S = qoy(x), pts = sirt();
  const p1 = proyektor(K1, P1), p2 = proyektor({az: 84, el: -4, d: S.d2, fov: 27, ekran: [S.sx2, S.sy2]}, {egilish: S.eg2, burilish: S.bur2});
  const L = {yaqin: yuzNuqta(-YUZ.kozX, YUZ.kozY), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(0, YUZ.ogizY), burun: burunNuqta(), iyak: iyakNuqta()};
  const r1 = {}, r2 = {}, e1 = [], e2 = [];
  for (const k in M1) { const s = p1(L[k]); r1[k] = s; e1.push(s[0] - M1[k][0], s[1] - M1[k][1]); }
  const Q1 = pts.map(p1);
  r1.old = OLD1.map(([y, x]) => qatorMaks(Q1, y)); OLD1.forEach(([y, x], i) => e1.push(r1.old[i] - x));
  r1.uzoqChet = UZOQ1.map(([y, x]) => qatorMaks(Q1, y)); UZOQ1.forEach(([y, x], i) => e1.push(r1.uzoqChet[i] - x));
  r1.jag = JAG1.map(([x, y]) => ustunMaks(Q1, x)); JAG1.forEach(([x, y], i) => e1.push(r1.jag[i] - y));
  const p9 = proyektor(K1, P9), Q9 = pts.map(p9);
  const e9 = [];
  for (const k in M9) { const s = p9(L[k]); r1['9' + k] = s; e9.push(s[0] - M9[k][0], s[1] - M9[k][1]); }
  r1.old9 = OLD9.map(([y, x]) => qatorMaks(Q9, y)); OLD9.forEach(([y, x], i) => e9.push(r1.old9[i] - x));
  r1.jag9 = JAG9.map(([x, y]) => ustunMaks(Q9, x)); JAG9.forEach(([x, y], i) => e9.push(r1.jag9[i] - y));
  if (V9 > 0) e1.push(...e9.map(t => t * V9));
  for (const k in M2) { const s = p2(L[k]); r2[k] = s; e2.push(s[0] - M2[k][0], s[1] - M2[k][1]); }
  const Q2 = pts.map(p2);
  r2.old = OLD2.map(([y, x]) => qatorMaks(Q2, y)); OLD2.forEach(([y, x], i) => e2.push(r2.old[i] - x));
  r2.jag = JAG2.map(([x, y]) => ustunMaks(Q2, x)); JAG2.forEach(([x, y], i) => e2.push(r2.jag[i] - y));
  const s1 = e1.reduce((a, t) => a + t * t, 0), s2 = e2.reduce((a, t) => a + t * t, 0);
  const reg = 2 * x.slice(0, 16).reduce((a, t, i) => a + (t - X0[i]) ** 2, 0);
  const f = s1 + V2 * V2 * s2 + reg;
  if (bat) return {f, rms1: Math.sqrt(s1 / e1.length), rms2: Math.sqrt(s2 / e2.length), e1, e2, r1, r2, S, L};
  return f;
}
function nelder(x0, qadam, iter) {
  const N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  const P = [x0.slice()]; for (let i = 0; i < N; i++) { const p = x0.slice(); p[i] = Math.min(1, Math.max(0, p[i] + (p[i] > 0.5 ? -qadam : qadam))); P.push(p); }
  let F = P.map(p => baho(p));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = baho(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = baho(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = baho(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = baho(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
const fmt = v => v.map(t => t.toFixed(1)).join(', ');
function hisobot(r, sar) {
  console.log(`${sar}: 1-shot RMS ${r.rms1.toFixed(2)} px | 2-shot RMS ${r.rms2.toFixed(2)} px`);
  for (const k in M1) console.log(`   1 ${k.padEnd(7)} biz (${fmt(r.r1[k])})  misol (${fmt(M1[k])})`);
  console.log(`   1 old kontur  biz ${fmt(r.r1.old)}  misol ${fmt(OLD1.map(t => t[1]))} (y ${fmt(OLD1.map(t => t[0]))})`);
  console.log(`   1 uzoq chet   biz ${fmt(r.r1.uzoqChet)}  misol ${fmt(UZOQ1.map(t => t[1]))}`);
  console.log(`   1 jag' osti   biz ${fmt(r.r1.jag)}  misol ${fmt(JAG1.map(t => t[1]))} (x ${fmt(JAG1.map(t => t[0]))})`);
  for (const k in M9) console.log(`   9 ${k.padEnd(7)} biz (${fmt(r.r1['9' + k])})  misol (${fmt(M9[k])})`);
  console.log(`   9 old kontur  biz ${fmt(r.r1.old9)}\n                misol ${fmt(OLD9.map(t => t[1]))}`);
  console.log(`   9 jag' osti   biz ${fmt(r.r1.jag9)}  misol ${fmt(JAG9.map(t => t[1]))}`);
  for (const k in M2) console.log(`   2 ${k.padEnd(7)} biz (${fmt(r.r2[k])})  misol (${fmt(M2[k])})`);
  console.log(`   2 old kontur  biz ${fmt(r.r2.old)}  misol ${fmt(OLD2.map(t => t[1]))};  jag' osti biz ${fmt(r.r2.jag)} misol ${fmt(JAG2.map(t => t[1]))}`);
}
const b0 = baho(X0, true); hisobot(b0, 'boshlang\'ich');
let eng = {x: X0, f: b0.f};
for (let q = 0; q < 3; q++) { const r = nelder(eng.x, q === 0 ? 0.12 : 0.05, ITER); if (r.f < eng.f) eng = r; console.log('qayta', q, 'f', eng.f.toFixed(2)); }
const r = baho(eng.x, true); hisobot(r, 'natija');
const out = {BOSH: Object.fromEntries(PAR.filter(p => p[0] === 'B').map(p => [p[1], +BOSH[p[1]].toFixed(4)])),
             YUZ: Object.fromEntries(PAR.filter(p => p[0] === 'Y').map(p => [p[1], +YUZ[p[1]].toFixed(4)])),
             shot2: Object.fromEntries(Object.entries(r.S).map(([k, v]) => [k, +v.toFixed(4)])),
             rms1: r.rms1, rms2: r.rms2, boshlangich: {rms1: b0.rms1, rms2: b0.rms2}, v2_vazn: V2};
console.log(JSON.stringify(out));
writeFileSync(new URL('./yuz_fit3.json', import.meta.url), JSON.stringify(out, null, 1));
