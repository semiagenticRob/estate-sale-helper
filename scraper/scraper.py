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


CDN_IMAGE_RE = re.compile(r'https?://picturescdn\.estatesales\.net/[^\s"<>]+\.jpg')


def extract_page_images(raw_html: str, sale_id: str) -> list[str]:
    """Extract unique sale-item image URLs from the raw HTML via regex."""
    seen = set()
    urls = []
    # Only include images under the sale's ID path, skip org logos and other assets
    prefix = f'picturescdn.estatesales.net/{sale_id}/'
    for match in CDN_IMAGE_RE.findall(raw_html):
        if prefix in match and match not in seen:
            seen.add(match)
            urls.append(match)
    return urls


def extract_sale_hours(soup: BeautifulSoup) -> Optional[str]:
    """Extract daily schedule/hours from the sale page.

    The schedule is displayed as day cards like:
      Thu Mar 19 10am to 3pm
      Fri Mar 20 10am to 3pm
    We combine these into a single string separated by newlines.
    """
    lines = []
    # Look for time patterns in the page text near date patterns
    text = soup.get_text(separator='\n')
    # Match patterns like "Thu\nMar 19\n10am to 3pm" or "Thursday, Mar 19: 9:00 AM - 3:00 PM"
    for match in re.finditer(
        r'((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*)[,\s]*'
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s*'
        r'(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))',
        text
    ):
        day, date, times = match.group(1), match.group(2), match.group(3)
        lines.append(f'{day} {date}: {times.strip()}')
    return '\n'.join(lines) if lines else None


def extract_terms(soup: BeautifulSoup) -> Optional[str]:
    """Extract Terms & Conditions text from the page HTML.

    The terms live inside a Material expansion panel whose header contains
    the text 'Terms' (e.g. 'Terms & Conditions'). We grab all the text
    from the panel body.
    """
    # Look for any element whose text contains 'Terms' that acts as a panel header
    for header in soup.find_all(string=re.compile(r'Terms\s*[&and]*\s*Conditions', re.I)):
        # Walk up to the expansion panel container
        panel = header.find_parent('mat-expansion-panel') or header.find_parent('div')
        if panel:
            text = panel.get_text(separator=' ', strip=True)
            # Remove the header text itself and clean up
            text = re.sub(r'Terms\s*[&and]*\s*Conditions\s*', '', text, count=1, flags=re.I).strip()
            if text:
                return text
    return None


def scrape_sale(url: str) -> Optional[dict]:
    """Fetch a sale detail page and return parsed data, or None on failure."""
    try:
        with httpx.Client(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                print(f'  HTTP {response.status_code} for {url}')
                return None
            raw_html = response.text
            soup = BeautifulSoup(raw_html, 'lxml')
    except Exception as e:
        print(f'  Error fetching {url}: {e}')
        return None

    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
            if data.get('@type') != 'SaleEvent':
                continue
            sale = parse_jsonld(data, url)
            # Extract Terms & Conditions and sale hours from page HTML
            sale['terms'] = extract_terms(soup)
            sale['sale_hours'] = extract_sale_hours(soup)
            # Supplement JSON-LD images (usually 5) with all CDN images from raw HTML
            jsonld_images = set(sale['images'])
            for img_url in extract_page_images(raw_html, sale['external_id']):
                if img_url not in jsonld_images:
                    sale['images'].append(img_url)
                    jsonld_images.add(img_url)
            return sale
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
            'p_terms': sale.get('terms'),
            'p_sale_hours': sale.get('sale_hours'),
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
