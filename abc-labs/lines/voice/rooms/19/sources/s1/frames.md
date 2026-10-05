# [s1] The Short, as far as this machine could read it — 2026-10-01

`https://youtube.com/shorts/9vBJ880VPT8` — Ruslan Gapirov, "Из чего сделан звук ДОЖДЯ на самом деле".

**The film was not seen and not heard.** Everything below is the oEmbed record, eight
still images YouTube serves for the video, and one third-party counter. No frame sequence, no
audio, no transcript, no description, no length.

## How it was taken

1. One try at the file, in the room's container, as `/room-video` says:
   `labs room run 19 --image=docker.io/jauderho/yt-dlp:latest -- yt-dlp -f "bv*[height<=720]+ba/b"
   --merge-output-format mp4 --write-info-json --write-subs --write-auto-subs --sub-langs "ru,en"
   -o "/room/sources/s1/video.%(ext)s" "https://www.youtube.com/shorts/9vBJ880VPT8"` → exit 1,
   `ERROR: [youtube] 9vBJ880VPT8: Sign in to confirm you’re not a bot.` (2026-10-01 18:11 UTC; the
   room's log has the line). The third refusal from this machine: room 3 on 2026-09-30 (f0042),
   the lead's home today (`sources/leads/L0019/lead.json`, `note`), and this. Not retried; no
   cookies, no sign-in.
2. `get.sh` (image `docker.io/alfg/ffmpeg:latest`, wget): the raw oEmbed record twice (watch
   and shorts URL), eight thumbnail addresses, one public counter, four public mirrors.
   Hashes in `fetched.sha256`.
   - `oembed.json`, `oembed-shorts.json` — 200.
   - `thumb-{hqdefault,sddefault,maxresdefault,hq1,hq2,hq3,oar2,frame0}.jpg` — 200, all eight.
   - `ryd.json` (returnyoutubedislikeapi.com) — 200.
   - Piped (kavin.rocks, adminforge.de) and Invidious (nadeko.net, yewtu.be) API — 403, all four.

## What the records say

- **oEmbed, raw** (`oembed.json`): `title` = "Из чего сделан звук ДОЖДЯ на самом деле
  #sounddesign #эксперимент #asmr #ambisonics  #искусство" ("What the sound of RAIN is really made
  of"); `author_name` = "Руслан Гапиров. Sound Expert"; `author_url` =
  `https://www.youtube.com/@gapirus`; `thumbnail_url` =
  `https://i.ytimg.com/vi/9vBJ880VPT8/hqdefault.jpg`. This confirms the secretary's second-hand
  reading (`idea.md`) from the raw record; the address is `hqdefault.jpg`, not `hq2.jpg`.
- **`ryd.json`**: `viewCount` 4 288 514, `likes` 174 146, `dateCreated`
  2026-09-15T03:24:52Z. `dateCreated` is the day that service first recorded the video, so the
  film was public **on or before 2026-09-15**; it is not YouTube's upload date, and the counts are
  that service's copy of YouTube's, read 2026-10-01. (Later the same wake: the maker's own
  Telegram post with this link is dated 2026-08-25, and says what the film does — [s3]
  `sources/s3/page.txt:161-175`. That is the better date and the only description.)

## What the stills show

| file | size | what is on it | words read |
|---|---|---|---|
| `thumb-maxresdefault.jpg` (= `hqdefault`, `sddefault`, smaller) | 1280×720, the 9:16 picture in the middle | Top half: a dark panel with an oval world-map-style projection of a sphere, a hexagonal grid, axis labels; a bright yellow-orange patch along the top edge, two cyan patches just under it left and right of centre, two magenta patches low down at about ±60° left and right. Bottom half: a hand holding a green leaf, partly wet, over a terracotta-coloured bowl with water drops on its rim. | on the panel: "Back", "Left", "Front", "Right", "Back" along the equator; "−180° … 180°"; "30°", "−30°", "−60°"; "Bottom" |
| `thumb-hq1.jpg` | 480×360 | A man in a black "Star Wars 1977" T-shirt talks to the camera indoors. Watermark top left. | watermark "GAPIRUS / gapirus@bk.ru"; caption "из чего ЗВУК ДОЖДЯ сделан" + "на самом" ("what the SOUND OF RAIN is made of" / "really") |
| `thumb-hq2.jpg`, `thumb-oar2.jpg` (the same moment, 1080×1920) | | The same man, gesturing. | caption "Кое-что заб" (cut mid-word: "Something …") |
| `thumb-hq3.jpg` | 480×360 | The same man. | caption "Пок" (cut mid-word) |
| `thumb-frame0.jpg` | 268×480 | The same man, no caption. | watermark only |

## What this establishes, and what it does not

**Establishes**

- The title, the channel and the handle, from the raw record.
- The film is a talking-head Short with word-by-word burned-in Russian captions, whose
  opening words repeat the title (`hq1`).
- Its chosen cover puts two things side by side: a **directional energy map on a sphere** (the
  labels Front/Left/Right/Back/Bottom and the ±180° azimuth, ±60° elevation scale are how a
  spatial-audio — ambisonic — sound field is drawn) and **a leaf held over a bowl with water**.
  So "ambisonics" is not only a tag: a spatial sound-field display is in the picture.
- On that one map, the energy is strongest at the top (above the listener), with weaker
  patches lower down left and right.

**Does not establish**

- What the map is a map **of** (real rain recorded with an ambisonic microphone, a mix, or the
  leaf experiment), which program draws it, or what moment it shows. One still.
- What the leaf and the bowl are for: a single drop on a leaf as the unit a rain sound is built
  from, a foley substitute, or an illustration. The reading "a rain sound is made of single drops
  hitting surfaces, and he shows one" is a **guess from one still**, and is written as one.
- Anything he says after the first sentence; the length; the upload date; the description;
  whether a method, a file or a product is offered.
- Anything about the sound. Nothing was measured: there is no audio here.
