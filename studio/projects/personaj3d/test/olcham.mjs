/* SHOT O'LCHAMI (6-o'tish): bosh markazi, toj, old, iyak va 1 birlik necha px -- misolning ekrandagi o'lchovlarini bosh
   fazosiga o'tkazish uchun (masalan, 2-shotda 28.7 px/birlik). node test/olcham.mjs */
import {proyektor} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
const F = FILMLAR.misol22.shotlar;
for (const [si, i] of [[0, 0], [0, 9], [1, 0], [2, 0], [2, 6]]) {
  const sh = F[si], p = proyektor(sh.kamera, sh.poza(i));
  const f = q => p(q).map(v => v.toFixed(1)).join(',');
  const a = p([0, 0, 0]), b = p([0, 1, 0]), c = p([0, 0, 1]);
  console.log(sh.nom, 'i', i, 'markaz', f([0, 0, 0]), 'tepa(0,1.06,0)', f([0, 1.06, 0]), 'old(0,0,1)', f([0, 0, 1]), 'iyak', f([0, -1.18, 0.915]),
    '| 1 birlik y:', Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1), 'px, z:', Math.hypot(c[0] - a[0], c[1] - a[1]).toFixed(1), 'px',
    '| peshona(0,0.6,0.85)', f([0, 0.6, 0.85]), 'chakka(-0.9,0.2,0.2)', f([-0.9, 0.2, 0.2]));
}
