/* HOOD KEY SCAN (pass 11, item 2): changes the parameters of one shot key one at a time (or in given pairs)
   and reads, in the render: head IoU, figure, hoodF (hood over the sample's skin), skinQ (our skin on a dark
   spot of the sample). test/fit_pose11b.mjs Nelder-Mead in 24 dimensions stopped at hoodF 0.276 -> 0.231 -- this shows which
   parameter takes the opening's edge off the face. The targets are PRIVATE (the sample's masks).
   node test/scan_hood11.mjs --shot 3 --par openA,openness,yaw --step 5            (each parameter: current +- span, 5 points)
   node test/scan_hood11.mjs --shot 3 --point '{"openA":0.8,"yaw":0.2}'            (one point)
   --frames 13,15,17,19,21  (from 0; default: the shot's frames)  --shot1 (shot 1 0..10 is scored too)
   --old: applies the delivered pass 10 state (pose, camera and keys of shots 2, 3 -- test/log11/*_before11.js) on top */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const W = 320, H = 180, pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('pageerror', e => console.error('page error:', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=${W}&h=${H}&film=sample22&snowN=1&hoodShadow=0`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
await pg.evaluate(r => { window.__ref7 = r; }, JSON.parse(readFileSync(ROOT + 'private/test/sample_head7.json')));
await pg.evaluate(r => { window.__viewFace = r; }, JSON.parse(readFileSync(ROOT + 'private/test/parts/human/face_view_11.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const {CLOTHES} = await import('../src/personaj.js');
const S = +arg('shot', 3), si = S - 1;
const FRS = {0: [0, 2, 4, 6, 8, 9, 10], 1: [11, 12], 2: [13, 15, 17, 19, 21]};
const FR = arg('frames', null) ? arg('frames').split(',').map(Number) : FRS[si];
const fr = process.argv.includes('--shot1') && si !== 0 ? [...FRS[0], ...FR] : FR;
const RANGE = {openness: [0.5, 2.6], openV0: [-0.25, 0.30], openV1: [0.10, 0.70], pushZ: [-1.2, 1.2], pushY: [-0.8, 0.9], wholeZ: [-0.8, 0.8],
  wholeY: [-0.9, 0.6], yaw: [-0.8, 0.8], eg: [-0.4, 1.0], openA: [0.5, 2.0], openB: [0.5, 2.0], bandA: [0.5, 7.0], bandB: [0.5, 7.0],
  bandAlt: [0, 1.5], bandBlt: [0, 1.5], bandV: [0.40, 0.90]};
const key0 = CLOTHES.hoodPose.key.map(k => ({p: k.p.slice(), d: {...k.d}}));
let CAM = null;
if (process.argv.includes('--old')) {        // pass 10 (delivered): the values of film_before11.js / personaj_before11.js
  await pg.evaluate(() => { window.__poseShot = {1: {dPitch: 0.0506, dYaw: 0.5838, dSide: 0.2404}, 2: {dPitch: -0.0425, dYaw: -0.1289, dSide: -0.1936}}; });
  CAM = {1: {az: 83.6, el: -5, d: 10.7994, screen: [0.3865, 0.4228]}, 2: {az: 55, el: -30, d: 7.10, screen: [0.34, 0.50]}};
  key0[1] = {p: [-0.014, 0], d: {openness: 1.1431, openV0: -0.1773, openV1: 0.4623, pushZ: 0.6628, pushY: 0.5806, wholeZ: 0.638, wholeY: -0.7793, yaw: -0.0701, eg: 0.1462, openA: 0.7151, openB: 1.4308, bandA: 6.19, bandB: 1.7504, bandAlt: 0.774, bandBlt: 0.9576, bandV: 0.6688}};
  key0[2] = {p: [0.66, -0.02], d: {openness: 1.1997, openV0: 0.1444, openV1: 0.3752, pushZ: 0.6148, pushY: 0.6146, wholeZ: -0.5094, wholeY: -0.1936, yaw: 0.4683, eg: 0.3202, openA: 0.5908, openB: 1.0522, bandA: 6.1641, bandB: 1.2592, bandAlt: 0.7696, bandBlt: 0.9016, bandV: 0.5404}};
}
const GLOB = {shut: [0, 1], rMid: [-0.3, 0.5], rShoulder: [0, 1], visor: [0, 1], r0: [0.9, 1.5], long: [3.5, 5]};   // CLOTHES.hood (one for all shots)
async function score(d) {
  const dk = Object.fromEntries(Object.entries(d).filter(([n]) => !(n in GLOB))), dg = Object.fromEntries(Object.entries(d).filter(([n]) => n in GLOB));
  const key = key0.map((k, i) => i === si ? {p: k.p, d: {...k.d, ...dk}} : k);
  const r = await pg.evaluate(({k, fr, cam}) => window.hoodScore9(k, cam, fr), {k: {hood: {...CLOTHES.hood, ...dg}, hoodPose: {sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB, key}}, fr, cam: CAM});
  const m = (a, fs) => fs.reduce((s, f) => s + a[f], 0) / fs.length;
  const o = {head: m(r.iou, FR), head2: m(r.iou2, FR), fig: soft(r.B[si], FIGT[si]), hoodF: m(r.hoodF, FR), skinQ: m(r.skinQ, FR)};
  if (fr.length > FR.length) { o.s1head = m(r.iou, FRS[0]); o.s1head2 = m(r.iou2, FRS[0]); o.s1fig = soft(r.B[0], FIGT[0]); o.s1hoodF = m(r.hoodF, FRS[0]); o.s1skinQ = m(r.skinQ, FRS[0]); }
  return o;
}
const f3 = o => Object.entries(o).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(' | ');
const b0 = await score({});
console.log(`shot ${S} current: ${f3(b0)}`);
if (arg('point', null)) {
  const d = JSON.parse(arg('point'));
  console.log('point', arg('point'), f3(await score(d)));
  if (arg('picture', null)) {                     // --picture FOLDER: a role render (320x180) of every frame at this point
    const {mkdirSync} = await import('fs'); mkdirSync(arg('picture'), {recursive: true});
    for (const f of FR) { await pg.evaluate(({k, f, cam}) => window.hoodScore9(k, cam, [f]), {k: {hood: {...CLOTHES.hood}, hoodPose: {sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB,
      key: key0.map((k, i) => i === si ? {p: k.p, d: {...k.d, ...d}} : k)}}, f, cam: CAM});
      await pg.screenshot({path: `${arg('picture')}/${String(f).padStart(3, '0')}.png`}); }
  }
}
if (arg('par', null)) {
  const n = +arg('step', 5);
  for (const p of arg('par').split(',')) {
    const [lo, hi] = RANGE[p] || GLOB[p], c = p in GLOB ? CLOTHES.hood[p] : key0[si].d[p], span = +arg('span', 0.35) * (hi - lo);
    const vs = Array.from({length: n}, (_, i) => Math.min(hi, Math.max(lo, c - span + 2 * span * i / (n - 1))));
    for (const v of vs) console.log(`  ${p} ${v.toFixed(3)}${Math.abs(v - c) < 1e-9 ? '*' : ' '}: ${f3(await score({[p]: v}))}`);
  }
}
await br.close(); srv.close();
