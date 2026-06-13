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
            filterCycle:          'מחזור קרן שותפות',
            filterDomain:         'תחום',
            filterAudienceGroup:  'בחר קהל יעד',
            filterLocationGroup:  'בחר מיקום',
            filterCycleGroup:     'בחר מחזור קרן שותפות',
            filterDomainGroup:    'בחר תחום',
            filterPanelAriaLabel: 'פאנל סינון',
            clearAll:             'נקה הכל',
            closeBtnAriaLabel:    'סגור',
            backToResults:        'חזרה לתוצאות',
            backToResultsAriaLabel: 'חזרה לתוצאות החיפוש',
            metaLocation:         'מיקום:',
            metaAudience:         'קהל יעד:',
            metaCycle:            'מחזור קרן שותפות:',
            metaDomain:           'תחום:',
            orgLabel:             'ארגון מפעיל:',
            linkLabel:            'לינק לאתר',
            relatedTitle:         'אולי יעניין אותך גם:',
            carouselPrev:         'הקודם',
            carouselNext:         'הבא',
            carouselDotLabel:     'מיזם',
            searchResultsTitle:   'תוצאות חיפוש',
            noResults:            'לא נמצאו תוצאות',
            fabLabel:             'סינון',
            fabAriaLabel:         'פתח סינון',
            showResults:          'הצג תוצאות',
            scrollHint:           'ניתן לגלול שמאלה וימינה לצפייה במפה המלאה',
        },
        en: {
            panelTitle:           'Partnership Map',
            panelDescription:     'This map displays projects supported by <strong>Keren Shutafut</strong>. These projects promote a shared society and the values of coexistence among the diverse groups that make up Israeli society.<br>Through their work, the projects showcase original and interesting ways to advance tolerance, equality, and a life of partnership in Israel.',
            searchPlaceholder:    'Search project...',
            searchAriaLabel:      'Search projects',
            searchBtnAriaLabel:   'Search',
            filterAudience:       'Target Audience',
            filterLocation:       'Location',
            filterCycle:          'Keren Shutafut Cycle',
            filterDomain:         'Domain',
            filterAudienceGroup:  'Select Target Audience',
            filterLocationGroup:  'Select Location',
            filterCycleGroup:     'Select Keren Shutafut Cycle',
            filterDomainGroup:    'Select Domain',
            filterPanelAriaLabel: 'Filter panel',
            clearAll:             'Clear All',
            closeBtnAriaLabel:    'Close',
            backToResults:        'Back to results',
            backToResultsAriaLabel: 'Back to search results',
            metaLocation:         'Location:',
            metaAudience:         'Target Audience:',
            metaCycle:            'Keren Shutafut Cycle:',
            metaDomain:           'Domain:',
            orgLabel:             'Operating Organization:',
            linkLabel:            'Website',
            relatedTitle:         'You might also like:',
            carouselPrev:         'Previous',
            carouselNext:         'Next',
            carouselDotLabel:     'Project',
            searchResultsTitle:   'Search results',
            noResults:            'No results found',
            fabLabel:             'Filter',
            fabAriaLabel:         'Open filters',
            showResults:          'Show results',
            scrollHint:           'Scroll left and right to view the full map',
        },
        ar: {
            panelTitle:           'خريطة كيرن شوتافوت',
            panelDescription:     'أمامك خريطة تُظهر انتشار المبادرات التي تدعمها <strong>كيرن شوتافوت</strong>. تعمل هذه المبادرات على تعزيز المجتمع المشترك وقيم التعايش بين المجموعات المختلفة التي تُشكّل المجتمع الإسرائيلي.<br>تُبيّن المبادرات في عملها تنوّع الأساليب الأصيلة والمثيرة للاهتمام في تعزيز التسامح والمساواة وحياة الشراكة في إسرائيل.',
            searchPlaceholder:    'ابحث عن مشروع...',
            searchAriaLabel:      'البحث في المشاريع',
            searchBtnAriaLabel:   'بحث',
            filterAudience:       'الجمهور المستهدف',
            filterLocation:       'الموقع',
            filterCycle:          'دورة كيرن شوتافوت',
            filterDomain:         'المجال',
            filterAudienceGroup:  'اختر الجمهور المستهدف',
            filterLocationGroup:  'اختر الموقع',
            filterCycleGroup:     'اختر دورة كيرن شوتافوت',
            filterDomainGroup:    'اختر المجال',
            filterPanelAriaLabel: 'لوحة التصفية',
            clearAll:             'مسح الكل',
            closeBtnAriaLabel:    'إغلاق',
            backToResults:        'العودة إلى النتائج',
            backToResultsAriaLabel: 'العودة إلى نتائج البحث',
            metaLocation:         'الموقع:',
            metaAudience:         'الجمهور المستهدف:',
            metaCycle:            'دورة كيرن شوتافوت:',
            metaDomain:           'المجال:',
            orgLabel:             'المنظمة المشغّلة:',
            linkLabel:            'رابط الموقع',
            relatedTitle:         'قد يهمك أيضاً:',
            carouselPrev:         'السابق',
            carouselNext:         'التالي',
            carouselDotLabel:     'مبادرة',
            searchResultsTitle:   'نتائج البحث',
            noResults:            'لا توجد نتائج',
            fabLabel:             'تصفية',
            fabAriaLabel:         'فتح التصفية',
            showResults:          'عرض النتائج',
            scrollHint:           'يمكنك التمرير يساراً ويميناً لعرض الخريطة الكاملة',
        },
    };

    const TERM_TRANSLATIONS = {
        // geographic_region
        'צפון':                  'North',
        'מרכז':                  'Center',
        'דרום':                  'South',
        'ירושלים':               'Jerusalem',
        'כרמל':                  'Carmel',
        // activity_cycle
        'מחזור א':               'Cycle A',
        'מחזור ב':               'Cycle B',
        'מחזור ג':               'Cycle C',
        'מחזור ד':               'Cycle D',
        'מחזור ה':               'Cycle E',
        'מחזור ו':               'Cycle F',
        // target_audience
        'בני ובנות נוער':        'Youth',
        'דתיים וחילונים':        'Religious and Secular',
        'הגיל הרך':              'Early Childhood',
        'החברה החרדית':          'Haredi Community',
        'יהודים וערבים':         'Jews and Arabs',
        'להט"ב':                 'LGBTQ+',
        'מוגבלויות':             'People with Disabilities',
        'נשים':                  'Women',
        'צעירים וסטודנטים':      'Young Adults and Students',
        'צרכים מיוחדים':         'Special Needs',
        // domains
        'אומנות ותרבות':         'Arts and Culture',
        'השכלה גבוהה':           'Higher Education',
        'חינוך':                 'Education',
        'טבע קיימות וסביבה':     'Nature, Sustainability and Environment',
        'לימוד בין-דתי':         'Interfaith Learning',
        'מוסיקה':                'Music',
        'מנהיגות ויזמות':        'Leadership and Entrepreneurship',
        'ספורט':                 'Sports',
        'קבוצות מנהיגות':        'Leadership Groups',
        'קהילה ורווחה':          'Community and Welfare',
        'שפה':                   'Language',
    };

    const TERM_TRANSLATIONS_AR = {
        // geographic_region
        'צפון':                  'الشمال',
        'מרכז':                  'الوسط',
        'דרום':                  'الجنوب',
        'ירושלים':               'القدس',
        'כרמל':                  'الكرمل',
        'גליל':                  'الجليل',
        'מ. חיפה':               'منطقة حيفا',
        'מ. תל אביב':            'منطقة تل أبيب',
        // activity_cycle
        'מחזור א':               'الدورة الأولى',
        'מחזור ב':               'الدورة الثانية',
        'מחזור ג':               'الدورة الثالثة',
        'מחזור ד':               'الدورة الرابعة',
        'מחזור ה':               'الدورة الخامسة',
        'מחזור ו':               'الدورة السادسة',
        // target_audience
        'יהודים וערבים':         'يهود وعرب',
        'נוער וילדים':           'شباب وأطفال',
        'קהל מגוון':             'جمهور متنوع',
        'נשים':                  'نساء',
        'צעירים וסטודנטים':      'شباب وطلاب',
        'אנשי מקצוע ופעילים':   'متخصصون وناشطون',
        'דתיים וחילונים':        'متدينون وعلمانيون',
        'להט"ב':                 'مجتمع الميم',
        'מוגבלויות':             'أشخاص ذوو إعاقة',
        'בני ובנות נוער':        'شباب وأطفال',
        'הגיל הרך':              'الطفولة المبكرة',
        'החברה החרדית':          'المجتمع الحريدي',
        'צרכים מיוחדים':         'ذوو احتياجات خاصة',
        // domains
        'אומנות ותרבות':         'فنون وثقافة',
        'חינוך':                 'تعليم',
        'טבע וסביבה':            'طبيعة وبيئة',
        'טבע קיימות וסביבה':     'طبيعة واستدامة وبيئة',
        'לימוד בין-דתי':         'تعلّم بين الأديان',
        'מוסיקה':                'موسيقى',
        'מנהיגות ויזמות':        'قيادة وريادة',
        'ספורט':                 'رياضة',
        'קהילה ורווחה':          'مجتمع ورفاه',
        'שפה':                   'لغة',
        'דיאלוג ושיח':           'حوار ونقاش',
        'השכלה גבוהה':           'تعليم عالٍ',
        'קבוצות מנהיגות':        'مجموعات قيادية',
    };

    // Hebrew display overrides (label_overrides from PHP must be mirrored here)
    const HE_LABEL_OVERRIDES = {
        'אנשי מקצוע ופעילים': 'אקטיביסטים',
    };

    const MAP_LABEL_TRANSLATIONS = {
        'תל אביב':     { en: 'Tel Aviv',       ar: 'تل أبيب' },
        'חיפה':        { en: 'Haifa',           ar: 'حيفا' },
        'ירושלים':     { en: 'Jerusalem',       ar: 'القدس' },
        'באר שבע':     { en: 'Beer Sheva',      ar: 'بئر السبع' },
        'לוד':         { en: 'Lod',             ar: 'اللد' },
        'קריית שמונה': { en: 'Kiryat Shmona',  ar: 'كريات شمونة' },
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
        if (currentLang === 'ar') return TERM_TRANSLATIONS_AR[hebrewName] || hebrewName;
        return HE_LABEL_OVERRIDES[hebrewName] || hebrewName;
    }

    function setLang(lang) {
        currentLang = lang;
        localStorage.setItem('ks-lang', lang);
        // Freeze position transitions directly on the elements so the switcher
        // and logo snap instantly on language change instead of sliding.
        const freezeEls = [
            document.querySelector('.lang-switcher'),
            document.querySelector('.map-logo'),
            document.querySelector('.filter-panel'),
            document.getElementById('map-container'),
        ].filter(Boolean);
        freezeEls.forEach(el => { el.style.transition = 'none'; });
        applyLanguage();
        // Double-rAF: first frame paints the snapped positions, second frame
        // restores CSS transitions so they work normally afterwards.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                freezeEls.forEach(el => { el.style.transition = ''; });
            });
        });
        showScrollHint();
    }

    function applyLanguage() {
        const isRtl = currentLang !== 'en';
        const html  = document.documentElement;
        html.setAttribute('data-lang', currentLang);
        html.setAttribute('lang',      currentLang);
        html.setAttribute('dir',       isRtl ? 'rtl' : 'ltr');

        // The filter panel and project panel have inline dir="rtl" which
        // overrides the html-level dir — update them explicitly on lang change.
        const panelDir = isRtl ? 'rtl' : 'ltr';
        document.querySelector('.filter-panel')?.setAttribute('dir', panelDir);
        document.getElementById('project-panel')?.setAttribute('dir', panelDir);
        document.getElementById('ks-bottom-sheet')?.setAttribute('dir', panelDir);

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

        updateMapLabels();

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

    function updateMapLabels() {
        const isEn = currentLang === 'en';
        const isAr = currentLang === 'ar';
        document.querySelectorAll('[data-map-label]').forEach(fo => {
            const key  = fo.dataset.mapLabel;
            const div  = fo.querySelector('div');
            if (!div) return;
            div.innerHTML = '';
            if (isEn || isAr) {
                const tr   = MAP_LABEL_TRANSLATIONS[key];
                const text = tr ? (isEn ? tr.en : tr.ar) : key;
                const p    = document.createElement('p');
                p.style.cssText = 'margin:0;padding:0;';
                p.textContent   = text;
                div.appendChild(p);
                div.style.direction  = isAr ? 'rtl' : 'ltr';
                div.style.fontFamily = isAr ? '"Noto Sans Arabic",sans-serif' : '"Open Sans Hebrew",sans-serif';
            } else {
                const lines = JSON.parse(fo.dataset.mapLabelLines || '[]');
                lines.forEach(line => {
                    const p = document.createElement('p');
                    p.style.cssText = 'margin:0;padding:0;';
                    p.textContent   = line;
                    div.appendChild(p);
                });
                div.style.direction  = 'rtl';
                div.style.fontFamily = '"Open Sans Hebrew",sans-serif';
            }
        });
    }

    function repositionMapContainer() {
        const mapContainer = document.getElementById('map-container');
        const svg          = document.querySelector('#map svg');
        if (!mapContainer) return;

        if (isMobile()) {
            // Split layout: map is always full-width regardless of language
            mapContainer.style.left  = '';
            mapContainer.style.width = '';
            if (svg) svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        } else if (currentLang === 'en') {
            const panelEl    = document.querySelector('.filter-panel');
            const panelWidth = panelEl ? panelEl.offsetWidth : 0;
            if (panelWidth > 0) {
                mapContainer.style.left  = panelWidth + 'px';
                mapContainer.style.width = (window.innerWidth - panelWidth) + 'px';
            }
            // Left-align the SVG in the narrowed container so Israel's western edge
            // starts at the panel border instead of being clipped in the middle.
            if (svg) svg.setAttribute('preserveAspectRatio', 'xMinYMid slice');
        } else {
            mapContainer.style.left  = '';
            mapContainer.style.width = '';
            if (svg) svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        }

        // Kiriat Shemona label has different positions per language
        // because the visible portion of the SVG differs between modes.
        const ksText = svg && svg.querySelector('#kiriat-shemona-text');
        if (ksText) {
            const tspans = ksText.querySelectorAll('tspan');
            if (currentLang === 'en') {
                if (tspans[0]) { tspans[0].setAttribute('x', '150'); tspans[0].setAttribute('y', '-40'); }
                if (tspans[1]) { tspans[1].setAttribute('x', '110'); tspans[1].setAttribute('y', '-40'); }
            } else {
                if (tspans[0]) { tspans[0].setAttribute('x', '50'); tspans[0].setAttribute('y', '-20'); }
                if (tspans[1]) { tspans[1].setAttribute('x', '50'); tspans[1].setAttribute('y', '0'); }
            }
        }
    }

    function initLang() {
        applyLanguage();
        // Reposition after first paint so panel offsetWidth is available
        requestAnimationFrame(repositionMapContainer);
        document.getElementById('lang-switcher')
            ?.addEventListener('click', (e) => {
                const opt = e.target.closest('[data-lang-opt]');
                if (opt) {
                    setLang(opt.dataset.langOpt);
                } else {
                    const next = currentLang === 'he' ? 'en' : currentLang === 'en' ? 'ar' : 'he';
                    setLang(next);
                }
            });
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

    let searchResults       = null; // null = no active search, array = current results
    let currentZoomedRegion = null; // tracks zoom-only state, independent of the filter

    let svgVbWidth  = 0;
    let svgVbHeight = 0;
    const zoomRects = {};

    // ── Boot ─────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        // Safari initialises scrollLeft to a non-zero value on RTL pages;
        // reset before any layout runs so the map is never clipped.
        document.documentElement.scrollLeft = 0;
        document.body.scrollLeft = 0;

        initLang();
        initMap();
        loadPins();
        setupFilters();
        setupSearch();
        setupMobile();
        setupMobileAccordion();
        showScrollHint();
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
                fixHebrewLabels(svg);
                svg.style.direction = 'ltr';
                svg.style.touchAction = 'none';
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                // repositionMapContainer will set the correct value per language;
                // default to xMidYMid for Hebrew until that runs.
                svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                svgVbWidth  = svg.viewBox.baseVal.width;
                svgVbHeight = svg.viewBox.baseVal.height;
            }

            // Ensure map-container is correctly sized after async SVG load
            repositionMapContainer();

            setupMapElements();
            setupRegionInteractivity();
            cacheZoomRects();
            if (svg) setupTouchPan(svg);

            // Initialise the grid manager now that region elements are in the DOM
            if (window.KSM?.GridManager) {
                gridManager = new window.KSM.GridManager();
                gridManager.cacheRegionBounds();
            }

            await loadPinSymbols();
            pinSymbolsReady = true;

            // SVG labels are created by fixHebrewLabels() above — translate them
            // now that the DOM nodes exist, in case a non-Hebrew lang was already set.
            updateMapLabels();

            // If pins already fetched while map was loading, render them now
            if (allPins.length > 0) applyFilters();

        } catch (error) {
            console.error('Error loading SVG:', error);
        }
    }

    // ── Hebrew label fix (Safari SVG BiDi bug) ──────────────────────────────
    // Safari doesn't apply the Unicode BiDi algorithm to SVG <text>, so Hebrew
    // characters render LTR (mirrored). Replacing each <text> with a
    // <foreignObject> containing an HTML element gives correct RTL rendering.

    function fixHebrewLabels(svg) {
        const FONT_SIZE  = 17;
        const LABEL_W    = 160;

        svg.querySelectorAll('text.cls-9').forEach(textEl => {
            const transform = textEl.getAttribute('transform') || '';
            const m = transform.match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
            if (!m) return;

            const tx     = parseFloat(m[1]);
            const ty     = parseFloat(m[2]);
            const tspans = Array.from(textEl.querySelectorAll('tspan'));
            if (!tspans.length) return;

            const ys      = tspans.map(ts => parseFloat(ts.getAttribute('y') || '0'));
            const xs      = tspans.map(ts => parseFloat(ts.getAttribute('x') || '0'));
            const anchorX = tx + xs[0];
            const minY    = Math.min(...ys);
            const maxY    = Math.max(...ys);

            const hebrewLines = tspans.map(ts => ts.textContent.trim());
            const labelText   = hebrewLines.join(' ');
            const offsets = {
                'kiriat-shemona-text': { dx: -40, dy: 20 },
                'חיפה':                { dx:  25, dy:  0 },
            };
            const adj = offsets[textEl.id] || offsets[labelText] || { dx: 0, dy: 0 };

            const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            fo.setAttribute('x', anchorX - LABEL_W / 2 + adj.dx);
            fo.setAttribute('y', ty + minY - FONT_SIZE - 2 + adj.dy);
            fo.setAttribute('width', LABEL_W);
            fo.setAttribute('height', maxY - minY + FONT_SIZE + 8);
            if (textEl.id) fo.id = textEl.id;
            fo.dataset.mapLabel      = labelText;
            fo.dataset.mapLabelLines = JSON.stringify(hebrewLines);

            const div = document.createElement('div');
            div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            div.style.cssText = 'direction:rtl;text-align:center;font-family:"Open Sans Hebrew",sans-serif;font-size:17px;color:#2b4a45;margin:0;padding:0;line-height:1.2;pointer-events:none;';

            tspans.forEach(ts => {
                const p = document.createElement('p');
                p.style.cssText = 'margin:0;padding:0;';
                p.textContent   = ts.textContent.trim();
                div.appendChild(p);
            });

            fo.appendChild(div);
            textEl.parentNode.replaceChild(fo, textEl);
        });
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

        // Reset any touch-pan offset so CSS-transform zoom is applied to the full viewBox
        if (svgVbWidth > 0) {
            svg.viewBox.baseVal.x      = 0;
            svg.viewBox.baseVal.y      = 0;
            svg.viewBox.baseVal.width  = svgVbWidth;
            svg.viewBox.baseVal.height = svgVbHeight;
        }

        if (!regionName) {
            svg.style.transition = 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)';
            svg.style.transform  = 'translate(0px, 0px) scale(1)';
            document.getElementById('map-container')?.classList.remove('zoomed');
            return;
        }

        const rect = zoomRects[regionName];
        if (!rect || svgVbWidth === 0) return;

        // Use the actual map container size — in English it is narrowed to exclude
        // the left-side panel, so all zoom math automatically adapts.
        const mapContainer = document.getElementById('map-container');
        const cw = mapContainer ? mapContainer.offsetWidth  : window.innerWidth;
        const ch = mapContainer ? mapContainer.offsetHeight : window.innerHeight;

        const baseScale = Math.max(cw / svgVbWidth, ch / svgVbHeight);
        // English uses xMinYMid slice (left-aligned) → offsetX = 0.
        // Hebrew uses xMidYMid slice (centered)      → offsetX = (cw - vbW*scale) / 2.
        const baseOffsetX = (currentLang === 'en') ? 0 : (cw - svgVbWidth * baseScale) / 2;
        const baseOffsetY = (ch - svgVbHeight * baseScale) / 2;

        const cx = (rect.x + rect.width  / 2) * baseScale + baseOffsetX;
        const cy = (rect.y + rect.height / 2) * baseScale + baseOffsetY;

        // In Hebrew the panel overlaps the right edge of the full-width container;
        // reduce available width so the zoom centres in the visible area.
        const panelEl      = document.querySelector('.filter-panel');
        // On mobile the panel is a fixed off-screen drawer — offsetWidth equals the full
        // viewport width even when hidden, which would make availW zero or negative.
        const panelOverlap = (!isMobile() && currentLang === 'he' && panelEl) ? panelEl.offsetWidth : 0;
        const availW       = cw - panelOverlap;

        const ZOOM_PAD = 60;
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

                // Clicking a region only zooms — it does not filter pins.
                // All pins remain visible regardless of which region is zoomed.
                if (currentZoomedRegion === regionName) {
                    currentZoomedRegion = null;
                    syncMapRegionSelection(null);
                    zoomToRegion(null);
                } else {
                    currentZoomedRegion = regionName;
                    syncMapRegionSelection(regionName);
                    zoomToRegion(regionName);
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
        currentZoomedRegion = null;
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
        updateFilterBadge();
        updateMobileClearBtn();
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
                const title = currentLang === 'ar' ? (pin.title_ar || pin.title) :
                              currentLang === 'en' ? (pin.title_en || pin.title) : pin.title;
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
        // Manually positioned pins always use their saved SVG coordinates exactly.
        if (pin.manually_positioned && pin.svg_x != null && pin.svg_y != null) {
            return { x: pin.svg_x, y: pin.svg_y };
        }

        // Attempt coordinate-based placement via GridManager
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

        const isEn = currentLang === 'en';
        const isAr = currentLang === 'ar';
        const displayTitle = isAr ? (pin.title_ar       || pin.title)         :
                             isEn ? (pin.title_en        || pin.title)         : pin.title;
        const displayDesc  = isAr ? (pin.description_ar || pin.content)       :
                             isEn ? (pin.content_en      || pin.content)       : pin.content;
        const displayOrg   = isAr ? (pin.operating_org_ar || pin.operating_org) :
                             isEn ? (pin.operating_org_en || pin.operating_org) : pin.operating_org;
        const displayLoc   = isAr ? (pin.location_ar    || pin.location)      :
                             isEn ? (pin.location_en    || pin.location)      : pin.location;

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
                const img = document.createElement('img');
                img.src       = pin.featured_image;
                img.alt       = pin.title;
                img.className = 'project-image';
                img.loading   = 'lazy';
                imagesSection.innerHTML = '';
                imagesSection.appendChild(img);
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
            name.textContent = currentLang === 'ar' ? (relPin.title_ar || relPin.title) :
                               currentLang === 'en' ? (relPin.title_en || relPin.title) : relPin.title;

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
        if (isMobile()) {
            currentOpenPin = pin;
            showMobilePinDetail(pin);
            setSelectedPin(pin.id);
            return;
        }
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
        currentOpenPin = null;
        setSelectedPin(null);
        if (isMobile()) {
            closeMobilePinDetail();
            return;
        }
        const panel = document.getElementById('project-panel');
        if (!panel) return;
        panel.classList.remove('panel-open', 'panel-search-mode', 'panel-pin-from-search');
        panel.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('project-panel-open');
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

    // Close when clicking the map background (not a pin), and zoom out if zoomed in
    document.getElementById('map-container')?.addEventListener('click', function (e) {
        if (!e.target.closest('.map-pin')) closeProjectPanel();
        if (!e.target.closest('.map-pin') && activeFilters.geographic !== null) {
            setGeoFilter(null);
        }
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
        if (isMobile()) {
            showMobileSearchResults(searchResults, query);
        } else {
            openSearchResults(searchResults, query);
        }
    }

    // Returns the Levenshtein edit distance between two strings.
    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = [];
        for (let i = 0; i <= m; i++) { dp[i] = [i]; }
        for (let j = 0; j <= n; j++) { dp[0][j] = j; }
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n];
    }

    // Returns true if query appears in text with at most `maxDist` edits,
    // checked against each word and against sliding substrings of similar length.
    function fuzzyContains(text, query) {
        if (!text || !query) return false;
        if (text.includes(query)) return true;
        const q = query.length;
        // Allow 1 edit for queries ≥4 chars, 2 edits for queries ≥7 chars.
        const maxDist = q < 4 ? 0 : q < 7 ? 1 : 2;
        if (maxDist === 0) return false;
        // Check each whitespace-separated word.
        for (const word of text.split(/\s+/)) {
            if (Math.abs(word.length - q) <= maxDist && levenshtein(word, query) <= maxDist) return true;
        }
        // Check sliding substrings (catches partial matches inside longer words).
        for (let i = 0; i <= text.length - q + maxDist; i++) {
            for (let len = Math.max(1, q - maxDist); len <= q + maxDist; len++) {
                const sub = text.slice(i, i + len);
                if (sub.length >= q - maxDist && levenshtein(sub, query) <= maxDist) return true;
            }
        }
        return false;
    }

    function scorePin(pin, query) {
        const title = (pin.title   || '').toLowerCase();
        const desc  = (pin.content || '').toLowerCase();
        if (title === query)        return 100;
        if (title.includes(query))  return 80;
        if (fuzzyContains(title, query)) return 60;
        if (desc.includes(query))   return 40;
        if (fuzzyContains(desc, query))  return 20;

        const taxonomies = pin.taxonomies || {};
        for (const terms of Object.values(taxonomies)) {
            if (!Array.isArray(terms)) continue;
            for (const term of terms) {
                const heName = (term.name || '').toLowerCase();
                const enName = termLabel(term.name || '').toLowerCase();
                if (heName === query || enName === query)             return 60;
                if (heName.includes(query) || enName.includes(query)) return 30;
                if (fuzzyContains(heName, query) || fuzzyContains(enName, query)) return 15;
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
                const isAr         = currentLang === 'ar';
                const displayTitle = isAr ? (pin.title_ar       || pin.title)   :
                                     isEn ? (pin.title_en        || pin.title)   : pin.title;
                const displayBody  = isAr ? (pin.description_ar || pin.content) :
                                     isEn ? (pin.content_en      || pin.content) : pin.content;

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
        if (isMobile()) { showMobilePinDetailFromSearch(pin); return; }
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

    // ── Mobile scroll hint toast ─────────────────────────────────────────────

    const scrollHintShown = { he: false, en: false, ar: false };

    function showScrollHint() {
        if (!isMobile()) return;
        const lang = currentLang || 'he';
        if (scrollHintShown[lang]) return;
        scrollHintShown[lang] = true;
        const toast = document.getElementById('ks-scroll-hint');
        if (!toast) return;
        toast.textContent = (TRANSLATIONS[lang] || TRANSLATIONS.he).scrollHint;
        toast.classList.remove('is-visible');
        setTimeout(function () {
            toast.classList.add('is-visible');
            setTimeout(function () {
                toast.classList.remove('is-visible');
            }, 3500);
        }, 800);
    }

    // ── Mobile helpers ───────────────────────────────────────────────────────

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function updateFilterBadge() {
        const badge = document.getElementById('ks-fab-badge');
        if (!badge) return;
        const count = Object.values(activeFilters).filter(v => v !== null).length;
        if (count > 0) {
            badge.textContent = String(count);
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    }

    function updateMobileClearBtn() {
        if (!isMobile()) return;
        const btn = document.querySelector('.ks-filter-clear-mobile');
        if (!btn) return;
        const hasActive = Object.values(activeFilters).some(v => v !== null);
        btn.classList.toggle('is-visible', hasActive);
    }

    function setupMobile() {
        const fab      = document.getElementById('ks-filter-fab');
        const panel    = document.getElementById('ks-filter-panel');
        const overlay  = document.getElementById('ks-overlay');
        const sheet    = document.getElementById('ks-bottom-sheet');
        if (!fab || !panel || !overlay) return;

        const closeBtn = panel.querySelector('.ks-filter-close');

        function restoreToFilterPanel() {
            if (!panel.dataset.originalContent) return;
            panel.innerHTML = panel.dataset.originalContent;
            delete panel.dataset.originalContent;
            delete panel.dataset.searchContent;
            reinitFilterPanel();
            setSelectedPin(null);
            currentOpenPin = null;
        }

        function openFilterPanel() {
            restoreToFilterPanel();   // always show main filters, not stale pin/search view
            panel.classList.add('is-open');
            overlay.classList.add('is-active');
            panel.setAttribute('aria-hidden', 'false');
        }

        function closeFilterPanel() {
            panel.classList.remove('is-open');
            panel.setAttribute('aria-hidden', 'true');
            if (!sheet?.classList.contains('is-open')) {
                overlay.classList.remove('is-active');
            }
        }

        const hamburgerBtn = document.getElementById('ks-hamburger-btn');
        hamburgerBtn?.addEventListener('click', openFilterPanel);

        fab.addEventListener('click', openFilterPanel);
        closeBtn?.addEventListener('click', closeFilterPanel);

        // Delegated — survives innerHTML replacement (pin detail / search results)
        document.addEventListener('click', function (e) {
            if (!isMobile()) return;
            if (e.target.closest('.ks-filter-apply')) {
                closeFilterPanel();
            } else if (e.target.closest('.ks-filter-clear-mobile')) {
                clearAllFilters();
                closeFilterPanel();
            }
        });

        overlay.addEventListener('click', function () {
            closeFilterPanel();
            closeBottomSheet();
        });

        // Swipe-down on filter panel to dismiss
        let startY = 0;
        panel.addEventListener('touchstart', function (e) {
            startY = e.touches[0].clientY;
        }, { passive: true });
        panel.addEventListener('touchend', function (e) {
            if (e.changedTouches[0].clientY - startY > 60) closeFilterPanel();
        }, { passive: true });

        // Swipe-down on bottom sheet to dismiss
        if (sheet) {
            let sheetStartY = 0;
            sheet.addEventListener('touchstart', function (e) {
                sheetStartY = e.touches[0].clientY;
            }, { passive: true });
            sheet.addEventListener('touchend', function (e) {
                if (e.changedTouches[0].clientY - sheetStartY > 60) closeBottomSheet();
            }, { passive: true });
        }

        // Delegated touchend on map — eliminates iOS 300ms click delay on pins
        document.getElementById('map')?.addEventListener('touchend', function (e) {
            const pinEl = e.target.closest('.map-pin');
            if (pinEl) {
                e.preventDefault();
                pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
        }, { passive: false });
    }

    // ── Issue 5: One-at-a-time accordion on mobile ───────────────────────────
    function setupMobileAccordion() {
        if (!isMobile()) return;
        document.querySelectorAll('.collapsible-header').forEach(function (header) {
            header.addEventListener('click', function () {
                const group = header.closest('.collapsible-group');
                // After the existing toggle listener fires, check if this group is now open
                requestAnimationFrame(function () {
                    if (!group.classList.contains('is-collapsed')) {
                        // Close all other groups
                        document.querySelectorAll('.collapsible-group').forEach(function (other) {
                            if (other !== group && !other.classList.contains('is-collapsed')) {
                                other.classList.add('is-collapsed');
                                const otherHeader = other.querySelector('.collapsible-header');
                                if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                            }
                        });
                    }
                });
            });
        });
    }

    function openBottomSheet(pin) {
        const sheet   = document.getElementById('ks-bottom-sheet');
        const inner   = document.getElementById('ks-bottom-sheet-inner');
        const overlay = document.getElementById('ks-overlay');
        if (!sheet || !inner) return;

        inner.innerHTML = '';

        const lang = document.documentElement.getAttribute('data-lang') || 'he';
        const t    = TRANSLATIONS[lang] || TRANSLATIONS.he;

        const getTerms = (taxonomy) => {
            const terms = pin.taxonomies?.[taxonomy];
            if (!Array.isArray(terms)) return '';
            return terms.map(term => {
                const name = typeof term === 'object' ? term.name : term;
                return (lang === 'en' && TERM_TRANSLATIONS[name]) ? TERM_TRANSLATIONS[name] : name;
            }).join(', ');
        };

        const titleEl = document.createElement('h2');
        titleEl.className = 'ks-bs-title';
        titleEl.textContent = pin.title;
        inner.appendChild(titleEl);

        if (pin.description) {
            const desc = document.createElement('p');
            desc.className = 'ks-bs-desc';
            desc.textContent = pin.description;
            inner.appendChild(desc);
        }

        const addMeta = (label, value) => {
            if (!value) return;
            const row = document.createElement('div');
            row.className = 'ks-bs-meta-row';
            const strong = document.createElement('strong');
            strong.textContent = label + ' ';
            const span = document.createElement('span');
            span.textContent = value;
            row.appendChild(strong);
            row.appendChild(span);
            inner.appendChild(row);
        };

        addMeta(t.metaLocation, getTerms('geographic_region'));
        addMeta(t.metaAudience, getTerms('target_audience'));
        addMeta(t.metaCycle,    getTerms('activity_cycle'));
        addMeta(t.metaDomain,   getTerms('domains'));

        if (pin.organization) {
            const orgRow = document.createElement('p');
            orgRow.className = 'ks-bs-org';
            const orgLabel = document.createElement('span');
            orgLabel.className = 'ks-bs-org-label';
            orgLabel.textContent = t.orgLabel + ' ';
            const orgName = document.createElement('span');
            orgName.textContent = pin.organization;
            orgRow.appendChild(orgLabel);
            orgRow.appendChild(orgName);
            inner.appendChild(orgRow);
        }

        if (pin.website) {
            const link = document.createElement('a');
            link.href       = pin.website;
            link.target     = '_blank';
            link.rel        = 'noopener noreferrer';
            link.className  = 'ks-bs-link';
            link.textContent = t.linkLabel;
            inner.appendChild(link);
        }

        sheet.classList.add('is-open');
        sheet.setAttribute('aria-hidden', 'false');
        overlay?.classList.add('is-active');
    }

    function closeBottomSheet() {
        const sheet   = document.getElementById('ks-bottom-sheet');
        const overlay = document.getElementById('ks-overlay');
        const panel   = document.getElementById('ks-filter-panel');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        sheet.setAttribute('aria-hidden', 'true');
        if (!panel?.classList.contains('is-open')) {
            overlay?.classList.remove('is-active');
        }
    }

    // ── Mobile pin detail ────────────────────────────────────────────────────

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function openMobileDrawer() {
        const panel   = document.getElementById('ks-filter-panel');
        const overlay = document.getElementById('ks-overlay');
        if (!panel) return;
        panel.classList.add('is-open');
        overlay?.classList.add('is-active');
    }

    function showMobilePinDetail(pin) {
        if (!isMobile()) return;
        const panel = document.getElementById('ks-filter-panel');
        if (!panel) return;

        const lang = document.documentElement.getAttribute('data-lang') || 'he';
        const isEn = lang === 'en';
        const isAr = lang === 'ar';
        const backLabel = isEn ? '← Back to filters' : isAr ? '← العودة إلى التصفية' : '← חזרה לסינון';

        const name    = escapeHtml(isAr ? (pin.title_ar       || pin.title)         :
                                   isEn ? (pin.title_en        || pin.title)         : pin.title);
        const org     = escapeHtml(isAr ? (pin.operating_org_ar || pin.operating_org) :
                                   isEn ? (pin.operating_org_en || pin.operating_org) : pin.operating_org);
        const loc     = escapeHtml(isEn ? (pin.location_en    || pin.location)      : pin.location);
        const desc    = escapeHtml(isAr ? (pin.description_ar || pin.content)       :
                                   isEn ? (pin.content_en      || pin.content)       : pin.content);
        const link    = pin.project_link || '';
        const linkLabel = isEn ? 'Visit project' : isAr ? 'زيارة الموقع' : 'לאתר הפרויקט';

        const metaParts = [org, loc].filter(Boolean);

        // Only capture the filter panel HTML the first time — don't overwrite with a
        // previous pin's detail if the user taps another pin without going back first.
        if (!panel.dataset.originalContent) {
            panel.dataset.originalContent = panel.innerHTML;
        }

        panel.innerHTML =
            '<div class="ks-pin-detail">' +
                '<button class="ks-pin-back" id="ks-pin-back-btn">' + backLabel + '</button>' +
                '<h2 class="ks-pin-name">' + name + '</h2>' +
                (metaParts.length ? '<p class="ks-pin-meta">' + metaParts.join(' · ') + '</p>' : '') +
                (pin.featured_image ? '<img class="ks-pin-image" src="' + escapeHtml(pin.featured_image) + '" alt="' + name + '" loading="lazy">' : '') +
                (desc ? '<p class="ks-pin-description">' + desc + '</p>' : '') +
                (link ? '<a href="' + escapeHtml(link) + '" class="ks-pin-link" target="_blank" rel="noopener">' + linkLabel + '</a>' : '') +
            '</div>';

        openMobileDrawer();
        document.getElementById('ks-pin-back-btn')?.addEventListener('click', closeMobilePinDetail);
    }

    function closeMobilePinDetail() {
        if (!isMobile()) return;
        const panel = document.getElementById('ks-filter-panel');
        if (!panel || !panel.dataset.originalContent) return;
        panel.innerHTML = panel.dataset.originalContent;
        delete panel.dataset.originalContent;
        reinitFilterPanel();
        setSelectedPin(null);
        currentOpenPin = null;
        // Keep the drawer open — user is back at the filter panel
    }

    function syncRadioButtonsToActiveFilters() {
        document.querySelectorAll('.filter-options-grid input[type="radio"]').forEach(function (input) {
            const filterType = input.dataset.filter;
            const term       = input.dataset.term;
            if (filterType && term) {
                input.checked = (activeFilters[filterType] === term);
            }
        });
    }

    function reinitFilterPanel() {
        // Re-attach filter radio listeners (destroyed when innerHTML was replaced)
        setupFilters();

        // Re-apply checked state — innerHTML round-trips lose the .checked property
        syncRadioButtonsToActiveFilters();

        // Re-attach collapsible header listeners
        document.querySelectorAll('.collapsible-header').forEach(function (header) {
            function toggle() {
                const group = header.closest('.collapsible-group');
                const isCollapsed = group.classList.toggle('is-collapsed');
                header.setAttribute('aria-expanded', String(!isCollapsed));
            }
            header.addEventListener('click', toggle);
            header.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });

        // Re-attach one-at-a-time accordion (Issue 5)
        setupMobileAccordion();

        // Re-sync the clear button state
        updateMobileClearBtn();
    }

    // ── Mobile search results ────────────────────────────────────────────────

    function showMobileSearchResults(results, query) {
        if (!isMobile()) return;
        const panel = document.getElementById('ks-filter-panel');
        if (!panel) return;

        const lang  = document.documentElement.getAttribute('data-lang') || 'he';
        const isEn  = lang === 'en';
        const isAr  = lang === 'ar';
        const backLabel = isEn ? '← Back to filters' : isAr ? '← العودة إلى التصفية' : '← חזרה לסינון';
        const title     = isEn ? 'Search: "' + query + '" (' + results.length + ')' :
                          isAr ? 'بحث: "' + query + '" (' + results.length + ')' :
                                 'חיפוש: "' + query + '" (' + results.length + ')';
        const emptyMsg  = isEn ? 'No results found' : isAr ? 'لا توجد نتائج' : 'לא נמצאו תוצאות';

        panel.dataset.originalContent = panel.innerHTML;

        let html =
            '<div class="ks-search-results">' +
            '<button class="ks-pin-back" id="ks-search-back-btn">' + escapeHtml(backLabel) + '</button>' +
            '<p class="ks-search-results-title">' + escapeHtml(title) + '</p>';

        if (results.length === 0) {
            html += '<p class="ks-search-empty">' + escapeHtml(emptyMsg) + '</p>';
        } else {
            html += '<ul class="ks-search-results-list">';
            results.forEach(function (pin) {
                const displayTitle = isAr ? (pin.title_ar       || pin.title)   :
                                     isEn ? (pin.title_en        || pin.title)   : pin.title;
                const displayBody  = isAr ? (pin.description_ar || pin.content) :
                                     isEn ? (pin.content_en      || pin.content) : pin.content;
                const excerpt      = getExcerpt(displayBody || '', query);
                html +=
                    '<li class="ks-search-result-item" data-pin-id="' + escapeHtml(String(pin.id)) + '">' +
                    '<button class="ks-search-result-title">' + escapeHtml(displayTitle) + '</button>' +
                    (displayBody ? '<p class="ks-search-result-excerpt">' + escapeHtml(excerpt) + '</p>' : '') +
                    '</li>';
            });
            html += '</ul>';
        }
        html += '</div>';

        panel.innerHTML = html;
        openMobileDrawer();
        wireSearchResultsPanel(panel);
    }

    function wireSearchResultsPanel(panel) {
        panel.querySelector('#ks-search-back-btn')?.addEventListener('click', closeMobileSearchResults);
        panel.querySelectorAll('.ks-search-result-item').forEach(function (item) {
            const pinId = Number(item.dataset.pinId);
            const pin   = allPins.find(function (p) { return p.id === pinId; });
            if (!pin) return;
            item.querySelector('.ks-search-result-title')?.addEventListener('click', function () {
                showMobilePinDetailFromSearch(pin);
            });
        });
    }

    function closeMobileSearchResults() {
        const panel = document.getElementById('ks-filter-panel');
        if (!panel || !panel.dataset.originalContent) return;
        panel.innerHTML = panel.dataset.originalContent;
        delete panel.dataset.originalContent;
        searchResults = null;
        reinitFilterPanel();
        applyFilters();
    }

    function showMobilePinDetailFromSearch(pin) {
        if (!isMobile()) return;
        const panel = document.getElementById('ks-filter-panel');
        if (!panel) return;

        const lang  = document.documentElement.getAttribute('data-lang') || 'he';
        const isEn  = lang === 'en';
        const isAr  = lang === 'ar';
        const backLabel = isEn ? '← Back to results' : isAr ? '← العودة إلى النتائج' : '← חזרה לתוצאות';
        const name      = escapeHtml(isAr ? (pin.title_ar       || pin.title)         :
                                     isEn ? (pin.title_en        || pin.title)         : pin.title);
        const org       = escapeHtml(isAr ? (pin.operating_org_ar || pin.operating_org) :
                                     isEn ? (pin.operating_org_en || pin.operating_org) : pin.operating_org);
        const loc       = escapeHtml(isEn ? (pin.location_en    || pin.location)      : pin.location);
        const desc      = escapeHtml(isAr ? (pin.description_ar || pin.content)       :
                                     isEn ? (pin.content_en      || pin.content)       : pin.content);
        const link      = pin.project_link || '';
        const linkLabel = isEn ? 'Visit project' : isAr ? 'زيارة الموقع' : 'לאתר הפרויקט';
        const metaParts = [org, loc].filter(Boolean);

        // Stash the search results HTML so the back button can restore it
        panel.dataset.searchContent = panel.innerHTML;

        panel.innerHTML =
            '<div class="ks-pin-detail">' +
            '<button class="ks-pin-back" id="ks-pin-back-btn">' + backLabel + '</button>' +
            '<h2 class="ks-pin-name">' + name + '</h2>' +
            (metaParts.length ? '<p class="ks-pin-meta">' + metaParts.join(' · ') + '</p>' : '') +
            (pin.featured_image ? '<img class="ks-pin-image" src="' + escapeHtml(pin.featured_image) + '" alt="' + name + '" loading="lazy">' : '') +
            (desc ? '<p class="ks-pin-description">' + desc + '</p>' : '') +
            (link ? '<a href="' + escapeHtml(link) + '" class="ks-pin-link" target="_blank" rel="noopener">' + linkLabel + '</a>' : '') +
            '</div>';

        document.getElementById('ks-pin-back-btn')?.addEventListener('click', function () {
            panel.innerHTML = panel.dataset.searchContent;
            delete panel.dataset.searchContent;
            wireSearchResultsPanel(panel);
        });

        setSelectedPin(pin.id);
        currentOpenPin = pin;
    }

    // ── Mobile touch pan ─────────────────────────────────────────────────────
    // Lets the user drag the map to see different parts of Israel on small screens.
    // Uses direct viewBox mutation so it composes cleanly with the CSS-transform
    // region zoom (which resets the viewBox via zoomToRegion before applying).

    function setupTouchPan(svg) {
        if (!svg) return;

        // ── Shared helpers ────────────────────────────────────────────────────

        function snapVb() {
            const vb = svg.viewBox.baseVal;
            return { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
        }

        // With xMidYMid slice the binding axis fills the container exactly.
        // The pixel→SVG ratio is the MIN of the two per-axis ratios.
        function p2s(vb, rect) {
            return Math.min(vb.w / rect.width, vb.h / rect.height);
        }

        // Screen coords (relative to SVG element) → SVG content coords
        function screenToSVG(sx, sy, vb, rect) {
            const ratio = p2s(vb, rect);
            return {
                x: (sx - rect.width  / 2) * ratio + (vb.x + vb.w / 2),
                y: (sy - rect.height / 2) * ratio + (vb.y + vb.h / 2),
            };
        }

        function pinchDist(e) {
            return Math.hypot(
                e.touches[1].clientX - e.touches[0].clientX,
                e.touches[1].clientY - e.touches[0].clientY
            );
        }

        // Clamp viewBox so xMidYMid never shows blank background
        function clampedVb(x, y, w, h, rect) {
            const ratio    = Math.min(w / rect.width, h / rect.height);
            const visibleW = rect.width  * ratio;
            const visibleH = rect.height * ratio;
            const halfW    = (w - visibleW) / 2;
            const halfH    = (h - visibleH) / 2;
            return {
                x: Math.max(-halfW, Math.min(halfW, x)),
                y: Math.max(-halfH, Math.min(halfH, y)),
                w, h,
            };
        }

        function applyVb(c) {
            const vb   = svg.viewBox.baseVal;
            vb.x       = c.x;
            vb.y       = c.y;
            vb.width   = c.w;
            vb.height  = c.h;
        }

        // ── State ─────────────────────────────────────────────────────────────

        let panStartX  = 0;
        let panStartY  = 0;
        let panStartVb = null;

        let pinchStartDist  = 0;
        let pinchStartVb    = null;
        let pinchFocus      = null;   // SVG coords of pinch midpoint at gesture start

        const MIN_ZOOM = 1;           // 1× = full map visible (original viewBox)
        const MAX_ZOOM = 5;           // 5× maximum zoom in

        // ── Listeners ─────────────────────────────────────────────────────────

        svg.addEventListener('touchstart', function (e) {
            if (e.touches.length === 2) {
                e.preventDefault();   // block browser pinch-zoom

                pinchStartDist = pinchDist(e);
                pinchStartVb   = snapVb();
                panStartVb     = null;   // cancel any active pan

                const rect  = svg.getBoundingClientRect();
                const midX  = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const midY  = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                pinchFocus  = screenToSVG(midX, midY, pinchStartVb, rect);

            } else if (e.touches.length === 1) {
                if (e.target.closest('.map-pin, .clickable-region, [id$="_click_pad"]')) return;
                if (activeFilters.geographic) return;

                panStartX  = e.touches[0].clientX;
                panStartY  = e.touches[0].clientY;
                panStartVb = snapVb();
            }
        }, { passive: false });

        svg.addEventListener('touchmove', function (e) {
            e.preventDefault();

            if (e.touches.length === 2 && pinchStartVb) {
                // ── Pinch zoom ────────────────────────────────────────────────
                const rawScale = pinchDist(e) / pinchStartDist;
                const origW    = svgVbWidth;
                const origH    = svgVbHeight;

                // Clamp to allowed zoom range
                const clampedW = Math.max(origW / MAX_ZOOM, Math.min(origW / MIN_ZOOM, pinchStartVb.w / rawScale));
                const clampedH = pinchStartVb.h * (clampedW / pinchStartVb.w);
                const s        = pinchStartVb.w / clampedW;   // effective scale

                // Zoom around the focus point: newX = focusX*(1-1/s) + startX/s
                const newX = pinchFocus.x * (1 - 1 / s) + pinchStartVb.x / s;
                const newY = pinchFocus.y * (1 - 1 / s) + pinchStartVb.y / s;

                const rect = svg.getBoundingClientRect();
                applyVb(clampedVb(newX, newY, clampedW, clampedH, rect));

            } else if (e.touches.length === 1 && panStartVb) {
                // ── Single-finger pan ─────────────────────────────────────────
                if (activeFilters.geographic) { panStartVb = null; return; }

                const dx     = e.touches[0].clientX - panStartX;
                const dy     = e.touches[0].clientY - panStartY;
                const rect   = svg.getBoundingClientRect();
                const ratio  = p2s(panStartVb, rect);

                applyVb(clampedVb(
                    panStartVb.x - dx * ratio,
                    panStartVb.y - dy * ratio,
                    panStartVb.w,
                    panStartVb.h,
                    rect
                ));
            }
        }, { passive: false });

        svg.addEventListener('touchend', function (e) {
            if (e.touches.length < 2) {
                pinchStartVb = null;
                pinchFocus   = null;
            }
            if (e.touches.length === 0) {
                panStartVb = null;
            }
            // Finger lifted from pinch → resume pan from current position
            if (e.touches.length === 1 && !panStartVb) {
                if (e.target.closest('.map-pin, .clickable-region, [id$="_click_pad"]')) return;
                panStartX  = e.touches[0].clientX;
                panStartY  = e.touches[0].clientY;
                panStartVb = snapVb();
            }
        }, { passive: true });
    }


})();

