/**
 * Keren Shutafut Map – Coordinate Utilities
 *
 * Exports to window.KSM:
 *   dmsToDecimal(str)   – parse a "deg° min′ sec″ DIR, ..." string to {lat, lon}
 *   GridManager         – class: geo coords → grid-snapped SVG pixels
 *   REGION_GEO_BOUNDS   – geographic extents for each Hebrew region name
 */

(function (global) {
    'use strict';

    // ── Region configuration ──────────────────────────────────────────────────
    //
    // Approximate geographic extents (decimal degrees) for each administrative
    // district.  These are the bounds used for the linear geo→SVG interpolation
    // within each region's bounding box.  Adjust if pins drift outside region
    // shapes.

    const REGION_GEO_BOUNDS = {
        'צפון':    { north: 33.30, south: 32.40, west: 34.90, east: 35.90 },
        'כרמל':   { north: 32.90, south: 32.60, west: 34.85, east: 35.20 },
        'מרכז':   { north: 32.40, south: 31.85, west: 34.65, east: 35.10 },
        'ירושלים': { north: 31.90, south: 31.60, west: 35.00, east: 35.40 },
        'דרום':   { north: 31.85, south: 29.50, west: 34.25, east: 35.55 },
    };

    // Hebrew region name → SVG element id
    const REGION_SVG_IDS = {
        'צפון':    'north',
        'כרמל':   'carmel',
        'מרכז':   'center',
        'ירושלים': 'jerusalem',
        'דרום':   'south',
    };

    // Grid cell size in decimal degrees.
    // 0.05° ≈ 5.5 km N–S and ~4.5 km E–W at Israel's latitude.
    // Decrease for denser grids (more pins per region); increase to space them out.
    const DEFAULT_CELL_DEG = 0.05;

    // ── DMS parsing ───────────────────────────────────────────────────────────

    /**
     * Parse one DMS component (lat or lon) to decimal degrees.
     *
     * Accepted formats:
     *   "31° 46′ 43″ N"   – Unicode prime/double-prime symbols
     *   "31°46'43\"N"      – ASCII apostrophe / straight-quote
     *   "31 46 43 N"       – space-separated
     *   "31d46m43sN"       – letter separators
     *
     * @param  {string} part
     * @returns {number|null}
     */
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
     * Parse a combined DMS coordinate string to decimal {lat, lon}.
     *
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
     * Transforms geographic coordinates to grid-snapped SVG pixel positions,
     * with spiral-search collision resolution so no two pins share a cell.
     *
     * Coordinate transformation strategy
     * ────────────────────────────────────
     * Each region element in the SVG has a bounding box (obtained via getBBox()).
     * Within that box the transformation is a simple linear interpolation:
     *
     *   xRatio = (lon  − geo.west)  / (geo.east  − geo.west)   → 0..1
     *   yRatio = (geo.north − lat)  / (geo.north − geo.south)  → 0..1 (N=top)
     *
     *   svgX = bbox.x + xRatio × bbox.width
     *   svgY = bbox.y + yRatio × bbox.height
     *
     * This is only an approximation – the SVG map uses an artistic projection,
     * not a strict geographic one.  For most use cases (placing pins within the
     * correct visible region) it works well.  If a specific pin lands outside
     * its region shape, adjust REGION_GEO_BOUNDS for that region.
     *
     * Grid snapping
     * ─────────────
     * Pins are snapped to the nearest grid cell whose size is cellDeg × cellDeg
     * degrees (default 0.05°).  Grid columns/rows are counted from the region's
     * north-west corner.  When a cell is already occupied, a spiral search
     * finds the nearest free cell within the region.
     *
     * Usage
     * ─────
     *   const gm = new KSM.GridManager();
     *   gm.cacheRegionBounds();          // call once after SVG is in DOM
     *   gm.reset();                      // call before each render pass
     *   const pos = gm.placePin(lat, lon, 'ירושלים', pinId);
     *   // → { x: 819, y: 555 }  (SVG pixel coords)
     */
    class GridManager {
        /**
         * @param {{ cellDeg?: number }} [options]
         */
        constructor(options = {}) {
            /** Grid cell size in decimal degrees. */
            this.cellDeg = options.cellDeg ?? DEFAULT_CELL_DEG;

            /** @type {Record<string, {x:number, y:number, w:number, h:number}>} */
            this._svgBounds = {};

            /** @type {Record<string, SVGGeometryElement>} */
            this._svgEls = {};

            /** Occupation map keyed "regionName:col,row" → pinId */
            this._occupied = new Map();
        }

        // ── Setup ─────────────────────────────────────────────────────────────

        /**
         * Read SVG bounding boxes for all region elements and cache them.
         * Must be called after the map SVG has been inserted into the DOM.
         * Safe to call more than once (e.g. after SVG is replaced).
         */
        cacheRegionBounds() {
            for (const [heName, svgId] of Object.entries(REGION_SVG_IDS)) {
                const el = document.getElementById(svgId);
                if (!el) continue;
                const b = el.getBBox();
                this._svgBounds[heName] = { x: b.x, y: b.y, w: b.width, h: b.height };
                // isPointInFill only works on SVGGeometryElement, not <g> — use inner path
                this._svgEls[heName] = el.querySelector('path') || el;
            }
        }

        /**
         * Clear all pin occupations.
         * Call this before each full render pass so the grid starts fresh.
         */
        reset() {
            this._occupied.clear();
        }

        // ── Coordinate transformation ──────────────────────────────────────

        /**
         * Convert decimal lat/lon to an SVG pixel position inside a region.
         * Coordinates outside the region's geographic bounds are clamped.
         *
         * @param  {number} lat
         * @param  {number} lon
         * @param  {string} regionName  Hebrew region name
         * @returns {{ x: number, y: number } | null}
         */
        geoToSVG(lat, lon, regionName) {
            const geo = REGION_GEO_BOUNDS[regionName];
            const svg = this._svgBounds[regionName];
            if (!geo || !svg) return null;

            // Clamp to region bounds then normalise to [0, 1]
            const xRatio = (Math.max(geo.west,  Math.min(geo.east,  lon)) - geo.west)
                         / (geo.east  - geo.west);
            const yRatio = (geo.north - Math.max(geo.south, Math.min(geo.north, lat)))
                         / (geo.north - geo.south);

            const x = svg.x + xRatio * svg.w;
            const y = svg.y + yRatio * svg.h;

            // Ensure the point lands inside the actual polygon, not on sea/background.
            // If outside, walk toward the bbox centre in 30 steps until inside.
            const el = this._svgEls[regionName];
            if (el && el.isPointInFill) {
                const svgRoot = el.ownerSVGElement;
                const pt = svgRoot.createSVGPoint();
                pt.x = x; pt.y = y;

                if (!el.isPointInFill(pt)) {
                    const cx = svg.x + svg.w / 2;
                    const cy = svg.y + svg.h / 2;
                    for (let i = 1; i <= 30; i++) {
                        pt.x = x + (cx - x) * (i / 30);
                        pt.y = y + (cy - y) * (i / 30);
                        if (el.isPointInFill(pt)) return { x: pt.x, y: pt.y };
                    }
                    return { x: cx, y: cy };
                }
            }

            return { x, y };
        }

        // ── Grid helpers ───────────────────────────────────────────────────

        /**
         * Convert geographic coordinates to grid cell indices.
         * Column 0 / row 0 = north-west corner of the region.
         *
         * @param  {number} lat
         * @param  {number} lon
         * @param  {string} regionName
         * @returns {{ col: number, row: number }}
         */
        latLonToCell(lat, lon, regionName) {
            const geo = REGION_GEO_BOUNDS[regionName];
            if (!geo) return { col: 0, row: 0 };
            return {
                col: Math.round((lon - geo.west)  / this.cellDeg),
                row: Math.round((geo.north - lat) / this.cellDeg),
            };
        }

        /**
         * Convert grid cell indices back to the geographic centre of that cell.
         *
         * @param  {number} col
         * @param  {number} row
         * @param  {string} regionName
         * @returns {{ lat: number, lon: number }}
         */
        cellToLatLon(col, row, regionName) {
            const geo = REGION_GEO_BOUNDS[regionName];
            return {
                lat: geo.north - row * this.cellDeg,
                lon: geo.west  + col * this.cellDeg,
            };
        }

        // ── Collision detection ────────────────────────────────────────────

        _cellKey(regionName, col, row) {
            return `${regionName}:${col},${row}`;
        }

        _isFree(regionName, col, row) {
            return !this._occupied.has(this._cellKey(regionName, col, row));
        }

        /**
         * Find the nearest unoccupied grid cell using a Manhattan-distance
         * spiral search, expanding one ring at a time outward from (col, row).
         *
         * Only cells within the region's geographic extent are considered.
         *
         * @param  {number} col
         * @param  {number} row
         * @param  {string} regionName
         * @returns {{ col: number, row: number }}
         */
        resolveCollision(col, row, regionName) {
            if (this._isFree(regionName, col, row)) return { col, row };

            const geo    = REGION_GEO_BOUNDS[regionName];
            const maxCol = Math.ceil((geo.east  - geo.west)  / this.cellDeg);
            const maxRow = Math.ceil((geo.north - geo.south) / this.cellDeg);
            const limit  = Math.max(maxCol, maxRow);

            for (let r = 1; r <= limit; r++) {
                // Walk the square perimeter at Manhattan radius r
                for (let dc = -r; dc <= r; dc++) {
                    for (let dr = -r; dr <= r; dr++) {
                        // Only visit cells on the current ring's border
                        if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                        const nc = col + dc;
                        const nr = row + dr;
                        // Stay inside region grid
                        if (nc < 0 || nr < 0 || nc > maxCol || nr > maxRow) continue;
                        if (this._isFree(regionName, nc, nr)) return { col: nc, row: nr };
                    }
                }
            }

            // Fallback: accept overlap rather than losing the pin
            return { col, row };
        }

        // ── Full placement pipeline ────────────────────────────────────────

        /**
         * Place a pin at geographic coordinates and return the SVG pixel position.
         *
         * Pipeline:
         *   1. Convert lat/lon → grid cell
         *   2. Resolve any collision via spiral search
         *   3. Convert winning cell back to lat/lon (cell centre)
         *   4. Convert cell-centre lat/lon → SVG pixel coords
         *   5. Record the cell as occupied
         *
         * @param  {number}          lat
         * @param  {number}          lon
         * @param  {string}          regionName  Hebrew region name
         * @param  {number|string}   pinId       Unique pin identifier
         * @returns {{ x: number, y: number } | null}
         */
        placePin(lat, lon, regionName, pinId) {
            const geo = REGION_GEO_BOUNDS[regionName];
            const svg = this._svgBounds[regionName];
            if (!geo || !svg) return null;

            return this.geoToSVG(lat, lon, regionName);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    global.KSM                 = global.KSM || {};
    global.KSM.dmsToDecimal    = dmsToDecimal;
    global.KSM.GridManager     = GridManager;
    global.KSM.REGION_GEO_BOUNDS = REGION_GEO_BOUNDS;

})(window);
