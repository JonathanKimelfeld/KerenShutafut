<?php
/**
 * Template Name: Interactive Map
 * Description: Full-width interactive map with filters for Keren Shutafut pins
 */

get_header();

wp_enqueue_script('keren-coordinate-utils', get_template_directory_uri() . '/assets/js/coordinate-utils.js', [], '1.0', true);
wp_enqueue_script('keren-map-script', get_template_directory_uri() . '/assets/js/map.js', ['keren-coordinate-utils'], '2.0', true);
wp_enqueue_style('keren-map-style',  get_template_directory_uri() . '/assets/css/map.css', [], '2.0');
?>

<div class="map-page" dir="rtl">

    <!-- Full-screen map (underlies the panel) -->
    <div id="map-container" aria-hidden="true">
        <div id="map"></div>
    </div>

    <!-- Filter panel — fixed right overlay -->
    <aside class="filter-panel" dir="rtl" role="complementary" aria-label="פאנל סינון">
        <div class="filter-panel-inner">

            <div class="filter-panel-top">
                <h1 class="filter-panel-title">מפת שׁוּתָּפוּת</h1>
                <p class="panel-description">לפניך מפה עליה מופיעה פריסה של מיזמים הנתמכים על ידי <strong>קרן שותפות</strong>. מיזמים אלה, עוסקים בחברה משותפת, בקידום ערכים של חיים משותפים בין הקבוצות השונות המרכיבות את החברה הישראלית.<br>
                בעשייתם מראים המיזמים את מגוון האפשרויות המקוריות והמעניינות, לקידום סובלנות, שוויון ויצירת חיים בשותפות בישראל.</p>
            </div>

            <!-- קהל יעד — multi-select -->
            <div class="filter-group">
                <div class="filter-section-header">
                    <svg class="section-icon" width="28" height="28" viewBox="0 0 27.45 27.69" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M13.89,0c-7.67,0-13.89,6.27-13.89,13.94s6.23,13.75,13.89,13.75,13.56-6.08,13.56-13.75-5.9-13.94-13.56-13.94ZM13.89,20.91c-4.15,0-7.42-2.83-7.42-6.98s3.27-7.8,7.42-7.8,7.57,3.65,7.57,7.8-3.42,6.98-7.57,6.98Z"/>
                        <path fill="#2b4a45" d="M17.93,13.94c0,2.39-1.65,4.24-4.04,4.24s-4.06-1.85-4.06-4.24,1.68-3.99,4.06-3.99,4.04,1.61,4.04,3.99Z"/>
                    </svg>
                    <h2 class="filter-group-title">קהל יעד</h2>
                </div>
                <div class="filter-options-grid" data-filter-type="target_audience" role="group" aria-label="בחר קהל יעד">
                    <?php
                    $audiences = get_terms(['taxonomy' => 'target_audience', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC']);
                    $label_overrides = [ 'אנשי מקצוע ופעילים' => 'אקטיביסטים' ];
                    $hidden_terms    = [ 'קהל מגוון' ];
                    if (!is_wp_error($audiences)) {
                        foreach ($audiences as $a) {
                            if ( in_array( $a->name, $hidden_terms, true ) ) continue;
                            $label = $label_overrides[ $a->name ] ?? $a->name;
                            $id = 'ta-' . sanitize_title($a->name);
                            printf(
                                '<label class="filter-option" for="%1$s"><input type="checkbox" id="%1$s" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($a->name), esc_html($label)
                            );
                        }
                    }
                    ?>
                </div>
            </div>

            <!-- מיקום — single-select radio -->
            <div class="filter-group">
                <div class="filter-section-header">
                    <svg class="section-icon" width="24" height="22" viewBox="0 0 29.96 22.03" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M14.98,3.04c-6.85-3.04-14.98,2.5-11.42,7.97,0,0,3.46,5.48,6.8,11.02.61,1.01,2.3,1.31,2.88.29,3.15-5.47,2.71-5.73,5.86-11.2,1.88-3.26.12-6.62-4.12-8.08ZM11.32,12.28c-6.91-.09-6.91-8.08,0-8.17,6.91.09,6.91,8.08,0,8.17Z"/>
                    </svg>
                    <h2 class="filter-group-title">מיקום</h2>
                </div>
                <div class="filter-options-grid" data-filter-type="geographic_region" role="radiogroup" aria-label="בחר מיקום">
                    <?php
                    $regions = get_terms(['taxonomy' => 'geographic_region', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC']);
                    if (!is_wp_error($regions)) {
                        foreach ($regions as $r) {
                            $id = 'gr-' . sanitize_title($r->name);
                            printf(
                                '<label class="filter-option" for="%1$s"><input type="radio" id="%1$s" name="geographic_region" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($r->name), esc_html($r->name)
                            );
                        }
                    }
                    ?>
                </div>
            </div>

            <!-- מחזור — single-select radio, Hebrew alpha sort -->
            <div class="filter-group">
                <div class="filter-section-header">
                    <svg class="section-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M93.45,321.02h-9.53c-18.3,0-20.54-15.19-20.54-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h7.2c18.3,0,26.99,17.26,26.99,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="#2b4a45" d="M311.71,321.02h-5.62c-18.3,0-24.46-15.19-24.46-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h6.12c18.3,0,28.07,17.26,28.07,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="#2b4a45" d="M208.17,317.12l-7.09-.03c-18.3,0-30.44-11.26-30.44-29.56,0-90.07,4.42-90.07,4.42-180.15,0-18.3,14.82-34.84,33.12-34.84l7.35-.27c18.3,0,28.14,16.81,28.14,35.1,0,90.07-5.07,90.07-5.07,180.15,0,18.3-12.13,29.59-30.42,29.59Z"/>
                    </svg>
                    <h2 class="filter-group-title">מחזור</h2>
                </div>
                <div class="filter-options-grid" data-filter-type="activity_cycle" role="radiogroup" aria-label="בחר מחזור פעילות">
                    <?php
                    $cycles = get_terms(['taxonomy' => 'activity_cycle', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC']);
                    if (!is_wp_error($cycles)) {
                        foreach ($cycles as $c) {
                            $id = 'ac-' . sanitize_title($c->name);
                            printf(
                                '<label class="filter-option" for="%1$s"><input type="radio" id="%1$s" name="activity_cycle" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($c->name), esc_html($c->name)
                            );
                        }
                    }
                    ?>
                </div>
            </div>

            <!-- תחום — multi-select -->
            <div class="filter-group filter-group--last">
                <div class="filter-section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="#2b4a45" stroke-width="1.5"/>
                        <circle cx="7" cy="7" r="1.5" fill="#2b4a45"/>
                    </svg>
                    <h2 class="filter-group-title">תחום</h2>
                </div>
                <div class="filter-options-grid" data-filter-type="domains" role="group" aria-label="בחר תחום">
                    <?php
                    $domains = get_terms(['taxonomy' => 'domains', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC']);
                    if (!is_wp_error($domains)) {
                        foreach ($domains as $d) {
                            $id = 'dm-' . sanitize_title($d->name);
                            printf(
                                '<label class="filter-option" for="%1$s"><input type="checkbox" id="%1$s" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($d->name), esc_html($d->name)
                            );
                        }
                    }
                    ?>
                </div>
            </div>

        </div>
    </aside>

    <div id="modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-content">
            <button class="modal-close" aria-label="סגור">&times;</button>
            <h2 id="modal-title"></h2>
            <div id="modal-body"></div>
        </div>
    </div>

</div>

<script>
window.kerenShutafutMapData = {
    restUrl: '<?php echo esc_url(rest_url('keren-shutafut/v1/pins')); ?>',
    nonce:   '<?php echo wp_create_nonce('wp_rest'); ?>'
};
window.kerenShutafutData = { apiUrl: window.kerenShutafutMapData.restUrl, nonce: window.kerenShutafutMapData.nonce };
</script>

<?php get_footer(); ?>
