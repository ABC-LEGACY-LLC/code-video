# s3 — the 60 s video from the post, what was taken from it

The extracts were made on 2026-09-29, before sources had folders, and stay where the pages already cite them,
in `work/source/` (paths below are relative to the room):

| what | where |
|---|---|
| the record, frame by frame with its timestamp: every label, command, URL; what each moment claims | `work/source/frames.md` |
| one frame per second (`t000`–`t059`) and every scene change (`c001`–`c024`), jpg | `work/source/frames/`, `work/source/scenes/`, `work/source/scenes.txt` |
| captions read continuously, six sheets at 5 frames a second | `work/source/captions/` |
| 67 enlarged crops of small type (`term-26.2-L`, `addr-32.5`, …) | `work/source/crops/`, made by `crops.sh`, `crops2.sh` |
| the speech, transcribed by machine (faster-whisper small.en) | `work/source/speech/transcript.txt`, made by `speech.sh`, `speech.py` |
| the file itself: ffprobe, sha256 | `work/source/probe.txt`, `work/source/video.sha256` |

The mp4 is gitignored (`work/source/.gitignore`); `get.sh` fetches it again. A frame is cited as `t0NN` or
`c0NN`, a crop by its file name.
