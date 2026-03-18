#!/usr/bin/env python3
"""
Estate Helper Scraper — API-first rewrite

Discovers estate sales via the estatesales.net internal API using a geographic
grid of ~40 anchor points, then scrapes each detail page for description,
terms, and full image list.

No city lists. No geocoding. No pagination gaps.

Usage:
  python scraper.py                        # full national run
  python scraper.py --point 39.74,-104.99  # single grid point (debug/backfill)
"""

import argparse
import hashlib
import json
import os
import re
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_URL   = 'https://www.estatesales.net'
API_URL    = f'{BASE_URL}/api/sale-details'
DELAY      = 1.5   # seconds between requests — be respectful
BATCH_SIZE = 50    # IDs per byids call
RADIUS          = 250   # miles per grid tile
RESCRAPE_DAYS   = 7     # force re-scrape HTML even if hash unchanged after this many days

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/122.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

API_HEADERS = {
    **HEADERS,
    'Accept': 'application/json, text/plain, */*',
}

# ~40 anchor points with 250-mile radius = complete overlapping coverage of
# all 50 US states. Duplicates are eliminated globally by seen_ids.
GRID_POINTS: list[tuple[float, float]] = [
    # Pacific Coast
    (47.61, -122.33),   # Seattle
    (45.51, -122.68),   # Portland
    (37.77, -122.42),   # San Francisco
    (34.05, -118.24),   # Los Angeles
    (32.72, -117.16),   # San Diego
    # Mountain / Southwest
    (36.17, -115.14),   # Las Vegas
    (33.45, -112.07),   # Phoenix
    (35.08, -106.65),   # Albuquerque
    (39.74, -104.99),   # Denver
    (40.76, -111.89),   # Salt Lake City
    (43.62, -116.20),   # Boise
    (45.78, -108.50),   # Billings
    # Central
    (44.98,  -93.27),   # Minneapolis
    (46.88,  -96.79),   # Fargo
    (41.26,  -95.93),   # Omaha
    (39.10,  -94.58),   # Kansas City
    (35.47,  -97.52),   # Oklahoma City
    (32.78,  -96.80),   # Dallas
    (29.76,  -95.37),   # Houston
    # Midwest
    (41.88,  -87.63),   # Chicago
    (42.33,  -83.05),   # Detroit
    (39.77,  -86.16),   # Indianapolis
    (38.63,  -90.20),   # St. Louis
    (39.96,  -82.99),   # Columbus
    (39.10,  -84.51),   # Cincinnati
    # Southeast
    (36.16,  -86.78),   # Nashville
    (35.15,  -90.05),   # Memphis
    (35.23,  -80.84),   # Charlotte
    (33.75,  -84.39),   # Atlanta
    (30.33,  -81.66),   # Jacksonville
    (29.95,  -90.07),   # New Orleans
    (27.95,  -82.46),   # Tampa
    (25.76,  -80.19),   # Miami
    # Northeast
    (38.91,  -77.04),   # Washington DC
    (39.95,  -75.17),   # Philadelphia
    (40.71,  -74.01),   # New York
    (42.36,  -71.06),   # Boston
    (40.44,  -79.99),   # Pittsburgh
    (43.05,  -76.15),   # Syracuse
    # Alaska & Hawaii
    (61.22, -149.90),   # Anchorage
    (64.84, -147.72),   # Fairbanks
    (21.31, -157.86),   # Honolulu
]

# Single point covers all of Colorado (250-mile radius from Denver reaches
# every corner of the state). Swap run()'s default to GRID_POINTS for
# a full national run.
COLORADO_POINTS: list[tuple[float, float]] = [
    (39.74, -104.99),   # Denver — covers all of CO
]


# ─── API: Discovery ──────────────────────────────────────────────────────────

