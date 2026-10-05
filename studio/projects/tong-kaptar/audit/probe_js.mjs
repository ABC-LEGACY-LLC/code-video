// node audit/probe_js.mjs <script.js> <fnName> <frames|all> -> JSON per frame
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [scr, fn, sel] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
await page.addScriptTag({ path: scr });
const n = await page.evaluate(() => window.N_FRAMES);
const frames = sel === 'all' ? [...Array(n).keys()] : sel.split(',').map(Number);
const out = [];
for (const i of frames) out.push({ i, v: await page.evaluate(([f, i]) => window[f](i), [fn, i]) });
console.log(JSON.stringify(out));
if (errors.length) console.error('ERRORS', errors.join('\n'));
await browser.close();
