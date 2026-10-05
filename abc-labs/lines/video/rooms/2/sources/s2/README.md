# s2 — veedstudio/open-edit, what was taken from it

Read at two commits, nothing run:

- `7f212e04` (7f212e0484a01d976fb3e68d4adc9f6373c19346), "Mirror from veed-llm-editor (#27)", 2026-09-29 16:29:24 UTC:
  the state the pages describe.
- `dd7913b`, 2026-09-22 13:06 UTC: the state on the day of the first verdict (engine, PolyForm, no hand-off).

Verbatim copies (tarballs from codeload.github.com, taken 2026-09-30 10:12 UTC by the reviewer) are in
`work/review/oe-7f212e04/` and `work/review/oe-dd7913b/`, gitignored; search them with
`labs room run 2 -- grep -rn … work/review/oe-7f212e04`. How the repository was read on 2026-09-29 and on the
morning of 2026-09-30 (GitHub API, raw files) is in `work/source/sources.md`.

## Lines the pages rest on (at 7f212e04 unless marked)

| what | where |
|---|---|
| "**macOS, Linux or Windows** and **Node 20.18.1 or newer**" | `SETUP.md:25` |
| macOS arm64 or Windows x64 only; "run the render step OUTSIDE any sandbox" | `SETUP.md@dd7913b:29,64` |
| "the free tier covers about ten minutes a month" (VEED transcription), the same at both commits | `.github/README.md:48`; also `SETUP.md@dd7913b:46` |
| "Licensed under the Apache License, Version 2.0"; the VEED-hosted features need a VEED account and spend its credits | `NOTICE:6`, `NOTICE:24-29` |
| "Neither command spends VEED credits or anything on the user's fal account." | `.claude/skills/open-edit/VEED.md:4` |
| "A hand-off spends no VEED credits; the workspace only holds the project." | `cli/src/commands/veed-project.ts:195` |
| `--local`: layers cut, "nothing was uploaded", before any login | `cli/src/commands/veed-project.ts:179-184`, login from `:187-188` |
| `veed-pull` reads the file the "Send to Claude" bookmark saved; `{project, timeline, subtitles, assets}`; subtitle tracks printed as "not in the plan" | `cli/src/commands/veed-pull.ts:19,26-33,105-109` |
| plan parts: `Timed` = `at`, optional `z`, optional `name`; video/audio take `in`/`out`; image requires `box`, video's is optional; a layer's `at`/`to` are page time, placed by `shift`; edl/mix/captions do not extend `Timed` | `cli/src/veed/editor-project.ts:16-27,40-128,140` |
| `visibleSpans(frames: {t, peak}[], step, bridge)` | `cli/src/veed/editor-project.ts:250` |
| x264 threads fixed at 4 "whatever --workers was" | `cli/src/render/encode.ts:11-13,26` |
| determinism: ffmpeg `framemd5` — of the packets (`-c copy`) for "three workers write the same bytes as one", of the decoded frames for "two renders … identical frame for frame" | `cli/tests/render.test.ts:54-57,151,198,232-240` |
| the output's frame count checked against the expected total after the join | `cli/src/commands/render.ts:547-548` |
| flat-frame refusal: "every rendered frame is one flat colour" (full render), "every re-rendered frame is …" (patch); `png.ts` answers `uniform` and `alphaMax` | `cli/src/commands/render.ts:540-544`, `cli/src/render/png.ts:6-11` |
| the snap `Math.ceil(t * fps - 1e-6) / fps` | `cli/src/edl.ts:106` |
| video trimmed half a frame early, audio on the instant; rates differing by more than 1e-6 refused | `cli/src/commands/apply-edl.ts:38-41,68-74,177` |
| `decode()` only on images not yet complete or broken | `cli/src/render/page-runtime.ts:271-273` |
| `fonts` command: new in 7f212e04 | `cli/src/cli.ts:73`; no `fonts` in `cli.ts@dd7913b` |
| render.ts 38,641 bytes; SKILL.md 7,375 bytes (24,740 at dd7913b) | `wc -c` |
| the mix spec `{durationSec, tracks[{path, atSec, gainDb?, fadeInSec?, fadeOutSec?, role?, duck?}]}`; `amix … normalize=0`; `sidechaincompress=threshold=0.03:ratio=8:attack=20:release=600` keyed by the voice bus, the key padded with `apad=whole_dur`; unbounded `apad` "ran ffmpeg for an hour" (read 2026-10-01, for the findings) | `cli/src/commands/mix-audio.ts:19-38,44-51,96-111,118-122,134-142` |
| the page runtime's overrides: `Math.random` (mulberry32), `performance.now`, `Date`, timers, `requestAnimationFrame`, `Element.prototype.animate`, GSAP; fonts and `decode()` before frame 0 | `cli/src/render/page-runtime.ts:35-49,72-73,92,104-105,159-167,271-277,323` |
| a worker: `__openedit.ready`, `preroll`, `frame(i)`, `Page.captureScreenshot` as PNG, the transparent background override | `cli/src/render/session.ts:323,326,363,366,392` |
| `SEED = 0x5eed`, `EPOCH = Date.UTC(2025, 0, 1)`; "the cached render was made differently"; `drawn` per segment | `cli/src/commands/render.ts:35-36,436,121-122` |
| all-intra stand-ins: `MAX_GOP = 12`, `-g 1`, the arguments in the cache key | `cli/src/render/media.ts:1-4,13,16-17` |
| a rate is an exact rational; a decimal is refused | `cli/src/render/timing.ts:1-2,17` |
| `fonts`: Google Fonts made local, woff2 subsets beside a `fonts.css` | `cli/src/commands/fonts.ts:1-4` |
| mux: "The PICTURE decides the length. `-shortest` let a built mix truncate the film"; `-t` is the video stream's duration read by ffprobe; a named track with no audio stream refused; `-ar 48000` because "loudnorm works at 192 kHz and would otherwise hand the encoder 96 kHz" (read 2026-09-30 12:15, for code-video's question) | `cli/src/commands/mux-audio.ts:67-74,89-91` |

