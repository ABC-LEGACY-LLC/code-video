// the rag's area on screen (px) at frame i: its panels filled into a mask (union, so folds count once)
window.ragArea = (i) => {
  const t = S4.t0 + i / FPS, cam = cam4At(t);
  setBoyView(cam); BOY_POSE = boyPose4;
  try {
    const { scr } = ragAt(i, t), { nu, nv } = RAG, n1 = nv + 1;
    const oc = window.__ragOC || (window.__ragOC = new OffscreenCanvas(1280, 720)), c = oc.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1280, 720); c.fillStyle = '#000';
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) {
      const q = [scr[a * n1 + b], scr[(a + 1) * n1 + b], scr[(a + 1) * n1 + b + 1], scr[a * n1 + b + 1]];
      c.beginPath(); c.moveTo(q[0].x, q[0].y); for (let k = 1; k < 4; k++) c.lineTo(q[k].x, q[k].y); c.closePath(); c.fill();
      for (const p of q) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(1279, Math.ceil(x1)); y1 = Math.min(719, Math.ceil(y1));
    if (x1 < x0 || y1 < y0) return 0;
    const d = c.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1).data;
    let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 128) n++;
    return n;
  } finally { setBoyView(null); BOY_POSE = null; }
};
