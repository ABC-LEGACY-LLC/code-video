# Human and AI project editing

Whiteout and Zarra have managed layer editing. Whiteout also exposes shot timing, camera shake and sound cues. Open Studio, choose **Whiteout → Editor**,
then use **Layers** in the left sidebar to select part of the current shot.
Camera, visual layers and Mix have separate inspector controls. Visual properties
support shot-local keyframes. Annotations attach to a shot, frame and,
optionally, an element. **Copy AI context** gives an external agent the current
document, revision, selected frame and supported operations.

Other works retain their existing preview and source controls. Integrated model chat, editable 3D scene graphs and character body-part rigs are separate future adapters; the editor does not claim those capabilities.

## Authored data and procedural rendering

`projects/whiteout/project.studio.json` is the authoritative authored document.
It contains `schemaVersion`, the `project`, a monotonically increasing
`generation`, persistent undo/redo history, and recent request receipts. Project
state and history are committed in one atomic file replacement. The renderer
loads that same document over HTTP; use Studio or a local HTTP server, rather
than opening Whiteout with `file://`.

Schema 2 adds independently rendered visual layers. The migration preserves the
authored camera/Hero values, keyframes, annotations, request receipts and history
from schema 1. The disk migration makes a backup and requires the previous source
revision; it does not recreate the project from a default template.

For an existing schema 1 installation, capture a manifest while the old runtime
is stopped: SHA-256 of the exact project document bytes (`documentHash`), the
old runtime's `sourceRevision(root, work)` (`sourceHash`), and the document's
`generation`. Preserve the old renderer/evaluator/document for comparison.
Deploy the new runtime sources, then run:

```bash
node studio/migrate-layers.mjs whiteout --manifest /private/path/manifest.json
node studio/migrate-layers.mjs whiteout --manifest /private/path/manifest.json --apply
```

The first command is a dry run. The apply command refuses a document changed
since the manifest and keeps its generation. It migrates both history stacks;
only history revisions belonging to that validated old source are rebased.
Backups and rollback receipts are saved under `build/.migration-backups/`,
which the HTTP server cannot serve. `--rollback <receipt-file>` restores the
original document only if no subsequent edit or runtime change has occurred;
restore the matching old runtime files separately before restarting.

The shared schema and interpolation are in `core/project.mjs`. A project has an
ID, dimensions, rational FPS, shots, entities and annotations. IDs survive shot
renaming/reordering. Camera and object properties are finite, bounded numbers;
frame indices and durations are integers. Audio mute is a boolean. Keyframes
support linear, hold and ease interpolation. Values before the first keyframe
hold that first keyframe; values after the last hold the last one. A property's
base value applies when it has no keyframes.

Whiteout keeps its procedural drawings and simulation. `shot.sourceTiming` preserves
the original scene offsets. The editor upgrade bakes procedural character, haze and
title fades into editable opacity keyframes. Characters are composited once, so a
fade no longer exposes darker overlaps between arms, joints and the body.

Camera x/y/zoom, visual x/y/scale/rotation/opacity, camera-shake strength/frequency,
per-shot Mix gain/mute, and cue gain/mute/fades use the shared evaluator. Shake is
deterministic in live playback, scrubbing and export. Audio uses its own seeded RNG.
Live playback and export use the same offline mix.

Shot duration edits scale keys, layer ranges, annotations and cue starts/durations.
Keys that map to the same frame keep the later original key. Locked layers must be
unlocked before duration edits. Moving a shot keeps its local cues and entity IDs.
A cue can ring across the next cut; its duration is explicit. Generated footsteps
remain tied to the character simulation. Native media speed is explicit and is not
pitch-corrected or stretched when a shot duration changes.
Sound cue controls also expose the procedural voice parameters and an imported
file's start offset. Unsaved sound drafts survive refreshes and revision conflicts.

The completion release uses `core/editor-migration.mjs` with an exact old-runtime
manifest and durable backups. It preserves generation and receipts, upgrades both
history stacks, and rebases only entries matching the captured runtime and known
project hashes. A source mismatch remains a history conflict.

## Visual layers

Each shot contains the parts it actually draws: Background, Ground, Hero,
Opponent, Haze, Snow, and, where used, Speed lines, Impact art, Drop or Title.
Impact shots contain their graphic artwork rather than invisible character
placeholders. A layer has a stable entity ID, a renderer binding, and a place in
the shot's bottom-to-top `layerOrder`. The sidebar presents the topmost layer
first. Camera and audio are not visual layers.

Select a layer in the sidebar or directly on the canvas. A timeline clip immediately selects its element in the Inspector. **Follow playhead** selects the corresponding layer when playback enters another shot; manual shot selection pins the Inspector. Unsaved drafts prevent automatic switching. Picking prefers visible, unlocked characters, objects and text, then falls back
to the atmosphere and background. **Alt-click** uses the strict topmost painted
layer, including translucent haze. Use the inspector
to edit its name, transform, opacity, keyframes and visible frame range. Start
is inclusive and End is exclusive, both relative to the shot: `[0, 24)` shows a
layer on frames 0 through 23. These controls change visibility, not simulation
time, shot length or the audio score.

