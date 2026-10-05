# Cardboard changelog

Everything shipped in Cardboard, newest first.

## Now on Mac, Bring Your Agent

_2026-09-30_

Cardboard now lives on your Mac. Sign in with the account you already have and pick up editing in an app of its own.

### An app of its own

Download the app, drop in your footage and talk to your timeline. Your cut comes together in its own window, right next
to everything else you're working on. Cardboard in the browser works just like it always has.

### Bring your own Claude or Codex agent

Keep editing with Director, or switch to the agent you already use. If you have a Claude or ChatGPT plan, your agent
does the thinking while Cardboard gives it the footage, the timeline, and the tools to cut.

### Local by default

Your footage stays on your Mac, and Cardboard edits it right there. Nothing to upload, nothing to wait on.

#### Improvements

- **A real fullscreen player.** Play, scrub, and find your way back out without leaving fullscreen.
- **Share a project as one file.** Save As makes a single `.cbproj`, footage included, ready for Slack or Drive.
- **Every Claude model.** More models now lists everything your Claude Code can run.
- **Exports left, at a glance.** The export dialog shows how many you have left on your plan.
- **Your usage, in one place.** A new Usage page in Settings, with generative credits in the editor header.
- **Start on your phone.** Type an idea on your phone and we'll email a link that opens it on your computer.

#### Fixes & housekeeping

- **One broken graphic, not a broken preview.** It shows a note with a one-click fix, and the rest keeps playing.
- **Mac exports finish.** Animated graphics no longer stall an export partway.
- **Codex keeps its cool.** A dropped connection shows a quiet "Reconnecting…" instead of a wall of errors.
- **Agent chats hold on.** Renaming is off in the Mac app for now, so a project's chat never loses its session.
- **Only tools that work.** Cloud-only tools like Auto Reframe stay out of the Mac app until they run there.
- **Rate any reply.** Thumbs up or down on Director works even with data sharing off.
- **Credits that match your plan.** Upgrades, renewals, and gifted plans all top up the right credits.
- **Muted means silent.** A fully muted timeline exports without an empty audio track.
- **Steadier onboarding.** The first-run questions stay put as you pick your answers.
- **Tidier edges.** Tabs close cleanly, and the buttons under a reply line up.

_Download it, drop in some footage, and tell us what you make. Happy editing._

## Reliable Exports, Smoother Graphics

_2026-09-21_

A week on the parts you only notice when they break. Exports come out right, and graphics keep playing.

### Exports you can trust

Every export gets checked before it reaches you. If the picture or sound didn't make it, we finish it in the cloud or
tell you what's missing. No more frozen frames, no clicks in the audio.

### Graphics that don't stall

One graphic plays straight into the next, with no grey boxes in between. If one stalls, it fixes itself. If it can't,
there's a Retry button.

#### Improvements

- **Smoother scrubbing.** Hovering the timeline stays fluid on a busy machine.
- **Quicker audio.** Simple edits mix down faster on export.
- **Work in progress looks it.** A shot the Director is still filling in shimmers.
- **Missing images, flagged early.** You're asked to relink before the export starts, not after.

#### Fixes & housekeeping

- **Sped-up clips export.** They no longer stop a long render partway.
- **The Director picks back up.** Open your laptop and the chat reconnects.
- **The panel stays.** If the Director deletes your selected clip, the side panel doesn't go blank.
- **Every first frame.** Clips keep their opening frames in the export.
- **Uploads wait their turn.** A long queue no longer times out.
- **Older projects open cleanly.** Animated clips show their properties again.

_Less to notice, which is the point. Happy editing._

## Fast Scrubbing, Editable Graphics, Sharper B-roll

_2026-09-14_

### Scrubbing that keeps up

Drag the playhead and frames arrive as fast as you move, long recordings included. Projects open quicker too:
what sits near the playhead loads first and the rest of your library follows quietly behind it.

### Motion graphics you can edit by hand

Click a graphic and its properties panel lists the words, numbers and colours inside it. Change one and the canvas
updates as you type, and the whole run collapses into a single undo.

### B-roll lands on the right moment

Where a stock clip starts now comes from watching the clip, not from a dozen preview frames. Long archival footage
stops opening on its title card.

#### Improvements

- **A calmer export screen.** The ring keeps step with the number, and the editor reads through as blurred glass.
- **Music comes up first.** The Director asks what you want playing under the edit before it starts cutting.
- **Edits stop redrawing the editor.** A slider or a clip edge only re-renders what it touches.
- **Panels have names.** A properties panel carries its clip and track instead of the word "Properties".

#### Fixes & housekeeping

- **Search is back.** Looking across your projects and transcripts works again.
- **Your voice stays yours.** A cloned voice can only be spoken with by the account that made it.
- **Nothing reads 1:60.** A 119.7 second clip shows the length it actually is.
- **Undo restores a graphic properly.** Stepping back brings back what it really said.

_More of that to come. And we're heads-down on something bigger behind the scenes, so keep an eye out :)_

## Text on the Canvas, Effects You Can See

_2026-09-07_

Styling moved onto the video this week. Text and effects both happen where you can see them now.

### Text styling on the canvas

The toolbar floats next to the words you are editing instead of sitting off in a side panel. Font, weight, colour and
shadow, all of it above the text. Presets restyle a clip without touching what it says, and the animation tiles play
your own title rather than a stock phrase.

### Effects you can see before you pick

Every look is rendered on your own footage now, not a name in a list. Texture and finish sit above the colour looks, so
grain and vignette stop getting lost among the grades.

### A Director that says when it is stuck

It used to reach its limit, try one more edit, and finish with nothing useful. Now it closes out and tells you what it
could not do. It gets a lot more room on a long job, too. And when a reply lands, you can give it a thumbs up or down.

### Sharper eyes on your footage

The model that watches your footage is new. Videos over a minute stop stalling partway through, and a long recording
with one screen share in it no longer gets filed as a screen recording. B-roll picks are better as well: no letterboxed
clips, and nothing already in your project gets pulled in twice.

#### Improvements

- **Something to read.** Four pieces on editing with AI, over on [the blog](/blog).
- **One language per video.** We work it out once instead of per chunk, so it cannot change halfway through.
- **Hindi reads properly.** Devanagari no longer picks up a stray vowel before punctuation.
- **Export progress keeps moving.** It stops looking stuck after rendering, and a failed check says why.
- **The timeline stays put.** Exporting no longer hides it.
- **Formatting is back in chat.** The Director's replies render properly again.

#### Fixes & housekeeping

- **Import once, get one project.** Importing twice at the same moment no longer creates it twice.
- **HDR keeps its colour.** HDR footage stops washing out on the canvas.
- **Background tabs hold on.** A project left in a background tab keeps its place instead of quietly losing it.
- **The sync label is honest.** It reads "Last synced just now" after an edit, not a timestamp from days ago.
- **Your first prompt sees your footage.** Media you just imported is there when you ask.
- **The last reply stays put.** A follow-up no longer clears the answer you were reading.
- **Previews stay cached.** A recovered preview is kept instead of fetched all over again.
- **A cleaner way out of checkout.** Backing out of a top-up returns you to the app instead of a dead page.

_Styling belongs where you can see it. More of that to come._

## Captions Behind You, A Steadier Director

_2026-08-31_

We moved house this week. Captions got the rework too: twenty-one styles now, and nine of them put the words behind the
person talking.

### We live at cardboard.ai now

Cardboard has a new address. usecardboard.com still works and still lands you in the same place, so your bookmarks and
anything you've already shared carry on as they are.

### Captions that pass behind you

Pick a style from Behind Subject and the words travel past the speaker instead of sitting on top of them. We find the
person for you, clip by clip. If a shot has nobody in it, the words stay in front.

### A toolbar right on the video

Click a caption and the controls come to you: font, size, colour, shadow, and the switch that puts the words behind your
subject. Everything redraws as you go. Double-click to fix a word in place, and Apply to all gives the rest the same
style.

### A steadier Director

Pick a track or a voice when it asks, and your original request carries on with that choice instead of starting over
from the selection. It stops when it's stuck rather than going round again, and wraps up with a summary instead of going
quiet. And before it calls an audio edit done, it listens to the finished mix.

### Play a clip backwards

Open Speed, flip Reverse playback, and the clip runs backwards in the preview and in your export, marked REV on the
timeline. Ask the Director for it if you'd rather. Reversed clips run silent.

#### Improvements

