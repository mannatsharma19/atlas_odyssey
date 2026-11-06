/* ==========================================================================
   ATLAS ODYSSEY CORE APP LOGIC & ORCHESTRATOR
   Themes: Warm Beige, Aqua Blue, and Pink Accents
   ========================================================================== */

// ---------------------------------------------------------------------------
// Global App State
// ---------------------------------------------------------------------------
const AppState = {
    countries: [],         // Holds the list of 180 countries (metadata)
    currentCountry: null,  // Currently selected country detailed object
    openCountries: [],     // Holds details of all open country tabs
    activeView: 'landing', // 'landing' | 'map' | 'photos'
    audioContext: null,
    audioGainNode: null,
    audioOscillators: [],
    isAudioPlaying: false
};

// ---------------------------------------------------------------------------
// DOM Elements — cached once on load
// ---------------------------------------------------------------------------
const elements = {
    loader: document.getElementById('screen-loader'),
    viewLanding: document.getElementById('view-landing'),
    viewExplorer: document.getElementById('view-explorer'),
    viewPhotos: document.getElementById('view-photos'),
    btnBeginExplore: document.getElementById('btn-begin-explore'),
    btnQuickRandom: document.getElementById('btn-quick-random'),
    btnNavMap: document.getElementById('btn-nav-map'),
    btnNavPhotos: document.getElementById('btn-nav-photos'),
    btnNavMap2: document.getElementById('btn-nav-map-2'),
    btnNavPhotos2: document.getElementById('btn-nav-photos-2'),
    logoHome: document.getElementById('logo-home'),
    logoHome2: document.getElementById('logo-home-2'),
    btnToggleAudio: document.getElementById('btn-toggle-audio'),
    btnOpenCompare: document.getElementById('btn-open-compare'),
    btnOpenCompare2: document.getElementById('btn-open-compare-2'),
    btnCloseCompare: document.getElementById('btn-close-compare'),
    compareModal: document.getElementById('compare-modal'),
    sidebarCountryList: document.getElementById('sidebar-country-list'),
    inputSearch: document.getElementById('input-country-search'),
    lightbox: document.getElementById('image-lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxClose: document.querySelector('.lightbox-close'),

    // Country Spotlight Box
    spotlightBox: document.getElementById('country-spotlight-box'),
    btnCloseSpotlight: document.getElementById('btn-close-spotlight'),
    btnBoxDeepDive: document.getElementById('btn-box-deep-dive')
};

// ---------------------------------------------------------------------------
// Initialize App
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch country index from API
    await fetchCountriesData();

    // 2. Initialize Sub-modules
    if (window.MapExplorer) MapExplorer.init();
    if (window.CompareTool) CompareTool.init();
    if (window.PhotoExplorer) PhotoExplorer.init();

    // 3. Setup Navigation Event Listeners
    setupNavigation();

    // 4. Hide screen loader with fade out
    setTimeout(() => {
        if (elements.loader) {
            elements.loader.classList.add('fade-out');
            elements.loader.classList.add('hidden');
        }
    }, 600);
});

// ---------------------------------------------------------------------------
// Fetch Countries Index (All 180 Countries)
// ---------------------------------------------------------------------------
async function fetchCountriesData() {
    try {
        const response = await fetch('/api/countries');
        if (response.ok) {
            AppState.countries = await response.json();
            populateCountryList(AppState.countries);

            const badge = document.getElementById('country-count-badge');
            if (badge) badge.textContent = AppState.countries.length;
        } else {
            console.error('Failed to fetch countries index', response.status);
        }
    } catch (e) {
        console.error('Error fetching countries list:', e);
    }
}

// ---------------------------------------------------------------------------
// Populate Country Quick-select Sidebar
// ---------------------------------------------------------------------------
function populateCountryList(countries) {
    if (!elements.sidebarCountryList) return;
    elements.sidebarCountryList.innerHTML = '';

    countries.forEach(country => {
        const li = document.createElement('li');
        li.className = 'country-list-item';
        li.innerHTML = `
            <button class="country-item-btn" id="sidebar-country-${country.id.toLowerCase()}" data-id="${country.id}" title="${country.name} (${country.capital || ''})">
                <span class="country-flag-icon country-item-flag">${country.flag || '🌐'}</span>
                <div class="country-item-info">
                    <span class="country-name-text country-item-name">${country.name}</span>
                    <span class="country-item-region">${country.continent || country.region || ''}</span>
                </div>
                <i class="fa-solid fa-chevron-right country-list-arrow"></i>
            </button>
        `;
        elements.sidebarCountryList.appendChild(li);

        // Add click listener
        li.querySelector('button').addEventListener('click', () => {
            selectCountry(country.id);
        });
    });
}

