/**
 * Keren Shutafut Interactive Map
 */

(function () {
    'use strict';

    // ── Per-region zoom scales (adjust after testing) ───────────────────────
    const ZOOM_LEVELS = {
        'צפון':      4.5,
        'כרמל':      5.0,
        'מרכז':      4.0,
        'ירושלים':   6.0,
        'דרום':      3.5,
    };

    // ── State ───────────────────────────────────────────────────────────────
    let allPins = [];
    let activeFilters = {
        geographic: null,
        cycle:      null,
        audience:   [],
        domains:    [],
    };

    // Cached SVG viewport info (set after SVG loads, before any CSS zoom).
    let svgVbWidth    = 0;
    let svgVbHeight   = 0;
    const regionBBoxes = {}; // region name → {cx, cy} in SVG coordinate space

    // ── Boot ────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        initMap();
        loadPins();
        setupFilters();
    });

    // ── Map init ────────────────────────────────────────────────────────────

    function initMap() {
        if (!document.getElementById('map')) {
            console.warn('Map container not found');
            return;
        }
        loadSVGMap();
    }

    async function loadSVGMap() {
        const mapContainer = document.getElementById('map');
        try {
            const response = await fetch('/wp-content/themes/twentytwentyfive/assets/images/israel-map.svg');
            const svgText  = await response.text();
            mapContainer.innerHTML = svgText;

            const svg = mapContainer.querySelector('svg');
            if (svg) {
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                // slice → always fills the full viewport, cropping excess
                svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

                // Cache intrinsic viewBox dimensions for zoom coordinate math.
                svgVbWidth  = svg.viewBox.baseVal.width;
                svgVbHeight = svg.viewBox.baseVal.height;
            }

            setupRegionInteractivity();
            cacheRegionCenters(); // must run before any CSS transforms
        } catch (error) {
            console.error('Error loading SVG:', error);
        }
    }

    // ── Zoom: coordinate helpers ─────────────────────────────────────────────

    /**
     * Cache each region's center in SVG coordinate space.
     * Called once after load, before any CSS zoom is applied.
     */
    function cacheRegionCenters() {
        document.querySelectorAll('.clickable-region[data-region]').forEach(region => {
            const bbox = region.getBBox();
            regionBBoxes[region.dataset.region] = {
                cx: bbox.x + bbox.width  / 2,
                cy: bbox.y + bbox.height / 2,
            };
        });
    }

    /**
     * Convert an SVG coordinate point to its baseline viewport pixel position,
     * accounting for preserveAspectRatio="xMidYMid slice" rendering.
     *
     * Must be called with no CSS transform on the SVG element (or with the
     * cached vb dimensions that reflect the untransformed state).
     */
    function svgToViewport(svgCx, svgCy) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // "slice" uses the larger scale factor so both axes are covered.
        const scaleX = vw / svgVbWidth;
        const scaleY = vh / svgVbHeight;
        const s      = Math.max(scaleX, scaleY);

        // Centering offsets (one axis will be 0 or negative if content is cropped).
        const ox = (vw - svgVbWidth  * s) / 2;
        const oy = (vh - svgVbHeight * s) / 2;

        return {
            x: svgCx * s + ox,
            y: svgCy * s + oy,
        };
    }

    // ── Zoom: CSS transform approach ─────────────────────────────────────────

    /**
     * Zoom the SVG to centre the named region in the visible map area
     * (viewport minus panel width).  Null → animate back to identity.
     *
     * Math: with transform-origin 0 0 and transform translate(dx,dy) scale(s):
     *   screen position of SVG pixel (px, py) = (px*s + dx, py*s + dy)
     * Solve for dx, dy so that the region centre lands at (targetX, targetY).
     */
    function zoomToRegion(regionName) {
        const svg = document.querySelector('#map svg');
        if (!svg) return;

        if (!regionName) {
            svg.style.transition = 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)';
            svg.style.transform  = 'translate(0px, 0px) scale(1)';
            return;
        }

        const cached = regionBBoxes[regionName];
        if (!cached || svgVbWidth === 0) return;

        // Baseline viewport pixel position of the region centre.
        const pos = svgToViewport(cached.cx, cached.cy);

        // Target: centre of the visible map area (viewport minus panel).
        const panelEl    = document.querySelector('.filter-panel');
        const panelWidth = panelEl ? panelEl.offsetWidth : window.innerWidth * 0.22;
        const targetX    = (window.innerWidth - panelWidth) / 2;
        const targetY    = window.innerHeight / 2;

        const s  = ZOOM_LEVELS[regionName] ?? 4.0;
        const dx = targetX - pos.x * s;
        const dy = targetY - pos.y * s;

        svg.style.transformOrigin = '0 0';
        svg.style.transition      = 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)';
        svg.style.transform       = `translate(${dx}px, ${dy}px) scale(${s})`;
    }

    // ── Region interactivity ─────────────────────────────────────────────────

    function syncMapRegionSelection(regionName) {
        document.querySelectorAll('.clickable-region').forEach(r => r.classList.remove('selected'));
        document.querySelectorAll('.region-label').forEach(l => l.classList.remove('visible'));

        if (regionName) {
            document.querySelectorAll(`.clickable-region[data-region="${regionName}"]`)
                    .forEach(r => r.classList.add('selected'));
            document.querySelectorAll(`.region-label[data-region="${regionName}"]`)
                    .forEach(l => l.classList.add('visible'));
        }
    }

    function setupRegionInteractivity() {
        document.querySelectorAll('.clickable-region[data-region]').forEach(region => {
            const regionName = region.dataset.region;

            region.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const wasActive = activeFilters.geographic === regionName;
                setGeoFilter(wasActive ? null : regionName);
                syncMapRegionSelection(activeFilters.geographic);
                applyFilters();
            });
        });
    }

    function syncGeoRadios(regionName) {
        document.querySelectorAll('[data-filter-type="geographic_region"] input[type="radio"]').forEach(input => {
            input.checked = (input.dataset.term === regionName);
        });
    }

    function setGeoFilter(regionName) {
        activeFilters.geographic = regionName;
        syncGeoRadios(regionName);
        zoomToRegion(regionName);
    }

    // ── Pin loading ──────────────────────────────────────────────────────────

    async function loadPins() {
        try {
            const apiUrl = window.kerenShutafutData?.apiUrl || window.kerenShutafutMapData?.restUrl;
            if (!apiUrl) throw new Error('API URL not configured');

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            allPins = await response.json();
            console.log(`Loaded ${allPins.length} pins`);
            applyFilters();
        } catch (error) {
            console.error('Error loading pins:', error);
        }
    }

    // ── Filter setup ─────────────────────────────────────────────────────────

    function setupFilters() {
        // מיקום — single-select, deselectable
        document.querySelectorAll('[data-filter-type="geographic_region"] input[type="radio"]').forEach(input => {
            input.addEventListener('click', function () {
                if (activeFilters.geographic === this.dataset.term) {
                    this.checked = false;
                    setGeoFilter(null);
                } else {
                    setGeoFilter(this.dataset.term);
                }
                syncMapRegionSelection(activeFilters.geographic);
                applyFilters();
            });
        });

        // מחזור — single-select, deselectable
        document.querySelectorAll('[data-filter-type="activity_cycle"] input[type="radio"]').forEach(input => {
            input.addEventListener('click', function () {
                if (activeFilters.cycle === this.dataset.term) {
                    this.checked = false;
                    activeFilters.cycle = null;
                } else {
                    activeFilters.cycle = this.dataset.term;
                }
                applyFilters();
            });
        });

        // קהל יעד — multi-select
        document.querySelectorAll('[data-filter-type="target_audience"] input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function () {
                const term = this.dataset.term;
                activeFilters.audience = this.checked
                    ? [...new Set([...activeFilters.audience, term])]
                    : activeFilters.audience.filter(a => a !== term);
                applyFilters();
            });
        });

        // תחום — multi-select
        document.querySelectorAll('[data-filter-type="domains"] input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function () {
                const term = this.dataset.term;
                activeFilters.domains = this.checked
                    ? [...new Set([...activeFilters.domains, term])]
                    : activeFilters.domains.filter(d => d !== term);
                applyFilters();
            });
        });

        document.getElementById('clear-all-filters')?.addEventListener('click', clearAllFilters);
    }

    function clearAllFilters() {
        activeFilters = { geographic: null, cycle: null, audience: [], domains: [] };
        document.querySelectorAll('.filter-options-grid input[type="radio"]')   .forEach(i => i.checked = false);
        document.querySelectorAll('.filter-options-grid input[type="checkbox"]').forEach(i => i.checked = false);
        syncMapRegionSelection(null);
        zoomToRegion(null);
        applyFilters();
    }

    // ── Apply filters ────────────────────────────────────────────────────────

    function applyFilters() {
        let pins = allPins;

        if (activeFilters.geographic) {
            pins = pins.filter(pin => hasTerm(pin, 'geographic_region', activeFilters.geographic));
        }
        if (activeFilters.cycle) {
            pins = pins.filter(pin => hasTerm(pin, 'activity_cycle', activeFilters.cycle));
        }
        if (activeFilters.audience.length > 0) {
            pins = pins.filter(pin =>
                activeFilters.audience.every(t => hasTerm(pin, 'target_audience', t))
            );
        }
        if (activeFilters.domains.length > 0) {
            pins = pins.filter(pin =>
                activeFilters.domains.every(t => hasTerm(pin, 'domains', t))
            );
        }

        console.log(`Filtered: ${pins.length} / ${allPins.length} pins`);
        displayPins(pins);
        updateCounts(pins);
    }

    function hasTerm(pin, taxonomy, termName) {
        const terms = pin.taxonomies?.[taxonomy];
        if (!Array.isArray(terms)) return false;
        return terms.some(t => (typeof t === 'object' ? t.name : t) === termName);
    }

    // ── Display pins ──────────────────────────────────────────────────────────

    function displayPins(pins) {
        const pinsByRegion = { 'צפון': [], 'מרכז': [], 'דרום': [], 'כרמל': [] };

        pins.forEach(pin => {
            const regions = pin.taxonomies?.geographic_region;
            if (!Array.isArray(regions)) return;
            regions.forEach(r => {
                const name = typeof r === 'object' ? r.name : r;
                if (pinsByRegion[name]) pinsByRegion[name].push(pin);
            });
        });

        const markersGroup = document.getElementById('pin-markers');
        if (!markersGroup) return;
        markersGroup.innerHTML = '';

        Object.keys(pinsByRegion).forEach(regionName => {
            const count  = pinsByRegion[regionName].length;
            const region = document.querySelector(`[data-region="${regionName}"]`);
            if (!region || count === 0 || activeFilters.geographic === regionName) return;

            const bbox    = region.getBBox();
            const centerX = bbox.x + bbox.width  / 2;
            const centerY = bbox.y + bbox.height / 2;

            const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            badge.classList.add('pin-count-badge');
            badge.dataset.region = regionName;
            badge.style.cursor   = 'pointer';
            badge.innerHTML = `
                <use href="#puzzle-piece"
                     x="${centerX - 25}" y="${centerY - 25}"
                     width="50" height="50"
                     fill="var(--color-puzzle-rust)" filter="url(#puzzle-shadow)"/>
                <circle cx="${centerX}" cy="${centerY}" r="14" fill="white"/>
                <text x="${centerX}" y="${centerY + 5}" text-anchor="middle"
                      fill="var(--color-rust)" font-size="16" font-weight="bold">${count}</text>
            `;

            badge.addEventListener('click', function (e) {
                e.stopPropagation();
                const wasActive = activeFilters.geographic === regionName;
                setGeoFilter(wasActive ? null : regionName);
                syncMapRegionSelection(activeFilters.geographic);
                applyFilters();
            });

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${count} פרויקטים ב${regionName}`;
            badge.appendChild(title);
            markersGroup.appendChild(badge);
        });
    }

    // ── Update counts ────────────────────────────────────────────────────────

    function updateCounts(filteredPins) {
        ['geographic_region', 'activity_cycle', 'target_audience', 'domains'].forEach(taxonomy => {
            const container = document.querySelector(`[data-filter-type="${taxonomy}"]`);
            if (!container) return;
            container.querySelectorAll('[data-term]').forEach(input => {
                const term      = input.dataset.term;
                const count     = filteredPins.filter(pin => hasTerm(pin, taxonomy, term)).length;
                const countSpan = input.closest('label')?.querySelector('.count');
                if (countSpan) countSpan.textContent = count;
            });
        });
    }

    // ── Modal ─────────────────────────────────────────────────────────────────

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-close') ||
            e.target.classList.contains('modal-overlay')) {
            document.getElementById('modal-overlay')?.classList.add('hidden');
        }
    });

})();
