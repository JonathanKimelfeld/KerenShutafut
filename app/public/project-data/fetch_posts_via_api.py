#!/usr/bin/env python3
import requests
import json
import csv

# Your WordPress site URL
site_url = 'http://keren-shutafut-map.local'

print("Fetching posts from WordPress REST API...\n")

# Fetch all pins via REST API
all_posts = []
page = 1

while True:
    url = f'{site_url}/wp-json/wp/v2/pin?per_page=100&page={page}'
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            posts = response.json()
            
            if not posts:  # No more posts
                break
            
            for post in posts:
                all_posts.append({
                    'ID': post['id'],
                    'post_title': post['title']['rendered']
                })
            
            print(f"✅ Fetched page {page}: {len(posts)} posts")
            page += 1
        else:
            print(f"❌ Error: {response.status_code}")
            break
    
    except Exception as e:
        print(f"❌ Error: {e}")
        break

# Save to CSV
with open('all_wordpress_posts.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['ID', 'post_title'])
    writer.writeheader()
    writer.writerows(all_posts)

print(f"\n✅ Saved {len(all_posts)} posts to all_wordpress_posts.csv")
