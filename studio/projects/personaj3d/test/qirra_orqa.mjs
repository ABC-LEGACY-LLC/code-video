/* QIRRA -> BOSH FAZOSI (12-o'tish, tuzilish): misol kapyushon qirrasi piksellarini (test/qism/inson/qirra_12.json, MAXFIY)
   kameradan nur bilan bosh markazi atrofidagi R radiusli sferaga (birinchi kesishma) tushirib, bosh fazosida azimut (yuz
   oldidan, gr) va balandlik (y) ga o'tkazadi -- uch ko'rinishdan qirra 3D da qayerda ekanini solishtirish uchun.
   node test/qirra_orqa.mjs [--R 1.3] */
import {FILMLAR} from '../src/film.js';
import {boshMatritsa, kameraOl} from './proyeksiya.mjs';
import * as THREE from 'three';
import {readFileSync, writeFileSync} from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('..', import.meta.url).pathname, RR = arg('R', '1.25,1.45').split(',').map(Number);
const Q = JSON.parse(readFileSync(ROOT + 'test/qism/inson/qirra_12.json'));
const M22 = FILMLAR.misol22.shotlar, KADR = {};
{ let k = 1; M22.forEach((s, si) => { for (let i = 0; i < s.n; i++, k++) KADR[k] = {shot: si + 1, kam: s.kamera, h: {yonga: 0, chokish: 0, orqaga: 0, ...s.poza(s.ushla && s.ushla.includes(i) ? s.ushla[0] : i)}}; }); }
const out = {};
for (const [ks, pts] of Object.entries(Q)) {
  const K = KADR[+ks], Mb = boshMatritsa(K.h), inv = Mb.clone().invert(), cam = kameraOl(K.kam);
  const c = new THREE.Vector3().setFromMatrixPosition(Mb), o = cam.position.clone();
  out[ks] = {};
  for (const R of RR) {
    out[ks][R] = pts.map(([x, y]) => {
      const nd = new THREE.Vector3((x + 0.5) / 320 * 2 - 1, 1 - (y + 0.5) / 180 * 2, 0.5).unproject(cam), d = nd.sub(o).normalize();
      const oc = o.clone().sub(c), b = oc.dot(d), cc = oc.dot(oc) - R * R, disc = b * b - cc;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc), p = o.clone().addScaledVector(d, t).applyMatrix4(inv);
      return [+(Math.atan2(p.x, p.z) * 180 / Math.PI).toFixed(1), +p.y.toFixed(3)];
    }).filter(Boolean);
  }
}
writeFileSync(ROOT + 'test/qism/inson/qirra_bosh_12.json', JSON.stringify(out));
for (const [ks, v] of Object.entries(out)) console.log('k' + ks, Object.entries(v).map(([R, p]) => `R${R}: ${p.length} nuqta`).join(' '));