// ==========================================================================
// GLOBAL COUNTRY SELECTION & SPOTLIGHT BOX DISPLAY
// Displays Capital, Currency, Population, Popular Cities, Languages Spoken,
// Famous For, Tourists, Flags, Must Know, Fun Fact
// ==========================================================================
async function selectCountry(countryId) {
    if (!countryId) return;

    // Highlight list item in sidebar
    document.querySelectorAll('.country-item-btn').forEach(btn => {
        if (btn.getAttribute('data-id') === countryId) {
            btn.classList.add('selected');
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            btn.classList.remove('selected');
        }
    });

    // Check if already loaded in memory
    let countryDetails = AppState.openCountries.find(c => c.id === countryId);

    if (!countryDetails) {
        try {
            const res = await fetch(`/api/countries/${countryId}`);
            if (res.ok) {
                countryDetails = await res.json();
                AppState.openCountries.push(countryDetails);
            } else {
                console.error(`Country ${countryId} not found`);
                return;
            }
        } catch (e) {
            console.error(`Error loading country details for ${countryId}:`, e);
            return;
        }
    }

    AppState.currentCountry = countryDetails;

    // 1. Focus Leaflet Map on the country
    if (window.MapExplorer) {
        window.MapExplorer.focusCountry(countryId);
    }

    // 2. Render and show the Country Spotlight Box
    showCountrySpotlight(countryDetails);

    // 3. Keep DetailPanel data synchronized in background
    if (window.DetailPanel) {
        window.DetailPanel.renderCountryTabs();
    }
}

// ---------------------------------------------------------------------------
// Populate and Display Country Spotlight Box (The 10 Required Items)
// ---------------------------------------------------------------------------
function showCountrySpotlight(country) {
    if (!elements.spotlightBox) return;

    // Header: Flags, Name, Continent, Capital Sub
    const flagImg = document.getElementById('box-flag-img');
    const flagEmoji = document.getElementById('box-flag-emoji');
    const continentPill = document.getElementById('box-continent');
    const countryName = document.getElementById('box-country-name');
    const capitalSub = document.getElementById('box-capital-sub');

    if (flagImg) {
        flagImg.src = country.flag_svg || 'https://flagcdn.com/w320/un.png';
        flagImg.alt = `${country.name} Flag`;
    }
    if (flagEmoji) flagEmoji.textContent = country.flag || '🌐';
    if (continentPill) continentPill.textContent = country.continent || 'Global';
    if (countryName) countryName.textContent = country.name;
    if (capitalSub) capitalSub.textContent = `Capital: ${country.capital}`;

    // 1. Capital
    const elCapital = document.getElementById('box-capital');
    if (elCapital) elCapital.textContent = country.capital || '-';

    // 2. Currency
    const elCurrency = document.getElementById('box-currency');
    if (elCurrency) elCurrency.textContent = country.currency || '-';

    // 3. Population
    const elPop = document.getElementById('box-population');
    if (elPop) elPop.textContent = country.population || '-';

    // 4. Languages Spoken
    const elLang = document.getElementById('box-languages');
    if (elLang) {
        elLang.textContent = Array.isArray(country.languages)
            ? country.languages.join(', ')
            : (country.languages || '-');
    }

    // 5. Popular Cities
    const elCities = document.getElementById('box-popular-cities');
    if (elCities) {
        elCities.innerHTML = '';
        const cities = country.popular_cities || [];
        if (cities.length === 0) {
            elCities.innerHTML = '<span class="city-tag">Major regional centres</span>';
        } else {
            cities.forEach(city => {
                const tag = document.createElement('span');
                tag.className = 'city-tag';
                tag.textContent = city;
                elCities.appendChild(tag);
            });
        }
    }

    // 6. Famous For
    const elFamous = document.getElementById('box-famous-for');
    if (elFamous) elFamous.textContent = country.famous_for || '-';

    // 7. Tourists
    const elTourists = document.getElementById('box-tourists');
    if (elTourists) elTourists.textContent = country.tourists || '-';

    // 8. Must Know
    const elMustKnow = document.getElementById('box-must-know');
    if (elMustKnow) elMustKnow.textContent = country.must_know || '-';

    // 9. Fun Fact
    const elFunFact = document.getElementById('box-fun-fact');
    if (elFunFact) elFunFact.textContent = country.fun_fact || '-';

    // Show box with entrance transition
    elements.spotlightBox.classList.remove('hidden');
    elements.spotlightBox.classList.add('visible');

    // Scroll box body back to top
    const scrollBody = elements.spotlightBox.querySelector('.box-body-scroll');
    if (scrollBody) scrollBody.scrollTop = 0;
}

