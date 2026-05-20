#!/usr/bin/env python3
"""
Fix corrupted taxonomy terms on LOCAL site only.
Root cause: update_pins.py passed term IDs as strings, creating new terms
named "133", "136" etc. instead of using existing terms with those IDs.
"""

import subprocess
import json
import sys

WP      = '/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/posix/wp'
WP_PATH = '/Users/User/Local Sites/keren-shutafut-map/app/public'

def wp(*args):
    cmd = [WP, f'--path={WP_PATH}'] + list(args)
    return subprocess.run(cmd, capture_output=True, text=True)

def wp_eval(php):
    return wp('eval', php)

# ── Fix definitions ───────────────────────────────────────────────────────────
# Each entry: (taxonomy, fake_term_id, real_term_id)
# fake_term_id = the corrupted term whose name is a number
# real_term_id = the correct term it should have been
NUMERIC_FIXES = [
    # geographic_region
    ('geographic_region', 160, 133),  # "133" → ירושלים
    ('geographic_region', 165, 140),  # "140" → כרמל
    ('geographic_region', 171, 143),  # "143" → מרכז
    ('geographic_region', 173, 145),  # "145" → דרום
    ('geographic_region', 186, 151),  # "151" → צפון

    # activity_cycle
    ('activity_cycle', 161, 134),  # "134" → מחזור א
    ('activity_cycle', 180, 152),  # "152" → מחזור ב
    ('activity_cycle', 189, 156),  # "156" → מחזור ג
    ('activity_cycle', 194, 157),  # "157" → מחזור ד
    ('activity_cycle', 199, 158),  # "158" → מחזור ה
    ('activity_cycle', 204, 159),  # "159" → מחזור ו

    # target_audience
    ('target_audience', 162, 135),  # "135" → צעירים וסטודנטים
    ('target_audience', 163, 136),  # "136" → יהודים וערבים
    ('target_audience', 170, 138),  # "138" → נשים
    ('target_audience', 166, 141),  # "141" → דתיים וחילונים
    ('target_audience', 183, 153),  # "153" → להט"ב
    ('target_audience', 182, 181),  # "181" → בני ובנות נוער
    ('target_audience', 188, 187),  # "187" → אנשים עם צרכים מיוחדים
    ('target_audience', 191, 190),  # "190" → ילדים - הגיל הרך (will be renamed)
    ('target_audience', 193, 192),  # "192" → החברה החרדית
    ('target_audience', 201, 141),  # "200" → דתיים וחילונים (בתיים וחילונים merge)

    # domains
    ('domains', 164, 137),  # "137" → שפה
    ('domains', 168, 142),  # "142" → קהילה ורווחה
    ('domains', 172, 144),  # "144" → ספורט
    ('domains', 177, 147),  # "147" → אומנות ותרבות
    ('domains', 179, 148),  # "148" → חינוך
    ('domains', 198, 150),  # "150" → מוסיקה
    ('domains', 195, 154),  # "154" → לימוד בין-דתי
    ('domains', 169, 167),  # "167" → קבוצות מנהיגות
    ('domains', 175, 174),  # "174" → טבע קיימות וסביבה
    ('domains', 178, 176),  # "176" → השכלה גבוהה
    ('domains', 185, 154),  # "184" (לימוד בין דתי no hyphen) → לימוד בין-דתי
    ('domains', 197, 174),  # "196" (קטבע typo) → טבע קיימות וסביבה
    ('domains', 203, 137),  # "202" (ש]ה) → שפה
]

# Spelling-error terms to merge into correct term then delete
SPELLING_FIXES = [
    ('target_audience', 200, 141),  # בתיים וחילונים → דתיים וחילונים
    ('domains', 202, 137),           # ש]ה → שפה
    ('domains', 196, 174),           # קטבע קיימות וסביבה → טבע קיימות וסביבה
    ('domains', 184, 154),           # לימוד בין דתי (no hyphen) → לימוד בין-דתי
]

