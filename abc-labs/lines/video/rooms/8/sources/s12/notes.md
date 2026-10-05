# s12 — palmier-io/palmier-pro, read at eeafde2 (2026-09-25T18:03:01-07:00)

Cloned into `work/palmier-pro` (`--depth 20`). Read as far as the verdict needs: README, licence,
the agent's tool list.

- `README.md:2,95,112-118`: releases through v0.7.6 and source through the `last-gpl-source` tag
  are GPLv3; later binary releases are proprietary and their source is not published.
- `README.md:44,56,60-69`: a macOS editor; "When the app is open, it exposes an MCP server at
  `http://127.0.0.1:19789/mcp`"; `claude mcp add --transport http palmier-pro …`, `codex mcp add …`;
  a bundled mcpb for Claude Desktop (`:89`).
- `Sources/PalmierPro/Agent/Tools/ToolDefinitions.swift` (1436 lines): tools include `get_timeline`,
  `inspect_timeline`, `create_timeline`, `add_clips`, `insert_clips`, `move_clips`, `split_clips`,
  `remove_clips`, `set_clip_properties`, `set_keyframes`, `add_captions`, `remove_words`,
  `remove_silence`, `get_transcript`, `apply_effect`, `apply_color`, `export_project`, `read_skill`,
  `generate_video|image|audio` (lines 9-74).
- `get_timeline` (`:87-88`): project settings (fps, resolution, totalFrames), tracks with a stable
  `trackId`, clips as `[start, end)` in timeline frames, end exclusive, `gaps` listed per track.
- `inspect_timeline` (`:99`): the composited frame the user sees, "Each image carries a 0–1
  coordinate grid over the canvas (origin top-left) and its frame number burned into the top-left
  (f157). Metadata lists, per rendered frame, the clip ids visible on screen top-down … so what you
  see maps straight back to the clips to edit."
- `create_timeline` with `from` (`:110`): a full copy — "the versioning primitive".
