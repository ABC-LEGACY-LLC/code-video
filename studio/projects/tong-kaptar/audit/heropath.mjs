// Try hero waypoint sets in the page and print screen path, depth-view ratio and speed.
// usage: node audit/heropath.mjs '<json array of {dt,d:[x,y,z]}>'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const wp = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
const out = await page.evaluate((wp) => {
  HERO_WP.length = 0;
  for (const w of wp) HERO_WP.push({ dt: w.dt, d: V3(...w.d) });
  const rows = [];
  let prev = null;
  for (let i = 22; i < 96; i += 2) {
    const t = i / 24, s = heroState(t), pr = (p) => projW(p, t), o = pr(s.F.o);
    const q = pr(a3(s.F.o, m3(n3(s.F.z), 0.3)));
    const v = s3(heroPos(t + 0.01), heroPos(t - 0.01));
    rows.push([i, Math.round(o.x), Math.round(o.y), Math.round(pxPerM(o.z)), Math.round(Math.hypot(q.x - o.x, q.y - o.y)), +(len3(v) * 50).toFixed(1), prev ? +Math.hypot(o.x - prev.x, o.y - prev.y).toFixed(1) / 2 : 0]);
    prev = o;
  }
  return rows;
}, wp);
console.log(' i    x    y   k  fwdPx  speed  px/frame');
for (const r of out) console.log(r.map((v) => String(v).padStart(5)).join(' '));
await browser.close();
