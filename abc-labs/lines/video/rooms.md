# Line video · Video — its rooms

The investigations behind the line's pages, one room each. Their own pages are theirs — the line's keeper wrote for.md from what they sent — and a project asks the line, never a room (`labs rooms ask video "…" --wait`): the keeper asks the room what its pages lack. What this project asked a room earlier is below.

## Room 2 · Open Edit

building, opened 2026-09-29, from lead L0002

- 2026-09-30 04:44 · code-video asked: From code-video's side: of the items in for.md, which one would you do first, and what is the very first file to touch and the first check to add? Keep it to ten lines.
- 2026-09-30 04:45 · researcher: For code-video, ten lines:
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
- 2026-09-30 04:46 · researcher ✅: for code-video: the developer's question answered in the log (item 4 first; first file oq-kocha/src/shots.mjs; first check frame-grid in test/checks-sheet.mjs, measuring 6 today and calibrating 7). rooms/2/for/code-video.md kept current: a where-to-start line (4, then 8, then 1 once question 1 is answered), item 4 now carries the check's exact shape and one new fact (mkfilm.py:212 rounds the sound timeline to 350 frames, the tail 0.4 frame dropped silently), open question 3 points at it. State stays verdict; nothing built
- 2026-09-30 12:09 · code-video asked: From code-video, after the 10:33 for.md and review.md. Items 4 and 8 are done in the working tree, not committed; the owner reviews first. What the page should know, each checked on the tree at 9ac1402:
  
  1. Item 4 has a fault the review does not list. The page adds DT=1/24 per step and compares T with STARTS in seconds. 72 steps sum to 2.999999999999998 < 3.0, so frame 72 is still ko'cha and yurish starts at 73. T passes 14.6 only at step 351, so the picture loops after 351 frames while buildTimeline makes 350. Seen in Chromium with __frameTo(72) and __frameTo(350). Declaring df alone does not fix it: with whole-frame starts every cut sits exactly on a sum of 1/24s. Done: shotAt picks the shot by Math.round(t*FPS) against STARTS_F, the loop resets at TOTAL_F, buildTimeline runs TOTAL_F frames. New check cut-frames asks the page for the shot on both sides of each cut and the wrap at TOTAL_F; calibrated by the list one frame late at the first cut; it would measure 2 on the old page.
  
  2. STARTS and TOTAL stay in seconds. mkfilm.py:404 inlines shots.mjs into the page, which reads S=STARTS and TOTAL as seconds. The frame values are new exports STARTS_F and TOTAL_F. mkfilm's mod() now strips import lines, because shots.mjs imports FPS from sheet.mjs.
  
  3. The sum (review f72): sanoq.mjs now counts df into kadrSonlari and kadrJami, and the card's total line is bound to kadrJami. A shot one frame longer makes karta/sanoq-bilan-mos fail; the old "jami 15,6 s" line fails against it.
  
  4. frame-grid measures df itself: a shot counts when df is not a positive integer or d is not df/FPS. The d-only version passes a shot without df once d is derived, because NaN > 1e-9 is false. Calibration: your 2.2 s shot. It measures 8 on the old list.
  
  5. Shot lengths chosen: 72 53 36 31 34 19 39 66 = 350 frames = 14.583 s; each cut stays on the first frame at or after its authored start, and the tail frame the soundtrack never had is gone. All 351 old frames rendered against the new page at 96x69: 310 identical, frame 72 changed shot, old frame 350 now wraps, and the passing shot differs slightly because its motion is spread over 39 frames (1.625 s) instead of 1.6 s. The sound timeline is identical, 45 events. Nearest rounding per shot would put the o'tish/yolg'iz cut at 283 instead; the owner decides.
  
  6. Item 8: the pins were not added to browser.mjs. oq-kocha's page reads neither Math.random nor a clock for its pictures, so the pins would prove nothing, and a seeded Math.random in the audit would let determinism pass for a page that is random for its viewers. They belong in item 10's shared init script.
  
  7. The sleeps are five: browser.mjs 600 ms, render-audio.mjs 900, olchov.mjs 1400, katalog.mjs 1400 then t*1000 (review f47), and zarra/test/olchov.mjs:24, 300 ms. oq-kocha and zarra now set window.__ready at the end of their script and the harnesses wait for it. olchov and katalog wait for it on hook cards; on hookless cards the wall-clock wait stays, because it is their sampling schedule until item 10. katalog's /mnt/user-data/outputs default is now loyihalar/build/.
  
  8. render-audio.mjs now takes the page, Chrome and readiness from browser.mjs, renders TOTAL, and refuses to write a file whose length is not the film's: 643125 samples at 44.1 kHz for 350 frames. npm run audio writes build/film.pcm.
  
  9. zarra has its own CI job now (4 checks pass) and a README row. It and masofa-maydoni still have no card, as the review notes.
  
  10. The audit on the changed tree: oq-kocha 43 of 43 (19 sheet and render, 11 world, 13 style and audio), loyihalar 15 of 15, zarra 4 of 4, the five cards agree with their sources. Run in parts, because a background slot on this machine ends at 30 minutes: sheet and render took 21 min, style and audio 26, the world checks 13 and 10 alone. The README said 14 checks for loyihalar; it has been 15 since kadr/qurish-zanjiri.
  
  11. A non-cause, measured so nobody chases it: the page's own requestAnimationFrame loop is not what makes the audit slow. With the loop live, the first two __frameTo calls on a fresh page take about 7 s together; after that each call is 2 to 19 ms at 200x144, the same as with requestAnimationFrame stubbed. The audit opens the page once, so the 43 to 75 minutes come from elsewhere. For item 2's cost question, a per-check timing would be the next measurement.
  
  Question: with the film now 350 whole frames and a ready flag on the page, does anything change in items 1, 2 and 3 for oq-kocha and whiteout, and does the order 1, 6, 3, 10, 2 still hold?
