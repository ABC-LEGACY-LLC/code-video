/* PAGE vs NODE PROJECTION -- on a film image, are the screen positions from the page (window.headPoint) and from
   test/projection.mjs the same (does the fit result carry over to the render correctly). node test/page_check.mjs */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {projector} from './projection.mjs';
import {FILMS} from '../src/film.js';
import {FACE, facePoint, chinPoint, nosePoint} from '../src/personaj.js';
import {chrome} from '../chrome.mjs';
const P3D_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj3d folder
const ROOT = (P3D_DIR + '/');
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 960, height: 540}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=anime&w=960&h=540&film=sample22&snowN=1`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
const pts = {eye: facePoint(-FACE.eyeX, FACE.eyeY), chin: chinPoint(), nose: nosePoint()};
for (const f of [11, 21]) {
  await pg.evaluate(n => window.frame(n), f);
  const r = await pg.evaluate(P => Object.fromEntries(Object.entries(P).map(([k, p]) => [k, window.headPoint(p)])), pts);
  const sh = f === 11 ? FILMS.sample22.shotList[1] : FILMS.sample22.shotList[2], i = f === 11 ? 0 : 8;
  const pr = projector(sh.camera, sh.pose(i));
  for (const k in pts) { const a = r[k].map(v => v / 3), b = pr(pts[k]); console.log(f, k, 'page(320)', a.map(v => v.toFixed(1)), 'node', b.map(v => v.toFixed(1))); }
}
await br.close(); srv.close();
