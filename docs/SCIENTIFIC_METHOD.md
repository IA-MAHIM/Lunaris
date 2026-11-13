# LUNARIS — Scientific method and validation status

## The problem

The 2026 NASA Space Apps **Lunar Landing Site Navigator** challenge asks for rapid comparisons of candidate Moon landing locations and times through the local Sun and Earth sky positions. Solar elevation provides one ingredient of power planning; Earth visibility provides one ingredient of direct radio-link planning. South-polar terrain can obstruct both bodies even when simple smooth-sphere calculations predict visibility.

## Key quantities

- **Site**: planetocentric/planetodetic latitude and east longitude in decimal degrees. The Moon is approximated as a sphere for the built-in model.
- **UTC**: all dates and times in UTC; the interface does not shift them to the viewer's time zone.
- **Azimuth**: measured clockwise from north, 0–360 degrees.
- **Elevation**: degrees above the horizon plane. Positive values indicate the center of the distant body is geometrically above a flat local horizon.
- **Visibility**: Sun or Earth **center** elevation greater than the selected horizon angle. Real operations would need limb considerations, panel geometry, antenna link budget, actual terrain and safety margins.

## First-order educational model (default)

The calculation uses first-order mean solar/lunar longitudes (periodic terms), approximate lunar Earth libration, an idealized 1.54° annual lunar subsolar latitude variation, and a spherical projection. For site latitude `phi`, longitude `lambda`, and a body subpoint `(delta, lambda_b)`, elevation is:

```
sin(elevation) = sin(phi) sin(delta) + cos(phi) cos(delta) cos(lambda_b - lambda)
```

Azimuth is derived from the north/east projection and measured clockwise from lunar north. These formulae map approximate subpoints into local sky coordinates. They are **not a substitute for an IAU frame transformation** and are *not* claimed to be precise Sun/Earth ephemerides. In particular, lunar pole orientation, physical librations, and body-fixed longitude need a complete reference-frame treatment for scientific use.

The app's built-in longitudes and librations are rough educational approximations. Metrics, sunrise/Earthset countdowns and scores derived from them are also approximations.

## Official JPL Horizons option

The data acquisition script uses the official NASA/JPL Horizons system, with target `10` (Sun) or `399` (Earth), observer `coord@301` (coordinate on the Moon), `COORD_TYPE=GEODETIC`, and `QUANTITIES=4` (airless azimuth/elevation). The output is parsed into static JSON timestamp rows.

After the developer executes this script using an Internet-connected computer, the website uses **only site- and time-matching cached Horizons values**; a label on screen indicates the actual percentage of samples from this cache. The data is interpolated between nearby records. Direct API requests from the deployed site are intentionally disallowed under NASA/JPL's published CORS/fair-use policy.

**Package status:** The optional script is included, but no live Horizons samples have been acquired or verified in this ZIP. The empty cache makes it impossible to accidentally label rough calculations as official NASA data.

## Synthetic terrain option (explicitly not LOLA)

An optional demo toggle generates a smooth obstruction profile based on trigonometric functions of azimuth and site longitude, adding 0–3.1° of *fictional* obstructions. It teaches why a crater rim or slope can change the times when Sun/Earth is visible. It **does not derive from local topography** and must not be described as NASA terrain analysis.

## Simplified power/battery simulation

- Fixed **horizontal** solar panel.
- Nominal power: `Psolar = max(0, sin(sun elevation - horizon)) × rated panel power`.
- Constant `Pload`, initial battery 80% full.
- Every 3 hours, battery energy is `min(capacity, max(0, previous + (Psolar - Pload) × 3h))`.
- Ignores efficiency, slew/tracking, temperature, dust, power conversion, cell degradation, charging limits and degradation, etc.
- This is a *what-if teaching simulation*.

## Heuristic window ranking

Weighted score = `0.42 × %Sunlit + 0.42 × %Earth-visible + 0.16 × %overlap − min(12, longest_comm_blackout_hours / 10)` clamped to 0–100. This score is original, transparent, and configurable in source code; it is **not** a NASA-approved figure or spacecraft feasibility metric.

## Scientific validation to complete (future)

1. Obtain verified JPL Horizons tables and compare multiple independent site/date positions to the site's analytical estimates.
2. Use the IAU Moon body-fixed reference frame, appropriate epoch handling, subpoint and azimuth conventions.
3. Add NASA LOLA DEM or other measured topography and sample true terrain horizon at each selected location/azimuth.
4. Solve actual rise/set transitions with precise bracketing rather than sampling every 3 hours.
5. Add antenna pointing and link budgets, solar panel incidence/efficiency and thermal constraints.
6. Quantify uncertainties and document error bounds.

**No flight decisions should be made with the prototype in its current form.**
