/* ============================================================
   WebGIS Ketapang – Dashboard Application Logic
   ============================================================ */

(function () {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────
  const CONFIG = {
    center: [-1.5, 110.0],   // Approximate center of Ketapang
    zoom: 9,
    maxZoom: 18,
    files: {
      boundary: 'https://raw.githubusercontent.com/riqqq31/Web-GIS-Ketapang/main/data/Ketapang.geojson',
      veg2024:  'https://raw.githubusercontent.com/riqqq31/Web-GIS-Ketapang/main/results/Ketapang_Vegetasi_2024.geojson',
      veg2025:  'https://raw.githubusercontent.com/riqqq31/Web-GIS-Ketapang/main/results/Ketapang_Vegetasi_2025.geojson',
      gain:     'https://raw.githubusercontent.com/riqqq31/Web-GIS-Ketapang/main/results/Ketapang_Gain_2024_2025.geojson',
      loss:     'https://raw.githubusercontent.com/riqqq31/Web-GIS-Ketapang/main/results/Ketapang_Loss_2024_2025.geojson',
    },
    styles: {
      boundary: { color: '#2d6a4f', weight: 2.5, fillOpacity: 0, dashArray: '6 4' },
      veg2024:  { color: '#40916c', weight: 0.3, fillColor: '#40916c', fillOpacity: 0.45 },
      veg2025:  { color: '#95d5b2', weight: 0.3, fillColor: '#95d5b2', fillOpacity: 0.45 },
      gain:     { color: '#22c55e', weight: 0.3, fillColor: '#22c55e', fillOpacity: 0.55 },
      loss:     { color: '#ef4444', weight: 0.3, fillColor: '#ef4444', fillOpacity: 0.55 },
    },
    // ── Confusion Matrix & APRF ──
    // GANTI NILAI INI DENGAN HASIL EVALUASI GEE ANDA
    evaluation: {
      tp: 80,   // True Positive
      fn: 0,    // False Negative
      fp: 1,    // False Positive
      tn: 79,   // True Negative
    },
  };

  // Compute APRF from confusion matrix
  const { tp, fn, fp, tn } = CONFIG.evaluation;
  const totalTest = tp + fn + fp + tn;
  CONFIG.metrics = {
    accuracy:  ((tp + tn) / totalTest) * 100,
    precision: (tp / (tp + fp)) * 100,
    recall:    (tp / (tp + fn)) * 100,
    f1:        (2 * tp / (2 * tp + fp + fn)) * 100,
  };

  // ─── State ──────────────────────────────────────────────────
  let map;
  const layers = {};
  const layerLoaded = {};

  // ─── Initialization ─────────────────────────────────────────
  function init() {
    initTabs();
    initMap();
    loadInitialLayers();
    initLayerToggles();
    initBasemapSwitcher();
    populateEvaluation();
    handleURLParams();
  }

  // ─── Tab Navigation ─────────────────────────────────────────
  function initTabs() {
    const navLinks = document.querySelectorAll('#sidebar-nav a[data-tab]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = link.dataset.tab;
        switchTab(tabName);
      });
    });
  }

  function switchTab(tabName) {
    // Update nav
    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
    const activeNav = document.querySelector(`#sidebar-nav a[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) activePanel.classList.add('active');

    // Invalidate map size when switching to map tab
    if (tabName === 'peta' && map) {
      setTimeout(() => map.invalidateSize(), 100);
    }

    // Animate metrics bars when switching to evaluasi tab
    if (tabName === 'evaluasi') {
      setTimeout(animateMetricBars, 200);
    }
  }

  // ─── URL Parameter Handling ─────────────────────────────────
  function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) switchTab(tab);
  }

  // ─── Map Setup ──────────────────────────────────────────────
  const BASEMAPS = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO',
      maxZoom: 19,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      maxZoom: 19,
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap',
      maxZoom: 17,
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO',
      maxZoom: 19,
    },
  };
  let currentBasemap = null;

  function initMap() {
    map = L.map('map', {
      center: CONFIG.center,
      zoom: CONFIG.zoom,
      maxZoom: CONFIG.maxZoom,
      zoomControl: false,
    });

    // Default basemap
    setBasemap('dark');

    // Zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }

  function setBasemap(key) {
    if (currentBasemap) map.removeLayer(currentBasemap);
    const bm = BASEMAPS[key];
    currentBasemap = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom,
    });
    currentBasemap.addTo(map);
    currentBasemap.bringToBack();
  }

  function initBasemapSwitcher() {
    document.querySelectorAll('#basemap-options input[name="basemap"]').forEach(radio => {
      radio.addEventListener('change', function () {
        setBasemap(this.value);
        // Update active class on labels
        document.querySelectorAll('.basemap-option').forEach(l => l.classList.remove('active'));
        this.closest('.basemap-option').classList.add('active');
      });
    });
  }

  // ─── Layer Loading ──────────────────────────────────────────
  async function loadGeoJSON(key) {
    if (layerLoaded[key]) return layers[key];
    const url = CONFIG.files[key];
    const baseStyle = CONFIG.styles[key];
    // Pastikan VectorGrid merender warna fill & stroke dengan benar
    const style = Object.assign({ fill: true, stroke: true }, baseStyle);

    showLoading(`Memuat layer ${key}…`);
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      // Gunakan VectorGrid Slicer alih-alih L.geoJSON
      const geojsonLayer = L.vectorGrid.slicer(data, {
        rendererFactory: L.canvas.tile,
        vectorTileLayerStyles: {
          sliced: style
        },
        interactive: true,
        getFeatureId: function(f) {
          return f.properties.id || Math.floor(Math.random() * 100000);
        }
      });

      // Implementasi Klik & Tanya (Feature Info)
      geojsonLayer.on('click', function(e) {
        const props = e.layer.properties;
        if (!props) return;

        let html = '';
        if (key === 'gain' || key === 'loss') {
          const type = key === 'gain' ? 'Bertambah (Gain)' : 'Berkurang (Loss)';
          const areaHa = props.area_ha
            ? parseFloat(props.area_ha).toLocaleString('id-ID', { maximumFractionDigits: 2 })
            : '—';
          html = `
            <div style="font-size:0.82rem;">
              <strong style="color:${key === 'gain' ? '#22c55e' : '#ef4444'}">${type}</strong><br/>
              ${props.area_ha ? `Luas: ${areaHa} ha` : ''}
            </div>`;
        } else if (key === 'boundary') {
          html = `<div style="font-size:0.82rem;"><strong>Kabupaten Ketapang</strong><br/>Kalimantan Barat</div>`;
        } else {
          const year = key === 'veg2024' ? '2024' : '2025';
          html = `<div style="font-size:0.82rem;"><strong>Vegetasi ${year}</strong></div>`;
        }
        
        if (html) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
        }
      });

      layers[key] = geojsonLayer;
      layerLoaded[key] = true;
      return geojsonLayer;
    } catch (err) {
      console.error(`Error loading ${key}:`, err);
      return null;
    } finally {
      hideLoading();
    }
  }

  async function loadInitialLayers() {
    // Load boundary first (small file)
    const boundaryLayer = await loadGeoJSON('boundary');
    if (boundaryLayer) {
      boundaryLayer.addTo(map);
      if (typeof boundaryLayer.getBounds === 'function') {
        map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] });
      }
    }

    // Pre-load gain and loss (checked by default)
    const gainLayer = await loadGeoJSON('gain');
    if (gainLayer) gainLayer.addTo(map);

    const lossLayer = await loadGeoJSON('loss');
    if (lossLayer) lossLayer.addTo(map);
  }

  // ─── Layer Toggles ─────────────────────────────────────────
  function initLayerToggles() {
    document.querySelectorAll('.layer-toggle input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', async function () {
        const key = this.dataset.layer;
        if (this.checked) {
          let layer = layers[key];
          if (!layer) {
            layer = await loadGeoJSON(key);
          }
          if (layer && !map.hasLayer(layer)) {
            layer.addTo(map);
          }
        } else {
          if (layers[key] && map.hasLayer(layers[key])) {
            map.removeLayer(layers[key]);
          }
        }
      });
    });
  }

  // ─── Evaluation Population ─────────────────────────────────
  function populateEvaluation() {
    // Confusion Matrix
    document.getElementById('cm-tp').textContent = tp;
    document.getElementById('cm-fn').textContent = fn;
    document.getElementById('cm-fp').textContent = fp;
    document.getElementById('cm-tn').textContent = tn;

    // Metrics
    const m = CONFIG.metrics;
    document.getElementById('metric-accuracy').textContent  = m.accuracy.toFixed(2) + '%';
    document.getElementById('metric-precision').textContent = m.precision.toFixed(2) + '%';
    document.getElementById('metric-recall').textContent    = m.recall.toFixed(2) + '%';
    document.getElementById('metric-f1').textContent        = m.f1.toFixed(2) + '%';
  }

  function animateMetricBars() {
    const m = CONFIG.metrics;
    document.getElementById('bar-accuracy').style.width  = m.accuracy + '%';
    document.getElementById('bar-precision').style.width = m.precision + '%';
    document.getElementById('bar-recall').style.width    = m.recall + '%';
    document.getElementById('bar-f1').style.width        = m.f1 + '%';
  }

  // ─── Loading Overlay ───────────────────────────────────────
  function showLoading(text) {
    const overlay = document.getElementById('map-loading');
    const textEl = document.getElementById('loading-text');
    if (textEl) textEl.textContent = text || 'Memuat data geospasial…';
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('map-loading');
    if (overlay) overlay.classList.add('hidden');
  }

  // ─── Global: Zoom to Location (for Insight buttons) ────────
  window.zoomToLocation = function (lng, lat, label) {
    // Switch to peta tab
    switchTab('peta');
    setTimeout(() => {
      if (map) {
        map.flyTo([lat, lng], 13, { duration: 1.5 });
        L.popup()
          .setLatLng([lat, lng])
          .setContent(`<div style="font-size:0.82rem;"><strong>${label}</strong><br/>Lon: ${lng}, Lat: ${lat}</div>`)
          .openOn(map);
      }
    }, 250);
  };

  // ─── Boot ───────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
