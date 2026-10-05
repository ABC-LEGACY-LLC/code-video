// Per-frame scan of the rebuilt scene: warm-up, layers per frame, state probes.
// usage: node scan2.mjs <outDir> [layers=full,boy,hero,flock,flag,feathers]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const outDir = process.argv[2] || 'scan';
const layers = (process.argv[3] || 'full,boy,hero,flock,flag,feathers').split(',');
for (const l of layers) fs.mkdirSync(`${outDir}/${l}`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
await page.addScriptTag({ path: (ROOT + '/audit/probe2.js') });
await page.evaluate(() => window.renderFrame(window.N_FRAMES - 1));
const n = await page.evaluate(() => window.N_FRAMES);
const probes = [];
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  for (const l of layers) {
    const data = await page.evaluate(([i, l]) => { window.renderFrame(i, l === 'full' ? undefined : l); return document.getElementById('c').toDataURL('image/png'); }, [i, l]);
    fs.writeFileSync(`${outDir}/${l}/f${String(i).padStart(3, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  probes.push(await page.evaluate((i) => window.__probe(i), i));
}
fs.writeFileSync(`${outDir}/probes.json`, JSON.stringify(probes));
console.log(`scanned ${n} frames x ${layers.length} layers in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(errors.length ? 'ERRORS:\n' + errors.slice(0, 8).join('\n') : 'no page errors');
await browser.close();
