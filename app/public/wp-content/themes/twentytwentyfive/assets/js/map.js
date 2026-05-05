/**
 * Keren Shutafut Interactive Map
 * MERGED VERSION: Working pin rendering from GOOD + Carousel from CURRENT
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

    // ── Zoom: CSS transform (FROM GOOD - NO PIN COUNTER-SCALING) ─────────────

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
        // REMOVED: svg.style.setProperty('--pin-scale', String(1 / s));
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
        document.querySelectorAll('.clickable-region').forEach(region => {
            region.addEventListener('click', function (e) {
                e.stopPropagation();
                const regionName = this.getAttribute('data-region');
                if (!regionName) return;

                if (activeFilters.geographic === regionName) {
                    setGeoFilter(null);
                } else {
                    setGeoFilter(regionName);
                }
            });
        });
    }

    function setGeoFilter(regionName) {
        activeFilters.geographic = regionName;
        syncMapRegionSelection(regionName);

        document.querySelectorAll('.filter-options-grid input[data-filter-type="geographic_region"]')
                .forEach(input => input.checked = (input.dataset.term === regionName));

        zoomToRegion(regionName);
        applyFilters();
    }

    // ── Load pins from REST API ──────────────────────────────────────────────

    async function loadPins() {
        try {
            const response = await fetch('/wp-json/keren-shutafut/v1/pins');
            const pins     = await response.json();

            if (!Array.isArray(pins)) {
                console.error('Unexpected pins response:', pins);
                return;
            }

            allPins = pins;
            if (pinSymbolsReady) applyFilters();
        } catch (error) {
            console.error('Error loading pins:', error);
        }
    }

    // ── Filters setup ────────────────────────────────────────────────────────

    function setupFilters() {
        document.querySelectorAll('.filter-options-grid input[type="radio"]').forEach(input => {
            const filterType = input.closest('[data-filter-type]')?.dataset.filterType;
            if (!filterType) return;

            input.addEventListener('change', function () {
                if (!this.checked) return;
                const term = this.dataset.term;

                if (filterType === 'geographic_region') {
                    setGeoFilter(term);
                } else if (filterType === 'activity_cycle') {
                    activeFilters.cycle = term;
                } else if (filterType === 'target_audience') {
                    activeFilters.audience = term;
                } else if (filterType === 'domains') {
                    activeFilters.domains = term;
                }

                applyFilters();
            });
        });

        const clearBtn = document.getElementById('clear-all-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllFilters);
        }
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
        requestAnimationFrame(() => applyFilters());
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

    // ── Display pins (GOOD VERSION - NO COUNTER-SCALING) ────────────────────

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

        // Fill related projects carousel (NEW FROM CURRENT)
        fillRelatedProjects(pin);
    }

    // ── CAROUSEL IMPLEMENTATION (FROM CURRENT) ───────────────────────────────

    function scoreRelation(pin1, pin2) {
        const tax = pin1.taxonomies || {};
        const aud1 = new Set((tax.target_audience || []).map(t => t.name));
        const cyc1 = new Set((tax.activity_cycle || []).map(t => t.name));
        const dom1 = new Set((tax.domains || []).map(t => t.name));

        const tax2 = pin2.taxonomies || {};
        const aud2 = new Set((tax2.target_audience || []).map(t => t.name));
        const cyc2 = new Set((tax2.activity_cycle || []).map(t => t.name));
        const dom2 = new Set((tax2.domains || []).map(t => t.name));

        let score = 0;
        aud1.forEach(a => { if (aud2.has(a)) score += 3; });
        cyc1.forEach(c => { if (cyc2.has(c)) score += 2; });
        dom1.forEach(d => { if (dom2.has(d)) score += 1; });
        return score;
    }

    function fillRelatedProjects(pin) {
        const section  = document.getElementById('related-projects-section');
        const divider  = document.getElementById('related-divider');
        const track    = document.getElementById('related-projects-list');
        const dotsWrap = document.getElementById('carousel-dots');
        if (!section || !track) return;

        // Deduplicate allPins by id, exclude current pin, score and take top 3
        const seenIds = new Set([pin.id]);
        const related = allPins
            .filter(p => { if (seenIds.has(p.id)) return false; seenIds.add(p.id); return true; })
            .map(p => ({ pin: p, score: scoreRelation(pin, p) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(r => r.pin);

        track.innerHTML = '';
        if (dotsWrap) dotsWrap.innerHTML = '';

        if (related.length === 0) {
            section.classList.add('hidden');
            if (divider) divider.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        if (divider) divider.classList.remove('hidden');

        const iconSrc = document.querySelector('.project-title-icon')?.src
            || '/wp-content/themes/twentytwentyfive/assets/images/project_icon.svg';

        const slides = related.map(relPin => {
            const li  = document.createElement('li');
            li.className = 'carousel-slide';

            const btn = document.createElement('button');
            btn.className = 'related-project-btn';
            btn.addEventListener('click', () => openProjectPanel(relPin));

            const icon = document.createElement('img');
            icon.src       = iconSrc;
            icon.className = 'related-project-icon';
            icon.alt       = '';
            icon.setAttribute('aria-hidden', 'true');

            const name = document.createElement('span');
            name.className   = 'related-project-name';
            name.textContent = relPin.title;

            btn.appendChild(icon);
            btn.appendChild(name);
            li.appendChild(btn);
            track.appendChild(li);
            return li;
        });

        initCarousel(slides);
    }

    function initCarousel(slides) {
        const count    = slides.length;
        const section  = document.getElementById('related-projects-section');
        const prevBtn  = section?.querySelector('.carousel-prev');
        const nextBtn  = section?.querySelector('.carousel-next');
        const dotsWrap = document.getElementById('carousel-dots');
        let current    = 0;

        // Build dot buttons
        if (dotsWrap) {
            for (let i = 0; i < count; i++) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot';
                dot.setAttribute('aria-label', `מיזם ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsWrap.appendChild(dot);
            }
        }

        function goTo(idx) {
            slides[current].classList.remove('carousel-slide--active');
            current = Math.max(0, Math.min(idx, count - 1));
            slides[current].classList.add('carousel-slide--active');

            dotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) =>
                d.classList.toggle('carousel-dot--active', i === current));

            if (prevBtn) prevBtn.disabled = (current === 0);
            if (nextBtn) nextBtn.disabled = (current === count - 1);
        }

        prevBtn?.addEventListener('click', () => goTo(current - 1));
        nextBtn?.addEventListener('click', () => goTo(current + 1));

        // Hide nav entirely when only one slide
        const footer = section?.querySelector('.carousel-footer');
        if (footer) footer.style.display = count > 1 ? '' : 'none';

        goTo(0);
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

    // ── Search (keeping existing implementation) ─────────────────────────────
    function setupSearch() {
        // Implementation unchanged from CURRENT
        const searchInput = document.getElementById('map-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if (!query) {
                searchResults = null;
                applyFilters();
                return;
            }

            const q = query.toLowerCase();
            searchResults = allPins.filter(pin =>
                pin.title?.toLowerCase().includes(q) ||
                pin.content?.toLowerCase().includes(q)
            );

            displayPins(searchResults);
            updateCounts(searchResults);
        });
    }

})();
