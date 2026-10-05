# For code-video, from room 2

Written 2026-09-30 against veedstudio/open-edit [s2] at `7f212e04` (npm 0.3.0 [s5]) and against code-video [s4] at
`ff977c2`; corrected the same day after the room's first review (`review.md`), every line below checked again in
verbatim copies of both trees (`sources/s2/README.md`, `sources/s4/README.md`). `cli/src/…` paths are open-edit's
[s2]; the others are yours [s4]; a `t0NN` is a frame of the announcement video [s3]. Effort: S an afternoon, M a
few days, L weeks. Nothing was run. `verdict.md` says what Open Edit is; this page is the part of it that is yours
to take. Updated 12:20 for your report of 12:09 [s16]: items 4 and 8 done in your working tree on `9ac1402`,
uncommitted. The room has not seen that tree (`9ac1402` is not on GitHub), so what it says about the change is
yours, and what it says about the code is still `ff977c2`. Updated 2026-10-01, the room's harvest: item 9 gains a
strip per cut, `mix-audio` joins "Not worth taking", open question 6 is narrowed by the deleted commands' headers;
your public `main` was still `ff977c2` at the workshop's fetch of 08:42.

## What this is

Open Edit is an agent's video toolkit whose renderer, since 2026-09-29, is headless Chrome on a virtual clock, PNG
frames piped into ffmpeg in cached segments, with a measured cut list, a mix spec and a loudness pass beside it,
all Apache-2.0 [s2]; its hand-off to VEED's editor is the part that is not yours [s2, s3].

Where to start: items 4 and 8 are done for oq-kocha [s16]. Next, item 1 for oq-kocha with the job below (M), with
item 6's mux in the same step, because its sound now renders on the runner, and item 3 in the same frame loop (S
each). Then whiteout's own item 4 and 8, which it has not had, and its camera shake moved into the step (S each:
it cuts a frame late too, it has no ready flag, and its shake lives on display frames, item 1). Then item 1 for
whiteout, item 10 (S) so the other works can join, item 5 (M), and item 2 (M) last, once one export run has shown
what a film costs on the runner. Item 2's key now carries each shot's start frame and inherited state.

## Worth taking

**The owner's answer, 2026-09-30 09:56: an mp4 is wanted, as a CI artifact.** That keeps the profile's rule
(rendered video and audio are never stored, `workspace/projects/code-video.md:16-17`): an artifact lives beside a
run, outside the repository, and expires [s14]. It opens items 1, 2, 3 and 6.

**The job that carries it**: a third job in `.github/workflows/audit.yml`, in that file's own style (its jobs
`oq-kocha` and `loyihalar`, `on: [push, pull_request]`, `:2-4`), with `workflow_dispatch` added to `on:` [s4]. The
names are proposals, Uzbek like the rest of `loyihalar/`:

```yaml
  eksport:
    needs: [oq-kocha, loyihalar]           # only a tree whose checks passed is exported
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '22'}
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg && ffmpeg -version | head -1
      - run: npm i playwright && npx playwright install --with-deps chromium
        working-directory: loyihalar
      - uses: actions/cache@v5               # item 2: shot segments survive between runs
        with:
          path: loyihalar/build/segmentlar
          key: seg-${{ hashFiles('oq-kocha/src/**', 'oq-kocha/tools/**', 'whiteout/**', 'loyihalar/tools/eksport.mjs') }}
          restore-keys: seg-
      - run: node tools/eksport.mjs && node test/eksport.mjs
        working-directory: loyihalar
      - uses: actions/upload-artifact@v7
        with:
          name: filmlar-${{ github.sha }}
          path: loyihalar/build/filmlar/     # <n>-<nom>.mp4, <n>-<nom>.manifest.json, SHA256SUMS
          if-no-files-found: error           # an empty artifact is a failed export, not a quiet one
          retention-days: 14
          compression-level: 0               # mp4 is compressed already
```

Four lines in it are decisions, not syntax. `needs:` makes the artifact the film whose checks passed, at the price
of waiting for oq-kocha's audit, 43 and 75 minutes in the runs recorded above `street-cost`
(`oq-kocha/test/checks-render.mjs:37-39`) [s4]; zarra now has a job of its own [s16], and it joins `needs:` only if
zarra joins the export (open question 8). ffmpeg is installed and its version printed rather than assumed, and
the version belongs in the segment key anyway. `restore-keys: seg-` restores a stale cache whose key starts with
`seg-` when the exact key misses [s15], so the manifest of item 2 decides shot by shot what is still valid.
`retention-days: 14` is a proposal inside GitHub's 1 to 90 [s14]; the number is open question 1. The versions of
the cache and artifact actions are their READMEs' current majors [s14, s15]; checkout and setup-node are what
`audit.yml` uses. The root `.gitignore` holds `build/` (`:2`), so nothing the job writes can be committed by
mistake, and `loyihalar/test/eksport.mjs` reports through `harness/lib.mjs` like every other suite, so a failed
export shows in the job summary and as an annotation (`belgi()`, `harness/lib.mjs:51,58-61`) [s4].

