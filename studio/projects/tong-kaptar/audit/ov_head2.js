// Audit overlay: every primitive of the head and neck in its own colour (drawn over the boy layer).
window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const P2 = (p) => projB(p, t);
  const line = (pts, col, w = 1, closed = true) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); if (closed) ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(HP.skull.pts, '#ff3030');
  line(HP.occ.pts, '#ff9900');
  line(HP.face.pts, '#30ff30');
  line(HP.jaw.pts, '#00ffff');
  line(HP.nose.pts, '#ffffff');
  line(hairRegion(HP.Hd, HP.HS, HP.proj), '#3070ff', 1.2);
  const Hf = R.H, k = pxPerM(P2(Hf.nb).z);
  const neck = taperQuad(P2(Hf.nb), P2(toP(Hf.neck, V3(0, BODY.neckLen + 0.03, -0.005))), 0.1 * k, 0.092 * k, 0.5, 0.5);
  line(neck, '#ff00ff', 1.2);
  const piv = P2(Hf.pivot), nb = P2(Hf.nb);
  ctx.fillStyle = '#ffff00'; ctx.fillRect(piv.x - 2, piv.y - 2, 4, 4); ctx.fillRect(nb.x - 2, nb.y - 2, 4, 4);
  window.__headInfo = { yaw: R.P.hYaw, pitch: R.H.pitch, aim: R.P.aim };
};
