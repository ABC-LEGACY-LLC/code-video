/* SAHNA: OLDIN (4-o'tish topshirilgan) vs HOZIR (5-o'tish) -- misolning 2- va 3-shot nishonlariga qoldiqlar (bir xil kod,
   render yo'q). 2-shot (k12): old kontur 21 qator + iyak osti 3 ustun + yumuq ko'z chizig'i; 3-shot (k22): ko'z qovog'i
   chizig'i + iyak old cheti 7 qator + jag' osti 2 ustun. Surish/profil: oldin profil vazni (pastki yuz surishi bilan birga),
   hozir surish va ko'z kartasi alohida. node test/sahna_oldin_hozir.mjs */
import {BOSH, YUZ, boshShakli, kozNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
const sirt = () => { const S = []; for (let j = 0; j <= 400; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 400; for (let i = 0; i <= 200; i++) { const ph = -1.9 + 3.8 * i / 200; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
const qatorMaks = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.4 && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.4 && q[1] > m) m = q[1]; return m; };
const rms = v => Math.sqrt(v.reduce((a, t) => a + t * t, 0) / v.length);
const N2 = {q: [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]],
            u: [[146, 114], [150, 113.5], [154, 113]], koz: [138.5, 78.5]};
const N3 = {q: [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], u: [[146, 158], [150, 158]], koz: [155.7, 112.0]};
function baho(nom, kam, poza, surish, w, N, kozDy) {
  BOSH.surish = surish; const p = proyektor(kam, poza), Q = sirt().map(p);
  const eq = N.q.map(([y, x]) => qatorMaks(Q, y) - x), eu = N.u.map(([x, y]) => ustunMaks(Q, x) - y);
  const k = p(kozNuqta(w, 0, kozDy)), ek = [k[0] - N.koz[0], k[1] - N.koz[1]];
  BOSH.surish = 0;
  console.log(`${nom}: kontur RMS ${rms(eq).toFixed(2)} px (maks ${Math.max(...eq.map(Math.abs)).toFixed(1)}), iyak osti ${eu.map(v => v.toFixed(1)).join(' ')}, ko'z ${ek.map(v => v.toFixed(1)).join(', ')} px | egilish ${poza.egilish} (${(poza.egilish * 57.3).toFixed(0)} gr)`);
}
const H = YUZ.kozH, F = FILMLAR.misol22.shotlar;
console.log('--- 2-shot (k12) ---');
baho('OLDIN', {az: 84, el: -4, d: 11.0, fov: 27, ekran: [0.346, 0.425]}, {egilish: -0.10, burilish: 0, yonga: 0}, 1.0, 0, N2, -0.1 * H);
baho('HOZIR', F[1].kamera, F[1].poza(0), 0, F[1].profil, N2, -0.1 * H);
console.log('--- 3-shot (k22) ---');
const s = 1;
baho('OLDIN', {az: 80, el: -5, d: 8.10, fov: 29, ekran: [0.396, 0.39]}, {egilish: 0.15 + 0.15 * s, burilish: 0.10, yonga: 0.0, chokish: -0.493 * s, orqaga: 0.379 * s}, 0.5, 0, N3, 0);
baho('HOZIR', F[2].kamera, F[2].poza(8), 0, F[2].profil, N3, 0);
