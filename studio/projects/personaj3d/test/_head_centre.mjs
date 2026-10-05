import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from '../chrome.mjs';
const P3D_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj3d folder
const ROOT = (P3D_DIR + '/');
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': {'.html': 'text/html', '.js': 'text/javascript'}[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: chrome(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=role&w=320&h=180&film=${process.argv[2] || 'orbit'}&time=0.5`);
await pg.waitForFunction(() => window.ready);
const r = await pg.evaluate((n) => { window.frame(n); const o = window.objects(); const c = a => { const s = [0, 0, 0]; for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) s[k] += a[i + k]; return s.map(v => (v / (a.length / 3)).toFixed(3)); };
  const bb = a => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a[i + k]); mx[k] = Math.max(mx[k], a[i + k]); } return [mn.map(v => v.toFixed(2)), mx.map(v => v.toFixed(2))]; };
  return {skin: c(o.skin), skinBB: bb(o.skin), hood: c(o.hood), hoodBB: bb(o.hood), eye: o.eye.slice(0, 3).map(v => v.toFixed(3)), cloakBB: bb(o.cloak)}; }, +(process.argv[3] || 0));
console.log(JSON.stringify(r));
await br.close(); srv.close();
