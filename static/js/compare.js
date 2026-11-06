/* ==========================================================================
   ATLAS ODYSSEY COUNTRY COMPARE SCALE TOOL
   ========================================================================== */

const CompareTool = (() => {
    const selectA = document.getElementById('country-select-1');
    const selectB = document.getElementById('country-select-2');
    const resultsContainer = document.getElementById('comparison-results');
    const placeholder = document.getElementById('compare-placeholder');

    function init() {
        selectA.addEventListener('change', runComparison);
        selectB.addEventListener('change', runComparison);
    }

    // Populate drop downs with the available countries index list
    function populateDropdowns() {
        if (!window.AppState || !window.AppState.countries.length) return;
        
        // Save current selections
        const valA = selectA.value;
        const valB = selectB.value;

        // Clear existing options
        selectA.innerHTML = '<option value="">Choose Country A...</option>';
        selectB.innerHTML = '<option value="">Choose Country B...</option>';

        window.AppState.countries.forEach(country => {
            const optA = document.createElement('option');
            optA.value = country.id;
            optA.textContent = `${country.flag} ${country.name}`;
            selectA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = country.id;
            optB.textContent = `${country.flag} ${country.name}`;
            selectB.appendChild(optB);
        });

        // Restore selections
        selectA.value = valA;
        selectB.value = valB;
    }

    // Parse statistical strings into numbers
    function parseValue(valueStr, type) {
        if (!valueStr) return 0;
        
        // Strip out spaces, commas, dollar signs, percent signs, and unit words
        let clean = valueStr.toString().replace(/[\$,\s]/g, '').toLowerCase();
        
        if (type === 'area') {
            clean = clean.replace('km²', '');
        } else if (type === 'density') {
            clean = clean.replace('people/km²', '');
        }
        
        let multiplier = 1;
        if (clean.includes('million')) {
            multiplier = 1000000;
            clean = clean.replace('million', '');
        } else if (clean.includes('billion')) {
            multiplier = 1000000000;
            clean = clean.replace('billion', '');
        } else if (clean.includes('trillion')) {
            multiplier = 1000000000000;
            clean = clean.replace('trillion', '');
        } else if (clean.includes('thousand')) {
            multiplier = 1000;
            clean = clean.replace('thousand', '');
        }
        
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed * multiplier;
    }

    async function runComparison() {
        const idA = selectA.value;
        const idB = selectB.value;

        if (!idA || !idB) {
            resultsContainer.classList.add('hide');
            placeholder.classList.remove('hide');
            return;
        }

        placeholder.classList.add('hide');
        resultsContainer.classList.remove('hide');

        try {
            // Fetch detailed profiles concurrently
            const [resA, resB] = await Promise.all([
                fetch(`/api/countries/${idA}`),
                fetch(`/api/countries/${idB}`)
            ]);

            if (resA.ok && resB.ok) {
                const dataA = await resA.json();
                const dataB = await resB.json();

                renderComparisonStats(dataA, dataB);
            }
        } catch (e) {
            console.error("Comparison load error:", e);
        }
    }

    function renderComparisonStats(countryA, countryB) {
        // Display Text values directly
        document.getElementById('val-area-a').textContent = countryA.area;
        document.getElementById('val-area-b').textContent = countryB.area;

        document.getElementById('val-pop-a').textContent = countryA.population;
        document.getElementById('val-pop-b').textContent = countryB.population;

        document.getElementById('val-gdp-a').textContent = countryA.gdp;
        document.getElementById('val-gdp-b').textContent = countryB.gdp;

        document.getElementById('val-lang-a').textContent = countryA.languages_count;
        document.getElementById('val-lang-b').textContent = countryB.languages_count;

        document.getElementById('val-density-a').textContent = countryA.density;
        document.getElementById('val-density-b').textContent = countryB.density;

        // Parse to numeric stats for bar proportions
        const areaA = parseValue(countryA.area, 'area');
        const areaB = parseValue(countryB.area, 'area');

        const popA = parseValue(countryA.population, 'pop');
        const popB = parseValue(countryB.population, 'pop');

        const gdpA = parseValue(countryA.gdp, 'gdp');
        const gdpB = parseValue(countryB.gdp, 'gdp');

        const langA = countryA.languages_count || 1;
        const langB = countryB.languages_count || 1;

        const densityA = parseValue(countryA.density, 'density');
        const densityB = parseValue(countryB.density, 'density');

        // Render bar animations using GSAP
        animateSplitBar('area', areaA, areaB);
        animateSplitBar('pop', popA, popB);
        animateSplitBar('gdp', gdpA, gdpB);
        animateSplitBar('lang', langA, langB);
        animateSplitBar('density', densityA, densityB);
    }

    function animateSplitBar(statKey, valA, valB) {
        const total = valA + valB;
        let pctA = 50;
        let pctB = 50;

        if (total > 0) {
            pctA = (valA / total) * 100;
            pctB = (valB / total) * 100;
        }

        const barA = document.getElementById(`bar-${statKey}-a`);
        const barB = document.getElementById(`bar-${statKey}-b`);

        // Trigger animations
        gsap.to(barA, { width: `${pctA}%`, duration: 1.0, ease: 'power2.out' });
        gsap.to(barB, { width: `${pctB}%`, duration: 1.0, ease: 'power2.out' });
    }

    return {
        init,
        populateDropdowns
    };
})();

// Attach to window
window.CompareTool = CompareTool;
