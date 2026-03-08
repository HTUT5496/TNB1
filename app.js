/**
 * app.js
 * ====================================================
 * ကား ပြင်ဆိုင် - Car Repair Shop Finder
 * Main application logic
 * 
 * Features:
 * - Supabase database integration
 * - Dynamic car brand/model loading
 * - Price estimation
 * - Repair shop search with map
 * - Bilingual support (EN / MM)
 * ====================================================
 */

// ============================================================
// CONFIGURATION
// ============================================================

/** Supabase project configuration */
const SUPABASE_CONFIG = {
  url: 'https://fpjcpwedvowvbnebxcyv.supabase.co',
  key: 'sb_publishable_sJPO4Dg2wKLlWKanfU2lsg_jA5jReRM'
};

/** Myanmar center coordinates for map */
const MYANMAR_CENTER = { lat: 19.7633, lng: 96.0785 };
const DEFAULT_ZOOM = 6;

// ============================================================
// STATE
// ============================================================

/** Application state object */
const state = {
  lang: 'en',          // Current language
  selectedBrand: null,
  selectedModel: null,
  selectedProblem: null,
  priceData: null,
  shops: [],
  map: null,           // Leaflet map instance
  markers: [],         // Map marker references
  userLocation: null,  // { lat, lng } if granted
  userMarker: null,    // Leaflet marker for user position
  routePolyline: null,     // Leaflet polyline for route
  routePolylineGlow: null, // Highlight polyline
  activeShop: null,        // Currently selected shop for directions
};

// ============================================================
// SUPABASE CLIENT
// ============================================================

/**
 * Minimal Supabase REST client using direct fetch calls.
 * Uses a simple query builder that is NOT async until .execute() is called.
 */
const supabase = {
  from(table) {
    const builder = {
      _table: table,
      _select: '*',
      _filters: [],
      _order: null,

      select(cols) {
        this._select = cols;
        return this;
      },

      eq(column, value) {
        this._filters.push(`${column}=eq.${encodeURIComponent(value)}`);
        return this;
      },

      order(column, { ascending = true } = {}) {
        this._order = `${column}.${ascending ? 'asc' : 'desc'}`;
        return this;
      },

      async execute() {
        let url = `${SUPABASE_CONFIG.url}/rest/v1/${this._table}?select=${encodeURIComponent(this._select)}`;
        if (this._filters.length) url += '&' + this._filters.join('&');
        if (this._order) url += `&order=${this._order}`;

        const res = await fetch(url, {
          headers: {
            'apikey': SUPABASE_CONFIG.key,
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (!res.ok) {
          let msg = 'Supabase query failed';
          try { msg = (await res.json()).message || msg; } catch(_) {}
          throw new Error(msg);
        }

        const data = await res.json();
        return { data, error: null };
      }
    };
    return builder;
  }
};

// ============================================================
// LANGUAGE SYSTEM
// ============================================================

/**
 * Get translation string for current language
 * @param {string} key - Translation key
 * @returns {string}
 */
function t(key) {
  return translations[state.lang][key] || key;
}

/**
 * Toggle between English and Burmese
 */
function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'mm' : 'en';
  applyTranslations();
  updateDynamicText();
}

/**
 * Apply all translations to DOM elements with data-i18n attribute
 */
function applyTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  // Update lang toggle button
  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.textContent = t('langButton');
}

/**
 * Update dynamic select options and result text based on language
 */
function updateDynamicText() {
  // Re-render select placeholders
  const brandSel = document.getElementById('carBrand');
  const modelSel = document.getElementById('carModel');
  const problemSel = document.getElementById('carProblem');

  if (brandSel && brandSel.options[0]) {
    brandSel.options[0].text = t('chooseBrand');
  }
  if (modelSel && modelSel.options[0]) {
    modelSel.options[0].text = state.selectedBrand ? t('chooseModel') : t('selectBrandFirst');
  }
  if (problemSel && problemSel.options[0]) {
    problemSel.options[0].text = t('chooseProblem');
  }

  // Update price display if visible
  if (state.priceData) {
    displayPrice(state.priceData);
  }

  // Update shop list if loaded
  if (state.shops.length > 0) {
    renderShopList(state.shops);
  }
}

// ============================================================
// DATA LOADING FUNCTIONS
// ============================================================

/**
 * Load all car brands from Supabase and populate the brand dropdown
 */
async function loadCarBrands() {
  const select = document.getElementById('carBrand');
  setLoading(select, true);

  try {
    const { data, error } = await supabase
      .from('car_brands')
      .select('id,name_en,name_mm')
      .order('name_en', { ascending: true })
      .execute();

    if (error) throw error;

    // Clear existing options
    select.innerHTML = `<option value="">${t('chooseBrand')}</option>`;

    // Populate brands
    data.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand.id;
      option.textContent = state.lang === 'en' ? brand.name_en : brand.name_mm;
      option.dataset.nameEn = brand.name_en;
      option.dataset.nameMm = brand.name_mm;
      select.appendChild(option);
    });

    setLoading(select, false);
  } catch (err) {
    console.error('Error loading brands:', err);
    showNotification(t('errorLoadBrands'), 'error');
    setLoading(select, false);
  }
}

