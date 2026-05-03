/**
 * Keren Shutafut Interactive Map
 */

(function () {
    'use strict';

    // ── Zoom rectangle layer IDs (SVG guides defining exact viewport per region)
    const ZOOM_LAYER_MAP = {
        'צפון':    'north_zoom',
        'כרמל':    'carmel_zoom',
        'מרכז':    'center_zoom',
        'ירושלים': 'jerusalem_zoom',
        'דרום':    'south_zoom',
    };

    // ── State ────────────────────────────────────────────────────────────────
    let allPins         = [];
    let pinSymbolsReady = false;
    let gridManager     = null;   // KSM.GridManager instance, set after SVG loads

    let activeFilters = {
        geographic: null,
        cycle:      null,
        audience:   null,
        domains:    null,
    };

    let searchResults = null; // null = no active search, array = current results

    let svgVbWidth  = 0;
    let svgVbHeight = 0;
    const zoomRects = {};

    // ── Boot ─────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        initMap();
        loadPins();
        setupFilters();
        setupSearch();
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
            const response = await fetch('/wp-content/themes/twentytwentyfive/assets/images/background-map.svg');
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

            setupMapElements();
            setupRegionInteractivity();
            cacheZoomRects();

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

            function resolveAndInject(svgDoc, classAttrMap, idPrefix) {
                svgDoc.querySelectorAll('[class]').forEach(el => {
                    const attrs = classAttrMap[el.getAttribute('class')];
                    if (attrs) {
                        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
                        el.removeAttribute('class');
                    }
                });
                // Remove <style> and <defs> — gradients are replaced with flat colours above
                svgDoc.querySelectorAll('style, defs').forEach(el => el.remove());

                const svg      = svgDoc.querySelector('svg');
                const viewBox  = svg?.getAttribute('viewBox') || '0 0 10 10';
                const content  = svg?.innerHTML || '';

                [1, 2].forEach(i => {
                    const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
                    sym.id = `${idPrefix}-${i}`;
                    sym.setAttribute('viewBox', viewBox);
                    sym.innerHTML = content;
                    defs.appendChild(sym);
                });
            }

            // ── Colored pin ───────────────────────────────────────────────────
            const pinDoc = parser.parseFromString(
                await (await fetch('/wp-content/themes/twentytwentyfive/assets/images/pin.svg')).text(),
                'image/svg+xml'
            );
            resolveAndInject(pinDoc, {
                'cls-1': { fill: '#fff4e3' },
                'cls-2': { fill: 'rgba(10,5,0,0.15)' },
                'cls-3': { fill: '#a1422b' },
            }, 'ksm-pin');

            // ── Grey pin ──────────────────────────────────────────────────────
            const greyDoc = parser.parseFromString(
                await (await fetch('/wp-content/themes/twentytwentyfive/assets/images/pin_export_grey.svg')).text(),
                'image/svg+xml'
            );
            resolveAndInject(greyDoc, {
                'cls-1': { fill: 'rgba(0,0,0,0.08)' },
                'cls-2': { fill: '#727070' },
                'cls-3': { fill: '#bcbcbc', opacity: '0.49' },
                'cls-4': { fill: '#adadad' },
            }, 'ksm-pin-grey');

        } catch (err) {
            console.error('Error loading pin symbols:', err);
        }
    }

    // ── Map element setup ────────────────────────────────────────────────────

    function setupMapElements() {
        const svg = document.querySelector('#map svg');
        if (!svg) return;

        const clickPadMap = {
            'north_click_pad':     'צפון',
            'carmel_click_pad':    'כרמל',
            'South_click_pad':     'דרום',
            'center_click_pad':    'מרכז',
            'jerusalem_click_pad': 'ירושלים',
        };
        Object.entries(clickPadMap).forEach(([id, region]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.add('clickable-region');
            el.setAttribute('data-region', region);
        });

        if (!document.getElementById('pin-markers')) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.id = 'pin-markers';
            svg.appendChild(g);
        }
    }

    // ── Zoom: cache bounding boxes from SVG zoom layers ──────────────────────

    function cacheZoomRects() {
        Object.entries(ZOOM_LAYER_MAP).forEach(([region, layerId]) => {
            const el = document.getElementById(layerId);
            if (!el) return;
            zoomRects[region] = el.getBBox(); // capture before hiding
            el.style.display = 'none';
        });
    }

    // ── Zoom: CSS transform ──────────────────────────────────────────────────

    function zoomToRegion(regionName) {
        const svg = document.querySelector('#map svg');
        if (!svg) return;

        if (!regionName) {
            svg.style.transition = 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)';
            svg.style.transform  = 'translate(0px, 0px) scale(1)';
            document.getElementById('map-container')?.classList.remove('zoomed');
            return;
        }

        const rect = zoomRects[regionName];
        if (!rect || svgVbWidth === 0) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const baseScale   = Math.max(vw / svgVbWidth, vh / svgVbHeight);
        const baseOffsetX = (vw - svgVbWidth  * baseScale) / 2;
        const baseOffsetY = (vh - svgVbHeight * baseScale) / 2;

        const panelEl    = document.querySelector('.filter-panel');
        const panelWidth = panelEl ? panelEl.offsetWidth : vw * 0.22;
        const availW     = vw - panelWidth;

        const cx = (rect.x + rect.width  / 2) * baseScale + baseOffsetX;
        const cy = (rect.y + rect.height / 2) * baseScale + baseOffsetY;

        const s  = Math.min(availW / (rect.width * baseScale), vh / (rect.height * baseScale));

        const dx = availW / 2 - cx * s;
        const dy = vh     / 2 - cy * s;

        svg.style.transformOrigin = '0 0';
        svg.style.transition      = 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)';
        svg.style.transform       = `translate(${dx}px, ${dy}px) scale(${s})`;
        document.getElementById('map-container')?.classList.add('zoomed');
    }

        // ── Region interactivity ─────────────────────────────────────────────────

    function syncMapRegionSelection(regionName) {
        document.querySelectorAll('.clickable-region').forEach(r => {
            r.classList.remove('selected');
        });
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

        document.querySelectorAll('[data-filter-type="target_audience"] input[type="radio"]').forEach(input => {
            input.addEventListener('click', function () {
                if (activeFilters.audience === this.dataset.term) {
                    this.checked = false;
                    activeFilters.audience = null;
                } else {
                    activeFilters.audience = this.dataset.term;
                }
                applyFilters();
            });
        });

        document.querySelectorAll('[data-filter-type="domains"] input[type="radio"]').forEach(input => {
            input.addEventListener('click', function () {
                if (activeFilters.domains === this.dataset.term) {
                    this.checked = false;
                    activeFilters.domains = null;
                } else {
                    activeFilters.domains = this.dataset.term;
                }
                applyFilters();
            });
        });

        document.getElementById('clear-all-filters')?.addEventListener('click', clearAllFilters);

        document.getElementById('map-reset-btn')?.addEventListener('click', function () {
            setGeoFilter(null);
            syncMapRegionSelection(null);
            applyFilters();
        });
    }

    function setupSearch() {
        const input = document.getElementById('map-search');
        const btn   = document.getElementById('map-search-btn');
        if (!input || !btn) return;

        btn.addEventListener('click', runSearch);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') runSearch();
        });

        document.getElementById('back-to-results-btn')
            ?.addEventListener('click', backToSearchResults);
    }

    function runSearch() {
        const input = document.getElementById('map-search');
        if (!input) return;
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        searchResults = allPins
            .map(pin => ({ pin, score: scorePin(pin, query) }))
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.pin);

        displayPins(searchResults);
        openSearchResults(searchResults, query);
    }

    function scorePin(pin, query) {
        const title = (pin.title   || '').toLowerCase();
        const desc  = (pin.content || '').toLowerCase();
        if (title === query)       return 100;
        if (title.includes(query)) return 80;
        if (desc.includes(query))  return 40;
        return 0;
    }

    function getExcerpt(text, query, maxLen) {
        maxLen = maxLen || 110;
        const clean = text.replace(/<[^>]*>/g, '');
        const lower = clean.toLowerCase();
        const idx   = lower.indexOf(query);
        if (idx === -1) return clean.slice(0, maxLen) + (clean.length > maxLen ? '…' : '');
        const start   = Math.max(0, idx - 35);
        const end     = Math.min(clean.length, idx + query.length + 75);
        return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
    }

    function openSearchResults(results, query) {
        const panel = document.getElementById('project-panel');
        if (!panel) return;

        document.getElementById('search-results-title').textContent =
            'תוצאות חיפוש "' + query + '" (' + results.length + ')';

        const list = document.getElementById('search-results-list');
        list.innerHTML = '';

        if (results.length === 0) {
            const li = document.createElement('li');
            li.className = 'search-result-empty';
            li.textContent = 'לא נמצאו תוצאות';
            list.appendChild(li);
        } else {
            results.forEach(function (pin) {
                const li = document.createElement('li');
                li.className = 'search-result-item';

                const titleBtn = document.createElement('button');
                titleBtn.className = 'search-result-title';
                titleBtn.textContent = pin.title;
                titleBtn.addEventListener('click', function () { openPinFromSearch(pin); });

                const excerpt = document.createElement('p');
                excerpt.className = 'search-result-excerpt';
                excerpt.textContent = getExcerpt(pin.content || '', query);

                li.appendChild(titleBtn);
                if (pin.content) li.appendChild(excerpt);
                list.appendChild(li);
            });
        }

        panel.classList.remove('panel-pin-from-search');
        panel.classList.add('panel-search-mode', 'panel-open');
        panel.setAttribute('aria-hidden', 'false');
    }

    function openPinFromSearch(pin) {
        fillPinDetails(pin);
        const panel = document.getElementById('project-panel');
        if (!panel) return;
        panel.classList.remove('panel-search-mode');
        panel.classList.add('panel-pin-from-search', 'panel-open');
        panel.setAttribute('aria-hidden', 'false');
    }

    function backToSearchResults() {
        if (!searchResults) return;
        const query = (document.getElementById('map-search')?.value || '').trim().toLowerCase();
        openSearchResults(searchResults, query);
    }

    function clearAllFilters() {
        activeFilters = { geographic: null, cycle: null, audience: null, domains: null };
        const searchInput = document.getElementById('map-search');
        if (searchInput) searchInput.value = '';
        searchResults = null;
        document.querySelectorAll('.filter-options-grid input[type="radio"]').forEach(i => i.checked = false);
        syncMapRegionSelection(null);
        zoomToRegion(null);
        closeProjectPanel();
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
        if (activeFilters.audience) {
            pins = pins.filter(pin => hasTerm(pin, 'target_audience', activeFilters.audience));
        }
        if (activeFilters.domains) {
            pins = pins.filter(pin => hasTerm(pin, 'domains', activeFilters.domains));
        }
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
            use.setAttribute('width', '68.05');
            use.setAttribute('height', '68.05');
            use.setAttribute('x', '-34.03');
            use.setAttribute('y', '-68.05');

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

    function fillPinDetails(pin) {
        const panel = document.getElementById('project-panel');
        if (!panel) return;

        panel.querySelector('.project-title-text').textContent = pin.title;

        const descEl = panel.querySelector('.project-panel-description');
        descEl.textContent = pin.content || '';
        descEl.classList.toggle('hidden', !pin.content);

        function setMeta(id, value) {
            const row = document.getElementById(id);
            if (!row) return;
            const span = row.querySelector('span');
            if (value) { span.textContent = value; row.classList.remove('hidden'); }
            else        { row.classList.add('hidden'); }
        }

        const terms = pin.taxonomies || {};
        setMeta('pm-region',   (terms.geographic_region || []).map(t => t.name).join('، '));
        setMeta('pm-audience', (terms.target_audience   || []).map(t => t.name).join(' | '));
        setMeta('pm-domains',  (terms.domains           || []).map(t => t.name).join(' | '));
        setMeta('pm-cycle',    (terms.activity_cycle    || []).map(t => t.name).join(', '));

        const orgEl = document.getElementById('pm-org');
        if (orgEl) {
            orgEl.querySelector('.org-name').textContent = pin.operating_org || '';
            orgEl.classList.toggle('hidden', !pin.operating_org);
        }

        const linkEl = document.getElementById('pm-link');
        if (linkEl) {
            if (pin.project_link) { linkEl.href = pin.project_link; linkEl.classList.remove('hidden'); }
            else                   { linkEl.classList.add('hidden'); }
        }
    }

    function openProjectPanel(pin) {
        const panel = document.getElementById('project-panel');
        if (!panel) return;
        fillPinDetails(pin);
        const wasSearch = searchResults !== null;
        searchResults = null;
        panel.classList.remove('panel-search-mode', 'panel-pin-from-search');
        panel.classList.add('panel-open');
        panel.setAttribute('aria-hidden', 'false');
        if (wasSearch) applyFilters(); // restore all pins on map
    }

    function closeProjectPanel() {
        const panel = document.getElementById('project-panel');
        if (!panel) return;
        const wasSearch = searchResults !== null;
        searchResults = null;
        panel.classList.remove('panel-open', 'panel-search-mode', 'panel-pin-from-search');
        panel.setAttribute('aria-hidden', 'true');
        if (wasSearch) applyFilters(); // restore all pins on map
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
