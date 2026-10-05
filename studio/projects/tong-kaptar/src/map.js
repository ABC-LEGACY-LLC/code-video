// Tong · kaptar — drawing the same world through another camera.
//
// Every layer of the world is drawn by code written in the pixels of the camera it was designed
// for (shot 1's lens, or a virtual lens turned to one side for the parts of the town shot 1 never
// shows). A layer at depth d is a plane in front of that lens, so the map from its pixels to any
// other camera's pixels is a homography: exact for straight lines, and exact for curves once they
// are cut into short pieces. `withMap(M, fn)` runs the layer's own drawing code with every path,
// rectangle, arc and gradient it makes sent through M, and draws the result natively in the new
// camera: no warped bitmap, so the line work stays as crisp as it was drawn.
'use strict';

// ------------------------------------------------------------------ cameras
// A pinhole camera in the sky world (metres; y up). yaw turns it to the right, pitch tips it up.
function makeCam({ pos = V3(0, 0, 0), yaw = 0, pitch = CAM.pitch, f = CAM.f, cx = CAM.cx, cy = CAM.cy } = {}) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const toCam = (p) => {
    const dx = p.x - pos.x, dy = p.y - pos.y, dz = p.z - pos.z;
    const x = dx * cyw - dz * syw, z0 = dx * syw + dz * cyw;
    return V3(x, dy * cp - z0 * sp, z0 * cp + dy * sp);
  };
  const project = (p) => { const c = toCam(p); return { x: cx + f * c.x / c.z, y: cy - f * c.y / c.z, z: c.z }; };
  // the world point on the ray through pixel (sx, sy) at camera depth zc
  const unproject = (sx, sy, zc) => {
    const x = (sx - cx) * zc / f, y = -(sy - cy) * zc / f;
    const dy = y * cp + zc * sp, z0 = zc * cp - y * sp;
    return V3(pos.x + x * cyw + z0 * syw, pos.y + dy, pos.z - x * syw + z0 * cyw);
  };
  // world direction of a pixel (for things at infinity)
  const dirOf = (sx, sy) => n3(s3(unproject(sx, sy, 1), pos));
  const projectDir = (d) => project(a3(pos, m3(d, 1e6)));
  return { pos, yaw, pitch, f, cx, cy, toCam, project, unproject, dirOf, projectDir };
}
// Shot 1's lens as a camera (its crane is a small rise over the shot, see projW)
const CAM1 = makeCam();
const craneH = (t) => craneAt(t) * BOY_D / CAM.f;        // metres the shot-1 lens has risen by t
// Map for a layer drawn in the pixels of `src` (shot 1: projW with its crane; or a virtual
// camera with the same crane) at camera depth d, seen through `dst`.
function layerMap(dst, d, t, src = null) {
  const o = craneAtZ(t, d);
  const un = src ? (x, y) => src.unproject(x, y - o, d) : (x, y) => unprojW(x, y, d, t);
  return (x, y) => { const q = dst.project(un(x, y)); return V(q.x, q.y); };
}