// ---------------------------------------------------------------------------
// Hide Country Spotlight Box
// ---------------------------------------------------------------------------
function hideCountrySpotlight() {
    if (!elements.spotlightBox) return;
    elements.spotlightBox.classList.remove('visible');
    setTimeout(() => {
        elements.spotlightBox.classList.add('hidden');
    }, 250);

    if (window.MapExplorer) {
        window.MapExplorer.resetSelection();
    }
}

// ---------------------------------------------------------------------------
// Close Country Tab
// ---------------------------------------------------------------------------
function closeCountry(countryId) {
    const idx = AppState.openCountries.findIndex(c => c.id === countryId);
    if (idx === -1) return;

    AppState.openCountries.splice(idx, 1);

    if (AppState.currentCountry && AppState.currentCountry.id === countryId) {
        if (AppState.openCountries.length > 0) {
            const nextCountry = AppState.openCountries[Math.min(idx, AppState.openCountries.length - 1)];
            selectCountry(nextCountry.id);
        } else {
            hideCountrySpotlight();
            if (window.DetailPanel) window.DetailPanel.close();
        }
    } else {
        if (window.DetailPanel) window.DetailPanel.renderCountryTabs();
    }
}

// ==========================================================================
// NAVIGATION & VIEW SWITCHING
// ==========================================================================
function setupNavigation() {
    // ── Landing page buttons ──────────────────────────────────────────
    if (elements.btnBeginExplore) {
        elements.btnBeginExplore.addEventListener('click', () => {
            switchView('map');
            initAmbientSynth();
        });
    }

    if (elements.btnQuickRandom) {
        elements.btnQuickRandom.addEventListener('click', () => {
            switchView('map');
            initAmbientSynth();
            if (AppState.countries.length > 0) {
                const randomCountry = AppState.countries[Math.floor(Math.random() * AppState.countries.length)];
                setTimeout(() => {
                    selectCountry(randomCountry.id);
                }, 400);
            }
        });
    }

    // ── Cultural Chips on Landing page ────────────────────────────────
    document.querySelectorAll('.culture-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const countryId = chip.getAttribute('data-id');
            switchView('map');
            initAmbientSynth();
            setTimeout(() => {
                selectCountry(countryId);
            }, 300);
        });
    });

    // ── Showcase Cards on Landing page ────────────────────────────────
    document.querySelectorAll('.showcase-card').forEach(card => {
        card.addEventListener('click', () => {
            const countryId = card.getAttribute('data-id');
            switchView('map');
            initAmbientSynth();
            setTimeout(() => {
                selectCountry(countryId);
            }, 300);
        });
    });

    // ── Spotlight Box Controls ────────────────────────────────────────
    if (elements.btnCloseSpotlight) {
        elements.btnCloseSpotlight.addEventListener('click', hideCountrySpotlight);
    }

    if (elements.btnBoxDeepDive) {
        elements.btnBoxDeepDive.addEventListener('click', () => {
            if (AppState.currentCountry && window.DetailPanel) {
                window.DetailPanel.open(AppState.currentCountry);
            }
        });
    }

    // ── Keyboard: ESC closes overlays ─────────────────────────────────
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideCountrySpotlight();
            if (window.DetailPanel) window.DetailPanel.close();
            toggleCompareModal(false);
            if (elements.lightbox) elements.lightbox.classList.remove('open');
        }
    });

    // ── Header Logos → Landing ────────────────────────────────────────
    if (elements.logoHome) elements.logoHome.addEventListener('click', () => switchView('landing'));
    if (elements.logoHome2) elements.logoHome2.addEventListener('click', () => switchView('landing'));

    // ── Nav: Map explorer ─────────────────────────────────────────────
    if (elements.btnNavMap) elements.btnNavMap.addEventListener('click', () => switchView('map'));
    if (elements.btnNavMap2) elements.btnNavMap2.addEventListener('click', () => switchView('map'));

    // ── Nav: Photo explorer ───────────────────────────────────────────
    if (elements.btnNavPhotos) elements.btnNavPhotos.addEventListener('click', () => switchView('photos'));
    if (elements.btnNavPhotos2) elements.btnNavPhotos2.addEventListener('click', () => switchView('photos'));

    // ── Real-time Search ──────────────────────────────────────────────
    // Filters by country name, capital, continent, and popular cities
    if (elements.inputSearch) {
        elements.inputSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = AppState.countries.filter(c => {
                if (c.name && c.name.toLowerCase().includes(query)) return true;
                if (c.capital && c.capital.toLowerCase().includes(query)) return true;
                if (c.continent && c.continent.toLowerCase().includes(query)) return true;
                if (c.popular_cities && Array.isArray(c.popular_cities)) {
                    if (c.popular_cities.some(city => city.toLowerCase().includes(query))) return true;
                }
                return false;
            });
            populateCountryList(filtered);
            const badge = document.getElementById('country-count-badge');
            if (badge) badge.textContent = filtered.length;
        });
    }

    // ── Compare Modal Controls ────────────────────────────────────────
    if (elements.btnOpenCompare) elements.btnOpenCompare.addEventListener('click', () => toggleCompareModal(true));
    if (elements.btnOpenCompare2) elements.btnOpenCompare2.addEventListener('click', () => toggleCompareModal(true));
    if (elements.btnCloseCompare) elements.btnCloseCompare.addEventListener('click', () => toggleCompareModal(false));

    // ── Audio synthesizer control ─────────────────────────────────────
    if (elements.btnToggleAudio) elements.btnToggleAudio.addEventListener('click', toggleAudio);

    // ── Lightbox Controls ─────────────────────────────────────────────
    if (elements.lightboxClose) {
        elements.lightboxClose.addEventListener('click', () => {
            if (elements.lightbox) elements.lightbox.classList.remove('open');
        });
    }
    if (elements.lightbox) {
        elements.lightbox.addEventListener('click', (e) => {
            if (e.target === elements.lightbox) {
                elements.lightbox.classList.remove('open');
            }
        });
    }
}

