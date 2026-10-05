# s9 — heygen-com/hyperframes

Fetched 2026-09-30 10:28 UTC in the room's container: `api.github.com/repos/heygen-com/hyperframes` and the raw
`README.md` on `main` (copies: `work/review/web/s9-*`, gitignored). The code was not read.

- The API: "Write HTML. Render video. Built for agents."; created 2026-03-10; Apache-2.0; 54,385 stars (54,009 on
  2026-09-29).
- README `:137`: "**Requirements:** Node.js 22+, FFmpeg".
- README `:218-244`: a composition is HTML with `data-start`, `data-duration`, `data-track-index` on each clip,
  and `window.__timelines`.
- README `:249`: "The renderer seeks each frame in headless Chrome and encodes the result with FFmpeg, so the same
  input produces the same video."
- README `:258,321`: the producer is "Full rendering pipeline for capture, encode, and audio mix".
- README `:102-103,120,122`: skills for captions on an existing talking-head video, "talking-head-recut",
  `/media-use` (which can "transcribe, caption, remove backgrounds"), and `/hyperframes-audio`: "voiceover carve …
  level match included", an effect chain with compressor and limiter, automation envelopes, submix buses.
- README: "Apache 2.0 license, with no per-render fees or commercial-use thresholds."

Not found in the README: a cut list measured from the audio (silence or speech onsets), or a loudness target in
LUFS. The README only; whether the code has either was not checked.

## How it organises making a film (read 2026-10-02 in the same copy, for code-video's question)

The README of 2026-09-30 only; none of these commands was run and no package was opened.

| question | what the README says | where |
|---|---|---|
| a project on disk | a folder made by `npx hyperframes init my-video`; the composition is an `index.html` that "plays as-is" with "No build step"; its root carries `data-composition-id`, `data-width`, `data-height`, each clip `class="clip"` with `data-start`, `data-duration`, `data-track-index`, and the page registers its timelines in `window.__timelines` | `:130-135,218-246,283` |
| design as a file | `frame.md`, "a `DESIGN.md` superset your whole toolchain can read" | `:150-156` |
| reusable parts | a catalog installed by `npx hyperframes add <block>` | `:268-274` |
| who authors | an agent under skills, or a person with the CLI. 21 skills: one router (`/hyperframes`, "Read first"), ten creation workflows, domain skills "loaded on demand" | `:67,89-124` |
| the loop the skills teach | "plan the video, write valid HTML, wire seekable animations, add media, lint, preview, and render" | `:63` |
| preview | `npx hyperframes preview`, "preview in browser with live reload"; Studio, "Browser surface for previewing and editing compositions", status "Available, evolving" (`@hyperframes/studio`, "Browser-based composition editor UI"); a `<hyperframes-player>` web component | `:133,261,322-323` |
| render | `npx hyperframes render` to MP4, locally or in Docker; HeyGen-hosted `cloud render`; AWS Lambda | `:121,134,249,262` |
| check | the CLI names `lint`, `check`, `snapshot`, `doctor`; `hyperframes keyframes` "diagnostics for rendered motion"; the repository's own tests keep golden mp4 baselines in Git LFS, "about 240 MB" | `:118,121,339` |
| deliver | MP4 "or transparent overlay"; `publish` in the CLI list; hyperframes.dev for "previewing, iterating, sharing, and rendering" | `:104,121,263` |

Not known from the README: what `init` writes besides `index.html`, what `check`, `snapshot` and `publish` do, what
Studio can edit, and whether any check carries a known-bad case.
