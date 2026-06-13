"""
Bulk-translate pin content (title, description, operating_org) to Arabic
using the Anthropic API, then write results back to WordPress via REST API.

Usage:
    python translate_pins_to_arabic.py              # translate all placeholder pins
    python translate_pins_to_arabic.py --dry-run    # print without writing
    python translate_pins_to_arabic.py --force      # re-translate already-filled pins

Requires a .env file in this directory (or project root) with:
    WP_USER=your_wp_username
    WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
    ANTHROPIC_API_KEY=sk-ant-...
    WP_BASE_URL=https://shutafut-map.org   (optional, defaults below)
"""

import argparse
import json
import os
import re
import time

import anthropic
import requests
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))  # project root fallback

WP_BASE_URL   = os.getenv('WP_BASE_URL', 'https://shutafut-map.org').rstrip('/')
WP_USER       = os.getenv('WP_USER', '')
WP_APP_PASS   = os.getenv('WP_APP_PASSWORD', '')
ANTHROPIC_KEY = os.getenv('ANTHROPIC_API_KEY', '')

PLACEHOLDER   = 'بحاجة إلى ترجمة'
RATE_LIMIT_S  = 0.5   # seconds between Anthropic calls
PER_PAGE      = 100

SYSTEM_PROMPT = (
    "You are a professional Arabic translator. Translate Hebrew text into Modern Standard Arabic "
    "(fusha) with a Levantine/Palestinian register — formal MSA but using lexical choices familiar "
    "to Palestinian Arabic speakers, not Gulf dialect. Return ONLY a valid JSON object with exactly "
    "these keys: title_ar, description_ar, operating_org_ar. No preamble, no markdown fences, no "
    "explanation. If a field is empty, return an empty string."
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def wp_auth():
    return (WP_USER, WP_APP_PASS)

def fetch_all_pins():
    pins, page = [], 1
    while True:
        url = f"{WP_BASE_URL}/wp-json/wp/v2/pin"
        print(f'  → GET {url} (page {page})…', flush=True)
        r = requests.get(url, params={'per_page': PER_PAGE, 'page': page, '_embed': 0},
                         auth=wp_auth(), timeout=30)
        r.raise_for_status()
        batch = r.json()
        if not batch:
            print(f'  → page {page} empty — done fetching.')
            break
        print(f'  → page {page}: got {len(batch)} pins (total so far: {len(pins) + len(batch)})')
        pins.extend(batch)
        if len(batch) < PER_PAGE:
            break
        page += 1
    return pins

def needs_translation(pin, force):
    meta = pin.get('meta', {})
    title_ar = meta.get('title_ar', '') or ''
    if force:
        return True
    return title_ar.strip() == '' or title_ar.strip() == PLACEHOLDER

def translate(client, title_he, desc_he, org_he):
    user_msg = (
        f"Translate these fields from Hebrew to Arabic:\n"
        f"title: {title_he}\n"
        f"description: {desc_he or ''}\n"
        f"operating_org: {org_he or ''}"
    )
    response = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )
    raw = response.content[0].text.strip()
    # Strip accidental markdown fences
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)

