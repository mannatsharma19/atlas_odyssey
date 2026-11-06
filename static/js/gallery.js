/* ==========================================================================
   ATLAS ODYSSEY GLOBAL PHOTO EXPLORER (PINTEREST MASONRY)
   ========================================================================== */

const PhotoExplorer = (() => {
    let allPhotos = [];
    let isDataLoaded = false;
    const gridEl = document.getElementById('masonry-photo-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function init() {
        // Setup filter click listeners
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Set active class
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const filter = e.target.getAttribute('data-filter');
                filterPhotos(filter);
            });
        });
    }

    // Load and compile photos from all 16 countries in the background
    async function loadPhotosData() {
        if (isDataLoaded) return;
        
        try {
            const countries = window.AppState.countries;
            if (!countries.length) return;

            // Fetch a rich representative set across global regions
            const sampleCountries = countries.slice(0, 35);
            const fetchPromises = sampleCountries.map(c => fetch(`/api/countries/${c.id}`).then(r => r.json()));
            const detailedCountries = await Promise.all(fetchPromises);

            allPhotos = [];

            detailedCountries.forEach(country => {
                const cName = country.name;

                // 1. Add Hero Image
                let heroCat = 'nature';
                if (["BRA", "IND", "ITA", "FRA", "THA", "MAR"].includes(country.id)) {
                    heroCat = 'cities';
                }
                allPhotos.push({
                    url: country.hero_image,
                    title: `${cName} Landscape`,
                    country: cName,
                    category: heroCat
                });

                // 2. Add Food images
                country.food.forEach(dish => {
                    allPhotos.push({
                        url: dish.image,
                        title: dish.name,
                        country: cName,
                        category: 'food'
                    });
                });

                // 3. Add Traditional Clothing
                allPhotos.push({
                    url: country.clothing.image,
                    title: `Traditional ${country.clothing.title} Garb`,
                    country: cName,
                    category: 'festivals' // Grouped clothing in festivals/culture filter
                });

                // 4. Add Festivals
                country.festivals.forEach(fest => {
                    if (fest.image) {
                        allPhotos.push({
                            url: fest.image,
                            title: fest.name,
                            country: cName,
                            category: 'festivals'
                        });
                    }
                });

                // 5. Add Famous Places
                country.famous_places.forEach(place => {
                    let placeCat = 'cities';
                    if (["Mount Fuji", "Iguazu Falls", "The Amazon Rainforest", "Great Barrier Reef", "Table Mountain", "Milford Sound"].includes(place.name)) {
                        placeCat = 'nature';
                    }
                    allPhotos.push({
                        url: place.image,
                        title: place.name,
                        country: cName,
                        category: placeCat
                    });
                });

                // 6. Add remaining Gallery Photos
                country.gallery.forEach((url, idx) => {
                    // Distribute gallery categories
                    let cat = 'nature';
                    if (idx % 3 === 0) cat = 'cities';
                    if (idx % 3 === 1) cat = 'nature';
                    if (idx % 3 === 2) cat = 'festivals';

                    allPhotos.push({
                        url: url,
                        title: `${cName} Scenic Snapshot`,
                        country: cName,
                        category: cat
                    });
                });
            });

            // Filter out duplicate or broken URLs
            allPhotos = allPhotos.filter((item, index, self) => 
                self.findIndex(t => t.url === item.url) === index && item.url
            );

            // Shuffle photos for a more organic gallery wall experience
            allPhotos.sort(() => Math.random() - 0.5);
            isDataLoaded = true;
        } catch (e) {
            console.error("Error loading photos database:", e);
        }
    }

    async function renderGrid() {
        if (!isDataLoaded) {
            // Show a temporary inline loader inside the grid
            gridEl.innerHTML = '<div class="compare-placeholder"><i class="fa-solid fa-spinner fa-spin"></i><p>Compiling global snapshot gallery...</p></div>';
            await loadPhotosData();
        }
        
        // Default filter is 'all'
        filterPhotos('all');
    }

    function filterPhotos(category) {
        gridEl.innerHTML = '';

        const filtered = category === 'all' 
            ? allPhotos 
            : allPhotos.filter(p => p.category === category);

        if (filtered.length === 0) {
            gridEl.innerHTML = '<div class="compare-placeholder"><p>No photos found in this category.</p></div>';
            return;
        }

        filtered.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <span class="grid-item-category">${photo.category}</span>
                <img src="${photo.url}" alt="${photo.title}" loading="lazy">
                <div class="grid-item-info">
                    <div class="grid-item-title">${photo.title}</div>
                    <div class="grid-item-country">${photo.country}</div>
                </div>
            `;

            // Setup Zoom Lightbox on Click
            item.addEventListener('click', () => {
                if (window.openLightbox) {
                    window.openLightbox(photo.url, `${photo.title} — ${photo.country}`);
                }
            });

            gridEl.appendChild(item);
        });

        // Stagger fade-in animation using GSAP for premium feel
        gsap.fromTo('#masonry-photo-grid .grid-item', 
            { opacity: 0, scale: 0.95, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out' }
        );
    }

    return {
        init,
        renderGrid
    };
})();

// Attach to window
window.PhotoExplorer = PhotoExplorer;
