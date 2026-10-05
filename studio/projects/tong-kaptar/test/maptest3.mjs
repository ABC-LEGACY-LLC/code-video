import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' ' + e.stack));
await page.goto(('file://' + ROOT + '/scene.html'));
const res = await page.evaluate(() => {
  const c = document.getElementById('c'), x = c.getContext('2d');
  renderFrame(95);
  const grab = () => x.getImageData(0, 0, c.width, c.height).data.slice();
  // alpha-weighted comparison: gross = pixels whose premultiplied colour differs by > 64 (of 255)
  const cmp = (A, B) => {
    let gross = 0, ax = 0, ay = 0, as = 0, bx = 0, by = 0, bs = 0;
    for (let k = 0, p = 0; k < A.length; k += 4, p++) {
      const aa = A[k + 3] / 255, ba = B[k + 3] / 255;
      let d = 0; for (let j = 0; j < 3; j++) d = Math.max(d, Math.abs(A[k + j] * aa - B[k + j] * ba));
      d = Math.max(d, Math.abs(A[k + 3] - B[k + 3]));
      if (d > 64) gross++;
      const px = p % 1280, py = Math.floor(p / 1280);
      ax += px * aa; ay += py * aa; as += aa; bx += px * ba; by += py * ba; bs += ba;
    }
    return { gross, dCentroid: [+(bx / bs - ax / as).toFixed(3), +(by / bs - ay / as).toFixed(3)], coverage: [+as.toFixed(0), +bs.toFixed(0)] };
  };
  const out = {};
  const i = 60, t = i / FPS, tc = charFrame(i) / FPS;
  const layers = { flag: () => drawPoleFlag(t), coop: () => drawCoop(t, tc), blocks: () => drawBlocks(t), mahalla: () => drawMahalla(t), wires: () => drawWires(t), parapet: () => drawParapet(t) };
  const depth = { flag: 3.4, coop: 3.1, blocks: 60, mahalla: 30, wires: 12, parapet: 3.4 };
  const cam1 = makeCam({ pos: V3(0, craneH(t), 0) });
  for (const [name, fn] of Object.entries(layers)) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1280, 720); fn(); const A = grab();
    x.clearRect(0, 0, 1280, 720); withMap((u, v) => V(u, v), fn); const B = grab();
    x.clearRect(0, 0, 1280, 720); withMap(layerMap(cam1, depth[name], t), fn); const C = grab();
    out[name] = { identity: cmp(A, B), camera: cmp(A, C) };
  }
  return out;
});
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(8), 'identity', JSON.stringify(v.identity), ' camera', JSON.stringify(v.camera));
console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'no errors');
await browser.close();
