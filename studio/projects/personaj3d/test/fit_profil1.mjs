/* ESKIRGAN (5-o'tish): bu skript BOSH.profilW ni pastki yuz surishi deb ishlatadi -- endi surish BOSH.surish (surishZ)
   da, profilW esa faqat yaqin ko'z kartasi. O'rniga: test/fit_poza1c.mjs (surish va ko'z kartasi alohida). */
/* 1-SHOT PROFIL VAZNI (4-o'tish) -- 7..11-tasvirlarda pastki yuz oldinga cho'zilishi (BOSH.profilZ * w) misolning old
   kontur chetlariga moslanadi (poza film.js dan, qat'iy). Sabab: taqqos zond (bosh v3): 1-6 da old kontur farqi
   -0.5 px, 7-9 da -2.6..-4.0 px (bizniki chapda) -- misolda yangi rasm (7-tasvirdan) pastki yuzni oldinroq chizadi;
   ko'rinish burchagi 3 gr o'zgaradi, cho'zilish esa sakraydi -> burchak funksiyasi emas, har rasm uchun qiymat.
   Misol chetlari (taqqos zond misol qiymatlari, mutlaq): qator y -> kontur x (uzoq_chet_y20/y30, iyak_oldi_y52).
   node test/fit_profil1.mjs */
import {BOSH, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
const sh = FILMLAR.misol22.shotlar[0];
const Q = {7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
           10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
function nuqtalar() { const out = []; for (let j = 0; j <= 150; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 150; for (let i = 0; i <= 60; i++) { const ph = -0.4 + 1.8 * i / 60; out.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return out; }
const qatorMaks = (P, y0) => { let m = -1e9; for (const q of P) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
for (const k of [7, 8, 9, 10, 11]) {
  const p = proyektor(sh.kamera, sh.poza(k - 1)); let s = `${k}: `, best = null;
  for (let w = 0; w <= 1.001; w += 0.1) {
    BOSH.profilW = w; const P = nuqtalar().map(p);
    const r = Q[k].map(([y, x]) => qatorMaks(P, y) - x), e = r.reduce((a, t) => a + t * t, 0);
    s += `w${w.toFixed(1)} [${r.map(t => t.toFixed(1)).join(' ')}]  `;
    if (!best || e < best.e) best = {e, w};
  }
  console.log(s + ` => eng yaxshi w ${best.w.toFixed(1)}`);
}
