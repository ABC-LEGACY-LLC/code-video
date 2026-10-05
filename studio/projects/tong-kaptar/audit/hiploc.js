window.__hiploc = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const W = R.S.waist;
  const dl = (d) => V3(dot3(d, W.x), dot3(d, W.y), dot3(d, W.z));
  const f = (v) => [v.x, v.y, v.z].map((x) => +x.toFixed(4));
  return { Lw: f(toL(W, R.L.W)), Rw: f(toL(W, R.R.W)), Lpn: f(dl(R.L.pn)), Lhd: f(dl(R.L.hd)), Rpn: f(dl(R.R.pn)), Rhd: f(dl(R.R.hd)), LwT: f(toL(W, R.P.wL)), RwT: f(toL(W, R.P.wR)) };
};
