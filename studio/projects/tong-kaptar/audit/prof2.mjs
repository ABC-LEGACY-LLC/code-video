// Where does the frame time go? Wrap each top-level draw function with a flush + timer.
// usage: node audit/prof2.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
const rows = await page.evaluate(() => {
  const names = ['drawSky', 'drawStars', 'drawSunGlow', 'drawCirrus', 'drawSunDisk', 'drawCloud', 'drawFar', 'drawBlocks', 'drawFlock', 'drawWires', 'drawMahalla', 'drawMotes', 'drawPoleFlag', 'drawParapet', 'drawCoop', 'drawHeroFlying', 'drawFeathers', 'drawBoy', 'finish'];
  const T = {};
  const flush = () => document.getElementById('c').getContext('2d').getImageData(0, 0, 1, 1);
  for (const n of names) {
    const f = window[n];
    window[n] = function (...a) { flush(); const t0 = performance.now(); const r = f.apply(this, a); flush(); (T[n] ??= []).push(performance.now() - t0); return r; };
  }
  window.renderFrame(95);
  for (const k of Object.keys(T)) delete T[k];
  const t0 = performance.now();
  for (let i = 0; i < 96; i += 8) window.renderFrame(i);
  const total = (performance.now() - t0) / 12;
  return { total, rows: Object.entries(T).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / 12, v.length / 12]).sort((a, b) => b[1] - a[1]) };
});
for (const [k, ms, calls] of rows.rows) console.log(`${k.padEnd(16)} ${ms.toFixed(1).padStart(7)} ms/frame  (${calls} calls/frame)  ${(100 * ms / rows.total).toFixed(0)}%`);
console.log('total', rows.total.toFixed(0), 'ms/frame', errs.length ? 'ERRORS ' + errs.join(';') : '');
await browser.close();
