/* SAHIFA vs NODE PROYEKSIYASI -- film tasvirida sahifadagi (window.boshNuqta) va test/proyeksiya.mjs dagi ekran o'rinlari
   bir xilmi (moslash natijasi renderga to'g'ri o'tadimi). node test/sahifa_tekshir.mjs */
import {chromium} from 'playwright-core';
import {createServer} from 'http';
import {readFileSync, existsSync} from 'fs';
import {extname, join} from 'path';
import {proyektor} from './proyeksiya.mjs';
import {FILMLAR} from '../src/film.js';
import {YUZ, yuzNuqta, iyakNuqta, burunNuqta} from '../src/personaj.js';
const ROOT = '/home/claude/work/personaj3d/';
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': MIME[extname(p)] || 'application/octet-stream'}); r.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await br.newPage({viewport: {width: 960, height: 540}});
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html?style=anime&w=960&h=540&film=misol22&qorN=1`);
await pg.waitForFunction(() => window.tayyor, null, {timeout: 60000});
const pts = {koz: yuzNuqta(-YUZ.kozX, YUZ.kozY), iyak: iyakNuqta(), burun: burunNuqta()};
for (const f of [11, 21]) {
  await pg.evaluate(n => window.kadr(n), f);
  const r = await pg.evaluate(P => Object.fromEntries(Object.entries(P).map(([k, p]) => [k, window.boshNuqta(p)])), pts);
  const sh = f === 11 ? FILMLAR.misol22.shotlar[1] : FILMLAR.misol22.shotlar[2], i = f === 11 ? 0 : 8;
  const pr = proyektor(sh.kamera, sh.poza(i));
  for (const k in pts) { const a = r[k].map(v => v / 3), b = pr(pts[k]); console.log(f, k, 'sahifa(320)', a.map(v => v.toFixed(1)), 'node', b.map(v => v.toFixed(1))); }
}
await br.close(); srv.close();
