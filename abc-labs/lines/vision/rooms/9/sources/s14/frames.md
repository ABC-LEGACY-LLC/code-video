# s14 — clip 3 of the post (a figure walking toward an ice wall), frame by frame

## How it was taken

Same procedure as `s12/frames.md`. `video.sha256`:
`e2b46b90aa689cd472f480130bf03d82eb40b8402a52ff7739968e3e14010b00` (matches the registration fingerprint).
`probe.txt`: h264, 1920x1080, 24 fps, 241 frames, 10.04 s, 2.68 Mbit/s. No audio stream. No scene cut found.
`frames/t000–t009.jpg` (tNNN ≈ NNN.5 s), `sheet.jpg` (4x5, tile k ≈ (k+1)·0.5 s — see `s12/frames.md`),
`measure/`, `crops/walltop-f216.jpg` (frames 216–223,
480x270 at (0,40); the crop caught the label and the dark left end of the wall).

## The film, in order

| time (s) | frames | on screen | evidence |
|---|---|---|---|
| 0.0–1.0 | 0–24 | **Footage**: a small figure in red walking on snow toward a turquoise-and-white ice wall | sheet tiles 0–1 |
| 1.04–2.46 | 25–59 | divider sweeps left to right: **Ours** left, **Footage** right | sheet tiles 2–3 |
| 2.5–3.5 | 60–84 | **Marigold V2 Video (ours)**, full frame | sheet tiles 4–6 |
| 3.54–~4.8 | 85–~115 | dividers enter (**VDA**) and travel right | sheet tile 7 |
| 3.92–8.46 | 94–203 | four panels **Footage \| Marigold V2 \| Video Depth Anything \| Ours** (dividers still from frame 116 to 186); the footage panel is a closer view of the wall | t004–t007 |
| 8.5–8.79 | 204–211 | dividers leave | sheet tile 16 |
| 8.83–10.0 | 212–240 | **Marigold V2 Video (ours)**, full frame; the view shows the wall's top edge against the sky | sheet tiles 17–19 |

At ~8.0 s the Marigold V2 panel is red-orange across its whole height while the other panels keep their
purple (sheet tile 15; at 7.5 s, t007, it is still purple with one red band): its per-frame scale moved.

No depth-of-field render is shown.

## Steadiness, measured (`measure/summary.txt`, frames 116–186, 4.83–7.75 s)

| | Footage | Marigold V2 | Video Depth Anything | Ours |
|---|---|---|---|---|
| max \|step\| of panel mean | 0.48 | 7.47 | 0.79 | 0.84 |
| mean\|2nd diff\| | 0.324 | 2.610 | 0.168 | 0.232 |
| pix2nd | 2.756 | 3.068 | 0.769 | 0.925 |

`measure/slices/y350.png`: the Marigold V2 panel is banded; Video Depth Anything and Ours are smooth.

## What this establishes, and what it does not

- Ours ≈ Video Depth Anything ≪ per-frame Marigold V2 in frame-to-frame change, as in clips 1 and 2.
- Different strips per method again; mostly smooth ice and snow; no ground truth; 2.7 Mbit/s.
