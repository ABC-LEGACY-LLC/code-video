// Shot-2 flock in numbers, every frame: node audit/flockscan.mjs [override.js] [step]
// state: every bird's centre through the shot's camera (x, y, depth) and its wingspan in px;
// pixels: the flock layer alone, its ink bbox and ink on each frame edge (a bird cut by the frame).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const [ov, stepArg] = process.argv.slice(2);
const step = Number(stepArg || 4);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(('file://' + ROOT + '/scene.html'));
await page.evaluate(() => window.setShot('s2'));
if (ov && ov !== '-') await page.addScriptTag({ path: ov });
const n = await page.evaluate(() => window.N_FRAMES);
const rows = await page.evaluate(([n, step]) => {
  const out = [];
  const cv = document.getElementById('c'), g = cv.getContext('2d');
  for (let i = 0; i < n; i += (i + step >= n && i !== n - 1 ? n - 1 - i : step)) {
    const t = S2.t0 + i / FPS, cam = cam2At(t);
    const birds = FLOCK.map((b) => { const s = flockBird(b, t); const q = cam.project(s.F.o); return { x: q.x, y: q.y, z: q.z, span: 0.68 * b.sz * cam.f / q.z }; });
    const hs = heroState(t), hq = cam.project(hs.F.o);
    const all = birds.concat([{ x: hq.x, y: hq.y, z: hq.z, span: 0.68 * cam.f / hq.z }]);
    const cut = all.filter((b) => b.x - b.span / 2 < 0 || b.x + b.span / 2 > W || b.y - b.span / 2 < 0 || b.y + b.span / 2 > H).length;
    const out_ = all.filter((b) => b.x < 0 || b.x > W || b.y < 0 || b.y > H).length;
    const cx = all.reduce((s, b) => s + b.x, 0) / all.length, cy = all.reduce((s, b) => s + b.y, 0) / all.length;
    const zmed = all.map((b) => b.z).sort((a, b) => a - b)[Math.floor(all.length / 2)];
    const spanMed = all.map((b) => b.span).sort((a, b) => a - b)[Math.floor(all.length / 2)];
    window.renderFrame(i, 'flock');
    const d = g.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1, eL = 0, eR = 0, eT = 0, eB = 0, ink = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] < 40) continue;
      ink++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x === 0) eL++; if (x === W - 1) eR++; if (y === 0) eT++; if (y === H - 1) eB++;
    }
    out.push({ i, t: +t.toFixed(3), cx: Math.round(cx), cy: Math.round(cy), zmed: +zmed.toFixed(1), spanMed: Math.round(spanMed), cut, out: out_, hero: [Math.round(hq.x), Math.round(hq.y), +hq.z.toFixed(1)], bbox: [x0, y0, x1, y1], edges: [eL, eR, eT, eB], ink });
  }
  return out;
}, [n, step]);
console.log(' f     t     cx    cy   zmed span cut out   hero(x,y,z)        ink-bbox                 edge L/R/T/B');
for (const r of rows) console.log(`${String(r.i).padStart(2)} ${r.t.toFixed(2)} ${String(r.cx).padStart(6)} ${String(r.cy).padStart(5)} ${String(r.zmed).padStart(5)} ${String(r.spanMed).padStart(4)} ${String(r.cut).padStart(3)} ${String(r.out).padStart(3)}   ${JSON.stringify(r.hero).padEnd(18)} ${JSON.stringify(r.bbox).padEnd(24)} ${r.edges.join('/')}`);
if (errors.length) console.error('ERRORS', errors.join('\n'));
await browser.close();
