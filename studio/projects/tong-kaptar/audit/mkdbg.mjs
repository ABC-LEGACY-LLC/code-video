// Builds an instrumented COPY of scene.js for auditing (the source stays clean).
// Adds: renderFrame(i, only) layer isolation + window.__probe(i) state dump.
import fs from 'node:fs';
const ROOT = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');
const src = fs.readFileSync(process.argv[2] || (ROOT + '/history/scene.js'), 'utf8');
let out = src;
const must = (from, to) => {
  const n = out.split(from).length - 1;
  if (n !== 1) throw new Error(`patch anchor matched ${n}x: ${from.slice(0, 60)}`);
  out = out.replace(from, to);
};
// 1) layer isolation: wrap each draw call in renderFrame with a guard
must('  function renderFrame(i) {', '  function renderFrame(i, only) {\n    const want = (k) => !only || only === k;');
must('    ctx.filter = \'none\';\n    drawSky(cam);', "    ctx.filter = 'none';\n    if (only) ctx.clearRect(0, 0, W, H);\n    if (!only) drawSky(cam);");
const guards = [
  ['    drawSunGlow(t, cam);\n', 'sky'], ['    drawCirrus(t, cam);\n', 'sky'], ['    drawSunDisk(t, cam);\n', 'sky'],
  ['    for (const cl of CLOUDS) drawCloud(cl, t, cam);\n', 'sky'], ['    drawFar(t, cam);\n', 'sky'],
  ['    drawFlock(t, cam);\n', 'flock'], ['    drawWires(t, cam);\n', 'sky'], ['    drawNear(t, cam);\n', 'sky'],
  ['    drawMotes(t, cam);\n', 'sky'], ['    drawPoleFlag(t, tc, cam);\n', 'flag'], ['    drawCoop(t, tc, cam);\n', 'coop'],
  ['    drawParapet(t, cam);\n', 'sky'], ['    drawFeathers(t, cam);\n', 'feathers'], ['    drawFlare(t, cam);\n', 'sky'],
  ['    finish();\n  }\n', null],
];
for (const [line, key] of guards) {
  if (key === null) must(line, '    if (!only) finish();\n  }\n');
  else must(line, `    if (want('${key}')) ${line.trim()}\n`);
}
must('    if (!hero.held) drawHeroFlying(hero.x, hero.y, hero.s, hero.phase, hero.bank);\n    drawBoy(t, tc, cam, hero);\n',
  "    if (want('hero') && !hero.held) drawHeroFlying(hero.x, hero.y, hero.s, hero.phase, hero.bank);\n" +
  "    if (only === 'hero' && hero.held) drawHeroHeld(hero.x, hero.y, hero.s, hero.heading);\n" +
  "    if (want('boy') || only === 'boynobird') drawBoy(t, tc, cam, only === 'boynobird' ? { ...hero, held: false } : hero);\n");
// 2) state probe
must('  window.N_FRAMES = N_FRAMES;', `  window.__probe = (i) => {
    const t = i / FPS, tc = Math.floor(t * 12) / 12, cam = camAt(t);
    const P = poseAt(tc);
    const O = V(BOY.x, BOY.y + cam * 1.0 + P.dip);
    const L = (v) => add(O, add(rot(sub(v, HIP), P.lean), HIP));
    const LS = L(V(-60, 20 - P.sh * 0.7)), RS = L(V(66, 22 - P.sh * 0.7));
    const la = ik(LS, L(P.wL), ARM_A * P.faL, ARM_B * P.fbL, -1), ra = ik(RS, L(P.wR), ARM_A * P.faR, ARM_B * P.fbR, 1);
    const HC = L(V(-8, -78));
    const hero = heroAt(t, tc);
    const wind = (k, amp) => Math.sin(tc * 5.6 + k) * amp;
    return { i, t, tc, cam, P, LS, RS, LE: la.E, LW: la.Wr, RE: ra.E, RW: ra.Wr, HC, headAng: P.head + P.lean,
      hero, hem: wind(1.4, 4), tuft0: wind(0, 2), sun: sunAt(t, cam) };
  };
  window.__keys = KEYS;
  window.N_FRAMES = N_FRAMES;`);
fs.writeFileSync((ROOT + '/audit/scene_dbg.js'), out);
fs.writeFileSync((ROOT + '/audit/scene_dbg.html'),
  '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}canvas{display:block}</style></head><body><canvas id="c"></canvas><script src="scene_dbg.js"></script></body></html>');
console.log('ok, patched', out.length - src.length, 'chars');
