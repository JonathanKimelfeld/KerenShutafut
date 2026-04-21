/**
 * Keren Shutafut Interactive Map
 */

(function () {
    'use strict';

    // ── Per-region zoom scales ───────────────────────────────────────────────
    const ZOOM_LEVELS = {
        'צפון':      4.5,
        'כרמל':      5.0,
        'מרכז':      4.0,
        'ירושלים':   6.0,
        'דרום':      3.5,
    };

    // ── State ────────────────────────────────────────────────────────────────
    let allPins        = [];
    let pinSymbolsReady = false;

    let activeFilters = {
        geographic: null,
        cycle:      null,
        audience:   [],
        domains:    [],
    };

    let svgVbWidth    = 0;
    let svgVbHeight   = 0;
    const regionBBoxes = {};

    // ── Boot ─────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        initMap();
        loadPins();
        setupFilters();
    });

    // ── Map init ─────────────────────────────────────────────────────────────

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
                svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                svgVbWidth  = svg.viewBox.baseVal.width;
                svgVbHeight = svg.viewBox.baseVal.height;
            }

            setupRegionInteractivity();
            cacheRegionCenters();

            await loadPinSymbols();
            pinSymbolsReady = true;

            // If pins already fetched while map was loading, render them now
            if (allPins.length > 0) applyFilters();

        } catch (error) {
            console.error('Error loading SVG:', error);
        }
    }

    // ── Pin symbol injection ─────────────────────────────────────────────────

    /**
     * Fetch pin.svg, resolve class-based fills to inline styles (to avoid
     * conflicts with map SVG styles), and inject both layers as <symbol>
     * elements into the map SVG's <defs>.
     */
    async function loadPinSymbols() {
        const mapSvg = document.querySelector('#map svg');
        if (!mapSvg) return;

        try {
            const resp = await fetch('/wp-content/themes/twentytwentyfive/assets/images/pin.svg');
            const text = await resp.text();
            const parser = new DOMParser();
            const pinDoc = parser.parseFromString(text, 'image/svg+xml');

            // Map class names → fill values so we don't need the pin SVG's <style>
            const fillMap = {
                'cls-1': '#fff4e3',
                'cls-2': 'rgba(10,5,0,0.15)',
                'cls-3': 'rgba(10,5,0,0.20)',
                'cls-4': '#a1422b',
            };
            pinDoc.querySelectorAll('[class]').forEach(el => {
                const cls = el.getAttribute('class');
                if (fillMap[cls]) {
                    el.setAttribute('fill', fillMap[cls]);
                    el.removeAttribute('class');
                }
            });

            let defs = mapSvg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                mapSvg.prepend(defs);
            }

            // pin_left → #ksm-pin-1, pin_right → #ksm-pin-2
            ['pin_left', 'pin_right'].forEach((layerId, i) => {
                const g = pinDoc.getElementById(layerId);
                if (!g) return;
                const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
                sym.id = `ksm-pin-${i + 1}`;
                sym.setAttribute('viewBox', '0 0 184.55 184.55');
                sym.innerHTML = g.innerHTML;
                defs.appendChild(sym);
            });

        } catch (err) {
            console.error('Error loading pin symbols:', err);
        }
    }

    // ── Zoom: coordinate helpers ─────────────────────────────────────────────

    function cacheRegionCenters() {
        document.querySelectorAll('.clickable-region[data-region]').forEach(region => {
            const bbox = region.getBBox();
            regionBBoxes[region.dataset.region] = {
                cx: bbox.x + bbox.width  / 2,
                cy: bbox.y + bbox.height / 2,
            };
        });
    }

    function svgToViewport(svgCx, svgCy) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scaleX = vw / svgVbWidth;
        const scaleY = vh / svgVbHeight;
        const s  = Math.max(scaleX, scaleY);
        const ox = (vw - svgVbWidth  * s) / 2;
        const oy = (vh - svgVbHeight * s) / 2;
        return { x: svgCx * s + ox, y: svgCy * s + oy };
    }

    // ── Zoom: CSS transform ──────────────────────────────────────────────────

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

        const pos        = svgToViewport(cached.cx, cached.cy);
        const panelEl    = document.querySelector('.filter-panel');
        const panelWidth = panelEl ? panelEl.offsetWidth : window.innerWidth * 0.22;
        const targetX    = (window.innerWidth - panelWidth) / 2;
        const targetY    = window.innerHeight / 2;
        const s          = ZOOM_LEVELS[regionName] ?? 4.0;
        const dx         = targetX - pos.x * s;
        const dy         = targetY - pos.y * s;

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

        document.querySelectorAll('[data-filter-type="target_audience"] input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function () {
                const term = this.dataset.term;
                activeFilters.audience = this.checked
                    ? [...new Set([...activeFilters.audience, term])]
                    : activeFilters.audience.filter(a => a !== term);
                applyFilters();
            });
        });

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

    // ── Display pins ─────────────────────────────────────────────────────────

    function displayPins(pins) {
        if (!pinSymbolsReady) return;

        const markersGroup = document.getElementById('pin-markers');
        if (!markersGroup) return;
        markersGroup.innerHTML = '';

        pins.forEach(pin => {
            if (pin.svg_x == null || pin.svg_y == null) return;

            // Alternate between the two pin designs by pin ID
            const typeNum = (pin.id % 2 === 0) ? 1 : 2;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('map-pin');
            g.setAttribute('data-pin-id', String(pin.id));
            g.setAttribute('transform', `translate(${pin.svg_x},${pin.svg_y})`);

            // Inner group: CSS scale applies here so it doesn't conflict
            // with the outer group's SVG translate attribute
            const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            inner.classList.add('map-pin-inner');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', `#ksm-pin-${typeNum}`);
            use.setAttribute('width', '60');
            use.setAttribute('height', '60');
            // Centre horizontally, anchor bottom of pin at the coordinate point
            use.setAttribute('x', '-30');
            use.setAttribute('y', '-60');

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = pin.title;

            inner.appendChild(use);
            g.appendChild(inner);
            g.appendChild(title);
            g.addEventListener('click', e => {
                e.stopPropagation();
                showPinModal(pin);
            });

            markersGroup.appendChild(g);
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

    // ── Pin modal ────────────────────────────────────────────────────────────

    function showPinModal(pin) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl  = document.getElementById('modal-body');
        if (!overlay || !titleEl || !bodyEl) return;

        titleEl.textContent = pin.title;

        let html = '';
        if (pin.content) html += `<p>${pin.content}</p>`;
        if (pin.project_link) {
            html += `<p><a href="${pin.project_link}" target="_blank" rel="noopener noreferrer">לאתר הפרויקט &#x2197;</a></p>`;
        }
        bodyEl.innerHTML = html;
        overlay.classList.remove('hidden');
    }

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-close') ||
            e.target.classList.contains('modal-overlay')) {
            document.getElementById('modal-overlay')?.classList.add('hidden');
        }
    });

})();
