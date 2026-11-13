# LUNARIS - Lunar Mission Navigator

**NASA Space Apps Challenge 2026 · Lunar Landing Site Navigator**  
**Team CodexGalaxy · IUBAT, Dhaka, Bangladesh**  
**Plan. Optimize. Simulate.**

LUNARIS is an independent, open-source **educational lunar mission site/date comparison website**. It lets users choose a lunar site, specify dates, explore illustrative Sun and Earth geometry, view illumination and direct-Earth visibility, compare up to four scenarios, scan alternate mission dates, and export a report.

The interface is a **six-screen workflow**, not one long dashboard:

1. **Overview:** The Moon and current mission summary.
2. **Mission Planner:** Interactive lunar globe, 16 reference/illustrative sites, custom lat/lon, UTC start date, and duration. Click **Analyze visibility & continue**.
3. **Visibility Analysis:** Lunar sky radar, illustrated Sun/Earth globes, time profiles, visible/hidden windows, playback, power model, and optional window optimizer.
4. **Compare 4 Missions:** Scenario A from the planner, plus three editable alternate site/date pairs.
5. **Data & Methods:** Current computational mode, limitations, Horizons import, and all official challenge resource links.
6. **Final Report:** Mission snapshot, four-scenario results in the Markdown export, CSV time-series download, and printable summary.

## Publish this update to your existing GitHub repository

**Your existing repository:** `https://github.com/IA-MAHIM/Lunaris`  
**Expected website:** `https://ia-mahim.github.io/Lunaris/`

1. **Extract this ZIP** to a new folder on your computer.
2. In your repository's **Code** tab, choose **Add file → Upload files**, or use GitHub Desktop to commit the extracted contents.
3. **Upload the FILES INSIDE the extracted folder to the repository root.** Make sure `index.html`, `app.js`, `physics.js`, `moon3d.js`, `styles.css`, `design.css`, `assets/`, `data/`, and `docs/` are in the repository root, not nested in a folder. Do not upload the ZIP directly.
4. Commit the changed files to **main**. Existing files with the same names must be replaced, not kept as duplicate renamed copies.
5. GitHub Pages can stay on **Deploy from a branch → main → /(root)**. You do **not** need to change it if the old site already worked. The included `.github/workflows/deploy.yml` is an alternative GitHub Actions publishing workflow.
6. Refresh `https://ia-mahim.github.io/Lunaris/` with **Ctrl+Shift+R**. Check that the sidebar now includes **Compare 4 Missions** and **Final Report**.
7. Follow the six workflow screens and download a Markdown and CSV report before making the video.

A local development server is optional and requires no installed frontend packages:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. Avoid opening `index.html` directly from the filesystem because browser module imports and JSON loading can be blocked.

## Scientific accuracy and current limitations

**IMPORTANT:** By default, LUNARIS uses a simplified **educational analytical approximation** for Sun/Earth angular positions, not NASA-verified ephemeris. An on-page label and downloadable report disclose this. The illustrative terrain toggle is **synthetic**, not LOLA elevation data. Apparent power generation and battery discharge are idealized examples. No NASA or CSA agency has approved or endorsed the application, and it is **not suitable for real spacecraft mission planning**.

The website can **import offline/cached real JPL Horizons ephemerides** for matching site IDs and date ranges. Since official Horizons API calls are not embedded in the GitHub Pages site, the supplied Python utility produces JSON for upload or browser import. The package includes **no fabricated NASA Horizons values**.

On Windows, run `GET_REAL_JPL_DATA_WINDOWS.bat` from the extracted project. On macOS/Linux, run `GET_REAL_JPL_DATA_MAC_LINUX.sh`. The script calls `scripts/fetch_horizons.py`. To select sites and a period manually:

```bash
python scripts/fetch_horizons.py --contact YOUR_EMAIL@domain.com --start 2026-11-13 --days 14 --sites south-pole chandrayaan3 apollo-11 change6
```

The script requests Horizons Sun/Earth observer azimuth/elevation for lunar topocentric sites (`coord@301`, `QUANTITIES='4'`) and writes `data/horizons-catalog.json`. **The script/API response has not been live-tested in this environment.** Check query permissions and the calculated values against the Horizons interface before using or describing the numbers as confirmed. Commit the JSON to GitHub, or use **Data & Methods → Import JPL Horizons JSON**.

## Landing-site coordinates

The 16 entries include six historic Apollo landings (from NASA NSSDC's published DE421 ME/PA coordinates), Chandrayaan-3, IM-1 Odysseus, Chang'e 3/4/5/6, plus four south-polar demonstration/reference sites. Other missions' coordinates are approximate published references. A **historic mission reference location is not a certified candidate for a future lunar landing**. The four south-polar reference/concept entries are **not measured site-feasibility analyses**. Custom coordinate input supports -90° to +90° latitude and -180° to +360° longitude.

Sources for coordinates: [NASA Apollo lunar landing coordinates](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html), [ISRO Chandrayaan-3](https://www.isro.gov.in/ISRO_EN/Chandrayaan3_Details.html), and [COSPAR lunar landing-sites overview](https://cosparhq.cnes.fr/assets/uploads/2024/09/COSPAR-PPP-2024-Overview.pdf).

## NASA challenge resources (all four official entries)

| Resource | What it contributes to LUNARIS |
|---|---|
| [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Supported source for real Sun/Earth ephemeris samples after an import/cache is generated. **No verified samples ship in the default ZIP.** |
| [LROC Quickmap](https://quickmap.lroc.asu.edu/) | Official external reference for lunar imagery and terrain exploration; **not queried or embedded by this build**. |
| [NASA Moon Trek](https://trek.nasa.gov/moon/) | Official external 3D lunar geographic tool; **not embedded or downloaded**. |
| [Canadian Space Agency Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/) | Official partner reference/background resource, **no CSA data embedded**. |

Additional future dataset: [LRO / LOLA lunar topography](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) to replace the synthetic horizon with measured terrain; **not currently included**.

## Code layout

- `index.html` — pages, forms, links and output panels
- `styles.css` — original site foundation
- `design.css` — new navy, blue, gold and responsive design
- `app.js` — navigation, calculations wiring, charts, comparisons, optimizer and exports
- `physics.js` — approximate geometry engine, visibility and mission sample computations
- `moon3d.js` — original WebGL lunar sphere, globe controls and 2D site markers
- `assets/moon-texture.jpg` — user-provided illustrative Moon texture, not a georeferenced scientific raster
- `assets/earth-map.jpg` — a **schematic** generated Earth surface albedo texture derived from public-domain Natural Earth coastlines; not NASA Blue Marble imagery
- `scripts/fetch_horizons.py` — optional offline NASA/JPL ephemeris retrieval utility, subject to further live testing
- `data/horizons-catalog.json` — intentionally empty source-specific cache
- `docs/` — method, references and submission notes
- `.github/workflows/deploy.yml` — alternate GitHub Actions Pages publishing workflow

For intellectual-property and data-use details, see `CREDITS.md`. This project is MIT licensed (see `LICENSE`), with referenced third-party data/imagery subject to their own terms. Do not present the website itself as an official NASA product.