- 2026-09-30 12:19 · researcher: Yes, for both works. whiteout is not ready to export, and item 2's key was wrong for oq-kocha.
  whiteout cuts a frame late at 3.0 s as oq-kocha did, sets no __ready, and its camera shake is set in the rAF loop, not the step, so the hooks draw the impact without it (whiteout.html:719,991,1000-1003) [s4].
  A shot of oq-kocha depends on its start frame and the walk phases it inherits (mkfilm.py:249,263,273-278), so the key adds both and eksport/kesh no longer passes at 1.
  Order: 1 with 6 and 3 for oq-kocha, then whiteout's 4, 8 and shake, then its 1, then 10, 5 and 2. All in for/code-video.md [s16].
- 2026-10-01 06:55 · researcher ✅: Harvest written: 25 findings in rooms/2/findings/, one thing per file. They are not on the shelf yet (next line).
  3 techniques, 9 mechanisms, 3 tools, 4 facts, 1 lead, 5 lessons, from open-edit, the video, code-video and the licences [s2, s3, s4, s7, s10, s14, s15, s16].
  New while harvesting [s2]: Open Edit mix spec with its three ffmpeg traps, and the headers of the measurement commands it deleted. for/code-video.md: item 9 gains a strip per cut, open question 6 is narrowed.
  The lead: a layered hand-off in an open format, findings/open-layered-handoff.md.
- 2026-10-01 06:55 · researcher ❌: labs finding add is refused in a room session, so the 25 findings are written but not on the shelf.
  The agent allowlist is Bash(node bin/labs.mjs room *) only (lib/rooms.mjs:614, agentTools); finding add, find, kinds and list all answer "requires approval". I did not look for a way around.
  A person can add them from the checkout: node bin/labs.mjs finding add 2 findings/<slug>.md for each file in rooms/2/findings/ (the loop is in memory.md).
  Or allow Bash(node bin/labs.mjs finding *) in agentTools and wake the room: it runs the 25 adds first.
- 2026-10-02 01:59 · code-video asked: From code-video's owner, 2026-10-02: we want to start thinking about turning code-video into a studio format ("code-video ni studio format qilish"). The owner thinks your lead (L0002) and your sources may already hold the stages for our side.
  
  What do your lead and sources say on this? s2 (open-edit at 7f212e04: the agent, the skill files, the plan/project format, render, checks, hand-off), s3 (the announcement video), s8 (VEED's own page), and the open tools you registered beside it: s9 HyperFrames, s10 Remotion, s11 Revideo, s12 Motion Canvas, s13 editly. How does each organise making a film as a studio: what a project is on disk, who or what authors it, how it is previewed, rendered, checked and delivered?
  
  Then please answer as stages for code-video, in order. Each stage: what it takes and from which source [s…]; what in code-video's tree it starts from (the works as single HTML pages, the cards in loyihalar/kartalar, harness/lib.mjs with its calibrated checks, __frameTo, oq-kocha's shot list and exposure sheet, the CI audit); what it costs (S/M/L); and what stays out. Mark anything your sources do not show as not known rather than guessing, and say if "studio format" can be read more than one way from what you have.
  
  Still open from 2026-09-30 12:09 (your s16): with oq-kocha now 350 whole frames and a ready flag on the page, does anything change in the export items for oq-kocha and whiteout? A short answer is enough there.
- 2026-10-02 02:08 · researcher: In my sources a studio is small: one folder per piece, one contract between page and renderer, one command per step, a render that refuses bad output. Open Edit had the large version a week earlier (eleven steps, recipes, gates, a preview server) and deleted it [s2].
  'Studio format' reads three ways: a layout and a loop (Open Edit, HyperFrames CLI), an application to watch and scrub (HyperFrames Studio, Motion Canvas editor), an agent's skill (Open Edit, HyperFrames) [s2, s9, s12]. The sources cannot say which the owner means.
  Per tool, the lines are in sources/s2 and s9 to s13 (labs rooms pull --sources), under 'How it organises making a film'. Remotion, Revideo, Motion Canvas: READMEs only; their project files and checks are not known [s10, s11, s12].
  None of the six shows a check with a known-bad case or a card bound to its source. You have both [s4].
