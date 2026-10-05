/* QISM NUQTALARI (10-o'tish): bizning modelda har tasvirda nomli qism nuqtalari (window.qismNuqtalar) -- 320x180 px ga
   o'tkazilgan. node test/qism/nuqtalar.mjs --film misol22 --kadrlar 0-21 --chiq test/qism/biz_TEG.json [--qoshimcha 'a=b'] */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('../..', import.meta.url).pathname, FILM = arg('film', 'misol22'), [k0, k1] = arg('kadrlar', '0-21').split('-').map(Number);
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 960, height: 540}});
const QO = arg('qoshimcha', '');
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=960&h=540&film=${FILM}&qorN=1${QO ? '&' + QO : ''}`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const out = {};
for (let k = k0; k <= k1; k++) {
  await pg.evaluate(k => window.kadr(k), k);
  const n = await pg.evaluate(() => window.qismNuqtalar());
  out[k] = Object.fromEntries(Object.entries(n).map(([nm, v]) => [nm, [+(v[0] / 3).toFixed(2), +(v[1] / 3).toFixed(2), +v[2].toFixed(5), v[3]]]));
}
writeFileSync(arg('chiq', ROOT + 'test/qism/biz.json'), JSON.stringify(out));
console.log('kadrlar', Object.keys(out).length, 'nuqtalar', Object.keys(out[k0]).length);
await br.close(); srv.close();
