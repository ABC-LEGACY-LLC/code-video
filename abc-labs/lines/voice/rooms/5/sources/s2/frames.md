# s2 — the post's video, frame by frame and sound by sound

Source: `https://video.twimg.com/amplify_video/2104950621749100544/vid/avc1/1920x1080/9LxEzF0d4dnzy-uy.mp4?tag=29`
(the 1920x1080 variant in the fxtwitter JSON of s1, `sources/s1/post.json`). sha256 of the file: `video.sha256`.

## How it was taken

- `get.sh` (image `docker.io/alfg/ffmpeg:latest`): the mp4, `probe.txt`, one frame per second
  (`frames/t000.jpg` … `t020.jpg`, tNNN ≈ NNN.5 s: fps rounds to the nearest slot, so these times are
  ±0.5 s), scene detection (`scenes.txt` came out **empty**: at `gt(scene,0.12)` no cut was found — the
  film is continuous animation with no hard cut), `audio.txt` (volumedetect + silencedetect −35 dB/0.7 s),
  the audio as `audio/track.m4a` (as encoded) and `audio/track.wav` (mono 48 kHz float, a downmix),
  `audio/silence-45.txt` (silencedetect −45 dB / 80 ms: the six event onsets below).
  Its last two steps (ffmpeg `showspectrumpic`, `showwavespic`) ran for many minutes and did not finish;
  those containers could not be stopped by `labs room stop` (it only knows detached runs) and were still
  up when this was written.
- `events.sh`: for each onset, ten frames 0.1 s apart from onset − 0.4 s, tiled 5×2 (`events/e<n>-strip.jpg`).
- `analyse.py` (image `python:3.12-slim`, numpy + pillow in /tmp): onsets on a 1 ms RMS envelope, peak level,
  the strongest spectral peaks in 10–90 ms and 90–250 ms after onset (Hann, zero-padded to 8192 = 5.9 Hz
  bins, parabolic interpolation), a per-peak decay slope (±3 % band, 20 ms windows every 5 ms, line fit
  over the first 50 dB), and an STFT picture per event (`events/e<n>-stft.png`, 0–8 kHz, 80 dB range) and
  of the whole track (`audio/stft-full.png`). Results: `audio/events.json`, `audio/events.txt`.
  `events/e1-spectrum.png`, `e1-wave.png` are ffmpeg's from the stalled run; `e2…e6-spectrum.png` and
  `audio/spectrogram-full.png` are byte-for-byte copies of the first `analyse.py` output under the old
  names. Cite the `*-stft.png` files.
- `stereo.py`: `audio/track-stereo.wav` (the two channels, float) → L/R correlation and side-vs-mid level
  per event, 0–50 ms and 50–400 ms (`audio/stereo.json`).
- The mp4 and the WAV/M4A stay out of git (`.gitignore`).

`probe.txt`: h264 1920×1080 at 60 fps, 1280 frames; AAC stereo 48 kHz, 128 kb/s; duration 21.376 s.
`audio.txt`: mean −34.3 dB, max −1.6 dB. Between the six events the track stays below −45 dBFS for
2.6–3.3 s at a time (`audio/silence-45.txt`): **there is no music bed**, only the six sounds.

## The film, in order

Dark background, one white wireframe object at a time, drawn as stacked contour lines. A red dot falls
onto it; at contact a red tint runs through the object and it wobbles; a caption in a monospace face
types in or morphs underneath. Read from the frames:

| time | frames | on screen | caption |
|---|---|---|---|
| 0–0.5 | t000, e1-strip | a sphere of horizontal rings; the red dot falls onto its top (0.3–0.4 s), red runs down the rings | none, then `setTheme(` types in after the strike |
| 1–3 | t001, t002 | the same sphere, white; it bulges at the bottom (t002) | `setTheme("bubble")` |
| 3–4 | t003, e2-strip | a keycap (rounded trapezoid of contour lines); the red dot lands on its top at ≈3.7 s; the cap tints red and deforms (t005) | `setTheme("bubble")`, morphs to `setTheme("press")` ≈0.3 s after the strike |
| 4–6 | t004, t005 | the keycap, then wobbling | `setTheme("press")` |
| 6–7 | t006, e3-strip | a twelve-tooth gear seen face-on; the dot lands on the top tooth ≈6.9 s; the gear turns pink | `setTheme("press")` → `setTheme("mech")` |
| 7–9 | t007, t008 | the gear, pink then white | `setTheme("mech")` |
| 9–10 | t009, e4-strip | three flat bars stacked in steps (xylophone-like); **three dots** fall together, one per bar, at ≈10.1 s; the bars tint red | `setTheme("mech")` → `setTheme("default")` |
| 11–13 | t011, t012 | a torus of tilted rings | `setTheme("default")` |
| 13–14 | e5-strip, t013 | the dot rolls along the inside of the torus ≈13.3 s; red travels round the rings | `setTheme("default")` → `play("count")` |
| 14–15 | t014 | the torus, red running round it | `play("count")` |
| 15–16 | t015 | contour letters scrambling | fragments |
| 16.4 | e6-strip, t016 | the letters settle to `cuelume`; a dot lands on the final **e** ≈16.4 s; the letters tint in turn | none |
| 17–21 | t017–t020 | `cuelume` wordmark, `npm i cuelume` under it | `npm i cuelume` |

The pattern the strips show: each strike sounds **the theme or call whose caption appears right after it**
(e1 → `bubble`, e2 → `press`, e3 → `mech`, e4 → `default`, e5 → `play("count")`), and the caption changes
within ≈0.3 s of the strike (e2–e5 strips, frames 6–8).

## The sounds (audio/events.json)