## How Open Edit organises making a piece (read 2026-10-02, for code-video's question on a studio format)

Read in the two verbatim copies, nothing run. Two different answers, a week apart.

**At `7f212e04` (what is on `main`): a folder, a page, a renderer that refuses.**

| what | where |
|---|---|
| "`SKILL.md` is the whole runtime contract"; it is the default load, and `TRANSCRIPTION.md`, `CUT.md`, `FABRIC.md`, `VEED.md` "load only when their situation arises" | `AGENTS.md:3-4,7-9` |
| "You author the piece yourself, as an HTML page, and render it with `render`." | `.claude/skills/open-edit/SKILL.md:8` |
| "There is no GUI and no timeline: you tell your coding agent what you want" | `.github/README.md:23-24` |
| one folder per piece: "Keep everything a piece is made of under `runs/<key>/`: the page, its assets, renders, audio. The code is the edit: that folder is how the user comes back later to change one scene or reuse the piece … so nothing it needs lives anywhere else." | `SKILL.md:31-35` |
| the files in it: `runs/<key>/index.html` → `runs/<key>/out.mp4`; `runs/<key>/transcript.json` ("the only seam: anything that writes that shape is a provider"); `runs/<key>/assets/records/`, one file per record "so parallel writers never share a file"; `runs/<key>/veed-plan.json` for the hand-off; `<out>.render/manifest.json` and its segments | `SKILL.md:62`; `AGENTS.md:19-23,29`; `VEED.md:10`; `cli/src/commands/render.ts:422-436` |
| what is kept outside the piece: one preferences file per workspace, `$OPEN_EDIT_ROOT/.open-edit-prefs.json` | `SKILL.md:41`; `AGENTS.md:30-31` |
| the page's contract with the renderer: the canvas is the page's `#stage` (or `[data-stage]`) element at its own size; "The renderer owns time"; "Anything else that moves with time goes in `window.__seek(t)` (it may be async)"; fonts and assets "as files beside the page" | `SKILL.md:64,68-73` |
| looking without a full render: `render --stills 0.5,2,4 --sheet <file>`; `frames <video> --at <sec,...> --sheet` | `SKILL.md:44,76` |
| after a change: "re-render what changed, not the piece" (`--from <s> --to <s>`) | `SKILL.md:74-75` |
| the only check: the render "fails loudly on a page error, a blank render or a Chrome that did not start"; a load listed as failed "is a wrong render" | `SKILL.md:77-79` |
| delivery: the output is silent, `mux-audio` lays the sound on; to the user "the deliverable's path and a sentence or two on the result"; "Report what was spent, and on which account" | `SKILL.md:80,102,106-107` |
| the loop in the README's words: "composes the piece as an HTML page, renders it frame by frame in a browser, looks at the frames and fixes what it sees, then hands back the file" | `.github/README.md:132-135` |
| setup: the first run "pins itself into your project as a dev dependency and registers a session hook in the settings of Claude Code, Codex and Gemini CLI"; the hook is one `npx … session-start <agent>` line merged into `.claude/settings.json`, `.codex/hooks.json`, `.gemini/settings.json` of the workspace, "never a global one" | `.github/README.md:41-45`; `cli/src/project-hooks.ts:1-3,10,67-79` |
| no `preview` command: the table of commands holds 27 names and none is a preview | `cli/src/cli.ts:45-83` |

