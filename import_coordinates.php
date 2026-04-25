<?php
/**
 * Keren Shutafut – Import pin coordinates from CSV
 *
 * For each CSV row the script:
 *   1. Finds the matching WordPress 'pin' post by title
 *      (disambiguates duplicates using the activity_cycle term).
 *   2. Uses CSV lat/lon when present (exact coordinates).
 *   3. Otherwise scans the `location` field for a recognisable
 *      city name and looks up its coordinates.
 *   4. Falls back to the region's default coordinates when no
 *      city can be found (e.g. "בכל רחבי הארץ").
 *   5. Adds a tiny seeded-random jitter to inferred coordinates
 *      so co-located pins don't collapse onto one grid cell.
 *   6. Writes `latitude`, `longitude`, and `coordinates` post_meta.
 *
 * Usage (WP-CLI, from the WordPress root):
 *   wp eval-file /path/to/import_coordinates.php
 *   wp eval-file /path/to/import_coordinates.php -- --dry-run
 */

define( 'CSV_PATH', '/Users/User/Local Sites/keren-shutafut-map/app/public/projects_with_filled_coordinates_partial.csv' );

$dry_run = in_array( '--dry-run', $args ?? [], true );

if ( $dry_run ) {
    WP_CLI::log( '── DRY RUN – no data will be written ──' );
}

// ── City coordinate lookup ─────────────────────────────────────────────────────
//
// Keyed by substrings that may appear in the Hebrew `location` field.
// Entries are ordered longest-first so more specific names match before
// shorter fragments (e.g. "תל חי" before "ת").
//
// Values: [ lat, lon ]

