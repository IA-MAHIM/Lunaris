LUNARIS — MOON AUTOMATIC LANDING-SITE CENTERING PATCH
NASA Space Apps Challenge 2026 · Team CodexGalaxy

WHAT CHANGED
- Picking a landing site automatically rotates the 3D Moon to show that exact
  selected latitude/longitude at the center of the visible hemisphere.
- Far-side locations such as Chang'e-4 and Chang'e-6 work as well.
- Manual drag rotation and scroll-to-zoom are preserved.
- “Center site” recenters the CURRENT selected landing site.
- Custom latitude/longitude inputs also trigger centering after applying them.
- Animated transitions last about 0.8 seconds, unless reduced motion is set.

HOW TO UPDATE THE EXISTING GITHUB PAGES SITE
EASIEST: replace the three files from the full ZIP in your repo root:
  index.html   (improves UI labels; cache-busts app.js)
  app.js       (cache-busts moon3d.js)
  moon3d.js    (new location-centering globe engine)
Commit to main, keep Pages publishing from main/(root), and refresh the live site.

MINIMAL: only replace moon3d.js. The feature works without changing the other
files, but press Ctrl+Shift+R in Chrome (or open in a private tab) to bypass
cached JavaScript files. The full ZIP contains all source files and docs.

TEST
1. Open https://ia-mahim.github.io/Lunaris/#planner
2. Choose Chang'e-4 · Von Kármán from the landing site list.
3. The Moon should rotate, and the aqua Chang'e-4 marker should finish at the center.
4. Drag the globe somewhere else; press “Center site” to recenter.
5. Try Apollo 11, Chang'e-6, the south pole or custom coordinates.

SCIENTIFIC SCOPE
The camera is oriented to the catalog latitude/longitude mathematically.
The artistic grayscale texture is not a calibrated NASA LRO/LOLA georeferenced
basemap; do not use crater appearance alone for precise geographic validation.
LUNARIS Sun/Earth geometry retains the scientific status and limitations
already disclosed in the website.
