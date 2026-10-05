# The post's video, frame by frame [s9]

The mp4 the mirror names for the post (`sources/s1/post.json`, `tweet.media.videos[0].url`):
`https://video.twimg.com/amplify_video/2105354132051947520/vid/avc1/1080x1350/SALVDbSroWh83hsF.mp4?tag=29`

## How it was taken

All inside the room's container, 2026-10-01. The scripts are the record:

- `work/source/get.sh` (image `docker.io/alfg/ffmpeg:latest`) — the file, its probe, one frame per
  second, the scene changes, the audio levels.
- `work/source/crops.sh` — 18 enlarged crops (`work/source/crops/`) and 7 sheets, one per shot, at
  4 frames a second (`work/source/sheets/`), so a whole turn of a model is on one page (the shelf's f0089).
- `work/source/speech.sh` — the audio as a 16 kHz WAV, then speech to text (`faster-whisper`,
  `small.en`, int8, CPU) in `python:3.12-slim`.

| | |
|---|---|
| sha256 of `video.mp4` (whole file) | `2b0df7d60d84f3e59083d3c51b87d57d3ac8158f00605b00a5dc629c0cb1856b` (`work/source/video.sha256`) |
| size, duration | 8,444,765 bytes, 38.549 s (`work/source/probe.txt`) |
| video | h264, 1080×1350, 30 fps, 1,155 frames |
| audio | aac, 48 kHz stereo; mean −18.3 dB, max −1.7 dB, no silence of 0.7 s or more (`work/source/audio.txt`) |
| frames | 38, `work/source/frames/t000.jpg` … `t037.jpg` — `tNNN` is about NNN.5 s, not an exact time |
| scene changes (exact) | 7.5 s, 11.0 s, 14.5 s, 17.4 s (`work/source/scenes.txt`, threshold 0.12) |

The other shot changes (about 23, 28 and 34 s) are slides, not cuts — a panel moving in from the
right, caught half-way in `t017.jpg` and `t028.jpg` — so the scene detector did not fire on them;
their times are read from the per-second frames and are good to a second. The mp4 and the WAV are
git-ignored (`work/source/.gitignore`); the frames, crops and sheets stay.

All 38 frames were opened at full size.

## The film, in order

Every shot has the same dark background with drifting orange sparks. No shot shows the lab's own
interface, a terminal, a browser or Blender: the whole film is title cards over renders of models.

| time | frames | what is on screen | the words, as read |
|---|---|---|---|
| 0.0–7.5 | t000–t007, `sheets/robot-turn.jpg` | Two renders of one white-and-blue armoured robot, side by side, turning together: front (t000–t001), three-quarter (t002–t003), side (t004), from behind (t005–t007). Arms hang down and slightly out. Orange ellipses ring the chest lettering in the first second. A small inset between them, a T-posed robot on a light grey ground, until about 3.5 s. | "Low poly. High quality." / "No API. No cloud." / "ORIGINAL" · "PIXEL MATCH" / "966,626 faces · 34.7 MB" · "5,000 faces · 3.0 MB" / inset: "your picture" |
| 7.5–11.0 | t008–t010, `crops/chest-original-8.5.jpg`, `crops/chest-pixelmatch-8.5.jpg` | The two chests, close, front view, still. Left: black glyphs that are no letters, above a readable "07". Right: "VANGUARD" above "07". The inset shows the picture's own chest: "VANGUARD", "07". | "Details stay exact." / "Pixel Match keeps real pixels." / "Exact wherever the picture sees. On by default in Finish." / "image-to-3dlab" |
| 11.0–14.5 | t011–t014, `crops/eyes-*.jpg`, `crops/patch-*.jpg` | A hooded, red-haired figure, close, front view, still. Left: two brown smears where eyes should be, and a black blot on a white chest patch. Right: drawn eyes with pupils, and a black five-pointed star on the patch. Ellipses ring both from 12 s. The inset is a flat, anime-style drawing with the same eyes and star (`crops/inset-adventurer-12.5.jpg`). | same title and caption as the shot before |
| 14.5–17.4 | t015–t016, `sheets/wireframe.jpg`, `crops/wire-pixelmatch-14.9.jpg` | The robot again, as wireframes, turning. Left: so dense it reads as a solid silhouette. Right: a few thousand irregular triangles, large on flat armour, small at hands and feet; no rows of quads anywhere. | "Same model." / "193× fewer faces." / "966,626 faces · 34.7 MB" · "5,000 faces · 3.0 MB" |
| 17.4–23.0 | t017–t022, `sheets/dragon.jpg` | A red dragon with cream belly plates and spines, ORIGINAL above, PIXEL MATCH below, turning from its left side to behind. | "Dragon" / "193× fewer faces" / "ORIGINAL · 964,860 faces · 33.3 MB" / "PIXEL MATCH · 4,998 faces · 2.5 MB" |
| 23.0–28.0 | t023–t027, `sheets/hound.jpg`, `crops/hound-back-*.jpg` | A black hound with a spiked collar and glowing cracks, same layout, turning from its left side to behind. | "War hound" / "193× fewer faces" / "ORIGINAL · 963,820 faces · 32.7 MB" / "PIXEL MATCH · 4,993 faces · 2.3 MB" |
| 28.0–34.0 | t028–t033, `sheets/adventurer.jpg`, `crops/adv-back-*.jpg` | The hooded figure, whole, same layout, turning from the front to behind; a round shield on the back. | "Adventurer" / "197× fewer faces" / "ORIGINAL · 985,686 faces · 37.3 MB" / "PIXEL MATCH · 4,996 faces · 2.7 MB" |
| 34.0–38.5 | t034–t037 | End card, text only. | "image-to-3dlab" / "v0.3.5 · Finish + Pixel Match" / "Low poly. High quality." / "No API. No cloud." / "github.com/Bingeljell/image-to-3dlab" |

The "×" figures agree with the face counts on screen: 966,626 / 5,000 = 193.3; 964,860 / 4,998 =
193.1; 963,820 / 4,993 = 193.0; 985,686 / 4,996 = 197.3 (this room's arithmetic).

### What is said

Nothing. The sound is music from the first second to the last. The speech model returned the
single word "the" seven times at an average log-probability of −1.31, and "Thanks for watching, and
I'll see you next time." over the last 1.4 s with a no-speech probability of 0.75
(`work/source/speech/transcript.txt`) — the filler such a model writes over music, not words in the
film. Heard by a machine; nobody listened.

## What differs between the two sides, shot by shot

Read from the frames; "left/right" is as the viewer sees it.

**Where the picture looks (the front).**

- Robot chest: garbled glyphs → "VANGUARD", every letter readable at ×3 (`crops/chest-pixelmatch-8.5.jpg`).
  "07" is readable on both sides. Turned about 30°, the lettering on the PIXEL MATCH side still reads
  "VANGUARD 07" (`crops/robot-angle-pixelmatch-2.5.jpg`, t002).
- Robot forearms, front: the hazard stripes are sharper-edged on the PIXEL MATCH side (t000).
- Adventurer: smears → drawn eyes; blot → star (t012–t014). The PIXEL MATCH face and scarf carry the
  drawing's flat cel shading and outline strokes; the ORIGINAL's are soft and painterly.
- Silhouette: the PIXEL MATCH robot is visibly faceted — helmet, shoulders, hands (t000, t008); the
  hound's fur spikes and the dragon's spines are fewer and coarser (t019, t024).

**Where the picture does not look (the sides and the back).** The two sides are not the same paint.

- Robot from behind (`crops/robot-back-original-7.0.jpg`, `crops/robot-back-pixelmatch-7.0.jpg`): the
  ORIGINAL's thighs, calves and hips are blue with white panels; the PIXEL MATCH ones are almost all
  white. The ORIGINAL's rear forearms are plain grey and white; the PIXEL MATCH rear forearms each
  carry a block of broken yellow-and-black stripes. The hands are dark grey on the left and streaked
  blue and white on the right.
- Robot from the side (t004): a smeared yellow-and-black block across the side of the PIXEL MATCH
  forearm; none on the ORIGINAL.
- Hound from behind (`crops/hound-back-*.jpg`, t027): the ORIGINAL's rump and tail are plain dark
  grey; the PIXEL MATCH ones are flecked with red marks, many of them on the fur spikes. The cracks
  glow orange-yellow on the ORIGINAL and flat red on the PIXEL MATCH side in every view (t023–t026).
- Adventurer from behind (`crops/adv-back-*.jpg`, t033): the ORIGINAL's shield carries a painted
  emblem — pale, with a yellow-orange shape at its centre; the PIXEL MATCH shield is one flat brown.
  Boot cuffs: brown → light orange. Hood: dull green → bright teal, in every view.
- Dragon (t018–t022): the PIXEL MATCH flank shows a pattern of scales the ORIGINAL's smooth flank
  does not; from behind, pale blotches on the PIXEL MATCH wing membranes.

**The inset and the models are in different poses.** The robot's "your picture"
(`crops/inset-robot-0.5.jpg`) stands in a T-pose: both arms straight out at shoulder height, hazard
stripes on the forearms. Both models stand with their arms down at their sides (t000). The close-up
inset (`crops/inset-robot-chest-8.5.jpg`) shows the same horizontal arms. The adventurer's inset is a
bust and does not settle the question for that model.

## What this establishes, and what it does not

**Establishes.**

1. On the surface the picture faces, the PIXEL MATCH models carry the picture's own marks where the
   ORIGINAL models carry look-alikes: one word, one star, one pair of eyes, on two models. That is
   the claim of the post, and the frames agree with it for these two.
2. The models are shown from every side, not only the front: four of them make at least a half turn.
3. The low-poly meshes are triangle soups from a decimation, not quad retopology — which is what the
   code says it produces (`scripts/blender_retopo_bake.py:239-255`, [s2]).
4. In this film the unseen sides of a PIXEL MATCH model are **not** the ORIGINAL's unseen sides.
   Something repainted them: colours moved, an emblem went, stripes and red marks appeared where
   the ORIGINAL has none.
5. Nothing rigged and nothing animated is shown. Every model turns as one rigid object. No skeleton,
   no weight view, no pose change, no walk.
6. It is an edited promotion, not a recording of the tool: title cards, slides, no interface. None
   of the shelf's tells for a live recording (f0092) apply, because nothing live is on screen.

**Does not establish.**

- **Which stage changed the backs.** The repository has three candidates — the bake of the old
  texture onto the decimated mesh, the optional Hunyuan repaint ("Also repaint the sides and back"),
  and Pixel Match's own palette shift and anything it lets through — and the film names none. A
  gain-and-offset per colour channel cannot turn a painted emblem into flat brown or draw stripes,
  so the repaint is the likeliest; that is this room's reading, not a thing a frame shows.
- **Why the picture is a T-pose and the models are not.** Pixal3D generates in the input view
  [s8], so a model made from that picture would stand in that pose. Either the inset is not the
  picture these two models were made from, or the models were re-posed before the film. The second
  would mean a rig existed; the film shows neither.
- **Exactness.** "Readable" is what a frame can show. Whether the pixels are the picture's pixels
  — and how far off they sit on a curved or slanted surface — needs the model and the picture, not
  a 1080-pixel render of them.
- **Anything about a failure.** Five models chosen by the author, all single objects, all facing
  the camera squarely. No small label on a curved surface, no text on a side, no thin part.
- **Speed, memory, or that it ran on the machine named.** No clock, no terminal, no hardware.
