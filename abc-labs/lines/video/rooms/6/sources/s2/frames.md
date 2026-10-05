# s2 — the post's video, frame by frame

## How it was taken

- `get.sh` in `docker.io/alfg/ffmpeg:latest`: the 1080x1138 variant from the mirror JSON.
  sha256 `41885bfcf8fb724b34c50434b97edb765b362b741fdf694fe4d723693712e0fc` (`video.sha256`).
- `probe.txt`: H.264 High, yuv420p, 1080x1138, **60 fps**, 860 frames, 14.33 s, 1.62 Mbit/s,
  **no audio stream** (only `codec_type=video`; `audio.txt` is empty).
- `frames/t000.jpg`–`t013.jpg`: one per second (tNNN ≈ NNN.5 s). The scene filter at 0.12 found
  **no cuts**: it is one continuous screen recording.
- `png/` (gitignored, remade by `get.sh`): lossless decodes — every frame of 5.0–5.5 s
  (`f5_00`–`f5_29`) and one per second (`t000`–`t013`).
- `analyse.py`, `analyse2.py` (in `docker.io/library/python:3.12-slim` with numpy + pillow) →
  `analysis.txt`, `analysis2.txt`, `crops/`.
- The video is kept out of git (`.gitignore`).

## The film, in order

One page, one shot: the demo page on cyze.dev (s13) — a pale grey-blue page, ten blue dithered
koi swimming in its middle, and under them a control bar `← ⌂ ? [Bayer | Lines] →`. A mouse
cursor is visible throughout.

| frame | what is on screen |
|---|---|
| t000 | 10 fish, **Bayer** selected, cursor on the Bayer pill |
| t001–t002 | cursor moves into the school, over a fish at t001, beside one at t002 |
| t003 | cursor at right, beside a fish's tail |
| t004–t006 | cursor top-left, then mid-right; school spread across the middle |
| t007 | cursor on the **Lines** pill, Bayer still selected |
| t008 | **Lines** selected — the fish now drawn in stair-stepped diagonal strokes, coarser cells |
| t009–t011 | Lines; cursor in the school |
| t012 | cursor on the Bayer pill, Lines still selected |
| t013 | **Bayer** selected again |

So: Bayer from 0 s to between 7.5 and 8.5 s, Lines until between 12.5 and 13.5 s, then Bayer.
What moves: the fish (bodies bend along their length, tails sweep, pairs of pectoral fins);
nothing else — no water, ripples, shadows or pads are drawn; the page background is flat.

## What the pixels say

From `analysis.txt` / `analysis2.txt`:

- **Background**: exactly (218, 223, 233) with standard deviation 0.0 over rows 40–200 of t005 —
  flat, undithered. That is the lightest tone.
- **Tones (Bayer, t000–t006)**: the red channel of fish pixels peaks at 33, 79, 123, 179, and the
  background is 218. A five-level ramp from 33 to 218 puts levels at 33, 79, 126, 172, 218. The
  other peaks (101, 145, 193) sit between neighbours: blends the encoder made of two adjacent
  tones. **Five tones**, as the code's `levels: 5` would give (s12 `index.html:45`).
- **Colours are not the page's**: the page's CSS (light theme) is `--c-accent: oklch(.5 .24 265)`
  → (29, 76, 233) and `--c-snippet-canvas: oklch(.975 .012 265)` → (243, 247, 255)
  (`analysis2.txt`, first two lines). The video's darkest tone matches the accent in red (33 vs 29)
  but its background is ~25 levels darker than the CSS canvas colour. The capture shifted the light
  end, or the stylesheet changed since. Colours taken from this video are not the shader's output.
- **Pattern period**: after subtracting a 9×9 local mean, the autocorrelation of luminance over
  fish pixels (Bayer, x) falls from 0.75 at 1 px through 0.19 at 3 px to ≤ 0.08 from 6 px on.
  Only weak repeats (0.04–0.09) show: Bayer at about 10–11, 15–16 and 20–21 px in x and y; Lines
  at 15–16 px. They are consistent with 2-CSS-px cells (Bayer, `pixel: 2`, whose 2×2 sub-pattern
  repeats every 4 CSS px) and 3-CSS-px cells (Lines, `pixel: 3`, period 4 cells; s13 bundle
  `qe={bayer:2,lines:3}`), captured at about 1.33 video px per CSS px. That scale is inferred,
  not measured on screen.
- **Crops**: `crops/bayer-t005.png` (96×96 at 768,656, ×6 nearest) shows a regular dot lattice in
  the translucent tail fin and a smeared texture in the solid body. `crops/lines-t010.png` shows
  diagonal stair steps. The individual Bayer cells in the bodies are **not resolvable**: the
  encoder blurred them.
- **Screen-fixed or fish-fixed?** Dark-dot positions mod P over 37 frames concentrate only weakly
  (busiest 1/16 of residues hold 0.11–0.14 of dots against 0.06 uniform). The video cannot settle
  it. The non-integer scale and the encoder smear the lattice. The code settles it (s12:
  `dither-image.js:130,145` — the cell is `floor(gl_FragCoord.xy / size)`, no time term).
- **Frame to frame**: 30 consecutive frames at 5.0–5.5 s contain no duplicates. The capture ran
  at a real 60 fps, the page's own cap (`fps: 60`, s12 `index.html:55`).

## What this establishes, and what it does not

- It establishes what the demo looks like: ten fish, flat background, five blue tones, Bayer and
  Lines patterns switched live. That the fish flee the cursor is the code's and the page's word
  (s12, s13); one-per-second stills cannot show a reaction.
- It does **not** establish the shader's exact output: the H.264 stream at 1.6 Mbit/s with 4:2:0
  chroma blurs cells of about 2–3 px, and the light end of the palette is shifted. It says nothing
  about "0.1 ms of JS" or "14.5 KB": a video shows neither time nor bytes.
- One thing it does show for anyone putting a dither into an mp4: at this cell size and bitrate,
  the **tones survive and the pattern does not**.
