# Verdict — Open Edit, 2026-09-30

Rewritten 2026-09-30 after the first review (`review.md`), against open-edit at `7f212e04` [s2]. The history of
how the room got here is in the log; this page is the present.

**In one line:** do not build Open Edit at Labs, and take its open renderer's mechanisms into code-video. Its open
half is Apache-2.0, headless and on Linux since 2026-09-29, but not scarce; its new half, the hand-off, ends in
VEED's hosted editor behind a VEED login [s2, s9].

## What this is

A skill and a command-line tool for a coding agent: its first run "registers a session hook in the settings of
Claude Code, Codex and Gemini CLI" (`.github/README.md:40-44`) [s2]. The agent cuts footage, writes captions and graphics as an HTML page,
renders an mp4 and checks it. The repository is a bot's mirror of a private one ("Mirror from veed-llm-editor
(#27)") [s2].

What is on `main` since `7f212e04` (2026-09-29 16:29 UTC; npm 0.3.0 at 17:00 [s5]):

- **The renderer is Chrome.** `render` runs Chrome Headless Shell through `playwright-core` 1.63.0 on a virtual
  clock, captures PNGs over the DevTools protocol and pipes them into ffmpeg in 2 s segments cached under
  `<out>.render/`, re-rendering only `--from/--to` and any segment missing from the cache (`cli/src/commands/render.ts`,
  38,641 bytes; `cli/src/render/session.ts:392`; `package.json:36`) [s2]. Twenty-three render tests
  (`cli/tests/render.test.ts`); they compare ffmpeg `framemd5` hashes, and skip without Headless Shell (`:17-20`) [s2].
  `SETUP.md:25`: "**macOS, Linux or Windows** and **Node 20.18.1 or newer**" [s2].
- **The hand-off exists.** `veed-project <plan.json>` uploads a plan as a project in VEED's web editor; `veed-pull`
  reads the file the "Send to Claude" bookmark saved from a signed-in VEED tab (`cli/src/commands/veed-pull.ts:19`)
  and writes a `plan.json` back, printing what the plan cannot carry (`:105-109`) [s2]. A plan's `parts` are of
  eight kinds, `video | image | audio | text | layer | edl | mix | captions` (`cli/src/veed/editor-project.ts:140`),
  and their fields differ by kind: timed parts have `at` on the project timeline, an optional `z` and `name`
  (`:16-27`); only video and audio take `in`/`out` in the source; `box` is required on an image and optional on a
  video; a `layer` is a CSS selector rendered alone with alpha, its clips measured from the frames' peak alpha
  (`visibleSpans`, `:250-253`), its `at`/`to` in page time and placed by `shift`; `edl`, `mix` and `captions` carry
  their own fields (`:109-128`) [s2]. `veed-project --local` renders and cuts the layers with no login and uploads
  nothing (`cli/src/commands/veed-project.ts:179-184`) [s2].
- **The skill is small.** `SKILL.md` is 109 lines (7,375 bytes) beside `CUT.md`, `FABRIC.md`, `TRANSCRIPTION.md`,
  `VEED.md`; at `dd7913b` it was 336 lines (24,740 bytes) and the skill's six files 1,123 [s2].
- **Deleted**: `gates`, `lint`, `wcag-pass`, `measure-placement`, `safezone-check`, `check-delivery`,
  `expect-windows`, `scene-frames`, `cut-frames`, `preview`, `prep`, `generate-recipe`, `readiness`, the `.wv`
  templates, `docs/FLOW.md`, `refs/` (all present at `dd7913b`, none at `7f212e04`) [s2]. Still there:
  `speech-probe`, `apply-edl`, `retime-transcript`, `mix-audio`, `mux-audio`, `frames`, `concat-videos`, `stills`;
  new: `fonts` (`cli/src/cli.ts:73`) [s2].

The post's sentence, unpacked:

- **"Opus 5.5 videos"**: clips Claude made by writing one HTML page and rendering it; c007 reads "made by Claude with
  OpenEdit · youtube-to-instagram-ig.mp4" beside `<!doctype html>`, and "Claude Opus 5.5" appears only in the
  video's header band (c001–c007, t004, t026) [s3]. Nothing in them is particular to that model.
- **"editable"**: the clip opens as a project in VEED's web editor, signed in (t010: `veed.io/edit/a5d8cf61-…`,
  "8,012,633 credits left"), each element its own timeline item (t018–t020, t034) [s3]. t012 labels seven planes
  with a name and a kind ("caption · native text", "music · audio") [s3]; the times and places are in the plan
  [s2]. Not an open or local format: the editor is VEED's.
- **"turns videos into editable browser projects"**: not shown, and not what the code does. No frame recovers
  layers from an existing mp4 [s3]; `veed-pull` reads VEED's project, and no command takes layers out of a video
  [s2]. The layers exist because the agent wrote the page.

What the recording itself reports at t026 [s3]: the VEED project is "simpler than the MP4" (VEED's fonts and
caption styling, camera moves become static crops, no loudness pass); the 26-second clip took "1h 28m 14s"; it cost
"a few dollars" through fal plus VEED credits, and "the project hand-off used none". The edited clip comes back as a
new project with another id (`2ef1068c-…`, not `a5d8cf61-…`; c019), and "your edits · kept" is shown on two title
items (t034) [s3].

The video ran ahead of the code: posted 2026-09-28 17:42 UTC [s1], it showed commands that on 2026-09-29 were in
neither the public repository (`dd7913b`, 2026-09-22) nor npm (latest 0.2.0, 2026-09-22) [s2, s5]. They arrived
with `7f212e04`, a day after the post. The video's "109 lines" now holds; its "was 1,159" matches neither the old
`SKILL.md` (336) nor the old skill (1,123) [s2, s3 t046]. Its "-85,989 lines of code, deleted" (t038) comes with a
list of paths (t036–t037), some public at `dd7913b` (`cli/tests/…`, `refs/html/…`) and some in neither public commit
(a top-level `internal/` and `tests/`), so the count is of the private source [s2, s3].

