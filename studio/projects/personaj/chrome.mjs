/* The Chromium the page tools of this work launch (headless, SwiftShader). Not hard-coded: $PERSONAJ_CHROME if set,
   else the newest Playwright-installed chromium-<revision> found in $PLAYWRIGHT_BROWSERS_PATH, ~/.cache/ms-playwright or
   /opt/pw-browsers (the full browser, not the headless shell), else undefined -- Playwright's own choice.
   The revision matters for pixels: renders are compared pixel for pixel only from the same binary. */
import {existsSync, readdirSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

export function chrome() {
  if (process.env.PERSONAJ_CHROME) return process.env.PERSONAJ_CHROME;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache', 'ms-playwright'), '/opt/pw-browsers'].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const revs = readdirSync(root).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.slice(9) - +a.slice(9));
    for (const d of revs) for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const p = join(root, d, sub, 'chrome');
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}
