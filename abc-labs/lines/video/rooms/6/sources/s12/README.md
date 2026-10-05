# s12 — the gist: blakecyze/fb5a6ce12207d06c82ea0b3a488244d4

Cloned in the room's container: `git clone https://gist.github.com/fb5a6ce12207d06c82ea0b3a488244d4.git work/gist`
(gitignored — reclone to read). **Commit `1c9a11f97a348c7dfc12f28367d36d97b895cb2a`,
2026-09-30T03:40:58Z, one commit**, i.e. about 28 h after the post (s1) and 10 h before the author
linked it (s4). Every `path:line` in this room's pages is at this commit.

## What it says it is (README.md)

"Koi swimming beneath a blue-and-white Bayer dither, as a single WebGL2 shader. The fish follow the
pointer. From ittybitty (https://ittybitty.dev): two effects stacked with `layers.js`, which fuses
them into one shader and one draw call." Licence: **MIT** (`README.md:30-32`; every file's header
says `(MIT)`). "No build step and no dependencies."

## Files (raw bytes)

`dithered-koi.html` 37,518 (everything inlined, minified) · `koi.js` 24,272 · `runtime.js` 18,472 ·
`layers.js` 15,783 · `dither-image.js` 7,077 · `pointer.js` 6,011 · `texture.js` 3,079 ·
`glyphs.js` 1,641 · `index.html` 1,652 · `README.md` 1,078.

## What decides

- **The demo's settings** (`index.html:18-56`): layer 0 = koi with water, shadows, pads, glints and
  ripples off, `count: 10`, `size: 1.15`, `variation: 1`, `interactive: true`; layer 1 = dither with
  `pattern: 'bayer'`, `pixel: 2`, `levels: 5`, `contrast: 1.8`, `brightness: -0.35`, palette
  `#1d4ce9 → #f3f7ff`; runtime `{ dpr: 0.85, fps: 60, adaptive: true }`.
- **Movement is on the CPU** (`koi.js:364-587`, "The school, simulated on the CPU"): per fish, a
  wander of two sines (`koi.js:437`), edge avoidance (`:439-443`), separation from the others
  (`:445-456`), flee from the pointer (`:458-469`), a capped turn rate (`:474-476`), burst-and-glide
  speed (`:478-481`). The head lays a 72-point trail (`:365-366`, `:492-499`). Ten spine points are
  resampled evenly along it, and a travelling sine wave is added across them
  (`:505-559`, `sway = len*(0.012+0.1*u*u)*effort*sin(beat - u*5.5)`). They are uploaded as
  `uSpine[50]` vec4 + `uFish[10]` (`:563-564`, `:108-110`). Fixed 1/60 s steps; seeking back replays
  from the start ("Deterministic in effect time, so seeking replays it", `:359`, `:570-585`).
- **Drawing is on the GPU** (`koi.js:58-345`): per pixel, the nearest point on each fish's spine
  polyline (`spine()`, `:121-144`); a width profile (`bodyWidth`, `:148-151`); fins as ellipses;
  koi varieties from hashes (`:257-279`). A pixel farther from a head than one body length is
  skipped (`:203-207`).
- **The dither** (`dither-image.js:44-150`): the source is sampled at each cell's centre. Luma is
  taken (Rec. 709 weights, `:146`), then contrast and brightness (`:147`). The threshold is an
  **8×8 Bayer matrix computed without a table** (`:66-72`) on the cell index
  `floor(gl_FragCoord.xy / size)` (`:130-132`, `:145`), with `size = pixel × uPixelRatio`
  (`:144`), so the cell is measured in CSS pixels. Quantisation between two neighbouring levels:
  `level = floor(v*steps) + step(threshold, fract(v*steps))` (`:136-137`). The tone comes from
  palette stops mixed in OKLab (`:74-83`, `:101-113`; stops packed by `runtime.js:512-524`). Other
  patterns: interleaved-gradient noise (`:133`), diagonal lines (`:134`), dots (`:135`), glyphs.
  **No time term anywhere in the threshold.**
- **Stacking** (`layers.js`): each effect's GLSL is namespaced and its `main()` becomes a function
  (`:72-114`). A filter's `// @source … // @end` block is swapped for a read of the stack beneath
  (`:79-86`); transparent areas below read as white paper (`:83-84`). The stack beneath a filter
  is drawn first into a half-float texture "so a filter that stretches contrast (a dither, say)
  finds no banding" (`:152-157`, `:219`), then the final pass runs (`:238-248`). **That is two
  draws per frame**, one program: `layers.js:15` itself says "one extra pass per filter", against
  the README's "one draw call".

## Checks run on it

- `bayer8-check.mjs` → `bayer8-check.txt`: `dither-image.js:67-72` transcribed to JS gives the
  standard 8×8 Bayer index matrix (first row `0 32 8 40 2 34 10 42`), all 64 thresholds distinct,
  period 8 in x and y.
- `size.py` → `size.txt`: the inline `<script>` of `dithered-koi.html` is **37,024 B raw, 14,938 B
  gzip-9 (14.59 KiB)**, 13,456 B brotli-11. The whole file is 15,223 B gzip-9 (14.87 KiB). The
  live page's bundle (s13) is 15,410 B gzip-9. "14.5 KB" matches the gzipped script of this
  demo to within 0.1 KiB. It is the size of a general runtime plus two whole effects. The demo
  also ships code it switches off: water, caustics, pads, glints, and image and glyph loading.

## Where the code and its words disagree

- README "The fish follow the pointer" and `index.html:35` "the fish follow the pointer", but the
  code makes them **flee** it (`koi.js:8` "dart away from the pointer", `:457-469`). The demo page
  (s13) says "the koi dart away from it".
- README "one draw call": two draws per frame, as above.
- The author's "10 spine segments" (s5) are 10 spine **points**, 9 segments (`koi.js:106-107`, `:127`).
