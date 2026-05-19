#!/usr/bin/env python3
import csv
import subprocess
import os

os.chdir('/Users/User/Local Sites/keren-shutafut-map/app/public')

# Load mapping
mapping = {}
with open('project-data/id_mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mapping[row['custom_id']] = row['wordpress_id']

print(f"Loaded {len(mapping)} ID mappings\n")

# Load project data
projects = {}
with open('project-data/projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        projects[row['id']] = row

# Import
success = 0
errors = []
images_dir = 'project-data/images'

for custom_id, wp_id in mapping.items():
    if custom_id not in projects:
        continue
    
    project = projects[custom_id]
    title = project['post_title']
    content = project.get('post_content', '')
    location = project.get('location', '')
    image_file = project.get('image_file_name', '').strip()
    
    print(f"Updating WP {wp_id} (ID {custom_id}): {title[:50]}...")
    
    try:
        # Update post
        subprocess.run([
            'wp', 'post', 'update', wp_id,
            f'--post_content={content}'
        ], check=True, capture_output=True, timeout=10)
        
        # Add custom ID meta
        subprocess.run([
            'wp', 'post', 'meta', 'update', wp_id,
            'custom_project_id', custom_id
        ], check=True, capture_output=True, timeout=5)
        
        # Add location meta
        if location:
            subprocess.run([
                'wp', 'post', 'meta', 'update', wp_id,
                'location', location
            ], check=True, capture_output=True, timeout=5)
        
        # Handle image
        if image_file and os.path.exists(f'{images_dir}/{image_file}'):
            result = subprocess.run([
                'wp', 'media', 'import', f'{images_dir}/{image_file}',
                f'--post_id={wp_id}',
                '--porcelain'
            ], capture_output=True, text=True, check=True, timeout=15)
            
            attachment_id = result.stdout.strip()
            
            subprocess.run([
                'wp', 'post', 'meta', 'update', wp_id,
                '_thumbnail_id', attachment_id
            ], check=True, capture_output=True, timeout=5)
            
            print(f"  ✅ Updated + image")
        else:
            print(f"  ✅ Updated")
        
        success += 1
        
    except Exception as e:
        errors.append(f"ID {custom_id} (WP {wp_id}): {e}")
        print(f"  ❌ Error: {e}")

print(f"\n{'='*60}")
print(f"✅ Success: {success}/{len(mapping)}")
print(f"❌ Errors: {len(errors)}")
print(f"{'='*60}")

if errors:
    print("\nErrors:")
    for e in errors[:10]:
        print(f"  • {e}")
