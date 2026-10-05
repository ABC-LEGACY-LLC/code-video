import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const browser = await chromium.launch();
for (const warm of [null, 95, 0]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(('file://' + ROOT + '/scene.html'));
  const r = await page.evaluate((warm) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    if (warm != null) window.renderFrame(warm);
    const grab = (i) => { window.renderFrame(i); return x.getImageData(0, 0, c.width, c.height).data.slice(); };
    const cmp = (A, B) => { let n = 0; for (let k = 0; k < A.length; k += 4) if (A[k] !== B[k] || A[k+1] !== B[k+1] || A[k+2] !== B[k+2]) n++; return n; };
    const A = grab(40); grab(70); const B = grab(40); grab(5); const C = grab(40);
    return { first_vs_second: cmp(A, B), second_vs_third: cmp(B, C) };
  }, warm);
  console.log('warm-up', warm, JSON.stringify(r));
  await page.close();
}
// Does the first toDataURL frame (as render.mjs does it) differ from a warm one?
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
const r2 = await page.evaluate(async () => {
  const c = document.getElementById('c');
  const dec = async (url) => { const im = new Image(); im.src = url; await im.decode(); const o = document.createElement('canvas'); o.width = 1280; o.height = 720; const g = o.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, 1280, 720).data; };
  window.renderFrame(0); const A = await dec(c.toDataURL('image/png'));
  window.renderFrame(50); window.renderFrame(0); const B = await dec(c.toDataURL('image/png'));
  let n = 0; for (let k = 0; k < A.length; k += 4) if (A[k] !== B[k] || A[k+1] !== B[k+1] || A[k+2] !== B[k+2]) n++;
  return n;
});
console.log('render.mjs path: cold f000 vs warm f000 differing px =', r2);
await browser.close();
