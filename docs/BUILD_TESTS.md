# Build & smoke-test report

Package generated: 13 November 2026 (Bangladesh deadline day).

## Checks completed

- JavaScript syntax checks for `app.js`, `physics.js`, and `moon3d.js` using Node.js 22: **PASS**.
- Python syntax compilation for `scripts/fetch_horizons.py`: **PASS**.
- Synthetic Horizons CSV parser test (two valid timestamp rows): **PASS**.
- HTML ID references and unique ID validation: **PASS**.
- Analysis engine outputs: time-based Sun and Earth angles, percentage metrics, bounded score: **PASS**.
- Optimizer returns five ranked windows from a 30-day search: **PASS**.
- Mock-DOM full application test of initial loading, coordinate selection, date updates, timeline slider, scenario comparison, opportunity finder and custom coordinates: **PASS**.
- HTTP server responded with HTTP 200 for the root `index.html`: **PASS**.

## Limitations of these checks

- A real-browser rendering screenshot could not be produced in the current environment because its headless Chromium process did not finish starting. **Visual/browser QA on a real PC remains necessary.**
- This environment cannot reach external NASA/JPL API endpoints; the optional Horizons fetch script has been syntax-checked and tested against synthetic parser input, **not tested against a live Horizons response**.
- No real LOLA DEM/topography is included. The main screen labels synthetic terrain and the analytical model explicitly.

## Before recording the video

Use the local server, inspect the globe and responsive layout, verify buttons and charts in a normal browser, and test the GitHub Pages URL in incognito. If the optional Horizons downloader fails on the user's machine, continue with the clearly labeled analytical mode instead of presenting made-up NASA measurements.
