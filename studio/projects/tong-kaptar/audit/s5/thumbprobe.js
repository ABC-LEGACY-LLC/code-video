// The thumb's two segments as drawn in a real render of frame i (shot 5): projected ends, half
// widths, length, whether the blob shortcut fired; plus whether the thumb is still part of the
// traced outline (traceUnion keeps one loop: a thumb cut off from the hand is dropped).
// node audit/probe_js.mjs audit/s5/thumbprobe.js thumbProbe 80,81,...   (SHOT=s5)
window.thumbProbe = (i) => {
  const rec = [];
  const d0 = window.digit3, tu0 = window.traceUnion;
  let inHand = false;
  window.digit3 = function (a, b, wa, wb, proj) {
    const pa = proj(a), pb = proj(b);
    const ka = pxPerM(pa.z) * wa / 2, kb = pxPerM(pb.z) * wb / 2;
    const L = len(sub(pb, pa));
    const pts = d0(a, b, wa, wb, proj);
    rec.push({ seg: rec.length % 2, pa: [+pa.x.toFixed(1), +pa.y.toFixed(1)], pb: [+pb.x.toFixed(1), +pb.y.toFixed(1)], ka: +ka.toFixed(2), kb: +kb.toFixed(2), L: +L.toFixed(1), blob: L < 0.6 * Math.max(ka, kb), a3: [a.x, a.y, a.z].map((v) => +v.toFixed(3)), b3: [b.x, b.y, b.z].map((v) => +v.toFixed(3)) });
    return pts;
  };
  // traced outlines: record each outline's y extent near the thumb
  const outs = [];
  window.traceUnion = function (shapes, sigma, behind) {
    const o = tu0(shapes, sigma, behind);
    outs.push({ n: shapes.length, ymax: Math.max(...o.map((p) => p.y)), xr: [Math.min(...o.map((p) => p.x)), Math.max(...o.map((p) => p.x))].map((v) => Math.round(v)) });
    return o;
  };
  try { renderFrame(i, 'boy'); } finally { window.digit3 = d0; window.traceUnion = tu0; }
  return { thumbs: rec, outs: outs.filter((o) => o.n >= 5 && o.n <= 25) };
};
