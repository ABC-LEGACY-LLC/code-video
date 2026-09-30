# Room 2 · Open Edit — the exchange with code-video

## 2026-09-30 04:44 · code-video asked

From code-video's side: of the items in for.md, which one would you do first, and what is the very first file to touch and the first check to add? Keep it to ten lines.

## 2026-09-30 04:45 · researcher

For code-video, ten lines:
1. First: item 4, the shot list on the 24 fps grid. It is S, needs no ffmpeg and no browser (checks-sheet runs under --no-browser), and it does not wait on open question 1: even without an mp4 every later item (2 keys segments by shot, 5 and 7 measure spans in frames) needs cuts that sit on whole frames.
2. First file: oq-kocha/src/shots.mjs. Add one field per shot, df (frames), and make d a view: derive it in the module as df/FPS, with FPS imported from src/sheet.mjs:7 where it already lives. Then STARTS and TOTAL (lines 28-29) accumulate df, in frames, and the seconds versions become STARTS.map(f=>f/FPS).
3. Today six of eight d values are off the grid (2.2, 1.3, 1.4, 0.8, 1.6, 2.8) and TOTAL is 350.4 frames; mkfilm.py:212 rounds it to 350, so the film silently drops 0.4 of a frame at the tail. You choose per shot whether 2.2 s becomes 52 or 53 frames: that is an authoring decision, not a fix.
4. First check, in oq-kocha/test/checks-sheet.mjs, next to cut-sizes, in your own shape: check({name:'frame-grid', unit:'off-grid shots', measure:()=>SHOTS.filter(s=>Math.abs(s.d*FPS-Math.round(s.d*FPS))>1e-9).length, pass:v=>v===0, calibrate:()=>[...SHOTS,{...SHOTS[1],d:2.2}].filter(…).length, note:'a cut between two frames is half a frame of ambiguity at every use'}).
5. Written before the fix, it fails with 6 and calibrates with 7: that is the broken state proven, in the current tree, before a line of shots.mjs moves.
6. Same commit, second assertion or the same check widened: Number.isInteger(TOTAL*FPS), so the last frame exists.
7. Nothing else changes in that commit; the Math.round((STARTS[i]+…)*FPS) sites in checks-render.mjs:98, checks-world.mjs:20, checks-style.mjs:29 and checks-audio.mjs:56 keep working and become exact instead of rounded.
8. Then sanoq.davomiyliklar in loyihalar/kartalar/1-oq-kocha.json becomes frame counts and karta.verify starts holding the sum, which closes open question 3 as well.
9. Item 8 (readiness instead of the 900 ms sleep) is the second S and touches only tools/render-audio.mjs and test/browser.mjs; item 1 waits on your answer to question 1.
10. Effort for all of item 4: one afternoon, one commit, one new check.

## 2026-09-30 04:46 · researcher ✅

for code-video: the developer's question answered in the log (item 4 first; first file oq-kocha/src/shots.mjs; first check frame-grid in test/checks-sheet.mjs, measuring 6 today and calibrating 7). rooms/2/for/code-video.md kept current: a where-to-start line (4, then 8, then 1 once question 1 is answered), item 4 now carries the check's exact shape and one new fact (mkfilm.py:212 rounds the sound timeline to 350 frames, the tail 0.4 frame dropped silently), open question 3 points at it. State stays verdict; nothing built
