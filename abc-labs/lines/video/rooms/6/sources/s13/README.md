# s13 — cyze.dev/snippets/koi-dither-pond (the live demo)

Fetched 2026-09-30 in the container: `page.html` (25,268 B, an Astro page), `page.txt` (its text),
`koi-dither-pond.bundle.js` (the page's own module,
`/_astro/koi-dither-pond.astro_astro_type_script_index_0_lang.xqlMivWM.js`, 37,945 B), and the page's
stylesheets (`*.css`).

The page's text, verbatim (data): "Koi Dither Pond. Move your cursor over the pond and the koi dart
away from it, then drift back once you settle. Two shaders run as one. The first draws the fish, the
second dithers whatever sits beneath it into two tones, and both are fused into a single draw call.
The two tones are the page's own accent and background, read from CSS, so switching theme repaints
the pond without rebuilding the shader. Bayer Lines"

What the bundle does (the tail of the file, printed around `--c-accent`). It is the same koi and
dither code as the gist (s12). Same options: `count: 10, size: 1.15, variation: 1, speed: 1,
interactive: true, responsiveness: .25`; `levels: 5, contrast: 1.8, brightness: -.35`; runtime
`{dpr: .85, fps: 60, adaptive: true}`. The pattern switches between `bayer` (pixel 2) and `lines`
(pixel 3). The palette is `[[0, --c-accent], [1, --c-snippet-canvas]]`, read through a 2D canvas
as `#rrggbb`. A `MutationObserver` on `<html class>` repaints on a theme change.

CSS (light / dark): `--c-accent: oklch(.5 .24 265)` / `oklch(.74 .1 260)`;
`--c-snippet-canvas: oklch(.975 .012 265)` / `oklch(.23 .022 265)`.

"into two tones" is the palette's two stops. With `levels: 5` the output has **five** tones
between them (s2 `frames.md`, "Tones").
