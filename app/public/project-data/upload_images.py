#!/usr/bin/env python3
import requests
import csv
import os

site_url = 'http://keren-shutafut-map.local'

print("Enter WordPress credentials:")
username = input("Username: ")
app_password = input("Application Password: ")

# Load mapping
mapping = {}
with open('id_mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mapping[row['custom_id']] = row['wordpress_id']

# Load project data
projects = {}
with open('projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        projects[row['id']] = row

images_dir = 'images'
success = 0
skipped = 0
errors = []

print(f"\nUploading images...\n")

for custom_id, wp_id in mapping.items():
    if custom_id not in projects:
        continue
    
    project = projects[custom_id]
    image_file = project.get('image_file_name', '').strip()
    
    if not image_file:
        continue
    
    image_path = os.path.join(images_dir, image_file)
    
    if not os.path.exists(image_path):
        print(f"⚠️  Image not found: {image_file}")
        skipped += 1
        continue
    
    title = project['post_title']
    print(f"Uploading {image_file} for: {title[:40]}...")
    
    try:
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
            
            print(f"  ✅ Uploaded & set as featured image")
            success += 1
        else:
            error_msg = response.json().get('message', 'Unknown error')
            errors.append(f"{image_file}: {error_msg}")
            print(f"  ❌ Error: {error_msg}")
    
    except Exception as e:
        errors.append(f"{image_file}: {e}")
        print(f"  ❌ Error: {e}")

print(f"\n{'='*60}")
print(f"✅ Uploaded: {success}")
print(f"⚠️  Skipped: {skipped} (no image or not found)")
print(f"❌ Errors: {len(errors)}")
print(f"{'='*60}")

if errors:
    print("\nErrors:")
    for e in errors[:10]:
        print(f"  • {e}")
