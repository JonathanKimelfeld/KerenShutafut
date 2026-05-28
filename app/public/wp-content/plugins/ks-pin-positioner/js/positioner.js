jQuery(document).ready(function($) {
    let selectedPin = null;
    let allPositions = {};
    let savePending = false;
    
    // Load all existing positions
    loadAllPositions();
    
    // Pin item click - select pin
    $(document).on('click', '.ks-pin-item', function() {
        $('.ks-pin-item').removeClass('selected');
        $(this).addClass('selected');
        
        selectedPin = {
            id: $(this).data('pin-id'),
            title: $(this).data('title'),
            x: $(this).data('x'),
            y: $(this).data('y')
        };
        
        updateSelectedInfo();
        $('#ks-svg-map').addClass('pin-selected');
    });
    
    // Map click - position pin
    $('#ks-svg-map').on('click', function(e) {
        if (!selectedPin) {
            alert('Please select a pin first / בחר פין קודם');
            return;
        }

        if (savePending) return;

        // Get click coordinates relative to SVG
        const svg = this;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        // Update coordinates display
        $('#ks-click-coords').text(`${Math.round(svgP.x)}, ${Math.round(svgP.y)}`);

        // Save position
        savePinPosition(selectedPin.id, svgP.x, svgP.y);
    });
    
    // Clear position button
    $('#ks-clear-btn').on('click', function() {
        if (!selectedPin) return;
        
        if (confirm('Clear position for this pin? / למחוק את המיקום של הפין?')) {
            clearPinPosition(selectedPin.id);
        }
    });
    
    // Search functionality
    $('#ks-pin-search').on('input', function() {
        const search = $(this).val().toLowerCase();
        filterPins();
    });
    
    // Region filter
    $('#ks-region-filter').on('change', function() {
        filterPins();
    });
    
    // Toggle positioned pins on map
    $('#ks-show-pins').on('change', function() {
        if ($(this).is(':checked')) {
            renderPinMarkers();
        } else {
            $('#ks-pin-markers').empty();
        }
    });
    
    // Filter pins based on search and region
    function filterPins() {
        const search = $('#ks-pin-search').val().toLowerCase();
        const regionId = $('#ks-region-filter').val();
        
        $('.ks-pin-item').each(function() {
            const title = $(this).data('title').toLowerCase();
            const regions = $(this).data('regions').toString().split(',');
            
            let show = true;
            
            // Search filter
            if (search && !title.includes(search)) {
                show = false;
            }
            
            // Region filter
            if (regionId && !regions.includes(regionId)) {
                show = false;
            }
            
            $(this).toggle(show);
        });
    }
    
    // Update selected pin info panel
    function updateSelectedInfo() {
        $('#ks-selected-info').show();
        $('.selected-title').text(selectedPin.title);
        
        const x = parseFloat(selectedPin.x);
        const y = parseFloat(selectedPin.y);

        if (!isNaN(x) && !isNaN(y) && (x !== 0 || y !== 0)) {
            $('.coords-display').text(`x: ${Math.round(x)}, y: ${Math.round(y)}`);
        } else {
            $('.coords-display').text('לא ממוקם / Not positioned');
        }
    }
    
    // Save pin position via AJAX
    function savePinPosition(pinId, x, y) {
        savePending = true;
        $('#ks-save-status').text('Saving... / שומר...').removeClass('error');

        $.ajax({
            url: ksPositioner.ajaxUrl,
            type: 'POST',
            data: {
                action: 'ks_save_pin_position',
                nonce: ksPositioner.nonce,
                pin_id: pinId,
                x: x,
                y: y
            },
            success: function(response) {
                savePending = false;
                if (response.success) {
                    $('#ks-save-status').text('✓ Saved / נשמר').removeClass('error');

                    // Update pin item
                    const $pinItem = $(`.ks-pin-item[data-pin-id="${pinId}"]`);
                    $pinItem.addClass('positioned');
                    $pinItem.data('x', x);
                    $pinItem.data('y', y);
                    $pinItem.find('.pin-coords').remove();
                    $pinItem.append(`<span class="pin-coords">${Math.round(x)}, ${Math.round(y)}</span>`);
                    $pinItem.find('.dashicons').removeClass('dashicons-location-alt').addClass('dashicons-location');

                    // Update selected info
                    selectedPin.x = x;
                    selectedPin.y = y;
                    updateSelectedInfo();

                    // Update positions and re-render markers
                    allPositions[pinId] = { x: x, y: y, title: selectedPin.title };
                    renderPinMarkers();

                    setTimeout(() => {
                        $('#ks-save-status').text('');
                    }, 2000);
                } else {
                    $('#ks-save-status').text('✗ Error / שגיאה').addClass('error');
                }
            },
            error: function() {
                savePending = false;
                $('#ks-save-status').text('✗ Error / שגיאה').addClass('error');
            }
        });
    }
    
    // Clear pin position via AJAX
    function clearPinPosition(pinId) {
        $.ajax({
            url: ksPositioner.ajaxUrl,
            type: 'POST',
            data: {
                action: 'ks_clear_pin_position',
                nonce: ksPositioner.nonce,
                pin_id: pinId
            },
            success: function(response) {
                if (response.success) {
                    // Update pin item
                    const $pinItem = $(`.ks-pin-item[data-pin-id="${pinId}"]`);
                    $pinItem.removeClass('positioned');
                    $pinItem.data('x', '');
                    $pinItem.data('y', '');
                    $pinItem.find('.pin-coords').remove();
                    $pinItem.find('.dashicons').removeClass('dashicons-location').addClass('dashicons-location-alt');
                    
                    // Update selected info
                    selectedPin.x = '';
                    selectedPin.y = '';
                    updateSelectedInfo();
                    
                    // Remove from positions and re-render
                    delete allPositions[pinId];
                    renderPinMarkers();
                    
                    $('#ks-save-status').text('✓ Cleared / נמחק').removeClass('error');
                    setTimeout(() => {
                        $('#ks-save-status').text('');
                    }, 2000);
                }
            }
        });
    }
    
    // Load all existing positions
    function loadAllPositions() {
        $.ajax({
            url: ksPositioner.ajaxUrl,
            type: 'POST',
            data: {
                action: 'ks_get_all_positions',
                nonce: ksPositioner.nonce
            },
            success: function(response) {
                if (response.success) {
                    allPositions = response.data;
                    renderPinMarkers();
                }
            }
        });
    }
    
    // Render pin markers on the map
    function renderPinMarkers() {
        const $markers = $('#ks-pin-markers');
        $markers.empty();
        
        if (!$('#ks-show-pins').is(':checked')) {
            return;
        }
        
        Object.keys(allPositions).forEach(function(pinId) {
            const pos = allPositions[pinId];
            
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            marker.setAttribute('class', 'map-pin-marker');
            marker.setAttribute('data-pin-id', pinId);
            marker.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '8');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = pos.title;
            
            marker.appendChild(circle);
            marker.appendChild(title);
            $markers.append(marker);
        });
    }
    
    // Click on map marker to select that pin
    $(document).on('click', '.map-pin-marker', function(e) {
        e.stopPropagation();
        const pinId = $(this).data('pin-id');
        $(`.ks-pin-item[data-pin-id="${pinId}"]`).click();
        
        // Scroll pin into view
        const $pinItem = $(`.ks-pin-item[data-pin-id="${pinId}"]`);
        if ($pinItem.length) {
            $pinItem[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
});
