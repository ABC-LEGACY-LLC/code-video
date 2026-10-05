/* THE SHOT LIST. Every camera lives here and nowhere else, so the cut audit reads
   the authored subject scale instead of guessing it from pixels. `sz` is that scale:
   how large the subject is meant to be in this shot, on one consistent ruler.
   `df` is how long the shot is, in frames: see the foot of this file. */
import {FPS} from './sheet.mjs';
export const SHOTS=[
 {k:"ko'cha", snd:{wind:0.95,city:0.55,mute:0.0},  df:72, sc:1, two:0, ro:[-8.6,1.55,-1.25], ta:[4.60,1.05,-0.35], foc:2.30, far:62, sz:1.0,
  A:[0,0,0], aw:1},
 /* THE HORIZON WAS THE CLIP PLANE. With far:7 the snow field simply stopped being
    marched seven units out, at which point the ray fell through to sky -- so the
    "horizon" was a razor-straight level edge with a visible tone step across it,
    which is the one thing a whiteout does not have. The ground now runs out to 24
    and the weather closes over it first. It costs 1.9x the primitive evaluations of
    a shot that was already the cheapest in the film. */
 {k:'yurish', snd:{wind:0.70,city:0.10,mute:0.0}, df:53, sc:0, two:0, ro:[0.76,0.80,-3.10], ta:[0.02,0.50,0.00], foc:2.25, far:24, sz:2.6,
  A:[0,0,0], aw:1},
 {k:'yuz', snd:{wind:0.34,city:0.06,mute:0.55},    df:36, sc:0, two:0, ro:[0.44,1.00,-0.33], ta:[0.02,0.925,0.00], foc:2.28, far:16, sz:12.0,
  A:[0,0,0], aw:1, head:1},
 {k:'ikkinchi', snd:{wind:0.88,city:0.50,mute:0.0},df:31,sc:1, two:1, ro:[-3.2,1.05,-2.05], ta:[1.90,0.72,0.15], foc:2.40, far:40, sz:1.6,
  A:[0,0,0], B:[3.05,0,0.18], aw:1, bw:1},
 {k:'ikkovi', snd:{wind:0.52,city:0.34,mute:0.30}, df:34, sc:1, two:1, ro:[-1.45,0.90,-2.35], ta:[1.10,0.55,0.30], foc:2.00, far:26, sz:2.4,
  A:[0,0,0], B:[1.72,0,0.12], aw:0, bw:0},
 {k:'qarama', snd:{wind:0.18,city:0.08,mute:0.72}, df:19, sc:1, two:1, ro:[0.52,0.95,-2.10], ta:[0.52,0.62,0.06], foc:1.85, far:9, sz:5.0,
  A:[0,0,0], B:[1.06,0,0.12], aw:0, bw:0},
 {k:"o'tish", snd:{wind:0.66,city:0.30,mute:0.0}, df:39, sc:1, two:1, ro:[-0.55,0.78,-2.70], ta:[1.20,0.50,0.22], foc:2.20, far:22, sz:3.2,
  A:[0,0,0], B:[1.90,0,0.12], aw:1, bw:1, pass:1},
 {k:'yolg‘iz', snd:{wind:0.92,city:0.42,mute:0.0},df:66,sc:1,two:0, ro:[-6.2,1.30,-1.60], ta:[3.20,0.90,-0.20], foc:2.30, far:50, sz:1.2,
  A:[0,0,0], aw:1}
];
/* A SHOT IS A NUMBER OF FRAMES. The list was authored in seconds, and at 24 fps six of
   the eight fell between two frames, so every reader rounded the cut for itself. The
   page did it by adding 1/24 at a time and comparing the sum with the seconds: 72 of
   them come to 2.999999999999998, so the first cut fell on frame 73 while the list said
   72, and the film ran 351 frames against a soundtrack of 350. Frames are authored now,
   each cut on the frame it already reached, and seconds are a view of them. */
for(const s of SHOTS) s.d=s.df/FPS;
export const STARTS_F=(()=>{const o=[];let a=0;for(const s of SHOTS){o.push(a);a+=s.df;}return o;})();
export const TOTAL_F=STARTS_F[STARTS_F.length-1]+SHOTS[SHOTS.length-1].df;
export const STARTS=STARTS_F.map(f=>f/FPS);
export const TOTAL=TOTAL_F/FPS;
