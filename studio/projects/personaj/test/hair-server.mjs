/* HAIR FITTING SERVER (pass 11). One Chromium page stays open;
   on stdin, one JSON per line: {"i":0,"over":{...},"out":"/path/x.png","boil":false}
   -> frameSVG(i, over, boil) in images.mjs (the SAME code as film.mjs)
   -> #w is screenshotted (with the sky background, no snow particles -- a clean render)
   -> to stdout "ok <out>" or "error <text>".
   When the code (face.mjs etc.) changes, restart the server: ESM cache. */
import {chromium} from 'playwright';
import {existsSync, readdirSync} from 'fs';
import {createInterface} from 'readline';
import {frameSVG, hairGeo, hoodGeo, STYLE_CSS, GRAD, W, H, BACKGROUND} from '../images.mjs';
import {chrome} from '../chrome.mjs';

const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const a = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const br = await chromium.launch(exe ? {args: a, executablePath: exe} : {args: a});
const pg = await br.newPage({viewport: {width: 600, height: 360}});
await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}
#w{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${BACKGROUND}}
#w>svg{position:absolute;inset:0}
</style></head><body><div id="w"></div></body></html>`);
const rl = createInterface({input: process.stdin});
process.stdout.write('ready\n');
for await (const line of rl) {
  if (!line.trim()) continue;
  try {
    const q = JSON.parse(line);
    if (q.cmd === 'geo') { process.stdout.write('ok ' + JSON.stringify(hairGeo(q.i, q.prm || {})) + '\n'); continue; }
    if (q.cmd === 'hoodgeo') { process.stdout.write('ok ' + JSON.stringify(hoodGeo(q.i, q.over || {})) + '\n'); continue; }
    const svg = frameSVG(q.i, q.over || {}, !!q.boil);
    const doc = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><style>${STYLE_CSS}</style>${svg}</svg>`;
    await pg.evaluate(h => { document.getElementById('w').innerHTML = h; }, doc);
    await pg.locator('#w').screenshot({path: q.out});
    process.stdout.write('ok ' + q.out + '\n');
  } catch (e) {
    process.stdout.write('error ' + String(e.message || e).replace(/\n/g, ' ') + '\n');
  }
}
await br.close();
