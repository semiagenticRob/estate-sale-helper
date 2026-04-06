#!/usr/bin/env python3
"""
One-time cleanup: mark online-only auctions as is_online_only=TRUE in the database.

Fetches all external_ids from Supabase, re-queries the estatesales.net API
to check isMarketplaceSale / type, then flags matching sales so the search_sales
RPC filter excludes them.

Usage:
  python cleanup_online_auctions.py           # dry run (shows what would be flagged)
  python cleanup_online_auctions.py --apply   # actually update is_online_only=TRUE
"""

import argparse
import os
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

API_URL    = 'https://www.estatesales.net/api/sale-details'
BATCH_SIZE = 50
DELAY      = 1.5

API_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/122.0.0.0 Safari/537.36'
    ),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
}


def fetch_all_db_sales() -> list[dict]:
    """Return all sales (id, external_id) from Supabase."""
    results = []
    page = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table('sales')
            .select('id,external_id')
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = resp.data or []
        results.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return results


AUCTION_TYPES = {2, 64, 16384}
# type=2:     live in-person public auction (bidding format, not browse-and-buy)
# type=64:    online-only auction (bid on seller's website)
# type=16384: online antique/shipping sale


def is_auction_or_online(item: dict) -> bool:
    """Return True if this API record is an auction or online-only sale."""
    if item.get('isMarketplaceSale'):
        return True
    return item.get('type') in AUCTION_TYPES


def check_online_batch(external_ids: list[str], debug_types: set) -> set[str]:
    """Return set of external_ids that are online-only according to the API."""
    ids_str = ','.join(external_ids)
    url = (
        f'{API_URL}?bypass=byids:{ids_str}'
        f'&select=id,type,isMarketplaceSale'
        f'&explicitTypes=DateTime'
    )
    online_ids = set()
    try:
        with httpx.Client(headers=API_HEADERS, timeout=30, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                for item in resp.json():
                    debug_types.add((item.get('type'), item.get('isMarketplaceSale')))
                    if is_auction_or_online(item):
                        online_ids.add(str(item['id']))
            else:
                print(f'  HTTP {resp.status_code} for batch — skipping')
    except Exception as e:
        print(f'  API error: {e}')
    return online_ids


def flag_sale(db_id: str, external_id: str, dry_run: bool):
    if dry_run:
        return
    try:
        supabase.table('sales').update({'is_online_only': True}).eq('id', db_id).execute()
    except Exception as e:
        print(f'  Update error for {external_id}: {e}')


def main(dry_run: bool):
    print('Fetching all sales from database...')
    db_sales = fetch_all_db_sales()
    print(f'Found {len(db_sales)} sales in DB\n')

    # Build lookup: external_id -> db id
    ext_to_db = {s['external_id']: s['id'] for s in db_sales}
    external_ids = list(ext_to_db.keys())

    online_external_ids: set[str] = set()
    debug_types: set = set()

    for i in range(0, len(external_ids), BATCH_SIZE):
        batch = external_ids[i:i + BATCH_SIZE]
        found = check_online_batch(batch, debug_types)
        online_external_ids.update(found)
        print(f'  Checked {min(i + BATCH_SIZE, len(external_ids))}/{len(external_ids)} — {len(found)} online-only in this batch')
        time.sleep(DELAY)

    print(f'\nDistinct (type, isMarketplaceSale) values seen in DB sales:')
    for t in sorted(debug_types, key=str):
        print(f'  type={t[0]!r}  isMarketplaceSale={t[1]!r}')

    print(f'\nTotal online-only auctions found: {len(online_external_ids)}')

    if not online_external_ids:
        print('Nothing to flag.')
        return

    print()
    for ext_id in sorted(online_external_ids):
        db_id = ext_to_db[ext_id]
        action = 'Would flag' if dry_run else 'Flagging'
        print(f'  {action} sale {ext_id} (db id: {db_id})')
        flag_sale(db_id, ext_id, dry_run)

    print()
    if dry_run:
        print(f'Dry run complete. Run with --apply to flag {len(online_external_ids)} sales as is_online_only=TRUE.')
    else:
        print(f'Flagged {len(online_external_ids)} online-only auctions as is_online_only=TRUE.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Remove online-only auctions from the DB')
    parser.add_argument('--apply', action='store_true', help='Actually flag sales (default is dry run)')
    args = parser.parse_args()
    main(dry_run=not args.apply)
