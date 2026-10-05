/* HAIR REST SHAPES ON SCREEN (pass 6, without physics): where each strand's rest0 (3/4) points land in the shot camera.
   node test/hair_rest.mjs SHOT IMAGE [i,j,...]  (SHOT 0..2, IMAGE within the shot; indices -- strandsDesign order) */
import {strandsDesign} from '../src/personaj.js';
import {projector} from './projection.mjs';
import {FILMS} from '../src/film.js';
const si = +(process.argv[2] || 0), fi = +(process.argv[3] || 0), sel = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
const T = strandsDesign(), sh = FILMS.sample22.shotList[si], p = projector(sh.camera, sh.pose(fi));
T.forEach((t, i) => { if (!sel.length || sel.includes(i)) console.log(i, 'width', t.en.toFixed(2), 'screen', t.rest0.map(q => p(q).map(v => v.toFixed(0)).join(',')).join(' ')); });
