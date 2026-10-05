/* KAMERA SINOVI (9-o'tish): 3D IZCHILLIK. Poza va vaqt ushlangan (?vaqt=), faqat kamera yuradi (film.js: kamYol --
   misol22 ning 1 -> 2 -> 3 shot kameralari orasida uzluksiz; orbita -- bosh atrofida 360 gr). 3D izchil dunyoda obyekt
   fazosida hech narsa o'zgarmaydi: har qismning dunyo nuqtalari (main.js window.obyekt) 0-tasvirdagidek qoladi.
   O'lchov har tasvirda, har qism uchun, JORIY kamera bilan:
     nisbiy -- |proj(X_n) - proj(X_0)|: qism qattiq 3D jism bo'lganda turishi kerak bo'lgan joydan qancha uzoqda (px);
     qadam  -- |proj(X_n) - proj(X_{n-1})|: bitta qadamdagi qattiq bo'lmagan o'zgarish (sakrash -- bitta katta qadam,
               sirg'anish -- ketma-ket kichik qadamlar).
   px -- 320x180 ish o'lchamida (misol o'lchami). Fon "tepasi" (osmon gradienti va qor zichligi yo'nalishi) -- dunyo
   tepasidan og'ish, gradus. Nuqta kadr ichida (25 % chegara bilan) va kamera oldida bo'lsa hisoblanadi.
   KALIBR (--kalibr): ?yamoq=0 -- kameraga/shotga bog'liq har qiymat 0-tasvirda muzlatiladi: hamma qism 0 o'qishi kerak
   (o'qimasa -- biz bilmagan yamoq bor yoki asbob xato); ?yamoq=0&suniy=10 -- 10-tasvirdan kapyushon dunyoda +0.1 x ga:
   kapyushon nisbiy qiymati Node dagi mustaqil teshik-kamera modeli bergan qiymatga teng (1 % ichida), qadam faqat
   10-tasvirda, qolgan qismlar 0 bo'lishi kerak.
   node test/kamera_sinov9.mjs --film kamYol|orbita [--style rol] [--w 640 --h 360] [--png PAPKA] [--qoshimcha "..."] [--chiq F.json]
   node test/kamera_sinov9.mjs --kalibr */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {FILMLAR} from '../src/film.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const QISM = ['teri', 'sochIch', 'soch', 'boyin', 'kapyushon', 'plash', 'koz', 'qor'];

