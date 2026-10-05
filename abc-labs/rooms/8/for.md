# For code-video, from room 8
(written 2026-09-30, against code-video `ff977c2`, open-edit `7f212e0` [s11], Palmier Pro `eeafde2` [s12], and Cardboard's site as fetched 2026-09-30 [s3–s8])

## What this is

Cardboard is a closed agentic video editor. Its agent interface is not published, so it cannot be
compared with `shots.mjs`. What code-video can use from this room is:
- Cardboard's own list of what goes wrong in an export;
- mechanisms from the two open tools read beside it (VEED open-edit, Palmier Pro);
- two defects in code-video found while reading it against them.

Where to start: item 1 (a one-frame sound/picture mismatch at the first cut, an afternoon), then item
2 (makes the four Canvas works measurable at exact frames).

**The brief's three questions, answered first:**
- **Does Cardboard describe an edit as data a renderer and a checker could both read?** Not in
  anything published.
  - "Cardboard has no public API" [s3:110-111].
  - The agent works inside Cardboard's app, and the room could not see its tools [s7 `faq.txt:11`;
    s2 t030].
  - The timeline leaves only as FCPXML or AAF, on paid plans from Starter up [s4 `faq.txt:16`,
    s3:61], or as an undocumented `.cbproj` [s5 `changelog.md:28`].
  - The published counterpart is Palmier's `get_timeline`: clips as `[start, end)` in integer
    timeline frames, end exclusive, with gaps listed [s12 `ToolDefinitions.swift:88`].
    `shots.mjs` stores durations as seconds (`d:2.2`) and derives `STARTS` by float addition
    (`oq-kocha/src/shots.mjs:5-29`). Item 1 is where that difference bites.
- **Do its captions, cuts and sound come out of something reproducible?** Nothing published says
  so.
  - The only timeline in the launch film holds two audio files by name: one named like an ElevenLabs
    download, one a stock "No Lead Vocals.mp3" (t033, `sources/s2/frames.md`). The sound came in as
    files, not from code.
  - The changelog mentions an export cache: "Export the same cut twice. The finished file comes
    straight back" [s5 `changelog.md:207`]. It does not say what the cache is keyed on.
- **What does "every export gets checked" check?** Cardboard names the symptoms, not the method:
  - "If the picture or sound didn't make it … No more frozen frames, no clicks in the audio"
    [s5 `changelog.md:57-58`];
  - "Every first frame. Clips keep their opening frames in the export" [s5 `changelog.md:77`];
  - "Missing images, flagged early … before the export starts" [s5 `changelog.md:70`];
  - "A fully muted timeline exports without an empty audio track" [s5 `changelog.md:43`].
  - Their own hiring page says the verifier is still to be built: "There's no linter for video. We
    have to build one" [s8:41].
  So it is a slogan with a usable symptom list. Item 3 turns that list into checks with broken
  states.

## Worth taking

1. **Cuts on the frame grid, from one reader.** open-edit snaps every range edge up to the next frame
   instant. Its reason: ffmpeg keeps whole frames, so audio cut on the raw edge "differs from the
   picture by up to a frame per range … and the drift grows with every join"
   [s11 `cli/src/edl.ts:98-112`]. Palmier keeps clips in integer frames [s12 `:88`].

   In code-video the picture and the sound decide the cut with different arithmetic:
   - The picture advances `T += DT` per frame and asks `shotAt(T)` (`oq-kocha/tools/mkfilm.py:204,
     273-279, 387-390`).
   - The offline sound render asks `shotAt(f/FPS)` (`mkfilm.py:360-362`).
   - At the first cut, 3.0 s is exactly frame 72. But 72 steps of `DT` add up to 2.9999999999999978,
     so the picture changes shot at frame 73 while the wind/city beds switch at frame 72. The bed's
     0.18 s ramp (`mkfilm.py:362`) starts one frame, 42 ms, before the picture cut.
   - The other six boundaries (5.2, 6.7, 8.0 … s) either fall between frames or survive the rounding,
     and they agree (`work/cuts.mjs` → `work/cuts.txt`; the durations and code copied from
     `shots.mjs` and `mkfilm.py`).
   - `audio/footfall-sync` checks footsteps, not beds, so it cannot see this
     (`oq-kocha/test/checks-audio.mjs:46-77`).

   → **How:**
   - Store each shot as a whole number of frames, or snap `STARTS` once with
     `Math.ceil(s*FPS - 1e-6)`.
   - Make `shotAt` take a frame index. `step`, `buildTimeline` and `__renderAudio` then all ask with
     `f`, never with a float time.
   - A new check, `cut-frames-agree`: for each boundary, compare the frame where `__frameTo(n).shot`
     changes with the frame where the bed schedule changes. It passes at 0. Its broken state is
     today's float `shotAt(T)`, which gives 1 at the first cut.
   - Note that 2.2 s at 24 fps is 52.8 frames. Choosing whole-frame durations is an authoring
     decision (question 2).

   → **Where:** `oq-kocha/src/shots.mjs`, `oq-kocha/tools/mkfilm.py` (`shotAt`, `step`,
   `buildTimeline`, `__renderAudio`), `oq-kocha/test/checks-sheet.mjs` beside `cut-sizes`.

   → **Effort:** S.

