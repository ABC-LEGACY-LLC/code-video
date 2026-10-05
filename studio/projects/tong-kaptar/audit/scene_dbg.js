// Tong · kaptar — an original 4-second shot drawn entirely in code.
// Dawn over a Tashkent mahalla: a boy in a do‘ppi throws a pigeon up to join the flock.
// Uslub: 2D cel animation authored as Canvas-2D drawings; the boy is drawn on twos
// (12 drawings a second), sky, birds and camera move on ones (24 fps).
(function () {
  const W = 1280, H = 720, FPS = 24, DUR = 4;
  const N_FRAMES = FPS * DUR;

  // ------------------------------------------------------------------ utils
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const V = (x, y) => ({ x, y });
  const add = (a, b) => V(a.x + b.x, a.y + b.y);
  const sub = (a, b) => V(a.x - b.x, a.y - b.y);
  const mul = (a, s) => V(a.x * s, a.y * s);
  const len = (a) => Math.hypot(a.x, a.y);
  const norm = (a) => { const l = len(a) || 1; return V(a.x / l, a.y / l); };
  const perp = (a) => V(-a.y, a.x);
  const rot = (p, g) => V(p.x * Math.cos(g) - p.y * Math.sin(g), p.x * Math.sin(g) + p.y * Math.cos(g));
  const vlerp = (a, b, t) => V(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  const bez2 = (a, b, c, t) => V((1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * b.x + t * t * c.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * b.y + t * t * c.y);

  // Smooth closed/open curve through points (Catmull-Rom -> Bezier) into a Path2D.
  function curvePath(pts, closed = true, path = new Path2D()) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    path.moveTo(pts[0].x, pts[0].y);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = V(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6);
      const c2 = V(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6);
      path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
    }
    if (closed) path.closePath();
    return path;
  }
  const polyPath = (pts) => {
    const p = new Path2D();
    p.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
    p.closePath();
    return p;
  };

  // ------------------------------------------------------------------ canvas
  const canvas = document.getElementById('c');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const offA = mk(), offB = mk(), offR = mk(), offG = mk();

  // Light comes from the low sun behind the boy, to the right and slightly below.
  const LIGHT = norm(V(0.93, 0.37));
  const PAL = {
    line: '#211a30',
    skin: '#7d5062', skinRim: '#ffd6a6',
    hair: '#1b1727', hairRim: '#ffa274',
    shirt: '#8d83b2', shirtFold: '#6f6697', shirtRim: '#fff0da',
    doppi: '#17131f', motif: '#dcd5ee', doppiRim: '#ffb884',
    bird: '#d2cae4', birdShade: '#a198c0', birdRim: '#fff4de', birdLine: '#3b3252',
  };

  // Fill a shape, then add a rim-light band on the edge that faces the sun.
  function fillRim(path, fill, rim, width, dir = LIGHT) {
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (!rim || width <= 0) return;
    const r = offR.getContext('2d');
    r.setTransform(1, 0, 0, 1, 0, 0);
    r.clearRect(0, 0, W, H);
    r.fillStyle = rim;
    r.fill(path);
    r.globalCompositeOperation = 'destination-out';
    r.translate(-dir.x * width, -dir.y * width);
    r.fill(path);
    r.setTransform(1, 0, 0, 1, 0, 0);
    r.globalCompositeOperation = 'source-over';
    ctx.drawImage(offR, 0, 0);
  }
  function ink(path, w = 2.3, color = PAL.line) {
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.stroke(path);
  }

  // ------------------------------------------------------------------ camera
  // The camera tilts up a little over the shot; nearer layers move more.
  const camAt = (t) => 18 * easeInOut(clamp(t / DUR, 0, 1));

  // ------------------------------------------------------------------ sky
  function drawSky(cam) {
    const g = ctx.createLinearGradient(0, -80 + cam * 0.15, 0, 575 + cam * 0.15);
    g.addColorStop(0.0, '#1a2250');
    g.addColorStop(0.26, '#373f7e');
    g.addColorStop(0.5, '#735f9f');
    g.addColorStop(0.7, '#c2819f');
    g.addColorStop(0.85, '#f0a98b');
    g.addColorStop(1.0, '#ffd89c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const sunAt = (t, cam) => V(1112, 516 - t * 1.4 + cam * 0.5);

  function drawSunGlow(t, cam) {
    const s = sunAt(t, cam);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 640);
    rg.addColorStop(0, 'rgba(255,242,210,0.95)');
    rg.addColorStop(0.07, 'rgba(255,224,168,0.7)');
    rg.addColorStop(0.24, 'rgba(255,186,150,0.3)');
    rg.addColorStop(0.55, 'rgba(226,138,166,0.1)');
    rg.addColorStop(1, 'rgba(200,120,160,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // light shafts fanning up-left from the sun
    ctx.filter = 'blur(8px)';
    const R = rng(11);
    for (let i = 0; i < 17; i++) {
      const a0 = Math.PI * (0.95 + R() * 0.62) + Math.sin(t * 0.3 + i * 1.7) * 0.006;
      const w = 0.01 + R() * 0.028;
      const L = 1100;
      ctx.fillStyle = `rgba(255,228,188,${0.035 + R() * 0.06})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(a0 - w) * L, s.y + Math.sin(a0 - w) * L);
      ctx.lineTo(s.x + Math.cos(a0 + w) * L, s.y + Math.sin(a0 + w) * L);
      ctx.closePath();
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();
  }
  function drawSunDisk(t, cam) {
    const s = sunAt(t, cam);
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 40);
    g.addColorStop(0, '#fffbee');
    g.addColorStop(0.62, '#fff1cc');
    g.addColorStop(0.8, 'rgba(255,226,170,0.8)');
    g.addColorStop(1, 'rgba(255,210,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // ------------------------------------------------------------------ clouds
  function cumulus(seed, width, height, n) {
    const R = rng(seed);
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const bump = Math.sin(u * Math.PI);
      const r = lerp(height * 0.22, height * 0.5, bump) * (0.78 + R() * 0.4);
      puffs.push([u * width, -r * 0.62 + R() * 5, r]);
    }
    const m = Math.round(n * 0.75);
    for (let i = 0; i < m; i++) {
      const u = 0.12 + R() * 0.76;
      const bump = Math.sin(u * Math.PI);
      const r = height * (0.2 + R() * 0.3) * (0.7 + bump * 0.5);
      puffs.push([u * width, -height * 0.62 * bump - r * 0.25 - R() * height * 0.2, r]);
    }
    return puffs;
  }
  const CLOUDS = [
    { x: 600, y: 150, s: 0.55, speed: 5, depth: 0.25, puffs: cumulus(7, 320, 70, 9), flat: 4,
      top: '#3d4380', mid: '#5f5492', low: '#a57aa0', rim: '#ffc9a0', glow: 'rgba(236,150,160,0.55)', glow2: 'rgba(255,196,160,0.9)' },
    { x: 40, y: 336, s: 1, speed: 8, depth: 0.35, puffs: cumulus(21, 480, 120, 13), flat: 6,
      top: '#474987', mid: '#6d5e9b', low: '#c1809f', rim: '#ffd3a2', glow: 'rgba(236,150,165,0.55)', glow2: 'rgba(255,200,165,0.95)' },
    { x: 690, y: 296, s: 1, speed: 7, depth: 0.32, puffs: cumulus(33, 540, 112, 14), flat: 6,
      top: '#51508d', mid: '#7866a1', low: '#d38d9f', rim: '#ffdaa8', glow: 'rgba(240,156,165,0.55)', glow2: 'rgba(255,206,168,0.95)' },
    { x: 360, y: 420, s: 0.8, speed: 11, depth: 0.42, puffs: cumulus(45, 340, 66, 10), flat: 4,
      top: '#7663a0', mid: '#a47aa6', low: '#e89c9c', rim: '#ffe2b2', glow: 'rgba(250,170,160,0.6)', glow2: 'rgba(255,214,176,0.95)' },
  ];
  function drawCloud(cl, t, cam) {
    const ox = cl.x - cl.speed * t, oy = cl.y + cam * cl.depth;
    const A = offA.getContext('2d');
    A.setTransform(1, 0, 0, 1, 0, 0);
    A.globalCompositeOperation = 'source-over';
    A.clearRect(0, 0, W, H);
    const puffs = cl.puffs
      .map(([dx, dy, r]) => ({ x: ox + dx * cl.s, y: oy + dy * cl.s, r: r * cl.s }))
      .sort((a, b) => a.y - b.y);
    let top = Infinity;
    for (const p of puffs) top = Math.min(top, p.y - p.r);
    const base = oy + cl.flat * cl.s;
    const g = A.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, cl.top);
    g.addColorStop(0.55, cl.mid);
    g.addColorStop(1, cl.low);
    const union = new Path2D();
    for (const p of puffs) {
      // body (shared gradient, so overlapping puffs merge without seams)
      A.fillStyle = g;
      A.beginPath();
      A.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      A.fill();
      // this puff's own lit underside: a crescent, later puffs overlap it
      const k = clamp((p.y + p.r - top) / (base - top + 1e-3), 0, 1);
      const lg = A.createLinearGradient(0, p.y - p.r * 0.1, 0, p.y + p.r);
      lg.addColorStop(0, 'rgba(255,200,170,0)');
      lg.addColorStop(0.7, cl.glow);
      lg.addColorStop(1, cl.glow2);
      A.fillStyle = lg;
      A.globalAlpha = 0.25 + 0.6 * k;
      A.beginPath();
      A.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      A.fill();
      A.globalAlpha = 1;
      union.moveTo(p.x + p.r, p.y);
      union.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    }
    A.globalAlpha = 1;
    A.globalCompositeOperation = 'destination-out';
    A.fillRect(0, base, W, H);
    // strong warm band along the flat bottom
    const B = offB.getContext('2d');
    B.setTransform(1, 0, 0, 1, 0, 0);
    B.globalCompositeOperation = 'source-over';
    B.clearRect(0, 0, W, H);
    B.save();
    B.beginPath();
    B.rect(0, 0, W, base);
    B.clip();
    B.fillStyle = cl.rim;
    B.fill(union);
    B.restore();
    const d = 7 * cl.s;
    B.globalCompositeOperation = 'destination-out';
    B.save();
    B.translate(0, -d);
    B.beginPath();
    B.rect(0, 0, W, base);
    B.clip();
    B.fill(union);
    B.restore();
    A.globalCompositeOperation = 'source-atop';
    A.drawImage(offB, 0, 0);
    A.globalCompositeOperation = 'source-over';
    // soft top edge: a blurred pass under the sharp one
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.globalAlpha = 0.7;
    ctx.drawImage(offA, 0, -1);
    ctx.restore();
    ctx.drawImage(offA, 0, 0);
  }
  function drawCirrus(t, cam) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const R = rng(3);
    for (let i = 0; i < 9; i++) {
      const x = R() * W * 1.1 - 60 - t * 3;
      const y = 40 + R() * 110 + cam * 0.2;
      const w = 160 + R() * 260, h = 3 + R() * 6;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, 'rgba(210,170,210,0)');
      g.addColorStop(0.5, `rgba(235,185,205,${0.1 + R() * 0.12})`);
      g.addColorStop(1, 'rgba(210,170,210,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ skyline
  function makeCity(seed, yBase, hMin, hMax, wMin, wMax, opts = {}) {
    const R = rng(seed);
    const path = new Path2D();
    const blocks = [];
    let x = -40;
    while (x < W + 40) {
      const w = lerp(wMin, wMax, R());
      const h = lerp(hMin, hMax, Math.pow(R(), 1.3));
      const top = yBase - h;
      path.rect(x, top, w + 1, H - top);
      const b = { x, w, top, extras: [] };
      if (R() < 0.35) {
        const tw = 8 + R() * 14, th = 6 + R() * 10, tx = x + R() * (w - tw);
        path.rect(tx, top - th, tw, th + 1);
        b.extras.push([tx, tw, top - th]);
      }
      if (R() < 0.3) {
        const ax = x + 4 + R() * (w - 8);
        path.rect(ax, top - 18 - R() * 16, 1.6, 34);
      }
      if (opts.trees && R() < opts.trees) {
        const tx = x + w + R() * 6;
        if (R() < 0.6) {
          const th = 50 + R() * 70;
          path.ellipse(tx, yBase - th * 0.5, 7 + R() * 5, th * 0.5, 0, 0, Math.PI * 2);
        } else {
          const r = 16 + R() * 18;
          path.ellipse(tx, yBase - r * 0.9, r * 1.2, r, 0, 0, Math.PI * 2);
        }
      }
      b.seed = Math.floor(R() * 1e9);
      blocks.push(b);
      x += w + (R() < 0.25 ? 6 + R() * 18 : 0);
    }
    return { path, blocks };
  }
  const FAR = makeCity(5, 540, 14, 44, 26, 70, { trees: 0.35 });
  const MID = makeCity(13, 566, 16, 40, 34, 80, { trees: 0.55 });
  const NEAR = makeCity(9, 590, 20, 58, 60, 140, { trees: 0.2 });
  const LANDMARK = (() => {
    const p = new Path2D();
    const cx = 470, base = 532;
    p.rect(cx - 30, base - 22, 60, 24);
    p.moveTo(cx + 34, base - 22);
    p.arc(cx, base - 22, 34, 0, Math.PI, true);
    p.rect(cx - 2, base - 66, 4, 10);
    p.rect(cx + 58, base - 118, 11, 120);
    p.rect(cx + 55, base - 104, 17, 5);
    p.moveTo(cx + 55, base - 118);
    p.lineTo(cx + 63.5, base - 136);
    p.lineTo(cx + 72, base - 118);
    p.closePath();
    return p;
  })();

  function drawFar(t, cam) {
    ctx.save();
    ctx.translate(0, cam * 0.5);
    const g = ctx.createLinearGradient(0, 470, 0, 560);
    g.addColorStop(0, '#9a78a5');
    g.addColorStop(1, '#c690a1');
    ctx.fillStyle = g;
    ctx.fill(LANDMARK);
    ctx.fill(FAR.path);
    ctx.restore();
    const hz = ctx.createLinearGradient(0, 500 + cam * 0.5, 0, 580 + cam * 0.5);
    hz.addColorStop(0, 'rgba(255,200,165,0)');
    hz.addColorStop(1, 'rgba(255,196,160,0.5)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, 480 + cam * 0.5, W, 140);
    ctx.save();
    ctx.translate(0, cam * 0.62);
    const g2 = ctx.createLinearGradient(0, 520, 0, 600);
    g2.addColorStop(0, '#735c8d');
    g2.addColorStop(1, '#8f6d93');
    ctx.fillStyle = g2;
    ctx.fill(MID.path);
    ctx.restore();
  }

  const POLES = [V(120, 600), V(1016, 596)];
  function drawWires(t, cam) {
    ctx.save();
    ctx.translate(0, cam * 0.72);
    ctx.strokeStyle = 'rgba(38,30,58,0.92)';
    ctx.lineWidth = 1.7;
    const tops = POLES.map((p) => V(p.x, p.y - 232));
    for (let k = 0; k < 3; k++) {
      const a = V(tops[0].x - 24 + k * 24, tops[0].y + 6 + k * 1.5);
      const b = V(tops[1].x - 22 + k * 22, tops[1].y + 6 + k * 1.5);
      const sag = 34 + k * 3 + Math.sin(t * 1.3 + k) * 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + sag * 2, b.x, b.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(a.x - 70, a.y + 30, -20, a.y + 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + 90, b.y + 24, W + 20, b.y + 16);
      ctx.stroke();
    }
    for (const p of POLES) {
      ctx.fillStyle = '#2c2442';
      ctx.fillRect(p.x - 3.5, p.y - 240, 7, 240);
      ctx.fillRect(p.x - 34, p.y - 228, 68, 5);
      ctx.fillStyle = 'rgba(255,190,140,0.5)';
      ctx.fillRect(p.x + 2.5, p.y - 240, 1.2, 240);
    }
    ctx.restore();
  }

  function drawNear(t, cam) {
    ctx.save();
    ctx.translate(0, cam * 0.72);
    const g = ctx.createLinearGradient(0, 530, 0, 720);
    g.addColorStop(0, '#54456d');
    g.addColorStop(1, '#3a2f52');
    ctx.fillStyle = g;
    ctx.fill(NEAR.path);
    ctx.fillRect(0, 610, W, H);
    // windows: mostly dark panes, a few already lit
    for (const b of NEAR.blocks) {
      if (b.w < 44) continue;
      const R = rng(b.seed);
      for (let y = b.top + 12; y < H; y += 20) {
        for (let x = b.x + 9; x < b.x + b.w - 14; x += 23) {
          if (R() < 0.18) continue;
          const lit = R() < 0.1;
          ctx.fillStyle = lit ? `rgba(255,${200 + Math.floor(R() * 30)},140,0.85)` : 'rgba(96,82,126,0.55)';
          ctx.fillRect(x, y, 9, 11);
          if (lit) {
            ctx.fillStyle = 'rgba(255,220,160,0.18)';
            ctx.fillRect(x - 4, y - 4, 17, 19);
          }
        }
      }
    }
    // warm light catches the roof edges near the sun
    for (const b of NEAR.blocks) {
      const segs = [[b.x, b.w, b.top], ...b.extras];
      for (const [x0, w, y] of segs) {
        const k = clamp(1 - Math.abs(x0 + w / 2 - 1100) / 900, 0, 1);
        if (k <= 0.05) continue;
        ctx.fillStyle = `rgba(255,190,140,${0.25 + k * 0.6})`;
        ctx.fillRect(x0, y, w, 1.6);
        ctx.fillStyle = `rgba(255,190,140,${0.12 + k * 0.35})`;
        ctx.fillRect(x0 + w - 1.5, y, 1.5, 26);
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ birds
  // A pigeon in flight seen from behind and below: wings on a flap cycle
  // (phase 0 = wings up), body short because it points away from us.
  function gull(x, y, span, phase, bank) {
    const th = Math.cos(phase * Math.PI * 2);
    const reach = span * (0.7 + 0.3 * (1 - Math.abs(th)));
    const lift = -th * span * 0.5;
    const pts = (sx) => ({
      tip: V(sx * reach, lift - span * 0.04),
      wristL: V(sx * span * 0.42, lift * 0.45 - span * 0.07),
      wristT: V(sx * span * 0.4, lift * 0.45 + span * 0.07),
      root: V(sx * span * 0.09, -span * 0.04),
      rootT: V(sx * span * 0.1, span * 0.1),
    });
    const L = pts(-1), R = pts(1);
    const T = (p) => { const q = rot(p, bank); return V(x + q.x, y + q.y); };
    const path = new Path2D();
    const seq = [
      L.tip, L.wristL, L.root, V(0, -span * 0.14), R.root, R.wristL, R.tip,
      R.wristT, R.rootT, V(span * 0.05, span * 0.22), V(-span * 0.05, span * 0.22), L.rootT, L.wristT,
    ].map(T);
    path.moveTo(seq[0].x, seq[0].y);
    for (let i = 1; i <= seq.length; i++) {
      const a = seq[i - 1], b = seq[i % seq.length];
      const m = V((a.x + b.x) / 2, (a.y + b.y) / 2);
      path.quadraticCurveTo(a.x, a.y, m.x, m.y);
    }
    path.closePath();
    return { path, L, R, T, th, span };
  }

  const FLOCK = (() => {
    const R = rng(77);
    const arr = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        ph: -2.3 + R() * 3.0,
        dr: (R() - 0.5) * 90,
        dy: (R() - 0.5) * 46,
        fp: R(),
        ff: 3.0 + R() * 1.8,
        white: R() < 0.6,
        sz: 0.8 + R() * 0.45,
      });
    }
    return arr;
  })();
  const ORBIT = { cx: 430, cy: 190, rx: 300, ry: 62, tilt: -0.08, w: 0.36 };
  function orbitPos(a, dr, dy, cam) {
    const q = rot(V(Math.cos(a) * (ORBIT.rx + dr), Math.sin(a) * (ORBIT.ry + dr * 0.25)), ORBIT.tilt);
    return V(ORBIT.cx + q.x, ORBIT.cy + q.y + dy + cam * 0.4);
  }
  function drawFlock(t, cam) {
    for (const b of FLOCK) {
      const a = b.ph + t * ORBIT.w;
      const p = orbitPos(a, b.dr, b.dy, cam);
      const near = (Math.sin(a) + 1) / 2;
      const span = lerp(8, 14, near) * b.sz;
      const bank = Math.cos(a) * 0.35;
      const g = gull(p.x, p.y, span, t * b.ff + b.fp, bank);
      const col = b.white ? [150, 138, 184] : [66, 54, 92];
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.fill(g.path);
      // white pigeons flash when their wings turn toward the sun
      if (b.white) {
        const flash = clamp(-g.th * 0.8 + 0.15, 0, 1) * clamp(0.4 + Math.cos(a), 0, 1);
        if (flash > 0.03) {
          ctx.save();
          ctx.globalAlpha = flash * 0.9;
          ctx.fillStyle = '#fff4e4';
          ctx.fill(g.path);
          ctx.restore();
        }
      }
    }
  }

  // The white pigeon the boy throws, in flight.
  function drawHeroFlying(x, y, s, phase, bank) {
    const span = 34 * s;
    const g = gull(x, y, span, phase, bank);
    fillRim(g.path, PAL.bird, PAL.birdRim, Math.max(1.4, 3 * s));
    // feather notches along the trailing edge
    const notch = new Path2D();
    for (const side of [g.L, g.R]) {
      for (let i = 1; i <= 4; i++) {
        const u = i / 5;
        const a = g.T(vlerp(side.wristT, side.tip, u));
        const b = g.T(vlerp(side.wristL, side.tip, u + 0.05));
        notch.moveTo(a.x, a.y);
        notch.lineTo(lerp(a.x, b.x, 0.35), lerp(a.y, b.y, 0.35));
      }
    }
    ink(notch, Math.max(0.8, 1.2 * s), PAL.birdShade);
    ink(g.path, Math.max(0.9, 1.6 * s), PAL.birdLine);
    // head seen from behind
    const hc = g.T(V(0, -span * 0.16));
    const hp = new Path2D();
    hp.arc(hc.x, hc.y, span * 0.075, 0, Math.PI * 2);
    fillRim(hp, PAL.bird, PAL.birdRim, 1.2);
    ink(hp, Math.max(0.8, 1.3 * s), PAL.birdLine);
  }

  // The same pigeon held in the hands, seen from the side.
  function drawHeroHeld(x, y, s, heading) {
    const f = V(Math.cos(heading), Math.sin(heading)), n = perp(f);
    const at = (a, b) => V(x + f.x * a * s + n.x * b * s, y + f.y * a * s + n.y * b * s);
    const tail = polyPath([at(-12, -3), at(-27, -6), at(-28, 3), at(-12, 5)]);
    fillRim(tail, PAL.birdShade, PAL.birdRim, 2);
    ink(tail, 1.6, PAL.birdLine);
    const body = curvePath([at(14, -4), at(4, -9), at(-10, -8), at(-16, 0), at(-8, 8), at(8, 9), at(16, 4)]);
    fillRim(body, PAL.bird, PAL.birdRim, 2.5);
    ink(body, 1.8, PAL.birdLine);
    const wing = curvePath([at(8, -6), at(-4, -6), at(-18, -2), at(-6, 2), at(6, 0)]);
    fillRim(wing, PAL.birdShade, PAL.birdRim, 1.6);
    ink(wing, 1.4, PAL.birdLine);
    const head = curvePath([at(15, -9), at(21, -12), at(26, -7), at(22, -1), at(15, -2)]);
    fillRim(head, PAL.bird, PAL.birdRim, 1.8);
    ink(head, 1.6, PAL.birdLine);
    const beak = polyPath([at(25, -9), at(31, -7.5), at(25, -6)]);
    ctx.fillStyle = '#e9a37a';
    ctx.fill(beak);
    const eye = at(22, -8.5);
    ctx.fillStyle = '#2a1f34';
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 1.4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // ------------------------------------------------------------------ rooftop props
  function drawCoop(t, tc, cam) {
    ctx.save();
    ctx.translate(0, cam * 1.05);
    const wood = '#34284a', woodRim = '#e6a57c';
    const box = polyPath([V(24, 604), V(318, 596), V(326, 740), V(18, 740)]);
    ctx.fillStyle = 'rgba(40,30,62,0.8)';
    ctx.fill(box);
    ctx.save();
    ctx.clip(box);
    ctx.strokeStyle = 'rgba(160,140,190,0.3)';
    ctx.lineWidth = 1;
    for (let i = -20; i < 40; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14, 596);
      ctx.lineTo(i * 14 + 150, 746);
      ctx.moveTo(i * 14 + 150, 596);
      ctx.lineTo(i * 14, 746);
      ctx.stroke();
    }
    // birds inside the coop, dim shapes behind the mesh
    ctx.fillStyle = 'rgba(120,104,150,0.5)';
    for (const [x, y] of [[70, 660], [110, 668], [226, 655], [262, 670]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 11, y - 9, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    for (const [x, w] of [[22, 18], [168, 14], [312, 16]]) {
      const p = polyPath([V(x, 600), V(x + w, 599), V(x + w + 3, 740), V(x + 3, 740)]);
      fillRim(p, wood, woodRim, 2.5);
    }
    const roof = polyPath([V(4, 606), V(14, 586), V(334, 578), V(344, 598)]);
    fillRim(roof, '#2b2140', woodRim, 3);
    ink(roof, 2, PAL.line);
    const perched = [V(80, 580), V(118, 578), V(250, 575)];
    perched.forEach((p, i) => {
      const bob = Math.round(Math.sin(tc * 5 + i * 2) * 1.2);
      const look = Math.sin(tc * 2.3 + i * 1.3) > 0.2 ? 1 : -1;
      const body = new Path2D();
      body.ellipse(p.x, p.y - 9 + bob, 12, 8, -0.1 * look, 0, Math.PI * 2);
      const head = new Path2D();
      head.arc(p.x + 11 * look, p.y - 19 + bob, 5, 0, Math.PI * 2);
      const tail = polyPath([V(p.x - 9 * look, p.y - 10 + bob), V(p.x - 22 * look, p.y - 4 + bob), V(p.x - 10 * look, p.y - 4 + bob)]);
      for (const sh of [tail, body, head]) fillRim(sh, '#5d4f7c', '#ffd7ae', 2);
      ctx.fillStyle = '#e9a37a';
      ctx.fillRect(p.x + 15 * look - (look < 0 ? 4 : 0), p.y - 20 + bob, 4, 2);
    });
    ctx.restore();
  }

  function drawPoleFlag(t, tc, cam) {
    const oy = cam * 0.95;
    const base = V(292, 760 + oy), tip = V(150, 232 + oy);
    const d = norm(sub(tip, base)), n = perp(d);
    const pole = polyPath([add(base, mul(n, 4)), add(tip, mul(n, 2)), add(tip, mul(n, -2)), add(base, mul(n, -4))]);
    fillRim(pole, '#3a2d4f', '#f0b485', 2);
    const Lc = 124, Hc = 58;
    const top = [], bot = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const wave = Math.sin(u * 6.2 - t * 10) * 14 * Math.pow(u, 1.2) + Math.sin(u * 2.6 - t * 5.6) * 7 * u;
      const droop = u * u * 16;
      top.push(V(tip.x + 2 - u * Lc, tip.y + 4 + wave + droop));
      bot.push(V(tip.x + 2 - u * Lc * 0.92, tip.y + 4 + Hc * (1 - 0.32 * u) + wave * 1.25 + droop));
    }
    const cloth = curvePath(top.concat(bot.slice().reverse()), true);
    fillRim(cloth, '#b8324a', '#ff9e7a', 3.5);
    // cel shadow in the troughs of the wave
    ctx.save();
    ctx.clip(cloth);
    for (let i = 0; i < 12; i++) {
      const u = i / 12;
      const slope = Math.cos(u * 6.2 - t * 10);
      if (slope < 0.2) continue;
      const a = top[i], b = bot[i];
      ctx.fillStyle = `rgba(90,16,44,${0.35 * slope})`;
      ctx.fillRect(Math.min(a.x, b.x) - 6, a.y - 20, 11, b.y - a.y + 40);
    }
    ctx.restore();
    ink(cloth, 1.8, PAL.line);
  }

  function drawParapet(t, cam) {
    const oy = cam * 1.0;
    ctx.save();
    ctx.translate(0, oy);
    const top = 676;
    const wall = polyPath([V(300, top + 6), V(1290, top - 4), V(1290, 760), V(300, 760)]);
    const g = ctx.createLinearGradient(0, top, 0, 740);
    g.addColorStop(0, '#46395f');
    g.addColorStop(1, '#2f2645');
    ctx.fillStyle = g;
    ctx.fill(wall);
    // brick courses, faint
    ctx.save();
    ctx.clip(wall);
    ctx.strokeStyle = 'rgba(30,22,48,0.45)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      const y = top + 14 + r * 15;
      ctx.beginPath();
      ctx.moveTo(300, y + 0.5);
      ctx.lineTo(1290, y - 9.5);
      ctx.stroke();
      for (let x = 300 + (r % 2) * 18; x < 1290; x += 36) {
        const yy = y - (x - 300) / 99;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + 15);
        ctx.stroke();
      }
    }
    ctx.restore();
    // coping stone with its sunlit edge
    const cap = polyPath([V(296, top), V(1290, top - 10), V(1290, top - 2), V(296, top + 9)]);
    fillRim(cap, '#5a4b77', '#ffc690', 2.2, norm(V(0.3, -1)));
    ctx.restore();
  }

  // ------------------------------------------------------------------ the boy
  // Local frame: origin at the base of the neck (back view), y down. The upper
  // body leans about the hips. Arms are solved with two-bone IK so their length
  // stays constant; `fa`/`fb` shorten a segment that points into the picture.
  const BOY = V(918, 474);
  const HIP = V(0, 200);
  const ARM_A = 104, ARM_B = 94;
  const KEYS = [
    { t: 0.0, dip: 0, lean: 0, head: -0.08, sh: 0, open: 0, wL: V(-40, 96), wR: V(28, 100), faL: 0.92, fbL: 0.34, faR: 0.92, fbR: 0.36 },
    { t: 0.4, dip: 2, lean: 0.005, head: -0.07, sh: 0, open: 0, wL: V(-40, 98), wR: V(28, 102), faL: 0.92, fbL: 0.34, faR: 0.92, fbR: 0.36 },
    { t: 0.62, dip: 12, lean: 0.035, head: 0.02, sh: -3, open: 0, wL: V(-38, 110), wR: V(26, 113), faL: 0.94, fbL: 0.3, faR: 0.94, fbR: 0.32 },
    { t: 0.78, dip: 0, lean: -0.03, head: -0.16, sh: 12, open: 0, wL: V(-72, -54), wR: V(-24, -62), faL: 0.72, fbL: 0.62, faR: 0.7, fbR: 0.64 },
    { t: 0.92, dip: -8, lean: -0.06, head: -0.27, sh: 22, open: 0.55, wL: V(-128, -150), wR: V(-62, -176), faL: 0.9, fbL: 0.95, faR: 0.92, fbR: 0.97 },
    { t: 1.25, dip: -4, lean: -0.07, head: -0.31, sh: 24, open: 1, wL: V(-148, -160), wR: V(-44, -190), faL: 0.94, fbL: 1, faR: 0.95, fbR: 1 },
    { t: 4.0, dip: 0, lean: -0.04, head: -0.3, sh: 14, open: 0.85, wL: V(-164, -96), wR: V(2, -158), faL: 0.92, fbL: 0.92, faR: 0.93, fbR: 0.95 },
  ];
  function poseAt(t) {
    let i = 0;
    while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    let u = clamp((t - a.t) / (b.t - a.t), 0, 1);
    u = i === 3 ? easeOut(u) : i === 2 ? u * u : smooth(u);
    const o = {};
    for (const k of Object.keys(a)) {
      if (k === 't') continue;
      o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k], u) : vlerp(a[k], b[k], u);
    }
    return o;
  }
  function ik(S, T, a, b, outward) {
    let d = sub(T, S);
    let dist = len(d);
    const maxR = (a + b) * 0.999, minR = Math.abs(a - b) + 1;
    const dn = norm(d);
    dist = clamp(dist, minR, maxR);
    const cosA = clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1);
    const A = Math.acos(cosA);
    const e1 = add(S, mul(rot(dn, A), a)), e2 = add(S, mul(rot(dn, -A), a));
    const E = (e1.x - e2.x) * outward > 0 ? e1 : e2;
    const Wr = add(S, mul(dn, dist));
    return { E, Wr };
  }
  function limb(a, b, wa, wb, bulge = 0) {
    const d = norm(sub(b, a)), n = perp(d);
    const m = add(vlerp(a, b, 0.5), mul(n, bulge));
    return curvePath([
      add(a, mul(n, wa / 2)), add(m, mul(n, (wa + wb) / 4 + 1)), add(b, mul(n, wb / 2)),
      add(b, mul(d, wb * 0.35)),
      add(b, mul(n, -wb / 2)), add(m, mul(n, -(wa + wb) / 4 - 1)), add(a, mul(n, -wa / 2)),
      add(a, mul(d, -wa * 0.3)),
    ]);
  }
  function handPath(wrist, dir, s, open, mirror) {
    const d = norm(dir), n = mul(perp(d), mirror);
    const palmC = add(wrist, mul(d, 9 * s));
    const p = new Path2D();
    const palm = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      palm.push(add(palmC, add(mul(d, Math.cos(a) * 10 * s), mul(n, Math.sin(a) * 8.6 * s))));
    }
    curvePath(palm, true, p);
    for (let k = 0; k < 4; k++) {
      const spread = (k - 1.5) * lerp(0.08, 0.3, open) * mirror;
      const fd = rot(d, spread);
      const base = add(palmC, add(mul(d, 6.5 * s), mul(n, (k - 1.5) * 4.1 * s)));
      const L = lerp(7, 12.5, open) * (k === 0 || k === 3 ? 0.86 : 1) * s;
      const tip = add(base, mul(fd, L));
      const fn = perp(fd);
      curvePath([add(base, mul(fn, 2.1 * s)), add(tip, mul(fn, 1.9 * s)), add(tip, mul(fd, 2.1 * s)), add(tip, mul(fn, -1.9 * s)), add(base, mul(fn, -2.1 * s))], true, p);
    }
    const th = add(palmC, mul(n, -6.5 * s));
    const thDir = rot(d, -0.95 * mirror * lerp(0.55, 1.1, open));
    const tn = perp(thDir);
    curvePath([add(th, mul(tn, 2.2 * s)), add(add(th, mul(thDir, 9 * s)), mul(tn, 1.5 * s)), add(th, mul(thDir, 11 * s)), add(add(th, mul(thDir, 9 * s)), mul(tn, -1.5 * s)), add(th, mul(tn, -2.2 * s))], true, p);
    return p;
  }
  // qalampir (pepper) motif: a fat teardrop whose tip hooks over to one side
  function paisley(Hp, cx, cy, w, h, sx = 1) {
    const P = (a, b) => Hp(cx + a * w * sx, cy + b * h);
    const pts = [
      P(0.62, -0.56), P(0.44, -0.3), P(0.5, 0.05), P(0.38, 0.36), P(0.02, 0.5), P(-0.4, 0.36),
      P(-0.5, 0.02), P(-0.3, -0.3), P(0.08, -0.5), P(0.4, -0.62),
    ];
    const p = curvePath(pts);
    ctx.fillStyle = PAL.motif;
    ctx.fill(p);
    ink(curvePath([P(-0.14, 0.3), P(0.16, 0.08), P(0.06, -0.24)], false), 1.5, PAL.doppi);
    ink(curvePath([P(-0.26, 0.18), P(-0.2, -0.1)], false), 1.2, PAL.doppi);
  }

  function drawBoy(t, tc, cam, hero) {
    const P = poseAt(tc);
    const O = V(BOY.x, BOY.y + cam * 1.0 + P.dip);
    const L = (v) => add(O, add(rot(sub(v, HIP), P.lean), HIP));
    const Lw = (v) => add(O, v); // unleaned (legs)
    const sh = P.sh;
    const wind = (k, amp) => Math.sin(tc * 5.6 + k) * amp;
    const LS = V(-60, 20 - sh * 0.7), RS = V(66, 22 - sh * 0.7);

    // trousers
    const legs = polyPath([Lw(V(-52, 190)), Lw(V(60, 190)), Lw(V(66, 330)), Lw(V(-58, 330))]);
    fillRim(legs, '#2e2944', '#ffc79a', 3);
    ink(legs, 2.2);

    // the held pigeon (in front of the chest), then the arms: both are farther
    // from the camera than the torso, so the torso covers them.
    if (hero.held) drawHeroHeld(hero.x, hero.y, hero.s, hero.heading);
    const arm = (S, Wt, fa, fb, mirror) => {
      const Sw = L(S);
      const target = L(Wt);
      const { E, Wr } = ik(Sw, target, ARM_A * fa, ARM_B * fb, mirror);
      const fore = limb(E, Wr, 24, 18, -mirror * 1.5);
      fillRim(fore, PAL.skin, PAL.skinRim, 3);
      ink(fore);
      const hd = handPath(Wr, sub(Wr, E), 1.9, P.open, mirror);
      fillRim(hd, PAL.skin, PAL.skinRim, 2.6);
      ink(hd, 1.9);
      const up = limb(Sw, E, 34, 28, mirror * 2);
      fillRim(up, PAL.shirt, PAL.shirtRim, 4);
      ink(up);
      const cuff = limb(vlerp(Sw, E, 0.82), add(E, mul(norm(sub(Wr, E)), 7)), 33, 31);
      fillRim(cuff, '#aaa1cc', PAL.shirtRim, 3);
      ink(cuff, 2);
      const nn = perp(norm(sub(E, Sw)));
      const q1 = vlerp(Sw, E, 0.3), q2 = vlerp(Sw, E, 0.62);
      const f1 = new Path2D();
      f1.moveTo(q1.x + nn.x * 9, q1.y + nn.y * 9);
      f1.quadraticCurveTo(q2.x, q2.y, q2.x - nn.x * 7, q2.y - nn.y * 7);
      ink(f1, 1.6, PAL.shirtFold);
    };
    arm(LS, P.wL, P.faL, P.fbL, -1);
    arm(RS, P.wR, P.faR, P.fbR, 1);

    // shirt: loose, untucked, the breeze pushing the hem to the left
    const hem = (k) => wind(k, 4) - 3;
    const tor = [
      V(-18, -2), V(-40, 5 - sh * 0.4), V(-62, 14 - sh * 0.7), V(-72, 32 - sh * 0.5),
      V(-67 + wind(0.5, 1.2), 84), V(-58 + wind(1, 2), 150), V(-66 + hem(1.4), 204),
      V(-30, 211 + wind(2, 2)), V(6, 214 + wind(2.6, 2)), V(42, 210 + wind(3.2, 2)),
      V(72 + hem(3.6), 202), V(62 + wind(4, 2), 150), V(73 + wind(4.6, 1.2), 84),
      V(78, 34 - sh * 0.5), V(66, 16 - sh * 0.7), V(42, 5 - sh * 0.4), V(18, -2),
    ].map(L);
    const torso = curvePath(tor);
    fillRim(torso, PAL.shirt, PAL.shirtRim, 5);
    // light through the thin cotton along the lit side
    ctx.save();
    ctx.clip(torso);
    ctx.filter = 'blur(6px)';
    const gl = new Path2D();
    const e1 = L(V(84, 20)), e2 = L(V(82, 214));
    gl.moveTo(e1.x, e1.y);
    gl.lineTo(e2.x, e2.y);
    ctx.strokeStyle = 'rgba(255,214,184,0.45)';
    ctx.lineWidth = 22;
    ctx.stroke(gl);
    ctx.filter = 'none';
    ctx.restore();
    // cel shadows: the shaded left side of the back, plus tension folds
    ctx.save();
    ctx.clip(torso);
    const shade = curvePath([
      L(V(-82, 10)), L(V(-36, 20)), L(V(-20, 70)), L(V(-27, 140)), L(V(-14, 216)), L(V(-92, 230)),
    ]);
    ctx.fillStyle = PAL.shirtFold;
    ctx.fill(shade);
    const k = clamp(sh / 22, 0, 1);
    const fold = (pts, w) => {
      const p = curvePath(pts.map(L));
      ctx.fillStyle = PAL.shirtFold;
      ctx.fill(p);
      void w;
    };
    fold([V(58, 58), V(36, 96 - k * 16), V(12, 160), V(20, 164), V(46, 104 - k * 16), V(67, 66)], 1);
    fold([V(-58, 150), V(-40, 176), V(-44, 214), V(-36, 214), V(-30, 176), V(-46, 146)], 1);
    fold([V(30, 170), V(40, 190), V(36, 214), V(44, 214), V(50, 188), V(40, 166)], 1);
    ctx.restore();
    const crease = new Path2D();
    const s1 = L(V(4, 26)), s2 = L(V(6, 70)), s3 = L(V(2, 110));
    crease.moveTo(s1.x, s1.y);
    crease.quadraticCurveTo(s2.x, s2.y, s3.x, s3.y);
    ink(crease, 1.8, '#6c6394');
    ink(torso, 2.5);

    // neck + collar
    const neck = limb(L(V(0, 10)), L(V(-4, -34)), 31, 28);
    fillRim(neck, PAL.skin, PAL.skinRim, 3);
    ink(neck);
    const collar = curvePath([L(V(-24, -2)), L(V(0, 5)), L(V(24, -2)), L(V(29, 7)), L(V(0, 15)), L(V(-29, 7))]);
    fillRim(collar, '#a39ac6', PAL.shirtRim, 3);
    ink(collar, 2);

    // head: back view, turned up and to the left (lost profile)
    const HC = L(V(-8, -78));
    const g = P.head + P.lean;
    const HS = 1.12;
    const Hp = (x, y) => add(HC, rot(V(x * HS, y * 0.97 * HS), g));
    // the far cheek shows past the back of the head as he looks up (lost profile)
    const cheek = curvePath([Hp(-30, -8), Hp(-46, 0), Hp(-53, 15), Hp(-49, 31), Hp(-35, 44), Hp(-16, 36)]);
    fillRim(cheek, PAL.skin, PAL.skinRim, 2);
    ink(cheek, 2.2);
    const skullPts = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 1 + 0.05 * Math.max(0, Math.sin(a)); // fuller at the back of the crown
      skullPts.push(Hp(Math.cos(a) * 41 * r, Math.sin(a) * 47));
    }
    const skull = curvePath(skullPts);
    fillRim(skull, PAL.hair, PAL.hairRim, 4);
    // short hair: strand lines and soft tufts at the nape, blown left
    const lines = new Path2D();
    for (const [x, y0, y1] of [[-20, -6, 26], [2, -4, 30], [22, -8, 22]]) {
      const a = Hp(x, y0), b = Hp(x - 6, (y0 + y1) / 2), c = Hp(x - 9, y1);
      lines.moveTo(a.x, a.y);
      lines.quadraticCurveTo(b.x, b.y, c.x, c.y);
    }
    ink(lines, 1.3, 'rgba(70,60,98,0.8)');
    const tufts = new Path2D();
    for (let i = 0; i < 6; i++) {
      const x = -24 + i * 9.5;
      const sw = wind(i * 0.8, 2) - 2.5;
      const a1 = Hp(x - 5, 36), a2 = Hp(x + 5, 37), tp = Hp(x + sw - 3, 47 + (i % 2) * 4);
      tufts.moveTo(a1.x, a1.y);
      tufts.quadraticCurveTo(Hp(x - 2, 44).x, Hp(x - 2, 44).y, tp.x, tp.y);
      tufts.quadraticCurveTo(Hp(x + 4, 43).x, Hp(x + 4, 43).y, a2.x, a2.y);
      tufts.closePath();
    }
    fillRim(tufts, PAL.hair, PAL.hairRim, 2);
    ink(skull, 2.5);
    // ear, glowing where the sun shines through it
    const ear = curvePath([Hp(34, -4), Hp(46, 0), Hp(49, 14), Hp(42, 28), Hp(34, 24)]);
    fillRim(ear, '#a3616d', '#ffb48c', 4);
    ink(ear, 2);
    ink(curvePath([Hp(39, 5), Hp(44, 13), Hp(39, 21)], false), 1.5, '#5e3a4c');
    // do‘ppi (Chust style): black, four-sided, white qalampir motifs, stitched rim
    const BL = Hp(-35, -17), BR = Hp(27, -14), TR = Hp(24, -50), TL = Hp(-30, -52);
    const back = curvePath([BL, Hp(-4, -12), BR, Hp(27, -33), TR, Hp(-3, -53), TL, Hp(-34, -35)]);
    const rightF = curvePath([BR, Hp(37, -18), Hp(44, -23), Hp(42, -37), Hp(37, -50), TR, Hp(27, -33)]);
    const leftF = curvePath([BL, Hp(-42, -22), Hp(-43, -37), Hp(-38, -51), TL, Hp(-34, -35)]);
    fillRim(leftF, '#100d16', null, 0);
    fillRim(rightF, '#231c30', PAL.doppiRim, 3.5);
    fillRim(back, PAL.doppi, PAL.doppiRim, 2);
    paisley(Hp, -5, -33, 18, 29);
    const seam = new Path2D();
    for (const [a, b] of [[[27, -14], [24, -50]], [[-35, -17], [-30, -52]]]) {
      const p1 = Hp(...a), p2 = Hp(...b);
      seam.moveTo(p1.x, p1.y);
      seam.lineTo(p2.x, p2.y);
    }
    ink(seam, 1.6, 'rgba(220,212,238,0.85)');
    ink(back, 2.3);
    ink(rightF, 2.1);
    ink(leftF, 2);
    // jiyak: the stitched band along the bottom edge
    const rim = [Hp(-42, -22), BL, Hp(-4, -12), BR, Hp(37, -18), Hp(44, -23)];
    const bandPath = curvePath(rim, false);
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2b2439';
    ctx.stroke(bandPath);
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = PAL.motif;
    ctx.stroke(bandPath);
    ctx.restore();
  }

  // ------------------------------------------------------------------ hero pigeon path
  const RELEASE_T = 0.92;
  function handsAt(t, tc) {
    const P = poseAt(tc);
    const O = V(BOY.x, BOY.y + camAt(t) + P.dip);
    const L = (v) => add(O, add(rot(sub(v, HIP), P.lean), HIP));
    const LSw = L(V(-60, 20 - P.sh * 0.7)), RSw = L(V(66, 22 - P.sh * 0.7));
    const a = ik(LSw, L(P.wL), ARM_A * P.faL, ARM_B * P.fbL, -1).Wr;
    const b = ik(RSw, L(P.wR), ARM_A * P.faR, ARM_B * P.fbR, 1).Wr;
    return { mid: vlerp(a, b, 0.5), P };
  }
  const RELEASE_POS = (() => {
    const tc = Math.floor(RELEASE_T * 12) / 12;
    return add(handsAt(RELEASE_T, tc).mid, V(-8, -34));
  })();
  function heroAt(t, tc) {
    if (t < RELEASE_T) {
      const { mid } = handsAt(t, tc);
      const k = clamp((tc - 0.64) / 0.26, 0, 1);
      const off = vlerp(V(-72, -14), V(-8, -34), smooth(k));
      const p = add(mid, off);
      const heading = lerp(Math.PI + 0.3, Math.PI + 0.8, smooth(k));
      return { held: true, x: p.x, y: p.y, s: 1.25, heading };
    }
    const u = clamp((t - RELEASE_T) / (4.3 - RELEASE_T), 0, 1);
    const P0 = RELEASE_POS;
    const P1 = V(640, 70);
    const P2 = V(440, 150 + camAt(t) * 0.4);
    const ue = 1 - Math.pow(1 - u, 1.8);
    const p = bez2(P0, P1, P2, ue);
    const s = lerp(1.3, 0.42, Math.pow(ue, 0.9));
    const freq = lerp(6.8, 4.2, u);
    return { held: false, x: p.x, y: p.y, s, phase: 0.5 + (t - RELEASE_T) * freq, bank: -0.25 + Math.sin(t * 1.7) * 0.12 };
  }

  // ------------------------------------------------------------------ feathers, dust, flare
  const FEATHERS = [V(-20, 10), V(26, 26), V(-44, 34)].map((o, i) => ({ o, vx: 18 + i * 9, vy: 26 + i * 6, spin: 1.8 + i * 0.7, ph: i }));
  function drawFeathers(t, cam) {
    if (t < RELEASE_T) return;
    const dt = t - RELEASE_T;
    for (const f of FEATHERS) {
      const x = RELEASE_POS.x + f.o.x + f.vx * dt + Math.sin(dt * 3 + f.ph) * 14;
      const y = RELEASE_POS.y + f.o.y + f.vy * dt + cam * 0.2;
      const a = Math.sin(dt * f.spin + f.ph) * 1.1;
      const alpha = clamp(1 - dt / 3.2, 0, 1);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(a);
      const p = new Path2D();
      p.moveTo(0, -10);
      p.quadraticCurveTo(6, -2, 1, 10);
      p.quadraticCurveTo(-5, 0, 0, -10);
      ctx.fillStyle = '#efe7ff';
      ctx.fill(p);
      ctx.strokeStyle = 'rgba(150,135,185,0.9)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.quadraticCurveTo(1.5, 0, 0.5, 12);
      ctx.stroke();
      ctx.restore();
    }
  }
  const MOTES = (() => { const R = rng(99); return Array.from({ length: 34 }, () => ({ x: 700 + R() * 560, y: 250 + R() * 330, s: 0.8 + R() * 1.8, ph: R() * 6.28, v: 4 + R() * 10 })); })();
  function drawMotes(t, cam) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const m of MOTES) {
      const x = m.x - m.v * t * 1.3, y = m.y - m.v * t * 0.6 + Math.sin(t * 1.4 + m.ph) * 4 + cam * 0.6;
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3 + m.ph));
      ctx.fillStyle = `rgba(255,232,190,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, m.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawFlare(t, cam) {
    const s = sunAt(t, cam);
    const c = V(W * 0.5, H * 0.46);
    const dir = sub(c, s);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const ghosts = [[0.55, 26, 'rgba(255,190,150,0.09)'], [0.85, 12, 'rgba(200,220,255,0.1)'], [1.25, 44, 'rgba(255,170,190,0.06)'], [1.6, 18, 'rgba(190,230,210,0.08)']];
    for (const [k, r, col] of ghosts) {
      const p = add(s, mul(dir, k));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, col);
      g.addColorStop(0.75, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function finish() {
    const G = offG.getContext('2d');
    G.setTransform(1, 0, 0, 1, 0, 0);
    G.clearRect(0, 0, W, H);
    G.filter = 'blur(18px) brightness(1.15)';
    G.drawImage(canvas, 0, 0);
    G.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.2;
    ctx.drawImage(offG, 0, 0);
    ctx.restore();
    const v = ctx.createRadialGradient(W * 0.55, H * 0.5, H * 0.35, W * 0.5, H * 0.5, H * 1.05);
    v.addColorStop(0, 'rgba(24,14,44,0)');
    v.addColorStop(1, 'rgba(24,14,44,0.4)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ frame
  function renderFrame(i, only) {
    const want = (k) => !only || only === k;
    const t = i / FPS;
    const tc = Math.floor(t * 12) / 12; // the boy moves on twos
    const cam = camAt(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    if (only) ctx.clearRect(0, 0, W, H);
    if (!only) drawSky(cam);
    if (want('sky')) drawSunGlow(t, cam);
    if (want('sky')) drawCirrus(t, cam);
    if (want('sky')) drawSunDisk(t, cam);
    if (want('sky')) for (const cl of CLOUDS) drawCloud(cl, t, cam);
    if (want('sky')) drawFar(t, cam);
    if (want('flock')) drawFlock(t, cam);
    if (want('sky')) drawWires(t, cam);
    if (want('sky')) drawNear(t, cam);
    if (want('sky')) drawMotes(t, cam);
    if (want('flag')) drawPoleFlag(t, tc, cam);
    if (want('coop')) drawCoop(t, tc, cam);
    if (want('sky')) drawParapet(t, cam);
    const hero = heroAt(t, tc);
    if (want('hero') && !hero.held) drawHeroFlying(hero.x, hero.y, hero.s, hero.phase, hero.bank);
    if (only === 'hero' && hero.held) drawHeroHeld(hero.x, hero.y, hero.s, hero.heading);
    if (want('boy') || only === 'boynobird') drawBoy(t, tc, cam, only === 'boynobird' ? { ...hero, held: false } : hero);
    if (want('feathers')) drawFeathers(t, cam);
    if (want('sky')) drawFlare(t, cam);
    if (!only) finish();
  }

  window.__probe = (i) => {
    const t = i / FPS, tc = Math.floor(t * 12) / 12, cam = camAt(t);
    const P = poseAt(tc);
    const O = V(BOY.x, BOY.y + cam * 1.0 + P.dip);
    const L = (v) => add(O, add(rot(sub(v, HIP), P.lean), HIP));
    const LS = L(V(-60, 20 - P.sh * 0.7)), RS = L(V(66, 22 - P.sh * 0.7));
    const la = ik(LS, L(P.wL), ARM_A * P.faL, ARM_B * P.fbL, -1), ra = ik(RS, L(P.wR), ARM_A * P.faR, ARM_B * P.fbR, 1);
    const HC = L(V(-8, -78));
    const hero = heroAt(t, tc);
    const wind = (k, amp) => Math.sin(tc * 5.6 + k) * amp;
    return { i, t, tc, cam, P, LS, RS, LE: la.E, LW: la.Wr, RE: ra.E, RW: ra.Wr, HC, headAng: P.head + P.lean,
      hero, hem: wind(1.4, 4), tuft0: wind(0, 2), sun: sunAt(t, cam) };
  };
  window.__keys = KEYS;
  window.N_FRAMES = N_FRAMES;
  window.FPS = FPS;
  window.renderFrame = renderFrame;
})();
