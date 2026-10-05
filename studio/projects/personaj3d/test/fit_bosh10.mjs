/* BOSH -- BARCHA QISMLAR BILAN, UCH SHOT TENG (10-o'tish). Foydalanuvchi: "boshni og'izgacha o'lchab dahani qoldirma; soch va
   kapyushonni olib turib birma-bir o'lcha". 9-o'tish moslashida (test/fit_bosh9.mjs) iyak va jag' deyarli yo'q edi: 1-shotda
   iyak old chetining bitta qatori, 2-shotda jag' ostining 3 nuqtasi (2 kadr og'irligida), 3-shotda jag' ostining 2 ustuni;
   og'irlik ekranda turish bo'yicha (1-shot 11 / 22). Natija (test/qism/taqqos.py): 1-shotda jag' quloqqa tomon 17 px gacha
   past, 2-shotda iyak 6 px past, 3-shotda 10 px past.
   Bu yerda nishonlar -- misolning QISMLARI (test/qism/qism_olch.py, har kadr; test/qism/misol_qism.json -- misoldan olingan,
   ommaviy repoga kirmaydi): ko'zlar, yaqin qosh, og'iz, lab soyasi (qorong'i bo'lak markazi -- bizda aniq nuqta + asbob
   siljishi, yalang'och renderimizda o'lchangan), burun uchi va iyak uchi (chet qoidasi -- modelda xuddi shu qoida siluetga),
   JAG' OSTI IZI (har ustun) va KONTUR (har qator) -- model siluetasi (bosh sirti nuqtalari proyeksiyasi, ustun/qator
   bo'yicha eng chetki) bilan. 2-shot ko'zi kirmaydi (profil ko'zi -- misolning 2D usuli, qoldiq). Og'irlik: har SHOT teng
   (1/3), shot ichida kadrlar teng, kadr ichida har nuqta 1, jag' izi 3, kontur 2 (izlarning o'rtacha kvadrati).
   Parametrlar: pastki yuz va jag' kesimlari (BOSH) + har poza (1-shot: 1-6 bitta, 7, 8, 9, 10, 11; 2-shot: bitta
   egilish/burilish/yonga; 3-shot: jadvalga bitta egilish/burilish qo'shimchasi). Kameralar qat'iy.
   node test/fit_bosh10.mjs [--iter 400] [--tekshir] [--faqat-baho] */
import {BOSH, YUZ, qismNuqtalari, boshShakli} from '../src/personaj.js';
import {FILMLAR} from '../src/film.js';
import {proyektor, boshMatritsa, kameraOl} from './proyeksiya.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, ITER = +arg('iter', 400), VAZN = arg('vazn', 'teng');   // teng: har shot 1/3; kadr: ekranda turish (11/2/9); shot1: faqat 1-shot, 2- va 3-shot -- yomonlashmasin jarimasi
const MIS = JSON.parse(readFileSync(ROOT + 'test/qism/misol_qism.json'));
const M22 = FILMLAR.misol22.shotlar;
/* asbob siljishi: qorong'i bo'lak markazi - aniq nuqta (yalang'och renderimizda, test/qism/qism_olch.py): */
const OFS = {koz_ochiq: [-1.6, -3.7], koz_yumuq: [-1.3, -0.8], uzoq_ochiq: [-2.1, -3.4], qosh: [-0.25, -1.2], ogiz: [-2.5, -0.5], lab: [-1.9, -0.4]};
const GURUH = k => k <= 9 ? 'a' : k === 10 ? 'b' : k === 11 ? 'c' : k <= 13 ? 'd' : 'e';
const IYAK = {a: [0.45, 0.89], b: [0.45, 0.89], c: [0.45, 0.89], d: [0.71, 0.71], e: [-0.35, 0.94]};
const BURUN = {b: [52, 76], c: [54, 80], d: [80, 97]};
const IZ = {a: {jag: [86, 128], kon: [60, 104]}, b: {jag: [96, 138], kon: [60, 104]}, c: {jag: [98, 142], kon: [62, 108]},
            d: {jag: [146, 158], kon: [84, 110]}, e: {jag: [132, 168], kon: [140, 156]}};

