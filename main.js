// ShadowSide Route Map - main.js (FULLY FIXED)
// Dependencies: Leaflet, SunCalc

const map = L.map('map').setView([12.9716, 77.5946], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let routeLayer = null;
let shadowPolylines = [];

document.getElementById('btn-route').addEventListener('click', getRoute);

async function getRoute() {
  const startInput = document.getElementById('start').value.trim();
  const endInput = document.getElementById('end').value.trim();
  const dateInput = document.getElementById('travel-time').value;

  if (!startInput || !endInput) {
    alert('Please enter both start and end points.');
    return;
  }

  const startTime = dateInput ? new Date(dateInput) : new Date();

  const startCoords = await getCoordinates(startInput);
  const endCoords = await getCoordinates(endInput);

  if (!startCoords || !endCoords) {
    alert("Couldn't resolve one or both locations.");
    return;
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=full&geometries=geojson`;

  let res;
  try {
    res = await fetch(osrmUrl);
  } catch (err) {
    alert("Routing error: " + err.message);
    return;
  }

  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    alert('No route found.');
    return;
  }

  // remove old layers
  if (routeLayer) map.removeLayer(routeLayer);
  shadowPolylines.forEach(p => map.removeLayer(p));
  shadowPolylines = [];

  const route = data.routes[0];
  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

  routeLayer = L.polyline(coords, { color: "#1f7ae0", weight: 5 }).addTo(map);
  map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

  computeShadowAnalysis(route, startTime);
}

function computeShadowAnalysis(route, startTime) {
  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationSec = route.duration;
  const durationMin = Math.round(durationSec / 60);

  /** -------- FIXED: SAMPLING LOGIC -------- **/
  const samplesCount = 120; // fixed sampling resolution  
  const step = Math.max(1, Math.floor(coords.length / samplesCount));

  let left = 0, right = 0, front = 0, back = 0;

  for (let i = 0; i < coords.length - step; i += step) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + step];

    const bearing = getBearing(lat1, lon1, lat2, lon2);

    const timeAtPoint = new Date(startTime.getTime() + (i / coords.length) * durationSec * 1000);

    const sun = SunCalc.getPosition(timeAtPoint, lat1, lon1);

    // Convert SunCalc azimuth (from south CCW) → normal compass (0° = north)
    const sunAz = (sun.azimuth * 180 / Math.PI + 180 + 360) % 360;

    const diff = (sunAz - bearing + 360) % 360;

    let segColor = "#888";

    if (diff < 45 || diff >= 315) {
      front++;
      segColor = "#f59e0b";
    } else if (diff >= 45 && diff < 135) {
      right++;
      segColor = "#ef4444";
    } else if (diff >= 135 && diff < 225) {
      back++;
      segColor = "#10b981";
    } else {
      left++;
      segColor = "#2563eb";
    }

    const seg = L.polyline([[lat1, lon1], [lat2, lon2]], {
      color: segColor,
      weight: 4,
      opacity: 0.45
    }).addTo(map);

    shadowPolylines.push(seg);
  }

  const total = left + right + front + back;

  const leftPct = ((left / total) * 100).toFixed(1);
  const rightPct = ((right / total) * 100).toFixed(1);
  const frontPct = ((front / total) * 100).toFixed(1);
  const backPct = ((back / total) * 100).toFixed(1);

  const sunTimes = SunCalc.getTimes(startTime, coords[0][0], coords[0][1]);

  document.getElementById("sun-times").innerText =
    `Sunrise: ${sunTimes.sunrise.toLocaleTimeString()} | Sunset: ${sunTimes.sunset.toLocaleTimeString()}`;

  document.getElementById("shadow-summary").innerText =
    `Route Distance: ${distanceKm} km | Duration: ${durationMin} min\n` +
    `Shadow Analysis:\n` +
    `LEFT: ${leftPct}%\n` +
    `RIGHT: ${rightPct}%\n` +
    `FRONT: ${frontPct}%\n` +
    `BACK: ${backPct}%`;
}

// bearing formula
function getBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// geocoding
async function getCoordinates(input) {
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(input)) {
    const [lat, lon] = input.split(',').map(Number);
    return { lat, lon };
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}`;

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
