/* tekshiruv (9-o'tish, 2a): 1-shot 7..11 -- w 0, s 0 da poza (egilish, burilish, yonga) ERKIN, kontur og'irligi 1 */
import {BOSH, YUZ, yuzNuqta, boshShakli, kozNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {7: {yaqin: [98.4 + KM[0], 45.5 + KM[1]], uzoq: [123.0, 47.4], ogiz: [126.4, 83.7], lab: [127.7, 90.7]}, 8: {yaqin: [99.4 + KM[0], 44.7 + KM[1]], uzoq: [123.5, 46.4], ogiz: [127.2, 83.3], lab: [128.5, 90.0]},
  9: {yaqin: [100.9 + KM[0], 44.4 + KM[1]], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1], lab: [130.0, 89.8]}, 10: {yumuq: [107.8 + KM[0], 52.0], ogiz: [134.7, 87.0]}, 11: {yumuq: [112.5 + KM[0], 53.9], ogiz: [138.4, 89.7]}};
const Q1 = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const KV = +(process.argv[2] || 1);
BOSH.surish = 0; BOSH.profilW = 0;
const S = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const qatorMaks = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const H = YUZ.kozH, L = {yaqin: kozNuqta(0), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(-0.03, YUZ.ogizY), lab: yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), yumuq: kozNuqta(0, 0, -0.1 * H)};
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
for (const k of [7, 8, 9, 10, 11]) {
  let best = null;
  for (let eg = -0.5; eg <= 0.001; eg += 0.02) for (let bur = -0.3; bur <= 0.401; bur += 0.02) for (let yon = -0.15; yon <= 0.451; yon += 0.03) {
    const p = proyektor(K1, {egilish: eg, burilish: bur, yonga: yon}); let e = 0;
    for (const n in T1[k]) e += ((n === 'yaqin' || n === 'yumuq') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
    if (best && e > best.f) continue;
    const P = S.map(p), kont = Q1[k].map(([y, x]) => qatorMaks(P, y) - x), f = e + KV * kont.reduce((a, v) => a + v * v, 0);
    if (!best || f < best.f) best = {f, eg, bur, yon, kont, nuq: Object.keys(T1[k]).map(n => Math.sqrt(e2(p(L[n]), T1[k][n])).toFixed(1))};
  }
  console.log(`${k}: eg ${best.eg.toFixed(2)} bur ${best.bur.toFixed(2)} yon ${best.yon.toFixed(2)} | nuqtalar ${best.nuq.join(' ')} | kontur ${best.kont.map(v => v.toFixed(1)).join(' ')}`);
}