const KADR = [];                                          // {k, s (shot 0..2), i, kam, h0}
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) KADR.push({k, si, i, kam: s.kamera, h0: s.poza(i)}); }); }

/* bosh sirti nuqtalari -- TO'LIQ azimut (-pi..pi): 1-shotda jag' osti izi boshning o'rta qismidan (z -0.1..0.5, jag' tagining
   tekis qismi) keladi -- faqat old tomon olinsa model izi render skanidan 1.5..2.7 px yuqori chiqardi (--tekshir). Pastki
   yarim (al -pi/2 .. 0.35), mayda qatlam bilan; Float64Array -- tez proyeksiya (bitta 4x4 matritsa). */
let SIRT = null;
const sirtQur = () => {
  const NA = 150, NP = 300, S = new Float64Array((NA + 1) * NP * 3); let n = 0;
  for (let j = 0; j <= NA; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / NA;
    for (let i = 0; i < NP; i++) { const ph = -Math.PI + 2 * Math.PI * i / NP, q = boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true); S[n++] = q[0]; S[n++] = q[1]; S[n++] = q[2]; } }
  SIRT = S;
};
function tezProyektor(kam, poza) {
  const M = boshMatritsa(poza), c = kameraOl(kam), e = new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse).multiply(M).elements;
  return (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / w + 1) * 160, (1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w) * 90]; };
}
function izlar(S, tp) {
  const jag = new Map(), kon = new Map();
  for (let n = 0; n < S.length; n += 3) { const [x, y] = tp(S[n], S[n + 1], S[n + 2]); const c = Math.floor(x), r = Math.floor(y);
    if (!(jag.get(c) >= y)) jag.set(c, y); if (!(kon.get(r) >= x)) kon.set(r, x); }
  return {jag, kon};
}
/* model tomonidan, misoldagi qoida bilan: iz qiymati = siluet - 1.0 -- renderda qator j teri, agar markazi (j + 0.5) siluet
   ichida: oxirgi qator = floor(y_b - 0.5), o'rtacha y_b - 1.0 (--tekshir: -0.5 bilan model izi +0.6..+0.9 px edi) */
