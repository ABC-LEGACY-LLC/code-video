/* YUZ BAHOSI (11-o'tish) -- test/fit_poza11.mjs va test/fit_poza11b.mjs uchun umumiy: inson belgilari nishonlari
   (test/qism/inson/nishon_fit_11.json, MAXFIY), model tomoni node da (render yo'q). Tafsilot -- fit_poza11.mjs boshida. */
import {BOSH, qismNuqtalari, boshShakli} from '../src/personaj.js';
import {FILMLAR} from '../src/film.js';
import {proyektor, boshMatritsa, kameraOl} from './proyeksiya.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const NIS = JSON.parse(readFileSync(ROOT + 'test/qism/inson/nishon_fit_11.json'));
const M22 = FILMLAR.misol22.shotlar;
const IYAK = {2: [0.71, 0.71], 3: [0, 1]};
const W = {iyak: 2, koz_yaqin: 1, koz_uzoq: 1, burun: 1, ogiz: 1, qosh_yaqin: 0.3};
const NOM = {koz_yaqin: 'koz_yaqin', koz_uzoq: 'koz_uzoq', burun: 'burun_uchi', ogiz: 'ogiz', qosh_yaqin: 'qosh_yaqin_orta'};
BOSH.surish = 0; BOSH.profilW = 0;

let SIRT = null;
{ const NA = 150, NP = 300, S = new Float64Array((NA + 1) * NP * 3); let n = 0;
  for (let j = 0; j <= NA; j++) { const al = -Math.PI / 2 + (Math.PI / 2 + 0.35) * j / NA;
    for (let i = 0; i < NP; i++) { const ph = -Math.PI + 2 * Math.PI * i / NP, q = boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true); S[n++] = q[0]; S[n++] = q[1]; S[n++] = q[2]; } }
  SIRT = S; }
const QN = [qismNuqtalari(false), qismNuqtalari(true)];
function tezProyektor(kam, poza) {
  const M = boshMatritsa(poza), c = kameraOl(kam), e = new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse).multiply(M).elements;
  return (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / w + 1) * 160, (1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w) * 90]; };
}
function izlar(tp) {
  const jag = new Map(), kon = new Map();
  for (let n = 0; n < SIRT.length; n += 3) { const [x, y] = tp(SIRT[n], SIRT[n + 1], SIRT[n + 2]); const c = Math.floor(x), r = Math.floor(y);
    if (!(jag.get(c) >= y)) jag.set(c, y); if (!(kon.get(r) >= x)) kon.set(r, x); }
  return {jag, kon};
}

export const KADR = [];
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) KADR.push({k, shot: si + 1, i, kam: s.kamera, h0: s.poza(i)}); }); }