$CITY_COORDS = [
    // Jerusalem area
    'ירושלים'        => [ 31.7683, 35.2137 ],
    'ירושלם'         => [ 31.7683, 35.2137 ],
    'י-ם'            => [ 31.7683, 35.2137 ],
    'בי-ם'           => [ 31.7683, 35.2137 ],
    'אבו גוש'        => [ 31.8042, 35.1001 ],
    'נווה שלום'      => [ 31.8300, 34.9900 ],
    'מודיעין עלית'   => [ 31.9316, 35.0438 ],
    'בני ברק'        => [ 32.0842, 34.8349 ],
    'אלון שבות'      => [ 31.6640, 35.1240 ],

    // North
    'מכללת תל חי'    => [ 33.2706, 35.5634 ],
    'תל חי'          => [ 33.2706, 35.5634 ],
    'מעלות תרשיחא'   => [ 33.0167, 35.2667 ],
    'מעלות'          => [ 33.0167, 35.2667 ],
    'נהריה'          => [ 33.0078, 35.0968 ],
    'עכו'            => [ 32.9261, 35.0732 ],
    'מג׳ד אל כרום'   => [ 32.9226, 35.2608 ],
    "מג'ד אל כרום"   => [ 32.9226, 35.2608 ],
    'ראמה'           => [ 32.9408, 35.3624 ],
    'שפרעם'          => [ 32.8029, 35.1706 ],
    'חיפה'           => [ 32.8184, 34.9885 ],
    'נוף הגליל'      => [ 32.7073, 35.3245 ],
    'נצרת'           => [ 32.6996, 35.3035 ],
    'פוריידיס'       => [ 32.6584, 34.9552 ],
    'פרדיס'          => [ 32.6584, 34.9552 ],
    "ג'יסר א-זרקא"   => [ 32.5400, 34.9200 ],
    "ג'יסר א זרקא"   => [ 32.5400, 34.9200 ],
    "ג'יסר"          => [ 32.5400, 34.9200 ],
    'כרמיאל'         => [ 32.9179, 35.2956 ],
    'סכנין'          => [ 32.8613, 35.3022 ],
    'משגב'           => [ 32.8700, 35.2400 ],
    'טבריה'          => [ 32.7940, 35.5300 ],
    'קרית טבעון'     => [ 32.7248, 35.1206 ],
    'בסמת טבעון'     => [ 32.7040, 35.1350 ],
    'נחל ציפורי'     => [ 32.7500, 35.1900 ],
    'מזרעה'          => [ 32.9042, 35.1028 ],
    'קיבוץ עברון'    => [ 33.0189, 35.1006 ],
    'עברון'          => [ 33.0189, 35.1006 ],
    'זכרון יעקב'     => [ 32.5726, 34.9545 ],
    "ג'לג'וליה"      => [ 32.1531, 34.9569 ],
    'ג׳לג׳וליה'      => [ 32.1531, 34.9569 ],
    'כפר מצר'        => [ 32.5883, 35.2784 ],
    'בוסתן אל מרג'   => [ 32.5883, 35.2784 ],
    'עין שמר'        => [ 32.5172, 35.0076 ],
    'גבעת חביבה'     => [ 32.4700, 35.0500 ],
    'חריש'           => [ 32.4698, 35.0435 ],
    'קציר'           => [ 32.4900, 35.0600 ],
    'כפר יונה'       => [ 32.3170, 34.9373 ],
    'נתניה'          => [ 32.3226, 34.8538 ],
    'חדרה'           => [ 32.4456, 34.9239 ],
    'ראש העין'       => [ 32.0960, 34.9535 ],
    'בית-שאן'        => [ 32.4973, 35.4960 ],
    'בית שאן'        => [ 32.4973, 35.4960 ],
    'עמק המעיינות'   => [ 32.5000, 35.4500 ],
    'עמק יזרעאל'     => [ 32.6000, 35.1500 ],
    'עין דור'        => [ 32.6667, 35.3833 ],
    'קיסריה'         => [ 32.4987, 34.9088 ],

    // Carmel (Haifa coast) – catches "חוף הכרמל" without matching "כרמל" too early
    'חוף הכרמל'      => [ 32.6500, 34.9400 ],

    // Center
    'תל אביב'        => [ 32.0853, 34.7818 ],
    'תל-אביב'        => [ 32.0853, 34.7818 ],
    "דרום ת\"א"      => [ 32.0500, 34.7800 ],
    'שכונת שפירא'    => [ 32.0500, 34.7800 ],
    'שפירא'          => [ 32.0500, 34.7800 ],
    'יפו'            => [ 32.0504, 34.7522 ],
    'נמל יפו'        => [ 32.0504, 34.7522 ],
    'רמת גן'         => [ 32.0822, 34.8119 ],
    'פתח תקווה'      => [ 32.0878, 34.8877 ],
    'רעננה'          => [ 32.1879, 34.8706 ],
    'כפר סבא'        => [ 32.1798, 34.9080 ],
    'הרצליה'         => [ 32.1648, 34.8446 ],
    'מודיעין'        => [ 31.8929, 35.0107 ],
    'לוד'            => [ 31.9554, 34.8915 ],
    'רמלה'           => [ 31.9316, 34.8729 ],
    'יבנה'           => [ 31.8775, 34.7393 ],
    'רחובות'         => [ 31.8983, 34.8162 ],
    'חולון'          => [ 32.0158, 34.7874 ],
    'בת ים'          => [ 32.0167, 34.7500 ],
    'אשדוד'          => [ 31.8044, 34.6553 ],
    'בית-שמש'        => [ 31.7497, 34.9886 ],
    'בית שמש'        => [ 31.7497, 34.9886 ],
    'גדרה'           => [ 31.8133, 34.7728 ],
    'אשקלון'         => [ 31.6691, 34.5742 ],
    'ים המלח'        => [ 31.5000, 35.4700 ],
    'ריינה'          => [ 32.7053, 35.2987 ],
    'שיזף'           => [ 31.6000, 34.9000 ],
    'יישוב שיזף'     => [ 31.6000, 34.9000 ],
    'נחל תבור'       => [ 32.7200, 35.3000 ],
    'עין קאזאן'      => [ 32.7100, 35.3100 ],

    // South
    'שדרות'          => [ 31.5245, 34.5967 ],
    'עוטף עזה'       => [ 31.4500, 34.4500 ],
    'שער הנגב'       => [ 31.5500, 34.5500 ],
    'אשכול'          => [ 31.3000, 34.4500 ],
    'יד מרדכי'       => [ 31.5913, 34.5617 ],
    'קיבוץ יד מרדכי' => [ 31.5913, 34.5617 ],
    'באר שבע'        => [ 31.2530, 34.7915 ],
    'באר-שבע'        => [ 31.2530, 34.7915 ],
    'ב"ש'            => [ 31.2530, 34.7915 ],
    'בג"ו'           => [ 31.2614, 34.7997 ],
    'רהט'            => [ 31.3931, 34.7547 ],
    'כסיפה'          => [ 31.2309, 34.9800 ],
    'ערד'            => [ 31.2589, 35.2128 ],
    'בני שמעון'      => [ 31.3500, 34.8200 ],
    'ירוחם'          => [ 30.9881, 34.9303 ],
    'אופקים'         => [ 31.3106, 34.6207 ],
    'שגב שלום'       => [ 31.1982, 34.8189 ],
    'מצפה רמון'      => [ 30.6105, 34.8016 ],
    'הר הנגב'        => [ 30.5000, 34.7000 ],
    'נגב'            => [ 31.0000, 34.9000 ],
    'כוחלה'          => [ 31.3500, 34.8900 ],
    'חבל אילות'      => [ 29.5581, 34.9482 ],
    'אילות'          => [ 29.5581, 34.9482 ],
    'אילת'           => [ 29.5581, 34.9482 ],
];

