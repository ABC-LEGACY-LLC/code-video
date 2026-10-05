# s13 — mifi/editly

Fetched 2026-09-30 10:28 UTC in the room's container: the repository API and the raw `README.md` on `master`
(copies: `work/review/web/s13-*`, gitignored). "Slick, declarative command line video editing & API"; created
2020-04-15; last push 2025-05-12; 5,511 stars; MIT. README `:5`: "a tool and framework for declarative NLE
(**non-linear video editing**) using Node.js and ffmpeg".

## How it organises making a film (read 2026-10-02 in the same copy, for code-video's question)

| question | what the README says | where |
|---|---|---|
| a project on disk | one edit spec, JSON or JSON5 or a JavaScript object: `{outPath, width, height, fps, defaults, clips: [{duration, transition, layers: [{type, …}]}], audioTracks, audioNorm}` | `:79-82,103-170` |
| code inside the spec | layer types `canvas` and `fabric` take a custom JavaScript `func`; `gl` loads a GLSL fragment shader by `fragmentPath` | `:335-352` |
| who authors | a person or a script that writes the spec; `editly my-spec.json5 --fast --keep-source-audio --out output.gif` | `:79-82` |
| preview | `--fast`: "low resolution and FPS, useful for getting a quick preview" | `:183` |
| render | ffmpeg, with headless-gl on Linux | `:53` |
| check | none; the spec's "Testing options" are `enableFfmpegLog`, `verbose`, `fast` | `:166-169` |
| deliver | mp4, mkv or gif at `outPath` | `:177` |

The one tool of the six whose whole project is a data file. Last push 2025-05-12.