/**
 * Load car models for a specific brand from Supabase
 * @param {number} brandId - The selected brand's ID
 */
async function loadCarModels(brandId) {
  const select = document.getElementById('carModel');
  select.innerHTML = `<option value="">${t('loading')}</option>`;
  select.disabled = true;

  try {
    const { data, error } = await supabase
      .from('car_models')
      .select('id,brand_id,name_en,name_mm')
      .eq('brand_id', brandId)
      .order('name_en', { ascending: true })
      .execute();

    if (error) throw error;

    select.innerHTML = `<option value="">${t('chooseModel')}</option>`;

    data.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = state.lang === 'en' ? model.name_en : model.name_mm;
      option.dataset.nameEn = model.name_en;
      option.dataset.nameMm = model.name_mm;
      select.appendChild(option);
    });

    select.disabled = false;
  } catch (err) {
    console.error('Error loading models:', err);
    select.innerHTML = `<option value="">${t('errorLoadModels')}</option>`;
  }
}

/**
 * Load all car problems from Supabase and populate the problem dropdown
 */
async function loadCarProblems() {
  const select = document.getElementById('carProblem');

  try {
    const { data, error } = await supabase
      .from('car_problems')
      .select('id,name_en,name_mm,description')
      .order('name_en', { ascending: true })
      .execute();

    if (error) throw error;

    select.innerHTML = `<option value="">${t('chooseProblem')}</option>`;

    data.forEach(problem => {
      const option = document.createElement('option');
      option.value = problem.id;
      option.textContent = state.lang === 'en' ? problem.name_en : problem.name_mm;
      option.dataset.nameEn = problem.name_en;
      option.dataset.nameMm = problem.name_mm;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading problems:', err);
    showNotification(t('errorLoadProblems'), 'error');
  }
}

/**
 * Load repair price for a specific problem
 * @param {number} problemId - The selected problem's ID
 */
async function loadRepairPrice(problemId) {
  try {
    const { data, error } = await supabase
      .from('repair_prices')
      .select('min_price,max_price,problem_id')
      .eq('problem_id', problemId)
      .execute();

    if (error) throw error;

    if (data && data.length > 0) {
      state.priceData = data[0];
      displayPrice(data[0]);
    }
  } catch (err) {
    console.error('Error loading price:', err);
  }
}

/**
 * Load all repair shops from Supabase
 */
async function loadRepairShops() {
  const listContainer = document.getElementById('shopList');
  listContainer.innerHTML = `<div class="loading-indicator"><div class="spinner"></div><span>${t('searchingShops')}</span></div>`;

  try {
    const { data, error } = await supabase
      .from('repair_shops')
      .select('id,shop_name,address,city,latitude,longitude,phone')
      .order('shop_name', { ascending: true })
      .execute();

    if (error) throw error;

    // Sort by distance if user location is available
    const shopsToShow = state.userLocation
      ? sortShopsByDistance(data, state.userLocation.lat, state.userLocation.lng)
      : data;
    state.shops = shopsToShow;
    renderShopList(shopsToShow);
    updateMapMarkers(shopsToShow);

    // Show shops section
    document.getElementById('shopsSection').classList.add('visible');

    // Scroll to shops
    document.getElementById('shopsSection').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Error loading shops:', err);
    listContainer.innerHTML = `<p class="error-msg">${t('errorLoadShops')}</p>`;
    showNotification(t('errorLoadShops'), 'error');
  }
}

// ============================================================
// DISPLAY FUNCTIONS
// ============================================================

/**
 * Display the price estimate result
 * @param {Object} price - Price object with min_price and max_price
 */
function displayPrice(price) {
  const resultBox = document.getElementById('priceResult');
  const minFormatted = Number(price.min_price).toLocaleString();
  const maxFormatted = Number(price.max_price).toLocaleString();
  const currency = t('currency');

  resultBox.innerHTML = `
    <div class="price-label">${t('estimatedCost')}</div>
    <div class="price-amount">
      <span class="price-min">${minFormatted}</span>
      <span class="price-sep">–</span>
      <span class="price-max">${maxFormatted}</span>
      <span class="price-currency">${currency}</span>
    </div>
  `;
  resultBox.classList.add('visible');

  // Animate in
  resultBox.style.animation = 'none';
  requestAnimationFrame(() => {
    resultBox.style.animation = 'priceReveal 0.5s ease forwards';
  });
}

/**
 * Render repair shop cards in the list container
 * @param {Array} shops - Array of shop objects
 */
function renderShopList(shops) {
  const container = document.getElementById('shopList');

  if (!shops || shops.length === 0) {
    container.innerHTML = `<p class="no-results">${t('noShopsFound')}</p>`;
    return;
  }

  container.innerHTML = shops.map((shop, i) => `
    <div class="shop-card" style="animation-delay: ${i * 0.07}s" data-lat="${shop.latitude}" data-lng="${shop.longitude}">
      <div class="shop-header">
        <div class="shop-icon">🔧</div>
        <div class="shop-info">
          <h3 class="shop-name">${shop.shop_name}</h3>
          <div class="shop-meta">
            <span class="shop-city">${shop.city}</span>
            ${shop.distance !== undefined ? `<span class="shop-distance">📍 ${shop.distance.toFixed(1)} ${t('kmAway')}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="shop-details">
        <div class="shop-detail-row">
          <span class="detail-icon">📍</span>
          <span>${shop.address}</span>
        </div>
        <div class="shop-detail-row">
          <span class="detail-icon">📞</span>
          <a href="tel:${shop.phone}" class="shop-phone">${shop.phone}</a>
        </div>
      </div>
      <div class="shop-actions">
        <button class="btn-directions" onclick="getDirectionsToShop(${shop.latitude}, ${shop.longitude}, '${shop.shop_name.replace(/'/g, "\\'")}')">
          🧭 <span>${t('btnDirections')}</span>
        </button>
        <a href="https://www.openstreetmap.org/?mlat=${shop.latitude}&mlon=${shop.longitude}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="btn-map-link"
           onclick="focusShopOnMap(${shop.latitude}, ${shop.longitude})"
        >
          🗺️ ${t('btnOpenMap')}
        </a>
      </div>
    </div>
  `).join('');
}

// ============================================================
// MAP FUNCTIONS
// ============================================================

/**
 * Initialize the Leaflet map centered on Myanmar
 */
function initMap() {
  if (state.map) return;
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded — map disabled.');
    const mapEl = document.getElementById('map');
    if (mapEl) mapEl.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:2rem;">Map unavailable. Check internet connection.</p>';
    return;
  }
  try {
    state.map = L.map('map', {
      center: [MYANMAR_CENTER.lat, MYANMAR_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(state.map);
  } catch (e) {
    console.error('Map init failed:', e);
  }
}

/**
 * Update map markers with repair shop locations
 * @param {Array} shops - Array of shop objects
 */
function updateMapMarkers(shops) {
  // Guard: map or Leaflet not available
  if (!state.map || typeof L === 'undefined') return;

  // Remove existing markers
  state.markers.forEach(m => state.map.removeLayer(m));
  state.markers = [];

  if (!shops || shops.length === 0) return;

  // Custom marker icon
  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin">🔧</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  shops.forEach(shop => {
    const marker = L.marker([shop.latitude, shop.longitude], { icon: markerIcon })
      .addTo(state.map)
      .bindPopup(`
        <div class="map-popup">
          <strong class="popup-name">${shop.shop_name}</strong>
          <p class="popup-address">📍 ${shop.address}</p>
          <p class="popup-phone">📞 <a href="tel:${shop.phone}">${shop.phone}</a></p>
          <div class="popup-actions">
            <button class="popup-dir-btn" onclick="getDirectionsToShop(${shop.latitude}, ${shop.longitude}, '${shop.shop_name.replace(/'/g, "\'")}')">
              🧭 ${t('btnDirections')}
            </button>
            <a href="https://www.openstreetmap.org/?mlat=${shop.latitude}&mlon=${shop.longitude}" 
               target="_blank" 
               class="popup-map-btn"
            >🗺️ ${t('btnOpenMap')}</a>
          </div>
        </div>
      `);

    state.markers.push(marker);
  });

  // Fit map to show all markers
  if (state.markers.length > 0) {
    const group = L.featureGroup(state.markers);
    state.map.fitBounds(group.getBounds().pad(0.15));
  }
}

/**
 * Focus the map on a specific shop location
 * @param {number} lat
 * @param {number} lng
 */
function focusShopOnMap(lat, lng) {
  if (!state.map) return;
  state.map.setView([lat, lng], 14, { animate: true });

  // Find and open the popup for this marker
  const marker = state.markers.find(m => {
    const pos = m.getLatLng();
    return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001;
  });
  if (marker) marker.openPopup();
}




// ============================================================
// DIRECTIONS FUNCTIONS
// Uses OSRM public API directly via fetch — NO plugin needed.
// Draws the route as a Leaflet polyline on the map.
// Falls back to Google Maps if OSRM is unreachable.
// ============================================================

/**
 * Entry point: called when user clicks "Get Directions" on any shop.
 * Handles location acquisition then calls drawRoute().
 */
function getDirectionsToShop(shopLat, shopLng, shopName) {
  state.activeShop = { lat: shopLat, lng: shopLng, name: shopName };

  if (!state.map) {
    showNotification(t('mapNotReady'), 'error');
    return;
  }

  if (state.userLocation) {
    // Already have location — draw immediately
    drawRoute(state.userLocation.lat, state.userLocation.lng, shopLat, shopLng, shopName);
  } else if (navigator.geolocation) {
    // Request location first
    showNotification(t('gettingLocationForRoute'), 'info');

    // Show panel with loading state right away so user sees feedback
    showDirectionsPanel(shopName, null, null, true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        placeUserMarker(state.userLocation.lat, state.userLocation.lng);
        drawRoute(state.userLocation.lat, state.userLocation.lng, shopLat, shopLng, shopName);
      },
      (err) => {
        // Location denied or failed — open Google Maps instead
        clearDirectionsPanel();
        showNotification(t('locationDenied'), 'error');
        openGoogleMapsDirections(shopLat, shopLng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    // No geolocation support — open Google Maps
    openGoogleMapsDirections(shopLat, shopLng);
  }
}

/**
 * Fetch route from OSRM and draw it on the map as a polyline.
 * OSRM returns an encoded polyline; we decode and draw it with Leaflet.
 */
async function drawRoute(fromLat, fromLng, toLat, toLng, shopName) {
  // Show panel with loading spinner
  showDirectionsPanel(shopName, null, null, true);

  // Remove any existing route polyline
  clearRoutePolyline();

  try {
    // Call OSRM route API directly — no plugin needed
    const url = `https://router.project-osrm.org/route/v1/driving/` +
                `${fromLng},${fromLat};${toLng},${toLat}` +
                `?overview=full&geometries=geojson&steps=true&annotations=false`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM response error: ' + res.status);

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) throw new Error('No route found');

    const route   = data.routes[0];
    const distKm  = (route.distance / 1000).toFixed(1);
    const mins    = Math.round(route.duration / 60);

    // Draw route line on map using GeoJSON coordinates
    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    state.routePolyline = L.polyline(coords, {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(state.map);

    // Also draw a thinner highlight line on top
    state.routePolylineGlow = L.polyline(coords, {
      color: '#fcd34d',
      weight: 2,
      opacity: 0.7,
      lineJoin: 'round',
    }).addTo(state.map);

    // Fit map to show full route
    state.map.fitBounds(state.routePolyline.getBounds().pad(0.15));

    // Collect steps from all legs
    const steps = [];
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.maneuver && step.name !== undefined) {
          steps.push({
            type: step.maneuver.type,
            modifier: step.maneuver.modifier || '',
            text: formatStepText(step.maneuver.type, step.maneuver.modifier, step.name),
            distance: step.distance,
          });
        }
      });
    });

    // Update panel with results
    showDirectionsPanel(shopName, distKm, mins, false, steps);

  } catch (err) {
    console.error('Route fetch failed:', err);
    // Show error in panel with Google Maps fallback button
    showDirectionsPanel(shopName, null, null, false, null, true);
  }
}

