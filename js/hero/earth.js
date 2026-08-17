import { CYAN, WARM } from "./palette.js";
import { clamp01, smoothstep, fbm2 } from "./noise.js";

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

const STORMS = [
  { u: 0.33, v: 0.17, size: 0.34, spin: 0.000085, seed: 5, turns: 1.5, arms: 2 },
  { u: 0.60, v: 0.23, size: 0.25, spin: -0.000062, seed: 8, turns: 1.3, arms: 2 },
];

/* Each storm is rendered flat, then spun and foreshortened onto the globe.
   Viewport-independent (fixed 256px), so these survive a resize. */
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

export function createEarth(view) {
  let earthCanvas = null; // pre-rendered; invalidated on resize
  let stormLayer = null;  // scratch buffer for masking storms to the globe
  let stormSprites = null;

  function earthMapper() {
    const { W, H } = view;
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
    const { W, H } = view;
    const { cx, cy, R, topY, depth } = earthMapper();
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

  function buildEarth() {
    const { W, H, DPR } = view;
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

  function draw(t) {
    const { ctx, W, H, DPR } = view;
    const { cx, cy, R, depth, span, map } = earthMapper();

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

  /* Drops the viewport-sized buffers only. The storm sprites are fixed-size
     and expensive to rebuild, so they deliberately survive. */
  function invalidate() {
    earthCanvas = null;
    stormLayer = null;
  }

  return { draw, invalidate };
}
