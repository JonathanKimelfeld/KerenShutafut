#!/usr/bin/env python3
import requests
import csv
import os

site_url = 'http://keren-shutafut-map.local'

print("Enter WordPress credentials:")
username = input("Username: ")
app_password = input("Application Password: ")

# Load ALL mappings (including the 44 newly matched)
mapping = {}
with open('id_mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mapping[row['custom_id']] = row['wordpress_id']

print(f"Loaded {len(mapping)} total mappings\n")

# Load project data
projects = {}
with open('projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        projects[row['id']] = row

images_dir = 'images'
uploaded = 0
skipped_no_file = 0
skipped_not_found = 0
skipped_psd = 0
errors = []

print("Uploading images for all projects...\n")

for custom_id, wp_id in sorted(mapping.items(), key=lambda x: int(x[0])):
    if custom_id not in projects:
        continue
    
    project = projects[custom_id]
    image_file = project.get('image_file_name', '').strip()
    title = project['post_title']
    
    # Skip if no image specified
    if not image_file:
        print(f"⊘ ID {custom_id} (WP {wp_id}): No image specified - {title[:40]}")
        skipped_no_file += 1
        continue
    
    # Skip PSD files
    if image_file.lower().endswith('.psd'):
        print(f"⊘ ID {custom_id} (WP {wp_id}): PSD file - convert to JPG first")
        skipped_psd += 1
        continue
    
    image_path = os.path.join(images_dir, image_file)
    
    # Skip if file doesn't exist
    if not os.path.exists(image_path):
        print(f"⚠️  ID {custom_id} (WP {wp_id}): Image not found - {image_file}")
        skipped_not_found += 1
        continue
    
    print(f"📤 ID {custom_id} (WP {wp_id}): Uploading {image_file[:30]}...")
    
    try:
        # Check if already has featured image
        check_url = f'{site_url}/wp-json/wp/v2/pin/{wp_id}'
        check_response = requests.get(check_url, timeout=5)
        
        if check_response.status_code == 200:
            current_featured = check_response.json().get('featured_media', 0)
            if current_featured > 0:
                print(f"  ✓ Already has image - skipping")
                skipped_no_file += 1
                continue
        
        # Upload image
        with open(image_path, 'rb') as f:
            files = {'file': (image_file, f)}
            
            upload_url = f'{site_url}/wp-json/wp/v2/media'
            response = requests.post(
                upload_url,
                auth=(username, app_password),
                files=files,
                data={'post': wp_id},
                timeout=30
            )
        
        if response.status_code == 201:
            attachment_id = response.json()['id']
            
            # Set as featured image
            update_url = f'{site_url}/wp-json/wp/v2/pin/{wp_id}'
            requests.post(
                update_url,
                auth=(username, app_password),
                json={'featured_media': attachment_id},
                timeout=10
            )
            
            print(f"  ✅ Uploaded successfully")
            uploaded += 1
        else:
            error_msg = response.json().get('message', 'Unknown error')
            errors.append(f"ID {custom_id}: {error_msg}")
            print(f"  ❌ Error: {error_msg}")
    
    except Exception as e:
        errors.append(f"ID {custom_id}: {e}")
        print(f"  ❌ Error: {e}")

print(f"\n{'='*70}")
print(f"✅ Uploaded: {uploaded}")
print(f"⊘ Skipped (no file specified): {skipped_no_file}")
print(f"⊘ Skipped (already has image): {skipped_no_file}")
print(f"⚠️  Skipped (file not found): {skipped_not_found}")
print(f"⊘ Skipped (PSD files): {skipped_psd}")
print(f"❌ Errors: {len(errors)}")
print(f"{'='*70}")

if errors:
    print("\nErrors:")
    for e in errors[:10]:
        print(f"  • {e}")

print(f"\n📊 Total projects with images: {uploaded + 76} (76 from before + {uploaded} new)")
