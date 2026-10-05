// Audit overlay (v2 geometry): skull red, occiput orange, face hull green, neck frustums magenta,
// hair region blue, hairline points yellow (seen) / grey (not seen), pivot + neck base squares.
window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const line = (pts, col, w = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(HP.skull.pts, '#ff3030'); line(HP.occ.pts, '#ff9900'); line(HP.face, '#30ff30');
  for (const n of HP.neck) line(n.pts, '#ff00ff');
  line(hairRegion(HP.Hd, HP.HS, HP.proj), '#3070ff', 1.3);
  for (const p of hairlinePts(HP.Hd, HP.HS, HP.proj)) { ctx.fillStyle = p.seen ? '#ffff00' : '#888'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
  const pv = HP.proj(R.H.pivot), nb = HP.proj(R.H.nb);
  ctx.fillStyle = '#fff'; ctx.fillRect(pv.x - 2, pv.y - 2, 4, 4); ctx.fillRect(nb.x - 2, nb.y - 2, 4, 4);
};
