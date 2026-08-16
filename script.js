/* ---------- 1. Reveal sections on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ---------- 2. Post-meal glucose response chart (SVG, no library) ----------
   ILLUSTRATIVE DATA — these are hand-shaped curves reflecting well-documented
   *qualitative* patterns (larger/slower peak for fast carbs eaten alone;
   blunted peak with protein/fat/fiber; faster return to baseline after
   light activity). They are not measurements. Swap for your own CGM export
   if you want the real version of this chart. */
const glucoseSeries = [
  {
    name: "Refined carb, alone",
    color: "#ff9e7c",
    points: [
      [0, 92], [15, 110], [30, 145], [45, 168], [60, 160],
      [75, 138], [90, 118], [105, 102], [120, 95], [150, 91],
    ],
  },
  {
    name: "+ protein & fiber",
    color: "#7c9eff",
    points: [
      [0, 92], [15, 100], [30, 118], [45, 131], [60, 128],
      [75, 116], [90, 104], [105, 96], [120, 92], [150, 90],
    ],
  },
  {
    name: "+ 10-min walk after",
    color: "#7cffb2",
    points: [
      [0, 92], [15, 108], [30, 140], [45, 145], [60, 122],
      [75, 103], [90, 93], [105, 90], [120, 89], [150, 90],
    ],
  },
];

