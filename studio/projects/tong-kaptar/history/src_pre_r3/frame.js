// Tong · kaptar — one frame: layers back to front, then bloom and vignette.
'use strict';

function finish(t) {
  const G = offG.getContext('2d');
  G.setTransform(1, 0, 0, 1, 0, 0);
  G.clearRect(0, 0, W, H);
  G.filter = 'blur(18px) brightness(1.15)';
  G.drawImage(canvas, 0, 0);
  G.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.2;
  ctx.drawImage(offG, 0, 0);
  ctx.restore();
  const v = ctx.createRadialGradient(W * 0.55, H * 0.5, H * 0.35, W * 0.5, H * 0.5, H * 1.05);
  v.addColorStop(0, 'rgba(24,14,44,0)');
  v.addColorStop(1, 'rgba(24,14,44,0.4)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // the vignette must not dim the light source itself: the sun stays the brightest thing
  const s = sunAt(t), g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 46);
  g.addColorStop(0, 'rgba(255,248,226,0.55)');
  g.addColorStop(0.5, 'rgba(255,230,190,0.22)');
  g.addColorStop(1, 'rgba(255,220,180,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(s.x - 46, s.y - 46, 92, 92);
  ctx.restore();
}

// opts.only: draw a single layer on a clear canvas (used by the audit harness to measure it)
function renderFrame(i, only) {
  const t = i / FPS;
  const tc = charFrame(i) / FPS;          // the boy's drawings change on twos, the throw on ones
  const want = (k) => !only || only === k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (only) ctx.clearRect(0, 0, W, H);
  if (want('sky')) {
    drawSky(t);
    drawStars(t);
    drawSunGlow(t);
    drawCirrus(t);
    drawSunDisk(t);
    for (const cl of CLOUDS) drawCloud(cl, t);
    drawFar(t);
    drawBlocks(t);
  }
  if (want('flock')) drawFlock(t);
  if (want('sky')) {
    drawWires(t);
    drawMahalla(t);
    drawSunBloom(t);
    drawMotes(t);
  }
  if (want('flag')) drawPoleFlag(t);
  if (want('sky')) drawParapet(t);
  if (want('coop')) drawCoop(t, tc);
  const held = i < SHEET.release;
  if (!held && want('hero')) drawHeroFlying(t);
  // feathers float at the pigeon's depth, beyond the boy's back: drawn before him
  if (want('feathers')) drawFeathers(t);
  if (want('boy') || only === 'boynobird') {
    drawBoy(t, tc, { noBird: only === 'boynobird' });
  }
  if (only === 'hero' && held) { const R = rig(tc, t); drawHeldBird(R, t, tc); }
  if (!only) finish(t);
}

window.N_FRAMES = N_FRAMES;
window.FPS = FPS;
window.renderFrame = renderFrame;
