<?php
/**
 * Plugin Name: Keren Shutafut REST API
 * Description: REST API endpoint for map pins
 * Version: 1.0
 */

add_action('rest_api_init', function() {
    register_rest_route('keren-shutafut/v1', '/pins', array(
        'methods' => 'GET',
        'callback' => 'keren_shutafut_get_pins',
        'permission_callback' => '__return_true'
    ));
});

/**
 * Regional anchor points in SVG coordinate space (viewBox 0 0 1920 1080).
 * Positions derived from region label coordinates in israel-map.svg.
 * Spread = max scatter radius for pin distribution within the region.
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
 * Uses crc32 of pin ID so the same pin always gets the same coordinates.
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

function keren_shutafut_get_pins() {
    $args = array(
        'post_type'      => 'pin',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    );

    $pins   = get_posts( $args );
    $result = array();

    foreach ( $pins as $pin ) {
        $project_link = get_post_meta( $pin->ID, 'project_link', true );
        $latitude     = get_post_meta( $pin->ID, 'latitude', true );
        $longitude    = get_post_meta( $pin->ID, 'longitude', true );

        $taxonomies = array(
            'geographic_region' => get_taxonomy_terms_with_details( $pin->ID, 'geographic_region' ),
            'activity_cycle'    => get_taxonomy_terms_with_details( $pin->ID, 'activity_cycle' ),
            'target_audience'   => get_taxonomy_terms_with_details( $pin->ID, 'target_audience' ),
            'domains'           => get_taxonomy_terms_with_details( $pin->ID, 'domains' ),
        );

        // Calculate SVG position from primary geographic region
        $region_terms = wp_get_post_terms( $pin->ID, 'geographic_region', array( 'fields' => 'names' ) );
        $region_name  = ( ! is_wp_error( $region_terms ) && ! empty( $region_terms ) ) ? $region_terms[0] : '';
        $pos          = ksm_pin_svg_position( $pin->ID, $region_name );

        $result[] = array(
            'id'           => $pin->ID,
            'title'        => $pin->post_title,
            'content'      => wp_strip_all_tags( $pin->post_content ),
            'project_link' => $project_link,
            'latitude'     => $latitude  ? floatval( $latitude )  : null,
            'longitude'    => $longitude ? floatval( $longitude ) : null,
            'svg_x'        => $pos['x'],
            'svg_y'        => $pos['y'],
            'taxonomies'   => $taxonomies,
        );
    }

    return rest_ensure_response( $result );
}

function get_taxonomy_terms_with_details($post_id, $taxonomy) {
    $terms = wp_get_post_terms($post_id, $taxonomy);
    
    if (is_wp_error($terms) || empty($terms)) {
        return array();
    }
    
    $result = array();
    foreach ($terms as $term) {
        $result[] = array(
            'term_id' => $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug
        );
    }
    
    return $result;
}