function drawChart() {
  const svg = document.getElementById("chart");
  const W = 800, H = 420, M = { top: 30, right: 30, bottom: 60, left: 55 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const xMax = 150; // minutes
  const yMin = 70, yMax = 180; // mg/dL

  const xFor = (min) => M.left + (min / xMax) * innerW;
  const yFor = (mgdl) => M.top + innerH - ((mgdl - yMin) / (yMax - yMin)) * innerH;

  // shaded "typical target" band, ~70-140 mg/dL
  const bandTop = yFor(140);
  const bandBottom = yFor(70);

  const xTicks = [0, 30, 60, 90, 120, 150];
  const yTicks = [70, 100, 130, 160];

  const gridLines = yTicks
    .map(
      (v) => `
      <line x1="${M.left}" y1="${yFor(v)}" x2="${W - M.right}" y2="${yFor(v)}"
            stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="${M.left - 10}" y="${yFor(v) + 4}" text-anchor="end" class="axis-label">${v}</text>
    `
    )
    .join("");

  const xLabels = xTicks
    .map(
      (v) => `<text x="${xFor(v)}" y="${H - M.bottom + 24}" text-anchor="middle" class="axis-label">${v}m</text>`
    )
    .join("");

  const seriesSvg = glucoseSeries
    .map((s) => {
      const d = s.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p[0])} ${yFor(p[1])}`)
        .join(" ");
      const peak = s.points.reduce((a, b) => (b[1] > a[1] ? b : a));
      return `
        <path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" />
        <circle cx="${xFor(peak[0])}" cy="${yFor(peak[1])}" r="4" fill="${s.color}" />
      `;
    })
    .join("");

  const legend = glucoseSeries
    .map(
      (s, i) => `
      <g transform="translate(${M.left + i * 250}, ${M.top - 12})">
        <rect width="12" height="12" rx="3" fill="${s.color}" />
        <text x="18" y="10" class="legend-label">${s.name}</text>
      </g>
    `
    )
    .join("");

  svg.innerHTML = `
    <rect x="${M.left}" y="${bandTop}" width="${innerW}" height="${bandBottom - bandTop}"
          fill="rgba(124,158,255,0.06)" />
    ${gridLines}
    ${xLabels}
    <text x="${M.left - 40}" y="${M.top - 10}" class="axis-label">mg/dL</text>
    ${seriesSvg}
    ${legend}
  `;
}

drawChart();
window.addEventListener("resize", drawChart);

/* ---------- 3. Glycemic load comparison, with a pairing toggle ----------
   ILLUSTRATIVE glycemic load figures for a typical portion, and an
   approximate reduction (~30-40%) when paired with protein/fat/fiber —
   a commonly cited rough effect size, not a precise conversion. */
const foodData = [
  { name: "White rice", gi: 73, alone: 23, paired: 15 },
  { name: "White bread", gi: 75, alone: 20, paired: 13 },
  { name: "Banana", gi: 51, alone: 12, paired: 8 },
  { name: "Oatmeal", gi: 55, alone: 13, paired: 9 },
  { name: "Soda (12oz)", gi: 63, alone: 16, paired: 16 },
  { name: "Lentils", gi: 32, alone: 5, paired: 4 },
];

let paired = false;

function drawBars() {
  const wrap = document.getElementById("bars");
  const max = Math.max(...foodData.map((d) => d.alone));

  wrap.innerHTML = foodData
    .map((d) => {
      const value = paired ? d.paired : d.alone;
      const pct = Math.max((value / max) * 100, 3);
      return `
        <div class="bar-col">
          <div class="val">${value} GL</div>
          <div class="fill" style="height:${pct}%"></div>
          <div class="name">${d.name}</div>
          <div class="gi">GI ${d.gi}</div>
        </div>
      `;
    })
    .join("");
}

drawBars();

const toggleBtn = document.getElementById("pair-toggle");
toggleBtn.addEventListener("click", () => {
  paired = !paired;
  toggleBtn.textContent = paired
    ? "Showing: paired with protein/fiber → click to show alone"
    : "Show: eaten alone → click to pair with protein/fiber";
  toggleBtn.classList.toggle("active", paired);
  drawBars();
});

/* ---------- 4. "Make this yours" — manual lab entry, stored locally ----------
   Everything here stays in localStorage on this device. Reference bands are
   commonly-cited general ranges (ADA-style cutoffs for A1c/glucose; a widely
   used rough HOMA-IR cutoff), not a diagnosis. */
const LABS_KEY = "shape-of-a-spike:labs";

const SUPPLEMENTS = [
  { slug: "berberine", name: "Berberine" },
  { slug: "resistant-starch", name: "Resistant starch" },
  { slug: "acv", name: "Apple cider vinegar" },
  { slug: "chromium", name: "Chromium picolinate" },
  { slug: "magnesium", name: "Magnesium" },
  { slug: "ala", name: "Alpha-lipoic acid" },
];

const a1cBands = [
  { max: 5.6, cls: "ok", label: "normal range" },
  { max: 6.4, cls: "warn", label: "prediabetes range" },
  { max: Infinity, cls: "high", label: "diabetes range" },
];
const glucoseBands = [
  { max: 99, cls: "ok", label: "normal range" },
  { max: 125, cls: "warn", label: "prediabetes range" },
  { max: Infinity, cls: "high", label: "diabetes range" },
];
const homaBands = [
  { max: 1.0, cls: "ok", label: "optimal (commonly cited)" },
  { max: 2.0, cls: "ok", label: "normal insulin sensitivity" },
  { max: 2.9, cls: "warn", label: "borderline" },
  { max: Infinity, cls: "high", label: "signals insulin resistance" },
];

function classify(value, bands) {
  return bands.find((b) => value <= b.max);
}

function loadLabs() {
  try {
    return JSON.parse(localStorage.getItem(LABS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLabs(data) {
  localStorage.setItem(LABS_KEY, JSON.stringify(data));
}

const labInputs = {
  a1c: document.getElementById("input-a1c"),
  glucose: document.getElementById("input-glucose"),
  insulin: document.getElementById("input-insulin"),
};

function paintTag(input, tagEl, bands) {
  const value = parseFloat(input.value);
  if (!value) {
    tagEl.textContent = "";
    tagEl.className = "field-tag";
    return;
  }
  const band = classify(value, bands);
  tagEl.textContent = band.label;
  tagEl.className = `field-tag ${band.cls}`;
}

function renderHoma() {
  const glucose = parseFloat(labInputs.glucose.value);
  const insulin = parseFloat(labInputs.insulin.value);
  const result = document.getElementById("homa-result");
  if (!glucose || !insulin) {
    result.innerHTML = "";
    return;
  }
  const homa = (glucose * insulin) / 405;
  const band = classify(homa, homaBands);
  result.innerHTML = `Estimated HOMA-IR: <span class="field-tag ${band.cls}">${homa.toFixed(2)} — ${band.label}</span>`;
}

function drawSuppPicker(selected) {
  const wrap = document.getElementById("supp-picker");
  wrap.innerHTML = SUPPLEMENTS.map(
    (s) => `
      <label class="supp-check">
        <input type="checkbox" data-slug="${s.slug}" ${selected.includes(s.slug) ? "checked" : ""} />
        ${s.name}
      </label>
    `
  ).join("");

  wrap.querySelectorAll("input[type=checkbox]").forEach((box) => {
    box.addEventListener("change", () => {
      const data = loadLabs();
      const current = new Set(data.supplements || []);
      if (box.checked) current.add(box.dataset.slug);
      else current.delete(box.dataset.slug);
      data.supplements = Array.from(current);
      saveLabs(data);
      applySuppHighlights(data.supplements);
    });
  });
}

function applySuppHighlights(selected) {
  document.querySelectorAll(".supp-card").forEach((card) => {
    card.classList.toggle("taking", selected.includes(card.dataset.supp));
  });
}

function renderLabsFromStorage() {
  const data = loadLabs();
  if (data.a1c) labInputs.a1c.value = data.a1c;
  if (data.glucose) labInputs.glucose.value = data.glucose;
  if (data.insulin) labInputs.insulin.value = data.insulin;
  paintTag(labInputs.a1c, document.getElementById("tag-a1c"), a1cBands);
  paintTag(labInputs.glucose, document.getElementById("tag-glucose"), glucoseBands);
  renderHoma();
  drawSuppPicker(data.supplements || []);
  applySuppHighlights(data.supplements || []);
}

labInputs.a1c.addEventListener("input", () => {
  const data = loadLabs();
  data.a1c = labInputs.a1c.value;
  saveLabs(data);
  paintTag(labInputs.a1c, document.getElementById("tag-a1c"), a1cBands);
});

labInputs.glucose.addEventListener("input", () => {
  const data = loadLabs();
  data.glucose = labInputs.glucose.value;
  saveLabs(data);
  paintTag(labInputs.glucose, document.getElementById("tag-glucose"), glucoseBands);
  renderHoma();
});

labInputs.insulin.addEventListener("input", () => {
  const data = loadLabs();
  data.insulin = labInputs.insulin.value;
  saveLabs(data);
  renderHoma();
});

document.getElementById("clear-data").addEventListener("click", () => {
  localStorage.removeItem(LABS_KEY);
  labInputs.a1c.value = "";
  labInputs.glucose.value = "";
  labInputs.insulin.value = "";
  renderLabsFromStorage();
});

renderLabsFromStorage();

/* ---------- 5. Glowing SVG diagrams ---------- */
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

drawLoopDiagram();
drawConvergeDiagram();
window.addEventListener("resize", () => {
  drawLoopDiagram();
  drawConvergeDiagram();
});

/* ---------- 6. Chapter nav — tracks which Part is in view ---------- */
const chapterSectionIds = ["part-1", "part-2", "part-3", "part-4", "part-5"];
const chapterSections = chapterSectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const chapterCurrent = document.getElementById("chapter-current");
const chapterDots = document.querySelectorAll(".chapter-dot");

const chapterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const idx = chapterSections.indexOf(entry.target);
      if (idx === -1) return;
      chapterCurrent.textContent = String(idx + 1).padStart(2, "0");
      chapterDots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
    });
  },
  { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
);
chapterSections.forEach((el) => chapterObserver.observe(el));

chapterDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    document.getElementById(dot.dataset.target)?.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------- 7. Hero animation — slow drifting gradient mesh + faint orbit rings + constellation ---------- */
(function heroAnimation() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W, H, DPR;
  let earthCanvas = null; // pre-rendered; invalidated on resize
  let stormLayer = null;  // scratch buffer for masking storms to the globe
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    earthCanvas = null;
    stormLayer = null;
  }
  resize();
  window.addEventListener("resize", resize);

  /* Cold cyan subject against a warm distant haze — the Mars-sunset contrast. */
  const CYAN = "110,231,247";
  const WARM = "255,178,110";

  const ORBS = [
    { color: WARM, baseX: 0.44, baseY: 0.44, rx: 0.05, ry: 0.04, r: 430, period: 52000, phase: 0.6, alpha: 0.2 },
    { color: WARM, baseX: 0.62, baseY: 0.72, rx: 0.08, ry: 0.05, r: 300, period: 61000, phase: 3.4, alpha: 0.1 },
    { color: CYAN, baseX: 0.5, baseY: 0.42, rx: 0.1, ry: 0.07, r: 280, period: 38000, phase: 0, alpha: 0.16 },
    { color: "124,158,255", baseX: 0.26, baseY: 0.32, rx: 0.16, ry: 0.12, r: 240, period: 46000, phase: 2.1, alpha: 0.13 },
  ];

  /* The three ellipses of the classic atom symbol, 60° apart. */
  const ORBITALS = [
    { tilt: 0, electronPhase: 0, electronSpeed: 0.00016 },
    { tilt: Math.PI / 3, electronPhase: 2.1, electronSpeed: -0.00013 },
    { tilt: (2 * Math.PI) / 3, electronPhase: 4.2, electronSpeed: 0.00019 },
  ];

  const DOT_COUNT = 60;
  const dots = Array.from({ length: DOT_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    r: 1 + Math.random() * 1.4,
    twinklePhase: Math.random() * Math.PI * 2,
  }));

  function drawOrbs(t) {
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
  function drawRays(t) {
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

  /* --- Procedural Earth ---------------------------------------------------
     Everything below is generated from fixed seeds, so the planet is stable
     across frames and rebuilt only when the viewport changes. Features live
     in (u, v) surface space — u runs along the visible limb, v runs from the
     horizon inward — and are mapped onto the sphere so coastlines and storm
     bands follow the curvature instead of sitting flat on screen. */

  const EARTH_GEOM = {
    RK: 1.6,      // sphere radius as a multiple of viewport width
    TOP: 0.79,    // where the limb crosses, as a fraction of hero height
    A0: Math.PI * 1.32,
    A1: Math.PI * 1.68,
    DEPTH: 0.34,  // how far inland (as a fraction of H) v = 1 reaches
  };

  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  function smoothstep(e0, e1, x) {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }

  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function vnoise2(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  /* Fractal Brownian motion — stacked octaves are what give the surface its
     natural, non-repeating texture instead of smooth blobs. */
  function fbm2(x, y, octaves) {
    let sum = 0;
    let amp = 0.5;
    let fx = x;
    let fy = y;
    for (let i = 0; i < octaves; i++) {
      sum += amp * vnoise2(fx, fy);
      fx *= 2.03;
      fy *= 2.03;
      amp *= 0.5;
    }
    return sum;
  }

  const STORMS = [
    { u: 0.33, v: 0.17, size: 0.34, spin: 0.000085, seed: 5, turns: 1.5, arms: 2 },
    { u: 0.60, v: 0.23, size: 0.25, spin: -0.000062, seed: 8, turns: 1.3, arms: 2 },
  ];
  let stormSprites = null;

  function earthMapper() {
    const cx = W / 2;
    const R = W * EARTH_GEOM.RK;
    const topY = H * EARTH_GEOM.TOP;
    const cy = topY + R;
    const depth = H * EARTH_GEOM.DEPTH;
    const span = EARTH_GEOM.A1 - EARTH_GEOM.A0;
    const map = (u, v) => {
      const a = EARTH_GEOM.A0 + span * u;
      const rr = R - v * depth;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    };
    return { cx, cy, R, topY, depth, span, map };
  }

  /* Per-pixel surface: inverse-map each screen pixel back to (u, v), then
     shade it from elevation, biome, cloud and lighting noise fields. */
  function buildEarthTexture() {
    const { cx, cy, R, topY, depth, span } = earthMapper();
    const A0n = EARTH_GEOM.A0 - Math.PI * 2;
    const A1n = EARTH_GEOM.A1 - Math.PI * 2;

    const yTop = Math.max(Math.floor(topY) - 30, 0);
    const bandH = H - yTop;
    const SCALE = 0.7;
    const tw = Math.max(Math.ceil(W * SCALE), 1);
    const th = Math.max(Math.ceil(bandH * SCALE), 1);

    const tex = document.createElement("canvas");
    tex.width = tw;
    tex.height = th;
    const tctx = tex.getContext("2d");
    const img = tctx.createImageData(tw, th);
    const px = img.data;

    const SEA = 0.5;

    for (let py = 0; py < th; py++) {
      const sy = yTop + py / SCALE;
      for (let pxi = 0; pxi < tw; pxi++) {
        const sx = pxi / SCALE;
        const i4 = (py * tw + pxi) * 4;

        const dx = sx - cx;
        const dy = sy - cy;
        const r = Math.sqrt(dx * dx + dy * dy);

        /* Feather the limb instead of cutting it off — a hard alpha step here
           is what makes the horizon stair-step once the texture is scaled up. */
        const edgeA = smoothstep(R, R - 3.2, r) * smoothstep(R - depth * 1.35, R - depth * 1.28, r);
        if (edgeA <= 0.003) continue;

        const ang = Math.atan2(dy, dx);
        const u = (ang - A0n) / (A1n - A0n);
        const v = (R - r) / depth;
        if (u < -0.05 || u > 1.05) continue;

        /* Domain warp keeps coastlines from looking like plain noise. */
        const wx = fbm2(u * 3.1 + 11.3, v * 2.2 + 4.7, 3);
        const wy = fbm2(u * 3.4 + 27.1, v * 2.5 + 19.2, 3);
        const e = fbm2(u * 7.5 + wx * 1.9, v * 3.2 + wy * 1.9, 6);
        const detail = fbm2(u * 46 + 3.3, v * 20 + 7.7, 3);

        let cr;
        let cg;
        let cb;

        if (e < SEA) {
          const dpt = clamp01((SEA - e) / SEA);
          const shelf = smoothstep(0.0, 0.16, dpt);
          cr = 34 + (10 - 34) * shelf;
          cg = 116 + (38 - 116) * shelf;
          cb = 148 + (86 - 148) * shelf;
          const deep = smoothstep(0.35, 1.0, dpt);
          cr += (6 - cr) * deep * 0.75;
          cg += (26 - cg) * deep * 0.75;
          cb += (60 - cb) * deep * 0.75;
          const swirl = (detail - 0.5) * 10;
          cr += swirl;
          cg += swirl;
          cb += swirl * 1.2;
        } else {
          const h = clamp01((e - SEA) / (1 - SEA));
          const biome = fbm2(u * 9.3 + 61.2, v * 4.1 + 43.8, 4);
          const arid = clamp01(biome * 1.35);

          const sand = [156, 143, 108];
          const green = [54, 84, 48];
          const forest = [36, 62, 38];
          const desert = [150, 126, 84];
          const rock = [108, 96, 78];
          const snow = [226, 230, 234];

          let base;
          if (h < 0.05) {
            const k = h / 0.05;
            base = [
              sand[0] + (green[0] - sand[0]) * k,
              sand[1] + (green[1] - sand[1]) * k,
              sand[2] + (green[2] - sand[2]) * k,
            ];
          } else if (h < 0.45) {
            const k = arid;
            base = [
              forest[0] + (desert[0] - forest[0]) * k,
              forest[1] + (desert[1] - forest[1]) * k,
              forest[2] + (desert[2] - forest[2]) * k,
            ];
            base[0] += (green[0] - base[0]) * 0.35;
            base[1] += (green[1] - base[1]) * 0.35;
            base[2] += (green[2] - base[2]) * 0.35;
          } else if (h < 0.78) {
            const k = smoothstep(0.45, 0.78, h);
            base = [
              desert[0] + (rock[0] - desert[0]) * k,
              desert[1] + (rock[1] - desert[1]) * k,
              desert[2] + (rock[2] - desert[2]) * k,
            ];
          } else {
            const k = smoothstep(0.78, 0.95, h);
            base = [
              rock[0] + (snow[0] - rock[0]) * k,
              rock[1] + (snow[1] - rock[1]) * k,
              rock[2] + (snow[2] - rock[2]) * k,
            ];
          }

          const shade = 0.86 + detail * 0.3;
          cr = base[0] * shade;
          cg = base[1] * shade;
          cb = base[2] * shade;
        }

        /* Cloud deck, warped and thresholded so there are real clearings. */
        const cw = fbm2(u * 5.5 + 101.7, v * 2.8 + 55.1, 3);
        const cl = fbm2(u * 12.5 + cw * 2.6, v * 5.5 + cw * 2.6, 6);
        const cloud = smoothstep(0.51, 0.79, cl) * 0.9;
        if (cloud > 0) {
          const cshade = 232 + detail * 22;
          cr += (cshade - cr) * cloud;
          cg += (cshade + 4 - cg) * cloud;
          cb += (cshade + 10 - cb) * cloud;
        }

        /* Sun from the left; grazing limb picks up atmospheric scatter. */
        const light = clamp01(1.24 - u * 1.32);
        const lit = 0.1 + Math.pow(light, 0.85) * 1.05;
        cr *= lit;
        cg *= lit;
        cb *= lit;

        const limb = smoothstep(0.42, 0.0, v);
        cr += 90 * limb * (0.35 + light * 0.65);
        cg += 150 * limb * (0.35 + light * 0.65);
        cb += 175 * limb * (0.35 + light * 0.65);

        const warmth = smoothstep(0.34, 0.0, Math.abs(u - 0.16)) * (1 - v) * 55;
        cr += warmth;
        cg += warmth * 0.6;
        cb += warmth * 0.25;

        px[i4] = Math.max(0, Math.min(255, cr));
        px[i4 + 1] = Math.max(0, Math.min(255, cg));
        px[i4 + 2] = Math.max(0, Math.min(255, cb));
        px[i4 + 3] = edgeA * 255;
      }
    }

    tctx.putImageData(img, 0, 0);
    return { tex, yTop, bandH };
  }

  /* Each storm is rendered flat, then spun and foreshortened onto the globe. */
  function buildStormSprite(storm) {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const g = c.getContext("2d");
    const img = g.createImageData(S, S);
    const px = img.data;
    const mid = S / 2;
    const Rm = mid * 0.96;
    const eye = 0.085;

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i4 = (y * S + x) * 4;
        const dx = x - mid;
        const dy = y - mid;
        const r = Math.sqrt(dx * dx + dy * dy);
        const rn = r / Rm;
        if (rn > 1) continue;

        const th = Math.atan2(dy, dx);
        const logr = Math.log(Math.max(rn, 0.03));
        const band = Math.sin(storm.arms * th - storm.turns * logr * Math.PI);
        const n = fbm2(dx * 0.055 + storm.seed * 13, dy * 0.055 + storm.seed * 7, 5);
        const fine = fbm2(dx * 0.16 + storm.seed, dy * 0.16 + storm.seed, 3);

        let a = (band * 0.5 + 0.5) * 0.72 + n * 0.62 - 0.42;
        a += (fine - 0.5) * 0.16;
        a *= smoothstep(1.0, 0.62, rn);
        a *= smoothstep(eye * 0.85, eye * 1.9, rn);
        a = clamp01(a);

        const wall = smoothstep(eye * 3.2, eye * 1.25, rn) * smoothstep(eye * 0.9, eye * 1.3, rn);
        a = clamp01(a + wall * 0.55);
        if (a <= 0.004) continue;

        const bright = 226 + fine * 26 + wall * 18;
        px[i4] = Math.min(255, bright);
        px[i4 + 1] = Math.min(255, bright + 6);
        px[i4 + 2] = Math.min(255, bright + 14);
        px[i4 + 3] = a * 255;
      }
    }

    g.putImageData(img, 0, 0);
    return c;
  }

  function buildEarth() {
    const { cx, cy, R, topY, depth } = earthMapper();
    const { tex, yTop, bandH } = buildEarthTexture();

    const c = document.createElement("canvas");
    c.width = Math.max(W * DPR, 1);
    c.height = Math.max(H * DPR, 1);
    const g = c.getContext("2d");
    g.setTransform(DPR, 0, 0, DPR, 0, 0);

    g.save();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(tex, 0, yTop, W, bandH);

    /* source-atop keeps the night side inside the planet's own soft alpha,
       so the terminator never paints over space. */
    g.globalCompositeOperation = "source-atop";
    const night = g.createLinearGradient(W * 0.52, topY, W * 1.02, topY + depth * 0.5);
    night.addColorStop(0, "rgba(2,4,9,0)");
    night.addColorStop(1, "rgba(2,4,9,0.82)");
    g.fillStyle = night;
    g.fillRect(0, yTop, W, H - yTop);
    g.restore();

    g.save();
    g.strokeStyle = `rgba(${CYAN},0.5)`;
    g.lineWidth = 1.5;
    g.shadowColor = `rgba(${CYAN},0.9)`;
    g.shadowBlur = 18;
    g.beginPath();
    g.arc(cx, cy, R, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();

    g.strokeStyle = `rgba(${WARM},0.3)`;
    g.shadowColor = `rgba(${WARM},0.75)`;
    g.shadowBlur = 16;
    g.beginPath();
    g.arc(cx, cy, R, Math.PI * 1.28, Math.PI * 1.46);
    g.stroke();
    g.restore();

    earthCanvas = c;
    if (!stormSprites) stormSprites = STORMS.map((s) => buildStormSprite(s));
  }

  function drawEarth(t) {
    const { cx, cy, R, topY, depth, span, map } = earthMapper();

    const halo = ctx.createRadialGradient(cx, cy, R * 0.99, cx, cy, R * 1.05);
    halo.addColorStop(0, `rgba(${CYAN},0)`);
    halo.addColorStop(0.45, `rgba(${CYAN},0.17)`);
    halo.addColorStop(1, `rgba(${CYAN},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
    ctx.fill();

    if (!earthCanvas) buildEarth();
    ctx.drawImage(earthCanvas, 0, 0, W, H);

    if (!stormLayer) {
      stormLayer = document.createElement("canvas");
      stormLayer.width = Math.max(W * DPR, 1);
      stormLayer.height = Math.max(H * DPR, 1);
    }
    const sg = stormLayer.getContext("2d");
    sg.setTransform(DPR, 0, 0, DPR, 0, 0);
    sg.clearRect(0, 0, W, H);

    STORMS.forEach((s, i) => {
      const sprite = stormSprites && stormSprites[i];
      if (!sprite) return;

      const [x, y] = map(s.u, s.v);
      const a = EARTH_GEOM.A0 + span * s.u;
      const D = s.size * W;
      /* Squash toward the limb's foreshortening, but not all the way — fully
         accurate compression flattens the spiral into an unreadable smear. */
      const foreshorten = depth / (span * R) * 3.1;
      const light = clamp01(1.24 - s.u * 1.32);

      sg.save();
      sg.globalAlpha = 0.22 + Math.pow(light, 0.8) * 0.72;
      sg.translate(x, y);
      sg.rotate(a + Math.PI / 2);
      sg.scale(1, foreshorten);
      sg.rotate(t * s.spin);
      sg.drawImage(sprite, -D / 2, -D / 2, D, D);
      sg.restore();
    });

    /* Mask the storms to the planet using its own antialiased alpha. */
    sg.globalCompositeOperation = "destination-in";
    sg.drawImage(earthCanvas, 0, 0, W, H);
    sg.globalCompositeOperation = "source-over";

    ctx.drawImage(stormLayer, 0, 0, W, H);
  }

  /* A spiked clockwork orrery in the far distance — concentric rings, radial
     spokes, and a ring of nodes, turning almost imperceptibly. */
  function drawMandala(t) {
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

  /* The atom: nucleus + three orbitals, each carrying an electron.
     The whole assembly turns slowly; electrons run at their own rates. */
  function drawAtom(t) {
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

  function drawDots(dt) {
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

  function renderFrame(t, dt) {
    ctx.clearRect(0, 0, W, H);
    drawOrbs(t);
    drawRays(t);
    drawMandala(t);
    drawAtom(t);
    drawDots(dt);
    drawEarth(t);
  }

  let lastTime = null;
  function loop(now) {
    if (lastTime == null) lastTime = now;
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    renderFrame(now, dt);
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    renderFrame(0, 16);
  } else {
    requestAnimationFrame(loop);
  }
})();
