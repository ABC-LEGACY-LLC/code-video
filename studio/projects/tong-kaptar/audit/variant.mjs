// Try pose variants without editing the source: node audit/variant.mjs '<js run in page before render>' <frames> <outDir> [layer]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [code, sel, outDir, layer] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
await page.evaluate((c) => (0, eval)(c), code);
await page.evaluate(() => window.renderFrame(window.N_FRAMES - 1));
for (const i of sel.split(',').map(Number)) {
  const d = await page.evaluate(([i, l]) => { window.renderFrame(i, l || undefined); return document.getElementById('c').toDataURL('image/png'); }, [i, layer]);
  fs.writeFileSync(`${outDir}/f${String(i).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'ok');
await browser.close();
