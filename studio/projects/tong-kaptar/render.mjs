// Renders frames of scene.html to PNG with headless Chromium.
// usage: node render.mjs [frames: all | 0,12,24 ] [outDir] [layer]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');

const sel = process.argv[2] || 'all';
const outDir = process.argv[3] || 'frames';
const layer = process.argv[4] || null;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '')));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
const n = await page.evaluate(() => window.N_FRAMES);
// Pass 0: the first render in a fresh page differs from later ones (74 px measured), so warm up first
await page.evaluate((n) => window.renderFrame(n - 1), n);
const frames = sel === 'all' ? [...Array(n).keys()] : sel.split(',').map(Number);
const t0 = Date.now();
for (const i of frames) {
  const data = await page.evaluate(([i, layer]) => { window.renderFrame(i, layer || undefined); return document.getElementById('c').toDataURL('image/png'); }, [i, layer]);
  fs.writeFileSync(`${outDir}/f${String(i).padStart(3, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
}
console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 5).join('\n'));
await browser.close();
