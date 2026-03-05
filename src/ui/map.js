const map = L.map('map', {
  center: [28, 52],
  zoom: 5,
  zoomControl: false,
  attributionControl: false,
});

const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
}).addTo(map);

const satTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
});

function toggleSatellite() {
  const btn = document.getElementById('btn-sat');
  if (isDarkTiles) {
    map.removeLayer(darkTiles);
    satTiles.addTo(map);
    btn.classList.add('active');
  } else {
    map.removeLayer(satTiles);
    darkTiles.addTo(map);
    btn.classList.remove('active');
  }
  isDarkTiles = !isDarkTiles;
}

function toggleLayers() {
  // Toggle range circles visibility
  map.eachLayer(l => {
    if (l instanceof L.Circle) {
      if (l.getElement) {
        const el = l.getElement();
        if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
      }
    }
  });
}

// Strait of Hormuz shipping lanes
const hormuzLane = L.polyline([
  [26.1, 56.0], [26.4, 56.3], [26.6, 56.5], [26.55, 56.8], [26.3, 57.0]
], { color: '#d29922', weight: 2, opacity: 0.5, dashArray: '8 4' }).addTo(map);

// Bab al-Mandeb lane
L.polyline([
  [12.4, 43.1], [12.6, 43.3], [12.8, 43.5], [13.0, 43.3]
], { color: '#22d3ee', weight: 2, opacity: 0.4, dashArray: '8 4' }).addTo(map);

// Missile range circles
L.circle([33.0, 52.0], {
  radius: 2000000, color: 'rgba(248,81,73,0.15)', fillColor: 'rgba(248,81,73,0.05)',
  weight: 1, fillOpacity: 1, dashArray: '4 4'
}).addTo(map);
L.circle([33.0, 52.0], {
  radius: 1300000, color: 'rgba(248,81,73,0.25)', fillColor: 'rgba(248,81,73,0.08)',
  weight: 1, fillOpacity: 1, dashArray: '4 4'
}).addTo(map);

// Static OSINT markers
const staticMarkers = {
  us_bases: [
    { name: "Al Udeid Air Base", lat: 25.12, lon: 51.32, info: "USAF Central Command HQ, 379th AEW" },
    { name: "Al Dhafra Air Base", lat: 24.25, lon: 54.55, info: "F-35A, F-22, U-2, RQ-4" },
    { name: "NSA Bahrain (5th Fleet HQ)", lat: 26.21, lon: 50.61, info: "NAVCENT / 5th Fleet" },
    { name: "Camp Arifjan", lat: 29.08, lon: 47.96, info: "ARCENT Forward HQ" },
    { name: "Ali Al Salem Air Base", lat: 29.35, lon: 47.52, info: "A-10, MQ-9, C-130" },
    { name: "Prince Sultan Air Base", lat: 24.06, lon: 47.58, info: "F-15E, F-35A, Patriot, THAAD" },
    { name: "Diego Garcia", lat: -7.32, lon: 72.41, info: "B-2 bombers, logistics hub" },
  ],
  iran_bases: [
    { name: "Bandar Abbas Naval Base", lat: 27.18, lon: 56.27, info: "IRGC Navy HQ, fast attack craft" },
    { name: "Bushehr Nuclear Plant", lat: 28.83, lon: 50.89, info: "1000MW nuclear reactor", nuclear: true },
    { name: "Chahbahar Naval Base", lat: 25.30, lon: 60.62, info: "IRIN submarine base" },
    { name: "Isfahan ENTC", lat: 32.65, lon: 51.68, info: "Uranium conversion facility", nuclear: true },
    { name: "Natanz", lat: 33.72, lon: 51.73, info: "Primary enrichment facility", nuclear: true },
    { name: "Fordow", lat: 34.88, lon: 51.00, info: "Underground enrichment, 60% HEU", nuclear: true },
    { name: "Parchin Military Complex", lat: 35.52, lon: 51.77, info: "Weapons R&D, explosives testing" },
    { name: "Kharg Island", lat: 29.23, lon: 50.31, info: "90% of Iran oil exports", oil: true },
    { name: "Abu Musa Island", lat: 25.87, lon: 55.03, info: "IRGC forward operating base" },
    { name: "Hormuz Coastal Batteries", lat: 26.60, lon: 56.30, info: "AShM: Noor, Khalij Fars, Qader" },
  ],
  proxies: [
    { name: "Hezbollah (Lebanon)", lat: 33.85, lon: 35.50, info: "150K+ rockets, 20K fighters" },
    { name: "Houthi Forces (Yemen)", lat: 15.35, lon: 44.21, info: "Anti-ship missiles, Shahed drones" },
    { name: "Iraqi PMF", lat: 33.30, lon: 44.37, info: "50-100K fighters, rocket/drone capability" },
  ],
  oil: [
    { name: "Strait of Hormuz", lat: 26.55, lon: 56.50, info: "20 mbd oil, 20% of global" },
    { name: "Ras Tanura (Saudi)", lat: 26.65, lon: 50.18, info: "Largest oil loading terminal" },
    { name: "Bab al-Mandeb", lat: 12.60, lon: 43.30, info: "4.8 mbd, Red Sea chokepoint" },
  ]
};

function addStaticMarkers() {
  const makeIcon = (color, size = 8) => L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid ${color};box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2]
  });

  staticMarkers.us_bases.forEach(b => {
    L.marker([b.lat, b.lon], { icon: makeIcon('#58a6ff', 10) })
      .bindPopup(`<strong style="color:#58a6ff">${b.name}</strong><br>${b.info}`)
      .addTo(map);
  });
  staticMarkers.iran_bases.forEach(b => {
    const color = b.nuclear ? '#bc8cff' : b.oil ? '#d29922' : '#f85149';
    const sz = b.nuclear ? 10 : 8;
    L.marker([b.lat, b.lon], { icon: makeIcon(color, sz) })
      .bindPopup(`<strong style="color:${color}">${b.name}</strong><br>${b.info}`)
      .addTo(map);
  });
  staticMarkers.proxies.forEach(b => {
    L.marker([b.lat, b.lon], { icon: makeIcon('#f0883e', 9) })
      .bindPopup(`<strong style="color:#f0883e">${b.name}</strong><br>${b.info}`)
      .addTo(map);
  });
  staticMarkers.oil.forEach(b => {
    L.marker([b.lat, b.lon], { icon: makeIcon('#d29922', 7) })
      .bindPopup(`<strong style="color:#d29922">${b.name}</strong><br>${b.info}`)
      .addTo(map);
  });
}
addStaticMarkers();

// ── Charts Setup (compact for sidebar) ──
