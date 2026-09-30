# Verdict: Open Edit

Room 2, 2026-09-29. Evidence: `work/source/frames.md` (the video: 84 frames, cited by name,
the captions, the speech) and `work/source/sources.md` (repository, package, thread). Nothing
of Open Edit was run; no account or key was made.

**Do not build on Open Edit now.** What the video demonstrates is not published, its new half
leads into VEED's own hosted editor, and its open half exists elsewhere under better terms.
One idea in it is worth keeping. Look again when the repository moves.

## What this is

A skill and a command-line tool for a coding agent (Claude Code, Codex, Gemini CLI) on the
user's own Mac or Windows desktop. The agent transcribes footage, cuts it, writes captions and
graphics as a composition, renders an mp4 and checks it. The repository dates from 2026-07-22
and is a bot's mirror of a private one.

The post's sentence, unpacked:

- **"Opus 5.5 videos"**: clips Claude made by writing one HTML page and rendering it (c001–c007,
  t004, t026). Nothing in them is particular to Opus 5.5; the name is only in the video's header.
- **"editable"**: the clip opens as a project in VEED's web editor, signed in, each title,
  sticker, cut-out, audio and footage clip its own timeline item (c012–t024). Not an open or
  local format.
- **"turns videos into editable browser projects"**: not shown. No frame recovers layers from an
  existing mp4; the layers exist because the agent wrote them. The repository's own words, an
  editing pipeline, are the accurate ones.

## The video against the public code

| the video | the code on 2026-09-29 |
|---|---|
| `openedit veed-project veed-plan.json`, `veed-pull`, two bookmarks (c012, t025, t028) | No such commands. Last push 2026-09-22, six days before the post; npm latest 0.2.0, same day. |
| "The old Weave engine, gone", "Rendered in Chrome" (t039–t042) | `install-engine` is there, the skill says "rendered by VEED's engine", engine build 0.12.0 came out on 2026-09-24. |
| SKILL.md "109 lines, was 1,159" (t046) | SKILL.md is 24,740 bytes: the rule book. |
| "86,000 lines" deleted (t036–t038) | The list is of the private source; `internal/` and `tests/` were never public. |

The video is of a version VEED has not released. What the tool itself reports in the recording
(t026) says more than the narration: the VEED project is "simpler than the MP4" (VEED's fonts
and caption styling, camera moves become static crops, no loudness pass); the 26-second clip
took the agent 1 h 28 min; it cost "a few dollars" through fal plus VEED credits; and the edited
clip returns as a new project with another id (c019). "Your edits, kept" is shown for two title
items (c020).

## Open and closed

| part | terms |
|---|---|
| pipeline, CLI, skill | Apache-2.0 |
| the renderer | binaries only, PolyForm Shield 1.0.0: any use except "providing any product that competes with the software". macOS arm64 and Windows x64; needs a desktop session, outside any sandbox. |
| VEED transcription, AI presenters | VEED account and credits. WhisperX is the free local alternative. |
| the editor and its project format | VEED's hosted product, closed |
| the Chrome renderer, the hand-off | unpublished, terms unknown |

So: open source in its code, a way into a paid product in its purpose. Free: installing it,
cutting, captions, graphics, rendering on one's own machine, WhisperX, and selling what one
makes. Paid: the agent's own model, generated footage and voice (VEED credits or the user's own
fal key), VEED transcription past the account's allowance, and the VEED editor's paid plans
(checked again 13:40 UTC, `sources.md`). The renderer costs nothing and is not open.

## What already exists

HyperFrames (HeyGen, Apache-2.0, 54,009 stars) is the same open half, plain HTML to mp4 for
agents, without a closed renderer. Remotion is React to video, mature, paid above a company
size. Revideo and Motion Canvas (MIT) are TypeScript scenes; editly (MIT) is a declarative
ffmpeg cut list. None is known to the room to hand a finished piece to a human editor as
layers; that was not checked in depth. It is Open Edit's one new step, and the one tied to VEED.

## Is it worth building

No. It cannot run at Labs: the published renderer has no Linux build and wants a desktop
session, and Labs runs guests sandboxed on a Linux server. Its new part would make every user
hold a VEED login. Its open part is not scarce.

Worth keeping, as an idea: **the layer manifest.** The hand-off works because the composition
names every element with a kind, a track and a time (t012). A composition described that way
can be exported to a format editors already read (OpenTimelineIO, FCPXML), one asset per layer.
Whether that is wanted is the owner's call; the room was given no use for video at Labs.

## How, and what it would rent

