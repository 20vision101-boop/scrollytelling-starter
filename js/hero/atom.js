import { CYAN } from "./palette.js";

/* The three ellipses of the classic atom symbol, 60° apart. */
const ORBITALS = [
  { tilt: 0, electronPhase: 0, electronSpeed: 0.00016 },
  { tilt: Math.PI / 3, electronPhase: 2.1, electronSpeed: -0.00013 },
  { tilt: (2 * Math.PI) / 3, electronPhase: 4.2, electronSpeed: 0.00019 },
];

/* The atom: nucleus + three orbitals, each carrying an electron.
   The whole assembly turns slowly; electrons run at their own rates. */
export function drawAtom(view, t) {
  const { ctx, W, H } = view;
  const cx = W / 2;
  const cy = H * 0.45;
  const scale = Math.min(W, H);
  const a = scale * 0.32;
  const b = scale * 0.115;
  const spin = t * 0.000012;

  ORBITALS.forEach((orb) => {
    const tilt = orb.tilt + spin;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.strokeStyle = `rgba(${CYAN},0.16)`;
    ctx.lineWidth = 1.1;
    ctx.shadowColor = `rgba(${CYAN},0.5)`;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const e = t * orb.electronSpeed + orb.electronPhase;
    const ex = cx + a * Math.cos(e) * Math.cos(tilt) - b * Math.sin(e) * Math.sin(tilt);
    const ey = cy + a * Math.cos(e) * Math.sin(tilt) + b * Math.sin(e) * Math.cos(tilt);

    const halo = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
    halo.addColorStop(0, `rgba(${CYAN},0.5)`);
    halo.addColorStop(1, `rgba(${CYAN},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(220,250,255,0.85)`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const pulse = 1 + Math.sin(t * 0.0006) * 0.12;
  const nucleusR = scale * 0.02 * pulse;

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucleusR * 5);
  glow.addColorStop(0, `rgba(${CYAN},0.3)`);
  glow.addColorStop(1, `rgba(${CYAN},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, nucleusR * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${CYAN},0.5)`;
  ctx.shadowColor = `rgba(${CYAN},0.9)`;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
