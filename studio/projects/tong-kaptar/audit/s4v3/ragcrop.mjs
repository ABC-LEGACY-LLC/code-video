// crops of the rag, centred on it, for given frames: node ragcrop.mjs framesDir f0,f1,... out.png [size]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [dir, sel, out, size] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s4'));
await page.addScriptTag({ path: (ROOT + '/audit/s4v3/ragflock.js') });
const fr = sel.split(',').map(Number);
const c = await page.evaluate((fr) => fr.map((i) => window.ragFlock(i).rag), fr);
console.log(JSON.stringify(c));
await browser.close();
