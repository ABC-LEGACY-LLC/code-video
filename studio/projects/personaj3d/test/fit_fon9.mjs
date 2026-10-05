/* BITTA DUNYO FONI -- OSMON VA QOR UCH SHOTGA BIRGALIKDA (9-o'tish, 2d-2e). Fon "tepasi" (kameraga qarab og'dirish) va qor
   qatlami (kameraga yopishgan) olib tashlandi: osmon -- dunyo gradienti, qor -- barcha kameralarni o'rab olgan hajm.
   Bu yerda DUNYO parametrlari (osmon gradienti chegaralari osA/osB -- ko'rish nuri balandligining sinusi; qor zichligining
   balandlik bo'yicha so'nishi qorYer/qorQalin; zarra soni qorN) uch shotga birgalikda moslanadi: fon profili
   (test/audit_misol/osmon_olch.py: fon qutisida 20 qatorlik tasmalar mediani) va qor zichligi / o'lchami
   (qor_zoom.statistika) -- ikkala tomonda bir xil kod, shotlar teng og'irlik bilan. Misolning fon plitasi uch shotda
   bir xil (2D); dunyo osmoni kamera tepaga qaragan 3-shotda qorong'i bo'ladi -- qoldiq, shu yerda o'lchanadi.
   node test/fit_fon9.mjs [--iter 60] [--faqat-baho '{"osA":-0.22,...}'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {extname, join} from 'path';
import {execSync} from 'child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ITER = +arg('iter', 60), ROOT = new URL('..', import.meta.url).pathname, TMP = '/tmp/claude-0/-home-claude/5d07603e-2f86-5fc6-8eea-8d5db2bd8188/scratchpad/fon9fit';
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const KADR = [1, 4, 8, 11, 12, 15, 18, 21];          // 0-asosli: 1-shot 2,5,9; 2-shot 12,13; 3-shot 16,19,22 (osmon_olch.py)
const PAR = [['osA', -0.8, 0.2], ['osB', -0.3, 0.9], ['qorYer', -8, 2], ['qorQalin', 2, 40], ['qorN', 20000, 70000], ['qorOlcham', 40, 160], ['qorMin', 2, 9]];
const ASL = {osA: -0.22, osB: 0.16, qorYer: -3, qorQalin: 7, qorN: 37029, qorOlcham: 70, qorMin: 4};
const MISOL = JSON.parse(execSync(`python3 -c "import sys; sys.path.insert(0,'${ROOT}test/audit_misol'); import osmon_olch as O, json; print(json.dumps(O.profil('misol')))"`).toString());
async function baho(o, papka = TMP) {
  const pg = await br.newPage({viewport: {width: 960, height: 540}});
  const qs = `style=anime&w=960&h=540&film=misol22&osA=${o.osA}&osB=${o.osB}&qorYer=${o.qorYer}&qorQalin=${o.qorQalin}&qorN=${Math.round(o.qorN)}&qorOlcham=${o.qorOlcham}&qorMin=${o.qorMin}`;
  await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?${qs}`);
  await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
  mkdirSync(papka, {recursive: true});
  for (const k of KADR) { await pg.evaluate(k => window.kadr(k), k); const d = await pg.evaluate(() => window.tasvir()); writeFileSync(`${papka}/${String(k).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await pg.close();
  const r = JSON.parse(execSync(`python3 -c "
import sys, json; sys.path.insert(0,'${ROOT}test/audit_misol'); import osmon_olch as O, qor_zoom as QZ
p = O.profil('${papka}')
q = {s: [QZ.statistika(QZ.L(QZ.fayl('${papka}', k)), QZ.QUTI_X[s]) for k in ks] for s, ks in O.KADR.items()}
qm = {s: [QZ.statistika(QZ.L(QZ.fayl('misol', k)), QZ.QUTI_X[s]) for k in ks] for s, ks in O.KADR.items()}
print(json.dumps({'p': p, 'q': {s: [sum(v[0] for v in x) / len(x), sum(v[1] for v in x) / len(x)] for s, x in q.items()}, 'qm': {s: [sum(v[0] for v in x) / len(x), sum(v[1] for v in x) / len(x)] for s, x in qm.items()}}))
"`).toString());
  const sh = ['1', '2', '3'].map(s => {
    const pr = r.p[s].reduce((a, v, i) => a + Math.abs(v - MISOL[s][i]), 0) / r.p[s].length;
    return {fon: pr, soni: r.q[s][0], soniM: r.qm[s][0], p90: r.q[s][1], p90M: r.qm[s][1]};
  });
  const f = sh.reduce((a, t) => a + t.fon / 10 + Math.abs(t.soni - t.soniM) / 60 + Math.abs(t.p90 - t.p90M) / 3, 0) / 3;
  return {f, sh, p: r.p};
}
const chiz = (s, b) => console.log('%s f %s | fon |farq| %s | qor soni %s (misol %s) | p90 %s (misol %s)', s, b.f.toFixed(4), b.sh.map(t => t.fon.toFixed(1)).join('/'),
  b.sh.map(t => t.soni.toFixed(0)).join('/'), b.sh.map(t => t.soniM.toFixed(0)).join('/'), b.sh.map(t => t.p90.toFixed(1)).join('/'), b.sh.map(t => t.p90M.toFixed(1)).join('/'));
const ob = x => Object.fromEntries(PAR.map(([nn, a, b], i) => [nn, +(a + Math.min(1, Math.max(0, x[i])) * (b - a)).toFixed(4)]));
if (arg('faqat-baho', null)) {
  for (const v of JSON.parse(arg('faqat-baho'))) { const o = {...ASL, ...v}, b = await baho(o); chiz(JSON.stringify(v), b); console.log('   profil', JSON.stringify(b.p)); }
} else {
  let n = 0;
  const f = async x => { const o = ob(x), b = await baho(o); n++; if (n % 5 === 1) chiz(`  ${n} ${JSON.stringify(o)}`, b); return b.f; };
  const x0 = PAR.map(([nn, a, b]) => (ASL[nn] - a) / (b - a)), N = x0.length, cl = v => v.map(t => Math.min(1, Math.max(0, t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] = Math.min(1, Math.max(0, pp[i] + (pp[i] > 0.5 ? -0.2 : 0.2))); P.push(pp); }
  let F = []; for (const pp of P) F.push(await f(pp));
  for (let k = 0; k < ITER; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-4) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = await f(P[i]); } }
    writeFileSync(ROOT + 'test/fon9_fit.json', JSON.stringify({asl: ASL, eng: ob(P[0]), f: F[0], k}, null, 1));
  }
  const best = ob(P[0]), b = await baho(best); chiz('ENG ' + JSON.stringify(best), b);
  writeFileSync(ROOT + 'test/fon9_fit.json', JSON.stringify({asl: ASL, eng: best, f: b.f, sh: b.sh, p: b.p}, null, 1));
}
await br.close(); srv.close();
