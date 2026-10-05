/* PART POINTS (pass 10): the named part points of our model on every frame (window.framePartPoints) -- converted
   to 320x180 px. node test/parts/points.mjs --film sample22 --frames 0-21 --out test/parts/ours_TAG.json [--extra 'a=b'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../../chrome.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('../..', import.meta.url).pathname, FILM = arg('film', 'sample22'), [k0, k1] = arg('frames', '0-21').split('-').map(Number);
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 960, height: 540}});
const QO = arg('extra', '');
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=960&h=540&film=${FILM}&snowN=1${QO ? '&' + QO : ''}`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
const out = {};
for (let k = k0; k <= k1; k++) {
  await pg.evaluate(k => window.frame(k), k);
  const n = await pg.evaluate(() => window.framePartPoints());
  out[k] = Object.fromEntries(Object.entries(n).map(([nm, v]) => [nm, [+(v[0] / 3).toFixed(2), +(v[1] / 3).toFixed(2), +v[2].toFixed(5), v[3]]]));
}
writeFileSync(arg('out', ROOT + 'test/parts/ours.json'), JSON.stringify(out));
console.log('frames', Object.keys(out).length, 'points', Object.keys(out[k0]).length);
await br.close(); srv.close();
