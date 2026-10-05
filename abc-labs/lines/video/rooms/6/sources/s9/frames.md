# s9 — the video under the author's reply "It is ADDICTING honestly..."

`get.sh` in `docker.io/alfg/ffmpeg:latest`. sha256
`9b6e760a6feef44560db3fdbd99838d71fb4f4fbed67cf510f63d3c7628f2e68`; 1280x656, 60 fps, 2306
frames, 38.4 s (`probe.txt`). One frame per second in `frames/`; `sheet00.jpg` (t000–t019) and
`sheet01.jpg` (t020–t037) tile them; `crops/panel-*.jpg` enlarge the panel ×2. Video gitignored.

| seconds | on screen |
|---|---|
| 0–19 | a painted sunset scene: sky, sun, a treeline, a lake with the sun's reflection, tall grass bending; the cursor moves through the grass and the grass parts around it; around 7–15 s the grass thins away and the lake shows ripples from the cursor |
| 20–22 | a dark panel over the scene: a search field **"Search shaders"**, category chips **All · Light · Colour · Texture · Image · Interactive · Dither**, and a grid of cards with titles and one-line descriptions — Swoosh, Rainbow, Mesh gradient, Ocean, Lake, Pool, Water Surface, Rain, …, **Dither Image ("Any image, redrawn in a few tones of ordered dither.")**, Silk, Slats, Rays, Iridescence, Dot Field, Warp Tunnel, Ink, and a tile reading **"itty"** (`crops/panel-20.2.jpg`, `panel-22.4.jpg`) |
| 23–24 | the sunset scene again |
| 25–31 | the same scene in greys, grainy |
| 32–37 | the same scene in a pale teal; cursor in the grass |

**Establishes:** the author's tool exists as a working UI: a searchable library of named effects in
categories that include Dither and Interactive. It shows one effect-picker screen. The "itty" tile
and the `ittybitty` headers in every gist file (s12) tie it to ittybitty.dev (s14).

**Does not establish:** what the tool outputs, its licence, its price or its release date. The
colour changes at 25 s and 32 s could be style presets or layers; the video does not say which.
