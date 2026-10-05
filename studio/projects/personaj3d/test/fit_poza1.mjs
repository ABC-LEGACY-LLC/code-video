/* 1-SHOT POZASI (4-o'tish) -- har tasvirda bosh burilishi va egilishi misolning yuz nuqtalariga moslanadi (bosh shakli
   va kamera qat'iy). Sabab: bosh v3 bilan 9-tasvirda yaqin ko'z misoldan 9.5 px o'ngda, og'iz 7.6 px o'ngda edi --
   g jadvali (0.23 .. 1.0) va burilish amplitudasi 0.47 figura juft farqlaridan olingan, yuz nuqtalaridan emas.
   Misol (taqqos zond, misol qiymatlari): langar -- yaqin ko'z qorong'i massasi (10-11 da yumuq ko'z chizig'i),
   uzoq ko'z, og'iz, lab soyasi; old kontur har 3 qatorda (yuz niqobi L>=50).
   node test/fit_poza1.mjs  ->  test/poza1_fit.json */
import {YUZ, yuzNuqta, boshShakli} from '../src/personaj.js';
/* silueta chetlari (taqqos zond misol qiymatlari -> mutlaq): qator y -> old kontur x; ustun x -> jag' osti y */
const CHET = {
  3: {q: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], u: [[104.8, 107.6], [116.8, 109.7], [124.8, 109.8]]},
  7: {q: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], u: [[106.4, 106.8], [118.4, 108.8], [126.4, 108.9]]},
  8: {q: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], u: [[107.4, 106.3], [119.4, 108.6], [127.4, 108.6]]},
  9: {q: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]], u: [[108.9, 106.3], [120.9, 107.6], [128.9, 107.8]]},
  10: {q: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], u: [[115.8, 109.8], [127.8, 111.6], [135.8, 110.8]]},
  11: {q: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]], u: [[120.5, 114.6], [132.5, 114.4], [140.5, 112.3]]},
};
const PTS = []; for (let j = 0; j <= 120; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 120; for (let i = 0; i <= 90; i++) { const ph = -1.9 + 3.6 * i / 90; PTS.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const qatorMaks = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.75 && q[1] > m) m = q[1]; return m; };
import {proyektor} from './proyeksiya.mjs';
import {writeFileSync} from 'fs';

const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]};
const T = {   // tasvir -> nuqtalar
  3: {yaqin: [97.6, 46.3], uzoq: [120.3, 49.3], ogiz: [125.5, 84.5], lab: [125.7, 91.0]},
  7: {yaqin: [98.4, 45.5], uzoq: [123.0, 47.4], ogiz: [126.4, 83.7], lab: [127.7, 90.7]},
  8: {yaqin: [99.4, 44.7], uzoq: [123.5, 46.4], ogiz: [127.2, 83.3], lab: [128.5, 90.0]},
  9: {yaqin: [100.9, 44.4], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1], lab: [130.0, 89.8]},
  10: {yumuq: [107.8, 52.0], ogiz: [134.7, 87.0]},
  11: {yumuq: [112.5, 53.9], ogiz: [138.4, 89.7]},
};
/* o'rta chiziqdagi og'iz nuqtasi misolda chiziq markazi (eng qorong'i komponent) -- chiziq yaqin tomonga cho'zilgan,
   markaz o'rta chiziqdan ~1.5 px chapda; lab soyasi -- o'rta chiziqda (YUZ.labSoyaY) */
function nuqtalar() {
  const W = YUZ.kozW, H = YUZ.kozH;
  return {yaqin: yuzNuqta(-YUZ.kozX, YUZ.kozY), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(-0.03, YUZ.ogizY),
          lab: yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), yumuq: yuzNuqta(-YUZ.kozX, YUZ.kozY - 0.25 * H)};
}
function baho(k, eg, bur, yon = 0) {
  const p = proyektor(K1, {egilish: eg, burilish: bur, yonga: yon}), L = nuqtalar();
  let e = 0; const r = {};
  for (const n in T[k]) { const s = p(L[n]); r[n] = s; e += (s[0] - T[k][n][0]) ** 2 + (s[1] - T[k][n][1]) ** 2; }
  if (CHETLI && CHET[k]) {
    const Q = PTS.map(p);
    r.q = CHET[k].q.map(([y, x]) => qatorMaks(Q, y)); CHET[k].q.forEach(([y, x], i) => { e += 0.5 * (r.q[i] - x) ** 2; });
    r.u = CHET[k].u.map(([x, y]) => ustunMaks(Q, x)); CHET[k].u.forEach(([x, y], i) => { e += 0.5 * (r.u[i] - y) ** 2; });
  }
  return {e, r};
}
const YON = process.argv.includes('--yonga'), CHETLI = process.argv.includes('--chet'), out = {};
for (const k of Object.keys(T).map(Number)) {
  let best = null;
  for (let eg = -0.6; eg <= 0.1; eg += CHETLI ? 0.04 : 0.02) for (let bur = -0.3; bur <= 0.5; bur += CHETLI ? 0.04 : 0.02) for (let yon = -0.3; yon <= 0.301; yon += YON ? (CHETLI ? 0.04 : 0.02) : 1) {
    const b = baho(k, eg, bur, YON ? yon : 0); if (!best || b.e < best.e) best = {...b, eg, bur, yon: YON ? yon : 0};
  }
  const n = Object.keys(T[k]).length;
  out[k] = {egilish: +best.eg.toFixed(3), burilish: +best.bur.toFixed(3), yonga: +best.yon.toFixed(3), rms: +Math.sqrt(best.e / n).toFixed(2)};
  console.log(`${k}: egilish ${best.eg.toFixed(2)} burilish ${best.bur.toFixed(2)} yonga ${best.yon.toFixed(2)}  RMS ${Math.sqrt(best.e / n).toFixed(2)} px  ` +
    Object.keys(T[k]).map(m => `${m} (${best.r[m].map(t => t.toFixed(1))}) vs (${T[k][m]})`).join('  ') +
    (best.r.q ? `\n      kontur ${best.r.q.map(t => t.toFixed(1))} vs ${CHET[k].q.map(t => t[1])} | jag' ${best.r.u.map(t => t.toFixed(1))} vs ${CHET[k].u.map(t => t[1])}` : ''));
}
writeFileSync(new URL('./poza1_fit.json', import.meta.url), JSON.stringify(out, null, 1));