function modelKadr(K, h) {
  const p = proyektor(K.kam, h), g = GURUH(K.k), N = QN[h.yumuq > 0.5 ? 1 : 0], iz = izlar(SIRT, tezProyektor(K.kam, h));
  const jag = {}, kon = {};
  for (let c = IZ[g].jag[0]; c <= IZ[g].jag[1]; c++) if (iz.jag.has(c)) jag[c] = iz.jag.get(c) - 1.0;
  for (let r = IZ[g].kon[0]; r <= IZ[g].kon[1]; r++) if (iz.kon.has(r)) kon[r] = iz.kon.get(r) - 1.0;
  const P = n => p(N[n][0]);
  const o = {jag, kon, nuqta: {}};
  const yum = h.yumuq > 0.5, ko = yum ? OFS.koz_yumuq : OFS.koz_ochiq;
  o.nuqta.koz_yaqin = P('koz_yaqin').map((v, j) => v + ko[j]);
  o.nuqta.koz_uzoq = P('koz_uzoq').map((v, j) => v + (yum ? OFS.koz_yumuq : OFS.uzoq_ochiq)[j]);
  o.nuqta.qosh_yaqin = P('qosh_yaqin_orta').map((v, j) => v + OFS.qosh[j]);
  o.nuqta.ogiz = P('ogiz').map((v, j) => v + OFS.ogiz[j]);
  o.nuqta.lab = P('lab_soyasi').map((v, j) => v + OFS.lab[j]);
  const jp = Object.entries(jag).map(([c, y]) => [+c, y]);                 // iyak uchi -- jag' izining shot yo'nalishidagi uchi
  if (jp.length) { const [dx, dy] = IYAK[g], s = jp.map(([x, y]) => x * dx + y * dy), m = Math.max(...s), sel = jp.filter((_, j) => s[j] >= m - 1);
    o.nuqta.iyak_uchi = [sel.reduce((a, t) => a + t[0], 0) / sel.length, sel.reduce((a, t) => a + t[1], 0) / sel.length]; }
  if (BURUN[g]) { const [a, b] = BURUN[g], kk = Object.entries(kon).filter(([r]) => +r >= a && +r <= b);   // burun uchi -- kontur qatorlari orasidagi eng o'ng
    if (kk.length) { const m = Math.max(...kk.map(t => t[1])), yy = kk.filter(t => t[1] >= m - 0.5).map(t => +t[0]); o.nuqta.burun_uchi = [m, yy.reduce((a, t) => a + t, 0) / yy.length]; } }
  return o;
}
/* misol nishonlari */
function nishon(k) {
  const m = MIS[k], g = GURUH(k), o = {nuqta: {}, jag: {}, kon: {}};
  for (const q of ['koz_yaqin', 'koz_uzoq', 'qosh_yaqin', 'ogiz', 'lab']) if (m[q]) o.nuqta[q] = [m[q].x, m[q].y];
  if (g === 'd') delete o.nuqta.koz_yaqin;                  // profil ko'zi -- moslashga kirmaydi (misolning 2D usuli)
  if (m.iyak_uchi) o.nuqta.iyak_uchi = m.iyak_uchi;
  if (m.burun_uchi && BURUN[g]) o.nuqta.burun_uchi = m.burun_uchi;
  for (const [c, y] of Object.entries(m.jag || {})) if (+c >= IZ[g].jag[0] && +c <= IZ[g].jag[1]) o.jag[c] = y;
  for (const [r, x] of Object.entries(m.kontur || {})) if (+r >= IZ[g].kon[0] && +r <= IZ[g].kon[1]) o.kon[r] = x;
  return o;
}
const NISHON = Object.fromEntries(KADR.map(K => [K.k, nishon(K.k)]));
function xato(K, h, bat = false) {
  const md = modelKadr(K, h), n = NISHON[K.k]; let e = 0, w = 0; const d = {};
  for (const [q, t] of Object.entries(n.nuqta)) { const v = md.nuqta[q]; if (!v) continue; const r = (v[0] - t[0]) ** 2 + (v[1] - t[1]) ** 2; e += r; w += 1; if (bat) d[q] = [+(v[0] - t[0]).toFixed(1), +(v[1] - t[1]).toFixed(1)]; }
  for (const [nm, wt] of [['jag', 3], ['kon', 2]]) {
    const ks = Object.keys(n[nm]).filter(c => md[nm][c] !== undefined); if (!ks.length) continue;
    const f = ks.map(c => md[nm][c] - n[nm][c]); e += wt * f.reduce((a, t) => a + t * t, 0) / f.length; w += wt;
    if (bat) d[nm] = {orta: +(f.reduce((a, t) => a + t, 0) / f.length).toFixed(2), rms: +Math.sqrt(f.reduce((a, t) => a + t * t, 0) / f.length).toFixed(2), min: +Math.min(...f).toFixed(1), max: +Math.max(...f).toFixed(1)};
  }
  return bat ? {e: w ? e / w : 0, d} : (w ? e / w : 0);
}
function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f), eng = Infinity, turg = 0;
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    if (F[0] < eng - 1e-4) { eng = F[0]; turg = 0; } else if (++turg > 40) break;        // 40 qadam yaxshilanmasa -- to'xtaydi
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}
/* pozalar: 1-shot guruhlari [1-6], 7, 8, 9, 10, 11 -- (egilish, burilish); 2-shot -- (egilish, burilish, yonga) qo'shimcha;
   3-shot -- (egilish, burilish) qo'shimcha butun jadvalga */
