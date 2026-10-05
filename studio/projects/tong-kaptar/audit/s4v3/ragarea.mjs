// node ragarea.mjs '<override js>' -> per-frame rag area, and the frames under half the spread area
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [ov, from, to] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s4'));
await page.addScriptTag({ path: (ROOT + '/audit/s4v3/ragarea.js') });
if (ov) await page.addScriptTag({ content: ov + '; RAG_SIM = null;' });
const A = await page.evaluate(() => { const r = []; for (let i = 0; i < window.N_FRAMES; i++) r.push(window.ragArea(i)); return r; });
const f0 = Number(from || 0), f1 = Number(to || 95);
const sp = A.slice(50, 96).sort((a, b) => a - b)[23];        // the spread area: median over the still part
const low = []; for (let i = f0; i <= f1; i++) if (A[i] < 0.5 * sp) low.push(i);
console.log(`spread ${sp}px  frames under half in f${f0}..${f1}: ${low.length} [${low.join(',')}]  min ${Math.min(...A.slice(f0, f1 + 1))}`);
await browser.close();
