// Tong · kaptar — one frame: layers back to front, then bloom and vignette.
'use strict';

// vcen: where the vignette is centred (shot 1: a little right of the frame's centre, toward the sun;
// a shot with the sun out of frame centres it toward the sun, so the frame falls off away from
// the light, not away from its middle)
function finish(t, s = sunAt(t), vcen = V(W * 0.55, H * 0.5), vr = [H * 0.35, H * 1.05]) {
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
  // The vignette must not dim the light source itself: it has a soft hole round the sun, so the
  // sun stays the brightest thing. (The sun's core used to be painted back on after the vignette,
  // on top of everything, and a hand passing in front of the sun came out lit through.)
  const vc = scratch('vignette', W, H), vg = vc.getContext('2d');
  const v = vg.createRadialGradient(vcen.x, vcen.y, vr[0], vcen.x - W * 0.05, vcen.y, vr[1]);
  v.addColorStop(0, 'rgba(24,14,44,0)');
  v.addColorStop(1, 'rgba(24,14,44,0.4)');
  vg.fillStyle = v;
  vg.fillRect(0, 0, W, H);
  vg.globalCompositeOperation = 'destination-out';
  const hole = vg.createRadialGradient(s.x, s.y, 0, s.x, s.y, 50);
  hole.addColorStop(0, 'rgba(0,0,0,1)');
  hole.addColorStop(0.5, 'rgba(0,0,0,0.55)');
  hole.addColorStop(1, 'rgba(0,0,0,0)');
  vg.fillStyle = hole;
  vg.fillRect(s.x - 50, s.y - 50, 100, 100);
  ctx.drawImage(vc, 0, 0, W, H, 0, 0, W, H);
}
// the hot core of the sun, in the sky: whatever passes in front of the sun covers it
function drawSunCore(t) {
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

// Shot 1, "Tong · kaptar": the boy on the roof throws the pigeon up to the flock.
// opts.only: draw a single layer on a clear canvas (used by the audit harness to measure it)
function renderShot1(i, only) {
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
    drawSunCore(t);
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

defineShot('s1', { dur: DUR, t0: 0, render: renderShot1 });

// frame i of the current shot
function renderFrame(i, only) { return SHOT.render(i, only); }

window.FPS = FPS;
window.renderFrame = renderFrame;
// the frame hook the project card measures through (loyihalar/kartalar): it calls hook(k, w, h),
// and renderFrame's second argument is a layer filter, so the card cannot call renderFrame itself
window.__frameTo = (n) => renderFrame(n);
window.setShot = setShot;
setShot('s1');
