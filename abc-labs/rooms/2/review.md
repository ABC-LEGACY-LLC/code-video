# Review of room 2, 2026-09-30

The first review. It covers `verdict.md` (as of 06:16) and `for/code-video.md` (as of 12:03), claim by claim, against what each cites:

- **The video [s3]:** the frames, crops, caption sheets and transcript under `work/source/`, looked at again.
- **open-edit [s2]:** read at `7f212e04` and at the commit before it, `dd7913b`.
- **code-video [s4]:** read at `ff977c2`.
- **The web:** the GitHub API, the npm registry, polyformproject.org, VEED's newsroom page and the licences of HyperFrames, Remotion, Revideo, Motion Canvas and editly, all fetched in the room's container today.

The three repositories were taken as tarballs from codeload.github.com into `work/review/`, which is gitignored and holds verbatim copies to reuse. Nothing in them was run. Paths are open-edit's where they start with `cli/`, `SETUP.md`, `NOTICE` or `.github/README.md`; `@dd7913b` marks the older commit. Other paths are code-video's.

✅ holds · ❌ does not (what is true instead) · ⚠ could not check (why). A ✅ followed by a correction holds in substance; the correction should still go into the page.

| # | claim | where it points | |
|---|---|---|---|
| **verdict.md** | | | |
| v1 | "Opus 5.5 videos": clips Claude made by writing one HTML page; the model's name is only in the header | c001–c007, t004, t026 [s3] | ✅ c007: "made by Claude with OpenEdit · youtube-to-instagram-ig.mp4" beside `<!doctype html>`; "Claude Opus 5.5" appears only in the header band |
| v2 | "editable": the clip opens in VEED's web editor, signed in, one timeline item per element | c012–t024 [s3] | ✅ t010: `veed.io/edit/a5d8cf61-…`, "8,012,633 credits left"; items in t018–t020 and t034 |
| v3 | "turns videos into editable browser projects" is not shown | the frames, the speech [s3] | ✅ no frame recovers layers from an mp4; `speech/transcript.txt` never says it |
| v4 | the video shows `openedit veed-project veed-plan.json`, `veed-pull` and two bookmarks | c012, t025, t028 [s3] | ✅ c012 and `crops/browser-10.0`; `term-28.5-L` shows `veed-pull`; `addr-10.6` shows "OpenEdit to VEED" and "Send to Claude" |
| v5 | on 2026-09-29 neither command existed; the last push was 2026-09-22, six days before the post; npm latest was 0.2.0, pushed the same day | GitHub API, npm (neither registered) | ✅ `cli/src/cli.ts@dd7913b` has neither; dd7913b is dated 2026-09-22T13:06Z; 0.2.0 was published 2026-09-22T12:19Z; the post is from 2026-09-28T17:42Z |
| v6 | "Weave engine, gone" against `install-engine` still present, the skill's "rendered by VEED's engine", and engine 0.12.0 out on 2026-09-24 | t039–t042; weave releases (not registered) | ✅ `cli.ts@dd7913b:82`, `SKILL.md@dd7913b:3`; the releases API gives weave-v0.12.0 at 2026-09-24T08:22Z |
| v7 | SKILL.md "109 lines, was 1,159" (t046) against 24,740 bytes | t046 [s3], [s2] | ✅ `crops/skill-after-46.5`; `wc -c` gives 24740 at dd7913b |
| v8 | "86,000 lines" deleted; the list is of the private source; `internal/` and `tests/` were never public | t036–t038 [s3], [s2] | ✅ t038: "-85,989 lines of code, deleted"; neither commit has a top-level `internal/` or `tests/`. "Never" was checked at these two commits only, and the list also names public paths (`cli/tests/…`, `refs/html/…`) |
| v9 | t026: the VEED project is "simpler than the MP4" (VEED's fonts, static crops, no loudness pass), took 1 h 28 min and cost "a few dollars" through fal plus VEED credits | t026 [s3] | ✅ `crops/term-26.2-L/R`, verbatim ("Cogitated for 1h 28m 14s") |
| v10 | the edited clip comes back as a new project with another id | c019 [s3] | ✅ `crops/addr-32.5`: `2ef1068c-…`, not `a5d8cf61-…`; the transport reads 26.6 s, not 26.1 s |
| v11 | "your edits · kept" is shown on two title items | c020 [s3] | ✅ t034 |
| v12 | the pipeline, CLI and skill are Apache-2.0 | [s2] | ✅ `LICENSE`, `NOTICE:6`, both commits |
| v13 | the renderer is PolyForm Shield 1.0.0: any use except "providing any product that competes with the software" | polyformproject.org (not registered) | ❌ the quote is cut short. The licence goes on: "…or any product the licensor or any of its affiliates provides using the software". The exclusion is wider than the page says |
| v14 | the renderer: macOS arm64 and Windows x64 only, needs a desktop session, runs outside any sandbox | [s2]@dd7913b | ✅ `SETUP.md@dd7913b:29`, `:64`; the release assets are those two builds only |
| v15 | VEED transcription and AI presenters need a VEED account and credits; WhisperX is the free local alternative | [s2]@dd7913b | ✅ `SETUP.md@dd7913b:46-51`, `NOTICE@dd7913b:35-36` |
| v16 | free: installing, rendering, WhisperX, selling what one makes; paid: generation and VEED credits | VEED newsroom (not registered) | ✅ "free to use: no subscription, no paywalls"; "Generating anything spends credits"; "sell what you make … at no cost to VEED" (that sentence is about the renderer's output) |
| v17 | "the VEED editor's paid plans (checked again 13:40 UTC)" | `sources.md:98-101` | ⚠ by its own account second-hand: veed.io/pricing gave nothing to a fetch, and the figures come from four third-party sites. Not registered |
| v18 | HyperFrames: HeyGen, Apache-2.0, 54,009 stars | GitHub (not registered) | ✅ heygen-com, Apache-2.0; 54,384 stars today (54,009 was the count on 2026-09-29) |
| v19 | Remotion needs a paid licence above a company size; Revideo and Motion Canvas are MIT; editly is MIT | GitHub (not registered) | ✅ Remotion `LICENSE.md:21,43` (free up to 3 employees); the other three are MIT. editly calls itself a "declarative NLE" |
| v20 | no other tool is known to hand a finished piece to an editor as layers | none | ⚠ the page says itself that this was not checked in depth |
| v21 | "the composition names every element with a kind, a track and a time (t012)" | t012 [s3] | ❌ t012 shows seven labels, each a name and a kind ("caption · native text", "music · audio"). No track or time is on screen. The plan at 7f212e04 is what carries time and track (`at`/`to`, `z`, `name` in `cli/src/veed/editor-project.ts`); cite that, [s2] |
| v22 | "Do not build … not published … its open half exists elsewhere under better terms"; "on the user's own Mac or Windows desktop"; "It cannot run at Labs: … no Linux build … a desktop session" | lines 7-9, 13-15, 45-53, 69-73 | ❌ true of dd7913b, false of 7f212e04 (`SETUP.md:25` "macOS, Linux or Windows"). The page's own 2026-09-30 section retracts it, but the headline and three sections still say it in the present tense, so a reader who stops at the top gets the retracted verdict |
| v23 | Not known: what `veed-plan.json` and the 269 KB JSON contain | line 93 | ❌ out of date: the same page's 2026-09-30 section answers it (the plan's `parts`; the pulled file's `{project, timeline, subtitles, assets}`). The size holds: `term-28.5-L` shows 269284 bytes |
| v24 | "the project hand-off used none" of the credits, on an account holding eight million | t026, t010 [s3] | ✅ `term-26.2-R`; t010 "8,012,633 credits left" |
| v25 | the narration is the captions word for word, never says "open source", and sums up with "one VEED login runs it all" | `speech/`, `captions/` [s3] | ✅ no match for "open source" in `transcript.txt`; the sentence is at 48.7–50.5 s |
| v26 | 7f212e04, "Mirror from veed-llm-editor (#27)", 2026-09-29 16:29 UTC; npm 0.3.0 at 17:00 | GitHub API, npm | ✅ 16:29:24Z; 17:00:09Z |
| v27 | the engine and PolyForm are gone; `NOTICE` names Apache-2.0, two fonts and VEED's hosted services | [s2] | ✅ `cli/src/cli.ts:45-83`; `NOTICE:6,10-11,24`; no PolyForm anywhere in the tree |
| v28 | `render.ts` is 38 KB; Headless Shell through playwright-core 1.63.0; virtual clock; PNGs over the DevTools protocol; 2 s segments under `<out>.render/`; re-renders only `--from/--to` | [s2] | ✅ 38,641 bytes; `render.ts:1,3,418,653`; `render/session.ts:392`; `package.json:36`. A patch also re-renders segments missing from the cache (`render.ts:76-77`) |
| v29 | `SETUP.md`: macOS, Linux or Windows, Node ≥ 20.18.1 | [s2] | ✅ `SETUP.md:25` |
| v30 | twenty-three render tests, among them two renders identical by hash and three workers writing the same bytes as one | [s2] | ✅ 23 `test(` in `cli/tests/render.test.ts` (`render-units` and `render-range` not counted); framemd5 at `:151,198,239`. They skip without Headless Shell (`:17-20`) |
| v31 | the plan's `parts` are of kind video, image, audio, text, layer, edl, mix, captions | [s2] | ✅ `cli/src/veed/editor-project.ts:140` |
| v32 | "each with `at`/`to` …, `in`/`out` in the source, a `box {x, y, w, h}`, `z`, `name`" | [s2] | ❌ the fields differ by kind. Only video and audio take `in`/`out` (`editor-project.ts:44-45,101-102`). `box` is optional on video and required on image. A layer's `at`/`to` are optional page time, placed on the project timeline by `shift` (`:55-61`). edl, mix and captions do not extend `Timed` (`:109-128`): edl has an optional `at` and `z`, captions a `z`, mix neither, and none of the three has a `name` |
| v33 | a `layer` is a selector rendered alone with alpha, cut to its box, its span from peak alpha (`visibleSpans`) | [s2] | ✅ `editor-project.ts:250-253` |
| v34 | `--local` renders and cuts without uploading; the pull returns `{project, timeline[], subtitles[], assets[]}`, writes `plan.json` and prints what it left out | [s2] | ✅ `veed-project.ts:179-182`; `veed-pull.ts:26-33,105-109` |
| v35 | neither command spends credits; both need the VEED login | `VEED.md` [s2] | ✅ `VEED.md:4`. Correction: `veed-project --local` needs no login (`veed-project.ts:179-188`), and `veed-pull` reads a file the bookmark saved from a signed-in VEED tab rather than logging in itself |
| v36 | SKILL.md is 7,375 bytes, beside CUT, FABRIC, TRANSCRIPTION and VEED; DESIGN, GENERATION and STYLE are gone | [s2] | ✅ `wc -c`. FABRIC.md and VEED.md are new files |
| v37 | 13 commands deleted, with the `.wv` templates, `docs/FLOW.md` and `refs/` | [s2] | ✅ all 13 are in `cli.ts@dd7913b`, none in `cli.ts`; no `.wv`, no `refs/`, no FLOW.md |
| v38 | "Still there: … `fonts` …" | [s2] | ❌ `fonts` is new in 7f212e04 (`cli.ts:73`); dd7913b has no such command. The other eight were there before |
| v39 | "The GitHub-facing README adds one money fact: VEED's free tier 'covers ~10 minutes monthly'" | [s2] | ❌ nothing was added: `.github/README.md:48` is the same at both commits ("the free tier covers about ten minutes a month"), and `SETUP.md@dd7913b:46` says it too. The quoted words are not the README's |
| v40 | the hand-off's plan requirement is written nowhere | [s2] | ✅ the only line is `veed-project.ts:195`: "A hand-off spends no VEED credits; the workspace only holds the project." |
| v41 | the open half is now on HyperFrames' terms, "and has the measured cut and sound tools that HyperFrames does not" | [s2]; HyperFrames | ⚠ both are Apache-2.0 (✅). HyperFrames' tools were never read (`sources.md:133-135`, "Not read further"), so "does not" is unchecked |
| v42 | `veed-pull` reads VEED's project, not a video; no command recovers layers from an mp4 | [s2] | ✅ `veed-pull.ts:19`; the command list |
| v43 | "`for/code-video.md` takes nine mechanisms" | the page | ❌ out of date: it lists ten |
| v44 | the page cites its sources as `[s<k>]` | rooms/CLAUDE.md | ❌ not one `[s<k>]` in verdict.md. It also rests on sources never registered: npm, veedstudio/weave-renderer-public-releases, polyformproject.org, VEED's newsroom, tools and third-party price pages, HyperFrames, Remotion, Revideo, Motion Canvas, editly and emergent.sh |
| **for/code-video.md** | | | |
| f1 | written against 7f212e04 (npm 0.3.0) and ff977c2; neither had moved by 10:00 | `sources/index.json` | ✅ `lastHead` for both, checked at 09:59:54Z |
| f2 | "What this is" | [s2] | ✅ |
| f3 | the profile's rule: rendered video and audio are never stored | `workspace/projects/code-video.md` | ✅ `:16-17` |
| f4 | `audit.yml` has jobs `oq-kocha` and `loyihalar`, and no `workflow_dispatch` | [s4] | ✅ `.github/workflows/audit.yml:2,4,14` |
| f5 | 43 and 75 minutes, in the comment above `street-cost` | [s4] | ✅ `oq-kocha/test/checks-render.mjs:37-39` |
| f6 | the root `.gitignore` holds `build/` | [s4] | ✅ `.gitignore:2` |
| f7 | the suites report through `harness/lib.mjs`; `belgi()` at `:51` makes a public annotation | [s4] | ✅ `::error` or `::notice`, only under GITHUB_ACTIONS (`:58-61`) |
| f8 | encode: libx264, veryfast, CRF 15, yuv420p, BT.709, `+faststart`; segments joined by concat and stream copy | `cli/src/render/encode.ts` [s2] | ✅ `:18-26`, `:114`. `+faststart` is on the join, not on each segment |
| f9 | "x264's thread count is pinned to 4 so the output does not depend on the machine, and the test suite asserts it" | [s2] | ❌ the pin is real (`encode.ts:26`), but the code's reason is the worker count: "the same page gives the same bytes whatever --workers was" (`:11-13`). No test mentions threads |
| f10 | the tests "two renders of one page are identical frame for frame", by sha256 of the files, and "three workers write the same bytes as one" | `cli/tests/render.test.ts` [s2] | ❌ the comparison is ffmpeg framemd5 of the decoded frames (`:54-56,239`), not sha256 of the files; sha256 appears only in the blank-patch test (`:400-408`). "three workers…" is an assertion message (`:151,198`), not a test title. So Open Edit proves the frames identical, not the files; `eksport/takror` by sha256 of the mp4 claims more than what it borrows from |
| f11 | oq-kocha: `__frameTo(n,w,h)` at `mkfilm.py:387`; `readPixels` returns the bottom row first | [s4] | ✅ also `checks-world.mjs:18`. It too restarts from T=0 on each call (`mkfilm.py:388-390`), which costs little |
| f12 | whiteout: 1920×1080, seeded at `:67-69`, `__frameTo` restarting at `:1061` (O(n²), as its comment says), `__rewind`/`__step` at `:1081-1082` | `whiteout/whiteout.html` [s4] | ✅ `:58`, `:67-69`, `:1022-1023`, `:1061`, `:1081-1082` |
| f13 | whiteout's card names no hook, so `olchov` samples it by the wall clock | [s4] | ✅ `kartalar/2-whiteout.json`; `olchov.mjs:104` |
| f14 | bir-tomchi, mushuk and not-a-measurement "have no frame hook at all" | [s4] | ❌ bir-tomchi has `window.__seek=s=>{T=s%TOTAL;}` and `__total` (`bir-tomchi/bir-tomchi.html:1135-1136`). They set the clock without drawing, and the next frame adds `dt`. mushuk and not-a-measurement have none. Item 10 can drive bir-tomchi through `__seek` |
| f15 | "Nothing in the repository writes a picture file" | [s4] | ❌ `loyihalar/tools/katalog.mjs` renders one JPEG still per card (`:28`) into `uslublar-katalogi.html` (`:92`); no video is written anywhere. The same script has the faults items 6 and 8 name: a default output path from another machine (`/mnt/user-data/outputs/`, `:92`) and clock waits (`:20-22`). It is where item 9's sheet naturally belongs |
| f16 | `bir-tomchi.html:1139` carries `__tapAudio`, "lets the video export record exactly what the page plays" | [s4] | ✅ the comment is at `:1138`, the function at `:1139` |
| f17 | `tayyorla` is in `karta.mjs`, and `kadr/qurish-zanjiri` builds with it | [s4] | ✅ `karta.mjs:33`; `loyihalar/test/run.mjs:46-48` |
| f18 | `pixels()` returns `Array.from(px)` at `browser.mjs:49` | [s4] | ✅ |
| f19 | a 1920×1080 RGBA frame is 8.3 MB, and 11 MB as base64 | arithmetic | ✅ 8,294,400 B; ×4/3 = 11.06 MB |
| f20 | `countFrames` uses ffprobe `-count_packets` | [s2] | ✅ `encode.ts:119-120` |
| f21 | `manifest.json` `params`; one `seg-NNNNN.mp4` per 2 s; refuses "cached render was made differently"; the patch test | [s2] | ✅ `render.ts:422-436,653`; `render.test.ts:322`, whose title starts "render: " |
| f22 | `SHOTS` in oq-kocha and whiteout; `CUTS` in not-a-measurement | [s4] | ✅ `oq-kocha/src/shots.mjs:4`, `whiteout.html:73`, `not-a-measurement.html:87` |
| f23 | bir-tomchi's scenes overlap by 1.35 s | [s4] | ✅ `bir-tomchi.html:877-878` |
| f24 | the cards list their sources in `manba` | [s4] | ✅ all five; `karta.mjs:17` |
| f25 | `png.ts` answers `uniform` and `maxAlpha`; the render fails when "every re-rendered frame is one flat colour"; `drawn` per segment | [s2] | ✅ `png.ts:8,10`; `render.ts:542-554`. Corrections: the field is `alphaMax`, and that message belongs to patch mode; a full render says "every rendered frame is…" |
| f26 | `kadrlar: [36, 300, 136]`, and olchov measures those three | [s4] | ✅ `kartalar/1-oq-kocha.json:17-22` |
| f27 | `cli/src/edl.ts` snaps with `Math.ceil(t * fps - 1e-6) / fps`, refuses rates that differ by more than 1e-6, trims video half a frame early and audio on the instant; `retime-transcript` follows the same ranges | [s2] | ✅ the snap is at `edl.ts:106`, the retiming at `retime-transcript.ts:165-168`. The rate refusal and the trims are in `cli/src/commands/apply-edl.ts` (`:177`, `:39-41`, `:68-74`), not in `edl.ts` |
| f28 | `d` in decimal seconds, accumulated by `STARTS`; `Math.round((STARTS[i]+sh.d*0.5)*FPS)` in `checks-render.mjs` | [s4] | ✅ `shots.mjs:5-29`; `checks-render.mjs:98` |
| f29 | six of eight durations are off the grid (2.2, 1.3, 1.4, 0.8, 1.6, 2.8); 14.6 s is 350.4 frames | [s4] | ✅ recomputed; the other two, 3.0 and 1.5 s, are 72 and 36 frames |
| f30 | `mkfilm.py:212` uses `Math.round(TOTAL*FPS)`, which is 350 | [s4] | ✅ |
| f31 | "your footfall check passes only at an error of zero frames" | [s4] | ❌ it passes at zero *drawings* from a contact (`checks-audio.mjs:70-72`, unit "drawings away from a contact"). The contact drawing is held six frames, so "a two-frame shift is still in sync" by design (`:73-75`), and the calibration shifts seven. The half-frame argument does not stand on this check; item 4 still stands on the export and the sound timeline |
| f32 | `FPS` is at `src/sheet.mjs:7` | [s4] | ✅ |
| f33 | a check `cut-sizes` exists; checks have the shape `check({name, unit, measure, pass, calibrate, note})` | [s4] | ✅ `checks-sheet.mjs:65`; `harness/lib.mjs:18` |
| f34 | the proposed check measures 6 today and calibrates 7 | arithmetic | ✅ |
| f35 | the four sites `checks-render.mjs:98`, `checks-world.mjs:20`, `checks-style.mjs:29`, `checks-audio.mjs:56` "keep working and become exact" | [s4] | ❌ three corrections. `checks-audio.mjs:56` rounds a step event's time (`e.t+shiftFrames/FPS`), not `STARTS`. Two `STARTS` sites are missed (`checks-world.mjs:21`, `:318`). And not every site becomes exact: offsets in seconds stay off the grid (`STARTS[1]+0.6` is 86.4 frames at `checks-world.mjs:21` and `checks-style.mjs:29`; `+0.4` at `:318`), and `sh.d*0.5` of an odd frame count is half a frame |
| f36 | speech-probe: 10 ms windows, a floor at the 10th percentile, `min(floor+12, floor+0.35·(peak−floor))`, gaps of 250 ms; "transcript word boundaries are not cut points" | [s2] | ✅ `speech-probe.ts:22,75,79,146-147`; the rule is at `.claude/skills/open-edit/CUT.md:18-19` |
| f37 | the footfall check compares "the drawn contact frame" with `step` events from `window.__timeline()` | [s4] | ❌ half right. The step times do come from the schedule (`checks-audio.mjs:69`). But the other side is not the drawn frame: the drawing index is recomputed in Node from `SHOTS`, `STARTS` and `CYCLE` (`:59-63`). Both sides are schedules, which makes item 5's case stronger than written, and the file answers open question 4 |
| f38 | `dsp.mjs` has an FFT and `rms`; `__renderAudio` returns PCM | [s4] | ✅ `dsp.mjs:2,23`; `mkfilm.py:355,372` |
| f39 | mux-audio: `-c:v copy`, AAC 48 kHz, loudnorm −14/−1/11 in two passes, linear or dynamic, skipped when nothing is measurable | [s2] | ✅ `mux-audio.ts:87-113,172-173,206` |
| f40 | the audio checks test headroom, the band above 400 Hz, flatness and roughness, and no integrated loudness | [s4] | ✅ `checks-audio.mjs:18-42`; no LUFS anywhere |
| f41 | `render-audio.mjs`: lines 2, 7, 8 (900 ms), 16 and 24 carry four facts from another machine | [s4] | ✅ verbatim |
| f42 | `PAGE` and a Chrome finder are in `browser.mjs` | [s4] | ✅ `:4,15,17` |
| f43 | only oq-kocha renders offline (`mkfilm.py:354`); the four Canvas works play live; MediaRecorder at `SKILL.md:253` | [s4] | ✅ live contexts at `whiteout.html:900`, `bir-tomchi.html:932`, `mushuk.html:111`, `not-a-measurement.html:345` |
| f44 | `visibleSpans(frames: [{t, peak}], step, bridge)` | [s2] | ✅ `editor-project.ts:250` |
| f45 | the render modes `__matFrame`, `__lineFrame`, `__depthFrame` and `__primFrame`, `CHARACTER(matOf(…))` and `occupancy/<shot>` | [s4] | ✅ `mkfilm.py:378-383`; `checks-render.mjs:101-103`. `checks-world.mjs` does not measure a span, so the page's "if it already does, skip" can go |
| f46 | page-runtime loads every font, then `document.fonts.ready`, calls `decode()` on every image with a timeout, and pins `Date.now`, `performance.now` and `Math.random` | [s2] | ✅ `page-runtime.ts:35-49,322-323`. Correction: `decode()` runs only on images not yet complete or broken (`:271-273`) |
| f47 | the sleeps: `browser.mjs:33` (600 ms), `render-audio.mjs:8` (900 ms), `olchov.mjs:101` (1400 ms) | [s4] | ✅ and a fourth the page misses: `katalog.mjs:20-22` (1400 ms, then t×1000) |
| f48 | "1.7x slower (your own CI numbers)" | [s4] | ✅ 75/43 = 1.74; the repository itself says "1.7x" (`checks-render.mjs:39-40`) |
| f49 | the font waits at `whiteout.html:1085-1087` and `not-a-measurement.html:496-499` start anyway on `.catch(start)` | [s4] | ✅ not-a-measurement's `.catch(start)` is on `:500` |
| f50 | `sheet.ts`: `tile=CxR:padding=6:color=0x202020` and `assertTile`; `frames --every 0.5 --sheet` writes `f<frame>-<sec>s.png` and `frames.json` | [s2] | ✅ `sheet.ts:22,37,43`; `frames.ts:149,174` (the frame number is zero-padded to six) |
| f51 | "this room read 84 of them" | [s3] | ✅ 84 frames (60 + 24). They were frames, not sheets; the six caption sheets came on top |
| f52 | `grab` already has the frames; the midpoints are computed for `occupancy/` | [s4] | ✅ `olchov.mjs:96`; `checks-render.mjs:98` |
| f53 | the page runtime advances its own clock and seeds `Math.random` | [s2] | ✅ `page-runtime.ts:35,42,49,92` |
| f54 | `dt=Math.min(.05,(now-last)/1000)` at `bir-tomchi.html:1104`, `mushuk.html:514`, and in not-a-measurement's `frame()` at 450 | [s4] | ✅ not-a-measurement's `dt` line is `:451` |
| f55 | the three "draw with unseeded `Math.random`" | [s4] | ✅ correction: not-a-measurement draws with it (`:211`), but bir-tomchi and mushuk draw their scenes from seeded generators (`bir-tomchi.html:57,94`; `mushuk.html:45`). They use `Math.random` only for the linen texture (`:1083`, `:314`) and for sound. The conclusion holds |
| f56 | the canvas is sized from `clientWidth × devicePixelRatio` | [s4] | ✅ `bir-tomchi.html:1076-1079`, `mushuk.html:307-310`; dpr is capped at 2 |
| f57 | `olchov.grab` waits `(k-prev)*1000` ms at `:104` | [s4] | ✅ |
| f58 | `run.mjs:76-77`: a calibration of 19,6 once and 5,4 the next time | [s4] | ✅ "beqaror edi -- 19,6 va 5,4" |
| f59 | whiteout's `rnd()` is at `:68` | [s4] | ✅ |
| f60 | bir-tomchi's `setTimeout` is only in sound code, at 444, 447, 554, 555, 625 and 748 | [s4] | ✅ all six are in `acc:` sound handlers |
| f61 | oq-kocha's `kadrlar` are frames | [s4] | ✅ `"hook": "__frameTo"`; the other four cards give seconds |
| f62 | the hand-off ends behind a VEED login and returns a new, simplified project | [s2], t026, c019 [s3] | ✅ |
| f63 | the virtual clock also overrides timers, `Element.animate`, media and GSAP | [s2] | ✅ `page-runtime.ts:72-105,290-300` |
| f64 | rational rates: `timing.ts` accepts `30000/1001` and refuses decimals; "you are at 24" | [s2], [s4] | ✅ `timing.ts:17`. Only oq-kocha and whiteout declare 24 (`sheet.mjs:7`, `whiteout.html:70`); the other three run at the rate of `requestAnimationFrame` |
| f65 | `media.ts` makes a `-g 1` copy when the GOP is over 12; there is no footage in the works | [s2], [s4] | ✅ `media.ts:13-16`, `render.ts:227`; no video or image input anywhere |
| f66 | background-removal, lipsync, stills, Fabric and fal exist | [s2] | ✅ `cli.ts:63-64,77-78`, `cli/src/veed/fabric.ts` |
| f67 | `server.ts` has roots and tokens; playwright-core is 1.63.0 with its exact Headless Shell | [s2] | ✅ `server.ts:165,180`; `browser.ts:20`; `package.json:36` |
| f68 | HyperFrames' `data-start`, `data-duration`, `data-track-index`, `window.__timelines` | HyperFrames README (not registered) | ✅ `README.md:221-249` |
| f69 | the measurement commands are in the history at dd7913b | [s2] | ✅ `cli.ts@dd7913b:87-97` |
| f70 | Q1: whiteout and not-a-measurement are 1920×1080, bir-tomchi and mushuk are square, olchov defaults to 720×518, and oq-kocha's checks use 240×173 to 420×302 | [s4] | ❌ in part. The rest holds (`whiteout.html:58`, `not-a-measurement.html:80`, `olchov.mjs:115`), but oq-kocha's own checks run from 200×144 (`checks-render.mjs:6`) to 240×173; 420×302 is `loyihalar/test/run.mjs:64` |
| f71 | Q3: the card's text says 15,6 s, the durations sum to 14,6, render-audio renders 14.6, and mkfilm rounds to 350 | [s4] | ✅ `1-oq-kocha.json:30,70-79` |
| f72 | Q3: "`karta.verify` proves the listed values appear in the text, not the sum" | [s4] | ❌ that line's `dalil` is `jadvallar.SHOTS`, which the counter sets to 8 (`1-oq-kocha.json:31,67`). A number passes when it appears in the text (`karta.mjs:55-56`), and "8 kadr" does. Neither the durations nor 15,6 are checked. For a list, one member or its length is enough (`:59-62`) |
| f73 | the page cites its sources as `[s<k>]` | rooms/CLAUDE.md | ✅ every item cites [s2], [s3] or [s4]. The GitHub Actions details (`restore-keys`, the `upload-artifact` inputs) cite nothing and rest on general knowledge |
| **the room** | | | |
| r1 | what is extracted from a source lives in `sources/<id>/` | rooms/CLAUDE.md | ❌ `sources/` holds only `index.json`. The extracts are in `work/source/` (frames.md, sources.md, crops/, speech/), which s3's note says; the reads of s2 and s4 have no folder |

96 of 118 claims hold.

## Not claims, but seen while checking

- `work/source/sources.md:62-64`: "Nine releases from weave-v0.8.1". The releases list holds 23, from weave-v0.4.1, and weave-v0.13.0 came out on 2026-09-29 at 11:58 UTC, the day after the post that calls the engine gone.
- `sources.md:82`: "Neither page mentions … Chrome". The newsroom page says "…through Chrome instead." today; it may have changed since 2026-09-29.
- `sources.md:28`: the commits are not every one a mirror. The first two are "Initial commit" and "Add CODEOWNERS file".
- `sources.md:30`: the top-level listing leaves out `veed/`, `tsconfig.json`, `tsconfig.content.json` and `.gitignore`.
- code-video holds two works that neither the page nor the profile names, and neither has a card: `zarra/` (`zarra.html:75` `window.__frameTo=kadr`, with its own test suite) and `masofa-maydoni/` (`window.__still`, `:888`). The page's "the five works" means the five that have cards.