def get_sale_ids(lat: float, lng: float, radius: int = RADIUS) -> list[int]:
    """Return all sale IDs within `radius` miles of (lat, lng).

    Uses bycoordinatesanddistance bypass — returns the complete result set in
    one call, no pagination needed.
    """
    # Build URL manually to avoid encoding the colon in the bypass value
    url = (
        f'{API_URL}?bypass=bycoordinatesanddistance:{lat}_{lng}_{radius}'
        f'&select=id'
        f'&explicitTypes=DateTime'
    )
    try:
        with httpx.Client(headers=API_HEADERS, timeout=30, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return [item['id'] for item in data if 'id' in item]
            print(f'  HTTP {resp.status_code} from discovery API at ({lat}, {lng})')
    except Exception as e:
        print(f'  Discovery error at ({lat}, {lng}): {e}')
    return []


def get_sale_details_batch(ids: list[int]) -> list[dict]:
    """Fetch rich metadata for a list of sale IDs via the byids API.

    Processes in BATCH_SIZE chunks. Returns flat list of API response objects.
    """
    select_fields = (
        'id,orgName,address,latitude,longitude,cityName,name,type,'
        'utcShowAddressAfter,mainPicture,dates,utcDateFirstPublished,'
        'postalCodeNumber,stateCode,firstLocalStartDate,lastLocalEndDate,'
        'orgWebsite,orgLogoUrl,orgPackageType,orgId,isMarketplaceSale'
    )
    results = []
    for i in range(0, len(ids), BATCH_SIZE):
        batch = ids[i:i + BATCH_SIZE]
        ids_str = ','.join(str(x) for x in batch)
        url = (
            f'{API_URL}?bypass=byids:{ids_str}'
            f'&include=mainpicture,dates'
            f'&select={select_fields}'
            f'&explicitTypes=DateTime'
        )
        try:
            with httpx.Client(headers=API_HEADERS, timeout=30, follow_redirects=True) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    results.extend(resp.json())
                else:
                    print(f'  HTTP {resp.status_code} from byids API (batch starting at index {i})')
        except Exception as e:
            print(f'  byids error: {e}')
        time.sleep(DELAY)
    return results


# ─── Parsing ─────────────────────────────────────────────────────────────────

def _dt_value(field: Optional[dict]) -> str:
    """Extract the ISO string from {"_type": "DateTime", "_value": "..."}."""
    if isinstance(field, dict):
        return field.get('_value', '')
    return ''


def derive_sale_hours(dates: list[dict]) -> Optional[str]:
    """Build a human-readable schedule string from the API dates[] array.

    Each entry has localStartDate and localEndDate. Output format:
      Thu Mar 19: 10am to 3pm
      Fri Mar 20: 9am to 2pm
    """
    lines = []
    for d in dates:
        start_str = _dt_value(d.get('localStartDate'))
        end_str   = _dt_value(d.get('localEndDate'))
        if not start_str:
            continue
        try:
            # The API labels these as "Z" but they are already local times
            dt_start = datetime.fromisoformat(start_str.replace('Z', ''))
            dt_end   = datetime.fromisoformat(end_str.replace('Z', '')) if end_str else None

            def fmt_time(dt: datetime) -> str:
                h    = dt.hour % 12 or 12
                ampm = 'am' if dt.hour < 12 else 'pm'
                mins = f':{dt.minute:02d}' if dt.minute else ''
                return f'{h}{mins}{ampm}'

            day_str  = dt_start.strftime('%a %b ') + str(dt_start.day)
            time_str = fmt_time(dt_start)
            if dt_end:
                time_str += f' to {fmt_time(dt_end)}'
            lines.append(f'{day_str}: {time_str}')
        except (ValueError, AttributeError):
            continue
    return '\n'.join(lines) if lines else None


def parse_api_sale(data: dict) -> dict:
    """Map an API byids response object to our internal sale schema."""
    sale_id   = data['id']
    state     = data.get('stateCode', '')
    city_name = data.get('cityName', '')
    postal    = data.get('postalCodeNumber', '')
    city_slug = city_name.replace(' ', '-')
    url       = f'{BASE_URL}/{state}/{city_slug}/{postal}/{sale_id}'

    start_date = _dt_value(data.get('firstLocalStartDate'))[:10] or None
    end_date   = _dt_value(data.get('lastLocalEndDate'))[:10] or None

    main_picture      = data.get('mainPicture') or {}
    header_image_url  = main_picture.get('url')

    address = data.get('address') or None
    if address == '':
        address = None  # hidden until utcShowAddressAfter; updated on next run

    return {
        'external_id':  str(sale_id),
        'title':        (data.get('name') or '').strip(),
        'company_name': data.get('orgName') or None,
        'address':      address,
        'city':         city_name or None,
        'state':        state or None,
        'zip_code':     postal or None,
        'latitude':     data.get('latitude'),
        'longitude':    data.get('longitude'),
        'start_date':   start_date,
        'end_date':     end_date,
        'url':          url,
        'sale_hours':   derive_sale_hours(data.get('dates') or []),
        'description':  None,   # filled by scrape_detail()
        'terms':        None,   # filled by scrape_detail()
        'images':       [header_image_url] if header_image_url else [],
    }


# ─── HTML Detail Scrape (description, terms, all images) ─────────────────────

CDN_IMAGE_RE = re.compile(r'https?://picturescdn\.estatesales\.net/[^\s"<>]+\.jpg')

UI_ARTIFACTS_RE = re.compile(
    r'(?:View\s*More|View\s*Less|'
    r'arrow_drop_down(?:_filled)?_ms|arrow_drop_up(?:_filled)?_ms|'
    r'verified_user_outlined|article_ms|'
    r'expand_more|expand_less)',
    re.I,
)


def scrape_detail(url: str, external_id: str) -> dict:
    """Fetch a sale detail page and return description, terms, and all images.

    This is the only HTML scraping that remains — everything else comes from
    the API. Returns an empty dict on failure (caller uses API data as fallback).
    """
    try:
        with httpx.Client(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                print(f'    HTTP {resp.status_code} for {url}')
                return {}
            raw_html = resp.text
            soup = BeautifulSoup(raw_html, 'lxml')
    except Exception as e:
        print(f'    Error fetching {url}: {e}')
        return {}

    return {
        'description': _extract_description(soup),
        'terms':       _extract_terms(soup),
        'images':      extract_page_images(raw_html, external_id),
    }


def _extract_description(soup: BeautifulSoup) -> Optional[str]:
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
            if data.get('@type') == 'SaleEvent':
                desc = (data.get('description') or '').strip()
                return desc or None
        except (json.JSONDecodeError, AttributeError):
            continue
    return None


def _extract_terms(soup: BeautifulSoup) -> Optional[str]:
    # Strategy 1: NGRX state JSON blob (full, un-truncated text)
    for script in soup.find_all('script'):
        if script.get('src'):
            continue
        content = script.string or ''
        if '"NGRX_STATE"' not in content:
            continue
        try:
            state    = json.loads(content)
            sale_view = state.get('NGRX_STATE', {}).get('feature.traditionalSaleViewState', {})
            for sale_data in sale_view.get('entitiesById', {}).values():
                terms = sale_data.get('terms')
                if terms and isinstance(terms, str):
                    return _clean_terms(terms)
        except (json.JSONDecodeError, AttributeError, TypeError):
            continue

    # Strategy 2: DOM scrape fallback (may be truncated)
    for header in soup.find_all(string=re.compile(r'Terms\s*[&and]*\s*Conditions', re.I)):
        panel = header.find_parent('mat-expansion-panel') or header.find_parent('div')
        if panel:
            text = panel.get_text(separator=' ', strip=True)
            text = re.sub(r'Terms\s*[&and]*\s*Conditions\s*', '', text, count=1, flags=re.I).strip()
            if text:
                return _clean_terms(text)
    return None


def _clean_terms(text: str) -> str:
    text = UI_ARTIFACTS_RE.sub('', text)
    text = re.sub(r'[^\S\n]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_page_images(raw_html: str, external_id: str) -> list[str]:
    """Extract all CDN image URLs for this sale from raw HTML."""
    seen = set()
    urls = []
    prefix = f'picturescdn.estatesales.net/{external_id}/'
    for match in CDN_IMAGE_RE.findall(raw_html):
        if prefix in match and match not in seen:
            seen.add(match)
            urls.append(match)
    return urls


# ─── Database ────────────────────────────────────────────────────────────────

def upsert_sale(sale: dict) -> Optional[str]:
    try:
        result = supabase.rpc('upsert_sale', {
            'p_external_id':  sale['external_id'],
            'p_title':        sale['title'],
            'p_company_name': sale.get('company_name'),
            'p_address':      sale.get('address'),
            'p_city':         sale.get('city'),
            'p_state':        sale.get('state'),
            'p_zip_code':     sale.get('zip_code'),
            'p_latitude':     sale['latitude'],
            'p_longitude':    sale['longitude'],
            'p_start_date':   sale.get('start_date'),
            'p_end_date':     sale.get('end_date'),
            'p_description':  sale.get('description') or '',
            'p_url':          sale['url'],
            'p_terms':        sale.get('terms'),
            'p_sale_hours':   sale.get('sale_hours'),
        }).execute()
        return result.data
    except Exception as e:
        print(f'    DB error: {e}')
        return None


def upsert_images(sale_id: str, image_urls: list[str]):
    if not image_urls or not sale_id:
        return
    try:
        supabase.table('sale_images').delete().eq('sale_id', sale_id).execute()
        supabase.table('sale_images').insert([
            {'sale_id': sale_id, 'image_url': url, 'position': i}
            for i, url in enumerate(image_urls)
        ]).execute()
    except Exception as e:
        print(f'    Image error: {e}')


def compute_api_hash(data: dict) -> str:
    """Hash the API fields most likely to signal a content change.

    A changed hash means: title, schedule, cover image, or company updated —
    any of which warrants re-scraping the HTML detail page.
    """
    fields = {
        'title':       data.get('name'),
        'dates':       data.get('dates'),
        'mainPicture': data.get('mainPicture'),
        'company':     data.get('orgName'),
    }
    return hashlib.md5(json.dumps(fields, sort_keys=True).encode()).hexdigest()


def get_existing_sale(external_id: str) -> Optional[dict]:
    """Return stored api_hash and detail_scraped_at for a sale, or None if not found."""
    try:
        result = (
            supabase.table('sales')
            .select('id,api_hash,detail_scraped_at')
            .eq('external_id', external_id)
            .maybe_single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def update_hash_fields(db_id: str, api_hash: str):
    """Write api_hash and detail_scraped_at after a successful detail scrape."""
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        supabase.table('sales').update({
            'api_hash':          api_hash,
            'detail_scraped_at': now_iso,
        }).eq('id', db_id).execute()
    except Exception as e:
        print(f'    Hash update error: {e}')


def needs_detail_scrape(existing: Optional[dict], current_hash: str) -> bool:
    """Return True if the HTML detail page should be (re-)scraped."""
    if existing is None:
        return True  # new sale

    if existing.get('api_hash') != current_hash:
        return True  # something in the API data changed

    scraped_at_str = existing.get('detail_scraped_at')
    if not scraped_at_str:
        return True  # never scraped

    scraped_at = datetime.fromisoformat(scraped_at_str.replace('Z', '+00:00'))
    age = datetime.now(timezone.utc) - scraped_at
    return age > timedelta(days=RESCRAPE_DAYS)


# ─── Runner ──────────────────────────────────────────────────────────────────

def run(grid_points: list[tuple[float, float]] = COLORADO_POINTS):
    seen_ids:        set[str] = set()
    total_discovered = 0
    total_upserted   = 0
    total_rescraped  = 0
    total_skipped    = 0

    for lat, lng in grid_points:
        print(f'\n  Discovering near ({lat}, {lng})...')
        ids     = get_sale_ids(lat, lng)
        new_ids = [i for i in ids if str(i) not in seen_ids]
        seen_ids.update(str(i) for i in ids)

        print(f'  API returned {len(ids)} · {len(new_ids)} new after dedup')
        total_discovered += len(new_ids)
        time.sleep(DELAY)

        if not new_ids:
            continue

        # Step 2: batch-fetch rich metadata for all new IDs
        api_records = get_sale_details_batch(new_ids)
        api_by_id   = {str(r['id']): r for r in api_records}

        # Step 3: change detection + conditional detail scrape + upsert
        for ext_id in (str(i) for i in new_ids):
            api_data = api_by_id.get(ext_id)
            if not api_data:
                print(f'    No API data for id {ext_id}, skipping')
                continue

            # Skip online-only auctions — no physical location to visit.
            # type is a numeric bitmask; isMarketplaceSale is the reliable flag.
            if api_data.get('isMarketplaceSale'):
                print(f'    — Skipping online-only sale {ext_id}')
                continue

            sale         = parse_api_sale(api_data)
            current_hash = compute_api_hash(api_data)
            existing     = get_existing_sale(ext_id)
            do_scrape    = needs_detail_scrape(existing, current_hash)

            if do_scrape:
                detail = scrape_detail(sale['url'], ext_id)
                time.sleep(DELAY)

                if detail.get('description'):
                    sale['description'] = detail['description']
                if detail.get('terms'):
                    sale['terms'] = detail['terms']
                if detail.get('images'):
                    sale['images'] = detail['images']
            else:
                total_skipped += 1

            if not sale.get('latitude') or not sale.get('longitude'):
                print(f'    Skipping {ext_id} — no coordinates')
                continue

            db_id = upsert_sale(sale)
            if db_id:
                if do_scrape:
                    upsert_images(db_id, sale['images'])
                    update_hash_fields(db_id, current_hash)
                    total_rescraped += 1
                state = sale.get('state', '??')
                city  = sale.get('city', '')
                tag   = '✓' if do_scrape else '↩'
                print(f'    {tag} [{state}] {city} — {sale["title"]}')
                total_upserted += 1

    # Summary + capture rate monitoring
    print(f'\n{"="*50}')
    print(f'  Sales discovered:      {total_discovered}')
    print(f'  Successfully upserted: {total_upserted}')
    print(f'  Detail pages scraped:  {total_rescraped}')
    print(f'  Detail scrapes skipped (unchanged): {total_skipped}')
    if total_discovered > 0:
        rate = (total_upserted / total_discovered) * 100
        print(f'  Capture rate:          {rate:.1f}%')
        if rate < 95:
            print(f'  WARNING: capture rate below 95% — review logs above')
    print(f'{"="*50}\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Estate Helper scraper')
    parser.add_argument(
        '--point',
        metavar='LAT,LNG',
        help='Scrape a single grid point, e.g. --point 39.74,-104.99',
    )
    args = parser.parse_args()

    if args.point:
        try:
            lat, lng = map(float, args.point.split(','))
            run([(lat, lng)])
        except ValueError:
            print('Error: use --point LAT,LNG, e.g. --point 39.74,-104.99')
    else:
        run()
