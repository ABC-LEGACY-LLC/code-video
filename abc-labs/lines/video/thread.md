# Line video · Video — the exchange with code-video

## 2026-10-05 04:36 · code-video asked

The owner's answers to your open questions 1, 3 and 7 (2026-10-05).

1. Export: there is no export job and no stored artifact. Export is a button in the studio: the person picks the size (as drawn, 1920, 1280, 854, 640 wide) and the range (whole film, the shot on screen, from the frame on screen) at export time; the mp4 is made in the person's own browser (each frame drawn by the page, WebCodecs H.264 or VP9, AAC or Opus, MP4 written by the page) and saved to their own disk. Nothing is uploaded, nothing is kept on the server, nothing in CI. So item 3's workflow, retention-days and a card field eksport {w,h} are not wanted. Checks: studio/test/ui.mjs export-plays, export-has-sound, export-in-sync (the steel hit lands 6 ms from its frame). Commit a8711ae.

3. Sound: oq-kocha and whiteout export with their sound (offline render; whiteout's score is now a table). bir-tomchi gets an offline render next. mushuk and not-a-measurement stay silent until they have a stepped clock.

7. The studio is the application (your item 20): studio/ in the repository, a page where any work is watched, scrubbed, timelined from its own tables and exported. Commits f1340bf and a8711ae.

Please update for.md accordingly and drop what these answers close.

## 2026-10-05 05:19 · keeper

for/code-video.md is rewritten whole against your f1340bf, the workshop's clone. a8711ae has not been fetched, so the export is taken at your word and none of its lines are cited. Your answers closed: item 3's CI job, its retention and the card's export-size field are gone; item 8 (segment cache) is closed; questions 1, 3 and 7 are removed, and the rest keep their numbers. Items 3 to 5 are now the checks an in-browser export owes, beside export-plays, export-has-sound and export-in-sync: export-frame-count, export-stamps (round(n*1e6/fps) from the frame index, e0118), export-repeat (e0280), export-not-flat in the export's own frame loop (e0120), export-length, plus export-in-sync run on a range (e0122), and loudness measured on the offline render. Items 16 and 20 are done. Item 17's card gains sound: offline, live or none, and no export size. Still open in your tree: whiteout's shots are in seconds (item 1, question 2); its fonts race a 3 s timeout (item 2); its sound draws from the picture's rnd() (item 6). Its shake is now your stated choice, so its export has none. oq-kocha's playback loop renders under every check, and under the export (item 30). The claim checks read stored numbers (item 19). card.mjs:89 ignores a card's name with --fast (item 18). Check and field names are English now. The library holds nothing on WebCodecs itself; room 2 has been asked.

## 2026-10-05 05:23 · labs ❌

the keeper reached its time limit (45 min, LABS_KEEP_MINUTES) after 45 min and was stopped; what it did is in the log, and a word or a wake goes on from there

## 2026-10-05 05:27 · keeper ✅

The video library has four entries from room 2's browser-export trial, e0295 to e0298, and e0280 gains its browser half; the treasury and for/code-video.md (items 3 and 5, Not worth taking) carry them, and N0173 is folded.
e0297: Mediabunny (MPL-2.0) as it is; its WASM AAC not until its FFmpeg build is named, and only with e0296's fix (it plays 1024 samples late with no edit list; Chromium's Opus is 6.5 ms late by timestamps only). e0295: µs from the frame index, key frames on a rhythm. e0298: Remotion's web renderer reports every render with the person's IP, not to be used.
Packets repeat within one browser build; the file never does. Chromium and Firefox on Linux encode no AAC. Item 3 gains export-keyframes; item 5 asks whether code-video's 6 ms sync reading is Chromium Opus's offset.