- **Paper cutout.** A new effect that turns a shot into a layered torn-paper collage.
- **Eighty-two more music tracks.** Every one listened to and tagged, so asking for a mood lands.
- **Faster exports.** The renderer behind them changed engines. About a tenth quicker, end to end.
- **Export the same cut twice.** The finished file comes straight back instead of rendering again.
- **High frame rate footage.** It gets through processing a lot faster.
- **A status page.** [status.cardboard.ai](https://status.cardboard.ai) lives on its own host, so it works when we
  don't.

#### Fixes & housekeeping

- **Behind Subject stays behind.** Reopen a project and your layered captions come back layered.
- **No flicker at the cut.** Words stop jumping in front of the speaker for a frame.
- **Headline in portrait.** It scales up now, like the rest of them.
- **Long exports finish.** A big render is no longer cut short at the half-hour mark.
- **A project open in another tab.** It tells you which one to close, and how long to wait.
- **Stock images load.** Searching footage stops tripping over its own thumbnails.
- **Sign up once.** Finishing onboarding no longer bounces you back to it.

_Nine styles is a start. Tell us which ones you want next._

## Fewer Surprises, Sharper Montages

_2026-08-24_

This one is mostly about trust. The Director checks its own work now, and tells you when something didn't land.

### The Director checks its own work

Ask for a change and it goes back over the result before it says anything, holding your timeline up against what you
actually asked for. If a part of it didn't land, you hear about it. It won't call an edit done when half the request
quietly went missing.

### Montages that don't repeat themselves

Every moment gets used once. When the music wants more cuts than your footage can fill, you get longer shots instead of
the same clip three times over. Ask for a cut on every beat with too little to work with and it comes back to you rather
than pad it out.

### Cleanup that finishes the job

The dead air goes with the bad takes now. Ask for a cleanup and you get the retakes, the filler and the gaps they leave
behind in one go, instead of a clean read full of holes.

#### Improvements

- **Ask where something lives.** The Director points you at the actual control in your editor, and says when it isn't
  sure instead of guessing.
- **Easier to find, easier to ask about.** Search for Cardboard or ask an assistant about it and you get real pages, not
  a sign-in screen.
- **Better dead ends.** A link that goes nowhere says so, rather than quietly dropping you at sign-in.

#### Fixes & housekeeping

- **Signing in from anywhere.** However you got to Cardboard, sign in and sign up take you where they should.
- **A tidier home page for screen readers.** The scrolling feature strip is announced once now, not twice.

_The Director is getting harder to catch out. Tell us when it slips._

## Footage First, Faster Exports

_2026-08-17_

Two things you'll notice this week. You start with your footage instead of a blank prompt, and exports finish a lot
sooner.

### Start with your footage

Drop your clips in first. The prompt appears once they're in, so you're not staring at an empty box working out what to
say. Send just the clips if you like, with nothing written. They line up in a single row however many you add, and if
you take a couple out, we'll offer to clear the rest.

### Exports are a lot faster

Here are a few of the runs we measured, before and after.

Exports come out at High quality by default now, and the black frame that could flash between two clips is gone.

### Send a clip to another project

Pick anything in your Asset library and Add to project sits next to Download. One field searches the projects you have
or names a new one. You get your own copy, so deleting it in one project leaves the other alone, and adding the same
clip twice still leaves you with one.

### You pick which version to keep

If we recover a version of your project, it waits for you. You see it next to the one you have now, with the time, clip
count and length for both, and you choose. Nothing reaches your editor until you say so, and the recovered version stays
put if anything goes wrong.

#### Improvements

- **Cleanup waits for your upload.** It holds while a clip is still coming in, then starts on its own.
- **Right-click the logo.** Copy our wordmark or logo, or take the whole brand pack.
- **Ten hard problems.** The [ten problems in video editing](/hard-problems) we think are worth solving. We're hiring
  against them.
- **Google first on login.** Continue with Google sits above email, and the sign-up fields are back.

#### Fixes & housekeeping

- **Edits show up right away.** Change a clip and the timeline shows the new version, not the one before it.
- **Changes stay where you put them.** Point at one stretch of the transcript and that's the only part that moves.
- **Face detection finds your footage.** It picks up the right clips instead of stopping short.
- **A failed plan change puts things back.** Your subscription returns as it was rather than staying cancelled.
- **A card check won't cost you your trial.** If your bank asks you to confirm, we walk you through it.
- **No trial you can't take.** Coming back after a subscription won't offer you one again.
- **Exports keep their full length.** No more frames going missing off the end.
- **The selection bar stays put.** Pick a few projects and it stays at the foot of the card.

_Drop a few clips in and see where it takes you._

## New Sidebar, Asset Library

_2026-08-10_

Most of this week went into the parts of Cardboard you move through before you start cutting.

### A sidebar that stays with you

Home, Projects and your Asset library now live down the left, and the rail folds away when you want the room. Your
recent work sits in a row you can sweep through, with the sample projects cleared out.

### Every file in one place

Everything you've uploaded, finally gathered out of individual projects. Search it, filter by type or length, and pull
anything back down.

### Fill a layout slot from your media

Layouts used to ask which track to use, which isn't how anyone thinks. Now you pick straight from your footage, and it
lands framed on whoever's in the shot.

### Ask it to fix black bars

Black edges are easy to spot and tedious to chase. Now you just ask, and the agent says so plainly when it can't.

#### Improvements

- **One surface.** Timeline menus, panel search and text chips finally match.
- **Easier picking.** Highlights, voice and music are simpler to read and scroll.
- **Crop with your hands.** Grab the crop box on the canvas instead of nudging sliders.
- **The analysing list behaves.** It scrolls now instead of spilling off the row.
- **One less question when you join.** If we know how you found us, we skip it.
- **Controls that speak up.** The Director's controls announce themselves to screen readers.

#### Fixes & housekeeping

- **Background tabs keep working.** A project loads and imports in a tab you're not watching.
- **Your media stays put.** A slow save can't land on newer work and take clips with it.
- **Analysis finishes.** It stopped asking for the same footage over and over.
- **Changed your mind at checkout.** Start again and the new one cleanly replaces the old.

_Mostly about where things live. Have a look around._

## Exact Color, ProRes and Dolby, New Captions

_2026-08-03_

This one's mostly polish: two new caption presets, color control precise to the number, and an editor that's calmer to
sit in. Here's what shipped this week.

### Two new caption presets

Beast Mode gives you that big MrBeast energy, and Rapid Reveal shows your words one at a time as you say them. Both
are in the Captions panel now.

### Color, to the number

Ask for an exact value and you get it. Say "exposure +0.8, temperature -20, every clip" and the real sliders move,
instead of landing on a preset that's just close. Works across all ten color controls, on as many clips as you want.

### A cleaner editor

Chat is easier to follow now, with the agent's thinking folded right into the rest of what it's doing. Side panels
look more consistent, and clip thumbnails finally show the right frame.

### ProRes and Dolby files just open

ProRes footage now imports, previews, and exports, instead of hitting an unsupported codec error. Dolby AC-3 and
E-AC-3 audio plays and shows a waveform too. If a file truly can't be read, we'll tell you exactly what to convert it
to.

#### Improvements

- **Untouched clips skip the re-encode.** One clip, no edits, and it copies straight through at original quality.
- **Start your plan early.** Run out of trial credits and one click starts your paid plan.
- **Plan changes stay in Cardboard.** Downgrades and annual to monthly happen in the app, and you can call one off
  before it lands.
- **Sound effects you can describe.** Ask for a hard punch or a cash register cha-ching. Plus 51 new ones.
- **Transitions where they belong.** The agent sticks to scene changes instead of every cut.
- **Speaker labels hold all the way through.** No more resetting halfway into a long recording.
- **Analysis only reads what you used.** Cut 30 seconds from a two-hour recording and that's all it looks at.
- **One honest progress bar.** Upload through transcription on a single scale, no resets, no going backwards.
- **Sign in from your phone.** A proper mobile sign-in screen, with the reel playing behind it.
- **Less motion when you ask for it.** Turn it down in system settings and the app follows.

#### Fixes & housekeeping

- **Captions keep their look.** Regenerate after a trim and your font, color, size, and position survive.
- **Captions follow the edit.** Retime your audio and captions resync instead of drifting off the speech.
- **One grade, not a stack.** Ask for a look twice and the new one replaces the old instead of muddying the picture.
- **Removals stick.** Clear a transition, grade, or background through chat and it leaves the timeline.
- **Switching to vertical reframes properly.** Clips reframe around the subject instead of center cropping.
- **The finish <Chime>chime</Chime> is back.** So is the credit balance refreshing after a turn.
- **The preview stops flickering.** Hovering past the end of your project no longer flashes to black.
- **Big exports hold together.** Long projects survive stalled workers, and progress stops jumping around.
- **Resizing the chat panel is smooth.** Drag the edge and it tracks your pointer.
- **Long conversations load whole.** A chat past a thousand messages no longer comes back cut short.
- **No more surprise translation.** Your browser stops offering to translate the app and scrambling the editor.
- **Onboarding picks the right one.** The "how did you hear about us" step highlights what you actually chose.

_A quiet week, but a solid one. Go make something good._

## References, A Faster Editor, Fresh Paint

_2026-07-27_

Hand the agent a video you like, and it matches it. Here's what shipped this week.

### Show it what you're going for

Attach a video or image to your message. The agent studies its color, pacing, and fonts, then edits to match, and it can
lift the audio straight onto your timeline.

### A faster editor

The editor now loads about half the code it used to. Projects open the moment they're ready, and everything else just
feels quicker to the touch.

### A calmer chat

A long agent turn no longer reads like a wall of steps. It folds into one line while it works, and queued prompts now
sit in a draggable row on the composer.

### A new color picker

One picker for every color field: a hue ring, presets, and an eyedropper that samples any color on your screen.

#### Improvements

- **Undo and redo on the timeline.** Right next to the timecode.
- **Captions edit in place.** Click a line, type, done.
- **Sounds gets a player.** A scrub bar and time remaining, floating over the list.
- **Rounded corners can animate.** Keyframe the radius, in preview and export.
- **Shared videos look sharper.** Higher publish quality, no wasted re-encode.
- **The side panels match.** One look across Captions, Sounds, Media, Layouts, Text, and Voiceover.
- **The changelog is a click away.** Right from your account menu.

#### Fixes & housekeeping

- **Play stops spinning.** A stalled audio decode used to freeze it until reload. It gives up and plays now.
- **Silence removal stays clean.** No more gaps or overlaps, and the time saved is now accurate.
- **Emoji render as emoji.** Letter-spaced text no longer swaps them for question marks.
- **Properties survive a delete.** Delete a clip and the panel moves on, instead of going blank.
- **Music search actually finds music.** No more false "library unavailable," and a stuck pick gives you a way out.
- **Credits match what you see.** Chat won't fail while your balance looks fine.
- **Top-ups charge the right amount.** Paying in a currency other than dollars now reads correctly.
- **Big projects sync again.** Background-removal data no longer blocks sync.
- **Analysis always finishes.** A killed worker can't wedge it anymore.
- **Long chats stay quick.** A big conversation no longer drags the tab down.
- **Sideways footage reads right.** Portrait video isn't stretched before the agent looks at it.
- **Google sign-in from social apps.** Instagram, TikTok, and X now hand you to a real browser cleanly.

_Faster, tidier, and it can see what you're going for. Go make something good._

## The Agent Got Eyes

_2026-07-20_

The big one this week: the agent can watch your video now and fix its own work. Free trials are here too. Here's
everything.

### A second pair of eyes

The agent can see your timeline now, not just the numbers behind it. After it makes a change it looks at the actual
frames, spots what went wrong, a caption sliding off screen, a cut landing a beat early, and fixes it before handing the
edit back. You can also point it at any moment and ask what it sees.

### Try it free for three days

Every plan now opens with a 3-day free trial. Add a card, get the whole thing, and cancel any time before it ends. New
here only.

### Your work keeps running in the background

Switch tabs mid-import and Cardboard used to just stop. Not anymore. Uploads, analysis, and transcription now keep going
while the tab sits in the background, and everything's caught up when you come back to it.

### Download any clip

Right-click a clip on the timeline and hit Download Clip. You get just that piece, trimmed to exactly what's on your
timeline, at full original quality. Works for video and audio.

#### Improvements

- **Analysis starts sooner.** Cardboard reads your footage straight from the original instead of waiting for a proxy to
  finish first.
- **Honest progress bars.** Analysis tracks real work done, estimates the wait from your actual speed, and tells you
  plainly when something's stuck.
- **Audio on many clips at once.** Select a handful of clips and change their audio together, with a shortcut to silence
  a selection.
- **A quicker timeline.** Dragging and snapping clips feels faster and lands where you mean it.
- **Exports keep their name.** Rename an export and that name carries through as the video's title.
- **Prices in your currency.** Upgrade mid-cycle and the prorated amount shows in your own billing currency.

#### Fixes & housekeeping

- **DaVinci gets real clips.** Send a timeline to DaVinci Resolve and it arrives as clips with their cuts intact, not
  frozen stills.
- **The agent edits captions cleanly.** It can reword a caption without garbling the ones around it.
- **Google sign-in inside Instagram.** Opening Cardboard from Instagram's in-app browser no longer blocks signing in
  with Google.
- **Trials end when you cancel.** Cancel mid-trial and access stops right away, with no charge waiting for you later.
- **Steadier chat.** The conversation follows along as it scrolls, and old prompts clear out on their own.

_More next week. Go make something good._

## Keyframes, Blur, Familiar Shortcuts

_2026-07-13_

The timeline just got a lot more capable. Keyframes live right on it now, clips snap and duplicate the way you expect,
blur joins your effects, and Cardboard can speak your editor's shortcuts.

### Keyframes, right on the timeline

Open a track and its properties fan out into keyframe lanes. Drag the diamonds to retime a move, click one to jump there
and light up the matching field in the inspector, and press Delete to drop it. Collapse the clip and the keyframes ride
along as a marker strip. Press U to expand. Animate position, scale, opacity, blur, and more, with the preview following
your drag live.

### Cut, duplicate, snap

The timeline keeps up with your hands now. Cmd/Ctrl+X cuts the selected clips, Alt/Option-drag drops a duplicate right
where you let go, and clips snap to each other's edges as you drag. Press S to toggle snapping off when you need to
place something by eye. Dragging several clips across tracks lands them cleanly.

### Your shortcuts, your way

Press <kbd>?</kbd> for the redesigned shortcuts dialog: a full keyboard you can hover to inspect and click to rebind,
with presets for Premiere Pro, DaVinci Resolve, Final Cut Pro, and CapCut. Bring the muscle memory you already have, or
build your own map. Your changes stick.

### Gaussian blur

Blur is one of your effects now. Soften a background, ease a face out of focus, or keyframe it in and out over time.

#### Improvements

- **Background removal on part of a clip.** Cut the background from a range instead of the whole clip, and it picks back
  up where it left off if you reload mid-job.
- **Captions stretch where you need them.** A caption can extend across the ones next to it, and overlapping caption
  drags resolve to the one that's actually on screen.
- **The agent keeps your text readable.** It catches captions or titles that overlap on screen or shrink too small to
  read, and fixes them before handing the edit back.
- **A warmer welcome.** After you pick a plan, the welcome video plays in a proper player with controls, speed, and
  fullscreen, over an ambient wash of color pulled from the video itself.
- **Credits keep up.** Your balance updates the moment you spend instead of lagging a beat behind.

#### Fixes & housekeeping

- **Rapid cuts preview smoothly.** Quick back-to-back clips play back without the stutter.
- **Sign in with Google from more apps.** Opening Cardboard inside X's in-app browser no longer blocks Google sign-in.
- **Transcription handles more files.** When a file's audio won't decode the usual way, Cardboard falls back and
  transcribes it anyway.
- **Interrupted uploads pick back up.** A dropped upload recovers instead of starting over, with clearer messages when
  something's actually wrong.
- **Your local media stays put.** Refreshing links no longer swaps footage you've already loaded for a slower remote
  stream.
- **Chat history is there when you open a project.** Your conversation with the agent loads with the project, no lag and
  no layout jump.
- **The agent hands back control cleanly.** When it finishes, the timeline is yours again right away, even with the
  project open in more than one tab.
- **Steadier chat input.** The chat box keeps focus while you type.

_The editor's in your hands now. Go make something good._

## Share Links, Video Comments

_2026-07-06_

This one is about getting your video in front of people. Share a link and anyone can watch and leave feedback right on
the frame. Take a look at [one of ours](https://www.cardboard.ai/share/L8BxE6Gl8l6O), comments and all. Here's
what's new.

### Share your video with a link

Turn any project into a link and send it to anyone. They open a clean watch page, no login, and always see your latest
published cut. You decide when to publish: the page tells viewers plainly whether they're watching your latest edits or
a version you haven't pushed yet, and copying the link works the instant one exists. Sharing is now on for every
account.

### Comments, pinned to the frame

On that same page, anyone with the link can leave a comment pinned to the exact moment in the video, just a name and
email, no account needed. Each note jumps you straight to its timecode. You can resolve or delete them, and step right
back into the project to act on the feedback.

### Word Pop captions

A new caption style reveals your words as they're spoken and pops the keyword big on its own line. Captions also go
quiet during long silences now, across every preset, so nothing lingers on screen when no one's talking.

#### Improvements

- **Reframe follows the speaker.** Ask to follow the speaker and Cardboard keeps your current aspect ratio, punching in
  on whoever's talking instead of only converting formats.
- **Adaptive frame rate.** Exports now match your footage automatically, so 60fps stays at 60 and fast motion and
  lipsync stay tight instead of dropping to 30.
- **Panels open instantly.** Switching between Library, Effects, Transitions, and the rest is a pure toggle now, with no
  reload and no lost scroll place.
- **A preview on the link.** Links you share now unfurl with the title, your name, and a short summary of the video.
- **Steadier sourced b-roll.** Clips Cardboard finds for you are cached the moment they land, so scrubbing is smooth
  from the first drag.

#### Fixes & housekeeping

- **No black flash at cuts.** Exports that stack layers no longer blink a black frame at some clip cuts.
- **Long captioned edits stay smooth.** Editing a video with hundreds of captions no longer freezes the tab.
- **A cleaner watch page.** Shared videos load their cover and length before playing, and a removed or still-rendering
  share shows a designed screen instead of an empty black frame.
- **Tidier color grade.** The color controls read more clearly and sit better in the panel.

_Make something worth sharing. We'll get it in front of people._

## Real Footage, Retro Effects, Detached Audio

_2026-06-29_

Cardboard can now go find real footage for you, and there's a fresh set of retro film looks to give it character. Here's
what's new.

### Bring in real footage

Ask for a shot and Cardboard goes and finds it. It searches stock libraries and public archives, picks the clips that
actually match, and drops them onto your timeline. Use them as b-roll over your voiceover or as the main visual, and
every clip carries its credit. There's a new documentary flow too, that covers a voiceover end to end with real archival
footage.

### A retro look

New film and TV effects: grain, vignette, scanlines, and halation, plus faded film, technicolor, and newsreel presets.
They live in the Effects panel, formerly Filters, preview on hover, and carry through to your exports exactly as you see
them.

### Pull audio off a clip

Ask the agent to separate a video's audio and it lifts the sound onto its own track, so you can keep the audio and drop
or replace the picture. The same move the timeline already had, now something you can just ask for.

#### Improvements

- **Export progress on long files.** The percentage keeps creeping forward through the quiet stretches of a big render
  instead of parking.

#### Fixes & housekeeping

- **Fonts survive export.** A local font that isn't bundled now maps to a close match, so exports look like your
  preview.
- **Cleaner dialogs.** Pop-ups are solid and centered now, and their contents no longer clip at the edges.
- **Smoother b-roll swaps.** Swapping in a shorter clip fits it to the space instead of failing.
- **Upgrades that go through.** Moving from Creator to Pro works cleanly, and Pro users at their limit no longer see an
  upgrade button that leads nowhere.

_Roll something beautiful. We'll handle the b-roll._

## Trending Fonts, Message Queue, Smarter Prompts

_2026-06-22_

Five new fonts, a smarter chat, and a handful of fixes.

### Five new fonts

Advercase, ZT Formom, Pixelon, Bootzy, and New Romantics are available in the caption and text pickers. They carry
through to exports at full parity, so what you preview is what you get.

### Queue your messages

Send a prompt while the agent is still working and it goes into a queue, numbered and visible in the composer. Each one
fires automatically when the previous run finishes. There's also a dedicated stop button now, separate from the send
button, so you can abort a run without losing what you typed next.

#### Improvements

- **Long-prompt nudge.** Paste an essay into the chat and Cardboard flags it and offers to improve it instead of sending
  it raw.
- **Improve Prompt handles longer inputs.** The enhancer now accepts prompts up to 50k characters and returns fuller
  rewrites.

#### Fixes & housekeeping

- **Scrub to the end.** Hovering past the last clip on the timeline no longer shows a black frame.
- **Rotated overlays export correctly.** Overlays with a rotation now come out right in your final video.
- **Improve Prompt follows long inputs.** Long prompts no longer get cut off mid-improvement.

_More next week._

## Reframe Every Clip, Beats That Land, Faster Timeline

_2026-06-15_

Three things got sharper this week. Reframing now carries across every clip you cut, music edits land on the beat, and
the timeline stays smooth as your project grows.

### One reframe for every clip

Cut a long recording into separate clips, a podcast into highlights or an interview into moments, and reframing now
applies to all of them in a single pass and a single undo. Cardboard also stays on the right person through shot
changes, instead of drifting to whoever just stepped out of frame.

### Beats you can edit to

Beat-synced edits land where you expect them. Cardboard tracks a song's real beat grid instead of guessing from drum
hits, so cuts and effects sit on the beat, even through quieter stretches with no percussion. It reads up to 20 minutes
of a track too, so longer songs stay in sync the whole way.

### A faster timeline

The timeline does far less work while you scroll, play, and edit, so it stays responsive on bigger projects. It also
hands memory back during exports instead of holding onto it, so long sessions stay light.

#### Improvements

- **Cleaner imports.** Footage previews come through clean, without the green frames or flicker some clips used to show.
- **More voice variety.** Voice search spreads its picks across accents, genders, and styles instead of the same few.
- **Big imports keep moving.** Importing a lot of clips at once no longer leaves some stuck waiting to be analyzed.
- **Truer levels for the agent.** The agent reads each track's real volume now, so its edits match what you actually
  hear.

#### Fixes & housekeeping

- **Previews recover on their own.** If a clip's preview goes black mid-render, it comes back instead of staying frozen.
- **Roomier chat options.** Long option labels show in full instead of getting clipped, and the prompt box is a touch
  tidier.
- **Usage loads reliably.** Your usage in settings still shows even when a background refresh hiccups.

_Cut it however you like. Cardboard keeps up._

## New Look, Simpler Pricing, Smarter Agent

_2026-06-08_

This is a big one. Cardboard looks and feels new, pricing just got simpler, and everything for your account finally
lives in one place. Here's what's new.

### A brand new Cardboard

Cardboard has a fresh new look, and it runs deeper than the visuals. The whole experience feels more personal and more
polished, built around you and your work. We reimagined onboarding and redesigned every dashboard screen, so it feels
right from your very first visit.

### Simpler pricing

We've moved to usage-based pricing. Plans now start at $32 a month, down from $60, so it's easier to get started and you
only pay for what you use. Generous weekly and monthly limits keep credits out of your way while you work.

Already with us? Nothing changes. You keep every perk and unlimited usage, just as we promised. Switch to the new plan
anytime if it suits you better.

Read more on our [pricing page](/pricing).

### Settings, all in one place

Your settings and billing are completely rebuilt. Privacy, your account, usage, payment methods, plan changes, upgrades
and downgrades, monthly or annual, it all lives in one place now. No more hopping between your account and a separate
billing dashboard just to change one thing.

### A smarter agent

The agent got a lot of work under the hood, and you'll feel it. It's sharper, more direct, and more capable, with a more
personal touch. Surgical edits and quick follow-ups in particular are faster and more precise than before.

#### Improvements

- **Sharper transcript cleanup.** It's much better at cutting bad takes, repetitions, and filler. Point it at a podcast
  and one-shot the whole edit.
- **A quiet chime.** The agent gives a gentle <Chime>chime</Chime> when it needs your input or wraps up while you're
  away.
- **HDR in your exports.** Exported videos now keep their full HDR color.

#### Fixes & housekeeping

- **Clip previews.** Click a clip and its preview comes right back, every time.
- **Export progress.** The percentage climbs smoothly now instead of jumping around.
- **Steadier edits.** Your timeline stays intact even if an edit runs into trouble midway.

_We poured a lot into this one. We hope it shows._

## Big Speedups, Smarter Framing, Smoother Chat

_2026-06-01_

A faster, smarter week. Cardboard frames your shots on its own, keeps speakers centered as they move, and gets you
through voiceovers and big imports in a fraction of the time.

### A smoother chat

Pick layouts, music, and voices right where you're chatting, without hunting through menus. Previews stay clean and out
of the way while you type your next prompt.

### Smarter auto-framing

Let Cardboard choose the right aspect ratio for you, faster and more accurately, from your footage and your prompt.
Vertical, square, and wide cuts land without any extra setup.

### Reframes that follow movement

Speakers stay in frame as they move around the shot, and the cut to whoever starts talking is quicker than before.
Conversations feel natural without any manual keyframing.

### Faster voiceovers and imports

Generate voiceovers up to 8x faster, with longer scripts that now finish reliably. Big footage imports up to 4x faster
too, so heavy clips are ready to edit much sooner.

#### Improvements

- **Clearer compose guidance.** Better prompts before you compose, with sharper music suggestions to match your edit.
- **Sharper exported captions.** Captions export at the right size without clipping, with more consistent fonts.
- **Faster templates.** Start from a template far quicker, with previews that load instantly on repeat visits.
- **Snappier project home.** Open recent and sample projects faster, with smoother transitions into the editor.
- **Clearer upload estimates.** See more accurate time estimates while a clip uploads.
- **More reliable background removal.** Remove backgrounds with cleaner, steadier results.
- **Steadier sped-up audio.** Audio stays aligned through gaps when you speed up or rearrange clips.

#### Fixes & housekeeping

- **AI editing.** The agent no longer stalls mid-edit, transcript cleanup applies cleanly on tricky clips, layout tiles
  preview in the right shape, and chat results stay tidy.
- **Voiceovers.** Long and expressive voiceovers generate without dropouts, and canceled runs clean up after themselves.
- **Exports.** Exported videos use the right fonts, a rare audio glitch during rendering no longer interrupts exports,
  and exports recover gracefully when a stubborn segment fails.
- **Media.** Reopened projects avoid duplicate media and thumbnails, and template previews load faster on repeat visits.

_A bigger release lands next week. Stay close._

## Faster AI Edits, Clearer Media Progress

_2026-05-25_

Less waiting, more editing. The agent gets to work sooner, speaker reframes feel more natural, and you can always see
what Cardboard is preparing behind the scenes.

### Faster AI edits

Prompts start working sooner, especially on larger projects, so there's less waiting after you ask Cardboard to make an
edit.

### Smarter speaker reframes

Speaker-focused edits feel more natural, with quicker switches and smoother tracking as people move.

### Clearer media progress

When Cardboard needs to prepare clips before an edit, chat now shows exactly which files are still uploading, preparing,
analyzing, or transcribing.

### Smoother project home

Recent projects, samples, renames, and deletes are more dependable, with clearer previews before the important actions.

#### Improvements

- **Better project recovery.** Reopened projects recover interrupted media work more reliably, even if the tab closed
  mid-edit.
- **Download your media.** Grab original media straight from the media grid.
- **Consistent captions.** AI-placed captions line up more closely with your manual adjustments.
- **Cleaner caption exports.** Caption sizing and layout stay consistent in exported videos.
- **Reliable voiceovers.** Longer voiceovers complete more reliably, and canceled generations are handled cleanly.

#### Fixes & housekeeping

- **AI editing.** Clearer waiting states, transcript cleanup handles more edge cases, layout options match your prompt
  better, and search results stay fresh as media changes.
- **Projects.** Rename and delete dialogs show better previews, project-limit messages are clearer, and opening from
  home feels smoother.
- **Media.** Prepared media reports more accurate durations, voiceover transcription keeps running across tabs,
  transcriptions are cleaner, and background removal is more reliable.
- **Polish.** Timeline clip menus appear in the right place, notifications feel lighter, the mobile menu is easier to
  use, and there's a new Video Editor role on the [careers page](/careers).

_Less waiting, more flow._

## Speaker-Aware Reframes, Smoother Editing

_2026-05-18_

Big multi-speaker clips just got easier, and the editor around them got faster. Cut to whoever's talking automatically,
move through large edits smoothly, and come back to your projects fully intact.

### Speaker-aware reframe

Turn interviews, podcasts, and other multi-speaker clips into fullscreen edits that cut to whoever is speaking,
automatically.

### A faster timeline

Move around bigger edits with smoother scrolling, clearer waveforms, tighter playhead sync, and more dependable
dragging.

### More reliable exports

Export layered projects with clearer progress, better downloads, and fewer edge-case failures.

### Better project reopens

Come back to your projects with media, transcripts, analysis, and searchable moments restored more dependably.

#### Improvements

- **Easier image imports.** Add large images easily, with orientation kept correct across previews and exports.
- **Smoother playback.** Playback stays steadier as you move around the editor.
- **Export progress anywhere.** Follow export progress more easily, even from the browser tab while you work elsewhere.
- **Editor polish.** Media scrolls reliably in the left panel, with cleaner panel backgrounds across the tools.
- **Easier caption presets.** Find and apply the Pulse Cut caption preset more clearly in chat and styling.
- **Smoother dashboard flow.** Start projects from uploaded media with better previews and graceful recovery when an
  import fails.

#### Fixes & housekeeping

- **Speaker-aware edits.** Multi-speaker clips get ready sooner and fall back gracefully when there isn't enough
  speaking activity for automatic cuts.
- **Timeline.** Context menus, gap clicks, drag previews, selection, and detailed edits behave more predictably.
- **Exports.** Layered exports handle more timelines, stay in sync, and recover better when large projects take extra
  time.
- **Project loading.** Reopened projects restore analysis, transcripts, uploads, and searchable moments without
  duplicate failure messages.
- **Media.** Image previews, dashboard previews, and failed-upload cleanup are more consistent across the app.
- **AI editing.** Chat edits are more reliable when analyzing media, finding moments, applying styles, and checking
  results.

_Point it at your next interview and watch it cut itself._

## Smarter Search, Media Insights

_2026-05-11_

Finding the right moment just got a lot faster. Search your footage by what's actually in it, peek inside any clip
before you scrub, and review the highlights Cardboard picks before they reach your timeline.

### Search for any moment

Find exact moments by what's said, what's on screen, the objects in frame, filenames, and scene details. Preview a match
and drop just that segment onto your timeline.

### Media insights at a glance

Open a media preview to see concise visual and speech context while you scrub, so you know what's inside a clip without
watching the whole thing.

### Highlight preview

Review the highlights Cardboard picks in a playable flyout, then choose what to keep before anything lands on your
timeline.

#### Improvements

- **Playback speed controls.** Review clips faster with speed controls across the preview players.
- **In-sync dashboard previews.** Hover or click a media card and its preview stays in sync.
- **No waiting on analysis.** AI tools keep moving after uploads finish, even while analysis is still running.
- **Clearer track buttons.** Timeline track buttons are easier to read with sharper icon contrast.

#### Fixes & housekeeping

- **Search.** Projects become searchable as their analysis, transcripts, and summaries finish, with multiple matches per
  file and a bias toward concrete visual evidence.
- **Exports.** Cardboard offers only codecs your browser can actually encode, falls back gracefully when an encoder
  fails, and avoids silent output when audio can't be produced.
- **Project readiness.** Upload progress, proxy processing, and restores are clearer, so AI tools and reopened projects
  get unstuck faster.
- **Housekeeping.** Leaner editing as older chat, export, and AI paths retire behind the scenes. We're also hiring a
  Design Engineer, see the [careers page](/careers).

_Go find your moment._

## Smoother Reframes, Reliable Project Opens

_2026-05-04_

A steadier week. Reframes track your subjects more naturally, and your projects come back the way you left them, even
the ones you started offline.

### Smoother auto-reframe

Speakers and subjects stay framed more naturally, especially on longer clips and shots with a lot of movement. Less
drift, fewer awkward crops.

### More reliable project opens

Reopen your projects with far fewer missing-media hiccups, including projects with generated voiceovers or work you
started locally before syncing.

#### Improvements

- **Better area tracking.** Area-based edits hold onto the part of the frame you meant more reliably.
- **Faster proxies.** Large files get ready for smooth editing sooner.
- **Better long-clip handling.** Reframe and analysis stay steady on big clips instead of stalling partway.
- **Timeline quality-of-life.** The timeline opens at a smarter default zoom, and clip menus now have a Split option for
  faster edits.
- **Clearer waiting states.** Chat tells you when Cardboard is preparing media before it can analyze, reframe, or
  continue an edit.
- **Steadier playback prep.** Background media work recovers better from slow jobs, so previews and playback are less
  likely to stall.

#### Fixes & housekeeping

- **Project loading.** Cardboard does a better job restoring media folders, generated voiceovers, and local work when
  projects are reopened or synced.
- **Reframe.** Auto-reframe stays on the right subject more consistently and rechecks older tracking before reusing it.
- **Stability.** The animated background recovers from a graphics hiccup without crashing the page.
- **Housekeeping.** Retired older project-loading, media, and AI paths that were no longer in use.
- **Hiring.** We're hiring for a few more roles. See the latest openings on our [careers page](/careers).

_Plenty more under the hood, with something bigger on the way._

## Subscription Offers, Polished Previews, Faster Loads

_2026-04-27_

There are new subscription deals to grab, your projects open faster, and previewing clips feels a lot smoother. Here's
what's new.

### Special subscription offers

There's a new place to find subscription deals, with a landing experience built around the offer and a checkout flow
that gets you through in fewer steps. It looks and works just as well on your phone, so you can browse and claim an
offer wherever you are.

### Projects that open faster

Opening a project is quicker now. Thumbnails appear sooner, the name shows up while everything loads so you always know
what you're opening, and a clearer "preparing" phase tells you exactly where things stand. If an import hits a snag, it
recovers on its own instead of leaving you stuck, and reopening picks up right where you left off.

### Smoother media preview

Scrubbing through a clip lands where you expect it to, with a seek bar you can trust. Take any clip fullscreen and
Cardboard's playback controls stay on top, so you keep full command of what you're watching.

#### Improvements

- **Faster reopens.** Sample media loads quicker and analysis is ready to go the moment you return to a project.

#### Fixes & housekeeping

- **Older projects open reliably.** Projects from earlier versions restore every time, with progress that flows smoothly
  from start to finish.
- **Clean exit mid-load.** Close a project while it's still loading and Cardboard tidies up after itself.
- **Steadier reframe.** Face detection waits until your media is ready, then runs reliably with clear progress through
  each step.

_P.S. Still reading down here? You're our kind of person.
[Hey can you share the secret offer with me?](mailto:founders@cardboard.ai?subject=Hey%20can%20you%20share%20the%20secret%20offer%20with%20me%3F&body=Hi%20Cardboard%20founders%2C%0A%0AI%20spotted%20your%20Easter%20egg%20at%20the%20bottom%20of%20the%20changelog.%20Mind%20hooking%20me%20up%20with%20the%20secret%20offer%3F%0A%0AThanks!)_

## Speaker Grid Reframing, Smarter Cleanup

_2026-04-20_

Reframing got a lot smarter this week. Multi-person footage now lays itself out into clean split layouts, transcript
cleanup lets you pick how aggressive to be, and long transcripts scroll without a hitch.

### Speaker grids from one prompt

Point Cardboard at multi-person footage and ask for a split layout. It recognizes each speaker and arranges them into
their own slot automatically, so a single prompt turns a busy shot into a polished grid. Auto-reframe motion is steadier
too, with smooth tracking that keeps your subject framed cleanly even on fast-moving shots.

### Cleanup, your way

Transcript cleanup now asks how far you want to go. Pick Light, Balanced, or Tight right in chat and preview each one
before you commit, so you can see exactly what gets cut. Whatever you choose, word boundaries stay protected and nothing
gets clipped mid-word.

### A faster captions panel

Scroll through long-form transcripts without the lag. Even projects with thousands of caption segments stay smooth, and
your captions show up the moment a project opens instead of waiting for the panel to catch up.

#### Improvements

- **Conversations that survive interruptions.** Your chat stays intact even if a response is cut off, refreshed, or
  cancelled midway.
- **Sample projects open faster.** Transcriptions now stick to your account, so reopening a sample is near instant.
- **Live reframe progress.** Watch face detection and segmentation work in chat, so you know exactly when reframe is
  ready.
- **Tighter security.** We brought our sign-in layer up to date with the latest patches.

#### Fixes & housekeeping

- **Cleaner FCPXML exports.** Hidden tracks stay hidden, bundled DaVinci media relinks reliably, and timecode now reads
  from more Sony, QuickTime, and other camera formats.
- **More reliable reframing.** Face grouping holds up on tricky footage and tracking boxes line up precisely with your
  source video.
- **Steadier loading.** Page assets load reliably across every browser.
- **A fixed link.** The careers problem statement doc points to the right place again.

_Hand Cardboard a room full of speakers and get a clean grid back._

## DaVinci-Ready Exports, Synced Chat History

_2026-04-13_

This release is all about handing your edit off cleanly and picking your work back up wherever you are. Exports now drop
straight into DaVinci Resolve, and your chats follow you across devices.

### A clean handoff to DaVinci Resolve

Send your edit to DaVinci Resolve and it just opens. Media relinks on its own, camera timecodes come along for the ride,
your assets are bundled, and the audio is all there. Premiere handoffs got the same care, with cleaner export options,
bundled assets, and smarter media sorting so projects land where you expect.

### Chats that follow you

Your AI conversations now live with your account instead of a single browser tab. Start something on your laptop,
refresh the page, or move to another machine, and the whole history is waiting for you.

### A clearer welcome

Open Cardboard in Arc, Safari, or Brave and you'll get a friendly nudge that tells you exactly what to do next, so a new
browser never leaves you guessing.

#### Improvements

- **Transcription, clip by clip.** Watch each piece of media transcribe on its own and see exactly what's ready to use.
- **Bigger imports, smoother loads.** Bring in larger batches of media with steadier memory handling and clearer status
  along the way.
- **Faster thumbnails.** Thumbnail strips fill in sooner as your media comes in.
- **Pro camera timecodes.** Cuts line up on relink for Sony FX-series and other professional cameras.

#### Fixes & housekeeping

- **Cleaner export files.** Filenames read better, and FCPXML assets use relative paths and explicit start times so
  editors relink without manual fixups.
- **Simpler FCPXML tab.** The export options are consolidated into one tidy place.
- **Steadier audio.** Audio extraction runs on its own without tugging on playback, and the encoder now handles a wider
  range of formats.

_Edit here, finish in Resolve. Your chat history makes the trip too._

## Cloud Processing, Smarter AI, Faster Loading

_2026-04-06_

Big files edit smoothly now, projects open faster, and the agent always works from what's actually on your timeline.
Here's what's new.

### Edit big files without the lag

Drop in a massive video and keep editing at full speed. Large media gets prepared in the background, so playback and
scrubbing stay smooth no matter how heavy the source footage is.

### Projects that open faster

Opening a project is quicker, and you can see it happen. A detailed progress view shows what's loading, and your media
gets checked along the way so problems surface before they trip you up.

### An agent that sees your latest timeline

The agent now always works from your current timeline, so its edits land where you expect. It checks the state of your
project before acting, which means more accurate changes and fewer surprises.

#### Improvements

- **Transcription progress.** See per-item status so you know exactly what's ready to work with.
- **Codec heads-up.** A clear dialog tells you when an audio file uses a format we can't read.
- **One prompt at a time.** AI prompts arrive in order now instead of stacking up as overlapping dialogs.
- **Better voice search.** Find cloned voices and browse every voice category reliably.
- **Steadier text on canvas.** Drag, select, and position text overlays more precisely.
- **Cleaner text placement.** New text elements no longer pile onto the same track.
- **Open positions.** Browse roles on the new [careers page](/careers).

#### Fixes & housekeeping

- **Caption nudges.** Vertical caption offsets move in the direction you'd expect.
- **Smoother long exports.** Heavy transcodes keep playback responsive instead of locking up.
- **Reliable imports.** Bringing in media under memory pressure completes more often.
- **Quieter dashboard.** Project cards update without flickering or needless redraws.
- **Smarter search timing.** AI search waits for analysis and transcripts to finish before it runs.
- **Wider format support.** The export engine handles more formats cleanly.

_The heavy lifting happens in the cloud now, so your projects open faster._

## Perfect Audio Sync

_2026-03-30_

Audio now stays locked to picture no matter how long your timeline runs, in playback and in your exports. Here's what
changed.

### Audio that stays in sync

We rebuilt how audio lines up with your video, and the drift is gone. Play back or export an hour-long project and the
sound stays right where it belongs, from the first frame to the last. Long timelines that used to slowly slip out of
time now hold perfectly, all the way through.

#### Improvements

- **Cleaner export frames.** Every frame of your export shows fully loaded images, with no flicker or pop-in.

#### Fixes & housekeeping

- **Steady timing across browsers.** Audio stays aligned after decoding on every browser we support, so nothing slips
  out of sync as you play.
- **No more creeping drift.** Hour-long projects keep their timing across the whole video instead of slowly wandering
  off.

_Press play on your longest project. The audio will be exactly where you left it._

## Edge Export, Audio Sync, Browser Compatibility

_2026-03-23_

Cardboard now exports locally in Microsoft Edge, your audio stays tighter through long projects, and your browser tells
you up front whether it can keep up.

### Export in Microsoft Edge

You can now export your videos locally right inside Microsoft Edge, no Chrome required. If Edge is your everyday
browser, you can edit and finish a project end to end without switching to anything else.

### Know your browser is ready

If your browser is missing the graphics support Cardboard needs, you'll get a clear heads-up instead of a confusing
failure later. You'll know what's wrong and what to do about it before you sink time into an edit.

#### Improvements

- **Clearer sync status.** Watch upload progress across batches with accurate ETAs, plus a warning before you leave with
  work still in flight.
- **Cleaner project deletion.** Deleting a project clears out its files for good, with nothing stale left behind.

#### Fixes & housekeeping

- **Tighter audio.** Early drift on long projects stays better in sync through both preview and export.
- **Thumbnails after a reset.** Sample project thumbnails show up correctly again once you've cleared browser storage.
- **Silent video exports.** Remote exports of video with no audio go through instead of failing a check.

_Edge users, this one's for you._

## Faster Exports, Mandarin Support, Subscription Management

_2026-03-16_

Exports are faster and far more reliable, you can now work in Mandarin, and managing your plan no longer means leaving
the app. Here's what's new.

### More reliable exports

Exporting in Chrome is steadier now, with better audio handling and recovery when something goes wrong mid-render. We
stress-tested it against projects over 200 GB, so even your heaviest timelines make it all the way through.

### Faster exports

We rebuilt the export pipeline and put your hardware to work. Renders are quicker across the board, and the gains hold
up on larger projects instead of slowing to a crawl.

### Mandarin support

You can now transcribe, analyze, and caption your videos in Chinese (Mandarin). Cleanup and captions work the same way
they always have, just in a new language.

### Manage your plan in settings

Cancelling or changing your subscription now happens right inside settings. No support email, no separate billing page,
just the controls where you'd expect them.

#### Improvements

- **Bigger imports, less waiting.** Larger files come in more reliably, using less memory and finishing faster.
- **Newest media first.** Your media library now shows the most recent items up top.
- **A portrait canvas.** Pick the new 3:4 preset when you're building for vertical screens.
- **More speed options.** Choose from a wider range of playback speeds, including 1.25x.
- **Flip in one click.** Mirror any video or image clip horizontally without leaving the timeline.
- **Smarter transcript cleanup.** Cleanup is faster and sharper on longer videos and audio.

#### Fixes & housekeeping

- **Scroll the timeline naturally.** Your mouse wheel scrolls the timeline sideways, and scrolling the track list no
  longer fights it.
- **Cleaner agent placements.** Clips the agent lays down sit flush in sequence, with no tiny gaps left behind.
- **Roomier chat.** Long transcripts and search results stay tidy instead of overflowing the conversation.
- **A clean exit.** Leaving the editor releases rendering resources properly, and older sample projects sync their media
  more reliably on load.

_Even your biggest exports finish in a fraction of the time now._

## GIF Exports, Smart Reframing, Better Voiceovers

_2026-03-09_

You can export GIFs now, let clips reframe themselves for any aspect ratio, and hear voices before you commit to one.
Here's what's new.

### Export a GIF

Pick any range of your video and export it as a GIF. Thumbnails let you scrub to exactly the frames you want, so the
loop you share is the one you meant to make.

### Reframing that follows the subject

Switch to a new aspect ratio and your clips adjust their own scale and position to keep the subject in view. No more
nudging every shot by hand when you move from wide to vertical.

### Better voiceovers and text

Preview voice options and hear how each one sounds before you generate a voiceover, so the take you get is the one you
picked. Text got richer too: add motion with 12 new presets, rotate it, tune its padding, and it stays crisp wherever
you place it. And when an idea is still rough, one click rewrites it into a clearer edit request.

#### Improvements

- **Waveforms on clips.** Audio waveforms now show right on video clips in the timeline.
- **Longer chats.** Long AI conversations carry on without losing earlier context.
- **Chat across devices.** Reopen a remote project and your chat history comes with it.
- **Steadier cloud media.** Synced media and thumbnails recover more reliably.
- **Faster replies.** The agent responds quicker on follow-up turns.
- **Crisper text.** Text renders more sharply throughout the editor.

#### Fixes & housekeeping

- **Cleaner dragging.** Drop clips into gaps and add adjacent tracks with predictable placement.
- **The voice you chose.** Voiceovers use the exact voice you select, and sync guidance reads more clearly.
- **Fewer hangs.** Permission recovery and remote media cleanup are more dependable.

_Set the ratio once, and your clips reframe themselves._

## Chat Checkpoints, Faster Exports, Fresh Look

_2026-03-02_

You can now rewind your AI chat to any point and get the timeline back exactly as it was. Exports are faster, and
sign-in got a cinematic makeover.

### Chat checkpoints

Every message in your AI chat is now a save point. Roll back to any earlier moment and your timeline returns exactly as
it was, so you can explore a bold edit and step back without losing your place.

### Faster, steadier exports

Exports render noticeably faster, and the long ones hold together. Hour-long videos now finish without stalls, audio
cutoffs, or a frozen progress bar, and the percentage stays honest the whole way through.

### A redesigned sign-in

Logging in greets you with a cinematic split-screen and smooth transitions. It is the same quick path in, with a lot
more polish on the way.

#### Improvements

- **Confident subscriptions.** Every plan now comes with a 7-day money-back guarantee.
- **Lighter cloud projects.** Open large cloud projects without running out of memory.
- **A richer dashboard.** Browse your work with fuller thumbnails, metadata, and inline renaming.
- **New starting points.** Jump in faster with fresh film and podcast sample projects.
- **Leaner captions.** Generate captions on longer timelines while using less memory.

#### Fixes & housekeeping

- **Truer audio.** Sped-up clips keep their full audio, and MOV exports land reliably.
- **Cleaner playback.** Correct frames at every cut, no flicker with duplicate clips, and the canvas fills high-res
  screens.
- **Resilient analysis.** Analysis results survive a page refresh instead of starting over.
- **Smoother edges.** Gentler onboarding, reliable billing redirects, and fullscreen on iOS Safari.

_Take a risk in chat. If it does not land, one click puts everything back._

## Export Options, HDR, Beat Sync

_2026-02-22_

This week is about finishing the cut and getting it out clean. You can lay out shots faster, bring in much bigger files,
cut to the beat, and export with HDR color intact.

### Layouts you can shape by hand

Layout presets are redesigned with drag-and-drop and live previews, so you can see each arrangement before you commit
and nudge things until the framing feels right.

### A sharper agent

The agent asks better questions when it isn't sure what you mean, including grouped multi-part prompts instead of one at
a time. When several music tracks fit, it hands you an interactive picker so you choose the one you want. It can also
cut to the beat now, lining up your edit with the percussion in a track.

### Bigger files, cleaner exports

Upload limits doubled: up to 2.5GB on Creator and up to 10GB on Pro. On the way out, software encoding, a low-memory
mode, and HDR color correction keep long videos exporting reliably with their full color.

#### Improvements

- **A roomier editor.** The chat panel now spans the full height, with more intuitive keyboard shortcuts.
- **Hide the timeline.** Collapse it for a clean viewer, with smoother thumbnails, clearer waveforms, and a pinned
  layout track.
- **Smarter model picking.** The model picker now routes you to the right model automatically.
- **Friendlier media import.** A scrollable dropzone, more aspect ratios, smarter relinking, and clearer handling for
  unsupported codecs.
- **Snappier projects.** Faster ingestion, a lighter dashboard, and more stable renders.
- **Account and legal.** Email preferences plus our Terms of Service and Privacy Policy.

#### Fixes & housekeeping

- **Steadier playback and export.** Streamed video buffers more reliably, transforms scale correctly through
  transitions, and long exports no longer stall or hang.
- **Accurate 4K output.** Elements and overlays now transform correctly when you export at 4K.
- **Lighter on memory.** Audio caches stay bounded, and cloud projects with large videos open without running out of
  memory.
- **Reliable cloud reopens.** Stale previews and false relink prompts are gone when you return to a cloud project or
  switch back to the tab.
- **Better across browsers.** Audio plays back correctly, Brave only falls back when Shields are up, and project
  recovery is sturdier.

_Ten gigs in, full HDR out._

## Transitions, Background Removal, Multilingual Captions

_2026-02-16_

This week is about the moments between your clips and the world behind your subject. You get real transitions, one-click
background removal, voiceovers that arrive as they speak, and captions in more languages.

### Transitions between clips

Add a transition wherever two clips meet, with the controls right there at the seam. Set the look and timing without
leaving your edit, and the cut between shots flows the way you want.

### Lift your subject out of the background

Remove or replace the background on any video or image in a single click. Cardboard reads the depth of the scene too, so
it can tuck text behind your subject for a layered, in-the-room look.

### Voiceovers that stream as they speak

Voiceovers are more expressive now, and they start playing back as they're generated instead of making you wait for the
whole take. Captions also speak more languages, so you can subtitle in whatever your audience reads.

#### Improvements

- **Smarter music picks.** The agent reads the mood of your music better and suggests tracks that actually fit.
- **A calmer properties panel.** The properties panel is cleaner and moves more smoothly as you adjust things.
- **Earlier progress.** You see how your media is analyzing sooner, so you're not left wondering.

#### Fixes & housekeeping

- **Truer transitions.** Transitions land where you place them and play back accurately.
- **Consistent color presets.** Presets in the grade tool now apply the look you picked, every time.
- **Steadier deploys.** Build and dependency updates keep things stable behind the scenes.

_Subtitle once, reach everyone._

## Layouts, Cleanup, Background Sync

_2026-02-10_

This week is about starting faster and worrying less. Drop in a layout to kick off an edit, clear the dead air out of
your recordings, and let your work save itself in the background.

### Start from a layout

New layout presets give you a head start on common compositions, so you can drop one in and build from there instead of
arranging everything from scratch. It's the fastest way to get an edit moving.

### Clear out the silence

Auto-cleanup reads your transcript and trims the silent gaps and dead takes out of a recording for you. Point it at a
long, rambly take and get back something tight and watchable.

### Saved without thinking about it

Your projects now back up to the cloud on their own while you keep editing, so nothing waits on a save button and you
never lose your place. We also moved into a new home at usecardboard.com (now [cardboard.ai](https://www.cardboard.ai)).

#### Improvements

- **Set up before you edit.** Pick your canvas aspect ratio (16:9, 9:16, 4:3, 1:1) and your AI model right from the chat
  box before you start.
- **Uploads that finish.** A failed upload retries on its own instead of leaving you to start over.
- **Animated GIFs.** GIFs now play correctly on the timeline.
- **A heads-up on storage.** You'll get a warning before your browser runs low on space.

#### Fixes & housekeeping

- **Smoother playback.** Preview seeking no longer gets stuck, clips stay in sync, and the canvas keeps drawing without
  dropping out mid-edit.
- **Clearer media handling.** Remote media shows its download progress, removing a file stops its work cleanly, and busy
  moments no longer stall an import.
- **Editor polish.** Tooltips stay on screen, the delete dialog shortens long file names, and the home text box scrolls
  instead of growing forever.
- **Reliable across tabs.** Editing in more than one tab no longer trips up your storage, samples stop duplicating, and
  bad timeline data gets caught before it lands.

_Save button? You won't miss it._

## New Timeline, Sound Effects, Subscriptions

_2026-01-31_

The timeline is rebuilt, there's a library of music and sound effects to draw from, and you can now start a project
straight from a prompt. We also opened the doors to everyone with a free trial.

### Start from a prompt

The home screen now puts the agent front and center. Describe the video you want and start building right there, instead
of setting up an empty project first and figuring out where to begin.

### A rebuilt timeline

The timeline got a ground-up rework, and editing feels steadier for it. Dragging clips is smoother, trimming lands where
you mean it to, and the small frictions that used to slow you down are gone.

### Music and sound effects

Browse a curated library of music and sound effects and drop them straight onto your timeline. Music and sound effects
now behave the same way, so once you've placed one you already know how the rest work.

### Open to everyone

We retired the waitlist. Anyone can sign up and start with a free trial, and subscriptions are live when you're ready to
keep going.

#### Improvements

- **Copy and paste clips.** Cmd/Ctrl+C and Cmd/Ctrl+V now work on timeline clips.
- **Mute with a keystroke.** Press M to toggle mute on a selected audio or video clip.
- **Clearer import feedback.** The effects panel has a cleaner layout and tells you more about codecs as you import.
- **Native text copy.** Selecting text in the editor uses your browser's normal copy behavior.

#### Fixes & housekeeping

- **Steadier dragging.** Clips collide and reorder predictably, and trim handles respond accurately right at clip edges.
- **Tidier interface.** Tooltips stay on screen at the edges, the mobile Safari warning is gone, and sample projects
  stay put without hover previews stuttering.
- **Smoother uploads.** An overlay shows upload progress, and file permissions are checked more reliably.
- **Right place after sign-in.** Logging in now lands you on your home screen.

_The waitlist is gone. The doors are open to everyone._

## Stacked Captions, Product Demos, Big Files

_2026-01-22_

This week brings a fresh caption style, smoother product demos, and room for much bigger footage. Here's what's new.

### Captions that reveal as you talk

Stacked captions are a new animation that brings your text in line by line as it's spoken, so it reads along with the
voice instead of landing all at once. The captions panel now follows the playhead while you work, and steps aside the
moment you scroll so you can move freely.

### Smoother product demos

Putting together a product demo is easier now, with better support for the moves those edits lean on. Crop a clip to a
preset aspect ratio right on the canvas, save the current preview frame as an image, and press F to drop into fullscreen
for a clean look at your work.

### Room for bigger footage

You can now edit videos up to 5GB, so longer recordings and high-bitrate captures come in without trimming them down
first. Import iPhone photos in their HEIC and HEIF form directly, no conversion step. And if files moved since your last
session, reconnect them in place instead of starting over.

#### Improvements

- **Refreshed panels.** Backgrounds, properties, export, and media all got a cleaner pass.
- **Sharper media search.** Describe what you're after and search lands closer to the clip you mean.
- **Four featured fonts.** Satoshi, Clash Display, Gambarino, and Playfair Display are ready to use.
- **Quick duplicate.** Cmd/Ctrl+D copies whatever you've selected on the spot.
- **Steadier exports.** Timeout guards and fallbacks keep an export moving instead of stalling.

#### Fixes & housekeeping

- **Reused clips export.** Using the same video several times no longer hangs the export.
- **Cleaner playback.** Audio holds through seeks, speed changes stay in sync, and seeking retries when it needs to.
- **Truer canvas.** Rotated items select correctly, snap guides respect crop bounds, and the razor leaves split audio
  alone.
- **Smoother media handling.** A stuck HEIC upload no longer blocks the rest, short clips stop truncating, and
  thumbnails redraw after you navigate.
- **A clear heads-up.** Safari and Firefox now show what's limited so there are no surprises mid-edit.

_Captions that keep pace, files that don't hold back._

## Voice Cloning, Sentence Search, Ripple Delete

_2026-01-11_

A big week for voices and finding your footage. You can clone any voice, search your media by describing it in plain
language, and edit your timeline with fewer fiddly steps.

### Voices that sound like you want

Browse hundreds of voices and narrow them down by gender, age, accent, and language until one feels right. If you have a
voice in mind that isn't there, clone it by uploading or recording a short sample. Voiceovers also get a cleanup pass
that strips filler words and dead pauses so they land cleanly, and transcription now handles 10+ languages with
automatic detection.

### Search by describing it

Find media by writing a rough sentence instead of guessing at filenames or exact words. Describe the moment you're after
and Cardboard surfaces the clips that match.

### A faster timeline

Ripple delete removes a clip and closes the gap it leaves behind in one move, so your edit stays tight. The agent also
chimes in mid-conversation with clickable suggestions, so the next useful step is right there when you want it.

#### Improvements

- **Track menus do more.** Mute, lock, and manage gaps straight from a track's menu.
- **Keyframes on canvas.** Animate position, scale, and rotation with keyframes right on the canvas.
- **Styled text from the agent.** Ask the agent to restyle your captions and text elements.
- **Quick-start prompts.** Starter prompts appear when the chat is empty, so you always have a way in.
- **HDR footage.** Import and edit HDR video with its full color intact.
- **Wider browser support.** Smoother on Chrome, Firefox, and Safari.
- **Leave-without-saving warning.** A heads-up appears before you leave a project with unsaved changes.

#### Fixes & housekeeping

- **Cleaner playback.** No more black flicker between clips from the same video, and colors composite correctly.
- **Steadier long sessions.** The agent uses less memory and analyzes video more accurately, retrying when a result
  comes back garbled.
- **Editor polish.** The chat box no longer jumps as it grows, style-to-all text uses your current values, and gap
  labels read correctly.
- **Reliable samples.** Sample projects stay cached for 30 days and re-download on their own if needed.

_Clone a voice, search a line, trim in a tap._

## Voiceover, Spatial Awareness, Sample Projects

_2026-01-01_

A few big ones this time. You can generate voiceovers, the agent understands what's happening inside your frame, and
there's more to play with on the canvas and in chat.

### Generate voiceovers

Create professional voiceovers right inside Cardboard, with a range of voices to pick from. Drop one onto a section that
needs narration and keep editing without ever leaving your project.

### An agent that sees your frame

The agent now understands what's happening inside your frame. It places captions and overlays where they won't block
your subject, so things land in the right spot the first time.

### Move around the canvas

Pan, zoom, align, and rotate with guides and snapping to position everything just right. Timeline zoom now anchors
around the playhead, so you stay oriented as you move through a project.

### Start from a sample

New explainer and montage templates get you going fast. Open one, swap in your media, and you have a real project to
build from instead of a blank canvas.

#### Improvements

- **Token usage at a glance.** See how many AI tokens a request will use right in the chat input.
- **New caption styles.** Style captions with golden-serif and minimal-modern presets.
- **Simpler volume.** Volume now reads as a plain percentage from 0 to 200 instead of decibels.
- **Smoother long audio.** Long audio tracks scroll and edit faster.
- **Cleaner multi-item edits.** Dragging and moving several items at once behaves more predictably.
- **Tidier timeline.** Trim handles and clip names hide on narrow items so the timeline stays readable.

#### Fixes & housekeeping

- **Steadier playback.** Frames stay in time and stop going stale, so review and export look right.
- **Reliable captions.** Caption segments trim and split cleanly, and clips deselect when you expect.
- **Faster app.** Requests are quicker, and the timeline ruler redraws more smoothly while you scroll.
- **Quicker start.** Opening Cardboard takes you straight to your projects.

_Give your edits a voice. We're only getting warmed up._

## Keyframe Animations, Playback Speed, Cloud Projects

_2025-12-22_

A big one for motion and storage. You can animate anything on the timeline, bend playback speed for slow-motion or
time-lapse, dress up your video with a background, and keep your projects safe in the cloud.

### Animate anything with keyframes

Set keyframes on timeline items and let Cardboard move them for you. Position, scale, and more can now change over time,
so you can build real motion into your edits instead of static placements.

### Bend playback speed

Speed clips up for a time-lapse or slow them down for a dramatic beat. Speed changes carry through to your audio and
exports, so what you hear in the editor is what you get in the final video.

### Backgrounds for your video

Drop a background behind your video, whether that's a gradient, a solid color, or one of the macOS wallpapers. It's an
easy way to frame vertical clips or give a plain shot some room to breathe.

### Your projects, in the cloud

Projects and media now live in the cloud, so your work is backed up and ready to pick up from anywhere. A new settings
panel also gives you one place to manage your preferences.

#### Improvements

- **Audio volume control.** Set levels per item and mute anything that's getting in the way.
- **A smarter agent.** The redesigned agent handles edits and multi-step workflows more reliably.
- **Drag text anywhere.** Drop text straight onto the canvas or the timeline.
- **Import with a hotkey.** Pull in media files without leaving the keyboard.
- **Separate audio from video.** Split a clip's audio onto its own timeline track.
- **Snappier editing.** Smarter caching keeps the canvas and effects responsive on heavier projects.
- **Faster exports.** Exports finish quicker and land more reliably.

#### Fixes & housekeeping

- **Steadier backgrounds and captions.** Scaling and rendering hold up across sizes and aspect ratios.
- **Cleaner audio exports.** Audio stays in sync when you change playback speed.
- **Better color picker.** It's quicker to use and validates values as you go.
- **Consistent UI.** Timeline and panel controls line up the way you'd expect.
- **Lighter on memory.** Long sessions stay stable, with fewer slowdowns over time.

_More ways to move, and a safer home for your work._

## AI Vision, Music Library, Canvas Crop

_2025-12-15_

Cardboard understands your footage now, there's a music library to score it, and a handful of on-canvas tools make
shaping your edit feel direct. Here's what's new.

### An agent that sees your footage

The agent can now look at what's actually in your clips, the scenes, actions, and on-screen text, and suggest edits
based on it. Describe a moment in plain language and it finds the footage, and you can ask it to generate and place
captions across your timeline for you.

### A music library

Browse royalty-free tracks by genre and mood and drop them straight onto your timeline. Tracks preload as you hover, so
the moment you pick one it's ready to play.

### Shape your edit on the canvas

Crop videos and images right on the canvas with pixel precision, and hold Option or Option + Shift while you resize for
finer control. Hover any color grade to preview it before you commit, and reach for new text controls like letter
spacing and line height to get type looking the way you want.

#### Improvements

- **Exports keep going in the background.** Renders run at full speed even when the tab isn't focused.
- **Clearer media prep.** Importing now shows live progress, transcribes in parallel, and gives a gentle chime when it's
  done.
- **A smoother onboarding.** New users land on a clean waitlist sign-up.

#### Fixes & housekeeping

- **Duplicated text stays clean.** Copies of a text element no longer flicker or glitch against each other.
- **Cleaner exports.** Rendering artifacts in exported video are gone.
- **Steadier properties panel.** Switching editor tabs no longer leaves the properties panel hanging around.
- **Reliable project loads.** Opening a project no longer trips over file permission issues.
- **Quieter timeline.** Cleaner colors, a steady playhead, and smoother clip interactions throughout.

_The agent can see now. Imagine where that goes._

## Transcription, Agent Overhaul, Canvas Editing

_2025-12-03_

A big step forward. Cardboard can now transcribe your footage, the agent got a major overhaul, and you can edit clips
right on the canvas. Here's what's new.

### Automatic transcription

Drop in a video or audio file and Cardboard transcribes it for you. The text is fully searchable, so you can jump
straight to the moment you're after, and you get timestamped captions to work from.

### A smarter agent

Director chat has been overhauled with new tools, clearer messages, and a model picker so you can choose the model that
fits the job. Conversations are steadier now, and the agent reasons more reliably about your project as you work.

### Edit on the canvas

You can now drag, scale, and position clips directly on the canvas and see the result in real time. A new unified
effects panel keeps your transitions and effects in one place, you can select several timeline items at once to edit
them together, and you can hand a project off to Premiere Pro with XML export.

#### Improvements

- **Smoother playback.** Audio preloads before it plays, so playback stays gapless and steady.
- **Faster previews.** Frames load quicker and seeking feels smooth as you hover over the timeline.
- **Steadier timeline.** Scrubbing and placing items is more responsive, and clips no longer collide.
- **Media notifications.** You get a heads-up the moment a file finishes processing.
- **Clearer selection.** Refreshed selection colors and styling make it easier to see what's picked.

#### Fixes & housekeeping

- **Reliable beat detection.** Beats line up correctly now, so audio-synced edits land where they should.
- **Cleaner clip blending.** Clips with transparency blend correctly instead of showing odd edges.
- **Steadier chat.** Conversations save and reload reliably, and the agent keeps its place mid-task.
- **Dependable models.** The agent connects reliably every time, whichever model you pick.

_A lot landed this week, and we're not slowing down._

## Transitions, Text, Shot-Level Search

_2025-11-20_

A big set of building blocks this release. You can move between clips with transitions, drop styled text on your video,
find any moment by describing it, and chat with the agent in a panel that remembers your conversations.

### Transitions and text

You can now add fade, scale, and fly transitions between clips, so cuts move the way you want them to. Text gets its own
toolkit too: drop styled overlays on your video, start from a preset, and dial in the typography until it reads right.

### Find any moment by describing it

Search your footage in plain language and jump straight to the shot you mean. Cardboard understands what's happening on
screen, so a phrase like "the wide shot of the beach" lands you on the right frame with a timestamped thumbnail to
confirm it.

### A new look and the Director chat

Cardboard has a fresh color system with a dark theme and a redesigned landing page. Alongside it, the chat panel is now
Director, with conversations that stick around so you can pick up where you left off and switch between them easily.

### Keyboard shortcuts

Common timeline actions are now a keystroke away. Space, the arrow keys, delete, and more all work the way you'd expect,
so you can edit without reaching for the mouse.

#### Improvements

- **Undo and redo.** Step back and forward through any timeline change.
- **Footage gets ready on its own.** New media is detected, indexed, and given thumbnails in the background, so it's
  ready to search and edit when you are.
- **Track management.** Rename, move, and delete tracks.
- **Lighter on memory.** Cardboard clears out video it no longer needs while you work.

#### Fixes & housekeeping

- **Aspect ratios.** Switching between 9:16 and 16:9 converts cleanly, with no more blank canvas afterward.
- **Renderer.** Images keep their orientation and stacking order instead of flipping or hiding behind each other.
- **Steadier selection.** Clicking the chat input no longer clears what you have selected on the timeline.
- **Room to work.** Projects can run longer now, and they start up faster.
- **Cleaner deletes.** Removing a project clears everything that belonged to it.

_The building blocks are in. Now the fun part._

## Faster Playback, Better Timeline, Chat Improvements

_2025-11-14_

This release makes editing feel smoother end to end. Playback and previews are quicker, the timeline gives you finer
control, and chat keeps more of your work in view.

### Smoother, sharper playback

Video now plays back faster and more accurately, with quicker previews while you work and crisper, higher-quality
exports when you're done. Layered edits hold up under heavier projects, so you can keep building without the preview
falling behind.

### More control on the timeline

Scrubbing, snapping, and clip placement are more precise, and you can now stack your edits across multiple layers.
Visual guidelines and per-clip audio waveforms make it easier to line everything up. A new properties sidebar lets you
dial in position, scale, rotation, opacity, blend mode, and audio for any clip directly on the timeline.

### Sharper understanding, roomier chat

Cardboard analyzes your footage faster and more accurately, right in the browser, so it has a better read on what's in
your clips. Chat now supports multiple tabs and a one-click way to clear history, so you can keep separate threads going
and start fresh whenever you like.

#### Improvements

- **Smoother preview.** Playback is steadier, and HEIC images are kept out before they cause trouble.
- **Quicker, cleaner waveforms.** Audio waveforms generate faster and display in higher fidelity.
- **Portrait video.** Stronger 9:16 support and easier switching between aspect ratios.
- **Faster sign-in.** Logging in through app.cardboard.sh redirects you more quickly.

_Faster on every front, with plenty still to come._

## Initial Release

_2025-11-09_

Cardboard is here. This first release gives you everything you need to bring your footage in, cut it on a timeline, and
ask the agent for help along the way.

### Bring in your media

Import images, music, and video, and keep everything organized inside projects. When you're looking for a specific
moment, search by what's happening on screen and jump straight to the right clip.

### Edit on the timeline

Drag clips onto a multi-track timeline, split them where you want, and scrub or zoom in for precise cuts. Your changes
show up in the preview as you make them, and you can switch between 16:9, 9:16, and 1:1 whenever your project calls for
it.

### Shape the workspace

Resize panels to fit how you work, and reach for keyboard shortcuts to move faster. When you're done, export your
project in a range of formats, including XML.

### Edit with the agent

Tell the agent what you want in plain language and it makes the edit for you, so quick changes are just a message away.

_Welcome to Cardboard. We can't wait to see what you make._