// Sort longest-key-first so specific names match before substrings
uksort( $CITY_COORDS, fn( $a, $b ) => mb_strlen( $b ) - mb_strlen( $a ) );

// ── Region-level fallback coordinates ─────────────────────────────────────────
// Used when location is blank or fully national ("בכל רחבי הארץ").

$REGION_DEFAULTS = [
    'צפון'    => [ 32.9000, 35.2000 ],   // Galilee
    'כרמל'   => [ 32.8200, 34.9800 ],   // Haifa
    'מרכז'   => [ 32.0800, 34.7800 ],   // Tel Aviv
    'ירושלים' => [ 31.7700, 35.2100 ],   // Jerusalem
    'דרום'   => [ 31.2500, 34.7900 ],   // Beer Sheva
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Find the first recognisable city in a Hebrew location string.
 * Returns [ lat, lon ] or null.
 */
function ksm_infer_from_location( string $location, array $city_coords ): ?array {
    foreach ( $city_coords as $city => $coords ) {
        if ( mb_strpos( $location, $city ) !== false ) {
            return $coords;
        }
    }
    return null;
}

/**
 * Add a seeded-random jitter of ±0.008° (~900 m) to avoid stacking.
 * The seed is derived from the post ID so the same pin always gets
 * the same offset (idempotent re-runs).
 */
function ksm_jitter( float $lat, float $lon, int $post_id ): array {
    mt_srand( crc32( 'ksm_jitter_' . $post_id ) );
    $lat += mt_rand( -800, 800 ) / 100000.0;
    $lon += mt_rand( -800, 800 ) / 100000.0;
    return [ round( $lat, 6 ), round( $lon, 6 ) ];
}

/**
 * Convert decimal degrees to a human-readable DMS string.
 * e.g.  31.7683 (lat) → "31° 46′ 5″ N"
 */
function ksm_decimal_to_dms( float $decimal, bool $is_lat ): string {
    $dir  = $is_lat
          ? ( $decimal >= 0 ? 'N' : 'S' )
          : ( $decimal >= 0 ? 'E' : 'W' );
    $abs  = abs( $decimal );
    $deg  = (int) $abs;
    $mf   = ( $abs - $deg ) * 60;
    $min  = (int) $mf;
    $sec  = round( ( $mf - $min ) * 60, 1 );
    return "{$deg}° {$min}′ {$sec}″ {$dir}";
}

/**
 * Find a 'pin' post by exact title, optionally constrained to a
 * specific activity_cycle term (for duplicate-title disambiguation).
 * Returns WP_Post or null.
 */
function ksm_find_post( string $title, string $cycle ): ?WP_Post {
    global $wpdb;

    $ids = $wpdb->get_col( $wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts}
         WHERE post_type = 'pin'
           AND post_status IN ('publish','draft','private')
           AND post_title = %s",
        $title
    ) );

    if ( empty( $ids ) ) return null;

    // Single match – no need to check cycle
    if ( count( $ids ) === 1 ) {
        return get_post( (int) $ids[0] );
    }

    // Multiple matches: prefer the one whose activity_cycle term matches
    foreach ( $ids as $id ) {
        $terms = wp_get_post_terms( (int) $id, 'activity_cycle', [ 'fields' => 'names' ] );
        if ( ! is_wp_error( $terms ) && in_array( $cycle, $terms, true ) ) {
            return get_post( (int) $id );
        }
    }

    // No cycle match – return first result rather than skipping
    return get_post( (int) $ids[0] );
}