async function yugur({film, style = 'rol', W = 640, H = 360, qoshimcha = '', png = null}) {
  const srv = createServer((q, r) => {
    const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
  }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const pg = await br.newPage({viewport: {width: W, height: H}});
  pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
  const qs = ['style=' + style, 'w=' + W, 'h=' + H, 'film=' + film, 'vaqt=0.5', qoshimcha].filter(Boolean).join('&');
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
  if (png) mkdirSync(png, {recursive: true});
  const N = FILMLAR[film].shotlar.length, k = 320 / W, out = [];
  let O0 = null, Op = null;
  for (let n = 0; n < N; n++) {
    const r = await pg.evaluate(([n, O0, Op]) => {
      window.kadr(n);
      const o = window.obyekt(), res = {tepa: o.tepa, soni: {}};
      for (const c of Object.keys(o)) if (c !== 'tepa') {
        res.soni[c] = o[c].length / 3;
        res[c] = {P: window.proj(o[c]), R: O0 ? window.proj(O0[c]) : null, S: Op ? window.proj(Op[c]) : null};
      }
      return {o, res};
    }, [n, O0, Op]);
    if (png) { const d = await pg.evaluate(() => window.tasvir()); writeFileSync(`${png}/${String(n).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
    if (!O0) O0 = r.o;
    const e = {n, nom: FILMLAR[film].shotlar[n].nom, kamera: FILMLAR[film].shotlar[n].kamera, qism: {}};
    for (const c of QISM) {
      const {P, R, S} = r.res[c];
      const st = (Q) => {
        if (!Q) return null;
        if (Q.length !== P.length) return {xato: 'nuqta soni o\'zgardi ' + Q.length / 3 + ' -> ' + P.length / 3};
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
      e.qism[c] = {nisbiy: n ? st(R) : {n: P.length / 3, med: 0, p95: 0, max: 0}, qadam: n ? st(S) : null};
    }
    const t = r.o.tepa, ang = v => Math.acos(Math.max(-1, Math.min(1, v[1] / Math.hypot(...v)))) * 180 / Math.PI;
    e.tepa = {ogish: ang(t), qadam: Op ? Math.acos(Math.max(-1, Math.min(1, (t[0] * Op.tepa[0] + t[1] * Op.tepa[1] + t[2] * Op.tepa[2]) / Math.hypot(...t) / Math.hypot(...Op.tepa)))) * 180 / Math.PI : 0};
    out.push(e);
    Op = r.o;
    if (n === 0) e.O0 = {kapyushon: r.o.kapyushon};                        // kalibr uchun (mustaqil proyeksiya)
  }
  await br.close(); srv.close();
  return out;
}

/* mustaqil teshik-kamera modeli (three.js siz): orbita kamerasi (az, el, d, markaz), fov (tik), linza siljishi ekran [sx, sy] */
function pinhole(k, W, H, X) {
  const az = k.az * Math.PI / 180, el = k.el * Math.PI / 180, m = k.markaz || [0, 0, 0];
  const C = [Math.cos(el) * Math.cos(az) * k.d + m[0], Math.sin(el) * k.d + m[1], Math.cos(el) * Math.sin(az) * k.d + m[2]];
  const f = [m[0] - C[0], m[1] - C[1], m[2] - C[2]], fl = Math.hypot(...f); f.forEach((v, i) => f[i] = v / fl);
  let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]; const rl = Math.hypot(...r); r = r.map(v => v / rl);   // o'ng = f x tepa
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];                                     // tepa = o'ng x f
  const fp = (H / 2) / Math.tan(k.fov * Math.PI / 360), [sx, sy] = k.ekran || [0.5, 0.5];
  const out = [];
  for (let i = 0; i < X.length; i += 3) {
    const d = [X[i] - C[0], X[i + 1] - C[1], X[i + 2] - C[2]];
    const zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2], xc = d[0] * r[0] + d[1] * r[1] + d[2] * r[2], yc = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
    out.push(sx * W + fp * xc / zc, sy * H - fp * yc / zc);
  }
  return out;
}

function jadval(res, film) {
  const qator = [];
  for (const e of res) {
    const s = QISM.map(c => { const v = e.qism[c].nisbiy; return v && v.med !== undefined ? v.med.toFixed(2).padStart(6) : '     -'; }).join(' ');
    const q = QISM.map(c => { const v = e.qism[c].qadam; return v && v.max !== undefined ? v.max.toFixed(2).padStart(6) : '     -'; }).join(' ');
    qator.push(`${String(e.n).padStart(3)} ${e.nom.padEnd(10)} | ${s} | ${q} | tepa ${e.tepa.ogish.toFixed(1).padStart(5)}`);
  }
  console.log(`== ${film}: nisbiy (mediana, px 320x180) ${QISM.join(' ')} | qadam (maks) | fon tepasi og'ishi (gr)`);
  console.log(qator.join('\n'));
}

if (process.argv.includes('--kalibr')) {
  const W = 640, H = 360; let hammasi = true;
  for (const film of ['kamYol', 'orbita']) {
    const r = await yugur({film, W, H, qoshimcha: 'yamoq=0'});
    const mx = Math.max(...r.slice(1).flatMap(e => QISM.flatMap(c => [e.qism[c].nisbiy.max ?? 0, e.qism[c].qadam.max ?? 0]))), tp = Math.max(...r.map(e => e.tepa.qadam));
    const xato = r.flatMap(e => QISM.filter(c => e.qism[c].nisbiy.xato || (e.qism[c].qadam && e.qism[c].qadam.xato)));
    const ok = mx < 0.01 && tp < 0.01 && !xato.length;
    console.log(`KALIBR yamoq=0 ${film}: eng katta o'zgarish ${mx.toFixed(4)} px, fon tepasi ${tp.toFixed(4)} gr ${xato.length ? 'XATO ' + xato.join(',') : ''} -> ${ok ? 'PROVEN' : 'UNPROVEN'}`);
    hammasi &&= ok;
  }
  const r = await yugur({film: 'kamYol', W, H, qoshimcha: 'yamoq=0&suniy=10'}), X0 = r[0].O0.kapyushon;
  let eng = 0, boshqa = 0, qadamXato = 0;
  for (const e of r.slice(1)) {
    const v = e.qism.kapyushon;
    const A = pinhole(e.kamera, W, H, X0), B = pinhole(e.kamera, W, H, X0.map((x, i) => i % 3 === 0 && e.n >= 10 ? x + 0.1 : x));
    const d = []; for (let i = 0; i < A.length; i += 2) if (A[i] > -0.25 * W && A[i] < 1.25 * W && A[i + 1] > -0.25 * H && A[i + 1] < 1.25 * H) d.push(Math.hypot(A[i] - B[i], A[i + 1] - B[i + 1]) * 320 / W);
    d.sort((a, b) => a - b); const kut = d[Math.floor(d.length / 2)];
    const nis = e.n >= 10 ? Math.abs(v.nisbiy.med - kut) / kut : v.nisbiy.max;
    eng = Math.max(eng, nis);
    const kq = e.n === 10 ? kut : 0; qadamXato = Math.max(qadamXato, e.n === 10 ? Math.abs(v.qadam.med - kq) / kq : v.qadam.max);
    boshqa = Math.max(boshqa, ...QISM.filter(c => c !== 'kapyushon').map(c => Math.max(e.qism[c].nisbiy.max ?? 0, e.qism[c].qadam.max ?? 0)));
    if (e.n === 10 || e.n === 30) console.log(`  suniy: ${e.n}-tasvir kapyushon nisbiy ${v.nisbiy.med.toFixed(3)} px, mustaqil model ${kut.toFixed(3)} px; qadam ${v.qadam.med.toFixed(3)}`);
  }
  const ok = eng < 0.01 && qadamXato < 0.01 && boshqa < 0.01;
  console.log(`KALIBR suniy (kapyushon +0.1 x, 10-tasvirdan): nisbiy xato ${(eng * 100).toFixed(3)} % (10 dan oldin: px), qadam xato ${(qadamXato * 100).toFixed(3)} %, boshqa qismlar ${boshqa.toFixed(4)} px -> ${ok ? 'PROVEN' : 'UNPROVEN'}`);
  hammasi &&= ok;
  console.log(hammasi ? 'KALIBR: hammasi PROVEN' : 'KALIBR: UNPROVEN bor');
} else {
  const film = arg('film', 'kamYol'), W = +arg('w', 640), H = +arg('h', 360);
  const r = await yugur({film, style: arg('style', 'rol'), W, H, qoshimcha: arg('qoshimcha', ''), png: arg('png', null)});
  jadval(r, film);
  const chiq = arg('chiq', null);
  if (chiq) { r.forEach(e => delete e.O0); writeFileSync(chiq, JSON.stringify({film, W, H, qoshimcha: arg('qoshimcha', ''), natija: r}, null, 1)); console.log('->', chiq); }
}
