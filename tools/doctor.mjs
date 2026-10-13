#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {root, suites, profiles, readJSON, pythonFor, problemsForSuite} from './environment.mjs';

const args = process.argv.slice(2);
let failures = 0, profile;
const report = (ok, message) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${message}`); if (!ok) failures++; };
const usage = 'Usage: node tools/doctor.mjs [--launch] [--python compare|tong]';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') { console.log(usage); process.exit(0); }
  if (args[i] === '--python') profile = args[++i];
  else if (args[i] !== '--launch') { console.error(usage); process.exit(1); }
}
if (args.includes('--python') && !profiles[profile]) { console.error(usage); process.exit(1); }
report(process.versions.node.split('.')[0] === '22', `Node ${process.versions.node} (supported major: 22; CI: ${fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim()})`);
const launched = new Set();
for (const dir of suites) {
  const problems = problemsForSuite(dir);
  report(!problems.length, `${dir}: ${problems.length ? problems.join('; ') : 'installed dependencies match lockfile'}`);
  if (problems.length) continue;
  try {
    const require = createRequire(path.join(root, dir, 'package.json'));
    const manifest = readJSON(path.join(root, dir, 'package.json'));
    const name = {...manifest.dependencies, ...manifest.devDependencies}.playwright ? 'playwright' : 'playwright-core';
    const {chromium} = require(name), executable = chromium.executablePath();
    report(fs.existsSync(executable), `${dir}: locked Chromium${fs.existsSync(executable) ? ' available' : ' missing; run make setup'}`);
    if (args.includes('--launch') && !launched.has(executable)) {
      const browser = await chromium.launch({executablePath: executable});
      try {
        const page = await browser.newPage();
        await page.setContent('<canvas width="2" height="2"></canvas>');
        report(await page.evaluate(() => !!document.querySelector('canvas').getContext('2d')), `${dir}: Chromium launches and draws Canvas 2D`);
      } finally { await browser.close(); }
      launched.add(executable);
    }
  } catch (error) { report(false, `${dir}: ${error.message.split('\n')[0]}. See DEPENDENCIES.md for browser OS libraries.`); }
}
if (profile) {
  const python = pythonFor(profile);
  const code = `import importlib.metadata as m, pathlib\nfor line in pathlib.Path(${JSON.stringify(path.join(root, profiles[profile]))}).read_text().splitlines():\n line=line.strip()\n if not line or line.startswith('#'): continue\n name, wanted=line.split('==')\n actual=m.version(name)\n assert actual == wanted, f'{name}: expected {wanted}, got {actual}'\nprint('Pinned packages present')`;
  const result = spawnSync(python, ['-c', code], {encoding: 'utf8'});
  report(result.status === 0, `Python ${profile}: ${(result.error?.message || result.stderr || result.stdout).trim()}`);
  if (result.status === 0) {
    const check = spawnSync(python, ['-m', 'pip', 'check'], {encoding: 'utf8'});
    report(check.status === 0, `Python dependency compatibility: ${(check.error?.message || check.stderr || check.stdout).trim()}`);
  }
} else console.log('INFO Python compare / Tong audio environments are optional; check with --python compare or --python tong.');
const ffmpeg = spawnSync('ffmpeg', ['-version'], {encoding: 'utf8'});
console.log(`INFO Offline film assembly: ${ffmpeg.status === 0 ? 'ffmpeg available' : 'ffmpeg not found (browser-local Studio export does not need it)'}`);
console.log(`\n${failures ? `${failures} check(s) failed.` : 'Required checks passed.'}`);
process.exitCode = failures ? 1 : 0;
