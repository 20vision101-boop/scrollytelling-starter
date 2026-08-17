/* Post-meal glucose response chart (SVG, no library)
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

export function initGlucoseChart() {
  drawChart();
  window.addEventListener("resize", drawChart);
}
