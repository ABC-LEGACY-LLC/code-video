// Debug overlay of the hands in shot 5: near shapes (blue), far shapes (red), the body cover
// (green), over the boy layer. node audit/s5/handdbg.mjs out_prefix f1,f2,...
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [out, sel] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s5'));
for (const i of sel.split(',').map(Number)) {
  const data = await page.evaluate((i) => {
    const tu0 = window.traceUnion, cap = [];
    window.traceUnion = function (shapes, sigma, behind) { if (behind) cap.push({ shapes, behind }); return tu0(shapes, sigma, behind); };
    try { window.renderFrame(i, 'boy'); } finally { window.traceUnion = tu0; }
    const c = document.getElementById('c'), g = c.getContext('2d');
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = 0.7;
    for (const { shapes, behind } of cap) {
      g.strokeStyle = 'rgba(0,200,0,0.9)'; g.stroke(behind.cover);
      for (const s of behind.shapes) { g.strokeStyle = 'rgba(255,0,0,0.9)'; g.beginPath(); s.pts.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.stroke(); }
      for (const s of shapes) { g.strokeStyle = 'rgba(0,120,255,0.9)'; g.beginPath(); s.pts.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.stroke(); }
    }
    g.restore();
    return c.toDataURL('image/png');
  }, i);
  fs.writeFileSync(`${out}_f${String(i).padStart(3, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
}
if (errors.length) console.log(errors.slice(0, 3).join('\n'));
await browser.close();
