// Pass 0 for any shot: same frame, same pixels? node audit/det_s2.mjs <shot> [frames]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const shot = process.argv[2] || 's2';
const fr = (process.argv[3] || '40,70,5,95').split(',').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
const r = await page.evaluate(([shot, fr]) => {
  window.setShot(shot);
  const c = document.getElementById('c'), x = c.getContext('2d');
  window.renderFrame(window.N_FRAMES - 1);                         // warm-up
  const grab = (i) => { window.renderFrame(i); return x.getImageData(0, 0, c.width, c.height).data.slice(); };
  const cmp = (A, B) => { let n = 0; for (let k = 0; k < A.length; k += 4) if (A[k] !== B[k] || A[k + 1] !== B[k + 1] || A[k + 2] !== B[k + 2]) n++; return n; };
  const out = {};
  for (const i of fr) { const A = grab(i); for (const j of fr) if (j !== i) grab(j); const B = grab(i); out[i] = cmp(A, B); }
  return out;
}, [shot, fr]);
console.log(shot, 'differing px, same frame rendered twice with others between:', JSON.stringify(r));
await browser.close();
