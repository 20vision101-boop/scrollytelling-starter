# Scrollytelling Starter

A minimal starter for building a "scroll-driven visual essay" — the same
genre as sites like your friend's `convergence-event-horizon` project.
Plain HTML/CSS/JS, no build step, no framework required.

## What's in here

- `index.html` — page structure: hero + 4 content sections + footer
- `style.css` — dark theme, fade/slide-in-on-scroll styling
- `script.js` — three practice techniques:
  1. `IntersectionObserver` that reveals each `<section class="reveal">`
     as it scrolls into view
  2. A hand-drawn SVG line chart on a log scale (no charting library)
  3. An interactive hover/tap bar comparison

All the sample numbers are **placeholders** — swap `chartData` and
`barData` in `script.js` for data you've actually sourced.

## Run it locally

No build tools needed. Either:

```bash
# open it directly
open index.html

# or serve it (recommended, avoids some browser file:// quirks)
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