/**
 * Show/update the directions panel UI
 */
function showDirectionsPanel(shopName, distKm, mins, loading, steps, hasError) {
  const panel     = document.getElementById('directionsPanel');
  const nameEl    = document.getElementById('directionsShopName');
  const summaryEl = document.getElementById('directionsSummary');
  const stepsEl   = document.getElementById('directionsSteps');

  panel.classList.add('visible');
  nameEl.textContent = shopName;

  if (loading) {
    summaryEl.innerHTML = '';
    stepsEl.innerHTML = `<div class="dir-loading"><div class="spinner"></div> ${t('calculatingRoute')}</div>`;
    return;
  }

  if (hasError) {
    summaryEl.innerHTML = '';
    stepsEl.innerHTML = `
      <div class="dir-error-block">
        <p class="dir-error">${t('routeError')}</p>
        <button class="btn-gmaps-fallback" onclick="openGoogleMapsDirections(state.activeShop.lat, state.activeShop.lng)">
          🗺️ ${t('openGoogleMaps')}
        </button>
      </div>`;
    return;
  }

  // Success
  summaryEl.innerHTML = `
    <span class="dir-dist">🛣️ ${distKm} km</span>
    <span class="dir-time">⏱️ ${mins} ${t('minutes')}</span>`;

  if (steps && steps.length > 0) {
    stepsEl.innerHTML = steps.map((step, i) => `
      <div class="dir-step">
        <span class="dir-step-num">${i + 1}</span>
        <span class="dir-step-icon">${getStepIcon(step.type, step.modifier)}</span>
        <span class="dir-step-text">${step.text}</span>
        <span class="dir-step-dist">${formatDist(step.distance)}</span>
      </div>`).join('');
  } else {
    stepsEl.innerHTML = `<p class="dir-no-steps">${t('routeOnMap')}</p>`;
  }

  // Scroll panel into view
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Remove route polylines from the map
 */
function clearRoutePolyline() {
  if (state.routePolyline)     { state.map.removeLayer(state.routePolyline);     state.routePolyline = null; }
  if (state.routePolylineGlow) { state.map.removeLayer(state.routePolylineGlow); state.routePolylineGlow = null; }
}

/**
 * Clear route and hide directions panel
 */
function clearRoute() {
  clearRoutePolyline();
  clearDirectionsPanel();
}

function clearDirectionsPanel() {
  const panel = document.getElementById('directionsPanel');
  if (panel) panel.classList.remove('visible');
}

/**
 * Open Google Maps directions in new tab
 */
function openGoogleMapsDirections(shopLat, shopLng) {
  if (!shopLat || !shopLng) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${shopLat},${shopLng}&travelmode=driving`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format a human-readable step instruction from OSRM maneuver data
 */
function formatStepText(type, modifier, name) {
  const road = name ? `onto ${name}` : '';
  const modMap = {
    'uturn':       'Make a U-turn',
    'sharp right': 'Turn sharp right',
    'right':       'Turn right',
    'slight right':'Keep slight right',
    'straight':    'Continue straight',
    'slight left': 'Keep slight left',
    'left':        'Turn left',
    'sharp left':  'Turn sharp left',
  };
  if (type === 'depart')  return `Head ${modifier || 'forward'} ${road}`.trim();
  if (type === 'arrive')  return 'Arrive at destination';
  if (type === 'roundabout' || type === 'rotary') return `Enter roundabout ${road}`.trim();
  const base = modMap[modifier] || (modifier ? modifier.charAt(0).toUpperCase() + modifier.slice(1) : 'Continue');
  return road ? `${base} ${road}` : base;
}

/**
 * Return a directional emoji for a maneuver type+modifier
 */
function getStepIcon(type, modifier) {
  if (type === 'depart')           return '🚦';
  if (type === 'arrive')           return '🏁';
  if (type === 'roundabout' || type === 'rotary') return '🔃';
  const mod = modifier || '';
  if (mod.includes('sharp right'))  return '↪️';
  if (mod.includes('right'))        return '➡️';
  if (mod.includes('slight right')) return '↗️';
  if (mod.includes('sharp left'))   return '↩️';
  if (mod.includes('left'))         return '⬅️';
  if (mod.includes('slight left'))  return '↖️';
  if (mod.includes('uturn'))        return '🔄';
  return '⬆️';
}

/**
 * Format metres to a readable distance string
 */
function formatDist(meters) {
  if (!meters) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}


// ============================================================
// LOCATION FUNCTIONS
// ============================================================

/**
 * Calculate distance in km between two lat/lng points (Haversine formula)
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Place a "You Are Here" marker on the map
 */
function placeUserMarker(lat, lng) {
  if (!state.map || typeof L === 'undefined') return;

  // Remove existing user marker
  if (state.userMarker) {
    state.map.removeLayer(state.userMarker);
    state.userMarker = null;
  }

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div class="user-pin"><span>📍</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  state.userMarker = L.marker([lat, lng], { icon: userIcon })
    .addTo(state.map)
    .bindPopup(`<div class="map-popup"><strong>${t('youAreHere')}</strong></div>`)
    .openPopup();

  // Pan map to user location
  state.map.setView([lat, lng], 11, { animate: true });
}

/**
 * Sort shops array by distance from user location
 */
function sortShopsByDistance(shops, userLat, userLng) {
  return shops
    .map(shop => ({
      ...shop,
      distance: getDistanceKm(userLat, userLng, shop.latitude, shop.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Handle "Use My Location" button click
 * Requests geolocation permission and sorts shops by proximity
 */
function onUseMyLocation() {
  const btn = document.getElementById('btnLocation');
  const statusEl = document.getElementById('locationStatus');

  // Check browser support
  if (!navigator.geolocation) {
    statusEl.textContent = t('locationUnsupported');
    statusEl.className = 'location-status location-error';
    return;
  }

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = `⏳ <span>${t('locating')}</span>`;
  statusEl.textContent = t('locating');
  statusEl.className = 'location-status location-loading';

  navigator.geolocation.getCurrentPosition(
    // ✅ SUCCESS
    async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      state.userLocation = { lat, lng };

      // Place marker on map
      placeUserMarker(lat, lng);

      // If shops already loaded, re-sort them by distance
      if (state.shops.length > 0) {
        const sorted = sortShopsByDistance(state.shops, lat, lng);
        state.shops = sorted;
        renderShopList(sorted);
        updateMapMarkers(sorted);
      } else {
        // Load shops now, they'll be sorted after
        await loadRepairShops();
      }

      // Update status
      statusEl.textContent = t('locationFound');
      statusEl.className = 'location-status location-success';

      // Reset button
      btn.disabled = false;
      btn.innerHTML = `✅ <span data-i18n="btnMyLocation">${t('btnMyLocation')}</span>`;
    },

    // ❌ ERROR
    (err) => {
      let msg = t('locationError');
      if (err.code === err.PERMISSION_DENIED) msg = t('locationDenied');

      statusEl.textContent = msg;
      statusEl.className = 'location-status location-error';

      btn.disabled = false;
      btn.innerHTML = `📍 <span data-i18n="btnMyLocation">${t('btnMyLocation')}</span>`;
    },

    // Options
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

// ============================================================
// UI HELPER FUNCTIONS
// ============================================================

/**
 * Show/hide loading state on a select element
 */
function setLoading(el, isLoading) {
  if (isLoading) {
    el.innerHTML = `<option>${t('loading')}</option>`;
    el.disabled = true;
  } else {
    el.disabled = false;
  }
}

/**
 * Show a temporary notification message
 * @param {string} message
 * @param {string} type - 'error' | 'success' | 'info'
 */
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/**
 * Update the step progress indicator
 * @param {number} activeStep - 1-indexed step number
 */
function updateStepIndicator(activeStep) {
  document.querySelectorAll('.step-item').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === activeStep);
    el.classList.toggle('completed', i + 1 < activeStep);
  });
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handle car brand selection change
 */
function onBrandChange() {
  const brandId = document.getElementById('carBrand').value;
  const modelSelect = document.getElementById('carModel');

  // Reset downstream state
  state.selectedBrand = brandId || null;
  state.selectedModel = null;
  state.priceData = null;

  if (!brandId) {
    modelSelect.innerHTML = `<option value="">${t('selectBrandFirst')}</option>`;
    modelSelect.disabled = true;
    return;
  }

  loadCarModels(brandId);
  updateStepIndicator(1);
}

/**
 * Handle car model selection change
 */
function onModelChange() {
  const modelId = document.getElementById('carModel').value;
  state.selectedModel = modelId || null;
  if (modelId) updateStepIndicator(2);
}

/**
 * Handle problem selection change
 */
function onProblemChange() {
  const problemId = document.getElementById('carProblem').value;
  state.selectedProblem = problemId || null;

  // Hide price if problem deselected
  if (!problemId) {
    document.getElementById('priceResult').classList.remove('visible');
    state.priceData = null;
    return;
  }

  updateStepIndicator(2);
}

/**
 * Handle "Get Price Estimate" button click
 */
async function onEstimatePrice() {
  if (!state.selectedProblem) {
    showNotification(t('selectProblemFirst'), 'error');
    return;
  }

  const btn = document.getElementById('btnEstimate');
  btn.disabled = true;
  btn.textContent = t('loading');

  await loadRepairPrice(state.selectedProblem);
  updateStepIndicator(3);

  btn.disabled = false;
  btn.textContent = t('btnEstimate');
}

/**
 * Handle "Search Repair Shops" button click
 */
async function onSearchShops() {
  const btn = document.getElementById('btnSearch');
  btn.disabled = true;
  btn.textContent = t('searchingShops');

  await loadRepairShops();
  updateStepIndicator(4);

  // Invalidate map size after container becomes visible
  setTimeout(() => {
    if (state.map) state.map.invalidateSize();
  }, 300);

  btn.disabled = false;
  btn.textContent = t('btnSearch');
}

// ============================================================
// INITIALISATION
// ============================================================

/**
 * Bootstrap the application on page load
 */
async function init() {
  // Apply initial translations
  applyTranslations();

  // Initialize map
  initMap();

  // Load initial data
  await Promise.all([
    loadCarBrands(),
    loadCarProblems(),
  ]);

  // Set initial model dropdown state
  const modelSelect = document.getElementById('carModel');
  modelSelect.innerHTML = `<option value="">${t('selectBrandFirst')}</option>`;
  modelSelect.disabled = true;

  // Attach event listeners
  document.getElementById('carBrand').addEventListener('change', onBrandChange);
  document.getElementById('carModel').addEventListener('change', onModelChange);
  document.getElementById('carProblem').addEventListener('change', onProblemChange);
  document.getElementById('btnEstimate').addEventListener('click', onEstimatePrice);
  document.getElementById('btnSearch').addEventListener('click', onSearchShops);
  document.getElementById('btnLocation').addEventListener('click', onUseMyLocation);
  document.getElementById('langToggle').addEventListener('click', toggleLanguage);

  console.log('✅ ကား ပြင်ဆိုင် app initialized');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