1. **An export whose bytes repeat: frames piped into ffmpeg, and the packets' hashes as the check.** Open Edit pipes
   each captured frame into one ffmpeg process per segment (`cli/src/render/encode.ts:15-27`: libx264, preset
   veryfast, CRF 15, `yuv420p`, BT.709 by `scale=out_color_matrix=bt709` and the three colour tags) and joins the
   segments by stream copy, `+faststart` on the join (`:114`) [s2]. It fixes x264's thread count at 4 because
   x264's output depends on it: "the same page gives the same bytes whatever --workers was" (`:11-13,26`) [s2].
   What its tests prove is packets and frames, not files: `hashes()` is ffmpeg's `framemd5`
   (`cli/tests/render.test.ts:54-57`), over the packets by stream copy for "three workers write the same bytes as
   one" (`:151,198`) and over the decoded frames for "two renders of one page are identical frame for frame"
   (`:232-240`); no test mentions threads [s2]. After the join, `render` counts the frames and refuses a file that
   does not hold the total (`cli/src/commands/render.ts:547-548`) [s2].
   Your side, work by work [s4]. **oq-kocha** is ready: `__frameTo(n,w,h)` draws any frame
   (`oq-kocha/tools/mkfilm.py:387`), restarting from T=0 on each call (`:388-390`), which costs little because a
   step is arithmetic and only the last one renders; `readPixels` returns the bottom row first
   (`oq-kocha/test/checks-world.mjs:18`). **whiteout** is ready with one care: 1920×1080 with its own seeded
   generator (`whiteout/whiteout.html:58,67-69`), but its `__frameTo(n)` restarts from frame 0 and draws every step
   (`:1061`), O(n²) over a film, as its comment says; export it with `__rewind()` once and `__step()` per frame
   (`:1081-1082`). Its card names no hook, so `olchov` samples it by the wall clock today
   (`loyihalar/tools/olchov.mjs:104`). **bir-tomchi** has `window.__seek(s)` and `__total()`
   (`bir-tomchi/bir-tomchi.html:1135-1136`): they set its clock without drawing, and the next animation frame adds a
   wall-clock `dt`, so with item 10's stepped clock it is seek, then one tick. **mushuk** and **not-a-measurement**
   have no hook and wait for item 10. Two more works, **zarra** (`window.__frameTo=kadr`, `zarra/zarra.html:75`)
   and **masofa-maydoni** (`window.__still`, `:888`), have hooks and no card (open question 8).
   What writes pictures today is `loyihalar/tools/katalog.mjs`: one JPEG still per card, through the card's hook at
   720×518 or after `t*1000` ms of wall clock when there is none, embedded in `uslublar-katalogi.html`
   (`:20-28,92`); no video is written anywhere, though `bir-tomchi.html:1138-1139` carries a `__tapAudio` that
   "lets the video export record exactly what the page plays".
   → One script driven by the cards, `loyihalar/tools/eksport.mjs` beside `olchov.mjs` and `katalog.mjs`: build
   with `tayyorla` from `karta.mjs` (`:33`) as `kadr/qurish-zanjiri` already does (`loyihalar/test/run.mjs:46-48`),
   open the page with a fixed viewport and `deviceScaleFactor: 1`, then write each frame's pixels to ffmpeg's stdin
   as raw video: `-f rawvideo -pix_fmt rgba -s WxH -r 24 -i -`, `-vf vflip,` (WebGL only) then Open Edit's
   `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, `-c:v libx264 -preset veryfast -crf 15 -threads 4`,
   the three BT.709 tags, `-movflags +faststart` on the joined file. No PNG step: you read pixels where Open Edit
   has to screenshot. Carry them out of the page as base64, not as `Array.from(px)` the way `pixels()` does now
   (`oq-kocha/test/browser.mjs:49`): a 1920×1080 frame is 8.3 MB of RGBA, 11 MB as base64, and about three times
   that as a JSON array of numbers. The encoder wrapper goes in `harness/` so the works share it. Two checks in
   `loyihalar/test/eksport.mjs`: `eksport/takror`, the shortest shot exported twice with the packets equal by
   `ffmpeg -i x.mp4 -map 0:v:0 -c copy -f framemd5 -`, which is what Open Edit proves (calibrate: one pixel
   changed, which must differ; one shot rather than the film twice, because a second full render doubles the job);
   `eksport/kadr-soni`, ffprobe `-count_packets` (as Open Edit's `countFrames`, `encode.ts:119-120`) equal to the
   film's frame count, which item 4 makes one number (calibrate: that count + 1). The artifact's `SHA256SUMS`
   names the files; it is not the check, because a file's bytes also carry the muxer's, which nothing of Open
   Edit's tests. → **M** for the export, **S** for the two checks.
   **After your items 4 and 8 [s16], for oq-kocha:** the export opens the page through `browser.mjs`'s `open()`,
   which now waits for `window.__ready`, as `render-audio.mjs` does; it writes frames 0 to `TOTAL_F`−1 with
   `__frameTo(n,w,h)`, and `eksport/kadr-soni` reads its number from `TOTAL_F` (350) and calibrates at 351. Nothing
   else in the item changes. **For whiteout, not yet:** it has the same first-cut fault as oq-kocha before your fix
   (seconds in `SHOTS`, `T+=DT`, a `T>=S[j]` ceil, `whiteout.html:73-79,719,991`): replayed, shot 1 starts at frame
   73, and the declared 19.35 s is 464.4 frames. It stops at the end rather than wrapping (`:993`), so its length is
   465 or 466 depending on whether the clamped frame counts (`sources/s4/README.md`) [s4]. And it sets no
   `__ready`; its `start()` waits for two faces and starts anyway on `.catch` (`:1085-1087`). Its item 4 and 8 come
   first, the same changes as oq-kocha's. Then export it with `__frameTo(0)` for frame 0 and `__step()` for each
   frame after (`:1061,1081`), and prove that shortcut once in `eksport/qadam`: the stepped frame `n` equals
   `__frameTo(n)` pixel for pixel at three frames, one per act. Calibrate with a `__step` that skips `sim(DT)`,
   which must differ. It is S, and it is what makes the O(n) path the same film as the O(n²) reference.
   One more thing in whiteout before its export: **its camera shake is not film state.** The rAF loop `frame()` sets
   it at impactA and after (`:1000-1003`), and `draw()` decays it on every call (`:729`); the step and both hooks
   never touch it (`:990-994,1061-1065,1081`) [s4]. An export that reads each frame in the call that drew it has
   no shake at the impact, and one that reads later gets whatever the live loop drew in between. `eksport/qadam`
   cannot see this, because both of its paths leave the shake out, and neither can `eksport/takror`. → Set it in
   `stepOnce()` from `frameNo` against the shot's first frame, decay it per step there, and let `draw()` only read
   it. Check it with `eksport/silkinish`: impactA's first frame against the same frame with the shake held at 0,
   pass when they differ. Today's tree is the broken state: through the hooks the two are equal. S. It also makes
   the shake last the same in playback on every screen; today it is 12 `draw()` calls, 0.2 s at 60 Hz and 0.1 s at
   120 Hz.

2. **Segments keyed by what made them, so a change re-renders one shot, not the film.** Open Edit writes
   `<out>.render/manifest.json` with `params` (fps, size, segment length, browser and ffmpeg versions) and one
   `seg-NNNNN.mp4` per 2 s (`cli/src/commands/render.ts:422-436,653`); `--from/--to` re-renders only the segments
   a range touches, refuses when any param differs ("cached render was made differently"), and a test proves the
   untouched segments come back bit-identical while the touched one changed (`cli/tests/render.test.ts:322`)
   [s2]. Your audit took 43 and 75 minutes for byte-identical trees (`checks-render.mjs:37-40`) [s4], so a
   full-resolution export of a ray-marched film is exactly the render that must not repeat. → Segment by shot where
   the work has a shot list (`SHOTS` in `oq-kocha/src/shots.mjs:4`, `whiteout.html:73`, not-a-measurement's
   `CUTS` at `:87`), on the frames item 4 fixes, and by fixed 2 s segments for bir-tomchi, whose scenes overlap by
   1.35 s (`bir-tomchi.html:877-878`). Key each segment by sha1 of the sources the card lists in `manba`
   (`karta.mjs:17`), plus that shot's entry, plus the params (size, fps, the ffmpeg and Chromium version lines,
   the x264 settings); keep them in `loyihalar/build/segmentlar/`, which the job's cache step carries between
   runs; join by stream copy (each segment is its own encoder run, so each starts on a keyframe).
   **Corrected 12:20: the shot's entry is not enough.** A shot of oq-kocha is also a function of where it starts
   and what it inherits. The snow falls on the film's global clock (`mkfilm.py:249,263` → `comp.frag:177`), and
   `step()` carries both walk phases and A's distance through every shot that walks (`mkfilm.py:273-278`; your
   comment at `:392-395` says so) [s4]. Your own measurement shows the easy half: the passing shot drawn over 1.625 s
   instead of 1.6 s, same 39 frames, changed only that shot [s16]. A shot one frame longer would move every later
   shot. → Key shot `k` by the sources, the params, `SHOTS[k]`, `STARTS_F[k]`, and the phases and distance at
   `STARTS_F[k]`, read from the film: add `phA` and `phB` beside `idx` and `di` in `__frameTo`'s return (`:397`,
   one line). The check, `eksport/kesh`, needs no full render. Make three edits in a copy of the list: a camera,
   one shot's `df`, and one shot's `aw`. For each, the keys that move must be the shots whose first and last frames
   actually differ, asked of the film at 16×12 (`__frameTo(n,16,12)` with `idx` and `di`) in both lists. Calibrate
   with the key of the old page, the entry alone, which under the `df` edit moves one key where several shots
   changed. whiteout is a simulation: flakes, spray and the one `rnd()` stream run from frame 0 (`whiteout.html:67-69,
   90-93`) [s4], so any change before a shot moves that shot's key. Segmenting whiteout saves only the tail after
   the last change; keep it one segment keyed by its source until its cost says otherwise. → Same script as item 1;
   the manifest beside each mp4 in the artifact. → **M**.

3. **A flat-frame gate over every frame, not the three the card samples.** Open Edit's `png.ts` reads each
   captured PNG only far enough to answer `uniform` (every pixel the same) and `alphaMax`
   (`cli/src/render/png.ts:6-11`), and the render fails with "every rendered frame is one flat colour", or "every
   re-rendered frame is …" for a patch (`cli/src/commands/render.ts:540-544`); the segment manifest records
   `drawn` per segment (`:121`) [s2]. Your `olchov` measures three named frames (`kadrlar: [36, 300, 136]`,
   `loyihalar/kartalar/1-oq-kocha.json:17-22`) [s4]; a shader that goes flat at frame 200 passes it. → While the
   export of item 1 streams frames, count the uniform ones (one pass over the RGBA buffer, early exit on the first
   differing pixel), write the count into the segment manifest, and hold it in `eksport/tekis` against a per-card
   promise (`= 0` for oq-kocha; whiteout may own white frames, so the promise lives in each `kartalar/*.json`).
   Broken state: render with the composition pass replaced by a constant. → `loyihalar/tools/eksport.mjs`, the
   check in `loyihalar/test/eksport.mjs`. → **S**. After your items 4 and 8 [s16] the mechanism is unchanged.
   "Every frame" is now `TOTAL_F` frames, and with `__ready` awaited a flat frame 0 can no longer be a shader that
   had not linked yet, so a flat frame the gate finds belongs to the picture. It runs inside item 1's frame loop,
   one pass over a buffer already in hand, so it lands with item 1.

4. **Count the film in frames, at the source.** *Done for oq-kocha in your working tree, as you report it [s16]:
   `shotAt` by `Math.round(t*FPS)` against `STARTS_F`, the wrap at `TOTAL_F`, `buildTimeline` over `TOTAL_F`, shots
   of 72 53 36 31 34 19 39 66 = 350 frames, the card's total bound to `kadrJami`, `frame-grid` on `df` (8 on the
   old list) and `cut-frames` (2 on the old page). The room checked the arithmetic: those are the first frames at
   or after each authored start, and 350 frames is 643125 samples at 44.1 kHz. whiteout has not had it (see the end
   of this item).* Open Edit's cut list is seconds in the file and frames in the
   machine: `cli/src/edl.ts:106` snaps every range with `Math.ceil(t * fps - 1e-6) / fps`, the `1e-6` so that
   rounding noise just above a frame boundary cannot push a cut a frame late; `cli/src/commands/apply-edl.ts`
   refuses sources whose rates differ by more than 1e-6 (`:177`) and trims the picture half a frame before each
   boundary and the audio on the instant (`:38-41,68-74`); `retime-transcript` moves word timings through the same
   snapped ranges [s2]. Your `shots.mjs` declares `d` in decimal seconds and sums them into `STARTS` and `TOTAL`
   (`oq-kocha/src/shots.mjs:28-29`). The film finds a frame's shot with `t>=S[j]` (`mkfilm.py:204`), a ceil with
   no guard, on a clock it **accumulates**: `T+=dt` in `step()` for the picture (`:275`), `t+=DT` in
   `buildTimeline()` for the footsteps (`:228`) [s4]. Replayed in the room with the same double arithmetic
   (`sources/s4/README.md`): at frame 72 that clock reads 2.9999999999999978 s, short of shot 1's 3.0, so the
   picture and the footsteps cut to shot 1 at frame **73**, while the checks, which compute `f/FPS`
   (`checks-audio.mjs:60`), and `__renderAudio`'s wind and city beds (`mkfilm.py:360-362`) cut at 72. The other
   six cuts agree. So the film you render has shots of 73, 52, 36, 31, 34, 19, 39 and 66 frames (the picture draws
   a 67th, frame 350, and wraps at 351, `:278`; the sound timeline stops at 350, `:212`), where the sheet declares
   3.0, 2.2, 1.5, 1.3, 1.4, 0.8, 1.6 and 2.8 s: six of eight are not whole frames at 24 fps, and the total, 14.6 s,
   is 350.4. The export makes it concrete: its length has to be 350 or 351, and nothing in the tree says which.
   → Declare each shot in frames (`df`; whether 2.2 s becomes 52 or 53 is an authoring decision per shot, not a
   fix), with `FPS` from `src/sheet.mjs:7` and `d = df/FPS` derived for whatever reads seconds; sum `STARTS_F` and
   `TOTAL_F` as integers; in the film, find the shot from the frame counter `step()` already keeps (`frameNo`,
   `:275`) against `STARTS_F`, and derive `T = frameNo/FPS` rather than accumulating it, in `buildTimeline()`
   too. Then the picture, the sound and the checks cut on the same frame by construction and no `1e-6` is needed.
   Two checks, written BEFORE the fix so their broken state is today's tree, in your shape
   `check({name, unit, measure, pass, calibrate, note})` (`harness/lib.mjs:18`):
   - `frame-grid` in `oq-kocha/test/checks-sheet.mjs`, next to `cut-sizes` (`:65`): off-grid shots,
     `SHOTS.filter(s=>Math.abs(s.d*FPS-Math.round(s.d*FPS))>1e-9).length`, pass at 0, widened with
     `Number.isInteger(TOTAL*FPS)`; today it measures 6; calibrate with a 2.2 s shot appended, which measures 7.
   - `cut-frames` in `oq-kocha/test/checks-render.mjs`, next to `occupancy/<shot>`: for each cut, ask the film,
     `__frameTo(F-1,16,12).shot` and `__frameTo(F,16,12).shot` with F the declared first frame, and count the cuts
     that are not where they are declared, pass at 0. Today, with F by the film's own ceil, it counts 1 (shot 1,
     declared at frame 72, drawn from 73). Calibrate with one declared start moved a frame, which counts one more.
     It asks the page, which is your own rule: "A check that recomputes what it is checking is checking its own
     arithmetic" (`mkfilm.py:392-395`).
   The other `STARTS` uses (`checks-render.mjs:98`, `checks-world.mjs:20,21,318`, `checks-style.mjs:29`) pick a
   frame inside a shot to sample. They keep working; those that add seconds (`STARTS[1]+0.6` is frame 86.4,
   `+0.4` is 81.6, `sh.d*0.5` of an odd frame count is a half) still round, which is harmless for a sample and can
   be written in frames in the same commit. → `oq-kocha/src/shots.mjs`, `oq-kocha/tools/mkfilm.py` (`shotAt`,
   `step`, `buildTimeline`), the two checks, then `sanoq.davomiyliklar` in the card as frame counts. → **S**.
   **whiteout, the same fault** [s4]: 13 shots in seconds (`whiteout.html:73-77`), `T+=DT` (`:991`), a `T>=S[j]`
   ceil (`:719`). Replayed, it reads 2.9999999999999978 s at frame 72, so shot 1 starts at 73; the other eleven
   cuts land on the first frame at or after their start; the declared 19.35 s is 464.4 frames. By your rule the
   shots are 72 48 44 38 14 11 4 3 2 27 48 58 96 = 465 frames. Six of them are not whole frames as written, and
   three are the impact, where a frame is a third of a shot (clash 0.17 s = 4.08, impactA 0.125 = 3, impactB
   0.085 = 2.04). whiteout's own scan lives in the page (`__scanAll`, `:1025`, which reads `shotNow()`), so it has
   no `f/FPS` twin to disagree with, but the export needs its length (`window.__total` is 19.35 s, `:1083`). → The same change as oq-kocha's, in the one file:
   `df` per shot, `STARTS_F`, `TOTAL_F`, `shotNow` by the frame, and a `window.__totalF` beside `__total` for the
   export. The clamp at the end becomes "the last frame is `TOTAL_F`−1". → **S**.

5. **Take the drawing from the film and the onset from the sound.** `speech-probe.ts` finds where speech starts and
   stops from the audio alone: a dBFS envelope in 10 ms windows, the floor at the 10th percentile, the threshold
   `min(floor + 12 dB, floor + 0.35 · (peak − floor))`, every sub-threshold gap of 250 ms or more reported
   (`cli/src/commands/speech-probe.ts:22,75,79,146-147`); the skill's rule is "transcript word boundaries are not
   cut points" (`.claude/skills/open-edit/CUT.md:18-19`) [s2]. Your footfall check
   (`oq-kocha/test/checks-audio.mjs:53-77`) compares two schedules: the step times come from `window.__timeline()`
   (`:69`), the list the synth is given, and the drawing is recomputed in Node from `SHOTS`, `STARTS` and `CYCLE`
   (`:59-63`), although `__frameTo` returns the drawing it drew as `idx` (`mkfilm.py:397-398`) [s4]. It passes at
   zero *drawings* from a contact; the contact drawing is held six frames, so a two-frame shift is in sync by design
   and the calibration shifts seven (`:70-76`) [s4]. A voice whose attack comes late, or a cut a frame late
   (item 4), passes. → Two changes, a check each: (a) the drawing from the film, `__frameTo(n,16,12).idx` at each
   step's frame (A's; add an `idxB` beside `idx` at `mkfilm.py:398` for B); (b) the onset from the rendered sound:
   an envelope and an onset finder in `oq-kocha/test/dsp.mjs` (the FFT and `rms` are there, `:2,23`), in 10 ms
   windows over a floor as `speech-probe` does, run on the PCM of `__renderAudio` (`mkfilm.py:354`) with only the
   step voices in it: today it mixes beds, steps, cloth, breath and metal into one buffer (`:358-368`), so
   `__renderAudio` needs an `only` option first, one line in its event loop. Each footstep's measured onset
   against its scheduled `t`, pass under half a frame (21 ms); broken state: the step voice delayed by two frames,
   which must measure about 83 ms. → `oq-kocha/test/checks-audio.mjs`, `oq-kocha/test/dsp.mjs`, two lines in
   `mkfilm.py`. → **M**.

6. **A delivery loudness pass, and a check on it.** `mux-audio.ts` lays sound on the silent render with
   `-c:v copy`, AAC 48 kHz, and ffmpeg's `loudnorm` at −14 LUFS integrated, −1 dBTP, loudness range ≤ 11 LU, in two
   passes: measure, then a linear gain when the peak and range allow it, dynamic otherwise, and no pass when
   nothing is measurable (`cli/src/commands/mux-audio.ts:87-113,172-173,206`) [s2]. Your audio checks hold
   headroom, a band above 400 Hz, flatness and roughness, and no integrated loudness
   (`oq-kocha/test/checks-audio.mjs:18-42`) [s4], which is the one number every platform normalises to. Before any
   of it, `oq-kocha/tools/render-audio.mjs` has to run on the runner: it launches Chrome at
   `/opt/pw-browsers/chromium-1194/…` (`:2`), opens `file:///home/claude/work/qalam-repo/build/oq-kocha.html`
   (`:7`), waits 900 ms (`:8`), renders a literal 14.6 s at 44,100 Hz (`:16`) and writes
   `/home/claude/work/forge/film.pcm` (`:24`): facts from the machine the film was made on, and in CI it stops at
   line 2 [s4]. `loyihalar/tools/katalog.mjs` has the same kind: a Chrome search in `/opt/pw-browsers` (`:11-13`)
   and a default output `/mnt/user-data/outputs/` (`:92`) [s4]. → Take `PAGE` and the Chrome finder from
   `oq-kocha/test/browser.mjs` (`:4,15,17`) for both, render `TOTAL_F/FPS` (item 4), write `build/film.pcm`, and
   bring the samples out of the page as base64 of the Float32Array rather than `Array.from` (`mkfilm.py:372`).
   Then, in the export, mux it (`-f f32le -ar 44100 -ac 1 -i build/film.pcm`, `-c:v copy -c:a aac -ar 48000`)
   through `loudnorm=I=-14:TP=-1:LRA=11` in two passes, and add `eksport/baland`, which reads
   `loudnorm=print_format=json` (or `ebur128`) back from the finished mp4: integrated within ±1 LU of −14, broken
   state a −6 dB gain. Only oq-kocha renders its sound offline (`mkfilm.py:354`); the four Canvas works play
   through a live AudioContext (`whiteout.html:900`, `bir-tomchi.html:932`, `mushuk.html:111`,
   `not-a-measurement.html:345`), and your own skill captures that in real time with MediaRecorder
   (`skills/media-audit-reality/SKILL.md:253`), which no hash can hold. So in the first artifact those four are
   silent, and each gets its sound with an `OfflineAudioContext` render of its own (an M each, and nothing Open
   Edit has; open question 7). → `oq-kocha/tools/render-audio.mjs`, `loyihalar/tools/katalog.mjs`, the mux in
   `loyihalar/tools/eksport.mjs`, the check in `loyihalar/test/eksport.mjs`. → **S** with ffmpeg.
   **After your report [s16]:** the half before the mux is done. `render-audio.mjs` runs from `browser.mjs`, waits
   for `__ready`, and refuses a file that is not 643125 samples; katalog writes to `loyihalar/build/`. So the mux can
   land with item 1. Two things from Open Edit's mux belong in it [s2]. The picture decides the length:
   `-t <the video stream's duration, from ffprobe>` and never `-shortest`, because "`-shortest` let a built mix
   truncate the film … and exited 0". And `-ar 48000` on the output, because "loudnorm works at 192 kHz and would
   otherwise hand the encoder 96 kHz" (`cli/src/commands/mux-audio.ts:67-71,89-91`). Your refusal guards the PCM;
   the mux can still change the length, so `eksport/baland` gets a twin, `eksport/uzunlik`: the mp4's audio stream
   duration against `TOTAL_F/FPS` (14.583 s), within one AAC frame (1024/48000 s, 21.3 ms). Calibrate with a PCM
   one film-frame short, muxed past the refusal, which must measure about 41.7 ms. At 48 kHz 350 frames are exactly
   700000 samples, so the only slack is the encoder's priming. **For whiteout, when its sound comes (open question
   7):** its sound draws from the picture's seeded stream. `nz()` and `steel()` call `rnd()` (`whiteout.html:910,
   941`), `restart()` reseeds and then, with sound on, schedules the whole score (`:1009-1010,965-973`), and
   `crunch()` fires from the foot mid-simulation (`:980-982`). So a viewer with sound on gets other spray and
   breath than the silent film the checks measure and the export writes [s4]. Your own comment in `draw()` names
   the hazard for the picture (`:724-726`). → A second generator for the sound, seeded apart. One line, S, and it
   comes before any offline render of whiteout's sound.

7. **A layer's span is measured from its pixels, not read from its declaration.** For the hand-off,
   `veed-project` renders each named page element alone with alpha and cuts it to its box; the span it gives the
   editor comes from `visibleSpans(frames: [{t, peak}], step, bridge)`: the frames where the layer's peak alpha is
   non-zero, short gaps bridged (`cli/src/veed/editor-project.ts:245-253`) [s2]. Your render modes split one frame
   into layers the same way (`__matFrame`, `__lineFrame`, `__depthFrame`, `__primFrame`, `mkfilm.py:378-383`) [s4],
   so "when is this on screen" can be answered from the material buffer per frame rather than from `STARTS`, and
   no check does that today. → For each shot, the first and last frame in which `CHARACTER(matOf(...))` covers
   more than the occupancy floor, against the declared span; broken state: one start moved a frame. It is the
   picture-side twin of item 4's `cut-frames`. → `oq-kocha/test/checks-render.mjs`, next to `occupancy/<shot>`
   (`:101-103`). → **S**.

8. **Wait for readiness, not for time.** *Done for oq-kocha and zarra in your working tree, as you report it
   [s16]. There were five sleeps, not four; the fifth is `zarra/test/olchov.mjs:24`, 300 ms. Both pages set
   `window.__ready` at the end of their script, and the harnesses wait for it on cards that have a hook; hookless
   cards keep their wall-clock schedule until item 10. You did not add the pins to `browser.mjs`, and the room
   agrees. A page that reads no clock and no `Math.random` gains nothing from them, and a seeded `Math.random` in
   the audit would pass a page that is random for its viewers. They move to item 10. If you want the promise held
   rather than stated, count instead of pin: an init script that wraps `Math.random`, `Date.now` and
   `performance.now` with counters, and a check that `__frameTo` calls none of them (0 for oq-kocha; calibrate with
   one `Math.random()` in `render()`, which counts per frame). Still open: the two works that wait for fonts,
   whiteout and not-a-measurement (`whiteout.html:1085-1087`, `not-a-measurement.html:496-500`), have no `__ready`
   yet, so `eksport/shrift` waits for them (item 1).* Before the first frame Open Edit's page runtime
   (`cli/src/render/page-runtime.ts`) waits for every font's load and `document.fonts.ready`, calls `decode()`, with
   a timeout, on every image not yet complete or broken (`:271-273`), and pins `Date.now`, `performance.now` and
   `Math.random` (a seeded generator) so a page cannot read the wall clock (`:35-49,322-323`) [s2]. Four of your
   harnesses wait by the clock instead: `oq-kocha/test/browser.mjs:33` 600 ms after load,
   `oq-kocha/tools/render-audio.mjs:8` 900 ms, `loyihalar/tools/olchov.mjs:101` 1400 ms, and
   `loyihalar/tools/katalog.mjs:20-22` 1400 ms, then `t*1000` ms for a card with no hook [s4]. A machine 1.7x slower
   (your own CI numbers, `checks-render.mjs:39-40`) turns a sleep into a race. Fonts are the sharper case for the
   export: whiteout and not-a-measurement wait for their faces before they start (`whiteout.html:1085-1087`,
   `not-a-measurement.html:496-500`) but start anyway on `.catch(start)`, so a runner that cannot reach the font
   host renders every frame in the fallback face, and `eksport/takror` still passes because both runs fall back the
   same way [s4]. → Replace the sleeps with an explicit ready signal from the page (a promise each work resolves
   when its programs are linked, buffers built and fonts loaded), add an `addInitScript` in `browser.mjs`'s `open()`
   that seeds `Math.random` and freezes `Date.now` and `performance.now`, and give the export one more check,
   `eksport/shrift`: every face the page asks for passes `document.fonts.check(…)` before frame 0; broken state:
   the font host blocked with `page.route`. → `oq-kocha/test/browser.mjs`, `oq-kocha/tools/render-audio.mjs`,
   `loyihalar/tools/olchov.mjs`, `loyihalar/tools/katalog.mjs`, the check in `loyihalar/test/eksport.mjs`. → **S**.

9. **A contact sheet with the refusal that keeps it honest.** `cli/src/sheet.ts` tiles stills with ffmpeg's
   `tile=CxR:padding=6:color=0x202020` (`:22`) and carries one guard worth copying: ffmpeg exits 0 and writes nothing
   when a seek lands past the last picture frame, so a missing tile would shorten the sheet while the index still
   promises every tile, and `assertTile` refuses instead of mislabelling (`:37,43`). `frames <video> --every 0.5
   --sheet` names each still `f<frame>-<sec>s.png`, the frame zero-padded to six, and writes a `frames.json` plan
   beside them (`cli/src/commands/frames.ts:149,174`) [s2]. A sheet is a look, not a measurement, but it is how an
   agent reads a whole film at once: this room read the announcement as 84 frames and six caption sheets [s3]. Your
   `katalog.mjs` already renders one still per card into the catalogue page (`:28,92`) [s4]. → One sheet per card
   of every shot's midpoint (you already compute them, `checks-render.mjs:98`), with the guard, from `katalog.mjs`,
   which has the browser open for exactly this; once the export exists, take it from the mp4 and put it in the
   artifact beside the film. → `loyihalar/tools/katalog.mjs`. → **S**.
   **Added 2026-10-01: a strip per cut.** A midpoint is the frame least likely to show a fault. Open Edit's
   deleted `cut-frames` was written after a run sampled five evenly spaced frames, "not one … within four tenths
   of a cut", and missed a layer that lagged for a few frames at each cut; it writes one sheet per cut, the last
   frame before it and the first few after (`--after 3`; `cli/src/commands/cut-frames.ts@dd7913b:3-16`) [s2]. Your cuts are
   declared, so no detection is needed: for each `STARTS_F[k]`, frames F−1, F, F+1, F+2 side by side, in the same
   sheet file as the midpoints. It is where a walk phase that jumps, or snow that restarts, would show. Same
   script, same guard. → **S**.

10. **A stepped clock for the works that run on the browser's.** Open Edit's page runtime replaces the page's
    clocks with one it advances itself, a frame at a time, and seeds `Math.random`
    (`cli/src/render/page-runtime.ts:35,42,49,92`) [s2]. bir-tomchi, mushuk and not-a-measurement advance their time
    by the `requestAnimationFrame` timestamp, `dt=Math.min(.05,(now-last)/1000)` (`bir-tomchi.html:1104`,
    `mushuk.html:514`, `not-a-measurement.html:451`), and bir-tomchi and mushuk size their canvas from
    `clientWidth × devicePixelRatio`, dpr capped at 2 (`bir-tomchi.html:1076-1079`, `mushuk.html:307-310`) [s4].
    not-a-measurement draws with unseeded `Math.random` (`:211`); bir-tomchi and mushuk draw their scenes from
    seeded generators (`bir-tomchi.html:57,94`, `mushuk.html:45`) and use `Math.random` only for the linen texture
    (`:1083`, `:314`) and for sound [s4]. None of the three can be exported by hash or measured by frame:
    `olchov.grab` samples a card without a hook by waiting `(k-prev)*1000` ms of wall time (`olchov.mjs:104`), so
    those cards' `olchov` numbers are whichever frame the runner had reached, and `loyihalar/test/run.mjs:76-77`
    records a calibration on a time-sampled work that came out 19,6 once and 5,4 the next time [s4].
    → An init script shared by the works, in `harness/`, given to `addInitScript` before `goto`:
    `performance.now` returns a counter, `requestAnimationFrame` queues its callbacks without firing them,
    `window.__tick()` adds 1000/24 ms to the counter and runs the queue once, and `Math.random` is a seeded generator
    (whiteout's `rnd()` at `whiteout.html:68` is the shape you already use). Those two clocks are the only ones the
    pictures read: `setTimeout` appears in bir-tomchi only in its sound code (`:444,447,554,555,625,748`) [s4].
    Frame k is then k ticks from the start, sequential like whiteout's `__step`; bir-tomchi can jump with its own
    `__seek` and one tick. `olchov` and `eksport` tick to the frame they want, and the cards of whiteout and the
    three name their hook, with `kadrlar` in frames as oq-kocha's already are. The proof that the script covers
    every clock a work reads is `eksport/takror` itself: a clock it missed makes two exports differ. The
    alternative is a `__frameTo` written into each work, your own idiom (oq-kocha, whiteout, zarra) and an M each;
    the init script is one file and leaves the works alone. The `olchov` numbers of those four cards move once when
    they stop being wall-clock samples; their `davolar` are re-set from the new measurement in the same commit. →
    `harness/`, `loyihalar/tools/olchov.mjs`, the four `kartalar/*.json`. → **S** for the clock, **S** for moving
    `olchov` onto it. Item 8's pins now live here [s16], and your objection to them applies here too.
    not-a-measurement draws with unseeded `Math.random` (`:211`), so under this script its export is one film out
    of the many its viewers see. `eksport/takror` then proves the script, not the work. Its card should say "under
    seed N". Or the work gets its own seeded generator, as bir-tomchi and mushuk have, and the pin is no longer
    needed for it.

## Not worth taking

- **The hand-off** (`veed-project`, `veed-pull`, the two bookmarklets, the plan's `source` half): it ends in VEED's
  hosted editor behind a VEED login [s2] and comes back as a new project with VEED's fonts and static crops (t026,
  c019 [s3]). Your films are code; there is no editor to hand them to.
- **The virtual clock beyond `requestAnimationFrame` and `performance.now`.** Open Edit also overrides timers,
  `Element.animate`, media elements and GSAP (`cli/src/render/page-runtime.ts:72-105,290-300`), which a page needs
  when it animates through CSS or a library [s2]. Your works draw on a canvas from a time variable; the three
  without a hook need only the two clocks of item 10.
- **Rational frame rates** (`cli/src/render/timing.ts:17`: `30000/1001` accepted, decimals refused) [s2]: oq-kocha
  and whiteout declare 24 (`src/sheet.mjs:7`, `whiteout.html:70`) and the others will tick at 24 after item 10 [s4].
- **All-intra proxies** (`cli/src/render/media.ts:13-16`: a `-g 1` copy of any source whose GOP exceeds 12
  frames, so a seek decodes one frame) [s2]: there is no footage in your works [s4].
- **Transcription, captions, `retime-transcript`, Fabric, fal, `background-removal`, `lipsync`, `stills`**
  (`cli/src/cli.ts:63-64,77-78`) [s2]: speech, presenters and licensed pictures; none in a film drawn by code.
- **The page server and the Chrome pin** (`cli/src/render/server.ts:165,180`, roots and tokens; `playwright-core`
  1.63.0 with its exact Headless Shell, `package.json:36`) [s2]: protection for a tool that serves strangers'
  pages. Your harness opens its own file; Playwright's Chromium in CI is enough, and its version line goes into
  the segment key of item 2 instead of being pinned.
- **HyperFrames' markup timeline** (`data-start`, `data-duration`, `data-track-index`, `window.__timelines`) [s9]:
  a manifest for DOM compositions. Yours draw pixels; the shot list and the exposure sheet are your manifest, and
  item 4 is what they lack.
- **`mix-audio`** (a spec of stems, `{durationSec, tracks[{path, atSec, gainDb, role, duck}]}`, turned into one
  ffmpeg filtergraph with `adelay`, `amix normalize=0` and ducking by `sidechaincompress`,
  `cli/src/commands/mix-audio.ts:19-38,96-122`) [s2]: oq-kocha synthesises its sound in the page as one buffer
  and the Canvas works play live, so there are no stems to mix. It is the answer to "mix sound from code" for
  the day a work has separate stems.
- **The measurement commands the video deleted** (`measure-placement`, `wcag-pass`, `safezone-check`,
  `check-delivery`, `gates`): gone from `main` on 2026-09-29, still in the history at `dd7913b`
  (`cli/src/cli.ts@dd7913b:87-97`) [s2]. Their headers were read on 2026-10-01 (`sources/s2/README.md`), their
  bodies not. Most judge text laid over footage (contrast, safe zones, empty areas for a caption) from the
  reports of VEED's engine; your films have no footage and no such engine. The one idea taken is `cut-frames`' strip per cut, in item 9 (open
  question 6).

## Open questions for the owner

1. Answered 2026-09-30 09:56: an mp4, as a CI artifact. Three things inside that answer are still yours. **When:**
   on every push to `main` (as sketched, after a 43 to 75 minute audit), or only when asked (`workflow_dispatch`
   alone)? Asked in the log at 10:04, not answered yet. **How long it lives:** `retention-days: 14` is a proposal;
   GitHub allows 1 to 90 [s14]. **At what size:** whiteout and not-a-measurement are authored at 1920×1080
   (`whiteout.html:58`, `not-a-measurement.html:80`), bir-tomchi and mushuk are square and take the window's size,
   oq-kocha renders at any size and its checks use 200×144 (`checks-render.mjs:6`) and 240×173
   (`checks-world.mjs:14`, `checks-style.mjs:24`), with 420×302 in `loyihalar/test/run.mjs:64` [s4]. What a frame
   of oq-kocha costs at 1920 wide in SwiftShader is unmeasured; a first run at 720×518, `olchov`'s default
   (`olchov.mjs:115`), would say. An `eksport: {w, h}` in each card would make the size a declared value like the
   rest.
2. Mostly answered by the developer [s16]: not by design. oq-kocha is now 350 whole frames, each cut on the first
   frame at or after its authored start. What is still the owner's: the o'tish/yolg'iz cut at 284 (as chosen, from
   11.8 s = 283.2) or at 283 (nearest), the only cut where the two rules differ. And the same rule for whiteout's
   13 shots (72 48 44 38 14 11 4 3 2 27 48 58 96 = 465, item 4), where the three impact shots are 4, 3 and 2 frames
   and the authored clash and impactB are 4.08 and 2.04. It unblocks whiteout's item 4.
3. Answered by the developer's change [s16]: `sanoq.mjs` counts `df` into `kadrJami`, and the card's total line is
   bound to it, so a shot one frame longer fails `karta/sanoq-bilan-mos`. What the question asked, as it was: the
   card's line "8 kadr, davomiyliklari 3 · 2,2 · … — jami 15,6 s" (`1-oq-kocha.json:30`) cites
   `jadvallar.SHOTS`, which is 8 (`:31,67`), and `karta.mjs` passes a number when it appears in the line
   (`karta.mjs:55-56`); "8 kadr" does, so neither the durations nor 15,6 is checked. The durations sum to 14,6
   (`:70-79`), `render-audio.mjs:16` renders 14.6, and the film is 350 or 351 frames (item 4). Which number is the
   film, and should the line's `dalil` be `davomiyliklar` and the total derived rather than typed? For a list
   `karta.mjs` accepts one member or its length (`:59-62`), so that alone would not check the sum. Item 4 done in
   frames closes most of it.
4. Answered by the file itself (the question was whether the footfall check reads the rendered PCM): it reads
   neither the rendered sound nor the drawn frame, both sides are schedules (`checks-audio.mjs:59-63,69`), which is
   item 5.
5. A cut list in an editor's format (OpenTimelineIO or FCPXML from `shots.mjs`, an M in `loyihalar/tools/`): any
   use for it, ever? If not, the room drops the idea for good.
6. Should the room read the deleted measurement commands at `dd7913b` for a second page? Narrowed 2026-10-01 by
   their headers (`sources/s2/README.md`): most measure text over footage and need VEED's engine, so a second page
   would be short. Two would be read in full if you say yes, because they need only frames:
   `measure-placement.ts` (motion, detail and skin chroma on a small grid, pure functions tested on synthetic
   frames) and `check-delivery.ts` (which source frame a delivered frame is, by the offset of the minimum
   difference) [s2].
7. The four Canvas works go into the first artifact silent (item 6): acceptable, or should the export wait until
   each has an offline sound render?
8. `zarra/` and `masofa-maydoni/` have frame hooks (`zarra.html:75`, `masofa-maydoni.html:888`) and no card in
   `loyihalar/kartalar/`, and neither the profile nor the cards name them. Do they belong in the export? zarra
   exports as oq-kocha does; masofa-maydoni's `__still` is to be read first.

---
*From room 2 of the Labs workshop (Open Edit). Edited there, never here: `labs rooms pull` brings the newest.*
