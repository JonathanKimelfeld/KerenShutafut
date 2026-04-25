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
                    <svg class="section-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M303.78,65.15c-47.63-9.6-75.61,13.28-77.67,61.83-2.1,49.69,22.91,59.25,71.67,69.08,40.25,8.12,52.22-4.01,70.59-40.73,26.59-53.14-10.59-79.28-64.59-90.18Z"/>
                        <path fill="#2b4a45" d="M113.11,307.24c-22.92-8.61-38.5-6.72-38.5-31.2,0-33.86,5.86-46.97,37.86-58.04,59.05-20.43,82.08-43.09,126.05,1.3,39.77,40.15,18.04,66.31-13.32,113.32-31.66,47.46-58.84-5.37-112.1-25.38Z"/>
                        <path fill="#2b4a45" d="M198.6,104.41c11.68,42.33-26.47,46.64-69.71,54.31-47.66,8.45-82.23,22.09-95.1-24.57-13.58-49.2,21.12-56.4,65.68-81.28,52.37-29.24,84.44-1.68,99.13,51.54Z"/>
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

            <!-- נקה הכל -->
            <div class="filter-clear-row">
                <button class="clear-all-btn" id="clear-all-filters">
                    נקה הכל
                    <svg class="clear-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M199.2,33.79c-90.2,0-158.45,76.18-158.45,166.39s68.25,158.87,158.45,158.87,168.03-68.67,168.03-158.87S289.4,33.79,199.2,33.79ZM199.2,107.29c14.35,0,27.46,3.89,38.87,10.5-6.73,14.94-19.49,32.8-43.66,43.92-36.33,16.71-59.39,67.69-68.34,91.11-12.45-14.3-20.18-32.38-20.18-52.65,0-48.84,44.47-92.89,93.31-92.89ZM199.2,285.55c-9.2,0-18.24-1.3-26.86-3.73,9.17-20.3,24.91-42.52,51.78-53.01,25.27-9.87,43.69-30.01,56.51-49.75,1.45,6.86,2.29,13.92,2.29,21.12,0,48.84-34.89,85.37-83.73,85.37Z"/>
                    </svg>
                </button>
            </div>

        </div>
    </aside>

    <!-- Project details panel — slides in from right, overlays filter panel -->
    <div id="project-panel" class="project-panel" role="dialog" aria-modal="true" aria-hidden="true" dir="rtl">
        <div class="project-panel-inner">

            <button class="project-panel-close" aria-label="סגור">&times;</button>

            <h2 class="project-panel-title"></h2>
            <div class="project-panel-divider"></div>

            <p class="project-panel-description"></p>
            <div class="project-panel-divider"></div>

            <ul class="project-panel-meta">
                <li class="project-meta-item" id="pm-region">
                    <svg class="meta-icon" viewBox="0 0 29.96 22.03" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M14.98,3.04c-6.85-3.04-14.98,2.5-11.42,7.97,0,0,3.46,5.48,6.8,11.02.61,1.01,2.3,1.31,2.88.29,3.15-5.47,2.71-5.73,5.86-11.2,1.88-3.26.12-6.62-4.12-8.08ZM11.32,12.28c-6.91-.09-6.91-8.08,0-8.17,6.91.09,6.91,8.08,0,8.17Z"/>
                    </svg>
                    <span></span>
                </li>
                <li class="project-meta-item" id="pm-audience">
                    <svg class="meta-icon" viewBox="0 0 27.45 27.69" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M13.89,0c-7.67,0-13.89,6.27-13.89,13.94s6.23,13.75,13.89,13.75,13.56-6.08,13.56-13.75-5.9-13.94-13.56-13.94ZM13.89,20.91c-4.15,0-7.42-2.83-7.42-6.98s3.27-7.8,7.42-7.8,7.57,3.65,7.57,7.8-3.42,6.98-7.57,6.98Z"/>
                        <path fill="currentColor" d="M17.93,13.94c0,2.39-1.65,4.24-4.04,4.24s-4.06-1.85-4.06-4.24,1.68-3.99,4.06-3.99,4.04,1.61,4.04,3.99Z"/>
                    </svg>
                    <span></span>
                </li>
                <li class="project-meta-item" id="pm-domains">
                    <svg class="meta-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M303.78,65.15c-47.63-9.6-75.61,13.28-77.67,61.83-2.1,49.69,22.91,59.25,71.67,69.08,40.25,8.12,52.22-4.01,70.59-40.73,26.59-53.14-10.59-79.28-64.59-90.18Z"/>
                        <path fill="currentColor" d="M113.11,307.24c-22.92-8.61-38.5-6.72-38.5-31.2,0-33.86,5.86-46.97,37.86-58.04,59.05-20.43,82.08-43.09,126.05,1.3,39.77,40.15,18.04,66.31-13.32,113.32-31.66,47.46-58.84-5.37-112.1-25.38Z"/>
                        <path fill="currentColor" d="M198.6,104.41c11.68,42.33-26.47,46.64-69.71,54.31-47.66,8.45-82.23,22.09-95.1-24.57-13.58-49.2,21.12-56.4,65.68-81.28,52.37-29.24,84.44-1.68,99.13,51.54Z"/>
                    </svg>
                    <span></span>
                </li>
                <li class="project-meta-item" id="pm-cycle">
                    <svg class="meta-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" fill="none"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    <span></span>
                </li>
            </ul>
            <div class="project-panel-divider"></div>

            <div class="project-panel-org" id="pm-org">
                <span class="org-label">ארגון מפעיל:</span>
                <span class="org-name"></span>
            </div>
            <div class="project-panel-divider"></div>

            <a class="project-panel-link" id="pm-link" href="#" target="_blank" rel="noopener noreferrer">
                <img class="meta-icon" src="<?php echo get_template_directory_uri(); ?>/assets/images/link_icon.svg" alt="" aria-hidden="true">
                <strong>לינק לאתר</strong>
            </a>

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
