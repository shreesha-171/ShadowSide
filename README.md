# ShadowSide Route Map

A lightweight web app that visualizes driving routes and estimates shadow direction along the route using SunCalc (solar position) and OSRM (routing). No API keys required for default setup (uses public OSRM and Nominatim services).

## Files
- `index.html` - Main HTML page that includes map, controls, and info area.
- `style.css` - Simple styling for the UI.
- `main.js` - Core logic: geocoding, routing via OSRM, sun position sampling with SunCalc, and shadow classification + visualization.
- `README.md` - This file.

## How to run
1. Extract the files and open `index.html` in a modern browser (Chrome/Firefox).
2. Enter start and end (either place names or `lat,lon`) and optionally set travel datetime.
3. Click **Get Route**. The map will show the route and colored segments representing shadow orientation:
   - Orange = Front
   - Red = Right
   - Green = Back
   - Blue = Left

## Notes & Limitations
- This project uses <https://nominatim.openstreetmap.org> and <https://router.project-osrm.org> which are public services with usage limits and no guaranteed uptime. For production use, host your own instances or use a paid provider (Mapbox, Google Maps).
- Shadow classification is an approximation based on sun azimuth vs travel bearing. It does not account for 3D obstructions (buildings, trees), vehicle height, or actual shadow lengths.
- Timezone handling uses the browser's local timezone. Ensure your input `datetime-local` relates to the intended timezone.

## Improvements (optional)
- Weight samples by sun altitude to factor shadow length importance.
- Fetch elevation/building footprints and compute occlusion for more accurate shadows.
- Add export (CSV/PNG) and better UI/UX.
