#!/usr/bin/env python3
import requests
import csv

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

print(f"\nImporting domains taxonomy...\n")

success = 0
errors = []

for custom_id, wp_id in mapping.items():
    if custom_id not in projects:
        continue
    
    project = projects[custom_id]
    cohurt = project.get('cohurt', '').strip()
    title = project['post_title']
    
    if not cohurt:
        continue
    
    # Split by pipe and clean
    domains = [d.strip() for d in cohurt.split('|') if d.strip()]
    
    if not domains:
        continue
    
    print(f"Post {wp_id}: {title[:40]}...")
    print(f"  Domains: {', '.join(domains)}")
    
    try:
        # Get or create domain terms and assign to post
        domain_ids = []
        
        for domain_name in domains:
            # Search for existing term
            search_url = f'{site_url}/wp-json/wp/v2/domains?search={domain_name}'
            response = requests.get(search_url, timeout=5)
            
            if response.status_code == 200 and response.json():
                # Term exists
                term_id = response.json()[0]['id']
                domain_ids.append(term_id)
            else:
                # Create new term
                create_url = f'{site_url}/wp-json/wp/v2/domains'
                response = requests.post(
                    create_url,
                    auth=(username, app_password),
                    json={'name': domain_name},
                    timeout=10
                )
                
                if response.status_code == 201:
                    term_id = response.json()['id']
                    domain_ids.append(term_id)
        
        # Assign domains to post
        if domain_ids:
            update_url = f'{site_url}/wp-json/wp/v2/pin/{wp_id}'
            response = requests.post(
                update_url,
                auth=(username, app_password),
                json={'domains': domain_ids},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"  ✅ Assigned {len(domain_ids)} domains")
                success += 1
            else:
                print(f"  ❌ Failed to assign")
                errors.append(f"Post {wp_id}: Assignment failed")
    
    except Exception as e:
        errors.append(f"Post {wp_id}: {e}")
        print(f"  ❌ Error: {e}")

print(f"\n{'='*60}")
print(f"✅ Success: {success}")
print(f"❌ Errors: {len(errors)}")
print(f"{'='*60}")
