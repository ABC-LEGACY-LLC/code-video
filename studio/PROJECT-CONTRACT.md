# Studio project ownership and renderer contract

These are the phase-one design decisions for implementing the general Studio core.
The current schema-2 editor remains supported. Interfaces described as targets
below are not new runtime APIs shipped in phase one.

## Authored representation and ownership

An authored project consists of its data, source components and referenced assets.
The project data is authoritative for exposed properties, keyframes, timing and
ordering. Source components are authoritative for drawing and procedural behaviour.
Renderers consume both; they must not maintain a second independently editable
copy of the timeline or silently replace project data with defaults.

| Concept | Owns | Current representation and target |
|---|---|---|
| Project | Identity, output settings and composition | Current `project` object; future manifest also references renderer/component versions and assets |
| Sequence | Ordered shots and total frame range | Current `project.shots`; preserve this mapping before introducing nested sequences |
| Scene | Reusable world and objects | Not yet separate; future scenes may be referenced by multiple shots |
| Shot | Frame duration, scene/camera choice and local animation | Current shot ID, `durationFrames`, entities and layer order |
| Object | Semantic identity, component and typed properties | Current entities; components later own their property schemas |
| Layer | Composition order, visibility, range and visual binding | Current layer metadata; a layer is not necessarily an entire character or a permanent canvas |
| Asset | Immutable content and metadata | Current content-addressed imports; future manifest includes type, duration/dimensions, origin and licence information |
| Camera | View and its animation | Current camera entities; independent camera/object time mapping is a later extension |
| Audio | Sources, cues, buses and automation | Current audio/mix entities; generic buses and media links are later extensions |
| Annotation | Human/AI review context | Current shot/frame/target/region annotation; never silently treated as a drawing command |

Stable IDs survive renames and reordering. Duplication creates new IDs. Removing
objects must resolve dependent animation, annotations and asset references explicitly.
Schema changes require a validated migration, backup and rollback receipt.

## Human and AI edits

Both submit the same validated data operations with a base revision and unique
request ID. A batch commits atomically, produces a new revision and retains its
actor/history. Duplicate requests are idempotent; stale revisions are conflicts.
The UI displays only operations supported by the selected adapter.

Future code edits run in a draft workspace. Their source diff, component interface
changes and authored-data changes must be reviewed and validated together before
promotion. The renderer cannot bypass the operation store to persist changes.
An AI provider's name does not stand in for execution evidence: retain actual
provider/model, job identity, attempts, inputs, output and observed checks.

## Time and deterministic frames

Project FPS is rational. Authored frame indices and durations are integers. Ranges
use inclusive start and exclusive end; media sample boundaries use the same clock.
A shot has local time and a sequence offset. Changing a shot's order retains its
local state. Trim, retime and media playback speed are distinct operations.

A frame request must evaluate the complete scene at the requested frame, regardless
of earlier seeks. No wall-clock animation or uncontrolled random stream may affect
a deterministic result. Seeded stateful simulation needs replay/checkpoints or a
closed-form evaluator. Preview and export use the same frame evaluation and wait
for required media decoding, shaders and fonts.

Determinism is checked in a declared environment. Do not promise identical GPU
pixels across devices or identical container bytes across browser encoders.
Tests compare the appropriate frames, samples, timestamps or encoded packets.

## Renderer SDK target for phase two

| Capability | Required meaning |
|---|---|
| Describe | Renderer/version, supported objects, property schemas, operations and audit channels |
| Load and ready | Validate inputs, resolve assets, expose progress and a useful failure |
| Render frame | Await one requested frame at specified dimensions/quality; return a completed frame |
| Audio | Declare offline sample support, channels, sample rate and time mapping |
| Select | Stable object IDs and geometry/object-ID data for picking, when supported |
| Inspect | Camera/object state and optional depth/material/mask channels |
| Cancel and dispose | Stop work and release memory, media, listeners and GPU resources |

Property schemas describe types, units, bounds/defaults, animation and controls.
Components register with adapters; names such as Hero or Snow belong to projects
or component libraries, not to the Studio core. Existing `__ready`, `__frameTo`,
`__prepareFrame`, `__renderAudio` and selection hooks become compatibility adapters.
Capability absence is explicit rather than inferred from a work's name.

Generated or imported executable code requires an isolated origin/process boundary.
It cannot inherit Studio cookies, filesystem access, provider credentials or write
APIs. Use a bounded message protocol, resource/time limits and cancellation.
Validate outputs as data before applying them to the authored project.

## Revision and evidence identities

| Identity | Purpose |
|---|---|
| Transaction revision | Detect every persisted edit and conflicting request; retains generation/history semantics |
| Render input hash | Identify authored inputs that can affect the render; includes schema, project, sources, assets and sampling contract |
| Snapshot ID | Future immutable source/asset/dependency bundle used by a render job |
| Audit identity | Render identity plus rules, thresholds, tool/environment versions and coverage |

Phase one's render projection excludes only known storage-envelope metadata from an
explicitly declared document. Names, annotations and all other project fields still
invalidate conservatively. Semantic exclusions can expand only with a versioned
contract and tests proving that renderers cannot consume those fields visually.

Record raw file hashes alongside semantic hashes for diagnosis. Legacy evidence
must be remeasured when the contract changes. A hash does not replace rendering;
a source-only test does not prove the encoded output; a VLM score does not prove
frame-exact timing or physics. Keep technical, semantic and Human review results separate.

## Export and acceptance

Final exports remain in the user's browser/disk. Source bundles and audit metadata
are distinct from finished video files. External/GPU generation is a later adapter
with an explicit execution, retention and model-terms decision.

Use [acceptance/scenarios.json](acceptance/scenarios.json) as the completion targets.
Each scenario must go through creation, Human edits, applicable AI edits, audit,
export and reopen verification. Known-bad variants establish that checks catch
the failures they claim. The shared [design budgets](DESIGN.md) apply to standard
benchmark scenes; expensive scenes report their measured limits instead of hiding them.
