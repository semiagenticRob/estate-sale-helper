# Estate Sale Helper Scraper

Scrapes estate sales from estatesales.net (TN + CO) and upserts to Supabase.

## Setup

```bash
cd scraper
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your Supabase credentials
```

## Run

```bash
cd scraper
./venv/bin/python scraper.py
```

Run manually before weekends (Thu or Fri) to catch new listings.

## Output

Prints progress per city and a final count:
```
Done. 115 sales upserted.
```
