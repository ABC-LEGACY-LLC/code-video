# Frozen source, checks and export (phase 6)

Open a managed work, save editor drafts, and choose **Checks → Run checks**.
Select Technical, Text/layout, Motion/camera, Audio, or Visual review. Progress
names the current frame or audio stage. Cancel releases the frozen renderer;
Retry captures the currently saved source again.

The report shows its snapshot ID, exact sampled frames, rules, browser environment,
measured results and limits. Click a finding to open its frame and exposed entity.
A stale finding does not navigate into a different version. **Frozen preview** opens
the recorded source and project; **Download report** saves JSON with its manifest.
Reports are retained in this browser's local storage, not shared review approvals.

**Export video** freezes the saved project independently, reusing the same content
identity when its source matches the checked version. The frozen encoder and
verifier run from that snapshot too. Export reopens every video sample with
WebCodecs, counts decoded frames, checks decoded dimensions and duration, and
reopens encoded audio to compare its timing with the source PCM. A failed rule
prevents download. Audio with no timing landmark is marked REVIEW, not proven sync.
Video downloads through the browser. **Download verification report** saves its
JSON receipt separately. Neither final video nor generated audio is uploaded.

## Identity and storage

`POST /api/snapshots` with `{work, baseRevision}` captures a managed project after a
revision check. `GET /api/snapshot?id=…` reads its manifest;
`GET /api/snapshot/freshness?work=…&id=…` compares it with current source, including
assets and check/encoder code. These routes and `/snapshots/:id/w/...` require the
same authentication as Studio; POST also checks origin. The immutable namespace
never falls back to live files when a dependency is missing.

A snapshot contains the renderer, SDK, component source, seed, project, imported
input media/fonts, audit rules, encoder and decoder-verification code. Dependency
versions are represented by exact SHA-256 file hashes; Node capture version is also
recorded. Project history, receipts and generation are excluded from render identity.
Changing history alone does not stale a restored project. Project fields are retained
conservatively, so annotations and names can invalidate a report too.

Source is stored under `build/snapshots/<SHA-256>/`, with a manifest and hash-checked
files. This is a source archive, not a rendered-video cache. Publication is atomic;
a source changing during capture is refused. Limits are 96 MB/2048 files per
snapshot and 512 MB total. Existing snapshots are never automatically evicted.
An owner can archive unused directories offline; dependent reports then explicitly
lose preview availability. Regular backup/restore and retention UI remain phase 9.

Remote script, stylesheet, font and fetch declarations must first be pinned locally.
Snapshot pages have a CSP restricting requests to their frozen namespace. Inline
installed work code remains trusted: this workflow is not a new untrusted-code
sandbox. Arbitrary/dynamic dependency graphs are not automatically discovered;
missing or blocked dependencies stop readiness or rendering, never fetch live copies.

## Rules and evidence limits

- Technical: native dimensions/frame count and first-sample repeatability after seek.
- Text/layout: overflow, caption safe area, and unpinned fonts from exposed text
  metrics. Arbitrary custom canvas text is not inferred from pixels.
- Motion/camera: unusually large exposed 2D camera displacements between samples.
  This is a review heuristic, not motion quality, flash safety, or object tracking.
- Audio: full rendered PCM, nonfinite/clipped samples, exhausted sources, silent
  clips and quiet intervals in active clips. Quiet intervals need intent review.
- Visual: three contact-sheet images and the frozen preview for human review.
  This never awards an automatic artistic-quality PASS.

Sampling includes cuts, layer boundaries, keyframes and an even distribution;
it is capped at 120 frames. Both candidate count and selected frames are recorded.
Browser rasterization/system fonts can differ across machines. Imported project
fonts are hash-verified and loaded before measuring.

Export reads MP4 sample tables independently of encoding and decodes every video
sample. Audio sync compares 10 ms RMS envelopes over a ±250 ms lag search, with
one-frame tolerance. Decoded audio duration permits one frame or 50 ms codec padding.
This is not phoneme alignment or proof of correctness for all periodic/flat signals.
Final media remains a browser Blob and is discarded on cancellation or tab close.

## Legacy adapters and AI access

Created Canvas2D projects and compatible local managed adapters can use snapshots.
Unmanaged films keep their existing export path. Whiteout currently references
remote Google font stylesheets: snapshot checks explain that these must be pinned.
Its compatible legacy export remains available, with `snapshotId: null` and an
explicit unbound-source limitation in the receipt. Do not call that an immutable
or audited export. Migrating those authored sources is separate from this Studio phase.

Human and AI use the same renderer/check contracts. Browser automation can call
`await window.studioAudit.run(workId, ['technical', 'text', 'audio'])`, inspect the
returned JSON, call `studioAudit.cancel(workId)`, or read `studioAudit.report(workId)`.
The result includes the exact manifest; no provider identity or human approval is
invented. A completed export Blob has `.studioReport`, also exposed as
`window.lastExportReport`. Editing still uses validated operations and revisions.
Server-side audit workers, signed attestations, shared report history and integrated
AI repair jobs are not included in this browser runner.

## Verification

`make audit-studio` includes immutable source/history identity tests, path/symlink/
remote-dependency refusals, authentication, calibrated text overflow and audio shift,
real browser cancellation/retry/staleness/navigation and complete export decoding.
Existing audio-sync and source-package tests continue to reopen the generated files.
Only metadata-only snapshot requests are allowed during export; tests reject any
other upload. Test outputs contain JSON and screenshots, never rendered final videos.

Directory replacement monitoring now rebinds and rescans after parent rename events,
including inode reuse within one filesystem timestamp tick. This prevents a new
input file from disappearing between watchers. The existing race regression is
exercised repeatedly as well as in the complete Studio gate.
