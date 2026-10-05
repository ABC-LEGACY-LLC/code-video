/* SOCH MOSLASH SERVERI (11-o'tish). Bitta Chromium sahifasi ochiq turadi;
   stdin dan har qatorda JSON: {"i":0,"ust":{...},"chiq":"/yo'l/x.png","qaynash":false}
   -> tasvirlar.mjs dagi kadrSVG(i, ust, qaynash) (film.mjs bilan BIR XIL kod)
   -> #w suratga olinadi (osmon foni bor, qor zarralari yo'q -- toza render)
   -> stdout ga "ok <chiq>" yoki "xato <matn>".
   Kod (yuz.mjs va h.k.) o'zgarsa server qayta ishga tushiriladi: ESM kesh. */
import {chromium} from 'playwright';
import {existsSync, readdirSync} from 'fs';
import {createInterface} from 'readline';
import {kadrSVG, sochGeo, kapGeo, USLUB, GRAD, W, H, FON} from '../tasvirlar.mjs';

let exe = null; const r = '/opt/pw-browsers';
if (existsSync(r)) for (const d of readdirSync(r).filter(x => x.startsWith('chromium') && !x.includes('headless')).sort().reverse()) {
  const p = `${r}/${d}/chrome-linux/chrome`; if (existsSync(p)) { exe = p; break; } }
const a = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const br = await chromium.launch(exe ? {args: a, executablePath: exe} : {args: a});
const pg = await br.newPage({viewport: {width: 600, height: 360}});
await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}
#w{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${FON}}
#w>svg{position:absolute;inset:0}
</style></head><body><div id="w"></div></body></html>`);
const rl = createInterface({input: process.stdin});
process.stdout.write('tayyor\n');
for await (const line of rl) {
  if (!line.trim()) continue;
  try {
    const q = JSON.parse(line);
    if (q.cmd === 'geo') { process.stdout.write('ok ' + JSON.stringify(sochGeo(q.i, q.prm || {})) + '\n'); continue; }
    if (q.cmd === 'kapgeo') { process.stdout.write('ok ' + JSON.stringify(kapGeo(q.i, q.ust || {})) + '\n'); continue; }
    const svg = kadrSVG(q.i, q.ust || {}, !!q.qaynash);
    const doc = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><style>${USLUB}</style>${svg}</svg>`;
    await pg.evaluate(h => { document.getElementById('w').innerHTML = h; }, doc);
    await pg.locator('#w').screenshot({path: q.chiq});
    process.stdout.write('ok ' + q.chiq + '\n');
  } catch (e) {
    process.stdout.write('xato ' + String(e.message || e).replace(/\n/g, ' ') + '\n');
  }
}
await br.close();
