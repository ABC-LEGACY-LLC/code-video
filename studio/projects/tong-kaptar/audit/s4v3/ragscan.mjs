// node audit/s4v3/ragscan.mjs '<js overrides>' -> rag/flock proximity summary + rag centre per 6 frames
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [ov] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s4'));
await page.addScriptTag({ path: (ROOT + '/audit/s4v3/ragflock.js') });
if (ov) await page.addScriptTag({ content: ov + '; RAG_SIM = null;' });
const out = await page.evaluate(() => { const r = []; for (let i = 0; i < window.N_FRAMES; i++) r.push(window.ragFlock(i)); return r; });
const tot = out.reduce((s, v) => s + v.near, 0), after = out.slice(60).reduce((s, v) => s + v.near, 0);
console.log('near all', tot, 'after60', after, 'max', Math.max(...out.map((v) => v.near)));
console.log(out.map((v, i) => (i % 6 === 0 || i === 95 ? `${i}:${v.rag}/${v.near}` : null)).filter(Boolean).join('  '));
if (errors.length) console.error('ERRORS', errors.join('\n'));
await browser.close();
