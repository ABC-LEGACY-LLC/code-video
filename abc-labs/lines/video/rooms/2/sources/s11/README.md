# s11 — Revideo

Fetched 2026-09-30 10:28 UTC in the room's container: `api.github.com/repos/redotvideo/revideo`, which now answers
as `midrender/revideo` (copy: `work/review/web/s11-repo.json`, gitignored). "Create Videos with Code"; created
2024-03-11; last push 2026-07-15; 4,071 stars; MIT.

## How it organises making a film (README fetched 2026-10-02 02:00 UTC, for code-video's question)

The raw `README.md` on `main` (3,685 bytes, sha256 583e1dcb418f…; copy `work/review/web/s11-README.md`). Its
documentation (docs.re.video) was not read.

| question | what the README says | where |
|---|---|---|
| a project on disk | made by `npm init @revideo@latest`; "A scene is a generator function" in TypeScript, `makeScene2D('scramble', function* (view) { … yield* waitFor(0.5); … })` | `:31-55` |
| who authors | code; "A scene is plain TypeScript, so Claude or Codex can produce one from a prompt" | `:21` |
| preview | a React `<Player/>` that "renders scenes in the browser and accepts dynamic inputs, so the same project drives both preview and final render" | `:78-81` |
| render | `renderVideo()`, headless; "a rendering endpoint from your project with the CLI"; a render split across workers | `:64-65,71-77` |
| sound | `<Video/>` and `<Audio/>` "with audio export and frame-accurate synchronization" | `:82-83` |
| check | nothing named | |
| deliver | a video file, or the endpoint | `:16-19,71-75` |

"Revideo borrows concepts from Remotion and Rive, but is, in its core, zero dep." (`:23`). It counts renders through
PostHog unless `DISABLE_TELEMETRY=true` (`:89-98`). Not known from the README: the files of a project, any check.
