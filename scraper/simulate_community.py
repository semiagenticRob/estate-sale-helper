#!/usr/bin/env python3
"""
Community features load test — wave-based simulation.

Generates thousands of test signals and reviews against real Colorado sales
so you can watch map pins change color in real-time in the iOS simulator.

Usage:
  python3 simulate_community.py --setup             # Apply migrations 012-015
  python3 simulate_community.py --run               # Run simulation (8 waves, 15s pause)
  python3 simulate_community.py --run --waves 12 --pause 10
  python3 simulate_community.py --cleanup           # Delete all test data
"""

import argparse
import math
import os
import random
import time
import uuid
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MIGRATION_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations')

# ─── Sale Personalities ─────────────────────────────────────────────

PERSONALITIES = [
    # (name, weight, worth_it_pct_range, signals_per_wave_range)
    ('hot',   0.30, (0.70, 0.95), (4, 10)),
    ('mixed', 0.30, (0.40, 0.60), (2, 5)),
    ('skip',  0.20, (0.10, 0.30), (2, 5)),
    ('quiet', 0.20, (0.30, 0.70), (0, 1)),
]


def assign_personalities(sales: list[dict]) -> list[dict]:
    """Assign a personality to each sale for consistent simulation."""
    random.shuffle(sales)
    result = []
    idx = 0
    for name, weight, pct_range, vol_range in PERSONALITIES:
        count = max(1, round(len(sales) * weight))
        for s in sales[idx:idx + count]:
            s['personality'] = name
            s['worth_pct'] = random.uniform(*pct_range)
            s['vol_range'] = vol_range
            result.append(s)
        idx += count
    # Assign remaining to mixed
    for s in sales[idx:]:
        s['personality'] = 'mixed'
        s['worth_pct'] = random.uniform(0.40, 0.60)
        s['vol_range'] = (2, 5)
        result.append(s)
    return result


# ─── Setup ──────────────────────────────────────────────────────────

