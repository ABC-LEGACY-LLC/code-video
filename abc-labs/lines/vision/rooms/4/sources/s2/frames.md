# s2 — the post's video, frame by frame

## How it was taken

- File: `video.mp4` (gitignored), fetched from the URL in the post's JSON (`sources/s1/fxtwitter.json`,
  `tweet.media.videos[0]`, the 1920x1080 variant). sha256 `c13237cad1fe294b1d993de152d91cedcc899a8e931b5128df7ff65d2102079b`
  (the registry's hash, `ad35b78bfcf8…`, is of the response as the CLI fetched it, with its `?tag` variant; the file is the same URL).
- `probe.txt`: h264, 1920x1080, 30/1 fps, 702 frames, 23.4 s, 13.0 MB. **No audio stream** — nothing is said;
  `audio.txt` is empty.
- `get.sh` (image `docker.io/alfg/ffmpeg:latest`, run with `labs room run 4`): one frame per second into
  `frames/t000.jpg … t022.jpg` (23 frames; `tNNN` ≈ NNN.5 s — the per-second frames carry no exact time).
  Scene detection at 0.12: **zero cuts** (`scenes.txt` empty).
- `motion.sh`: six consecutive frames (1/30 s apart) at 6.0 s and at 14.0 s, cropped and tiled
  (`motion/seq-6.0.jpg`, `motion/seq-14.0.jpg`), and ffmpeg's per-frame scene score over all 702 frames
  (`motion/scene_scores.txt`: mean 0.0064, max 0.0601 — one static camera, one continuous shot).
- Every frame was opened at full size. The overlay text is large enough to read without crops.

## The layout (every frame)

- **Top ~60 %**: the footage — a fixed camera, side-on, looking across an apron at a white A320 with
  **"condor"** titles and registration **9A-SHO** (a Croatian flag beside it), parked nose right at a stand
  marked **"C"**; another airliner (blue cheatline, partly legible "…andinavian") behind it at left; a terminal
  with a spectators' terrace across the top. Coloured rectangles with a label `<zone> · <state>` sit on
  the ground-support equipment around the aircraft.
- **Bottom ~40 %**, a dark panel: `GROUND TIME` with a large clock (`01:56` … `02:44`), the line
  `Condor A320 · Madeira`, the **roboflow** logo; a Gantt timeline with seven rows — `Rear stairs`,
  `Ambulift`, `Aft hold`, `Front hold`, `Fuel`, `Lav / water`, `Ground power` — axis ticks `02:00 02:10
  02:20 02:30 02:40`, a cursor at the current clock, bars (dim = present/positioned, bright = the active
  state, with the state written in the bar: `Unloading`, `Loading`, `Fueling`, `Servicing`, `Connected`,
  `Boarding`).
- **Top right**, from t001: an event log, the four newest lines, `<clock>  <event>`.

## The film

| frame | clock | on screen (labels verbatim) | event log (newest four, verbatim) |
|---|---|---|---|
| t000 | 01:56 | Title over the dimmed footage: **"Why was this flight late?"** / **"An AI watched the whole turnaround to find out."** Boxes: `Rear stairs · Attached`, `Aft hold · Positioning`, `Ground power` | (none yet) |
| t001 | 01:58 | `Rear stairs · Deboarding`, `Aft hold · Unloading`, `Front hold · Docked`, `Ground power · Connected` | 01:56 Passengers deboarding · 01:56 Ground power connected · 01:57 Aft hold: bags coming off |
| t002 | 02:01 | `Rear stairs · Attached`, `Aft hold · Unloading`, `Front hold · Unloading`, `Ground power · Connected` | + 02:00 Front hold: bags coming off |
| t003 | 02:04 | + `Fuel · Parked` (a fuel truck under the wing), `Ambulift · Arriving`, `Front hold · Docked` | same |
| t004 | 02:07 | + `Lav / water · Servicing`, `Fuel · Fueling`, `Ambulift · Raising` (the lift body raised to the front door) | 02:05 Fuel hose connected · 02:05 Lavatory service connected |
| t005 | 02:09 | `Lav / water · Parked`, `Aft hold · Docked`, `Ambulift · Parked` | + 02:07 Ambulift at front door |
| t006 | 02:12 | `Lav / water · Servicing`, `Front hold · Loading`; ambulift gone | + 02:11 Front hold: bags going on · 02:11 **Lavatory service connected** (a second time) |
| t007 | 02:15 | same states | same |
| t008 | 02:18 | same | same |
| t009 | 02:20 | `Lav / water · Parked`, `Front hold · Docked` | same |
| t010 | 02:23 | `Fuel` (no state); "condor" titles now fully visible | + 02:21 Aft hold: bags going on · 02:23 Fuel hose disconnected |
| t011 | 02:26 | `Rear stairs · Boarding`; aft-hold and front-hold boxes gone | + 02:24 Boarding started |
| t012 | 02:29 | `Rear stairs · Boarding`, `Lav / water · Parked`, fuel truck gone | same |
| t013 | 02:30 | `Rear stairs · Attached`; a belt loader driving back towards the front hold | same |
| t014 | 02:31 | Red banner, top left: **"! Front hold reopened after closing: bags off, then back on"**; `Front hold · Positioning`; a red marker on the Front-hold row at ~02:30 | + 02:30 **Front hold REOPENED** (in red) |
| t015 | 02:32 | banner; `Front hold · Positioning` | same |
| t016 | 02:33 | banner; `Front hold · Unloading` | + 02:32 Front hold: bags coming off |
| t017 | 02:33 | banner; `Front hold · Unloading` | same |
| t018 | 02:34 | banner; `Front hold · Unloading` | same |
| t019 | 02:36 | banner gone; `Front hold · Docked` | same |
| t020 | 02:39 | `Front hold · Docked` | + 02:36 Front hold: bags going on |
| t021 | 02:41 | stairs gone; `Lav / water · Parked` (the box stays on an empty spot), `Ground power · Connected` | + 02:39 Rear stairs removed |
| t022 | 02:44 | only `Ground power` (no state); cursor at the right edge of the timeline | + 02:43 Ground power disconnected |

**The pace.** The clock advances ~2.5–3 units per second of video from t000 to t012, slows to ~1 unit per
second across the reopened-hold episode (t012–t018), and speeds up again: 48 units in 22 s, the video
lingering on its one "finding". The units are minutes, not seconds: fuelling runs 02:05→02:23 (18 units),
bags off the aft hold 01:57 and back on 02:21 — realistic only as minutes — and in the six consecutive
frames of `motion/seq-14.0.jpg` (the *slow* stretch) a walking worker moves roughly a body width from one
frame to the next, far more than 1/30 s of walking. So the demo is a **time-compressed replay** of roughly
50 minutes of footage (the clock shows 01:56→02:44; the timeline starts a little before 02:00), played at
very roughly 60–160× — not the pipeline running live, and not 30 fps of the source.

## What this establishes, and what it does not

**Shown by the frames:**
- A real, fixed-camera, single continuous shot of a turnaround of Condor-titled A320 9A-SHO, labelled
  Madeira, ~48 minutes by the overlay clock — the post's "full 40 min turnaround" is of that order.
- A per-zone **state machine** over seven fixed service zones, each with a small vocabulary (`Positioning`,
  `Docked`, `Unloading`, `Loading`, `Parked`, `Fueling`, `Servicing`, `Connected`, `Attached`, `Deboarding`,
  `Boarding`, `Arriving`, `Raising`), drawn as rectangles on the equipment; a minute-resolution event log;
  a Gantt of the whole turnaround; one anomaly flagged (front hold reopened, bags off then on, ~02:30–02:39).
- The events are the ones the post names: stairs attached/removed, bags on/off per hold, deboarding/boarding,
  fuel hose, lavatory service, ground power. The post's "jet bridge attached" and "tug connected" do **not**
  appear: this stand uses stairs and an ambulift, no jet bridge, and the video ends before any pushback tug.
- Blemishes a viewer can check: "Lavatory service connected" is logged twice (02:05 and 02:11) with no
  "disconnected" between; the `Lav / water · Parked` box stays on an empty spot at t021; `Fuel` and
  `Ground power` lose their state label at t010/t022. Small, but it is a curated cut, and it shows them.

**Not shown — the post states these, the video does not:**
- **Any model.** No "GPT", "Sol", "Astra", "Luna", "Terra", "SAM3" appears on screen. The boxes are
  rectangles, never masks; nothing shows which step drew them.
- **Optical flow.** No flow field, no motion vectors, no per-frame signal; "bags on vs off … from optical
  flow at native 30fps" is invisible here, and the replay's own frames are seconds apart.
- **Cost.** No dollar figure, token count, frame count or sampling rate anywhere.
- **Accuracy.** No ground truth, no comparison between models, no "matched every event".
- **Why the flight was late.** The title asks it; no schedule, delay or cause is ever given — the reopened
  hold is flagged, not tied to a delay.
- **Rendering.** The panel is a produced motion-graphics layout (title card, banner, lingering pace); it could
  be drawn from the pipeline's JSON, or edited by hand — the frames cannot tell which.
