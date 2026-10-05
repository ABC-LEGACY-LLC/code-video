/* BITTA BOSH SHAKLI -- UCH SHOTGA BIRGALIKDA (9-o'tish, 2a). Ko'z kartasi (w) va pastki yuz surishi (s) endi doimiy 0
   (test/fit_yuz9.mjs: w 0, s 0 jami eng kichik -- 2.70 px). Qolgan farq 1-shot 7..11 da: old kontur misolnikidan 3..10 px
   orqada (misol bu kadrlarda pastki yuzni oldinroq chizgan). Bu yerda bosh SHAKLINING o'zi (pastki yuz kesimi: en, daraja,
   o'rta chiziq chuqurligi) barcha kadrlarning nishonlariga BIRGALIKDA moslanadi; har kadr pozasi (animatsiya) ichkarida
   qayta moslanadi (Nelder-Mead, oldingi eng yaxshidan). 2-shot kamerasi (d, ekran) -- yuzga (shot kamerasi, ruxsat).
   Og'irlik -- ekranda turish (kadr soni). Nishonlar -- test/fit_yuz9.mjs dagi.
   node test/fit_bosh9.mjs [--iter 150] [--faqat-baho] */
import {BOSH, YUZ, yuzNuqta, boshShakli, kozNuqta} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 150);

const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310]}, KM = [1.75, 2.4];
const T1 = {3: {yaqin: [97.6 + KM[0], 46.3 + KM[1]], uzoq: [120.3, 49.3], ogiz: [125.5, 84.5], lab: [125.7, 91.0]},
  7: {yaqin: [98.4 + KM[0], 45.5 + KM[1]], uzoq: [123.0, 47.4], ogiz: [126.4, 83.7], lab: [127.7, 90.7]}, 8: {yaqin: [99.4 + KM[0], 44.7 + KM[1]], uzoq: [123.5, 46.4], ogiz: [127.2, 83.3], lab: [128.5, 90.0]},
  9: {yaqin: [100.9 + KM[0], 44.4 + KM[1]], uzoq: [124.3, 46.8], ogiz: [128.3, 83.1], lab: [130.0, 89.8]}, 10: {yumuq: [107.8 + KM[0], 52.0], ogiz: [134.7, 87.0]}, 11: {yumuq: [112.5 + KM[0], 53.9], ogiz: [138.4, 89.7]}};
const Q1 = {3: [[66.6, 130.3], [76.6, 131.7], [98.6, 129.6]], 7: [[65.5, 132.9], [75.5, 134.5], [97.5, 132.4]], 8: [[64.7, 133.7], [74.7, 135.1], [96.7, 132.9]], 9: [[64.4, 135.1], [74.4, 135.8], [96.4, 134.0]],
            10: [[72.0, 138.6], [82.0, 138.8], [104.0, 145.4]], 11: [[73.9, 143.0], [83.9, 143.6], [105.9, 143.7]]};
const YON1 = {3: 0, 7: -0.03, 8: -0.03, 9: -0.03, 10: 0.15, 11: 0.15}, SONI1 = {3: 6, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1};
const Q2 = [[70,157],[72,159],[74,158.5],[76,157],[78,156],[80,155],[82,155],[84,156],[86,159.5],[88,161.5],[90,164.5],[92,165.5],[94,164.5],[96,163],[98,163],[100,162.5],[102,161],[104,161],[106,160.5],[108,159.5],[110,159.5]];
const J2 = [[146, 114], [150, 113.5], [154, 113]], KOZ2 = [138.5, 78.5];
const K3 = {az: 55, el: -30, fov: 29, d: 7.10, ekran: [0.34, 0.50]}, H3 = {egilish: 0.68, burilish: 0.03, yonga: -0.05, chokish: -0.02, orqaga: -0.02};
const KOZ3 = [155.7, 112.0], Q3 = [[144, 167], [146, 161], [148, 158], [150, 157], [152, 153], [154, 153], [156, 151]], J3 = [[146, 158], [150, 158]];

