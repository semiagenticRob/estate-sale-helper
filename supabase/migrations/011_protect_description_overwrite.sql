-- Migration 011: Protect description/terms from empty overwrites
-- Fixes bug where scraper wipes existing description/terms with empty values
-- Also adds missing api_hash and detail_scraped_at columns for change detection

-- ============================================================
-- 1. Add missing columns for scraper change detection
--    These are referenced by scraper.py but never had a migration.
-- ============================================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS api_hash TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS detail_scraped_at TIMESTAMPTZ;

-- ============================================================
-- 2. Allow NULL descriptions and terms
--    Descriptions come from HTML scraping and aren't always available.
--    The app already handles NULLs gracefully.
-- ============================================================
ALTER TABLE sales ALTER COLUMN description DROP NOT NULL;

-- ============================================================
-- 3. Clean up existing damage: convert empty strings to NULL
--    so needs_detail_scrape() will trigger re-scrapes.
-- ============================================================
UPDATE sales SET description = NULL WHERE description = '';
UPDATE sales SET terms = NULL WHERE terms = '';

-- ============================================================
-- 4. Replace upsert_sale with CASE guards on description/terms
--    Only overwrite when incoming value is non-empty.
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_sale(
  p_external_id  TEXT,
  p_title        TEXT,
  p_company_name TEXT,
  p_address      TEXT,
  p_city         TEXT,
  p_state        TEXT,
  p_zip_code     TEXT,
  p_latitude     DOUBLE PRECISION,
  p_longitude    DOUBLE PRECISION,
  p_start_date   DATE,
  p_end_date     DATE,
  p_description  TEXT,
  p_url          TEXT,
  p_terms        TEXT DEFAULT NULL,
  p_sale_hours   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO sales (
    external_id, title, company_name, address, city, state, zip_code,
    location, start_date, end_date, description, url, terms, sale_hours
  )
  VALUES (
    p_external_id, p_title, p_company_name, p_address,
    p_city, p_state, p_zip_code,
    CASE
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ELSE NULL
    END,
    p_start_date, p_end_date, p_description, p_url, p_terms, p_sale_hours
  )
  ON CONFLICT (external_id) DO UPDATE SET
    title        = EXCLUDED.title,
    company_name = EXCLUDED.company_name,
    address      = EXCLUDED.address,
    city         = EXCLUDED.city,
    state        = EXCLUDED.state,
    zip_code     = EXCLUDED.zip_code,
    location     = EXCLUDED.location,
    start_date   = EXCLUDED.start_date,
    end_date     = EXCLUDED.end_date,
    description  = CASE
                     WHEN EXCLUDED.description IS NOT NULL AND EXCLUDED.description <> ''
                     THEN EXCLUDED.description
                     ELSE sales.description
                   END,
    url          = EXCLUDED.url,
    terms        = CASE
                     WHEN EXCLUDED.terms IS NOT NULL AND EXCLUDED.terms <> ''
                     THEN EXCLUDED.terms
                     ELSE sales.terms
                   END,
    sale_hours   = EXCLUDED.sale_hours
  RETURNING id;
$$;
