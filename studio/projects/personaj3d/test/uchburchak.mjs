/* UCHBURCHAKLASH -- misolning yuz nuqtalari ikki ko'rinishdan (1-shot 3/4, 2-shot profil) bosh fazosida qayerda
   ekanini topish. Kamera va poza QAT'IY (1-shot: figura moslangan kamera; 2-shot: poza qat'iy, kamera masofasi va
   surilishi erkin -- 2-shot figura moslashda qatnashmagan). Noma'lumlar: yaqin ko'z (x, y, z), burun uchi, og'iz
   o'rtasi, iyak burchagi (o'rta chiziqda: y, z). Qoldiq -- ikki ko'rinish bitta qattiq yuz bilan tushuntirilishi
   mumkinmi (izchillik). Bu shakl emas, faqat nuqtalar: bosh modeli shu nuqtalardan o'tadigan qilib loyihalanadi.
   Misol nuqtalari (320x180, L jadvallaridan, 4-o'tish; +-1..2 px):
     3-tasvir: yaqin ko'z (97.6, 46.3), uzoq ko'z (121, 48.5), og'iz o'rtasi (125.5, 84.5) -- chiziq (118,86)->(128,84),
       o'rtasi lab soyasi ustida (125.5, 91); burun uchi (130.5, 60) -- uzoq ko'z ichki burchagidan (120, 56) old
       konturga tushadigan rim yoyi shu yerda tugaydi (burunning uzoq tomon siluetasi); pastdan ko'rilganda burun
       ko'zga yaqin chiqadi (oldinga chiqqan nuqta ekranda yuqoriroq);
       iyak burchagi (129.5, 107.5) -- tik old kontur x 130 va gorizontal jag' chizig'i y 108.5 uchrashadi
     12-tasvir: yaqin ko'z (137, 77.5), burun uchi (163.5, 92), og'iz kesigi (161, 102), iyak burchagi (156, 112)
   node test/uchburchak.mjs [--eg1 -0.30 --bur1 -0.15] */
import {proyektor} from './proyeksiya.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const EG1 = arg('eg1', -0.30), BUR1 = arg('bur1', -0.15), EG2 = arg('eg2', 0.02), BUR2 = arg('bur2', 0.12);
export const M1 = {yaqin: [97.6, 46.3], uzoq: [121, 48.5], ogiz: [125.5, 84.5], burun: [130.5, 60], iyak: [129.5, 107.5]};
export const M2 = {yaqin: [137, 77.5], burun: [163.5, 92], ogiz: [161, 102], iyak: [156, 112]};
const VAZN = {burun1: arg('burun1', 1), shot2: arg('shot2', 1)};
const K1 = {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310], markaz: [0, 0, 0]};

function nuqtalar(x) {   // x: [xe, ye, ze, yn, zn, ym, zm, yc, zc, sx2, sy2, d2]
  return {yaqin: [-x[0], x[1], x[2]], uzoq: [x[0], x[1], x[2]], burun: [0, x[3], x[4]], ogiz: [0, x[5], x[6]], iyak: [0, x[7], x[8]]};
}
function qoldiq(x) {
  const L = nuqtalar(x), r = [];
  const p1 = proyektor(K1, {egilish: EG1, burilish: BUR1});
  const p2 = proyektor({az: 84, el: -4, d: x[11], fov: 27, ekran: [x[9], x[10]], markaz: [0, 0, 0]}, {egilish: EG2, burilish: BUR2});
  for (const k in M1) { const s = p1(L[k]), w = k === 'burun' ? VAZN.burun1 : 1; r.push(w * (s[0] - M1[k][0]), w * (s[1] - M1[k][1])); }
  for (const k in M2) { const s = p2(L[k]); r.push(VAZN.shot2 * (s[0] - M2[k][0]), VAZN.shot2 * (s[1] - M2[k][1])); }
  return r;
}
// Levenberg-Marquardt (sonli Yakobian)
function lm(x0, iter = 200) {
  let x = x0.slice(), r = qoldiq(x), f = r.reduce((a, t) => a + t * t, 0), lam = 1e-2;
  for (let it = 0; it < iter; it++) {
    const J = x.map((_, j) => { const e = 1e-5, xp = x.slice(); xp[j] += e; const rp = qoldiq(xp); return rp.map((t, i) => (t - r[i]) / e); });
    const n = x.length, A = Array.from({length: n}, () => new Array(n).fill(0)), g = new Array(n).fill(0);
    for (let a = 0; a < n; a++) { for (let b = 0; b < n; b++) for (let i = 0; i < r.length; i++) A[a][b] += J[a][i] * J[b][i]; for (let i = 0; i < r.length; i++) g[a] += J[a][i] * r[i]; }
    let ok = false;
    for (let t = 0; t < 20 && !ok; t++) {
      const B = A.map((row, a) => row.map((v, b) => v + (a === b ? lam * (A[a][a] + 1e-9) : 0)));
      const dx = yech(B, g.map(v => -v)), xn = x.map((v, j) => v + dx[j]), rn = qoldiq(xn), fn = rn.reduce((a, t) => a + t * t, 0);
      if (fn < f) { x = xn; r = rn; f = fn; lam *= 0.3; ok = true; } else lam *= 10;
    }
    if (!ok) break;
  }
  return {x, r, f};
}
function yech(A, b) {   // Gauss
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) { const k = M[i][c] / M[c][c]; for (let j = c; j <= n; j++) M[i][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}

const x0 = [0.35, -0.17, 0.85, -0.45, 1.05, -0.70, 1.0, -1.05, 0.9, 0.31, 0.39, 9.51];
const {x, r, f} = lm(x0);
const L = nuqtalar(x), fx = v => v.map(t => t.toFixed(3)).join(', ');
console.log(`poza1 egilish ${EG1} burilish ${BUR1} | poza2 egilish ${EG2} burilish ${BUR2}`);
console.log('qoldiq RMS px', Math.sqrt(f / r.length).toFixed(2), ' har nuqta:', r.map(t => t.toFixed(1)).join(' '));
for (const k of ['yaqin', 'burun', 'ogiz', 'iyak']) console.log('  %s  (%s)', k.padEnd(6), fx(L[k]));
console.log('  2-shot kamera: ekran [%s, %s] d %s', x[9].toFixed(3), x[10].toFixed(3), x[11].toFixed(2));
console.log('  burun ko\'zdan oldinda %s, og\'iz %s, iyak %s; ko\'z->iyak tik %s', (x[4] - x[2]).toFixed(3), (x[6] - x[2]).toFixed(3), (x[8] - x[2]).toFixed(3), (x[1] - x[7]).toFixed(3));
