#!/usr/bin/env python3
"""
Test script to debug taxonomy assignment
"""

import subprocess
import json

def run_wp_cli(args):
    """Execute WP-CLI command"""
    result = subprocess.run(['wp'] + args, capture_output=True, text=True)
    return result.stdout.strip(), result.stderr.strip()

# Test 1: Create a term manually
print("=== TEST 1: Creating term 'ירושלים' ===")
stdout, stderr = run_wp_cli(['term', 'create', 'geographic_region', 'ירושלים', '--porcelain'])
print(f"STDOUT: {stdout}")
print(f"STDERR: {stderr}")

# Test 2: List the term we just created
print("\n=== TEST 2: Listing geographic_region terms ===")
stdout, stderr = run_wp_cli(['term', 'list', 'geographic_region', '--format=json'])
if stdout:
    terms = json.loads(stdout)
    for term in terms:
        print(f"  ID: {term['term_id']}, Name: '{term['name']}', Slug: '{term['slug']}'")

# Test 3: Find term by name
print("\n=== TEST 3: Finding 'ירושלים' by name ===")
stdout, stderr = run_wp_cli(['term', 'list', 'geographic_region', '--format=json'])
if stdout:
    terms = json.loads(stdout)
    for term in terms:
        if term['name'] == 'ירושלים':
            print(f"  FOUND: ID={term['term_id']}")

# Test 4: Create a test pin and assign the term
print("\n=== TEST 4: Creating test pin ===")
post_id, stderr = run_wp_cli([
    'post', 'create',
    '--post_type=pin',
    '--post_title=TEST PIN',
    '--post_status=publish',
    '--porcelain'
])
print(f"Created pin ID: {post_id}")

# Test 5: Assign term by NAME (not ID)
print("\n=== TEST 5: Assigning 'ירושלים' to pin by NAME ===")
stdout, stderr = run_wp_cli(['post', 'term', 'add', post_id, 'geographic_region', 'ירושלים'])
print(f"Result: {stdout}")
print(f"Error: {stderr}")

# Test 6: Check what got assigned
print("\n=== TEST 6: Checking assigned terms ===")
stdout, stderr = run_wp_cli(['post', 'term', 'list', post_id, 'geographic_region', '--format=json'])
if stdout:
    terms = json.loads(stdout)
    for term in terms:
        print(f"  ID: {term['term_id']}, Name: '{term['name']}'")

# Cleanup
print("\n=== CLEANUP ===")
run_wp_cli(['post', 'delete', post_id, '--force'])
print("Test complete!")
