import { CYAN, WARM } from "./palette.js";

const ORBS = [
  { color: WARM, baseX: 0.44, baseY: 0.44, rx: 0.05, ry: 0.04, r: 430, period: 52000, phase: 0.6, alpha: 0.2 },
  { color: WARM, baseX: 0.62, baseY: 0.72, rx: 0.08, ry: 0.05, r: 300, period: 61000, phase: 3.4, alpha: 0.1 },
  { color: CYAN, baseX: 0.5, baseY: 0.42, rx: 0.1, ry: 0.07, r: 280, period: 38000, phase: 0, alpha: 0.16 },
  { color: "124,158,255", baseX: 0.26, baseY: 0.32, rx: 0.16, ry: 0.12, r: 240, period: 46000, phase: 2.1, alpha: 0.13 },
];

const DOT_COUNT = 60;

export function drawOrbs(view, t) {
  const { ctx, W, H } = view;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ORBS.forEach((o) => {
    const angle = (t / o.period) * Math.PI * 2 + o.phase;
    const x = (o.baseX + Math.cos(angle) * o.rx) * W;
    const y = (o.baseY + Math.sin(angle * 0.85) * o.ry) * H;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, o.r);
    grad.addColorStop(0, `rgba(${o.color},${o.alpha})`);
    grad.addColorStop(1, `rgba(${o.color},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/* Volumetric god-rays fanning out from behind the atom. */
export function drawRays(view, t) {
  const { ctx, W, H } = view;
  const cx = W / 2;
  const cy = H * 0.45;
  const len = Math.max(W, H) * 1.1;
  const N = 30;
  const spin = t * 0.0000055;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const broad = i % 3 === 0;
    const halfW = broad ? 0.017 : 0.006;
    const alpha = broad ? 0.05 : 0.022;

    const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    grad.addColorStop(0, `rgba(${CYAN},${alpha})`);
    grad.addColorStop(0.45, `rgba(${CYAN},${alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${CYAN},0)`);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - halfW) * len, Math.sin(a - halfW) * len);
    ctx.lineTo(Math.cos(a + halfW) * len, Math.sin(a + halfW) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* A spiked clockwork orrery in the far distance — concentric rings, radial
   spokes, and a ring of nodes, turning almost imperceptibly. */
export function drawMandala(view, t) {
  const { ctx, W, H } = view;
  const cx = W / 2;
  const cy = H * 0.45;
  const R = Math.min(W, H) * 0.46;
  const spin = -t * 0.000008;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.lineWidth = 1;

  [0.42, 0.58, 0.74, 0.95].forEach((f, i) => {
    ctx.strokeStyle = `rgba(${WARM},${0.07 - i * 0.012})`;
    ctx.beginPath();
    ctx.arc(0, 0, R * f, 0, Math.PI * 2);
    ctx.stroke();
  });

  const SPOKES = 32;
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2;
    const long = i % 4 === 0;
    const inner = R * 0.42;
    const outer = R * (long ? 1.12 : 0.86);
    ctx.strokeStyle = `rgba(${WARM},${long ? 0.075 : 0.04})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();

    if (long) {
      ctx.fillStyle = `rgba(${WARM},0.06)`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const TICKS = 96;
  ctx.strokeStyle = `rgba(${WARM},0.045)`;
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
    ctx.lineTo(Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0);
    ctx.stroke();
  }

  ctx.restore();
}

/* Seeded from the current viewport, so this must be called after the first
   resize() — dots built against an unsized canvas land at NaN. */
export function createDots(view) {
  const { W, H } = view;
  return Array.from({ length: DOT_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    r: 1 + Math.random() * 1.4,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
}

export function drawDots(view, dots, dt) {
  const { ctx, W, H } = view;
  dots.forEach((d) => {
    d.x += d.vx * dt * 0.05;
    d.y += d.vy * dt * 0.05;
    if (d.x < 0) d.x = W;
    if (d.x > W) d.x = 0;
    if (d.y < 0) d.y = H;
    if (d.y > H) d.y = 0;
    d.twinklePhase += 0.006 * dt;
  });

  const maxDist = 108;
  ctx.lineWidth = 1;
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i], b = dots[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        ctx.strokeStyle = `rgba(${CYAN},${0.06 * (1 - dist / maxDist)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  dots.forEach((d) => {
    const twinkle = 0.4 + Math.sin(d.twinklePhase) * 0.3;
    ctx.beginPath();
    ctx.fillStyle = `rgba(205,245,252,${twinkle})`;
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
