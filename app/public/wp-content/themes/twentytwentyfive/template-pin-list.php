<?php
/**
 * Template Name: Pin List View
 * Description: Searchable table view of all pins
 */

get_header();
?>

<div class="pin-list-container" dir="rtl">
    <h1>כל הפרויקטים</h1>
    
    <div class="list-controls">
        <input type="text" id="search-pins" placeholder="חיפוש פרויקטים..." />
        
        <select id="filter-region">
            <option value="">כל האזורים</option>
        </select>
        
        <select id="filter-cycle">
            <option value="">כל המחזורים</option>
        </select>
    </div>

    <div id="pins-table-container">
        <table id="pins-table">
            <thead>
                <tr>
                    <th>שם הפרויקט</th>
                    <th>אזור</th>
                    <th>מחזור</th>
                    <th>קהל יעד</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody id="pins-tbody">
                <!-- Populated by JavaScript -->
            </tbody>
        </table>
    </div>
    
    <div id="results-info">
        <span id="showing-count">0</span> מתוך <span id="total-count">0</span> פרויקטים
    </div>
</div>

<script>
window.kerenShutafutMapData = {
    restUrl: '<?php echo esc_url(rest_url('keren-shutafut/v1/pins')); ?>',
    nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
};

(function() {
    let allPins = [];
    
    async function loadPins() {
        const response = await fetch(window.kerenShutafutMapData.restUrl);
        allPins = await response.json();
        
        buildFilters();
        displayPins(allPins);
    }
    
    function buildFilters() {
        const regions = new Set();
        const cycles = new Set();
        
        allPins.forEach(pin => {
            pin.taxonomies.geographic_region?.forEach(r => regions.add(r.name));
            pin.taxonomies.activity_cycle?.forEach(c => cycles.add(c.name));
        });
        
        const regionSelect = document.getElementById('filter-region');
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });
        
        const cycleSelect = document.getElementById('filter-cycle');
        cycles.forEach(cycle => {
            const option = document.createElement('option');
            option.value = cycle;
            option.textContent = cycle;
            cycleSelect.appendChild(option);
        });
    }
    
    function displayPins(pins) {
        const tbody = document.getElementById('pins-tbody');
        tbody.innerHTML = '';
        
        pins.forEach(pin => {
            const row = document.createElement('tr');
            
            const regions = pin.taxonomies.geographic_region?.map(r => r.name).join(', ') || '-';
            const cycles = pin.taxonomies.activity_cycle?.map(c => c.name).join(', ') || '-';
            const audiences = pin.taxonomies.target_audience?.map(a => a.name).join(', ') || '-';
            
            row.innerHTML = `
                <td class="pin-title-cell"><strong>${pin.title}</strong></td>
                <td>${regions}</td>
                <td>${cycles}</td>
                <td class="audiences-cell">${audiences}</td>
                <td>
                    <a href="?p=${pin.id}" class="view-link">צפייה</a>
                    ${pin.project_link ? `<a href="${pin.project_link}" target="_blank" class="external-link">קישור</a>` : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('showing-count').textContent = pins.length;
        document.getElementById('total-count').textContent = allPins.length;
    }
    
    function filterPins() {
        const searchTerm = document.getElementById('search-pins').value.toLowerCase();
        const regionFilter = document.getElementById('filter-region').value;
        const cycleFilter = document.getElementById('filter-cycle').value;
        
        const filtered = allPins.filter(pin => {
            const matchesSearch = !searchTerm || 
                pin.title.toLowerCase().includes(searchTerm) ||
                pin.content.toLowerCase().includes(searchTerm);
            
            const matchesRegion = !regionFilter ||
                pin.taxonomies.geographic_region?.some(r => r.name === regionFilter);
            
            const matchesCycle = !cycleFilter ||
                pin.taxonomies.activity_cycle?.some(c => c.name === cycleFilter);
            
            return matchesSearch && matchesRegion && matchesCycle;
        });
        
        displayPins(filtered);
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        loadPins();
        
        document.getElementById('search-pins').addEventListener('input', filterPins);
        document.getElementById('filter-region').addEventListener('change', filterPins);
        document.getElementById('filter-cycle').addEventListener('change', filterPins);
    });
})();
</script>

<style>
.pin-list-container {
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pin-list-container h1 {
    font-size: 36px;
    margin-bottom: 30px;
    color: #333;
}

.list-controls {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

#search-pins {
    flex: 1;
    min-width: 250px;
    padding: 12px 16px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
}

.list-controls select {
    padding: 12px 16px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    background: white;
    cursor: pointer;
}

#pins-table-container {
    overflow-x: auto;
    margin-bottom: 20px;
}

#pins-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

#pins-table th {
    background: #4a90e2;
    color: white;
    padding: 15px;
    text-align: right;
    font-weight: 600;
    position: sticky;
    top: 0;
}

#pins-table td {
    padding: 15px;
    border-bottom: 1px solid #eee;
}

#pins-table tr:hover {
    background: #f8f9fa;
}

.pin-title-cell {
    font-size: 16px;
}

.audiences-cell {
    font-size: 14px;
    color: #666;
}

.view-link, .external-link {
    display: inline-block;
    padding: 6px 12px;
    margin-left: 5px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
}

.view-link {
    background: #4a90e2;
    color: white;
}

.external-link {
    background: #5aa02c;
    color: white;
}

.view-link:hover {
    background: #3a7bc8;
}

.external-link:hover {
    background: #4a8024;
}

#results-info {
    text-align: center;
    color: #666;
    font-size: 16px;
    padding: 20px;
}

@media (max-width: 768px) {
    .list-controls {
        flex-direction: column;
    }
    
    #search-pins {
        width: 100%;
    }
    
    #pins-table {
        font-size: 14px;
    }
    
    #pins-table th, #pins-table td {
        padding: 10px 8px;
    }
}
</style>

<?php get_footer(); ?>
