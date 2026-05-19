#!/usr/bin/env python3
import csv
import subprocess
import os

os.chdir('/Users/User/Local Sites/keren-shutafut-map/app/public')

# Read your fixed CSV with IDs
projects = {}
with open('project-data/projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        custom_id = row['id']
        title = row['post_title'].strip()
        projects[custom_id] = title

print(f"Loaded {len(projects)} projects\n")

# Match to WordPress posts
mapping = []
not_found = []

for custom_id, title in projects.items():
    try:
        # Search WordPress for this exact title
        result = subprocess.run([
            'wp', 'post', 'list',
            '--post_type=pin',
            f'--s={title}',
            '--fields=ID,post_title',
            '--format=csv'
        ], capture_output=True, text=True, timeout=5)
        
        lines = result.stdout.strip().split('\n')
        
        if len(lines) > 1:  # Found matches
            # Parse first match
            wp_id = lines[1].split(',')[0].strip()
            mapping.append({
                'custom_id': custom_id,
                'wordpress_id': wp_id,
                'title': title
            })
            print(f"✅ ID {custom_id} → WP {wp_id}: {title[:50]}...")
        else:
            not_found.append(f"ID {custom_id}: {title}")
            print(f"⚠️  No match for ID {custom_id}: {title[:50]}...")
    
    except subprocess.TimeoutExpired:
        print(f"⏱️  Timeout for ID {custom_id}: {title[:50]}...")
        not_found.append(f"ID {custom_id}: {title} (timeout)")
    except Exception as e:
        print(f"❌ Error for ID {custom_id}: {e}")
        not_found.append(f"ID {custom_id}: {title} ({e})")

# Save mapping
with open('project-data/id_mapping.csv', 'w', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['custom_id', 'wordpress_id', 'title'])
    writer.writeheader()
    writer.writerows(mapping)

print(f"\n{'='*60}")
print(f"✅ Matched: {len(mapping)}/{len(projects)} projects")
print(f"⚠️  Not found: {len(not_found)} projects")
print(f"{'='*60}")

if not_found:
    print("\nProjects not matched:")
    for item in not_found[:10]:  # Show first 10
        print(f"  • {item}")
    if len(not_found) > 10:
        print(f"  ... and {len(not_found) - 10} more")

print(f"\n✅ Created: project-data/id_mapping.csv")
