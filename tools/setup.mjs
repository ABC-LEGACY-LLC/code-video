#!/usr/bin/env node
import {bootstrapPip} from './python-bootstrap.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root, suites, profiles, readJSON, pythonFor, run, problemsForSuite} from './environment.mjs';

const args = process.argv.slice(2);
const help = 'Usage: node tools/setup.mjs [--if-needed] [--no-browser] [--python compare|tong]\nDefault: install locked JavaScript dependencies and Chromium. --python installs only that isolated Python environment.';
try {
  if (args.includes('--help')) { console.log(help); process.exit(0); }
  if (process.versions.node.split('.')[0] !== '22') throw new Error('Use Node 22 (see .nvmrc).');
  let profile;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--python') profile = args[++i];
    else if (!['--if-needed', '--no-browser'].includes(args[i])) throw new Error(help);
  }
  if (args.includes('--python')) {
    if (!profiles[profile]) throw new Error(help);
    const python = pythonFor(profile), interpreter = process.env.PYTHON || 'python3';
    if (!fs.existsSync(python) || spawnSync(python, ['-m', 'pip', '--version'], {stdio: 'ignore'}).status !== 0) {
      try { run(interpreter, ['-m', 'venv', path.dirname(path.dirname(python))]); }
      catch { const venv=path.dirname(path.dirname(python));run(interpreter,['-m','venv','--without-pip',venv]);await bootstrapPip(python,venv); }
    }
    run(python, ['-m', 'pip', 'install', '-r', path.join(root, profiles[profile])]);
    run(python, ['-m', 'pip', 'check']);
    console.log(`Python environment ready: ${python}`);
  } else {
    const browsers = new Set();
    for (const dir of suites) {
      const cwd = path.join(root, dir);
      console.log(`\n${dir}`);
      if (!args.includes('--if-needed') || problemsForSuite(dir).length)
        run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], cwd);
      else console.log('Locked packages already installed.');
      if (args.includes('--no-browser')) continue;
      const manifest = readJSON(path.join(cwd, 'package.json'));
      const dependencies = {...manifest.dependencies, ...manifest.devDependencies};
      const name = dependencies.playwright ? 'playwright' : 'playwright-core';
      const version = readJSON(path.join(cwd, 'node_modules', name, 'package.json')).version;
      if (!browsers.has(version)) {
        run(process.execPath, [path.join(cwd, 'node_modules', name, 'cli.js'), 'install', 'chromium'], cwd);
        browsers.add(version);
      }
    }
    console.log('\nSetup complete. Run make doctor; use --launch to check browser system libraries.');
  }
} catch (error) { console.error(`Setup: ${error.message}`); process.exitCode = 1; }
