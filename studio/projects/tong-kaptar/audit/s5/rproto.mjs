// node rproto.mjs out.png '{"yaw":-1,"twist":-0.5}' [script]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [out, json, scr] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '')));
page.on('console', (m) => errors.push(m.text()));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.addScriptTag({ path: scr || (ROOT + '/audit/s5/proto1.js') });
const list = JSON.parse(json);
let k = 0;
for (const o of (Array.isArray(list) ? list : [list])) {
  const data = await page.evaluate((o) => { Object.assign(window.PROTO, o); window.setShot('s5p'); window.renderFrame(0); return document.getElementById('c').toDataURL('image/png'); }, o);
  fs.writeFileSync(out.replace('.png', `_${k++}.png`), Buffer.from(data.split(',')[1], 'base64'));
}
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
await browser.close();
