# s8 — vercel-labs/fx, read at commit 1b1f9af (2026-09-30T03:22:46-04:00)

Clone: `work/fx` (`--depth 1`). Read, not built.

- What it is: "a coding agent CLI written in Zig", Apache-2.0 (README.md, first section).
- cuelume.dev says "Used by Vercel in fx" (s5 index.txt:2). What fx does with it:
  - `src/core/notifications/sound.zig:18-26` — "Chimes derived from cuelume's MIT-licensed recipes by Daniel
    Belyi, rendered at 48kHz and encoded as AAC"; each cue is an `@embedFile(<cue>.m4a)`.
  - `:7,176-183` — on macOS it writes the file to `$TMPDIR` and plays it with `/usr/bin/afplay`.
  - `:9-11,160-165` — sound is on by default only on macOS; Linux and others get the terminal bell.
  - `THIRD_PARTY_NOTICES.md:5-8` and `README.md:189` credit "cuelume by Daniel Belyi" at
    `github.com/Danilaa1/cuelume` (the repository's name before commit 1cacab4 in s3).
- So fx uses Cuelume's **recipes rendered once into audio files**, not the library and not live synthesis.
