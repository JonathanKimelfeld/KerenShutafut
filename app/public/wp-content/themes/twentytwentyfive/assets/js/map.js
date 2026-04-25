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
    let allPins         = [];
    let pinSymbolsReady = false;
    let gridManager     = null;   // KSM.GridManager instance, set after SVG loads

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

            // Initialise the grid manager now that region elements are in the DOM
            if (window.KSM?.GridManager) {
                gridManager = new window.KSM.GridManager();
                gridManager.cacheRegionBounds();
            }

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
            const parser = new DOMParser();

            let defs = mapSvg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                mapSvg.prepend(defs);
            }

            // ── Colored pin ───────────────────────────────────────────────────
            const resp = await fetch('/wp-content/themes/twentytwentyfive/assets/images/pin.svg');
            const text = await resp.text();
            const pinDoc = parser.parseFromString(text, 'image/svg+xml');

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

            ['pin_left', 'pin_right'].forEach((layerId, i) => {
                const g = pinDoc.getElementById(layerId);
                if (!g) return;
                const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
                sym.id = `ksm-pin-${i + 1}`;
                sym.setAttribute('viewBox', '0 0 184.55 184.55');
                sym.innerHTML = g.innerHTML;
                defs.appendChild(sym);
            });

            // ── Grey pin ──────────────────────────────────────────────────────
            const greyResp = await fetch('/wp-content/themes/twentytwentyfive/assets/images/pin_export_grey.svg');
            const greyText = await greyResp.text();
            const greyDoc  = parser.parseFromString(greyText, 'image/svg+xml');

            // Resolve class-based fills/opacities inline (gradients replaced with flat colours)
            const greyAttrMap = {
                'cls-1': { fill: 'rgba(0,0,0,0.08)' },
                'cls-2': { fill: 'rgba(0,0,0,0.08)' },
                'cls-3': { fill: '#191919', opacity: '0.43' },
                'cls-4': { fill: '#fcf3e4' },
                'cls-5': { opacity: '0.74' },
            };
            greyDoc.querySelectorAll('[class]').forEach(el => {
                const attrs = greyAttrMap[el.getAttribute('class')];
                if (attrs) {
                    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
                    el.removeAttribute('class');
                }
            });

            ['pin_grey_left', 'pin_grey_right'].forEach((layerId, i) => {
                const g = greyDoc.getElementById(layerId);
                if (!g) return;
                const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
                sym.id = `ksm-pin-grey-${i + 1}`;
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

    function displayPins(activePins) {
        if (!pinSymbolsReady) return;

        const markersGroup = document.getElementById('pin-markers');
        if (!markersGroup) return;
        markersGroup.innerHTML = '';

        if (gridManager) gridManager.reset();

        const filtersApplied = activePins.length < allPins.length;
        const activeIds = filtersApplied ? new Set(activePins.map(p => p.id)) : null;

        // Inactive pins first in DOM (lower SVG stack), active pins on top
        const ordered = filtersApplied
            ? [...allPins.filter(p => !activeIds.has(p.id)), ...activePins]
            : allPins;

        ordered.forEach(pin => {
            const isActive = !filtersApplied || activeIds.has(pin.id);
            const pos = resolvePinPosition(pin);
            if (!pos) return;

            const typeNum  = (pin.id % 2 === 0) ? 1 : 2;
            const symbolId = isActive ? `ksm-pin-${typeNum}` : `ksm-pin-grey-${typeNum}`;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('map-pin');
            if (!isActive) g.classList.add('map-pin--inactive');
            g.setAttribute('data-pin-id', String(pin.id));
            g.setAttribute('transform', `translate(${pos.x},${pos.y})`);

            const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            inner.classList.add('map-pin-inner');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', `#${symbolId}`);
            use.setAttribute('width', '53');
            use.setAttribute('height', '53');
            use.setAttribute('x', '-26.5');
            use.setAttribute('y', '-53');

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = pin.title;

            inner.appendChild(use);
            g.appendChild(inner);
            g.appendChild(title);
            g.addEventListener('click', e => {
                e.stopPropagation();
                openProjectPanel(pin);
            });

            markersGroup.appendChild(g);
        });
    }

    /**
     * Resolve the SVG pixel position for a pin.
     *
     * Priority:
     *   1. Grid-based placement using pin.latitude / pin.longitude + the
     *      pin's primary geographic_region term (requires coordinate-utils.js).
     *   2. Legacy server-side position (pin.svg_x / pin.svg_y) as fallback
     *      for pins that haven't been given real coordinates yet.
     *
     * @param  {object} pin  Pin object from the REST API
     * @returns {{ x: number, y: number } | null}
     */
    function resolvePinPosition(pin) {
        // Attempt coordinate-based placement
        if (gridManager && pin.latitude != null && pin.longitude != null) {
            const regionName = pin.taxonomies?.geographic_region?.[0]?.name;
            if (regionName) {
                const pos = gridManager.placePin(
                    pin.latitude,
                    pin.longitude,
                    regionName,
                    pin.id
                );
                if (pos) return pos;
            }
        }

        // Fall back to legacy server-computed position
        if (pin.svg_x != null && pin.svg_y != null) {
            return { x: pin.svg_x, y: pin.svg_y };
        }

        return null;
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

    // ── Project details panel ────────────────────────────────────────────────

    function openProjectPanel(pin) {
        const panel      = document.getElementById('project-panel');
        const filterPanel = document.querySelector('.filter-panel');
        if (!panel) return;

        // Title
        panel.querySelector('.project-panel-title').textContent = pin.title;

        // Description
        const descEl = panel.querySelector('.project-panel-description');
        descEl.textContent = pin.content || '';
        descEl.classList.toggle('hidden', !pin.content);

        // Helper to set a meta row
        function setMeta(id, value) {
            const row = document.getElementById(id);
            if (!row) return;
            const span = row.querySelector('span');
            if (value) {
                span.textContent = value;
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        }

        const terms = pin.taxonomies || {};
        const regionName   = terms.geographic_region?.map(t => t.name).join('، ') || '';
        const audienceNames = terms.target_audience?.map(t => t.name).join(' | ') || '';
        const domainNames  = terms.domains?.map(t => t.name).join(' | ') || '';
        const cycleName    = terms.activity_cycle?.map(t => t.name).join(', ') || '';

        setMeta('pm-region',   regionName);
        setMeta('pm-audience', audienceNames);
        setMeta('pm-domains',  domainNames);
        setMeta('pm-cycle',    cycleName);

        // Operating org
        const orgEl = document.getElementById('pm-org');
        if (orgEl) {
            orgEl.querySelector('.org-name').textContent = pin.operating_org || '';
            orgEl.classList.toggle('hidden', !pin.operating_org);
        }

        // Project link
        const linkEl = document.getElementById('pm-link');
        if (linkEl) {
            if (pin.project_link) {
                linkEl.href = pin.project_link;
                linkEl.classList.remove('hidden');
            } else {
                linkEl.classList.add('hidden');
            }
        }

        panel.classList.add('panel-open');
        panel.setAttribute('aria-hidden', 'false');
    }

    function closeProjectPanel() {
        const panel       = document.getElementById('project-panel');
        const filterPanel = document.querySelector('.filter-panel');
        if (!panel) return;
        panel.classList.remove('panel-open');
        panel.setAttribute('aria-hidden', 'true');
    }

    // Close on X button
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('project-panel-close')) {
            closeProjectPanel();
        }
    });

    // Close on ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeProjectPanel();
    });

    // Close when clicking the map background (not a pin)
    document.getElementById('map-container')?.addEventListener('click', function (e) {
        if (!e.target.closest('.map-pin')) closeProjectPanel();
    });

})();