const sirt = (a0, a1, na, p0, p1, np) => { const S = []; for (let j = 0; j <= na; j++) { const al = a0 + (a1 - a0) * j / na; for (let i = 0; i <= np; i++) { const ph = p0 + (p1 - p0) * i / np; S.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true)); } } return S; };
/* qator/ustun chetlari: bir o'tishda (nuqtalar bir marta proyeksiya qilinadi) */
function chetlar(S, p, qatorlar, ustunlar, tq, tu) {
  const q = qatorlar.map(() => -1e9), u = ustunlar.map(() => -1e9);
  for (const s of S) { const v = p(s);
    for (let i = 0; i < qatorlar.length; i++) if (Math.abs(v[1] - qatorlar[i]) < tq && v[0] > q[i]) q[i] = v[0];
    for (let i = 0; i < ustunlar.length; i++) if (Math.abs(v[0] - ustunlar[i]) < tu && v[1] > u[i]) u[i] = v[1]; }
  return {q, u};
}
const e2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f);
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-6) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}

/* har kadr pozasi (oldingi eng yaxshidan boshlanadi) */
const POZA = {3: [-0.32, -0.12], 7: [-0.33, -0.10], 8: [-0.34, -0.07], 9: [-0.34, -0.03], 10: [-0.28, 0.12], 11: [-0.24, 0.20], s2: [-0.081, 0, 0, 12.88, 0.411, 0.447], s3: [0.68, 0.02]};
function kadrlar(bat = false) {
  const S1 = sirt(-Math.PI / 2, 0.35, 150, -0.4, 1.4, 60), S2 = sirt(-Math.PI / 2, 0.7, 140, -1.9, 1.9, 80), S3 = sirt(-Math.PI / 2, 0.1, 160, -1.9, 1.9, 110);
  const H = YUZ.kozH, L = {yaqin: kozNuqta(0), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(-0.03, YUZ.ogizY), lab: yuzNuqta(0, YUZ.ogizY + YUZ.labSoyaY), yumuq: kozNuqta(0, 0, -0.1 * H)};
  const out = {}; let jami = 0;
  for (const k of [3, 7, 8, 9, 10, 11]) {
    const qy = Q1[k].map(t => t[0]);
    const f = x => { const p = proyektor(K1, {egilish: x[0], burilish: x[1], yonga: YON1[k]}); let e = 0;
      for (const n in T1[k]) e += ((n === 'yaqin' || n === 'yumuq') ? 3 : 1) * e2(p(L[n]), T1[k][n]);
      const c = chetlar(S1, p, qy, [], 0.75, 0); Q1[k].forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); return e; };
    const r = nelder(f, POZA[k], [0.02, 0.02], 60, [-0.6, -0.4], [0.1, 0.5]); POZA[k] = r.x;
    const n = Object.keys(T1[k]).length + 2 + Q1[k].length; jami += SONI1[k] * r.f / n;
    if (bat) { const p = proyektor(K1, {egilish: r.x[0], burilish: r.x[1], yonga: YON1[k]}), c = chetlar(S1, p, qy, [], 0.75, 0);
      out[k] = {eg: +r.x[0].toFixed(3), bur: +r.x[1].toFixed(3), nuqta: Object.fromEntries(Object.keys(T1[k]).map(nn => [nn, p(L[nn]).map((v, i) => +(v - T1[k][nn][i]).toFixed(1))])), kontur: c.q.map((v, i) => +(v - Q1[k][i][1]).toFixed(1))}; }
  }
  { const qy = Q2.map(t => t[0]), ux = J2.map(t => t[0]);
    const f = x => { const p = proyektor({az: 83.6, el: -5, fov: 27, d: x[3], ekran: [x[4], x[5]]}, {egilish: x[0], burilish: x[1], yonga: x[2]}), c = chetlar(S2, p, qy, ux, 0.6, 0.6);
      let e = 0; Q2.forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); J2.forEach(([x0, y], i) => { e += (c.u[i] - y) ** 2; });   // ko'z -- moslashga kirmaydi (profil ko'zi -- misolning 2D usuli, qoldiq sifatida o'lchanadi)
      return e + (x[1] / 0.02) ** 2 + (x[2] / 0.02) ** 2; };
    const r = nelder(f, POZA.s2, [0.02, 0.01, 0.01, 0.3, 0.01, 0.01], 120, [-0.4, -0.2, -0.2, 9, 0.2, 0.2], [0.3, 0.2, 0.2, 16, 0.7, 0.7]); POZA.s2 = r.x;
    jami += 2 * r.f / (Q2.length + J2.length);
    if (bat) { const x = r.x, p = proyektor({az: 83.6, el: -5, fov: 27, d: x[3], ekran: [x[4], x[5]]}, {egilish: x[0], burilish: x[1], yonga: x[2]}), c = chetlar(S2, p, qy, ux, 0.6, 0.6);
      out.s2 = {poza: x.slice(0, 3).map(v => +v.toFixed(3)), kamera: {d: +x[3].toFixed(3), ekran: [+x[4].toFixed(4), +x[5].toFixed(4)]}, koz: p(L.yumuq).map((v, i) => +(v - KOZ2[i]).toFixed(1)),
        kontur: c.q.map((v, i) => +(v - Q2[i][1]).toFixed(1)), jag: c.u.map((v, i) => +(v - J2[i][1]).toFixed(1))}; } }
  { const qy = Q3.map(t => t[0]), ux = J3.map(t => t[0]);
    const f = x => { const p = proyektor(K3, {...H3, egilish: x[0], burilish: x[1]}), c = chetlar(S3, p, qy, ux, 0.5, 0.5);
      let e = 2.25 * e2(p(L.yaqin), KOZ3); Q3.forEach(([y, x0], i) => { e += (c.q[i] - x0) ** 2; }); J3.forEach(([x0, y], i) => { e += (c.u[i] - y) ** 2; }); return e + (x[1] / 0.15) ** 2; };
    const r = nelder(f, POZA.s3, [0.02, 0.02], 60, [0.4, -0.4], [0.9, 0.4]); POZA.s3 = r.x;
    jami += 9 * r.f / (2 + Q3.length + J3.length);
    if (bat) { const p = proyektor(K3, {...H3, egilish: r.x[0], burilish: r.x[1]}), c = chetlar(S3, p, qy, ux, 0.5, 0.5);
      out.s3 = {eg: +r.x[0].toFixed(3), bur: +r.x[1].toFixed(3), koz: p(L.yaqin).map((v, i) => +(v - KOZ3[i]).toFixed(1)), kontur: c.q.map((v, i) => +(v - Q3[i][1]).toFixed(1)), jag: c.u.map((v, i) => +(v - J3[i][1]).toFixed(1))}; } }
  return bat ? {jami: Math.sqrt(jami / 22), out} : Math.sqrt(jami / 22);
}

