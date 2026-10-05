/* 1-SHOT YUZ BAHOSI (13-o'tish, 5-ish): Alonurning inson belgilari (test/qism/inson/belgilar_alonur_1.json, MAXFIY -- R03, R10:
   ko'zlar, burun uchi, og'iz o'rtasi, iyak) va modelning shu nuqtalari (personaj.js qismNuqtalari, node proyeksiyasi -- render
   yo'q). test/yuz11.mjs 2- va 3-shot uchun (nishon_fit_11, 12..22 kadr); 1-shot kamerasi 12-o'tishda qayta tekshirilmagan edi.
   yuzBaho1(v) -- v = {dEg, dBur, dYon, dD, dSx, dSy, dAz, dEl} qo'shimchasi bilan RMS px (320x180). */
import {BOSH, qismNuqtalari} from '../src/personaj.js';
import {FILMLAR} from '../src/film.js';
import {proyektor} from './proyeksiya.mjs';
import {readFileSync} from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const B = JSON.parse(readFileSync(ROOT + 'test/qism/inson/belgilar_alonur_1.json')).marks;
const S1 = FILMLAR.misol22.shotlar[0];
BOSH.surish = 0; BOSH.profilW = 0;
const QN = [qismNuqtalari(false), qismNuqtalari(true)];
const W = {koz_yaqin: 1, koz_uzoq: 1, burun_uchi: 1, ogiz: 1, iyak_uchi: 2};
const NISHON = {};
for (const [teg, i] of [['R03', 2], ['R10', 9]]) {
  const m = B[teg], o = m.ogiz.pts;
  NISHON[i] = {koz_yaqin: [m.koz_yaqin.x, m.koz_yaqin.y], koz_uzoq: [m.koz_uzoq.x, m.koz_uzoq.y], burun_uchi: [m.burun.x, m.burun.y],
               ogiz: [(o[0][0] + o[1][0]) / 2, (o[0][1] + o[1][1]) / 2], iyak_uchi: [m.iyak.x, m.iyak.y]};
}
export function yuzBaho1(v = {}, bat = false) {
  let e = 0, w = 0; const d = {};
  for (const [i, T] of Object.entries(NISHON)) {
    const h0 = S1.poza(+i), h = {...h0, egilish: h0.egilish + (v.dEg || 0), burilish: h0.burilish + (v.dBur || 0), yonga: (h0.yonga || 0) + (v.dYon || 0)};
    const K = S1.kamera, kam = {...K, d: K.d + (v.dD || 0), ekran: [K.ekran[0] + (v.dSx || 0), K.ekran[1] + (v.dSy || 0)], az: K.az + (v.dAz || 0), el: K.el + (v.dEl || 0)};
    const p = proyektor(kam, h), N = QN[h.yumuq > 0.5 ? 1 : 0];
    for (const [q, t] of Object.entries(T)) {
      const m = p(N[q][0]), dx = m[0] - 0.5 - t[0], dy = m[1] - 0.5 - t[1];
      e += W[q] * (dx * dx + dy * dy); w += W[q];
      if (bat) (d[i] = d[i] || {})[q] = [+dx.toFixed(1), +dy.toFixed(1)];
    }
  }
  const rms = Math.sqrt(e / w);
  return bat ? {rms, d} : rms;
}
if (process.argv[1] && process.argv[1].endsWith('yuz13_s1.mjs')) console.log(JSON.stringify(yuzBaho1(JSON.parse(process.argv[2] || '{}'), true)));
