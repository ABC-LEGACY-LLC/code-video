# [s2] the post's video — what is on screen

Read 2026-10-01 by agent:researcher. The video is the one attached to [s1]; its mp4 URL came from the
mirror's `tweet.media` (three mp4 variants; this is the 1280x720, 2176 kbps one).

## How the frames were taken

All in the room's container (`docker.io/alfg/ffmpeg:latest`), nothing on the machine.

| script | what it made |
|---|---|
| `get.sh` | `video.mp4` (kept out of git), `video.sha256`, `probe.txt`, `frames/t000…t020.jpg` (fps=1: tNNN ≈ NNN.5 s), `scenes/c001…c007.jpg` + `scenes.txt` (scene filter 0.12, exact times) |
| `pass2.sh` | `sheets/tl00…tl05.jpg` — every 6th frame, 4 x 5: tile k of sheet j is video frame 6·(20j+k), i.e. 0.2 s apart, exact; `exact/nNNN.jpg` — 37 frames by number |
| `pass3.sh` | `crops/*.jpg` — enlarged crops (x2–x4) of the boxes and masks; `strips/*.jpg` — eight consecutive video frames of one region (the shelf's f0123) |
| `pass4.sh` | `all/res00…res03.jpg` — **every** video frame of the result section (n 0…159), the band x 400…880, 10 x 4: tile k of sheet j is frame 40j+k |
| one line in the log | `strips/pole-n004-019.jpg` — frames 4…19, 8 x 2 |

`probe.txt`: h264, 1280x720, 30 fps, 620 frames, 20.667 s, 3,452,224 bytes, **no audio stream**.
sha256 `c8dc1af91870e983179fd3e357e6ef73f4f776d438d30e95fb228e4eda861466` — the same as at registration.
A frame is named `nNNN` (video frame number, time = n/30 s) or `tNNN` (the per-second set).

Every frame of `frames/`, `sheets/`, `all/`, and the listed `exact/`, `crops/`, `strips/` was opened.
Numbers read from the overlay are the overlay's; pixel judgements are by eye from the crops.

## The film, in order

The footage is one drone shot circling one wooden pole with a pole-mounted transformer, in farmland
(the author: "It's a regular drone shot" [s3]). Everything else is a designed overlay.

| video frames (time) | header on screen | what is shown |
|---|---|---|
| n 0–159 (0–5.33 s) | `UTILITY POLE PARTS // RESULT` · title `ASTRA + SAM 3 LABELLING` · typed under it: `33 auto-labelled frames → every frame of the clip` · counter `FRM 0000/0480` … · legend POLE, CROSSARM, INSULATOR, TRANSFORMER, BUSHING, BRACKET | the clip with filled masks on the pole's parts. The counter reads 0000 at n000, 0042 at t000, 0133 at t001, 0223 at t002, 0314 at t003, 0405 at t004: **three clip frames per video frame** — the 480-frame clip is played in 160 video frames, every third frame shown |
| n 160–303 (5.33–10.13 s) | `RF-DETR SEG // UTILITY-POLE-PARTS` · `01 PARTS // k OF 6` · `FRM 0081/0480` (frozen) | one frame, zooming to each class in turn: a box, a confidence, and a line "N masks across the clip · median conf c". A table on the right holds the six counts |
| n 304–359 (10.13–12.0 s) | `STEP 2 // ASTRA` · `02 AUTO-LABEL // ASTRA FINDS EACH PART` · `FRM 0125/0480` | boxes appear on one frame, a counter `PARTS FOUND` runs to **19** (n359); caption "Astra: where each part is" |
| n 360–423 (12.0–14.13 s) | `STEP 3 // SAM 3` · `03 AUTO-LABEL // SAM 3 DRAWS THE MASK` · `FRM 0125/0480` | a scan line; the boxes become masks; caption "SAM 3: the exact pixels of each part" |
| n 424–523 (14.13–17.47 s) | `STEP 4 // LABELLING RUN` · `04 AUTO-LABEL // ASTRA + SAM 3 · 33 FRAMES` | a grid of 33 thumbnails (7+7+7+7+5) lighting up; `ELAPSED` and `MASKS` counters; caption "8 frames at a time · no human in the loop". Final values (n523): **ELAPSED 71.5 S, MASKS 1,430** |
| n 524–619 (17.47–20.67 s) | `RF-DETR SEG // UTILITY-POLE-PARTS` · `05 RUN // BOXES + MASKS IN ONE PASS` · `FRM 0081/0480` · `MODEL 47 MS` | boxes with class and confidence, a counter `DETECTIONS` to **13**, then masks; caption "47 ms of model time on this frame · 58 ms median" |

There is no step between 04 and 05: training the model is not shown, nor its duration, its hardware, the
split of the data, or any score other than the model's own confidence.

### The overlay's numbers

**Step 1, per class** (`exact/n270.jpg`, `frames/t005…t009.jpg`, `sheets/tl01…tl02.jpg`):

| class | "masks across the clip" | median conf | on FRM 0081 | per clip frame (÷480) |
|---|---|---|---|---|
| POLE | 659 | 0.90 | 0.93, 0.90 | 1.37 |
| CROSSARM | 481 | 0.85 | 0.85, 0.85 | 1.00 |
| INSULATOR | 430 | 0.80 | 0.82, 0.81 | 0.90 |
| TRANSFORMER | 489 | 0.92 | 0.95 | 1.02 |
| TRANSFORMER BUSHING | 878 | 0.86 | 0.85, 0.87 | 1.83 |
| MOUNTING BRACKET | 935 | 0.57 | 0.40, 0.55, 0.47, 0.47 | 1.95 |
| **sum** | **3,872** | | 13 | **8.07** |

**Step 4, the labelling run** (`sheets/tl03.jpg`, `sheets/tl04.jpg`, `exact/n523.jpg`), ELAPSED → MASKS at
0.2 s steps of video: 1.7 s → 0 · 7.0 → 0 · 12.2 → 0 · 17.4 → 89 · 22.7 → 367 · 27.9 → 367 · 33.1 → 493 ·
38.3 → 677 · 43.6 → 813 · 48.8 → 844 · 54.0 → 1,008 · 59.3 → 1,045 · 64.5 → 1,105 · 69.7 → 1,384 ·
71.5 → 1,430 (then still). The steps are uneven, as a replayed log would be, not an eased animation.

## What the masks look like

**The labels (steps 2–3, one frame, FRM 0125).** `crops/astra-boxes-n359.jpg`, `crops/astra-far-n359.jpg`,
`crops/sam-transf-n423.jpg`, `crops/sam-far-n423.jpg`, `crops/sam-top-n423.jpg`, `crops/sam-foot-n423.jpg`.

- 19 boxes. Named on screen: POLE (two boxes — above and below the transformer — for the one pole),
  CROSSARM x2, INSULATOR x2, TRANSFORMER. Unnamed but coloured: two red on the bushings, two pink on the
  brackets beside the tank.
- **Boxes that are not parts:** three small purple (the pole's colour) boxes lie on the transformer's
  tank; after step 3 they are three purple specks inside the transformer's mask. A pole in the distance
  carries three boxes — one tall, two small ones stacked inside it; after step 3 it is one thin purple
  line. That is 5 of the 19 that are spurious or duplicates, by the room's count.
- The masks SAM 3 drew are crisp: crossarms, insulators, bushings and the tank follow their edges at x3.
  The diagonal braces, the wires and the small insulator low on the pole are not classes and are not
  masked.

**The model (steps 1 and 5 and the result, RF-DETR Seg).** `crops/rfdetr-top-n619.jpg`,
`crops/rfdetr-mid-n619.jpg`, `strips/*.jpg`, `all/res00…03.jpg`.

- Coarser than the labels: the pole's mask is rounded at the top, bulges past the pole's edge and into
  the gap between the bushings; the crossarms' masks have rounded ends.
- **The pole's mask drops out.** Of the 160 video frames of the result, the pole is unmasked wholly or
  in part (above or below the transformer) in at least **12**: n 7, 8, 9, 11, 15, 16, 17, 18, 19, 20
  (`strips/pole-n004-019.jpg`, `strips/top-n020.jpg`, `all/res00.jpg`), n 73 (`all/res01.jpg`, row 4,
  tile 4) and n 132 (`strips/res-n130.jpg` tile 3; `all/res03.jpg`). Ten of the twelve are in the first
  21 frames. The overlay gives this class a median confidence of 0.90.
- **False pole fragments** on the transformer's left edge (n 6, 8, 10) and over the left bushing
  (n 12–14) — purple outlines where no pole is (`strips/pole-n004-019.jpg`, `strips/res-n008.jpg`).
- **Other poles are not found.** At clip frame 0 two more poles stand in the background
  (`exact/n000.jpg`, `crops/result-far-n000.jpg`); neither is masked. The labels did mark a distant pole
  (above), and the thumbnails of step 4 show thin purple lines on background poles
  (`crops/grid-n523.jpg`): the labels and the model disagree on what "pole" covers.
- The two bushings merge into one mask when one stands behind the other (`strips/res-n090.jpg`, tiles
  6–8). The brackets are found in most frames; their masks change shape from frame to frame.
- Only every third clip frame is shown, so flicker between neighbouring frames cannot be seen at all.

## What this establishes, and what it does not

**Shown on screen.**
- The pipeline is not the post's two lines. It is: 33 frames of one 480-frame clip labelled by Astra
  (boxes) and SAM 3 (masks) → an RF-DETR Seg model (trained, not shown) → that model run on every frame
  of the same clip. The coloured masks that open the film are the small model's output, under a title
  that reads "ASTRA + SAM 3 LABELLING".
- "over 1000 … in under 90 s" is, on screen, 1,430 masks in 71.5 s for 33 frames.
- On the one labelled frame shown close, at least 5 of 19 boxes are wrong or duplicate, and the masks
  drawn from them keep the errors.
- The model's output flickers on its largest object in at least 12 of 160 shown frames.

**Does not fit together** (the overlay against itself):
- 1,430 masks ÷ 33 frames = **43.3 per frame**; the frame shown close has **19** boxes; the model
  trained on those labels returns **13** on its frame and **8.07** on average. The room cannot say
  which count is right: none can be checked.
- TRANSFORMER: 489 masks in 480 frames. One transformer is in every frame the room opened, so at least
  9 are a second mask on the same object or on something else.
- MOUNTING BRACKET: median confidence 0.57, and 0.40 is drawn on screen — the display threshold is at or
  below 0.40.

**Not shown, anywhere in the film.** How many labels are right (no ground truth, no person's labels to
compare with); training time and hardware; the cost of anything; a frame the model had not been trained
next to — the model is run on the clip its 33 training frames came from; a second pole.

**Cannot be told from frames.** Whether the counters of step 4 replay a real log; whether the 33 frames
were sent to the two models one by one as the caption says; what "47 ms" ran on.
