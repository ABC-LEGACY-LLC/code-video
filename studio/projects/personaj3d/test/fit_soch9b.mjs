/* 9-o'tish, 2b QAYTA (fit_soch9b): 2-shot kamerasi kapyushon bilan birga qayta moslangach (d 10.32 -> 10.80, ekran
   [0.422, 0.474] -> [0.3865, 0.4228]; yuz konturi 9.81 -> 2.10 px) yuz misol yuzi ustiga tushdi va bitta 3/4 dam shaklidagi
   yaqin tutam misol yuz terisining 27 / 23 % ini yopdi (test/audit_misol/yuz_soch.py; soch9 da 5 / 3 %). Yorug' massa IoU
   buni sezmaydi (tutam kichik, yelpig'ich katta) -- shuning uchun maqsadga QOPLASH qo'shildi: rol renderida misol yuz
   terisi ustidagi bizning soch ulushi (k12, k13 o'rtachasi + 0.5 x k5), og'irlik --lam (standart 1).
   Oldingi fit (fit_soch9) manba o'zgarganda ifloslangan va to'xtatilgan -- natijasi qo'llanmagan.
   node test/fit_soch9b.mjs [--iter 60] [--lam 1] [--faqat-baho '{"x0":-0.45,...}']
   ---
   BITTA SOCH -- YAQIN YON TUTAMLARI UCH SHOTGA BIRGALIKDA (9-o'tish, 2b). Ko'rinish vazni (3/4 va profil dam shakllari,
   kamera burchagidan aralashma) olib tashlandi; bitta 3/4 shakl 2-shotda yuz oldiga tushadi (misol yorug'i bo'lmagan joyda
   bizning yorug' 25.7 -> 37.9 %). Bu yerda YAQIN tutamlar dizayni (SOCH.yaqin: ildiz, yo'l, jag' ortiga og'ish, sirtdan
   masofa, eni, og'irlik) bitta shakl sifatida 1- va 2-shotga birgalikda moslanadi: har kadrda misol va bizning yorug'
   massa niqobi IoU (test/audit_misol/soch_iou.py -- bir xil kod), shot o'rtachalari teng og'irlik bilan. Fizika, poza,
   kamera -- filmdagidek (render 480x270 -> 320x180).
   node test/fit_soch9.mjs [--iter 60] [--faqat-baho '{"x0":-0.45,...}'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {extname, join} from 'path';
import {execSync} from 'child_process';
import {SOCH} from '../src/personaj.js';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 60), LAM = +arg('lam', 1), VAZN = arg('vazn', 'teng'), ROOT = new URL('..', import.meta.url).pathname, TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/soch9bfit';
mkdirSync(TMP, {recursive: true});
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
/* parametrlar: guruh.nom -- yaqin tutamlar endi KESIM BO'YLAB (personaj.js yon(): ildiz x0/yIldiz yuz sirtida, uchi azimut phU
   ga t^pk bilan buriladi) + qisqa peshonaning yon tutamlari qancha yuqorida tugaydi (yUchYon). Qat'iy: dx -0.06, phD -0.1,
   yUch0 -1.0, osil 0.5 (shamol va osilish qoplashga deyarli ta'sir qilmaydi: shF 0 -> 0.260/0.234, osil 0.15 -> 0.256/0.226) */
const PAR = [['yaqin.x0', -0.85, -0.3], ['yaqin.yIldiz', 0.1, 0.75], ['yaqin.phU', -2.4, -0.6], ['yaqin.pk', 0.4, 3.0], ['yaqin.en0', 0.18, 0.45],
             ['yaqin.off', 0.0, 0.3], ['qisqa.yUchYon', 0.0, 0.8]];
const QATIY = {yaqin: {dx: -0.06, phD: -0.1, yUch0: -1.0, osil: 0.5}, qisqa: {}};
const ASL0 = {'yaqin.x0': -0.4577, 'yaqin.yIldiz': 0.75, 'yaqin.phU': -1.9669, 'yaqin.pk': 0.4036,   // boshlanish: 1-urinishning eng yaxshisi (20-baho, test/soch9b_toxtatilgan.log)
  'yaqin.en0': 0.31, 'yaqin.off': 0.0842, 'qisqa.yUchYon': 0.4498};
