/* 2-SHOT SAHNASI (5-o'tish) -- profil: kamera va bosh pozasi misolning OLD KONTURI (qatorlar) va iyak osti (ustunlar)
   bo'yicha moslanadi; ko'z moslashga KIRMAYDI (anime profil ko'zi boshqa joyda chiziladi) -- moslashdan keyin misol
   ko'zi (yumuq kiprik chizig'i) bosh sirtiga teskari proyeksiya qilinadi: profil ko'zi bosh fazosida qayerda.
   Misol k12 (320x180, L jadvali, 2 px qadam): old kontur qator y -> x (teri L~59 dan qorong'i chiziqqa o'tish);
   iyak osti y 113..114 (x 144..156); yumuq ko'z kiprik chizig'i (133, 77.5) -> (144, 80), markaz (138.5, 78.5).
   Oldingi (4-o'tish) moslash old konturni PASTKI YUZ SURISHI (profilZ) bilan qilgan edi: 2D egri moslashda surish bilan
   eng yaxshi pitch -15 gr (tepaga, RMS 1.97), surishsiz +5 gr (sal egilgan, RMS 1.35) -- surish yuzni orqaga og'dirardi.
   node test/sahna2_fit.mjs --el -5 */
import {BOSH, YUZ, yuzNuqta, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const EL = +arg('el', -5), FOV = 27;
BOSH.profilW = +arg('pw', 0);
const QATOR = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const JAG = [[146, 114], [150, 113.5], [154, 113]];
const KOZ = [[133, 77.5], [138.5, 78.5], [144, 80]];
const S = []; for (let j = 0; j <= 140; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.7) * j / 140; for (let i = 0; i <= 80; i++) { const ph = -1.9 + 3.8 * i / 80; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } }
const qatorMaks = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.6 && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.6 && q[1] > m) m = q[1]; return m; };
const PAR = [['az', 70, 110], ['d', 6, 18], ['sx', 0.1, 0.9], ['sy', 0.1, 0.9], ['eg', -0.6, 0.8], ['bur', -0.3, 0.3], ['yon', -0.3, 0.3]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
const kam = o => ({az: o.az, el: EL, d: o.d, fov: FOV, ekran: [o.sx, o.sy]}), poz = o => ({egilish: o.eg, burilish: o.bur, yonga: o.yon});
function baho(x, bat = false) {
  const o = ob(x), p = proyektor(kam(o), poz(o)), Q = S.map(p), e = [], r = {};
  r.q = QATOR.map(([y]) => qatorMaks(Q, y)); QATOR.forEach(([y, xx], i) => e.push(r.q[i] - xx));
  r.u = JAG.map(([xx]) => ustunMaks(Q, xx)); JAG.forEach(([xx, y], i) => e.push(r.u[i] - y));
  const f = e.reduce((a, v) => a + v * v, 0) + (o.yon / +arg('yonS', 0.1)) ** 2 + (o.bur / +arg('burS', 0.15)) ** 2;
  return bat ? {f, e, r, o, rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)} : f;
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
for (const eg0 of [-0.2, 0.1, 0.35]) for (const az0 of [80, 92]) for (const d0 of [10, 13]) {
  const v0 = {az: az0, d: d0, sx: 0.45, sy: 0.45, eg: eg0, bur: 0, yon: 0}, x0 = PAR.map(([n, a, b]) => (v0[n] - a) / (b - a));
  let r = nelder(x0, 0.12, 1200); r = nelder(r.x, 0.03, 1200); if (!eng || r.f < eng.f) eng = r;
}
const b = baho(eng.x, true), o = b.o, f = v => v.toFixed(3);
console.log(`el ${EL}: RMS ${b.rms.toFixed(2)} px | az ${o.az.toFixed(1)} d ${f(o.d)} ekran [${f(o.sx)}, ${f(o.sy)}] | egilish ${f(o.eg)} (${(o.eg * 57.3).toFixed(1)} gr) burilish ${f(o.bur)} yonga ${f(o.yon)}`);
console.log('   kontur qoldiq ' + b.e.slice(0, QATOR.length).map(v => v.toFixed(1)).join(' ') + ' | jag\' ' + b.e.slice(QATOR.length).map(v => v.toFixed(1)).join(' '));
// bizning ko'z (3/4 o'rni) qayerga tushadi va misol ko'zi bosh sirtining qaysi nuqtasi
const p = proyektor(kam(o), poz(o));
const bk = p(yuzNuqta(-YUZ.kozX, YUZ.kozY - 0.013));
console.log(`   bizning yumuq ko'z chizig'i (3/4 o'rni) -> (${bk.map(v => v.toFixed(1))}), misol (138.5, 78.5): farq ${(bk[0] - 138.5).toFixed(1)}, ${(bk[1] - 78.5).toFixed(1)} px`);
const yaqin = S.filter(q => q[0] < 0 && q[2] > -0.6);        // yaqin (o'ng) tomon, orqasi emas
for (const [n, t] of [['orqa uch', KOZ[0]], ['markaz', KOZ[1]], ['old uch', KOZ[2]]]) {
  let bb = null; for (const q of yaqin) { const s = p(q), e = (s[0] - t[0]) ** 2 + (s[1] - t[1]) ** 2; if (!bb || e < bb.e) bb = {e, q}; }
  console.log(`   misol ko'zi ${n} (${t}) -> bosh sirti (${bb.q.map(v => v.toFixed(3))}) xato ${Math.sqrt(bb.e).toFixed(2)} px`);
}
if (process.argv.includes('--json')) console.log(JSON.stringify({el: EL, ...o, rms: b.rms}));
