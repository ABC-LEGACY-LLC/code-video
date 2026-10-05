// Pass 0 (determinism, pixel compare) + per-frame layer renders + state probes.
// usage: node scan.mjs <outDir> [layers=full,boy,hero,flock,flag]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const outDir = process.argv[2] || 'scan';
const layers = (process.argv[3] || 'full,boy,hero,flock,flag').split(',');
for (const l of layers) fs.mkdirSync(`${outDir}/${l}`, { recursive: true });
const browser = await chromium.launch();
const errors = [];
async function open(url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  return page;
}
const pixelCount = (page, a, b, pre) => page.evaluate(([a, b, pre]) => {
  const c = document.getElementById('c'), x = c.getContext('2d');
  const grab = (i) => { window.renderFrame(i); return x.getImageData(0, 0, c.width, c.height).data; };
  if (pre != null) grab(pre);
  const A = grab(a); grab(b); const B = grab(a);
  let n = 0; for (let k = 0; k < A.length; k += 4) if (A[k] !== B[k] || A[k + 1] !== B[k + 1] || A[k + 2] !== B[k + 2]) n++;
  return { differing: n, of: A.length / 4 };
}, [a, b, pre]);
// Pass 0a: original file, same frame twice with another frame between
const orig = await open(('file://' + ROOT + '/scene.html'));
console.log('pass0 original f40 vs f40 (f70 between):', JSON.stringify(await pixelCount(orig, 40, 70)));
console.log('pass0 original f22 vs f22 (f95 between):', JSON.stringify(await pixelCount(orig, 22, 95)));
const origPix = await orig.evaluate(() => { const c = document.getElementById('c'); window.renderFrame(33); return Array.from(c.getContext('2d').getImageData(0, 0, 1280, 720).data.filter((_, k) => k % 97 === 0)); });
// Pass 0b: instrumented copy renders the same picture as the original
const dbg = await open(('file://' + ROOT + '/audit/scene_dbg.html'));
const dbgPix = await dbg.evaluate(() => { const c = document.getElementById('c'); window.renderFrame(33); return Array.from(c.getContext('2d').getImageData(0, 0, 1280, 720).data.filter((_, k) => k % 97 === 0)); });
let nd = 0; for (let k = 0; k < origPix.length; k++) if (origPix[k] !== dbgPix[k]) nd++;
console.log(`pass0 instrumented vs original f33: ${nd} of ${origPix.length} sampled channel values differ`);
await orig.close();
// scan
const n = await dbg.evaluate(() => window.N_FRAMES);
const probes = [];
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  for (const l of layers) {
    const data = await dbg.evaluate(([i, l]) => { window.renderFrame(i, l === 'full' ? undefined : l); return document.getElementById('c').toDataURL('image/png'); }, [i, l]);
    fs.writeFileSync(`${outDir}/${l}/f${String(i).padStart(3, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  probes.push(await dbg.evaluate((i) => window.__probe(i), i));
}
fs.writeFileSync(`${outDir}/probes.json`, JSON.stringify(probes));
fs.writeFileSync(`${outDir}/keys.json`, JSON.stringify(await dbg.evaluate(() => window.__keys)));
console.log(`scanned ${n} frames x ${layers.length} layers in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (errors.length) console.log('ERRORS:\n' + errors.join('\n')); else console.log('no page errors');
await browser.close();
