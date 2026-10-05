/* 3-SHOT SAHNASI (5-o'tish) -- oxirgi (tinch) tasvirlar 20-22: kamera va bosh pozasi misolning ko'z chizig'i, pastki yuz
   (iyak) old cheti va jag' osti yorug' chizig'iga moslanadi; kamera balandligi (el) va azimut (az) QAT'IY skan qilinadi
   (bitta ko'rinish faqat nisbiy yo'nalishni beradi). Qo'shimcha yumshoq nishon: peshona soch chizig'i (o'rta chiziq,
   y 0.55) yorug' soch massasi ichida. Render yo'q (test/proyeksiya.mjs).
   Misol (k20/k22, 320x180, L jadvallari): ko'z qovog'i kiprik chizig'i (152..159, 111..113) -> markazi (155.7, 112.0)
   (yarim ochiq ko'zda bizning qovoq chizig'i ko'z markazi balandligida); yorug' teri o'ng cheti qatorlarda: y144 x167, y146 161, y148 158,
   y150 157, y152 153, y154 153, y156 151; jag' osti yorug' chizig'i y ~158 (x 144..150); soch massasi (L>=85) x 165..215,
   y 88..120, kapyushon qirrasi ostidagi tasma y 66..88.
   node test/sahna3_fit.mjs --el -20 --az 80 */
import {BOSH, YUZ, yuzNuqta, boshShakli, iyakNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const EL = +arg('el', -20), AZ = +arg('az', 80), FOV = 29, PW = +arg('pw', 0);
BOSH.profilW = PW;
const KOZ = [155.7, 112.0];            // yarim ochiq ko'z qovoq chizig'i markazi (k20..22: kiprik chizig'i 152..159 x 111..113) = bizning ko'z markazi (yarim chizmada qovoq chizig'i markaz balandligida)
const QATOR = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]];
const JAG = [[146, 158], [150, 158]];
const SOCH = [188, 92];
/* silueta nuqtalari: faqat pastki yarim (iyak qatorlari va jag' osti shu yerdan), zich -- 110x70 butun boshda 144-qatorda
   +3.3 px namuna xatosi berardi (600x400 bilan tekshirildi) */
const S = []; for (let j = 0; j <= 160; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.1) * j / 160; for (let i = 0; i <= 110; i++) { const ph = -1.9 + 3.8 * i / 110; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const Lk = yuzNuqta(-YUZ.kozX, YUZ.kozY), Ls = boshShakli(0, 0.55, 0.83, false);
const qatorMaks = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.5 && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.5 && q[1] > m) m = q[1]; return m; };
const BURM = +arg('burMax', 0.8), YONM = +arg('yonMax', 0.5);
const PAR = [['d', 4, 14], ['sx', 0.1, 0.9], ['sy', 0.1, 0.9], ['eg', -0.3, 1.6], ['bur', -BURM, BURM], ['yon', -YONM, YONM]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
function baho(x, bat = false) {
  const o = ob(x), p = proyektor({az: AZ, el: EL, d: o.d, fov: FOV, ekran: [o.sx, o.sy]}, {egilish: o.eg, burilish: o.bur, yonga: o.yon});
  const e = [], r = {};
  r.koz = p(Lk); e.push(1.5 * (r.koz[0] - KOZ[0]), 1.5 * (r.koz[1] - KOZ[1]));
  const Q = S.map(p);
  r.q = QATOR.map(([y]) => qatorMaks(Q, y)); QATOR.forEach(([y, x], i) => e.push(r.q[i] - x));
  r.u = JAG.map(([x]) => ustunMaks(Q, x)); JAG.forEach(([x, y], i) => e.push(r.u[i] - y));
  r.soch = p(Ls); const ds = Math.hypot(r.soch[0] - SOCH[0], r.soch[1] - SOCH[1]); e.push(0.3 * Math.max(0, ds - 10));
  let f = e.reduce((a, v) => a + v * v, 0) + (o.yon / 0.2) ** 2 + (o.bur / +arg('burS', 1e9)) ** 2;
  return bat ? {f, e, r, o, rms: Math.sqrt(e.slice(0, 2 + QATOR.length + JAG.length).reduce((a, v) => a + v * v, 0) / (2 + QATOR.length + JAG.length))} : f;
}
function nelder(x0, q, it) {
  const N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -q : q))); P.push(pp); }
  let F = P.map(pp => baho(pp));
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = baho(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = baho(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = baho(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = baho(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}
let eng = null;
for (const eg0 of [0.2, 0.6, 1.0]) for (const bur0 of [-0.3, 0.0, 0.3]) for (const d0 of [6, 9]) {
  const v0 = {d: d0, sx: 0.5, sy: 0.6, eg: eg0, bur: Math.max(-BURM, Math.min(BURM, bur0)), yon: 0};
  const x0 = PAR.map(([n, a, b]) => (v0[n] - a) / (b - a));
  let r = nelder(x0, 0.12, 1200); r = nelder(r.x, 0.03, 1200);
  if (!eng || r.f < eng.f) eng = r;
}
const b = baho(eng.x, true), o = b.o, f = v => v.toFixed(2);
console.log(`el ${EL} az ${AZ}: RMS ${b.rms.toFixed(2)} px | d ${f(o.d)} ekran [${f(o.sx)}, ${f(o.sy)}] | egilish ${f(o.eg)} (${(o.eg * 57.3).toFixed(0)} gr) burilish ${f(o.bur)} yonga ${f(o.yon)} | ko'z (${b.r.koz.map(v => v.toFixed(1))}) iyak qator ${b.r.q.map(v => v.toFixed(0)).join(',')} jag' ${b.r.u.map(v => v.toFixed(0)).join(',')} soch (${b.r.soch.map(v => v.toFixed(0))})`);
if (process.argv.includes('--json')) console.log(JSON.stringify({el: EL, az: AZ, ...o, rms: b.rms}));
