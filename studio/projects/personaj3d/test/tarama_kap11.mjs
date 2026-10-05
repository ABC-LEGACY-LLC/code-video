/* KAPYUSHON KALITI SKANI (11-o'tish, 2-ish): bitta shot kalitining parametrlarini birma-bir (yoki berilgan juftlarda)
   o'zgartirib, renderda: bosh IoU, figura, kapF (kapyushon misol terisi ustida), teriQ (bizning teri misolning qorong'i
   joyida). test/fit_poza11b.mjs Nelder-Mead 24 o'lchovda kapF 0.276 -> 0.231 da to'xtadi -- qaysi parametr teshik chetini
   yuzdan olib ketishini ko'rish uchun. Nishonlar MAXFIY (misol niqoblari).
   node test/tarama_kap11.mjs --shot 3 --par ochA,ochiq,bur --qadam 5            (har parametr: joriy +- oraliq, 5 nuqta)
   node test/tarama_kap11.mjs --shot 3 --nuqta '{"ochA":0.8,"bur":0.2}'            (bitta nuqta)
   --kadrlar 13,15,17,19,21  (0 dan; standart: shot kadrlari)  --shot1 (1-shot 0..10 ham baholanadi)
   --eski: topshirilgan 10-o'tish holati (2-, 3-shot pozasi, kamerasi va kalitlari -- test/log11/*_oldin11.js) ustiga qo'yiladi */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1&kapsoya=0`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'test/misol_bosh7.json')));
await pg.evaluate(r => { window.__yuzKor = r; }, JSON.parse(readFileSync(ROOT + 'test/qism/inson/yuz_kor_11.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const {KIYIM} = await import('../src/personaj.js');
const S = +arg('shot', 3), si = S - 1;
const FRS = {0: [0, 2, 4, 6, 8, 9, 10], 1: [11, 12], 2: [13, 15, 17, 19, 21]};
const FR = arg('kadrlar', null) ? arg('kadrlar').split(',').map(Number) : FRS[si];
const fr = process.argv.includes('--shot1') && si !== 0 ? [...FRS[0], ...FR] : FR;
const RANGE = {ochiq: [0.5, 2.6], ochV0: [-0.25, 0.30], ochV1: [0.10, 0.70], surZ: [-1.2, 1.2], surY: [-0.8, 0.9], butunZ: [-0.8, 0.8],
  butunY: [-0.9, 0.6], bur: [-0.8, 0.8], eg: [-0.4, 1.0], ochA: [0.5, 2.0], ochB: [0.5, 2.0], tasmaA: [0.5, 7.0], tasmaB: [0.5, 7.0],
  tasmaAlt: [0, 1.5], tasmaBlt: [0, 1.5], tasmaV: [0.40, 0.90]};
const kalit0 = KIYIM.kapPoza.kalit.map(k => ({p: k.p.slice(), d: {...k.d}}));
let KAM = null;
if (process.argv.includes('--eski')) {        // 10-o'tish (topshirilgan): film_oldin11.js / personaj_oldin11.js qiymatlari
  await pg.evaluate(() => { window.__pozaShot = {1: {dEg: 0.0506, dBur: 0.5838, dYon: 0.2404}, 2: {dEg: -0.0425, dBur: -0.1289, dYon: -0.1936}}; });
  KAM = {1: {az: 83.6, el: -5, d: 10.7994, ekran: [0.3865, 0.4228]}, 2: {az: 55, el: -30, d: 7.10, ekran: [0.34, 0.50]}};
  kalit0[1] = {p: [-0.014, 0], d: {ochiq: 1.1431, ochV0: -0.1773, ochV1: 0.4623, surZ: 0.6628, surY: 0.5806, butunZ: 0.638, butunY: -0.7793, bur: -0.0701, eg: 0.1462, ochA: 0.7151, ochB: 1.4308, tasmaA: 6.19, tasmaB: 1.7504, tasmaAlt: 0.774, tasmaBlt: 0.9576, tasmaV: 0.6688}};
  kalit0[2] = {p: [0.66, -0.02], d: {ochiq: 1.1997, ochV0: 0.1444, ochV1: 0.3752, surZ: 0.6148, surY: 0.6146, butunZ: -0.5094, butunY: -0.1936, bur: 0.4683, eg: 0.3202, ochA: 0.5908, ochB: 1.0522, tasmaA: 6.1641, tasmaB: 1.2592, tasmaAlt: 0.7696, tasmaBlt: 0.9016, tasmaV: 0.5404}};
}
const GLOB = {yopiq: [0, 1], rOrta: [-0.3, 0.5], rYelka: [0, 1], soyabon: [0, 1], r0: [0.9, 1.5], uzun: [3.5, 5]};   // KIYIM.kap (hamma shot uchun bitta)
async function baho(d) {
  const dk = Object.fromEntries(Object.entries(d).filter(([n]) => !(n in GLOB))), dg = Object.fromEntries(Object.entries(d).filter(([n]) => n in GLOB));
  const kalit = kalit0.map((k, i) => i === si ? {p: k.p, d: {...k.d, ...dk}} : k);
  const r = await pg.evaluate(({k, fr, kam}) => window.kapBaho9(k, kam, fr), {k: {kap: {...KIYIM.kap, ...dg}, kapPoza: {sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB, kalit}}, fr, kam: KAM});
  const m = (a, fs) => fs.reduce((s, f) => s + a[f], 0) / fs.length;
  const o = {bosh: m(r.iou, FR), bosh2: m(r.iou2, FR), fig: soft(r.B[si], FIGT[si]), kapF: m(r.kapF, FR), teriQ: m(r.teriQ, FR)};
  if (fr.length > FR.length) { o.s1bosh = m(r.iou, FRS[0]); o.s1bosh2 = m(r.iou2, FRS[0]); o.s1fig = soft(r.B[0], FIGT[0]); o.s1kapF = m(r.kapF, FRS[0]); o.s1teriQ = m(r.teriQ, FRS[0]); }
  return o;
}
const f3 = o => Object.entries(o).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(' | ');
const b0 = await baho({});
console.log(`shot ${S} joriy: ${f3(b0)}`);
if (arg('nuqta', null)) {
  const d = JSON.parse(arg('nuqta'));
  console.log('nuqta', arg('nuqta'), f3(await baho(d)));
  if (arg('rasm', null)) {                     // --rasm PAPKA: shu nuqtada har kadr rol renderi (320x180)
    const {mkdirSync} = await import('fs'); mkdirSync(arg('rasm'), {recursive: true});
    for (const f of FR) { await pg.evaluate(({k, f, kam}) => window.kapBaho9(k, kam, [f]), {k: {kap: {...KIYIM.kap}, kapPoza: {sigmaE: KIYIM.kapPoza.sigmaE, sigmaB: KIYIM.kapPoza.sigmaB,
      kalit: kalit0.map((k, i) => i === si ? {p: k.p, d: {...k.d, ...d}} : k)}}, f, kam: KAM});
      await pg.screenshot({path: `${arg('rasm')}/${String(f).padStart(3, '0')}.png`}); }
  }
}
if (arg('par', null)) {
  const n = +arg('qadam', 5);
  for (const p of arg('par').split(',')) {
    const [lo, hi] = RANGE[p] || GLOB[p], c = p in GLOB ? KIYIM.kap[p] : kalit0[si].d[p], span = +arg('oraliq', 0.35) * (hi - lo);
    const vs = Array.from({length: n}, (_, i) => Math.min(hi, Math.max(lo, c - span + 2 * span * i / (n - 1))));
    for (const v of vs) console.log(`  ${p} ${v.toFixed(3)}${Math.abs(v - c) < 1e-9 ? '*' : ' '}: ${f3(await baho({[p]: v}))}`);
  }
}
await br.close(); srv.close();
