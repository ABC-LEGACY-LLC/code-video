# Phase 4 — editing workflow

Projects, Scenes, Layers and Assets are the left navigation. Scenes select, jump
and reorder; the Inspector describes the selected object. Changes use the same
revision-checked operations as an AI client and one persistent Undo transaction.

## Clips and scene duration

Studio-created projects expose each visual element on a separate timeline lane.
Drag a clip body to move it within its scene; drag either edge inward to trim.
Zoom and snapping apply to these gestures. Snapping uses the playhead, scene edges
and other clip boundaries. Arrow keys on a focused clip nudge one frame; Shift
nudges ten. Escape cancels a gesture. Exact In / Out controls, Move, Trim, Stretch,
Split at playhead and Duplicate are available above the lanes. Out is exclusive.

- **Move** shifts the visibility interval, keyframes and attached annotations.
  Video keeps its source offset. Moving outside the scene is refused.
- **Trim** shortens the window and keeps animation speed and the original easing
  curve. Trimming a video's left edge advances its source offset.
- **Stretch** changes the duration, key times and video playback rate. Frame
  rounding that would merge keys, and unsupported media rates, are refused.
- **Split** keeps two independent layers, identical animation curves and continuous
  video source time at the split. Later attached annotations move to the right part.
- **Duplicate** initially overlaps its source; move the copy to its desired time.

In the scene Inspector, **Trim** is the default for created projects. Shortening
keeps keyframe times, clips intersecting layer/cue ends, removes layers/cues starting
past the end and removes notes outside the remaining scene or on removed layers.
The impact summary reports those changes before Apply; Undo restores the original.
Extending a scene adds time without stretching existing layers or cues.
**Stretch** scales layer intervals, keys, notes and cue timing; imported video rate
changes proportionally. For generic Canvas2D projects, file-audio speed and pitch change with the stretch. Legacy works
retain the duration operations advertised by their adapter.

Keyframes may now lie outside the scene (-216000 through 216000 frames). These
retained curve handles prevent trim and move from altering interpolation inside
the visible clip. The Inspector labels off-scene keys; the timeline shows keys
inside the scene. Adding keys still requires a valid current scene frame. Old
projects do not need a data rewrite; current project validation accepts both.

## Canvas and animation

Shift/Ctrl/Command-click adds or removes a canvas layer from the selection. Layer
checkboxes offer the same selection. All selected layers must be visible and
unlocked for a combined transform. The shared box moves them together; its corner
scales proportionally about the selection center. A single layer also has rotation.
Arrow keys on the transform box nudge one project pixel in screen coordinates;
Shift nudges ten. Rotated and camera-following layers use renderer geometry.

For two or more layers the Inspector offers left/center/right/top/middle/bottom
alignment within their combined bounds. Three or more support equal center spacing
horizontally or vertically. Animated transforms set a key at the playhead;
otherwise the base property changes. Alignment uses the currently rendered frame.
Generic Canvas2D previews show every selected transform during a gesture; older
custom painters can display the final multi-transform after commit.

Choose an animation property under the timeline. Add at playhead, Shift-select
multiple keys on one property, drag them together, Alt-drag to copy, or use Copy /
Paste at playhead. Occupied destinations are refused, never overwritten by a paste.
Arrow keys move a focused key, Delete removes it, and Enter jumps to it. Inspector
keyframe controls remain available. Copy data stays local to the browser tab.

Ctrl/Command-Z is Undo; Ctrl/Command-Shift-Z or Ctrl/Command-Y is Redo, outside text
inputs/dialogs. Native text editing keeps its own shortcuts. Saved state, field and
timing drafts, blocked edits, and revision conflicts remain visible. Gestures carry
the revision from pointer-down; an incoming AI/user edit cannot be overwritten by
an old gesture. Timing drafts are retained when the revision changes; discard them
to load current values before retrying. Refresh does not silently submit drafts.

## Shared operations

| Operation | Required fields |
|---|---|
| `moveClip` | `targetId`, `startFrame` |
| `trimClip` | `targetId`, `startFrame`, `endFrame` |
| `stretchClip` | `targetId`, `durationFrames` |
| `splitClip` | `targetId`, `frame`, new `id` |
| `trimScene` | `shotId`, `durationFrames` |
| `stretchShot` | `shotId`, `durationFrames` |
| `editKeyframes` | `targetId`, `property`, `frames`, `action` (`move`, `copy`, `delete`), `delta` for move/copy |

All use `/api/operations` with `work`, `baseRevision`, `requestId`, `actor` and an
operations array. `duplicateLayer` remains the clip copy operation. Selection and
alignment compile to standard property/keyframe batches. Locked parents, validation
failures and stale revisions reject the entire batch. The existing limit is 100
operations per transaction. Historical `trimShot` keeps its previous behavior for
compatibility; new clients should request `trimScene` or `stretchShot` explicitly.

Clip timing operations are advertised for created projects, not arbitrary legacy
procedural film painters. They edit one visual clip in one scene; moving clips
between scenes remains outside this phase. Phase 5 adds audio clip timing,
source offsets and linked video sound. Arbitrary component code still owns its frame-clock behavior; ordinary
clip moves carry authored property keys, not a rewrite of the component's code.
Generic audio, fonts and captions are documented in [Phase 5](AUDIO-TEXT.md). Audit snapshots are phase 6.

## Verification

`node --test studio/test/editing.mjs studio/test/editing-ui.mjs` checks retained
curves, video timing, lock and collision rejection, pointer/keyboard editing,
selection/alignment/scaling, draft conflicts and persisted history. The full
`make audit-studio` remains the compatibility and browser export/audio gate.
Phase-specific release evidence lives in `build/phase4/`.
