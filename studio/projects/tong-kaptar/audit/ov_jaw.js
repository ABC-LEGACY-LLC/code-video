window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const line = (pts, col, w = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(traceUnion(HP.neck, 1.6), '#ff00ff', 1);
  line(HP.throat.pts, '#00ffff', 1);
  line(HP.face, '#00ff00', 1);
  const { Hd, HS, proj } = HP;
  const side = sub(proj(toP(Hd, V3(0, 0, 0.1))), proj(Hd.o)).x < 0 ? -1 : 1;
  for (const k of [6, 7, 8, 9]) { const b = FACE_BLOBS[k]; const p = proj(toP(Hd, m3(V3(side * b[0], b[1], b[2]), HS))); ctx.fillStyle = '#ffff00'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); ctx.font = '7px sans-serif'; ctx.fillText(String(k), p.x + 2, p.y); }
};
