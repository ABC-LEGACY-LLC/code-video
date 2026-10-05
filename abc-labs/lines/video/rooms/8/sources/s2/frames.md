# s2 — the launch film, frame by frame

The video attached to the post [s1]: the 1920x1080 variant from the fxtwitter JSON
(`sources/s1/fxtwitter.json`), fetched 2026-09-30.

## How it was taken

`get.sh` in this folder, run as `labs room run 8 --image=docker.io/alfg/ffmpeg:latest -- sh /room/sources/s2/get.sh`.

- `video.mp4` (gitignored): sha256 `8fde4af2c829509e6cc8c77a3b1ddca3ec394de0e3865bc898381458cc806b49`
  (`video.sha256`); `probe.txt`: h264 1920x1080, 24 fps, 1950 frames, AAC 48 kHz stereo, 81.30 s,
  32,609,805 bytes.
- `frames/t000.jpg … t080.jpg`: 81 frames, one per second, scaled to 1280 wide; `tNNN` ≈ NNN.5 s
  (the per-second frames carry no exact time).
- `scenes/c001 … c084.jpg` with exact times in `scenes.txt` (scene score > 0.12). The cuts from
  66 s to 74 s come every few frames: that is the effects montage.
- `sheets/s01 … s09.jpg`: the per-second frames, 3x3 per sheet, in order (sheet k holds t = 9(k−1) …
  9(k−1)+8). Every second was read here.
- `captions/cap00 … cap02.jpg`: the caption band (1300x90 at x=310, y=915), 2 fps, 2 across,
  30 down, read in order (row r, column c = (2r + c) / 2 seconds from the sheet's start).
- `crops/`: enlarged moments — `chat-30.0.jpg`, `timeline-33.15.jpg` (the only sharp look at the
  timeline; 32.60–33.05 fall in a blurred camera move), `chat-54.0.jpg`, `tracks-60.0.jpg`.
- `audio.txt`: mean −12.6 dB, max 0.0 dB; one silence, 32.97–34.18 s. No speech-to-text was run:
  every spoken line is also burned in as a caption and was read from `captions/`.

## The film, in order

What is **filmed** (people, an office) and what is **screen** (Cardboard's interface, or a
graphic) are kept apart; screen text is quoted as read.

| time | frames | filmed / screen | what is on it |
| --- | --- | --- | --- |
| 0–23 s | t000–t022 | filmed | An office. A man at a desk with a phone; a second man arrives, a woman leans in. Captions: "Hi." "We're launching our desktop app tomorrow." "We need a launch video." "Okay." "Sure." "Alright." "Tomorrow?" "Tomorrow." "Yes." "But ask cardboard." The first man thinks, stretches, looks at the monitor. |
| 23 s | t023 | screen (filmed monitor) | A macOS Dock; the last icon before the Trash is Cardboard's (the ring logo); a pointer under it. |
| 24–27 s | t024–t027 | screen | Cardboard's start page: "What are we editing today, Adarsh?", a prompt box, "Drag and drop or click here to add your media files". Typed: "make me a" → "make me a vi" → "Greetings, make me a kinetic motion graphics launch video for yourself". Captions "Uh, make me a little", "no", "Greetings." |
| 28–29 s | t028–t029 | screen | The prompt replaced by a longer one (the wand icon beside the paperclip; the home page lists "Improve prompt" [s4 `home.txt:6`]): "Create a high-energy launch video for Cardboard driven by kinetic typography and motion graphics. Include bold, animated text highlighting core AI video editing features like smart cleanup, auto-reframing, motion graphics, and audio sync. Pair the visual graphics with upbeat, energetic background music and punchy sound effects synced to text transitions, keeping the pacing fast and engaging from start to finish." Model label "Opus"; "Send message". |
| 30 s | t030, `crops/chat-30.0.jpg` | screen | **The editor.** Mac window, tabs "Dashboard", "Frame Motion Style Proje…", "Cardboard Launch Kineti…"; "16:9", "Export ⌘E". Left: Library, "No media yet". Centre: "Your timeline is empty", "Import media ⌘I". Bottom: timeline ruler 0–45 s, "Drop media to start". Right, the chat: the prompt above, then "Working for 24s", "I'll start by reading the Cardboard skill and the current project state.", "Ran 4 commands and used 1 tool", "Thinking"; the input "Describe the edit…", model "Opus", a red stop button. |
| 31–32 s | t031–t032 | filmed | The man at the monitor. "Oh, that was fast." |
| 33 s | t033, `crops/timeline-33.15.jpg` | screen | **The timeline, filled**, 0:00 / 0:16, playhead 00:00:00.233. Four tracks, top down: "Guides" (✦ icon) with one clip "Grid guides"; "Titles" (✦) with one clip "Launch titles"; "Audio 2" with "ElevenLabs_2026-09-26T14_13_04_Isabell…"; "Vo…" with "MA - Wav Haven - The Main Event - No Lead Vocals.mp3". "Grid guides" and "Launch titles" each run from 0 to about 16.7 s (ruler: 5 s at x=589, 10 s at x=792 in the crop; clip end at x≈1065) as **one clip**. Left: a library of graphic thumbnails. A macOS "Finder" tooltip over the track header. |
| 34–42 s | t034–t042 | screen (the output) | Kinetic typography: "Your agent ✳ knows" / "how you cut." / "How you phrase things." (chips: "cut on action", "hold the beat", "let it breathe", "trim the fat", "kill your darlings", "cut to the rhythm", "land the moment", "the edit is the final rewrite") / "What you've made before." with a "Cardboard" sticker, "ADVISORY CARDBOARD CONTENT", a clapperboard; "craf(t)" in selection handles; a collage whose labels read like code ("scale(1.24)", "frame 214", "t += 0.016", "fps: 30", "rotateY(26deg)", "clamp(0, 1)", "dx = cos(a) * r"). Captions "Together, they make something" "neither could alone." |
| 43–46 s | t043–t046 | screen | A prompt, "create a launch video"; the **model menu** open: "Fable", "Opus" ✓, "Sonnet", "ChatGPT", "Cloud"; "Effort — Extra high" slider; then "Fable" chosen. |
| 47–48 s | t047–t048 | filmed | Two men at the monitor. "This is interesting." "I know." |
| 49–53 s | t049–t053 | screen (a graphic) | A conventional editor's panels (mixer, graph editor, "Comp 1", colour wheel, histograms, a many-track timeline) spread out in 3D and flattening. Captions "Oh. This is what video looked like." "Controls between you and the idea," "and this". |
| 54 s | t054, `crops/chat-54.0.jpg` | screen (a graphic of an editor) | A simplified editor: preview, one clip "Editor UI in 3D" on the timeline, and a chat titled "Video editing UI 3D space": "in one plain and overall align in one invisible box" → "Worked for 1m 44s" "Done. • Timeline is now one box. A single panel holds the header, ruler, lane and clip. • The new UI is one plane. Every piece sits in one aligned layout box." → "can you make the remaining boxes disapper when ui changes" → "Worked for 24s" "The leftover boxes now fade out as the UI forms, leaving the four aligned panels." Model "Opus". Caption "is the idea." |
| 55–58 s | t055–t058 | filmed | The two men. "Let me show you something." |
| 59–62 s | t059–t062, `crops/tracks-60.0.jpg` | screen | The chat reads "Stopped."; typed: "in the end show off some effects that i have created using cardboard"; model "Fable"; "Send message". At the left edge the same tracks: a pink clip, a clip whose thumbnail reads "how you cu…", "Eleve…", "MA - V…". |
| 63–64 s | t063–t064 | screen (graphic) | Black, the Cardboard ring logo. |
| 65–72 s | t065–t072 | screen (the output) | Effects montage: "So take it further"; a shot with person-detection boxes ("Person 80%"); a figure in a desert sliced into depth layers; flowers with detection boxes ("Flower 62%") and an ASCII overlay; paper-collage cut-outs ("let the tape…", "than it should", "a cut"); a grid of stills, "no one's seen yet."; a datamosh, "yet." Captions "A version that opens differently." "The same story in another language." |
| 73–77 s | t073–t077 | filmed | The men laugh; the woman: "Good job."; "Thank you." |
| 78–81 s | t078–t080 | screen (graphic) | "Cardboard" wordmark; "Available on your nearest Mac". |

## What this establishes

- A Mac app with Cardboard's name and icon exists and was screen-recorded (t023, t030: macOS traffic
  lights, Dock, "Finder" tooltip).
