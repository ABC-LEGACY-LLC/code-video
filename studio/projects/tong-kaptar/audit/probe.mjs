// Evaluate an expression inside the scene page (after a warm-up render) and print it as JSON.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const expr = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.renderFrame(95));
const r = await page.evaluate((e) => { try { return JSON.stringify((0, eval)(e), (k, v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v); } catch (x) { return 'EXC ' + x.message; } }, expr);
console.log(r);
if (errs.length) console.log('ERRORS', errs.join('\n'));
await browser.close();
