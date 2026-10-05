// Audit-only (geometry v3: the throat is part of the neck, the outline carries the eye notch): flat masks of the head and neck for one frame, same channels as v1.
// grab A: R = head union (face hull + skull + occiput), G = neck, B = hair region inside the head.
// grab B: R = face hull alone, G = skull + occiput.
window.__headMask = (i, which) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const headU = unionPath([{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  const skullU = unionPath([{ pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  if (which === 'A') {
    ctx.fillStyle = '#ff0000'; ctx.fill(headU);
    ctx.fillStyle = '#00ff00'; ctx.fill(unionPath(HP.neck.concat([HP.throat])));
    ctx.save(); ctx.clip(headU); ctx.fillStyle = '#0000ff'; ctx.fill(curvePath(hairRegion(HP.Hd, HP.HS, HP.proj))); ctx.restore();
  } else {
    ctx.fillStyle = '#ff0000'; ctx.fill(curvePath(HP.face));
    ctx.fillStyle = '#00ff00'; ctx.fill(skullU);
  }
  ctx.globalCompositeOperation = 'source-over';
};
// the outline as drawn (traced + smoothed union), for the junction measurement on the real curve
window.__headOutline = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  return eyeNotch(HP, traceUnion([{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }, HP.throat].concat(HP.neck), 2.2)).map((p) => [p.x, p.y]);
};
