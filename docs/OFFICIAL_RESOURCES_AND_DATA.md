# Official NASA Space Apps 2026 resources — LUNARIS mapping

**Challenge:** Lunar Landing Site Navigator (CLPS context)
**Received from:** Official challenge Resources tab as pasted by participant, 13 November 2026
**Status:** These are reference links, not a supplied precomputed ephemeris file.

## 1. JPL Horizons — the quantitative foundation

- Official page: https://ssd.jpl.nasa.gov/horizons/
- API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Purpose: Calculate the **Sun and Earth azimuth/elevation** from a chosen point on the lunar surface over time.
- App use: `scripts/fetch_horizons.py` queries targets Sun (10) and Earth (399) using `CENTER='coord@301'`, east-positive lunar longitude, geodetic latitude and zero height, observer ephemeris, and `QUANTITIES='4'` (azimuth/elevation). Generates a local JSON cache consumed by LUNARIS.
- **Not automatic:** The live website does not contact Horizons; no NASA values are included in the initial package. The participant must run the script from an internet-connected machine, review results, and upload the JSON if they want Horizons-backed analyses.
- Caveats: interpolation between samples, finite Sun/Earth discs, airless geometric 0° horizon, no actual site elevation or local terrain, no flight-grade power/RF model. Sites defined in our app are **reference or hypothetical**, not validated landing spots.

## 2. LROC Quickmap — lunar topography and landing-site exploration

- Link: https://quickmap.lroc.asu.edu/
- Official description: Arizona State University interactive lunar map with LRO imagery and topography.
- App use: referenced for exploring terrain and selecting sites manually.
- **Not integrated:** This package does not use Quickmap's map tiles, image downloads, terrain profiles or elevation data. The globe texture is illustration, not Quickmap imagery.

## 3. Moon Trek — NASA 3D lunar exploration

- Link: https://trek.nasa.gov/moon/
- Official description: NASA 3D Moon visualization and terrain data exploration.
- App use: external inspection and reference for the polar region.
- **Not integrated:** Moon Trek is not an API feed for our site; no elevation models have been downloaded. Its advanced tools can require a registered account, while general mapping is publicly accessible.

## 4. Canadian Space Agency Moon Exploration — partner education

- Link: https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/
- Official description: portal about Canadian lunar exploration programs and participation.
- App use: background source only; no numeric geometry, imagery, or datasets taken from this portal.

## 5. What's in the demo vs. what remains

| Feature | Current implementation | Outstanding for scientific validation |
| --- | --- | --- |
| Sun & Earth angles | Analytical estimate by default; optional imported Horizons samples | Generate JPL samples and check against Horizons browser |
| Local horizon | 0° or explicitly synthetic ridges | Download registered DEM/LOLA data; calculate actual horizon from observation height |
| Sunlight / communications | Sampled geometric visibility of target center | Solar disk fraction, Earth limb geometry, terrain, real link budget |
| Solar power / battery | Simplified illustrative energy model | Solar array pointing, efficiency, storage and thermal effects |
| Site comparison & window ranking | Working exploratory heuristics | NASA-derived uniform coverage and mission constraints |
| 3D Moon | Interactive illustration | Georeferenced mission imagery and terrain |

The challenge's main request is to rapidly compare **site + date** trade-offs and see Sun/Earth above the local horizon. Prioritize generating genuine Horizons values for at least the south-pole reference location before recording your NASA data claim.

### How to get a real JPL cache quickly

On a computer with Python 3 and internet, open a terminal in the project folder:

```bash
python scripts/fetch_horizons.py --contact YOUR_REAL_EMAIL@domain.com --start 2026-11-13 --days 14 --step-hours 3 --sites south-pole polar-ridge polar-basin polar-plateau
```

If it finishes, open the page with the local server and confirm the top status changes to **JPL HORIZONS CACHE** when dates are within the cache. A blank or failed download leaves the website in **ANALYTIC ESTIMATE** mode: never say the figures are verified JPL numbers if you have not seen that source indicator.

### Citation / licensing / NASA affiliation

Give attribution for every source you use. The project is a participant-created demonstration and is not endorsed by NASA, JPL, LROC, or CSA. Check website-specific data terms before downloading or redistributing non-US-government material, especially Quickmap / Arizona State University imagery or tools.
