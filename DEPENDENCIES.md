# Development environment

The supported JavaScript runtime is Node 22; `.nvmrc` records the exact CI version.
The server uses Acorn for source parsing. Playwright and Three.js are installed per
project so their versions do not silently change a film's rendering.

## JavaScript and browsers

From the repository root:

```sh
nvm install                 # optional, when using nvm
make setup                 # npm ci in all seven packages; install their Chromium revisions
make doctor                # check manifests, lockfiles, installed versions, browser files
node tools/doctor.mjs --launch  # also launch Chromium and exercise Canvas 2D
make audit-fast
```

`make setup` does not start, stop, or restart a service. It replaces installed
packages using each committed lockfile. Run it outside an active rendering job.
For packages without a browser download use `node tools/setup.mjs --no-browser`.
`make deps` is an alias; `make deps-if-needed` repairs missing or mismatched
packages and ensures their browsers exist.

| Packages | Preserved browser library |
| --- | --- |
| Studio, catalog, Oq Ko'cha, Zarra | Playwright 1.62.1 |
| Tong kaptar | Playwright 1.56.0 |
| personaj, personaj3d | Playwright / playwright-core 1.63.0 |

personaj3d also pins Three.js 0.170.0. Browser installation invokes the local
package's CLI, so it cannot fetch a different Playwright release through `npx`.
The packages share browser downloads when their revisions match. Keep
`PLAYWRIGHT_BROWSERS_PATH` consistent between setup and test commands if using a
custom cache location.

On a minimal Linux installation, browser OS libraries may be absent. Doctor's
`--launch` mode reports that. After reviewing the operating-system changes, an
administrator can install them using:

```sh
node studio/node_modules/playwright/cli.js install-deps chromium
```

The normal setup command never installs OS packages. CI uses `--with-deps` in
its disposable runner. For pixel comparisons, retain the browser revision,
dimensions, render options, and source revision with the result. Until its
renderer is migrated, personaj3d's `chrome.mjs` may choose the newest Chromium in
the cache; set `PERSONAJ_CHROME` to the executable returned by its own locked
`playwright-core` package to select that revision explicitly.

## Python tools

The comparison tool and Tong's offline audio use separate environments because
their recorded NumPy/SciPy versions differ. Use Python 3.12 with working `venv`
and `ensurepip`; the interpreter can be selected with `PYTHON=/path/to/python`.
On distributions that split Python packages, install the matching venv package
before setup (for example `python3.12-venv` on Debian/Ubuntu). Nothing is installed
into system Python. Environments live under the ignored `.venv/` directory.

```sh
make setup-compare
node tools/doctor.mjs --python compare
cd tools/compare
../../.venv/compare/bin/python -m compare calibrate
```

`tools/compare/requirements.txt` pins the versions that passed the comparison
calibration suite. It is also used by CI.

```sh
make setup-tong
node tools/doctor.mjs --python tong
source .venv/tong/bin/activate
```

Tong's `requirements-base.txt` retains the film's direct synthesis/measurement
versions and pins their Python 3.12 transitive dependencies. Resolving this
environment is separate from validating the soundtrack against its master;
rerun the relevant audio calibration/checks after changing any dependency.
The older `requirements.txt` additionally requests the AudioSet tagger's Torch
stack without a complete compatible lock. That optional tagger environment is
not installed or certified by setup. Its model weights and native/GPU stack
require a separate reproducibility pass; the main editor and synthesis do not
need them. The GPU vision tools under `tools/gpu` are likewise separate.

Offline film assembly additionally needs `ffmpeg`. Studio's existing export in
the user's browser does not require server-side ffmpeg or store exported video
on the server.

## Updating dependencies

Change the relevant manifest deliberately, regenerate its lockfile, and verify
`npm ci` in a clean directory. Run the affected tests and compare rendered
frames/audio before accepting a browser, Three.js, or DSP dependency update.
Keep lockfiles in version control. Use `npm ci`, rather than `npm install`, for
normal setup and CI; installation must not advance the chosen versions.

`make audit-fast` includes the operation, freshness, and harness regressions.
Browser suites run through their existing audit targets. The complete Oq Ko'cha
render audit can take 45–75 minutes on a CPU-only host and is not part of setup
or doctor.

When a minimal Python installation lacks `ensurepip`, `make setup-compare` creates
an isolated venv without pip and bootstraps a pinned official pip wheel after
checking its SHA-256. It then installs the exact comparison requirements. System
Python is never modified. The fallback needs network access, like normal setup.
