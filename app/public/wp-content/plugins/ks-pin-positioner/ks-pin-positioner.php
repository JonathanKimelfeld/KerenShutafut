<?php
/**
 * Plugin Name: Keren Shutafut - Pin Positioner
 * Description: Visual tool to position pins on the SVG map
 * Version: 1.0
 * Author: Jonathan
 */

if (!defined('ABSPATH')) {
    exit;
}


class KS_Pin_Positioner {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // AJAX handlers
        add_action('wp_ajax_ks_save_pin_position', array($this, 'save_pin_position'));
        add_action('wp_ajax_ks_get_all_positions', array($this, 'get_all_positions'));
        add_action('wp_ajax_ks_clear_pin_position', array($this, 'clear_pin_position'));
    }
    
    public function add_admin_menu() {
        add_submenu_page(
            'edit.php?post_type=pin',
            'Position Pins on Map',
            'Position on Map',
            'edit_posts',
            'ks-position-pins',
            array($this, 'render_admin_page')
        );
    }
    
    public function enqueue_assets($hook) {
        if ($hook !== 'pin_page_ks-position-pins') {
            return;
        }
        
        wp_enqueue_style(
            'ks-positioner-css',
            plugin_dir_url(__FILE__) . 'css/positioner.css',
            array(),
            '1.0'
        );
        
        wp_enqueue_script(
            'ks-positioner-js',
            plugin_dir_url(__FILE__) . 'js/positioner.js',
            array('jquery'),
            '1.0',
            true
        );
        
        wp_localize_script('ks-positioner-js', 'ksPositioner', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ks_positioner_nonce')
        ));
    }
    
    public function render_admin_page() {
        $pins = get_posts(array(
            'post_type' => 'pin',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        ));
        
        $regions = get_terms(array(
            'taxonomy' => 'geographic_region',
            'hide_empty' => false
        ));
        
        include plugin_dir_path(__FILE__) . 'templates/admin-page.php';
    }
    
    public function save_pin_position() {
        check_ajax_referer('ks_positioner_nonce', 'nonce');
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
            return;
        }

        $pin_id = intval($_POST['pin_id']);

        $post = get_post($pin_id);
        if ( ! $post || $post->post_type !== 'pin' ) {
            wp_send_json_error( array( 'message' => 'Invalid pin ID' ) );
            return;
        }

        $x = floatval($_POST['x']);
        $y = floatval($_POST['y']);

        update_post_meta($pin_id, 'svg_x', $x);
        update_post_meta($pin_id, 'svg_y', $y);

        wp_send_json_success(array(
            'pin_id' => $pin_id,
            'x' => $x,
            'y' => $y
        ));
    }
    
    public function get_all_positions() {
        check_ajax_referer('ks_positioner_nonce', 'nonce');
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
            return;
        }

        $pins = get_posts(array(
            'post_type' => 'pin',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ));
        
        $positions = array();
        foreach ($pins as $pin_id) {
            $x = get_post_meta($pin_id, 'svg_x', true);
            $y = get_post_meta($pin_id, 'svg_y', true);
            
            if ($x && $y) {
                $positions[$pin_id] = array(
                    'x' => floatval($x),
                    'y' => floatval($y),
                    'title' => get_the_title($pin_id)
                );
            }
        }
        
        wp_send_json_success($positions);
    }
    
    public function clear_pin_position() {
        check_ajax_referer('ks_positioner_nonce', 'nonce');
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
            return;
        }

        $pin_id = intval($_POST['pin_id']);
        
        delete_post_meta($pin_id, 'svg_x');
        delete_post_meta($pin_id, 'svg_y');
        
        wp_send_json_success(array('pin_id' => $pin_id));
    }
}

new KS_Pin_Positioner();
