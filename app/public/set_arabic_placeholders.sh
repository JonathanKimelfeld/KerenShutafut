#!/usr/bin/env bash
# set_arabic_placeholders.sh
# Sets placeholder Arabic meta for all published pins.
# Run from the WordPress root directory:
#   cd /path/to/wordpress && bash set_arabic_placeholders.sh
#
# After running, edit each pin in WP Admin → Pins → Edit to fill in real Arabic content.

set -euo pipefail

echo "Setting Arabic title placeholder for all published pins..."
wp post list --post_type=pin --post_status=publish --format=ids | \
  tr ' ' '\n' | \
  xargs -I{} wp post meta update {} title_ar "بحاجة إلى ترجمة"

echo "Setting Arabic description placeholder for all published pins..."
wp post list --post_type=pin --post_status=publish --format=ids | \
  tr ' ' '\n' | \
  xargs -I{} wp post meta update {} description_ar "بحاجة إلى ترجمة"

echo "Done. Visit WP Admin → Pins to fill in Arabic translations."
