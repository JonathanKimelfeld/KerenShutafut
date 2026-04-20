#!/usr/bin/env python3
"""
Import pins from CSV to WordPress using WP-CLI
Usage: python3 import_pins.py projects_import_v2.csv
"""

import csv
import subprocess
import sys
import json

def run_wp_cli(args):
    """Execute WP-CLI command and return output"""
    # If args is a string, convert to list properly
    if isinstance(args, str):
        import shlex
        args = shlex.split(args)
    
    result = subprocess.run(
        ['wp'] + args,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    return result.stdout.strip()

def get_or_create_term(taxonomy, term_name):
    """Get term ID or create if doesn't exist"""
    # Check if term exists - search by exact name
    result = run_wp_cli(['term', 'list', taxonomy, '--format=json'])
    if result:
        terms = json.loads(result)
        for term in terms:
            if term['name'] == term_name:
                return str(term['term_id'])
    
    # Create term if doesn't exist - porcelain returns just the ID
    term_id = run_wp_cli(['term', 'create', taxonomy, term_name, '--porcelain'])
    if term_id:
        return term_id.strip()
    
    return None

def find_post_by_title(title):
    """Find post ID by title"""
    result = run_wp_cli(['post', 'list', '--post_type=pin', f'--s={title}', '--format=json'])
    if result:
        posts = json.loads(result)
        # Match exact title
        for post in posts:
            if post.get('post_title') == title:
                return post['ID']
    return None

def import_pin(row, update_existing=True):
    """Import or update a single pin"""
    title = row['post_title'].strip()
    content = row['post_content'].strip()
    link = row['project_link'].strip()
    
    print(f"\n{'='*80}")
    print(f"Processing: {title}")
    print(f"{'='*80}")
    
    # Check if post exists
    post_id = find_post_by_title(title)
    
    if post_id and not update_existing:
        print(f"  ⏭️  Skipping (already exists, ID: {post_id})")
        return post_id
    
    if post_id:
        print(f"  🔄 Updating existing pin (ID: {post_id})")
        # Update post
        run_wp_cli(['post', 'update', str(post_id), f'--post_content={content}'])
    else:
        print(f"  ✨ Creating new pin")
        # Create new post
        post_id = run_wp_cli([
            'post', 'create',
            '--post_type=pin',
            f'--post_title={title}',
            f'--post_content={content}',
            '--post_status=publish',
            '--porcelain'
        ])
    
    # Update ACF field (project link)
    if link:
        print(f"  📎 Setting link: {link}")
        run_wp_cli(['post', 'meta', 'update', str(post_id), 'project_link', link])
    
    # Assign geographic region
    if row.get('geographic_region'):
        geo_region = row['geographic_region'].strip()
        print(f"  📍 Geographic region: {geo_region}")
        run_wp_cli(['post', 'term', 'add', str(post_id), 'geographic_region', geo_region])
    
    # Assign activity cycle (map recruitment_cycle → activity_cycle)
    if row.get('recruitment_cycle'):
        cycle = row['recruitment_cycle'].strip()
        print(f"  🔄 Activity cycle: {cycle}")
        run_wp_cli(['post', 'term', 'add', str(post_id), 'activity_cycle', cycle])
    
    # Assign target audiences (multiple, split by |)
    if row.get('target_audience'):
        audiences = [a.strip() for a in row['target_audience'].split('|')]
        print(f"  👥 Target audiences: {', '.join(audiences)}")
        for audience in audiences:
            run_wp_cli(['post', 'term', 'add', str(post_id), 'target_audience', audience])
    
    print(f"  ✅ Done! (ID: {post_id})")
    return post_id

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import_pins.py <csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    print("\n" + "="*80)
    print("KEREN SHUTAFUT PIN IMPORT")
    print("="*80)
    
    # Read CSV
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"\nFound {len(rows)} pins in CSV")
    print("\nStarting import...")
    
    imported = 0
    updated = 0
    errors = 0
    
    for i, row in enumerate(rows, 1):
        try:
            print(f"\n[{i}/{len(rows)}]", end=" ")
            post_id = import_pin(row)
            if post_id:
                imported += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
            errors += 1
    
    print("\n" + "="*80)
    print("IMPORT COMPLETE")
    print("="*80)
    print(f"  Processed: {imported} pins")
    print(f"  Errors: {errors}")
    print("="*80)

if __name__ == '__main__':
    main()