2. **A virtual clock injected into the page, so a frame depends only on its index.** open-edit
   injects a script before any page code runs. It replaces `performance.now`, `Date`, timers and
   `requestAnimationFrame` with a clock the renderer advances one frame at a time, and seeds
   `Math.random` [s11 `cli/src/render/page-runtime.ts:1-4,35,42`]. It sets CSS animations to the
   frame's time and calls `window.__seek(t)` for anything else [s11 `:302`].

   In code-video only Oq Ko'cha has a hook (`__frameTo`, `loyihalar/kartalar/1-oq-kocha.json:22`).
   For the four hookless Canvas works, `grab` waits real time between frames
   (`loyihalar/tools/olchov.mjs:104`). What gets measured is whatever that machine, under
   SwiftShader, has reached. The project's own note records the result: in a project whose frames are
   taken by time, "the calibration itself was unstable — 19.6 and 5.4"
   (`loyihalar/test/run.mjs:76-77`). `whiteout.html` runs on `performance.now` and
   `requestAnimationFrame` (`whiteout/whiteout.html:667,1007,1084`).

   → **How:**
   - `page.addInitScript` with a clock like open-edit's before `page.goto` in `grab`.
   - The `kadrlar` of a hookless card then become frame indices that the clock is stepped to, not
     seconds to wait.
   - The four works stay untouched.
   - New check `olchov/kadr-takrorlanadi`: grab the same frame twice in two browser launches; the
     pixel difference must be 0. Its broken state is the present wall-clock grab.

   → **Where:** `loyihalar/tools/olchov.mjs` (`grab`), `loyihalar/test/run.mjs`.

   → **Effort:** S–M. The page-runtime is about 360 lines of Apache-2.0 [s11 `LICENSE`]; question 3.

3. **Cardboard's export failures as checks, each with its broken state.** This is the part of
   Cardboard that can be used. It only applies once there is an export (item 4); today
   `render-audio.mjs` writes raw PCM to a hard-coded `/home/claude/work/forge/film.pcm`
   (`oq-kocha/tools/render-audio.mjs:7,24`), and nothing makes an mp4.

   → **How:** checks on the exported file, not on the page:

   | check | measured | broken state |
   | --- | --- | --- |
   | `export/no-frozen-frames` (Cardboard: "no more frozen frames") | the longest run of consecutive identical decoded frames, against the longest run the page itself makes for the same frames through `__frameTo` (measured once; `detail/snow-falls` suggests it is 1) | frame k copied over k+1 |
   | `export/first-and-last` ("every first frame") | decoded frame 0 and N−1 against `__frameTo(0)` and `__frameTo(N−1)` | the first frame dropped |
   | `export/frame-count` | decoded frames = `Math.round(TOTAL*FPS)` (350 today, `work/cuts.txt`) | one frame short |
   | `export/no-clicks` ("no clicks in the audio") | the largest sample-to-sample jump relative to the local RMS, on the muxed track | a 0.3 step inserted at one sample |
   | `export/sound-made-it` ("if the picture or sound didn't make it") | audio duration − video duration, within one frame | the audio cut 0.5 s short |

   → **Where:** a new `oq-kocha/test/checks-export.mjs` beside `checks-audio.mjs`, run after the
   export.

   → **Effort:** M, after item 4.

