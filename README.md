# ◑ LUNARIS — Lunar Mission Planning & Simulation

**NASA Space Apps Challenge 2026 · Lunar Landing Site Navigator**  
**Team CodexGalaxy · IUBAT · Dhaka, Bangladesh**  
**Tagline:** Plan. Optimize. Simulate.

![Status](https://img.shields.io/badge/status-working%20educational%20prototype-67dbc8) ![License](https://img.shields.io/badge/license-MIT-blue)

A **fully static, dependency-free web application** for educational exploration of lunar landing locations, changing Sun/Earth positions, visibility windows, comparing site/date options, and simple mission power constraints. This website **does not require npm, Node.js, a Python web server, secret keys, or a paid host** to deploy on GitHub Pages. Optional scientific data retrieval is done by a standalone Python script on a user's computer.

> **Scientific honesty:** By default, the app uses a *first-order analytical approximation* for Sun/Earth elevation and azimuth. It is **not validated JPL ephemeris** and must not be used for spacecraft operations. The app supports a cache generated from the **actual NASA/JPL Horizons API**, with distinct on-screen provenance labels. It does **not** ship with an unverified NASA-looking ephemeris dataset. Terrain obstacles are a clearly labeled synthetic demonstration, not measured NASA LOLA data.

## Quickest path: publish on GitHub Pages

1. **Unzip** the updated LUNARIS ZIP on your computer.
2. Open [github.com/new](https://github.com/new) while logged in. Create a **public repository** called `lunaris` (or another name). Do not add an initial README since this ZIP already includes one.
3. On the empty repository page, select **uploading an existing file** / **Add file → Upload files**, then upload the **contents of the unzipped folder**, not the ZIP itself. GitHub's browser upload may omit hidden folders like `.github`—check that the `.github/workflows/deploy.yml` file exists afterward.
4. Commit to the **`main` branch**.
5. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. This project already includes `.github/workflows/deploy.yml`.
6. Visit **Actions**, confirm the `Deploy LUNARIS to GitHub Pages` workflow finished successfully (use Run workflow if necessary). Your site should appear at `https://YOUR-USERNAME.github.io/lunaris/` (substitute your actual username and repository name). GitHub itself displays the canonical link in Settings → Pages.
7. Test the public link in a private/incognito window and add it to your local Space Apps submission alongside your **public GitHub repository**.

**If GitHub doesn't upload the hidden `.github` folder in the browser:** use **GitHub Desktop** (File → Add local repository, create repository from the unzipped folder, publish), or manually create `.github/workflows/deploy.yml` on GitHub and paste in the provided file contents.

Alternative **no Actions** deployment: In **Settings → Pages**, choose **Deploy from a branch**, select `main` and folder `/ (root)`, then Save. This also publishes the static HTML site.

## Run locally before uploading

### Most reliable, Python installed

```bash
cd LUNARIS_2026_Deploy_Ready
python -m http.server 8000
```

Open **http://localhost:8000/** in Chrome, Edge, or Firefox. No `pip install` is needed to run the web app. Do **not** open `index.html` by double-clicking: browser security restrictions can prevent ES modules and JSON files loading over `file://` URLs.

### If using VS Code

Install its **Live Server** extension, open the folder, and select **Go Live**. Or use the Python command above.

## Working features

- Dependency-free interactive WebGL Moon with drag/zoom/reset and clickable site points; supplied lunar texture is a **visual artwork**, not a georeferenced topographic dataset.
- Curated reference and hypothetical coordinates, plus **custom latitude/longitude**.
- UTC start-date and 3 / 5 / 7 / 14-day mission windows.
- Approximate Sun and Earth azimuth/elevation; **optional cached Horizons values** for selected sites/dates.
- Circular local-sky radar, numerical angles, sunlight and Earth visibility percentages.
- Colored mission timeline, simulated playback slider and play/pause/speed.
- Approximate next rise/set and longest contiguous sunless / Earth-blackout periods, sampled every 3 hours.
- Side-by-side site/date comparison and explanatory exploratory score.
- Date optimizer: searches starts in 2-day increments for 30, 60 or 90 days.
- Basic horizontal-panel solar + battery energy model, tunable wattage, load and storage.
- Import valid Horizons catalog JSON (file input) and provenance coverage indicators.
- Download a Markdown mission report.
- Responsive display; full source and public data references.

## Official challenge resources (released for 13 November 2026)

The challenge's **Resources** tab lists [LROC Quickmap](https://quickmap.lroc.asu.edu/), [NASA Moon Trek](https://trek.nasa.gov/moon/), [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/), and [Canadian Space Agency Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/). Read [docs/OFFICIAL_RESOURCES_AND_DATA.md](docs/OFFICIAL_RESOURCES_AND_DATA.md) for our exact use of each source, what has actually been implemented, and the remaining science gaps.

The resources page **does not provide an immediately usable numerical dataset**. LUNARIS uses Horizons when an ephemeris catalog is imported or generated, and otherwise shows a labeled analytical demonstration. Quickmap and Moon Trek are reference tools for terrain analysis, not data already imported into LUNARIS.

## Optional: use REAL NASA/JPL Horizons data

NASA's Horizons API is publicly accessible without an API key. **NASA/JPL states that its APIs may not be embedded directly in public websites** under its CORS policy. For that reason, this app uses **precomputed static ephemerides**, avoiding client-side API calls and API-key exposure. Users can generate the catalog before deployment or load it from a JSON file in the UI.

**Windows shortcut:** double-click `GET_REAL_JPL_DATA_WINDOWS.bat`, enter your own contact email, and allow Python to finish downloading data. This calls the exact same Python script. No `pip install` is needed.

From the project folder, on an internet-connected computer with Python 3:

```bash
python scripts/fetch_horizons.py --contact YOUR_REAL_EMAIL@domain.com --start 2026-11-13 --days 14 --sites south-pole polar-ridge polar-basin polar-plateau
```

The script requests Sun (`10`) and Earth (`399`) observer ephemerides, using `CENTER='coord@301'`, lunar GEODETIC latitude/longitude, `QUANTITIES='4'` (apparent azimuth/elevation), airless horizon, and a **3-hour cadence**. It processes sequentially, uses a descriptive User-Agent with **your own real contact email**, waits between queries, and saves the results into `data/horizons-catalog.json`.

Then either:

- **Commit `data/horizons-catalog.json`** to the same repository, which automatically redeploys the site; or
- Choose **Import JPL Horizons JSON** on the live website (valid for the current browser session only).

The website automatically switches from the approximate model to Horizons cached values **for matching site IDs and UTC timestamps only**. Other sites/dates continue to show approximate data, and a mixed-mode label appears if only partial coverage is available. Between 3-hour ephemeris timestamps, the site linearly interpolates elevation and shortest-path azimuth. For higher accuracy use a finer Horizons step size and validate results.

**Important:** Fetching requires an internet-connected computer, may fail due to JPL service availability, and does not validate the outputs automatically. **Validation:** Check a few date/location Sun/Earth angles against the [Horizons web interface](https://ssd.jpl.nasa.gov/horizons/app.html), especially around horizon crossings; no scientific accuracy should be assumed without validation. This optional integration script could not be executed against the live NASA server during package creation because the build environment lacks outbound access. It is provided as a tested-for-syntax integration pathway, **not as proof the external service returned data**.

## Data and modeling limitations

| Feature | Shipped implementation | Scientific status |
| --- | --- | --- |
| Solar/Earth geometry | Approximate analytic Sun/Moon position + simplified libration | **Educational estimate** |
| JPL geometry | Import/generated Horizons azimuth/elevation table | **Official calculations when separately fetched** |
| Earth visibility | Earth **center** elevation above chosen horizon | LOS approximation, **not** complete RF analysis |
| Local lunar horizon | 0° sphere by default; optional generated ridges | **No LOLA DEM** |
| Solar energy | Horizontal, fixed array; power proportional to `max(0, sin(elevation))` | Simplified; no actual array or thermal model |
| Battery | Integrates generated energy − constant load, clamp 0–capacity | Does not model efficiency, SOC constraints, degradation |
| Mission ranking | Weighted percent sunlight, Earth visibility and overlap | **Exploratory heuristic, not mission feasibility** |
| Globe | Interactive native WebGL sphere and user-provided texture | Not a science-accurate terrain reconstruction |

The model accounts for the Moon having **no atmospheric refraction**. A 0° local geometric horizon is a convenience and can differ dramatically from the lunar south pole's real crater rims. Precision planning requires LOLA or comparable DEM, correct observation frames, accurate SPICE/Horizons ephemerides, spatial sampling, proper surface reference frames and spacecraft-specific engineering models.

## Repository structure

```text
index.html                  All dashboard UI sections
styles.css                  Responsive high-contrast design
app.js                      State, interactive controls, charts, comparisons
physics.js                  Astronomy approximation + mission model
moon3d.js                   Dependency-free interactive WebGL globe
data/horizons-catalog.json  Empty source-safe JPL cache by default
scripts/fetch_horizons.py   Optional Horizons data fetch and parser
assets/moon-texture.jpg     User-supplied visual lunar globe texture
assets/favicon.svg         Original project icon
.github/workflows/deploy.yml GitHub Pages auto-deployment
.nojekyll                   GitHub Pages static file behavior
LICENSE                     MIT open-source license
CREDITS.md                  Sources and image/asset notes
docs/                       Science, demonstration and submission guides
```

## Credits

Team CodexGalaxy's participant-created entry for NASA Space Apps Challenge 2026. This is an independent submission, not an official NASA project. See [CREDITS.md](CREDITS.md) and [docs/SCIENTIFIC_METHOD.md](docs/SCIENTIFIC_METHOD.md).

## License

MIT for original code, excluding cited external assets. See [LICENSE](LICENSE).
