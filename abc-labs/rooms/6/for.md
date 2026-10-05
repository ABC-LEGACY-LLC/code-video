# For code-video, from room 6
(written 2026-09-30, against code-video `ff977c2` and the koi gist `1c9a11f` [s12]; item 6 added
2026-10-01, same commits)

## What this is

A 14.5 KB MIT WebGL2 demo: koi steered in JavaScript, drawn in one fragment shader, then
dithered to 5 tones with a screen-fixed 8×8 Bayer matrix computed without a table [s12][s2].

Where to start: item 1 (a `Dither` decision in the style files, one threshold before the band in
`comp.frag`), then item 3a (the check that it holds still, with its broken state).

## Worth taking

1. **Ordered dither on the light edge, as one more style decision.** The source thresholds each
   cell against `bayer8(floor(gl_FragCoord.xy / size))`: three lines of GLSL, no texture
   (`dither-image.js:66-72`, `:130-132`) [s12]. It picks between two neighbouring levels:
   `floor(v*steps) + step(threshold, fract(v*steps))` (`:136-137`). The room checked the formula:
   it gives the standard 8×8 Bayer index matrix, 64 distinct thresholds, period 8
   (`sources/s12/bayer8-check.txt`).
   → How: in `comp.frag` the band is two soft steps between a material's three tones,
   `band = smoothstep(sBand.x,sBand.y,q)+smoothstep(sBand.z,sBand.w,q)` (`oq-kocha/src/comp.frag:118-119`).
   Add a style key `"Dither": [amount, cell]`. Before the band, for everything except drawn marks
   (`:117`, or the lash vanishes again):
   `q += (bayer8(floor(gl_FragCoord.xy/cellPx)) - 0.5) * sDither.x;`.
   The terminator then becomes an ordered stipple between `c0/c1/c2`, and the palette stays per
   material (`:120-124`). It is the ordered cousin of oq-qalam's brush break (`:98-106`), which
   breaks the same edge with stretched noise. `Dither: [0, …]` in `oq-qalam.json` and
   `tekis-cel.json` keeps both films byte-identical. `tools/style.mjs:27-28` refuses a style that
   leaves the key out, so both are forced to answer. The Bayer needs no asset, which keeps the
   page's "Nol bayt asset" (`oq-kocha/tools/mkfilm.py:51-52`).
   → Also, before a third style file lands: `checks-style.mjs` compares only `NAMES[0]` with
   `NAMES[1]` (`oq-kocha/test/checks-style.mjs:66`, `:75`, `:89`), and `load()` sorts the files
   by name (`oq-kocha/tools/style.mjs:17`). A new file that sorts first silently changes which
   pair is tested. Loop those three checks over every pair.
   → Where: `oq-kocha/src/comp.frag`, `oq-kocha/src/styles/*.json` (+ a third file),
   `oq-kocha/test/checks-style.mjs`.
   → Effort: S.

2. **The cell sized to the frame, and whole in pixels.** The source keeps the cell constant in
   CSS pixels while its runtime lowers the backing resolution: `size = max(uPixel * uPixelRatio,
   1.0)` (`dither-image.js:144`), with `uPixelRatio` resent on every resize (`runtime.js:248-256`).
   It also shows the trap. The demo's `dpr: 0.85` × `pixel: 2` gives 1.7-px cells
   (`index.html:43`, `:55`), which `floor()` makes alternately 1 and 2 px wide.
   → How: oq-kocha changes its own resolution (SCALE 0.20–1.0, `mkfilm.py:157-173`), and the
   checks render at 200×144 and 240×173 (`checks-render.mjs:6`, `checks-style.mjs:24`). A cell
   in raw pixels would change the look with the quality button. Give it as a fraction of the
   height, the way `px = 1.0/iRes.y` does (`comp.frag:38`), and round it to a whole pixel:
   `float cellPx = max(1.0, floor(sDither.y*iRes.y + 0.5));`.
   → Where: the same lines as item 1.
   → Effort: S (part of item 1).