const PG = [{ks: [1, 2, 3, 4, 5, 6]}, {ks: [7]}, {ks: [8]}, {ks: [9]}, {ks: [10]}, {ks: [11]}, {ks: [12, 13], uch: true}, {ks: [14, 15, 16, 17, 18, 19, 20, 21, 22]}];
PG.forEach(g => { g.x = g.uch ? [0, 0, 0] : [0, 0]; });
const pozaOl = (K, x) => ({...K.h0, egilish: K.h0.egilish + x[0], burilish: K.h0.burilish + x[1], yonga: (K.h0.yonga || 0) + (x[2] || 0)});
function pozalar(it = 50, bat = false) {
  const shot = [[], [], []], hisob = {};
  for (const g of PG) {
    const Ks = g.ks.map(k => KADR[k - 1]);
    /* poza jarimasi: (x / 0.04)^2 (px^2 birligida) -- jarimasiz birinchi moslashda 2- va 3-shot burilishi chegaraga (+0.30 rad,
       17 gr) yetdi: faqat pastki yuz nishonlari bilan poza shakl farqini "yutib" yuborardi (bosh tepasi, soch, kapyushon bu
       moslashda yo'q -- ular oldingi pozaga moslangan); test/bosh10_fit_erkin_poza.json */
    const f = x => Ks.reduce((a, K) => a + xato(K, pozaOl(K, x)), 0) / Ks.length + (x[0] / 0.04) ** 2 + (x[1] / 0.04) ** 2 + (g.uch ? (x[2] / 0.03) ** 2 : 0);
    const qat = process.argv.includes('--poza23-qatiq') && g.ks[0] >= 12;     // 2- va 3-shot pozasi o'zgarmaydi (oldingi moslashlarniki)
    const r = qat ? {x: g.x.map(() => 0)} : nelder(f, g.x, g.uch ? [0.02, 0.02, 0.02] : [0.02, 0.02], it, g.uch ? [-0.3, -0.3, -0.2] : [-0.3, -0.3], g.uch ? [0.3, 0.3, 0.2] : [0.3, 0.3]);
    g.x = r.x;
    for (const K of Ks) { const e = xato(K, pozaOl(K, g.x), bat); shot[K.si].push(bat ? e.e : e); if (bat) hisob[K.k] = e.d; }
  }
  const S = shot.map(v => v.reduce((a, t) => a + t, 0) / v.length);
  const jami = VAZN === 'kadr' ? Math.sqrt(shot.flat().reduce((a, t) => a + t, 0) / 22) : VAZN === 'shot1' ? Math.sqrt(S[0]) : Math.sqrt(S.reduce((a, t) => a + t, 0) / 3);
  /* hech bir shot boshlang'ichdan yomonlashmasin: jarima 10 x (S - S0)^2 (px^2) -- teng og'irlikda 2- va 3-shot iyagi uchun
     1-shot iyagi 6 px tepaga ketdi (test/bosh10_fit_jarimali.json): 2-shotda misol profil yuzini boshiga nisbatan ~20 %
     kichik chizadi (8-o'tish: yuzga d 12.88, siluetga 10.32) -- bitta qattiq bosh uni to'liq bera olmaydi */
  const qat = S0 && !process.argv.includes('--jarimasiz') ? S.reduce((a, t, i) => a + 10 * Math.max(0, t - S0[i]) ** 2, 0) : 0;
  return bat ? {jami, shot: S.map(v => +Math.sqrt(v).toFixed(3)), hisob, poza: PG.map(g => ({ks: g.ks, x: g.x.map(v => +v.toFixed(4))}))} : Math.sqrt(jami * jami + qat / 3);
}

const SHAKL = [['iyakY', -1.35, -0.95], ['iyakZ', 0.75, 1.05], ['iyakW', 0.08, 0.35], ['jagOrqa', 0.3, 0.95], ['jagOrqa2', -0.7, 0.6],
               ['jagOrqa1', -0.9, 0.3], ['ogizW', 0.35, 0.75], ['ogizZ', 0.85, 1.15], ['ogizP', 1.3, 2.8], ['jagP', 1.3, 2.8], ['yopish', 0.02, 0.2]];