export function model(K, h, kam) {
  const p = proyektor(kam, h), N = QN[h.yumuq > 0.5 ? 1 : 0], iz = izlar(tezProyektor(kam, h));
  const o = {nuqta: {}, jag: {}, kon: {}};
  for (const [q, nm] of Object.entries(NOM)) { const v = p(N[nm][0]); o.nuqta[q] = [v[0] - 0.5, v[1] - 0.5]; }
  const jp = [...iz.jag.entries()].filter(([c]) => c >= 100 && c <= 200).map(([c, y]) => [c, y - 1.0]);
  if (jp.length) {
    const [dx, dy] = IYAK[K.shot], s = jp.map(([x, y]) => x * dx + y * dy), m = Math.max(...s), sel = jp.filter((_, j) => s[j] >= m - 1);
    const ix = sel.reduce((a, t) => a + t[0], 0) / sel.length, iy = sel.reduce((a, t) => a + t[1], 0) / sel.length;
    o.nuqta.iyak = [ix, iy];
    for (const [c, y] of jp) if (c <= ix + 0.5) o.jag[c] = y;
  }
  for (const [r, x] of iz.kon.entries()) o.kon[r] = x - 1.0;
  return o;
}
export function xato(K, h, kam, bat = false) {
  const md = model(K, h, kam), t = NIS[K.k]; let e = 0, w = 0; const d = {};
  for (const [q, v] of Object.entries(t.nuqta)) { const m = md.nuqta[q]; if (!m) continue;
    const r = (m[0] - v[0]) ** 2 + (m[1] - v[1]) ** 2; e += W[q] * r; w += W[q]; if (bat) d[q] = [+(m[0] - v[0]).toFixed(1), +(m[1] - v[1]).toFixed(1)]; }
  for (const [nm, key, wt] of [['jag', 'jag', 2], ['kon', 'kontur', 1]]) {
    const T = t[key] || {}, ks = Object.keys(T).filter(c => md[nm][+c] !== undefined); if (ks.length < 3) continue;
    const f = ks.map(c => md[nm][+c] - T[c]); e += wt * f.reduce((a, x) => a + x * x, 0) / f.length; w += wt;
    if (bat) d[nm] = {orta: +(f.reduce((a, x) => a + x, 0) / f.length).toFixed(2), rms: +Math.sqrt(f.reduce((a, x) => a + x * x, 0) / f.length).toFixed(2), n: f.length};
  }
  return bat ? {e: w ? e / w : 0, d} : (w ? e / w : 0);
}
export function nelder(f, x0, q, it, lo, hi) {
  const N = x0.length, cl = v => v.map((t, j) => Math.min(hi[j], Math.max(lo[j], t)));
  let P = [x0.slice()]; for (let i = 0; i < N; i++) { const pp = x0.slice(); pp[i] += q[i]; P.push(cl(pp)); }
  let F = P.map(f), eng = Infinity, turg = 0;
  for (let k = 0; k < it; k++) {
    const o = F.map((v, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    if (F[N] - F[0] < 1e-7) break;
    if (F[0] < eng - 1e-4) { eng = F[0]; turg = 0; } else if (++turg > 60) break;
    const c = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) c[j] += P[i][j] / N;
    const xr = cl(c.map((t, j) => t + (t - P[N][j]))), fr = f(xr);
    if (fr < F[0]) { const xe = cl(c.map((t, j) => t + 2 * (t - P[N][j]))), fe = f(xe); if (fe < fr) { P[N] = xe; F[N] = fe; } else { P[N] = xr; F[N] = fr; } }
    else if (fr < F[N - 1]) { P[N] = xr; F[N] = fr; }
    else { const xc = cl(c.map((t, j) => t + 0.5 * (P[N][j] - t))), fc = f(xc); if (fc < F[N]) { P[N] = xc; F[N] = fc; } else for (let i = 1; i <= N; i++) { P[i] = cl(P[i].map((t, j) => P[0][j] + 0.5 * (t - P[0][j]))); F[i] = f(P[i]); } }
  }
  return {x: P[0], f: F[0]};
}

export function tekshir() {        // model tomoni (node) == nishon_TEG.json dagi 'biz' (render/3D) ?
  const NB = JSON.parse(readFileSync(ROOT + 'test/qism/inson/nishon_bosh10c.json'));
  for (const K of KADR.filter(K => K.shot >= 2)) { const md = model(K, K.h0, K.kam), b = NB[K.k];
    const r = Object.keys(W).map(q => b[q] && b[q].biz && md.nuqta[q] ? `${q} ${(md.nuqta[q][0] - b[q].biz[0]).toFixed(2)},${(md.nuqta[q][1] - b[q].biz[1]).toFixed(2)}` : '').filter(Boolean);
    const bj = b.jag.biz, js = Object.keys(bj).filter(c => md.jag[+c] !== undefined), jd = js.map(c => md.jag[+c] - bj[c]);
    console.log(`k${K.k}: ${r.join(' | ')} | jag' ${js.length} ustun, o'rt ${(jd.reduce((a, x) => a + x, 0) / Math.max(1, jd.length)).toFixed(2)}`); }
}
/* kamera/poza qo'shimchasi bilan bitta shot bahosi: x = {dEg, dBur, dYon, dD, dSx, dSy, dAz, dEl} -> RMS px (+ kadr tafsiloti) */
export function yuzBaho(shot, v, bat = false) {
  const Ks = KADR.filter(K => K.shot === shot); let e = 0; const d = {};
  for (const K of Ks) {
    const h = {...K.h0, egilish: K.h0.egilish + (v.dEg || 0), burilish: K.h0.burilish + (v.dBur || 0), yonga: (K.h0.yonga || 0) + (v.dYon || 0)};
    const kam = {...K.kam, d: K.kam.d + (v.dD || 0), ekran: [K.kam.ekran[0] + (v.dSx || 0), K.kam.ekran[1] + (v.dSy || 0)], az: K.kam.az + (v.dAz || 0), el: K.kam.el + (v.dEl || 0)};
    const r = xato(K, h, kam, bat); e += bat ? r.e : r; if (bat) d[K.k] = {rms: +Math.sqrt(r.e).toFixed(2), ...r.d};
  }
  const rms = Math.sqrt(e / Ks.length);
  return bat ? {rms, kadr: d} : rms;
}
