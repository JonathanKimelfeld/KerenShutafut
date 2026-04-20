<?php
/**
 * Template Name: Interactive Map
 * Description: Full-width interactive map with filters for Keren Shutafut pins
 */

get_header();
?>

<div id="map-page-container" class="map-page-container">
    <!-- Filter Panel -->
    <div id="filter-panel" class="filter-panel">
        <div class="filter-header">
            <h2>סנן פרויקטים</h2>
            <button id="reset-filters" class="reset-btn">איפוס</button>
        </div>
        
        <!-- Geographic Region Filter -->
        <div class="filter-group">
            <h3>מרחב גאוגרפי</h3>
            <div id="geographic-filter" class="filter-buttons">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <!-- Activity Cycle Filter -->
        <div class="filter-group">
            <h3>מחזורי פעילות</h3>
            <div id="cycle-filter" class="filter-buttons">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <!-- Target Audience Filter -->
        <div class="filter-group">
            <h3>קהל יעד</h3>
            <div id="audience-filter" class="filter-checkboxes">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <!-- Apply Filters Button -->
        <div class="filter-actions">
            <button id="apply-filters" class="apply-btn">הצג תוצאות</button>
        </div>
        
        <!-- Results Counter -->
        <div class="results-counter">
            <span id="results-count">0</span> פרויקטים
        </div>
    </div>
    
    <!-- Map Container -->
    <div id="map-container" class="map-container">
        <div id="map" class="map"></div>
    </div>
</div>

<?php
// Enqueue our custom map script and styles
wp_enqueue_script('keren-map-script', get_template_directory_uri() . '/assets/js/map.js', array(), '1.0', true);
wp_enqueue_style('keren-map-style', get_template_directory_uri() . '/assets/css/map.css', array(), '1.0');
?>

<!-- Pass WordPress data to JavaScript -->
<script>
    // Make REST API URL available to our map script
    window.kerenShutafutMapData = {
        restUrl: '<?php echo esc_url(rest_url('keren-shutafut/v1/pins')); ?>',
        nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
    };
</script>

<?php get_footer(); ?>
