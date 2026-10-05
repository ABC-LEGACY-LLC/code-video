import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const ROOT = '/home/claude/work/personaj3d/';
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=320&h=180&film=misol22&qorN=1`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const f = +process.argv[2], X = +process.argv[3], Y = +process.argv[4];
const r = await pg.evaluate(({f, X, Y}) => { window.kadr(f); return window.kapVnuqta(X, Y); }, {f, X, Y});
console.log(JSON.stringify(r));
await br.close(); srv.close();
