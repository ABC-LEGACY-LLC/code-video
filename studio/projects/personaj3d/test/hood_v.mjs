import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const P3D_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj3d folder
const ROOT = (P3D_DIR + '/');
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=320&h=180&film=sample22&snowN=1`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
const f = +process.argv[2], X = +process.argv[3], Y = +process.argv[4];
const r = await pg.evaluate(({f, X, Y}) => { window.frame(f); return window.hoodVPoint(X, Y); }, {f, X, Y});
console.log(JSON.stringify(r));
await br.close(); srv.close();
