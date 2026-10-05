/* SAHNA MOSLASH (5-o'tish) -- har shotda kamera (az, el, d, ekran) va bosh pozasi (egilish, burilish, yonga) misolning
   yuz nuqtalari va silueta chetlariga moslanadi; kamera balandligi (el) QAT'IY qo'yiladi (--el), chunki bitta ko'rinish
   faqat yuz va kamera orasidagi NISBIY burchakni beradi: "bosh tepaga + kamera tekis" va "bosh pastga + kamera past"
   yuz nuqtalarida deyarli bir xil. Qaysi biri to'g'ri -- boshqa belgilardan (kapyushon, soch, bo'yin, fon) hal qilinadi.
   Render yo'q: node da bosh sirti va sahifa bilan bir xil proyeksiya (test/proyeksiya.mjs).
   node test/sahna_fit.mjs --shot 1 --el -30 [--eg -0.1..0.4 oraliq markazi --egSigma]  */
import {BOSH, YUZ, yuzNuqta, burunNuqta, iyakNuqta, boshShakli} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOT = +arg('shot', 1), EL = +arg('el', -8), EG0 = arg('eg', null), EGS = +arg('egSigma', 0.05), CHIQ = process.argv.includes('--json');
const KM = [1.75, 2.4];                    // chizma markazi -> qorong'i massa markazi (4-o'tish, o'lchangan)
const H = () => YUZ.kozH;
/* nishonlar: [nom, bosh fazosi nuqtasi (funksiya), ekran px] ; chetlar: qator y -> kontur x, ustun x -> jag' osti y */
const T = {
  1: {pts: [['yaqin', () => yuzNuqta(-YUZ.kozX, YUZ.kozY), [97.6 + KM[0], 46.3 + KM[1]]], ['uzoq', () => yuzNuqta(YUZ.kozX, YUZ.kozY), [120.3, 49.3]],
            ['ogiz', () => yuzNuqta(-0.03, YUZ.ogizY), [125.5, 84.5]], ['lab', () => yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), [125.7, 91.0]], ['burun', burunNuqta, [130.5, 60]]],
      q: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], u: [[104.8, 107.6], [116.8, 109.7], [124.8, 109.8]], profil: 0, fov: 27, az: 55, d: 7.03},
  2: {pts: [['yumuq', () => yuzNuqta(-YUZ.kozX, YUZ.kozY - 0.1 * H()), [137 + KM[0], 77.5]], ['burun', burunNuqta, [163.5, 92]], ['ogiz', () => yuzNuqta(0, YUZ.ogizY), [161, 102]],
            ['iyak', iyakNuqta, [156, 112]]], q: [[106, 159.5]], u: [[146, 113.5], [150, 113.5]], profil: 0, fov: 27, az: 84, d: 11},
};
const t = T[SHOT];
const sirt = () => { const o = []; for (let j = 0; j <= 120; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / 120; for (let i = 0; i <= 90; i++) { const ph = -1.9 + 3.6 * i / 90; o.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return o; };
const qatorMaks = (Q, y0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[1] - y0) < 0.75 && q[0] > m) m = q[0]; return m; };
const ustunMaks = (Q, x0) => { let m = -1e9; for (const q of Q) if (Math.abs(q[0] - x0) < 0.75 && q[1] > m) m = q[1]; return m; };
BOSH.profilW = t.profil;
const S = sirt(), L = t.pts.map(([n, f]) => f());
// parametrlar: az, d, sx, sy, egilish, burilish, yonga
const AZ = (arg('az', '') || '').split(',').filter(Boolean).map(Number), YON = +arg('yon', 0.4), BUR = (arg('bur', '') || '').split(',').filter(Boolean).map(Number);
const PAR = [['az', AZ.length ? AZ[0] : t.az - 40, AZ.length ? AZ[1] : t.az + 40], ['d', t.d * 0.6, t.d * 1.6], ['sx', 0.1, 0.7], ['sy', 0.1, 0.8], ['eg', -0.8, 1.2],
             ['bur', BUR.length ? BUR[0] : -0.6, BUR.length ? BUR[1] : 0.6], ['yon', -YON, YON]];
