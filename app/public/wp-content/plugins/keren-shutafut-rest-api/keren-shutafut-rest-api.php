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

function keren_shutafut_get_pins() {
    $args = array(
        'post_type' => 'pin',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );
    
    $pins = get_posts($args);
    $result = array();
    
    foreach ($pins as $pin) {
        // Get ACF fields
        $project_link = get_post_meta($pin->ID, 'project_link', true);
        $latitude = get_post_meta($pin->ID, 'latitude', true);
        $longitude = get_post_meta($pin->ID, 'longitude', true);
        
        // Get taxonomies
        $taxonomies = array(
            'geographic_region' => get_taxonomy_terms_with_details($pin->ID, 'geographic_region'),
            'activity_cycle' => get_taxonomy_terms_with_details($pin->ID, 'activity_cycle'),
            'target_audience' => get_taxonomy_terms_with_details($pin->ID, 'target_audience'),
            'domains' => get_taxonomy_terms_with_details($pin->ID, 'domains')
        );
        
        $result[] = array(
            'id' => $pin->ID,
            'title' => $pin->post_title,
            'content' => wp_strip_all_tags($pin->post_content),
            'project_link' => $project_link,
            'latitude' => $latitude ? floatval($latitude) : null,
            'longitude' => $longitude ? floatval($longitude) : null,
            'taxonomies' => $taxonomies
        );
    }
    
    return rest_ensure_response($result);
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
