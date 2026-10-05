# history

Snapshots of the picture code taken before each rework. The project had no git history while it
was made, so these are the only record of its earlier states. Nothing here is loaded by the film.

| folder / file | taken (file time) | contents |
|---|---|---|
| `scene.js` | 2026-09-23 21:02 | the first version, one file, before the source was split into `src/` |
| `src_prev_v1/` | 2026-09-24 03:47 | v1, shot 1 only (7 files); `scene_v1.html` loads it |
| `src_pre_r3/` | 2026-09-24 05:38 | shot 1 only (7 files); named "before r3" when taken |
| `src_pre_shots/` | 2026-09-24 09:46 | shot 1 only (7 files), before shot 2 was added |
| `src_pre_s3/` | 2026-09-24 19:32 | shots 1–2 (with `map.js`, `shot2.js` and its own `scene.html`), before shot 3 |

`audit/s4v3/src_v2/` and the `*.pre` files in `audit/s5/` are later snapshots, kept beside the
audits that used them.

Written for `scene.js`, and defaulting to it here: `audit/mkdbg.mjs` (builds the instrumented copy
`audit/scene_dbg.html` / `.js`), `audit/scan.mjs` (reads that copy), `audit/prof.mjs`,
`audit/scale.mjs`.
