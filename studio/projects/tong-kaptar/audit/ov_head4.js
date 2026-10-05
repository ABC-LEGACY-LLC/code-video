// Audit overlay (v4): skull red, occiput orange, face hull green, neck frustums magenta,
// ears cyan (rim) / white (attachment), face blob centres labelled, eye corner yellow.
window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const line = (pts, col, w = 1, closed = true) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); if (closed) ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(HP.skull.pts, '#ff3030'); line(HP.occ.pts, '#ff9900'); line(HP.face, '#30ff30');
  for (const n of HP.neck) line(n.pts, '#ff00ff');
  for (const e of HP.ears) { line(e.outline, "#00ffff", 1); }
  const Hd = HP.Hd, HS = HP.HS;
  ctx.font = '8px sans-serif';
  const names = ['cb', 'ck', 'ja', 'jw', 'ch', 'mo', 'br'];
  FACE_BLOBS.forEach(([x, y, z, r], k) => {
    for (const sg of x === 0 ? [1] : [1, -1]) {
      const p = HP.proj(toP(Hd, m3(V3(sg * x, y, z), HS)));
      ctx.fillStyle = sg < 0 ? '#ffff00' : '#88ff88';
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      if (sg < 0 || x === 0) ctx.fillText(names[k], p.x + 2, p.y - 2);
    }
  });
  const pv = HP.proj(R.H.pivot), nb = HP.proj(R.H.nb);
  ctx.fillStyle = '#fff'; ctx.fillRect(pv.x - 2, pv.y - 2, 4, 4); ctx.fillRect(nb.x - 2, nb.y - 2, 4, 4);
};
