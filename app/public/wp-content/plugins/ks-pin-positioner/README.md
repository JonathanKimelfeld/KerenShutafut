# Keren Shutafut Pin Positioner Plugin

Visual WordPress admin tool for positioning pins on your SVG map.

## Installation

1. **Upload the plugin folder** to `wp-content/plugins/`:
   ```bash
   cp -r ks-pin-positioner /path/to/wordpress/wp-content/plugins/
   ```

2. **Activate the plugin** in WordPress admin:
   - Go to Plugins → Installed Plugins
   - Find "Keren Shutafut - Pin Positioner"
   - Click "Activate"

3. **Access the tool**:
   - Go to Pins → Position on Map

## How to Use

1. **Select a pin** from the list on the left
2. **Click on the map** where you want the pin to appear
3. **Position saves automatically** - you'll see a green checkmark
4. Positioned pins show a blue location icon (📍)
5. Click the pin marker on the map to select and reposition it

### Features

- ✅ Search pins by name
- ✅ Filter by geographic region
- ✅ Visual feedback for positioned vs unpositioned pins
- ✅ Click markers on map to select pins
- ✅ Clear position button
- ✅ Auto-save positions
- ✅ Hebrew/English bilingual interface

## Replacing the Placeholder Map

The plugin includes a placeholder SVG. Replace it with your actual map:

1. Open `templates/admin-page.php`
2. Find the `<svg id="ks-svg-map">` section
3. Replace the placeholder content with your actual SVG map code
4. **Important**: Keep the `id="ks-svg-map"` attribute
5. **Important**: Keep the `<g id="ks-pin-markers"></g>` at the end

Example:
```html
<svg id="ks-svg-map" viewBox="0 0 800 1200" xmlns="http://www.w3.org/2000/svg">
    <!-- Your actual Israel map SVG paths here -->
    <path d="M..." fill="#..." />
    <!-- etc. -->
    
    <!-- Keep this at the end! -->
    <g id="ks-pin-markers"></g>
</svg>
```

## Integration with Frontend

After positioning pins, you need to update your frontend map to use these coordinates.

### 1. Update REST API

Add svg_x and svg_y to your REST API response in `keren-shutafut-rest-api.php`:

```php
// Around line 152, after featured_image:
$pin_data['svg_x'] = get_post_meta($pin->ID, 'svg_x', true);
$pin_data['svg_y'] = get_post_meta($pin->ID, 'svg_y', true);
```

### 2. Update Frontend map.js

Modify your pin positioning logic to use manual coordinates when available:

```javascript
pins.forEach(pin => {
    let x, y;
    
    // Use manual SVG coordinates if available
    if (pin.svg_x && pin.svg_y) {
        x = parseFloat(pin.svg_x);
        y = parseFloat(pin.svg_y);
    } else {
        // Fallback to calculated coordinates from lat/long
        x = calculateX(pin.latitude);
        y = calculateY(pin.latitude);
    }
    
    // Position the pin group
    pinGroup.setAttribute('transform', `translate(${x}, ${y})`);
});
```

## File Structure

```
ks-pin-positioner/
├── ks-pin-positioner.php     # Main plugin file
├── css/
│   └── positioner.css         # Admin styles
├── js/
│   └── positioner.js          # Admin JavaScript
└── templates/
    └── admin-page.php         # Admin interface HTML
```

## Troubleshooting

### Pins not saving
- Check browser console for JavaScript errors
- Verify AJAX URL in Network tab
- Ensure nonce is valid

### Map not displaying
- Verify SVG is properly formatted
- Check that `id="ks-svg-map"` exists
- Look for JavaScript errors in console

### Coordinates seem wrong
- SVG viewBox should match your map dimensions
- Verify click coordinates are relative to SVG, not page
- Check that SVG coordinates match your map scale

## Future Enhancements

- Drag-and-drop pin positioning
- Zoom and pan controls
- Bulk import positions from CSV
- Export positions for backup

## Support

For issues or questions, contact: Jonathan
