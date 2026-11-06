/* ==========================================================================
   ATLAS ODYSSEY CINEMATIC DETAIL PANEL (DYNAMIC DATA BINDING)
   Theme: Warm Beige, Aqua Blue, and Pink Accents
   ========================================================================== */

const DetailPanel = (() => {
    let swiperInstance = null;
    const panelEl = document.getElementById('detail-panel');
    const closeBtn = document.getElementById('btn-close-panel');
    const scrollContainer = document.getElementById('panel-content-scroll');
    const countryTabsBar = document.getElementById('panel-country-tabs-bar');

    function init() {
        if (!panelEl) return;

        // Close Button handler
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        
        // Setup internal tab switching listeners
        const tabBtns = document.querySelectorAll('.panel-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTabId = e.currentTarget.getAttribute('data-tab');
                switchTab(targetTabId, e.currentTarget);
            });
        });
    }

    // Switch Panel Tabs
    function switchTab(tabId, activeBtn) {
        if (!tabId) return;

        // Toggle Active state of buttons
        document.querySelectorAll('.panel-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');

        // Toggle Active state of panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');
        
        // Re-initialize swiper if switching to heritage/gallery tab
        if (tabId === 'tab-heritage' && swiperInstance) {
            setTimeout(() => {
                swiperInstance.update();
            }, 100);
        }
    }

    // Render horizontal country tabs
    function renderCountryTabs() {
        if (!countryTabsBar) return;
        countryTabsBar.innerHTML = '';
        
        const openCountries = window.AppState ? window.AppState.openCountries : [];
        const currentCountry = window.AppState ? window.AppState.currentCountry : null;
        
        openCountries.forEach(c => {
            const tab = document.createElement('div');
            tab.className = 'country-tab';
            if (currentCountry && c.id === currentCountry.id) {
                tab.classList.add('active');
                setTimeout(() => {
                    tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }, 50);
            }
            tab.setAttribute('data-id', c.id);
            
            const flag = c.flag || '🌐';
            
            tab.innerHTML = `
                <span>${flag} ${c.name}</span>
                <button class="btn-close-tab" title="Close Tab"><i class="fa-solid fa-xmark"></i></button>
            `;
            
            tab.addEventListener('click', () => {
                if (window.selectCountry) window.selectCountry(c.id);
            });
            
            const closeTabBtn = tab.querySelector('.btn-close-tab');
            if (closeTabBtn) {
                closeTabBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.closeCountry) window.closeCountry(c.id);
                });
            }
            
            countryTabsBar.appendChild(tab);
        });
    }

    // Open Panel with Country Data
    function open(country) {
        if (!country || !panelEl) return;

        // Slide panel in
        panelEl.classList.add('open');
        if (scrollContainer) scrollContainer.scrollTop = 0;
        
        renderCountryTabs();
        
        // 1. Hero Section
        const heroBg = document.getElementById('panel-hero-bg');
        if (heroBg && country.hero_image) {
            heroBg.style.backgroundImage = `url('${country.hero_image}')`;
        }
        
        const continentEl = document.getElementById('panel-country-continent');
        if (continentEl) continentEl.textContent = country.continent || 'Global';

        const nameEl = document.getElementById('panel-country-name');
        if (nameEl) nameEl.textContent = `${country.flag || ''} ${country.name}`;

        const capitalSubEl = document.getElementById('panel-country-capital-sub');
        if (capitalSubEl) capitalSubEl.textContent = `Capital: ${country.capital}`;

        // Reset to first tab
        const firstTabBtn = document.querySelector('.panel-tab-btn[data-tab="tab-identity"]');
        if (firstTabBtn) switchTab('tab-identity', firstTabBtn);

        // 2. Populate Identity Tab with the 10 requested fields
        const idCapital = document.getElementById('id-capital');
        if (idCapital) idCapital.textContent = country.capital || '-';

        const idPop = document.getElementById('id-population');
        if (idPop) idPop.textContent = country.population || '-';

        const idCurr = document.getElementById('id-currency');
        if (idCurr) idCurr.textContent = country.currency || '-';

        const idLang = document.getElementById('id-languages');
        if (idLang) idLang.textContent = Array.isArray(country.languages) ? country.languages.join(', ') : (country.languages || '-');

        // Popular cities in panel
        const popCitiesList = document.getElementById('panel-popular-cities-list');
        if (popCitiesList) {
            popCitiesList.innerHTML = '';
            const cities = country.popular_cities || [];
            cities.forEach(city => {
                const tag = document.createElement('span');
                tag.className = 'city-tag';
                tag.textContent = city;
                popCitiesList.appendChild(tag);
            });
        }

        // Famous For in panel
        const famousForText = document.getElementById('panel-famous-for-text');
        if (famousForText) famousForText.textContent = country.famous_for || '-';

        // Tourists in panel
        const touristsText = document.getElementById('panel-tourists-text');
        if (touristsText) touristsText.textContent = country.tourists || '-';

        // Must Know in panel
        const mustKnowText = document.getElementById('panel-must-know-text');
        if (mustKnowText) mustKnowText.textContent = country.must_know || '-';

        // Fun Fact in panel
        const funFactText = document.getElementById('panel-fun-fact-text');
        if (funFactText) funFactText.textContent = country.fun_fact || '-';

        // Geography Card
        if (country.geography) {
            const geoM = document.getElementById('geo-mountains');
            if (geoM) geoM.textContent = country.geography.mountains || 'Highlands & scenic peaks';

            const geoR = document.getElementById('geo-rivers');
            if (geoR) geoR.textContent = country.geography.rivers || 'Coastal waterways and rivers';

            const geoC = document.getElementById('geo-climate');
            if (geoC) geoC.textContent = country.geography.climate || 'Temperate with regional variations';
        }

        // 3. Populate Culture Tab
        const cultureContainer = document.getElementById('culture-cards-list');
        if (cultureContainer && country.culture) {
            cultureContainer.innerHTML = '';
            country.culture.forEach(cult => {
                const card = document.createElement('div');
                card.className = 'culture-card';
                card.innerHTML = `
                    <div class="culture-card-icon">${cult.icon || '✨'}</div>
                    <div class="culture-card-text">
                        <h4>${cult.title}</h4>
                        <p>${cult.desc}</p>
                    </div>
                `;
                cultureContainer.appendChild(card);
            });
        }

        // 4. Populate Food Tab
        const foodContainer = document.getElementById('food-cards-list');
        if (foodContainer && country.food) {
            foodContainer.innerHTML = '';
            country.food.forEach(dish => {
                const card = document.createElement('div');
                card.className = 'food-card';
                card.innerHTML = `
                    <img class="food-card-img" src="${dish.image}" alt="${dish.name}" loading="lazy">
                    <div class="food-card-body">
                        <h4>${dish.name}</h4>
                        <p>${dish.desc}</p>
                    </div>
                `;
                const img = card.querySelector('img');
                if (img) {
                    img.addEventListener('click', () => {
                        if (window.openLightbox) window.openLightbox(dish.image, `${dish.name} - Signature Cuisine of ${country.name}`);
                    });
                }
                foodContainer.appendChild(card);
            });
        }

        // 5. Populate Heritage Tab
        if (country.clothing) {
            const clothing = country.clothing;
            const cImg = document.getElementById('clothing-img');
            const cTitle = document.getElementById('clothing-title');
            const cDesc = document.getElementById('clothing-desc');

            if (cImg) {
                cImg.src = clothing.image || '';
                cImg.onclick = () => {
                    if (window.openLightbox) window.openLightbox(clothing.image, `${clothing.title} - Traditional Attire of ${country.name}`);
                };
            }
            if (cTitle) cTitle.textContent = clothing.title || 'Traditional Garments';
            if (cDesc) cDesc.textContent = clothing.desc || 'Centuries-old folk dress worn with pride.';
        }

        // Festivals list
        const festivalContainer = document.getElementById('festivals-list-container');
        if (festivalContainer && country.festivals) {
            festivalContainer.innerHTML = '';
            country.festivals.forEach(fest => {
                const item = document.createElement('div');
                item.className = 'festival-item';
                item.innerHTML = `
                    <div class="festival-header">
                        <span class="festival-name">${fest.name}</span>
                        <span class="festival-date">${fest.date || 'Annual Celebration'}</span>
                    </div>
                    <p class="festival-desc">${fest.desc}</p>
                `;
                festivalContainer.appendChild(item);
            });
        }

        // Famous Places list
        const placesContainer = document.getElementById('famous-places-container');
        if (placesContainer && country.famous_places) {
            placesContainer.innerHTML = '';
            country.famous_places.forEach(place => {
                const item = document.createElement('div');
                item.className = 'place-item';
                item.innerHTML = `
                    <img class="place-item-img" src="${place.image}" alt="${place.name}" loading="lazy">
                    <div class="place-item-body">
                        <h4>${place.name}</h4>
                        <p>${place.desc}</p>
                    </div>
                `;
                const img = item.querySelector('img');
                if (img) {
                    img.addEventListener('click', () => {
                        if (window.openLightbox) window.openLightbox(place.image, `${place.name} in ${country.name}`);
                    });
                }
                placesContainer.appendChild(item);
            });
        }

        // 6. Photo Gallery Swiper Setup
        const galleryWrapper = document.getElementById('panel-gallery-wrapper');
        if (galleryWrapper && country.gallery) {
            galleryWrapper.innerHTML = '';
            country.gallery.forEach(imgUrl => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.innerHTML = `<img src="${imgUrl}" alt="Gallery image" loading="lazy">`;
                slide.addEventListener('click', () => {
                    if (window.openLightbox) window.openLightbox(imgUrl, `Scenic View - ${country.name}`);
                });
                galleryWrapper.appendChild(slide);
            });

            if (swiperInstance) {
                swiperInstance.destroy(true, true);
            }
            
            swiperInstance = new Swiper('.mySwiper', {
                loop: true,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                observer: true,
                observeParents: true
            });
        }

        // 7. Timeline Tab
        const timelineFlow = document.getElementById('timeline-flow-list');
        if (timelineFlow && country.timeline) {
            timelineFlow.innerHTML = '';
            country.timeline.forEach(node => {
                const item = document.createElement('div');
                item.className = 'timeline-node';
                item.innerHTML = `
                    <div class="timeline-era">${node.era}</div>
                    <p class="timeline-desc">${node.event}</p>
                `;
                timelineFlow.appendChild(item);
            });
        }
    }

    // Close Panel
    function close() {
        if (!panelEl) return;
        panelEl.classList.remove('open');
        
        document.querySelectorAll('.country-item-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (window.AppState) {
            window.AppState.currentCountry = null;
        }
        
        renderCountryTabs();
    }

    return {
        init,
        open,
        close,
        renderCountryTabs
    };
})();

// Initialize panel listeners
document.addEventListener('DOMContentLoaded', () => {
    DetailPanel.init();
});

window.DetailPanel = DetailPanel;
