import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const suites = ['studio', 'catalog', 'studio/projects/oq-kocha', 'studio/projects/zarra',
  'studio/projects/tong-kaptar', 'studio/projects/personaj', 'studio/projects/personaj3d'];
export const profiles = {
  compare: 'tools/compare/requirements.txt',
  tong: 'studio/projects/tong-kaptar/requirements-base.txt',
};
export const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const pythonFor = profile => path.join(root, '.venv', profile, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
export function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {cwd, stdio: 'inherit', env: process.env});
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed${result.error ? `: ${result.error.message}` : ` (${result.status})`}`);
}
export function problemsForSuite(dir) {
  const base = path.join(root, dir), problems = [];
  try {
    const manifest = readJSON(path.join(base, 'package.json'));
    const lock = readJSON(path.join(base, 'package-lock.json'));
    for (const field of ['dependencies', 'devDependencies']) {
      const expected = manifest[field] || {}, locked = lock.packages[''][field] || {};
      if (JSON.stringify(Object.entries(expected).sort()) !== JSON.stringify(Object.entries(locked).sort()))
        problems.push(`package.json ${field} differs from lockfile`);
    }
    for (const [location, info] of Object.entries(lock.packages)) {
      if (!location || info.optional) continue;
      try {
        const installed = readJSON(path.join(base, location, 'package.json'));
        if (installed.version !== info.version) problems.push(`${location}: expected ${info.version}, found ${installed.version}`);
      } catch { problems.push(`${location}: missing; run make setup`); }
    }
  } catch (error) { problems.push(error.message); }
  return problems;
}
