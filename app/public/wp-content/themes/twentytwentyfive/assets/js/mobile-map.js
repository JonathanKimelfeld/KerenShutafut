/**
 * Mobile map enhancements:
 *   - Injects a map/list view segmented control above the map on mobile only
 *   - Persists chosen view in localStorage key "shutafut_view_mode"
 *   - Map view : map (50 vh) stacked above the scrollable sidebar
 *   - List view: map hidden, sidebar fills the full viewport
 *
 * Runs only when window.innerWidth ≤ 768 px.
 * Does NOT modify any existing CSS or JS files.
 */

(function () {
    'use strict';

    var BREAKPOINT  = 768;
    var STORAGE_KEY = 'shutafut_view_mode';

    function isMobile() {
        return window.innerWidth <= BREAKPOINT;
    }

    // ── Boot ──────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        if (!isMobile()) return;

        // Confirm RTL on <html> for Hebrew (map.js sets this too, but guard here)
        if (!document.documentElement.getAttribute('dir')) {
            document.documentElement.setAttribute('dir', 'rtl');
        }

        injectToggle();
        restoreView();
    });

    // ── Inject segmented control ──────────────────────────────────────────────

    function injectToggle() {
        if (document.getElementById('mobile-view-toggle')) return;

        var mapPage      = document.querySelector('.map-page');
        var mapContainer = document.getElementById('map-container');
        if (!mapPage || !mapContainer) return;

        var toggle = document.createElement('div');
        toggle.id  = 'mobile-view-toggle';

        // RTL: first button appears on the right (map), second on the left (list)
        toggle.innerHTML =
            '<button data-view="map" class="active">🗺 מפה</button>' +
            '<button data-view="list">☰ רשימה</button>';

        mapPage.insertBefore(toggle, mapContainer);

        toggle.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-view]');
            if (btn) setView(btn.getAttribute('data-view'));
        });
    }

    // ── Apply / restore view ──────────────────────────────────────────────────

    function setView(mode) {
        var mapPage = document.querySelector('.map-page');
        if (!mapPage) return;

        if (mode === 'list') {
            mapPage.classList.add('list-view');
        } else {
            mapPage.classList.remove('list-view');
        }

        // Sync button active states
        document.querySelectorAll('#mobile-view-toggle button').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
        });

        localStorage.setItem(STORAGE_KEY, mode);

        // Let map.js recalculate SVG dimensions after the container changes size
        window.dispatchEvent(new Event('resize'));
    }

    function restoreView() {
        var saved = localStorage.getItem(STORAGE_KEY);
        // Default is map view; only switch if explicitly saved as 'list'
        setView(saved === 'list' ? 'list' : 'map');
    }

}());
