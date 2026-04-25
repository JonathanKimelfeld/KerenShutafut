#!/usr/bin/env python3
"""
Import latitude/longitude AND geographic_region taxonomy
from projects_with_filled_coordinates_partial.csv into WordPress.
"""

import csv
import sys

try:
    import pymysql
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql", "-q"])
    import pymysql

SOCKET   = "/Users/User/Library/Application Support/Local/run/Ud1X3TLrT/mysql/mysqld.sock"
DB_NAME  = "local"
DB_USER  = "root"
DB_PASS  = "root"
CSV_PATH = "/Users/User/Local Sites/keren-shutafut-map/app/public/projects_with_filled_coordinates_partial.csv"

conn = pymysql.connect(
    unix_socket=SOCKET,
    user=DB_USER,
    password=DB_PASS,
    database=DB_NAME,
    charset="utf8mb4",
)
cur = conn.cursor()

# ── Build lookup maps ─────────────────────────────────────────────────────────

cur.execute("SELECT ID, post_title FROM wp_posts WHERE post_type='pin' AND post_status='publish'")
posts = {row[1].strip(): row[0] for row in cur.fetchall()}
print(f"Found {len(posts)} published pin posts in DB")

# term_name → term_taxonomy_id for geographic_region
cur.execute("""
    SELECT t.name, tt.term_taxonomy_id
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON tt.term_id = t.term_id AND tt.taxonomy='geographic_region'
""")
region_ttid = {row[0].strip(): row[1] for row in cur.fetchall()}
print(f"Found regions: {list(region_ttid.keys())}")

# ── Process CSV ───────────────────────────────────────────────────────────────

updated_coords = 0
updated_region = 0
skipped_coords = 0
not_found      = 0

with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        title  = row.get("post_title", "").strip()
        lat    = row.get("latitude", "").strip()
        lon    = row.get("longitude", "").strip()
        region = row.get("geographic_region", "").strip()

        post_id = posts.get(title)
        if not post_id:
            print(f"  NOT FOUND: {title!r}")
            not_found += 1
            continue

        # ── Coordinates ───────────────────────────────────────────────────────
        if lat and lon:
            for key, val in [("latitude", lat), ("longitude", lon)]:
                cur.execute(
                    "SELECT meta_id FROM wp_postmeta WHERE post_id=%s AND meta_key=%s",
                    (post_id, key)
                )
                if cur.fetchone():
                    cur.execute(
                        "UPDATE wp_postmeta SET meta_value=%s WHERE post_id=%s AND meta_key=%s",
                        (val, post_id, key)
                    )
                else:
                    cur.execute(
                        "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s,%s,%s)",
                        (post_id, key, val)
                    )
            updated_coords += 1
        else:
            skipped_coords += 1

        # ── Geographic region taxonomy ────────────────────────────────────────
        if region and region in region_ttid:
            ttid = region_ttid[region]

            # Remove any existing geographic_region assignments for this post
            cur.execute("""
                DELETE tr FROM wp_term_relationships tr
                JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                WHERE tr.object_id = %s AND tt.taxonomy = 'geographic_region'
            """, (post_id,))

            # Assign the correct region
            cur.execute(
                "INSERT IGNORE INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (%s, %s)",
                (post_id, ttid)
            )

            # Keep term counts accurate
            cur.execute(
                "UPDATE wp_term_taxonomy SET count = (SELECT COUNT(*) FROM wp_term_relationships WHERE term_taxonomy_id=%s) WHERE term_taxonomy_id=%s",
                (ttid, ttid)
            )
            updated_region += 1

conn.commit()

# Recompute all region counts once at the end
for ttid in region_ttid.values():
    cur.execute(
        "UPDATE wp_term_taxonomy SET count = (SELECT COUNT(*) FROM wp_term_relationships WHERE term_taxonomy_id=%s) WHERE term_taxonomy_id=%s",
        (ttid, ttid)
    )
conn.commit()
cur.close()
conn.close()

print(f"\nDone.")
print(f"  Coords updated:  {updated_coords}")
print(f"  Coords skipped:  {skipped_coords}")
print(f"  Region assigned: {updated_region}")
print(f"  Not found:       {not_found}")
