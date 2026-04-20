/**
 * Keren Shutafut Interactive Map
 * Merged version combining Apply button workflow with modern features
 */

(function() {
    'use strict';
    
    let allPins = [];
    let activeFilters = {
        geographic: null,
        cycle: null,
        audience: []
    };
    
    // Initialize map when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initMap();
        loadPins();
    });
    
    /**
     * Initialize SVG map of Israel
     */
    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.warn('Map container not found');
            return;
        }
        
        // Load custom SVG map
        loadSVGMap();
    }
    

    async function loadSVGMap() {
		
	const mapContainer = document.getElementById('map');

    	try {
		const response = await fetch('/wp-content/themes/twentytwentyfive/assets/images/israel-map.svg');
        	const svgText = await response.text();
          	mapContainer.innerHTML = svgText;
	  	setupRegionInteractivity(); 
   	} catch (error) {
       		console.error('Error loading SVG:', error);
	}
    }

    /**
     * Sync map region selection with filter buttons
     */
    function syncMapRegionSelection(regionName) {
        document.querySelectorAll('.clickable-region').forEach(r => r.classList.remove('selected'));
        document.querySelectorAll('.region-label').forEach(l => l.classList.remove('visible'));

        if (regionName) {
            document.querySelectorAll('.clickable-region').forEach(r => {
                if (r.dataset.region === regionName) r.classList.add('selected');
            });
            document.querySelectorAll('.region-label').forEach(l => {
                if (l.dataset.region === regionName) l.classList.add('visible');
            });
        }
    }

    
    function setupRegionInteractivity() {
        const regions = document.querySelectorAll('.clickable-region[data-region]');
        
        regions.forEach(region => {
            const regionName = region.dataset.region;
            
            // Click handler
            region.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const wasActive = activeFilters.geographic === regionName;

                // Clear geographic filter buttons
                const geoButtons = document.querySelectorAll('[data-filter-type="geographic_region"] .filter-btn');
                geoButtons.forEach(btn => btn.classList.remove('active'));

                if (!wasActive) {
                    activeFilters.geographic = regionName;

                    // Activate corresponding filter button
                    geoButtons.forEach(btn => {
                        if (btn.dataset.term === regionName) btn.classList.add('active');
                    });
                } else {
                    activeFilters.geographic = null;
                }

                syncMapRegionSelection(activeFilters.geographic);
                applyFilters();
            });
            
            // Hover cursor (visual hover handled by CSS)
            region.addEventListener('mouseenter', function() {
                this.style.cursor = 'pointer';
            });
        });
    }
    
    /**
     * Fetch all pins from WordPress REST API
     */
    async function loadPins() {
        try {
            // Try both possible API URL formats
            const apiUrl = window.kerenShutafutData?.apiUrl || 
                          window.kerenShutafutMapData?.restUrl;
            
            if (!apiUrl) {
                throw new Error('API URL not found in window object');
            }
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allPins = data;
            
            console.log(`Loaded ${allPins.length} pins`);
            
            // Display all pins initially
            applyFilters();
            
        } catch (error) {
            console.error('Error loading pins:', error);
            document.getElementById('map')?.insertAdjacentHTML('beforeend', 
                '<text x="200" y="300" text-anchor="middle" fill="red">שגיאה בטעינת הפרויקטים</text>'
            );
        }
    }
    
    /**
     * Setup filter button click handlers
     */
    function setupFilters() {
        // Geographic region (single-select)
        document.querySelectorAll('[data-filter-type="geographic_region"] .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const term = this.dataset.term;
                
                if (activeFilters.geographic === term) {
                    activeFilters.geographic = null;
                    this.classList.remove('active');
                } else {
                    // Remove active from siblings
                    this.parentElement.querySelectorAll('.filter-btn').forEach(b => 
                        b.classList.remove('active')
                    );
                    activeFilters.geographic = term;
                    this.classList.add('active');
                }
                
                // Sync with map regions
                syncMapRegionSelection(activeFilters.geographic);
                applyFilters();
            });
        });
        
        // Activity cycle (single-select)
        document.querySelectorAll('[data-filter-type="activity_cycle"] .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const term = this.dataset.term;
                
                if (activeFilters.cycle === term) {
                    activeFilters.cycle = null;
                    this.classList.remove('active');
                } else {
                    this.parentElement.querySelectorAll('.filter-btn').forEach(b => 
                        b.classList.remove('active')
                    );
                    activeFilters.cycle = term;
                    this.classList.add('active');
                }
		
		syncMapRegionSelection(activeFilters.geographic);                
                applyFilters();
            });
        });
        
        // Target audience (multi-select)
        document.querySelectorAll('[data-filter-type="target_audience"] input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const term = this.dataset.term;
                
                if (this.checked) {
                    if (!activeFilters.audience.includes(term)) {
                        activeFilters.audience.push(term);
                    }
                } else {
                    activeFilters.audience = activeFilters.audience.filter(a => a !== term);
                }
                
                applyFilters();
            });
        });
    }
    
    /**
     * Apply filters and update map display
     */
    function applyFilters() {
        let filteredPins = allPins;
        
        // Filter by geographic region
        if (activeFilters.geographic) {
            filteredPins = filteredPins.filter(pin => {
                if (!pin.taxonomies || !pin.taxonomies.geographic_region) return false;
                
                // Handle both array of strings and array of objects
                const regions = Array.isArray(pin.taxonomies.geographic_region) 
                    ? pin.taxonomies.geographic_region 
                    : [];
                
                return regions.some(region => {
                    const regionName = typeof region === 'object' ? region.name : region;
                    return regionName === activeFilters.geographic;
                });
            });
        }
        
        // Filter by activity cycle
        if (activeFilters.cycle) {
            filteredPins = filteredPins.filter(pin => {
                if (!pin.taxonomies || !pin.taxonomies.activity_cycle) return false;
                
                const cycles = Array.isArray(pin.taxonomies.activity_cycle) 
                    ? pin.taxonomies.activity_cycle 
                    : [];
                
                return cycles.some(cycle => {
                    const cycleName = typeof cycle === 'object' ? cycle.name : cycle;
                    return cycleName === activeFilters.cycle;
                });
            });
        }
        
        // Filter by target audiences (must have ALL selected)
        if (activeFilters.audience.length > 0) {
            filteredPins = filteredPins.filter(pin => {
                if (!pin.taxonomies || !pin.taxonomies.target_audience) return false;
                
                const audiences = Array.isArray(pin.taxonomies.target_audience) 
                    ? pin.taxonomies.target_audience 
                    : [];
                
                const pinAudiences = audiences.map(a => 
                    typeof a === 'object' ? a.name : a
                );
                
                return activeFilters.audience.every(a => pinAudiences.includes(a));
            });
        }
        
        console.log(`Filtered to ${filteredPins.length} pins`);
        
        displayPins(filteredPins);
        updateCounts(filteredPins);
    }
    
    /**
     * Display pins on map - show count badges per region
     */
    function displayPins(pins) {
        // Group pins by region
        const pinsByRegion = {
            'צפון': [],
            'מרכז': [],
            'דרום': [],
            'כרמל': []
        };
        
        pins.forEach(pin => {
            if (!pin.taxonomies || !pin.taxonomies.geographic_region) return;
            
            const regions = Array.isArray(pin.taxonomies.geographic_region) 
                ? pin.taxonomies.geographic_region 
                : [];
            
            regions.forEach(region => {
                const regionName = typeof region === 'object' ? region.name : region;
                if (pinsByRegion[regionName]) {
                    pinsByRegion[regionName].push(pin);
                }
            });
        });
        
        // Clear old markers
        const markersGroup = document.getElementById('pin-markers');
        if (!markersGroup) return;
        
        markersGroup.innerHTML = '';
        
        // Add count badges to regions
        Object.keys(pinsByRegion).forEach(regionName => {
            const count = pinsByRegion[regionName].length;
            const region = document.querySelector(`[data-region="${regionName}"]`);
            
            if (region && count > 0 && activeFilters.geographic !== regionName) {
                const bbox = region.getBBox();
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                
                // Use puzzle piece badge
                const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                badge.classList.add('pin-count-badge');
                badge.dataset.region = regionName;
                badge.style.cursor = 'pointer';
                
                badge.innerHTML = `
                    <use href="#puzzle-piece" x="${centerX - 25}" y="${centerY - 25}" 
                         width="50" height="50" fill="var(--color-puzzle-rust)" 
                         filter="url(#puzzle-shadow)"/>
                    <circle cx="${centerX}" cy="${centerY}" r="14" fill="white"/>
                    <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" 
                          fill="var(--color-rust)" font-size="16" font-weight="bold">${count}</text>
                `;
                
                // Click handler — select region (same as clicking the region directly)
                badge.addEventListener('click', function(e) {
                    e.stopPropagation();

                    const wasActive = activeFilters.geographic === regionName;
                    const geoButtons = document.querySelectorAll('[data-filter-type="geographic_region"] .filter-btn');
                    geoButtons.forEach(btn => btn.classList.remove('active'));

                    if (!wasActive) {
                        activeFilters.geographic = regionName;
                        geoButtons.forEach(btn => {
                            if (btn.dataset.term === regionName) btn.classList.add('active');
                        });
                    } else {
                        activeFilters.geographic = null;
                    }

                    syncMapRegionSelection(activeFilters.geographic);
                    applyFilters();
                });
                
                // Hover title
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `${count} פרויקטים ב${regionName} - לחץ לפרטים`;
                badge.appendChild(title);
                
                markersGroup.appendChild(badge);
            }
        });
    }
    
    /**
     * Update filter counts
     */
    function updateCounts(filteredPins) {
        // Update count badges on filter buttons
        updateFilterCounts('geographic_region', filteredPins);
        updateFilterCounts('activity_cycle', filteredPins);
        updateFilterCounts('target_audience', filteredPins);
    }
    
    function updateFilterCounts(taxonomy, filteredPins) {
        const container = document.querySelector(`[data-filter-type="${taxonomy}"]`);
        if (!container) return;
        
        const buttons = container.querySelectorAll('[data-term]');
        
        buttons.forEach(btn => {
            const term = btn.dataset.term;
            
            const count = filteredPins.filter(pin => {
                if (!pin.taxonomies || !pin.taxonomies[taxonomy]) return false;
                
                const terms = Array.isArray(pin.taxonomies[taxonomy]) 
                    ? pin.taxonomies[taxonomy] 
                    : [];
                
                return terms.some(t => {
                    const termName = typeof t === 'object' ? t.name : t;
                    return termName === term;
                });
            }).length;
            
            const countSpan = btn.querySelector('.count');
            if (countSpan) {
                countSpan.textContent = count;
            }
        });
    }
    
    /**
     * Show modal with list of pins in a region
     */
    function showPinListModal(regionName, pins) {
        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        if (!modal) {
            console.warn('Modal not found in template');
            return;
        }
        
        title.textContent = `${regionName} - ${pins.length} פרויקטים`;
        
        body.innerHTML = pins.map(pin => `
            <div class="pin-item">
                <h3>${pin.title}</h3>
                <p>${pin.description ? pin.description.substring(0, 150) + '...' : 
                     (pin.content ? pin.content.substring(0, 150) + '...' : '')}</p>
            </div>
        `).join('');
        
        modal.classList.remove('hidden');
    }
    
    // Modal close handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close') || 
            e.target.classList.contains('modal-overlay')) {
            const modal = document.getElementById('modal-overlay');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    });
    
    // Initialize filters when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setupFilters();
    });
    
})();
