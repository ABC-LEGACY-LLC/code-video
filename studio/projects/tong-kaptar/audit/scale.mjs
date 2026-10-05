// code-audit-structure-scale Pass 2: multiply the unit of growth (flock birds, cloud puffs) and measure per-frame cost.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const TMP = (process.env.TMPDIR || '/tmp').replace(/\/$/, '') + '/kaptar'; (await import('node:fs')).mkdirSync(TMP, { recursive: true });
const src = fs.readFileSync((ROOT + '/history/scene.js'), 'utf8');
const variants = [];
for (const n of [30, 300, 1500, 3000]) {
  const anchor = 'for (let i = 0; i < 30; i++) {\n      arr.push({';
  if (src.split(anchor).length !== 2) throw new Error('flock anchor not unique');
  variants.push([`flock=${n}`, src.replace(anchor, `for (let i = 0; i < ${n}; i++) {\n      arr.push({`)]);
}
const browser = await chromium.launch();
for (const [name, code] of variants) {
  fs.writeFileSync(`${TMP}/scale.js`, code);
  fs.writeFileSync(`${TMP}/scale.html`, '<!doctype html><canvas id="c"></canvas><script src="scale.js"></script>');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const t0 = Date.now();
  await page.goto(('file://' + TMP + '/scale.html'));
  const init = Date.now() - t0;
  const r = await page.evaluate(() => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    window.renderFrame(0); x.getImageData(0, 0, 1, 1);
    const ts = [];
    for (const i of [10, 30, 50, 70, 90]) { const a = performance.now(); window.renderFrame(i); x.getImageData(0, 0, 1, 1); ts.push(performance.now() - a); }
    ts.sort((a, b) => a - b);
    return { median: ts[2], heapMB: (performance.memory ? performance.memory.usedJSHeapSize / 1e6 : -1) };
  });
  console.log(`${name.padEnd(12)} src ${(code.length / 1024).toFixed(1)} KB  init ${init} ms  per-frame median ${r.median.toFixed(1)} ms  heap ${r.heapMB.toFixed(1)} MB  errors ${errs.length}`);
  await page.close();
}
await browser.close();
