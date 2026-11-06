/* ==========================================================================
   ATLAS ODYSSEY INTERACTIVE WORLD MAP (LEAFLET.JS)
   Covers ALL 180 sovereign nations with Teal, Gold, and Rose Pink Themes
   CartoDB Voyager basemap — warm, editorial aesthetic
   ========================================================================== */

const MapExplorer = (() => {
    let map = null;
    let geoJsonLayer = null;
    let currentlySelectedLayer = null;
    let initialized = false;

    /* ------------------------------------------------------------------
       init()  — called on DOMContentLoaded; deliberately a no-op so that
       Leaflet only measures the #map div after the explorer view is
       visible.  The real work happens in activateMap().
       ------------------------------------------------------------------ */
    function init() {
        // no-op — defer everything to activateMap()
    }

    /* ------------------------------------------------------------------
       activateMap()  — primary entry point, called by main.js whenever
       the map / explorer view becomes visible.
       First call: creates the Leaflet map.
       Subsequent calls: just fix tile sizing.
       ------------------------------------------------------------------ */
    function activateMap() {
        if (!initialized) {
            initialized = true;
            _createMap();
        }
        if (map) {
            setTimeout(() => map.invalidateSize(true), 80);
            setTimeout(() => map.invalidateSize(true), 300);
            setTimeout(() => map.invalidateSize(true), 600);
        }
    }

    /* ------------------------------------------------------------------
       _createMap()  — one-time Leaflet bootstrap
       ------------------------------------------------------------------ */
    function _createMap() {
        const el = document.getElementById('map');
        if (!el) return;

        map = L.map('map', {
            center: [25, 10],
            zoom: 2,
            minZoom: 2,
            maxZoom: 8,
            zoomControl: true,
            attributionControl: true,
            worldCopyJump: true
        });

        // CartoDB Voyager — warm, light, editorial look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        map.zoomControl.setPosition('topright');

        _loadGeoJSON();
    }

    /* ------------------------------------------------------------------
       _loadGeoJSON()  — fetch world boundaries & render interactive layer
       ------------------------------------------------------------------ */
    async function _loadGeoJSON() {
        try {
            const response = await fetch('/static/data/world.json');
            if (!response.ok) throw new Error('Could not load world map boundaries JSON');

            const geojsonData = await response.json();

            geoJsonLayer = L.geoJSON(geojsonData, {
                style: _defaultStyle,
                onEachFeature: _onEachFeature
            }).addTo(map);
            if (map) {
                setTimeout(() => map.invalidateSize(true), 50);
            }
        } catch (err) {
            console.error('Error loading map GeoJSON data:', err);
        }
    }

    /* ------------------------------------------------------------------
       Styles
       ------------------------------------------------------------------ */

    /** Default country style: teal fill + gold borders */
    function _defaultStyle(/* feature */) {
        return {
            fillColor: '#0097a7',
            fillOpacity: 0.12,
            weight: 1,
            opacity: 1,
            color: 'rgba(192,145,94,0.5)',   // warm gold border
            className: 'interactive-country'
        };
    }

    /** Hover style: rose pink border, slightly stronger fill */
    const _hoverStyle = {
        fillOpacity: 0.3,
        weight: 2,
        color: '#d4456a'   // rose pink
    };

    /** Selected style: bold rose pink + stronger teal fill */
    const _selectedStyle = {
        fillColor: '#0097a7',
        fillOpacity: 0.42,
        weight: 3,
        color: '#d4456a'
    };

    /* ------------------------------------------------------------------
       _onEachFeature  — per-country interaction wiring
       ------------------------------------------------------------------ */
    function _onEachFeature(feature, layer) {
        const countryId   = feature.id ? feature.id.toUpperCase() : '';
        const countryName = (feature.properties && feature.properties.name) || 'Country';

        // Resolve flag emoji (fallback 🌐)
        let flagEmoji = '🌐';
        if (window.AppState && window.AppState.countries) {
            const found = window.AppState.countries.find(c => c.id === countryId);
            if (found && found.flag) flagEmoji = found.flag;
        }

        // Bind a rich tooltip (cream background set via CSS class)
        layer.bindTooltip(
            `<div class="map-tooltip-content">` +
                `<span class="tooltip-flag">${flagEmoji}</span> ` +
                `<strong>${countryName}</strong>` +
                `<span class="tooltip-click-hint">Click to explore</span>` +
            `</div>`,
            {
                direction: 'top',
                sticky: true,
                className: 'map-country-tooltip',
                offset: [0, -10]
            }
        );

        layer.on({
            mouseover: (e) => {
                const l = e.target;
                if (l !== currentlySelectedLayer) {
                    l.setStyle(_hoverStyle);
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        l.bringToFront();
                    }
                }
                l.openTooltip();
            },

            mouseout: (e) => {
                const l = e.target;
                if (l !== currentlySelectedLayer) {
                    geoJsonLayer.resetStyle(l);
                }
            },

            click: () => {
                // Deselect previous
                if (currentlySelectedLayer) {
                    geoJsonLayer.resetStyle(currentlySelectedLayer);
                }

                // Select new
                currentlySelectedLayer = layer;
                layer.setStyle(_selectedStyle);

                // Fly to bounds
                try {
                    map.flyToBounds(layer.getBounds(), {
                        padding: [80, 80],
                        maxZoom: 5,
                        duration: 1.2
                    });
                } catch (_) { /* geometry edge-case fallback */ }

                // Notify the rest of the app
                if (window.selectCountry) {
                    window.selectCountry(countryId);
                }
            }
        });
    }

    /* ------------------------------------------------------------------
       focusCountry(countryId)  — programmatic pan + highlight
       ------------------------------------------------------------------ */
    function focusCountry(countryId) {
        activateMap();
        if (!map || !geoJsonLayer) return;

        let targetLayer = null;
        geoJsonLayer.eachLayer((layer) => {
            if (layer.feature && layer.feature.id &&
                layer.feature.id.toUpperCase() === countryId.toUpperCase()) {
                targetLayer = layer;
            }
        });

        if (!targetLayer) return;

        // Fly to bounds
        try {
            map.flyToBounds(targetLayer.getBounds(), {
                padding: [80, 80],
                maxZoom: 5,
                duration: 1.2
            });
        } catch (_) { /* fallback */ }

        // Update selection highlight
        if (currentlySelectedLayer) {
            geoJsonLayer.resetStyle(currentlySelectedLayer);
        }
        currentlySelectedLayer = targetLayer;
        targetLayer.setStyle(_selectedStyle);
    }

    /* ------------------------------------------------------------------
       resetSelection()  — clear current highlight
       ------------------------------------------------------------------ */
    function resetSelection() {
        if (currentlySelectedLayer && geoJsonLayer) {
            geoJsonLayer.resetStyle(currentlySelectedLayer);
            currentlySelectedLayer = null;
        }
    }

    /* ------------------------------------------------------------------
       invalidateSize()  — convenience wrapper; ensures map exists first
       ------------------------------------------------------------------ */
    function invalidateSize() {
        activateMap();
    }

    /* ------------------------------------------------------------------
       Public API
       ------------------------------------------------------------------ */
    return {
        init,
        activateMap,
        focusCountry,
        resetSelection,
        invalidateSize
    };
})();

// Attach to window so other modules can reach it
window.MapExplorer = MapExplorer;