**At `dd7913b` (2026-09-22, deleted a week later): eleven steps, recipes and gates.**

| what | where (all `@dd7913b`) |
|---|---|
| the flow is a table of eleven steps, each marked SCRIPT ("deterministic") or AGENT ("need an LLM"): preflight, footage, prep, cut, analyse, sample ONE style, design system, design + render, gates, mux audio, preview | `docs/FLOW.md:3,22-34` |
| the run folder: `runs/<key>/meta.json` (canvas, duration, paths; "every downstream step reads `runs/<key>/meta.json` (never re-derives dims)"), `transcript.json`, `word-timings.json`, `style.json`, `analysis.json`, `design/system.json`, `final/template.wv`, `manifest.json`, `final/out.mp4` "(the deliverable)" | `docs/FLOW.md:18,26,28-29,31,33,43-44` |
| a long piece: "one document per chapter, gates them one at a time … and joins the gated chapters" | `docs/FLOW.md:14-16` |
| an authored run "writes `runs/<key>/design/system.json` before it authors any document, and authors every value out of it" | `docs/FLOW.md:18-19,30` |
| a recipe is a prose sheet plus a compiled module, `generate(meta, wordTimings, {demote}) → {wv, manifest}`, "authored + validated OFFLINE by a smart model, once per ref"; "Where a sheet rule needs judgment, the sheet has failed its purpose" | `docs/recipe-format.md:3-7,12-17` |
| "One content is not validation": validate every sheet on two or more contents; "`--verify` is necessary, not sufficient" | `docs/recipe-format.md:133-142` |
| `gates <run-dir>`: "lint → `--verify` (with the triaged safe-zone check) → contrast → `--record` → mux, stopping at the first failure and naming the gate" | `docs/FLOW.md:32` |
| `preview runs/<key>`: "localhost preview opened for the user (read-only): watch and scrub the footage, follow the transcript, preview the subtitles; auto-swaps to the new `final/out.mp4` when an amend re-render lands" | `docs/FLOW.md:34` |
| the skill then: six files (`SKILL.md`, `CUT.md`, `DESIGN.md`, `GENERATION.md`, `STYLE.md`, `TRANSCRIPTION.md`) and `scripts/` | `.claude/skills/open-edit/` |

None of `docs/FLOW.md`, `docs/recipe-format.md`, `refs/`, `pipeline/`, `prep/`, `preview/` exists at `7f212e04` (top-level
listing of both copies). Why VEED deleted them is written nowhere in either tree.

## The deleted measurement commands, at dd7913b: their headers

Read 2026-10-01 in `work/review/oe-dd7913b/`, for the findings: `wc -l` and the leading comments only, not the
bodies; nothing run. Paths under `cli/src/commands/`.

| command | lines | what its header says it does | where |
|---|---|---|---|
| `measure-placement.ts` | 369 | where the picture is empty per cue: motion, detail and skin chroma on a small grid; motion trusted between 1% and 45%; a component under 2% is texture; pure functions "tested on synthetic frames with no ffmpeg in the loop" | `:1-14,107-138` |
| `check-delivery.ts` | 164 | container, picture against source, loudness; which source frame a delivered frame is, by the offset of the minimum difference; ffmpeg without `-nostdin` "waits on a stdin that never comes" | `:1-9,48-57` |
| `safezone-check.ts` | 243 | transient (under a quarter second, at most 5% of its ink), minor (no deeper than 2% of the shorter side, at most a quarter of its ink), major; "could not run" its own exit code | `:57-64,113-116` |
| `wcag-pass.ts` (+ `cli/src/wcag/`, 8 files, 1,875 lines) | 1,013 | WCAG AA text contrast over sampled backgrounds, judged in one-second sliding windows | `:1-2,25-28` |
| `expect-windows.ts` | 215 | visibility assertions derived from the document's CSS keyframes, sampled inside the window by 40 ms | `:1-13,48-54` |
| `gates.ts` | 215 | lint → expect-windows → verify → contrast → record → mux; two corrections per gate, then stop | `:5,48-50` |
| `cut-frames.ts` | 199 | a contact sheet per cut, the frame before and the first few after; detections within two frames are one cut; the cap in seconds; `N/A` duration reads as NaN | `:6-16,30-32,53-64` |
| `scene-frames.ts` | 118 | stills sampled on time for a clip with no beats; a seek past the video stream's end writes nothing and exits 0 | `:44-46,81-83` |

Also there, not opened: `lint.ts` (44), `readiness.ts` (77), `cli/src/gates/content-gates.ts` (57).
