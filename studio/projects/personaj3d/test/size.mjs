/* SHOT SIZE (pass 6): head centre, crown, front, chin and how many px 1 unit is -- to carry the sample's on-screen
   measurements over into head space (for example, 28.7 px/unit in shot 2). node test/size.mjs */
import {projector} from './projection.mjs';
import {FILMS} from '../src/film.js';
const F = FILMS.sample22.shotList;
for (const [si, i] of [[0, 0], [0, 9], [1, 0], [2, 0], [2, 6]]) {
  const sh = F[si], p = projector(sh.camera, sh.pose(i));
  const f = q => p(q).map(v => v.toFixed(1)).join(',');
  const a = p([0, 0, 0]), b = p([0, 1, 0]), c = p([0, 0, 1]);
  console.log(sh.name, 'i', i, 'centre', f([0, 0, 0]), 'top(0,1.06,0)', f([0, 1.06, 0]), 'front(0,0,1)', f([0, 0, 1]), 'chin', f([0, -1.18, 0.915]),
    '| 1 unit y:', Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1), 'px, z:', Math.hypot(c[0] - a[0], c[1] - a[1]).toFixed(1), 'px',
    '| forehead(0,0.6,0.85)', f([0, 0.6, 0.85]), 'temple(-0.9,0.2,0.2)', f([-0.9, 0.2, 0.2]));
}