def run_setup():
    """Apply migrations 012-015 to create community tables and RPCs."""
    migration_files = [
        '012_community_signals_reviews.sql',
        '013_rpc_submit_signal.sql',
        '014_rpc_submit_review.sql',
        '015_rpc_get_sale_scores.sql',
    ]
    for filename in migration_files:
        path = os.path.join(MIGRATION_DIR, filename)
        if not os.path.exists(path):
            print(f'  ERROR: {path} not found')
            return
        print(f'  Applying {filename}...', end=' ')
        with open(path) as f:
            sql = f.read()
        try:
            supabase.postgrest.session.headers.update({
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
            })
            # Use the REST API to execute raw SQL via rpc
            # Since we can't run raw SQL via the client lib, we'll use
            # the admin API approach
            from httpx import Client
            resp = Client(timeout=30).post(
                f'{SUPABASE_URL}/rest/v1/rpc/',
                headers={
                    'apikey': SUPABASE_KEY,
                    'Authorization': f'Bearer {SUPABASE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                json={},
            )
            # This won't work for raw SQL — need to use the SQL editor
            print('NOTE: Cannot run raw SQL via client library.')
            print(f'\n  Copy and paste each migration into the Supabase SQL Editor:')
            for fn in migration_files:
                print(f'    {os.path.join(MIGRATION_DIR, fn)}')
            print(f'\n  Run them in order (012 → 013 → 014 → 015), then re-run with --run')
            return
        except Exception as e:
            print(f'ERROR: {e}')
            return

    print('\nMigrations applied successfully.')


def run_setup_instructions():
    """Print instructions for applying migrations manually."""
    migration_files = [
        '012_community_signals_reviews.sql',
        '013_rpc_submit_signal.sql',
        '014_rpc_submit_review.sql',
        '015_rpc_get_sale_scores.sql',
    ]
    print('\n  Apply these 4 migrations in order in the Supabase SQL Editor:\n')
    for fn in migration_files:
        path = os.path.join(MIGRATION_DIR, fn)
        exists = '  OK' if os.path.exists(path) else '  MISSING'
        print(f'    {fn} {exists}')
    print('\n  Run them in order (012 → 013 → 014 → 015).')
    print('  Then come back and run: python3 simulate_community.py --run\n')


# ─── Simulation ─────────────────────────────────────────────────────

def fetch_active_colorado_sales() -> list[dict]:
    """Get all active Colorado sales from the database."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    results = []
    page = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table('sales')
            .select('id,title,city,latitude,longitude,start_date,end_date')
            .eq('is_online_only', False)
            .eq('state', 'CO')
            .gte('end_date', today)
            .not_.is_('latitude', 'null')
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = resp.data or []
        results.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return results


def generate_device_ids(count: int) -> list[str]:
    """Generate a pool of fake device IDs."""
    return [f'test_{uuid.uuid4().hex[:16]}' for _ in range(count)]


def generate_wave_signals(sales: list[dict], device_pool: list[str], wave_num: int) -> list[dict]:
    """Generate a batch of signals for one wave."""
    signals = []
    for sale in sales:
        vol_lo, vol_hi = sale['vol_range']
        count = random.randint(vol_lo, vol_hi)
        if count == 0:
            continue

        worth_pct = sale['worth_pct']
        for _ in range(count):
            device_id = random.choice(device_pool)
            is_worth = random.random() < worth_pct
            # Spread submitted_at across recent hours for decay variety
            age_minutes = random.randint(0, 240)
            submitted_at = (datetime.now(timezone.utc) - timedelta(minutes=age_minutes)).isoformat()

            signals.append({
                'sale_id': sale['id'],
                'device_id': device_id,
                'signal_type': 'worth_it' if is_worth else 'skip_it',
                'submitted_at': submitted_at,
                'device_lat': sale['latitude'] + random.uniform(-0.003, 0.003),
                'device_lng': sale['longitude'] + random.uniform(-0.003, 0.003),
            })
    return signals


def generate_wave_reviews(sales: list[dict], device_pool: list[str]) -> list[dict]:
    """Generate a batch of reviews."""
    reviews = []
    for sale in sales:
        if sale['personality'] == 'quiet':
            continue
        count = random.randint(1, 4)
        worth_pct = sale['worth_pct']

        for _ in range(count):
            # Reviews correlate with signal personality
            bias = worth_pct
            reviews.append({
                'sale_id': sale['id'],
                'device_id': random.choice(device_pool),
                'submitted_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'device_lat': sale['latitude'] + random.uniform(-0.003, 0.003),
                'device_lng': sale['longitude'] + random.uniform(-0.003, 0.003),
                'pricing_positive': random.random() < bias,
                'quality_positive': random.random() < (bias + 0.1),
                'accuracy_positive': random.random() < (bias + 0.15),
                'availability_positive': random.random() < (bias - 0.05),
            })
    return reviews


def upsert_signals(signals: list[dict]):
    """Bulk insert signals, handling conflicts by updating."""
    if not signals:
        return
    # Insert in batches to avoid payload limits
    batch_size = 200
    for i in range(0, len(signals), batch_size):
        batch = signals[i:i + batch_size]
        try:
            supabase.table('signals').upsert(
                batch,
                on_conflict='sale_id,device_id',
            ).execute()
        except Exception as e:
            print(f'    Signal insert error: {e}')


def upsert_reviews(reviews: list[dict]):
    """Bulk insert reviews, handling conflicts by updating."""
    if not reviews:
        return
    batch_size = 200
    for i in range(0, len(reviews), batch_size):
        batch = reviews[i:i + batch_size]
        try:
            supabase.table('reviews').upsert(
                batch,
                on_conflict='sale_id,device_id',
            ).execute()
        except Exception as e:
            print(f'    Review insert error: {e}')


def recalculate_scores():
    """Recalculate sale_scores from all signals using decay formula."""
    # We need to do this via RPC or direct SQL. Since we can't run raw SQL,
    # we'll fetch signals and compute in Python.
    try:
        # Fetch all signals
        all_signals = []
        page = 0
        while True:
            resp = (
                supabase.table('signals')
                .select('sale_id,signal_type,submitted_at')
                .range(page * 1000, (page + 1) * 1000 - 1)
                .execute()
            )
            batch = resp.data or []
            all_signals.extend(batch)
            if len(batch) < 1000:
                break
            page += 1

        # Group by sale_id and compute scores
        from collections import defaultdict
        by_sale = defaultdict(list)
        for s in all_signals:
            by_sale[s['sale_id']].append(s)

        now = datetime.now(timezone.utc)
        scores = []
        for sale_id, sigs in by_sale.items():
            worth_count = sum(1 for s in sigs if s['signal_type'] == 'worth_it')
            skip_count = sum(1 for s in sigs if s['signal_type'] == 'skip_it')

            worth_decayed = 0.0
            total_decayed = 0.0
            for s in sigs:
                # Parse submitted_at
                ts_str = s['submitted_at'].replace('Z', '+00:00')
                try:
                    ts = datetime.fromisoformat(ts_str)
                except ValueError:
                    import re
                    cleaned = re.sub(r'\.(\d+)', lambda m: '.' + m.group(1)[:6].ljust(6, '0'), ts_str)
                    ts = datetime.fromisoformat(cleaned)

                age_secs = (now - ts).total_seconds()
                decay = math.exp(-age_secs / 14400.0)  # 4hr half-life
                total_decayed += decay
                if s['signal_type'] == 'worth_it':
                    worth_decayed += decay

            heat = worth_decayed / total_decayed if total_decayed > 0 else 0

            scores.append({
                'sale_id': sale_id,
                'worth_it_count': worth_count,
                'skip_it_count': skip_count,
                'heat_score': round(heat, 4),
                'last_updated': now.isoformat(),
            })

        # Upsert scores
        if scores:
            batch_size = 200
            for i in range(0, len(scores), batch_size):
                supabase.table('sale_scores').upsert(
                    scores[i:i + batch_size],
                    on_conflict='sale_id',
                ).execute()

    except Exception as e:
        print(f'    Score recalc error: {e}')


def recalculate_review_aggregates():
    """Recalculate review_aggregates from all reviews."""
    try:
        all_reviews = []
        page = 0
        while True:
            resp = (
                supabase.table('reviews')
                .select('sale_id,pricing_positive,quality_positive,accuracy_positive,availability_positive')
                .range(page * 1000, (page + 1) * 1000 - 1)
                .execute()
            )
            batch = resp.data or []
            all_reviews.extend(batch)
            if len(batch) < 1000:
                break
            page += 1

        from collections import defaultdict
        by_sale = defaultdict(list)
        for r in all_reviews:
            by_sale[r['sale_id']].append(r)

        now = datetime.now(timezone.utc)
        aggs = []
        for sale_id, revs in by_sale.items():
            total = len(revs)
            aggs.append({
                'sale_id': sale_id,
                'pricing_pos': sum(1 for r in revs if r['pricing_positive']),
                'pricing_total': total,
                'quality_pos': sum(1 for r in revs if r['quality_positive']),
                'quality_total': total,
                'accuracy_pos': sum(1 for r in revs if r['accuracy_positive']),
                'accuracy_total': total,
                'availability_pos': sum(1 for r in revs if r['availability_positive']),
                'availability_total': total,
                'last_calculated_at': now.isoformat(),
            })

        if aggs:
            batch_size = 200
            for i in range(0, len(aggs), batch_size):
                supabase.table('review_aggregates').upsert(
                    aggs[i:i + batch_size],
                    on_conflict='sale_id',
                ).execute()

    except Exception as e:
        print(f'    Review aggregate recalc error: {e}')


def print_score_summary(sales: list[dict]):
    """Print a summary of current score distribution."""
    try:
        resp = supabase.table('sale_scores').select('sale_id,heat_score,worth_it_count,skip_it_count').execute()
        scores = {s['sale_id']: s for s in (resp.data or [])}
    except Exception:
        return

    sale_lookup = {s['id']: s for s in sales}

    hot = []
    warm = []
    neutral = []
    skip = []
    for sid, sc in scores.items():
        h = sc['heat_score']
        total = sc['worth_it_count'] + sc['skip_it_count']
        name = sale_lookup.get(sid, {}).get('title', 'Unknown')[:40]
        entry = (name, h, total)
        if h >= 0.75:
            hot.append(entry)
        elif h >= 0.55:
            warm.append(entry)
        elif h >= 0.35:
            neutral.append(entry)
        else:
            skip.append(entry)

    print(f'    Score distribution:')
    print(f'      Hot (red pins):     {len(hot)} sales')
    print(f'      Warm (amber pins):  {len(warm)} sales')
    print(f'      Neutral (gray):     {len(neutral)} sales')
    print(f'      Skip (cool gray):   {len(skip)} sales')

    if hot:
        top = sorted(hot, key=lambda x: -x[2])[:3]
        print(f'    Top hot sales:')
        for name, h, total in top:
            print(f'      {name} — score {h:.2f}, {total} signals')


def run_simulation(num_waves: int, pause_secs: int):
    """Run the wave-based simulation."""
    print('\nFetching active Colorado sales...')
    sales = fetch_active_colorado_sales()
    if not sales:
        print('No active sales found. Run the scraper first.')
        return

    print(f'Found {len(sales)} active sales in Colorado\n')

    sales = assign_personalities(sales)
    device_pool = generate_device_ids(3000)

    # Print personality breakdown
    from collections import Counter
    personality_counts = Counter(s['personality'] for s in sales)
    print('  Sale personalities:')
    for p, c in sorted(personality_counts.items()):
        print(f'    {p}: {c} sales')
    print()

    total_signals = 0
    total_reviews = 0

    for wave in range(1, num_waves + 1):
        print(f'  Wave {wave}/{num_waves}')

        # Generate and insert signals
        signals = generate_wave_signals(sales, device_pool, wave)
        upsert_signals(signals)
        total_signals += len(signals)
        print(f'    Inserted {len(signals)} signals (total: {total_signals})')

        # Add reviews starting at wave 4
        if wave >= 4:
            reviews = generate_wave_reviews(sales, device_pool)
            upsert_reviews(reviews)
            total_reviews += len(reviews)
            print(f'    Inserted {len(reviews)} reviews (total: {total_reviews})')

        # Recalculate scores
        print(f'    Recalculating scores...', end=' ')
        recalculate_scores()
        if wave >= 4:
            recalculate_review_aggregates()
        print('done')

        # Summary
        print_score_summary(sales)

        if wave < num_waves:
            print(f'\n    >>> Refresh the app now! Next wave in {pause_secs}s <<<\n')
            time.sleep(pause_secs)

    print(f'\n{"="*50}')
    print(f'  Simulation complete')
    print(f'  Total signals: {total_signals}')
    print(f'  Total reviews: {total_reviews}')
    print(f'  Sales with scores: {len(set(s["sale_id"] for s in []))}')
    print(f'\n  Run --cleanup when done testing.')
    print(f'{"="*50}\n')


# ─── Cleanup ────────────────────────────────────────────────────────

def run_cleanup():
    """Delete all data from community tables."""
    print('\nCleaning up test data...')
    tables = ['review_aggregates', 'reviews', 'sale_scores', 'signals']
    for table in tables:
        try:
            # Delete all rows — use a filter that matches everything
            supabase.table(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f'  Cleared {table}')
        except Exception as e:
            # Some tables use sale_id as PK, not id
            try:
                supabase.table(table).delete().neq('sale_id', '00000000-0000-0000-0000-000000000000').execute()
                print(f'  Cleared {table}')
            except Exception as e2:
                print(f'  Error clearing {table}: {e2}')
    print('Done.\n')


# ─── Main ───────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Community features load test')
    parser.add_argument('--setup', action='store_true', help='Show migration instructions')
    parser.add_argument('--run', action='store_true', help='Run wave simulation')
    parser.add_argument('--cleanup', action='store_true', help='Delete all test data')
    parser.add_argument('--waves', type=int, default=8, help='Number of waves (default: 8)')
    parser.add_argument('--pause', type=int, default=15, help='Seconds between waves (default: 15)')
    args = parser.parse_args()

    if args.setup:
        run_setup_instructions()
    elif args.run:
        run_simulation(args.waves, args.pause)
    elif args.cleanup:
        run_cleanup()
    else:
        parser.print_help()
