# Scrollytelling Starter

A minimal starter for building a "scroll-driven visual essay" — the same
genre as sites like your friend's `convergence-event-horizon` project.
Plain HTML/CSS/JS, no build step, no framework required.

## What's in here

- `index.html` — page structure: hero + 5 content sections + footer
- `style.css` — dark theme, fade/slide-in-on-scroll styling
- `js/` — ES modules, one per technique being practiced here. `js/main.js`
  is the entry point and just calls each module's `init`:

  | Module | What it does |
  | --- | --- |
  | `reveal.js` | `IntersectionObserver` that reveals each `<section class="reveal">` as it scrolls into view |
  | `glucose-chart.js` | A hand-drawn SVG line chart on a linear mg/dL scale (no charting library) |
  | `food-bars.js` | An interactive hover/tap bar comparison with a pairing toggle |
  | `diagrams.js` | Two hand-drawn SVG explainer diagrams (the feedback loop in Part Two, the three-input synthesis in Part Five) |
  | `chapter-nav.js` | A chapter navigator that tracks the current section |
  | `labs-panel.js` | A personal-labs panel that persists to `localStorage` (device-only — nothing is sent anywhere) |
  | `hero/` | The procedurally animated canvas hero |

  The hero is split further: `hero/index.js` owns the canvas, the resize
  handling and the render loop, and each layer draws itself —
  `hero/background.js` (gradient orbs, god-rays, orrery, constellation),
  `hero/atom.js`, and `hero/earth.js` (the procedural planet and its
  storms), over shared `hero/noise.js` and `hero/palette.js`.

All the sample numbers are **placeholders** — swap `glucoseSeries` in
`js/glucose-chart.js` and `foodData` in `js/food-bars.js` for data you've
actually sourced.

## Run it locally

No build tools needed, but you do need to serve it over HTTP — the page
loads ES modules, and browsers block those on `file://`, so opening
`index.html` directly gives you a blank, silent page.

```bash
npx serve .
```

## Push to GitHub

```bash
git init
git add .
git commit -m "scrollytelling starter"
gh repo create my-scrollytelling-project --public --source=. --push
# (or create the repo on github.com and `git remote add origin ...` + push)
```

## Deploy to Vercel

1. Go to vercel.com → **Add New Project** → import the GitHub repo you just pushed.
2. Framework preset: choose **Other** (it's a static site — no build command needed).
3. Deploy. Every future push to `main` will auto-deploy; every branch/PR gets its own preview URL.

## Ideas for extending it

- Swap the placeholder dataset for something you actually researched
- Add a second chart type (bar race, scatter, map) as you learn more
- Replace `IntersectionObserver` reveals with a scroll-linked animation
  library (Framer Motion, GSAP ScrollTrigger) once you're comfortable
  with the vanilla version
- Move from plain JS to a framework (Next.js pairs well with Vercel)
  by rebuilding this same page as your second pass
