# Tong · kaptar — where the sound's numbers come from, and what is a choice (sound v3)

Every sound is fired from the picture's own state: sound/probe.js calls the shots' own functions on
edit B's clock (sound/scan.json). A wingbeat fires where the drawn wing phase passes the top of the
upstroke, a touchdown at the lander's own td, the whistle on blastHit, the rag from the cloth
simulation that draws it (re-run at every substep), the flag's flips from its drawn free edge, the
breath from the shoulders' curve. Sync, measured: every logged accent within one frame of the first
frame that shows its cause (audit/sound/sound_check.py, SYNC).

## Measured facts the sound follows

| sound | value | source |
|---|---|---|
| take-off wing clap | broadband clap at the end of each upstroke, from the wings meeting above the back | Niese & Tobalske 2016, *J Exp Biol* 219:2173 |
| take-off feather buzz | tonal, 700 ± 50 Hz with up to 20 harmonics, from the outermost primary (P10), in the latter two-thirds of each downstroke, peaking at 69 ± 16 % of it; only near peak wingtip speed; **in take-off only** (level flight's wingtips are below its threshold; landing is not reported) | same |
| take-off is loud | "a loud flapping noise at take-off"; "a noisy clapping sound" | Wikipedia, Rock dove |
| landing beats | braking over the last ~4 beats, faster (7–8.4 Hz); wings held up from touchdown, then folded | the film's own landing plan (Berg & Biewener 2010; Provini et al. 2014), shot5.js |
| dove coo | essentially a pure tone (ring dove ≈ 600 Hz, 1.5 s): trachea and inflated oesophagus filter the harmonics | Fletcher, Riede, Beckers & Suthers 2004, *JASA* 116:3750 |
| rock pigeon coo | "a soft, slightly wavering coo, 'crruoo-u'"; its vocalisation mostly under 0.5 kHz | Wikipedia, Rock dove; pigeon vocalisation spectrograms (ResearchGate fig. 21987888) |
| sparrow chirps | 3–7 kHz, peaks 4.2–6.4 kHz; 0.12 ± 0.03 s; two-note "M"; communal chirping before leaving the roost in the morning | chirp-type spectrograms (ResearchGate 351287282); *Biol Invasions* 2024 (s10530-024-03521-0); Wikipedia, House sparrow |
| whistle band | whistled sound 1–3.7 kHz; the farther it must carry, the higher | Meyer et al., *Front Psychol* 2017 |
| flag and rag flutter | flags flap at fL/U = 0.2–0.6 (used for the rag's flapping rate, 0.8·U Hz for its 0.5 m) | Virot et al. 2013 |
| air absorption | ISO 9613-1 formula, 15 °C, 60 % RH (checked against the standard's table at 20 °C / 70 %) | ISO 9613-1:1993 |
| a tremolo on noise | heard from about 5–6 % depth (the motor check's scale) | Viemeister 1979, *JASA* 66:1364 |
| slow motion | the world at 0.2×: each beat's grain 5× longer, its ticks 5× fewer | the shot's own clock |

## Models that are heuristics, said as such

- **A wingbeat** is built as the wing moves: over the first 0.6 of the beat the wing's speed rises
  and falls as a sine, the loudness as its 2.2nd power, and the air's band rises and falls with it
  (a whoosh is a moving band, in a state-variable filter whose cutoff moves every sample); the
  feathers' vanes tick through it (sparse impulses rung through short resonances: Farnell's texture
  for rustle and fabric, where Gaussian noise is hiss); the upstroke is a softer, higher rustle.
  Near birds (within ~12 m of the lens's equivalent) get the broad band and the ticks; far ones a
  narrower band and few ticks (27 of them broad and crackling measured as a hiss). Its peak sits at
  0.28 of the beat; the drawn wing is fastest at 0.29 (pigeon.js flapPose).
- **Wingbeat loudness** is an effort model, not a law: U = activity × amplitude × beat rate, relative
  to a cruise beat, and amplitude ∝ U³ (the way dipole noise goes with speed) times a factor that
  gives power strokes (take-off, braking) their full level and cruise beats 45 % of it. A flock
  bird's beats vary 3 dB and 15 % in colour beat to beat (its dipole turns as the flock banks).
- **The rag** is driven by its own simulated air speed, steeper than the dipole cube (U^4.5), its band
  moving with that speed (250 Hz + 170 Hz per m/s) and its fibres ticking; its snaps fire at the free
  edge's acceleration peaks, soft (2 ms to open, 20–30 ms long).
- **The flag** is a cloth flutter that follows its drawn ripple (10 and 5.6 rad/s) and the wind, and a
  soft flip where the drawn free edge (the ripple plus the 17 rad/s snap at the free end that grows
  with the wind, props.js) is thrown hardest.
- **The slow motion's pitch**: the air's band at 0.7 of its pitch, the ticks slowed with the shot
  (5× fewer, 0.7 of their pitch), a low body band under each stroke; not the literal 5× varispeed
  (which would put a 1 kHz whoosh at 200 Hz and the 700 Hz buzz at 140 Hz).
- **The coos** are tone models (three harmonics, a rolled onset, a rough and breathy voice): no
  synthesized coo was ever named a pigeon by the tagger (v2's read 'theremin', v3's 'animal, cat').
- **The town** is a band of distant traffic rumble and tyre noise whose density drifts over tens of
  seconds (a car 200 m off takes about 30 s to swell and fade). The tagger hears it as wind and
  white noise: a synthesized wash carries no town.
- **The reverb** has no source: an open rooftop, three early reflections from near walls (4, 7.5,
  11 m), a 0.4 s diffuse tail, normalised to unit gain in band, sends growing with distance. The slow
  motion has its own: 1.6 s, diffuse, darker (the world's tail slowed with it), sent twice as hard.
  The whistle's echoes from the rows 16, 23 and 30 m off are placed as three discrete delays.
- **Loudness between sources** is set by one principle, not measured SPLs: the whistle is the
  loudest sound in the film (a real finger whistle is louder than any wingbeat by tens of dB), at
  least 6 LU over the landing; the far flock is texture.

## Mix choices (conventions, not physics)

- the whip pan's air whoosh: the camera's move, not a thing in the picture; kept low;
- shot 2 is lifted 4 dB as a whole (a fader ride, assigned span by span), so the flock far off does
  not sit 12 dB under the loudest shot; the far flock (beyond 14 m) is pulled back 4 dB everywhere;
- shot 3 hears the bird in focus, and the three soft birds round him 20 dB down and dark (they are
  1.5–3.7 m behind the focus and soft in the picture); the town hushed by 15 dB;
- sound perspective follows each shot's base lens; a zoom does not bring the world nearer, except
  the boy's own sounds (breath, clothes), which come in with his size in shots 4 and 5's pushes;
- out of the picture, a bird's beats and the rag are heard at 35 %; the flag fades once shot 5's push
  has left it behind;
- the white pigeon's touchdown is given room (the others 8 dB down round it): it is the bird his eyes
  lock on to, just before his smile;
- the coos come from inside the coop: nothing in the picture animates a coo. The last one is heard
  from the coop just out of the frame on the left, where the film has shown it.

## How it is checked (audit/sound)

- `sound_check.py`: SYNC, BEAT (the stem folded on the drawn beats), MOTOR (fast modulation as an
  equivalent tremolo, against surrogates of the passage itself), EAR (an AudioSet tagger, EfficientAT
  mn40_as_ext: right, wrong and neutral classes per layer), MIX, CUTS, SILENCE.
- `ear_compare.py`: the tagger's reading of two versions side by side, under one rule.
- `measure.py`, `spec.py`: levels, bands, beds, event log; the spectrogram with the events and stems.
- What none of this can tell: whether it is pleasant, or right for this film. That is a listener's.
