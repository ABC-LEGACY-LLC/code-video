/* SHOTS 2 AND 3: HEAD POSE (+ CAMERA SCALE/SHIFT) TO THE HUMAN MARKS (pass 11, item 2).
   Targets: private/test/parts/human/target_fit_11.json (PRIVATE -- taken from the sample): Alonur's marks (R12=R13, R14, R17, R20, R22)
   and the detector corrected with Alonur's marks (chin, jaw in each frame; shot 2 front contour rows 81-110). The fits of pass 10
   had been pulled to a wrong target: the shot 2 "chin" was the height of the mouth line (24 px) -- our chin is not 6 px lower
   but ~16 px HIGHER; in shot 3 the nose, mouth and far eye had not been measured at all (9-14 px lower-left).
   Model side (no render, the machinery of test/fit_head10.mjs): part points -- 3D (personaj.js partPoints), pixel
   centre = integer (edge -0.5); chin and jaw -- the silhouette trace of the head surface (full azimuth, trace = silhouette - 1.0), chin -- the tip
   along the trace direction (shot 2 (0.71,0.71), shot 3 downward -- the same definition as the sample detector), jaw -- from the chin toward
   the ear; shot 2 front contour -- the rightmost point in each row.
   Weights: chin 2, eyes/nose/mouth 1, brow 0.3 (a person continues it under the hair); jaw trace 2, contour 1 (mean square).
   Modes (--mode): pose -- only an increment of (tilt, turn, sideways lean); scale -- + camera d and screen; full -- + az, el
   (az/el are nearly equivalent to the head's turn/tilt -- the camera shift carries a penalty: 10 deg = 1 px^2).
   node test/fit_pose11.mjs [--mode pose|scale|full] [--shot 2|3|23] [--iter 600] [--out test/pose11_fit.json] */
import {FRAME, model, error, nelder, check} from './face11.mjs';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, ITER = +arg('iter', 600), MODE = arg('mode', 'scale'), SHOTS = arg('shot', '23');
if (process.argv.includes('--check')) { check(); process.exit(0); }
/* parameters: [dPitch, dYaw, dSide, (d, sx, sy), (az, el)] -- increments, starting at 0 */
const PAR = [['dPitch', -0.7, 0.7, 0.05], ['dYaw', -0.7, 0.7, 0.05], ['dSide', -0.4, 0.4, 0.03]];
if (MODE !== 'pose') PAR.push(['dD', -3.5, 3.5, 0.3], ['dSx', -0.15, 0.15, 0.01], ['dSy', -0.15, 0.15, 0.01]);
if (MODE === 'full') PAR.push(['dAz', -25, 25, 3], ['dEl', -30, 30, 3]);
const place = (K, x) => {
  const v = Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
  const h = {...K.h0, tilt: K.h0.tilt + v.dPitch, turn: K.h0.turn + v.dYaw, sideways: (K.h0.sideways || 0) + v.dSide};
  const cam = {...K.cam, d: K.cam.d + (v.dD || 0), screen: [K.cam.screen[0] + (v.dSx || 0), K.cam.screen[1] + (v.dSy || 0)],
               az: K.cam.az + (v.dAz || 0), el: K.cam.el + (v.dEl || 0)};
  return {h, cam, v};
};
const result = {mode: MODE, shot: {}};
for (const s of SHOTS.split('').map(Number)) {
  const Ks = FRAME.filter(K => K.shot === s);
  const f = x => { let e = 0; for (const K of Ks) { const {h, cam} = place(K, x); e += error(K, h, cam); }
    const v = Object.fromEntries(PAR.map(([n], i) => [n, x[i]]));
    const penCam = ((v.dAz || 0) / 10) ** 2 + ((v.dEl || 0) / 10) ** 2;      // camera angle penalty (it trades off against the head pose)
    return Math.sqrt(e / Ks.length) + penCam; };
  const x0 = PAR.map(() => 0);
  const count = x => Object.fromEntries(Ks.map(K => { const {h, cam} = place(K, x); const r = error(K, h, cam, true); return [K.k, {rms: +Math.sqrt(r.e).toFixed(2), ...r.d}]; }));
  const f0 = f(x0), h0 = count(x0);
  let best = {x: x0, f: f0};
  for (let t = 0; t < 4; t++) {                                  // several starts (the turn may have a local minimum on either side)
    const st = x0.map((_, j) => j === 1 ? [0, -0.25, 0.25, -0.45][t] : j === 0 ? [0, 0.15, -0.1, 0.25][t] : 0);
    const r = nelder(f, st, PAR.map(p => p[3]), ITER, PAR.map(p => p[1]), PAR.map(p => p[2]));
    const r2 = nelder(f, r.x, PAR.map(p => p[3] / 3), ITER, PAR.map(p => p[1]), PAR.map(p => p[2]));
    console.log(`  shot ${s} start ${t}: f ${r2.f.toFixed(3)}  x ${r2.x.map(v => v.toFixed(3)).join(' ')}`);
    if (r2.f < best.f) best = r2;
  }
  const h1 = count(best.x);
  result.shot[s] = {before: {f: +f0.toFixed(3), frame: h0}, after: {f: +best.f.toFixed(3), frame: h1},
                    x: Object.fromEntries(PAR.map(([n], i) => [n, +best.x[i].toFixed(4)]))};
  console.log(`== shot ${s} (${MODE}): RMS ${f0.toFixed(2)} -> ${best.f.toFixed(2)} px  ${JSON.stringify(result.shot[s].x)}`);
  for (const K of Ks) console.log(`   k${K.k}: ${JSON.stringify(h0[K.k])}\n        -> ${JSON.stringify(h1[K.k])}`);
}
writeFileSync(ROOT + arg('out', `test/pose11_${MODE}.json`), JSON.stringify(result, null, 1));
