# s11 — veedstudio/open-edit, read at 7f212e0 (2026-09-29T17:29:24+01:00)

Cloned into `work/open-edit` (`git clone --depth 50`), `git log -1 --format="%H %cI"` →
`7f212e0484a01d976fb3e68d4adc9f6373c19346 2026-09-29T17:29:24+01:00`. Every commit in the last 15
reads "Mirror from veed-llm-editor (#n)": the public repo is a mirror of an internal one.

- **What it is**: `@veedstudio/openedit-cli`, Apache-2.0 (`LICENSE`, `package.json`), a CLI plus a
  Claude Code skill (`.claude/skills/open-edit/SKILL.md`) that `init` installs. The agent writes the
  piece **as an HTML page** and renders it: "You author the piece yourself, as an HTML page, and
  render it with `render`" (SKILL.md). "The code is the edit" — everything of a piece under
  `runs/<key>/` (SKILL.md, "One folder per piece").
- **The cut as data**: `cli/src/edl.ts` — an EDL `{ sources: {id: path}, transcripts?, ranges:
  [{source, start, end, note?}] }` (`edl.ts:10-24`), one validator for both tools
  (`parseEdl`, `edl.ts:48-70`), and `snapToFrames` (`edl.ts:98-112`): both edges moved up to the next
  frame instant, because ffmpeg's `trim` keeps whole frames and audio cut on raw edges drifts "by up
  to a frame per range … and the drift grows with every join". Applied by `apply-edl` (one encode,
  joins crossfaded); `retime-transcript` moves word times onto the cut instead of transcribing it
  again (CUT.md).
- **Cut points are measured, not taken from the transcript**: `speech-probe` reports noise floor,
  onset/decay and every sub-threshold gap; "If the probe finds no gap at a boundary, do not cut
  there" (CUT.md).
- **Deterministic render**: `cli/src/render/page-runtime.ts:1-4` — an injected script "replaces the
  page's sense of time with a virtual clock the renderer advances one frame at a time, so a frame is a
  function of its index alone: not of how fast the machine is, and not of which worker rendered it":
  seeded `Math.random` (`:35`), virtual `performance.now` (`:42`), `Date`, timers, rAF; CSS and Web
  Animations set to the frame's time; `window.__seek(t)` for anything else (`:302`).
- **Exact frame rates**: `cli/src/render/timing.ts:1-2,18-34` — a rate is an exact rational
  (`30000/1001`), a decimal like 29.97 is refused; frame i is at `i·den/num`.
- **Re-render only what changed**: `cli/src/commands/render.ts:5-6,76-77,118-122` — the output is cut
  into segments (2 s default) with a `manifest.json` beside it; `--from/--to` re-renders the
  overlapping segments and splices by stream copy; a segment from another browser/ffmpeg build is not
  spliced in.
- **A render that drew nothing fails**: `cli/src/render/png.ts:2,95-96` (`showsSomething`: not one flat
  colour, and on transparent something visible) and `render.ts:379-391,534-540` (a blank render, or a
  patch that turns a drawn range blank, is refused).
- **Sound**: `mux-audio` levels to −14 LUFS integrated, −1 dBTP, LRA 11 (`mux-audio.ts:108-115`) and
  says which correction actually ran (`:98-101`); `mix-audio` ducks a bed under voice tracks.
- Tests: `cli/tests/` includes `edl.test.ts`, `apply-edl.test.ts`, `render-range.test.ts`,
  `render-units.test.ts`, `mix-audio.test.ts`, `mux-audio.test.ts` (not run here).