// ------------------------------------------------------------------ recorded paths
// A Path2D stand-in that records its commands in the layer's own pixels; `realizePath` replays
// them through a map into a native Path2D in the target camera's pixels.
const NativePath2D = Path2D;
class RecPath {
  constructor(p) { this.c = p && p.c ? p.c.slice() : []; this.__rec = true; }
  moveTo(x, y) { this.c.push(['M', x, y]); }
  lineTo(x, y) { this.c.push(['L', x, y]); }
  quadraticCurveTo(a, b, x, y) { this.c.push(['Q', a, b, x, y]); }
  bezierCurveTo(a, b, c, d, x, y) { this.c.push(['C', a, b, c, d, x, y]); }
  arc(x, y, r, a0, a1, ccw = false) { this.c.push(['E', x, y, r, r, 0, a0, a1, ccw]); }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw = false) { this.c.push(['E', x, y, rx, ry, rot, a0, a1, ccw]); }
  rect(x, y, w, h) { this.c.push(['R', x, y, w, h]); }
  closePath() { this.c.push(['Z']); }
  addPath(p, m) {
    if (!p || !p.c) return;
    if (!m) { for (const k of p.c) this.c.push(k); return; }
    // only translations are ever passed here
    for (const k of p.c) {
      const q = k.slice();
      const tx = m.e || 0, ty = m.f || 0;
      if (q[0] === 'M' || q[0] === 'L') { q[1] += tx; q[2] += ty; }
      else if (q[0] === 'Q') { q[1] += tx; q[2] += ty; q[3] += tx; q[4] += ty; }
      else if (q[0] === 'C') { q[1] += tx; q[2] += ty; q[3] += tx; q[4] += ty; q[5] += tx; q[6] += ty; }
      else if (q[0] === 'E' || q[0] === 'R') { q[1] += tx; q[2] += ty; }
      this.c.push(q);
    }
  }
}
// Replay a recorded path through F into a native path. Curves are cut into pieces a few pixels
// long (a homography maps a curve to a different curve, but maps a short chord to a chord).
function realizePath(rp, F) {
  const out = new NativePath2D();
  let cur = null, start = null, open = false;
  const put = (x, y) => { const q = F(x, y); if (open) out.lineTo(q.x, q.y); else { out.moveTo(q.x, q.y); open = true; } cur = [x, y]; };
  const segs = (L) => clamp(Math.ceil(L / 5), 1, 64);
  for (const k of rp.c) {
    switch (k[0]) {
      case 'M': { const q = F(k[1], k[2]); out.moveTo(q.x, q.y); open = true; cur = [k[1], k[2]]; start = cur; break; }
      case 'L': if (!cur) { const q = F(k[1], k[2]); out.moveTo(q.x, q.y); open = true; cur = [k[1], k[2]]; start = cur; } else put(k[1], k[2]); break;
      case 'Q': {
        const [x0, y0] = cur || [k[1], k[2]];
        const n = segs(Math.hypot(k[1] - x0, k[2] - y0) + Math.hypot(k[3] - k[1], k[4] - k[2]));
        if (!cur) { const q = F(x0, y0); out.moveTo(q.x, q.y); open = true; start = [x0, y0]; }
        for (let i = 1; i <= n; i++) {
          const u = i / n, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
          put(a * x0 + b * k[1] + c * k[3], a * y0 + b * k[2] + c * k[4]);
        }
        break;
      }
      case 'C': {
        const [x0, y0] = cur || [k[1], k[2]];
        const n = segs(Math.hypot(k[1] - x0, k[2] - y0) + Math.hypot(k[3] - k[1], k[4] - k[2]) + Math.hypot(k[5] - k[3], k[6] - k[4]));
        if (!cur) { const q = F(x0, y0); out.moveTo(q.x, q.y); open = true; start = [x0, y0]; }
        for (let i = 1; i <= n; i++) {
          const u = i / n, v = 1 - u;
          const a = v * v * v, b = 3 * u * v * v, c = 3 * u * u * v, d = u * u * u;
          put(a * x0 + b * k[1] + c * k[3] + d * k[5], a * y0 + b * k[2] + c * k[4] + d * k[6]);
        }
        break;
      }
      case 'E': {
        const [, x, y, rx, ry, rot, a0, a1, ccw] = k;
        let sweep = a1 - a0;
        if (!ccw && sweep < 0) sweep = (sweep % TAU) + TAU;
        if (ccw && sweep > 0) sweep = (sweep % TAU) - TAU;
        if (Math.abs(a1 - a0) >= TAU) sweep = ccw ? -TAU : TAU;
        const n = clamp(Math.ceil((Math.abs(sweep) * Math.max(rx, ry)) / 4), 6, 96);
        const cr = Math.cos(rot), sr = Math.sin(rot);
        for (let i = 0; i <= n; i++) {
          const a = a0 + (sweep * i) / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
          const px = x + ex * cr - ey * sr, py = y + ex * sr + ey * cr;
          if (i === 0 && !cur) { const q = F(px, py); out.moveTo(q.x, q.y); open = true; cur = [px, py]; start = cur; } else put(px, py);
        }
        break;
      }
      case 'R': {
        const [, x, y, w, h] = k;
        const q = [F(x, y), F(x + w, y), F(x + w, y + h), F(x, y + h)];
        out.moveTo(q[0].x, q[0].y); out.lineTo(q[1].x, q[1].y); out.lineTo(q[2].x, q[2].y); out.lineTo(q[3].x, q[3].y); out.closePath();
        cur = [x, y]; start = cur; open = true;
        break;
      }
      case 'Z': out.closePath(); if (start) cur = start; break;
    }
  }
  return out;
}

