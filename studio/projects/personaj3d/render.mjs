/* RENDER: node render.mjs --style anime --camera below --frames 0-119 --out frames/anime-below [--w 960 --h 540]
   Chromium (SwiftShader -- no GPU) opens the page, draws each frame with window.frame(n),
   saves a PNG, measures the time. */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {chrome} from './chrome.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const STYLE = arg('style', 'anime'), CAM = arg('camera', 'below'), W = +arg('w', 960), H = +arg('h', 540);
const [k0, k1] = arg('frames', '0-0').split('-').map(Number), OUT = arg('out', 'frames/' + STYLE + '-' + CAM);
const ROOT = new URL('.', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const port = srv.address().port;

const br = await chromium.launch({executablePath: chrome(),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
pg.on('pageerror', e => console.error('page error:', e.message));
const QO = [arg('extra', ''), arg('film', '') ? 'film=' + arg('film', '') : ''].filter(Boolean).join('&');
await pg.goto(`http://127.0.0.1:${port}/index.html?style=${STYLE}&camera=${CAM}&w=${W}&h=${H}${QO ? '&' + QO : ''}`);
await pg.waitForFunction(() => window.ready, null, {timeout: 60000});
mkdirSync(OUT, {recursive: true});
const t0 = Date.now();
for (let n = k0; n <= k1; n++) {
  await pg.evaluate(n => window.frame(n), n);
  const d = await pg.evaluate(() => window.image());
  writeFileSync(`${OUT}/${String(n).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
const ms = (Date.now() - t0) / (k1 - k0 + 1);
console.log(JSON.stringify({style: STYLE, camera: CAM, frames: k1 - k0 + 1, ms_image: Math.round(ms), out: OUT}));
await br.close(); srv.close();
