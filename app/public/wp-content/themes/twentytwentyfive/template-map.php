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
        <button id="map-reset-btn" aria-label="חזור למבט כולל">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 1h4v4M13 1h-4v4M1 13h4v-4M13 13h-4v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            הצג מפה מלאה
        </button>
    </div>

    <!-- Filter panel — fixed right overlay -->
    <aside class="filter-panel" dir="rtl" role="complementary" aria-label="פאנל סינון">
        <div class="filter-panel-inner">

            <div class="filter-panel-top">
                <h1 class="filter-panel-title">מפת שׁוּתָּפוּת</h1>
                <p class="panel-description">לפניך מפה עליה מופיעה פריסה של מיזמים הנתמכים על ידי <strong>קרן שותפות</strong>. מיזמים אלה, עוסקים בחברה משותפת, בקידום ערכים של חיים משותפים בין הקבוצות השונות המרכיבות את החברה הישראלית.<br>
                בעשייתם מראים המיזמים את מגוון האפשרויות המקוריות והמעניינות, לקידום סובלנות, שוויון ויצירת חיים בשותפות בישראל.</p>
            </div>

            <!-- חיפוש -->
            <div class="filter-search-row">
                <div class="search-input-group">
                    <input type="text" id="map-search" class="map-search-input"
                           placeholder="חפש פרויקט..." dir="rtl" autocomplete="off"
                           aria-label="חיפוש פרויקטים">
                    <button id="map-search-btn" class="map-search-btn" aria-label="חפש">
                        <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path fill="currentColor" d="M8.32,7.26c-1.23-1.06-.89-.62-2.12-1.67-.02-.02-.04-.04-.06-.06-.24-.28-.3-.67-.18-1.01.09-.24.14-.49.14-.76,0-1.28-1.11-2.36-2.39-2.36S1.46,2.47,1.46,3.75c0,1.24,1,2.25,2.24,2.26.27,0,.52-.04.77-.12.27-.08.56-.05.8.08.14.08.27.15.35.22,1.23,1.06.83.76,2.06,1.82.25.21.52.32.7.11l.06-.06c.18-.21.14-.59-.11-.8ZM2.12,3.7c0-1.17.9-1.68,1.6-1.68s1.64.5,1.64,1.68c0,.69-.5,1.74-1.64,1.74-.69,0-1.6-.81-1.6-1.74Z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- קהל יעד — single-select radio -->
            <div class="filter-group collapsible-group is-collapsed">
                <div class="filter-section-header collapsible-header" role="button" tabindex="0" aria-expanded="false">
                    <svg class="section-icon" width="18" height="18" viewBox="0 0 27.45 27.69" style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M13.89,0c-7.67,0-13.89,6.27-13.89,13.94s6.23,13.75,13.89,13.75,13.56-6.08,13.56-13.75-5.9-13.94-13.56-13.94ZM13.89,20.91c-4.15,0-7.42-2.83-7.42-6.98s3.27-7.8,7.42-7.8,7.57,3.65,7.57,7.8-3.42,6.98-7.57,6.98Z"/>
                        <path fill="#2b4a45" d="M17.93,13.94c0,2.39-1.65,4.24-4.04,4.24s-4.06-1.85-4.06-4.24,1.68-3.99,4.06-3.99,4.04,1.61,4.04,3.99Z"/>
                    </svg>
                    <h2 class="filter-group-title">קהל יעד</h2>
                    <svg class="chevron-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="filter-collapsible-body">
                <div class="filter-options-grid" data-filter-type="target_audience" role="radiogroup" aria-label="בחר קהל יעד">
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
                                '<label class="filter-option" for="%1$s"><input type="radio" id="%1$s" name="target_audience" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($a->name), esc_html($label)
                            );
                        }
                    }
                    ?>
                </div>
                </div>
            </div>

            <!-- מיקום — single-select radio -->
            <div class="filter-group collapsible-group is-collapsed">
                <div class="filter-section-header collapsible-header" role="button" tabindex="0" aria-expanded="false">
                    <svg class="section-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M248.25,83.64c-80.65-39.85-183.1,42.78-141.2,114.45,0,0,36.66,55.99,74.07,111.39,7.15,13.21,35.98,13.64,42.86.33,37.59-54.64,32.89-57.76,69.22-113.25,22.07-42.72,4.95-93.78-44.94-112.92ZM200,210.82c-81.26-1.18-81.25-99.24,0-100.42,81.25,1.18,81.24,99.24,0,100.42Z"/>
                    </svg>
                    <h2 class="filter-group-title">מיקום</h2>
                    <svg class="chevron-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="filter-collapsible-body">
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
            </div>

            <!-- מחזור — single-select radio, Hebrew alpha sort -->
            <div class="filter-group collapsible-group is-collapsed">
                <div class="filter-section-header collapsible-header" role="button" tabindex="0" aria-expanded="false">
                    <svg class="section-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M93.45,321.02h-9.53c-18.3,0-20.54-15.19-20.54-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h7.2c18.3,0,26.99,17.26,26.99,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="#2b4a45" d="M311.71,321.02h-5.62c-18.3,0-24.46-15.19-24.46-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h6.12c18.3,0,28.07,17.26,28.07,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="#2b4a45" d="M208.17,317.12l-7.09-.03c-18.3,0-30.44-11.26-30.44-29.56,0-90.07,4.42-90.07,4.42-180.15,0-18.3,14.82-34.84,33.12-34.84l7.35-.27c18.3,0,28.14,16.81,28.14,35.1,0,90.07-5.07,90.07-5.07,180.15,0,18.3-12.13,29.59-30.42,29.59Z"/>
                    </svg>
                    <h2 class="filter-group-title">מחזור</h2>
                    <svg class="chevron-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="filter-collapsible-body">
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
            </div>

            <!-- תחום — single-select radio -->
            <div class="filter-group filter-group--last collapsible-group is-collapsed">
                <div class="filter-section-header collapsible-header" role="button" tabindex="0" aria-expanded="false">
                    <svg class="section-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#2b4a45" d="M303.78,65.15c-47.63-9.6-75.61,13.28-77.67,61.83-2.1,49.69,22.91,59.25,71.67,69.08,40.25,8.12,52.22-4.01,70.59-40.73,26.59-53.14-10.59-79.28-64.59-90.18Z"/>
                        <path fill="#2b4a45" d="M113.11,307.24c-22.92-8.61-38.5-6.72-38.5-31.2,0-33.86,5.86-46.97,37.86-58.04,59.05-20.43,82.08-43.09,126.05,1.3,39.77,40.15,18.04,66.31-13.32,113.32-31.66,47.46-58.84-5.37-112.1-25.38Z"/>
                        <path fill="#2b4a45" d="M198.6,104.41c11.68,42.33-26.47,46.64-69.71,54.31-47.66,8.45-82.23,22.09-95.1-24.57-13.58-49.2,21.12-56.4,65.68-81.28,52.37-29.24,84.44-1.68,99.13,51.54Z"/>
                    </svg>
                    <h2 class="filter-group-title">תחום</h2>
                    <svg class="chevron-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="filter-collapsible-body">
                <div class="filter-options-grid" data-filter-type="domains" role="radiogroup" aria-label="בחר תחום">
                    <?php
                    $domains = get_terms(['taxonomy' => 'domains', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC']);
                    if (!is_wp_error($domains)) {
                        foreach ($domains as $d) {
                            $id = 'dm-' . sanitize_title($d->name);
                            printf(
                                '<label class="filter-option" for="%1$s"><input type="radio" id="%1$s" name="domains" data-term="%2$s" value="%2$s"><span class="option-text">%3$s</span></label>',
                                esc_attr($id), esc_attr($d->name), esc_html($d->name)
                            );
                        }
                    }
                    ?>
                </div>
                </div>
            </div>

            <!-- נקה הכל -->
            <div class="filter-clear-row">
                <button class="clear-all-btn" id="clear-all-filters">
                    <strong>נקה הכל</strong>
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

            <button class="project-panel-close" aria-label="סגור">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>

            <!-- Search results view (active when panel-search-mode) -->
            <div class="search-results-view" id="search-results-view">
                <h2 class="search-results-title" id="search-results-title"></h2>
                <div class="project-panel-divider"></div>
                <ul class="search-results-list" id="search-results-list"></ul>
            </div>

            <!-- Back to results button (active when panel-pin-from-search) -->
            <button class="back-to-results-btn" id="back-to-results-btn" aria-label="חזרה לתוצאות החיפוש">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="14" height="14">
                    <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                חזרה לתוצאות
            </button>

            <h2 class="project-panel-title">
                <img class="project-title-icon" src="<?php echo get_template_directory_uri(); ?>/assets/images/project_icon.svg" alt="" aria-hidden="true">
                <span class="project-title-text"></span>
            </h2>
            <div class="project-panel-divider"></div>

            <p class="project-panel-description"></p>
            <div class="project-panel-divider"></div>

            <ul class="project-panel-meta">
                <li class="project-meta-item" id="pm-region">
                    <svg class="meta-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M248.25,83.64c-80.65-39.85-183.1,42.78-141.2,114.45,0,0,36.66,55.99,74.07,111.39,7.15,13.21,35.98,13.64,42.86.33,37.59-54.64,32.89-57.76,69.22-113.25,22.07-42.72,4.95-93.78-44.94-112.92ZM200,210.82c-81.26-1.18-81.25-99.24,0-100.42,81.25,1.18,81.24,99.24,0,100.42Z"/>
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
                    <svg class="meta-icon" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="currentColor" d="M93.45,321.02h-9.53c-18.3,0-20.54-15.19-20.54-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h7.2c18.3,0,26.99,17.26,26.99,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="currentColor" d="M311.71,321.02h-5.62c-18.3,0-24.46-15.19-24.46-33.49,0-90.07-2.74-90.07-2.74-180.15,0-18.3,14.52-35.56,32.81-35.56h6.12c18.3,0,28.07,17.26,28.07,35.56,0,90.07,1.45,90.07,1.45,180.15,0,18.3-17.34,33.49-35.63,33.49Z"/>
                        <path fill="currentColor" d="M208.17,317.12l-7.09-.03c-18.3,0-30.44-11.26-30.44-29.56,0-90.07,4.42-90.07,4.42-180.15,0-18.3,14.82-34.84,33.12-34.84l7.35-.27c18.3,0,28.14,16.81,28.14,35.1,0,90.07-5.07,90.07-5.07,180.15,0,18.3-12.13,29.59-30.42,29.59Z"/>
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

            <div class="project-panel-divider" id="related-divider"></div>

            <div class="related-projects-section" id="related-projects-section">
                <p class="related-projects-title">אולי יעניין אותך גם:</p>
                <div class="related-carousel">
                    <ul class="carousel-track" id="related-projects-list"></ul>
                    <div class="carousel-footer">
                        <!-- RTL: prev is rightmost (right chevron), next is leftmost (left chevron) -->
                        <button class="carousel-arrow carousel-prev" aria-label="הקודם">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="carousel-dots" id="carousel-dots"></div>
                        <button class="carousel-arrow carousel-next" aria-label="הבא">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

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

<script>
document.querySelectorAll('.collapsible-header').forEach(function(header) {
    function toggle() {
        var group = header.closest('.collapsible-group');
        var isCollapsed = group.classList.toggle('is-collapsed');
        header.setAttribute('aria-expanded', String(!isCollapsed));
    }
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
});
</script>

<?php get_footer(); ?>
