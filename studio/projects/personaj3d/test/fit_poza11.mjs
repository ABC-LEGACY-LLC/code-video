/* 2- VA 3-SHOT: BOSH POZASI (+ KAMERA MASSHTABI/SILJISHI) INSON BELGILARIGA (11-o'tish, 2-ish).
   Nishonlar: test/qism/inson/nishon_fit_11.json (MAXFIY -- misoldan olingan): Alonur belgilari (R12=R13, R14, R17, R20, R22)
   va Alonur belgilari bilan tuzatilgan detektor (iyak, jag' har kadrda; 2-shot old konturi 81-110 qatorlar). 10-o'tishdagi
   moslashlar noto'g'ri nishonga tortilgan edi: 2-shot "iyagi" og'iz chizig'i balandligi edi (24 px) -- bizning iyak 6 px pastda
   emas, ~16 px YUQORIDA; 3-shotda burun, og'iz, uzoq ko'z umuman o'lchanmagan edi (9-14 px pastda-chapda).
   Model tomoni (render yo'q, test/fit_bosh10.mjs dagi mashina): qism nuqtalari -- 3D (personaj.js qismNuqtalari), piksel
   markazi = butun son (chekka -0.5); iyak va jag' -- bosh sirti siluet izi (to'liq azimut, iz = siluet - 1.0), iyak -- iz
   yo'nalishi bo'yicha uchi (2-shot (0.71,0.71), 3-shot pastga -- misol detektori bilan bir xil ta'rif), jag' -- iyakdan quloq
   tomonga; 2-shot old konturi -- har qatorda eng o'ng.
   Og'irlik: iyak 2, ko'zlar/burun/og'iz 1, qosh 0.3 (odam soch ostidan davom ettiradi); jag' izi 2, kontur 1 (o'rtacha kvadrat).
   Rejimlar (--rejim): poza -- faqat (egilish, burilish, yonga) qo'shimchasi; masshtab -- + kamera d va ekran; toliq -- + az, el
   (az/el bosh burilishi/egilishi bilan deyarli teng -- kamera siljishi jarima bilan: 10 gr = 1 px^2).
   node test/fit_poza11.mjs [--rejim poza|masshtab|toliq] [--shot 2|3|23] [--iter 600] [--chiq test/poza11_fit.json] */
import {KADR, model, xato, nelder, tekshir} from './yuz11.mjs';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, ITER = +arg('iter', 600), REJIM = arg('rejim', 'masshtab'), SHOTS = arg('shot', '23');
if (process.argv.includes('--tekshir')) { tekshir(); process.exit(0); }
/* parametrlar: [dEgilish, dBurilish, dYonga, (d, sx, sy), (az, el)] -- qo'shimcha, boshlang'ich 0 */
const PAR = [['dEg', -0.7, 0.7, 0.05], ['dBur', -0.7, 0.7, 0.05], ['dYon', -0.4, 0.4, 0.03]];
if (REJIM !== 'poza') PAR.push(['dD', -3.5, 3.5, 0.3], ['dSx', -0.15, 0.15, 0.01], ['dSy', -0.15, 0.15, 0.01]);
if (REJIM === 'toliq') PAR.push(['dAz', -25, 25, 3], ['dEl', -30, 30, 3]);
const qoy = (K, x) => {
  const v = Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
  const h = {...K.h0, egilish: K.h0.egilish + v.dEg, burilish: K.h0.burilish + v.dBur, yonga: (K.h0.yonga || 0) + v.dYon};
  const kam = {...K.kam, d: K.kam.d + (v.dD || 0), ekran: [K.kam.ekran[0] + (v.dSx || 0), K.kam.ekran[1] + (v.dSy || 0)],
               az: K.kam.az + (v.dAz || 0), el: K.kam.el + (v.dEl || 0)};
  return {h, kam, v};
};
const natija = {rejim: REJIM, shot: {}};
for (const s of SHOTS.split('').map(Number)) {
  const Ks = KADR.filter(K => K.shot === s);
  const f = x => { let e = 0; for (const K of Ks) { const {h, kam} = qoy(K, x); e += xato(K, h, kam); }
    const v = Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
    const jar = ((v.dAz || 0) / 10) ** 2 + ((v.dEl || 0) / 10) ** 2;      // kamera burchagi jarimasi (bosh pozasi bilan almashinadi)
    return Math.sqrt(e / Ks.length) + jar; };
  const x0 = PAR.map(() => 0);
  const hisob = x => Object.fromEntries(Ks.map(K => { const {h, kam} = qoy(K, x); const r = xato(K, h, kam, true); return [K.k, {rms: +Math.sqrt(r.e).toFixed(2), ...r.d}]; }));
  const f0 = f(x0), h0 = hisob(x0);
  let best = {x: x0, f: f0};
  for (let t = 0; t < 4; t++) {                                  // bir necha boshlanish (burilish +- da mahalliy minimum bo'lishi mumkin)
    const st = x0.map((_, j) => j === 1 ? [0, -0.25, 0.25, -0.45][t] : j === 0 ? [0, 0.15, -0.1, 0.25][t] : 0);
    const r = nelder(f, st, PAR.map(p => p[3]), ITER, PAR.map(p => p[1]), PAR.map(p => p[2]));
    const r2 = nelder(f, r.x, PAR.map(p => p[3] / 3), ITER, PAR.map(p => p[1]), PAR.map(p => p[2]));
    console.log(`  shot ${s} boshlanish ${t}: f ${r2.f.toFixed(3)}  x ${r2.x.map(v => v.toFixed(3)).join(' ')}`);
    if (r2.f < best.f) best = r2;
  }
  const h1 = hisob(best.x);
  natija.shot[s] = {oldin: {f: +f0.toFixed(3), kadr: h0}, keyin: {f: +best.f.toFixed(3), kadr: h1},
                    x: Object.fromEntries(PAR.map(([n], i) => [n, +best.x[i].toFixed(4)]))};
  console.log(`== shot ${s} (${REJIM}): RMS ${f0.toFixed(2)} -> ${best.f.toFixed(2)} px  ${JSON.stringify(natija.shot[s].x)}`);
  for (const K of Ks) console.log(`   k${K.k}: ${JSON.stringify(h0[K.k])}\n        -> ${JSON.stringify(h1[K.k])}`);
}
writeFileSync(ROOT + arg('chiq', `test/poza11_${REJIM}.json`), JSON.stringify(natija, null, 1));
