# s15 — clip 4 of the post (icicles), frame by frame

## How it was taken

Same procedure as `s12/frames.md`. `video.sha256`:
`1cf5de247c0b781ef2db9041508bf597958e2df0183b2ba68be6ddd2d369ccbd` (matches the registration fingerprint).
`probe.txt`: h264, 1920x1080, 24 fps, 240 frames, 10.0 s, 2.70 Mbit/s. No audio stream. No scene cut found.
`frames/t000–t009.jpg` (tNNN ≈ NNN.5 s), `sheet.jpg` (4x5, tile k ≈ (k+1)·0.5 s — see `s12/frames.md`),
`measure/`, `crops/drip-f216.jpg` (frames 216–223,
480x360 at (480,700): the drip under the left icicle and the tip of the right one).

## The film, in order

| time (s) | frames | on screen | evidence |
|---|---|---|---|
| 0.0–1.0 | 0–24 | **Footage**: two icicles in focus, water dripping from the left one; the background is already strongly out of focus in the footage | sheet tiles 0–1 |
| 1.04–2.42 | 25–58 | divider sweeps: **Ours** left, **Footage** right | sheet tiles 2–3 |
| 2.46–3.5 | 59–84 | **Marigold V2 Video (ours)**, full frame | sheet tiles 4–6 |
| 3.54–3.88 | 85–93 | dividers enter; **VDA** | sheet tile 7 |
| 3.92–8.46 | 94–203 | four panels **Footage \| True depth \| Video Depth Anything \| Ours** — here the second panel is not Marigold V2 but a ground truth: icicles dark purple, the background flat grey (no value), the branch above red and orange | t005 |
| 8.5–8.75 | 204–210 | dividers leave | sheet tile 16 |
| 8.79–9.96 | 211–239 | **Marigold V2 Video (ours)**, full frame: both icicles, the chain of falling drops under the left one, blurred branches behind | t009 |

A "True depth" panel means the scene's depth is known: it is rendered, not filmed. The post says the author's
training data is "my personal library of high quality CGI, photoreal scenes" [s1]; whether this scene was held
out of training is said nowhere.

No depth-of-field render is shown.

## Steadiness, measured (`measure/summary.txt`, frames 115–185, 4.79–7.71 s)

| | Footage | True depth | Video Depth Anything | Ours |
|---|---|---|---|---|
| max \|step\| of panel mean | 0.38 | 0.07 | 0.02 | 0.25 |
| mean\|2nd diff\| | 0.210 | 0.039 | 0.014 | 0.103 |
| pix2nd | 1.243 | 1.259 | 0.097 | 0.741 |

The Video Depth Anything strip here is almost one flat magenta (t005): steadiness of a featureless map says
nothing. The Ours strip is the blurred background with branches; it changes more than the ground truth's
panel mean does, but it covers a different region.

`crops/drip-f216.jpg`: the right icicle's outline holds across eight consecutive frames; the drops under the
left one change from frame to frame — but the footage shows water dripping there (t000), so change is
expected, and the footage is not on screen at those frames to say whether the depth follows the real drops.

## What this establishes, and what it does not

- The only clip with a ground truth; the only clip without the per-frame Marigold V2 baseline.
- The ground truth and "ours" are never over the same pixels at the same time, so accuracy cannot be read
  off the clip.
- No depth-of-field render.
