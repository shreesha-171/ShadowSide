// ShadowSide Route Map - main.js
// Dependencies: Leaflet, SunCalc

const map = L.map('map').setView([12.9716, 77.5946], 12);

// Standard OpenStreetMap France tiles (100% Free, No API Key Required)
L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors, OpenStreetMap France'
}).addTo(map);

let routePolylines = [];
let shadowPolylines = [];
let allRoutes = [];
let selectedRouteIndex = 0;
let currentDepartureTime = new Date();
let liveMarker = null;
let watchId = null;

// Start Live Clock
function startLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
      clockEl.innerText = `Current Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLiveClock);
} else {
  startLiveClock();
}

// 8-Point Compass Control on Map (Top-Left)
const CompassControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function () {
    const container = L.DomUtil.create('div', 'compass-leaflet-control');
    container.innerHTML = `
      <div id="compass-box" style="background: rgba(255, 255, 255, 0.95); padding: 10px; border-radius: 50%; width: 100px; height: 100px; position: relative; border: 2px solid #333; text-align: center; font-size: 10px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
        <div id="compass-rose" style="width: 100%; height: 100%; position: absolute; top:0; left:0; transition: transform 0.2s ease;">
          <span style="position: absolute; top: 3px; left: 46px; color:#ef4444;">N</span>
          <span style="position: absolute; top: 12px; right: 18px; font-size:7px; color:#666;">NE</span>
          <span style="position: absolute; top: 43px; right: 4px;">E</span>
          <span style="position: absolute; bottom: 12px; right: 18px; font-size:7px; color:#666;">SE</span>
          <span style="position: absolute; bottom: 3px; left: 47px;">S</span>
          <span style="position: absolute; bottom: 12px; left: 18px; font-size:7px; color:#666;">SW</span>
          <span style="position: absolute; top: 43px; left: 4px;">W</span>
          <span style="position: absolute; top: 12px; left: 18px; font-size:7px; color:#666;">NW</span>
        </div>
        <div id="sun-emoji" style="position: absolute; font-size: 16px; transition: all 0.3s ease; z-index: 10;">☀</div>
        <div style="position: absolute; top: 41px; left: 41px; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; color: #fff; line-height: 18px; font-size: 8px;">▲</div>
      </div>
    `;
    return container;
  }
});
map.addControl(new CompassControl());

document.getElementById('btn-route').addEventListener('click', getRoute);
document.getElementById('btn-live').addEventListener('click', toggleLiveTracking);

// Global function so route selector buttons can call it
window.selectRoute = function(index) {
  selectedRouteIndex = index;
  displayRoutesOnMap();
};

// Map Legend Control (Bottom-Right)
const LegendControl = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd: function () {
    const container = L.DomUtil.create('div', 'legend-control');
    container.innerHTML = `
      <div class="legend-title">Sun Position Legend</div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ef4444;"></span>
        <span>Sun on Right (Shadow on Left)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #2563eb;"></span>
        <span>Sun on Left (Shadow on Right)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f59e0b;"></span>
        <span>Overhead Sun</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #334155;"></span>
        <span>Night Driving</span>
      </div>
    `;
    return container;
  }
});
map.addControl(new LegendControl());

async function getRoute() {
  const startInput = document.getElementById('start').value.trim();
  const endInput = document.getElementById('end').value.trim();
  const dateInput = document.getElementById('travel-time').value;

  if (!startInput || !endInput) {
    alert('Please enter both start and end points.');
    return;
  }

  currentDepartureTime = dateInput ? new Date(dateInput) : new Date();
  const startCoords = await getCoordinates(startInput);
  const endCoords = await getCoordinates(endInput);

  if (!startCoords || !endCoords) {
    alert('Failed to resolve location coordinates. Try lat,lon or valid city names.');
    return;
  }

  // OSRM request with alternatives=true
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const res = await fetch(osrmUrl);
    if (!res.ok) return alert('Routing service returned error: ' + res.status);
    const data = await res.json();
    if (!data.routes?.length) return alert('No route found.');

    allRoutes = data.routes;
    selectedRouteIndex = 0; // Default to primary/fastest route

    displayRoutesOnMap();
  } catch (err) {
    alert('Error fetching route: ' + err.message);
  }
}

function displayRoutesOnMap() {
  // Clear existing layers
  routePolylines.forEach(p => map.removeLayer(p));
  shadowPolylines.forEach(p => map.removeLayer(p));
  routePolylines = [];
  shadowPolylines = [];

  const bounds = L.latLngBounds();

  // Draw all route alternatives
  allRoutes.forEach((route, index) => {
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
    const isSelected = index === selectedRouteIndex;

    const polyline = L.polyline(coords, {
      color: isSelected ? '#1f7ae0' : '#94a3b8',
      weight: isSelected ? 6 : 4,
      opacity: isSelected ? 0.9 : 0.5,
      dashArray: isSelected ? null : '6, 6'
    }).addTo(map);

    // Clicking line selects that route
    polyline.on('click', () => {
      window.selectRoute(index);
    });

    routePolylines.push(polyline);
    coords.forEach(pt => bounds.extend(pt));
  });

  map.fitBounds(bounds, { padding: [40, 40] });

  // Run solar breakdown calculation for selected route
  computeSolarBreakdown(allRoutes[selectedRouteIndex], currentDepartureTime);
}

function computeSolarBreakdown(route, startTime) {
  const routeCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
  const durationSec = route.duration;
  const arrivalTime = new Date(startTime.getTime() + durationSec * 1000);
  const interval = Math.max(1, Math.floor(routeCoords.length / 200));

  let rightSunSec = 0, leftSunSec = 0, topSunSec = 0, nightSec = 0;
  const timePerSegment = durationSec / (routeCoords.length - 1);

  for (let i = 0; i < routeCoords.length - 1; i += interval) {
    const nextIdx = Math.min(i + interval, routeCoords.length - 1);
    const [lat1, lon1] = routeCoords[i];
    const [lat2, lon2] = routeCoords[nextIdx];

    const bearing = getBearing(lat1, lon1, lat2, lon2);
    const timeAtPoint = new Date(startTime.getTime() + (i / (routeCoords.length - 1)) * durationSec * 1000);

    const sunPos = SunCalc.getPosition(timeAtPoint, lat1, lon1);
    const altitudeDeg = sunPos.altitude * (180 / Math.PI);
    const segmentDuration = timePerSegment * (nextIdx - i);

    let segColor = '#888';

    if (altitudeDeg <= 0) {
      nightSec += segmentDuration;
      segColor = '#334155'; // Night
    } else if (altitudeDeg > 75) {
      topSunSec += segmentDuration;
      segColor = '#f59e0b'; // Overhead Sun
    } else {
      const sunAzimuth = (sunPos.azimuth * (180 / Math.PI) + 180 + 360) % 360;
      const diff = (sunAzimuth - bearing + 360) % 360;

      if (diff >= 0 && diff < 180) {
        rightSunSec += segmentDuration; // Sun on Right -> Shadow on Left
        segColor = '#ef4444'; 
      } else {
        leftSunSec += segmentDuration;  // Sun on Left -> Shadow on Right
        segColor = '#2563eb';
      }
    }

    const segment = L.polyline([[lat1, lon1], [lat2, lon2]], { color: segColor, weight: 5, opacity: 0.7 }).addTo(map);
    shadowPolylines.push(segment);
  }

  // Update Compass Sun Position for Departure Point
  updateCompassSun(routeCoords[0][0], routeCoords[0][1], startTime);

  const totalSec = rightSunSec + leftSunSec + topSunSec + nightSec || 1;
  const overallBearing = getBearing(routeCoords[0][0], routeCoords[0][1], routeCoords[routeCoords.length - 1][0], routeCoords[routeCoords.length - 1][1]);

  const rightHours = (rightSunSec / 3600).toFixed(1);
  const leftHours = (leftSunSec / 3600).toFixed(1);
  const topHours = (topSunSec / 3600).toFixed(1);
  const nightHours = (nightSec / 3600).toFixed(1);

  const rightPct = ((rightSunSec / totalSec) * 100).toFixed(1);
  const leftPct = ((leftSunSec / totalSec) * 100).toFixed(1);
  const topPct = ((topSunSec / totalSec) * 100).toFixed(1);
  const nightPct = ((nightSec / totalSec) * 100).toFixed(1);

  const sunTimes = SunCalc.getTimes(startTime, routeCoords[0][0], routeCoords[0][1]);

  const formatTime = (dateObj) => dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateObj) => dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  document.getElementById('sun-times').innerHTML = `
    Sunrise: <b>${formatTime(sunTimes.sunrise)}</b> | Sunset: <b>${formatTime(sunTimes.sunset)}</b>
  `;

  const isAllNight = nightSec >= totalSec - 10;

  // Render Route Selector Buttons
  let selectorButtons = `<div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">`;
  allRoutes.forEach((r, idx) => {
    const isSelected = idx === selectedRouteIndex;
    const hrs = (r.duration / 3600).toFixed(1);
    const kms = (r.distance / 1000).toFixed(0);

    selectorButtons += `
      <button onclick="window.selectRoute(${idx})" style="
        padding: 6px 12px; 
        border-radius: 6px; 
        border: 1px solid ${isSelected ? '#1f7ae0' : '#cbd5e1'}; 
        background: ${isSelected ? '#1f7ae0' : '#f8fafc'}; 
        color: ${isSelected ? '#fff' : '#334155'}; 
        font-weight: bold; 
        cursor: pointer;
      ">
        Route ${idx + 1} (${hrs} hrs / ${kms} km)
      </button>
    `;
  });
  selectorButtons += `</div>`;

  document.getElementById('shadow-summary').innerHTML = `
    ${selectorButtons}
    <b>Departure:</b> ${formatDate(startTime)} at ${formatTime(startTime)} | 
    <b>Expected Arrival:</b> ${formatDate(arrivalTime)} at ${formatTime(arrivalTime)}<br>
    <b>Destination Bearing:</b> ${overallBearing.toFixed(0)}° (${getCardinalDirection(overallBearing)}) | 
    <b>Total Travel Duration:</b> ${(durationSec / 3600).toFixed(1)} hrs<br><br>
    ${
      isAllNight 
      ? `<span style="color:#dc2626; font-size:15px; font-weight:bold;">🌙 NIGHT TIME JOURNEY</span><br>This entire trip occurs before sunrise or after sunset. No direct sunlight exposure during this route.<br>`
      : `<b>Solar Breakdown & Shadow Exposure:</b><br>
         • <b>Right Side Sunlight (Left Side in Shadow):</b> ${rightHours} hrs (${rightPct}%)<br>
         • <b>Left Side Sunlight (Right Side in Shadow):</b> ${leftHours} hrs (${leftPct}%)<br>
         • <b>Top / Overhead Sunlight (Both Sides Shaded):</b> ${topHours} hrs (${topPct}%)<br>`
    }
    ${nightSec > 0 && !isAllNight ? `• <b>Night Driving (No Sun):</b> ${nightHours} hrs (${nightPct}%)<br>` : ''}
  `;
}

