/* "Make this yours" — manual lab entry, stored locally
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

function applySuppHighlights(selected) {
  document.querySelectorAll(".supp-card").forEach((card) => {
    card.classList.toggle("taking", selected.includes(card.dataset.supp));
  });
}

export function initLabsPanel() {
  const labInputs = {
    a1c: document.getElementById("input-a1c"),
    glucose: document.getElementById("input-glucose"),
    insulin: document.getElementById("input-insulin"),
  };

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
}
