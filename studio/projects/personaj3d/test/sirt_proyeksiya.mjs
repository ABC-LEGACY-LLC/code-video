/* BOSH SIRTI -> EKRAN (12-o'tish, tuzilish): bosh sirtidan off tashqaridagi (soch qatlami) nuqtalar to'ri (azimut x
   balandlik), har berilgan kadr uchun ekrandagi o'rni va ko'rinishi (sirt normali kameraga qaraganmi). Python shu to'rga
   misol va bizning sinflarni (soch / teri / boshqa) qo'yib, sochning bosh sirtidagi QOPLASH XARITASINI chiqaradi (uch
   ko'rinishdan birga) -- sochni 3D da qayerga qo'yishni o'lchash uchun (test/qism/soch_xarita.py).
   node test/sirt_proyeksiya.mjs [--off 0.08] [--kadrlar 3,10,12,16,20] [--chiq test/qism/sirt_proyeksiya.json] */
import {BOSH, boshShakli} from '../src/personaj.js';
import {FILMLAR} from '../src/film.js';
import {proyektor, boshMatritsa, kameraOl} from './proyeksiya.mjs';
import * as THREE from 'three';
import {writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, OFF = +arg('off', 0.08);
const KS = arg('kadrlar', '3,10,12,16,20').split(',').map(Number);
BOSH.surish = 0; BOSH.profilW = 0;
const M22 = FILMLAR.misol22.shotlar, KADR = [];
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) KADR.push({k, shot: si + 1, i, kam: s.kamera, h: {yonga: 0, chokish: 0, orqaga: 0, ...s.poza(s.ushla && s.ushla.includes(i) ? s.ushla[0] : i)}}); }); }
/* to'r: azimut a (gr, 0 -- yuz oldi, -90 -- yaqin (o'ng, -x) yon, +90 -- uzoq), balandlik y (bosh fazosi) */
const AZ = [], YS = [];
for (let a = -180; a <= 180; a += 5) AZ.push(a);
const YMAX = +arg('ymax', 1.05);                      // 12-o'tish: tepani ham (kalla ustini) -- --ymax 1.3
for (let y = YMAX; y >= -1.35; y -= 0.05) YS.push(+y.toFixed(3));
function sirt(a, y) {                          // shu azimut va balandlikdagi sirt nuqtasi (birlik sfera yo'nalishini qidirib)
  const ph = a * Math.PI / 180;
  let lo = -Math.PI / 2, hi = Math.PI / 2;     // kenglik al: boshShakli(y) monoton o'sadi
  for (let i = 0; i < 40; i++) { const m = 0.5 * (lo + hi), p = boshShakli(Math.cos(m) * Math.sin(ph), Math.sin(m), Math.cos(m) * Math.cos(ph), true); if (p[1] < y) lo = m; else hi = m; }
  const al = 0.5 * (lo + hi);
  return boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), true);
}
const out = {off: OFF, az: AZ, y: YS, kadr: {}};
const P = YS.map(y => AZ.map(a => {
  const s = sirt(a, y), e = 1e-3, s1 = sirt(a + 0.5, y), s2 = sirt(a, y + e);
  const t1 = s1.map((v, i) => v - s[i]), t2 = s2.map((v, i) => v - s[i]);
  let n = [t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0]];
  const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
  if (n[0] * s[0] + n[1] * s[1] + n[2] * s[2] < 0) n = n.map(v => -v);          // tashqariga
  return {p: s.map((v, i) => v + n[i] * OFF), n};
}));
for (const k of KS) {
  const K = KADR.find(K => K.k === k), pr = proyektor(K.kam, K.h), Mb = boshMatritsa(K.h), cam = kameraOl(K.kam);
  const cp = cam.position.clone(), R = new THREE.Matrix3().setFromMatrix4(Mb);
  out.kadr[k] = P.map(row => row.map(({p, n}) => {
    const w = new THREE.Vector3(...p).applyMatrix4(Mb), nw = new THREE.Vector3(...n).applyMatrix3(R).normalize();
    const vis = nw.dot(cp.clone().sub(w).normalize());
    const [x, y] = pr(p);
    return [+x.toFixed(2), +y.toFixed(2), +vis.toFixed(3)];
  }));
}
writeFileSync(ROOT + arg('chiq', 'test/qism/sirt_proyeksiya.json'), JSON.stringify(out));
console.log('to\'r', YS.length, 'x', AZ.length, 'kadrlar', KS.join(','));