const ob = x => Object.fromEntries(PAR.map(([n, a, b], i) => [n, a + Math.min(1, Math.max(0, x[i])) * (b - a)]));
function baho(x, bat = false) {
  const o = ob(x), p = proyektor({az: o.az, el: EL, d: o.d, fov: t.fov, ekran: [o.sx, o.sy]}, {egilish: o.eg, burilish: o.bur, yonga: o.yon});
  const e = [], r = {};
  t.pts.forEach(([n, f, s], i) => { const q = p(L[i]); r[n] = q; e.push(q[0] - s[0], q[1] - s[1]); });
  const Q = S.map(p);
  r.q = t.q.map(([y, xx]) => qatorMaks(Q, y)); t.q.forEach(([y, xx], i) => e.push(0.7 * (r.q[i] - xx)));
  r.u = t.u.map(([xx, y]) => ustunMaks(Q, xx)); t.u.forEach(([xx, y], i) => e.push(0.7 * (r.u[i] - y)));
  let f = e.reduce((a, v) => a + v * v, 0);
  if (EG0 !== null) f += ((o.eg - +EG0) / EGS) ** 2;          // egilish oldindan berilgan bo'lsa (yumshoq)
  f += (o.yon / 0.15) ** 2 * 0.5;                              // yonga kichik bo'lsin
  if (bat) return {f, e, r, o, rms: Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length)};
  return f;
}
function nelder(x0, qadam, iter) {
  const N = x0.length, cl = v => v.map(tt => Math.min(1, Math.max(0, tt)));
  const P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -qadam : qadam))); P.push(pp); }
  let F = P.map(pp => baho(pp));
  for (let k = 0; k < iter; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); const Ps = o.map(i => P[i]), Fs = o.map(i => F[i]); P.splice(0, N + 1, ...Ps); F = Fs;
    if (F[N] - F[0] < 1e-7) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((tt, j) => tt + (tt - P[N][j]))), fr = baho(xr);
    if (fr < F[0]) { const xe = cl(c.map((tt, j) => tt + 2 * (tt - P[N][j]))), fe = baho(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((tt, j) => tt + 0.5 * (P[N][j] - tt))), fc = baho(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((tt, j) => P[0][j] + 0.5 * (tt - P[0][j]))); F[i] = baho(P[i]); } }
  }
  const i = F.map((v, i) => i).sort((a, b) => F[a] - F[b])[0]; return {x: P[i], f: F[i]};
}
let eng = null;
for (const eg0 of [-0.3, 0.0, 0.3, 0.6]) for (const bur0 of [-0.15, 0.1]) {
  const x0 = PAR.map(([n, a, b]) => { const v = {az: Math.min(b, Math.max(a, t.az)), d: t.d, sx: 0.35, sy: 0.35, eg: EG0 !== null ? +EG0 : eg0, bur: Math.min(b, Math.max(a, bur0)), yon: 0}[n]; return Math.min(1, Math.max(0, (v - a) / (b - a))); });
  let r = nelder(x0, 0.1, 1500); r = nelder(r.x, 0.03, 1500);
  if (!eng || r.f < eng.f) eng = r;
}
const b = baho(eng.x, true), o = b.o;
const fx = v => v.toFixed(3);
console.log('   qoldiq: ' + t.pts.map(([n], i) => n + ' ' + b.e[2 * i].toFixed(1) + '/' + b.e[2 * i + 1].toFixed(1)).join('  ') + ' | chet ' + b.e.slice(2 * t.pts.length).map(v => v.toFixed(1)).join(' '));
console.log(`shot ${SHOT} el ${EL}: RMS ${b.rms.toFixed(2)} px | kamera az ${o.az.toFixed(1)} d ${o.d.toFixed(2)} ekran [${fx(o.sx)}, ${fx(o.sy)}] | poza egilish ${fx(o.eg)} (${(o.eg * 57.3).toFixed(1)} gr) burilish ${fx(o.bur)} yonga ${fx(o.yon)}`);
if (CHIQ) console.log(JSON.stringify({shot: SHOT, el: EL, rms: b.rms, kamera: {az: o.az, el: EL, d: o.d, fov: t.fov, ekran: [o.sx, o.sy]}, poza: {egilish: o.eg, burilish: o.bur, yonga: o.yon}, r: b.r}));
