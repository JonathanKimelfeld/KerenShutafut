<div class="wrap ks-positioner-wrap">
    <h1>מיקום פינים על המפה / Position Pins on Map</h1>
    <p class="description">בחר פין מהרשימה ולחץ על המפה כדי למקם אותו / Click a pin from the list, then click on the map to position it</p>
    
    <div class="ks-positioner-container">
        
        <!-- Sidebar: Pin List -->
        <div class="ks-sidebar">
            <div class="sidebar-section">
                <h2>Select Pin / בחר פין</h2>
                
                <input type="text" 
                       id="ks-pin-search" 
                       class="ks-search" 
                       placeholder="חפש פין / Search pins...">
                
                <select id="ks-region-filter" class="ks-filter">
                    <option value="">כל האזורים / All Regions</option>
                    <?php foreach ($regions as $region): ?>
                        <option value="<?php echo esc_attr($region->term_id); ?>">
                            <?php echo esc_html($region->name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                
                <div class="ks-pin-list" id="ks-pin-list">
                    <?php foreach ($pins as $pin): 
                        $svg_x = get_post_meta($pin->ID, 'svg_x', true);
                        $svg_y = get_post_meta($pin->ID, 'svg_y', true);
                        $has_position = !empty($svg_x) && !empty($svg_y);
                        
                        $pin_regions = wp_get_post_terms($pin->ID, 'geographic_region');
                        $region_ids = array();
                        foreach ($pin_regions as $r) {
                            $region_ids[] = $r->term_id;
                        }
                    ?>
                        <div class="ks-pin-item <?php echo $has_position ? 'positioned' : ''; ?>" 
                             data-pin-id="<?php echo esc_attr($pin->ID); ?>"
                             data-regions="<?php echo esc_attr(implode(',', $region_ids)); ?>"
                             data-title="<?php echo esc_attr($pin->post_title); ?>"
                             data-x="<?php echo esc_attr($svg_x); ?>"
                             data-y="<?php echo esc_attr($svg_y); ?>">
                            
                            <span class="pin-status">
                                <?php if ($has_position): ?>
                                    <span class="dashicons dashicons-location"></span>
                                <?php else: ?>
                                    <span class="dashicons dashicons-location-alt"></span>
                                <?php endif; ?>
                            </span>
                            
                            <span class="pin-title"><?php echo esc_html($pin->post_title); ?></span>
                            
                            <?php if ($has_position): ?>
                                <span class="pin-coords"><?php echo round($svg_x); ?>, <?php echo round($svg_y); ?></span>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <!-- Selected Pin Info -->
            <div class="sidebar-section" id="ks-selected-info" style="display:none;">
                <h3>Selected / נבחר</h3>
                <div class="selected-details">
                    <p class="selected-title"></p>
                    <p class="selected-coords">
                        <strong>Position / מיקום:</strong><br>
                        <span class="coords-display">לא ממוקם / Not positioned</span>
                    </p>
                    <button type="button" class="button" id="ks-clear-btn">
                        נקה מיקום / Clear Position
                    </button>
                </div>
            </div>
            
            <!-- Instructions -->
            <div class="sidebar-section instructions">
                <h3>הוראות / Instructions</h3>
                <ol>
                    <li>בחר פין מהרשימה / Select a pin from the list</li>
                    <li>לחץ על המפה איפה שהפין צריך להופיע / Click on the map where the pin should appear</li>
                    <li>המיקום נשמר אוטומטית / Position saves automatically</li>
                </ol>
                
                <div class="legend">
                    <p><span class="dashicons dashicons-location"></span> = ממוקם / Positioned</p>
                    <p><span class="dashicons dashicons-location-alt"></span> = לא ממוקם / Not positioned</p>
                </div>
            </div>
        </div>
        
        <!-- Map Area -->
        <div class="ks-map-area">
            <div class="map-header">
                <h2>Israel Map / מפת ישראל</h2>
                <div class="map-controls">
                    <label>
                        <input type="checkbox" id="ks-show-pins" checked>
                        הצג פינים ממוקמים / Show Positioned Pins
                    </label>
                </div>
            </div>
            
            <div class="map-canvas" id="ks-map-canvas">
                <?php
                $svg_path = get_template_directory() . '/assets/images/background-map.svg';
                if ( file_exists( $svg_path ) ) {
                    $svg = file_get_contents( $svg_path );
                    // Ensure the <svg> tag has id="ks-svg-map"
                    $svg = preg_replace( '/<svg\b([^>]*)>/i', '<svg id="ks-svg-map"$1>', $svg, 1 );
                    // Add pin markers group before closing </svg>
                    $svg = str_replace( '</svg>', '<g id="ks-pin-markers"></g></svg>', $svg );
                    echo $svg;
                } else {
                    echo '<p class="error">' . esc_html__( 'Map SVG file not found: ' . $svg_path ) . '</p>';
                }
                ?>
            </div>
            
            <div class="map-footer">
                <span class="coordinates">לחץ על המפה / Click on map: <span id="ks-click-coords">-</span></span>
                <span class="save-status" id="ks-save-status"></span>
            </div>
        </div>
        
    </div>
</div>