// ------------------------------------------------------------------ the mapping context
// Stands in for the canvas context while a layer is drawn: keeps the layer's own transform
// (translate/scale/rotate), sends every geometric call through map∘transform, passes everything
// else (colours, alpha, filters, compositing, images already made in target pixels) through.
function makeMappedCtx(real, M) {
  let T = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let lw = real.lineWidth, curPath = null;
  const apply = (x, y) => M(T[0] * x + T[2] * y + T[4], T[1] * x + T[3] * y + T[5]);
  const refresh = () => { MAPF = apply; };
  refresh();
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  // local scale of the map at a user point (for line widths and radii)
  const scaleAt = (x, y) => {
    const o = apply(x, y), ax = apply(x + 1, y), ay = apply(x, y + 1);
    return Math.sqrt(Math.abs((ax.x - o.x) * (ay.y - o.y) - (ax.y - o.y) * (ay.x - o.x)));
  };
  const centreOf = (p) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const k of p.c) for (let i = 1; i + 1 < k.length; i += 2) { if (typeof k[i] !== 'number') continue; x0 = Math.min(x0, k[i]); x1 = Math.max(x1, k[i]); y0 = Math.min(y0, k[i + 1]); y1 = Math.max(y1, k[i + 1]); }
    return Number.isFinite(x0) ? [(x0 + x1) / 2, (y0 + y1) / 2] : [0, 0];
  };
  const dev = (p) => (p && p.__rec ? realizePath(p, apply) : p);
  const rectPath = (x, y, w, h) => { const r = new RecPath(); r.rect(x, y, w, h); return r; };
  const withWidth = (p, fn) => {
    const [cx0, cy0] = p && p.__rec ? centreOf(p) : [0, 0];
    const s = p && p.__rec ? scaleAt(cx0, cy0) : 1;
    real.lineWidth = lw * s;
    fn();
  };
  const api = {
    save() { stack.push({ T: T.slice(), lw }); real.save(); },
    restore() { const s = stack.pop(); if (s) { T = s.T; lw = s.lw; } real.restore(); refresh(); },
    translate(x, y) { T = mul(T, [1, 0, 0, 1, x, y]); refresh(); },
    scale(a, b) { T = mul(T, [a, 0, 0, b, 0, 0]); refresh(); },
    rotate(a) { const c = Math.cos(a), s = Math.sin(a); T = mul(T, [c, s, -s, c, 0, 0]); refresh(); },
    transform(a, b, c, d, e, f) { T = mul(T, [a, b, c, d, e, f]); refresh(); },
    setTransform(a, b, c, d, e, f) { T = typeof a === 'object' ? [a.a, a.b, a.c, a.d, a.e, a.f] : [a, b, c, d, e, f]; refresh(); },
    resetTransform() { T = [1, 0, 0, 1, 0, 0]; refresh(); },
    beginPath() { curPath = new RecPath(); },
    moveTo(x, y) { (curPath ||= new RecPath()).moveTo(x, y); },
    lineTo(x, y) { (curPath ||= new RecPath()).lineTo(x, y); },
    quadraticCurveTo(a, b, x, y) { (curPath ||= new RecPath()).quadraticCurveTo(a, b, x, y); },
    bezierCurveTo(a, b, c, d, x, y) { (curPath ||= new RecPath()).bezierCurveTo(a, b, c, d, x, y); },
    arc(...a) { (curPath ||= new RecPath()).arc(...a); },
    ellipse(...a) { (curPath ||= new RecPath()).ellipse(...a); },
    rect(x, y, w, h) { (curPath ||= new RecPath()).rect(x, y, w, h); },
    closePath() { if (curPath) curPath.closePath(); },
    fill(a, b) {
      if (a && typeof a === 'object') real.fill(dev(a), b); else if (curPath) real.fill(dev(curPath), a);
    },
    stroke(p) { const q = p || curPath; if (!q) return; withWidth(q, () => real.stroke(dev(q))); },
    clip(a, b) { if (a && typeof a === 'object') real.clip(dev(a), b); else if (curPath) real.clip(dev(curPath), a); },
    fillRect(x, y, w, h) { real.fill(dev(rectPath(x, y, w, h))); },
    strokeRect(x, y, w, h) { const r = rectPath(x, y, w, h); withWidth(r, () => real.stroke(dev(r))); },
    clearRect(x, y, w, h) { real.save(); real.clip(dev(rectPath(x, y, w, h))); real.clearRect(0, 0, W, H); real.restore(); },
    createLinearGradient(x0, y0, x1, y1) { const a = apply(x0, y0), b = apply(x1, y1); return real.createLinearGradient(a.x, a.y, b.x, b.y); },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      const a = apply(x0, y0), b = apply(x1, y1), s = scaleAt(x1, y1);
      return real.createRadialGradient(a.x, a.y, r0 * s, b.x, b.y, r1 * s);
    },
    isPointInPath(p, x, y) { if (typeof p === 'object') { const q = apply(x, y); return real.isPointInPath(dev(p), q.x, q.y); } const q = apply(p, x); return curPath ? real.isPointInPath(dev(curPath), q.x, q.y) : false; },
  };
  return new Proxy(real, {
    get(target, prop) {
      if (prop === 'lineWidth') return lw;
      if (prop in api) return api[prop];
      const v = target[prop];
      return typeof v === 'function' ? v.bind(target) : v;
    },
    set(target, prop, value) {
      if (prop === 'lineWidth') { lw = value; return true; }
      target[prop] = value;
      return true;
    },
  });
}
// Draw fn's layer through M. (Path2D is swapped for the recorder while it runs, so paths built by
// the layer's own helpers are recorded too; the real context's transform stays the identity.)
function withMap(M, fn) {
  const real = ctx;
  const P = window.Path2D;
  real.save();
  real.setTransform(1, 0, 0, 1, 0, 0);
  ctx = makeMappedCtx(real, M);
  window.Path2D = RecPath;
  try { fn(); } finally {
    ctx = real;
    window.Path2D = P;
    MAPF = null;
    real.restore();
  }
}
// Build geometry once as recorded paths (for paths a layer prebuilds at load time)
function recorded(fn) {
  const P = window.Path2D;
  window.Path2D = RecPath;
  try { return fn(); } finally { window.Path2D = P; }
}