4. **A reproducible export: exact rate, cached segments, measured loudness.** From open-edit:
   - The frame rate is an exact rational; `29.97` is refused [s11 `cli/src/render/timing.ts:1-2,18-34`].
   - The output is cut into segments with a `manifest.json`, and only segments that overlap a change
     are re-rendered. A segment made by another browser or ffmpeg build is never spliced in
     [s11 `cli/src/commands/render.ts:5-6,76-77,118-122`].
   - A render that drew nothing is refused [s11 `cli/src/render/png.ts:95-96`, `render.ts:379-391`].
   - The sound is levelled to −14 LUFS / −1 dBTP, and the tool says which correction actually ran
     [s11 `cli/src/commands/mux-audio.ts:98-115`].
   - At the mux the picture decides the length (`-t` from the video's duration; `-shortest` once
     cut a 6 s render to a 2 s track with exit 0), a track with no audio stream is refused, and the
     file is written under a temporary name and renamed, so a file that exists is complete
     [s11 `mux-audio.ts:59-74, 91, 97`] (added 2026-10-01).

   → **How:** `oq-kocha/tools/export.mjs`:
   - For n = 0…N−1, call `__frameTo(n)`, `readPixels` (as `test/browser.mjs:40-51` already does),
     and pipe RGBA into `ffmpeg -f rawvideo -r 24/1`.
   - `__renderAudio(TOTAL, 48000)` → wav, then mux with `-t <video duration>`, never `-shortest`,
     to a temporary name that is renamed when ffmpeg exits 0.
   - Key the cache on the sha256 of the card's `manba` files (`1-oq-kocha.json:3-10`, already the list
     of sources), the Chromium build, and fps/size. The file is then made again only when its source
     changed, which honours "the code makes them again" (`README.md:62-63`).
   - Measure integrated loudness (ffmpeg `ebur128`) as a check beside `audio/headroom`, which today
     only bounds the peak (`checks-audio.mjs:40-44`). Broken state: the mix at −6 dB.
   - `__frameTo(n)` restarts from 0 each call (`mkfilm.py:387-390`). A full export is 350·351/2 ≈ 61k
     `step`s and no extra renders, so it is cheap. A `__frameNext()` would make it linear.

   → **Where:** `oq-kocha/tools/export.mjs` (new), `oq-kocha/package.json` scripts.

   → **Effort:** M.

5. **A failing frame shows its number and a grid.** Palmier's `inspect_timeline` returns the
   composited frame with "a 0–1 coordinate grid over the canvas … and its frame number burned into the
   top-left (f157)". It lists the clip ids visible on that frame, so "what you see maps straight back
   to the clips to edit" [s12 `ToolDefinitions.swift:99`].

   → **How:** when a check FAILs or is UNPROVEN, write the frame it measured as a PNG with `f<n>`,
   the shot key and the drawing index burned in. `__frameTo` already returns
   `{frame, t, shot, idx}` (`mkfilm.py:397-398`). Upload it as a CI artifact next to the annotation
   `belgi()` prints (`harness/lib.mjs:51-62`). The measured value and the known-bad value then come
   with the picture they were taken from.

   → **Where:** `harness/lib.mjs` (`check` takes an optional `frame` for the failure picture),
   `oq-kocha/test/browser.mjs`.

   → **Effort:** S.

