<?php
/**
 * Plugin Name: Keren Shutafut Taxonomies
 * Description: Registers custom taxonomies for the pin post type
 * Version: 1.0
 * Author: Keren Shutafut
 */

function keren_shutafut_register_taxonomies() {
    
    // 1. Geographic Region (מרחב גאוגרפי)
    register_taxonomy('geographic_region', 'pin', array(
        'labels' => array(
            'name' => 'אזורים גאוגרפיים',
            'singular_name' => 'אזור גאוגרפי',
            'menu_name' => 'אזורים גאוגרפיים',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
    
    // 2. Activity Cycle (מחזורי גיוס)
    register_taxonomy('activity_cycle', 'pin', array(
        'labels' => array(
            'name' => 'מחזורי פעילות',
            'singular_name' => 'מחזור פעילות',
            'menu_name' => 'מחזורי פעילות',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
    
    // 3. Target Audience (קהל יעד) - NEW
    register_taxonomy('target_audience', 'pin', array(
        'labels' => array(
            'name' => 'קהל יעד',
            'singular_name' => 'קהל יעד',
            'menu_name' => 'קהל יעד',
        ),
        'hierarchical' => false, // Flat tags, not hierarchical
        'public' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
    
    // 4. Domains (תחומי עיסוק) - NEW
    register_taxonomy('domains', 'pin', array(
        'labels' => array(
            'name' => 'תחומי עיסוק',
            'singular_name' => 'תחום עיסוק',
            'menu_name' => 'תחומי עיסוק',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
}
add_action('init', 'keren_shutafut_register_taxonomies');

// Create the 9 target audience terms on activation
function keren_shutafut_create_target_audience_terms() {
    $terms = array(
        'יהודים וערבים',
        'נוער וילדים',
        'קהל מגוון',
        'נשים',
        'צעירים וסטודנטים',
        'אנשי מקצוע ופעילים',
        'דתיים וחילונים',
        'להט"ב',
        'מוגבלויות'
    );
    
    foreach ($terms as $term) {
        if (!term_exists($term, 'target_audience')) {
            wp_insert_term($term, 'target_audience');
        }
    }
}
register_activation_hook(__FILE__, 'keren_shutafut_create_target_audience_terms');