// ── Main loop ─────────────────────────────────────────────────────────────────

if ( ! file_exists( CSV_PATH ) ) {
    WP_CLI::error( 'CSV not found: ' . CSV_PATH );
    exit( 1 );
}

$fh     = fopen( CSV_PATH, 'r' );
$header = fgetcsv( $fh );
$col    = array_flip( $header );

$stats = [ 'csv_coords' => 0, 'city_inferred' => 0, 'region_fallback' => 0,
           'skipped' => 0, 'not_found' => 0 ];

while ( ( $row = fgetcsv( $fh ) ) !== false ) {
    $title   = trim( $row[ $col['post_title'] ]        ?? '' );
    $cycle   = trim( $row[ $col['recruitment_cycle'] ] ?? '' );
    $region  = trim( $row[ $col['geographic_region'] ] ?? '' );
    $loc     = trim( $row[ $col['location'] ]           ?? '' );
    $lat_csv = trim( $row[ $col['latitude'] ]           ?? '' );
    $lon_csv = trim( $row[ $col['longitude'] ]          ?? '' );

    if ( empty( $title ) ) {
        $stats['skipped']++;
        continue;
    }

    $post = ksm_find_post( $title, $cycle );
    if ( ! $post ) {
        WP_CLI::warning( "NOT FOUND: "{$title}" [{$cycle}]" );
        $stats['not_found']++;
        continue;
    }

    // ── Determine coordinates ──────────────────────────────────────────────

    $jitter_applied = false;

    if ( $lat_csv !== '' && $lon_csv !== '' ) {
        // Exact coordinates from the CSV – use as-is, no jitter
        $lat    = (float) $lat_csv;
        $lon    = (float) $lon_csv;
        $source = 'csv';
        $stats['csv_coords']++;

    } else {
        // Try to recognise a city in the location field
        $inferred = ksm_infer_from_location( $loc, $CITY_COORDS );

        if ( $inferred ) {
            [ $lat, $lon ] = $inferred;
            $source        = "city ({$loc})";
            $stats['city_inferred']++;
        } else {
            // Fall back to the region's default position
            [ $lat, $lon ] = $REGION_DEFAULTS[ $region ] ?? [ 31.7683, 35.2137 ];
            $source        = "region default ({$region})";
            $stats['region_fallback']++;
        }

        // Jitter so pins at the same base point don't all collapse to one grid cell
        [ $lat, $lon ] = ksm_jitter( $lat, $lon, $post->ID );
        $jitter_applied = true;
    }

    $dms = ksm_decimal_to_dms( $lat, true ) . ', ' . ksm_decimal_to_dms( $lon, false );

    $flag = $jitter_applied ? ' +jitter' : '';
    WP_CLI::log( sprintf(
        '[%d] %-45s  %-8s  %.6f, %.6f  (%s%s)',
        $post->ID,
        mb_substr( $title, 0, 44 ),
        $cycle,
        $lat, $lon,
        $source,
        $flag
    ) );

    if ( ! $dry_run ) {
        update_post_meta( $post->ID, 'latitude',    $lat );
        update_post_meta( $post->ID, 'longitude',   $lon );
        update_post_meta( $post->ID, 'coordinates', $dms );
    }
}

fclose( $fh );

$written = $stats['csv_coords'] + $stats['city_inferred'] + $stats['region_fallback'];

WP_CLI::success( sprintf(
    "%s %d pins processed — %d from CSV, %d city-inferred, %d region-fallback | %d not found in WP, %d skipped",
    $dry_run ? '[DRY RUN] ' : '',
    $written,
    $stats['csv_coords'],
    $stats['city_inferred'],
    $stats['region_fallback'],
    $stats['not_found'],
    $stats['skipped']
) );