const B0 = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};   // --boshla '{"yaqin.x0":...}'
const ASL = Object.fromEntries(PAR.map(([n]) => [n, B0[n] !== undefined ? B0[n] : ASL0[n]]));
const ichki = o => { const r = {yaqin: {...QATIY.yaqin}, qisqa: {...QATIY.qisqa}}; for (const k in o) { const [g, n] = k.split('.'); r[g][n] = o[k]; } return r; };
let n = 0;
async function baho(o, papka = TMP + '/k') {
  const pg = await br.newPage({viewport: {width: 480, height: 270}});
  const qs = `style=anime&w=480&h=270&film=misol22&qorN=1&soch=${encodeURIComponent(JSON.stringify(ichki(o)))}`;
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
  mkdirSync(papka, {recursive: true});
  for (let k = 0; k <= 21; k++) { await pg.evaluate(k => window.kadr(k), k); const d = await pg.evaluate(() => window.tasvir()); writeFileSync(`${papka}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pg.close();
  const r = JSON.parse(execSync(`python3 ${ROOT}test/audit_misol/soch_iou.py ${papka} 1-22`).toString());
  const s1 = [...Array(11).keys()].map(i => r[i + 1].iou).reduce((a, b) => a + b) / 11, s2 = (r[12].iou + r[13].iou) / 2;
  const s3 = [...Array(9).keys()].map(i => r[i + 14].iou).reduce((a, b) => a + b) / 9;
  /* 10-o'tish: qoplash -- misolning ko'rinadigan yuzi (test/qism/qism_olch.py yuz_niqob) ustidagi bizning soch ulushi, rol
     renderida, har shotdan kadrlar (1, 5, 9, 10 | 12, 13 | 16, 20), shot o'rtachalari teng (test/qism/qoplash.py) */
  const pr = await br.newPage({viewport: {width: 480, height: 270}}), rp = papka + 'r';
  await pr.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs.replace('style=anime', 'style=rol')}`);
  await pr.waitForFunction(() => window.tayyor, null, {timeout: 60000});
  mkdirSync(rp, {recursive: true});
  for (const k of [0, 4, 8, 9, 11, 12, 15, 19]) { await pr.evaluate(k => window.kadr(k), k); const d = await pr.evaluate(() => window.tasvir()); writeFileSync(`${rp}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pr.close();
  const q = JSON.parse(execSync(`python3 ${ROOT}test/qism/qoplash.py ${rp} 1,5,9,10,12,13,16,20`).toString());
  const c1 = (q[1] + q[5] + q[9] + q[10]) / 4, c2 = (q[12] + q[13]) / 2, c3 = (q[16] + q[20]) / 2, cov = (c1 + c2 + c3) / 3;
  const W = VAZN === 'kadr' ? [11 / 22, 2 / 22, 9 / 22] : [1 / 3, 1 / 3, 1 / 3];     // kadr: ekranda turish bo'yicha
  return {f: 1 - (W[0] * s1 + W[1] * s2 + W[2] * s3) + LAM * (W[0] * c1 + W[1] * c2 + W[2] * c3), s1, s2, s3, cov, c12: c1, c13: c2, c5: c3, r};
}
const ob = x => Object.fromEntries(PAR.map(([nn, a, b], i) => [nn, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
if (arg('faqat-baho', null)) {
  const o = {...ASL, ...JSON.parse(arg('faqat-baho'))}, b = await baho(o);
  console.log(JSON.stringify(o), `-> 1-shot ${b.s1.toFixed(3)} 2-shot ${b.s2.toFixed(3)} 3-shot ${b.s3.toFixed(3)} yuzda soch shot 1/2/3 ${b.c12.toFixed(3)} / ${b.c13.toFixed(3)} / ${b.c5.toFixed(3)} f ${b.f.toFixed(4)}`);
} else {
  const f = async x => { const o = ob(x), b = await baho(o); if (++n % 5 === 0 || n === 1) console.log(`  ${n}: f ${b.f.toFixed(4)} (1-shot ${b.s1.toFixed(3)}, 2-shot ${b.s2.toFixed(3)}, 3-shot ${b.s3.toFixed(3)}; yuzda soch 1/2/3 ${b.c12.toFixed(3)}/${b.c13.toFixed(3)}/${b.c5.toFixed(3)}) ${JSON.stringify(o)}`); return b.f; };
  const x0 = PAR.map(([nn, a, b]) => (ASL[nn] - a) / (b - a)), N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -0.2 : 0.2))); P.push(pp); }
  let F = []; for (const pp of P) F.push(await f(pp));
  for (let k = 0; k < ITER; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
    writeFileSync(ROOT + arg('chiq', 'test/soch9b_fit.json'), JSON.stringify({asl: ASL, lam: LAM, vazn: VAZN, eng: ob(P[0]), f: F[0], iter: k}, null, 1));
  }
  const best = ob(P[0]), b = await baho(best);
  console.log('ASL', JSON.stringify(ASL)); console.log('ENG', JSON.stringify(best), `-> 1-shot ${b.s1.toFixed(3)} 2-shot ${b.s2.toFixed(3)} 3-shot ${b.s3.toFixed(3)} yuzda soch ${b.c12.toFixed(3)}/${b.c13.toFixed(3)}/${b.c5.toFixed(3)} f ${b.f.toFixed(4)}`);
  writeFileSync(ROOT + arg('chiq', 'test/soch9b_fit.json'), JSON.stringify({asl: ASL, lam: LAM, vazn: VAZN, eng: best, f: b.f, s1: b.s1, s2: b.s2, s3: b.s3, c12: b.c12, c13: b.c13, c5: b.c5, r: b.r}, null, 1));
}
await br.close(); srv.close();
