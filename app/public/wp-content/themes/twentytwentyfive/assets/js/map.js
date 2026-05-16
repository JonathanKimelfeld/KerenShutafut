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

    // ── i18n ─────────────────────────────────────────────────────────────────

    const TRANSLATIONS = {
        he: {
            panelTitle:           'מפת שׁוּתָּפוּת',
            panelDescription:     'לפניך מפה עליה מופיעה פריסה של מיזמים הנתמכים על ידי <strong>קרן שותפות</strong>. מיזמים אלה, עוסקים בחברה משותפת, בקידום ערכים של חיים משותפים בין הקבוצות השונות המרכיבות את החברה הישראלית.<br>בעשייתם מראים המיזמים את מגוון האפשרויות המקוריות והמעניינות, לקידום סובלנות, שוויון ויצירת חיים בשותפות בישראל.',
            searchPlaceholder:    'חפש פרויקט...',
            searchAriaLabel:      'חיפוש פרויקטים',
            searchBtnAriaLabel:   'חפש',
            filterAudience:       'קהל יעד',
            filterLocation:       'מיקום',
            filterCycle:          'מחזור',
            filterDomain:         'תחום',
            filterAudienceGroup:  'בחר קהל יעד',
            filterLocationGroup:  'בחר מיקום',
            filterCycleGroup:     'בחר מחזור פעילות',
            filterDomainGroup:    'בחר תחום',
            filterPanelAriaLabel: 'פאנל סינון',
            clearAll:             'נקה הכל',
            closeBtnAriaLabel:    'סגור',
            backToResults:        'חזרה לתוצאות',
            backToResultsAriaLabel: 'חזרה לתוצאות החיפוש',
            metaLocation:         'מיקום:',
            metaAudience:         'קהל יעד:',
            metaCycle:            'מחזור:',
            metaDomain:           'תחום:',
            orgLabel:             'ארגון מפעיל:',
            linkLabel:            'לינק לאתר',
            relatedTitle:         'אולי יעניין אותך גם:',
            carouselPrev:         'הקודם',
            carouselNext:         'הבא',
            carouselDotLabel:     'מיזם',
            searchResultsTitle:   'תוצאות חיפוש',
            noResults:            'לא נמצאו תוצאות',
        },
        en: {
            panelTitle:           'Partnership Map',
            panelDescription:     'This map displays projects supported by <strong>Keren Shutafut</strong>. These projects promote a shared society and the values of coexistence among the diverse groups that make up Israeli society.<br>Through their work, the projects showcase original and interesting ways to advance tolerance, equality, and a life of partnership in Israel.',
            searchPlaceholder:    'Search project...',
            searchAriaLabel:      'Search projects',
            searchBtnAriaLabel:   'Search',
            filterAudience:       'Target Audience',
            filterLocation:       'Location',
            filterCycle:          'Cycle',
            filterDomain:         'Domain',
            filterAudienceGroup:  'Select Target Audience',
            filterLocationGroup:  'Select Location',
            filterCycleGroup:     'Select Activity Cycle',
            filterDomainGroup:    'Select Domain',
            filterPanelAriaLabel: 'Filter panel',
            clearAll:             'Clear All',
            closeBtnAriaLabel:    'Close',
            backToResults:        'Back to results',
            backToResultsAriaLabel: 'Back to search results',
            metaLocation:         'Location:',
            metaAudience:         'Target Audience:',
            metaCycle:            'Cycle:',
            metaDomain:           'Domain:',
            orgLabel:             'Operating Organization:',
            linkLabel:            'Website',
            relatedTitle:         'You might also like:',
            carouselPrev:         'Previous',
            carouselNext:         'Next',
            carouselDotLabel:     'Project',
            searchResultsTitle:   'Search results',
            noResults:            'No results found',
        },
    };

    const TERM_TRANSLATIONS = {
        'צפון':                  'North',
        'מרכז':                  'Center',
        'דרום':                  'South',
        'ירושלים':               'Jerusalem',
        'כרמל':                  'Carmel',
        'מחזור א':               'Cycle A',
        'מחזור ב':               'Cycle B',
        'מחזור ג':               'Cycle C',
        'מחזור ד':               'Cycle D',
        'מחזור ה':               'Cycle E',
        'מחזור ו':               'Cycle F',
        'יהודים וערבים':         'Jews and Arabs',
        'נוער וילדים':           'Youth and Children',
        'קהל מגוון':             'Diverse Audience',
        'נשים':                  'Women',
        'צעירים וסטודנטים':      'Young Adults and Students',
        'אנשי מקצוע ופעילים':    'Professionals and Activists',
        'דתיים וחילונים':        'Religious and Secular',
        'להט"ב':                 'LGBTQ+',
        'מוגבלויות':             'People with Disabilities',
        'אומנות ותרבות':         'Arts and Culture',
        'חינוך':                 'Education',
        'טבע וסביבה':            'Nature and Environment',
        'לימוד בין-דתי':         'Interfaith Learning',
        'מוסיקה':                'Music',
        'מנהיגות ויזמות':        'Leadership and Entrepreneurship',
        'ספורט':                 'Sports',
        'קהילה ורווחה':          'Community and Welfare',
        'שפה':                   'Language',
    };

    // Hebrew display overrides (label_overrides from PHP must be mirrored here)
    const HE_LABEL_OVERRIDES = {
        'אנשי מקצוע ופעילים': 'אקטיביסטים',
    };

    let currentLang     = localStorage.getItem('ks-lang') || 'he';
    let lastSearchQuery = null;
    let currentOpenPin  = null;

    function t(key) {
        return (TRANSLATIONS[currentLang] || TRANSLATIONS.he)[key]
            ?? TRANSLATIONS.he[key]
            ?? key;
    }

    function termLabel(hebrewName) {
        if (currentLang === 'en') return TERM_TRANSLATIONS[hebrewName] || hebrewName;
        return HE_LABEL_OVERRIDES[hebrewName] || hebrewName;
    }

    function setLang(lang) {
        currentLang = lang;
        localStorage.setItem('ks-lang', lang);
        applyLanguage();
    }

    function applyLanguage() {
        const isHe = currentLang === 'he';
        const html  = document.documentElement;
        html.setAttribute('data-lang', currentLang);
        html.setAttribute('lang',      currentLang);
        html.setAttribute('dir',       isHe ? 'rtl' : 'ltr');

        // Static text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = t(key);
            if (key === 'panelDescription') {
                el.innerHTML = val;
            } else if (el.tagName === 'INPUT') {
                el.placeholder = val;
            } else {
                el.textContent = val;
            }
        });

        // Aria labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', t(el.dataset.i18nAria));
        });

        // Taxonomy filter option labels
        document.querySelectorAll('.filter-options-grid label').forEach(label => {
            const input  = label.querySelector('input[data-term]');
            const textEl = label.querySelector('.option-text');
            if (input && textEl) textEl.textContent = termLabel(input.dataset.term);
        });

        // Carousel dots
        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.setAttribute('aria-label', `${t('carouselDotLabel')} ${i + 1}`);
        });

        // Refresh open search results title
        if (lastSearchQuery !== null) {
            const titleEl = document.getElementById('search-results-title');
            if (titleEl && titleEl.textContent) {
                titleEl.textContent =
                    `${t('searchResultsTitle')} "${lastSearchQuery}" (${(searchResults || []).length})`;
            }
        }

        // Re-render open pin details so taxonomy values translate
        const panel = document.getElementById('project-panel');
        if (currentOpenPin && panel?.classList.contains('panel-open')) {
            fillPinDetails(currentOpenPin);
        }

        // Re-position immediately so the container has correct bounds before zoom math,
        // then re-zoom in rAF once the browser has applied the layout changes.
        repositionMapContainer();
        requestAnimationFrame(() => {
            repositionMapContainer();
            if (activeFilters.geographic) {
                zoomToRegion(activeFilters.geographic);
            }
        });
    }

    function repositionMapContainer() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;
        if (currentLang === 'en') {
            const panelEl    = document.querySelector('.filter-panel');
            const panelWidth = panelEl ? panelEl.offsetWidth : 0;
            if (panelWidth > 0) {
                mapContainer.style.left  = panelWidth + 'px';
                mapContainer.style.width = (window.innerWidth - panelWidth) + 'px';
            }
        } else {
            mapContainer.style.left  = '';
            mapContainer.style.width = '';
        }
    }

    function initLang() {
        applyLanguage();
        // Reposition after first paint so panel offsetWidth is available
        requestAnimationFrame(repositionMapContainer);
        document.getElementById('lang-switcher')
            ?.addEventListener('click', () => setLang(currentLang === 'he' ? 'en' : 'he'));
    }

    // ── State ────────────────────────────────────────────────────────────────
    let allPins         = [];
    let pinSymbolsReady = false;
    let gridManager     = null;   // KSM.GridManager instance, set after SVG loads

    let selectedPinId = null;

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
        initLang();
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

            // Ensure map-container is correctly sized after async SVG load
            repositionMapContainer();

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

            // ── Selected pin ──────────────────────────────────────────────────
            const selDoc = parser.parseFromString(
                await (await fetch('/wp-content/themes/twentytwentyfive/assets/images/selected_pin.svg')).text(),
                'image/svg+xml'
            );
            resolveAndInject(selDoc, {
                'cls-1': { fill: '#fff4e3', stroke: '#2b4a45', 'stroke-width': '1.4', 'stroke-miterlimit': '10' },
                'cls-2': { fill: '#fff4e3' },
                'cls-3': { fill: '#a1422b', stroke: '#fff4e3', 'stroke-miterlimit': '10' },
                'cls-4': { fill: 'rgba(42,16,0,0.35)', opacity: '0.6' },
            }, 'ksm-pin-selected');

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

        // Use the actual map container size — in English the container is narrowed
        // to exclude the left-side panel, so all zoom math automatically adapts.
        const mapContainer = document.getElementById('map-container');
        const cw = mapContainer ? mapContainer.offsetWidth  : window.innerWidth;
        const ch = mapContainer ? mapContainer.offsetHeight : window.innerHeight;

        const baseScale   = Math.max(cw / svgVbWidth, ch / svgVbHeight);
        const baseOffsetX = (cw - svgVbWidth  * baseScale) / 2;
        const baseOffsetY = (ch - svgVbHeight * baseScale) / 2;

        const cx = (rect.x + rect.width  / 2) * baseScale + baseOffsetX;
        const cy = (rect.y + rect.height / 2) * baseScale + baseOffsetY;

        // In Hebrew, the panel sits on the right and overlaps the full-width container;
        // reduce the available width so zoom centres in the visible area.
        const panelEl      = document.querySelector('.filter-panel');
        const panelOverlap = (currentLang === 'he' && panelEl) ? panelEl.offsetWidth : 0;
        const availW       = cw - panelOverlap;

        const ZOOM_PAD = 60; // extra padding keeps pins near the region edge fully visible
        const s  = Math.min((availW - 2 * ZOOM_PAD) / (rect.width * baseScale), (ch - 2 * ZOOM_PAD) / (rect.height * baseScale));

        const dx = availW / 2 - cx * s;
        const dy = ch / 2 - cy * s;

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

            input.addEventListener('click', function () {
                const term = this.dataset.term;

                const currentValue =
                    filterType === 'geographic_region' ? activeFilters.geographic :
                    filterType === 'activity_cycle'    ? activeFilters.cycle      :
                    filterType === 'target_audience'   ? activeFilters.audience   :
                    filterType === 'domains'           ? activeFilters.domains    : null;

                if (currentValue === term) {
                    // Already active — toggle off
                    this.checked = false;
                    if (filterType === 'geographic_region') {
                        setGeoFilter(null);
                    } else {
                        if (filterType === 'activity_cycle')  activeFilters.cycle     = null;
                        if (filterType === 'target_audience') activeFilters.audience  = null;
                        if (filterType === 'domains')         activeFilters.domains   = null;
                        applyFilters();
                    }
                } else {
                    // Not yet active — select it
                    if (filterType === 'geographic_region') {
                        setGeoFilter(term);
                    } else {
                        if (filterType === 'activity_cycle')  activeFilters.cycle     = term;
                        if (filterType === 'target_audience') activeFilters.audience  = term;
                        if (filterType === 'domains')         activeFilters.domains   = term;
                        applyFilters();
                    }
                }
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
        return terms.some(term => (typeof term === 'object' ? term.name : term) === termName);
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
            use.setAttribute('width', '74.86');
            use.setAttribute('height', '74.86');
            use.setAttribute('x', '-37.43');
            use.setAttribute('y', '-74.86');

            inner.appendChild(use);
            g.appendChild(inner);
            g.setAttribute('data-pin-title', pin.title);
            g.addEventListener('mouseenter', e => {
                const title = (currentLang === 'en' && pin.title_en) ? pin.title_en : pin.title;
                pinTooltipShow(e, title);
            });
            g.addEventListener('mousemove', e => pinTooltipMove(e));
            g.addEventListener('mouseleave', () => pinTooltipHide());
            g.addEventListener('click', e => {
                e.stopPropagation();
                if (selectedPinId === pin.id) {
                    closeProjectPanel();
                } else {
                    openProjectPanel(pin);
                }
            });

            markersGroup.appendChild(g);
        });

        // Re-apply selected state after a full re-render
        if (selectedPinId !== null) {
            const el = document.querySelector(`#pin-markers [data-pin-id="${selectedPinId}"]`);
            if (el) { applyPinSymbol(el, true); el.parentNode.appendChild(el); }
        }
    }

    // ── Selected pin visual ──────────────────────────────────────────────────

    function applyPinSymbol(pinEl, isSelected) {
        const id      = parseInt(pinEl.getAttribute('data-pin-id'));
        const typeNum = (id % 2 === 0) ? 1 : 2;
        const use     = pinEl.querySelector('use');
        if (!use) return;

        if (isSelected) {
            use.setAttribute('href',   `#ksm-pin-selected-${typeNum}`);
            use.setAttribute('width',  '90');
            use.setAttribute('height', '90');
            use.setAttribute('x',      '-45');
            use.setAttribute('y',      '-90');
        } else {
            const inactive = pinEl.classList.contains('map-pin--inactive');
            use.setAttribute('href',   `#${inactive ? 'ksm-pin-grey' : 'ksm-pin'}-${typeNum}`);
            use.setAttribute('width',  '74.86');
            use.setAttribute('height', '74.86');
            use.setAttribute('x',      '-37.43');
            use.setAttribute('y',      '-74.86');
        }
    }

    function setSelectedPin(pinId) {
        if (selectedPinId !== null) {
            const old = document.querySelector(`#pin-markers [data-pin-id="${selectedPinId}"]`);
            if (old) applyPinSymbol(old, false);
        }
        selectedPinId = pinId;
        if (pinId !== null) {
            const el = document.querySelector(`#pin-markers [data-pin-id="${pinId}"]`);
            if (el) {
                applyPinSymbol(el, true);
                // Bring to front in SVG paint order
                el.parentNode.appendChild(el);
            }
        }
    }

    // ── Pin tooltips ─────────────────────────────────────────────────────────

    const _pinTooltip = (() => {
        let el = document.getElementById('map-tooltip');
        if (!el) {
            el = document.createElement('div');
            el.id = 'map-tooltip';
            document.body.appendChild(el);
        }
        return el;
    })();

    function pinTooltipShow(e, text) {
        _pinTooltip.textContent = text;
        _pinTooltip.style.left = e.clientX + 'px';
        _pinTooltip.style.top  = e.clientY + 'px';
        _pinTooltip.classList.add('visible');
    }

    function pinTooltipMove(e) {
        _pinTooltip.style.left = e.clientX + 'px';
        _pinTooltip.style.top  = e.clientY + 'px';
    }

    function pinTooltipHide() {
        _pinTooltip.classList.remove('visible');
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

        const isEn          = currentLang === 'en';
        const displayTitle  = (isEn && pin.title_en)         ? pin.title_en         : pin.title;
        const displayDesc   = (isEn && pin.content_en)       ? pin.content_en       : pin.content;
        const displayOrg    = (isEn && pin.operating_org_en) ? pin.operating_org_en : pin.operating_org;
        const displayLoc    = (isEn && pin.location_en)      ? pin.location_en      : pin.location;

        panel.querySelector('.project-title-text').textContent = displayTitle;

        const descEl = panel.querySelector('.project-panel-description');
        descEl.textContent = displayDesc || '';
        descEl.classList.toggle('hidden', !displayDesc);

        function setMeta(id, value) {
            const row = document.getElementById(id);
            if (!row) return;
            const span = row.querySelector('span');
            if (value) { span.textContent = value; row.classList.remove('hidden'); }
            else        { row.classList.add('hidden'); }
        }

        const terms = pin.taxonomies || {};
        setMeta('pm-location', displayLoc || '');
        setMeta('pm-audience', (terms.target_audience || []).map(term => termLabel(term.name)).join(' | '));
        setMeta('pm-domains',  (terms.domains         || []).map(term => termLabel(term.name)).join(' | '));
        setMeta('pm-cycle',    (terms.activity_cycle  || []).map(term => termLabel(term.name)).join(', '));

        const orgEl = document.getElementById('pm-org');
        if (orgEl) {
            orgEl.querySelector('.org-name').textContent = displayOrg || '';
            orgEl.classList.toggle('hidden', !displayOrg);
        }

        const linkEl = document.getElementById('pm-link');
        if (linkEl) {
            if (pin.project_link) { linkEl.href = pin.project_link; linkEl.classList.remove('hidden'); }
            else                   { linkEl.classList.add('hidden'); }
        }

        // Featured image
        const imagesSection = document.getElementById('project-images');
        if (imagesSection) {
            if (pin.featured_image) {
                imagesSection.innerHTML = `<img src="${pin.featured_image}" alt="${pin.title}" class="project-image" loading="lazy">`;
                imagesSection.classList.remove('hidden');
            } else {
                imagesSection.innerHTML = '';
                imagesSection.classList.add('hidden');
            }
        }

        // Fill related projects carousel (NEW FROM CURRENT)
        fillRelatedProjects(pin);
        collapseConsecutiveDividers();

        // Re-apply i18n labels inside the panel so they're always in the current language,
        // even when fillPinDetails is called outside of applyLanguage().
        panel.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = t(key);
        });
        panel.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', t(el.dataset.i18nAria));
        });
    }

    function collapseConsecutiveDividers() {
        const inner = document.querySelector('#project-panel .project-panel-inner');
        if (!inner) return;

        const children = Array.from(inner.children);

        // Reset all static dividers so we can re-evaluate
        children.forEach(el => {
            if (el.classList.contains('project-panel-divider') &&
                el.id !== 'related-divider') {
                el.classList.remove('hidden');
            }
        });

        function isEffectivelyVisible(el) {
            if (el.classList.contains('hidden')) return false;
            // Meta wrapper has no hidden class but is empty when all rows are hidden
            if (el.classList.contains('project-panel-meta')) {
                return Array.from(el.querySelectorAll('.project-meta-row'))
                    .some(row => !row.classList.contains('hidden'));
            }
            return true;
        }

        // Suppress consecutive dividers — keep only the first of each run
        let prevWasDivider = false;
        for (const el of children) {
            if (!isEffectivelyVisible(el)) continue;
            const isDivider = el.classList.contains('project-panel-divider');
            if (isDivider) {
                if (prevWasDivider) {
                    el.classList.add('hidden');
                } else {
                    prevWasDivider = true;
                }
            } else {
                prevWasDivider = false;
            }
        }

        // Suppress a trailing divider (last visible element is a divider)
        for (let i = children.length - 1; i >= 0; i--) {
            if (!isEffectivelyVisible(children[i])) continue;
            if (children[i].classList.contains('project-panel-divider')) {
                children[i].classList.add('hidden');
            }
            break;
        }
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
            name.textContent = (currentLang === 'en' && relPin.title_en) ? relPin.title_en : relPin.title;

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
                dot.setAttribute('aria-label', `${t('carouselDotLabel')} ${i + 1}`);
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
        currentOpenPin = pin;
        fillPinDetails(pin);
        panel.classList.remove('panel-search-mode', 'panel-pin-from-search');
        panel.classList.add('panel-open');
        panel.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('project-panel-open');
        setSelectedPin(pin.id);
    }

    function closeProjectPanel() {
        const panel = document.getElementById('project-panel');
        if (!panel) return;
        currentOpenPin = null;
        panel.classList.remove('panel-open', 'panel-search-mode', 'panel-pin-from-search');
        panel.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('project-panel-open');
        setSelectedPin(null);
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

    // ── Search ───────────────────────────────────────────────────────────────

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

        const taxonomies = pin.taxonomies || {};
        for (const terms of Object.values(taxonomies)) {
            if (!Array.isArray(terms)) continue;
            for (const term of terms) {
                const heName = (term.name || '').toLowerCase();
                const enName = termLabel(term.name || '').toLowerCase();
                if (heName === query || enName === query)             return 60;
                if (heName.includes(query) || enName.includes(query)) return 30;
            }
        }
        return 0;
    }

    function getExcerpt(text, query, maxLen) {
        maxLen = maxLen || 110;
        const clean = text.replace(/<[^>]*>/g, '');
        const lower = clean.toLowerCase();
        const idx   = lower.indexOf(query);
        if (idx === -1) return clean.slice(0, maxLen) + (clean.length > maxLen ? '…' : '');
        const start = Math.max(0, idx - 35);
        const end   = Math.min(clean.length, idx + query.length + 75);
        return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
    }

    function openSearchResults(results, query) {
        const panel = document.getElementById('project-panel');
        if (!panel) return;

        lastSearchQuery = query;
        document.getElementById('search-results-title').textContent =
            `${t('searchResultsTitle')} "${query}" (${results.length})`;

        const list = document.getElementById('search-results-list');
        list.innerHTML = '';

        if (results.length === 0) {
            const li = document.createElement('li');
            li.className = 'search-result-empty';
            li.textContent = t('noResults');
            list.appendChild(li);
        } else {
            results.forEach(function (pin) {
                const li = document.createElement('li');
                li.className = 'search-result-item';

                const isEn         = currentLang === 'en';
                const displayTitle = (isEn && pin.title_en)   ? pin.title_en   : pin.title;
                const displayBody  = (isEn && pin.content_en) ? pin.content_en : pin.content;

                const titleBtn = document.createElement('button');
                titleBtn.className = 'search-result-title';
                titleBtn.textContent = displayTitle;
                titleBtn.addEventListener('click', function () { openPinFromSearch(pin); });

                const excerpt = document.createElement('p');
                excerpt.className = 'search-result-excerpt';
                excerpt.textContent = getExcerpt(displayBody || '', query);

                li.appendChild(titleBtn);
                if (displayBody) li.appendChild(excerpt);
                list.appendChild(li);
            });
        }

        panel.classList.remove('panel-pin-from-search');
        panel.classList.add('panel-search-mode', 'panel-open');
        panel.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('project-panel-open');
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


})();
