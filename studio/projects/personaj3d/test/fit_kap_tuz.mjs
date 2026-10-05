/* KAPYUSHON TUZILISHI -- BOSH FAZOSIDA, UCH SHOTGA BIRGA (12-o'tish). Alonur: "birinchi to'g'ri 3D modellarni qilib olishing
   kerak, keyin kamerani". Kapyushon -- katta, bo'sh mato (personaj.js KIYIM.kap izohi), ichi qorong'i yorug'likdan (AO + kapyushon
   soyasi, umumiy.js); soch -- to'liq (orqa qatlam ham). Bu yerda faqat kapyushonning TUZILISH o'lchamlari (qirra azimuti
   profili, halqa o'lchami va o'rni, gumbaz) va bitta kalit yorug'lik yo'nalishi bosh qobig'i xaritasiga (test/qism/kap_xarita.py
   bilan bir xil: bosh sirtidan 0.2 tashqaridagi to'r har kadrda misolning qaysi qismiga tushadi -- bosh / ich / tashqi / fon,
   MAXFIY nishon) va figura massasiga moslanadi; jarima: mato soch qatlamiga kirmasin (qobiqChuqurlik).
   node test/fit_kap_tuz.mjs --baho '{"nom": {"kiyim": {"kap": {...}}, "nur": [az, el]}}'
   node test/fit_kap_tuz.mjs --moslash [--iter 400] [--boshla '{...}'] [--chiq test/kap_tuz_fit.json] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
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
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=${W}&h=${H}&film=misol22&qorN=1${arg('qoshimcha', '') ? '&' + arg('qoshimcha', '') : ''}`);   // --qoshimcha: tekshiruv URL parametrlari
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const {KIYIM} = await import('../src/personaj.js');
/* butun kadr sinflari (1-ish: sochning tepasi) -- misol bitlari sahifaga bir marta */
const WF = {boshF: +arg('wbF', 0), boshT: +arg('wbT', 0), ichF: +arg('wiF', 0), sochF: +arg('wsF', 0), sochYuz: +arg('wsY', arg('wsF', 0))};
/* ichF (2-ish): butun kadrda ich IoU; sochF (6-ish): SAM 2 soch niqobi (bit16, bit32 yuz hisobsiz) IoU; sochYuz (6-ish): bizning soch SAM
   yuzini (bit32, sochsiz) qancha yopadi -- ulush, 1-2-shotda jarima (3-shotda misolda ham tutamlar yuz ustida) */
if (WF.boshF || WF.boshT || WF.ichF || WF.sochF) await pg.evaluate(r => { window.__qism = r; }, JSON.parse(readFileSync(ROOT + 'test/qism/inson/qism_nishon_12.json')));
/* bosh qobig'i to'ri -> har kadr piksel ro'yxati va misol sinfi */
/* bir nechta qobiq (vergul bilan): 0.2 -- bosh sirti yonida, 0.55 -- soch hajmi (bosh ustidagi tutamlar, kapyushon qirrasi
   va soch orasidagi ichki bo'shliq -- 0.2 qobig'i buni ko'rmaydi) */
const M = JSON.parse(readFileSync(ROOT + 'test/qism/inson/qism_nishon_12.json')).m;
const GR = {}, FRS = [];
for (const fn of arg('sirt', 'test/qism/sirt_proyeksiya_02.json').split(',')) {
  const S = JSON.parse(readFileSync(ROOT + fn));
  for (const [ks, G] of Object.entries(S.kadr)) {
    const f = +ks - 1, m = Buffer.from(M[String(f)], 'base64');
    if (!GR[f]) { GR[f] = {px: [], c: []}; FRS.push(f); }
    for (const row of G) for (const [x, y, v] of row) {
      if (v < 0.2 || x < 0 || x >= W || y < 0 || y >= H) continue;
      const j = Math.floor(y) * W + Math.floor(x), bt = m[j];
      GR[f].px.push(j); GR[f].c.push(bt & 1 ? 0 : bt & 2 ? 1 : bt & 4 ? 2 : 3);
    }
  }
}
FRS.sort((a, b) => a - b);
const SHOT = f => f <= 10 ? 1 : f <= 12 ? 2 : 3;
/* --shotlar 3 (13-o'tish, tekshiruv): faqat shu shot(lar) -- bitta shot uchun eng yaxshi statik shakl qanchalik yaxshi bo'lishi
   mumkinligini bilish uchun (model emas: natija MANBAGA yozilmaydi) */
