// prototype: shot 1's frame at film time T with the boy in shot 1's last pose, head/torso turned
window.PROTO = { T: 24, yaw: 0, twist: 0, pitch: 0 };
function boyPoseProto(tc, t) {
  const P = boyPose(95 / FPS, t);
  P.aim = 0;
  P.hYaw = PROTO.yaw; P.hPitch = PROTO.pitch; P.twist = PROTO.twist;
  return P;
}
function renderProto(i, only) {
  const t = PROTO.T;
  const tc = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  drawSky(t); drawStars(t); drawSunGlow(t); drawCirrus(t); drawSunDisk(t);
  for (const cl of CLOUDS) drawCloud(cl, t);
  drawFar(t); drawBlocks(t);
  drawWires(t); drawMahalla(t); drawSunBloom(t); drawSunCore(t); drawMotes(t);
  drawPoleFlag(t); drawParapet(t); drawCoop(t, tc);
  BOY_POSE = boyPoseProto;
  try { drawBoy(t, tc, { noBird: true }); } finally { BOY_POSE = null; }
  finish(t);
}
defineShot('s5p', { dur: 1, t0: 0, render: renderProto });
