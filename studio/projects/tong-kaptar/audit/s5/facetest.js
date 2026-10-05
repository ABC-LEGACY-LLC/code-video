// render the boy alone, zoomed about his head, with pose/face overrides
window.FT = { T: 27, yaw: -1.3, twist: -0.8, pitch: 0, roll: 0, smile: 1, open: 1, gy: 0.3, gp: -0.1, mouthOpen: 0.5, zoom: 1.6, cx: 905, cy: 520, face: 1 };
function zoomCam5(k, c, t) {
  return { pos: V3(0, 0, 0), f: CAM.f * k, project: (p) => { const q = projW(p, t); return { x: W / 2 + k * (q.x - c.x), y: H / 2 + k * (q.y - c.y), z: q.z }; } };
}
function renderFT(i) {
  const t = FT.T;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9a86b8'); g.addColorStop(1, '#e8b09a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  BOY_POSE = (tc, tt) => { const P = boyPose(95 / FPS, tt); P.aim = 0; P.hYaw = FT.yaw; P.hPitch = FT.pitch; P.hRoll = FT.roll; P.twist = FT.twist; P.neckK = FT.neckK ?? 0.85; return P; };
  setBoyView(zoomCam5(FT.zoom, V(FT.cx, FT.cy), t));
  try { drawBoy5(t, t, { noBird: true, torso: FT.orig ? drawTorso : drawTorso5 }, { face: FT.face, smile: FT.smile, open: FT.open, gy: FT.gy, gp: FT.gp, mouthOpen: FT.mouthOpen }); }
  finally { setBoyView(null); BOY_POSE = null; }
}
defineShot('s5ft', { dur: 1, t0: 0, render: renderFT });
