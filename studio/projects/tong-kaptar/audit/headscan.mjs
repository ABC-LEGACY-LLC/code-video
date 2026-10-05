// Render the head/neck masks for every frame: node audit/headscan.mjs <maskScript.js> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [script, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.env.SCENE || ('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
await page.addScriptTag({ path: script });
await page.evaluate(() => window.renderFrame(window.N_FRAMES - 1));
for (let i = 0; i < 96; i++) for (const w of ['A', 'B']) {
  const d = await page.evaluate(([i, w]) => { window.__headMask(i, w); return document.getElementById('c').toDataURL('image/png'); }, [i, w]);
  fs.writeFileSync(`${outDir}/${w}${String(i).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'ok');
await browser.close();