| # | onset (s) | peak dBFS | to peak | measured peaks, 10–90 ms (Hz, dB re. strongest) | decay slopes (dB/s) | matches in the code (s3, commit caf1548) |
|---|---|---|---|---|---|---|
| 1 | 0.443 | −8.2 | 1 ms | 729, 777, 815, 633, 418 … a smear 420–840 Hz | 729: −306; 418: −217 | a rising glide: consistent with `bubble` `tap` (`knock(300)` + `bloop(600)` rising ×1.5 in 40 ms, `bubble.ts:49-58`) at a strike pitch near 0.94; **not identified with certainty** |
| 2 | 3.776 | −13.6 | 59 ms | 130.8, 261.6 (−8), 523.1 (−22), 392.4 (−26) | 130.8: −101; 523.1: −152 | `press` `tap`: `note(C3)` = harmonic partials ×1,2,3,4 of 130.81 Hz, swelling in over `SWELL` = 0.06 s (`press.ts:53-72,93-101`) |
| 3 | 6.943 | −12.2 | 1 ms | 1481.6, 1458, 1438, 3260, 3644 | 1481.6: −328 | `mech` `select`: a 1480 Hz sine over a 1500 Hz Q8 noise band and a 3650 Hz band (`mech.ts:41-49`) |
| 4 | 10.109 | −4.1 | 4 ms | **783.8, 522.7 (−0.9), 1317.0 (−7.6), 2086.6 (−24), 3128.8 (−27)** | 522.7: −165; 2086.6: −346; 3128.8: −284 | `default` `success`, normal emphasis: `struck(523.25/783.99/1318.51, MALLET)` → modes at ×1 and ×3.99: 523.25×3.99 = 2087.8, 783.99×3.99 = 3128.1; 1318.51×3.99 = 5261 lies above `MODE_CEILING` 5000 and is absent, as the code drops it (`recipes.ts:96,99,111-127,229-239`) |
| 5 | 13.283 | −17.6 | 142 ms | 1046.8 (others ≥ 19 dB down) | 1046.8: −84 | `default` `count`: a 1046.5 Hz sine with a 0.15 s attack under rising noise (`recipes.ts:314-323`) |
| 6 | 16.443 | −4.6 | 4 ms | **392.1, 196.2 (−6.6), 1080.3 (−20), 541.2 (−21), 2116.1 (−34)** | 392.1: −134; 1080.3: −235; 2116.1: −292; 196.2: −99; 541.2: −172 | `default` `ready`: `struck(392, BAR)` → 392 × 2.76 = 1081.9, × 5.4 = 2116.8, and the strong-only `struck(196, BAR)` → 196, 196 × 2.76 = 541.0 (`recipes.ts:94,284-293`) |

What the table establishes:

- The free-bar ratios are **in the film's audio**, not only in the code: event 6's peaks stand at
  1080.3/392.1 = 2.755 and 2116.1/392.1 = 5.397; event 4's upper peaks at 2086.6/522.7 = 3.992 and
  3128.8/783.8 = 3.992 (the marimba ratio 3.99). Through AAC at 128 kb/s the ratios read to three digits.
- **Higher modes die sooner**, measured: in event 6, 392 → 1080 → 2116 Hz fall at 134 → 235 → 292 dB/s, and
  196 → 541 Hz at 99 → 172 dB/s; in event 4, the ×3.99 modes fall 2× faster than their fundamentals.
  `e6-stft.png` shows it: the 2.1 kHz line ends first, then 1.08 kHz, then 541, 392, and 196 Hz last.
- Event 4 against the code, in numbers: a layer's gain ramps exponentially from its peak to an absolute
  0.0001 over `decay` (`engine.ts:49-53`), so its slope is 20·log10(peak/0.0001)/decay dB/s. For C5 in
  `success` (peak 0.022, decay 0.26 s) that is 180 dB/s, measured 165; for G5 (0.02, 0.30 s) 153, measured
  145; for E6 (0.014, 0.24 s) 179, measured 163. The shared room and the 20 ms windows slow the measured
  slopes a little; the upper modes (predicted 427–506 dB/s) measure 284–346 for the same reason.
- **The logo sound (event 6) is not exactly what 0.2.4 plays.** Its 196 Hz bar is a strong-only layer
  (`recipes.ts:290`), and strong emphasis also scales every pitch by 0.98 (`context.ts:32`, since commit
  9ac5501): 0.2.4's strong `ready` sounds at 384.2 and 192.1 Hz. The film has 392.1 and 196.2 Hz — the
  normal pitch with the strong layer. Event 4 lands within 0.6 Hz of its recipe (522.7 against 523.25), so
  the difference is not the measurement. The film was made with something close to, not identical to, the
  published engine; its source is not public (commit 5e099a8: "Stop tracking promo/; it stays local").
- **Stereo, not mono** (`audio/stereo.json`): at the strike (0–50 ms) the side channel sits 17–22 dB under
  the centre in events 2, 4 and 6; in the tail (50–400 ms) it stays 22.6 dB under in event 2 (`press` `tap`,
  room send ×1) but rises to 14.2 and 13.6 dB under in events 4 and 6 (`success`, `ready`), whose recipes
  send twice as much to the room (`LANDED`, `recipes.ts:70`). That is what 0.2.4's room gives — two
  channels of independent noise (`engine.ts:143-172`), a send at 0.08 ≈ −22 dB (`engine.ts:135`). The
  committed promo capture script renders **mono** (`OfflineAudioContext(1, …)`, promo/scripts/audio.mjs:39 at
  commit 0d993f0), so the posted film is not that script's output as committed.

What it does not establish: which emphasis or options each play used beyond what the partials show; whether
event 1 is `tap` or another bubble cue; anything about loudness in a browser (the film's level is the
editor's, after encoding); the video's own timeline (no source).
