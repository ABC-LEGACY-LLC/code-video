/* CAMERA TEST (pass 9): 3D CONSISTENCY. Pose and time are held (?time=), only the camera moves (film.js: camPath --
   continuous between the shot 1 -> 2 -> 3 cameras of sample22; orbit -- 360 deg around the head). In a 3D-consistent world
   nothing changes in object space: the world points of every part (main.js window.objects) stay as in image 0.
   Measured on every image, for every part, with the CURRENT camera:
     relative -- |proj(X_n) - proj(X_0)|: how far (px) the part is from where it would stand if it were a rigid 3D body;
     step     -- |proj(X_n) - proj(X_{n-1})|: the non-rigid change within one step (a jump -- one big step,
               a slide -- a run of small steps).
   px -- at the 320x180 working size (the sample's size). Background "top" (sky gradient and snow density direction) --
   deviation from the world's top, degrees. A point counts if it is inside the frame (with a 25 % margin) and in front of the camera.
   CALIBRATION (--calibrate): ?patch=0 -- every value tied to the camera/shot is frozen at image 0: every part must read 0
   (if not -- there is a patch we do not know about, or the tool is wrong); ?patch=0&synthetic=10 -- from image 10 the hood
   moves +0.1 in world x: the hood's relative value equals the one an independent pinhole-camera model in Node gives
   (within 1 %), step only at image 10, the other parts must be 0.
   node test/camera_test9.mjs --film camPath|orbit [--style role] [--w 640 --h 360] [--png FOLDER] [--extra "..."] [--out F.json]
   node test/camera_test9.mjs --calibrate */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {FILMS} from '../src/film.js';
import {chrome} from '../chrome.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const PART = ['skin', 'hairInner', 'hair', 'neck', 'hood', 'cloak', 'eye', 'snow'];