3. **Checks that can fail.** Three properties of a dithered frame the source's design implies
   and this room measured on its video:
   a. **It holds still** (`style/dither-holds-still`). Use a shot with the weather frozen
      (`uSnow` = 0, `comp.frag:177`). Render frames f and f+1 with the dither style and with the
      same style at amount 0. Take the pixels where the dither is active in f (dithered ≠
      undithered) and where the undithered picture did not change from f to f+1. Count how many
      of those change in the dithered pair. Pass: 0. Exact bytes come through `readPixels`
      (`oq-kocha/test/browser.mjs:40-51`), as `determinism` already relies on
      (`checks-render.mjs:21-25`). Throw if there are fewer than a few hundred such pixels: a
      check with nothing to hold is the worst check. Calibrate with a knob that seeds the
      threshold with time (`hash(cell + iTime)`, the known-bad), added to `OPT` beside
      `snow`/`lfar` (`mkfilm.py:203`, `:386`). The source has no time term in its threshold
      (`dither-image.js:130-137`) [s12].
   b. **The cell follows the frame** (`style/dither-cell-follows-the-frame`). Take the
      difference image (dithered − undithered) at W×H and at 2W×2H. Find the period of its
      autocorrelation: the method in `rooms/6/sources/s2/analyse2.py`, `period()`. Pass: a
      ratio of 2 ± 0.25. Calibrate: the cell in raw pixels gives a ratio of 1.
   c. **Only N tones**, and only for item 4's whole-frame style (`style/dither-tones`). Count the
      distinct output colours; pass ≤ N (+ ink). Calibrate: the same quantiser placed before
      paper grain and vignette (`comp.frag:214-215`) gives thousands. It is also how the room
      counted the demo's five tones through H.264 (histogram peaks, `sources/s2/analysis2.txt`).
   → Where: `oq-kocha/test/checks-style.mjs`, knobs in `oq-kocha/tools/mkfilm.py`.
   → Effort: S for a and b; S for c once item 4 exists.

4. **(Only if a monochrome variant is wanted) the whole frame in N tones between two colours.**
   The source quantises the final picture's luma to `levels` tones. Each tone is a mix of two
   palette stops in OKLab, converted to sRGB (`dither-image.js:74-83`, `:101-113`, `:136-139`;
   stops packed by `runtime.js:489-524`) [s12]. The video shows the result: five tones, flat
   background [s2].
   → How: one more step after gamma (`comp.frag:216`), before `O` is written. Everything —
   fog, snow, paper grain — becomes stipple, and the per-material palette gives way to one ramp.
   This is a different film, not a third style.
   → Where: `oq-kocha/src/comp.frag`, the style files.
   → Effort: M.

5. **What an mp4 does to a dither — measured once here.** The post's video [s2] is H.264 High,
   4:2:0, 1.6 Mbit/s, with cells of about 2.7–4 video px. The **tones survive**: the red channel
   peaks at 33/79/123/179 plus 218 against a predicted 33/79/126/172/218. The **pattern does
   not**: high-passed correlation falls to ≤ 0.08 from 6 px (`sources/s2/analysis2.txt`,
   `crops/bayer-t005.png`).
   → How: code-video stores no video and has no mp4 path at `ff977c2`. The only mention is an
   audio-capture note, `skills/media-audit-reality/SKILL.md:253`. If one is added, run check
   3b's period measurement before and after the encode, and write down the cell size and
   bitrate at which the lattice survives. Do not assume it survives.
   → Where: whatever tool first exports a film.
   → Effort: S, once an export exists.