Visibility is saved and affects the exported video. **Solo is a preview tool**;
export temporarily clears Solo and restores it afterwards, including on cancel.
A lock prevents authored changes from both the UI and the operation API until
explicitly unlocked. Hidden or soloed-out layers still take part in simulation,
so revealing a Hero later does not reset its motion or alter generated footfalls.

Reordering changes the painting order. Adjacent siblings can be grouped into a
folder and ungrouped without changing their appearance. Folders organize layers
and inherit visibility, lock and frame-range restrictions; they do not introduce
another transform or blend operation. Character details such as cape, weapon,
breath and attached snow spray remain part of their character layer.

World-space layers follow the shot camera; screen-space layers stay in frame
coordinates. Existing titles remain world-space during migration to preserve the
old picture. Hero and Opponent transforms use their authored actor anchor; other
visual layers use the canvas centre. Rotation is in degrees and position offsets
use the authored 1920 × 1080 canvas pixels.

The output remains one canvas. Independent renderer passes and reusable buffers
provide layer control without allocating a permanent full-size canvas per layer.
A neutral opaque video matte remains beneath the editable Background, keeping
Solo and hidden backgrounds consistent between the preview and MP4 output.
**Add text** and **Import media** create new layers. Text has editable content,
font, color, alignment and dimensions. Images and videos are immutable,
content-addressed imports (PNG/JPEG/WebP/MP4/WebM, up to 18 MB each). Video frames
are decoded and awaited before scrubbing/export captures them. Its picture and
imported audio are separate. Whiteout accepts WAV/MP3/Ogg audio cues. Uploads
remain source assets; finished exports stay in the browser. Removing a layer or
cue preserves imported files so history can still restore it.

Layers can be duplicated or deleted with Undo. Canvas handles move, scale and
rotate an unlocked selection. Arrow keys nudge it; Shift gives larger steps or
15-degree rotation snapping. An animated property writes a key at the current
frame; an unanimated property updates its base. Escape cancels a drag.

The timeline has zoom, frame rulers, optional snapping, draggable keyframes and a
rendered waveform. Arrow keys move a focused key; Delete removes it. Moving a key
onto an occupied frame is refused. Waveforms invalidate after project changes.
Zarra exposes Background and four actual particle passes through the reusable
Canvas2D compositor; the original velocity and determinism checks still apply.
Masks, arbitrary blend-mode controls and character body-part rigs remain future work.

## Operations and history

- `GET api/project?work=whiteout` returns project, generation, revision,
  capabilities and history summaries.
- `GET api/context?work=whiteout&frame=100` additionally returns the shot-local
  frame, evaluated entity values, schemas and annotations.
- `POST api/operations` applies a validated batch.
- `POST api/proposal` validates operations and returns `before`/`after` without writing.
- `POST api/assets` imports bounded, type-checked, immutable media.
- `POST api/history` applies `undo` or `redo` using the same revision checks.

Every write requires `work`, `baseRevision` and a unique `requestId`. `actor` is
`human` or `ai`; it is an attribution label, while the server records the
authenticated identity separately. Both clients use the same validation and
operation service. The backend capability registry, not a client's min/max
attributes, determines permitted changes.

Layer operations use that same transaction service:

- `setLayer`: `{targetId, patch}` for visibility, lock, range or coordinate space.
- `renameLayer`: `{targetId, name}`.
- `moveLayer`: `{targetId, index}`; index is bottom-to-top among its siblings.
- `groupLayers`: `{shotId, targetIds, groupId, name}` for adjacent siblings.
- `ungroupLayer`: `{targetId}` for an organizational folder.
- `addLayer`: `{shotId, id, kind, name, content}` for text/image/video.
- `duplicateLayer`, `deleteLayer`, `setContent` manage editable artwork.
- `addAudio`, `duplicateAudio`, `deleteAudio`, `setCue` manage Whiteout sound cues.
- `setProperty`, `setKeyframe` and `deleteKeyframe` address visual entities by ID.

For example, an AI can set `snow:walk`'s opacity to `0.4` and move `hero:walk`
with two operations in a single revision-checked batch. Context includes layer
order and effective visibility/lock/range, including inherited folder settings.

```json
{
  "work": "whiteout",
  "baseRevision": "copy the revision returned by GET",
  "requestId": "a-new-unique-request-id",
  "actor": "ai",
  "label": "Slow push in during the walk",
  "operations": [
    {"type":"setKeyframe","targetId":"camera:walk","property":"zoom","frame":0,"value":1,"easing":"ease"},
    {"type":"setKeyframe","targetId":"camera:walk","property":"zoom","frame":46,"value":1.2,"easing":"linear"}
  ]
}
```

If any operation fails, the batch writes nothing. HTTP409 means the caller must
read the current state and review its intent. The UI keeps unsaved fields and
annotations when a conflict arrives; **Review latest version** shows the saved
values before the user applies their draft. It does not silently resubmit.

