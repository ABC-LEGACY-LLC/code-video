// Save the head+neck outline as drawn (traced, smoothed) for every frame: node audit/outlinescan.mjs <maskScript.js> <out.json>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [script, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(process.env.SCENE || ('file://' + ROOT + '/scene.html'));
if (process.env.SHOT) await page.evaluate((s) => window.setShot(s), process.env.SHOT);
await page.addScriptTag({ path: script });
await page.evaluate(() => window.renderFrame(window.N_FRAMES - 1));
const all = [];
for (let i = 0; i < 96; i++) all.push(await page.evaluate((i) => window.__headOutline(i), i));
fs.writeFileSync(out, JSON.stringify(all));
await browser.close();
