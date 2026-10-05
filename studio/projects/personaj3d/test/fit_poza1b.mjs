/* ESKIRGAN (5-o'tish): bu skript BOSH.profilW ni pastki yuz surishi deb ishlatadi -- endi surish BOSH.surish (surishZ)
   da, profilW esa faqat yaqin ko'z kartasi. O'rniga: test/fit_poza1c.mjs (surish va ko'z kartasi alohida). */
/* 1-SHOT POZA + PROFIL (4-o'tish, 7..11) -- har tasvirda profil vazni w (0..0.6) uchun poza (egilish, burilish; yonga
   qat'iy) yuz nuqtalariga moslanadi, keyin shu poza bilan old kontur chetlari baholanadi; umumiy xato eng kichik w
   tanlanadi. Nuqtalar: yaqin/uzoq ko'z, og'iz, lab soyasi (10-11: yumuq ko'z chizig'i, og'iz); kontur: uzoq_chet_y20,
   y30, iyak_oldi_y52 (misol, mutlaq). Yaqin ko'z (langar) vazni 3: 1-urinishda (vazn 1) langar 7-11 da 2.3..2.9 px chapda
   qoldi -- ko'z markaziy nuqta, zondlar ham unga bog'langan. node test/fit_poza1b.mjs */
import {BOSH, YUZ, yuzNuqta, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]};
/* yaqin ko'z: misol langari -- qorong'i massa markazi; bizning chizmada massa markazi chizma markazidan (-1.75, -2.4) px
   (1-6 da o'lchangan: langar 96.7/46.5, markaz 98.45/48.89) -- nishon chizma markaziga o'tkaziladi; yumuq ko'zda
   (tashqi uchidagi uch) x bo'yicha shuncha */
const KM = [1.75, 2.4];
const T = {7: {yaqin: [98.4 + KM[0], 45.5 + KM[1]], uzoq: [123.0, 47.4], ogiz: [126.4, 83.7], lab: [127.7, 90.7]}, 8: {yaqin: [99.4 + KM[0], 44.7 + KM[1]], uzoq: [123.5, 46.4], ogiz: [127.2, 83.3], lab: [128.5, 90.0]},
  9: {yaqin: [100.9 + KM[0], 44.4 + KM[1]], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1], lab: [130.0, 89.8]}, 10: {yumuq: [107.8 + KM[0], 52.0], ogiz: [134.7, 87.0]}, 11: {yumuq: [112.5 + KM[0], 53.9], ogiz: [138.4, 89.7]}};
const Q = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
           10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const YON = {7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15};
const sirt = () => { const out = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; out.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return out; };
const qatorMaks = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const out = {};
for (const k of [7, 8, 9, 10, 11]) {
  let eng = null;
  for (let w = 0; w <= 0.601; w += 0.1) {
    BOSH.profilW = w;
    const H = YUZ.kozH, L = {yaqin: yuzNuqta(-YUZ.kozX, YUZ.kozY), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(-0.03, YUZ.ogizY), lab: yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), yumuq: yuzNuqta(-YUZ.kozX, YUZ.kozY - 0.1 * H)};
    let best = null;
    for (let eg = -0.5; eg <= 0.0; eg += 0.01) for (let bur = -0.3; bur <= 0.4; bur += 0.01) {
      const p = proyektor(K1, {egilish: eg, burilish: bur, yonga: YON[k]}); let e = 0;
      for (const n in T[k]) { const q = p(L[n]), v = (n === 'yaqin' || n === 'yumuq') ? 3 : 1; e += v * ((q[0] - T[k][n][0]) ** 2 + (q[1] - T[k][n][1]) ** 2); }
      if (!best || e < best.e) best = {e, eg, bur};
    }
    const p = proyektor(K1, {egilish: best.eg, burilish: best.bur, yonga: YON[k]}), P = sirt().map(p);
    const r = Q[k].map(([y, x]) => qatorMaks(P, y) - x), ec = r.reduce((a, t) => a + t * t, 0);
    const n = Object.keys(T[k]).length + 2, f = best.e / n + 0.5 * ec / 3;
    const pp = proyektor(K1, {egilish: best.eg, burilish: best.bur, yonga: YON[k]}), kz = pp(L[T[k].yaqin ? 'yaqin' : 'yumuq']), kt = T[k].yaqin || T[k].yumuq;
    if (!eng || f < eng.f) eng = {f, w, eg: best.eg, bur: best.bur, rmsN: Math.sqrt(best.e / n), r, koz: [kz[0] - kt[0], kz[1] - kt[1]]};
  }
  out[k] = eng;
  console.log(`${k}: w ${eng.w.toFixed(1)} egilish ${eng.eg.toFixed(2)} burilish ${eng.bur.toFixed(2)} yonga ${YON[k]} | nuqtalar RMS ${eng.rmsN.toFixed(2)} px (ko'z ${eng.koz.map(t => t.toFixed(1))}), kontur [${eng.r.map(t => t.toFixed(1)).join(' ')}]`);
}
