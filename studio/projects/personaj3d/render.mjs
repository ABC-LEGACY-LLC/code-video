/* RENDER: node render.mjs --style anime --kamera pastdan --kadrlar 0-119 --chiq kadrlar/anime-pastdan [--w 960 --h 540]
   Chromium (SwiftShader -- GPU siz) sahifani ochadi, har tasvirni window.kadr(n) bilan chizadi,
   PNG saqlaydi, vaqtni o'lchaydi. */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'fs';
import {extname, join} from 'path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const STYLE = arg('style', 'anime'), KAM = arg('kamera', 'pastdan'), W = +arg('w', 960), H = +arg('h', 540);
const [k0, k1] = arg('kadrlar', '0-0').split('-').map(Number), CHIQ = arg('chiq', 'kadrlar/' + STYLE + '-' + KAM);
const ROOT = new URL('.', import.meta.url).pathname;
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = createServer((q, r) => {
  const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const port = srv.address().port;

const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: W, height: H}});
pg.on('console', m => { if (m.type() === 'error') console.error('konsol:', m.text()); });
pg.on('pageerror', e => console.error('sahifa xatosi:', e.message));
const QO = [arg('qoshimcha', ''), arg('film', '') ? 'film=' + arg('film', '') : ''].filter(Boolean).join('&');
await pg.goto(`http://127.0.0.1:${port}/index.html?style=${STYLE}&kamera=${KAM}&w=${W}&h=${H}${QO ? '&' + QO : ''}`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
mkdirSync(CHIQ, {recursive: true});
const t0 = Date.now();
for (let n = k0; n <= k1; n++) {
  await pg.evaluate(n => window.kadr(n), n);
  const d = await pg.evaluate(() => window.tasvir());
  writeFileSync(`${CHIQ}/${String(n).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
const ms = (Date.now() - t0) / (k1 - k0 + 1);
console.log(JSON.stringify({style: STYLE, kamera: KAM, kadrlar: k1 - k0 + 1, ms_tasvir: Math.round(ms), chiq: CHIQ}));
await br.close(); srv.close();