async function run({film, style = 'role', W = 640, H = 360, extra = '', png = null}) {
  const srv = createServer((q, r) => {
    const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
  }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  const br = await chromium.launch({executablePath: chrome(),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const pg = await br.newPage({viewport: {width: W, height: H}});
  pg.on('pageerror', e => console.error('page error:', e.message));
  const qs = ['style=' + style, 'w=' + W, 'h=' + H, 'film=' + film, 'time=0.5', extra].filter(Boolean).join('&');
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
  if (png) mkdirSync(png, {recursive: true});
  const N = FILMS[film].shotList.length, k = 320 / W, out = [];
  let O0 = null, Op = null;
  for (let n = 0; n < N; n++) {
    const r = await pg.evaluate(([n, O0, Op]) => {
      window.frame(n);
      const o = window.objects(), res = {top: o.top, count: {}};
      for (const c of Object.keys(o)) if (c !== 'top') {
        res.count[c] = o[c].length / 3;
        res[c] = {P: window.proj(o[c]), R: O0 ? window.proj(O0[c]) : null, S: Op ? window.proj(Op[c]) : null};
      }
      return {o, res};
    }, [n, O0, Op]);
    if (png) { const d = await pg.evaluate(() => window.image()); writeFileSync(`${png}/${String(n).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
    if (!O0) O0 = r.o;
    const e = {n, name: FILMS[film].shotList[n].name, camera: FILMS[film].shotList[n].camera, part: {}};
    for (const c of PART) {
      const {P, R, S} = r.res[c];
      const st = (Q) => {
        if (!Q) return null;
        if (Q.length !== P.length) return {error: 'point count changed ' + Q.length / 3 + ' -> ' + P.length / 3};
        const d = [];
        for (let i = 0; i < P.length; i += 3) {
          const ok = (x, y, z) => z > -1 && z < 1 && x > -0.25 * W && x < 1.25 * W && y > -0.25 * H && y < 1.25 * H;
          if (!ok(P[i], P[i + 1], P[i + 2]) || !ok(Q[i], Q[i + 1], Q[i + 2])) continue;
          d.push(Math.hypot(P[i] - Q[i], P[i + 1] - Q[i + 1]) * k);
        }
        if (!d.length) return {n: 0};
        d.sort((a, b) => a - b);
        const q = f => d[Math.min(d.length - 1, Math.floor(f * d.length))];
        return {n: d.length, med: q(0.5), p95: q(0.95), max: d[d.length - 1]};
      };
      e.part[c] = {relative: n ? st(R) : {n: P.length / 3, med: 0, p95: 0, max: 0}, step: n ? st(S) : null};
    }
    const t = r.o.top, ang = v => Math.acos(Math.max(-1, Math.min(1, v[1] / Math.hypot(...v)))) * 180 / Math.PI;
    e.top = {deviation: ang(t), step: Op ? Math.acos(Math.max(-1, Math.min(1, (t[0] * Op.top[0] + t[1] * Op.top[1] + t[2] * Op.top[2]) / Math.hypot(...t) / Math.hypot(...Op.top)))) * 180 / Math.PI : 0};
    out.push(e);
    Op = r.o;
    if (n === 0) e.O0 = {hood: r.o.hood};                        // for calibration (independent projection)
  }
  await br.close(); srv.close();
  return out;
}

/* independent pinhole-camera model (without three.js): orbit camera (az, el, d, centre), fov (vertical), lens shift on screen [sx, sy] */
function pinhole(k, W, H, X) {
  const az = k.az * Math.PI / 180, el = k.el * Math.PI / 180, m = k.centre || [0, 0, 0];
  const C = [Math.cos(el) * Math.cos(az) * k.d + m[0], Math.sin(el) * k.d + m[1], Math.cos(el) * Math.sin(az) * k.d + m[2]];
  const f = [m[0] - C[0], m[1] - C[1], m[2] - C[2]], fl = Math.hypot(...f); f.forEach((v, i) => f[i] = v / fl);
  let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]; const rl = Math.hypot(...r); r = r.map(v => v / rl);   // right = f x up
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];                                     // up = right x f
  const fp = (H / 2) / Math.tan(k.fov * Math.PI / 360), [sx, sy] = k.screen || [0.5, 0.5];
  const out = [];
  for (let i = 0; i < X.length; i += 3) {
    const d = [X[i] - C[0], X[i + 1] - C[1], X[i + 2] - C[2]];
    const zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2], xc = d[0] * r[0] + d[1] * r[1] + d[2] * r[2], yc = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
    out.push(sx * W + fp * xc / zc, sy * H - fp * yc / zc);
  }
  return out;
}

function table(res, film) {
  const row = [];
  for (const e of res) {
    const s = PART.map(c => { const v = e.part[c].relative; return v && v.med !== undefined ? v.med.toFixed(2).padStart(6) : '     -'; }).join(' ');
    const q = PART.map(c => { const v = e.part[c].step; return v && v.max !== undefined ? v.max.toFixed(2).padStart(6) : '     -'; }).join(' ');
    row.push(`${String(e.n).padStart(3)} ${e.name.padEnd(10)} | ${s} | ${q} | top ${e.top.deviation.toFixed(1).padStart(5)}`);
  }
  console.log(`== ${film}: relative (median, px 320x180) ${PART.join(' ')} | step (max) | background top deviation (deg)`);
  console.log(row.join('\n'));
}

if (process.argv.includes('--calibrate')) {
  const W = 640, H = 360; let all = true;
  for (const film of ['camPath', 'orbit']) {
    const r = await run({film, W, H, extra: 'patch=0'});
    const mx = Math.max(...r.slice(1).flatMap(e => PART.flatMap(c => [e.part[c].relative.max ?? 0, e.part[c].step.max ?? 0]))), tp = Math.max(...r.map(e => e.top.step));
    const error = r.flatMap(e => PART.filter(c => e.part[c].relative.error || (e.part[c].step && e.part[c].step.error)));
    const ok = mx < 0.01 && tp < 0.01 && !error.length;
    console.log(`CALIBRATION patch=0 ${film}: largest change ${mx.toFixed(4)} px, background top ${tp.toFixed(4)} deg ${error.length ? 'ERROR ' + error.join(',') : ''} -> ${ok ? 'PROVEN' : 'UNPROVEN'}`);
    all &&= ok;
  }
  const r = await run({film: 'camPath', W, H, extra: 'patch=0&synthetic=10'}), X0 = r[0].O0.hood;
  let optimum = 0, other = 0, stepError = 0;
  for (const e of r.slice(1)) {
    const v = e.part.hood;
    const A = pinhole(e.camera, W, H, X0), B = pinhole(e.camera, W, H, X0.map((x, i) => i % 3 === 0 && e.n >= 10 ? x + 0.1 : x));
    const d = []; for (let i = 0; i < A.length; i += 2) if (A[i] > -0.25 * W && A[i] < 1.25 * W && A[i + 1] > -0.25 * H && A[i + 1] < 1.25 * H) d.push(Math.hypot(A[i] - B[i], A[i + 1] - B[i + 1]) * 320 / W);
    d.sort((a, b) => a - b); const expected = d[Math.floor(d.length / 2)];
    const ratioMean = e.n >= 10 ? Math.abs(v.relative.med - expected) / expected : v.relative.max;
    optimum = Math.max(optimum, ratioMean);
    const kq = e.n === 10 ? expected : 0; stepError = Math.max(stepError, e.n === 10 ? Math.abs(v.step.med - kq) / kq : v.step.max);
    other = Math.max(other, ...PART.filter(c => c !== 'hood').map(c => Math.max(e.part[c].relative.max ?? 0, e.part[c].step.max ?? 0)));
    if (e.n === 10 || e.n === 30) console.log(`  synthetic: image ${e.n} hood relative ${v.relative.med.toFixed(3)} px, independent model ${expected.toFixed(3)} px; step ${v.step.med.toFixed(3)}`);
  }
  const ok = optimum < 0.01 && stepError < 0.01 && other < 0.01;
  console.log(`CALIBRATION synthetic (hood +0.1 x, from image 10): relative error ${(optimum * 100).toFixed(3)} % (before 10: px), step error ${(stepError * 100).toFixed(3)} %, other parts ${other.toFixed(4)} px -> ${ok ? 'PROVEN' : 'UNPROVEN'}`);
  all &&= ok;
  console.log(all ? 'CALIBRATION: all PROVEN' : 'CALIBRATION: some UNPROVEN');
} else {
  const film = arg('film', 'camPath'), W = +arg('w', 640), H = +arg('h', 360);
  const r = await run({film, style: arg('style', 'role'), W, H, extra: arg('extra', ''), png: arg('png', null)});
  table(r, film);
  const out = arg('out', null);
  if (out) { r.forEach(e => delete e.O0); writeFileSync(out, JSON.stringify({film, W, H, extra: arg('extra', ''), result: r}, null, 1)); console.log('->', out); }
}
