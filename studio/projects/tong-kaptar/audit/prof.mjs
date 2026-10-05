// Where does the frame time go? Wrap each draw call in renderFrame with a flush + timer.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const TMP = (process.env.TMPDIR || '/tmp').replace(/\/$/, '') + '/kaptar'; (await import('node:fs')).mkdirSync(TMP, { recursive: true });
const file = process.argv[2] || (ROOT + '/history/scene.js');
let src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('  function renderFrame(i');
const end = src.indexOf('\n  }\n', start);
let body = src.slice(start, end);
body = body.replace(/^(\s+)((?:if \([^)]*\) )?(?:for \(const cl of CLOUDS\) )?(draw\w+|finish)\([^;]*\);)$/gm, (m, ind, call, fn) =>
  `${ind}{ const _a = performance.now(); ${call} ctx.getImageData(0, 0, 1, 1); (window.__T[${JSON.stringify(fn)}] ??= []).push(performance.now() - _a); }`);
src = src.slice(0, start) + body + src.slice(end);
src = src.replace('(function () {', '(function () {\n  window.__T = {};');
const dir = (TMP);
fs.writeFileSync(`${dir}/prof.js`, src);
fs.writeFileSync(`${dir}/prof.html`, '<!doctype html><canvas id="c"></canvas><script src="prof.js"></script>');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`file://${dir}/prof.html`);
const T = await page.evaluate(() => { window.renderFrame(0); window.__T = {}; for (let i = 0; i < 96; i += 8) window.renderFrame(i); return window.__T; });
const rows = Object.entries(T).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / 12, v.length / 12]).sort((a, b) => b[1] - a[1]);
let tot = 0; for (const r of rows) tot += r[1];
for (const [k, ms, calls] of rows) console.log(`${k.padEnd(16)} ${ms.toFixed(1).padStart(7)} ms/frame  (${calls} calls/frame)  ${(100 * ms / tot).toFixed(0)}%`);
console.log('total', tot.toFixed(0), 'ms/frame', errs.length ? 'ERRORS ' + errs.join(';') : '');
await browser.close();
