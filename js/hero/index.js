import { drawOrbs, drawRays, drawMandala, createDots, drawDots } from "./background.js";
import { drawAtom } from "./atom.js";
import { createEarth } from "./earth.js";

/* Hero animation — slow drifting gradient mesh + faint orbit rings + constellation.
   `view` is a single mutable object: resize() updates it in place, so every
   layer reads the current dimensions without re-wiring anything. */
export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const view = { ctx, W: 0, H: 0, DPR: 1 };
  const earth = createEarth(view);

  function resize() {
    view.DPR = Math.min(window.devicePixelRatio || 1, 2);
    view.W = canvas.clientWidth;
    view.H = canvas.clientHeight;
    canvas.width = view.W * view.DPR;
    canvas.height = view.H * view.DPR;
    ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
    earth.invalidate();
  }
  resize();
  window.addEventListener("resize", resize);

  const dots = createDots(view);

  function renderFrame(t, dt) {
    ctx.clearRect(0, 0, view.W, view.H);
    drawOrbs(view, t);
    drawRays(view, t);
    drawMandala(view, t);
    drawAtom(view, t);
    drawDots(view, dots, dt);
    earth.draw(t);
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
}
