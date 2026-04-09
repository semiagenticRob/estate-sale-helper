#!/usr/bin/env python3
"""
One-time backfill: re-scrape descriptions and terms for sales that are missing them.

Queries active sales with empty/NULL description, scrapes each detail page,
and updates the row directly.

Usage:
  python backfill_descriptions.py           # dry run (shows what would be updated)
  python backfill_descriptions.py --apply   # actually update the database
"""

import argparse
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client

from scraper import scrape_detail, DELAY

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_sales_missing_descriptions() -> list[dict]:
    """Return active sales with empty or NULL descriptions."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    results = []
    page = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table('sales')
            .select('id,external_id,url,description,terms')
            .eq('is_online_only', False)
            .gte('end_date', today)
            .or_('description.is.null,description.eq.')
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = resp.data or []
        results.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return results


def main(dry_run: bool):
    print('Finding active sales with missing descriptions...')
    sales = fetch_sales_missing_descriptions()
    print(f'Found {len(sales)} sales to backfill\n')

    if not sales:
        print('Nothing to backfill.')
        return

    updated = 0
    failed = 0

    for i, sale in enumerate(sales, 1):
        ext_id = sale['external_id']
        url = sale['url']
        print(f'  [{i}/{len(sales)}] Scraping {ext_id}...', end=' ')

        detail = scrape_detail(url, ext_id)
        time.sleep(DELAY)

        updates = {}
        if detail.get('description'):
            updates['description'] = detail['description']
        if detail.get('terms'):
            updates['terms'] = detail['terms']

        if not updates:
            print('no content found')
            failed += 1
            continue

        fields = ', '.join(updates.keys())
        if dry_run:
            print(f'would update {fields}')
        else:
            updates['detail_scraped_at'] = datetime.now(timezone.utc).isoformat()
            try:
                supabase.table('sales').update(updates).eq('id', sale['id']).execute()
                print(f'updated {fields}')
            except Exception as e:
                print(f'ERROR: {e}')
                failed += 1
                continue
        updated += 1

    print(f'\n{"="*50}')
    action = 'Would update' if dry_run else 'Updated'
    print(f'  {action}: {updated}')
    print(f'  No content found: {failed}')
    print(f'  Total processed: {len(sales)}')
    if dry_run and updated > 0:
        print(f'\n  Run with --apply to commit changes.')
    print(f'{"="*50}\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Backfill missing descriptions')
    parser.add_argument('--apply', action='store_true', help='Actually update (default is dry run)')
    args = parser.parse_args()
    main(dry_run=not args.apply)
