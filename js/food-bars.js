/* Glycemic load comparison, with a pairing toggle
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

export function initFoodBars() {
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
}