// ---------------------------------------------------------------------------
// switchView — CRITICAL: the Leaflet map must be initialized AFTER the
// explorer view becomes visible (has non-zero dimensions). CSS transitions
// using opacity/visibility mean the container starts with zero logical size.
// We set the .active class FIRST, then use requestAnimationFrame so the
// browser has reflowed, THEN tell MapExplorer to activate/init the map.
// ---------------------------------------------------------------------------
function switchView(viewName) {
    AppState.activeView = viewName;

    // Deactivate all views
    elements.viewLanding.classList.remove('active');
    elements.viewExplorer.classList.remove('active');
    elements.viewPhotos.classList.remove('active');

    if (viewName === 'landing') {
        elements.viewLanding.classList.add('active');

    } else if (viewName === 'map') {
        // STEP 1: Make the explorer view visible so the map container gets
        //         real dimensions from the layout engine.
        elements.viewExplorer.classList.add('active');

        // STEP 2: Wait for the browser to reflow so the CSS transition
        //         starts and the div has measurable width/height, THEN
        //         initialise or invalidate the Leaflet map.
        requestAnimationFrame(() => {
            if (window.MapExplorer) {
                // activateMap (preferred) or invalidateSize both call
                // ensureMapReady internally, which creates the Leaflet
                // instance only once.
                if (typeof MapExplorer.activateMap === 'function') {
                    MapExplorer.activateMap();
                } else {
                    MapExplorer.invalidateSize();
                }
            }
        });

    } else if (viewName === 'photos') {
        elements.viewPhotos.classList.add('active');
        if (window.PhotoExplorer) PhotoExplorer.renderGrid();
    }
}

