# Studio foundation and phase one

Studio is becoming a code-authored video workspace: create a project, edit its
objects through Human or AI operations, render a specific version, inspect the
result, and export it with evidence. The first phase establishes the starting
state and contracts for that work. It does not add a project creator or renderer SDK.

The implementation inventory is in [Capabilities](CAPABILITIES.md). The ownership,
time and revision decisions for the next phase are in [Project contract](PROJECT-CONTRACT.md).
The three future acceptance scenarios are specified in
[acceptance/scenarios.json](acceptance/scenarios.json). They are specifications,
not videos that have already been generated.

## Starting state

The baseline was captured on 2026-10-13 before phase-one edits. All 43 files in the
previous editor release receipt matched their recorded hashes. The live service
was active with zero automatic restarts. Whiteout had generation 13 and 13 history
entries; its authored project matched the state before the eight subsequent
visibility operations. There were no open Studio notes at capture time.

The source backup is under `build/.phase1-baselines/20261013T074016Z/`:

- `source.tar.gz`: 1,308 tracked/untracked source files, existing audit/release
  receipts and Studio assets, each read back from the archive and hash-verified.
- `manifest.json`: paths, SHA-256 values, base Git commit and scope.
- `git-status.txt` and `working.patch`: the pre-existing working tree state.

Dependencies, credentials, private reference uploads and Git internals are outside
this backup. Install dependencies from their lockfiles when reconstructing an
environment. A dependency-free scratch copy was used for validation, with installed
dependency directories linked in. No original project document is migrated by this phase.

To recover a file, extract the archive to a separate directory and verify its hash
against the manifest first. Compare the current file with the phase-one release
receipt before replacing it; preserve subsequent edits. Do not extract over the
live working tree. Generated final videos are not retained in this backup.

## Freshness correction

Previously the complete `project.studio.json` bytes were part of the visual
fingerprint. Undo history, generation and request receipts therefore invalidated
measurements even when the rendered project returned to the same state. Source
line counts also counted the growing history, making a method claim change merely
because someone edited and restored a layer.

Whiteout now explicitly declares `frame.project` in its card. For that one declared
document, the render input is canonical `{schemaVersion, project}`. Generation,
history, receipts and migration bookkeeping are excluded. All project fields are
retained conservatively, including names, annotations and unknown project fields.
Unknown envelope fields or unsupported schemas fail instead of being ignored.

Other files, including code, media, fonts and undeclared JSON, still use their
exact bytes. The fingerprint also binds the sampling schedule and measurement
tools. Evidence schema 2 retains a byte hash as well as the render hash and the
projection name. Old schema-1 evidence is stale until a fresh measurement runs;
existing PASS results are never relabelled current just by replacing their hash.

Authored source counts use the same selected document, formatted consistently.
Physical backup hashes and transaction revisions continue to include storage state.
This means freshness can return after an undo while concurrency still detects the edit.

The current measurement label means local inputs match the recorded sampling run.
It does not prove all frames, pin remote resources or provide an immutable export.
Whiteout's existing visual schedule remains frames 96, 240 and 384. Its claims and
thresholds are unchanged.

## Phase one acceptance

- A verified baseline and guarded recovery procedure exist.
- Current capabilities and their limits are recorded with source pointers.
- Project ownership, time, revisions and renderer boundaries are defined for phase two.
- Metadata-only edits preserve render identity and authored counts.
- Real project, code, asset or sampling changes invalidate the relevant evidence.
- A fixture is rendered again after metadata edits; its pixels remain equal.
  An actual authored change produces different pixels and fails the visual claim.
- Fresh real-film measurements use evidence schema 2; earlier evidence remains history.
- The three future scenarios have explicit requirements and known-bad cases.

Validation logs and the release verification receipt are stored in `build/phase1/`.
The receipt records the checks actually run, file hashes and preserved project hashes.

## Phase two handoff

Phase two is implemented in the [renderer and component SDK](SDK.md). Its current
acceptance evidence and known boundaries are documented there. The list below
records the original handoff.

1. Build the renderer registration and capability contract described in
   [Project contract](PROJECT-CONTRACT.md), using the current Canvas2D adapter first.
2. Move work-specific bindings into adapter-owned components without losing stable IDs.
3. Give components typed properties, selection geometry and validated operations.
4. Add deterministic frame requests and an isolated runtime transport, then exercise
   the motion-graphics acceptance scenario before building the full project creator.

Subsequent phases are project creation; Human editing; audio and captions;
snapshot/audit/export; Three.js; AI iteration; and release hardening. Advanced
animation, generative finishing and collaboration follow as optional extensions.
Generative finishing must use a backend whose model terms and execution location
have been checked independently of the wrapper's code licence.
