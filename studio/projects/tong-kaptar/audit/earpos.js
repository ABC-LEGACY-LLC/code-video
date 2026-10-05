// logs the projected centre of each ear outline per frame (for crops)
window.__earpos = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  return HP.ears.map((e) => { const b = bboxOf(e.outline); return { sg: e.sg, lateral: e.lateral, x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, w: b.x1 - b.x0, h: b.y1 - b.y0 }; });
};
