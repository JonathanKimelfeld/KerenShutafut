<?php
/**
 * Plugin Name: Keren Shutafut REST API
 * Description: REST API endpoint for map pins
 * Version: 1.1
 */

add_action('rest_api_init', function() {
    register_rest_route('keren-shutafut/v1', '/pins', array(
        'methods' => 'GET',
        'callback' => 'keren_shutafut_get_pins',
        'permission_callback' => '__return_true'
    ));
});

// ── Coordinate helpers ────────────────────────────────────────────────────────

/**
 * Parse a combined DMS coordinate string to decimal degrees.
 *
 * Accepted input: "31° 46′ 43″ N, 35° 14′ 5″ E"
 * Also handles ASCII variants: apostrophe, straight-quote, letter separators.
 *
 * Returns an array ['lat' => float, 'lon' => float] or null on parse failure.
 *
 * @param  string $dms_string
 * @return array|null
 */
function ksm_dms_to_decimal( $dms_string ) {
    if ( empty( $dms_string ) ) return null;

    $parts = array_map( 'trim', explode( ',', $dms_string ) );
    if ( count( $parts ) < 2 ) return null;

    $parsed = array();
    foreach ( $parts as $part ) {
        // Match degrees, minutes, seconds and optional NSEW direction
        if ( ! preg_match(
            '/(\d+)\s*[°d]\s*(\d+)\s*[\'′m]\s*([\d.]+)\s*[″"s]?\s*([NSEW])?/iu',
            $part,
            $m
        ) ) {
            return null;
        }

        $dec = floatval( $m[1] ) + floatval( $m[2] ) / 60.0 + floatval( $m[3] ) / 3600.0;
        if ( isset( $m[4] ) && preg_match( '/^[SW]$/i', $m[4] ) ) {
            $dec = -$dec;
        }
        $parsed[] = round( $dec, 6 );
    }

    if ( count( $parsed ) < 2 ) return null;

    return array( 'lat' => $parsed[0], 'lon' => $parsed[1] );
}

// ── Regional anchors (legacy fallback) ───────────────────────────────────────

/**
 * Regional anchor points in SVG coordinate space (viewBox 0 0 1920 1080).
 * Used as fallback position when a pin has no real coordinates.
 * Spread = max scatter radius for pseudo-random distribution within the region.
 */
function ksm_get_regional_anchors() {
    return array(
        'צפון'     => array( 'x' => 750,  'y' => 280, 'spread' => 40 ),
        'כרמל'    => array( 'x' => 230,  'y' => 440, 'spread' => 25 ),
        'מרכז'    => array( 'x' => 490,  'y' => 630, 'spread' => 40 ),
        'ירושלים'  => array( 'x' => 990,  'y' => 580, 'spread' => 25 ),
        'דרום'     => array( 'x' => 1350, 'y' => 780, 'spread' => 60 ),
    );
}

/**
 * Calculate a stable pseudo-random SVG position for a pin within its region.
 * Used as fallback for pins that have no geographic coordinates.
 * Uses crc32 of pin ID so the same pin always gets the same position.
 *
 * @param  int    $pin_id
 * @param  string $region_name  Hebrew region name
 * @return array  ['x' => float, 'y' => float]
 */
function ksm_pin_svg_position( $pin_id, $region_name ) {
    $anchors = ksm_get_regional_anchors();
    if ( ! isset( $anchors[ $region_name ] ) ) {
        return array( 'x' => 960.0, 'y' => 540.0 );
    }
    $a = $anchors[ $region_name ];

    $hash   = abs( crc32( 'ksm_pos_' . $pin_id ) );
    $angle  = ( $hash % 3600 ) / 10.0 * M_PI / 180;
    $radius = ( ( $hash >> 4 ) % 100 ) / 100.0 * $a['spread'] * 0.4;

    return array(
        'x' => round( $a['x'] + $radius * cos( $angle ), 1 ),
        'y' => round( $a['y'] + $radius * sin( $angle ), 1 ),
    );
}

// ── Main endpoint ─────────────────────────────────────────────────────────────

function keren_shutafut_get_pins() {
    $args = array(
        'post_type'      => 'pin',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    );

    $pins   = get_posts( $args );
    $result = array();

    foreach ( $pins as $pin ) {
        $project_link    = get_post_meta( $pin->ID, 'project_link',    true );
        $coordinates_dms = get_post_meta( $pin->ID, 'coordinates',     true );
        $latitude        = get_post_meta( $pin->ID, 'latitude',        true );
        $longitude       = get_post_meta( $pin->ID, 'longitude',       true );
        $operating_org   = get_post_meta( $pin->ID, 'operating_org',   true );

        // If decimal lat/lon are missing but a DMS string exists, parse it
        if ( ( ! $latitude || ! $longitude ) && $coordinates_dms ) {
            $parsed = ksm_dms_to_decimal( $coordinates_dms );
            if ( $parsed ) {
                $latitude  = $parsed['lat'];
                $longitude = $parsed['lon'];
            }
        }

        $lat_float = $latitude  ? floatval( $latitude )  : null;
        $lon_float = $longitude ? floatval( $longitude ) : null;

        $taxonomies = array(
            'geographic_region' => get_taxonomy_terms_with_details( $pin->ID, 'geographic_region' ),
            'activity_cycle'    => get_taxonomy_terms_with_details( $pin->ID, 'activity_cycle' ),
            'target_audience'   => get_taxonomy_terms_with_details( $pin->ID, 'target_audience' ),
            'domains'           => get_taxonomy_terms_with_details( $pin->ID, 'domains' ),
        );

        // Compute legacy SVG position as fallback (used when the pin has no
        // real coordinates and coordinate-utils.js GridManager cannot place it)
        $region_terms = wp_get_post_terms( $pin->ID, 'geographic_region', array( 'fields' => 'names' ) );
        $region_name  = ( ! is_wp_error( $region_terms ) && ! empty( $region_terms ) ) ? $region_terms[0] : '';
        $pos          = ksm_pin_svg_position( $pin->ID, $region_name );

        $result[] = array(
            'id'              => $pin->ID,
            'title'           => $pin->post_title,
            'content'         => wp_strip_all_tags( $pin->post_content ),
            'project_link'    => $project_link ?: null,
            'operating_org'   => $operating_org ?: null,
            'featured_image'  => get_the_post_thumbnail_url( $pin->ID, 'large' ) ?: null,
            // Coordinate data: JS GridManager uses latitude/longitude directly.
            // coordinates_dms is the human-readable source field (optional).
            'coordinates_dms' => $coordinates_dms ?: null,
            'latitude'        => $lat_float,
            'longitude'       => $lon_float,
            // Legacy fallback: pseudo-random position near region anchor.
            // Used by displayPins() when latitude/longitude are null.
            'svg_x'           => $pos['x'],
            'svg_y'           => $pos['y'],
            'taxonomies'      => $taxonomies,
        );
    }

    return rest_ensure_response( $result );
}

// ── Taxonomy helper ───────────────────────────────────────────────────────────

function get_taxonomy_terms_with_details( $post_id, $taxonomy ) {
    $terms = wp_get_post_terms( $post_id, $taxonomy );

    if ( is_wp_error( $terms ) || empty( $terms ) ) {
        return array();
    }

    $result = array();
    foreach ( $terms as $term ) {
        $result[] = array(
            'term_id' => $term->term_id,
            'name'    => $term->name,
            'slug'    => $term->slug,
        );
    }

    return $result;
}
