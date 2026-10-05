/* YUZ -- BITTA 3D JOY (9-o'tish, 2a): yaqin ko'z chizmasi endi ko'rinishga/shotga bog'liq emas -- bitta joy (karta
   yo'lidagi w, hamma shotda bir xil) va bitta bosh shakli (pastki yuz surishi s, hamma kadrda bir xil). Har (w, s) uchun
   har tasvir pozasi (animatsiya -- ruxsat etilgan) qayta moslanadi, keyin UCH SHOT BIRGALIKDA baholanadi.
   Nishonlar (misol, 320x180) -- oldingi moslashlardan: 1-shot (fit_poza1.mjs 3-tasvir = ushlangan 1..6; fit_poza1c.mjs
   7..11: yaqin/uzoq ko'z, og'iz, lab soyasi, yumuq ko'z chizig'i, old kontur qatorlari); 2-shot (sahna2_fit.mjs: yumuq ko'z
   chizig'i markazi, old kontur 21 qator, iyak osti) -- 5-o'tishdagi yuzga mos kamera (d 12.88) bilan: ko'zning YUZ
   KONTURIGA nisbatan joyi masshtabga bog'liq emas; 3-shot (sahna3_fit.mjs: ko'z, iyak old cheti 7 qator, jag' osti).
   Og'irlik -- kadr soni (ekranda turish vaqti): 1-shot 11, 2-shot 2, 3-shot 9.
   node test/fit_yuz9.mjs [--s 0,0.15,0.3] [--wmax 1] */
import {BOSH, YUZ, yuzNuqta, boshShakli, kozNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SLAR = arg('s', '0').split(',').map(Number), WMAX = +arg('wmax', 1);

/* 1-shot */
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {3: {yaqin: [97.6 + KM[0], 46.3 + KM[1]], uzoq: [120.3, 49.3], ogiz: [125.5, 84.5], lab: [125.7, 91.0]},
  7: {yaqin: [98.4 + KM[0], 45.5 + KM[1]], uzoq: [123.0, 47.4], ogiz: [126.4, 83.7], lab: [127.7, 90.7]}, 8: {yaqin: [99.4 + KM[0], 44.7 + KM[1]], uzoq: [123.5, 46.4], ogiz: [127.2, 83.3], lab: [128.5, 90.0]},
  9: {yaqin: [100.9 + KM[0], 44.4 + KM[1]], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1], lab: [130.0, 89.8]}, 10: {yumuq: [107.8 + KM[0], 52.0], ogiz: [134.7, 87.0]}, 11: {yumuq: [112.5 + KM[0], 53.9], ogiz: [138.4, 89.7]}};
const Q1 = {3: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], 7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const YON1 = {3: 0, 7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15}, SONI1 = {3: 6, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1};
/* 2-shot (5-o'tish yuzga mos kamera va poza) */
const K2 = {az: 83.6, el: -5, d: 12.88, fov: 27, ekran: [0.411, 0.447]}, H2 = {egilish: -0.081, burilish: 0, yonga: 0};
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const KOZ2 = [138.5, 78.5];
/* 3-shot (tinch 20..22) */
const K3 = {az: 55, el: -30, d: 7.10, fov: 29, ekran: [0.34, 0.50]}, H3 = {egilish: 0.68, burilish: 0.03, yonga: -0.05, chokish: -0.02, orqaga: -0.02};
const KOZ3 = [155.7, 112.0], Q3 = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], J3 = [[146, 158], [150, 158]];

