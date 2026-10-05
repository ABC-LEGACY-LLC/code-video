# Verdict — dithered koi (cyze_dev), 2026-09-30

**In one line:** do not build — it is a small, well-made MIT demo of a known technique. The same
dither is published under Apache-2.0, and koi ponds are a trend with several open repositories.
Labs has nothing to rent it. What is worth keeping is one mechanism for code-video, a dither
**style**, and that goes to `for/code-video.md`.

## What this is

- **Not unpublished.** Nine seconds after the post, the author replied with a live demo [s3]. The
  next day he linked the source [s4]: an MIT gist [s12] (commit `1c9a11f`, 2026-09-30T03:40Z,
  about 28 h after the post). It comes from "ittybitty", his coming shader site (`README.md:5`,
  every file's header). The brief's "no code published" was true only for the post.
- **Movement is JavaScript, drawing is GLSL** — as the author says [s5][s6][s7] and as the code does.
  Each fish is a steering agent on the CPU: two slow sines (`koi.js:437`), a capped turn rate
  (`:474-476`), fleeing the pointer (`:457-469`). Its head lays a 72-point trail. Ten spine points
  are resampled along it and a travelling wave is added (`:505-559`). The points go to the shader
  as `uSpine[50]` (`:108`, `:563`). The fragment shader finds each pixel's distance to each spine
  and draws body, fins and koi patterns in colour (`koi.js:121-304`).
- **The dither** is a second effect stacked on the first (`index.html:18-56`). Per 2-CSS-px cell,
  the luma of the picture beneath (`dither-image.js:144-147`) is thresholded against an **8×8
  Bayer matrix computed without a table** (`:66-72`). It is quantised between the two nearest of
  **5 levels** (`:136-137`). Each level is coloured by mixing two palette stops in OKLab
  (`:74-83`, `:111-113`). The cell is `floor(gl_FragCoord / size)`, with **no time term**, so the pattern
  is fixed to the screen and identical frame to frame wherever the picture holds still. The room
  transcribed the formula and got the standard Bayer index matrix, 64 distinct thresholds, period 8
  (`sources/s12/bayer8-check.txt`).
- **The video** [s2] is a 14.33 s, 60 fps screen recording of the demo page, one shot, no sound.
  Ten fish on a flat background; Bayer, then **Lines** from about 8 s, then Bayer again at 13 s
  (`t007`, `t008`, `t012`, `t013`). The fish's red channel peaks at 33, 79, 123, 179 and the
  background is 218. That is five tones, where a 5-level ramp predicts 33, 79, 126, 172, 218
  (`sources/s2/analysis2.txt`). The individual cells are **not** resolvable after H.264 at
  1.6 Mbit/s. High-passed luminance correlation falls from 0.75 at 1 px to ≤ 0.08 from 6 px, and
  the lattice shows only as bumps of 0.04–0.09 (`analysis2.txt`, `crops/bayer-t005.png`).
- **The author's tool** is real but not live. His reply video shows its UI: "Search shaders",
  categories that include *Dither* and *Interactive*, and a card "Dither Image — any image, redrawn
  in a few tones of ordered dither" [s9] (`crops/panel-22.4.jpg`). `ittybitty.dev` is registered
  but has no A record [s14]. He says the tool will give every shader's code "openly and for
  free" [s8].

**The claims, opened:**

| claim | what it is |
|---|---|
| "14.5 KB" | The demo's inline script, **gzip-9: 14,938 B = 14.59 KiB**; raw 37,024 B; brotli 13,456 B (`sources/s12/size.txt`). True as a gzipped number. It is a general runtime plus two whole effects, including switched-off water, pads, glints, and image and glyph loaders. |
| "0.1 ms of JS time per frame" | **Not measured** (running it would be building). What JS does per frame is small: 1–2 fixed 1/60 s steps for 10 fish with a 10×10 neighbour loop, a spine resample, and two uniform uploads (`koi.js:421-565`). It says nothing about the **GPU**, which does the drawing in two full-canvas passes per frame. The runtime drops resolution when frames arrive late (`runtime.js:279-305`): that is where the cost is expected. |
| "one draw call" (`README.md:5`, page text [s13]) | **Two draws per frame, one program.** The stack beneath a filter is drawn into a half-float texture first (`layers.js:152-157`, `:238-239`), then the final pass runs (`runtime.js:271`). `layers.js:15` says so itself: "one extra pass per filter". |
| "the fish follow the pointer" (`README.md:3`, `index.html:35`) | They **flee** it (`koi.js:8`, `:457-469`), as the page says [s13]. |

## What already exists

- **The dither:** paper-design/shaders [s17], Apache-2.0, v0.0.81. Random and 2×2/4×4/8×8 Bayer,
  with a grid computed "from gl_FragCoord … in consistent actual pixels"
  (`dithering.ts:11-13`, `:32-33`). The theory is in Ditherpunk [s15]. Ordered dither is the
  GPU-shaped kind: error diffusion "is inherently sequential" (`page.txt:150`).
- **Its known weakness:** a screen-fixed pattern "swims" when the picture moves under it. Lucas
  Pope spent "100 hours" pinning Obra Dinn's Bayer dither to a sphere around the camera [s16]
  (`page.txt:22-26`, `:49-77`).
- **Koi ponds:** Fish-Pool [s18] (MIT, WebGL2, the same CPU-behaviour/GPU-drawing split, 12 render
  targets, a `seed` for repeatable fish); nagomi [s19] (PolyForm Noncommercial, its latest
  commit from the day of the post). A reply under the post calls it a "fish pond trend" [s1].
- **Ours:** code-video's `oq-kocha` has a two-pass renderer whose second pass is "the look", with
  styles as JSON (`oq-kocha/src/comp.frag`, `src/styles/*.json`, `tools/style.mjs`, at `ff977c2`).
  It has no dither: `grep -rE "bayer|dither|Bayer|Dither"` over its `.mjs .js .frag .json .md
  .html` files finds nothing.

## Worth building?

**No, not as a Labs project.** Three facts:
1. **Nothing new to own.** The mechanism is public twice, MIT [s12] and Apache-2.0 [s17]. A koi
   pond is a week's trend with open code under three licences [s12][s18][s19].
2. **No customer at Labs.** It is a static page that runs in the visitor's browser. Nothing to
   host, no tool for `mcp`. A `web` origin could serve it, but it would be serving someone else's
   demo.
3. **The value is a mechanism, and it has a home.** Ordered dither between N palette tones, on a
   cell sized in CSS pixels, with no time term, is exactly a *style* for code-video: data in
   `src/styles/`, a threshold beside the band in `comp.frag`, and checks with real broken states.
   That is `for/code-video.md`, not a room build.

One risk if anything were taken from ittybitty itself: the site is unreleased, and its terms are
unknown [s14]. The gist is MIT; take from that, or from nothing.

## How, if yes

Nothing to build here. If the owner wants to see a dither on our own film, it is a code-video
change: a patch proposed in `for/code-video.patches/`, only if its developer asks. It rents
nothing from Labs.

## What was checked and what was not

- **Checked:** the post and 40 replies through the mirror [s1]; all 14 per-second frames of the
  video and the pixels of 44 lossless frames [s2]; the 38 s reply video, contact sheets and panel
  crops [s9]; the gist read file by file, the Bayer formula evaluated, the sizes measured [s12];
  the live page's bundle and CSS [s13]; DNS for ittybitty.dev [s14]; five comparison sources, the
  repositories at pinned commits [s15–s19].
- **Not checked:** the 0.1 ms, and any GPU time — measuring them means running the shader, which
  is building. Whether the gist's bundle is byte-identical to what the post measured: the gist
  came 28 h later, and the live bundle is 15,410 B gzip, within 0.5 KiB. The one quote post:
  the mirror does not list quotes. Replies past the first 40: the second page answered 404. The
  shader site itself: not live. Whether the pattern is screen-fixed, from the video alone:
  inconclusive (dot residues 0.11–0.14 against 0.06 uniform). The code settles it.