As it stands Open Edit would rent nothing: it is a desktop tool, not a service. If the owner
wants the experiment, fourteen days, stopping at the first step that fails: render one HTML
composition in headless Chrome in the room's container, on HyperFrames; have the agent write a
layer manifest and render each layer alone with transparency; export it as OpenTimelineIO and
open it in one free editor. Graduated, it would be a `service` renting `host` (one rendering
process; Chrome installed in the project's own directory; a render is minutes of CPU), `mcp`
(render and export as tools, a low per-caller limit) and `web` (an origin for finished files).
Generation keys would be the project's own secrets. No VEED login.

## Not known

- What `veed-plan.json` and the 269 KB JSON that comes back contain: the first thing to read
  when VEED publishes.
- Whether the hand-off needs a paid VEED plan, and the Chrome renderer's terms. The recording
  says only "the project hand-off used none" of the credits (t026), on an account holding
  eight million of them.

No longer on this list: the second pass over the video was done at 13:40 UTC (captions read
continuously, enlarged crops, the speech transcribed by machine). It changed no finding. The
narration is the captions word for word, it never says "open source", and its own summary is
"one VEED login runs it all".

## 2026-09-30: the repository moved

Three hours after the check above, VEED published what the video shows: commit `7f212e04`
("Mirror from veed-llm-editor (#27)") at 16:29 UTC on 2026-09-29, npm `@veedstudio/openedit-cli`
0.3.0 at 17:00 UTC. Read on 2026-09-30 between 04:05 and 04:15 UTC (`work/source/sources.md`), nothing
run. What is now on `main`:

- **The engine is gone**, and with it PolyForm Shield: no `install-engine`, no `engine-path`,
  `NOTICE` names only Apache-2.0, the two fonts and VEED's hosted services. `render`
  (`cli/src/commands/render.ts`, 38 KB, plus `cli/src/render/`) runs Chrome Headless Shell through
  `playwright-core` 1.63.0 on a virtual clock, captures PNGs over the DevTools protocol, pipes them
  into ffmpeg in 2 s segments cached under `<out>.render/` and re-renders only `--from/--to`. `SETUP.md`
  says macOS, **Linux** or Windows, Node ≥ 20.18.1. Twenty-three render tests, among them two renders
  identical by hash and three workers writing the same bytes as one.
- **`veed-project` and `veed-pull` exist**, with the plan format the verdict wanted to read: `parts`
  of kind `video | image | audio | text | layer | edl | mix | captions`, each with `at`/`to` on the
  project timeline, `in`/`out` in the source, a `box {x, y, w, h}`, `z`, `name`; a `layer` is a CSS
  selector rendered alone with alpha and cut to its box, its span measured from the frames' peak alpha
  (`visibleSpans` in `cli/src/veed/editor-project.ts`). `--local` renders and cuts the layers without
  uploading. The pull returns `{project, timeline[], subtitles[], assets[]}` and writes `plan.json`;
  what the plan cannot carry (subtitle tracks, speed, crops, filters) is printed as left out. Neither
  command spends credits (`VEED.md`); both need the VEED login.
- **The skill is small**: `SKILL.md` 7,375 bytes plus `CUT.md`, `FABRIC.md`, `TRANSCRIPTION.md`,
  `VEED.md`; `DESIGN.md`, `GENERATION.md`, `STYLE.md` are gone.
- **Deleted**: `gates`, `lint`, `wcag-pass`, `measure-placement`, `safezone-check`, `check-delivery`,
  `expect-windows`, `scene-frames`, `cut-frames`, `preview`, `prep`, `generate-recipe`, `readiness`,
  the `.wv` templates, `docs/FLOW.md`, `refs/`. Still there and measured: `speech-probe`, `apply-edl`,
  `retime-transcript`, `mix-audio`, `mux-audio`, `frames`, `concat-videos`, `fonts`, `stills`.
- The GitHub-facing README adds one money fact: VEED's free tier "covers ~10 minutes monthly" of
  transcription. The hand-off's plan requirement is still not written anywhere.

What this changes in the verdict:

- "Cannot run at Labs: no Linux build, a desktop session" is **no longer true**. The renderer is open,
  headless and Linux; the room's own container could run it.
- "Its open half exists elsewhere under better terms" is **no longer true**: the terms are now equal
  to HyperFrames' (Apache-2.0), and Open Edit's open half has the measured cut and sound tools that
  HyperFrames does not.
- "Turns videos into editable browser projects" is **still not what it does**: `veed-pull` reads
  VEED's project, not a video; no command recovers layers from an mp4. The hand-off still ends in a
  hosted editor behind a login, returns a new project, and simplifies the piece (t026).
- The one idea worth keeping is now readable code, and the page written for code-video
  (`for/code-video.md`) takes nine mechanisms from it.

So the recommendation splits: **as a Labs capability, still nothing to build**, no customer was named
and the new half would make every user hold a VEED login; **as a source of mechanisms for code-video,
yes**, on the open half only, which now needs no VEED at all. The room stays in `verdict`; whether to
open a building room for the export path is the owner's call.
