// Design the hero path in screen space: waypoints [frame, sx, sy, depth] -> world offsets from
// the release point; print the resulting screen path, per-frame screen speed, 3-D speed, tail-on.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const wps = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(('file://' + ROOT + '/scene.html'));
const out = await page.evaluate((wps) => {
  const P0 = heroStart();
  HERO_WP.length = 0;
  for (const [f, sx, sy, z] of wps) {
    const t = f / FPS, p = unprojW(sx, sy, z, t);
    HERO_WP.push({ dt: t - RELEASE_T, d: s3(p, P0) });
  }
  const rows = []; let prev = null;
  for (let i = 22; i < 96; i += 2) {
    const t = i / 24, s = heroState(t), o = projW(s.F.o, t);
    const q = projW(a3(s.F.o, m3(n3(s.F.z), 0.3)), t);
    const v = s3(heroPos(t + 0.01), heroPos(t - 0.01));
    rows.push([i, Math.round(o.x), Math.round(o.y), Math.round(pxPerM(o.z)), Math.round(Math.hypot(q.x - o.x, q.y - o.y)), +(len3(v) * 50).toFixed(1), prev ? +(Math.hypot(o.x - prev.x, o.y - prev.y) / 2).toFixed(1) : 0]);
    prev = o;
  }
  return { rows, wp: HERO_WP.map((w) => ({ dt: +w.dt.toFixed(3), d: [+w.d.x.toFixed(2), +w.d.y.toFixed(2), +w.d.z.toFixed(2)] })) };
}, wps);
console.log(' i    x    y   k  fwdPx  speed  px/frame');
for (const r of out.rows) console.log(r.map((v) => String(v).padStart(5)).join(' '));
console.log(JSON.stringify(out.wp));
await browser.close();
