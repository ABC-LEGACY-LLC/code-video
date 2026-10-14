# Studio creator — phase 3

Create a new 2D video from **New project**. Choose a name, landscape / portrait /
square, 24 / 25 / 30 / 60 FPS and 1–600 seconds. Blank starts with one scene and a
background; Title sequence starts with three scenes, shapes and animated titles.
The selected duration is rounded to the nearest frame and distributed across the
starter scenes. No existing film source is copied.

## Human workflow

1. Open **New project**, choose settings and create. The project opens in Editor.
2. Expand **Shot** to add, duplicate, rename, reorder or delete a scene. At least
   one scene remains. Deleting a scene deletes its annotations; Undo restores both.
   Locked layers must be unlocked before deletion or duration changes.
3. In **Create layers**, choose Background or Shape and add a component. Change
   its typed properties in Inspector. Add text, image or video layers. Phase 5 can link video sound in Inspector.
   Numeric shape properties can be animated using the same keyframe controls.
   Layers start in screen space; choose World in layer settings for a layer that
   should follow the scene camera.
4. Open **Assets** to import, preview and reuse input media. **Add to selected
   scene** uses the shot selected in Editor, not an assumed playhead position.
   Missing media stays listed; reimport the original file to restore its hash path.
5. **Project…** renames or duplicates a created project and downloads its source
   ZIP. Projects reopens saved projects; there is no separate manual save step after
   applying an operation. Drafts must be saved or discarded before project actions.
6. Preview uses a 720-pixel longest edge for responsive editing; coordinates and
   project dimensions stay unchanged. **Project size** in Export uses the full
   authored resolution, and audit rendering defaults to the full size.
7. Use **Export video** to encode in the browser and save to your disk. The server
   stores authored source and imported input media, never the exported final video.

## AI and storage contract

Human and AI use the same API. Creation accepts an explicit `actor` (`human` or
`ai`) and unique `requestId` of 8–120 letters, digits, underscores, colons or
hyphens. Retrying an identical request returns the same project; changing its
payload with the same ID returns 409. Project IDs are server derived. Names are
never filesystem paths. Creation publishes an entire staged directory atomically.

```json
POST /api/projects
{
  "actor": "ai",
  "requestId": "creator-example-2026",
  "name": "Product story",
  "format": "16:9",
  "fps": 24,
  "durationSeconds": 12,
  "template": "title-sequence"
}
```

The response contains `work`. Read `/api/project?work=<id>` for the current
`revision` and advertised operations. Post ordinary revision-checked batches to
`/api/operations`; `/api/history` supports persistent Undo/Redo. Added operations:

| Operation | Fields | Result |
|---|---|---|
| `addShot` | `id`, `name`, `durationFrames`, optional `index` | Empty scene with camera, inserted at index or appended |
| `duplicateShot` | `shotId`, new `id`, optional `name` | New entity/group/note IDs; references remapped; copied animation |
| `deleteShot` | `shotId` | Scene and its annotations removed atomically |
| `renameProject` | `name` | Saved name also appears in Works |

`renameShot` and `moveShot` remain supported. Phase 4 adds explicit `trimScene`
and `stretchShot`; the historical `trimShot` operation keeps its retiming semantics
for existing callers. See [Editing](EDITING.md). Scene IDs supplied for create/duplicate have a
90-character limit so generated child IDs fit the stable-ID contract.

- `GET /api/assets?work=<id>`: owned imports and referenced media, names, size,
  use count and `ready` / `missing` / `invalid` status.
- `POST /api/assets`: `work`, base64 `data`, optional `name`; maximum 18 MB.
  Content-addressed files are immutable and checked before reuse.
- `POST /api/projects/duplicate`: `work`, `baseRevision`, `actor`, `requestId`,
  `name`. Copies assets to the new project's namespace and resets edit history.
- `GET /api/source-package?work=<id>&revision=<revision>`: source ZIP, maximum
  64 MB of input media. A stale revision or missing/changed media blocks the ZIP.

Created projects live in `studio/projects/created/<id>/`: `project.studio.json`,
a small `index.html` loading the shared player, and an immutable creation receipt
`work.json`. They are discovered automatically; `works.json` remains the legacy
registry. New folders and source edits are watched, including AI filesystem edits.
Imported assets live in `studio/assets/<id>/` and retain their original display
names in sidecars. Backup both directories along with the Studio runtime.

## Source package

Unzip, run `node serve.mjs` with Node 22+, and open the printed loopback URL.
Play/pause and a frame slider work without Studio or an npm install. The archive
includes the authored project, explicit runtime dependencies, imported media,
README and per-file SHA-256 manifest. It excludes sessions, credentials, account
identity, edit history and unrelated repository files. A source ZIP is a portable
preview/editable-code snapshot; importing a ZIP back into Studio is not implemented.

## Scope and verification

Creation, whole-project duplication and portable packages apply to Studio-created
Canvas2D projects using the built-in player. Customized runtime code is explicitly
refused by duplicate/package to avoid silently losing its dependencies; preserve
those projects through the repository. Existing films keep their documented editing capabilities.
Shapes provide rectangle/ellipse, fill, dimensions and corner radius; text uses
basic system font families. Imported video contributes picture only. Generic
audio, pinned fonts and captions belong to phase 5. The source package is not the
full audit/export snapshot system planned for phase 6.

`node --test studio/test/creator.mjs studio/test/creator-ui.mjs studio/test/creator-preview.mjs` exercises the
creation boundaries, reference remapping, history/conflicts, asset reuse/recovery,
AI comparison, browser export/reopen and independent ZIP playback. The broader
`make audit-studio` suite checks compatibility with existing works and audio export.
Release evidence is in `build/phase3/`.

Phase 5 extends Assets with audio and project fonts, and adds timed captions.
See [Audio and text](AUDIO-TEXT.md) for the workflow, operations and current limits.
