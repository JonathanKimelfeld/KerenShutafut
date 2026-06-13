<?php
/**
 * Plugin Name: Keren Shutafut REST API
 * Description: REST API endpoint for map pins
 * Version: 1.1
 */

// ── Arabic translation meta fields ────────────────────────────────────────────

add_action('init', function() {
    add_post_type_support('pin', 'custom-fields');

    // Arabic translation targets (writable via REST API)
    foreach ( ['title_ar', 'description_ar', 'operating_org_ar', 'location_ar'] as $key ) {
        register_post_meta('pin', $key, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'default'       => '',
            'auth_callback' => '__return_true',
        ]);
    }

    // Source fields needed by the translation script (readable via REST API)
    foreach ( ['operating_org', 'location'] as $key ) {
        register_post_meta('pin', $key, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'default'       => '',
            'auth_callback' => '__return_true',
        ]);
    }
});

// ── Arabic meta box ───────────────────────────────────────────────────────────

add_action('add_meta_boxes', function() {
    add_meta_box(
        'ksm_arabic_translation',
        'ترجمة عربية / Arabic Translation',
        'ksm_arabic_meta_box_html',
        'pin',
        'normal',
        'default'
    );
});

function ksm_arabic_meta_box_html($post) {
    wp_nonce_field('ksm_arabic_save', 'ksm_arabic_nonce');
    $title_ar        = get_post_meta($post->ID, 'title_ar',        true);
    $description_ar  = get_post_meta($post->ID, 'description_ar',  true);
    $operating_org_ar = get_post_meta($post->ID, 'operating_org_ar', true);
    ?>
    <table class="form-table" role="presentation">
        <tr>
            <th scope="row">
                <label for="ksm_title_ar">العنوان بالعربية (Arabic Title)</label>
            </th>
            <td>
                <input type="text" id="ksm_title_ar" name="title_ar"
                       value="<?php echo esc_attr($title_ar); ?>"
                       dir="rtl" style="width:100%;font-size:15px;"
                       placeholder="بحاجة إلى ترجمة">
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="ksm_description_ar">الوصف بالعربية (Arabic Description)</label>
            </th>
            <td>
                <textarea id="ksm_description_ar" name="description_ar"
                          rows="6" dir="rtl"
                          style="width:100%;font-size:14px;"
                          placeholder="بحاجة إلى ترجمة"><?php echo esc_textarea($description_ar); ?></textarea>
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="ksm_operating_org_ar">الجهة المشغّلة بالعربية (Arabic Org)</label>
            </th>
            <td>
                <input type="text" id="ksm_operating_org_ar" name="operating_org_ar"
                       value="<?php echo esc_attr($operating_org_ar); ?>"
                       dir="rtl" style="width:100%;font-size:15px;"
                       placeholder="بحاجة إلى ترجمة">
            </td>
        </tr>
    </table>
    <?php
}

add_action('save_post', function($post_id) {
    if (!isset($_POST['ksm_arabic_nonce'])) return;
    if (!wp_verify_nonce($_POST['ksm_arabic_nonce'], 'ksm_arabic_save')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (get_post_type($post_id) !== 'pin') return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (array_key_exists('title_ar', $_POST)) {
        update_post_meta($post_id, 'title_ar', sanitize_text_field($_POST['title_ar']));
    }
    if (array_key_exists('description_ar', $_POST)) {
        update_post_meta($post_id, 'description_ar', sanitize_textarea_field($_POST['description_ar']));
    }
    if (array_key_exists('operating_org_ar', $_POST)) {
        update_post_meta($post_id, 'operating_org_ar', sanitize_text_field($_POST['operating_org_ar']));
    }
});

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

        // SVG position: prefer manually-set coordinates from the positioner tool,
        // fall back to pseudo-random anchor position when none have been saved.
        $manual_svg_x = get_post_meta( $pin->ID, 'svg_x', true );
        $manual_svg_y = get_post_meta( $pin->ID, 'svg_y', true );
        $manually_positioned = ( $manual_svg_x !== '' && $manual_svg_y !== '' );

        if ( $manually_positioned ) {
            $pos = array( 'x' => floatval( $manual_svg_x ), 'y' => floatval( $manual_svg_y ) );
        } else {
            $region_terms = wp_get_post_terms( $pin->ID, 'geographic_region', array( 'fields' => 'names' ) );
            $region_name  = ( ! is_wp_error( $region_terms ) && ! empty( $region_terms ) ) ? $region_terms[0] : '';
            $pos          = ksm_pin_svg_position( $pin->ID, $region_name );
        }

        $result[] = array(
            'id'               => $pin->ID,
            'title'            => $pin->post_title,
            'title_en'         => get_post_meta( $pin->ID, 'title_en',         true ) ?: null,
            'title_ar'         => get_post_meta( $pin->ID, 'title_ar',         true ) ?: null,
            'description_ar'   => get_post_meta( $pin->ID, 'description_ar',   true ) ?: null,
            'content'          => wp_strip_all_tags( $pin->post_content ),
            'content_en'       => get_post_meta( $pin->ID, 'content_en',       true ) ?: null,
            'project_link'     => $project_link ?: null,
            'operating_org'    => $operating_org ?: null,
            'operating_org_en' => get_post_meta( $pin->ID, 'operating_org_en', true ) ?: null,
            'operating_org_ar' => get_post_meta( $pin->ID, 'operating_org_ar', true ) ?: null,
            'location'         => get_post_meta( $pin->ID, 'location',         true ) ?: null,
            'location_en'      => get_post_meta( $pin->ID, 'location_en',      true ) ?: null,
            'location_ar'      => get_post_meta( $pin->ID, 'location_ar',      true ) ?: null,
            'featured_image'  => get_the_post_thumbnail_url( $pin->ID, 'large' ) ?: null,
            // Coordinate data: JS GridManager uses latitude/longitude directly.
            // coordinates_dms is the human-readable source field (optional).
            'coordinates_dms' => $coordinates_dms ?: null,
            'latitude'        => $lat_float,
            'longitude'       => $lon_float,
            // SVG position used by displayPins() when GridManager cannot place the pin,
            // or when manually_positioned is true (GridManager is skipped entirely).
            'svg_x'              => $pos['x'],
            'svg_y'              => $pos['y'],
            'manually_positioned' => $manually_positioned,
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