// ---------------------------------------------------------------------------
// Compare Modal
// ---------------------------------------------------------------------------
function toggleCompareModal(show) {
    if (show) {
        elements.compareModal.classList.add('open');
        if (window.CompareTool) window.CompareTool.populateDropdowns();
    } else {
        elements.compareModal.classList.remove('open');
    }
}

// ---------------------------------------------------------------------------
// Public Photo Lightbox
// ---------------------------------------------------------------------------
function openLightbox(imageUrl, caption) {
    if (!elements.lightbox || !elements.lightboxImg) return;
    elements.lightboxImg.src = imageUrl;
    if (elements.lightboxCaption) elements.lightboxCaption.textContent = caption;
    elements.lightbox.classList.add('open');
}

// ==========================================================================
// WEB AUDIO API — CINEMATIC AMBIENT SYNTHESIZER
// Warm drone pad using detuned triangles + sines through a low-pass filter
// with slow LFO modulation for an evolving, organic texture.
// ==========================================================================
function initAmbientSynth() {
    if (AppState.audioContext) return;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        AppState.audioContext = new AudioContextClass();

        AppState.audioGainNode = AppState.audioContext.createGain();
        AppState.audioGainNode.gain.setValueAtTime(0, AppState.audioContext.currentTime);
        AppState.audioGainNode.connect(AppState.audioContext.destination);

        // Warm drone frequencies (D♭2 – D4 harmonic spread)
        const chordFrequencies = [77.78, 116.54, 155.56, 196.00, 233.08, 293.66];

        // Low-pass filter for warmth
        const filter = AppState.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, AppState.audioContext.currentTime);
        filter.Q.setValueAtTime(1, AppState.audioContext.currentTime);
        filter.connect(AppState.audioGainNode);

        chordFrequencies.forEach((freq, idx) => {
            const osc = AppState.audioContext.createOscillator();
            osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, AppState.audioContext.currentTime);

            // Slow LFO for gentle pitch drift
            const lfo = AppState.audioContext.createOscillator();
            lfo.frequency.value = 0.05 + (idx * 0.02);

            const lfoGain = AppState.audioContext.createGain();
            lfoGain.gain.value = 1.5;

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const voiceGain = AppState.audioContext.createGain();
            voiceGain.gain.setValueAtTime(0.04 / chordFrequencies.length, AppState.audioContext.currentTime);

            osc.connect(voiceGain);
            voiceGain.connect(filter);

            osc.start();
            lfo.start();

            AppState.audioOscillators.push(osc);
            AppState.audioOscillators.push(lfo);
        });

        unmuteAmbientSynth();
    } catch (e) {
        console.warn("Web Audio API not supported:", e);
    }
}

function muteAmbientSynth() {
    if (!AppState.audioGainNode) return;
    AppState.audioGainNode.gain.linearRampToValueAtTime(0, AppState.audioContext.currentTime + 1.5);
    AppState.isAudioPlaying = false;
    if (elements.btnToggleAudio) elements.btnToggleAudio.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
}

function unmuteAmbientSynth() {
    if (!AppState.audioGainNode) return;
    if (AppState.audioContext.state === 'suspended') {
        AppState.audioContext.resume();
    }
    AppState.audioGainNode.gain.linearRampToValueAtTime(0.25, AppState.audioContext.currentTime + 2.0);
    AppState.isAudioPlaying = true;
    if (elements.btnToggleAudio) elements.btnToggleAudio.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
}

function toggleAudio() {
    if (!AppState.audioContext) {
        initAmbientSynth();
        return;
    }
    if (AppState.isAudioPlaying) {
        muteAmbientSynth();
    } else {
        unmuteAmbientSynth();
    }
}

// ---------------------------------------------------------------------------
// Make globally accessible
// ---------------------------------------------------------------------------
window.AppState = AppState;
window.selectCountry = selectCountry;
window.openLightbox = openLightbox;
window.closeCountry = closeCountry;
window.openLightbox = openLightbox;
