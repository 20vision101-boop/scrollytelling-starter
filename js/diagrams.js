/* Glowing SVG diagrams */
function drawLoopDiagram() {
  const svg = document.getElementById("loop-diagram");
  const W = 520, H = 380;
  const cx = W / 2, cy = H / 2 + 10;
  const R = 130;

  const nodes = [
    { label: "Eat carbs", sub: "meal begins", angle: -90 },
    { label: "Glucose rises", sub: "absorbed into blood", angle: 0 },
    { label: "Insulin responds", sub: "pancreas signals cells", angle: 90 },
    { label: "Cells absorb it", sub: "back toward baseline", angle: 180 },
  ];

  const pts = nodes.map((n) => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });

  const arrows = pts
    .map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      const mx = (p.x + next.x) / 2;
      const my = (p.y + next.y) / 2;
      const ctrlX = cx + (mx - cx) * 0.55;
      const ctrlY = cy + (my - cy) * 0.55;
      return `<path d="M ${p.x} ${p.y} Q ${ctrlX} ${ctrlY} ${next.x} ${next.y}"
        fill="none" stroke="url(#loop-grad)" stroke-width="2.5"
        marker-end="url(#loop-arrow)" filter="url(#loop-glow)" opacity="0.85" />`;
    })
    .join("");

  const nodeEls = pts
    .map(
      (p) => `
      <circle cx="${p.x}" cy="${p.y}" r="8" fill="#0a0a0f" stroke="#7c9eff" stroke-width="2" filter="url(#loop-glow)" />
      <text x="${p.x}" y="${p.y - 20}" text-anchor="middle" class="loop-label">${p.label}</text>
      <text x="${p.x}" y="${p.y + 26}" text-anchor="middle" class="loop-sub">${p.sub}</text>
    `
    )
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="loop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c9eff" />
        <stop offset="100%" stop-color="#ff9e7c" />
      </linearGradient>
      <filter id="loop-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff9e7c" />
      </marker>
    </defs>
    ${arrows}
    ${nodeEls}
  `;
}

function drawConvergeDiagram() {
  const svg = document.getElementById("converge-diagram");
  const W = 520, H = 400;
  const cx = W / 2, cy = H / 2;
  const R = 150;

  const nodes = [
    { label: "Bloodwork", sub: "A1c · insulin · HOMA-IR", angle: -90, color: "#7c9eff" },
    { label: "Body composition", sub: "visceral fat · lean mass", angle: 30, color: "#ff9e7c" },
    { label: "Tracking", sub: "food · supplements · CGM", angle: 150, color: "#7cffb2" },
  ];

  const pts = nodes.map((n) => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });

  const lines = pts
    .map(
      (p) => `
      <line x1="${p.x}" y1="${p.y}" x2="${cx}" y2="${cy}"
        stroke="${p.color}" stroke-width="2" opacity="0.5" filter="url(#converge-glow)" />
    `
    )
    .join("");

  const nodeEls = pts
    .map(
      (p) => `
      <circle cx="${p.x}" cy="${p.y}" r="10" fill="#0a0a0f" stroke="${p.color}" stroke-width="2.5" filter="url(#converge-glow)" />
      <text x="${p.x}" y="${p.y - 22}" text-anchor="middle" class="loop-label">${p.label}</text>
      <text x="${p.x}" y="${p.y + 28}" text-anchor="middle" class="loop-sub">${p.sub}</text>
    `
    )
    .join("");

  svg.innerHTML = `
    <defs>
      <filter id="converge-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    ${lines}
    <circle cx="${cx}" cy="${cy}" r="26" fill="rgba(124,158,255,0.12)" stroke="#7c9eff" stroke-width="2" filter="url(#converge-glow)" />
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="converge-center">YOUR</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="converge-center">PLAN</text>
    ${nodeEls}
  `;
}

export function initDiagrams() {
  drawLoopDiagram();
  drawConvergeDiagram();
  window.addEventListener("resize", () => {
    drawLoopDiagram();
    drawConvergeDiagram();
  });
}
