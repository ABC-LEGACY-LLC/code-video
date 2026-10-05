// Tong · kaptar — edit B as a timeline the page can be asked about: the studio's contract
// (studio/README.md). Loaded last. The shots are drawn by their own renderers (renderFrame); this
// file only says which shot frame stands at which film frame, and draws the joins that are not a
// plain frame: the whip pan from shot 1 to shot 2 and the fades in and out.
//
// The edit itself is EDIT_B below. audit/assemble.py builds the film master from
// audit/film/filmB_frames.json; test/edit.mjs checks that the two say the same thing. The pan and
// the fades are the same arithmetic as assemble.py — smoothstep easing, in linear light, the pan
// smeared along its motion — written for a canvas, so a frame here and the same frame in the
// master can differ by a few levels of rounding, not by what is in it.
'use strict';
const EDIT_B = {
  shots: [{ shot: 's1', from: 0, to: 95 }, { shot: 's2', from: 0, to: 71 }, { shot: 's3', from: 30, to: 95 },
          { shot: 's4', from: 6, to: 95 }, { shot: 's5', from: 0, to: 179 }],
  joins: [{ whip: 5, dx: 453, dy: 93 }, 'cut', 'cut', 'cut'],
  fadeIn: 12, fadeOut: 24,
};
window.EDIT_B = EDIT_B;

// the film, frame by frame: { shot, i } for a plain frame, { whip: {...}, m } for a pan frame
const FILM = (() => {
  const seq = [];
  EDIT_B.shots.forEach((s, k) => {
    let fr = [];
    for (let i = s.from; i <= s.to; i++) fr.push({ shot: s.shot, i });
    const j = k ? EDIT_B.joins[k - 1] : 'cut';
    if (j && j.whip) {
      const n = j.whip, tail = seq.splice(seq.length - n, n), head = fr.slice(0, n);
      for (let m = 0; m < 2 * n; m++) seq.push({ whip: { n, dx: j.dx, dy: j.dy, A: tail[Math.min(m, n - 1)], B: head[Math.max(0, m - n)] }, m, shot: m < n ? tail[0].shot : s.shot });
      fr = fr.slice(n);
    }
    seq.push(...fr);
  });
  return seq;
})();
const FILM_N = FILM.length;

// ------------------------------------------------------------------ pixels in linear light
const LIN = new Float32Array(256);
for (let v = 0; v < 256; v++) { const a = v / 255; LIN[v] = a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4); }
const ENC = (a) => { a = a <= 0 ? 0 : a >= 1 ? 1 : a; return Math.round((a <= 0.0031308 ? a * 12.92 : 1.055 * Math.pow(a, 1 / 2.4) - 0.055) * 255); };
function shotPixels(at) {                           // one shot frame, drawn, as linear RGB
  setShot(at.shot); renderFrame(at.i);
  const d = ctx.getImageData(0, 0, W, H).data, o = new Float32Array(W * H * 3);
  for (let p = 0, q = 0; p < d.length; p += 4, q += 3) { o[q] = LIN[d[p]]; o[q + 1] = LIN[d[p + 1]]; o[q + 2] = LIN[d[p + 2]]; }
  return o;
}
// bilinear sample of a linear image at (x, y); coverage 0 outside it
function linSample(img, x, y, out, k) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  let cov = 0, r = 0, g = 0, b = 0;
  for (const [xx, yy, w] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
    if (xx < 0 || yy < 0 || xx >= W || yy >= H || w === 0) continue;
    const q = (yy * W + xx) * 3; r += img[q] * w; g += img[q + 1] * w; b += img[q + 2] * w; cov += w;
  }
  out[k] = r; out[k + 1] = g; out[k + 2] = b; return cov;
}
function edgeSample(img, x, y, out, k) {             // the same, with the edge carried outward
  return linSample(img, clamp(x, 0, W - 1), clamp(y, 0, H - 1), out, k);
}
// the whip pan: both framings laid side by side as one panorama, the window sliding on an ease,
// each pixel from whichever shot covers it (both, weighted, where both do), then smeared along
// the motion — a whip is a blur, not a slide (assemble.py, "whip")
function whipPixels(w, m) {
  const steps = 2 * w.n, x = (m + 0.5) / steps, pos = smooth, p = pos(x);
  const v = pos(Math.min(1, x + 0.5 / steps)) - pos(Math.max(0, x - 0.5 / steps));
  const A = shotPixels(w.A), B = shotPixels(w.B), img = new Float32Array(W * H * 3);
  const ax = w.dx * p, ay = w.dy * p, bx = -w.dx * (1 - p), by = -w.dy * (1 - p);
  const kB = pos(clamp((p - 0.3) / 0.4, 0, 1)), ca = new Float32Array(3), cb = new Float32Array(3), cn = new Float32Array(3);
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const mA = linSample(A, xx - ax, y - ay, ca, 0), mB = linSample(B, xx - bx, y - by, cb, 0);
    let ga = mA * (1 - kB) + 1e-6 * mA, gb = mB * kB + 1e-6 * mB;
    if (mB < 1e-3) ga = mA; if (mA < 1e-3) gb = mB;
    const q = (y * W + xx) * 3, s = Math.max(ga + gb, 1e-6);
    // ca, cb are what warpAffine gives at a border: the colour already weighed by its coverage
    for (let c = 0; c < 3; c++) img[q + c] = (ca[c] * ga + cb[c] * gb) / s;
    const cov = Math.min(1, mA + mB);
    if (cov < 0.999) {                                // corners neither framing reaches: the nearer edge carried out
      edgeSample(p < 0.5 ? A : B, xx - (p < 0.5 ? ax : bx), y - (p < 0.5 ? ay : by), cn, 0);
      for (let c = 0; c < 3; c++) img[q + c] = img[q + c] * cov + cn[c] * (1 - cov);
    }
  }
  return smearLine(img, w.dx * v, w.dy * v);
}
// a box blur along (vx, vy): the shutter's path, as assemble.py's line kernel (edges replicated)
function smearLine(img, vx, vy) {
  const L = Math.round(Math.max(Math.abs(vx), Math.abs(vy)));
  if (L < 2) return img;
  const taps = new Map();
  for (let s = 0; s <= 4 * L; s++) { const q = -0.5 + s / (4 * L), key = Math.round(L + q * vy) * 4096 + Math.round(L + q * vx); taps.set(key, (taps.get(key) || 0) + 1); }
  const K = [...taps].map(([key, n]) => [Math.floor(key / 4096) - L, (key % 4096) - L, n / (4 * L + 1)]);
  const out = new Float32Array(img.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0;
    for (const [ky, kx, wt] of K) { const yy = clamp(y + ky, 0, H - 1), xx = clamp(x + kx, 0, W - 1), q = (yy * W + xx) * 3; r += img[q] * wt; g += img[q + 1] * wt; b += img[q + 2] * wt; }
    const o = (y * W + x) * 3; out[o] = r; out[o + 1] = g; out[o + 2] = b;
  }
  return out;
}
function fadeOf(n) {
  let g = 1;
  if (EDIT_B.fadeIn && n < EDIT_B.fadeIn) g *= smooth((n + 0.5) / EDIT_B.fadeIn);
  if (EDIT_B.fadeOut && n >= FILM_N - EDIT_B.fadeOut) g *= smooth((FILM_N - n - 0.5) / EDIT_B.fadeOut);
  return g;
}
function putLinear(img, g) {
  const id = ctx.createImageData(W, H), d = id.data;
  for (let p = 0, q = 0; p < d.length; p += 4, q += 3) { d[p] = ENC(img[q] * g); d[p + 1] = ENC(img[q + 1] * g); d[p + 2] = ENC(img[q + 2] * g); d[p + 3] = 255; }
  ctx.putImageData(id, 0, 0);
}

