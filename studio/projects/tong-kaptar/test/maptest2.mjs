import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const TMP = (process.env.TMPDIR || '/tmp').replace(/\/$/, '') + '/kaptar'; (await import('node:fs')).mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' ' + e.stack));
await page.goto(('file://' + ROOT + '/scene.html'));
const out = (TMP + '/maptest');
fs.mkdirSync(out, { recursive: true });
for (const name of ['wires', 'parapet']) {
  for (const mode of ['A', 'B']) {
    const d = await page.evaluate(([name, mode]) => {
      const c = document.getElementById('c'), x = c.getContext('2d');
      const i = 60, t = i / FPS;
      const fn = name === 'wires' ? () => drawWires(t) : () => drawParapet(t);
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1280, 720);
      if (mode === 'A') fn(); else withMap((u, v) => V(u, v), fn);
      return c.toDataURL('image/png');
    }, [name, mode]);
    fs.writeFileSync(`${out}/${name}_${mode}.png`, Buffer.from(d.split(',')[1], 'base64'));
  }
}
console.log(errors.length ? errors.join('\n') : 'ok');
await browser.close();