### Open and closed

| part | terms |
|---|---|
| pipeline, CLI, skill, the Chrome renderer | Apache-2.0 (`LICENSE`, `NOTICE:6`); no PolyForm anywhere in the tree at `7f212e04` [s2] |
| VEED's engine (`weave-viewer-cli`), the renderer until `7f212e04` | binaries only, macOS arm64 and Windows x64, no Linux build in 22 releases; `weave-v0.13.0` still came out on 2026-09-29 at 11:58 UTC [s6]. PolyForm Shield 1.0.0: any purpose "except for providing any product that competes with the software or any product the licensor or any of its affiliates provides using the software" [s7], so a product competing with VEED's editor was excluded too |
| VEED transcription, Fabric generation, background removal, lipsync hosting | a VEED account and its credits (`NOTICE:24-29`) [s2]; transcription's free tier "covers about ten minutes a month" (`.github/README.md:48`) [s2]; WhisperX runs locally for free |
| VEED's editor and its project format | VEED's hosted product, closed [s2, s3] |

Money, from VEED's own page: "free to use. No subscription, no paywalls"; "Generating spends credits, and OpenEdit
asks first"; of the engine's output, "you can sell what you make with them at no cost to VEED" [s8]. Neither
hand-off command spends credits (`VEED.md:4`; `veed-project.ts:195`: "A hand-off spends no VEED credits; the
workspace only holds the project") [s2]. Whether the editor needs a paid plan to hold or export the project is
written nowhere the room read.

## What already exists

- **HyperFrames** (HeyGen, Apache-2.0, created 2026-03-10, 54,385 stars): HTML with `data-start`, `data-duration`,
  `data-track-index` rendered by seeking each frame in headless Chrome and encoding with FFmpeg, "so the same input
  produces the same video"; captions, transcription and an audio mix with a limiter and level matching [s9]. Its
  README names no cut list measured from the audio and no loudness target; its code was not read.
- **Remotion**: React to video; its own licence, free for individuals and companies of up to three employees, a
  company licence above [s10].
- **Revideo** (MIT, 2024) and **Motion Canvas** (MIT, 2022): TypeScript scenes [s11, s12].
- **editly** (MIT, 2020, last push 2025-05): "declarative NLE" over ffmpeg [s13].
- **Ours**: code-video renders films from code in the browser and measures them with checks; it has no export yet
  [s4] (`for/code-video.md`).

Handing a finished piece to a human editor as layers is the one step none of these READMEs describes [s9–s13]. It
is Open Edit's new step, and the one tied to VEED.

## Worth building?

**No, as a Labs capability.** Three facts:

1. **The new half needs VEED.** The hand-off ends in VEED's hosted editor behind a VEED login and returns a new,
   simplified project [s2; s3 t026, c019]. Offered at Labs, every user would hold a VEED account.
2. **The open half is not scarce.** Apache-2.0 renderers of HTML to video in headless Chrome exist, HyperFrames the
   nearest [s9]. What Open Edit adds on the open side is measured tooling (`speech-probe`, `apply-edl`, `mux-audio`,
   the segment cache, the flat-frame refusal) [s2]: worth taking as mechanisms, not worth running as a service.
3. **No customer.** The one project here that makes video, code-video, wants an mp4 as a CI artifact (the owner in
   the log, 2026-09-30 09:56), which is a job in its own CI, not something rented.

A risk under all three: the public repository is a mirror that swapped its renderer and licence in one commit, a day
after a video showed the result [s2, s5, s6]. What is on `main` today says little about next week.

**Yes, as a source of mechanisms for code-video**, on the open half only, which needs no VEED at all: ten items in
`for/code-video.md` [s2, s4].

## How, if yes

For code-video: `for/code-video.md` is the page, with where to start (the shot list in whole frames and a check for
it, then the export job). It rents nothing from Labs: the export runs in code-video's own GitHub Actions and the mp4
lives as an artifact beside the run, outside the repository.

A Labs capability is not proposed. Were one wanted, the smallest proof would be open-edit's own `render` and
`veed-project --local` on one HTML page in the room's container, which needs the greenlight (running Open Edit is
building, per the brief); graduated, a `service` renting `host` (one render process, Chrome in the project's own
directory), `mcp` (render as a tool, a low per-caller limit) and `web` (the finished files), with no VEED login.

## What was checked and what was not

- **Checked:** the video's 84 frames, its captions, 67 crops and the machine transcript [s3]; open-edit at `dd7913b`
  and at `7f212e04`, read and not run [s2]; npm [s5], the engine's releases [s6], PolyForm Shield [s7], VEED's
  newsroom page [s8], and the five alternatives' READMEs or licences [s9–s13], all fetched 2026-09-30. The review of
  2026-09-30 (`review.md`) checked 118 claims of this page and `for/code-video.md`; this page was rewritten after it.
- **Not checked:** Open Edit was not run and no VEED account was made (the brief). VEED's prices: `veed.io/pricing`
  gives nothing to a fetch, and the third-party figures noted on 2026-09-29 are not used here. HyperFrames' code.
  The deleted measurement commands at `dd7913b` (listed, not read). Whether the hand-off needs a paid VEED plan.
- **Changed under the room:** VEED's newsroom page now says "render through Chrome instead" with the same
  `dateModified` (2026-08-19) as before [s8]; what the room read on 2026-09-29 did not mention Chrome.
