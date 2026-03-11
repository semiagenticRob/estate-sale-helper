#!/usr/bin/env python3
"""
Estate Helper Scraper
Fetches estate sales from estatesales.net for TN and CO and upserts to Supabase.

Usage:
  python scraper.py
"""

import json
import os
import re
import time
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_URL = 'https://www.estatesales.net'
DELAY = 1.5  # seconds between requests — be respectful

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
NOMINATIM_HEADERS = {
    'User-Agent': 'EstateHelper/1.0 (github.com/semiagenticRob/estate-sale-helper)',
    'Accept-Language': 'en-US,en;q=0.9',
}

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/122.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# Cities to scrape per state — expand as needed
CITIES = {
    'TN': [
        'Nashville', 'Memphis', 'Knoxville', 'Chattanooga',
        'Murfreesboro', 'Franklin', 'Hendersonville', 'Brentwood',
        'Clarksville', 'Jackson',
    ],
    'CO': [
        'Denver', 'Colorado-Springs', 'Boulder', 'Fort-Collins',
        'Aurora', 'Lakewood', 'Arvada', 'Westminster', 'Pueblo', 'Longmont',
    ],
}


def fetch(url: str) -> Optional[BeautifulSoup]:
    """Fetch a URL and return a BeautifulSoup object, or None on failure."""
    try:
        with httpx.Client(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code == 200:
                return BeautifulSoup(response.text, 'lxml')
            print(f'  HTTP {response.status_code} for {url}')
            return None
    except Exception as e:
        print(f'  Error fetching {url}: {e}')
        return None


def get_sale_urls(state: str, city: str) -> list[str]:
    """Return sale detail URLs extracted from a city listing page's JSON-LD."""
    soup = fetch(f'{BASE_URL}/{state}/{city}')
    if not soup:
        return []

    urls = []
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
            if data.get('@type') == 'SaleEvent' and data.get('url'):
                urls.append(data['url'])
        except (json.JSONDecodeError, AttributeError):
            continue

    return urls


def geocode(address: str, city: str, state: str, zip_code: str) -> tuple[Optional[float], Optional[float]]:
    """Geocode a street address via Nominatim (OpenStreetMap). Returns (lat, lng) or (None, None)."""
    query = ', '.join(filter(None, [address, city, state, zip_code]))
    try:
        with httpx.Client(headers=NOMINATIM_HEADERS, timeout=10) as client:
            resp = client.get(NOMINATIM_URL, params={'q': query, 'format': 'json', 'limit': 1})
            results = resp.json()
            if results:
                return float(results[0]['lat']), float(results[0]['lon'])
    except Exception as e:
        print(f'    Geocode error: {e}')
    return None, None


def scrape_sale(url: str) -> Optional[dict]:
    """Fetch a sale detail page and return parsed data, or None on failure."""
    soup = fetch(url)
    if not soup:
        return None

    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
            if data.get('@type') != 'SaleEvent':
                continue
            return parse_jsonld(data, url)
        except (json.JSONDecodeError, AttributeError):
            continue

    return None


def parse_jsonld(data: dict, url: str) -> dict:
    """Parse a SaleEvent JSON-LD block into our database schema."""
    location = data.get('location', {})
    address = location.get('address', {})
    geo = location.get('geo', {})

    images = data.get('image', [])
    if isinstance(images, str):
        images = [images]

    street   = address.get('streetAddress')
    city     = address.get('addressLocality')
    state    = address.get('addressRegion')
    zip_code = address.get('postalCode')

    # Coordinates: check JSON-LD geo sub-object first, then fall back to geocoding
    lat = geo.get('latitude') or location.get('latitude')
    lng = geo.get('longitude') or location.get('longitude')
    if (not lat or not lng) and street and city and state:
        lat, lng = geocode(street, city, state, zip_code or '')

    # Truncate ISO timestamps to date-only (YYYY-MM-DD)
    start_date = (data.get('startDate') or '')[:10] or None
    end_date   = (data.get('endDate') or '')[:10] or None

    return {
        'external_id': url.rstrip('/').split('/')[-1],
        'title':        (data.get('name') or '').strip(),
        'company_name': (data.get('organizer') or {}).get('name'),
        'address':  street,
        'city':     city,
        'state':    state,
        'zip_code': zip_code,
        'latitude':  float(lat) if lat else None,
        'longitude': float(lng) if lng else None,
        'start_date': start_date,
        'end_date':   end_date,
        'description': (data.get('description') or '').strip(),
        'url': url,
        'images': [img for img in images if isinstance(img, str)],
    }


def upsert_sale(sale: dict) -> Optional[str]:
    """Upsert a sale to Supabase via RPC. Returns the sale UUID or None."""
    try:
        result = supabase.rpc('upsert_sale', {
            'p_external_id': sale['external_id'],
            'p_title': sale['title'],
            'p_company_name': sale.get('company_name'),
            'p_address': sale.get('address'),
            'p_city': sale.get('city'),
            'p_state': sale.get('state'),
            'p_zip_code': sale.get('zip_code'),
            'p_latitude': sale['latitude'],
            'p_longitude': sale['longitude'],
            'p_start_date': sale.get('start_date'),
            'p_end_date': sale.get('end_date'),
            'p_description': sale.get('description', ''),
            'p_url': sale['url'],
        }).execute()
        return result.data
    except Exception as e:
        print(f'    DB error: {e}')
        return None


def upsert_images(sale_id: str, image_urls: list[str]):
    """Replace images for a sale (delete old, insert new)."""
    if not image_urls or not sale_id:
        return
    try:
        supabase.table('sale_images').delete().eq('sale_id', sale_id).execute()
        supabase.table('sale_images').insert([
            {'sale_id': sale_id, 'image_url': url, 'position': i}
            for i, url in enumerate(image_urls[:10])  # cap at 10 images per sale
        ]).execute()
    except Exception as e:
        print(f'    Image error: {e}')


def run():
    total = 0
    seen_ids: set[str] = set()  # avoid re-scraping the same sale across city pages

    for state, cities in CITIES.items():
        print(f'\n{"="*40}')
        print(f'  {state}')
        print(f'{"="*40}')

        for city in cities:
            print(f'\n  [{city}] Fetching listing...')
            urls = get_sale_urls(state, city)
            print(f'  [{city}] Found {len(urls)} sales')
            time.sleep(DELAY)

            for url in urls:
                sale_external_id = url.rstrip('/').split('/')[-1]
                if sale_external_id in seen_ids:
                    continue
                seen_ids.add(sale_external_id)

                sale = scrape_sale(url)
                time.sleep(DELAY)

                if not sale:
                    print(f'    Failed to parse: {url}')
                    continue

                db_id = upsert_sale(sale)
                if db_id:
                    upsert_images(db_id, sale['images'])
                    print(f'    ✓ {sale["title"]}')
                    total += 1

    print(f'\n{"="*40}')
    print(f'  Done. {total} sales upserted.')
    print(f'{"="*40}\n')


if __name__ == '__main__':
    run()