# Terms to rename after all fixes: (taxonomy, term_id, new_name)
RENAMES = [
    ('target_audience', 190, 'הגיל הרך'),  # ילדים - הגיל הרך → הגיל הרך
]

# ── Helper: reassign all pins from one term to another, then delete fake ──────

def reassign_and_delete(taxonomy, from_term_id, to_term_id):
    """Move all post assignments from from_term_id to to_term_id, then delete from_term_id."""
    php = f"""
$from = {from_term_id};
$to   = {to_term_id};
$tax  = '{taxonomy}';

// Get all posts assigned to the fake term
$posts = get_posts([
    'post_type'      => 'pin',
    'posts_per_page' => -1,
    'post_status'    => 'any',
    'tax_query'      => [[
        'taxonomy' => $tax,
        'field'    => 'term_id',
        'terms'    => [$from],
    ]],
]);

$count = 0;
foreach ($posts as $post) {{
    wp_set_post_terms($post->ID, [$to], $tax, true);   // append real term
    wp_remove_object_terms($post->ID, $from, $tax);     // remove fake term
    $count++;
}}

// Delete the fake term
wp_delete_term($from, $tax);

echo "$count posts reassigned from term $from to $to in $tax\\n";
"""
    r = wp_eval(php)
    if r.returncode == 0:
        print(f"  ✅ {r.stdout.strip()}")
    else:
        print(f"  ❌ {r.stderr.strip()}")

def rename_term(taxonomy, term_id, new_name):
    php = f"""
$result = wp_update_term({term_id}, '{taxonomy}', ['name' => '{new_name}']);
if (is_wp_error($result)) {{
    echo "ERROR: " . $result->get_error_message() . "\\n";
}} else {{
    echo "Renamed term {term_id} to '{new_name}' in {taxonomy}\\n";
}}
"""
    r = wp_eval(php)
    if r.returncode == 0:
        print(f"  ✅ {r.stdout.strip()}")
    else:
        print(f"  ❌ {r.stderr.strip()}")

# ── Execute ───────────────────────────────────────────────────────────────────

print("=== Phase 1: Fix numeric (corrupted) terms ===\n")
for taxonomy, fake_id, real_id in NUMERIC_FIXES:
    print(f"[{taxonomy}] term {fake_id} → {real_id}")
    reassign_and_delete(taxonomy, fake_id, real_id)

print("\n=== Phase 2: Fix spelling errors ===\n")
for taxonomy, bad_id, good_id in SPELLING_FIXES:
    # Skip if already deleted in phase 1 (some overlap)
    check = wp('term', 'get', taxonomy, str(bad_id), '--field=name')
    if check.returncode != 0:
        print(f"  ⚠️  term {bad_id} in {taxonomy} already gone — skipping")
        continue
    print(f"[{taxonomy}] Merging term {bad_id} ({check.stdout.strip()}) → {good_id}")
    reassign_and_delete(taxonomy, bad_id, good_id)

print("\n=== Phase 3: Renames ===\n")
for taxonomy, term_id, new_name in RENAMES:
    print(f"[{taxonomy}] Renaming term {term_id} → '{new_name}'")
    rename_term(taxonomy, term_id, new_name)

print("\n=== Phase 4: Verification ===\n")

pin_count = wp('post', 'list', '--post_type=pin', '--post_status=any', '--format=count')
print(f"Total pins: {pin_count.stdout.strip()}")

for tax in ['geographic_region', 'activity_cycle', 'target_audience', 'domains']:
    r = wp('term', 'list', tax, '--fields=name,count', '--format=json')
    terms = json.loads(r.stdout)
    numeric = [t for t in terms if t['name'].lstrip('-').isdigit()]
    print(f"\n{tax}:")
    for t in sorted(terms, key=lambda x: x['name']):
        flag = " ⚠️  STILL NUMERIC" if t['name'].lstrip('-').isdigit() else ""
        print(f"  {t['name']} ({t['count']} pins){flag}")
    if not numeric:
        print("  ✅ No corrupted terms remaining")
