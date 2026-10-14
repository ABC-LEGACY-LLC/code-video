# Studio capability inventory

This inventory includes phases one through six. **Ready** means implemented
within the stated scope; it is not a claim that every renderer supports the feature.
**Partial** means an existing path needs generalisation. **Planned** means no complete
user workflow exists yet. Current test outcomes belong to the release receipt.

## Registered works

| Work | Preview control | Managed project | Editing scope |
|---|---|---|---|
| Oq Ko'cha | Frame seek | No | Legacy source controls and renderer hooks |
| Whiteout | Frame seek | Yes | Layers, text/media, shot timing/order, camera, keyframes and audio cues |
| Bir tomchi | Time seek | No | Legacy source controls |
| Mushuk | Live playback | No | Preview; no deterministic frame export contract |
| Not A Measurement | Live playback | No | Preview; no deterministic frame export contract |
| Tong kaptar | Frame seek | No | Renderer preview and existing work-specific tools |
| Zarra | Frame seek | Yes | Layers, text/media, camera and keyframes; no general shot timing/audio operations |
| Masofa maydoni | Sandbox | No | Its own interactive controls |
| Studio-created 2D projects | Frame seek | Yes | Full scene lifecycle, built-in background/shape/text/image/video, assets and source package |
| Motion graphics · SDK | Frame seek | Yes | Described components, typed properties, keyframes and common layer/shot operations |

Source: [works.json](works.json), [Editor](EDITOR.md), [page hooks](README.md).
Unregistered prototypes are not counted as supported Studio workflows.

## Platform capabilities

| Capability | State | Implemented scope and next boundary |
|---|---|---|
| Shared Human/AI operations | Ready | Managed projects use validation, revision checks and atomic batches; arbitrary source patches are separate |
| Durable Undo/Redo | Ready | Managed authored data; runtime source edits are not in the same undo history |
| Layer selection, visibility, lock, order, folders | Ready | Whiteout/Zarra; folders have no inherited transform |
| Canvas transform handles | Ready | Shift/Ctrl selection, multi-layer move, proportional scale, align/distribute and keyboard nudge on exposed geometry; rotation remains single-layer |
| Keyframes | Ready | Numeric properties, linear/hold/ease, multiple-key drag, copy/paste and collision checks |
| Timeline zoom, snapping, waveform | Ready | Managed keyframes and created-project clips share zoom/snapping; waveform shows the full mix or a selected generic audio clip |
| Text and imported image/video | Ready | Managed visual layers; basic fonts and 18 MB imports |
| Audio cue editing | Ready | Created Canvas2D projects: music/voice/SFX, gain/mute/solo/fades, sample-time automation, trim/split/offset, linked video audio; legacy films retain their adapters |
| Scene lifecycle | Ready | Created 2D projects support add/duplicate/rename/reorder/delete; Whiteout retains its existing timing/order controls; clip move/trim/stretch/split operate on created-project visual layers |
| Trim versus stretch | Ready | Created scenes use explicit trim with impact counts; stretch retimes keys/ranges/video; historical `trimShot` retains its old retiming semantics |
| Reusable composition | Ready | Canvas2D registered components with typed schemas; legacy names isolated in the compatibility catalogue |
| Project creation and reusable templates | Ready | Blank and three-scene title template; formats, FPS and initial duration; reopen and independent duplicate |
| Renderer/component registration SDK | Ready | Versioned renderer registration, capability flags, readiness/cancel/dispose and Canvas2D component maps; Three.js is future |
| Asset library | Ready | Project imports, previews, reuse and missing/changed-file detection; cross-project browsing is future |
| Portable source package | Ready | Created 2D projects; explicit runtime/media ZIP, file hashes, standalone preview; no package reimport yet |
| Caption track and pinned fonts | Ready | Created projects: timed wrapped text, styling, safe-area/overflow checks, project font assets awaited and hash verified; system fonts remain explicitly unpinned |
| Audio checks | Ready | Generic rendered PCM peak/clipping/silence/source checks; browser export sync regression tests; snapshot-bound browser runner with explicit coverage and limits |
| AI context and proposal review | Ready | External agent context, JSON operations, frame comparison and apply/discard |
| Integrated AI generation and repair | Planned | No complete model/job/render/review loop inside Studio |
| Untrusted code execution isolation | Ready | Temporary Code preview uses opaque-origin workers, denied network/storage, deadlines and Cancel; installed work pages remain trusted; no OS memory quota |
| Frame/region annotations | Ready | Managed project notes; they can be attached to an element |
| Audit results and provenance display | Ready | Browser snapshot profiles, progress/cancel/retry, findings navigation, local JSON reports and freshness; existing catalog claims/historical suites retained |
| Run/cancel audits from Studio | Planned | Checks currently run through commands |
| Render-semantic freshness | Ready | Explicit card `frame.project` projection; Whiteout opted in; undeclared files remain byte-based |
| Immutable render/export snapshots | Ready | Managed local source/asset bundles, SHA-256 identity, frozen preview/checks/encoder; remote dependencies must be pinned; legacy unbound exports are explicit |
| Browser export | Ready | Frozen encoder for compatible managed works; every video sample decoded, dimensions/count/duration and audio-envelope sync verified; video and receipt stay on user disk |
| Editable 3D world | Planned | Legacy 3D works and a camera type exist; no managed mesh/material/light scene graph |
| Recovery and migration | Partial | Revision-checked migrations and backups exist; complete project backup/restore UI is planned |
| Collaboration | Partial | Concurrent stale writes are rejected; no multiplayer presence or merge UI |

Implementation pointers: [operations](core/project.mjs), [store](core/store.mjs),
[SDK](SDK.md), [bindings](components/legacy.mjs), [composition](composition.mjs),
[editor tools](editor-tools.mjs), [timeline](timeline-tools.mjs),
[server](server.mjs), [fingerprints](../catalog/tools/fingerprint.mjs).

## Evidence limits

The selected Whiteout visual claims sample three frames, not every frame in the
film. Existing live-clock cards can vary with timing. Legacy remote fonts are recorded as
external dependencies without content pinning. A PASS applies to its rule, input
identity and coverage; it is not an overall artistic-quality or physical-accuracy score.

New project and AI workflows must report unsupported capabilities explicitly.
A flattened imported video remains a media layer until a separate, verified
decomposition workflow exists.

Phase 6 details, API and boundaries: [Audit and export](AUDIT-EXPORT.md).
