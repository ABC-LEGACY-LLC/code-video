// Is the thrown pigeon the brightest bird? Per frame: its luma (90th pct inside its own layer's
// mask, read from the finished frame) against the brightest flock bird's (same measure, per bird
// blob). node audit/herolum.mjs <shot> <step>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [shot, stepA] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
const rows = await page.evaluate(([shot, step]) => {
  window.setShot(shot);
  const c = document.getElementById('c'), g = c.getContext('2d');
  window.renderFrame(window.N_FRAMES - 1);
  const out = [];
  const pct = (a, q) => { if (!a.length) return 0; a.sort((x, y) => x - y); return a[Math.floor((a.length - 1) * q)]; };
  for (let i = 0; i < window.N_FRAMES; i += step) {
    window.renderFrame(i, 'hero'); const H = g.getImageData(0, 0, W, 720).data;
    window.renderFrame(i, 'flock'); const Fk = g.getImageData(0, 0, W, 720).data;
    window.renderFrame(i); const Fu = g.getImageData(0, 0, W, 720).data;
    const lum = (k) => 0.299 * Fu[k] + 0.587 * Fu[k + 1] + 0.114 * Fu[k + 2];
    const hl = [];
    for (let k = 0; k < H.length; k += 4) if (H[k + 3] > 200) hl.push(lum(k));
    // flock birds: 16x16 cells of flock ink, the brightest cell's 90th pct
    let best = 0;
    for (let cy = 0; cy < 720; cy += 16) for (let cx = 0; cx < W; cx += 16) {
      const a = [];
      for (let y = cy; y < Math.min(720, cy + 16); y++) for (let x = cx; x < Math.min(W, cx + 16); x++) { const k = (y * W + x) * 4; if (Fk[k + 3] > 200 && H[k + 3] < 10) a.push(lum(k)); }
      if (a.length > 20) best = Math.max(best, pct(a, 0.9));
    }
    out.push([i, Math.round(pct(hl, 0.9)), hl.length, Math.round(best)]);
  }
  return out;
}, [shot, Number(stepA || 4)].map((v, k) => v)).catch((e) => { throw e; });
console.log('frame  hero-luma(90%) hero-px  brightest-flock-cell-luma(90%)');
for (const r of rows) console.log(r.join('\t'));
await browser.close();