const ASL = Object.fromEntries(SHAKL.map(([n]) => [n, BOSH[n]]));
const BOSHLA = arg('boshla', null) ? JSON.parse(arg('boshla')) : null;     // --boshla '{"iyakY":...}' -- shu shakldan (to'xtatilgan moslashdan)
let QN = null;                                            // qism nuqtalari (ochiq, yumuq) -- shakl o'zgarganda bir marta
const qoy = x => { SHAKL.forEach(([n], i) => { BOSH[n] = x[i]; }); sirtQur(); QN = [qismNuqtalari(false), qismNuqtalari(true)]; };
BOSH.surish = 0; BOSH.profilW = 0;
qoy(SHAKL.map(([n]) => ASL[n]));

if (process.argv.includes('--tekshir')) {
  /* model izlari (node siluet) -- yalang'och rol renderimizdagi skan bilan (test/qism/taqqos_TEG.json 'biz') */
  const T = JSON.parse(readFileSync(ROOT + 'test/qism/taqqos_dunyo9b.json'));
  for (const K of KADR) {
    const md = modelKadr(K, K.h0), t = T[K.k];
    const f = nm => { const a = t[nm === 'kon' ? 'kontur' : 'jag']; if (!a) return '-'; const ks = Object.keys(a.biz).filter(c => md[nm][c] !== undefined);
      const d = ks.map(c => md[nm][c] - a.biz[c]); return ks.length ? `${ks.length} ta, o'rtacha ${(d.reduce((x, y) => x + y, 0) / d.length).toFixed(2)}, |max| ${Math.max(...d.map(Math.abs)).toFixed(2)}` : '-'; };
    const iy = t.iyak_uchi ? md.nuqta.iyak_uchi.map((v, j) => (v - t.iyak_uchi.biz[j]).toFixed(2)) : '-';
    console.log(`k${K.k}: jag' (node - rol skan) ${f('jag')} | kontur ${f('kon')} | iyak uchi ${iy}`);
  }
  process.exit(0);
}
let S0 = null;
const b0 = (pozalar(80), pozalar(80), pozalar(40, true));
S0 = b0.shot.map(v => v * v);
console.log("BOSHLANG'ICH (joriy bosh, pozalar qayta moslangan): jami RMS", b0.jami.toFixed(3), 'shot', JSON.stringify(b0.shot));
if (!process.argv.includes('--faqat-baho')) {
  let n = 0;
  const f = x => { qoy(x); const v = pozalar(25); if (++n % 10 === 0) console.log(`  ${n}: ${v.toFixed(3)} ${x.map(t => t.toFixed(3)).join(' ')}`); return v; };
  const x0 = SHAKL.map(([nn]) => BOSHLA && BOSHLA[nn] !== undefined ? BOSHLA[nn] : ASL[nn]);
  const r = ITER > 0 ? nelder(f, x0, SHAKL.map(([, a, b]) => 0.1 * (b - a)), ITER, SHAKL.map(t => t[1]), SHAKL.map(t => t[2])) : {x: x0};
  /* NM to'xtash sharti (1e-7) ichki poza moslashining shovqini tufayli kelmaydi -- 150+ baho bir xil 3.712 da turdi (to'xtatildi) */
  qoy(r.x); pozalar(80); pozalar(80); const b1 = pozalar(40, true);
  const shakl = Object.fromEntries(SHAKL.map(([nn], i) => [nn, +r.x[i].toFixed(4)]));
  console.log('MOSLANGAN shakl:', JSON.stringify(shakl), '-> jami RMS', b1.jami.toFixed(3), 'shot', JSON.stringify(b1.shot));
  writeFileSync(ROOT + arg('chiq', 'test/bosh10_fit.json'), JSON.stringify({asl: ASL, boshlangich: b0, shakl, natija: b1}, null, 1));
} else {
  console.log(JSON.stringify(b0.hisob));
}