// ------------------------------------------------------------------ the film frame
let filmFrame = 0;
function renderFilmFrame(n) {
  n = clamp(Math.round(n), 0, FILM_N - 1); filmFrame = n;
  const it = FILM[n], g = fadeOf(n);
  if (it.whip) putLinear(whipPixels(it.whip, it.m), g);
  else {
    setShot(it.shot); renderFrame(it.i);
    if (g < 0.9999) {                                  // a fade darkens in linear light, like the master
      const id = ctx.getImageData(0, 0, W, H), d = id.data;
      for (let p = 0; p < d.length; p += 4) { d[p] = ENC(LIN[d[p]] * g); d[p + 1] = ENC(LIN[d[p + 1]] * g); d[p + 2] = ENC(LIN[d[p + 2]] * g); }
      ctx.putImageData(id, 0, 0);
    }
  }
  return { frame: n, shot: it.shot };
}

// ------------------------------------------------------------------ the studio's contract
// A frame here is drawn, not played: a shot frame takes from a tenth of a second to several (the
// slow-motion shot), so "play" draws the next frame as soon as the last one is done.
let playing = false;
window.__frameTo = (n) => { playing = false; return renderFilmFrame(n); };
window.__frame = () => ({ frame: filmFrame, shot: FILM[filmFrame].shot, playing });   // it does not start on its own
window.__pause = () => { playing = false; };
window.__play = (f) => {
  if (Number.isInteger(f)) filmFrame = f;
  if (playing) return; playing = true;
  (function next() { if (!playing) return; renderFilmFrame(filmFrame); filmFrame = (filmFrame + 1) % FILM_N; setTimeout(next, 0); })();
};
window.__totalFrames = FILM_N;
window.__fps = FPS;
window.__shots = (() => { const o = []; FILM.forEach((it, f) => { if (!o.length || o[o.length - 1].k !== it.shot) o.push({ k: it.shot, f }); }); return o; })();
window.__tracks = () => {
  const src = { file: 'src/edit.js', find: 'const EDIT_B = {' };
  const shots = [], joins = [];
  window.__shots.forEach((s, k, L) => shots.push({ f: s.f, n: (k + 1 < L.length ? L[k + 1].f : FILM_N) - s.f, label: s.k, src: { file: 'src/edit.js', find: `{ shot: '${s.k}'` } }));
  FILM.forEach((it, n) => { if (it.whip && it.m === 0) joins.push({ f: n, n: 2 * it.whip.n, label: `whip pan ${it.whip.dx}, ${it.whip.dy} px` }); });
  shots.slice(1).forEach((s, k) => { if (EDIT_B.joins[k] === 'cut') joins.push({ f: s.f, label: 'cut' }); });
  const fades = [{ f: 0, n: EDIT_B.fadeIn, label: 'fade in' }, { f: FILM_N - EDIT_B.fadeOut, n: EDIT_B.fadeOut, label: 'fade out' }];
  const source = window.__shots.map((s, k) => { const e = EDIT_B.shots[k]; return { f: s.f, n: e.to - e.from + 1, label: `${e.shot} frames ${e.from}–${e.to}` }; });
  return [
    { id: 'shots', name: 'Shots', kind: 'clips', src, items: shots },
    { id: 'source', name: 'Shot frames used', kind: 'clips', src, items: source },
    { id: 'joins', name: 'Joins', kind: 'clips', src, items: joins.filter(j => j.n) },
    { id: 'cuts', name: 'Cuts', kind: 'events', src, items: joins.filter(j => !j.n) },
    { id: 'fades', name: 'Fades', kind: 'clips', src, items: fades },
  ];
};
renderFilmFrame(0);
window.__ready = true;
