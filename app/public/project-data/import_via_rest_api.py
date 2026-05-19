#!/usr/bin/env python3
import requests
import csv
import os
import json

site_url = 'http://keren-shutafut-map.local'

# Get WordPress credentials
print("Enter WordPress admin credentials:")
username = input("Username: ")
password = input("Password (or app password): ")

# Test authentication
auth_url = f'{site_url}/wp-json/wp/v2/users/me'
response = requests.get(auth_url, auth=(username, password))

if response.status_code != 200:
    print(f"❌ Authentication failed: {response.status_code}")
    print("Create an Application Password in WordPress:")
    print(f"  {site_url}/wp-admin/profile.php")
    exit(1)

print("✅ Authentication successful\n")

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

print(f"Loaded {len(mapping)} mappings, {len(projects)} projects\n")

success = 0
errors = []

for custom_id, wp_id in mapping.items():
    if custom_id not in projects:
        continue
    
    project = projects[custom_id]
    title = project['post_title']
    content = project.get('post_content', '')
    location = project.get('location', '')
    
    print(f"Updating WP {wp_id} (ID {custom_id}): {title[:50]}...")
    
    try:
        # Update post via REST API
        update_url = f'{site_url}/wp-json/wp/v2/pin/{wp_id}'
        data = {
            'content': content,
            'meta': {
                'custom_project_id': custom_id,
                'location': location
            }
        }
        
        response = requests.post(
            update_url,
            auth=(username, password),
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"  ✅ Updated")
            success += 1
        else:
            error_msg = response.json().get('message', 'Unknown error')
            errors.append(f"ID {custom_id}: {error_msg}")
            print(f"  ❌ Error: {error_msg}")
    
    except Exception as e:
        errors.append(f"ID {custom_id}: {e}")
        print(f"  ❌ Error: {e}")

print(f"\n{'='*60}")
print(f"✅ Success: {success}/{len(mapping)}")
print(f"❌ Errors: {len(errors)}")
print(f"{'='*60}")
