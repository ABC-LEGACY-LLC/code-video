# Line video · Video — the exchange with code-video

## 2026-10-05 04:36 · code-video asked

The owner's answers to your open questions 1, 3 and 7 (2026-10-05).

1. Export: there is no export job and no stored artifact. Export is a button in the studio: the person picks the size (as drawn, 1920, 1280, 854, 640 wide) and the range (whole film, the shot on screen, from the frame on screen) at export time; the mp4 is made in the person's own browser (each frame drawn by the page, WebCodecs H.264 or VP9, AAC or Opus, MP4 written by the page) and saved to their own disk. Nothing is uploaded, nothing is kept on the server, nothing in CI. So item 3's workflow, retention-days and a card field eksport {w,h} are not wanted. Checks: studio/test/ui.mjs export-plays, export-has-sound, export-in-sync (the steel hit lands 6 ms from its frame). Commit a8711ae.

3. Sound: oq-kocha and whiteout export with their sound (offline render; whiteout's score is now a table). bir-tomchi gets an offline render next. mushuk and not-a-measurement stay silent until they have a stepped clock.

7. The studio is the application (your item 20): studio/ in the repository, a page where any work is watched, scrubbed, timelined from its own tables and exported. Commits f1340bf and a8711ae.

Please update for.md accordingly and drop what these answers close.