const SHAKL = [['ogizW', 0.45, 0.75], ['iyakW', 0.08, 0.32], ['kozP', 2.0, 3.3], ['ogizP', 1.4, 2.8], ['jagP', 1.4, 2.8], ['ogizZ', 0.90, 1.10], ['iyakZ', 0.80, 1.02]];
const ASL = Object.fromEntries(SHAKL.map(([n]) => [n, BOSH[n]]));
const qoy = x => SHAKL.forEach(([n], i) => { BOSH[n] = x[i]; });
BOSH.surish = 0; BOSH.profilW = 0;
const b0 = kadrlar(true); kadrlar(); const b0b = kadrlar(true);
console.log('BOSHLANG\'ICH shakl (joriy bosh):', JSON.stringify(ASL), '-> jami RMS', b0b.jami.toFixed(3));
console.log(JSON.stringify(b0b.out));
if (!process.argv.includes('--faqat-baho')) {
  let n = 0;
  const f = x => { qoy(x); const v = kadrlar(); if (++n % 10 === 0) console.log(`  ${n}: ${v.toFixed(3)} ${x.map(t => t.toFixed(3)).join(' ')}`); return v; };
  const x0 = SHAKL.map(([nn]) => ASL[nn]);
  const r = nelder(f, x0, SHAKL.map(([, a, b]) => 0.08 * (b - a)), ITER, SHAKL.map(t => t[1]), SHAKL.map(t => t[2]));
  qoy(r.x); kadrlar(); const b1 = kadrlar(true);
  console.log('MOSLANGAN shakl:', JSON.stringify(Object.fromEntries(SHAKL.map(([nn], i) => [nn, +r.x[i].toFixed(4)]))), '-> jami RMS', b1.jami.toFixed(3));
  console.log(JSON.stringify(b1.out));
  writeFileSync(new URL('./bosh9_fit.json', import.meta.url), JSON.stringify({asl: ASL, boshlangich: b0b, shakl: Object.fromEntries(SHAKL.map(([nn], i) => [nn, r.x[i]])), natija: b1}, null, 1));
}
