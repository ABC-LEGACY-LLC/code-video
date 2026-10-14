# Audio, fonts and captions — phase 5

Studio-created Canvas2D projects now use the same decoded audio mix for playback,
waveforms, audio checks and browser export. Older films keep their own sound adapters.

## Human workflow

1. Import WAV, MP3 or Ogg through **Assets** or **Import media**. Select its audio
   clip in the timeline or Inspector, then choose **music**, **voice** or **sfx**.
   Each clip has gain, mute, fade-in and fade-out in seconds. Gain/fades support
   linear, hold and ease keyframes, evaluated at audio sample time.
2. Use **Sound on** in the preview, then Play. With sound enabled, picture playback
   follows the audio device clock. Pause/seek stops the old source. Reopening starts
   with sound off; this listening switch does not mute the exported film.
3. Drag an audio clip or enter In/Out to move or trim it. Left trim advances the
   source offset; split preserves continuous source time and the original fade envelope.
   **Fit fades to this clip** restarts the fades at a split segment's own edges. Source offset and playback
   speed can also be set directly in the Inspector. Speed changes pitch.
   An audio clip starts in its owner scene but may continue across subsequent cuts.
   Move/split/trim-in positions stay in that scene; reuse the asset in another scene
   to place a new clip there.
4. **Solo** is an authored mix setting, shared by all scenes and included in export.
   Any solo excludes other clips; a muted solo stays silent. The waveform can show
   the full mix or an isolated selected clip, including its gain and fades. Its
   horizontal position can be clicked to seek. Selecting another clip invalidates
   the isolated waveform.
5. Select a video and choose **Use this video’s audio**. Its existing input file is
   decoded for sound and linked to the video; no final render is uploaded. For a
   codec without a browser audio decoder, import a separate WAV/MP3/Ogg and use
   **Link timing**. This adopts the video's in/out, source offset and speed.
   Move, trim, stretch, split, duplicate and delete on the video also affect its
   linked audio. **Detach audio** allows independent timing. Gain/mute/fades remain
   separately editable while linked. A video has at most one linked audio clip.
6. Import WOFF, WOFF2, TTF or OTF in **Assets**, click **Use project font**, then
   choose it in the text Inspector. New text/captions default to the first attached
   font. Font and audio bytes are hash checked before decoding. Readiness waits for
   project fonts; failure is shown instead of silently substituting another font.
   System-font options remain available and are labelled; their metrics can vary
   across machines. Use fonts you can distribute. AI `addFont` may include license
   text, which is retained in source packages and `FONT-LICENSES.txt`.
7. **Add caption at playhead** creates a separate timed text layer. Change its text,
   font, size, color, alignment, background, padding and line height. Set In/Out in
   Inspector or timeline. Captions wrap inside their box; resize it for more lines.
   **Check text at frame** reports overflow, transformed safe-area violations and
   unpinned system fonts for visible text at that frame. Safe area is measured from
   every edge of the project frame; the default is 10%. It does not silently move
   authored text. Captions remain editable and are burned into the video export.
8. **Run audio checks** measures the rendered stereo PCM: peak/clipping, non-finite
   values, fully silent clips, source exhaustion and quiet spans of at least 0.5 s
   inside audible cues. Quiet spans are review candidates, not proof of a defect;
   intentional pauses and cancellation between tracks are possible. The report is
   invalidated after project edits. Export sync is calibrated in the browser test
   with an input tone whose source time is known, then the encoded file is decoded
   and compared within one video frame. Snapshot-bound audit jobs and export receipts are available in [phase 6](AUDIT-EXPORT.md).

## Shared operations

All operations use `/api/operations` with the current `baseRevision`, a unique
`requestId` and `actor: human | ai`. Batches are atomic and undoable. Read capabilities
before sending an operation; the new operations are advertised by created projects.

| Operation | Fields |
|---|---|
| `addAudio` | `shotId`, `id`, `name`, imported `src`, `durationFrames` |
| `setCue` | `targetId`, `patch` containing `frame`, `durationFrames`, `offsetSeconds`, optional `playbackRate` |
| `setAudioMix` | `targetId`, `patch` with `role: music | voice | sfx` and/or `solo: boolean` |
| `moveAudio` | `targetId`, `startFrame` |
| `trimAudio` | `targetId`, `startFrame`, `endFrame` (exclusive) |
| `resetAudioFades` | `targetId`; fit a split segment's fade envelope to its own boundaries |
| `splitAudio` | `targetId`, `frame`, new `id` |
| `linkAudio` / `detachAudio` | audio `targetId`; `videoId` for link |
| `duplicateAudio` / `deleteAudio` | `targetId`; new `id` for duplicate |
| `addFont` | `id` prefixed `font-`, `name`, imported `src`, optional `license` |
| `removeFont` | `id`; refused while text references it |
| `addCaption` | `shotId`, new `id`, optional `text`, `fontFamily`, `startFrame`, `endFrame` |

Gain, mute and fades use `setProperty`; numerical automation uses `setKeyframe`.
Caption style is `content.caption: {safeArea, background, padding, lineHeight}` and
uses `setContent`. Timing/transform/visibility use ordinary layer operations.
Video split/duplicate creates the paired audio ID `<new-video-id>:audio`; reserve
that ID in an AI batch. Scene/project duplication remaps link and asset identities.
Scene stretch also changes file-audio speed for generic Canvas2D projects; legacy
sound timing behavior stays with its adapter.

## Boundaries and verification

Inputs remain limited to 18 MB each. Decoded audio is bounded to 64 million channel
samples; one stereo render is limited to 32 million samples per channel (about
11 minutes at 48 kHz). Large jobs fail explicitly. Source decoding is browser
codec dependent; mono is copied to stereo, and multichannel sources use the first
two decoded channels. No pitch-preserving time stretch, audio effects bus, automatic
speech transcription or SRT/VTT import/export is included. These can be added on
the same operations and asset model. Source packages include fonts/audio and the
shared runtime; they run independently without the Studio service.

Run `node --test studio/test/av.mjs studio/test/av-ui.mjs` and `make audit-studio`.
Tests cover source timing, linked edits, atomically rejected changes, fonts/captions,
exact automation curves, calibrated clipping/silence failures and decoded browser
export sync. Evidence from this release is in `build/phase5/`; no rendered final
video is stored there or on the server.
