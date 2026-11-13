# LUNARIS — 2026 NASA-style UI Release Notes

- Reworked the entire interface into six dedicated workflow screens: Overview → Mission Planner → Visibility Analysis → Compare 4 Missions → Data & Methods → Final Report.
- Added step-navigation bars and contextual Next/Back buttons, plus URL hash navigation and browser history support.
- Increased type sizes, contrast, clickable areas, and mobile responsiveness.
- Applied an independent dark navy / black / white / blue / yellow design inspired by space mission-control design. No NASA insignia or false NASA endorsement is used.
- Preserved the native WebGL lunar sphere and added an enhanced texture fallback for browsers without WebGL.
- Added 3D-looking illustrative Sun and Earth globes (Sun from CSS, Earth from a generated public-domain shoreline texture). These images are not NASA spacecraft photographs or an astrophysical angular scale.
- Expanded mission selection from 6 to 16 entries plus editable custom lunar coordinates.
- Expanded side-by-side comparison from 2 to 4 site/date scenarios.
- Added a final dedicated report screen with Markdown export, per-sample CSV export, and print mode.
- Retained animated visibility timelines, topocentric sky radar, simplified power model, optional date optimizer, and Horizons JSON import.
- Added citations for official challenge resources (JPL Horizons, LROC Quickmap, NASA Moon Trek, CSA Moon Exploration), plus LOLA and historical location references.
- Disclosure: no authentic JPL Horizons ephemeris, LOLA terrain raster, or CSA/Quickmap/Moon Trek numerical datasets are bundled by default. Approximate calculations remain explicitly identified.
- Desktop and mobile tests: successful navigation, select, analyze, 4 comparison cards, methods, report, Markdown download, CSV download, with no JavaScript page errors in the test harness.
