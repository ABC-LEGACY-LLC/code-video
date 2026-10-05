/* KO'Z YOSHI O'RNI (4-o'tish) -- misolning yosh izlari (320x180, L>70 komponentlari, har tasvir) bosh fazosiga
   o'tkaziladi: har ekran nuqtasi uchun yuz sirtidagi (x, y) -- o'sha tasvir pozasi va kamerasi bilan proyeksiyasi shu
   nuqtaga tushadigan (render yo'q). Chizma bizniki (ingichka yorug' chiziq); o'lchanadi o'rin va vaqt.
   Misol komponentlari (x oralig'i, y oralig'i):
     A (ko'z ostidan tik, ushlangan tasvirlarda pastga siljiydi): 1 (98, 62..68)  2 (98..99, 60..67)  3 (97..100, 56..66)
       4 (97..98, 63..66)  5 (97..99, 69..72)  6 (96..98, 73..75)
     B (yonoq bo'ylab): 5 (103..105, 60..65)  6 (103..105, 61..67)  7 (106..108, 66..74)  8 (107..109, 69..76)
       9 (108..110, 69..77)  10 (111..114, 77..88)  11 (115..119, 85..95)
     C (jag' chetida osilgan tomchi): 7..9 ~ (112, 108)  -- 10-11 da tushadi: (125, 129.6), (123.5, 157.1) (yosh_jag zondi)
   node test/yosh_olch.mjs  ->  test/yosh_fit.json */
import * as THREE from 'three';
import {BOSH, yuzNuqta, iyakNuqta} from '../src/personaj.js';
import {proyektor, boshMatritsa, kameraOl} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
import {writeFileSync} from 'fs';

const shot = FILMLAR.misol22.shotlar[0], K1 = shot.kamera;
const A = {1: [[98, 62], [98, 68]], 2: [[98.5, 60], [98.5, 67]], 3: [[98.5, 56], [98.5, 66]], 4: [[97.5, 63], [97.5, 66]], 5: [[98, 69], [98, 72]], 6: [[97, 73], [97, 75]]};
const B = {5: [[103, 60], [105, 65]], 6: [[103, 61], [105, 67]], 7: [[106, 66], [108, 74]], 8: [[107, 69], [109, 76]], 9: [[108, 69], [110, 77]], 10: [[111, 77], [114, 88]], 11: [[115, 85], [119, 95]]};
const C = {7: [112, 108], 8: [112, 108], 9: [112, 107]};
function bosh(k, s) {                     // ekran nuqtasi -> yuz sirtidagi (x, y)
  BOSH.surish = shot.poza(k - 1).surish || 0;          // 5-o'tish: pastki yuz surishi alohida (profil vazni -- faqat ko'z kartasi)
  const p = proyektor(K1, shot.poza(k - 1));
  let best = null;
  for (let x = -0.8; x <= 0.3; x += 0.01) for (let y = -1.3; y <= 0.1; y += 0.01) {
    const q = p(yuzNuqta(x, y)), e = (q[0] - s[0]) ** 2 + (q[1] - s[1]) ** 2; if (!best || e < best.e) best = {e, x, y};
  }
  let {x, y} = best, h = 0.005;
  for (let it = 0; it < 60; it++) {       // mayda qidiruv
    let yaxshi = false;
    for (const [dx, dy] of [[h, 0], [-h, 0], [0, h], [0, -h]]) {
      const q = p(yuzNuqta(x + dx, y + dy)), e = (q[0] - s[0]) ** 2 + (q[1] - s[1]) ** 2;
      if (e < best.e) { best = {e, x: x + dx, y: y + dy}; x += dx; y += dy; yaxshi = true; break; }
    }
    if (!yaxshi) h /= 2;
  }
  return [+x.toFixed(3), +y.toFixed(3), +Math.sqrt(best.e).toFixed(2)];
}
const out = {A: {}, B: {}, C: {}};
for (const [k, [a, b]] of Object.entries(A)) out.A[k] = [bosh(+k, a), bosh(+k, b)];
for (const [k, [a, b]] of Object.entries(B)) out.B[k] = [bosh(+k, a), bosh(+k, b)];
for (const [k, c] of Object.entries(C)) out.C[k] = bosh(+k, c);
/* D -- tushayotgan tomchi (10, 11): dunyo nuqtasi -- kamera nuri ekran nuqtasidan, iyak chuqurligida */
const D = {10: [125, 129.6], 11: [123.5, 157.1]};
out.D = {};
for (const [k, s] of Object.entries(D)) {
  BOSH.surish = shot.poza(+k - 1).surish || 0;
  const cam = kameraOl(K1), M = boshMatritsa(shot.poza(+k - 1));
  const iyak = new THREE.Vector3(...iyakNuqta()).applyMatrix4(M);
  const chuq = iyak.clone().sub(cam.position).dot(cam.getWorldDirection(new THREE.Vector3()));
  const ndc = new THREE.Vector3(s[0] / 320 * 2 - 1, 1 - s[1] / 180 * 2, 0.5).unproject(cam);
  const nur = ndc.sub(cam.position).normalize(), t = chuq / nur.dot(cam.getWorldDirection(new THREE.Vector3()));
  const w = cam.position.clone().addScaledVector(nur, t);
  out.D[k] = [+w.x.toFixed(3), +w.y.toFixed(3), +w.z.toFixed(3)];
  console.log('D', k, JSON.stringify(out.D[k]), 'tekshiruv px', proyektor(K1, {egilish: 0})(new THREE.Vector3(...out.D[k]).applyMatrix4(boshMatritsa({egilish: 0}).invert()).toArray()).map(t => t.toFixed(1)));
}
for (const n of ['A', 'B']) for (const k in out[n]) console.log(n, k, JSON.stringify(out[n][k]));
for (const k in out.C) console.log('C', k, JSON.stringify(out.C[k]));
writeFileSync(new URL('./yosh_fit.json', import.meta.url), JSON.stringify(out, null, 1));