Retry the same request ID and payload after a lost connection. Within the
retained receipt window it returns `replayed: true` without applying twice.
Reusing an ID with different intent returns409. History retains100 undo states
and up to100 redo states; receipts retain the latest256 requests. A new edit
clears redo. Receipt retries older than that window still require a current
revision and are not an indefinite idempotency guarantee.

Revision hashes include the project, generation, local runtime sources/assets
and shared evaluator. External source edits invalidate an old request. Undo
refuses to restore a snapshot if source code or authored state has changed
outside its expected history. Code changes themselves are still reviewed and
reverted through source control; the project history does not restore old code.
Revisions do not pin remotely served font bytes. Imported media filenames are SHA-256 content addresses, and the asset API never replaces an existing asset.

Writers use an exclusive per-file lock, then check the source and document again
immediately before atomic replacement. Agents should use the HTTP/CLI operations
instead of writing the managed JSON directly: an external writer that ignores
the lock can still race the final filesystem check. A crashed process may leave
a lock file. Inspect its recorded PID and pending work before manually removing
it; the service never steals a lock based only on its age.

## Local command line for agents

Start Studio after `make setup`. The CLI uses the same HTTP service as the UI:

```bash
node studio/cli.mjs show whiteout
node studio/cli.mjs context whiteout --frame 100
node studio/cli.mjs preview whiteout --file /tmp/operations.json --revision REVISION
node studio/cli.mjs apply whiteout --file /tmp/operations.json --revision REVISION --request-id UNIQUE_ID
node studio/cli.mjs undo whiteout --revision REVISION --request-id ANOTHER_UNIQUE_ID
```

The operations file can be an array of operations or an object containing
`operations`, `baseRevision`, `requestId` and `label`. Writes require an explicit
revision. Keep the request ID printed to stderr when retrying. `STUDIO_URL`
selects another server or path prefix. The CLI defaults to actor `ai`; use
`--actor human` for manual changes. It needs no new AI provider credentials. In the Inspector, **Review an AI proposal**
accepts the same JSON, renders Before/Proposed frames without writing, and offers
Apply or Discard. Apply uses AI attribution and the same conflict/Undo rules.
Frame annotations can include a normalized rectangle drawn on the canvas. Copy
AI context includes a current preview image and its loaded document generation;
it asks for a reload if the rendered document is behind the saved project.
Access from outside the machine still uses Studio's existing session gate.

## Legacy source controls

`core/source-edit.mjs` parses JavaScript with Acorn, including inline scripts in
HTML. It changes exactly one literal numeric AST node in a uniquely identified
row. Scientific notation, comments, quoted braces and nested data are handled
without textual row guessing. Ambiguous targets and expressions are refused.
Server-owned rules cover Oq Ko'cha and Bir tomchi; fixture works may declare
their trusted rules in the works registry. Managed works must use operations.
Legacy source undo remains the existing in-page undo; durable project history
currently applies to managed projects.
The legacy write endpoint also requires `expectedValue`, the numeric value the
caller last read. A stale value returns HTTP 409 and requires a refresh.

## Export and verification

Video export remains in the browser and is saved to the user's disk. While an
export is active, mutations, work switching, seeking and source reloads wait;
the loaded renderer is used throughout. This protects the current editor's
loaded document. A complete immutable code/asset snapshot export system is a
later renderer task.

```bash
node --test studio/test/core.mjs
node --test studio/test/editor-ui.mjs
node --test studio/test/layers.mjs studio/test/layers-ui.mjs
node studio/test/whiteout-project.mjs
node studio/test/whiteout-layers.mjs
make audit-studio
```

Core tests cover schema validation, atomic rejection, persistent Undo/Redo,
revision conflicts, receipt retries, external edits, keyframes, source parsing,
path confinement, and the real HTTP/CLI path. Browser tests cover multi-field
transactions, reload/history, keyframes, annotations, draft/conflict handling,
work capabilities and export guards. Whiteout tests exercise actual pixels,
audio, pause/resume/seek and simulation isolation. Evidence goes to
`build/migration/whiteout-layers.json`. The optional `WHITEOUT_LAYER_BASELINE`
and `WHITEOUT_BASELINE` comparisons belong to the earlier layer/object releases.
This release intentionally changes character compositing and deterministic shake,
so exact pixel parity with those older renderers is no longer its acceptance test.
The current behavior tests cover those changes, including decoded media frames,
browser export, annotations, and proposal review.

The old `value.low > 150` whole-image claim is retained under `retiredClaims`, with
its replacement rationale. Current Whiteout claims measure bright snowfield
coverage (`lightField > 80%`), silhouette contrast (`value.range > 150`) and low
saturation (`< 6`). Each has a known-bad pixel calibration. Card prefers a fresh
input- and rule-matched audit; stale/unverified recorded values remain labeled as
history. Method counts and the recorded snapshot are under Technical details.

## Remaining adapters and extensions

The current release edits Whiteout and Zarra. Other Canvas, SVG, Python-audio and
SDF/3D works need work-specific adapters before the editor can expose their actual
semantic objects. A flattened film is not presented as independently editable
characters. Masks, character rigs, collaborative cursors, integrated model chat
and an immutable export-worker snapshot system are later extensions.
