# Shadow Side

An interactive, web-based routing and astronomical solar tracking system that visualizes driving paths, tracks real-time sun movement, and calculates sunlight vs. shadow exposure along road journeys.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_Application-2ea44f?style=for-the-badge&logo=github)](https://shreesha-171.github.io/ShadowSide/)

> **🚀 Live Application:** [shreesha-171.github.io/ShadowSide](https://shreesha-171.github.io/ShadowSide/)

An interactive, web-based routing and astronomical solar tracking system that visualizes driving paths, tracks real-time sun movement, and calculates sunlight vs. shadow exposure along road journeys.

## Introduction

Shadow Side is a client-side geospatial application designed to analyze solar orientation relative to a moving vehicle. By bridging route geometry with real-time astronomical solar position formulas, the platform calculates exact solar position angles and relative vehicle headings to determine where sunlight hits and where shadows fall throughout a trip.

The application operates without requiring any proprietary `API` keys, backend servers, or build tools, running natively in modern web browsers using open-source geospatial services.

## Problem Statement

When traveling long distances by road—whether by car, bus, or motorcycle—direct sunlight exposure causes significant discomfort, heat buildup, and eye strain.

Predicting which side of a vehicle will face direct sun during a trip is non-trivial because:

1. `Changing Route Bearings:` Highways continuously curve, turn, and shift directions across geographic coordinates.
2. `Dynamic Solar Coordinates:` The sun's position (azimuth and altitude) constantly shifts across time and geographic location throughout the day.
3. `Complex Mental Math:` Travelers cannot easily compute the trigonometric relationship between forward forward-azimuth bearings and solar trajectories for multi-hour trips.

Existing mapping tools (like Google Maps or Apple Maps) focus purely on distance, speed, and traffic congestion, completely ignoring solar exposure and thermal comfort.

## Solution

Shadow Side solves this problem by combining routing geometry with real-time solar tracking mathematics:

- `Vector Bearing Matching:` It computes the precise forward compass bearing bus for every route segment along the travel path.
- `Astronomical Trajectory:` It calculates the exact solar azimuth sun and solar altitude angle for the user's specific departure date and time.
- `Time-Weighted Exposure Analysis:` Instead of merely counting raw route coordinates, it calculates the duration (in hours and minutes) sunlight enters through the Left or Right sides of the vehicle, or remains overhead.
- `Real-Time Visual Guidance:` It displays an interactive 8-point compass `(N, NE, E, SE, S, SW, W, NW)` featuring a dynamic solar indicator `☀` alongside color-coded route polylines on the map.

## Technologies Used

| Technology / Library | Category             | Purpose / Description                                          |
| :------------------- | :------------------- | :------------------------------------------------------------- |
| Leaflet.js           | Mapping Engine       | Mobile-friendly interactive map rendering & UI controls.       |
| SunCalc.js           | Astronomical Math    | Solar position, azimuth, altitude & sunrise/sunset math.       |
| OSRM API             | Routing Engine       | Live multi-route driving geometry & duration calculations.     |
| Nominatim API        | Geocoding Service    | Converts place names and geographic coordinates bidirectional. |
| OpenStreetMap FR     | Map Tile Provider    | Open-access raster map tile server (No API keys required).     |
| avaScript (ES6)      | Core Logic / Sensors | Integrates HTML5 Geolocation and `DeviceOrientation` APIs.     |

## Key Features

- `Time-Weighted Solar Exposure Breakdown:` Displays exact percentages and total hours spent in Left Sunlight (Right Shade), Right Sunlight (Left Shade), or Overhead Sun.
- `Interactive 8-Point Compass Overlay:` Map-based compass with dynamic solar positioning `☀` that rotates dynamically according to real-time solar azimuth.
- `Live Hardware Motion Tracking:` Integrates device Geolocation and orientation sensors (deviceorientationabsolute) to physically align the compass rose as the user turns their phone.
- `Multi-Route Alternatives Engine:` Fetches multiple path options from OSRM, enabling travelers to compare solar exposure between expressways and alternate highways.
- `Night Journey Detection:` Automatically detects trips taking place before sunrise or after sunset, notifying users with a dedicated night status indicator.
- `Expected Arrival Calculator:` Computes estimated arrival times based on departure timestamps and routing duration.
- `On-Map Visual Legend:` Color-coded segment overlay directly on the map surface for instant visual feedback.

## Results & Output

When a user selects a origin, destination, and departure time, ShadowSide produces two layers of results:

   Visual Map Representation
1. 🔴 `Red Polylines:` Sun on the Right side -> Left side of the vehicle is in shadow.
2. 🔵 `Blue Polylines:` Sun on the Left side -> Right side of the vehicle is in shadow.
3. 🟠 `Orange Polylines:` Overhead Sun (High altitude > 75^).
4. 🌑 `Dark Slate Polylines:` Night Driving (Sun below horizon <= 0^).

## Example Analytical report

Departure: `Oct 6 at 09:00 AM` | Expected Arrival: `Oct 6 at 07:00 PM`
Destination Bearing: `12° (NNE)` | Total Travel Duration: `10.0 hrs`

Solar Breakdown & Shadow Exposure:
- Right Side Sunlight (Left Side in Shadow): `3.5 hrs (36.8%)`
- Left Side Sunlight (Right Side in Shadow): `5.5 hrs (57.9%)`
- Top / Overhead Sunlight (Both Sides Shaded): `1.0 hrs (10.5%)`

## ShadowSide/
   ├── index.html       # Application layout, control panels, and accessibility modal
   
   ├── style.css        # Responsive layout styling, control containers, and map overlays
   
   ├── main.js          # Geocoding, OSRM fetching, SunCalc math, compass rendering & live GPS
   
   ├── about-modal.js   # Modal dialog interaction logic
   
   └── README.md        # Technical project documentation

## How to Run Locally

Because browser security policies restrict geolocation sensors and tile requests on raw file:// protocols, run the project over a local web server:

VS Code Live Server (Recommended)
- Open the project folder in VS Code.
- Install the Live Server extension.
- Click Go Live at the bottom status bar to launch.

directory command prompt
- `npx http-server . -p 8000` //install server by accepting `y` if not
- Open live server in your web browser.

## Developer Details

Shreesha R
Computer Science Enthusiast
- Focus: Systems Architecture, Full-Stack Web Development, and Automation Workflows.
- LinkedIn: [Shreesha R on LinkedIn](https://www.linkedin.com/in/shreesha-r-a171s/)