def write_to_wp(pin_id, translations, dry_run):
    if dry_run:
        return True
    url = f"{WP_BASE_URL}/wp-json/wp/v2/pin/{pin_id}"
    for attempt in range(4):
        try:
            r = requests.patch(url, json={'meta': translations}, auth=wp_auth(), timeout=30)
            r.raise_for_status()
            return True
        except (requests.exceptions.SSLError, requests.exceptions.ConnectionError) as e:
            if attempt == 3:
                raise
            wait = 5 * (2 ** attempt)
            print(f'  ↻ connection error, retrying in {wait}s… ({e})', flush=True)
            time.sleep(wait)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Bulk translate pins to Arabic')
    parser.add_argument('--dry-run', action='store_true', help='Print translations without writing to WP')
    parser.add_argument('--force',   action='store_true', help='Re-translate pins already filled in')
    args = parser.parse_args()

    global WP_USER, WP_APP_PASS, ANTHROPIC_KEY
    if not WP_USER:
        WP_USER = input('WP_USER (WordPress username): ').strip()
    if not WP_APP_PASS:
        WP_APP_PASS = input('WP_APP_PASSWORD (application password): ').strip()
    if not ANTHROPIC_KEY:
        ANTHROPIC_KEY = input('ANTHROPIC_API_KEY: ').strip()

    print(f'\n── Config ──────────────────────────────')
    print(f'  Site:     {WP_BASE_URL}')
    print(f'  WP user:  {WP_USER}')
    print(f'  Mode:     {"DRY RUN" if args.dry_run else "LIVE"}{" + FORCE" if args.force else ""}')
    print(f'────────────────────────────────────────\n')

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

    print('Fetching pins from WordPress…')
    pins = fetch_all_pins()
    print(f'  {len(pins)} pins fetched total.\n')

    to_translate = [p for p in pins if needs_translation(p, args.force)]
    skipped      = len(pins) - len(to_translate)
    print(f'  {len(to_translate)} need translation, {skipped} already filled — skipping.')
    if args.dry_run:
        print('  DRY RUN — no changes will be written.')
    print()

    if not to_translate:
        print('Nothing to do.')
        return

    success = errors = 0
    total = len(to_translate)
    start_time = time.time()

    for i, pin in enumerate(to_translate, 1):
        pin_id    = pin['id']
        title_he  = pin.get('title', {}).get('rendered', '') or ''
        meta      = pin.get('meta', {})
        desc_he   = meta.get('description', '') or pin.get('content', {}).get('rendered', '') or ''
        org_he    = meta.get('operating_org', '') or ''

        # Strip HTML from description if any
        desc_he = re.sub(r'<[^>]+>', '', desc_he).strip()

        elapsed   = time.time() - start_time
        avg_s     = elapsed / (i - 1) if i > 1 else 0
        remaining = avg_s * (total - i + 1) if avg_s else 0
        eta       = f'  ETA ~{int(remaining)}s' if remaining else ''

        print(f'[{i}/{total}] Pin {pin_id} — {title_he}{eta}', flush=True)
        print(f'  desc ({len(desc_he)} chars), org: "{org_he or "(none)"}"', flush=True)

        try:
            t0 = time.time()
            translations = translate(client, title_he, desc_he, org_he)
            api_ms = int((time.time() - t0) * 1000)

            title_ar = translations.get('title_ar', '')
            desc_ar  = translations.get('description_ar', '')
            org_ar   = translations.get('operating_org_ar', '')

            print(f'  ✓ translated in {api_ms}ms', flush=True)
            print(f'    title: {title_ar}', flush=True)
            print(f'    desc:  {desc_ar[:100]}{"…" if len(desc_ar) > 100 else ""}', flush=True)
            print(f'    org:   {org_ar or "(empty)"}', flush=True)

            if not args.dry_run:
                print(f'  → writing to WP…', end=' ', flush=True)

            write_to_wp(pin_id, {
                'title_ar':         title_ar,
                'description_ar':   desc_ar,
                'operating_org_ar': org_ar,
            }, dry_run=args.dry_run)

            if not args.dry_run:
                print('saved ✓', flush=True)

            success += 1

        except json.JSONDecodeError as e:
            print(f'  ✗ ERROR: JSON parse failed — {e}', flush=True)
            errors += 1
        except anthropic.APIError as e:
            print(f'  ✗ ERROR: Anthropic API — {e}', flush=True)
            errors += 1
        except (requests.HTTPError, requests.exceptions.SSLError, requests.exceptions.ConnectionError) as e:
            print(f'  ✗ ERROR: WP write — {e}', flush=True)
            errors += 1

        print()
        time.sleep(RATE_LIMIT_S)

    total_time = int(time.time() - start_time)
    print(f'── Done in {total_time}s ─────────────────────────')
    print(f'  {success} translated, {errors} errors, {skipped} skipped.')

if __name__ == '__main__':
    main()
