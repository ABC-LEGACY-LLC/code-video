// node rft.mjs outprefix '[{...},{...}]' -> outprefix_k.png
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [out, json] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '')));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.addScriptTag({ path: (ROOT + '/audit/s5/facetest.js') });
let k = 0;
for (const o of JSON.parse(json)) {
  const data = await page.evaluate((o) => { Object.assign(window.FT, o); window.setShot('s5ft'); window.renderFrame(0); return document.getElementById('c').toDataURL('image/png'); }, o);
  fs.writeFileSync(`${out}_${k++}.png`, Buffer.from(data.split(',')[1], 'base64'));
}
if (errors.length) console.log(errors.slice(0, 3).join('\n'));
await browser.close();
