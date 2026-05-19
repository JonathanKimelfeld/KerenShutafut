#!/usr/bin/env python3
import csv
from difflib import get_close_matches

# Load WordPress posts
wp_posts = {}
with open('all_wordpress_posts.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        wp_posts[row['post_title']] = row['ID']

wp_titles = list(wp_posts.keys())

# Load unmatched from your CSV
unmatched = []
matched_ids = set()

with open('id_mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        matched_ids.add(row['custom_id'])

with open('projects_with_images_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['id'] not in matched_ids:
            unmatched.append(row)

print(f"Attempting fuzzy matching for {len(unmatched)} projects...\n")

new_matches = []

for project in unmatched:
    custom_id = project['id']
    title = project['post_title']
    
    # Find close matches (cutoff=0.6 means 60% similarity)
    matches = get_close_matches(title, wp_titles, n=3, cutoff=0.6)
    
    if matches:
        print(f"\nID {custom_id}: {title}")
        print("  Possible matches:")
        for i, match in enumerate(matches, 1):
            wp_id = wp_posts[match]
            print(f"    {i}. [{wp_id}] {match}")
        
        choice = input("  Select match (1-3) or skip (Enter): ").strip()
        
        if choice and choice.isdigit() and 1 <= int(choice) <= len(matches):
            matched_title = matches[int(choice)-1]
            wp_id = wp_posts[matched_title]
            new_matches.append({
                'custom_id': custom_id,
                'wordpress_id': wp_id,
                'title': title
            })
            print(f"  ✅ Matched to WP {wp_id}")

if new_matches:
    # Append to existing mapping
    with open('id_mapping.csv', 'a', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['custom_id', 'wordpress_id', 'title'])
        writer.writerows(new_matches)
    
    print(f"\n✅ Added {len(new_matches)} new matches to id_mapping.csv")
