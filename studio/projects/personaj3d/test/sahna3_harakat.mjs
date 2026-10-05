/* 3-SHOT HARAKATI (5-o'tish) -- kamera qat'iy (sahna3_fit, zich silueta: az 55, el -30, d 7.10, fov 29, ekran [0.34, 0.50]); har
   tasvirda egilish jadvaldan, bosh siljishi (chokish -- pastga, orqaga) misol ko'zi izidan yechiladi.
   Misol ko'zi (qovoq kiprik chizig'i markazi, 320x180, L jadvallari; k14 da ko'z harakatda ko'rinmaydi):
     k15 (158, 106.5)  k16 (157.5, 108.5)  k17 (157, 110.5)  k18 (158, 112)  k19 (155.5, 112)  k20 (155.5, 112)
     k21 (156, 112)  k22 (155.5, 112)
   Ko'z 15 -> 18 da atigi 5.5 px pastga tushadi, keyin joyida: bosh 15-tasvirda allaqachon egilgan (yuz sohasi
   15..22 da deyarli bir xil), o'zgaradigani -- boshning tepasi kapyushon soyasiga kiradi (yorug' soch 2.8 -> 1.0 %).
   Egilish jadvali: 14 -- harakatda (0.43, yuz boshqa burchakda), 15..18 da 0.62 -> 0.70 (oshib ketish), 19.. 0.68;
   burilish 0.03, yonga -0.05 (tinch pozadan).
   node test/sahna3_harakat.mjs */
import {YUZ, yuzNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const KAM = {az: 55, el: -30, d: 7.10, fov: 29, ekran: [0.34, 0.50]};
const IZ = {15: [158, 106.5], 16: [157.5, 108.5], 17: [157, 110.5], 18: [158, 112], 19: [155.5, 112], 20: [155.5, 112], 21: [156, 112], 22: [155.5, 112]};
const EG = {14: 0.43, 15: 0.62, 16: 0.66, 17: 0.68, 18: 0.70, 19: 0.69, 20: 0.68, 21: 0.68, 22: 0.68};
const L = yuzNuqta(-YUZ.kozX, YUZ.kozY);
const out = {};
for (const k of Object.keys(IZ).map(Number)) {
  let best = null;
  for (let ch = -0.4; ch <= 0.4001; ch += 0.005) for (let oq = -0.4; oq <= 0.4001; oq += 0.005) {
    const q = proyektor(KAM, {egilish: EG[k], burilish: 0.03, yonga: -0.05, chokish: ch, orqaga: oq})(L);
    const e = (q[0] - IZ[k][0]) ** 2 + (q[1] - IZ[k][1]) ** 2 + 2 * (ch * ch + oq * oq);    // kichik siljish afzal
    if (!best || e < best.e) best = {e, ch, oq, q};
  }
  out[k] = {egilish: EG[k], chokish: +best.ch.toFixed(3), orqaga: +best.oq.toFixed(3)};
  console.log(k, JSON.stringify(out[k]), 'ko\'z', best.q.map(v => v.toFixed(1)), 'vs', IZ[k]);
}