const SH = arg('shotlar', '1,2,3').split(',').map(Number);
for (let i = FRS.length - 1; i >= 0; i--) if (!SH.includes(SHOT(FRS[i]))) FRS.splice(i, 1);
const FIG = JSON.parse(readFileSync(ROOT + 'test/misol_figura8.json')), FIGT = {1: FIG.shot1, 2: FIG.shot2, 3: FIG.shot3};
const soft = (B, T) => { let mn = 0, mx = 0; for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) { const b = B[y * 32 + x], t = T[y][x]; mn += Math.min(b, t); mx += Math.max(b, t); } return mn / mx; };
const VZ = {bosh: +arg('wb', 2), ich: +arg('wi', 1.5), tashqi: +arg('wt', 1), fig: +arg('wf', 2), pen: +arg('wp', 20)};
const iou = (C, k) => { let r = 0, c = 0; for (let j = 0; j < 4; j++) { r += C[k * 4 + j]; c += C[j * 4 + k]; } const d = r + c - C[k * 4 + k]; return d ? C[k * 4 + k] / d : 1; };
async function baho(o) {
  const r = await pg.evaluate(({o, fr, GR}) => window.kapTuzBaho(o, fr, GR), {o, fr: FRS, GR});
  const sh = {};
  for (const s of SH) {
    const fs = FRS.filter(f => SHOT(f) === s), C = new Array(16).fill(0), B = new Array(576).fill(0);
    let pen = 0, sI = 0, sU = 0, yS = 0, yN = 0; const CF = new Array(16).fill(0), CT = new Array(16).fill(0);
    for (const f of fs) { r[f].conf.forEach((v, i) => C[i] += v); r[f].B.forEach((v, i) => B[i] += v / fs.length); pen += r[f].pen / fs.length;
      if (r[f].confF) { r[f].confF.forEach((v, i) => CF[i] += v); r[f].confT.forEach((v, i) => CT[i] += v); sI += r[f].soch[0]; sU += r[f].soch[1]; yS += r[f].yuz[0]; yN += r[f].yuz[1]; } }
    sh[s] = {bosh: iou(C, 0), ich: iou(C, 1), tashqi: iou(C, 2), fig: soft(B, FIGT[s]), pen, mos: [0, 1, 2, 3].reduce((a, k) => a + C[k * 5], 0) / C.reduce((a, b) => a + b, 0),
             boshF: CF.some(v => v) ? iou(CF, 0) : null, boshT: CT.some(v => v) ? iou(CT, 0) : null, ichF: CF.some(v => v) ? iou(CF, 1) : null, sochF: sU ? sI / sU : null, sochYuz: yN ? yS / yN : null};
  }
  const F = SH.reduce((a, s) => a + VZ.bosh * (1 - sh[s].bosh) + VZ.ich * (1 - sh[s].ich) + VZ.tashqi * (1 - sh[s].tashqi) + VZ.fig * (1 - sh[s].fig) + VZ.pen * sh[s].pen
    + (sh[s].boshF !== null ? WF.boshF * (1 - sh[s].boshF) + (s < 3 ? WF.boshT * (1 - sh[s].boshT) : 0) + WF.ichF * (1 - sh[s].ichF) + WF.sochF * (1 - sh[s].sochF) + (s < 3 ? WF.sochYuz * sh[s].sochYuz : 0) : 0), 0);   // tepa -- 1-, 2-shot (3-shotda kadr tepasida bosh yo'q)
  return {F, sh};
}
const fmt = b => `F ${b.F.toFixed(3)} | ` + SH.map(s => `${s}: mos ${b.sh[s].mos.toFixed(3)} bosh ${b.sh[s].bosh.toFixed(3)} ich ${b.sh[s].ich.toFixed(3)} tashqi ${b.sh[s].tashqi.toFixed(3)} fig ${b.sh[s].fig.toFixed(3)} pen ${b.sh[s].pen.toFixed(3)}` + (b.sh[s].boshF !== null ? ` boshF ${b.sh[s].boshF.toFixed(3)} tepa ${b.sh[s].boshT.toFixed(3)} ichF ${b.sh[s].ichF.toFixed(3)} soch ${b.sh[s].sochF.toFixed(3)} sochYuz ${b.sh[s].sochYuz.toFixed(3)}` : '')).join(' | ');
if (arg('baho', null)) {
  const C = JSON.parse(arg('baho'));
  for (const [nom, o] of Object.entries(C)) console.log(nom.padEnd(12), fmt(await baho(o)));
}
if (process.argv.includes('--moslash')) {
  const ITER = +arg('iter', 400);
  const PAR = JSON.parse(arg('par', JSON.stringify([
    ['yTepa', 1.8, 2.9], ['Rg', 0.6, 1.6], ['R0', 1.1, 1.9], ['Rn', 0.75, 1.4], ['zg', -1.4, 0.2], ['z0', -0.7, 0.3], ['zn', -0.6, 0.2],
    ['kengX', 0.8, 1.25], ['orqa', 0, 1.3], ['soyabon', 0, 0.5], ['ochV0', 0.10, 0.28], ['fi1', 15, 75], ['fi2', 35, 95], ['fi3', 55, 115], ['fi4', 25, 95],
    ['qanot', 0, 0.6], ['kf', 0.4, 1.0], ['kt', 0.5, 1.0], ['nurAz', -10, 100], ['nurEl', 5, 65]])));
  const B0 = arg('boshla', null) ? JSON.parse(arg('boshla')) : {};
  const STD = {nurAz: 41.5, nurEl: 20.5, qanot: 0, soyaA: 20, soyaE: 15, aoD: 0.45, aoS: 0.70, kfE: 0.8, kfB: 0.8};
  const {SOCH} = await import('../src/personaj.js');
  const KG = ['plash.', 'boyin.', 'gavda.'];                  // 13-o'tish: boshqa kiyim guruhlari ("plash.r0", "boyin.rT")
  const x0 = PAR.map(([n]) => B0[n] !== undefined ? B0[n] : n.startsWith('soch.') ? SOCH[n.split('.')[1]][n.split('.')[2]]
    : KG.some(g => n.startsWith(g)) ? KIYIM[n.split('.')[0]][n.split('.')[1]] : B0.kap && B0.kap[n] !== undefined ? B0.kap[n] : KIYIM.kap[n] !== undefined ? KIYIM.kap[n] : STD[n]);
  const lo = PAR.map(p => p[1]), hi = PAR.map(p => p[2]), q = PAR.map(([, a, b]) => 0.08 * (b - a));
  const MAXSUS = ['nurAz', 'nurEl', 'soyaA', 'soyaE', 'aoD', 'aoS'];
  const oOl = x => { const kap = {...(B0.kap || {})}, o = {kiyim: {kap}}; PAR.forEach(([n], i) => { if (MAXSUS.includes(n) || n.startsWith('soch.')) return;
      if (KG.some(g => n.startsWith(g))) { const [g, k] = n.split('.'); (o.kiyim[g] = o.kiyim[g] || {})[k] = x[i]; return; } kap[n] = x[i]; });
    const ix = n => PAR.findIndex(p => p[0] === n), ia = ix('nurAz'), ie = ix('nurEl'), sa = ix('soyaA'), se = ix('soyaE');
    /* 13-o'tish: yorug'lik / AO faqat parametr (yoki --boshla da berilgan) bo'lsa o'rnatiladi -- aks holda sahifadagi MANBA qiymati.
       (F moslashi STD 41.5/20.5 va AO 0.45 bilan ketgan edi -- manbada 41.7/29.7, 0.505: natija boshqa yorug'likka moslangan) */
    if (ia >= 0 || ie >= 0 || B0.nurAz !== undefined || B0.nurEl !== undefined)
      o.nur = [ia >= 0 ? x[ia] : (B0.nurAz ?? STD.nurAz), ie >= 0 ? x[ie] : (B0.nurEl ?? STD.nurEl)];
    if (sa >= 0 || se >= 0) kap.soya = [sa >= 0 ? x[sa] : B0.soyaA, se >= 0 ? x[se] : B0.soyaE];
    const ad = ix('aoD'), as = ix('aoS');
    if (ad >= 0 || as >= 0 || B0.aoD !== undefined || B0.aoS !== undefined) o.ao = [ad >= 0 ? x[ad] : (B0.aoD ?? STD.aoD), as >= 0 ? x[as] : (B0.aoS ?? STD.aoS)];
    PAR.forEach(([n], i) => { if (n.startsWith('soch.')) { const [, g, k] = n.split('.'); ((o.soch = o.soch || {})[g] = o.soch[g] || {})[k] = x[i]; } });
    return o; };
  let n = 0, eng = null;
  const yoz = () => writeFileSync(ROOT + arg('chiq', 'test/kap_tuz_fit.json'), JSON.stringify({baho: n, natija: eng.b, x: Object.fromEntries(PAR.map(([nn], i) => [nn, +eng.x[i].toFixed(4)])), o: oOl(eng.x)}, null, 1));
  const f = async x => { const b = await baho(oOl(x)); if (!eng || b.F < eng.b.F) { eng = {b, x: x.slice()}; console.log(`  ${n}: ${fmt(b)}`); yoz(); } n++; return b.F; };
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [cl(x0)]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += (pp[i] + q[i] > hi[i] ? -q[i] : q[i]); P.push(cl(pp)); }
  let Fv = []; for (const p of P) Fv.push(await f(p));
  let best = Infinity, turg = 0;
  for (let k = 0; k < ITER; k++) {
    const o = Fv.map((v, i) => i).sort((a, b) => Fv[a] - Fv[b]); P = o.map(i => P[i]); Fv = o.map(i => Fv[i]);
    if (Fv[0] < best - 1e-3) { best = Fv[0]; turg = 0; } else if (++turg > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = await f(xr);
    if (fr < Fv[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = await f(xe); if (fe < fr) { P[N] = xe; Fv[N] = fe; } else { P[N] = xr; Fv[N] = fr; } }
    else if (fr < Fv[N - 1]) { P[N] = xr; Fv[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = await f(xc); if (fc < Fv[N]) { P[N] = xc; Fv[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); Fv[i] = await f(P[i]); } }
  }
  const out = {baho: n, natija: eng.b, x: Object.fromEntries(PAR.map(([nn], i) => [nn, +eng.x[i].toFixed(4)])), o: oOl(eng.x)};
  writeFileSync(ROOT + arg('chiq', 'test/kap_tuz_fit.json'), JSON.stringify(out, null, 1));
  console.log('YAKUN', fmt(eng.b), JSON.stringify(out.x));
}
await br.close(); srv.close();
