/**
 * Keren Shutafut Map – Coordinate Utilities
 *
 * Exports to window.KSM:
 *   latLonToSVG(lat, lon)  – global affine transform → { x, y } in SVG space
 *   dmsToDecimal(str)      – parse DMS string to { lat, lon }
 *   GridManager            – geo coords → collision-resolved SVG pixel position
 *   REGION_GEO_BOUNDS      – geographic extents per Hebrew region name
 */

(function (global) {
    'use strict';

    // ── Calibration points ───────────────────────────────────────────────────
    //
    // Each entry is a city whose SVG position is known from the text labels in
    // background-map.svg (transform="translate(x y)") and whose real-world
    // lat/lon is well-established.  These 6 points calibrate a least-squares
    // affine transform that covers the entire SVG.

    const CALIBRATION_POINTS = [
        { lat: 32.0853, lon: 34.7818, x: 373.35, y: 643.08 }, // Tel Aviv
        { lat: 31.9522, lon: 34.8989, x: 600.79, y: 701.83 }, // Lod
        { lat: 31.2518, lon: 34.7913, x: 775.26, y: 817.28 }, // Beer Sheva
        { lat: 33.2074, lon: 35.5706, x:  66.85, y:  62.12 }, // Kiryat Shmona
        { lat: 31.7683, lon: 35.2137, x: 868.00, y: 572.76 }, // Jerusalem
        { lat: 32.7940, lon: 34.9896, x:  69.13, y: 434.15 }, // Haifa
    ];

    // ── Region geographic bounds (for grid collision resolution) ─────────────

    const REGION_GEO_BOUNDS = {
        'צפון':    { north: 33.30, south: 32.40, west: 34.90, east: 35.90 },
        'כרמל':   { north: 32.90, south: 32.60, west: 34.85, east: 35.20 },
        'מרכז':   { north: 32.40, south: 31.85, west: 34.65, east: 35.10 },
        'ירושלים': { north: 31.90, south: 31.60, west: 35.00, east: 35.40 },
        'דרום':   { north: 31.85, south: 29.50, west: 34.25, east: 35.55 },
    };

    // Hebrew region name → SVG element id (must match layer IDs in background-map.svg)
    const REGION_SVG_IDS = {
        'צפון':    'north_click_pad',
        'כרמל':   'carmel_click_pad',
        'מרכז':   'center_click_pad',
        'ירושלים': 'jerusalem_click_pad',
        'דרום':   'South_click_pad',   // capital S — matches the SVG layer name
    };

    // Grid cell size in decimal degrees (≈ 5.5 km N–S, ~4.5 km E–W at Israel's latitude)
    const DEFAULT_CELL_DEG = 0.05;

    // ── Least-squares affine transform ───────────────────────────────────────
    //
    // Model:  svgX = a·lat + b·lon + c
    //         svgY = d·lat + e·lon + f
    //
    // Fitted by minimising squared residuals over CALIBRATION_POINTS.

    /** Solve 3×3 linear system Ax = b via Gaussian elimination with partial pivoting. */
    function _solve3(A, b) {
        const M = A.map((row, i) => [...row, b[i]]);
        for (let c = 0; c < 3; c++) {
            let maxR = c;
            for (let r = c + 1; r < 3; r++) {
                if (Math.abs(M[r][c]) > Math.abs(M[maxR][c])) maxR = r;
            }
            [M[c], M[maxR]] = [M[maxR], M[c]];
            for (let r = c + 1; r < 3; r++) {
                const f = M[r][c] / M[c][c];
                for (let k = c; k <= 3; k++) M[r][k] -= f * M[c][k];
            }
        }
        const x = [0, 0, 0];
        for (let i = 2; i >= 0; i--) {
            x[i] = M[i][3];
            for (let j = i + 1; j < 3; j++) x[i] -= M[i][j] * x[j];
            x[i] /= M[i][i];
        }
        return x;
    }

    /** Build normal equations (A^T A)(params) = A^T b and solve. */
    function _computeAffine(points) {
        const ATA  = [[0,0,0],[0,0,0],[0,0,0]];
        const ATbx = [0,0,0];
        const ATby = [0,0,0];
        for (const p of points) {
            const row = [p.lat, p.lon, 1];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) ATA[i][j] += row[i] * row[j];
                ATbx[i] += row[i] * p.x;
                ATby[i] += row[i] * p.y;
            }
        }
        const px = _solve3(ATA, ATbx);
        const py = _solve3(ATA, ATby);

        // Log residuals so calibration quality is visible in the console
        let maxErrX = 0, maxErrY = 0;
        for (const p of points) {
            const ex = Math.abs(px[0]*p.lat + px[1]*p.lon + px[2] - p.x);
            const ey = Math.abs(py[0]*p.lat + py[1]*p.lon + py[2] - p.y);
            if (ex > maxErrX) maxErrX = ex;
            if (ey > maxErrY) maxErrY = ey;
        }
        console.log(`[KSM] Affine calibration max residual — X: ${maxErrX.toFixed(1)}px  Y: ${maxErrY.toFixed(1)}px`);

        return { px, py };
    }

    // Computed once at module load time
    const _affine = _computeAffine(CALIBRATION_POINTS);

    /**
     * Convert geographic coordinates to SVG pixel position.
     * Uses the global affine transform calibrated from city markers.
     *
     * @param  {number} lat  Decimal degrees
     * @param  {number} lon  Decimal degrees
     * @returns {{ x: number, y: number }}
     */
    function latLonToSVG(lat, lon) {
        const { px, py } = _affine;
        return {
            x: px[0] * lat + px[1] * lon + px[2],
            y: py[0] * lat + py[1] * lon + py[2],
        };
    }

    // ── DMS parsing ───────────────────────────────────────────────────────────

    function _parseDMSPart(part) {
        const m = part.trim().match(
            /(\d+)\s*[°d\s]\s*(\d+)\s*[′'m\s]\s*([\d.]+)\s*[″"s]?\s*([NSEW])?/i
        );
        if (!m) return null;
        let dec = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
        if (m[4] && /^[SW]$/i.test(m[4])) dec = -dec;
        return dec;
    }

    /**
     * Parse a combined DMS coordinate string to decimal { lat, lon }.
     * Example input: "31° 46′ 43″ N, 35° 14′ 5″ E"
     *
     * @param  {string} dmsString
     * @returns {{ lat: number, lon: number } | null}
     */
    function dmsToDecimal(dmsString) {
        if (!dmsString || typeof dmsString !== 'string') return null;
        const parts = dmsString.split(',');
        if (parts.length < 2) return null;
        const lat = _parseDMSPart(parts[0]);
        const lon = _parseDMSPart(parts[1]);
        if (lat === null || lon === null) return null;
        return { lat, lon };
    }

    // ── GridManager ───────────────────────────────────────────────────────────

    /**
     * Converts geographic coordinates to grid-snapped SVG pixel positions with
     * spiral-search collision resolution so no two pins share a cell.
     *
     * Coordinate pipeline (placePin):
     *   1. lat/lon → grid cell  (geographic bounds-based grid)
     *   2. Resolve collision    (spiral search for free cell)
     *   3. Cell centre → lat/lon
     *   4. lat/lon → SVG px    (global affine transform)
     *   5. Clamp to region polygon if needed  (isPointInFill walk toward centroid)
     */
    class GridManager {
        constructor(options = {}) {
            this.cellDeg = options.cellDeg ?? DEFAULT_CELL_DEG;
            /** @type {Record<string, SVGGeometryElement>} */
            this._svgEls = {};
            /** Occupation map: "regionName:col,row" → pinId */
            this._occupied = new Map();
        }

        // ── Setup ─────────────────────────────────────────────────────────────

        /**
         * Cache SVG path elements for each region (used for isPointInFill checks).
         * Must be called after the SVG has been inserted into the DOM.
         */
        cacheRegionBounds() {
            for (const [heName, svgId] of Object.entries(REGION_SVG_IDS)) {
                const el = document.getElementById(svgId);
                if (!el) {
                    console.warn(`[KSM] Region element not found in SVG: #${svgId}`);
                    continue;
                }
                // isPointInFill only works on SVGGeometryElement, not <g> — use inner path
                this._svgEls[heName] = el.querySelector('path') || el;
            }
        }

        /** Clear all pin occupations. Call before each full render pass. */
        reset() {
            this._occupied.clear();
        }

        // ── Coordinate transform ───────────────────────────────────────────

        /**
         * Convert lat/lon to SVG position using the global affine transform,
         * then optionally validate against the region polygon.
         */
        geoToSVG(lat, lon, regionName) {
            const pos = latLonToSVG(lat, lon);

            const el = this._svgEls[regionName];
            if (!el || typeof el.isPointInFill !== 'function') return pos;

            const svgRoot = el.ownerSVGElement;
            if (!svgRoot) return pos;

            const pt = svgRoot.createSVGPoint();
            pt.x = pos.x;
            pt.y = pos.y;
            const inside = el.isPointInFill(pt);

            if (inside) return pos;

            // Pin is outside the region polygon — walk toward bbox centroid
            const b  = el.getBBox();
            const cx = b.x + b.width  / 2;
            const cy = b.y + b.height / 2;

            const STEPS = 40;
            let result = { x: cx, y: cy };
            for (let i = 1; i <= STEPS; i++) {
                pt.x = pos.x + (cx - pos.x) * (i / STEPS);
                pt.y = pos.y + (cy - pos.y) * (i / STEPS);
                if (el.isPointInFill(pt)) { result = { x: pt.x, y: pt.y }; break; }
            }

            return result;
        }

        // ── Grid helpers ───────────────────────────────────────────────────

        latLonToCell(lat, lon, regionName) {
            const geo = REGION_GEO_BOUNDS[regionName];
            if (!geo) return { col: 0, row: 0 };
            return {
                col: Math.round((lon - geo.west)  / this.cellDeg),
                row: Math.round((geo.north - lat) / this.cellDeg),
            };
        }

        cellToLatLon(col, row, regionName) {
            const geo = REGION_GEO_BOUNDS[regionName];
            return {
                lat: geo.north - row * this.cellDeg,
                lon: geo.west  + col * this.cellDeg,
            };
        }

        _cellKey(rn, c, r) { return `${rn}:${c},${r}`; }
        _isFree(rn, c, r)  { return !this._occupied.has(this._cellKey(rn, c, r)); }

        // ── Collision resolution ───────────────────────────────────────────

        /**
         * Find nearest unoccupied grid cell via Manhattan-distance spiral search.
         */
        resolveCollision(col, row, regionName) {
            if (this._isFree(regionName, col, row)) return { col, row };

            const geo    = REGION_GEO_BOUNDS[regionName];
            const maxCol = Math.ceil((geo.east  - geo.west)  / this.cellDeg);
            const maxRow = Math.ceil((geo.north - geo.south) / this.cellDeg);
            const limit  = Math.max(maxCol, maxRow);

            for (let r = 1; r <= limit; r++) {
                for (let dc = -r; dc <= r; dc++) {
                    for (let dr = -r; dr <= r; dr++) {
                        if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                        const nc = col + dc, nr = row + dr;
                        if (nc < 0 || nr < 0 || nc > maxCol || nr > maxRow) continue;
                        if (this._isFree(regionName, nc, nr)) return { col: nc, row: nr };
                    }
                }
            }
            return { col, row }; // accept overlap rather than losing the pin
        }

        // ── Full placement pipeline ────────────────────────────────────────

        /**
         * Place a pin and return its SVG pixel position.
         *
         * @param  {number}        lat
         * @param  {number}        lon
         * @param  {string}        regionName  Hebrew region name
         * @param  {number|string} pinId
         * @returns {{ x: number, y: number } | null}
         */
        placePin(lat, lon, regionName, pinId) {
            if (!REGION_GEO_BOUNDS[regionName]) return null;

            // 1. Snap to grid cell
            let { col, row } = this.latLonToCell(lat, lon, regionName);

            // 2. Resolve collision
            ({ col, row } = this.resolveCollision(col, row, regionName));

            // 3. Mark cell occupied
            this._occupied.set(this._cellKey(regionName, col, row), pinId);

            // 4. Convert winning cell centre back to lat/lon, then to SVG coords
            const { lat: snapLat, lon: snapLon } = this.cellToLatLon(col, row, regionName);
            return this.geoToSVG(snapLat, snapLon, regionName);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    global.KSM                   = global.KSM || {};
    global.KSM.dmsToDecimal      = dmsToDecimal;
    global.KSM.GridManager       = GridManager;
    global.KSM.REGION_GEO_BOUNDS = REGION_GEO_BOUNDS;
    global.KSM.latLonToSVG       = latLonToSVG;

})(window);
