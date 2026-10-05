# s12 — clip 1 of the post (creature on a mossy stone), frame by frame

## How it was taken

- File: the 1920x1080 variant from the post's JSON [s1] (`sources/s1/post.json`), fetched with `wget` inside the
  room's container (`sources/get.sh`, image `docker.io/alfg/ffmpeg:latest`). `video.sha256`:
  `b13910d35776bd0acfec0daeaf328f0423c4405b502261b3afa1ecf10eba6fa9`. The fingerprint `labs room source add`
  recorded at registration (`b36c1a5fcf60…`) differs from the file downloaded minutes later; the twimg CDN
  answered the same URL with different bytes. The video itself is kept out of git (`sources/.gitignore`).
- `probe.txt`: h264, 1920x1080, 24 fps, 243 frames, 10.125 s, 4.62 Mbit/s actual. **No audio stream.**
- `frames/t000–t009.jpg`: one frame a second (tNNN ≈ NNN.5 s). `scenes/c001.jpg` 5.000 s, `c002.jpg` 9.875 s:
  the two cuts `select='gt(scene,0.12)'` found (`scenes.txt`).
- `sheet.jpg`: 2 frames a second, 4 across (`sources/sheet.sh`); tile k (from 0) is the frame at about
  (k+1)·0.5 s — tile 2 shows the wipe divider at x≈205 of 960, which `measure/strips.csv` puts at frame 35,
  1.46 s. The per-second `tNNN.jpg` are at about NNN.5 s (t001 shows the same divider at x=410 of 1920).
- `measure/`: every frame at 960x540 (`sources/allframes.sh`) through `sources/measure.py` — the white wipe
  dividers found in each frame (`strips.csv`), the time slices (`slices/y190|y350|y470.png`) and per-panel
  steadiness (`summary.txt`). Method and caveats are in the script's docstring.
- `crops/gills-f222.jpg`: frames 222–229 (9.25–9.54 s), region 480x270 at (640,70), full resolution.

## The film, in order

Frame spans from the divider track (`measure/strips.csv`, printed by `work/layout.py`):

| time (s) | frames | on screen | evidence |
|---|---|---|---|
| 0.0–1.0 | 0–24 | **Footage**, full frame: a photoreal, cartoon-faced axolotl-like creature on a mossy stone in a forest stream; the foreground leaf and background are already out of focus in the footage itself | t000 |
| 1.04–2.46 | 25–59 | one divider sweeps left to right: **Ours** (depth) on its left, **Footage** on its right | t001, sheet tiles 2–3 |
| 2.5–3.54 | 60–85 | **Marigold V2 Video (ours)**, full frame; the creature changes pose between the stills | t002, t003, sheet tiles 4–6 |
| 3.58–~4.9 | 86–~117 | three dividers enter from the left (labels **VDA**, **Marigold V2 Video (ours)**) and travel right | sheet tile 7; t004 (4.5 s, dividers at x = 330/810/1380 of 1920) |
| ~4.9–~8.0 | ~117–~192 | four panels: **Footage \| Marigold V2 \| Video Depth Anything \| Marigold V2 Video (ours)**, the last label shortened to **Ours** from the cut at 5.0 s; dividers still at x = 480/960/1440 of 1920 | t004–t007, c001 |
| 5.000 | 120 | a cut in the footage: from the frontal shot to a close side view of the creature's arm and flank | c001 |
| ~8.0–8.88 | ~192–213 | dividers travel back and leave to the left; labels **VDA**, **Marigold V2 Video (ours)** | t008 |
| 8.92–10.08 | 214–242 | **Marigold V2 Video (ours)**, full frame, the creature in profile on the stone; another cut at 9.875 s to a close-up of its head | t009, c002 |

No panel is labelled as a depth-of-field (refocused) result: the labels read are Footage, Ours, Marigold V2
Video (ours), Marigold V2, Video Depth Anything, VDA.

## Steadiness, measured (`measure/summary.txt`)

Two runs with three still dividers and no cut: frames 120–160 and 169–187. Per panel, the mean luma of the
panel frame by frame; `mean|2nd diff|` is ~0 for smooth drift and large for flicker; `pix2nd` is the same
taken per pixel (local flicker; motion and H.264 noise raise it too — panel 1, the footage, shows how much).

| run | Footage | Marigold V2 | Video Depth Anything | Ours |
|---|---|---|---|---|
| 120–160: mean\|2nd diff\| | 0.967 | 4.037 | 0.404 | 0.406 |
| 120–160: pix2nd | 20.553 | 7.679 | 3.647 | 2.541 |
| 169–187: mean\|2nd diff\| | 1.464 | 3.459 | 0.335 | 0.279 |
| 169–187: pix2nd | 24.427 | 12.521 | 3.081 | 3.175 |

The time slice `measure/slices/y350.png` shows the same: in the four-panel stretch the Marigold V2 panel is cut
by horizontal bands (its level changes from frame to frame), the Video Depth Anything and Ours panels draw
smooth streaks. Right after the 5.0 s cut, the Ours panel starts bright yellow and settles to orange within
~0.8 s (slice rows ≈ frames 120–140); whether that is the scene (the arm near the lens) or the model's
windows re-scaling after a cut cannot be told, because the footage never shows that region at those frames.

`crops/gills-f222.jpg`: across eight consecutive frames of the full-frame "ours" the gill filaments keep their
shape and count and move together with the head; no filament pops in or out between neighbouring frames.

## What this establishes, and what it does not

- It **establishes** that the author compares against two baselines, per-frame Marigold V2 and Video Depth
  Anything, and that in this clip "ours" is far steadier than per-frame Marigold V2 and about as steady as
  Video Depth Anything. Whether it is sharper than Video Depth Anything cannot be read here: both draw the
  gill filaments where their strips cross them (t004, t009), never over the same pixels.
- It **does not establish** a like-for-like comparison: at every instant each method is shown over a
  *different* vertical strip of the picture, so no two methods are ever seen on the same pixels at once;
  colours are normalised per method; the footage is seen full frame only for the first second.
- It shows no depth-of-field render, the use the post is about.
- 10 s, three shots, an author-chosen, apparently generated scene; 4.6 Mbit/s H.264. Nothing here measures
  accuracy (no ground truth in this clip).
