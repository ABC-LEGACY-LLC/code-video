/* SHOTS 2 AND 3: POSE + CAMERA -- RENDER SCORE (pass 11, item 2). test/fit_pose11.mjs fits the face (human marks) in node;
   here the same values are scored ON THE RENDER: the visible head IoU (private/test/sample_head7.json, per frame)
   and the figure mass (private/test/sample_figure8.json, 32x18 soft mask) -- in passes 8/9 the camera distance was fitted to these.
   Face (node) and mass (render) together: Nelder-Mead in --fit mode (slow: each score ~11 renders).
   node test/fit_pose11b.mjs --score '{"name":{"cam":{"1":{"d":7.4}},"pose":{"1":{"dYaw":-0.5}}}, ...}'
   node test/fit_pose11b.mjs --fit 2 [--iter 80] [--faceW 1] [--start '{...}']       (PRIVATE targets: from the sample)
   --facevis W (item 2, the second fit): + W x (hood over the sample's skin + our skin on the sample's dark area), relative
   to the sample's skin area (private/test/parts/human/face_view_11.json, PRIVATE). The first fit (pose11) did not see this: in
   shot 3 the hood edge covered 30% of the sample's face (before 6%), while the face points were in the right place.
   --iou2: head IoU without the lining (skin/neck + hair): in shot 3 no lining shows in the sample; when the lining counted as
   "head" the fit had filled the missing hair mass with lining (lining 18% -> 30% of the sample's head, hair+skin 73% -> 54%).
   --keyOnly: pose and camera fixed (solved with the human marks), only this shot's hood key.  */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {spawnSync} from 'child_process';
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
const FACEVIS_W = +arg('facevis', 0);
await pg.evaluate(r => { window.__viewFace = r; }, JSON.parse(readFileSync(ROOT + 'private/test/parts/human/face_view_11.json')));
const FIG = JSON.parse(readFileSync(ROOT + 'private/test/sample_figure8.json')), FIGT = [FIG.shot1, FIG.shot2, FIG.shot3];
const FR = {1: [11, 12], 2: [13, 15, 17, 19, 21]};                 // from 0: shot 2 12-13, shot 3 14,16,18,20,22
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
async function render(cfg, shots = [1, 2]) {
  await pg.evaluate(p => { window.__poseShot = p; }, cfg.pose || null);
  const fr = shots.flatMap(s => FR[s]);
  const r = await pg.evaluate(({cam, fr}) => window.hoodScore9(null, cam, fr), {cam: cfg.cam || null, fr});
  const out = {};
  for (const s of shots) out[s + 1] = {head: +(FR[s].reduce((a, f) => a + r.iou[f], 0) / FR[s].length).toFixed(3),
    ratio: +(FR[s].reduce((a, f) => a + r.ours[f] / Math.max(1, r.sample[f]), 0) / FR[s].length).toFixed(2), figure: +soft(r.B[s], FIGT[s]).toFixed(3),
    hoodF: +(FR[s].reduce((a, f) => a + r.hoodF[f], 0) / FR[s].length).toFixed(3), skinQ: +(FR[s].reduce((a, f) => a + r.skinQ[f], 0) / FR[s].length).toFixed(3)};
  return out;
}
/* face score -- node (test/fit_pose11.mjs --one): RMS px with the camera/pose offset */
function face(shot, x) {
  const r = spawnSync('node', [ROOT + 'test/fit_pose11.mjs', '--one', JSON.stringify({shot, x})], {encoding: 'utf8'});
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { console.error(r.stderr); return null; }
}
if (arg('score', null)) {
  const C = JSON.parse(arg('score'));
  for (const [name, cfg] of Object.entries(C)) console.log(name, JSON.stringify(await render(cfg)));
}
if (arg('fit', null)) {
  /* JOINTLY: pose + camera (d, screen, az, el) + this shot's hood key (placement; the key pose follows the new pose).
     Objective: face RMS/3 + 8 (1 - head IoU) + 3 (1 - figure) + camera angle penalty + a guard on shot 1 frames 10-11 (the
     shot 2 key is the closest to the last poses of shot 1 -- in pass 10 the 10 -> 11 scale jump had come back through it) */
  const S = +arg('fit'), si = S - 1, ITER = +arg('iter', 300), IOU2 = process.argv.includes('--iou2'), FK = process.argv.includes('--keyOnly');
  const {CLOTHES} = await import('../src/personaj.js');
  const {faceScore} = await import('./face11.mjs');
  const {FILMS} = await import('../src/film.js');
  const sh = FILMS.sample22.shotList[si], cam0 = sh.camera;
  const DEF = [['openness', 0.5, 2.6], ['openV0', -0.25, 0.30], ['openV1', 0.10, 0.70], ['pushZ', -1.2, 1.2], ['pushY', -0.8, 0.9], ['wholeZ', -0.8, 0.8],
               ['wholeY', -0.9, 0.6], ['yaw', -0.8, 0.8], ['eg', -0.4, 1.0], ['openA', 0.5, 2.0], ['openB', 0.5, 2.0], ['bandA', 0.5, 7.0],
               ['bandB', 0.5, 7.0], ['bandAlt', 0, 1.5], ['bandBlt', 0, 1.5], ['bandV', 0.40, 0.90]];
  const KP = [['dPitch', -0.6, 0.6, 0.04], ['dYaw', -0.8, 0.8, 0.05], ['dSide', -0.4, 0.4, 0.03], ['dD', -4, 3, 0.3], ['dSx', -0.15, 0.15, 0.01],
              ['dSy', -0.15, 0.15, 0.01], ['dAz', -25, 25, 3], ['dEl', -25, 25, 3]];
  const key0 = CLOTHES.hoodPose.key.map(k => ({p: k.p.slice(), d: {...k.d}}));
  const p0 = key0[si].p.slice();
  const BL = arg('start', null) ? JSON.parse(arg('start')) : {};
  const x0 = [...KP.map(([n]) => BL[n] || 0), ...DEF.map(([n]) => (BL.key && BL.key[n] !== undefined) ? BL.key[n] : key0[si].d[n])];
  const lo = [...KP.map(t => t[1]), ...DEF.map(t => t[1])], hi = [...KP.map(t => t[2]), ...DEF.map(t => t[2])];
  const q = [...KP.map(t => t[3]), ...DEF.map(([, a, b]) => 0.08 * (b - a))];
  const getCfg = x => {
    const v = Object.fromEntries(KP.map(([n], i) => [n, x[i]])), d = Object.fromEntries(DEF.map(([n], i) => [n, x[KP.length + i]]));
    const key = key0.map((k, i) => i === si ? {p: [p0[0] + v.dPitch, p0[1] + v.dYaw], d} : k);
    return {v, clothes: {hood: {...CLOTHES.hood}, hoodPose: {sigmaE: CLOTHES.hoodPose.sigmaE, sigmaB: CLOTHES.hoodPose.sigmaB, key}},
            cam: {[si]: {az: cam0.az + v.dAz, el: cam0.el + v.dEl, d: cam0.d + v.dD, screen: [cam0.screen[0] + v.dSx, cam0.screen[1] + v.dSy]}},
            pose: {[si]: {dPitch: v.dPitch, dYaw: v.dYaw, dSide: v.dSide}}};
  };
  const SNOW = S === 2 ? [9, 10] : process.argv.includes('--snow1') ? [0, 4, 8, 9, 10] : [];   // shot 1 10-11 (from 0: 9, 10); the shot 3 key also touches shot 1
  async function scoring(x) {
    const c = getCfg(x), fr = [...SNOW, ...FR[si]];
    await pg.evaluate(p => { window.__poseShot = p; }, c.pose);
    const r = await pg.evaluate(({k, cam, fr}) => window.hoodScore9(k, cam, fr), {k: c.clothes, cam: c.cam, fr});
    const head = FR[si].reduce((a, f) => a + (IOU2 ? r.iou2 : r.iou)[f], 0) / FR[si].length, fig = soft(r.B[si], FIGT[si]);
    const ratioMean = FR[si].reduce((a, f) => a + r.ours[f] / Math.max(1, r.sample[f]), 0) / FR[si].length;
    const q1 = SNOW.map(f => r.iou[f]), f1 = SNOW.length ? soft(r.B[0], FIGT[0]) : 0;
    const yz = faceScore(S, c.v);
    const kF = FR[si].reduce((a, f) => a + r.hoodF[f], 0) / FR[si].length, tQ = FR[si].reduce((a, f) => a + r.skinQ[f], 0) / FR[si].length;
    return {yz, head, fig, ratioMean, q1, f1, kF, tQ, c};
  }
  const b0 = await scoring(x0.map((t, i) => i < KP.length ? 0 : key0[si].d[DEF[i - KP.length][0]]));
  console.log(`INITIAL (current): face ${b0.yz.toFixed(2)} px | head IoU ${b0.head.toFixed(3)} (ratio ${b0.ratioMean.toFixed(2)}) | figure ${b0.fig.toFixed(3)} | hoodF ${b0.kF.toFixed(3)} skinQ ${b0.tQ.toFixed(3)} | shot 1 10-11 head ${b0.q1.map(v => v.toFixed(3))} figure ${b0.f1.toFixed(3)}`);
  let n = 0, optimum = null;
  const fx = async x => {
    const b = await scoring(x), v = b.c.v;
    const snow = SNOW.length ? 20 * b.q1.reduce((a, t, i) => a + Math.max(0, b0.q1[i] - t - 0.005), 0) + 20 * Math.max(0, b0.f1 - b.f1 - 0.005) : 0;
    const F = b.yz / 3 + 8 * (1 - b.head) + 3 * (1 - b.fig) + 0.5 * ((v.dAz / 15) ** 2 + (v.dEl / 15) ** 2) + snow + FACEVIS_W * (b.kF + b.tQ);
    if (!optimum || F < optimum.F) { optimum = {F, b, x: x.slice()};
      console.log(`  ${n}: F ${F.toFixed(3)} | face ${b.yz.toFixed(2)} | head ${b.head.toFixed(3)} (${b.ratioMean.toFixed(2)}) | figure ${b.fig.toFixed(3)} | hoodF ${b.kF.toFixed(3)} skinQ ${b.tQ.toFixed(3)} | snow ${snow.toFixed(3)} | ${KP.map(([nn], i) => nn + ' ' + x[i].toFixed(3)).join(' ')}`); }
    n++; return F;
  };
  /* async Nelder-Mead -- over the active dimensions (--keyOnly: the key only; pose/camera offset held at 0) */
  const AK = x0.map((_, i) => i).filter(i => !FK || i >= KP.length), xT = x0.slice();
  const opened = z => { const x = xT.slice(); AK.forEach((i, j) => { x[i] = z[j]; }); return x; };
  const f = async z => fx(opened(z));
  const z0 = AK.map(i => x0[i]), lz = AK.map(i => lo[i]), hz = AK.map(i => hi[i]), qz = AK.map(i => q[i]);
  const N = z0.length, cl = v => v.map((t, j) => Math.min(hz[j], Math.max(lz[j], t)));
  let P = [z0.slice()]; for (let i = 0; i < N; i++) { const pp = z0.slice(); pp[i] += qz[i]; P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, stall = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-4) { best = Fv[0]; stall = 0; } else if (++stall > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const c = optimum.b.c;
  const out = {shot: S, score: n, facevis: FACEVIS_W, initial: {face: b0.yz, head: b0.head, ratio: b0.ratioMean, figure: b0.fig, hoodF: b0.kF, skinQ: b0.tQ, q1: b0.q1, f1: b0.f1},
               result: {F: optimum.F, face: optimum.b.yz, head: optimum.b.head, ratio: optimum.b.ratioMean, figure: optimum.b.fig, hoodF: optimum.b.kF, skinQ: optimum.b.tQ, q1: optimum.b.q1, f1: optimum.b.f1},
               x: Object.fromEntries(KP.map(([nn], i) => [nn, +optimum.x[i].toFixed(4)])), key: {p: c.clothes.hoodPose.key[si].p.map(v => +v.toFixed(4)),
               d: Object.fromEntries(Object.entries(c.clothes.hoodPose.key[si].d).map(([k, v]) => [k, +v.toFixed(4)]))}, camera: c.cam[si]};
  { const ch = arg('out', `test/pose11b_shot${S}.json`); writeFileSync(ch.startsWith('/') ? ch : ROOT + ch, JSON.stringify(out, null, 1)); }
  console.log('FINAL', JSON.stringify(out.result), JSON.stringify(out.x));
}
await br.close(); srv.close();
