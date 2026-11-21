# Daymark

A simple daily goal and habit tracker. It's a fast, mobile-first website that you can also install on your phone as an app (PWA) and use offline.

**Live:** https://readablebibleversion.github.io/daymark/

## Features

- **Today (opens first).** A score card with a face that's happy when the day is positive and sad when it's negative. Your daily goals are big rows: tap the circle to finish a once-a-day goal, or use **− / +** for repeats (water ×6) and for habits you're avoiding. Step through days with **‹ ›**.
- **Day goals.** One-off goals for a single day. Each one you finish gives a happy face and **+1**.
- **Notes.** Write a note for each day (Today → Notes), and a note on any goal for that day (the note icon on each goal row), for example to describe a HIIT workout. Notes save as you type. Goals with a note get a small dot on the Week grid.
- **Amounts.** Any goal can track a number each day: steps, minutes, miles, reps, or your own unit. Set it in the goal editor under *Track an amount*, with an optional daily target. Reaching the target checks the goal off automatically. Amounts show on the goal row, in the Week grid ("8.4k"), and as weekly totals and averages in Progress.
- **Weight (its own tab).** Your *trend weight* is a 10%-per-day exponential moving average that smooths out water and salt swings, shown with your weekly rate. The chart (1M / 3M / 6M / 1Y / All) draws each weigh-in as a dot joined to the trend line, plus your goal line. A goal card shows progress from your start weight, round-number milestones (every 5 lb or 2 kg), how much is left, and a projected date at your current pace. You also get a weigh-in history and can log any past date. Pounds by default on US devices; change it under Goals → Settings. The design takes its ideas from trend-based scale apps like Happy Scale but uses Daymark's own look. You see the change since your last entry and a trend chart.
- **Week.** The classic grid with one row per goal and one column per day. Tap a square to check it off (tap again for repeats), and press and hold to clear it. Tap a date to open that day.
- **Progress.** Daily and 8-week score charts, and streaks for each goal (days you hit the target, or days a habit stayed clean).
- **Goals.** Add, edit, reorder, archive, restore and delete goals. Settings for theme (system/light/dark) and weight unit are here too.
- **Layout.** Normal page scrolling, a sticky header, a bottom tab bar on phones, and a two-column layout on desktop.
- **Lock screen.** The site asks for a password before showing anything. Tick *Keep me signed in* to skip it for 30 days on that device, and use the lock icon in the header to lock it again. Only a salted SHA-256 hash of the password is in the code (`src/lock.ts`); to change the password, replace `PASS_HASH` with the output of `node -e "console.log(require('crypto').createHash('sha256').update('daymark-lock-v1:' + 'NEWPASSWORD').digest('hex'))"`. Because the site is static, this is a privacy screen for your device, not server-side security.
- **Local only.** Data lives in your browser's localStorage on that device. There is no account and no server.
- **Backup and restore.** On the Goals tab, **Save backup** writes a `daymark-backup-YYYY-MM-DD.json` file. Phones open the share sheet, so you can save it to Files, iCloud Drive or Google Drive, or email it; desktops download it. **Restore from file** loads a backup and replaces what's on the device, after showing what's in it. After a week of tracking with no backup in 30 days, the Today view shows a gentle reminder.

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

> Data stays on the device you use. It doesn't sync, and clearing the site's data in the browser erases it, so save a backup now and then (Goals → Backup).

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
src/store.tsx             state, actions, localStorage persistence, data validation
src/backup.ts             backup file export/import, reminder timing
src/weight.ts             trend (EMA), weekly rate, goal projection, milestones
src/NoteBox.tsx           auto-growing, auto-saving note field
src/scoring.ts            scores, streaks, weight units
src/date.ts               date helpers (weeks start Monday)
src/ui.tsx, icons.tsx     small UI pieces, SVG charts and icons
src/styles.css            all styling (CSS variables for light/dark)
public/                   manifest + icons (regenerate with `npm run icons`)
scripts/build-sw.mjs      writes dist/sw.js after `vite build`
```