6. **A card line that states numbers must bind all of them.** Found while checking item 1's
   arithmetic:
   - The Oq Ko'cha card says "8 kadr, davomiyliklari 3 · 2,2 · 1,5 · 1,3 · 1,4 · 0,8 · 1,6 · 2,8 s —
     jami 15,6 s" (`loyihalar/kartalar/1-oq-kocha.json:30`), and the root README says "15,6 s film"
     (`README.md:20`).
   - The durations sum to 14.6 s (`work/cuts.txt`), which is what `oq-kocha/README.md:3` and the page
     itself say (`mkfilm.py:51`).
   - `karta/sanoq-bilan-mos` passes because a line is bound to one value (`dalil: jadvallar.SHOTS`
     = 8), and `tasdiq` checks only that this one number appears (`loyihalar/tools/karta.mjs:53-56`).
     The other nine numbers in the line are free. This is the project's own worst case: a check that
     passes without holding the thing.
   - The same principle is behind open-edit's "one reader, one validator" for the EDL
     [s11 `cli/src/edl.ts:1-3`].

   → **How:**
   - Let `dalil` name several values (`["jadvallar.SHOTS","davomiyliklar","jami"]`), with `sanoq`
     counting `jami` as the sum of `davomiyliklar`.
   - Have `tasdiq` fail on any number in the line that no bound value accounts for.
   - Broken state: the present card, with its 15,6.

   → **Where:** `loyihalar/tools/karta.mjs` (`tasdiq`, `verify`), `loyihalar/tools/sanoq.mjs`,
   `loyihalar/kartalar/1-oq-kocha.json`, `README.md:20`.

   → **Effort:** S.

## Not worth taking

- **Cardboard itself, or its agent route.** There is no API [s3:110]. The agent runs inside their
  app on a paid Claude or ChatGPT plan [s7]. Its tools and the "Cardboard skill" the film mentions
  (t030) cannot be read. There is nothing for a JS pipeline to call.
- **FCPXML / AAF interchange.** It hands a cut of footage to Resolve or Premiere to relink [s5
  `changelog.md:1109-1113`]. code-video's films have no footage to relink; the shot list is the
  source.
- **Cardboard's "properties panel" for a graphic** ("the words, numbers and colours inside it" [s5
  `changelog.md:94-95`]) and **one-file `.cbproj`** [s5 `:28`]. code-video already has both, in
  stronger form: a style is 40 numbers and 33 palette slots in a file, with measured boundaries
  (`oq-kocha/README.md:103-122`), and the film is one HTML page (`mkfilm.py:407-410`).
- **Caption checks** (text that overlaps or shrinks too small [s5 `changelog.md:556-557`]). The
  films have no captions today. Revisit if a work gets text.
- **open-edit wholesale.** It is an agent toolkit around VEED's login, credits and fal billing
  (SKILL.md, "Money") [s11]. code-video is "JavaScript, no framework" (profile). Take the ~720 lines
  that matter (`page-runtime.ts` 363, `timing.ts` 141, `edl.ts` 121, `png.ts` 96), not the CLI.
- **Palmier's code.** GPLv3 through v0.7.6 and proprietary after [s12 `README.md:2`]. Take the idea
  in item 5, not the Swift.
- **"Solved video editing"** [s1]. Cardboard's own hiring page lists ten open problems [s8].

## Open questions for the owner

1. **Does code-video want an mp4 at all?** The profile asks for "export paths … that stay
   reproducible", and the README says rendered files are never stored. Unblocks items 3 and 4:
   export is made on demand and cached by source hash, never committed.
2. **Whole-frame shot lengths.** Shall `shots.mjs` hold frames instead of seconds (2.2 s → 53 frames
   is a 1/120 s change of the film)? Or keep seconds and snap once? Unblocks item 1.
3. **open-edit's page-runtime under Apache-2.0.** Copy it with its NOTICE, or write only the clock
   part anew (virtual time, timers, rAF, seeded random)? Unblocks item 2.
4. **14.6 or 15.6 s?** Which is intended for Oq Ko'cha? The card and the root README disagree with
   the code. Unblocks item 6.
5. **Patches.** The room can propose items 1 and 6 as patches under `for/code-video.patches/` if the
   developer asks in the log.
6. **Cardboard's agent surface can only be read on a Mac with the app, signed in.** That means the
   skill text, the tool list and the timeline's shape. This room was told not to, and has no Mac. If
   someone ever does, the question to answer is whether those tools pass the timeline as frames or as
   seconds.

---
*From room 8 of the Labs workshop (Cardboard video editor). Edited there, never here: `labs rooms pull` brings the newest.*
