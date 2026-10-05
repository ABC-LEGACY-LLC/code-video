// Calibration of the mapping renderer: a layer drawn through an identity map (and through the
// shot-1 camera expressed as a 3-D camera) must match the layer drawn natively.
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
  const cmp = (A, B) => { let n = 0, s = 0; for (let k = 0; k < A.length; k += 4) { const d = Math.abs(A[k] - B[k]) + Math.abs(A[k + 1] - B[k + 1]) + Math.abs(A[k + 2] - B[k + 2]) + Math.abs(A[k + 3] - B[k + 3]); if (d > 24) n++; s += d; } return { px24: n, meanAbs: +(s / (A.length / 4)).toFixed(4) }; };
  const out = {};
  const i = 60, t = i / FPS, tc = charFrame(i) / FPS;
  const layers = {
    flag: () => drawPoleFlag(t), coop: () => drawCoop(t, tc), blocks: () => drawBlocks(t), mahalla: () => drawMahalla(t),
    wires: () => drawWires(t), parapet: () => drawParapet(t), far: () => drawFar(t),
  };
  const depth = { flag: 3.4, coop: 3.1, blocks: 60, mahalla: 30, wires: 12, parapet: 3.4, far: 1e6 };
  const cam1 = makeCam({ pos: V3(0, craneH(t), 0) });
  for (const [name, fn] of Object.entries(layers)) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1280, 720); fn(); const A = grab();
    x.clearRect(0, 0, 1280, 720); withMap((u, v) => V(u, v), fn); const B = grab();
    x.clearRect(0, 0, 1280, 720); withMap(layerMap(cam1, depth[name], t), fn); const C = grab();
    out[name] = { identity: cmp(A, B), camera: cmp(A, C) };
  }
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'no errors');
await browser.close();
