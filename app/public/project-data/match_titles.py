#!/usr/bin/env python3
import csv

# Load WordPress posts (ID → title)
wp_posts = {}
with open('all_wordpress_posts.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Clean title for matching
        title = row['post_title'].strip()
        wp_posts[title] = row['ID']

print(f"Loaded {len(wp_posts)} WordPress posts\n")

# Load your CSV projects
projects = []
with open('projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        projects.append(row)

print(f"Loaded {len(projects)} projects from your CSV\n")

# Match by title
mapping = []
not_found = []

for project in projects:
    custom_id = project['id']
    title = project['post_title'].strip()
    
    if title in wp_posts:
        wp_id = wp_posts[title]
        mapping.append({
            'custom_id': custom_id,
            'wordpress_id': wp_id,
            'title': title
        })
        print(f"✅ ID {custom_id} → WP {wp_id}: {title[:60]}")
    else:
        not_found.append(f"ID {custom_id}: {title}")
        print(f"⚠️  No match for ID {custom_id}: {title[:60]}")

# Save mapping
with open('id_mapping.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['custom_id', 'wordpress_id', 'title'])
    writer.writeheader()
    writer.writerows(mapping)

print(f"\n{'='*70}")
print(f"✅ Matched: {len(mapping)}/{len(projects)} projects")
print(f"⚠️  Not found: {len(not_found)} projects")
print(f"{'='*70}")

if not_found:
    print("\nNot matched (first 10):")
    for item in not_found[:10]:
        print(f"  • {item}")

print(f"\n✅ Created: id_mapping.csv")
