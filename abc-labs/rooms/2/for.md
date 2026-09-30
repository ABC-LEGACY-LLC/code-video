# For code-video, from room 2

Written 2026-09-30 against veedstudio/open-edit at commit `7f212e04` (pushed 2026-09-29 16:29 UTC,
npm 0.3.0 at 17:00 UTC), read the same morning. Everything below names a file in that repository
(`cli/src/…`) or in yours (the profile's paths, and the files under them read on 2026-09-30). Effort:
S is an afternoon, M a few days, L weeks. Nothing was run; the room's `verdict.md` says what Open Edit
is and what it is not, and this page is only the part of it that is yours to take.

## What this is

Open Edit is an agent's video toolkit whose renderer, since 2026-09-29, is headless Chrome on a virtual
clock, PNG frames piped into ffmpeg in cached segments, with a measured cut list, a mix spec and a
loudness pass beside it, all Apache-2.0; its hand-off to VEED's editor is the part that is not yours.

## Worth taking

Where to start, asked by code-video's developer on 2026-09-30 and answered in the room's log: item 4
first (S, no ffmpeg, no browser, and it does not wait on open question 1, since items 2, 5 and 7 all
key or measure by frame), then item 8 (S, two files), then item 1 once question 1 is answered.

1. **An export path that proves itself: frames piped into ffmpeg, and the film's hash as a check.**
   Open Edit captures each frame as a PNG and pipes it into one ffmpeg process per segment
   (`cli/src/render/encode.ts`: libx264, preset veryfast, CRF 15, `yuv420p`, BT.709 tags,
   `+faststart`), then joins the segments with the concat demuxer by stream copy. Two details make the
   bytes reproducible and they are the point: x264's thread count is pinned to 4 so the output does not
   depend on the machine, and the test suite asserts it (`cli/tests/render.test.ts`: "two renders of
   one page are identical frame for frame", by sha256 of the files; "three workers write the same
   bytes as one"). Your works already have the harder half, a frame function that returns pixels
   without a clock (`__frameTo` in `oq-kocha/test/browser.mjs`, and `kadr.hook` in every card), and no
   mp4 path at all: `render-audio.mjs` writes raw PCM to a path outside the repository and nothing
   writes a picture file. → Do it as one script driven by the card, not per work: read `kadr.fayl`,
   `kadr.qurish`, `kadr.hook` and the durations, open the page as `olchov.grab` does, call the hook for
   every frame, and write the pixels to ffmpeg's stdin as raw video (`-f rawvideo -pix_fmt rgba -s WxH
   -r 24 -i -`, with `-vf vflip` because `readPixels` starts at the bottom row), no PNG step, since you
   read pixels directly where Open Edit has to screenshot. Fix `-threads 4`, tag BT.709, `yuv420p`,
   `+faststart`. Then the check, in the harness's own shape: `measure` = sha256 of two exports of the
   same card, pass when equal; `calibrate` = the same with one frame's pixels changed (or the seed
   moved), which must differ. Read the frame count back with ffprobe (`-count_packets`, as Open Edit's
   `countFrames` does) and require it to equal the sheet's count. → `loyihalar/tools/` beside
   `olchov.mjs` (it already opens the page by card), the encoder wrapper in `harness/lib.mjs` so the
   five works share it, the check in `loyihalar/test/run.mjs`. CI needs ffmpeg on the runner
   (ubuntu-latest ships it; verify once). → **M** for the export, **S** for the check once the export
   exists.

2. **Segments keyed by what made them, so a change re-renders one shot, not the film.** Open Edit
   writes `<out>.render/manifest.json` with `params` (fps, size, segment length, browser and ffmpeg
   versions) and one `seg-NNNNN.mp4` per 2 s; `--from/--to` re-renders only the segments a range
   touches, refuses when any param differs ("cached render was made differently"), and the test proves
   the untouched segments come back bit-identical while the touched one changed
   (`render.test.ts`, "a patch re-renders only the segments it touches and leaves the rest
   bit-identical"). Your CI job took 43 and 75 minutes for byte-identical trees (the comment above
   `street-cost` in `oq-kocha/test/checks-render.mjs`), so a full-resolution export of a ray-marched
   film is exactly the render that must not repeat. → Segment by shot, which is your natural unit
   (`SHOTS` in `oq-kocha/src/shots.mjs`), key each segment by sha1 of the sources the card lists in
   `manba` plus that shot's entry plus the encoder params, keep them under `build/`, and join by
   stream copy. The whole-vs-patched equality is then a check with a broken state: change one shot's
   entry, expect exactly that segment's hash to move. → Same script as item 1; the manifest next to
   the output. → **M**.

3. **A flat-frame gate over every frame, not the three the card samples.** Open Edit's `png.ts` reads
   each captured PNG only far enough to answer two things, `uniform` (every pixel the same) and
   `maxAlpha`, and the render fails when "every re-rendered frame is one flat colour"; the segment
   manifest records `drawn` per segment. Your `olchov` measures three named frames (`kadrlar: [36, 300,
   136]` in `loyihalar/kartalar/1-oq-kocha.json`); a shader that goes flat at frame 200 passes it. →
   While the export of item 1 streams frames, count the uniform ones (one pass over the RGBA buffer,
   early exit on the first differing pixel) and put the count in the card's `olchov` block, where a
   `davolar` line can hold it (`= 0` for oq-kocha; whiteout may legitimately own white frames, so the
   promise is per card). Broken state: render with the composition pass replaced by a constant. →
   `loyihalar/tools/olchov.mjs` (a per-frame flag beside `metrics`), the promise in each
   `kartalar/*.json`. → **S**.

4. **Snap the shot list to the frame grid at the source, once.** Open Edit's cut list is seconds in the
   file and frames in the machine: `cli/src/edl.ts` snaps every range with
   `Math.ceil(t * fps - 1e-6) / fps`, refuses sources whose rates differ by more than 1e-6, trims the
   picture half a frame before the boundary and the audio on the instant, and moves the word timings
   through the same snapped ranges (`retime-transcript`) so captions land on the instants the cut did.
   Your `shots.mjs` declares `d` in decimal seconds and `STARTS` accumulates them; the rounding happens
   at each use (`Math.round((STARTS[i]+sh.d*0.5)*FPS)` in `checks-render.mjs`). At 24 fps six of the
   eight durations in the card (`2.2, 1.3, 1.4, 0.8, 1.6, 2.8`) do not sit on the grid, and the total,
   14.6 s, is 350.4 frames: the film has no last frame, and `tools/mkfilm.py:212` builds the sound
   timeline over `Math.round(TOTAL*FPS)` = 350 of them, so the tail 0.4 frame is dropped without a
   word. That is a half-frame ambiguity at every cut, and your footfall check passes only at an error
   of zero frames. → Declare each shot in frames (`df`), with `d = df/FPS` as a derived view and `FPS`
   imported from `src/sheet.mjs:7` where it already lives; accumulate `STARTS` and `TOTAL` in frames.
   Whether 2.2 s becomes 52 or 53 frames is an authoring decision per shot, not a fix. The first
   check, written BEFORE the fix so its broken state is the current tree, in your own shape next to
   `cut-sizes`: `check({name:'frame-grid', unit:'off-grid shots', measure:()=>SHOTS.filter(s=>
   Math.abs(s.d*FPS-Math.round(s.d*FPS))>1e-9).length, pass:v=>v===0, calibrate:()=>[...SHOTS,
   {...SHOTS[1],d:2.2}].filter(…).length})`; today it measures 6 and calibrates 7. Widen it with
   `Number.isInteger(TOTAL*FPS)` so the last frame exists. The four `Math.round((STARTS[i]+…)*FPS)`
   sites (`checks-render.mjs:98`, `checks-world.mjs:20`, `checks-style.mjs:29`,
   `checks-audio.mjs:56`) keep working and become exact. → `oq-kocha/src/shots.mjs`, the check in
   `oq-kocha/test/checks-sheet.mjs`, then `sanoq.davomiyliklar` in the card becomes frame counts.
   → **S**: one afternoon, one commit, one new check.

5. **Measure the onset in the rendered sound, not in the schedule.** `speech-probe.ts` finds where
   speech starts and stops from the audio alone: a dBFS envelope in 10 ms windows, the floor as the
   10th percentile, the threshold `min(floor + 12 dB, floor + 0.35 · (peak − floor))`, every
   sub-threshold gap of 250 ms or more reported; the skill's rule is "transcript word boundaries are
   not cut points". As the fetched files read, your footfall check compares the drawn contact frame
   with `step` events from `window.__timeline()`, which is the schedule the synth was given, so a voice
   whose attack is late by a frame would still pass. → Add an envelope and an onset finder to
   `oq-kocha/test/dsp.mjs` (the FFT and `rms` are there; an onset is the first window over the
   threshold after a gap) and have the footfall check measure the onset in the PCM that
   `__renderAudio` returns against the drawn contact frame; broken state: delay the step voice by two
   frames, expect an error of two. → `oq-kocha/test/checks-audio.mjs`. → **M**.

6. **A delivery loudness pass, and a check on it.** `mux-audio.ts` lays sound on the silent render with
   `-c:v copy`, AAC 48 kHz, and ffmpeg's `loudnorm` at −14 LUFS integrated, −1 dBTP, loudness range
   ≤ 11 LU, in two passes: measure, then a linear gain when the peak and range allow it, dynamic
   otherwise, and no pass at all when nothing is measurable. Your audio checks hold headroom (peak
   < 0.99), a phone band above 400 Hz, flatness and roughness, but no integrated loudness, which is
   the one number every platform normalises to. → In the export of item 1, mux `film.pcm` (`-f f32le
   -ar 44100 -ac 1`) with `loudnorm=I=-14:TP=-1:LRA=11` and add a check that reads
   `loudnorm=print_format=json` (or `ebur128`) back: integrated within ±1 LU of −14, broken state a
   −6 dB gain. ffmpeg is the reference BS.1770 here; a K-weighted meter in `dsp.mjs` is the
   dependency-free way and an M on its own. → `oq-kocha/test/checks-audio.mjs`, the mux in the export
   script. → **S** with ffmpeg.

7. **A layer's span is measured from its pixels, not read from its declaration.** For the hand-off,
   `veed-project` renders each named page element alone with alpha and cuts it to its box; the span it
   gives the editor comes from `visibleSpans(frames: [{t, peak}], step, bridge)` in
   `cli/src/veed/editor-project.ts`: the frames where the layer's peak alpha is non-zero, short gaps
   bridged. Your render modes are the same idea, one frame split into layers (`__matFrame`,
   `__lineFrame`, `__depthFrame`, `__primFrame`): the question "when is this on screen" can be answered
   from the material buffer per frame rather than from `STARTS`. → For each shot, the first and last
   frame in which `CHARACTER(matOf(...))` covers more than the occupancy floor, compared with the
   declared span; broken state: shift one `STARTS` entry by a frame. If `checks-world.mjs` already
   does this, skip. → `oq-kocha/test/checks-render.mjs`, next to `occupancy/<shot>`. → **S**.

8. **Wait for readiness, not for time.** Before the first frame Open Edit's page runtime
   (`cli/src/render/page-runtime.ts`) awaits every font's load and `document.fonts.ready`, calls
   `decode()` on every image with a timeout, and pins `Date.now`, `performance.now` and `Math.random`
   (a seeded generator) so a page cannot read the wall clock. As the fetched file reads,
   `oq-kocha/tools/render-audio.mjs` waits 900 ms after load and then proceeds. A machine 1.7x slower
   (your own CI numbers) turns a sleep into a race. → Replace the sleep with an explicit ready signal
   from the page (a promise the film resolves when its programs are linked and buffers built), and in
   `browser.mjs`'s `open()` add an `addInitScript` that seeds `Math.random` and freezes `Date.now` and
   `performance.now`; your `determinism` check is then the proof for the four Canvas works too, whose
   internals this room did not read. → `oq-kocha/test/browser.mjs`, `oq-kocha/tools/render-audio.mjs`.
   → **S**.

9. **A contact sheet with the refusal that keeps it honest.** `cli/src/sheet.ts` tiles stills with
   ffmpeg's `tile=CxR:padding=6:color=0x202020`, and carries one guard worth copying: ffmpeg exits 0
   and writes nothing when a seek lands past the last picture frame, so a missing tile would shorten
   the sheet while the index still promises every tile, and `assertTile` refuses instead of
   mislabelling. `frames <video> --every 0.5 --sheet` names each still `f<frame>-<sec>s.png` and
   writes a `frames.json` plan beside them. A sheet is a look, not a measurement, but it is how an
   agent reads a whole film at once (this room read 84 of them). → One sheet per card of every shot's
   midpoint (you already compute them for `occupancy/`), written next to the card's frames, with the
   guard. → `loyihalar/tools/olchov.mjs` (`grab` already has the frames). → **S**.

## Not worth taking

- **The hand-off** (`veed-project`, `veed-pull`, the two bookmarklets, the plan's `source` half): it
  ends in VEED's hosted editor behind a VEED login, and comes back as a new project with VEED's fonts
  and static crops (the verdict, t026). Your films are code; there is no editor to hand them to.
- **The virtual clock as a whole.** Overriding `requestAnimationFrame`, timers, `Element.animate` and
  GSAP is what a page needs when it was written for a browser's clock. Your works answer a frame
  index directly, and Open Edit's own tests have to draw a clock box and read its width back from the
  pixels to prove the clock; you read `__frameTo`. Take only the pins in item 8.
- **Rational frame rates** (`timing.ts`: `30000/1001`, decimals refused): you are at 24, an integer.
- **All-intra proxies** (`media.ts`: a `-g 1` copy of any source whose GOP exceeds 12 frames, so a
  seek decodes one frame): there is no footage in your works.
- **Transcription, captions, `retime-transcript`, Fabric, fal, `background-removal`, `lipsync`,
  `stills`**: speech, presenters and licensed pictures; none in a film drawn by code.
- **The page server and the Chrome pin** (`render/server.ts`, roots and tokens; playwright-core
  1.63.0 with its exact Headless Shell build): protection for a tool that serves strangers' pages.
  Your harness opens its own file; Playwright's Chromium in CI is enough.
- **HyperFrames' markup timeline** (`data-start`, `data-duration`, `data-track-index`,
  `window.__timelines`): a manifest for DOM compositions. Yours draw pixels; the shot list and the
  exposure sheet are already your manifest, and item 4 is what they lack.
- **The measurement commands the video deleted** (`measure-placement`, `wcag-pass`, `safezone-check`,
  `check-delivery`, `gates`): gone from `main` on 2026-09-29 and never read by this room; they would
  have been the closest thing to your checks. They are still in the history at `dd7913b` if the owner
  wants a second pass (open question 6).

## Open questions for the owner

1. Is an mp4 export wanted at all, or is "the code makes them again" the whole point? Items 1, 2, 3
   and 6 exist only if it is. If yes: a CI artifact, a local file, or both?
2. Shot durations off the 24 fps grid (six of eight, item 4): by design, or never noticed?
3. The card's text says the film is 15,6 s and its durations sum to 14,6 s (350.4 frames);
   `render-audio.mjs` renders 14.6 and `mkfilm.py:212` rounds the sound timeline to 350 frames.
   `karta.verify` proves the listed values appear in the text, not the sum. Which number is the film,
   and should the total be derived rather than typed? Item 4 done in frames closes this by itself.
4. Does the footfall check read the rendered PCM or the schedule (item 5)? The room read summaries of
   `checks-audio.mjs` and `render-audio.mjs`, not every line.
5. A cut list in an editor's format (OpenTimelineIO or FCPXML from `shots.mjs`, an M in
   `loyihalar/tools/`): any use for it, ever? If not, the room drops the idea for good.
6. Should the room read the deleted measurement commands at `dd7913b` for a second page? They were
   frame measurements with thresholds, the kind your profile asks for, and this room only listed them.

---
*From room 2 of the Labs workshop (Open Edit). Edited there, never here: `labs rooms pull` brings the newest.*