// Position Sun Emoji on Compass Rim
function updateCompassSun(lat, lon, date = new Date()) {
  const sunPos = SunCalc.getPosition(date, lat, lon);
  const sunAzimuth = (sunPos.azimuth * (180 / Math.PI) + 180 + 360) % 360;

  const angleRad = (sunAzimuth - 90) * (Math.PI / 180);
  const radius = 38;
  const x = 42 + radius * Math.cos(angleRad);
  const y = 42 + radius * Math.sin(angleRad);

  const sunEmoji = document.getElementById('sun-emoji');
  if (sunEmoji) {
    sunEmoji.style.left = `${x}px`;
    sunEmoji.style.top = `${y}px`;
    sunEmoji.style.display = sunPos.altitude <= 0 ? 'none' : 'block';
  }
}

// Live Tracking & Compass Sensor
function toggleLiveTracking() {
  const btn = document.getElementById('btn-live');

  if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');

  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    btn.innerText = 'Enable Live GPS & Compass';
    btn.style.background = '#059669';
    alert('Live tracking paused.');
    return;
  }

  btn.innerText = 'Stop Live Tracking';
  btn.style.background = '#dc2626';

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true) ||
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      if (!liveMarker) {
        liveMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Your Location');
      } else {
        liveMarker.setLatLng([latitude, longitude]);
      }

      map.panTo([latitude, longitude]);
      updateCompassSun(latitude, longitude, new Date());
    },
    (err) => alert('Geolocation error: ' + err.message),
    { enableHighAccuracy: true }
  );
}

function handleOrientation(event) {
  let compassHeading = event.alpha;
  if (event.webkitCompassHeading) compassHeading = event.webkitCompassHeading;

  if (compassHeading !== null) {
    const rose = document.getElementById('compass-rose');
    if (rose) rose.style.transform = `rotate(${-compassHeading}deg)`;
  }
}

function getBearing(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function getCardinalDirection(angle) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(angle / 45) % 8];
}

async function getCoordinates(input) {
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(input)) {
    const parts = input.split(',').map(s => s.trim());
    return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}`);
    const data = await res.json();
    return data?.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
  } catch { return null; }
}