6. **The auto quality judged against the display, not against 13 ms.** The source learns the
   display's own frame period — `fastest = min(fastest * 1.0005, interval)` — and calls frames
   late or on time only against `max(fastest, 1000/60)`: down 15 % after a second above 1.3× of
   it, up 10 % after three seconds below 1.08× (`runtime.js:285-305`) [s12].
   → Why here: `adapt(ms)` is given `ft`, the smoothed `requestAnimationFrame` interval
   (`oq-kocha/tools/mkfilm.py:282-283`, `:297`), and climbs only when `ms < 13` (`:169`). On a
   60 Hz display a frame that costs nothing still arrives every 16.7 ms, so `ft` never goes
   under 13 and the climb cannot run: AUTO stays at `SCALE = 0.34` or lower, against the
   comment's "It starts LOW and climbs" (`:152-156`). It climbs only on a display faster than
   about 77 Hz. This is read from the code; the room did not run the page on a 60 Hz screen.
   → How: keep `fastest` as the source does and climb after a run of frames with
   `ft < max(fastest, 16.7) * 1.08`; the two down thresholds (`:167-168`) can stay. A check
   with its broken state: call `adapt(16.7)` sixty times from `SCALE = 0.34` and require that
   `SCALE` rose — today's code is the known-bad.
   → Where: `oq-kocha/tools/mkfilm.py:157-173`.
   → Effort: S.

## Not worth taking

- **The layer stack (`layers.js`).** It namespaces each effect's GLSL with regexes
  (`layers.js:72-114`) and swaps a `// @source … // @end` block for a read of the layers beneath
  (`:79-86`). That is a general compiler to add one pass. oq-kocha already has its two passes
  and its styles as data (`tools/style.mjs`), and already renders into half-float
  (`mkfilm.py:140`). The "one draw call" it advertises is two per frame (`layers.js:15`,
  `:238-239`) [s12].
- **Fixed-step simulation that replays on seek** (`koi.js:570-585`). oq-kocha already has it,
  and stricter: one `step(DT)` for the live loop and for `__frameTo` (`mkfilm.py:273-279`,
  `:292-294`, `:387-390`). The source replays a seek at 1/30 s and runs live at 1/60 s
  (`koi.js:575-577`, `:580-582`), so its frame at time T depends on how T was reached [s12].
  (Its adaptive resolution is item 6.)
- **The trail-following spine** (`koi.js:505-559`). It is for a creature that travels; no work
  here has one. mushuk's cat sits, and its tail already runs a phase-lagged wave
  (`mushuk/mushuk.html:407-413`), like the koi's `sin(beat - u*5.5)` (`koi.js:556`).
- **Blue noise** (Obra Dinn's 128×128 field [s16]). It is a texture, i.e. an asset, which breaks
  "Nol bayt asset". **Error diffusion** is "inherently sequential" [s15], so not for a fragment
  shader. The source's interleaved-gradient noise (`dither-image.js:133`) is asset-free but has
  no period for check 3b to hold.
- **Pinning the dither to the world** (Obra Dinn's sphere, "100 hours" [s16]). It solves camera
  *rotation*. oq-kocha's cameras are fixed within a shot (`src/shots.mjs:5-25`; `mkfilm.py:255`
  reads `sh.ro`). The street *translates* under them (`src/geo.frag:100`), which a screen-side
  mapping cannot pin without depth [s16].
- **paper-design/shaders' dithering** [s17]. An npm dependency (Apache-2.0) for three lines of
  GLSL, in a project with no framework.

## Open questions for the owner

1. **A dithered style at all?** Say yes and the room proposes item 1 + 3a + 3b as one patch in
   `for/code-video.patches/` — on a request from the project, not before.
2. **The light edge only (item 1) or the whole frame (item 4)?** They are different films: the
   first keeps the palette, the second replaces it.
3. **Is the swim acceptable?** In the walking shots the street slides under a screen-fixed
   pattern (`geo.frag:100`). oq-kocha already lays screen-fixed brush noise and paper grain on
   it (`comp.frag:37`, `:103`, `:213-214`), but a dither has far more contrast. It can be
   measured before anyone decides: dither flips per frame on street pixels in `yurish`, against
   the same with the world frozen.
4. **An mp4 export?** The profile names it as a direction. A dithered style is the first thing
   whose survival through the encoder would need proving (item 5).

---
*From room 6 of the Labs workshop (Dithered koi shader). Edited there, never here: `labs rooms pull` brings the newest.*
