// render shot-4 frames with an override script: node rs4.mjs frames outDir [override.js] [layer]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [sel, outDir, ov, layer] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '')));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'log') errors.push(m.text()); });
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s4'));
if (ov && ov !== '-') await page.addScriptTag({ path: ov });
const n = await page.evaluate(() => window.N_FRAMES);
await page.evaluate((n) => window.renderFrame(n - 1), n);
const frames = sel === 'all' ? [...Array(n).keys()] : sel.split(',').map(Number);
const t0 = Date.now();
for (const i of frames) {
  const data = await page.evaluate(([i, layer]) => { window.renderFrame(i, layer || undefined); return document.getElementById('c').toDataURL('image/png'); }, [i, layer]);
  fs.writeFileSync(`${outDir}/f${String(i).padStart(3, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
}
console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (errors.length) console.log('MSG:\n' + errors.slice(0, 8).join('\n'));
await browser.close();
