<?php
/**
 * Template Name: Interactive Map
 * Description: Keren Shutafut interactive map with filters
 */

get_header();
?>

<div class="map-wrapper">
    <div class="map-header">
        <h1><?php the_title(); ?></h1>
    </div>
    
    <div class="map-content-layout">
        <!-- Filters Sidebar (right side in RTL) -->
        <aside class="map-sidebar">
            <div class="map-filters">
                <!-- Geographic Region Filter -->
                <div class="filter-group">
                    <label>אזור גיאוגרפי</label>
                    <div class="filter-buttons" data-filter-type="geographic_region">
                        <?php
                        $regions = get_terms(array(
                            'taxonomy' => 'geographic_region',
                            'hide_empty' => false
                        ));

                        if (!is_wp_error($regions)) {
                            foreach ($regions as $region) {
                                printf(
                                    '<button class="filter-btn" data-term="%s">%s <span class="count">0</span></button>',
                                    esc_attr($region->name),
                                    esc_html($region->name)
                                );
                            }
                        }
                        ?>
                    </div>
                </div>

                <!-- Activity Cycle Filter -->
                <div class="filter-group">
                    <label>מחזור פעילות</label>
                    <div class="filter-buttons" data-filter-type="activity_cycle">
                        <?php
                        $cycles = get_terms(array(
                            'taxonomy' => 'activity_cycle',
                            'hide_empty' => false
                        ));

                        if (!is_wp_error($cycles)) {
                            foreach ($cycles as $cycle) {
                                printf(
                                    '<button class="filter-btn" data-term="%s">%s <span class="count">0</span></button>',
                                    esc_attr($cycle->name),
                                    esc_html($cycle->name)
                                );
                            }
                        }
                        ?>
                    </div>
                </div>

                <!-- Target Audience Filter (multi-select) -->
                <div class="filter-group">
                    <label>קהל יעד</label>
                    <div class="filter-checkboxes" data-filter-type="target_audience">
                        <?php
                        $audiences = get_terms(array(
                            'taxonomy' => 'target_audience',
                            'hide_empty' => false
                        ));

                        if (!is_wp_error($audiences)) {
                            foreach ($audiences as $audience) {
                                printf(
                                    '<label><input type="checkbox" data-term="%s"> %s <span class="count">0</span></label>',
                                    esc_attr($audience->name),
                                    esc_html($audience->name)
                                );
                            }
                        }
                        ?>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Map Container (left side in RTL) -->
        <div id="map-container">
            <!-- Puzzle piece SVG definitions (hidden) -->
            <?php include get_template_directory() . '/assets/images/puzzle-pieces.svg'; ?>

            <!-- SVG Map will be inserted here by JavaScript -->
            <div id="map"></div>
        </div>
    </div>
    
    <!-- Modal for Pin Lists -->
    <div id="modal-overlay" class="modal-overlay hidden">
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <h2 id="modal-title"></h2>
            <div id="modal-body"></div>
        </div>
    </div>
</div>

<script>
// Pass PHP data to JavaScript
window.kerenShutafutData = {
    apiUrl: '<?php echo esc_url(rest_url('keren-shutafut/v1/pins')); ?>',
    nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
};
</script>

<?php
get_footer();
?>
