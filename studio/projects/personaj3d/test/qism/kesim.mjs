/* bosh fazosidagi soch/kapyushon kesimi (window.tuzKesim) -> JSON: node test/qism/kesim.mjs --kadrlar 2,11,19 [--qoshimcha "..."] --chiq F.json */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = new URL('../..', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
const film = arg('film', 'misol22');
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=320&h=180&film=${film}&qorN=1&${arg('qoshimcha', 'x=1')}`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const out = {};
for (const f of arg('kadrlar', '2,11,19').split(',').map(Number)) out[f] = await pg.evaluate(f => window.tuzKesim(f), f);
writeFileSync(arg('chiq', '/tmp/kesim.json'), JSON.stringify(out));
console.log('ok', Object.keys(out).join(','));
await br.close(); srv.close();
