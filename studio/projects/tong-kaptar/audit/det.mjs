// Pass 0 deep-dive: where do repeated renders differ, by how much, and does the software canvas path fix it?
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const url = process.argv[2] || ('file://' + ROOT + '/scene.html');
for (const args of [[], ['--disable-accelerated-2d-canvas', '--disable-gpu']]) {
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url);
  const res = await page.evaluate(() => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    const grab = (i) => { window.renderFrame(i); return x.getImageData(0, 0, c.width, c.height).data.slice(); };
    const out = [];
    for (const [a, b] of [[40, 70], [40, 0], [40, 40], [60, 12], [88, 3], [22, 95]]) {
      const A = grab(a); grab(b); const B = grab(a);
      let n = 0, mx = 0, xs = [], ys = [];
      for (let k = 0; k < A.length; k += 4) {
        const d = Math.max(Math.abs(A[k] - B[k]), Math.abs(A[k + 1] - B[k + 1]), Math.abs(A[k + 2] - B[k + 2]));
        if (d) { n++; mx = Math.max(mx, d); const p = k / 4; xs.push(p % c.width); ys.push(Math.floor(p / c.width)); }
      }
      out.push({ frame: a, between: b, differing: n, maxDelta: mx,
        bbox: n ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] : null });
    }
    return out;
  });
  console.log(args.length ? 'software canvas' : 'default canvas', JSON.stringify(res));
  await browser.close();
}
