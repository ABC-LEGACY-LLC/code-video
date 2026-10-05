# s13 — clip 2 of the post (hands picking tea), frame by frame

## How it was taken

Same procedure as `s12/frames.md` (`sources/get.sh`, `sheet.sh`, `allframes.sh`, `measure.py`, `crops.sh`).

- `video.sha256`: `6cbd2524fd10febc206249c852a04dfe53a0ecf644915e89508ab4e9dd24ecdd` (the registration
  fingerprint `040d0bf2ee8a…` differs: the CDN served different bytes for the same URL).
- `probe.txt`: h264, 1920x1080, 24 fps, 361 frames, 15.04 s, 3.59 Mbit/s. No audio stream. No scene cut found.
- `frames/t000–t014.jpg` (tNNN ≈ NNN.5 s), `sheet.jpg` (4x8 tiles, tile k ≈ (k+1)·0.5 s — see
  `s12/frames.md`), `measure/`, `crops/hair-f312.jpg`
  (frames 312–319, 480x270 at (900,0)), `crops/panels-f196.jpg` (frames 196–203; one row per method:
  Marigold V2 x 500–940, Video Depth Anything x 980–1420, Ours x 1460–1900, lower half, halved).

## The film, in order

| time (s) | frames | on screen | evidence |
|---|---|---|---|
| 0.0–1.5 | 0–36 | **Footage**: a close-up of two hands picking tea leaves | sheet tiles 0–2 |
| 1.54–3.67 | 37–88 | one divider sweeps left to right: **Ours** / **Marigold V2 Video (ours)** left, **Footage** right | sheet tiles 3–6 |
| 3.71–5.25 | 89–126 | **Marigold V2 Video (ours)**, full frame; the camera pulls back from the hands to the picker's shoulder and arm | sheet tiles 7–9 |
| 5.29–~7.1 | 127–~171 | dividers enter (labels **VDA**, **Marigold V2 Video (ours)**) and travel right | sheet tiles 10–11 |
| 5.88–12.71 | 141–305 | four panels **Footage \| Marigold V2 \| Video Depth Anything \| Ours** (dividers still from frame 172 to 280); the footage panel now shows a wider view (a picker on a tea hillside) | sheet tiles 12–24 |
| 12.75–13.21 | 306–317 | dividers leave to the left | sheet tile 25 |
| 13.25–15.0 | 318–360 | **Marigold V2 Video (ours)**, full frame: the picker's head, shoulder, arms and hands over the bushes | t013, t014 |

No depth-of-field render is shown.

## Steadiness, measured (`measure/summary.txt`, frames 172–280, 7.17–11.67 s, dividers at 474/960/1440 of 1920)

| | Footage | Marigold V2 | Video Depth Anything | Ours |
|---|---|---|---|---|
| max \|step\| of panel mean | 1.34 | 5.93 | 1.45 | 0.50 |
| mean\|2nd diff\| | 0.540 | 2.006 | 0.146 | 0.187 |
| pix2nd | 7.891 | 6.185 | 0.840 | 0.610 |

`measure/slices/y350.png`: the Marigold V2 panel is striped with thin horizontal bands through the whole
four-panel stretch; the Video Depth Anything and Ours panels are smooth, and their colours meet at the
divider without a step. In the full-frame "ours" stretches (top and bottom of the slice) the streaks are smooth.

`crops/hair-f312.jpg`: eight consecutive frames of the picker's hair and ear against the dark background —
the outline and the stray hairs hold their shape from frame to frame. `crops/panels-f196.jpg`: over the same
eight frames the Marigold V2 row changes its level in the upper band; the Video Depth Anything and Ours rows
barely change — but the Ours strip there is the picker's shirt, a nearly flat region, so it shows little.

## What this establishes, and what it does not

- The steadiest and longest four-panel stretch of the four clips (108 frames). Ours is as steady as Video
  Depth Anything and much steadier than per-frame Marigold V2, by the panel mean and per pixel.
- As in every clip, each method is shown over a different strip; the strip "ours" gets here is mostly the
  shirt, the smoothest part of the picture, while the hands and leaves fall in the Marigold V2 strip.
- No depth-of-field render; no ground truth; 3.6 Mbit/s.
