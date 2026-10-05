// node sound/scan.mjs [from] [to] [sub] -> sound/scan.json : the sound probe over edit B
// (B frames from..to, sub samples a frame), and the rag's cloth at every substep of shot 4.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const from = +(process.argv[2] ?? 0), to = +(process.argv[3] ?? 504), sub = +(process.argv[4] ?? 4);
const out = process.argv[5] || (ROOT + '/sound/scan.json');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '')));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(('file://' + ROOT + '/scene.html'));
await page.addScriptTag({ path: (ROOT + '/sound/probe.js') });
const t0 = Date.now();
const rows = [];
for (let a = from; a < to; a += 12) {
  const b = Math.min(to, a + 12);
  rows.push(...(await page.evaluate(([a, b, s]) => window.soundScan(a, b, s), [a, b, sub])));
  process.stderr.write(`\r${b}/${to}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
process.stderr.write('\n');
const rag = from <= 234 && to >= 324 ? await page.evaluate(() => window.ragScan()) : null;
fs.writeFileSync(out, JSON.stringify({ from, to, sub, rows, rag }));
console.log(`${rows.length} samples, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 5).join('\n'));
await browser.close();
