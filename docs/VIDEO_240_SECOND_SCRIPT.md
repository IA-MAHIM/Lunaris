# LUNARIS — 240-second local video narration draft

> **Record at a comfortable pace and revise the script to fit your official guide's section timings.** Claims below assume the supplied offline prototype is working. Bracketed cues tell the editor what screen to show. Do not describe an untested feature as validated.

**0:00–0:25 — Opening / problem**

The Moon's south pole looks like an extraordinary place to explore. But sunlight, Earth visibility and local terrain can change dramatically across a small shift in position or a few days on the calendar. For a solar-powered lunar mission, that can determine when science and communication are possible. How can a mission team explore those trade-offs quickly and understand what a change of plans means? [Show Moon hero and radar.]

**0:25–0:48 — Team / challenge**

Hello NASA! We are Team CodexGalaxy, Computer Science and Engineering students from IUBAT in Dhaka, Bangladesh. For NASA Space Apps Challenge 2026, we are addressing the Lunar Landing Site Navigator challenge. Our project is LUNARIS, an interactive lunar landing-site analysis and mission-window exploration platform. [Show title and team credits.]

**0:48–1:15 — What it does**

LUNARIS brings together the landing location, mission date, local Sun and Earth positions, operational windows, and simple power consequences on one screen. Users can select several reference coordinates, enter their own longitude and latitude, choose a UTC start date, and analyze mission periods lasting several Earth days. [Select South Pole and custom coordinate.]

**1:15–1:50 — Geometry and sky display**

Our interactive Moon gives a spatial reference, while the local sky radar places the Sun and Earth at their calculated azimuth and elevation angles. A numerical status shows whether each body is above the modeled horizon. The mission timeline illustrates intervals with available sunlight, direct visibility of Earth's center, and periods when both conditions occur together. [Show radar, angles, and three horizontal timeline bands.]

**1:50–2:20 — Moving across time**

We can move forward along a mission timeline and see those conditions change. That lets users discover possible sunset or Earthset transitions, long periods without sunlight, and times when direct Earth communication may be interrupted. The same workflow can be repeated for another site or a new landing date. [Play the time slider, pause at a changing horizon condition.]

**2:20–2:55 — Trade studies and optimizer**

To make comparison faster, LUNARIS shows two mission scenarios side by side. Users can change the second location or date to compare sunlight percentages, Earth visibility, overlap, and longest communication blackout. Our opportunity finder then ranks several possible start dates through an openly described educational scoring method. It helps us explore alternatives, not claim a NASA-certified landing decision. [Show comparison, run optimizer.]

**2:55–3:22 — Power impact**

We also added a simple power simulation. When the modeled Sun is too low, generation drops; the battery must support the equipment load. By changing nominal array power, battery capacity, or payload demand, users can see how operational margins may change. The model is intentionally simplified and is a teaching demonstration, not a substitute for actual spacecraft power engineering. [Change load and watch battery estimate.]

**3:22–3:48 — Real data / limitations**

Scientific transparency is important to our team. The current offline prototype starts with approximate lunar and solar geometry. It can also import cached Sun and Earth ephemerides produced by NASA JPL Horizons for the selected lunar coordinates and dates. The optional terrain ridges are synthetic, not NASA LOLA measurements. Our interface makes that distinction visible so users know the source and limitations of every result. [Show Data & Methods, import feature, source badge.]

**3:48–4:00 — Closing**

LUNARIS helps learners and planners visualize why the Moon is an engineering challenge. From site selection to scenario comparison, we turn complex concepts into an interactive story. We are CodexGalaxy. Plan. Optimize. Simulate. Thank you! [Show live URL, GitHub, CodexGalaxy logo.]
