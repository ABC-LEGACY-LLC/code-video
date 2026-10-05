import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
const ROOT = '/home/claude/work/personaj3d/';
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': {'.html': 'text/html', '.js': 'text/javascript'}[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 320, height: 180}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=rol&w=320&h=180&film=${process.argv[2] || 'orbita'}&vaqt=0.5`);
await pg.waitForFunction(() => window.tayyor);
const r = await pg.evaluate((n) => { window.kadr(n); const o = window.obyekt(); const c = a => { const s = [0, 0, 0]; for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) s[k] += a[i + k]; return s.map(v => (v / (a.length / 3)).toFixed(3)); };
  const bb = a => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a[i + k]); mx[k] = Math.max(mx[k], a[i + k]); } return [mn.map(v => v.toFixed(2)), mx.map(v => v.toFixed(2))]; };
  return {teri: c(o.teri), teriBB: bb(o.teri), kap: c(o.kapyushon), kapBB: bb(o.kapyushon), koz: o.koz.slice(0, 3).map(v => v.toFixed(3)), plashBB: bb(o.plash)}; }, +(process.argv[3] || 0));
console.log(JSON.stringify(r));
await br.close(); srv.close();
