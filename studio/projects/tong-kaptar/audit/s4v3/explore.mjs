// node audit/s4v3/explore.mjs '<js overrides>' [detail]  -> summary of probe4 over all frames of s4
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/\/$/, '');
const [ov, detail] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s4'));
await page.addScriptTag({ path: (ROOT + '/audit/s4v3/probe4.js') });
if (ov) await page.addScriptTag({ content: ov });
const out = await page.evaluate(() => { const r = []; for (let i = 0; i < window.N_FRAMES; i++) r.push(window.probe4(i)); return r; });
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
let s = { gapL: 0, gapR: 0, inWL: 0, inWR: 0, inEL: 0, inER: 0, stepEL: [0, 0], stepER: [0, 0], stepWR: [0, 0], tipYmin: [1e9, 0], tipYmax: [-1e9, 0], tipXmin: [1e9, 0], tipXmax: [-1e9, 0], headPxMin: [1e9, 0], chestMin: [1e9, 0], tipSpdMax: [0, 0], behind: [], poleIn: [0, 0], poleInFrames: [] };
for (let i = 0; i < out.length; i++) {
  const v = out[i];
  s.gapL = Math.max(s.gapL, v.gapL); s.gapR = Math.max(s.gapR, v.gapR);
  s.inWL = Math.max(s.inWL, v.inWL); s.inWR = Math.max(s.inWR, v.inWR); s.inEL = Math.max(s.inEL, v.inEL); s.inER = Math.max(s.inER, v.inER);
  if (i) {
    const p = out[i - 1];
    const a = dist(v.EL, p.EL), b = dist(v.ER, p.ER), c = dist(v.WR, p.WR);
    if (a > s.stepEL[0]) s.stepEL = [a, i]; if (b > s.stepER[0]) s.stepER = [b, i]; if (c > s.stepWR[0]) s.stepWR = [c, i];
    const sp = Math.hypot(v.tip[0] - p.tip[0], v.tip[1] - p.tip[1]); if (sp > s.tipSpdMax[0]) s.tipSpdMax = [sp, i];
  }
  if (v.tip[1] < s.tipYmin[0]) s.tipYmin = [v.tip[1], i]; if (v.tip[1] > s.tipYmax[0]) s.tipYmax = [v.tip[1], i];
  if (v.tip[0] < s.tipXmin[0]) s.tipXmin = [v.tip[0], i]; if (v.tip[0] > s.tipXmax[0]) s.tipXmax = [v.tip[0], i];
  if (v.poleHeadPx < s.headPxMin[0]) s.headPxMin = [v.poleHeadPx, i];
  if (v.poleChest < s.chestMin[0]) s.chestMin = [v.poleChest, i];
  if (v.poleHeadPx < 40) s.behind.push(i);
  if (v.poleIn > s.poleIn[0]) s.poleIn = [v.poleIn, i, v.poleInS];
  if (v.poleIn > 0) s.poleInFrames.push(i);
}
const r3 = (x) => (typeof x === 'number' ? Math.round(x * 1000) / 1000 : Array.isArray(x) ? x.map(r3) : x);
for (const k of Object.keys(s)) s[k] = r3(s[k]);
console.log(JSON.stringify(s));
if (detail) for (let i = 0; i < out.length; i += Number(detail)) { const v = out[i]; console.log(i, 'th', v.theta, 'a', v.alpha, 'dL', v.dL, 'dR', v.dR, 'inW', v.inWL, v.inWR, 'tip', v.tip, 'hR', v.hR, 'hL', v.hL, 'head', v.head, 'px', v.poleHeadPx, 'WR', v.WR, 'ER', v.ER); }
if (errors.length) console.error('ERRORS', errors.join('\n'));
await browser.close();