const sirt = (a0, a1, na, p0, p1, np) => { const S = []; for (let j = 0; j <= na; j++) { const al = a0 + (a1 - a0) * j / na; for (let i = 0; i <= np; i++) { const ph = p0 + (p1 - p0) * i / np; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
const qatorMaks = (Q, y0, t = 0.75) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < t && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0, t = 0.5) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < t && q[1] > m) m = q[1]; return m; };
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function baho(w, s) {
  BOSH.surish = s;
  const S1 = sirt(-Math.PI / 2, 0.35, 150, -0.4, 1.4, 60), S2 = sirt(-Math.PI / 2, 0.7, 140, -1.9, 1.9, 80), S3 = sirt(-Math.PI / 2, 0.1, 160, -1.9, 1.9, 110);
  const H = YUZ.kozH, L = {yaqin: kozNuqta(w), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(-0.03, YUZ.ogizY), lab: yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), yumuq: kozNuqta(w, 0, -0.1 * H)};
  const r = {w, s, shot1: {}, jami: 0};
  let c1 = 0, n1 = 0;
  for (const k of [3, 7, 8, 9, 10, 11]) {
    let best = null;
    for (let eg = -0.5; eg <= 0.001; eg += 0.01) for (let bur = -0.3; bur <= 0.401; bur += 0.01) {
      const p = proyektor(K1, {egilish: eg, burilish: bur, yonga: YON1[k]}); let e = 0;
      for (const n in T1[k]) e += ((n === 'yaqin' || n === 'yumuq') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
      if (!best || e < best.e) best = {e, eg, bur};
    }
    const p = proyektor(K1, {egilish: best.eg, burilish: best.bur, yonga: YON1[k]}), P = S1.map(p);
    const kont = Q1[k].map(([y, x]) => qatorMaks(P, y) - x), nm = T1[k].yaqin ? 'yaqin' : 'yumuq';
    const kz = p(L[nm]), koz = [kz[0] - T1[k][nm][0], kz[1] - T1[k][nm][1]];
    const nuq = Object.keys(T1[k]).map(n => Math.sqrt(e2(p(L[n]), T1[k][n])));
    const rms = Math.sqrt((nuq.reduce((a, v) => a + v * v, 0) + kont.reduce((a, v) => a + v * v, 0)) / (nuq.length + kont.length));
    r.shot1[k] = {eg: +best.eg.toFixed(2), bur: +best.bur.toFixed(2), koz: koz.map(v => +v.toFixed(1)), kontur: kont.map(v => +v.toFixed(1)), rms: +rms.toFixed(2)};
    c1 += SONI1[k] * rms * rms; n1 += SONI1[k];
  }
  r.rms1 = Math.sqrt(c1 / n1);
  // 2-shot: poza va kamera qat'iy (kontur -- surish bo'lsa o'zgaradi)
  { const p = proyektor(K2, H2), P = S2.map(p), kont = Q2.map(([y, x]) => qatorMaks(P, y, 0.6) - x), kz = p(L.yumuq);
    const koz = [kz[0] - KOZ2[0], kz[1] - KOZ2[1]], rk = Math.sqrt(kont.reduce((a, v) => a + v * v, 0) / kont.length);
    r.shot2 = {koz: koz.map(v => +v.toFixed(1)), konturRms: +rk.toFixed(2)}; r.rms2 = Math.sqrt((e2(kz, KOZ2) + kont.reduce((a, v) => a + v * v, 0)) / (1 + kont.length)); }
  // 3-shot: poza qayta moslanadi (egilish, burilish) -- ko'z (1.5 vazn), iyak qatorlari, jag' osti
  { let best = null;
    for (let eg = 0.55; eg <= 0.811; eg += 0.01) for (let bur = -0.3; bur <= 0.301; bur += 0.02) {
      const h = {...H3, egilish: eg, burilish: bur}, p = proyektor(K3, h), P = S3.map(p);
      const kz = p(L.yaqin), e = [1.5 * (kz[0] - KOZ3[0]), 1.5 * (kz[1] - KOZ3[1]), ...Q3.map(([y, x]) => qatorMaks(P, y, 0.5) - x), ...J3.map(([x, y]) => ustunMaks(P, x) - y)];
      const f = e.reduce((a, v) => a + v * v, 0) + (bur / 0.15) ** 2;
      if (!best || f < best.f) best = {f, eg, bur, koz: [kz[0] - KOZ3[0], kz[1] - KOZ3[1]], rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)};
    }
    r.shot3 = {eg: +best.eg.toFixed(2), bur: +best.bur.toFixed(2), koz: best.koz.map(v => +v.toFixed(1)), rms: +best.rms.toFixed(2)}; r.rms3 = best.rms; }
  r.jami = Math.sqrt((11 * r.rms1 ** 2 + 2 * r.rms2 ** 2 + 9 * r.rms3 ** 2) / 22);
  BOSH.surish = 0;
  return r;
}

const natija = [];
for (const s of SLAR) for (let w = 0; w <= WMAX + 1e-6; w += 0.1) {
  const r = baho(+w.toFixed(2), s); natija.push(r);
  const k1 = r.shot1;
  console.log(`w ${w.toFixed(1)} s ${s.toFixed(2)} | 1-shot RMS ${r.rms1.toFixed(2)} (ko'z 3: ${k1[3].koz} 9: ${k1[9].koz} 11: ${k1[11].koz}) | 2-shot ko'z ${r.shot2.koz} kontur ${r.shot2.konturRms} | 3-shot RMS ${r.rms3.toFixed(2)} ko'z ${r.shot3.koz} (eg ${r.shot3.eg} bur ${r.shot3.bur}) | JAMI ${r.jami.toFixed(2)}`);
}
writeFileSync(new URL('./yuz9_fit.json', import.meta.url), JSON.stringify(natija, null, 1));
