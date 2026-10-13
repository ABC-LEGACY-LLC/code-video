# Studio capability inventory

This inventory includes phases one and two from 2026-10-13. **Ready** means implemented
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
| Motion graphics · SDK | Frame seek | Yes | Described components, typed properties, keyframes and common layer/shot operations |

Source: [works.json](works.json), [Editor](EDITOR.md), [page hooks](README.md).
Unregistered prototypes are not counted as supported Studio workflows.

## Platform capabilities

| Capability | State | Implemented scope and next boundary |
|---|---|---|
| Shared Human/AI operations | Ready | Managed projects use validation, revision checks and atomic batches; arbitrary source patches are separate |
| Durable Undo/Redo | Ready | Managed authored data; runtime source edits are not in the same undo history |
| Layer selection, visibility, lock, order, folders | Ready | Whiteout/Zarra; folders have no inherited transform |
| Canvas transform handles | Ready | Exposed visual layers; no inferred body parts or arbitrary legacy objects |
| Keyframes | Ready | Numeric properties, linear/hold/ease, draggable timeline keys |
| Timeline zoom, snapping, waveform | Ready | Current managed editor; not a complete clip editing timeline |
| Text and imported image/video | Ready | Managed visual layers; basic fonts and 18 MB imports |
| Audio cue editing | Partial | Whiteout; video picture and imported audio are separate |
| Shot timing and reordering | Partial | Whiteout; no generic scene create/split/delete lifecycle |
| Reusable composition | Ready | Canvas2D registered components with typed schemas; legacy names isolated in the compatibility catalogue |
| Project creation and reusable templates | Planned | Registry and initial documents still require source authoring |
| Renderer/component registration SDK | Ready | Versioned renderer registration, capability flags, readiness/cancel/dispose and Canvas2D component maps; Three.js is future |
| Asset library and caption track | Planned | Import exists; cross-project browsing, pinned fonts and caption authoring need implementation |
| AI context and proposal review | Ready | External agent context, JSON operations, frame comparison and apply/discard |
| Integrated AI generation and repair | Planned | No complete model/job/render/review loop inside Studio |
| Untrusted code execution isolation | Ready | Temporary Code preview uses opaque-origin workers, denied network/storage, deadlines and Cancel; installed work pages remain trusted; no OS memory quota |
| Frame/region annotations | Ready | Managed project notes; they can be attached to an element |
| Audit results and provenance display | Ready | Catalog claims and historical suites; stale/unverified results are distinguished |
| Run/cancel audits from Studio | Planned | Checks currently run through commands |
| Render-semantic freshness | Ready | Explicit card `frame.project` projection; Whiteout opted in; undeclared files remain byte-based |
| Immutable render/export snapshots | Planned | The loaded renderer is protected during export, but sources/assets are not a complete frozen bundle |
| Browser export | Ready | Works exposing the required hooks; codec/audio availability depends on the browser and work |
| Editable 3D world | Planned | Legacy 3D works and a camera type exist; no managed mesh/material/light scene graph |
| Recovery and migration | Partial | Revision-checked migrations and backups exist; complete project backup/restore UI is planned |
| Collaboration | Partial | Concurrent stale writes are rejected; no multiplayer presence or merge UI |

Implementation pointers: [operations](core/project.mjs), [store](core/store.mjs),
[SDK](SDK.md), [bindings](components/legacy.mjs), [composition](composition.mjs),
[editor tools](editor-tools.mjs), [timeline](timeline-tools.mjs),
[server](server.mjs), [fingerprints](../catalog/tools/fingerprint.mjs).

## Evidence limits

The selected Whiteout visual claims sample three frames, not every frame in the
film. Existing live-clock cards can vary with timing. Remote fonts are recorded as
external dependencies without content pinning. A PASS applies to its rule, input
identity and coverage; it is not an overall artistic-quality or physical-accuracy score.

New project and AI workflows must report unsupported capabilities explicitly.
A flattened imported video remains a media layer until a separate, verified
decomposition workflow exists.
