/* SOCH DAM SHAKLLARI EKRANDA (6-o'tish, fizikasiz): har tutam dam0 (3/4) nuqtalari shot kamerasida qayerga tushadi.
   node test/soch_dam.mjs SHOT TASVIR [i,j,...]  (SHOT 0..2, TASVIR shot ichida; indekslar -- tutamlarDizayni tartibi) */
import {tutamlarDizayni} from '../src/personaj.js';
import {proyektor} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
const si = +(process.argv[2] || 0), fi = +(process.argv[3] || 0), sel = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
const T = tutamlarDizayni(), sh = FILMLAR.misol22.shotlar[si], p = proyektor(sh.kamera, sh.poza(fi));
T.forEach((t, i) => { if (!sel.length || sel.includes(i)) console.log(i, 'en', t.en.toFixed(2), 'ekran', t.dam0.map(q => p(q).map(v => v.toFixed(0)).join(',')).join(' ')); });
