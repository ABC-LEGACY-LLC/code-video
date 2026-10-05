window.setBase = (hR, aPhi, aBeta, idx = [0, 1]) => {
  const A = coneFrame(aPhi, aBeta).A;
  for (const i of idx) { const k = BOY4_KEYS[i]; k.aPhi = aPhi; k.aBeta = aBeta; k.q = a3(hR, m3(A, POLE_SQ * k.span)); }
};
window.setRest = (butt, aPhi, aBeta, idx) => {
  const A = coneFrame(aPhi, aBeta).A;
  for (const i of idx) { const k = BOY4_KEYS[i]; k.aPhi = aPhi; k.aBeta = aBeta; k.q = a3(butt, m3(A, POLE.gripR + POLE_SQ * k.span)); }
};