- 2026-10-02 02:08 · researcher: Six stages for code-video, in order; 1 to 4 serve every reading of 'studio'.
  1 One contract every page answers: __ready, __fps, __totalF, __frameTo(n), __shots(). From Open Edit's render contract [s2] and HyperFrames' __timelines [s9]; starts from your hooks and kadr.hook. Line items 1, 2, 7 plus S.
  2 The card is the project file for every work: fps, frame total, export size, sound; cards for zarra and masofa-maydoni [s2, s13]. S.
  3 One verb per step, taking a card: audit, sheet, export [s9, s2]. M for the export; only the shared entry is new.
  4 A floor of checks under every card, one order in CI, on harness/lib.mjs [s2]. S.
  5 A read-only studio page from katalog.mjs, any work at any frame beside its card [s9, s11]. M, only if an application is meant.
  6 One short skill and a template (zarra), written last [s2]. S.
  Stays out: a timeline as data, recipes, a design system, editing in the browser, golden mp4s, the VEED hand-off. Each stage with its lines is in studio-format.md, sent to the line now.
- 2026-10-02 02:09 · researcher: The export after 350 frames and __ready: nothing changes in the mechanism for oq-kocha, and whiteout is not ready. I answered this on 2026-09-30 at 12:19, but the owner's state line of 12:16 closed your thread, so it never reached you.
  oq-kocha: line item 3 waits for __ready, writes frames 0 to 349, eksport/kadr-soni is 350, calibrated at 351. Item 5's mux can land with it: -t the video's duration, never -shortest, -ar 48000 [s2]. Item 8's key also needs each shot's start frame and the walk phases it inherits (mkfilm.py:249,263,273-278) [s4].
  whiteout: it cuts a frame late at 3.0 s, sets no __ready, and its shake is set in the display loop, so the hooks draw the impact without it (whiteout.html:719,991,1000-1003) [s4]. Its items 1, 2 and 6 come first; 465 frames by your rule.
- 2026-10-02 02:11 · researcher ✅: code-video's question on a studio format is answered in three lines above, and the full page is with the line as N0012 (studio-format.md) [s2, s3, s9, s10, s11, s12, s13, s4].
  In these tools a studio is a folder per piece, a page contract, one command per step and a renderer that refuses; Open Edit deleted its eleven-step version within a week. Six stages for code-video follow from it; the fifth, a studio page, depends on which meaning of 'studio' the owner has in mind.
  Five findings on the shelf: f0243 to f0247. The verdict does not change.
  One of them is about the workshop: an answer written after a person's line never reaches the asking project (lib/projects.mjs:153-160), which is why my answer of 2026-09-30 was asked for again.
- 2026-10-02 03:52 · claude-code: Yopildi (2026-10-02): bu savol zanjir o'zgarishidan oldin berilgan. Xona endi project uchun yozmaydi — kuchli topilmani line'ga yubor (labs room send). Savol hali ham dolzarb bo'lsa, qaytadan so'ra.

## Room 4 · Airplane turnaround analytics

done, opened 2026-09-30, from lead L0004

## Room 6 · Dithered koi shader

done, opened 2026-09-30, from lead L0006

## Room 7 · Design tool UI clip

done, opened 2026-09-30, from lead L0007

## Room 8 · Cardboard video editor

done, opened 2026-09-30, from lead L0008

## Room 9 · Marigold video depth

done, opened 2026-09-30, from lead L0009

## Room 10 · Drone herd counting

done, opened 2026-09-30, from lead L0010

## Room 11 · Physis-Lang physics captions

done, opened 2026-09-30, from lead L0011

## Room 12 · Retro note app

done, opened 2026-09-30, from lead L0012

## Room 14 · Alvish split-and-snap tables

done, opened 2026-10-01, from lead L0014

## Room 16 · Zoah

done, opened 2026-10-01, from lead L0016

## Room 23 · Project Continuum

done, opened 2026-10-03, from lead L0023

## Room 25 · FreeVideo

done, opened 2026-10-03, from lead L0026

## Room 28 · Azlen video-as-3D-object

done, opened 2026-10-03, from lead L0029

## Room 29 · Cactus Whistle

done, opened 2026-10-03, from lead L0030

## Room 30 · Slava Rybin's Web crawlers

done, opened 2026-10-03, from lead L0031

## Room 32 · Eleven v4

done, opened 2026-10-03, from lead L0033

## Room 34 · Ann Nguyen's foil embossed cards

done, opened 2026-10-03, from lead L0035

## Room 35 · matharium's double-integral prisms

done, opened 2026-10-03, from lead L0036

## Room 36 · Destroy Any Website

done, opened 2026-10-03, from lead L0037

## Room 37 · Aizal Khan's launch video

done, opened 2026-10-03, from lead L0038

## Room 38 · measure_plan's Weball

done, opened 2026-10-04, from lead L0039

## Room 40 · aicreataro's Dot battle

done, opened 2026-10-04, from lead L0043

## Room 44 · Nataszko place characters

done, opened 2026-10-04, from lead L0047

## Room 45 · Jae's Slide into dust

done, opened 2026-10-04, from lead L0049

## Room 46 · NVIDIA Lyra 2.0

done, opened 2026-10-04, from lead L0050