- Its chat lets the user pick **Fable, Opus, Sonnet, ChatGPT or Cloud**, with an effort setting
  (t045); the first three are Claude models, which fits the site's "bring your own Claude or Codex"
  [s5, s7].
- The agent announces that it reads **"the Cardboard skill and the current project state"** and
  reports **"Ran 4 commands and used 1 tool"** (t030). That is the vocabulary of a coding agent
  running shell commands and tools under a skill file, not of a UI automation.
- A generated motion-graphics sequence sits on the timeline as **one long clip per track**
  ("Launch titles", "Grid guides", 0 to ~16.7 s, t033): the typography of 34–42 s is not laid out
  as many text items on the timeline but held inside one graphic clip. The code-like labels in the
  collage (t042) are decoration; they do not show where the graphic comes from.
- The audio clips are files by name: one named like an ElevenLabs download of 2026-09-26, one a
  music track "No Lead Vocals.mp3" (t033). The film does not show whether Cardboard made either.

## What it does not establish

- That the 81-second film was assembled in Cardboard. The only timeline shown is 16 s long and holds
  the titles, a grid and two audio files (t033); the filmed scenes, the montage and the final cut are
  never shown on a Cardboard timeline. "Made on Cardboard" [s1] is the author's claim.
- What the agent receives or sends: no tool name, no command, no data structure is shown; "Ran 4
  commands and used 1 tool" is collapsed (t030).
- Anything about local processing, price or export checks.
- The effects in 65–72 s (detection boxes, depth slices, ASCII) as Cardboard features: the prompt at
  t062 says "effects that i have created using cardboard", which is the author's statement.
