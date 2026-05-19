#!/usr/bin/env python3
import csv
import subprocess
import os

# Configuration
csv_file = 'projects_with_images.csv'
images_dir = os.path.expanduser('~/project-data/images')
wp_path = '/Users/User/Local Sites/keren-shutafut-map/app/public'

# Change to WordPress directory
os.chdir(wp_path)

success_count = 0
error_count = 0
errors = []

print("=== Starting Project Import ===\n")

with open(os.path.expanduser(f'~/project-data/{csv_file}'), 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        post_id = row['id']
        title = row.get('title', '')
        image_filename = row.get('image_file_name', '').strip()
        
        print(f"Processing project {post_id}: {title}")
        
        try:
            # Update post title and content
            subprocess.run([
                'wp', 'post', 'update', post_id,
                f'--post_title={title}',
                f'--post_content={row.get("description", "")}'
            ], check=True, capture_output=True)
            
            # Add location field
            if row.get('location'):
                subprocess.run([
                    'wp', 'post', 'meta', 'update', post_id,
                    'location', row['location']
                ], check=True, capture_output=True)
            
            # Upload and attach image if specified
            if image_filename:
                image_path = os.path.join(images_dir, image_filename)
                
                if os.path.exists(image_path):
                    # Import image to media library
                    result = subprocess.run([
                        'wp', 'media', 'import', image_path,
                        f'--post_id={post_id}',
                        '--porcelain'
                    ], capture_output=True, text=True, check=True)
                    
                    attachment_id = result.stdout.strip()
                    
                    # Set as featured image
                    subprocess.run([
                        'wp', 'post', 'meta', 'update', post_id,
                        '_thumbnail_id', attachment_id
                    ], check=True, capture_output=True)
                    
                    print(f"  ✅ Updated + image attached: {image_filename}")
                else:
                    print(f"  ⚠️  Image not found: {image_filename}")
                    errors.append(f"Project {post_id}: Image {image_filename} not found")
            else:
                print(f"  ✅ Updated (no image)")
            
            success_count += 1
            
        except subprocess.CalledProcessError as e:
            error_count += 1
            error_msg = f"Project {post_id}: {e}"
            errors.append(error_msg)
            print(f"  ❌ Error: {e}")
        
        print()

print("\n=== Import Complete ===")
print(f"✅ Success: {success_count}")
print(f"❌ Errors: {error_count}")

if errors:
    print("\n=== Errors ===")
    for error in errors:
        print(f"  • {error}")
