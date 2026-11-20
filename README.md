# Daymark

A simple daily goal and habit tracker. It's a fast, mobile-first website that you can also install on your phone as an app (PWA) and use offline.

**Live:** https://readablebibleversion.github.io/daymark/

## Features

- **Today (opens first).** A score card with a face that's happy when the day is positive and sad when it's negative. Your daily goals are big rows: tap the circle to finish a once-a-day goal, or use **− / +** for repeats (water ×6) and for habits you're avoiding. Step through days with **‹ ›**.
- **Day goals.** One-off goals for a single day. Each one you finish gives a happy face and **+1**.
- **Weight.** Log your weight in kg or lb. You see the change since your last entry and a trend chart.
- **Week.** The classic grid with one row per goal and one column per day. Tap a square to check it off (tap again for repeats), and press and hold to clear it. Tap a date to open that day.
- **Progress.** Daily and 8-week score charts, a weight trend, and streaks for each goal (days you hit the target, or days a habit stayed clean).
- **Goals.** Add, edit, reorder, archive, restore and delete goals. Settings for theme (system/light/dark) and weight unit are here too.
- **Layout.** Normal page scrolling, a sticky header, a bottom tab bar on phones, and a two-column layout on desktop.
- **Local only.** Data lives in your browser's localStorage on that device. There is no account and no server.

## Run it

You need Node 20.19 or newer.

```powershell
npm install
npm run dev
```

Then open http://localhost:5173. The dev server has live reload but no offline support.

```powershell
npm run build
npm run preview
```

`npm run build` type-checks the code, builds into `dist/`, and generates `dist/sw.js`, the service worker that precaches the site for offline use. `npm run preview` serves the build locally.

## Deploying

The `.github/workflows/deploy.yml` workflow builds and publishes to GitHub Pages on every push to `main`. It sets `BASE_URL=/<repo-name>/` because a Pages project site lives in a subfolder. For a site at a domain root, build without `BASE_URL`. Other static hosts (Netlify, Vercel, Cloudflare Pages) work too: use build command `npm run build` and output folder `dist`.

## Install on your phone

- **iPhone (Safari):** open the site, tap Share, then **Add to Home Screen**.
- **Android (Chrome):** open the site, tap ⋮, then **Install app**.

After the first visit it works with no connection. New versions load the next time you open it online.

> Data stays on the device you use. It doesn't sync, and clearing the site's data in the browser erases it.

## How scoring works

| | Each one |
|---|---|
| Goal check | `+points` (up to *times per day*) |
| Habit check | `−points` each time it happens |
| Day goal finished | `+1` and a happy face |

Day score = the sum. Week score = the 7 days added up. Archived goals keep their history, so they still count in past scores.

## Project layout

```
index.html                PWA head tags; applies the theme before first paint
src/main.tsx              entry + service worker registration
src/App.tsx               header, tabs, theme
src/views/                Today, Week, Progress, Goals
src/GoalEditor.tsx        add/edit sheet (<dialog>)
src/store.tsx             state, actions, localStorage persistence
src/scoring.ts            scores, streaks, weight units
src/date.ts               date helpers (weeks start Monday)
src/ui.tsx, icons.tsx     small UI pieces, SVG charts and icons
src/styles.css            all styling (CSS variables for light/dark)
public/                   manifest + icons (regenerate with `npm run icons`)
scripts/build-sw.mjs      writes dist/sw.js after `vite build`
```
